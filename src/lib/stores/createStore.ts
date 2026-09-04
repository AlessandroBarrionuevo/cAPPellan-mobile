import { useSyncExternalStore } from 'react';

type SetStateInternal<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetStateInternal<T> = () => T;
type Listener<T> = (state: T, prevState: T) => void;

export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener<T>) => () => void;
}

export type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener<T>) => () => void;
};

export function createStore<T extends object>(
  initializer: (set: SetStateInternal<T>, get: GetStateInternal<T>) => T
): UseStore<T> {
  let state: T;
  const listeners = new Set<Listener<T>>();

  const getState: GetStateInternal<T> = () => state;

  const setState: SetStateInternal<T> = (partial) => {
    const nextState = typeof partial === 'function' ? (partial as any)(state) : partial;
    if (!Object.is(nextState, state)) {
      const prevState = state;
      state = Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, prevState));
    }
  };

  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  const useStore = <U = T>(selector?: (state: T) => U): U => {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : (state as unknown as U)),
      () => (selector ? selector(state) : (state as unknown as U))
    );
  };

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore as UseStore<T>;
}
