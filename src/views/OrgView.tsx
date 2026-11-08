import { useApp } from '../app/state';
import {
  AccuracyLine, AiQuadrant, AlertBars, AskDaily, AwaitingBars, CloseOutTrend, ContractBars, CreditRunway, DormantArea, Dumbbell, EarlyCaptureBars,
  FirmScatter, IntakeFunnel, NumberSpark, PageLoadBars, PrecisionBars, RateLimitLine, ReachBars, RejectionLines, SpendBars, StickinessBars, SyncBars,
  TtfvDots, WauBullets, ZeroResults,
} from '../charts/charts';
import { ChartCard } from '../components/ChartCard';
import { PulseRow } from '../components/Pulse';
import { SectionChips, SectionNav } from '../components/SectionNav';
import { Signals } from '../components/Signals';
import { TeamsTable } from '../components/TeamsTable';
import { nf, pc, SectionTitle } from '../components/ui';
import { SECTIONS, STAGE_COLOR, type Stage } from '../lib/metrics';
import { q } from '../lib/q';
import { ORG } from '../lib/selectors';

const NAV = [...SECTIONS.map((s) => ({ id: s.id, title: s.title })), { id: 'teams', title: 'Teams' }];

export function Section({ id, children, cols = 2, grid }: { id: string; children: React.ReactNode; cols?: 2 | 3; grid?: string }) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <section aria-label={s.title}>
      <SectionTitle id={id} title={s.title} purpose={s.purpose} color={`var(--${STAGE_COLOR[id as Stage]})`} />
      <div className={`grid gap-4 ${grid ?? (cols === 3 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2')}`}>{children}</div>
    </section>
  );
}

export function OrgView() {
  const { period } = useApp();
  const co = q.closeOut(ORG, period);
  const run = q.creditRunway();
  const w = q.wau(ORG);
  const funnel = q.intakeFunnel();
  const prec = q.intakePrecision();
  const ec = q.earlyCapture(ORG);
  const fc = q.fieldCompleteness(ORG);
  const dp = q.defaultPriority();
  const lag = q.firmLag(period);
  const aw = q.awaiting(ORG);
  const dm = q.dormant(ORG);
  const ai = q.aiAdoption(ORG, period);
  const ask = q.askAfterLimit();
  const rej = q.rejection(period);
  const acc = q.summaryAccuracy();
  const ft = q.insightFollowThrough(period);
  const reach = q.insightsReach();
  const al = q.alertFollowThrough(ORG, period);
  const sp = q.spendCapture(ORG);
  const cs = q.contractShare(ORG);
  const pl = q.pageLoads();
  const rl = q.rateLimits(30);
  const sync = q.syncFreshness();
  const mehra = lag.rows.find((r) => r.id === 'firm-mehra')!;
  const dil = ai.rows.find((r) => r.id === 'ai_diligence')!;
  const octDil = q.creditsByFeature(9).rows.find((r) => r.f === 'ai_diligence')!;
  return (
    <div>
      <Signals />
      <div className="mt-8"><SectionTitle id="pulse" title="Pulse" purpose={SECTIONS[0].purpose} color="var(--hearing)" /></div>
      <PulseRow scope={ORG} period={period} />
      <SectionChips items={NAV} />
      <div className="flex gap-8">
        <SectionNav items={NAV} />
        <div className="min-w-0 flex-1">
          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            <ChartCard id="M01" className="lg:col-span-2" headline={<Head items={[[pc(co.rate), `closed out in ${period} days`], [pc(co.inhouse.rate), 'in-house'], [pc(co.counsel.rate), 'counsel-owned']]} />} note="Counsel-owned hearings fell away after Mehra & Associates took over the Sales dealer disputes on 1 Aug. In-house stays close to target.">
              <CloseOutTrend scope={ORG} height={260} />
            </ChartCard>
            <ChartCard id="M02" headline={<Head items={[[pc(w.rate), `${w.active} of ${w.seats} seats`]]} />} note="A meaningful action means more than a login: recording, creating or updating something.">
              <WauBullets scope={ORG} />
            </ChartCard>
            <ChartCard id="M04" headline={<Head items={[[pc(sync.worst.rate), `${sync.worst.court}s`], [pc(sync.failureRate, 1), 'sync runs failed']]} />}>
              <SyncBars />
            </ChartCard>
            <ChartCard id="M03" className="lg:col-span-2" headline={<Head items={[[`Day ${run.last.limitDay}`, 'October limit day'], [`Day ${run.prev.limitDay}`, 'September'], [`Day ${run.projected}`, 'November, projected']]} />} note={`When credits run out, every AI feature stops for the whole account until the 1st. November has used ${nf(run.current.used)} credits in ${run.current.lastDay} days.`}>
              <CreditRunway height={260} />
            </ChartCard>
          </div>

          <Section id="adoption">
            <ChartCard id="M06" note="Spend and Codex sit under the 5% line: candidates to merge, move or retire.">
              <StickinessBars scope={ORG} />
            </ChartCard>
            <ChartCard id="M07" note="Counsel and business users take weeks to do the first thing their role needs.">
              <TtfvDots scope={ORG} />
            </ChartCard>
          </Section>

          <Section id="intake" cols={3}>
            <ChartCard id="M08" headline={<Head items={[[nf(funnel.suggested), 'suggested in 90 days'], [pc(funnel.expiredShare), 'expired unread']]} />}>
              <IntakeFunnel />
            </ChartCard>
            <ChartCard id="M09" headline={<Head items={[[pc(prec.overall), 'precision'], [pc(funnel.falseMatchShare), 'of reviews are false matches']]} />} note='Plain keyword matching: "Meridia" and brand names also pull in unrelated parties with similar names.'>
              <PrecisionBars />
            </ChartCard>
            <ChartCard id="M10" className="lg:col-span-2 xl:col-span-1" drillable headline={<Head items={[[pc(ec.rate), `${ec.early} of ${ec.total} new cases`], [`${ec.medianFilingToTracked} days`, 'median from filing to tracked']]} />}>
              <EarlyCaptureBars />
            </ChartCard>
          </Section>

          <Section id="enrich" grid="lg:grid-cols-3">
            <ChartCard id="M11" className="lg:col-span-2" headline={<Head items={[[pc(fc.rows.find((r) => r.id === 'exposure')!.day14), 'have exposure by day 14']]} />} note="Financials and Team & Counsel tabs in Insights describe only the cases with these fields.">
              <Dumbbell scope={ORG} />
            </ChartCard>
            <ChartCard id="M12" note="Above 90%, priority cannot help anyone choose what to work on.">
              <NumberSpark value={pc(dp.rate)} sub={`${dp.n} of ${dp.total} active cases still at the default "High"`} series={dp.series.map((s) => s.rate)} color="var(--enrich)" labels={[dp.series[0].week, 'now']} />
            </ChartCard>
          </Section>

          <Section id="hearing">
            <ChartCard id="M13" className="lg:col-span-2" drillable headline={<Head items={[[`${mehra.medianLag.toFixed(1)} days`, `${mehra.name} median lag`], [pc(mehra.share), 'of hearings'], [pc(mehra.onPlatform), 'of its cases touched by its lawyers']]} />} note={`In-house hearings: median ${lag.inhouse.medianLag.toFixed(1)} days. Bubble size is hearings in the period.`}>
              <FirmScatter period={period} />
            </ChartCard>
            <ChartCard id="M14" drillable headline={<Head items={[[String(aw.total), 'awaiting an update'], [String(aw.max.total), aw.max.name]]} />} note="Bar split: counsel-owned hearings (colour) and in-house ones (grey).">
              <AwaitingBars scope={ORG} />
            </ChartCard>
            <ChartCard id="M15" headline={<Head items={[[String(dm.count), `dormant (${pc(dm.share)})`], [String(dm.june), 'in June']]} />}>
              <DormantArea scope={ORG} />
            </ChartCard>
          </Section>

          <Section id="ai">
            <ChartCard id="M16" className="lg:col-span-2" headline={<Head items={[[pc(octDil.share), 'of October credits on AI Diligence'], [pc(dil.actionRate), 'of its outputs acted on'], [String(ai.base), 'Legal and Lawyer users in the base']]} />} note="Bubble size is credits used in the period. AI Diligence is run in bulk by 3 people and rarely acted on.">
              <AiQuadrant period={period} />
            </ChartCard>
            <ChartCard id="M17" headline={<Head items={[[String(Math.round(ask.avgBefore)), 'Ask AI queries a day before'], [String(Math.round(ask.avgAfter)), 'blocked attempts after'], [`−${pc(ask.drop)}`, '']]} />}>
              <AskDaily />
            </ChartCard>
            <ChartCard id="M18" headline={<Head items={[[pc(rej.regenerate), 'regenerated'], [pc(rej.thumbs), 'thumbs-down']]} />}>
              <RejectionLines period={period} />
            </ChartCard>
            <ChartCard id="M19" headline={<Head items={[[pc(acc.last4Avg, 1), 'last 4 weeks'], ['50', 'summaries graded a week']]} />}>
              <AccuracyLine />
            </ChartCard>
            <ChartCard id="M20" note="A proxy: Insights text is not clickable yet, so we look for a matching filtered case list within 10 minutes.">
              <NumberSpark value={pc(ft.rate)} sub={`${ft.followed} of ${ft.sessions} Insights sessions in ${period} days`} series={ft.weekly.map((x) => x.rate)} color="var(--ai)" labels={[`week of ${ft.weekly[0].week}`, 'this week']} />
            </ChartCard>
          </Section>

          <Section id="value">
            <ChartCard id="M21" className="lg:col-span-2" headline={<Head items={[[String(reach.avgViewers), 'distinct viewers a week'], [String(reach.misOct), 'MIS downloads in October'], [String(reach.misOctAi), 'with an AI report']]} />} note="Business viewers all come from Finance. Bars and line share one axis: count per week.">
              <ReachBars />
            </ChartCard>
            <ChartCard id="M22" drillable headline={<Head items={[[pc(al.rate), `of ${al.sent} alerts led to a case view`]]} />}>
              <AlertBars period={period} />
            </ChartCard>
            <ChartCard id="M23" drillable headline={<Head items={[[pc(sp.rate), `${sp.captured} of ${sp.total} active cases`]]} />} note="Share of active cases with a spend or invoice entry in the last 90 days.">
              <SpendBars />
            </ChartCard>
            <ChartCard id="M24" className="lg:col-span-2" drillable headline={<Head items={[[pc(cs.rate), `${cs.contract} of ${cs.total} active cases`]]} />} note="Dealer, vendor, commercial and employment contract disputes. Sizes the case for linking litigation to contracts in CLM.">
              <ContractBars />
            </ChartCard>
          </Section>

          <Section id="health">
            <ChartCard id="M25" headline={<Head items={[[`${pl[0].p95.toFixed(1)} s`, `${pl[0].page}, p95 last 7 days`]]} />}>
              <PageLoadBars />
            </ChartCard>
            <ChartCard id="M26" headline={<Head items={[[rl.avg.toFixed(1), 'per 100 sessions'], [rl.monday.toFixed(1), 'Monday 09:00 to 11:00']]} />} note="Dots mark Mondays; the dashed line is the alert at 5 per 100 sessions. Last 90 days.">
              <RateLimitLine />
            </ChartCard>
            <ChartCard id="M27" className="lg:col-span-2" note='The Codex miss "matters linked to dealer agreement" asks for the contract link that M24 sizes.'>
              <ZeroResults />
            </ChartCard>
          </Section>

          <section aria-label="Teams">
            <SectionTitle id="teams" title="Teams" purpose="Business units and counsel firms side by side on the key rates. Click a row to open the team" color="var(--muted)" />
            <TeamsTable />
          </section>
        </div>
      </div>
    </div>
  );
}

export function Head({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map(([v, l], i) => (
        <div key={i} className="flex items-baseline gap-1.5">
          <span className="num text-[22px] font-semibold leading-none">{v}</span>
          <span className="text-[12px] text-muted">{l}</span>
        </div>
      ))}
    </div>
  );
}
