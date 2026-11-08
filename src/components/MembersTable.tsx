import { motion } from 'motion/react';
import { useState } from 'react';
import { go, useApp } from '../app/state';
import { dayOf } from '../lib/data';
import { fmtDay, TODAY } from '../lib/dates';
import { q } from '../lib/q';
import { pc } from './ui';

type Row = ReturnType<typeof q.members>[number];
type K = 'name' | 'role' | 'owned' | 'closeOut' | 'awaiting' | 'lastActive' | 'aiActions';

export function MembersTable({ teamId }: { teamId: string }) {
  const { period } = useApp();
  const rows = q.members(teamId, period);
  const [sort, setSort] = useState<{ k: K; dir: 1 | -1 }>({ k: 'awaiting', dir: -1 });
  const val = (r: Row, k: K) => (k === 'lastActive' ? (r.lastActive ? dayOf(r.lastActive) : -1) : r[k]);
  const sorted = [...rows].sort((a, b) => {
    const av = val(a, sort.k), bv = val(b, sort.k);
    if (av === null) return 1; if (bv === null) return -1;
    return (av < bv ? -1 : av > bv ? 1 : a.name.localeCompare(b.name)) * sort.dir;
  });
  const cols: [K, string][] = [['name', 'Name'], ['role', 'Role'], ['owned', 'Matters owned'], ['closeOut', `Close-out (${period}d)`], ['awaiting', 'Awaiting update'], ['lastActive', 'Last active'], ['aiActions', 'AI actions']];
  return (
    <div id="card-members" className="card overflow-hidden">
      <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
        <h3 className="text-[15px] font-semibold">Members</h3>
        <span className="text-[12px] text-muted">{rows.length} people · click a row to open their view</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="border-y border-hairline bg-surface-2">
            <tr>
              {cols.map(([k, l]) => (
                <th key={k} scope="col" className="px-3 py-2 text-left">
                  <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1 }))} className="flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink">
                    {l}<span aria-hidden className="text-[10px]">{sort.k === k ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const days = r.lastActive ? TODAY - dayOf(r.lastActive) : null;
              return (
                <tr key={r.id} tabIndex={0} onClick={() => go(`#/user/${r.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`#/user/${r.id}`)} className="cursor-pointer border-b border-hairline/70 last:border-0 hover:bg-canvas">
                  <td className="px-3 py-2"><motion.span layoutId={`title-${r.id}`} className="font-medium text-ink">{r.name}</motion.span><div className="text-[11px] text-muted">{r.title}</div></td>
                  <td className="px-3 py-2 text-muted">{r.role}</td>
                  <td className="num px-3 py-2">{r.role === 'Legal' || r.role === 'Lawyer' ? r.owned : '—'}</td>
                  <td className="px-3 py-2">
                    {r.closeOut === null ? <span className="text-muted">—</span> : (
                      <div className="flex items-center gap-2"><span className="num w-9 font-medium">{pc(r.closeOut)}</span><div className="h-1.5 w-16 rounded-full bg-hairline"><div className="h-full rounded-full" style={{ width: `${r.closeOut * 100}%`, background: r.closeOut < 0.65 ? 'var(--hearing)' : 'var(--quiet)' }} /></div><span className="text-[11px] text-muted">{r.hearings}</span></div>
                    )}
                  </td>
                  <td className="num px-3 py-2">{r.awaiting ? <b className={r.awaiting > 15 ? 'text-act' : ''}>{r.awaiting}</b> : <span className="text-muted">0</span>}</td>
                  <td className="px-3 py-2 text-muted">{r.lastActive ? <span className={days! > 7 ? 'text-watch' : ''}>{days! <= 1 ? 'Yesterday' : `${fmtDay(dayOf(r.lastActive))} · ${days} d ago`}</span> : 'Never'}</td>
                  <td className="num px-3 py-2">{r.aiActions || <span className="text-muted">0</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
