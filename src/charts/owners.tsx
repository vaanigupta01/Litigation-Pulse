// Hearings by owner (in-house legal and each counsel firm) and the seat list for a team.
import { useState } from 'react';
import { useApp } from '../app/state';
import { pc } from '../components/ui';
import { dayOf } from '../lib/data';
import { fmtDay } from '../lib/dates';
import { q } from '../lib/q';
import type { Scope } from '../lib/selectors';

/** The counts behind the close-out rate: hearings, recorded on time, rate and median lag per owner. */
export function OwnerTable({ scope, highlight }: { scope: Scope; highlight?: string }) {
  const { period } = useApp();
  const t = q.hearingsByOwner(scope, period);
  if (!t.total) return <p className="text-[13px] text-muted">No hearings in the last {period} days.</p>;
  const worst = highlight ?? [...t.rows].sort((a, b) => a.rate - b.rate)[0].id;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-[13px] [&_td]:py-1.5 [&_td]:pr-4 [&_th]:pb-1.5 [&_th]:pr-4 [&_th]:text-left [&_th]:text-[12px] [&_th]:font-medium [&_th]:text-muted">
        <thead><tr><th>Hearing owner</th><th>Hearings</th><th>Recorded on time</th><th>Close-out</th><th>Median lag</th></tr></thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.id} className="border-t border-hairline">
              <td>{r.href ? <a href={r.href} className="text-ink hover:underline">{r.label}</a> : r.label}</td>
              <td className="num">{r.hearings}</td>
              <td className="num">{r.closed}</td>
              <td><div className="flex items-center gap-2"><span className="num w-9 font-medium">{pc(r.rate)}</span><div className="h-1.5 w-16 rounded-full bg-hairline"><div className="h-full rounded-full" style={{ width: `${r.rate * 100}%`, background: r.id === worst ? 'var(--hearing)' : 'var(--quiet)' }} /></div></div></td>
              <td className="num text-muted">{Number.isNaN(r.medianLag) ? '—' : `${r.medianLag.toFixed(1)} d`}</td>
            </tr>
          ))}
          <tr className="border-t border-ink/30 font-semibold"><td>All hearings</td><td className="num">{t.total}</td><td className="num">{t.closed}</td><td className="num">{pc(t.rate)}</td><td /></tr>
        </tbody>
      </table>
    </div>
  );
}

/** Who holds the seats: inactive first, since those are the ones to chase. */
export function SeatList({ teamId }: { teamId: string }) {
  const all = q.seats(teamId);
  const inactive = all.filter((s) => !s.active), active = all.filter((s) => s.active).reverse();
  const [tab, setTab] = useState<'inactive' | 'active'>(inactive.length ? 'inactive' : 'active');
  const rows = tab === 'inactive' ? inactive : active;
  const pill = (on: boolean) => `rounded-full border px-2.5 py-0.5 text-[12px] ${on ? 'border-ink bg-ink font-medium text-canvas' : 'border-hairline text-muted hover:text-ink'}`;
  return (
    <div className="mt-4 border-t border-hairline pt-3">
      <div className="flex gap-1.5">
        <button className={pill(tab === 'inactive')} onClick={() => setTab('inactive')}>Not active this week <span className="num opacity-60">{inactive.length}</span></button>
        <button className={pill(tab === 'active')} onClick={() => setTab('active')}>Active <span className="num opacity-60">{active.length}</span></button>
      </div>
      <ul className="mt-2 max-h-[232px] divide-y divide-hairline overflow-auto pr-1 text-[13px]">
        {rows.map((s) => (
          <li key={s.id}>
            <a href={`#/user/${s.id}`} className="flex items-center justify-between gap-3 py-1.5 hover:opacity-70">
              <span className="min-w-0 truncate text-ink">{s.name} <span className="text-[11px] text-muted">{s.role}</span></span>
              <span className="num shrink-0 text-[12px] text-muted">{s.lastActive ? `${fmtDay(dayOf(s.lastActive))} · ${s.daysAgo} d ago` : 'Never active'}</span>
            </a>
          </li>
        ))}
        {!rows.length && <li className="py-2 text-muted">Nobody.</li>}
      </ul>
    </div>
  );
}
