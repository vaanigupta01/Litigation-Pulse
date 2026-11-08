import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Period } from '../lib/dates';

export type Lens = 'all' | 'business' | 'tech';
export type Route =
  | { view: 'org' }
  | { view: 'team'; id: string }
  | { view: 'user'; id: string }
  | { view: 'dictionary'; metric?: string }
  | { view: 'about' };

export function parseHash(h: string): Route {
  const p = h.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (p[0] === 'team' && p[1]) return { view: 'team', id: p[1] };
  if (p[0] === 'user' && p[1]) return { view: 'user', id: p[1] };
  if (p[0] === 'dictionary') return { view: 'dictionary', metric: p[1] };
  if (p[0] === 'about') return { view: 'about' };
  return { view: 'org' };
}
export const routeKey = (r: Route) => (r.view === 'team' || r.view === 'user' ? `${r.view}/${r.id}` : r.view);

function readStore<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage can be blocked; the app works without it */
  }
}

interface Ctx {
  route: Route;
  period: Period;
  setPeriod: (p: Period) => void;
  lens: Lens;
  setLens: (l: Lens) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  const [period, setPeriodS] = useState<Period>(() => readStore('lp.period', 30));
  const [lens, setLensS] = useState<Lens>(() => readStore('lp.lens', 'all'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readStore('lp.theme', 'light'));
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    addEventListener('hashchange', on);
    if (!location.hash) history.replaceState(null, '', '#/org');
    return () => removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStore('lp.theme', theme);
  }, [theme]);
  const setPeriod = useCallback((p: Period) => { setPeriodS(p); writeStore('lp.period', p); }, []);
  const setLens = useCallback((l: Lens) => { setLensS(l); writeStore('lp.lens', l); }, []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
  const v = useMemo(() => ({ route, period, setPeriod, lens, setLens, theme, toggleTheme, searchOpen, setSearchOpen }), [route, period, setPeriod, lens, setLens, theme, toggleTheme, searchOpen]);
  return <AppCtx.Provider value={v}>{children}</AppCtx.Provider>;
}
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider missing');
  return c;
}
export const go = (href: string) => { location.hash = href.replace(/^#/, ''); };

/** Resolved colour tokens for SVG charts (Recharts writes attributes, which cannot read CSS variables). */
export type Tokens = Record<'ink' | 'muted' | 'hairline' | 'surface' | 'quiet' | 'intake' | 'enrich' | 'hearing' | 'ai' | 'value' | 'health' | 'adoption' | 'good' | 'watch' | 'act', string>;
export function useTokens(): Tokens {
  const { theme } = useApp();
  return useMemo(() => {
    document.documentElement.dataset.theme = theme;
    const cs = getComputedStyle(document.documentElement);
    const g = (k: string) => cs.getPropertyValue('--' + k).trim();
    return Object.fromEntries(['ink', 'muted', 'hairline', 'surface', 'quiet', 'intake', 'enrich', 'hearing', 'ai', 'value', 'health', 'adoption', 'good', 'watch', 'act'].map((k) => [k, g(k)])) as Tokens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/** True below 640 px wide; charts drop secondary labels. */
export function useNarrow(): boolean {
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const on = () => setN(window.innerWidth < 640);
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return n;
}
