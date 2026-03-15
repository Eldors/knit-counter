import { type Accessor, createResource } from 'solid-js';
import { getProjectProgress } from '../db';

export function useProgress(projectId: Accessor<string>) {
  const [progress] = createResource(projectId, (id) => getProjectProgress(id));

  return {
    progress: () => progress() ?? null,
  };
}
