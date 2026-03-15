import { type Accessor, createSignal, onMount } from 'solid-js';
import {
  db,
  deleteProject as dbDeleteProject,
  addPart as dbAddPart,
  deletePart as dbDeletePart,
  updatePartRow,
  updateProjectRow,
  getProjectParts,
  getProjectProgress,
  type Project as ProjectType,
  type Part,
} from '../db';

export function useProject(projectId: Accessor<string>) {
  const [project, setProject] = createSignal<ProjectType | null>(null);
  const [parts, setParts] = createSignal<Part[]>([]);
  const [progress, setProgress] = createSignal<{ done: number; total: number } | null>(null);
  const [notFound, setNotFound] = createSignal(false);

  const load = async () => {
    const id = projectId();
    const p = await db.projects.get(id);
    if (!p) {
      setNotFound(true);
      return;
    }
    setProject(p);
    setParts(await getProjectParts(id));
    setProgress(await getProjectProgress(id));
  };

  onMount(load);

  const incrementPart = async (partId: string) => {
    const part = parts().find((p) => p.id === partId);
    if (!part) return;
    const newRow = part.currentRow + 1;
    await updatePartRow(partId, newRow);
    setParts(parts().map((p) => (p.id === partId ? { ...p, currentRow: newRow } : p)));
    setProgress(await getProjectProgress(projectId()));
  };

  const decrementPart = async (partId: string) => {
    const part = parts().find((p) => p.id === partId);
    if (!part || part.currentRow <= 0) return;
    const newRow = part.currentRow - 1;
    await updatePartRow(partId, newRow);
    setParts(parts().map((p) => (p.id === partId ? { ...p, currentRow: newRow } : p)));
    setProgress(await getProjectProgress(projectId()));
  };

  const incrementProject = async () => {
    const p = project();
    if (!p) return;
    const newRow = p.currentRow + 1;
    await updateProjectRow(projectId(), newRow);
    setProject({ ...p, currentRow: newRow });
    setProgress(await getProjectProgress(projectId()));
  };

  const decrementProject = async () => {
    const p = project();
    if (!p || p.currentRow <= 0) return;
    const newRow = p.currentRow - 1;
    await updateProjectRow(projectId(), newRow);
    setProject({ ...p, currentRow: newRow });
    setProgress(await getProjectProgress(projectId()));
  };

  const addPart = async (name: string, targetRows: number) => {
    await dbAddPart(projectId(), name, targetRows);
    await load();
  };

  const deletePart = async (partId: string) => {
    await dbDeletePart(partId, projectId());
    await load();
  };

  const deleteProject = async () => {
    await dbDeleteProject(projectId());
  };

  return {
    project,
    parts,
    progress,
    notFound,
    incrementPart,
    decrementPart,
    incrementProject,
    decrementProject,
    addPart,
    deletePart,
    deleteProject,
  };
}
