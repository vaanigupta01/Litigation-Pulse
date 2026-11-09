import type { ReactNode } from 'react';
import { TREND_FOLLOWS_PERIOD, WINDOW } from '../lib/metrics';
import type { Status } from '../lib/selectors';

export const pc = (x: number | null | undefined, d = 0) => (x === null || x === undefined || Number.isNaN(x) ? '—' : `${(x * 100).toFixed(d)}%`);
export const nf = (x: number) => x.toLocaleString('en-IN');
export const cv = (token: string) => `var(--${token})`;

const STATUS_LABEL: Record<Status, string> = { good: 'On track', watch: 'Watch', act: 'Act', info: 'Context' };
export function StatusPill({ s, label }: { s: Status; label?: string }) {
  const color = s === 'info' ? 'var(--muted)' : `var(--${s})`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
      <svg width="8" height="8" aria-hidden>
        {s === 'good' ? <circle cx="4" cy="4" r="3.5" fill={color} /> : s === 'watch' ? <path d="M4 0.5 7.5 7.5H0.5Z" fill={color} /> : s === 'act' ? <rect x="0.5" y="0.5" width="7" height="7" rx="1" fill={color} /> : <circle cx="4" cy="4" r="3" fill="none" stroke={color} strokeWidth="1.5" />}
      </svg>
      {label ?? STATUS_LABEL[s]}
    </span>
  );
}
export function Chip({ children, color, title }: { children: ReactNode; color?: string; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 rounded-md border border-hairline px-1.5 py-0.5 text-[11px] text-muted whitespace-nowrap">
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}
/** Change against a named comparison window. Says so when there is no earlier data to compare with. */
export function Delta({ now, prev, unit = 'pp', invert = false, fmt, vs }: { now: number; prev: number | null; unit?: 'pp' | 'n' | 'days'; invert?: boolean; fmt?: (d: number) => string; vs?: string }) {
  if (prev === null) return <span className="block text-[11px] leading-tight text-muted">No earlier data<br />to compare with</span>;
  const d = unit === 'pp' ? (now - prev) * 100 : now - prev;
  const good = invert ? d < 0 : d > 0;
  const flat = Math.abs(d) < 0.5;
  const txt = fmt ? fmt(d) : unit === 'pp' ? `${d > 0 ? '+' : ''}${d.toFixed(0)} pts` : unit === 'days' ? `${d > 0 ? '+' : ''}${d} days` : `${d > 0 ? '+' : ''}${nf(d)}`;
  return (
    <span className="block leading-tight" title={unit === 'pp' ? 'Percentage points: the difference between two percentages' : undefined}>
      <span className="num text-[12px] font-medium" style={{ color: flat ? 'var(--muted)' : good ? 'var(--good)' : 'var(--act)' }}>
        {flat ? '→ no change' : `${d > 0 ? '↑' : '↓'} ${txt}`}
      </span>
      {vs && <span className="block text-[11px] text-muted">vs {vs}</span>}
    </span>
  );
}

/** Lightweight SVG sparkline with an end dot. */
export function Sparkline({ data, color, height = 36, width = 160, min, max, target }: { data: (number | null)[]; color: string; height?: number; width?: number; min?: number; max?: number; target?: number }) {
  const vals = data.filter((x): x is number => x !== null);
  if (!vals.length) return null;
  const lo = min ?? Math.min(...vals, target ?? Infinity), hi = max ?? Math.max(...vals, target ?? -Infinity);
  const span = hi - lo || 1;
  const x = (i: number) => 2 + (i * (width - 6)) / (data.length - 1 || 1);
  const y = (v: number) => height - 3 - ((v - lo) / span) * (height - 6);
  let d = '';
  data.forEach((v, i) => { if (v === null) return; d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; });
  const lastI = data.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop()!;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" height={height} aria-hidden className="block overflow-visible">
      {target !== undefined && <line x1={0} x2={width} y1={y(target)} y2={y(target)} stroke="var(--muted)" strokeDasharray="2 3" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(lastI)} cy={y(data[lastI]!)} r={2.6} fill={color} />
    </svg>
  );
}

export function TipBox({ title, rows, foot }: { title?: ReactNode; rows: [ReactNode, ReactNode, string?][]; foot?: ReactNode }) {
  return (
    <div className="glass min-w-[160px] px-3 py-2 text-[12px] text-ink">
      {title && <div className="mb-1 font-medium">{title}</div>}
      {rows.map(([k, v, c], i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted">{c && <span className="h-2 w-2 rounded-full" style={{ background: c }} />}{k}</span>
          <span className="num font-medium">{v}</span>
        </div>
      ))}
      {foot && <div className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">{foot}</div>}
    </div>
  );
}

export function SectionTitle({ id, title, purpose, color }: { id: string; title: string; purpose: string; color: string }) {
  return (
    <div id={`section-${id}`} className="scroll-mt-28 pb-4 pt-10">
      <h2 className="serif flex items-center gap-3 text-[28px] leading-tight text-ink">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-[14px] text-muted">{purpose}.</p>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num text-[22px] font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

/** A horizontal bar used by HTML charts (bullets, ranked bars). */
export function Bar({ value, max, color, height = 10, ghost }: { value: number; max: number; color: string; height?: number; ghost?: number }) {
  return (
    <div className="relative w-full rounded-full" style={{ height, background: 'color-mix(in srgb, var(--muted) 10%, transparent)' }}>
      {ghost !== undefined && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(ghost / max) * 100}%`, background: 'color-mix(in srgb, var(--muted) 18%, transparent)' }} />}
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%`, background: color }} />
    </div>
  );
}

/** Says which time window a card's number covers, and whether the period toggle moves it. */
export function WindowChip({ id, period, compact }: { id: string; period: number; compact?: boolean }) {
  const w = WINDOW[id];
  if (!w) return null;
  if (w === 'period') {
    return (
      <span title="Follows the 30 / 90 / 180-day toggle" className="inline-flex items-center gap-1 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium text-canvas whitespace-nowrap">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        Last {period} days
      </span>
    );
  }
  const trend = TREND_FOLLOWS_PERIOD.has(id);
  const label = w.charAt(0).toLowerCase() + w.slice(1);
  return (
    <>
      <span title="The number is defined on a fixed window, so the period toggle does not change it." className="inline-flex items-center gap-1 rounded-md border border-dashed border-hairline px-1.5 py-0.5 text-[11px] text-muted whitespace-nowrap">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        {trend ? 'Number' : 'Fixed'}: {label}
      </span>
      {trend && (
        <span title="The line shows how this number moved across the selected period." className="inline-flex items-center gap-1 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium text-canvas whitespace-nowrap">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M3 17l6-6 4 4 8-8" /></svg>
          Line: {compact ? `${period}d` : `last ${period} days`}
        </span>
      )}
    </>
  );
}
