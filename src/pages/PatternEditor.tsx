import { useParams, useNavigate } from '@solidjs/router';
import { createSignal, Index, onMount } from 'solid-js';
import Header from '../components/Header';
import { db, getActivePattern, setPattern, removePattern } from '../db';

let nextKey = 0;
function makeRow(text = '') {
  return { key: nextKey++, text };
}

export default function PatternEditor() {
  const params = useParams<{ id: string; partId?: string }>();
  const navigate = useNavigate();

  const isProjectMode = () => !params.partId;
  const entityId = () => (isProjectMode() ? params.id : params.partId!);
  const entityType = (): 'project' | 'part' => (isProjectMode() ? 'project' : 'part');

  const backPath = () =>
    isProjectMode()
      ? `/project/${params.id}/counter`
      : `/project/${params.id}/part/${params.partId}`;

  const [rows, setRows] = createSignal<{ key: number; text: string }[]>([makeRow(), makeRow()]);
  const [hasActive, setHasActive] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [currentRow, setCurrentRow] = createSignal(0);

  onMount(async () => {
    // Загрузить текущее значение счетчика
    if (isProjectMode()) {
      const project = await db.projects.get(params.id);
      if (!project) { navigate('/'); return; }
      setCurrentRow(project.currentRow);
    } else {
      const part = await db.parts.get(params.partId!);
      if (!part) { navigate(`/project/${params.id}`); return; }
      setCurrentRow(part.currentRow);
    }

    // Загрузить активный паттерн
    const active = await getActivePattern(entityId(), entityType());
    if (active) {
      setHasActive(true);
      setRows(active.rows.map((t) => makeRow(t)));
    }
  });

  const updateRow = (key: number, text: string) => {
    setRows(rows().map((r) => (r.key === key ? { ...r, text } : r)));
  };

  const removeRow = (key: number) => {
    setRows(rows().filter((r) => r.key !== key));
  };

  const addRow = () => setRows([...rows(), makeRow()]);

  const canApply = () => rows().some((r) => r.text.trim());

  const handleApply = async () => {
    if (!canApply() || saving()) return;
    setSaving(true);
    const validRows = rows()
      .map((r) => r.text.trim())
      .filter(Boolean);
    await setPattern(entityId(), entityType(), validRows, currentRow());
    navigate(backPath());
  };

  const handleRemove = async () => {
    setSaving(true);
    await removePattern(entityId(), entityType(), currentRow());
    navigate(backPath());
  };

  return (
    <div class="min-h-screen flex flex-col">
      <Header title="Рисунок" back={backPath()} />

      <main class="flex-1 px-4 pb-8">
        <div class="mt-2">
          <label class="block text-sm font-medium text-warm-text-secondary mb-2">
            Ряды рисунка
          </label>

          <div class="flex flex-col gap-3">
            <Index each={rows()}>
              {(row, i) => (
                <div class="flex gap-2 items-center">
                  <span class="shrink-0 w-6 text-right text-sm text-warm-text-secondary">{i + 1}.</span>
                  <input
                    type="text"
                    class="flex-1 px-3 py-2.5 rounded-xl bg-warm-surface border border-warm-progress-bg focus:border-warm-primary focus:outline-none text-sm transition-colors"
                    placeholder="Лицевой ряд, изнаночный..."
                    value={row().text}
                    onInput={(e) => updateRow(row().key, e.currentTarget.value)}
                  />
                  <button
                    class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-warm-text-secondary hover:text-warm-danger hover:bg-warm-danger/10 transition-colors"
                    onClick={() => removeRow(row().key)}
                    aria-label="Удалить ряд"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </Index>
          </div>

          <button
            class="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-warm-progress-bg text-warm-text-secondary text-sm hover:border-warm-primary hover:text-warm-primary transition-colors"
            onClick={addRow}
          >
            + Добавить ряд
          </button>
        </div>

        <button
          class="mt-8 w-full py-3.5 rounded-xl text-white font-medium transition-all"
          classList={{
            'bg-warm-primary hover:bg-warm-primary-dark active:scale-[0.98]': canApply(),
            'bg-warm-progress-bg text-warm-text-secondary cursor-not-allowed': !canApply(),
          }}
          disabled={!canApply() || saving()}
          onClick={handleApply}
        >
          {saving() ? 'Сохраняю...' : 'Применить'}
        </button>

        {hasActive() && (
          <button
            class="mt-3 w-full py-3 rounded-xl border border-warm-danger text-warm-danger font-medium hover:bg-warm-danger/10 transition-colors"
            disabled={saving()}
            onClick={handleRemove}
          >
            Удалить рисунок
          </button>
        )}
      </main>
    </div>
  );
}
