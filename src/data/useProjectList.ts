import { createSignal, onMount } from 'solid-js';
import { db, deleteProject as dbDeleteProject, type Project } from '../db';

export function useProjectList() {
  const [projects, setProjects] = createSignal<Project[]>([]);

  const load = async () => {
    const list = await db.projects.orderBy('updatedAt').reverse().toArray();
    setProjects(list);
  };

  onMount(load);

  const deleteProject = async (id: string) => {
    await dbDeleteProject(id);
    await load();
  };

  return { projects, deleteProject };
}
