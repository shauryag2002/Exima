// Simple in-memory emitter (no Node 'events' dependency)

type Listener = () => void;

let listeners: Listener[] = [];

export const requestSearchInputFocus = () => {
  // Use rAF to defer until after tabPress navigation completes
  requestAnimationFrame(() => {
    listeners.forEach((l) => l());
  });
};

export const onSearchInputFocusRequest = (cb: Listener) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};
