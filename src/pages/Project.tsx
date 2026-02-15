import { useParams, useNavigate } from '@solidjs/router';
import { createSignal, For, Show, onMount } from 'solid-js';
import Header from '../components/Header';
import PartCard from '../components/PartCard';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  db,
  deleteProject,
  addPart,
  deletePart,
  updatePartRow,
  getProjectParts,
  getProjectProgress,
  type Project as ProjectType,
  type Part,
} from '../db';

export default function Project() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = createSignal<ProjectType | null>(null);
  const [parts, setParts] = createSignal<Part[]>([]);
  const [progress, setProgress] = createSignal<{ done: number; total: number } | null>(null);
  const [showDeleteProject, setShowDeleteProject] = createSignal(false);
  const [deletingPartId, setDeletingPartId] = createSignal<string | null>(null);
  const [showAddPart, setShowAddPart] = createSignal(false);
  const [newPartName, setNewPartName] = createSignal('');
  const [newPartTarget, setNewPartTarget] = createSignal('');

  const load = async () => {
    const p = await db.projects.get(params.id);
    if (!p) {
      navigate('/');
      return;
    }
    setProject(p);
    setParts(await getProjectParts(params.id));
    setProgress(await getProjectProgress(params.id));
  };

  onMount(load);

  const handleIncrement = async (partId: string) => {
    const part = parts().find((p) => p.id === partId);
    if (!part) return;
    const newRow = part.currentRow + 1;
    await updatePartRow(partId, newRow);
    setParts(parts().map((p) => (p.id === partId ? { ...p, currentRow: newRow } : p)));
    setProgress(await getProjectProgress(params.id));
  };

  const handleDecrement = async (partId: string) => {
    const part = parts().find((p) => p.id === partId);
    if (!part || part.currentRow <= 0) return;
    const newRow = part.currentRow - 1;
    await updatePartRow(partId, newRow);
    setParts(parts().map((p) => (p.id === partId ? { ...p, currentRow: newRow } : p)));
    setProgress(await getProjectProgress(params.id));
  };

  const handleDeleteProject = async () => {
    await deleteProject(params.id);
    navigate('/');
  };

  const handleDeletePart = async () => {
    const id = deletingPartId();
    if (!id) return;
    await deletePart(id, params.id);
    setDeletingPartId(null);
    await load();
  };

  const handleAddPart = async () => {
    const name = newPartName().trim();
    if (!name) return;
    const target = Math.max(0, parseInt(newPartTarget()) || 0);
    await addPart(params.id, name, target);
    setNewPartName('');
    setNewPartTarget('');
    setShowAddPart(false);
    await load();
  };

  const pct = () => {
    const p = progress();
    if (!p || p.total === 0) return null;
    return Math.round((p.done / p.total) * 100);
  };

  return (
    <div class="min-h-screen flex flex-col">
      <Header
        title={project()?.name ?? '...'}
        back="/"
        right={
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-warm-danger/10 text-warm-text-secondary hover:text-warm-danger transition-colors"
            onClick={() => setShowDeleteProject(true)}
            aria-label="Удалить проект"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        }
      />

      <main class="flex-1 px-4 pb-8">
        <Show when={pct() !== null}>
          <div class="mt-2 mb-4">
            <div class="flex justify-between text-sm text-warm-text-secondary mb-1.5">
              <span>Общий прогресс</span>
              <span>{pct()}%</span>
            </div>
            <div class="h-2 bg-warm-progress-bg rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                classList={{
                  'bg-warm-primary': pct()! < 100,
                  'bg-warm-success': pct()! >= 100,
                }}
                style={{ width: `${Math.min(pct()!, 100)}%` }}
              />
            </div>
          </div>
        </Show>

        <div class="flex flex-col gap-3 mt-2">
          <For each={parts()}>
            {(part) => (
              <div class="relative group">
                <PartCard
                  part={part}
                  projectId={params.id}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
                <button
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warm-danger text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  onClick={() => setDeletingPartId(part.id)}
                  aria-label="Удалить деталь"
                >
                  &times;
                </button>
              </div>
            )}
          </For>
        </div>

        <Show
          when={showAddPart()}
          fallback={
            <button
              class="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-warm-progress-bg text-warm-text-secondary text-sm hover:border-warm-primary hover:text-warm-primary transition-colors"
              onClick={() => setShowAddPart(true)}
            >
              + Добавить деталь
            </button>
          }
        >
          <div class="mt-4 p-4 bg-warm-surface rounded-2xl shadow-sm">
            <input
              type="text"
              class="w-full px-3 py-2.5 rounded-xl bg-warm-bg border border-warm-progress-bg focus:border-warm-primary focus:outline-none text-sm transition-colors"
              placeholder="Название детали"
              value={newPartName()}
              onInput={(e) => setNewPartName(e.currentTarget.value)}
              autofocus
            />
            <input
              type="number"
              inputmode="numeric"
              class="w-full mt-2 px-3 py-2.5 rounded-xl bg-warm-bg border border-warm-progress-bg focus:border-warm-primary focus:outline-none text-sm transition-colors"
              placeholder="Цель (рядов), необязательно"
              value={newPartTarget()}
              onInput={(e) => setNewPartTarget(e.currentTarget.value)}
            />
            <div class="flex gap-2 mt-3">
              <button
                class="flex-1 py-2 rounded-xl text-sm bg-warm-progress-bg hover:bg-warm-progress-bg/70 transition-colors"
                onClick={() => {
                  setShowAddPart(false);
                  setNewPartName('');
                  setNewPartTarget('');
                }}
              >
                Отмена
              </button>
              <button
                class="flex-1 py-2 rounded-xl text-sm text-white bg-warm-primary hover:bg-warm-primary-dark transition-colors disabled:opacity-50"
                disabled={!newPartName().trim()}
                onClick={handleAddPart}
              >
                Добавить
              </button>
            </div>
          </div>
        </Show>
      </main>

      <ConfirmDialog
        open={showDeleteProject()}
        title="Удалить проект?"
        message="Все детали и прогресс будут потеряны."
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteProject(false)}
      />

      <ConfirmDialog
        open={deletingPartId() !== null}
        title="Удалить деталь?"
        message="Прогресс этой детали будет потерян."
        onConfirm={handleDeletePart}
        onCancel={() => setDeletingPartId(null)}
      />
    </div>
  );
}
