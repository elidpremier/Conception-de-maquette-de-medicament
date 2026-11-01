(function (root) {
  "use strict";

  function createHistoryController({
    getState,
    restoreState,
    maxEntries = 30,
    debounceMs = 600,
  }) {
    let undoStack = [];
    let redoStack = [];
    let baseline = null;
    let debounceTimer = null;

    function currentState() {
      return JSON.stringify(getState());
    }

    function trim(stack) {
      while (stack.length > maxEntries) stack.shift();
    }

    function commit() {
      const current = currentState();
      if (current === baseline) return;
      undoStack.push(baseline);
      trim(undoStack);
      baseline = current;
      redoStack = [];
    }

    function schedule() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(commit, debounceMs);
    }

    function restore(json) {
      baseline = json;
      restoreState(JSON.parse(json));
    }

    function undo() {
      clearTimeout(debounceTimer);
      const current = currentState();
      if (current !== baseline) {
        redoStack.push(current);
        trim(redoStack);
        restore(baseline);
        return;
      }
      if (undoStack.length === 0) return;
      redoStack.push(current);
      trim(redoStack);
      restore(undoStack.pop());
    }

    function redo() {
      clearTimeout(debounceTimer);
      if (redoStack.length === 0) return;
      const current = currentState();
      undoStack.push(current);
      trim(undoStack);
      restore(redoStack.pop());
    }

    function setBaseline() {
      baseline = currentState();
      undoStack = [];
      redoStack = [];
    }

    function dispose() {
      clearTimeout(debounceTimer);
    }

    return Object.freeze({
      commit,
      schedule,
      undo,
      redo,
      setBaseline,
      dispose,
    });
  }

  root.PackagingHistory = Object.freeze({ createHistoryController });
})(window);
