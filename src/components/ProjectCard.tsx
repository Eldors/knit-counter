import { useNavigate } from '@solidjs/router';
import { createResource, Show } from 'solid-js';
import { type Project, getProjectProgress } from '../db';

interface Props {
  project: Project;
  onDelete: (id: string) => void;
}

export default function ProjectCard(props: Props) {
  const navigate = useNavigate();
  const [progress] = createResource(
    () => props.project.id,
    (id) => getProjectProgress(id),
  );

  const pct = () => {
    const p = progress();
    if (!p || p.total === 0) return null;
    return Math.round((p.done / p.total) * 100);
  };

  return (
    <div
      class="bg-warm-surface rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => navigate(`/project/${props.project.id}`)}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold truncate">{props.project.name}</h3>
          <Show when={pct() !== null}>
            <div class="mt-2">
              <div class="flex justify-between text-xs text-warm-text-secondary mb-1">
                <span>Прогресс</span>
                <span>{pct()}%</span>
              </div>
              <div class="h-1.5 bg-warm-progress-bg rounded-full overflow-hidden">
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
        </div>
        <button
          class="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-danger/10 text-warm-text-secondary hover:text-warm-danger transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete(props.project.id);
          }}
          aria-label="Удалить проект"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
