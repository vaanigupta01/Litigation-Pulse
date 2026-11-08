import { useEffect, useState } from 'react';
import { STAGE_COLOR, type Stage } from '../lib/metrics';

export interface NavItem { id: string; title: string }
const go = (id: string) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

function useActive(items: NavItem[]) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id.replace('section-', ''));
    }, { rootMargin: '-20% 0px -70% 0px' });
    items.forEach((i) => { const el = document.getElementById(`section-${i.id}`); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [items]);
  return active;
}

export function SectionNav({ items }: { items: NavItem[] }) {
  const active = useActive(items);
  return (
    <nav aria-label="Sections" className="sticky top-28 hidden w-[168px] shrink-0 self-start pt-10 lg:block">
      <ul className="space-y-0.5 text-[13px]">
        {items.map((i) => (
          <li key={i.id}>
            <button onClick={() => go(i.id)} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition ${active === i.id ? 'bg-surface font-medium text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--${STAGE_COLOR[i.id as Stage] ?? 'muted'})`, opacity: active === i.id ? 1 : 0.55 }} />
              {i.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SectionChips({ items }: { items: NavItem[] }) {
  const active = useActive(items);
  return (
    <div className="sticky top-[118px] z-30 -mx-4 overflow-x-auto bg-canvas/90 px-4 py-2 backdrop-blur lg:hidden">
      <div className="flex w-max gap-1.5">
        {items.map((i) => (
          <button key={i.id} onClick={() => go(i.id)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${active === i.id ? 'border-ink bg-ink text-canvas' : 'border-hairline bg-surface text-muted'}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--${STAGE_COLOR[i.id as Stage] ?? 'muted'})` }} />{i.title}
          </button>
        ))}
      </div>
    </div>
  );
}
