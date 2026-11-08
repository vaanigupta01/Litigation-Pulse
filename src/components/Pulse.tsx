import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../app/state';
import type { Period } from '../lib/dates';
import { LENS_LABEL, STAGE_COLOR, TIER_LABEL, lensMatches, metric, stageOf } from '../lib/metrics';
import { q } from '../lib/q';
import { ORG, type Scope, type Status } from '../lib/selectors';
import { Chip, Delta, Sparkline, StatusPill, pc, nf } from './ui';

interface TileProps {
  id: string;
  value: ReactNode;
  unit?: string;
  context: ReactNode;
  delta?: ReactNode;
  series: (number | null)[];
  status: Status;
  big?: boolean;
  orgTick?: { label: string; team: number; org: number; max: number };
  accountWide?: boolean;
  target?: number;
}

export function PulseTile({ id, value, context, delta, series, status, big, orgTick, accountWide, target }: TileProps) {
  const { lens } = useApp();
  const m = metric(id);
  const [flip, setFlip] = useState(false);
  const color = `var(--${STAGE_COLOR[stageOf(id)]})`;
  useEffect(() => {
    if (!flip) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setFlip(false); } };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [flip]);
  if (!lensMatches(lens, m.lens)) return null;
  return (
    <div id={`card-${id}`} className={`flip scroll-mt-28 ${flip ? 'is-flipped' : ''} ${big ? 'sm:col-span-2' : ''}`} style={{ ['--pulse' as string]: color }}>
      <div className="flip-inner">
        <section className="flip-face card flex h-full flex-col p-5" aria-hidden={flip}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink"><span className="font-mono text-[11px] font-normal text-muted">{id}</span>{m.name}</div>
              {big && <div className="mt-0.5 text-[12px] text-muted">{m.question}</div>}
            </div>
            <button onClick={() => setFlip(true)} aria-label={`Why ${m.name}?`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hairline text-[13px] font-semibold text-muted hover:text-ink" style={{ fontFamily: 'var(--font-serif)' }}>i</button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <div className={`num font-semibold leading-none ${big ? 'text-[56px]' : 'text-[40px]'}`} style={big ? { color } : undefined}>{value}</div>
            <div className="pb-1.5">{delta}</div>
          </div>
          <div className="mt-1.5 text-[12px] leading-snug text-muted">{context}</div>
          <div className="mt-auto pt-3"><Sparkline data={series} color={color} height={big ? 44 : 32} target={target} /></div>
          {orgTick && (
            <div className="mt-3">
              <div className="relative h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--muted) 12%, transparent)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(1, orgTick.team / orgTick.max) * 100}%`, background: color }} />
                <div className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink" style={{ left: `${Math.min(1, orgTick.org / orgTick.max) * 100}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-muted">Org average {orgTick.label}</div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5">
            <StatusPill s={status} />
            <div className="flex gap-1">
              <Chip>{TIER_LABEL[m.tier]}</Chip>
              {accountWide && <Chip>Account-wide</Chip>}
            </div>
          </div>
        </section>
        <section className="flip-face flip-back card p-5 text-[12px]" aria-hidden={!flip}>
          <div className="flex items-start justify-between"><div className="text-[13px] font-semibold">{m.name}</div><button onClick={() => setFlip(false)} aria-label="Back" className="grid h-7 w-7 place-items-center rounded-full border border-hairline text-muted">×</button></div>
          <dl className="mt-2 space-y-2 leading-snug">
            <div><dt className="font-medium" style={{ color }}>Question it answers</dt><dd>{m.question}</dd></div>
            <div><dt className="font-medium" style={{ color }}>Why it matters</dt><dd>{m.why}</dd></div>
            <div><dt className="font-medium" style={{ color }}>If it moves, we would…</dt><dd>{m.decision}</dd></div>
            <div><dt className="font-medium" style={{ color }}>Why this chart</dt><dd>{m.chart_why}</dd></div>
          </dl>
          <p className="mt-2 text-muted">{m.definition} {LENS_LABEL[m.lens]} lens · {m.refresh}. Alert: {m.alert}.</p>
          <a href={`#/dictionary/${id}`} className="mt-1 inline-block font-medium" style={{ color }}>Full entry in dictionary →</a>
        </section>
      </div>
    </div>
  );
}

/** The five Pulse tiles. On a team view, M03 and M04 are account-wide and say so. */
export function PulseRow({ scope, period }: { scope: Scope; period: Period }) {
  const p = q.pulse(scope, period);
  const org = scope.kind === 'org' ? null : q.pulse(ORG, period);
  const hasHearings = p.M01.closeOut.total > 0;
  const isFirm = scope.kind === 'team' && scope.id.startsWith('firm-');
  const co = p.M01.closeOut;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <PulseTile id="M01" big value={hasHearings ? pc(p.M01.value) : '—'} status={hasHearings ? p.M01.status : 'info'} target={0.8}
        delta={hasHearings && <Delta now={p.M01.value} prev={p.M01.prev} />}
        context={hasHearings ? <>{co.inhouse.total > 0 && co.counsel.total > 0 && <>In-house <b className="text-ink">{pc(co.inhouse.rate)}</b> · counsel <b className="text-ink">{pc(co.counsel.rate)}</b> · </>}{co.closed} of {co.total} hearings in {period} days · target 80%</> : 'No hearings for this team'}
        series={p.M01.series} orgTick={org && hasHearings ? { label: pc(org.M01.value), team: p.M01.value, org: org.M01.value, max: 1 } : undefined} />
      <PulseTile id="M02" value={pc(p.M02.value)} status={p.M02.status} delta={<Delta now={p.M02.value} prev={p.M02.prev} />}
        context={<>{p.M02.wau.active} of {p.M02.wau.seats} seats active this week</>} series={p.M02.series}
        orgTick={org ? { label: pc(org.M02.value), team: p.M02.value, org: org.M02.value, max: 1 } : undefined} />
      <PulseTile id="M03" value={<>Day {p.M03.value}</>} status={p.M03.status} accountWide={!!org}
        delta={<Delta now={p.M03.value} prev={p.M03.prev} unit="days" invert={false} fmt={(d) => `${Math.abs(d)} days earlier`} />}
        context={<>October limit of {nf(6000)} credits · September day {p.M03.prev} · November on course for day {p.M03.run.projected}</>} series={p.M03.series} />
      <PulseTile id="M04" value={pc(p.M04.value)} status={p.M04.status} accountWide={!!org} delta={<Delta now={p.M04.value} prev={p.M04.prev} />}
        context={<>{p.M04.sync.worst.court}s, the worst court type · High Courts {pc(p.M04.sync.byCourt.find((c) => c.court === 'High Court')!.rate)}</>} series={p.M04.series} target={0.95} />
      <PulseTile id="M05" value={nf(p.M05.value)} status="info" delta={<Delta now={p.M05.value} prev={p.M05.prev} unit="n" />}
        context={scope.kind === 'org' ? <>{p.M05.am.byBu.map((b) => `${b.short} ${b.count}`).join(' · ')}</> : isFirm ? <>Live cases assigned to this firm</> : <>Live cases this unit is responsible for</>} series={p.M05.series}
        orgTick={org && !isFirm ? { label: `${nf(Math.round(org.M05.value / 4))} per business unit`, team: p.M05.value, org: org.M05.value / 4, max: Math.max(p.M05.value, org.M05.value / 4) * 1.2 } : undefined} />
    </div>
  );
}
