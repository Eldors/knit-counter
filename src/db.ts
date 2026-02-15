import Dexie, { type EntityTable } from 'dexie';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Part {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  currentRow: number;
  targetRows: number; // 0 = нет цели
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('knit-counter') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  parts: EntityTable<Part, 'id'>;
};

db.version(1).stores({
  projects: 'id, updatedAt',
  parts: 'id, projectId',
});

export { db };

// --- Helpers ---

function genId(): string {
  return crypto.randomUUID();
}

export async function createProject(
  name: string,
  parts: { name: string; targetRows: number }[],
): Promise<string> {
  const now = Date.now();
  const projectId = genId();

  await db.transaction('rw', db.projects, db.parts, async () => {
    await db.projects.add({
      id: projectId,
      name,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < parts.length; i++) {
      await db.parts.add({
        id: genId(),
        projectId,
        name: parts[i].name,
        sortOrder: i,
        currentRow: 0,
        targetRows: parts[i].targetRows,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  return projectId;
}

export async function deleteProject(projectId: string): Promise<void> {
  await db.transaction('rw', db.projects, db.parts, async () => {
    await db.parts.where('projectId').equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}

export async function addPart(
  projectId: string,
  name: string,
  targetRows: number,
): Promise<string> {
  const now = Date.now();
  const count = await db.parts.where('projectId').equals(projectId).count();
  const partId = genId();

  await db.parts.add({
    id: partId,
    projectId,
    name,
    sortOrder: count,
    currentRow: 0,
    targetRows,
    createdAt: now,
    updatedAt: now,
  });

  await db.projects.update(projectId, { updatedAt: now });
  return partId;
}

export async function deletePart(partId: string, projectId: string): Promise<void> {
  await db.parts.delete(partId);
  await db.projects.update(projectId, { updatedAt: Date.now() });
}

export async function updatePartRow(partId: string, currentRow: number): Promise<void> {
  await db.parts.update(partId, { currentRow, updatedAt: Date.now() });
}

export async function getProjectParts(projectId: string): Promise<Part[]> {
  return db.parts.where('projectId').equals(projectId).sortBy('sortOrder');
}

export async function getProjectProgress(
  projectId: string,
): Promise<{ done: number; total: number } | null> {
  const parts = await db.parts.where('projectId').equals(projectId).toArray();
  const withTarget = parts.filter((p) => p.targetRows > 0);
  if (withTarget.length === 0) return null;

  const total = withTarget.reduce((s, p) => s + p.targetRows, 0);
  const done = withTarget.reduce((s, p) => s + Math.min(p.currentRow, p.targetRows), 0);
  return { done, total };
}
