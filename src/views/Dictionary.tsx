import { useEffect, useMemo, useState } from 'react';
import { Chip } from '../components/ui';
import { DEFINITION_NOTES, LENS_LABEL, METRICS, SECTIONS, STAGE_COLOR, TIER_LABEL, USER_ONLY, stageOf, type Tier } from '../lib/metrics';

export function Dictionary({ focus }: { focus?: string }) {
  const [text, setText] = useState('');
  const [section, setSection] = useState('all');
  const [tier, setTier] = useState('all');
  const [lens, setLens] = useState('all');
  const [open, setOpen] = useState<string | null>(focus ?? null);
  useEffect(() => {
    if (!focus) return;
    setOpen(focus);
    setTimeout(() => document.getElementById(`dict-${focus}`)?.scrollIntoView({ block: 'center' }), 250);
  }, [focus]);
  const rows = useMemo(() => METRICS.filter((m) =>
    (section === 'all' || m.section === section) && (tier === 'all' || m.tier === tier) && (lens === 'all' || m.lens === lens) &&
    (!text || `${m.id} ${m.name} ${m.question} ${m.definition}`.toLowerCase().includes(text.toLowerCase()))), [text, section, tier, lens]);
  const sel = 'rounded-full border border-hairline bg-surface px-3 py-1.5 text-[12px] text-ink';
  return (
    <div className="pt-4">
      <h1 className="serif text-[44px] leading-tight">Metric dictionary</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-muted">All {METRICS.length} metrics on the dashboard with the question each answers, why it matters, the decision it drives and why it is drawn the way it is. Left out as vanity: total cases tracked, total logins, total AI queries, total documents uploaded.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search metrics…" className="w-full rounded-full border border-hairline bg-surface px-4 py-1.5 text-[13px] text-ink outline-none placeholder:text-muted sm:w-64" />
        <select value={section} onChange={(e) => setSection(e.target.value)} className={sel} aria-label="Section"><option value="all">All sections</option>{SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className={sel} aria-label="Tier"><option value="all">All tiers</option>{(Object.keys(TIER_LABEL) as Tier[]).map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</select>
        <select value={lens} onChange={(e) => setLens(e.target.value)} className={sel} aria-label="Lens"><option value="all">All lenses</option><option value="business">Business</option><option value="technical">Tech</option><option value="ai">AI</option></select>
      </div>
      <div className="card mt-5 overflow-hidden">
        {rows.map((m) => {
          const isOpen = open === m.id;
          const color = `var(--${STAGE_COLOR[stageOf(m.id)]})`;
          return (
            <div key={m.id} id={`dict-${m.id}`} className={`border-b border-hairline last:border-0 ${focus === m.id ? 'bg-surface-2' : ''}`}>
              <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-canvas sm:grid-cols-[52px_220px_1fr_auto]">
                <span className="font-mono text-[12px] text-muted">{m.id}</span>
                <span className="flex items-center gap-2 text-[14px] font-medium"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />{m.name}</span>
                <span className="hidden text-[13px] text-muted sm:block">{m.question}</span>
                <span className="flex gap-1"><Chip>{TIER_LABEL[m.tier]}</Chip><span className="hidden sm:inline"><Chip>{LENS_LABEL[m.lens]}</Chip></span></span>
              </button>
              {isOpen && (
                <div className="grid gap-4 px-4 pb-5 sm:grid-cols-2 sm:pl-[68px]">
                  {[['Question it answers', m.question], ['Why it matters', m.why], ['If it moves, we would…', m.decision], ['Chart', `${m.chart}. ${m.chart_why}`], ['Definition', m.definition + (DEFINITION_NOTES[m.id] ? ` ${DEFINITION_NOTES[m.id]}` : '')], ['Source events', m.events]].map(([k, v]) => (
                    <div key={k}><div className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>{k}</div><p className="mt-0.5 text-[13px] leading-snug">{v}</p></div>
                  ))}
                  <div className="sm:col-span-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>Formula</div>
                    <code className="mt-1 block rounded-lg bg-canvas px-3 py-2 font-mono text-[12px]">{m.formula}</code>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted sm:col-span-2">
                    <span><b className="text-ink">Refresh</b> {m.refresh}</span><span><b className="text-ink">Alert</b> {m.alert}</span><span><b className="text-ink">Views</b> {m.views}</span><span><b className="text-ink">Sample</b> {m.sample}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!rows.length && <p className="px-4 py-8 text-center text-[13px] text-muted">No metric matches.</p>}
      </div>
      <h2 className="serif mt-10 text-[28px]">User view only</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {USER_ONLY.map((u) => (
          <div key={u.id} className="card p-4"><div className="font-mono text-[11px] text-muted">{u.id}</div><div className="font-medium">{u.name}</div><p className="mt-1 text-[13px] text-muted">{u.question}</p><p className="mt-2 text-[12px]">{u.chart}. {u.chart_why}</p></div>
        ))}
      </div>
    </div>
  );
}
