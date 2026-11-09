// "Break it down" panels: the pattern behind a headline number, read from the same selectors.
import type { ReactNode } from 'react';
import { useApp } from '../app/state';
import { nf, pc } from '../components/ui';
import { q } from '../lib/q';
import type { Scope } from '../lib/selectors';

interface Row { label: string; value: number; text: ReactNode; href?: string | null; quiet?: boolean }
function Rows({ rows, color, max }: { rows: Row[]; color: string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[12px]"><span className="text-muted">{r.label}</span><span className="num whitespace-nowrap text-ink">{r.text}</span></div>
            <div className="mt-1 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--muted) 10%, transparent)' }}><div className="h-full rounded-full" style={{ width: `${(r.value / m) * 100}%`, background: r.quiet ? 'var(--quiet)' : `var(--${color})` }} /></div>
          </>
        );
        return r.href ? <a key={r.label} href={r.href} className="block rounded hover:opacity-75">{inner}</a> : <div key={r.label}>{inner}</div>;
      })}
    </div>
  );
}
function Block({ title, children, read }: { title: string; children: ReactNode; read: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[12px] font-semibold text-ink">{title}</div>
      {children}
      <p className="mt-2.5 text-[12px] leading-snug text-ink">{read}</p>
    </div>
  );
}
const Grid = ({ children }: { children: ReactNode }) => <div className="@container"><div className="grid gap-x-8 gap-y-6 @md:grid-cols-2">{children}</div></div>;
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');

export function IntakeBreakdown() {
  const p = q.intakePatterns();
  return (
    <Grid>
      <Block title="What is in the expired pile"
        read={<>At each group's precision, about <b>{p.likelyReal}</b> of the {p.expired} expired suggestions were real cases nobody opened. <b>{p.precise.likelyReal}</b> of them sit in {list(p.precise.labels)}: only {p.precise.expired} suggestions to read. Ranking the queue by keyword precision reaches them without reviewing everything.</>}>
        <Rows color="intake" rows={p.groups.map((g) => ({ label: g.label, value: g.expired, text: <>{g.expired} expired · <b>≈{g.likelyReal} real</b></>, quiet: g.precision < 0.5 }))} />
      </Block>
      <Block title="How soon a suggestion gets reviewed"
        read={<><b>{pc(p.withinWeek)}</b> of reviews happen within a week of the filing appearing and none after day {p.maxLag}. A suggestion unread by then is never read, yet it sits in the queue until day 90.</>}>
        <Rows color="intake" rows={p.speed.map((b) => ({ label: b.label, value: b.count, text: nf(b.count), quiet: b.count === 0 }))} />
      </Block>
    </Grid>
  );
}

export function AwaitingBreakdown({ scope }: { scope: Scope }) {
  const p = q.awaitingPatterns(scope);
  if (!p.total) return null;
  const top = p.byOwner[0];
  const late = p.byAge[2].count;
  return (
    <Grid>
      <Block title="Whose hearings they are" read={<><b>{top.count}</b> of the {p.total} belong to {top.label}. The case manager carries the backlog, but the outcome has to come from whoever attended the hearing.</>}>
        <Rows color="hearing" rows={p.byOwner.map((o, i) => ({ label: o.label, value: o.count, text: o.count, href: o.href, quiet: i > 0 }))} />
      </Block>
      <Block title="How long they have waited" read={<><b>{late}</b> {late === 1 ? 'has' : 'have'} waited more than two weeks; the oldest is {p.oldest} days overdue. After that long the next hearing date is usually already missing from the calendar.</>}>
        <Rows color="hearing" rows={p.byAge.map((o, i) => ({ label: o.label, value: o.count, text: o.count, quiet: i < 2 }))} />
      </Block>
    </Grid>
  );
}

export function DormantBreakdown({ scope }: { scope: Scope }) {
  const p = q.dormantPatterns(scope);
  if (!p.total) return null;
  const long = p.byQuiet[2].count;
  return (
    <Grid>
      <Block title="Where they sit" read={<><b>{pc(p.noCounselShare)}</b> of dormant cases ({p.noCounsel}) have no counsel assigned, so nobody outside the legal team is prompted to move them.{p.topManager && scope.kind !== 'user' ? <> {p.topManager.name} holds {p.topManager.count}.</> : null}</>}>
        <Rows color="hearing" rows={p.byUnit.map((u) => ({ label: u.label, value: u.count, text: <>{u.count} · {pc(u.share)} of its cases</>, href: scope.kind === 'org' ? u.href : null }))} />
      </Block>
      <Block title="How long they have been quiet" read={<><b>{long}</b> {long === 1 ? 'has' : 'have'} had no activity for over nine months. Those are candidates to dispose or archive rather than chase.</>}>
        <Rows color="hearing" rows={p.byQuiet.map((o, i) => ({ label: o.label, value: o.count, text: o.count, quiet: i < 2 }))} />
      </Block>
    </Grid>
  );
}

export function AiCostBreakdown() {
  const { period } = useApp();
  const p = q.aiCost(period);
  const rows = p.rows.filter((r) => r.perActed !== null);
  const top = rows[0], ask = rows.find((r) => r.id === 'ask_ai')!;
  return (
    <Grid>
      <Block title="Credits spent per output someone used" read={<>{top.label} costs <b>{top.perActed!.toFixed(0)} credits</b> for every output that led to an action; Ask AI costs {ask.perActed!.toFixed(1)}. The bulk feature is the expensive one and the least used.</>}>
        <Rows color="ai" rows={rows.map((r, i) => ({ label: r.label, value: r.perActed!, text: <>{r.perActed!.toFixed(1)} · {r.acted} of {r.uses} used</>, quiet: i > 0 }))} />
      </Block>
      <Block title="Who runs AI Diligence (October)" read={<>Without AI Diligence, October would have used <b>{nf(p.octWithoutDiligence)}</b> of {nf(p.limit)} credits and never reached the limit. A separate pool or a per-run cap for bulk Diligence keeps Ask AI working all month.</>}>
        <Rows color="ai" rows={p.diligenceUsers.map((u, i) => ({ label: u.name, value: u.credits, text: <>{u.cases} cases · {pc(u.share)}</>, href: `#/user/${u.id}`, quiet: i > 0 }))} />
      </Block>
    </Grid>
  );
}

export function AlertBreakdown({ scope }: { scope: Scope }) {
  const { period } = useApp();
  const rows = q.alertFunnel(scope, period);
  if (!rows.length) return null;
  const worst = [...rows].sort((a, b) => b.unopenedShare - a.unopenedShare)[0];
  const lightest = [...rows].sort((a, b) => a.perUser - b.perUser)[0];
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-ink">Where alerts are lost: sent, opened, case viewed</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-[12px] [&_td]:py-1.5 [&_td]:pr-4 [&_th]:pr-4 [&_th]:pb-1 [&_th]:text-left [&_th]:font-medium">
          <thead><tr className="text-muted"><th>Unit</th><th>Sent</th><th>Opened</th><th>Case viewed</th><th>Per person</th><th>Never opened one</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-hairline">
                <td>{scope.kind === 'org' ? <a href={r.href} className="hover:underline">{r.short}</a> : r.short}</td>
                <td className="num">{r.sent}</td><td className="num">{pc(r.opened / r.sent)}</td><td className="num">{pc(r.viewed / r.sent)}</td>
                <td className="num">{r.perUser.toFixed(1)}</td><td className="num">{r.neverOpened} of {r.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink">
        In {worst.label}, <b>{pc(worst.unopenedShare)}</b> of alerts are never opened, so the loss happens before the click: the alert itself, not the case page.
        {worst.id !== lightest.id && <> Its people get {worst.perUser.toFixed(1)} alerts each against {lightest.perUser.toFixed(1)} in {lightest.label}. Fewer, sharper alerts with the summary inside is the first thing to test there.</>}
      </p>
    </div>
  );
}
