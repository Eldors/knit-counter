import { useNavigate } from '@solidjs/router';
import { createSignal, For } from 'solid-js';
import Header from '../components/Header';
import { createProject } from '../db';

interface PartDraft {
  key: number;
  name: string;
  targetRows: string;
}

let nextKey = 0;
function makeDraft(name = '', targetRows = ''): PartDraft {
  return { key: nextKey++, name, targetRows };
}

export default function NewProject() {
  const navigate = useNavigate();
  const [name, setName] = createSignal('');
  const [parts, setParts] = createSignal<PartDraft[]>([makeDraft()]);
  const [saving, setSaving] = createSignal(false);

  const addPart = () => setParts([...parts(), makeDraft()]);

  const removePart = (key: number) => {
    const list = parts().filter((p) => p.key !== key);
    setParts(list.length ? list : [makeDraft()]);
  };

  const updatePart = (key: number, field: 'name' | 'targetRows', value: string) => {
    setParts(parts().map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  };

  const canSubmit = () => !!name().trim() && parts().some((p) => p.name.trim());

  const handleSubmit = async () => {
    if (!canSubmit() || saving()) return;
    setSaving(true);

    const validParts = parts()
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        targetRows: Math.max(0, parseInt(p.targetRows) || 0),
      }));

    const id = await createProject(name().trim(), validParts);
    navigate(`/project/${id}`);
  };

  return (
    <div class="min-h-screen flex flex-col">
      <Header title="Новый проект" back="/" />

      <main class="flex-1 px-4 pb-8">
        <div class="mt-2">
          <label class="block text-sm font-medium text-warm-text-secondary mb-1">
            Название проекта
          </label>
          <input
            type="text"
            class="w-full px-4 py-3 rounded-xl bg-warm-surface border border-warm-progress-bg focus:border-warm-primary focus:outline-none transition-colors"
            placeholder="Шарф, свитер..."
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            autofocus
          />
        </div>

        <div class="mt-6">
          <label class="block text-sm font-medium text-warm-text-secondary mb-2">Детали</label>

          <div class="flex flex-col gap-3">
            <For each={parts()}>
              {(part) => (
                <div class="flex gap-2 items-start">
                  <div class="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      class="w-full px-3 py-2.5 rounded-xl bg-warm-surface border border-warm-progress-bg focus:border-warm-primary focus:outline-none text-sm transition-colors"
                      placeholder="Название (спинка, рукав...)"
                      value={part.name}
                      onInput={(e) => updatePart(part.key, 'name', e.currentTarget.value)}
                    />
                    <input
                      type="number"
                      inputmode="numeric"
                      class="w-full px-3 py-2.5 rounded-xl bg-warm-surface border border-warm-progress-bg focus:border-warm-primary focus:outline-none text-sm transition-colors"
                      placeholder="Цель (рядов), необязательно"
                      value={part.targetRows}
                      onInput={(e) => updatePart(part.key, 'targetRows', e.currentTarget.value)}
                    />
                  </div>
                  <button
                    class="shrink-0 w-9 h-9 mt-0.5 rounded-full flex items-center justify-center text-warm-text-secondary hover:text-warm-danger hover:bg-warm-danger/10 transition-colors"
                    onClick={() => removePart(part.key)}
                    aria-label="Удалить деталь"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>

          <button
            class="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-warm-progress-bg text-warm-text-secondary text-sm hover:border-warm-primary hover:text-warm-primary transition-colors"
            onClick={addPart}
          >
            + Добавить деталь
          </button>
        </div>

        <button
          class="mt-8 w-full py-3.5 rounded-xl text-white font-medium transition-all"
          classList={{
            'bg-warm-primary hover:bg-warm-primary-dark active:scale-[0.98]': canSubmit(),
            'bg-warm-progress-bg text-warm-text-secondary cursor-not-allowed': !canSubmit(),
          }}
          disabled={!canSubmit() || saving()}
          onClick={handleSubmit}
        >
          {saving() ? 'Создаю...' : 'Создать проект'}
        </button>
      </main>
    </div>
  );
}
