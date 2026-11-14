import { Command } from 'cmdk';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { go, useApp, type Lens } from '../app/state';
import { account, teamById, userById } from '../lib/data';
import { AS_OF_LABEL, type Period } from '../lib/dates';
import { defaultPerson, searchIndex, type Level } from '../lib/selectors';
import type { Role } from '../lib/types';

function crumbs(route: ReturnType<typeof useApp>['route']) {
  const c: { id: string; label: string; href: string }[] = [{ id: 'org', label: account.short, href: '#/org' }];
  if (route.view === 'team') { const t = teamById.get(route.id); if (t) c.push({ id: t.id, label: t.name, href: `#/team/${t.id}` }); }
  if (route.view === 'user') {
    const u = userById.get(route.id);
    if (u) { const t = teamById.get(u.team_id)!; c.push({ id: t.id, label: t.name, href: `#/team/${t.id}` }, { id: u.id, label: u.name, href: `#/user/${u.id}` }); }
  }
  if (route.view === 'dictionary') c.push({ id: 'dictionary', label: 'Metric dictionary', href: '#/dictionary' });
  if (route.view === 'about') c.push({ id: 'about', label: 'About', href: '#/about' });
  return c;
}

export function Breadcrumb() {
  const { route } = useApp();
  const c = crumbs(route);
  return (
    <nav aria-label="Drill path" className="flex min-w-0 items-center gap-1.5 text-[13px]">
      {c.map((x, i) => (
        <span key={x.id} className="flex min-w-0 items-center gap-1.5">
          {i > 0 && <span className="text-muted/60" aria-hidden>›</span>}
          {i === c.length - 1 ? (
            <motion.span layoutId={`title-${x.id}`} className="truncate font-semibold text-ink" aria-current="page">{x.label}</motion.span>
          ) : (
            <a href={x.href} className={`truncate text-muted transition hover:text-ink ${i === 0 && c.length > 2 ? 'hidden md:inline' : ''}`}>{x.label}</a>
          )}
        </span>
      ))}
    </nav>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-hairline bg-surface p-0.5 text-[12px]">
      {options.map(([v, l]) => (
        <button key={String(v)} role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`rounded-full px-2.5 py-1 font-medium transition ${value === v ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  );
}

const LOGO = 'https://legistify.com/blogs/wp-content/uploads/2025/03/legistify-icon.svg';
/** Legistify's icon, loaded from their site; falls back to a plain monogram if it cannot load. */
function Logo() {
  const [ok, setOk] = useState(true);
  return ok ? <img src={LOGO} alt="Legistify" width={28} height={28} className="h-7 w-7 object-contain" onError={() => setOk(false)} /> : (
    <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-ink" aria-hidden><span className="serif text-[19px] leading-none text-canvas">L</span></span>
  );
}

export function TopBar() {
  const { period, setPeriod, lens, setLens, theme, toggleTheme, openSearch, route } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <a href="#/org" className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Litigation <span className="text-muted">·</span> PM Pulse</span>
          <span className="hidden rounded-md border border-hairline px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">Legistify sample</span>
        </a>
        <div className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1 lg:px-4"><Breadcrumb /></div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Seg<Period> label="Period" value={period} onChange={setPeriod} options={[[30, '30d'], [90, '90d'], [180, '180d']]} />
          <Seg<Lens> label="Lens" value={lens} onChange={setLens} options={[['all', 'All'], ['business', 'Business'], ['tech', 'Tech & AI']]} />
          <button onClick={() => openSearch('all')} className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[12px] text-muted hover:text-ink">
            Jump to… <kbd className="hidden rounded border border-hairline px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
          </button>
          <a href={route.view === 'user' ? `#/user/${route.id}` : `#/user/${defaultPerson().id}`} className="hidden text-[12px] font-medium text-muted hover:text-ink xl:inline">People</a>
          <a href="#/dictionary" className="text-[12px] font-medium text-muted hover:text-ink">Dictionary</a>
          <a href="#/about" className="text-[12px] font-medium text-muted hover:text-ink">About</a>
          <button onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface text-muted hover:text-ink">
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            )}
          </button>
        </div>
      </div>
      <div className="border-t border-hairline/60">
        <div className="mx-auto max-w-[1440px] px-4 py-1 font-mono text-[10.5px] text-muted sm:px-6">Sample data · {AS_OF_LABEL} · refreshed daily · {account.name} is a made-up account</div>
      </div>
    </header>
  );
}

export function JumpTo() {
  const { searchOpen, setSearchOpen, searchLevel, openSearch } = useApp();
  const items = useMemo(() => searchIndex(), []);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openSearch('all'); }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [openSearch]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [level, setLevel] = useState<'all' | Level>('all');
  const [role, setRole] = useState<'all' | Role>('all');
  useEffect(() => { setLevel(searchOpen ? searchLevel : 'all'); setRole('all'); }, [searchOpen, searchLevel]);
  const count = (l: Level) => items.filter((i) => i.level === l).length;
  const shown = items.filter((i) => (level === 'all' || i.level === level) && (level !== 'user' || role === 'all' || i.role === role));
  const tabs: ['all' | Level, string, number][] = [['all', 'All', items.length], ['org', 'Organisation', count('org')], ['team', 'Teams', count('team')], ['user', 'Users', count('user')]];
  const groups: [Level, string][] = [['org', 'Organisation'], ['team', 'Teams'], ['user', 'Users']];
  const pill = (on: boolean) => `rounded-full border px-2.5 py-1 text-[12px] transition ${on ? 'border-ink bg-ink font-medium text-canvas' : 'border-hairline text-muted hover:text-ink'}`;
  return (
    <Command.Dialog open={searchOpen} onOpenChange={setSearchOpen} label="Jump to the organisation, a team or a user" className="fixed inset-0 z-50 grid place-items-start justify-center bg-ink/20 px-4 pt-[12vh] backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
      <div className="glass w-[min(600px,92vw)] overflow-hidden !rounded-2xl !bg-surface">
        <Command.Input ref={inputRef} autoFocus placeholder="Jump to the organisation, a team or a user…" className="w-full border-b border-hairline bg-transparent px-4 py-3 text-[14px] text-ink outline-none placeholder:text-muted" />
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-3 py-2" role="tablist" aria-label="Level">
          {tabs.map(([k, l, n]) => <button key={k} role="tab" aria-selected={level === k} onClick={() => { setLevel(k); inputRef.current?.focus(); }} className={pill(level === k)}>{l} <span className="num opacity-60">{n}</span></button>)}
        </div>
        {level === 'user' && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-3 py-2" aria-label="Role">
            {(['all', 'Admin', 'Legal', 'Business', 'Lawyer'] as const).map((r) => <button key={r} onClick={() => { setRole(r); inputRef.current?.focus(); }} className={pill(role === r)}>{r === 'all' ? 'All roles' : r}</button>)}
          </div>
        )}
        <Command.List className="max-h-[46vh] overflow-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted">No match.</Command.Empty>
          {groups.filter(([g]) => shown.some((i) => i.level === g)).map(([g, heading]) => (
            <Command.Group key={g} heading={heading} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted">
              {shown.filter((i) => i.level === g).map((i) => (
                <Command.Item key={i.id} value={`${i.label} ${i.sub}`} onSelect={() => { setSearchOpen(false); go(i.href); }} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] data-[selected=true]:bg-canvas">
                  <LevelTag level={i.level} />
                  <span className="text-ink">{i.label}</span><span className="ml-auto text-[11px] text-muted">{i.sub}</span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

const LEVEL: Record<Level, [string, string]> = { org: ['Org', 'hearing'], team: ['Team', 'intake'], user: ['User', 'enrich'] };
function LevelTag({ level }: { level: Level }) {
  const [label, c] = LEVEL[level];
  return <span className="w-11 shrink-0 rounded-md py-0.5 text-center text-[10px] font-medium" style={{ color: `var(--${c})`, background: `color-mix(in srgb, var(--${c}) 12%, transparent)` }}>{label}</span>;
}

/** Where a page sits in the organisation → team → user path. Shown at the top of team and user pages. */
export function LevelPath({ level, teamHref }: { level: 'team' | 'user'; teamHref?: string }) {
  const steps: [Level, string, string | undefined][] = [['org', 'Organisation', '#/org'], ['team', 'Team', level === 'user' ? teamHref : undefined], ['user', 'User', undefined]];
  return (
    <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-hairline bg-surface p-1 text-[12px]" aria-label={`${level === 'team' ? 'Team' : 'User'} view`}>
      {steps.map(([k, l, href], i) => {
        const on = k === level;
        const cls = `rounded-full px-2.5 py-0.5 ${on ? 'bg-ink font-medium text-canvas' : href ? 'text-muted hover:text-ink' : 'text-muted/50'}`;
        return (
          <span key={k} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted/50" aria-hidden>›</span>}
            {href && !on ? <a href={href} className={cls}>{l}</a> : <span className={cls} aria-current={on ? 'page' : undefined}>{on ? `${l} view` : l}</span>}
          </span>
        );
      })}
    </div>
  );
}
