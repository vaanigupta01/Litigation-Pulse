import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../app/state';
import { DEFINITION_NOTES, LENS_LABEL, STAGE_COLOR, TIER_LABEL, lensMatches, metric, stageOf, USER_ONLY } from '../lib/metrics';
import { Chip } from './ui';

interface Props {
  id: string; // metric id (M01..M27) or U01..U03
  children: ReactNode;
  className?: string;
  /** Override the subtitle (default: the metric's question) */
  caption?: string;
  /** Headline numbers shown at the top of the card */
  headline?: ReactNode;
  note?: ReactNode; // small context line under the chart
  drillable?: boolean;
  scopeLabel?: string;
}

/** Every chart lives in one of these: title, question caption, flip-to-rationale, tier and lens chips. */
export function ChartCard({ id, children, className = '', caption, headline, note, drillable, scopeLabel }: Props) {
  const { lens } = useApp();
  const [flipped, setFlipped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
  const name = m?.name ?? u!.name;
  const question = caption ?? m?.question ?? u!.question;
  const back = m
    ? [
        ['Question it answers', m.question],
        ['Why it matters', m.why],
        ['If it moves, we would…', m.decision],
        ['Why this chart', `${m.chart}. ${m.chart_why}`],
      ]
    : [['Question it answers', u!.question], ['Why this chart', `${u!.chart}. ${u!.chart_why}`]];
  return (
    <div id={`card-${id}`} ref={ref} className={`flip min-w-0 scroll-mt-28 ${flipped ? 'is-flipped' : ''} ${className}`} style={{ ['--pulse' as string]: color }} data-card>
      <div className="flip-inner">
        <section className="flip-face card flex h-full flex-col p-5 sm:p-6" aria-hidden={flipped}>
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-snug text-ink">
                <span className="mr-2 font-mono text-[11px] font-normal text-muted">{id}</span>
                {name}
                {scopeLabel && <span className="ml-2 text-[12px] font-normal text-muted">· {scopeLabel}</span>}
              </h3>
              <p className="mt-1 text-[13px] leading-snug text-muted">{question}</p>
            </div>
            <button onClick={() => setFlipped(true)} aria-label={`Why ${name}? Show rationale`} title="Why this metric" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline text-[13px] font-semibold text-muted transition hover:text-ink" style={{ fontFamily: 'var(--font-serif)' }}>
              i
            </button>
          </header>
          {headline && <div className="mt-4">{headline}</div>}
          <div className="mt-4 min-h-0 flex-1">{children}</div>
          {note && <div className="mt-3 text-[12px] leading-snug text-muted">{note}</div>}
          <footer className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {m && <Chip color={m.tier === 'north-star' ? color : undefined}>{TIER_LABEL[m.tier]}</Chip>}
              {m && <Chip>{LENS_LABEL[m.lens]}</Chip>}
              {drillable && <Chip>Click a mark to drill in</Chip>}
            </div>
            <span className="text-[11px] text-muted">{m ? (m.refresh.startsWith('Daily') ? 'Updated daily' : `Updated ${m.refresh.toLowerCase()}`) : 'Updated daily'}</span>
          </footer>
        </section>
        <section className="flip-face flip-back card p-5 sm:p-6" aria-hidden={!flipped}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold"><span className="mr-2 font-mono text-[11px] font-normal text-muted">{id}</span>{name}</h3>
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
