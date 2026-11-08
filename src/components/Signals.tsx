import { motion } from 'motion/react';
import { go, useApp, useTokens } from '../app/state';
import { CreditRunway } from '../charts/charts';
import { q } from '../lib/q';
import { ORG } from '../lib/selectors';
import { showMe } from './ChartCard';
import { Sparkline } from './ui';

function MiniMehra() {
  const t = useTokens();
  const w = q.closeOutWeekly(ORG).filter((x) => x.n > 0);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div><div className="mb-1 text-[11px] text-muted">Close-out, all hearings</div><Sparkline data={w.map((x) => x.all)} color={t.hearing} height={40} target={0.8} min={0.4} max={0.9} /></div>
      <div><div className="mb-1 text-[11px] text-muted">Mehra's share of hearings</div><Sparkline data={w.map((x) => x.mehraShare)} color={t.hearing} height={40} min={0} max={0.5} /></div>
    </div>
  );
}
function MiniIntake() {
  const p = q.intakePrecision();
  const e = q.earlyCapture(ORG);
  return (
    <div className="grid grid-cols-2 gap-3 text-[11px]">
      <div className="space-y-1">
        <div className="text-muted">Precision by keyword</div>
        {[...p.rows].sort((a, b) => a.precision - b.precision).map((r) => (
          <div key={r.id} className="flex items-center gap-1.5"><div className="h-1.5 rounded-full" style={{ width: `${r.precision * 70}%`, background: r.precision < 0.25 ? 'var(--intake)' : 'var(--quiet)' }} /><span className="num">{Math.round(r.precision * 100)}%</span></div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-muted">Tracked before 1st hearing</div>
        {e.byBu.map((b) => (
          <div key={b.id} className="flex items-center gap-1.5"><div className="h-1.5 rounded-full" style={{ width: `${b.rate * 70}%`, background: b.id === 'procurement' ? 'var(--intake)' : 'var(--quiet)' }} /><span className="num">{Math.round(b.rate * 100)}%</span></div>
        ))}
      </div>
    </div>
  );
}

export function Signals() {
  const { period } = useApp();
  const sig = q.signals(period);
  const mini = { counsel: <MiniMehra />, ai: <div className="h-[64px]"><CreditRunway height={64} mini /></div>, intake: <MiniIntake /> };
  return (
    <section aria-labelledby="signals-title" className="mesh -mx-4 rounded-[28px] px-4 pb-6 pt-6 sm:-mx-6 sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="signals-title" className="serif text-[28px] leading-tight">Today's three signals</h2>
        <span className="hidden text-[12px] text-muted sm:block">Each one links to its evidence and to the people behind it</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {sig.map((s, i) => (
          <motion.article key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.22 }} className="card flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: `var(--${s.stage})` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--${s.stage})` }} /> Signal {i + 1} · {s.stage === 'hearing' ? 'Hearing loop' : s.stage === 'ai' ? 'AI behaviour' : 'Intake'}
            </div>
            <h3 className="serif mt-2 text-[24px] leading-[1.15] text-ink">{s.headline}</h3>
            <p className="mt-2 text-[13px] leading-snug text-muted">{s.detail}</p>
            <div className="mt-4">{mini[s.id as keyof typeof mini]}</div>
            <div className="mt-auto flex gap-2 pt-5">
              <button onClick={() => showMe(s.showMe)} className="rounded-full border border-hairline px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:bg-canvas">Show me</button>
              <button onClick={() => go(s.drill.href)} className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-surface transition hover:opacity-90" style={{ background: `var(--${s.stage})` }}>Drill in →</button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
