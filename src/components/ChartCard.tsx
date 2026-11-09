import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../app/state';
import { CARD_LINE, DEFINITION_NOTES, STAGE_COLOR, lensMatches, metric, stageOf, USER_ONLY } from '../lib/metrics';
import { WindowChip } from './ui';

interface Props {
  id: string; // metric id (M01..M27) or U01..U03
  children: ReactNode;
  className?: string;
  /** Replaces the metric name when a view shows a second cut of the same metric */
  title?: string;
  /** Headline numbers shown at the top of the card */
  headline?: ReactNode;
  note?: ReactNode; // one line of insight under the chart
  scopeLabel?: string;
  /** DOM anchor; defaults to card-<id>. Set when a view shows the same metric twice. */
  anchor?: string;
  /** "Break it down": the pattern behind the number, opened inside the same card */
  more?: ReactNode;
}

/** Every chart lives in one of these. The front stays quiet; the "i" flip carries the rationale, window and refresh. */
export function ChartCard({ id, children, className = '', title, headline, note, scopeLabel, anchor, more }: Props) {
  const { lens, period } = useApp();
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const m = id.startsWith('U') ? null : metric(id);
  const u = id.startsWith('U') ? USER_ONLY.find((x) => x.id === id)! : null;
  const color = `var(--${STAGE_COLOR[m ? stageOf(id) : 'pulse']})`;
  useEffect(() => {
    if (!flipped) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setFlipped(false); } };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [flipped]);
  if (m && !lensMatches(lens, m.lens)) return null;
  const name = title ?? m?.name ?? u!.name;
  const back = m
    ? [
        ['Question it answers', m.question],
        ['Why it matters', m.why],
        ['If it moves, we would…', m.decision],
        ['Why this chart', `${m.chart}. ${m.chart_why}`],
      ]
    : [['Question it answers', u!.question], ['Why this chart', `${u!.chart}. ${u!.chart_why}`]];
  return (
    <div id={anchor ?? `card-${id}`} className={`flip min-w-0 scroll-mt-28 ${flipped ? 'is-flipped' : ''} ${className}`} style={{ ['--pulse' as string]: color }} data-card>
      <div className="flip-inner">
        <section className="flip-face card flex h-full flex-col p-5 sm:p-6" aria-hidden={flipped}>
          <header className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-ink">
              {name}
              {scopeLabel && <span className="ml-2 text-[12px] font-normal text-muted">· {scopeLabel}</span>}
            </h3>
            <button onClick={() => setFlipped(true)} aria-label={`About ${name}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline text-[13px] font-semibold text-muted transition hover:text-ink" style={{ fontFamily: 'var(--font-serif)' }}>
              i
            </button>
          </header>
          {headline && <div className="mt-3">{headline}</div>}
          <div className="mt-4 min-h-0 flex-1">{children}</div>
          {note && <div className="mt-3 text-[12px] leading-snug text-muted">{note}</div>}
          {more && (
            <div className="mt-4">
              <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color }}>
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 160ms' }}><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                Break it down
              </button>
              {open && <div className="mt-3 rounded-xl border border-hairline bg-surface-2 p-4">{more}</div>}
            </div>
          )}
        </section>
        <section className="flip-face flip-back card p-5 sm:p-6" aria-hidden={!flipped}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold">{name}</h3>
            <button onClick={() => setFlipped(false)} aria-label="Back to chart" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline text-[14px] text-muted hover:text-ink">×</button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {back.map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>{k}</div>
                <p className="mt-0.5 text-[13px] leading-snug text-ink">{v}</p>
              </div>
            ))}
          </div>
          {m && (
            <div className="mt-4 space-y-1.5 border-t border-hairline pt-3 text-[12px] text-muted">
              <p><span className="font-medium text-ink">Definition.</span> {m.definition}</p>
              {DEFINITION_NOTES[id] && <p><span className="font-medium text-ink">Note.</span> {DEFINITION_NOTES[id]}</p>}
              <p className="font-mono text-[11px]">{m.formula}</p>
              <p><span className="font-medium text-ink">Refresh.</span> {m.refresh} · <span className="font-medium text-ink">Alert.</span> {m.alert}</p>
              <a href={`#/dictionary/${id}`} className="inline-block pt-1 font-medium" style={{ color }}>Full entry in dictionary →</a>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5"><WindowChip id={id} period={period} line={CARD_LINE.has(id)} /></div>
        </section>
      </div>
    </div>
  );
}

/** Smooth-scroll to a card and pulse its border twice. */
export function showMe(id: string) {
  const el = document.getElementById(`card-${id}`);
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  const face = el.querySelector('.card');
  face?.classList.remove('pulse');
  setTimeout(() => { face?.classList.add('pulse'); setTimeout(() => face?.classList.remove('pulse'), 1600); }, reduce ? 0 : 450);
}
