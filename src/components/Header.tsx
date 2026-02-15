import { useNavigate } from '@solidjs/router';
import type { JSX } from 'solid-js';

interface Props {
  title: string;
  back?: string;
  right?: JSX.Element;
}

export default function Header(props: Props) {
  const navigate = useNavigate();

  return (
    <header class="sticky top-0 z-10 flex items-center gap-3 bg-warm-bg/90 backdrop-blur px-4 py-3">
      {props.back && (
        <button
          class="flex items-center justify-center w-9 h-9 rounded-full hover:bg-warm-progress-bg transition-colors"
          onClick={() => navigate(props.back!)}
          aria-label="Назад"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 class="flex-1 text-lg font-semibold truncate">{props.title}</h1>
      {props.right}
    </header>
  );
}
