import type { ReactNode } from 'react';
import { TipBox } from '../components/ui';
import type { Tokens } from '../app/state';

export const axisProps = (t: Tokens) => ({
  tick: { fill: t.muted, fontSize: 11, fontFamily: 'Geist Variable, sans-serif' },
  axisLine: false,
  tickLine: false,
});
export const gridProps = (t: Tokens) => ({ vertical: false, stroke: t.hairline, strokeDasharray: '2 4' });
export const anim = { isAnimationActive: true, animationDuration: 300, animationEasing: 'ease-out' as const };

/** Recharts tooltip adapter that renders the frosted-glass box. */
export function Tip({ active, payload, label, render }: { active?: boolean; payload?: { payload: Record<string, unknown> }[]; label?: unknown; render: (p: Record<string, unknown>, label: unknown) => { title?: ReactNode; rows: [ReactNode, ReactNode, string?][]; foot?: ReactNode } | null }) {
  if (!active || !payload?.length) return null;
  const r = render(payload[0].payload, label);
  if (!r) return null;
  return <TipBox {...r} />;
}

/** Direct label rendered at the last point of a line. */
export type LP = { x?: number | string; y?: number | string; index?: number };
export function EndLabel({ x, y, index, count, text, color, dy = 0 }: LP & { count: number; text: string; color: string; dy?: number }) {
  if (index !== count - 1 || x === undefined || y === undefined) return null;
  x = Number(x); y = Number(y);
  return (
    <text x={dy < -8 ? x - 4 : x + 6} y={y + dy} dy={4} textAnchor={dy < -8 ? 'middle' : 'start'} fill={color} fontSize={11} fontWeight={600}>
      {text}
    </text>
  );
}
