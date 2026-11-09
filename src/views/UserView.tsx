import { useApp, useTokens } from '../app/state';
import { CloseOutTrend, Dumbbell } from '../charts/charts';
import { ChartCard } from '../components/ChartCard';
import { LevelPath } from '../components/TopBar';
import { pc, StatusPill } from '../components/ui';
import { dayOf, teamById, userById } from '../lib/data';
import { fmtDay, fmtDayYear, TODAY } from '../lib/dates';
import { q } from '../lib/q';
import { ROLE_BLURB, userScope } from '../lib/selectors';
import { NotFound } from './TeamView';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Heatmap({ uid }: { uid: string }) {
  const g = q.heatmap(uid);
  const max = Math.max(1, ...g.flat());
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00
  const total = g.flat().reduce((a, b) => a + b, 0);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `36px repeat(${hours.length}, 1fr)` }}>
          <div />
          {hours.map((h) => <div key={h} className="text-center text-[10px] text-muted">{h % 3 === 0 ? `${h}:00` : ''}</div>)}
          {DAYS.map((d, di) => (
            <div key={d} className="contents">
              <div className="text-[11px] leading-[22px] text-muted">{d}</div>
              {hours.map((h) => {
                const v = g[di][h];
                return <div key={h} title={`${d} ${h}:00 · ${v} actions`} className="h-[22px] rounded-[4px]" style={{ background: v ? `color-mix(in srgb, var(--adoption) ${12 + (v / max) * 88}%, transparent)` : 'color-mix(in srgb, var(--muted) 7%, transparent)' }} />;
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted"><span>{total} actions in the last 8 weeks, IST</span><span className="flex items-center gap-1">Fewer <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'color-mix(in srgb, var(--adoption) 20%, transparent)' }} /><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--adoption)' }} /> More</span></div>
      </div>
    </div>
  );
}

const KIND_COLOR: Record<string, string> = { hearing: 'hearing', case: 'muted', intake: 'intake', enrich: 'enrich', ai: 'ai', value: 'value' };
function Timeline({ uid }: { uid: string }) {
  const items = q.timeline(uid, 20);
  if (!items.length) return <p className="text-[13px] text-muted">No activity on record.</p>;
  return (
    <ol className="relative max-h-[420px] space-y-3 overflow-auto pr-2">
      <span className="absolute bottom-2 left-[5px] top-2 w-px bg-hairline" aria-hidden />
      {items.map((x, i) => (
        <li key={i} className="relative flex gap-3 pl-0">
          <span className="relative z-[1] mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-surface" style={{ background: `var(--${KIND_COLOR[x.kind]})` }} />
          <div className="min-w-0">
            <div className="text-[13px] leading-snug text-ink">{x.text}</div>
            <div className="font-mono text-[10.5px] text-muted">{fmtDay(dayOf(x.t))} · {x.t.slice(11, 16)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Compare({ label, value, median, fmt, max, lowerBetter }: { label: string; value: number | null; median: number; fmt: (x: number) => string; max: number; lowerBetter?: boolean }) {
  const t = useTokens();
  if (value === null || Number.isNaN(value)) return (
    <div className="card p-4"><div className="text-[12px] text-muted">{label}</div><div className="num mt-1 text-[28px] font-semibold text-muted">—</div><div className="text-[11px] text-muted">Not applicable to this role</div></div>
  );
  const worse = Number.isNaN(median) ? false : lowerBetter ? value > median : value < median;
  const m = Math.max(max, value, Number.isNaN(median) ? 0 : median) || 1;
  return (
    <div className="card p-4">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num mt-1 text-[28px] font-semibold leading-none" style={{ color: worse ? t.hearing : undefined }}>{fmt(value)}</div>
      <div className="relative mt-3 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--muted) 12%, transparent)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(value / m) * 100}%`, background: worse ? t.hearing : t.quiet }} />
        {!Number.isNaN(median) && <div className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink" style={{ left: `${(median / m) * 100}%` }} />}
      </div>
      <div className="mt-1 text-[11px] text-muted">Team median {Number.isNaN(median) ? '—' : fmt(median)}</div>
    </div>
  );
}

export function UserView({ id }: { id: string }) {
  const { period } = useApp();
  const u = userById.get(id);
  if (!u) return <NotFound />;
  const team = teamById.get(u.team_id)!;
  const k = q.userKpis(id, period);
  const med = q.teamMedians(u.team_id, u.role, period);
  const isOps = u.role === 'Legal' || u.role === 'Lawyer';
  const ai = q.userAi(id, period);
  const last = u.last_active ? TODAY - dayOf(u.last_active) : null;
  const weekly = q.isWeeklyActive(id);
  const al = u.role === 'Business' ? q.alertFollowThrough(userScope(id), period) : null;
  return (
    <div>
      <header className="pb-6 pt-4">
        <LevelPath level="user" teamHref={`#/team/${team.id}`} />
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-[22px] font-semibold text-surface" style={{ background: `var(--${u.role === 'Lawyer' ? 'hearing' : u.role === 'Legal' ? 'enrich' : u.role === 'Admin' ? 'ai' : 'value'})` }}>
            {u.name.replace('Adv. ', '').split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="serif text-[40px] leading-[1.05]">{u.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              <span className="font-medium text-ink">{u.role}</span><span>{u.title}</span>
              <a href={`#/team/${team.id}`} className="underline decoration-hairline underline-offset-4 hover:text-ink">{team.name}</a>
              <span>Seat since {fmtDayYear(dayOf(u.seat_since))}</span>
              <span>{u.last_active ? `Last active ${fmtDay(dayOf(u.last_active))} (${last} ${last === 1 ? 'day' : 'days'} ago)` : 'Never active'}</span>
              <StatusPill s={weekly ? 'good' : last !== null && last <= 30 ? 'watch' : 'act'} label={weekly ? 'Active this week' : last !== null && last <= 30 ? 'Not active this week' : 'Inactive'} />
            </div>
            <p className="mt-3 max-w-3xl text-[13px] leading-snug text-muted">{ROLE_BLURB[u.role]}</p>
          </div>
        </div>
      </header>

      <ChartCard id="U03" className="mb-4" scopeLabel={`${team.short} ${u.role} users, last ${period} days`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {u.role === 'Business' && al ? (
            <>
              <Compare label="Alerts received" value={al.sent} median={NaN} fmt={(x) => String(x)} max={al.sent} />
              <Compare label="Alert follow-through" value={al.rate} median={q.alertFollowThrough(q.teamScope(u.team_id), period).rate} fmt={(x) => pc(x)} max={1} />
            </>
          ) : (
            <>
              <Compare label="Matters owned" value={isOps ? k.owned : null} median={med.owned} fmt={(x) => String(Math.round(x))} max={20} />
              <Compare label={`Hearings in ${period} days`} value={isOps ? k.hearings : null} median={med.hearings} fmt={(x) => String(Math.round(x))} max={10} />
              <Compare label="Close-out rate" value={k.closeOut} median={med.closeOut} fmt={(x) => pc(x)} max={1} />
              <Compare label="Awaiting update" value={isOps ? k.awaiting : null} median={med.awaiting} fmt={(x) => String(Math.round(x))} max={6} lowerBetter />
              <Compare label={`AI actions`} value={isOps || u.role === 'Admin' ? k.aiActions : null} median={med.aiActions} fmt={(x) => String(Math.round(x))} max={10} />
            </>
          )}
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard id="U01"><Heatmap uid={id} /></ChartCard>
        <ChartCard id="U02"><Timeline uid={id} /></ChartCard>
        {u.role === 'Legal' && <AwaitingList uid={id} />}
        {u.role === 'Lawyer' && <LawyerCases uid={id} />}
        {isOps && k.hearings > 0 && (
          <ChartCard id="M01" scopeLabel={u.name.split(' ')[0] === 'Adv.' ? u.name.split(' ')[1] : u.name.split(' ')[0]}>
            <CloseOutTrend scope={userScope(id)} height={220} />
          </ChartCard>
        )}
        <ChartCard id="M16" title="AI usage by feature">
          {ai.length ? (
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-hairline text-left text-[12px] text-muted"><th className="py-1.5 font-medium">Feature</th><th className="font-medium">Uses</th><th className="font-medium">Action rate</th><th className="text-right font-medium">Credits</th></tr></thead>
              <tbody>
                {ai.map((r) => (
                  <tr key={r.id} className="border-b border-hairline/60 last:border-0">
                    <td className="py-2">{r.label}</td><td className="num">{r.uses}</td>
                    <td><div className="flex items-center gap-2"><span className="num w-9">{pc(r.actionRate)}</span><div className="h-1.5 w-20 rounded-full bg-hairline"><div className="h-full rounded-full" style={{ width: `${r.actionRate * 100}%`, background: r.actionRate < 0.25 ? 'var(--ai)' : 'var(--quiet)' }} /></div></div></td>
                    <td className="num text-right">{r.credits.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-[13px] text-muted">No AI use in the last {period} days.</p>}
        </ChartCard>
        {u.role === 'Legal' && k.newMatters > 0 && <ChartCard id="M11" scopeLabel="cases this person added"><Dumbbell scope={userScope(id)} /></ChartCard>}
        {isOps && (
          <ChartCard id="M15" scopeLabel="this person's cases">
            <div className="num text-[40px] font-semibold leading-none">{k.dormant}</div>
            <div className="mt-1 text-[12px] text-muted">active cases with no activity for 90 days or more</div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function AwaitingList({ uid }: { uid: string }) {
  const list = q.userHearingList(uid);
  return (
    <ChartCard id="M14"  scopeLabel={`${list.length} open`}>
      {list.length ? (
        <ul className="max-h-[360px] divide-y divide-hairline overflow-auto text-[13px]">
          {list.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0"><div className="truncate text-ink">{h.title}</div><div className="text-[11px] text-muted">Hearing {fmtDay(dayOf(h.date))} · owner: {h.firm}</div></div>
              <span className="num shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium" style={{ color: h.overdue > 7 ? 'var(--act)' : 'var(--watch)', background: `color-mix(in srgb, var(--${h.overdue > 7 ? 'act' : 'watch'}) 12%, transparent)` }}>{h.overdue} {h.overdue === 1 ? 'day' : 'days'} overdue</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-[13px] text-muted">Every past hearing has an outcome recorded.</p>}
    </ChartCard>
  );
}
function LawyerCases({ uid }: { uid: string }) {
  const list = q.lawyerCases(uid);
  return (
    <ChartCard id="M14" title="Assigned cases" scopeLabel={`${list.length} cases`}>
      <ul className="max-h-[360px] divide-y divide-hairline overflow-auto text-[13px]">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0"><div className="truncate text-ink">{c.title}</div><div className="text-[11px] text-muted">{c.bu} · {c.court}{c.lastHearing ? ` · last hearing ${fmtDay(dayOf(c.lastHearing))}` : ''}</div></div>
            {c.awaiting ? <span className="num shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium" style={{ color: 'var(--act)', background: 'color-mix(in srgb, var(--act) 12%, transparent)' }}>{c.overdue} days overdue</span> : <span className="text-[11px] text-muted">Up to date</span>}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
