// Memoised access to the selectors. Inputs never change at runtime, so results can be cached by arguments.
import * as S from './selectors';

const cache = new Map<string, unknown>();
type Fn = (...args: never[]) => unknown;
export const q = new Proxy(S, {
  get(target, key: string) {
    const v = (target as Record<string, unknown>)[key];
    if (typeof v !== 'function') return v;
    return (...args: unknown[]) => {
      const k = key + JSON.stringify(args);
      if (!cache.has(k)) cache.set(k, (v as (...a: unknown[]) => unknown)(...args));
      return cache.get(k);
    };
  },
}) as typeof S;
export type { Fn };
