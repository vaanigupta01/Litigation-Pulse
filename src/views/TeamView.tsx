import { useApp } from '../app/state';
import {
  AlertBars, AwaitingBars, CloseOutTrend, ContractBars, DormantArea, Dumbbell, EarlyCaptureBars, FirmByBu, FirmScatter, LagDistribution, SpendBars,
  StickinessBars, TtfvDots, WauBullets,
} from '../charts/charts';
import { ChartCard } from '../components/ChartCard';
import { MembersTable } from '../components/MembersTable';
import { PulseRow } from '../components/Pulse';
import { pc, SectionTitle } from '../components/ui';
import { teamById } from '../lib/data';
import { q } from '../lib/q';
import { ORG, teamScope } from '../lib/selectors';
import { Head } from './OrgView';

export function TeamView({ id }: { id: string }) {
  const { period } = useApp();
  const t = teamById.get(id);
  if (!t) return <NotFound />;
  const s = teamScope(id);
  const isBu = t.type === 'business_unit', isFirm = t.type === 'counsel_firm';
  const members = q.usersIn(s);
  const co = q.closeOut(s, period), orgCo = q.closeOut(ORG, period);
  const aw = q.awaiting(s);
  const dm = q.dormant(s);
  const typeLabel = isBu ? 'Business unit' : isFirm ? `Counsel firm · ${t.city}` : 'Admins';
  const lag = isFirm ? q.firmLag(period).rows.find((r) => r.id === id)! : null;
  const ext = isFirm ? q.firmExtras(id, period) : null;
  return (
    <div>
      <header className="pb-6 pt-4">
        <div className="text-[12px] font-medium uppercase tracking-wide text-muted">{typeLabel} · {members.length} people</div>
        <h1 className="serif mt-1 text-[44px] leading-[1.05] text-ink">{t.name}</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-muted">
          {isBu && `Internal Legal users who run this unit's cases and the Business users who follow them. Tiles carry a tick for the account average.`}
          {isFirm && `External counsel. Hearings this firm owns, how fast its lawyers report outcomes, and who is active on the platform.`}
          {!isBu && !isFirm && 'The General Counsel, Legal Ops and IT. They configure the platform and read Insights.'}
        </p>
      </header>
      {(isBu || isFirm) && <PulseRow scope={s} period={period} />}

      {(isBu || isFirm) && (
        <>
          <SectionTitle id="hearing" title="Hearing loop" purpose={isFirm ? 'Hearings this firm owns and how quickly their outcomes reach Legistify' : "Is each of this unit's hearings closed out on the platform, and by whom"} color="var(--hearing)" />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard id="M01" className="lg:col-span-2" scopeLabel={t.short} headline={<Head items={[[pc(co.rate), `${co.closed} of ${co.total} hearings`], [pc(orgCo.rate), 'account']]} />}>
              <CloseOutTrend scope={s} height={240} />
            </ChartCard>
            {isFirm && lag && (
              <ChartCard id="M13" className="lg:col-span-2" drillable scopeLabel={t.short} headline={<Head items={[[`${lag.medianLag.toFixed(1)} days`, 'median lag'], [pc(lag.share), 'of all hearings'], [pc(lag.onPlatform), 'of its cases touched by its lawyers']]} />}>
                <FirmScatter period={period} highlight={id} />
              </ChartCard>
            )}
            {isFirm && ext && (
              <>
                <ChartCard id="M13" anchor="card-M13-bu" caption="Which business units' hearings does this firm carry?" drillable headline={<Head items={[[String(ext.byBu.reduce((a, b) => a + b.hearings, 0)), `hearings in ${period} days`]]} />} note="Hearings by owning business unit. Click a bar to open the unit.">
                  <FirmByBu firmId={id} period={period} />
                </ChartCard>
                <ChartCard id="M13" anchor="card-M13-lag" caption="How long after each hearing is the outcome recorded?" headline={<Head items={[[String(ext.recorded), 'outcomes recorded'], [String(ext.awaitingNow), 'still awaiting']]} />} note="Grey bars count as closed out (recorded by the second day after the hearing).">
                  <LagDistribution firmId={id} period={period} />
                </ChartCard>
              </>
            )}
            <ChartCard id="M14" drillable scopeLabel={t.short} headline={<Head items={[[String(aw.total), 'awaiting an update']]} />} note={isFirm ? 'Grouped by the in-house case manager who owns the case.' : undefined}>
              <AwaitingBars scope={s} />
            </ChartCard>
            <ChartCard id="M15" scopeLabel={t.short} headline={<Head items={[[String(dm.count), `dormant (${pc(dm.share)})`]]} />}>
              <DormantArea scope={s} />
            </ChartCard>
          </div>
        </>
      )}

      {isBu && (
        <>
          <SectionTitle id="intake" title="Intake and enrichment" purpose="Does this unit hear about new cases early, and do they get the data Insights needs" color="var(--intake)" />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard id="M10" drillable scopeLabel={t.short} note="This unit in colour; the others for comparison."><EarlyCaptureBars highlight={id} /></ChartCard>
            <ChartCard id="M11" scopeLabel={t.short}><Dumbbell scope={s} /></ChartCard>
          </div>
          <SectionTitle id="value" title="Value" purpose="Do this unit's business users act on alerts, and is spend recorded" color="var(--value)" />
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard id="M22" drillable scopeLabel={t.short}><AlertBars period={period} highlight={id} /></ChartCard>
            <ChartCard id="M23" drillable scopeLabel={t.short}><SpendBars highlight={id} /></ChartCard>
            <ChartCard id="M24" drillable scopeLabel={t.short}><ContractBars highlight={id} /></ChartCard>
          </div>
        </>
      )}

      <SectionTitle id="adoption" title="Adoption" purpose="Who in this team uses the module, and which features stick" color="var(--adoption)" />
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard id="M02" scopeLabel={t.short}><WauBullets scope={s} /></ChartCard>
        <ChartCard id="M06" scopeLabel={t.short}><StickinessBars scope={s} /></ChartCard>
        <ChartCard id="M07" scopeLabel={t.short}><TtfvDots scope={s} /></ChartCard>
      </div>

      <div className="pt-10"><MembersTable teamId={id} /></div>
    </div>
  );
}

export function NotFound() {
  return <div className="py-24 text-center text-muted">Nothing here. <a className="text-ink underline" href="#/org">Back to the organisation</a></div>;
}
