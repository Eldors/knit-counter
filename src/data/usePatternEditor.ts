import { createSignal, onMount } from 'solid-js';
import {
  db,
  getActivePattern,
  setPattern,
  removePattern as dbRemovePattern,
} from '../db';

export function usePatternEditor(params: {
  projectId: string;
  partId?: string;
}) {
  const isProjectMode = !params.partId;
  const entityId = isProjectMode ? params.projectId : params.partId!;
  const entityType: 'project' | 'part' = isProjectMode ? 'project' : 'part';

  const [currentRow, setCurrentRow] = createSignal(0);
  const [existingRows, setExistingRows] = createSignal<string[] | null>(null);
  const [notFound, setNotFound] = createSignal(false);

  onMount(async () => {
    if (isProjectMode) {
      const project = await db.projects.get(params.projectId);
      if (!project) {
        setNotFound(true);
        return;
      }
      setCurrentRow(project.currentRow);
    } else {
      const part = await db.parts.get(params.partId!);
      if (!part) {
        setNotFound(true);
        return;
      }
      setCurrentRow(part.currentRow);
    }

    const active = await getActivePattern(entityId, entityType);
    if (active) {
      setExistingRows(active.rows);
    }
  });

  const applyPattern = async (rows: string[]) => {
    await setPattern(entityId, entityType, rows, currentRow());
  };

  const removePattern = async () => {
    await dbRemovePattern(entityId, entityType, currentRow());
  };

  return { currentRow, existingRows, notFound, applyPattern, removePattern };
}
