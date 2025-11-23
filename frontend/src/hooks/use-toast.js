import { useState, useEffect } from "react";

let listeners = [];
let memoryState = { toasts: [] };
const TOAST_REMOVE_DELAY = 1500;

function dispatch(newState) {
  memoryState = { ...memoryState, ...newState };
  listeners.forEach((listener) => listener(memoryState));
}

export function toast({ title, description, action, ...rest }) {
  const id = Math.random().toString(36).substring(2);

  const newToast = {
    id,
    title,
    description,
    action,
    open: true,
    ...rest,
  };

  dispatch({ toasts: [...memoryState.toasts, newToast] });

  // Auto remove after delay
  setTimeout(() => {
    dispatch({
      toasts: memoryState.toasts.filter((t) => t.id !== id),
    });
  }, TOAST_REMOVE_DELAY);

  return { id };
}

export function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
  };
}
