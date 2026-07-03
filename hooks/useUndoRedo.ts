"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

function cloneState<T>(state: T): T {
  return structuredClone(state);
}

export interface UseUndoRedoResult<T> {
  state: T;
  setState: (next: T) => void;
  commit: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetHistory: (next: T) => void;
  revision: number;
}

export function useUndoRedo<T>(initialState: T): UseUndoRedoResult<T> {
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(0);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const commit = useCallback(
    (next: T) => {
      setState((current) => {
        pastRef.current = [...pastRef.current, cloneState(current)].slice(
          -MAX_HISTORY,
        );
        futureRef.current = [];
        syncFlags();
        setRevision((r) => r + 1);
        return cloneState(next);
      });
    },
    [syncFlags],
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    setState((current) => {
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [cloneState(current), ...futureRef.current];
      syncFlags();
      setRevision((r) => r + 1);
      return cloneState(previous);
    });
  }, [syncFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    setState((current) => {
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, cloneState(current)];
      syncFlags();
      setRevision((r) => r + 1);
      return cloneState(next);
    });
  }, [syncFlags]);

  const resetHistory = useCallback(
    (next: T) => {
      pastRef.current = [];
      futureRef.current = [];
      setState(next);
      syncFlags();
      setRevision((r) => r + 1);
    },
    [syncFlags],
  );

  return {
    state,
    setState,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    revision,
  };
}
