import { Show } from 'solid-js';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog(props: Props) {
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={props.onCancel}>
        <div
          class="bg-warm-surface rounded-2xl p-6 w-full max-w-xs shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 class="text-lg font-semibold mb-2">{props.title}</h2>
          <p class="text-warm-text-secondary text-sm mb-6">{props.message}</p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-medium bg-warm-progress-bg hover:bg-warm-progress-bg/80 transition-colors"
              onClick={props.onCancel}
            >
              Отмена
            </button>
            <button
              class="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-warm-danger hover:bg-warm-danger/90 transition-colors"
              onClick={props.onConfirm}
            >
              {props.confirmLabel ?? 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
