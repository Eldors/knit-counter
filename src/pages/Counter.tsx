import { useParams, useNavigate } from '@solidjs/router';
import { createSignal, createEffect, Show, For, onCleanup } from 'solid-js';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCounter } from '../data/useCounter';

function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate(16);
  }
}

export default function Counter() {
  const params = useParams<{ id: string; partId?: string }>();
  const navigate = useNavigate();

  const isProjectMode = () => !params.partId;

  const {
    title,
    count,
    target,
    pattern,
    notFound,
    increment: dataIncrement,
    decrement: dataDecrement,
    reset: dataReset,
  } = useCounter({ projectId: params.id, partId: params.partId });

  const [animating, setAnimating] = createSignal(false);
  const [showDone, setShowDone] = createSignal(false);
  const [showReset, setShowReset] = createSignal(false);
  const [doneSeen, setDoneSeen] = createSignal(false);

  let animTimer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    if (animTimer) clearTimeout(animTimer);
  });

  createEffect(() => {
    if (notFound()) {
      navigate(isProjectMode() ? '/' : `/project/${params.id}`);
    }
  });

  // Track initial doneSeen based on loaded data
  createEffect(() => {
    if (target() > 0 && count() >= target()) {
      setDoneSeen(true);
    }
  });

  const patternPath = () =>
    isProjectMode()
      ? `/project/${params.id}/counter/pattern`
      : `/project/${params.id}/part/${params.partId}/pattern`;

  const patternActiveIndex = () => {
    const p = pattern();
    if (!p) return -1;
    const offset = count() - p.startRow;
    if (offset <= 0) return -1;
    return (offset - 1) % p.rows.length;
  };

  const triggerPulse = () => {
    setAnimating(false);
    requestAnimationFrame(() => {
      setAnimating(true);
      if (animTimer) clearTimeout(animTimer);
      animTimer = setTimeout(() => setAnimating(false), 200);
    });
  };

  const increment = () => {
    dataIncrement();
    triggerPulse();
    vibrate();

    if (target() > 0 && count() >= target() && !doneSeen()) {
      setDoneSeen(true);
      setShowDone(true);
      setTimeout(() => setShowDone(false), 1800);
    }
  };

  const decrement = () => {
    if (count() <= 0) return;
    dataDecrement();
    vibrate();

    if (target() > 0 && count() < target()) {
      setDoneSeen(false);
    }
  };

  const reset = () => {
    dataReset();
    setShowReset(false);
    setDoneSeen(false);
  };

  const pct = () => {
    if (target() <= 0) return null;
    return Math.min(100, Math.round((count() / target()) * 100));
  };

  return (
    <div class="h-[100dvh] flex flex-col bg-warm-bg relative overflow-hidden select-none">
      {/* Header */}
      <div class="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-full hover:bg-warm-progress-bg transition-colors"
          onClick={() => navigate(`/project/${params.id}`)}
          aria-label="Назад"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="flex-1 text-lg font-semibold truncate">{title() || '...'}</h1>
        <button
          class="flex items-center justify-center flex-col w-9 h-9 rounded-full hover:bg-warm-progress-bg transition-colors"
          classList={{
            'text-warm-primary': !!pattern(),
            'text-warm-text-secondary': !pattern(),
          }}
          onClick={() => navigate(patternPath())}
          aria-label="Рисунок"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Pattern timeline */}
      <Show when={pattern()}>
        <div class="flex flex-col items-center justify-center gap-4 px-4  min-h-0" style={{ "flex-basis": "40%" }}>
          <div class="mx-auto">
            <For each={pattern()!.rows}>
              {(rowLabel, i) => {
                const isActive = () => patternActiveIndex() === i();
                return (
                  <div class="flex items-center gap-1 transition-all duration-200">
                    <div
                      class="w-3 h-3 rounded-full border-2 border-warm-primary transition-all duration-200"
                      classList={{
                        'bg-warm-primary scale-125': isActive(),
                        'bg-transparent opacity-40': !isActive(),
                      }}
                    />
                    <span
                      class="text-lg whitespace-nowrap transition-all duration-200"
                      classList={{
                        'font-bold text-warm-text': isActive(),
                        'text-warm-text-secondary opacity-40': !isActive(),
                      }}
                    >
                      {rowLabel}
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* Counter display */}
      <div class="flex flex-col items-center justify-center px-4 min-h-0" style={{ "flex-basis": pattern() ? "20%" : "50%" }}>
        <span
          class="tabular-nums font-bold leading-none text-warm-text"
          classList={{
            'text-8xl': count() < 1000,
            'text-7xl': count() >= 1000 && count() < 10000,
            'text-6xl': count() >= 10000,
            'animate-pulse-scale': animating(),
          }}
        >
          {count()}
        </span>

        <Show when={target() > 0}>
          <p class="text-warm-text-secondary mt-2 text-lg">
            из {target()}
          </p>

          <div class="w-full max-w-xs mt-4 h-2 bg-warm-progress-bg rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              classList={{
                'bg-warm-primary': pct()! < 100,
                'bg-warm-success': pct()! >= 100,
              }}
              style={{ width: `${pct()}%` }}
            />
          </div>
        </Show>
      </div>

      {/* Tap zone */}
      <div
        class="bg-warm-primary rounded-t-3xl flex items-center justify-center cursor-pointer active:bg-warm-primary-dark transition-colors relative"
        style={{ "flex-basis": pattern() ? "40%" : "50%", "min-height": "0" }}
        onClick={increment}
        role="button"
        aria-label="Добавить ряд"
      >
        <span class="text-white/90 text-6xl font-light pointer-events-none">+1</span>

        {/* Bottom controls */}
        <div class="absolute bottom-0 left-0 right-0 flex justify-between items-end px-6 pb-8 pointer-events-none">
          <button
            class="pointer-events-auto w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-xl font-medium active:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              decrement();
            }}
            aria-label="Убрать ряд"
          >
            -1
          </button>
          <button
            class="pointer-events-auto px-4 py-2 rounded-full bg-white/20 text-white text-sm active:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowReset(true);
            }}
          >
            Сброс
          </button>
        </div>
      </div>

      {/* Done celebration overlay */}
      <Show when={showDone()}>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div class="animate-confetti-pop text-6xl font-bold text-warm-success bg-warm-surface/95 rounded-3xl px-8 py-6 shadow-2xl">
            Готово!
          </div>
        </div>
      </Show>

      <ConfirmDialog
        open={showReset()}
        title="Сбросить счётчик?"
        message="Текущий прогресс будет обнулён."
        confirmLabel="Сбросить"
        onConfirm={reset}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
}
