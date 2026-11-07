import assert from "node:assert/strict";
import {
  CreateCommand,
  DeleteCommand,
  LayerCommand,
  MoveCommand,
  ResizeCommand,
  RotateCommand,
  clearSelection,
  createEditorState,
  executeCommand,
  redo,
  select,
  snapPosition,
  undo,
} from "../dist/index.js";

const document = {
  objects: [
    { id: "a", x: 10, y: 10, width: 100, height: 50, rotation: 0, zIndex: 0 },
    { id: "b", x: 200, y: 100, width: 80, height: 80, rotation: 0, zIndex: 1 },
  ],
};

let state = createEditorState(document);
assert.deepEqual(state.selection.ids, []);

state = select(state, ["a"]);
state = select(state, ["b"], "add");
assert.deepEqual(state.selection.ids, ["a", "b"]);
state = select(state, ["a"], "toggle");
assert.deepEqual(state.selection.ids, ["b"]);
state = clearSelection(state);
assert.deepEqual(state.selection.ids, []);

state = executeCommand(state, new MoveCommand(["a"], 15, 20));
assert.equal(state.document.objects[0].x, 25);
assert.equal(state.document.objects[0].y, 30);

state = executeCommand(state, new ResizeCommand("a", 120, 60));
assert.equal(state.document.objects[0].width, 120);
state = executeCommand(state, new RotateCommand("a", 45));
assert.equal(state.document.objects[0].rotation, 45);

state = undo(state);
assert.equal(state.document.objects[0].rotation, 0);
state = redo(state);
assert.equal(state.document.objects[0].rotation, 45);

state = executeCommand(
  state,
  new CreateCommand({ id: "c", x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 2 }),
);
assert.equal(state.document.objects.length, 3);
state = executeCommand(state, new DeleteCommand(["c"]));
assert.equal(state.document.objects.length, 2);

state = executeCommand(state, new LayerCommand(["a"], "bring-front"));
assert.equal(state.document.objects.find((object) => object.id === "a").zIndex, 1);

const snapped = snapPosition(
  { x: 0, y: 0, width: 50, height: 50, rotation: 0 },
  148,
  98,
  document.objects,
  [],
  { gridSize: 10, threshold: 4, canvasWidth: 500, canvasHeight: 400 },
);
assert.equal(snapped.x, 150);
assert.equal(snapped.y, 100);
assert.ok(snapped.guides.length >= 2);

console.log("editor-core Sprint 2 tests: PASS");
