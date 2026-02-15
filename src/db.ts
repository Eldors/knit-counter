import Dexie, { type EntityTable } from 'dexie';

export interface Project {
  id: string;
  name: string;
  currentRow: number;
  targetRows: number;
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

export interface Pattern {
  id: string;
  entityId: string;       // projectId или partId
  entityType: 'project' | 'part';
  rows: string[];          // описания рядов рисунка
  startRow: number;        // значение счетчика при активации
  endRow: number | null;   // значение при деактивации (null = активен)
  createdAt: number;
}

const db = new Dexie('knit-counter') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  parts: EntityTable<Part, 'id'>;
  patterns: EntityTable<Pattern, 'id'>;
};

db.version(1).stores({
  projects: 'id, updatedAt',
  parts: 'id, projectId',
});

db.version(2).stores({
  projects: 'id, updatedAt',
  parts: 'id, projectId',
}).upgrade(tx => {
  return tx.table('projects').toCollection().modify(project => {
    if (project.currentRow === undefined) project.currentRow = 0;
    if (project.targetRows === undefined) project.targetRows = 0;
  });
});

db.version(3).stores({
  projects: 'id, updatedAt',
  parts: 'id, projectId',
  patterns: 'id, [entityId+entityType]',
});

export { db };

// --- Helpers ---

function genId(): string {
  return crypto.randomUUID();
}

export async function createProject(
  name: string,
  parts: { name: string; targetRows: number }[],
  targetRows: number = 0,
): Promise<string> {
  const now = Date.now();
  const projectId = genId();

  await db.transaction('rw', db.projects, db.parts, async () => {
    await db.projects.add({
      id: projectId,
      name,
      currentRow: 0,
      targetRows,
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
  await db.transaction('rw', db.projects, db.parts, db.patterns, async () => {
    const parts = await db.parts.where('projectId').equals(projectId).toArray();
    for (const part of parts) {
      await db.patterns.where({ entityId: part.id, entityType: 'part' }).delete();
    }
    await db.patterns.where({ entityId: projectId, entityType: 'project' }).delete();
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
  await db.patterns.where({ entityId: partId, entityType: 'part' }).delete();
  await db.parts.delete(partId);
  await db.projects.update(projectId, { updatedAt: Date.now() });
}

export async function updatePartRow(partId: string, currentRow: number): Promise<void> {
  await db.parts.update(partId, { currentRow, updatedAt: Date.now() });
}

export async function updateProjectRow(projectId: string, currentRow: number): Promise<void> {
  await db.projects.update(projectId, { currentRow, updatedAt: Date.now() });
}

export async function getProjectParts(projectId: string): Promise<Part[]> {
  return db.parts.where('projectId').equals(projectId).sortBy('sortOrder');
}

export async function getActivePattern(
  entityId: string,
  entityType: 'project' | 'part',
): Promise<Pattern | undefined> {
  const patterns = await db.patterns
    .where({ entityId, entityType })
    .toArray();
  return patterns.find((p) => p.endRow === null);
}

export async function setPattern(
  entityId: string,
  entityType: 'project' | 'part',
  rows: string[],
  currentRow: number,
): Promise<string> {
  const now = Date.now();
  const id = genId();

  await db.transaction('rw', db.patterns, async () => {
    const active = await getActivePattern(entityId, entityType);
    if (active) {
      await db.patterns.update(active.id, { endRow: currentRow });
    }
    await db.patterns.add({
      id,
      entityId,
      entityType,
      rows,
      startRow: currentRow,
      endRow: null,
      createdAt: now,
    });
  });

  return id;
}

export async function removePattern(
  entityId: string,
  entityType: 'project' | 'part',
  currentRow: number,
): Promise<void> {
  const active = await getActivePattern(entityId, entityType);
  if (active) {
    await db.patterns.update(active.id, { endRow: currentRow });
  }
}

export async function getProjectProgress(
  projectId: string,
): Promise<{ done: number; total: number } | null> {
  const project = await db.projects.get(projectId);
  const parts = await db.parts.where('projectId').equals(projectId).toArray();
  const withTarget = parts.filter((p) => p.targetRows > 0);

  let total = withTarget.reduce((s, p) => s + p.targetRows, 0);
  let done = withTarget.reduce((s, p) => s + Math.min(p.currentRow, p.targetRows), 0);

  if (project && project.targetRows > 0) {
    total += project.targetRows;
    done += Math.min(project.currentRow, project.targetRows);
  }

  if (total === 0) return null;
  return { done, total };
}
