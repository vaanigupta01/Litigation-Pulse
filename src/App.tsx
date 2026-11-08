import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { go, routeKey, useApp, type Route } from './app/state';
import { JumpTo, TopBar } from './components/TopBar';
import { userById } from './lib/data';
import { About } from './views/About';
import { Dictionary } from './views/Dictionary';
import { OrgView } from './views/OrgView';
import { TeamView } from './views/TeamView';
import { UserView } from './views/UserView';

function View({ route }: { route: Route }) {
  switch (route.view) {
    case 'team': return <TeamView id={route.id} />;
    case 'user': return <UserView id={route.id} />;
    case 'dictionary': return <Dictionary focus={route.metric} />;
    case 'about': return <About />;
    default: return <OrgView />;
  }
}

const parentOf = (r: Route): string | null => {
  if (r.view === 'user') { const u = userById.get(r.id); return u ? `#/team/${u.team_id}` : '#/org'; }
  if (r.view === 'team' || r.view === 'dictionary' || r.view === 'about') return '#/org';
  return null;
};

export function App() {
  const { route, searchOpen } = useApp();
  const key = routeKey(route);
  const scrolls = useRef(new Map<string, number>());
  const prevKey = useRef(key);

  // remember scroll position per view; restore when coming back
  useLayoutEffect(() => {
    const restore = scrolls.current.get(key) ?? 0;
    if (route.view !== 'dictionary' || !route.metric) requestAnimationFrame(() => window.scrollTo({ top: restore, behavior: 'auto' }));
    prevKey.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    const on = () => scrolls.current.set(prevKey.current, window.scrollY);
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  // Esc goes up one level
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || searchOpen || document.querySelector('.is-flipped')) return;
      const p = parentOf(route);
      if (p) go(p);
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [route, searchOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
        <TopBar />
        <main id="main" className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }} exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}>
              <View route={route} />
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="mx-auto max-w-[1440px] px-4 pb-10 text-[12px] text-muted sm:px-6">
          Litigation PM Pulse · sample data for a made-up account · <a className="underline" href="#/about">How this was built</a>
        </footer>
        <JumpTo />
      </LayoutGroup>
    </MotionConfig>
  );
}
