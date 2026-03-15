import { useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useProjectList } from '../data/useProjectList';

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjectList();
  const [deleteId, setDeleteId] = createSignal<string | null>(null);

  const handleDelete = async () => {
    const id = deleteId();
    if (!id) return;
    await deleteProject(id);
    setDeleteId(null);
  };

  return (
    <div class="min-h-screen flex flex-col">
      <Header title="Мои проекты" />

      <main class="flex-1 px-4 pb-24">
        <Show
          when={projects().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-20 text-warm-text-secondary">
              <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p class="text-lg">Пока нет проектов</p>
              <p class="text-sm mt-1">Нажмите + чтобы создать первый</p>
            </div>
          }
        >
          <div class="flex flex-col gap-3 mt-2">
            <For each={projects()}>
              {(project) => (
                <ProjectCard project={project} onDelete={setDeleteId} />
              )}
            </For>
          </div>
        </Show>
      </main>

      <button
        class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-warm-primary text-white shadow-lg flex items-center justify-center text-2xl font-light hover:bg-warm-primary-dark active:scale-95 transition-all"
        onClick={() => navigate('/new')}
        aria-label="Создать проект"
      >
        +
      </button>

      <ConfirmDialog
        open={deleteId() !== null}
        title="Удалить проект?"
        message="Все детали и прогресс будут потеряны."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
