export type EditorMode = "content" | "template";

export interface SelectionState {
  ids: string[];
  primaryId?: string;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface EditorSnapshot<TDocument> {
  document: TDocument;
  selection: SelectionState;
  viewport: ViewportState;
  mode: EditorMode;
}

export interface EditorState<TDocument> extends EditorSnapshot<TDocument> {
  history: EditorSnapshot<TDocument>[];
  future: EditorSnapshot<TDocument>[];
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface EditableObject extends Transform {
  id: string;
  locked?: boolean;
  hidden?: boolean;
  zIndex: number;
}

export interface ObjectDocument<TObject extends EditableObject = EditableObject> {
  objects: TObject[];
}

export type SelectionMode = "replace" | "add" | "toggle" | "remove";

export interface SnapOptions {
  enabled?: boolean;
  gridSize?: number;
  threshold?: number;
  snapToGrid?: boolean;
  snapToObjects?: boolean;
  snapToCenter?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface SnapGuide {
  axis: "x" | "y";
  value: number;
  source: "grid" | "object" | "center";
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export interface EditorCommand<TDocument> {
  readonly label: string;
  execute(document: TDocument): TDocument;
}

const clone = <T>(value: T): T => structuredClone(value);
const snapshot = <T>(state: EditorState<T>): EditorSnapshot<T> => ({
  document: clone(state.document),
  selection: clone(state.selection),
  viewport: clone(state.viewport),
  mode: state.mode,
});

export function createEditorState<T>(document: T): EditorState<T> {
  return {
    document: clone(document),
    selection: { ids: [] },
    viewport: { zoom: 1, panX: 0, panY: 0 },
    mode: "content",
    history: [],
    future: [],
  };
}

export function commit<T>(
  state: EditorState<T>,
  mutate: (draft: EditorSnapshot<T>) => void,
): EditorState<T> {
  const previous = snapshot(state);
  const next = snapshot(state);
  mutate(next);
  return { ...next, history: [...state.history, previous], future: [] };
}

export function executeCommand<T>(
  state: EditorState<T>,
  command: EditorCommand<T>,
): EditorState<T> {
  return commit(state, (draft) => {
    draft.document = command.execute(draft.document);
  });
}

export function undo<T>(state: EditorState<T>): EditorState<T> {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return {
    ...clone(previous),
    history: state.history.slice(0, -1),
    future: [snapshot(state), ...state.future],
  };
}

export function redo<T>(state: EditorState<T>): EditorState<T> {
  const next = state.future[0];
  if (!next) return state;
  return {
    ...clone(next),
    history: [...state.history, snapshot(state)],
    future: state.future.slice(1),
  };
}

export function updateSelection(
  current: SelectionState,
  ids: string[],
  mode: SelectionMode = "replace",
  primaryId?: string,
): SelectionState {
  const uniqueIds = [...new Set(ids)];
  const currentSet = new Set(current.ids);

  if (mode === "replace") {
    return { ids: uniqueIds, primaryId: primaryId ?? uniqueIds[0] };
  }

  if (mode === "add") uniqueIds.forEach((id) => currentSet.add(id));
  if (mode === "remove") uniqueIds.forEach((id) => currentSet.delete(id));
  if (mode === "toggle") {
    uniqueIds.forEach((id) => {
      if (currentSet.has(id)) currentSet.delete(id);
      else currentSet.add(id);
    });
  }

  const nextIds = [...currentSet];
  return {
    ids: nextIds,
    primaryId:
      primaryId && currentSet.has(primaryId)
        ? primaryId
        : current.primaryId && currentSet.has(current.primaryId)
          ? current.primaryId
          : nextIds[0],
  };
}

export function setSelection<T>(
  state: EditorState<T>,
  ids: string[],
  primaryId?: string,
): EditorState<T> {
  return { ...state, selection: updateSelection(state.selection, ids, "replace", primaryId) };
}

export function select<T>(
  state: EditorState<T>,
  ids: string[],
  mode: SelectionMode = "replace",
  primaryId?: string,
): EditorState<T> {
  return { ...state, selection: updateSelection(state.selection, ids, mode, primaryId) };
}

export function clearSelection<T>(state: EditorState<T>): EditorState<T> {
  return { ...state, selection: { ids: [] } };
}

function mapObjects<TObject extends EditableObject>(
  document: ObjectDocument<TObject>,
  ids: Set<string>,
  mapper: (object: TObject) => TObject,
): ObjectDocument<TObject> {
  return {
    ...document,
    objects: document.objects.map((object) => (ids.has(object.id) ? mapper(object) : object)),
  };
}

export class MoveCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Move objects";
  constructor(
    private readonly ids: string[],
    private readonly deltaX: number,
    private readonly deltaY: number,
  ) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    const ids = new Set(this.ids);
    return mapObjects(document, ids, (object) =>
      object.locked
        ? object
        : ({ ...object, x: object.x + this.deltaX, y: object.y + this.deltaY } as TObject),
    );
  }
}

export class ResizeCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Resize object";
  constructor(
    private readonly id: string,
    private readonly width: number,
    private readonly height: number,
    private readonly x?: number,
    private readonly y?: number,
  ) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    return mapObjects(document, new Set([this.id]), (object) =>
      object.locked
        ? object
        : ({
            ...object,
            width: Math.max(1, this.width),
            height: Math.max(1, this.height),
            x: this.x ?? object.x,
            y: this.y ?? object.y,
          } as TObject),
    );
  }
}

export class RotateCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Rotate object";
  constructor(private readonly id: string, private readonly rotation: number) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    return mapObjects(document, new Set([this.id]), (object) =>
      object.locked ? object : ({ ...object, rotation: this.rotation } as TObject),
    );
  }
}

export class DeleteCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Delete objects";
  constructor(private readonly ids: string[]) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    const ids = new Set(this.ids);
    return { ...document, objects: document.objects.filter((object) => !ids.has(object.id) || object.locked) };
  }
}

export class CreateCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Create object";
  constructor(private readonly object: TObject) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    if (document.objects.some((candidate) => candidate.id === this.object.id)) return document;
    return { ...document, objects: [...document.objects, clone(this.object)] };
  }
}

export type LayerAction = "bring-front" | "bring-forward" | "send-backward" | "send-back";

export class LayerCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Change layer";
  constructor(private readonly ids: string[], private readonly action: LayerAction) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    const ids = new Set(this.ids);
    const sorted = [...document.objects].sort((a, b) => a.zIndex - b.zIndex);
    const selected = sorted.filter((object) => ids.has(object.id) && !object.locked);
    const unselected = sorted.filter((object) => !ids.has(object.id) || object.locked);
    let result: TObject[];

    if (this.action === "bring-front") result = [...unselected, ...selected];
    else if (this.action === "send-back") result = [...selected, ...unselected];
    else {
      result = sorted;
      const direction = this.action === "bring-forward" ? 1 : -1;
      const iteration = direction > 0 ? [...selected].reverse() : selected;
      for (const selectedObject of iteration) {
        const index = result.findIndex((object) => object.id === selectedObject.id);
        const target = index + direction;
        if (target < 0 || target >= result.length) continue;
        if (ids.has(result[target].id)) continue;
        [result[index], result[target]] = [result[target], result[index]];
      }
    }

    return {
      ...document,
      objects: result.map((object, index) => ({ ...object, zIndex: index } as TObject)),
    };
  }
}

export class SetObjectFlagsCommand<TObject extends EditableObject>
  implements EditorCommand<ObjectDocument<TObject>>
{
  readonly label = "Change object state";
  constructor(
    private readonly ids: string[],
    private readonly flags: Pick<EditableObject, "locked" | "hidden">,
  ) {}

  execute(document: ObjectDocument<TObject>): ObjectDocument<TObject> {
    return mapObjects(document, new Set(this.ids), (object) => ({ ...object, ...this.flags } as TObject));
  }
}

const within = (candidate: number, target: number, threshold: number) =>
  Math.abs(candidate - target) <= threshold;

export function snapPosition<TObject extends EditableObject>(
  moving: Transform,
  desiredX: number,
  desiredY: number,
  objects: TObject[],
  movingIds: string[] = [],
  options: SnapOptions = {},
): SnapResult {
  if (options.enabled === false) return { x: desiredX, y: desiredY, guides: [] };

  const gridSize = Math.max(1, options.gridSize ?? 10);
  const threshold = Math.max(0, options.threshold ?? 5);
  let x = desiredX;
  let y = desiredY;
  const guides: SnapGuide[] = [];

  if (options.snapToGrid !== false) {
    const gridX = Math.round(x / gridSize) * gridSize;
    const gridY = Math.round(y / gridSize) * gridSize;
    if (within(x, gridX, threshold)) {
      x = gridX;
      guides.push({ axis: "x", value: gridX, source: "grid" });
    }
    if (within(y, gridY, threshold)) {
      y = gridY;
      guides.push({ axis: "y", value: gridY, source: "grid" });
    }
  }

  if (options.snapToCenter !== false && options.canvasWidth && options.canvasHeight) {
    const targetX = options.canvasWidth / 2 - moving.width / 2;
    const targetY = options.canvasHeight / 2 - moving.height / 2;
    if (within(x, targetX, threshold)) {
      x = targetX;
      guides.push({ axis: "x", value: options.canvasWidth / 2, source: "center" });
    }
    if (within(y, targetY, threshold)) {
      y = targetY;
      guides.push({ axis: "y", value: options.canvasHeight / 2, source: "center" });
    }
  }

  if (options.snapToObjects !== false) {
    const excluded = new Set(movingIds);
    const movingXPoints = [x, x + moving.width / 2, x + moving.width];
    const movingYPoints = [y, y + moving.height / 2, y + moving.height];

    for (const object of objects) {
      if (excluded.has(object.id) || object.hidden) continue;
      const targetXPoints = [object.x, object.x + object.width / 2, object.x + object.width];
      const targetYPoints = [object.y, object.y + object.height / 2, object.y + object.height];

      for (let movingIndex = 0; movingIndex < movingXPoints.length; movingIndex += 1) {
        const offset = [0, moving.width / 2, moving.width][movingIndex];
        const target = targetXPoints.find((point) => within(movingXPoints[movingIndex], point, threshold));
        if (target !== undefined) {
          x = target - offset;
          guides.push({ axis: "x", value: target, source: "object" });
          break;
        }
      }

      for (let movingIndex = 0; movingIndex < movingYPoints.length; movingIndex += 1) {
        const offset = [0, moving.height / 2, moving.height][movingIndex];
        const target = targetYPoints.find((point) => within(movingYPoints[movingIndex], point, threshold));
        if (target !== undefined) {
          y = target - offset;
          guides.push({ axis: "y", value: target, source: "object" });
          break;
        }
      }
    }
  }

  return { x, y, guides };
}
