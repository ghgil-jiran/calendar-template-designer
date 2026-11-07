// Project envelopes retain the editor's native document. They do not render,
// normalize, migrate, or infer objects. Ownership and permissions belong on the server.
const SCHEMA = 'customer-project.v1';
const copy = value => structuredClone(value);

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
  return value;
}

export function assertNativeProject(project) {
  if (project?.format !== 'acdl-project' || !project.template || !project.book ||
      !Array.isArray(project.book.pageInstances) || !project.productType?.pageSize) {
    throw new TypeError('An editor-native acdl-project is required');
  }
  const ids = project.book.pageInstances.map(page => requiredString(page?.id, 'page.id'));
  if (!ids.length || new Set(ids).size !== ids.length) throw new TypeError('Page IDs must be nonempty and unique');
  for (const dimension of ['width', 'height']) {
    const value = project.productType.pageSize[dimension];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(`Invalid page ${dimension}`);
    }
  }
  return project;
}

function templateIdentity(value) {
  requiredString(value?.id, 'templateRef.id');
  if (!Number.isInteger(value?.version) || value.version < 1) throw new TypeError('A published template version is required');
  return { id: value.id, version: value.version };
}

function assertEnvelope(value) {
  if (value?.schemaVersion !== SCHEMA) throw new TypeError('Unsupported customer project schema');
  requiredString(value.id, 'project.id');
  requiredString(value.engineVersion, 'engineVersion');
  templateIdentity(value.templateRef);
  if (!Number.isInteger(value.revision) || value.revision < 1) throw new TypeError('Invalid revision');
  assertNativeProject(value.project);
}

export function createCustomerProject({ id, templateRef, engineVersion, project }) {
  return {
    schemaVersion: SCHEMA,
    id: requiredString(id, 'project.id'),
    templateRef: templateIdentity(templateRef),
    engineVersion: requiredString(engineVersion, 'engineVersion'),
    revision: 1,
    project: copy(assertNativeProject(project))
  };
}

export function readCustomerProject(value) {
  assertEnvelope(value);
  return copy(value);
}

// The caller supplies the actual editor engine's project after editing.
// This function is a persistence boundary, not a permission validator.
export function nextRevision(current, editorProject) {
  assertEnvelope(current);
  assertNativeProject(editorProject);
  if (JSON.stringify(editorProject.productType) !== JSON.stringify(current.project.productType) ||
      JSON.stringify(editorProject.book.pageInstances.map(page => page.id)) !==
      JSON.stringify(current.project.book.pageInstances.map(page => page.id))) {
    throw new TypeError('Changing calendar type or page structure requires a new project');
  }
  return { ...copy(current), revision: current.revision + 1, project: copy(editorProject) };
}

export function copyAsNewProject(current, id) {
  assertEnvelope(current);
  requiredString(id, 'new project.id');
  if (id === current.id) throw new TypeError('A different project ID is required');
  return { ...copy(current), id, revision: 1 };
}

// Snapshot bytes and original assets must be durably retained by the server.
// Creating this value alone does not save, approve, order, or print anything.
export function createFinalSnapshot(current, snapshotId) {
  assertEnvelope(current);
  return {
    schemaVersion: 'customer-final-snapshot.v1',
    id: requiredString(snapshotId, 'snapshot.id'),
    projectId: current.id,
    revision: current.revision,
    templateRef: copy(current.templateRef),
    engineVersion: current.engineVersion,
    project: copy(current.project)
  };
}
