// Consistency checks from docs/03-data-spec.md section 9, plus every sample value in
// docs/02-metric-dictionary.md. The build runs these first and fails if any fails.
import { describe, expect, it } from 'vitest';
import { activity, aiEvents, alerts, hearings, matterById, matters, suggestions, teams, userById, users } from '../src/lib/data';
import { DATA_END, periodStart, toDay } from '../src/lib/dates';
import * as S from '../src/lib/selectors';

const P = (x: number) => Math.round(x * 100);
const R1 = (x: number) => Math.round(x * 10) / 10;
const ORG = S.ORG;
const team = S.teamScope;
const user = S.userScope;
const BU = ['sales-distribution', 'procurement', 'human-resources', 'finance-corporate'];
const FIRMS = ['firm-mehra', 'firm-subramanian', 'firm-desai', 'firm-banerjee', 'firm-chandra'];

describe('1. active matters and court types', () => {
  it('412 active, by business unit', () => {
    const a = S.activeMatters(ORG);
    expect(a.count).toBe(412);
    expect(a.byBu.map((b) => b.count)).toEqual([148, 104, 92, 68]);
    expect(a.byBu.reduce((s, b) => s + b.count, 0)).toBe(412);
  });
  it('court types sum to 412', () => {
    const c = Object.fromEntries(S.courtTypes().map((x) => [x.court, x.count]));
    expect(c).toEqual({ 'High Court': 118, 'District court': 164, 'Consumer forum': 72, Tribunal: 46, 'Supreme Court': 12 });
  });
  it('Ritika owns 96 of 148 S&D matters', () => expect(S.mattersIn(user('ritika-sharma'), S.activeMattersAt()).length).toBe(96));
  it('active count drifts from 400 to 412', () => {
    const w = S.activeMattersWeekly(ORG);
    expect(S.activeMattersAt(S.DATA_START - 1).length).toBe(400);
    expect(w[0].count).toBeLessThanOrEqual(410);
    expect(w[w.length - 1].count).toBe(412);
  });
  it('new matters and disposals, last 90 days', () => {
    const f = S.flows(90);
    expect(f.added).toBe(192);
    expect(f.bySource).toEqual({ suggestion: 162, manual: 21, court_search: 9 });
    expect(f.disposed).toBe(180);
    const nb = S.earlyCapture(ORG).byBu.map((b) => b.total);
    expect(nb).toEqual([70, 50, 42, 30]);
  });
  it('contract-based share 46% (S&D 58, Procurement 61, HR 29, Finance 22)', () => {
    const c = S.contractShare(ORG);
    expect(c.contract).toBe(191);
    expect(P(c.rate)).toBe(46);
    expect(c.byBu.map((b) => P(b.rate))).toEqual([58, 61, 29, 22]);
  });
  it('default priority 96%', () => expect(P(S.defaultPriority().rate)).toBe(96));
  it('dormant 63 (15%), up from 41 in June', () => {
    const d = S.dormant(ORG);
    expect(d.count).toBe(63);
    expect(P(d.share)).toBe(15);
    const june = d.series.filter((x) => x.week.endsWith('Jun'));
    expect(june[0].count).toBe(41);
    // rising steadily: never falls week on week
    for (let i = 1; i < d.series.length; i++) expect(d.series[i].count).toBeGreaterThanOrEqual(d.series[i - 1].count);
  });
});

describe('2 and 3. hearings and close-out (last 30 days)', () => {
  it('216 hearings; per-owner table holds exactly', () => {
    const co = S.closeOut(ORG, 30);
    expect(co.total).toBe(216);
    expect(co.closed).toBe(132);
    const lag = S.firmLag(30);
    const row = (id: string) => lag.rows.find((r) => r.id === id)!;
    const expectRow = (id: string, n: number, closed: number, medianLag: number, onPlatform: number) => {
      const r = row(id);
      expect(r.hearings).toBe(n);
      expect(Math.round(r.closeOut * n)).toBe(closed);
      expect(R1(r.medianLag)).toBe(medianLag);
      expect(P(r.onPlatform)).toBe(onPlatform);
    };
    expect(lag.inhouse.hearings).toBe(58);
    expect(Math.round(lag.inhouse.closeOut * 58)).toBe(51);
    expect(R1(lag.inhouse.medianLag)).toBe(1.1);
    expectRow('firm-mehra', 82, 24, 9.4, 22);
    expectRow('firm-subramanian', 24, 18, 1.8, 86);
    expectRow('firm-desai', 22, 17, 2.1, 79);
    expectRow('firm-banerjee', 16, 12, 2.6, 74);
    expectRow('firm-chandra', 14, 10, 2.3, 70);
    expect(P(row('firm-mehra').share)).toBe(38);
  });
  it('close-out 61% org, 51% counsel, 88% in-house, 37% Ritika', () => {
    const co = S.closeOut(ORG, 30);
    expect(P(co.rate)).toBe(61);
    expect(co.counsel.closed).toBe(81);
    expect(co.counsel.total).toBe(158);
    expect(P(co.counsel.rate)).toBe(51);
    expect(P(co.inhouse.rate)).toBe(88);
    const r = S.closeOut(user('ritika-sharma'), 30);
    expect(r.total).toBe(70);
    expect(r.closed).toBe(26);
    expect(P(r.rate)).toBe(37);
  });
  it('Ritika: Mehra 60 (18 closed), in-house 6 (5), other firms 4 (3)', () => {
    const hs = S.hearingsIn(user('ritika-sharma')).filter((h) => toDay(h.date) >= periodStart(30) && toDay(h.date) <= DATA_END);
    const part = (f: (h: (typeof hs)[number]) => boolean) => { const x = hs.filter(f); return [x.length, x.filter(S.isClosedOut).length]; };
    expect(part((h) => h.firm_id === 'firm-mehra')).toEqual([60, 18]);
    expect(part((h) => h.owner_type === 'inhouse')).toEqual([6, 5]);
    expect(part((h) => h.owner_type === 'counsel' && h.firm_id !== 'firm-mehra')).toEqual([4, 3]);
  });
  it('hearings by BU: 78 / 56 / 46 / 36; Mehra = S&D 64 + Finance 18', () => {
    expect(BU.map((b) => S.closeOut(team(b), 30).total)).toEqual([78, 56, 46, 36]);
    const ex = S.firmExtras('firm-mehra', 30).byBu;
    expect(Object.fromEntries(ex.map((x) => [x.id, x.hearings]))).toEqual({ 'sales-distribution': 64, 'finance-corporate': 18 });
  });
  it('47 awaiting update; Ritika 19; no one else above 6', () => {
    const a = S.awaiting(ORG);
    expect(a.total).toBe(47);
    expect(a.rows[0].id).toBe('ritika-sharma');
    expect(a.rows[0].total).toBe(19);
    expect(a.rows.slice(1).every((r) => r.total <= 6)).toBe(true);
  });
  it('trend: about 72% in June with Mehra at 15%; bends in August to 61%', () => {
    const w = S.closeOutWeekly(ORG);
    const june = w.filter((x) => x.week.endsWith('Jun'));
    const jr = june.reduce((a, x) => a + (x.all ?? 0) * x.n, 0) / june.reduce((a, x) => a + x.n, 0);
    expect(P(jr)).toBe(72);
    const jm = june.reduce((a, x) => a + (x.mehraShare ?? 0) * x.n, 0) / june.reduce((a, x) => a + x.n, 0);
    expect(P(jm)).toBe(15);
    const july = w.filter((x) => x.week.endsWith('Jul'));
    const sep = w.filter((x) => x.week.endsWith('Sep'));
    const avg = (xs: typeof w) => xs.reduce((a, x) => a + (x.all ?? 0), 0) / xs.length;
    expect(avg(july) - avg(sep)).toBeGreaterThan(0.06);
  });
  it('Pooja Nair 91%; Karan Mehra 34 hearings, 24%, median lag 11.2, last active 16 days ago', () => {
    expect(P(S.closeOut(user('pooja-nair'), 30).rate)).toBe(91);
    const k = S.closeOut(user('karan-mehra'), 30);
    expect(k.total).toBe(34);
    expect(P(k.rate)).toBe(24);
    const lags = S.hearingsIn(user('karan-mehra')).filter((h) => toDay(h.date) >= periodStart(30) && h.lag_days !== null).map((h) => h.lag_days!);
    expect(R1(S.median(lags))).toBe(11.2);
    expect(S.TODAY - toDay(userById.get('karan-mehra')!.last_active!)).toBe(16);
  });
  it('Pooja: every counsel on her hearings is on-platform', () => {
    const firms = new Set(S.hearingsIn(user('pooja-nair')).filter((h) => h.firm_id).map((h) => h.firm_id));
    expect(firms.has('firm-mehra')).toBe(false);
  });
});

describe('4. seats and weekly active users', () => {
  it('seats per role sum to 150', () => {
    const c = (r: string) => users.filter((u) => u.role === r).length;
    expect([c('Admin'), c('Legal'), c('Business'), c('Lawyer')]).toEqual([4, 22, 96, 28]);
    expect(users.length).toBe(150);
    const legal = BU.map((b) => users.filter((u) => u.role === 'Legal' && u.team_id === b).length);
    expect(legal).toEqual([7, 6, 5, 4]);
    const law = FIRMS.map((f) => users.filter((u) => u.team_id === f).length);
    expect(law).toEqual([9, 6, 5, 4, 4]);
  });
  it('WAU 68 of 150 (45%): Admin 4/4, Legal 20/22, Lawyer 13/28, Business 31/96', () => {
    const w = S.wau(ORG);
    expect(w.active).toBe(68);
    expect(P(w.rate)).toBe(45);
    const r = Object.fromEntries(w.byRole.map((x) => [x.role, `${x.active}/${x.seats}`]));
    expect(r).toEqual({ Admin: '4/4', Legal: '20/22', Lawyer: '13/28', Business: '31/96' });
    const biz = BU.map((b) => S.wau(team(b)).byRole.find((x) => x.role === 'Business')!.active);
    expect(biz).toEqual([9, 4, 10, 8]);
    expect(S.wau(team('firm-mehra')).active).toBe(2);
  });
  it('sum of team WAU = org WAU', () => {
    const sum = teams.reduce((a, t) => a + S.wau(team(t.id)).active, 0);
    expect(sum).toBe(68);
  });
  it('time to first value: Admin 1, Legal 2, Business 11, Lawyer 19', () => {
    const t = Object.fromEntries(S.timeToFirstValue(ORG).map((x) => [x.role, x.median]));
    expect(t).toEqual({ Admin: 1, Legal: 2, Business: 11, Lawyer: 19 });
  });
  it('feature stickiness (rolling DAU/MAU)', () => {
    const s = Object.fromEntries(S.stickiness(ORG).map((x) => [x.id, P(x.rate)]));
    expect(s).toEqual({ my_cases: 52, hearing_updates: 38, calendar_queue: 33, ask_ai: 29, documents: 21, insights: 9, research: 7, tasks: 6, codex: 4, spend: 2 });
  });
});

describe('5. AI credits', () => {
  it('October credits sum to 6,000 and the crossing day is 19', () => {
    const r = S.creditRunway();
    const oct = r.byMonth.find((m) => m.m === 9)!;
    expect(oct.used).toBe(6000);
    expect(oct.limitDay).toBe(19);
    expect(r.byMonth.map((m) => m.limitDay)).toEqual([null, null, 27, 22, 19, null]);
    expect(r.byMonth[0].used).toBe(4420);
    expect(r.byMonth[1].used).toBe(5180);
    expect(r.current.used).toBe(2310);
    expect(r.projected).toBe(18);
  });
  it('October by feature', () => {
    const c = Object.fromEntries(S.creditsByFeature(9).rows.map((r) => [r.f, [r.credits, P(r.share), r.uses]]));
    expect(c).toEqual({
      ai_diligence: [2760, 46, 276], ask_ai: [1440, 24, 720], case_summary: [720, 12, 240], mis_report: [480, 8, 48],
      translation: [240, 4, 60], codex: [180, 3, 90], file_summary: [180, 3, 90],
    });
    const d = S.diligenceByUser(9);
    expect(d.length).toBe(3);
    expect(d[0].id).toBe('vikram-joshi');
    expect(P(d[0].share)).toBe(62);
  });
  it('Ask AI: 40 a day before the limit, 3 blocked attempts after (down 93%)', () => {
    const a = S.askAfterLimit();
    expect(a.avgBefore).toBe(40);
    expect(a.avgAfter).toBe(3);
    expect(P(a.drop)).toBe(93);
    expect(a.days.slice(18, 31).every((d) => d.ok === 0 && d.blocked > 0)).toBe(true);
    expect(a.days.slice(18, 31).reduce((x, d) => x + d.blocked, 0)).toBe(39);
    expect(a.days.slice(0, 18).reduce((x, d) => x + d.ok, 0)).toBe(720);
  });
  it('adoption and action rate (base 33)', () => {
    const a = S.aiAdoption(ORG, 30);
    expect(a.base).toBe(33);
    const r = Object.fromEntries(a.rows.map((x) => [x.id, [x.users, P(x.adoption), P(x.actionRate)]]));
    expect(r).toEqual({ ask_ai: [22, 67, 61], case_summary: [18, 55, 72], codex: [12, 36, 24], file_summary: [10, 30, 58], translation: [4, 12, 81], ai_diligence: [3, 9, 17] });
  });
  it('rejection: regenerate 14%, thumbs-down 6%; 4% before the model change, 7% for two weeks', () => {
    const r = S.rejection(30);
    expect(P(r.regenerate)).toBe(14);
    expect(P(r.thumbs)).toBe(6);
    const sep14 = r.weekly.findIndex((w) => w.week === '14 Sep');
    expect(sep14).toBeGreaterThan(0);
    expect(P(r.weekly[sep14 - 2].thumbs)).toBe(4);
    expect(P(r.weekly[sep14].thumbs)).toBe(7);
    expect(P(r.weekly[sep14 + 1].thumbs)).toBe(7);
    expect(P(r.weekly[sep14 + 3].thumbs)).toBe(6);
  });
  it('summary accuracy: 89 to 92%, last 4 weeks 90.6%', () => {
    const a = S.summaryAccuracy();
    expect(R1(a.last4Avg * 100)).toBe(90.6);
    expect(a.min).toBeGreaterThanOrEqual(0.89);
    expect(a.max).toBeLessThanOrEqual(0.92);
  });
  it('insight follow-through 7%', () => expect(P(S.insightFollowThrough(30).rate)).toBe(7));
});

describe('6 and 7. intake', () => {
  it('suggestions 1,140 / 638 / 198 / 440 / 502', () => {
    const f = S.intakeFunnel();
    expect([f.suggested, f.reviewed, f.accepted, f.deleted, f.expired]).toEqual([1140, 638, 198, 440, 502]);
    expect([f.added, f.mapped]).toEqual([162, 36]);
    expect(P(f.expiredShare)).toBe(44);
    expect(P(f.falseMatchShare)).toBe(69);
    expect(suggestions.length).toBe(1140);
  });
  it('precision per keyword group', () => {
    const p = S.intakePrecision();
    expect(p.rows.map((r) => [r.suggested, r.reviewed, r.accepted, P(r.precision)])).toEqual([[512, 290, 64, 22], [344, 180, 32, 18], [188, 98, 54, 55], [96, 70, 48, 69]]);
    expect(P(p.overall)).toBe(31);
  });
  it('early capture 100 of 192; S&D 40/70, Procurement 17/50, HR 28/42, Finance 15/30', () => {
    const e = S.earlyCapture(ORG);
    expect([e.early, e.total]).toEqual([100, 192]);
    expect(P(e.rate)).toBe(52);
    expect(e.byBu.map((b) => `${b.early}/${b.total}`)).toEqual(['40/70', '17/50', '28/42', '15/30']);
    expect(e.medianFilingToTracked).toBe(23);
  });
  it('field completeness at add and day 14', () => {
    const f = Object.fromEntries(S.fieldCompleteness(ORG).rows.map((r) => [r.id, [P(r.atAdd), P(r.day14)]]));
    expect(f).toEqual({ exposure: [3, 11], amount_claimed: [5, 14], counsel: [41, 63], risk_rating: [2, 9], key_action: [1, 6] });
  });
});

describe('supporting signals', () => {
  it('Insights reach 9 a week (Admin 3, Legal 4, Business 2); MIS 64 in October, 48 with AI', () => {
    const r = S.insightsReach();
    for (const w of r.weekly.slice(-6)) expect([w.Admin, w.Legal, w.Business]).toEqual([3, 4, 2]);
    expect(r.avgViewers).toBe(9);
    expect(r.misOct).toBe(64);
    expect(r.misOctAi).toBe(48);
    const biz = new Set(activity.filter((a) => a.k === 'insight_viewed' && toDay(a.t.slice(0, 10)) >= periodStart(30) && userById.get(a.u)!.role === 'Business').map((a) => userById.get(a.u)!.team_id));
    expect([...biz]).toEqual(['finance-corporate']);
  });
  it('alert follow-through: HR 52, S&D 41, Finance 37, Procurement 18; Neha 12', () => {
    const a = S.alertFollowThrough(ORG, 30);
    expect(Object.fromEntries(a.byBu.map((b) => [b.id, P(b.rate)]))).toEqual({ 'sales-distribution': 41, procurement: 18, 'human-resources': 52, 'finance-corporate': 37 });
    expect(P(a.byUser.find((u) => u.id === 'neha-iyer')!.rate)).toBe(12);
  });
  it('spend capture 74 of 412 (18%): 31 / 25 / 8 / 10', () => {
    const s = S.spendCapture(ORG);
    expect([s.captured, s.total, P(s.rate)]).toEqual([74, 412, 18]);
    expect(s.byBu.map((b) => b.captured)).toEqual([31, 25, 8, 10]);
  });
  it('page load p95: Insights 6.8, Codex 4.1, My Cases 2.4, case page 1.9', () => {
    expect(Object.fromEntries(S.pageLoads().map((p) => [p.page, p.p95]))).toEqual({ Insights: 6.8, Codex: 4.1, 'My Cases': 2.4, 'Case page': 1.9 });
  });
  it('rate-limit errors 4.1 per 100 sessions, 9.7 on Monday mornings', () => {
    const r = S.rateLimits(30);
    expect(R1(r.avg)).toBe(4.1);
    expect(R1(r.monday)).toBe(9.7);
  });
  it('court sync freshness and failure rate', () => {
    const s = S.syncFreshness();
    expect(Object.fromEntries(s.byCourt.map((c) => [c.court, P(c.rate)]))).toEqual({ 'Supreme Court': 99, 'High Court': 96, Tribunal: 83, 'District court': 71, 'Consumer forum': 64 });
    expect(R1(s.failureRate * 100)).toBe(6.2);
  });
  it('zero-result searches: court 21%, Codex 9%; top missed queries named', () => {
    const z = S.zeroResults(30);
    expect(z.map((r) => P(r.rate))).toEqual([21, 9]);
    expect(z[0].top.map((q) => q.query)).toContain('Pune labour court order');
    expect(z[0].top.map((q) => q.query)).toContain('Maharashtra RERA complaint');
    expect(z[1].top.map((q) => q.query)).toContain('matters linked to dealer agreement');
  });
});

describe('8. users sum to teams, teams sum to org', () => {
  const periods = [30, 90, 180] as const;
  it('hearings and close-outs', () => {
    for (const p of periods) {
      const org = S.closeOut(ORG, p);
      let tot = 0, closed = 0;
      for (const t of [...BU]) {
        const tc = S.closeOut(team(t), p);
        const us = users.filter((u) => u.team_id === t && u.role === 'Legal').map((u) => S.closeOut(user(u.id), p));
        expect(us.reduce((a, x) => a + x.total, 0)).toBe(tc.total);
        expect(us.reduce((a, x) => a + x.closed, 0)).toBe(tc.closed);
        tot += tc.total; closed += tc.closed;
      }
      expect(tot).toBe(org.total);
      expect(closed).toBe(org.closed);
      let ct = 0;
      for (const f of FIRMS) {
        const tc = S.closeOut(team(f), p);
        const us = users.filter((u) => u.team_id === f).map((u) => S.closeOut(user(u.id), p));
        expect(us.reduce((a, x) => a + x.total, 0)).toBe(tc.total);
        expect(us.reduce((a, x) => a + x.closed, 0)).toBe(tc.closed);
        ct += tc.total;
      }
      expect(ct).toBe(org.counsel.total);
    }
  });
  it('matters, awaiting, dormant, new matters, fields, WAU', () => {
    let am = 0, aw = 0, dm = 0, nm = 0;
    for (const t of BU) {
      const legal = users.filter((u) => u.team_id === t && u.role === 'Legal');
      const sum = (f: (id: string) => number) => legal.reduce((a, u) => a + f(u.id), 0);
      expect(sum((id) => S.mattersIn(user(id), S.activeMattersAt()).length)).toBe(S.activeMatters(team(t)).count);
      expect(sum((id) => S.awaiting(user(id)).total)).toBe(S.awaiting(team(t)).total);
      expect(sum((id) => S.dormant(user(id)).count)).toBe(S.dormant(team(t)).count);
      expect(sum((id) => S.userKpis(id, 30).newMatters)).toBe(S.earlyCapture(team(t)).total);
      for (const f of S.FIELDS) expect(sum((id) => S.fieldCompleteness(user(id)).rows.find((r) => r.id === f.id)!.n14)).toBe(S.fieldCompleteness(team(t)).rows.find((r) => r.id === f.id)!.n14);
      am += S.activeMatters(team(t)).count; aw += S.awaiting(team(t)).total; dm += S.dormant(team(t)).count; nm += S.earlyCapture(team(t)).total;
    }
    expect(am).toBe(412); expect(aw).toBe(47); expect(dm).toBe(63); expect(nm).toBe(192);
    for (const t of teams) {
      const wsum = users.filter((u) => u.team_id === t.id).filter((u) => S.isWeeklyActive(u.id)).length;
      expect(wsum).toBe(S.wau(team(t.id)).active);
    }
  });
  it('alerts and AI actions', () => {
    const org = S.alertFollowThrough(ORG, 30);
    for (const t of BU) {
      const tv = S.alertFollowThrough(team(t), 30);
      const byUser = org.byUser.filter((u) => userById.get(u.id)!.team_id === t);
      expect(byUser.reduce((a, u) => a + u.viewed, 0)).toBe(tv.viewed);
      expect(byUser.reduce((a, u) => a + u.sent, 0)).toBe(tv.sent);
    }
    const a30 = aiEvents.filter((e) => toDay(e.t.slice(0, 10)) >= periodStart(30) && e.a && !e.b).length;
    expect(users.reduce((s, u) => s + S.userKpis(u.id, 30).aiActions, 0)).toBe(a30);
  });
});

describe('9. signal cards read the same selectors', () => {
  it('headlines carry the numbers the charts show', () => {
    const [a, b, c] = S.signals(30);
    expect(a.headline).toBe('Mehra & Associates closes only 29% of hearings on time and carries 38% of them');
    expect(b.headline).toBe('AI credits ran out on day 19; AI Diligence used 46% of them with a 17% action rate');
    expect(c.headline).toBe('69% of reviewed intake suggestions are false matches; Procurement tracks only 34% of cases before the first hearing');
    expect(a.drill.href).toBe('#/team/firm-mehra');
  });
});

describe('data integrity', () => {
  it('no activity on dormant matters after they went quiet, no actions after last active', () => {
    for (const u of users) {
      const last = u.last_active ? toDay(u.last_active) : -1;
      const days = [...activity.filter((a) => a.u === u.id), ...aiEvents.filter((e) => e.u === u.id)].map((a) => toDay(a.t.slice(0, 10)));
      if (!u.last_active) expect(days.length).toBe(0);
      else expect(Math.max(...days)).toBe(last);
    }
  });
  it('every hearing points to a matter and an owner', () => {
    for (const h of hearings) {
      expect(matterById.get(h.matter_id)).toBeTruthy();
      expect(userById.get(h.owner_id)).toBeTruthy();
      if (h.outcome_recorded_on) expect(toDay(h.outcome_recorded_on)).toBeLessThanOrEqual(DATA_END);
    }
    expect(matters.every((m) => userById.get(m.case_manager_id)?.role === 'Legal')).toBe(true);
    expect(alerts.every((a) => userById.get(a.user_id)!.role === 'Business')).toBe(true);
  });
});
