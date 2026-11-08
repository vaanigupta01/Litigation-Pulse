import { motion } from 'motion/react';
import { Fragment, useState } from 'react';
import { go, useApp } from '../app/state';
import { q } from '../lib/q';
import { pc } from './ui';

type Key = 'name' | 'M01' | 'M02' | 'M10' | 'M11' | 'M22' | 'members';
const COLS: { k: Key; label: string; sub: string; color: string }[] = [
  { k: 'M01', label: 'Hearing close-out', sub: 'M01', color: 'hearing' },
  { k: 'M02', label: 'Weekly active seats', sub: 'M02', color: 'adoption' },
  { k: 'M10', label: 'Early capture', sub: 'M10', color: 'intake' },
  { k: 'M11', label: 'Fields at day 14', sub: 'M11 avg of 5', color: 'enrich' },
  { k: 'M22', label: 'Alert follow-through', sub: 'M22', color: 'value' },
];

export function TeamsTable() {
  const { period } = useApp();
  const rows = q.teamsTable(period);
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: 'M01', dir: 1 });
  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.k], bv = b[sort.k];
    if (av === null) return 1; if (bv === null) return -1;
    return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
  });
  const th = (k: Key, label: string, sub?: string) => (
    <th scope="col" className="px-3 py-2.5 text-left font-medium">
      <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1 }))} className="flex items-center gap-1 text-left text-[12px] text-muted hover:text-ink" aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <span>{label}{sub && <span className="block font-mono text-[10px] font-normal">{sub}</span>}</span>
        <span aria-hidden className="text-[10px]">{sort.k === k ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
  return (
    <div id="card-teams" className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead className="border-b border-hairline bg-surface-2">
            <tr>{th('name', 'Team')}{th('members', 'People')}{COLS.map((c) => <Fragment key={c.k}>{th(c.k, c.label, c.sub)}</Fragment>)}</tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} tabIndex={0} onClick={() => go(`#/team/${r.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`#/team/${r.id}`)} className="cursor-pointer border-b border-hairline/70 transition last:border-0 hover:bg-canvas">
                <td className="px-3 py-2.5">
                  <motion.div layoutId={`title-${r.id}`} className="font-medium text-ink">{r.name}</motion.div>
                  <div className="text-[11px] text-muted">{r.type === 'business_unit' ? 'Business unit' : 'Counsel firm'}</div>
                </td>
                <td className="num px-3 py-2.5 text-muted">{r.members}</td>
                {COLS.map((c) => {
                  const v = r[c.k] as number | null;
                  return (
                    <td key={c.k} className="px-3 py-2.5">
                      {v === null ? <span className="text-muted">—</span> : (
                        <div className="flex items-center gap-2">
                          <span className="num w-9 font-medium">{pc(v)}</span>
                          <div className="h-1.5 w-20 rounded-full bg-hairline"><div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: `var(--${c.color})` }} /></div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-hairline px-4 py-2 text-[11px] text-muted">Click a row to open the team. Intake, enrichment and alert rates belong to business units, so counsel firms show a dash.</div>
    </div>
  );
}
