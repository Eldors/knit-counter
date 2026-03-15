import { createSignal, onMount, onCleanup } from 'solid-js';
import { db, updatePartRow, updateProjectRow, getActivePattern, type Pattern } from '../db';

export function useCounter(params: { projectId: string; partId?: string }) {
  const isProjectMode = !params.partId;

  const [title, setTitle] = createSignal('');
  const [count, setCount] = createSignal(0);
  const [target, setTarget] = createSignal(0);
  const [pattern, setPattern] = createSignal<Pattern | null>(null);
  const [notFound, setNotFound] = createSignal(false);

  let pendingSaveCount: number | null = null;

  const recoveryKey = () =>
    `knit-recovery-${isProjectMode ? params.projectId : params.partId}`;

  const saveRow = async (row: number) => {
    pendingSaveCount = row;
    try {
      if (isProjectMode) await updateProjectRow(params.projectId, row);
      else await updatePartRow(params.partId!, row);
      if (pendingSaveCount === row) {
        pendingSaveCount = null;
        try {
          localStorage.removeItem(recoveryKey());
        } catch {}
      }
    } catch (e) {
      console.error('Failed to save counter:', e);
    }
  };

  const flushPendingSave = () => {
    if (pendingSaveCount !== null) {
      try {
        localStorage.setItem(recoveryKey(), String(pendingSaveCount));
      } catch {}
      saveRow(pendingSaveCount);
    }
  };

  const onVisChange = () => {
    if (document.visibilityState === 'hidden') flushPendingSave();
  };
  const onPageHide = () => flushPendingSave();

  onMount(async () => {
    if (isProjectMode) {
      const project = await db.projects.get(params.projectId);
      if (!project) {
        setNotFound(true);
        return;
      }
      setTitle(project.name);
      setTarget(project.targetRows);
      setCount(project.currentRow);
    } else {
      const p = await db.parts.get(params.partId!);
      if (!p || p.projectId !== params.projectId) {
        setNotFound(true);
        return;
      }
      setTitle(p.name);
      setTarget(p.targetRows);
      setCount(p.currentRow);
    }

    const entityId = isProjectMode ? params.projectId : params.partId!;
    const entityType = isProjectMode ? ('project' as const) : ('part' as const);
    const active = await getActivePattern(entityId, entityType);
    if (active) setPattern(active);

    const recovered = localStorage.getItem(recoveryKey());
    if (recovered !== null) {
      const val = parseInt(recovered, 10);
      if (!isNaN(val) && val !== count()) {
        setCount(val);
        saveRow(val);
      }
      localStorage.removeItem(recoveryKey());
    }

    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('pagehide', onPageHide);
  });

  onCleanup(() => {
    flushPendingSave();
    document.removeEventListener('visibilitychange', onVisChange);
    window.removeEventListener('pagehide', onPageHide);
  });

  const increment = () => {
    const newCount = count() + 1;
    setCount(newCount);
    saveRow(newCount);
  };

  const decrement = () => {
    if (count() <= 0) return;
    const newCount = count() - 1;
    setCount(newCount);
    saveRow(newCount);
  };

  const reset = () => {
    setCount(0);
    saveRow(0);
  };

  return { title, count, target, pattern, notFound, increment, decrement, reset };
}
