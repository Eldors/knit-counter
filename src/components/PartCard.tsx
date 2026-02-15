import { useNavigate } from '@solidjs/router';
import { Show } from 'solid-js';
import type { Part } from '../db';

interface Props {
  part: Part;
  projectId: string;
  onIncrement: (partId: string) => void;
  onDecrement: (partId: string) => void;
}

export default function PartCard(props: Props) {
  const navigate = useNavigate();

  const pct = () => {
    if (props.part.targetRows <= 0) return null;
    return Math.round((props.part.currentRow / props.part.targetRows) * 100);
  };

  return (
    <div
      class="bg-warm-surface rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/project/${props.projectId}/part/${props.part.id}`)}
    >
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h3 class="font-medium truncate">{props.part.name}</h3>
          <Show when={props.part.targetRows > 0}>
            <p class="text-xs text-warm-text-secondary mt-0.5">
              {props.part.currentRow} из {props.part.targetRows}
            </p>
          </Show>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            class="w-9 h-9 rounded-full bg-warm-progress-bg flex items-center justify-center text-lg font-medium hover:bg-warm-progress-bg/70 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              props.onDecrement(props.part.id);
            }}
            aria-label="Минус ряд"
          >
            -
          </button>
          <span class="w-10 text-center font-semibold tabular-nums">{props.part.currentRow}</span>
          <button
            class="w-9 h-9 rounded-full bg-warm-primary text-white flex items-center justify-center text-lg font-medium hover:bg-warm-primary-dark transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              props.onIncrement(props.part.id);
            }}
            aria-label="Плюс ряд"
          >
            +
          </button>
        </div>
      </div>

      <Show when={pct() !== null}>
        <div class="mt-3 h-1.5 bg-warm-progress-bg rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            classList={{
              'bg-warm-primary': pct()! < 100,
              'bg-warm-success': pct()! >= 100,
            }}
            style={{ width: `${Math.min(pct()!, 100)}%` }}
          />
        </div>
      </Show>
    </div>
  );
}
