import {
  Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, LineChart, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import { go, useApp, useNarrow, useTokens } from '../app/state';
import { Bar, nf, pc, Sparkline } from '../components/ui';
import { toDay, type Period } from '../lib/dates';
import { q } from '../lib/q';
import { ORG, teamScope, type Scope } from '../lib/selectors';
import { anim, axisProps, EndLabel, gridProps, Tip, type LP } from './common';

const pctTick = (v: number) => `${Math.round(v * 100)}%`;
/** Tooltip title for a trend point: 7-day window (30d view) or a week. */
const ptTitle = (period: Period, label: unknown) => (period === 30 ? `7 days to ${label}` : `Week of ${label}`);
const hl = (t: ReturnType<typeof useTokens>, focus: string, on: boolean) => (on ? focus : t.quiet);

// ------------------------------------------------------------------ M01
export function CloseOutTrend({ scope, height = 240 }: { scope: Scope; height?: number }) {
  const t = useTokens();
  const { period } = useApp();
  const data = q.closeOutTrend(scope, period).filter((d) => d.n > 0);
  const n = data.length;
  const aug = period === 30 ? undefined : data.find((d) => d.week === '27 Jul')?.week;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 72, bottom: 0, left: -18 }}>
        <CartesianGrid {...gridProps(t)} />
        <ReferenceArea y1={0.8} y2={1} fill={t.good} fillOpacity={0.06} />
        <ReferenceLine y={0.8} stroke={t.muted} strokeDasharray="4 4" label={{ value: 'Target 80%', position: 'insideTopLeft', fill: t.muted, fontSize: 11 }} />
        {scope.kind === 'org' && aug && <ReferenceLine x={aug} stroke={t.hairline} label={{ value: 'Mehra takes over S&D, 1 Aug', position: 'insideBottomLeft', fill: t.muted, fontSize: 10 }} />}
        <XAxis dataKey="week" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis domain={[0, 1]} tickFormatter={pctTick} {...axisProps(t)} ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Tooltip cursor={{ stroke: t.hairline }} content={<Tip render={(p) => ({ title: ptTitle(period, p.week), rows: [['All hearings', pc(p.all as number), t.hearing], ['In-house', pc(p.inhouse as number), t.muted], ['Counsel', pc(p.counsel as number), t.muted], ['Hearings', String(p.n)]] })} />} />
        <Line dataKey="inhouse" stroke={t.muted} strokeOpacity={0.55} strokeWidth={1.5} dot={false} connectNulls {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text="In-house" color={t.muted} dy={-4} />} />
        <Line dataKey="counsel" stroke={t.muted} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text="Counsel" color={t.muted} dy={6} />} />
        <Line dataKey="all" stroke={t.hearing} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} connectNulls {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text="All" color={t.hearing} />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M02 bullet bars
export function WauBullets({ scope }: { scope: Scope }) {
  const w = q.wau(scope);
  return (
    <div className="space-y-3">
      {w.byRole.map((r) => (
        <div key={r.role} className="grid grid-cols-[72px_1fr_92px] items-center gap-3 text-[13px]">
          <span className="text-muted">{r.role}</span>
          <div className="relative">
            <Bar value={r.active} max={r.seats} color={r.rate < 0.3 ? 'var(--act)' : 'var(--adoption)'} height={12} />
            <span className="absolute top-[-3px] h-[18px] w-px bg-muted/60" style={{ left: '30%' }} title="30% alert line" />
          </div>
          <span className="num text-right"><b className="font-semibold">{r.active}</b><span className="text-muted"> of {r.seats} · {pc(r.rate)}</span></span>
        </div>
      ))}
      <div className="flex items-center gap-2 pl-[84px] text-[11px] text-muted"><span className="h-3 w-px bg-muted/60" /> Alert line at 30% of seats</div>
    </div>
  );
}

// ------------------------------------------------------------------ M03 credit runway
export function CreditRunway({ height = 240, mini = false }: { height?: number; mini?: boolean }) {
  const t = useTokens();
  const narrow = useNarrow();
  const r = q.creditRunway();
  const rows = Array.from({ length: 31 }, (_, i) => {
    const o: Record<string, number | null> = { day: i + 1 };
    r.byMonth.forEach((m) => (o[m.month] = m.limitDay && i + 1 > m.limitDay ? null : (m.series[i] ?? null)));
    return o;
  });
  const color = (m: string) => (m === 'Oct' ? t.ai : m === 'Nov' ? t.ai : t.quiet);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={mini ? { top: 6, right: 6, bottom: 0, left: 6 } : { top: 12, right: 64, bottom: 0, left: -6 }}>
        {!mini && <CartesianGrid {...gridProps(t)} />}
        <ReferenceLine y={r.limit} stroke={t.ink} strokeDasharray="4 4" label={mini ? undefined : { value: 'Monthly limit 6,000', position: 'insideTopLeft', fill: t.muted, fontSize: 11 }} />
        <XAxis dataKey="day" hide={mini} {...axisProps(t)} ticks={[1, 8, 15, 22, 29]} tickFormatter={(d) => `Day ${d}`} />
        <YAxis hide={mini} {...axisProps(t)} tickFormatter={(v) => `${v / 1000}k`} domain={[0, 6600]} ticks={[0, 2000, 4000, 6000]} />
        {!mini && <Tooltip content={<Tip render={(p) => ({ title: `Day ${p.day}`, rows: r.byMonth.filter((m) => p[m.month] !== null).map((m) => [m.month, nf(p[m.month] as number), color(m.month)]) as [string, string, string][] })} />} />}
        {r.byMonth.map((m) => {
          const lastIdx = m.limitDay ? m.limitDay - 1 : m.series.reduce<number>((a, v, i) => (v !== null ? i : a), 0);
          const label = m.limitDay ? `${m.month} · day ${m.limitDay}` : m.partial ? `${m.month} so far` : `${m.month} · ${nf(m.used)}`;
          return (
            <Line key={m.month} dataKey={m.month} stroke={color(m.month)} strokeWidth={m.month === 'Oct' ? 2.25 : 1.5} strokeDasharray={m.month === 'Nov' ? '4 3' : undefined} connectNulls={false} {...anim}
              label={mini || (narrow && m.month !== 'Oct' && m.month !== 'Nov' && m.month !== 'Jun') ? undefined : (p: LP) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={lastIdx + 1} text={label} dy={m.limitDay ? -14 : 0} color={m.month === 'Oct' || m.month === 'Nov' ? t.ai : t.muted} />}
              dot={m.limitDay ? (p: { cx?: number; cy?: number; index?: number }) => (p.index === lastIdx ? <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={color(m.month)} stroke={t.surface} strokeWidth={2} /> : <g key={p.index} />) : false} />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M04 sync freshness
export function SyncBars() {
  const s = q.syncFreshness();
  const rows = [...s.byCourt].sort((a, b) => a.rate - b.rate);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.court} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-[13px]">
          <span className="truncate text-muted">{r.court}</span>
          <div className="relative">
            <Bar value={r.rate} max={1} color={r.rate < 0.85 ? 'var(--health)' : 'var(--quiet)'} height={12} />
            <span className="absolute top-[-3px] h-[18px] w-px bg-ink/60" style={{ left: '95%' }} />
          </div>
          <span className="num text-right font-medium">{pc(r.rate)}</span>
        </div>
      ))}
      <div className="flex justify-between pl-[122px] text-[11px] text-muted"><span>Sync failure rate {pc(s.failureRate, 1)} of runs</span><span>| Target 95%</span></div>
    </div>
  );
}

// ------------------------------------------------------------------ M06 stickiness
export function StickinessBars({ scope }: { scope: Scope }) {
  const rows = q.stickiness(scope);
  const max = Math.max(0.6, ...rows.map((r) => r.rate));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 text-[13px]">
          <span className={r.rate < 0.05 ? 'text-act' : 'text-muted'}>{r.label}{r.rate < 0.05 && <span className="ml-1 text-[10px]">under 5%</span>}</span>
          <div className="relative"><Bar value={r.rate} max={max} color={r.rate < 0.05 ? 'var(--quiet)' : 'var(--adoption)'} height={10} /><span className="absolute top-[-3px] h-4 w-px bg-ink/50" style={{ left: `${(0.05 / max) * 100}%` }} /></div>
          <span className="num text-right font-medium">{pc(r.rate)}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ M07 time to first value
export function TtfvDots({ scope }: { scope: Scope }) {
  const rows = q.timeToFirstValue(scope).filter((r) => r.n > 0);
  const max = Math.max(30, ...rows.map((r) => r.q3)) * 1.1;
  return (
    <div className="space-y-4 pt-2">
      {rows.map((r) => (
        <div key={r.role} className="grid grid-cols-[72px_1fr_96px] items-center gap-3 text-[13px]">
          <span className="text-muted">{r.role}</span>
          <div className="relative h-4">
            <div className="absolute top-1/2 h-px w-full bg-hairline" />
            <div className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ left: `${(r.q1 / max) * 100}%`, width: `${Math.max(1, ((r.q3 - r.q1) / max) * 100)}%`, background: 'color-mix(in srgb, var(--adoption) 35%, transparent)' }} />
            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface" style={{ left: `${(r.median / max) * 100}%`, background: r.median > 10 ? 'var(--adoption)' : 'var(--quiet)' }} />
          </div>
          <span className="num text-right"><b>{r.median}</b><span className="text-muted"> {r.median === 1 ? 'day' : 'days'}</span></span>
        </div>
      ))}
      <div className="flex justify-between pl-[84px] pr-[108px] text-[11px] text-muted"><span>0</span><span>Line = middle half of people</span><span>{Math.round(max)} d</span></div>
    </div>
  );
}

// ------------------------------------------------------------------ M08 funnel
export function IntakeFunnel() {
  const f = q.intakeFunnel();
  const rows = [
    { label: 'Suggested', v: f.suggested, drop: null as null | [string, number] },
    { label: 'Reviewed', v: f.reviewed, drop: ['Expired unread', f.expired] as [string, number] },
    { label: 'Accepted', v: f.accepted, drop: ['Deleted as false match', f.deleted] as [string, number] },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.label}>
          {r.drop && (
            <div className="mb-1 ml-[96px] flex items-center gap-2 text-[11px] text-muted">
              <span>↘ {r.drop[0]}</span><b className="num text-ink">{nf(r.drop[1])}</b><span>({pc(r.drop[1] / rows[i - 1].v)} of previous step)</span>
            </div>
          )}
          <div className="grid grid-cols-[84px_1fr_56px] items-center gap-3 text-[13px]">
            <span className="text-muted">{r.label}</span>
            <div className="h-6 rounded-md" style={{ width: `${(r.v / f.suggested) * 100}%`, background: i === 2 ? 'var(--intake)' : `color-mix(in srgb, var(--intake) ${i === 0 ? 30 : 55}%, transparent)` }} />
            <span className="num text-right font-semibold">{nf(r.v)}</span>
          </div>
        </div>
      ))}
      <div className="pl-[96px] text-[11px] text-muted">Accepted = {f.added} added as new cases + {f.mapped} mapped to existing ones</div>
    </div>
  );
}

// ------------------------------------------------------------------ M09 precision
export function PrecisionBars() {
  const p = q.intakePrecision();
  return (
    <div className="space-y-3">
      {[...p.rows].sort((a, b) => a.precision - b.precision).map((r) => (
        <div key={r.id} className="grid grid-cols-[136px_1fr_44px] items-center gap-3 text-[13px]">
          <span className="leading-tight text-muted">{r.label}<br /><span className="text-[11px]">{nf(r.suggested)} suggested · {nf(r.reviewed)} reviewed</span></span>
          <div className="relative"><Bar value={r.precision} max={1} color={r.precision < 0.25 ? 'var(--intake)' : 'var(--quiet)'} height={12} /><span className="absolute top-[-3px] h-[18px] w-px bg-ink/50" style={{ left: '25%' }} /></div>
          <span className="num text-right font-medium">{pc(r.precision)}</span>
        </div>
      ))}
      <div className="flex justify-between pl-[148px] text-[11px] text-muted"><span>| Alert line 25%</span><span>Overall {pc(p.overall)}</span></div>
    </div>
  );
}

// ------------------------------------------------------------------ generic BU bars (M10, M22, M23, M24)
type BuRow = { id: string; short: string; name: string; rate: number; a: number; b: number };
export function BuBars({ rows, color, target, targetLabel, highlight, unit, height = 200, max = 1, colorAll }: { rows: BuRow[]; color: string; target?: number; targetLabel?: string; highlight?: string; unit: (r: BuRow) => string; height?: number; max?: number; colorAll?: boolean }) {
  const t = useTokens();
  const c = (t as Record<string, string>)[color];
  const ticks = max === 1 ? [0, 0.25, 0.5, 0.75, 1] : [0, max / 2, max];
  return (
    <div>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 18, right: 8, bottom: 0, left: -18 }} barCategoryGap="28%">
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="short" {...axisProps(t)} />
        <YAxis domain={[0, max]} tickFormatter={pctTick} {...axisProps(t)} ticks={ticks} />
        {target !== undefined && <ReferenceLine y={target} stroke={t.ink} strokeDasharray="4 4" />}
        <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: String(p.name), rows: [['Rate', pc(p.rate as number), c], ['Count', unit(p as unknown as BuRow)]], foot: 'Click to open' })} />} />
        <RBar dataKey="rate" radius={[4, 4, 0, 0]} className="drill-mark" onClick={(d: { payload?: BuRow }) => d.payload && go(`#/team/${d.payload.id}`)} {...anim}>
          {rows.map((r) => <Cell key={r.id} fill={highlight ? (r.id === highlight ? c : t.quiet) : colorAll || target === undefined || r.rate < target ? c : t.quiet} />)}
          <LabelList dataKey="rate" position="top" formatter={(v: unknown) => pctTick(v as number)} style={{ fill: t.ink, fontSize: 11, fontWeight: 600 }} />
        </RBar>
      </BarChart>
    </ResponsiveContainer>
    {targetLabel && <div className="mt-1 flex items-center gap-1.5 pl-6 text-[11px] text-muted"><span className="w-4 border-t border-dashed border-ink" />{targetLabel}</div>}
    </div>
  );
}
export function EarlyCaptureBars({ highlight }: { highlight?: string }) {
  const e = q.earlyCapture(ORG);
  return <BuBars rows={e.byBu.map((b) => ({ ...b, a: b.early, b: b.total }))} color="intake" target={0.75} targetLabel="Target 75%" highlight={highlight} unit={(r) => `${r.a} of ${r.b} new cases`} />;
}
export function AlertBars({ period, highlight }: { period: Period; highlight?: string }) {
  const a = q.alertFollowThrough(ORG, period);
  return <BuBars rows={a.byBu.map((b) => ({ ...b, a: b.viewed, b: b.sent }))} color="value" target={0.2} targetLabel="Alert below 20%" highlight={highlight} unit={(r) => `${r.a} of ${r.b} alerts`} />;
}
export function SpendBars({ highlight }: { highlight?: string }) {
  const s = q.spendCapture(ORG);
  return <BuBars rows={s.byBu.map((b) => ({ ...b, a: b.captured, b: b.total }))} color="value" highlight={highlight} unit={(r) => `${r.a} of ${r.b} active cases`} height={190} max={0.5} />;
}
export function ContractBars({ highlight }: { highlight?: string }) {
  const c = q.contractShare(ORG);
  return <BuBars rows={c.byBu.map((b) => ({ ...b, a: b.contract, b: b.total }))} color="value" target={c.rate} targetLabel={`Account average ${pc(c.rate)}`} highlight={highlight} colorAll unit={(r) => `${r.a} of ${r.b} active cases`} />;
}

// ------------------------------------------------------------------ M11 dumbbell
export function Dumbbell({ scope }: { scope: Scope }) {
  const f = q.fieldCompleteness(scope);
  if (!f.total) return <p className="text-[13px] text-muted">No cases added in the last 90 days.</p>;
  const max = 1;
  return (
    <div className="space-y-3.5 pt-1">
      {f.rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[104px_1fr_84px] items-center gap-3 text-[13px]">
          <span className="text-muted">{r.label}</span>
          <div className="relative h-4">
            <div className="absolute top-1/2 h-px w-full bg-hairline" />
            <div className="absolute top-1/2 h-[2px] -translate-y-1/2" style={{ left: `${(r.atAdd / max) * 100}%`, width: `${((r.day14 - r.atAdd) / max) * 100}%`, background: 'color-mix(in srgb, var(--enrich) 45%, transparent)' }} />
            <div className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-enrich bg-surface" style={{ left: `${(r.atAdd / max) * 100}%` }} title={`When added ${pc(r.atAdd)}`} />
            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-enrich" style={{ left: `${(r.day14 / max) * 100}%` }} title={`Day 14 ${pc(r.day14)}`} />
          </div>
          <span className="num text-right"><span className="text-muted">{pc(r.atAdd)} →</span> <b>{pc(r.day14)}</b></span>
        </div>
      ))}
      <div className="flex items-center gap-4 pl-[116px] text-[11px] text-muted">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-enrich" /> When added</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-enrich" /> By day 14</span>
        <span>{f.total} cases added in 90 days</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ M13 firm scatter
export function FirmScatter({ period, highlight, height = 300 }: { period: Period; highlight?: string; height?: number }) {
  const t = useTokens();
  const f = q.firmLag(period);
  const focusId = highlight ?? [...f.rows].sort((a, b) => b.medianLag - a.medianLag)[0].id;
  const data = f.rows.map((r) => ({ ...r, x: r.medianLag, y: r.onPlatform, z: r.hearings }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: -10 }}>
        <CartesianGrid {...gridProps(t)} />
        <ReferenceLine x={5} stroke={t.muted} strokeDasharray="4 4" label={{ value: 'Alert: 5-day lag', position: 'insideTopRight', fill: t.muted, fontSize: 10 }} />
        <XAxis type="number" dataKey="x" domain={[0, 12]} {...axisProps(t)} tickFormatter={(v) => `${v} d`} name="Median lag" label={{ value: 'Median days to record an outcome →', position: 'insideBottomRight', offset: -4, fill: t.muted, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" domain={[0, 1]} tickFormatter={pctTick} {...axisProps(t)} />
        <ZAxis type="number" dataKey="z" range={[90, 1100]} />
        <Tooltip cursor={false} content={<Tip render={(p) => ({ title: String(p.name), rows: [['Hearings', `${p.hearings} (${pc(p.share as number)} of all)`], ['Median lag', `${(p.medianLag as number).toFixed(1)} days`], ['Closed out', pc(p.closeOut as number)], ['Lawyers active on cases', pc(p.onPlatform as number)]], foot: 'Click to open' })} />} />
        <Scatter data={data} className="drill-mark" onClick={(d: { payload?: { id: string } }) => d.payload && go(`#/team/${d.payload.id}`)} {...anim}>
          {data.map((r) => <Cell key={r.id} fill={hl(t, t.hearing, r.id === focusId)} fillOpacity={r.id === focusId ? 0.85 : 1} stroke={t.surface} strokeWidth={2} />)}
          <LabelList dataKey="short" content={(p: { x?: number | string; y?: number | string; value?: unknown; width?: number | string }) => {
            const off: Record<string, [number, number, 'start' | 'end']> = { Subramanian: [-14, -6, 'end'], 'Desai Thakkar': [16, -12, 'start'], Banerjee: [18, 6, 'start'], Chandra: [-12, 16, 'end'], Mehra: [26, 4, 'start'] };
            const [dx, dy, anchor] = off[String(p.value)] ?? [14, 4, 'start'];
            const cx = Number(p.x) + Number(p.width ?? 0) / 2;
            return <text x={cx + dx} y={Number(p.y) + Number(p.width ?? 0) / 2 + dy} textAnchor={anchor} fill={t.ink} fontSize={11} fontWeight={500}>{String(p.value)}</text>;
          }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M14 awaiting
export function AwaitingBars({ scope, height }: { scope: Scope; height?: number }) {
  const t = useTokens();
  const a = q.awaiting(scope);
  const rows = a.rows.slice(0, 10);
  if (!rows.length) return <p className="text-[13px] text-muted">Nothing awaiting an update.</p>;
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(120, rows.length * 28 + 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide domain={[0, Math.max(...rows.map((r) => r.total))]} />
        <YAxis type="category" dataKey="name" width={124} {...axisProps(t)} tick={{ fill: t.ink, fontSize: 12 }} />
        <YAxis yAxisId="totals" orientation="right" type="category" dataKey="name" width={28} {...axisProps(t)} tick={{ fill: t.ink, fontSize: 12, fontWeight: 600 }} tickFormatter={(n: string) => String(rows.find((r) => r.name === n)?.total ?? '')} />
        <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: `${p.name} · ${p.team}`, rows: [['Counsel-owned', String(p.counsel), t.hearing], ['In-house', String(p.inhouse), t.muted], ['Total', String(p.total)]], foot: 'Click to open' })} />} />
        <RBar dataKey="counsel" stackId="a" fill={t.hearing} className="drill-mark" onClick={(d: { payload?: { id: string } }) => d.payload && go(`#/user/${d.payload.id}`)} {...anim} />
        <RBar dataKey="inhouse" stackId="a" fill={t.quiet} radius={[0, 4, 4, 0]} className="drill-mark" onClick={(d: { payload?: { id: string } }) => d.payload && go(`#/user/${d.payload.id}`)} {...anim} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M15 dormant
export function DormantArea({ scope, height = 200 }: { scope: Scope; height?: number }) {
  const t = useTokens();
  const { period } = useApp();
  const d = q.dormant(scope);
  const series = q.dormantTrend(scope, period);
  const n = series.length;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 16, right: 72, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="dormFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.hearing} stopOpacity={0.22} /><stop offset="1" stopColor={t.hearing} stopOpacity={0.02} /></linearGradient>
        </defs>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="week" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis {...axisProps(t)} allowDecimals={false} />
        <Tooltip content={<Tip render={(p) => ({ title: period === 30 ? String(p.week) : `Week of ${p.week}`, rows: [['Dormant cases', String(p.count), t.hearing], ['Share of active', pc(p.share as number)]] })} />} />
        <Area dataKey="count" stroke={t.hearing} strokeWidth={1.75} fill="url(#dormFill)" {...anim} label={(p: LP) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text={`${d.count} · ${pc(d.share)}`} color={t.hearing} />} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M16 AI quadrant
export function AiQuadrant({ period, height = 280 }: { period: Period; height?: number }) {
  const t = useTokens();
  const a = q.aiAdoption(ORG, period);
  const data = a.rows.map((r) => ({ ...r, x: r.adoption, y: r.actionRate, z: r.credits }));
  const qLabel = (text: string, x: number, y: number, anchor: 'start' | 'end') => <ReferenceArea x1={x} x2={x} y1={y} y2={y} label={{ value: text, fill: t.muted, fontSize: 10, position: anchor === 'start' ? 'insideTopLeft' : 'insideTopRight' }} />;
  void qLabel;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 30, bottom: 8, left: -10 }}>
        <CartesianGrid {...gridProps(t)} />
        <ReferenceLine x={0.4} stroke={t.hairline} strokeWidth={1.5} />
        <ReferenceLine y={0.5} stroke={t.hairline} strokeWidth={1.5} />
        <ReferenceArea x1={0.4} x2={0.8} y1={0.5} y2={1} fill="transparent" label={{ value: 'Used and trusted', position: 'insideTopRight', fill: t.muted, fontSize: 10 }} />
        <ReferenceArea x1={0} x2={0.4} y1={0.5} y2={1} fill="transparent" label={{ value: 'Trusted, under-used: placement', position: 'insideTopLeft', fill: t.muted, fontSize: 10 }} />
        <ReferenceArea x1={0} x2={0.4} y1={0} y2={0.5} fill={t.act} fillOpacity={0.04} label={{ value: 'Low use, low trust: fix quality', position: 'insideBottomLeft', fill: t.muted, fontSize: 10 }} />
        <XAxis type="number" dataKey="x" domain={[0, 0.8]} tickFormatter={pctTick} {...axisProps(t)} label={{ value: 'Adoption →', position: 'insideBottomRight', offset: -4, fill: t.muted, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" domain={[0, 1]} tickFormatter={pctTick} {...axisProps(t)} />
        <ZAxis type="number" dataKey="z" range={[80, 1600]} />
        <Tooltip cursor={false} content={<Tip render={(p) => ({ title: String(p.label), rows: [['Adoption', `${pc(p.adoption as number)} (${p.users} of ${a.base})`], ['Action rate', pc(p.actionRate as number)], ['Credits', `${nf(p.credits as number)} (${pc(p.creditShare as number)})`]] })} />} />
        <Scatter data={data} {...anim}>
          {data.map((r) => <Cell key={r.id} fill={r.id === 'ai_diligence' ? t.ai : t.quiet} stroke={t.surface} strokeWidth={2} />)}
          <LabelList dataKey="label" position="right" offset={12} style={{ fill: t.ink, fontSize: 11, fontWeight: 500 }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M17 Ask AI after the limit
export function AskDaily({ height = 220 }: { height?: number }) {
  const t = useTokens();
  const a = q.askAfterLimit();
  const data = a.days.map((d) => ({ ...d, total: d.ok + d.blocked }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 28, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="label" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis {...axisProps(t)} allowDecimals={false} />
        <ReferenceLine x={a.limitLabel} stroke={t.ink} strokeDasharray="4 4" label={{ value: `Limit reached ${a.limitLabel}`, position: 'top', fill: t.ink, fontSize: 11 }} />
        <ReferenceLine x="1 Nov" stroke={t.hairline} label={{ value: 'Credits reset', position: 'top', fill: t.muted, fontSize: 10 }} />
        <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: String(p.label), rows: [['Answered', String(p.ok), t.ai], ['Blocked attempts', String(p.blocked), t.muted]] })} />} />
        <RBar dataKey="ok" stackId="s" fill={t.ai} radius={[0, 0, 0, 0]} {...anim} />
        <RBar dataKey="blocked" stackId="s" fill={t.quiet} radius={[4, 4, 0, 0]} {...anim} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M18 rejection
export function RejectionLines({ period, height = 220 }: { period: Period; height?: number }) {
  const t = useTokens();
  const r = q.rejection(period);
  const data = q.rejectionTrend(period).filter((w) => w.regenerate > 0);
  const n = data.length;
  const model = q.bucketOf(period, toDay('2026-09-14'));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 18, right: 112, bottom: 0, left: -18 }}>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="week" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis domain={[0, 0.2]} tickFormatter={pctTick} {...axisProps(t)} ticks={[0, 0.05, 0.1, 0.15, 0.2]} />
        {model && <ReferenceLine x={model} stroke={t.ink} strokeDasharray="4 4" label={{ value: 'Model update 14 Sep', position: 'insideTopLeft', fill: t.ink, fontSize: 11 }} />}
        <ReferenceLine y={0.1} stroke={t.muted} strokeDasharray="2 4" label={{ value: 'Alert 10%', position: 'insideBottomLeft', fill: t.muted, fontSize: 10 }} />
        <Tooltip content={<Tip render={(p) => ({ title: ptTitle(period, p.week), rows: [['Regenerated', pc(p.regenerate as number, 1), t.muted], ['Thumbs-down', pc(p.thumbs as number, 1), t.ai]] })} />} />
        <Line dataKey="regenerate" stroke={t.muted} strokeOpacity={0.6} strokeWidth={1.5} dot={false} {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text={`Regenerate ${pc(r.regenerate)}`} color={t.muted} />} />
        <Line dataKey="thumbs" stroke={t.ai} strokeWidth={2} dot={false} {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text={`Thumbs-down ${pc(r.thumbs)}`} color={t.ai} />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M19 accuracy
export function AccuracyLine({ height = 200 }: { height?: number }) {
  const t = useTokens();
  const { period } = useApp();
  const a = { rows: q.accuracyTrend(period) };
  const n = a.rows.length;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={a.rows} margin={{ top: 16, right: 56, bottom: 0, left: -10 }}>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="week" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis domain={[0.85, 0.95]} tickFormatter={pctTick} {...axisProps(t)} ticks={[0.86, 0.88, 0.9, 0.92, 0.94]} />
        <ReferenceLine y={0.9} stroke={t.ink} strokeDasharray="4 4" label={{ value: 'Target 90%', position: 'insideTopLeft', fill: t.muted, fontSize: 11 }} />
        <ReferenceLine y={0.88} stroke={t.muted} strokeDasharray="2 4" label={{ value: 'Alert 88%', position: 'insideBottomLeft', fill: t.muted, fontSize: 10 }} />
        {a.rows.some((r) => r.week === '14 Sep') && <ReferenceLine x="14 Sep" stroke={t.hairline} label={{ value: 'Model update', position: 'insideBottomRight', fill: t.muted, fontSize: 10 }} />}
        <Tooltip content={<Tip render={(p) => ({ title: `Week of ${p.week}`, rows: [['Accuracy', pc(p.accuracy as number, 1), t.ai], ['Summaries graded', String(p.sample)]] })} />} />
        <Line dataKey="accuracy" stroke={t.ai} strokeWidth={2} dot={{ r: 2.5, fill: t.ai, strokeWidth: 0 }} {...anim} label={(p) => <EndLabel x={p.x as number} y={p.y as number} index={p.index as number} count={n} text={pc(a.rows[n - 1].accuracy, 1)} color={t.ai} />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M21 insights reach
export function ReachBars({ height = 230 }: { height?: number }) {
  const t = useTokens();
  const { period } = useApp();
  const data = q.reachTrend(period);
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-muted">
        {[['Admin', 1], ['Legal', 0.6], ['Business', 0.32]].map(([k, o]) => <span key={k as string} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.value, opacity: o as number }} />{k} viewers</span>)}
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: t.ink }} />MIS downloads</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }} barCategoryGap="22%">
          <CartesianGrid {...gridProps(t)} />
          <XAxis dataKey="week" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
          <YAxis {...axisProps(t)} allowDecimals={false} label={{ value: period === 30 ? 'per 7 days' : 'per week', angle: -90, position: 'insideLeft', offset: 28, fill: t.muted, fontSize: 10 }} />
          <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: ptTitle(period, p.week), rows: [['Admin', String(p.Admin)], ['Legal', String(p.Legal)], ['Business', String(p.Business)], ['Distinct viewers', String(p.total)], ['MIS downloads', String(p.mis)]] })} />} />
          <RBar dataKey="Admin" stackId="v" fill={t.value} {...anim} />
          <RBar dataKey="Legal" stackId="v" fill={t.value} fillOpacity={0.6} {...anim} />
          <RBar dataKey="Business" stackId="v" fill={t.value} fillOpacity={0.32} radius={[4, 4, 0, 0]} {...anim} />
          <Line dataKey="mis" stroke={t.ink} strokeWidth={1.5} dot={false} {...anim} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ------------------------------------------------------------------ M25 page load
export function PageLoadBars() {
  const rows = q.pageLoads();
  const max = 8;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.page} className="grid grid-cols-[84px_1fr_48px] items-center gap-3 text-[13px]">
          <span className="text-muted">{r.page}</span>
          <div className="relative"><Bar value={r.p95} max={max} color={r.p95 > 3 ? 'var(--health)' : 'var(--quiet)'} height={12} /><span className="absolute top-[-3px] h-[18px] w-px bg-ink/60" style={{ left: `${(3 / max) * 100}%` }} /></div>
          <span className="num text-right font-medium">{r.p95.toFixed(1)} s</span>
        </div>
      ))}
      <div className="pl-[96px] text-[11px] text-muted">| Budget 3 s · alert above 5 s</div>
    </div>
  );
}

// ------------------------------------------------------------------ M26 rate limits
export function RateLimitLine({ height = 210 }: { height?: number }) {
  const t = useTokens();
  const { period } = useApp();
  const r = q.rateLimits(period);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={r.daily} margin={{ top: 16, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="label" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} />
        <YAxis {...axisProps(t)} />
        <ReferenceLine y={5} stroke={t.ink} strokeDasharray="4 4" />
        <Tooltip content={<Tip render={(p) => ({ title: `${p.label}${p.monday ? ' · Monday' : ''}`, rows: [['429 errors per 100 sessions', (p.rate as number).toFixed(1), t.health]] })} />} />
        <Line dataKey="rate" stroke={t.health} strokeWidth={1.5} {...anim}
          dot={(p: { cx?: number; cy?: number; payload?: { monday: boolean }; index?: number }) => p.payload?.monday ? <circle key={p.index} cx={p.cx} cy={p.cy} r={3.5} fill={t.health} stroke={t.surface} strokeWidth={1.5} /> : <g key={p.index} />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------------ M27 zero results
export function ZeroResults() {
  const { period } = useApp();
  const rows = q.zeroResults(period);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.surface}>
          <div className="flex items-baseline justify-between"><span className="text-[13px] text-muted">{r.label}</span><span className="num text-[22px] font-semibold">{pc(r.rate)}</span></div>
          <Bar value={r.rate} max={0.3} color="var(--health)" height={10} />
          <div className="mt-1 text-[11px] text-muted">{nf(r.zero)} of {nf(r.searches)} searches found nothing</div>
          <div className="mt-3 text-[11px] text-muted">Top misses, last 30 days</div>
          <ol className="mt-1 space-y-1 text-[12px]">
            {r.top.map((q2) => <li key={q2.query} className="flex justify-between gap-2 border-b border-hairline pb-1"><span className="font-mono text-[11px]">"{q2.query}"</span><span className="num text-muted">{q2.count}</span></li>)}
          </ol>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ small number + sparkline cards
export function NumberSpark({ value, sub, series, color, target, labels }: { value: string; sub?: string; series: (number | null)[]; color: string; target?: number; labels?: [string, string] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="num text-[40px] font-semibold leading-none">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
      <div className="mt-auto pt-6"><Sparkline data={series} color={color} height={110} target={target} /></div>
      {labels && <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{labels[0]}</span><span>{labels[1]}</span></div>}
    </div>
  );
}

// ------------------------------------------------------------------ counsel firm extras
export function FirmByBu({ firmId, period }: { firmId: string; period: Period }) {
  const t = useTokens();
  const x = q.firmExtras(firmId, period);
  return (
    <ResponsiveContainer width="100%" height={Math.max(90, x.byBu.length * 34 + 20)}>
      <BarChart data={x.byBu} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={170} {...axisProps(t)} tick={{ fill: t.ink, fontSize: 12 }} />
        <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: String(p.name), rows: [['Hearings', String(p.hearings), t.hearing], ['Closed out', String(p.closed)]], foot: 'Click to open' })} />} />
        <RBar dataKey="hearings" fill={t.hearing} radius={[0, 4, 4, 0]} className="drill-mark" onClick={(d: { payload?: { id: string } }) => d.payload && go(`#/team/${d.payload.id}`)} {...anim}>
          <LabelList dataKey="hearings" position="right" style={{ fill: t.ink, fontSize: 11, fontWeight: 600 }} />
        </RBar>
      </BarChart>
    </ResponsiveContainer>
  );
}
export function LagDistribution({ firmId, period }: { firmId: string; period: Period }) {
  const t = useTokens();
  const x = q.firmExtras(firmId, period);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={x.dist} margin={{ top: 16, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid {...gridProps(t)} />
        <XAxis dataKey="label" {...axisProps(t)} interval="preserveStartEnd" minTickGap={28} tick={{ fill: t.muted, fontSize: 10 }} />
        <YAxis {...axisProps(t)} allowDecimals={false} />
        <Tooltip cursor={{ fill: t.hairline, fillOpacity: 0.4 }} content={<Tip render={(p) => ({ title: `${p.label} days`, rows: [['Hearings', String(p.count)]], foot: p.closed ? 'Counts as closed out' : 'Late' })} />} />
        <RBar dataKey="count" radius={[4, 4, 0, 0]} {...anim}>
          {x.dist.map((d) => <Cell key={d.label} fill={d.closed ? t.quiet : t.hearing} />)}
          <LabelList dataKey="count" position="top" style={{ fill: t.ink, fontSize: 11 }} />
        </RBar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function useOrgOrTeam(teamId?: string): Scope { return teamId ? teamScope(teamId) : ORG; }
export function usePeriod() { return useApp().period; }
