// The only place chart numbers come from. Every view (org, team, user) and the
// three signal cards call these functions, so a number is the same wherever it appears.
import {
  account, actionDaysByUser, activity, aiEvents, alerts, dayOf, evals, featureUse, hearings, hearingsByMatter, hourOf, matterActivityDays,
  matterById, matters, spend, suggestions, teamById, teams, tech, userById, users,
} from './data';
import {
  DATA_END, DATA_START, TODAY, WEEKS, dayOfMonth, daysInMonth, dow, firstOfMonth, fmtDay, monthName, monthOf, periodStart, prevPeriodStart,
  weekStart, type Period,
} from './dates';
import { rollingStickiness } from './stickiness';
import type { AiFeature, CourtType, Feature, FieldName, Hearing, Matter, Role, Team, User } from './types';

// ------------------------------------------------------------------ scope
export type Scope = { kind: 'org' } | { kind: 'team'; id: string } | { kind: 'user'; id: string };
export const ORG: Scope = { kind: 'org' };
export const teamScope = (id: string): Scope => ({ kind: 'team', id });
export const userScope = (id: string): Scope => ({ kind: 'user', id });

export const BU_IDS = teams.filter((t) => t.type === 'business_unit').map((t) => t.id);
export const FIRM_IDS = teams.filter((t) => t.type === 'counsel_firm').map((t) => t.id);
export const ROLES: Role[] = ['Admin', 'Legal', 'Lawyer', 'Business'];

export const usersIn = (s: Scope): User[] =>
  s.kind === 'org' ? users : s.kind === 'team' ? users.filter((u) => u.team_id === s.id) : users.filter((u) => u.id === s.id);

/** Matters a scope is responsible for: a unit's matters, a firm's matters, a manager's or lawyer's matters. */
export function mattersIn(s: Scope, list: Matter[] = matters): Matter[] {
  if (s.kind === 'org') return list;
  if (s.kind === 'team') {
    const t = teamById.get(s.id)!;
    if (t.type === 'business_unit') return list.filter((m) => m.bu === s.id);
    if (t.type === 'counsel_firm') return list.filter((m) => m.firm_id === s.id);
    return [];
  }
  const u = userById.get(s.id)!;
  if (u.role === 'Legal') return list.filter((m) => m.case_manager_id === u.id);
  if (u.role === 'Lawyer') return list.filter((m) => m.lawyer_id === u.id);
  return [];
}
/** Hearings a scope owns: by matter for units and case managers, by owning firm or lawyer for counsel. */
export function hearingsIn(s: Scope, list: Hearing[] = hearings): Hearing[] {
  if (s.kind === 'org') return list;
  if (s.kind === 'team') {
    const t = teamById.get(s.id)!;
    if (t.type === 'business_unit') return list.filter((h) => matterById.get(h.matter_id)!.bu === s.id);
    if (t.type === 'counsel_firm') return list.filter((h) => h.firm_id === s.id);
    return [];
  }
  const u = userById.get(s.id)!;
  if (u.role === 'Legal') return list.filter((h) => matterById.get(h.matter_id)!.case_manager_id === u.id);
  if (u.role === 'Lawyer') return list.filter((h) => h.owner_id === u.id);
  return [];
}
export const scopeHasHearings = (s: Scope) => s.kind === 'org' || (s.kind === 'team' && teamById.get(s.id)!.type !== 'leadership') || (s.kind === 'user' && ['Legal', 'Lawyer'].includes(userById.get(s.id)!.role));

// ------------------------------------------------------------------ helpers
export const pct = (a: number, b: number) => (b ? a / b : 0);
export const fmtPct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
}
export function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
const activeOn = (m: Matter, d: number) => dayOf(m.tracked_on) <= d && (!m.disposed_on || dayOf(m.disposed_on) > d);
export const activeMattersAt = (d = DATA_END) => matters.filter((m) => activeOn(m, d));
const weekEnd = (w: number) => Math.min(weekStart(w) + 6, DATA_END);
export const weekLabels = Array.from({ length: WEEKS }, (_, w) => fmtDay(weekStart(w)));

export type Status = 'good' | 'watch' | 'act' | 'info';

// ------------------------------------------------------------------ M01 hearing close-out
export const isClosedOut = (h: Hearing) => h.outcome_recorded_on !== null && dayOf(h.outcome_recorded_on) - dayOf(h.date) <= 2;
const eligible = (h: Hearing, from: number, to: number) => { const d = dayOf(h.date); return d >= from && d <= Math.min(to, TODAY - 2); };
export function closeOut(s: Scope, period: Period, prev = false) {
  const from = prev ? prevPeriodStart(period) : periodStart(period);
  const to = prev ? periodStart(period) - 1 : DATA_END;
  const hs = hearingsIn(s).filter((h) => eligible(h, from, to));
  const part = (pred: (h: Hearing) => boolean) => { const x = hs.filter(pred); const c = x.filter(isClosedOut).length; return { total: x.length, closed: c, rate: pct(c, x.length) }; };
  const all = part(() => true);
  return { ...all, inhouse: part((h) => h.owner_type === 'inhouse'), counsel: part((h) => h.owner_type === 'counsel') };
}
export function closeOutWeekly(s: Scope) {
  const hs = hearingsIn(s);
  return Array.from({ length: WEEKS }, (_, w) => {
    const x = hs.filter((h) => eligible(h, weekStart(w), weekEnd(w)));
    const r = (pred: (h: Hearing) => boolean) => { const y = x.filter(pred); return y.length ? pct(y.filter(isClosedOut).length, y.length) : null; };
    const mehra = x.filter((h) => h.firm_id === 'firm-mehra').length;
    return { week: weekLabels[w], w, all: r(() => true), inhouse: r((h) => h.owner_type === 'inhouse'), counsel: r((h) => h.owner_type === 'counsel'), n: x.length, mehraShare: x.length ? mehra / x.length : null };
  });
}
export const M01_TARGET = 0.8;
export const closeOutStatus = (r: number): Status => (r >= 0.8 ? 'good' : r >= 0.65 ? 'watch' : 'act');

// ------------------------------------------------------------------ M02 weekly active seats
const activeBetween = (uid: string, from: number, to: number) => (actionDaysByUser.get(uid) ?? []).some((d) => d >= from && d <= to);
export function wau(s: Scope, end = DATA_END) {
  const us = usersIn(s);
  const byRole = ROLES.map((role) => {
    const r = us.filter((u) => u.role === role);
    const a = r.filter((u) => activeBetween(u.id, end - 6, end)).length;
    return { role, seats: r.length, active: a, rate: pct(a, r.length) };
  }).filter((r) => r.seats > 0);
  const active = byRole.reduce((a, b) => a + b.active, 0), seats = byRole.reduce((a, b) => a + b.seats, 0);
  return { active, seats, rate: pct(active, seats), byRole };
}
export function wauWeekly(s: Scope) {
  const us = usersIn(s);
  return Array.from({ length: WEEKS }, (_, w) => {
    const a = us.filter((u) => activeBetween(u.id, weekStart(w), weekEnd(w))).length;
    return { week: weekLabels[w], w, active: a, rate: pct(a, us.length) };
  });
}
export const wauStatus = (byRole: { rate: number }[]): Status => (byRole.some((r) => r.rate < 0.3) ? 'act' : byRole.some((r) => r.rate < 0.4) ? 'watch' : 'good');
export const isWeeklyActive = (uid: string) => activeBetween(uid, DATA_END - 6, DATA_END);

// ------------------------------------------------------------------ M03 AI credit runway
export function creditRunway() {
  const limit = account.monthly_ai_limit;
  const months = [5, 6, 7, 8, 9, 10]; // Jun..Nov (0-based)
  const byMonth = months.map((m) => {
    const start = firstOfMonth(2026, m), n = daysInMonth(2026, m);
    const days = Array.from({ length: n }, () => 0);
    for (const e of aiEvents) { const d = dayOf(e.t); if (d >= start && d < start + n) days[d - start] += e.c; }
    let cum = 0, limitDay: number | null = null;
    const lastDay = m === monthOf(DATA_END) ? dayOfMonth(DATA_END) : n;
    const series = days.map((c, i) => { cum += c; if (limitDay === null && cum >= limit) limitDay = i + 1; return i < lastDay ? cum : null; });
    const used = series[lastDay - 1] ?? 0;
    return { month: monthName(m), m, limitDay, used, lastDay, series, partial: lastDay < n };
  });
  const cur = byMonth[byMonth.length - 1];
  const projected = Math.round(limit / (cur.used / cur.lastDay));
  const reached = byMonth.filter((x) => x.limitDay !== null);
  const last = reached[reached.length - 1], prev = reached[reached.length - 2];
  const status: Status = last.limitDay! < 25 ? 'act' : 'watch';
  return { limit, byMonth, projected, current: cur, last, prev, status };
}

// ------------------------------------------------------------------ M04 court sync freshness
export const COURT_TYPES: CourtType[] = ['Supreme Court', 'High Court', 'Tribunal', 'District court', 'Consumer forum'];
export function syncFreshness(prev = false) {
  const to = prev ? DATA_END - 7 : DATA_END, from = to - 6;
  const rows = tech.sync.filter((r) => { const d = dayOf(r.date); return d >= from && d <= to; });
  const byCourt = COURT_TYPES.map((ct) => {
    const x = rows.filter((r) => r.court_type === ct);
    const a = x.reduce((s, r) => s + r.cases_active, 0), y = x.reduce((s, r) => s + r.cases_synced_24h, 0);
    return { court: ct, rate: pct(y, a), cases: x[x.length - 1]?.cases_active ?? 0 };
  });
  const runs = rows.reduce((s, r) => s + r.runs, 0), failed = rows.reduce((s, r) => s + r.runs_failed, 0);
  const a = rows.reduce((s, r) => s + r.cases_active, 0), y = rows.reduce((s, r) => s + r.cases_synced_24h, 0);
  const worst = [...byCourt].sort((p, q) => p.rate - q.rate)[0];
  const status: Status = byCourt.some((c) => c.rate < 0.85) ? 'act' : byCourt.some((c) => c.rate < 0.95) ? 'watch' : 'good';
  return { byCourt, overall: pct(y, a), failureRate: pct(failed, runs), worst, status };
}
export function syncWeekly() {
  return Array.from({ length: WEEKS }, (_, w) => {
    const x = tech.sync.filter((r) => { const d = dayOf(r.date); return d >= weekStart(w) && d <= weekEnd(w); });
    const a = x.reduce((s, r) => s + r.cases_active, 0), y = x.reduce((s, r) => s + r.cases_synced_24h, 0);
    return { week: weekLabels[w], rate: pct(y, a) };
  });
}

// ------------------------------------------------------------------ M05 active matters
export function activeMatters(s: Scope, at = DATA_END) {
  const act = mattersIn(s, activeMattersAt(at));
  const byBu = BU_IDS.map((id) => ({ id, name: teamById.get(id)!.name, short: teamById.get(id)!.short, count: act.filter((m) => m.bu === id).length }));
  return { count: act.length, byBu };
}
export const activeMattersWeekly = (s: Scope) => Array.from({ length: WEEKS }, (_, w) => ({ week: weekLabels[w], count: mattersIn(s, activeMattersAt(weekEnd(w))).length }));
export function flows(period: Period) {
  const from = periodStart(period);
  const added = matters.filter((m) => dayOf(m.tracked_on) >= from);
  const disposed = matters.filter((m) => m.disposed_on && dayOf(m.disposed_on) >= from);
  return { added: added.length, disposed: disposed.length, bySource: { suggestion: added.filter((m) => m.source === 'suggestion').length, manual: added.filter((m) => m.source === 'manual').length, court_search: added.filter((m) => m.source === 'court_search').length } };
}

// ------------------------------------------------------------------ M06 feature stickiness
export const STICKY_FEATURES: { id: Feature; label: string }[] = [
  { id: 'my_cases', label: 'My Cases' }, { id: 'hearing_updates', label: 'Hearing updates' }, { id: 'calendar_queue', label: 'Calendar and My Queue' },
  { id: 'ask_ai', label: 'Ask AI' }, { id: 'documents', label: 'Documents' }, { id: 'insights', label: 'Insights' }, { id: 'research', label: 'Research' },
  { id: 'tasks', label: 'Tasks' }, { id: 'codex', label: 'Codex' }, { id: 'spend', label: 'Spend' },
];
export function stickiness(s: Scope) {
  const allowed = new Set(usersIn(s).map((u) => u.id));
  const from = periodStart(30);
  return STICKY_FEATURES.map(({ id, label }) => {
    const byDay = featureUse.get(id) ?? new Map();
    const ud = s.kind === 'org' ? byDay : new Map([...byDay].map(([d, us]) => [d, new Set([...us].filter((u) => allowed.has(u)))]));
    const mau = new Set<string>();
    for (const [d, us] of ud) if (d >= from) us.forEach((u: string) => mau.add(u));
    return { id, label, rate: rollingStickiness(ud, from, DATA_END), mau: mau.size };
  }).sort((a, b) => b.rate - a.rate);
}

// ------------------------------------------------------------------ M07 time to first value
export function timeToFirstValue(s: Scope) {
  const us = usersIn(s);
  return (['Admin', 'Legal', 'Business', 'Lawyer'] as Role[]).map((role) => {
    const r = us.filter((u) => u.role === role);
    const v = r.filter((u) => u.first_value_on).map((u) => dayOf(u.first_value_on!) - dayOf(u.seat_since));
    return { role, n: v.length, seats: r.length, median: median(v), q1: quantile(v, 0.25), q3: quantile(v, 0.75), never: r.length - v.length };
  }).filter((x) => x.seats > 0);
}

// ------------------------------------------------------------------ M08, M09 intake
const inLast90 = (iso: string | null) => iso !== null && dayOf(iso) >= periodStart(90);
const resolvedIn90 = suggestions.filter((x) => (x.state === 'expired' ? dayOf(x.shown_on) + 90 >= periodStart(90) : inLast90(x.triaged_on)));
export function intakeFunnel() {
  const s = resolvedIn90;
  const n = (st: string) => s.filter((x) => x.state === st).length;
  const added = n('added'), mapped = n('mapped'), deleted = n('deleted'), expired = n('expired');
  const reviewed = added + mapped + deleted;
  return { suggested: s.length, reviewed, accepted: added + mapped, added, mapped, deleted, expired, expiredShare: pct(expired, s.length), falseMatchShare: pct(deleted, reviewed), status: (pct(expired, s.length) > 0.3 ? 'act' : 'good') as Status };
}
export const KEYWORD_GROUPS: { id: string; label: string; example: string }[] = [
  { id: 'company', label: 'Company name', example: '"Meridia"' },
  { id: 'brand', label: 'Brand names', example: '"Fresko", "Nuvia", "Kalpa"' },
  { id: 'subsidiary', label: 'Subsidiaries (by CIN)', example: 'CIN match' },
  { id: 'director', label: "Directors' names", example: 'Board members' },
];
export function intakePrecision() {
  const rows = KEYWORD_GROUPS.map((g) => {
    const s = resolvedIn90.filter((x) => x.keyword_group === g.id);
    const reviewed = s.filter((x) => x.state !== 'expired').length;
    const accepted = s.filter((x) => x.state === 'added' || x.state === 'mapped').length;
    return { ...g, suggested: s.length, reviewed, accepted, precision: pct(accepted, reviewed) };
  });
  const f = intakeFunnel();
  return { rows, overall: pct(f.accepted, f.reviewed) };
}

// ------------------------------------------------------------------ M10 early capture, filing-to-tracked
const newMattersAll = () => matters.filter((m) => dayOf(m.tracked_on) >= periodStart(90));
export function earlyCapture(s: Scope) {
  const nm = mattersIn(s, newMattersAll());
  const isEarly = (m: Matter) => m.first_hearing_on !== null && dayOf(m.tracked_on) < dayOf(m.first_hearing_on);
  const byBu = BU_IDS.map((id) => { const x = nm.filter((m) => m.bu === id); const e = x.filter(isEarly).length; return { id, name: teamById.get(id)!.name, short: teamById.get(id)!.short, early: e, total: x.length, rate: pct(e, x.length) }; });
  const e = nm.filter(isEarly).length;
  return { early: e, total: nm.length, rate: pct(e, nm.length), byBu, medianFilingToTracked: median(nm.map((m) => dayOf(m.tracked_on) - dayOf(m.filed_on))) };
}

// ------------------------------------------------------------------ M11 field completeness
export const FIELDS: { id: FieldName; label: string }[] = [
  { id: 'counsel', label: 'Counsel' }, { id: 'amount_claimed', label: 'Amount claimed' }, { id: 'exposure', label: 'Exposure' },
  { id: 'risk_rating', label: 'Risk rating' }, { id: 'key_action', label: 'Key action' },
];
export function fieldCompleteness(s: Scope) {
  const nm = mattersIn(s, newMattersAll());
  const rows = FIELDS.map((f) => {
    const at = nm.filter((m) => m.fields_set[f.id] && dayOf(m.fields_set[f.id]!) <= dayOf(m.tracked_on)).length;
    const d14 = nm.filter((m) => m.fields_set[f.id] && dayOf(m.fields_set[f.id]!) <= dayOf(m.tracked_on) + 14).length;
    return { ...f, atAdd: pct(at, nm.length), day14: pct(d14, nm.length), nAt: at, n14: d14 };
  });
  return { rows, total: nm.length, avgDay14: rows.reduce((a, r) => a + r.day14, 0) / rows.length };
}

// ------------------------------------------------------------------ M12 default priority
export function defaultPriority() {
  const act = activeMattersAt();
  const series = Array.from({ length: WEEKS }, (_, w) => { const a = activeMattersAt(weekEnd(w)); return { week: weekLabels[w], rate: pct(a.filter((m) => m.priority_default).length, a.length) }; });
  return { rate: pct(act.filter((m) => m.priority_default).length, act.length), n: act.filter((m) => m.priority_default).length, total: act.length, series };
}

// ------------------------------------------------------------------ M13 outcome update lag by counsel firm
export function firmLag(period: Period) {
  const from = periodStart(period);
  const all = hearings.filter((h) => eligible(h, from, DATA_END));
  const rows = FIRM_IDS.map((id) => {
    const t = teamById.get(id)!;
    const hs = all.filter((h) => h.firm_id === id);
    const lags = hs.filter((h) => h.lag_days !== null).map((h) => h.lag_days!);
    const lawyerIds = new Set(users.filter((u) => u.team_id === id).map((u) => u.id));
    const firmMatters = matters.filter((m) => m.status === 'ongoing' && m.firm_id === id);
    const touched = new Set(activity.filter((a) => a.m && lawyerIds.has(a.u) && dayOf(a.t) >= from).map((a) => a.m!));
    for (const e of aiEvents) if (e.m && lawyerIds.has(e.u) && dayOf(e.t) >= from) touched.add(e.m);
    const onPlatform = pct(firmMatters.filter((m) => touched.has(m.id)).length, firmMatters.length);
    return { id, name: t.name, short: t.short, hearings: hs.length, share: pct(hs.length, all.length), medianLag: median(lags), closeOut: pct(hs.filter(isClosedOut).length, hs.length), onPlatform, lags };
  });
  const inhouse = all.filter((h) => h.owner_type === 'inhouse');
  return { rows, total: all.length, inhouse: { hearings: inhouse.length, medianLag: median(inhouse.filter((h) => h.lag_days !== null).map((h) => h.lag_days!)), closeOut: pct(inhouse.filter(isClosedOut).length, inhouse.length) } };
}

// ------------------------------------------------------------------ M14 hearings awaiting update (right now)
export const isAwaiting = (h: Hearing) => h.outcome_recorded_on === null && dayOf(h.date) < TODAY - 2;
export function awaiting(s: Scope) {
  const hs = hearingsIn(s).filter(isAwaiting);
  const by = new Map<string, { inhouse: number; counsel: number }>();
  for (const h of hs) {
    const mgr = matterById.get(h.matter_id)!.case_manager_id;
    const r = by.get(mgr) ?? { inhouse: 0, counsel: 0 };
    r[h.owner_type]++; by.set(mgr, r);
  }
  const rows = [...by].map(([id, r]) => ({ id, name: userById.get(id)!.name, team: teamById.get(userById.get(id)!.team_id)!.short, ...r, total: r.inhouse + r.counsel })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return { total: hs.length, rows, list: hs, max: rows[0] };
}

// ------------------------------------------------------------------ M15 dormant matters
function lastActivityAt(m: Matter, t: number): number {
  const days = matterActivityDays.get(m.id)!;
  let lo = 0, hi = days.length - 1, ans = -Infinity;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (days[mid] <= t) { ans = days[mid]; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}
export const isDormantAt = (m: Matter, t: number) => activeOn(m, t) && lastActivityAt(m, t) <= t - 90;
export function dormant(s: Scope) {
  const ms = mattersIn(s);
  const series = Array.from({ length: WEEKS }, (_, w) => {
    const t = weekEnd(w);
    const a = ms.filter((m) => activeOn(m, t));
    const d = a.filter((m) => isDormantAt(m, t)).length;
    return { week: weekLabels[w], count: d, share: pct(d, a.length) };
  });
  const act = ms.filter((m) => activeOn(m, DATA_END));
  const list = act.filter((m) => isDormantAt(m, DATA_END));
  const june = series.find((x) => x.week.endsWith('Jun'))!;
  return { count: list.length, share: pct(list.length, act.length), series, june: june.count, list };
}

// ------------------------------------------------------------------ AI
export const AI_FEATURES: { id: AiFeature; label: string }[] = [
  { id: 'ask_ai', label: 'Ask AI' }, { id: 'case_summary', label: 'Case summary' }, { id: 'codex', label: 'Codex prompts' },
  { id: 'file_summary', label: 'File summary' }, { id: 'translation', label: 'Translation' }, { id: 'ai_diligence', label: 'AI Diligence' },
];
export const aiLabel = (f: AiFeature) => (f === 'mis_report' ? 'MIS AI report' : AI_FEATURES.find((x) => x.id === f)!.label);
/** Base for AI adoption: Legal and Lawyer users active in the last 7 days. */
export const aiBase = () => users.filter((u) => (u.role === 'Legal' || u.role === 'Lawyer') && isWeeklyActive(u.id));
export function aiAdoption(s: Scope, period: Period) {
  const from = periodStart(period);
  const allowed = new Set(usersIn(s).map((u) => u.id));
  const base = aiBase().filter((u) => allowed.has(u.id));
  const baseIds = new Set(base.map((u) => u.id));
  const ev = aiEvents.filter((e) => dayOf(e.t) >= from && allowed.has(e.u));
  const totalCredits = ev.reduce((a, e) => a + e.c, 0);
  const rows = AI_FEATURES.map(({ id, label }) => {
    const x = ev.filter((e) => e.f === id);
    const ok = x.filter((e) => !e.b);
    const usersF = new Set(ok.filter((e) => baseIds.has(e.u)).map((e) => e.u));
    const credits = x.reduce((a, e) => a + e.c, 0);
    return { id, label, users: usersF.size, adoption: pct(usersF.size, base.length), actionRate: pct(ok.filter((e) => e.a).length, ok.length), credits, creditShare: pct(credits, totalCredits), uses: ok.length };
  });
  return { rows, base: base.length, totalCredits };
}
export function creditsByFeature(monthIdx: number) {
  const start = firstOfMonth(2026, monthIdx), end = start + daysInMonth(2026, monthIdx) - 1;
  const ev = aiEvents.filter((e) => { const d = dayOf(e.t); return d >= start && d <= end; });
  const total = ev.reduce((a, e) => a + e.c, 0);
  const feats: AiFeature[] = ['ai_diligence', 'ask_ai', 'case_summary', 'mis_report', 'translation', 'codex', 'file_summary'];
  return { total, rows: feats.map((f) => { const x = ev.filter((e) => e.f === f && !e.b); const c = x.reduce((a, e) => a + e.c, 0); return { f, label: aiLabel(f), credits: c, share: pct(c, total), uses: x.length, users: new Set(x.map((e) => e.u)).size }; }) };
}
export function diligenceByUser(monthIdx: number) {
  const start = firstOfMonth(2026, monthIdx), end = start + daysInMonth(2026, monthIdx) - 1;
  const ev = aiEvents.filter((e) => e.f === 'ai_diligence' && !e.b && dayOf(e.t) >= start && dayOf(e.t) <= end);
  const total = ev.reduce((a, e) => a + e.c, 0);
  const by = new Map<string, number>();
  ev.forEach((e) => by.set(e.u, (by.get(e.u) ?? 0) + e.c));
  return [...by].map(([u, c]) => ({ id: u, name: userById.get(u)!.name, credits: c, share: pct(c, total), cases: c / 10 })).sort((a, b) => b.credits - a.credits);
}
// M17
export function askAfterLimit() {
  const oct = firstOfMonth(2026, 9);
  const run = creditRunway();
  const octM = run.byMonth.find((x) => x.m === 9)!;
  const limitDay = octM.limitDay!;
  const days: { day: number; label: string; ok: number; blocked: number }[] = [];
  for (let d = oct; d <= DATA_END; d++) days.push({ day: d, label: fmtDay(d), ok: 0, blocked: 0 });
  for (const e of aiEvents) if (e.f === 'ask_ai') { const d = dayOf(e.t); if (d >= oct) { const r = days[d - oct]; if (e.b) r.blocked++; else r.ok++; } }
  const before = days.slice(0, limitDay - 1), after = days.slice(limitDay - 1, 31);
  const avgBefore = before.reduce((a, r) => a + r.ok, 0) / before.length;
  const avgAfter = after.reduce((a, r) => a + r.ok + r.blocked, 0) / after.length;
  return { days, limitDay, limitLabel: fmtDay(oct + limitDay - 1), limitLabelIdx: limitDay - 1, avgBefore, avgAfter, drop: 1 - avgAfter / avgBefore };
}
// M18
export function rejection(period: Period) {
  const from = periodStart(period);
  const resp = aiEvents.filter((e) => !e.b && e.f !== 'mis_report');
  const win = resp.filter((e) => dayOf(e.t) >= from);
  const weekly = Array.from({ length: WEEKS }, (_, w) => {
    const x = resp.filter((e) => { const d = dayOf(e.t); return d >= weekStart(w) && d <= weekEnd(w); });
    return { week: weekLabels[w], w, regenerate: pct(x.filter((e) => e.fb === 1).length, x.length), thumbs: pct(x.filter((e) => e.fb === 2).length, x.length) };
  });
  const thumbs = pct(win.filter((e) => e.fb === 2).length, win.length);
  return { regenerate: pct(win.filter((e) => e.fb === 1).length, win.length), thumbs, weekly, modelChanges: account.model_changes, status: (thumbs > 0.1 ? 'act' : 'good') as Status };
}
// M19
export function summaryAccuracy() {
  const rows = evals.map((e) => ({ week: fmtDay(dayOf(e.week_start)), accuracy: e.facts_correct / e.facts_checked, sample: e.sample_size }));
  const last4 = rows.slice(-4);
  const avg = last4.reduce((a, r) => a + r.accuracy, 0) / last4.length;
  return { rows, last4Avg: avg, min: Math.min(...rows.map((r) => r.accuracy)), max: Math.max(...rows.map((r) => r.accuracy)), status: (avg < 0.88 ? 'act' : avg < 0.9 ? 'watch' : 'good') as Status };
}
// M20
export function insightFollowThrough(period: Period = 30) {
  const sessions = activity.filter((a) => a.k === 'insight_viewed');
  const from = periodStart(period);
  const win = sessions.filter((a) => dayOf(a.t) >= from);
  const weekly = Array.from({ length: 12 }, (_, i) => {
    const w = WEEKS - 12 + i;
    const x = sessions.filter((a) => { const d = dayOf(a.t); return d >= weekStart(w) && d <= weekEnd(w); });
    return { week: weekLabels[w], rate: pct(x.filter((a) => a.fo).length, x.length) };
  });
  return { rate: pct(win.filter((a) => a.fo).length, win.length), sessions: win.length, followed: win.filter((a) => a.fo).length, weekly };
}
// M21
export function insightsReach() {
  const views = activity.filter((a) => a.k === 'insight_viewed');
  const mis = activity.filter((a) => a.k === 'mis_downloaded');
  const weekly = Array.from({ length: WEEKS }, (_, w) => {
    const inW = (t: string) => { const d = dayOf(t); return d >= weekStart(w) && d <= weekEnd(w); };
    const v = new Set(views.filter((a) => inW(a.t)).map((a) => a.u));
    const byRole = (r: Role) => [...v].filter((u) => userById.get(u)!.role === r).length;
    return { week: weekLabels[w], w, Admin: byRole('Admin'), Legal: byRole('Legal'), Business: byRole('Business'), total: v.size, mis: mis.filter((a) => inW(a.t)).length };
  });
  const oct = firstOfMonth(2026, 9);
  const octMis = mis.filter((a) => { const d = dayOf(a.t); return d >= oct && d < oct + 31; });
  const complete = weekly.slice(-5, -1);
  return { weekly, avgViewers: complete.reduce((a, r) => a + r.total, 0) / complete.length, lastWeek: weekly[weekly.length - 2], misOct: octMis.length, misOctAi: octMis.filter((a) => a.ai).length };
}

// ------------------------------------------------------------------ M22 alert follow-through
export function alertFollowThrough(s: Scope, period: Period) {
  const from = periodStart(period);
  const allowed = new Set(usersIn(s).filter((u) => u.role === 'Business').map((u) => u.id));
  const al = alerts.filter((a) => dayOf(a.sent_on) >= from && allowed.has(a.user_id));
  const ok = (a: (typeof alerts)[number]) => a.case_viewed_on !== null && dayOf(a.case_viewed_on) - dayOf(a.sent_on) <= 1;
  const byBu = BU_IDS.map((id) => { const x = al.filter((a) => userById.get(a.user_id)!.team_id === id); const v = x.filter(ok).length; return { id, name: teamById.get(id)!.name, short: teamById.get(id)!.short, sent: x.length, viewed: v, rate: pct(v, x.length) }; }).filter((r) => r.sent > 0);
  const byUser = [...allowed].map((u) => { const x = al.filter((a) => a.user_id === u); return { id: u, sent: x.length, viewed: x.filter(ok).length, rate: pct(x.filter(ok).length, x.length) }; });
  const v = al.filter(ok).length;
  return { sent: al.length, viewed: v, rate: pct(v, al.length), byBu, byUser, status: (byBu.some((b) => b.rate < 0.2) ? 'act' : 'good') as Status };
}

// ------------------------------------------------------------------ M23 spend capture, M24 contract share
export function spendCapture(s: Scope) {
  const act = mattersIn(s, activeMattersAt());
  const withSpend = new Set(spend.filter((x) => dayOf(x.logged_on) >= periodStart(90)).map((x) => x.matter_id));
  const byBu = BU_IDS.map((id) => { const x = act.filter((m) => m.bu === id); const c = x.filter((m) => withSpend.has(m.id)).length; return { id, name: teamById.get(id)!.name, short: teamById.get(id)!.short, captured: c, total: x.length, rate: pct(c, x.length) }; }).filter((r) => r.total > 0);
  const c = act.filter((m) => withSpend.has(m.id)).length;
  const amount = spend.filter((x) => dayOf(x.logged_on) >= periodStart(90) && act.some((m) => m.id === x.matter_id)).reduce((a, x) => a + x.amount, 0);
  return { captured: c, total: act.length, rate: pct(c, act.length), byBu, amount };
}
export function contractShare(s: Scope) {
  const act = mattersIn(s, activeMattersAt());
  const byBu = BU_IDS.map((id) => { const x = act.filter((m) => m.bu === id); const c = x.filter((m) => m.contract_based).length; return { id, name: teamById.get(id)!.name, short: teamById.get(id)!.short, contract: c, total: x.length, rate: pct(c, x.length) }; }).filter((r) => r.total > 0);
  const c = act.filter((m) => m.contract_based).length;
  return { contract: c, total: act.length, rate: pct(c, act.length), byBu };
}
export function courtTypes() {
  const act = activeMattersAt();
  return COURT_TYPES.map((ct) => ({ court: ct, count: act.filter((m) => m.court_type === ct).length }));
}

// ------------------------------------------------------------------ platform health
const p95 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.ceil(0.95 * s.length) - 1]; };
export function pageLoads(prev = false) {
  const to = prev ? DATA_END - 7 : DATA_END, from = to - 6;
  const pages = [...new Set(tech.page_loads.map((p) => p.page))];
  return pages.map((page) => {
    const ms = tech.page_loads.filter((p) => p.page === page && dayOf(p.date) >= from && dayOf(p.date) <= to).flatMap((p) => p.ms);
    return { page, p95: p95(ms) / 1000, samples: ms.length };
  }).sort((a, b) => b.p95 - a.p95);
}
export const PAGE_BUDGET = 3;
export function rateLimits(period: Period = 30) {
  const from = periodStart(period);
  const rows = tech.errors.filter((r) => dayOf(r.date) >= from);
  const S = rows.reduce((a, r) => a + r.sessions, 0), E = rows.reduce((a, r) => a + r.errors_429, 0);
  const Sm = rows.reduce((a, r) => a + r.mm_sessions, 0), Em = rows.reduce((a, r) => a + r.mm_errors, 0);
  const daily = tech.errors.filter((r) => dayOf(r.date) >= from).map((r) => ({ date: r.date, label: fmtDay(dayOf(r.date)), rate: (r.errors_429 / r.sessions) * 100, monday: dow(dayOf(r.date)) === 0 }));
  const avg = (E / S) * 100;
  return { avg, monday: (Em / Sm) * 100, daily, status: (avg > 5 ? 'act' : avg > 4 ? 'watch' : 'good') as Status };
}
export function zeroResults(period: Period = 30) {
  const from = periodStart(period);
  const rows = (['court', 'codex'] as const).map((surface) => {
    const x = tech.searches.filter((r) => r.surface === surface && dayOf(r.date) >= from);
    const S = x.reduce((a, r) => a + r.searches, 0), Z = x.reduce((a, r) => a + r.zero_results, 0);
    return { surface, label: surface === 'court' ? 'Court search' : 'Codex', searches: S, zero: Z, rate: pct(Z, S), top: tech.missed_queries.filter((q) => q.surface === surface && q.query !== 'Other queries') };
  });
  return rows;
}

// ------------------------------------------------------------------ pulse tiles
export function pulse(s: Scope, period: Period) {
  const co = closeOut(s, period), coPrev = closeOut(s, period, true);
  const w = wau(s), wPrev = wau(s, DATA_END - 7);
  const run = creditRunway();
  const sync = syncFreshness(), syncPrev = syncFreshness(true);
  const am = activeMatters(s), amPrev = activeMatters(s, DATA_END - period);
  return {
    M01: { value: co.rate, prev: coPrev.total ? coPrev.rate : null, closeOut: co, series: closeOutTrend(s, period).map((x) => x.all), status: closeOutStatus(co.rate) },
    M02: { value: w.rate, prev: wPrev.rate, wau: w, series: wauTrend(s, period).map((x) => x.rate), status: wauStatus(w.byRole) },
    M03: { value: run.last.limitDay!, prev: run.prev.limitDay!, run, series: run.byMonth.map((m) => m.limitDay ?? daysInMonth(2026, m.m) + 3), status: run.status },
    M04: { value: sync.worst.rate, prev: syncPrev.worst.rate, sync, series: syncTrend(period).map((x) => x.rate), status: sync.status },
    M05: { value: am.count, prev: DATA_END - period >= DATA_START - 1 ? amPrev.count : null, am, series: activeMattersTrend(s, period).map((x) => x.count), status: 'info' as Status },
  };
}

// ------------------------------------------------------------------ signals (read from the same selectors)
export function signals(period: Period) {
  const lag = firmLag(period);
  const mehra = lag.rows.find((r) => r.id === 'firm-mehra')!;
  const mehraCo = closeOut(teamScope('firm-mehra'), period);
  const run = creditRunway();
  const octCredits = creditsByFeature(9);
  const dil = octCredits.rows.find((r) => r.f === 'ai_diligence')!;
  const ai = aiAdoption(ORG, period);
  const dilAct = ai.rows.find((r) => r.id === 'ai_diligence')!;
  const funnel = intakeFunnel();
  const ec = earlyCapture(ORG);
  const proc = ec.byBu.find((b) => b.id === 'procurement')!;
  const pd = (x: number) => Math.round(x * 100);
  return [
    {
      id: 'counsel', stage: 'hearing' as const, metric: 'M13',
      headline: `${mehra.name} closes only ${pd(mehraCo.rate)}% of hearings on time and carries ${pd(mehra.share)}% of them`,
      detail: `Its median update lag is ${mehra.medianLag.toFixed(1)} days against 1.8 to 2.6 for other firms. Since taking over the dealer disputes on 1 Aug, it has pulled account close-out from 72% in June to ${pd(closeOut(ORG, period).rate)}%.`,
      drill: { label: 'Open Mehra & Associates', href: '#/team/firm-mehra' }, showMe: 'M13',
    },
    {
      id: 'ai', stage: 'ai' as const, metric: 'M03',
      headline: `AI credits ran out on day ${run.last.limitDay}; AI Diligence used ${pd(dil.share)}% of them with a ${pd(dilAct.actionRate)}% action rate`,
      detail: `The limit day moved from ${run.byMonth.find((m) => m.m === 7)!.limitDay} in August to ${run.prev.limitDay} in September and ${run.last.limitDay} in October; November is on course for day ${run.projected}. One person runs most of the bulk Diligence.`,
      drill: { label: 'Open Vikram Joshi', href: '#/user/vikram-joshi' }, showMe: 'M03',
    },
    {
      id: 'intake', stage: 'intake' as const, metric: 'M09',
      headline: `${pd(funnel.falseMatchShare)}% of reviewed intake suggestions are false matches; Procurement tracks only ${pd(proc.rate)}% of cases before the first hearing`,
      detail: `Brand and company-name keywords match unrelated parties; ${pd(funnel.expiredShare)}% of suggestions expire unread. Procurement hears of ${proc.total - proc.early} of its ${proc.total} new cases only after a hearing has happened.`,
      drill: { label: 'Open Procurement & Supply Chain', href: '#/team/procurement' }, showMe: 'M09',
    },
  ];
}

// ------------------------------------------------------------------ teams table
export function teamsTable(period: Period) {
  const fa = alertFollowThrough(ORG, period);
  return [...BU_IDS, ...FIRM_IDS].map((id) => {
    const t = teamById.get(id)!;
    const s = teamScope(id);
    const isBu = t.type === 'business_unit';
    return {
      id, name: t.name, type: t.type, members: usersIn(s).length,
      M01: closeOut(s, period).rate, M02: wau(s).rate,
      M10: isBu ? earlyCapture(s).rate : null, M11: isBu ? fieldCompleteness(s).avgDay14 : null,
      M22: isBu ? fa.byBu.find((b) => b.id === id)?.rate ?? null : null,
    };
  });
}

// ------------------------------------------------------------------ people
export function userKpis(uid: string, period: Period) {
  const s = userScope(uid);
  const u = userById.get(uid)!;
  const from = periodStart(period);
  const co = closeOut(s, period);
  const myAi = aiEvents.filter((e) => e.u === uid && dayOf(e.t) >= from);
  const owned = u.role === 'Legal' || u.role === 'Lawyer' ? mattersIn(s, activeMattersAt()).length : 0;
  return {
    owned, hearings: co.total, closeOut: co.total ? co.rate : null, awaiting: hearingsIn(s).filter(isAwaiting).length,
    aiActions: myAi.filter((e) => e.a && !e.b).length, aiUses: myAi.filter((e) => !e.b).length,
    fieldsDay14: u.role === 'Legal' ? fieldCompleteness(s).avgDay14 : null, newMatters: mattersIn(s, newMattersAll()).length,
    dormant: u.role === 'Legal' || u.role === 'Lawyer' ? dormant(s).count : 0,
    aiAdoptionFeatures: new Set(myAi.filter((e) => !e.b && e.f !== 'mis_report').map((e) => e.f)).size,
  };
}
export function teamMedians(teamId: string, role: Role, period: Period) {
  const mem = users.filter((u) => u.team_id === teamId && u.role === role);
  const ks = mem.map((u) => userKpis(u.id, period));
  const md = (f: (k: ReturnType<typeof userKpis>) => number | null) => median(ks.map(f).filter((x): x is number => x !== null && !Number.isNaN(x)));
  return { owned: md((k) => k.owned), hearings: md((k) => k.hearings), closeOut: md((k) => k.closeOut), awaiting: md((k) => k.awaiting), aiActions: md((k) => k.aiActions), fieldsDay14: md((k) => k.fieldsDay14), aiAdoptionFeatures: md((k) => k.aiAdoptionFeatures) };
}
export function members(teamId: string, period: Period) {
  return users.filter((u) => u.team_id === teamId).map((u) => {
    const k = userKpis(u.id, period);
    return { id: u.id, name: u.name, role: u.role, title: u.title, owned: k.owned, closeOut: k.closeOut, hearings: k.hearings, awaiting: k.awaiting, lastActive: u.last_active, aiActions: k.aiActions, weekly: isWeeklyActive(u.id) };
  });
}
export function firmExtras(firmId: string, period: Period) {
  const hs = hearingsIn(teamScope(firmId)).filter((h) => eligible(h, periodStart(period), DATA_END));
  const byBu = BU_IDS.map((id) => { const x = hs.filter((h) => matterById.get(h.matter_id)!.bu === id); return { id, short: teamById.get(id)!.short, name: teamById.get(id)!.name, hearings: x.length, closed: x.filter(isClosedOut).length }; }).filter((r) => r.hearings > 0);
  const buckets = [['under 1 day', 0, 1], ['1 to 2', 1, 2], ['2 to 3', 2, 3], ['3 to 5', 3, 5], ['5 to 10', 5, 10], ['10 to 15', 10, 15], ['15+', 15, 999]] as const;
  const lags = hs.filter((h) => h.lag_days !== null).map((h) => h.lag_days!);
  const dist = buckets.map(([label, a, b]) => ({ label, count: lags.filter((x) => x >= a && x < b).length, closed: b <= 3 }));
  return { byBu, dist, awaitingNow: hs.filter(isAwaiting).length, recorded: lags.length };
}
export function heatmap(uid: string) {
  const from = DATA_END - 55;
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const add = (t: string) => { const d = dayOf(t); if (d >= from && d <= DATA_END) grid[dow(d)][hourOf(t)]++; };
  activity.filter((a) => a.u === uid).forEach((a) => add(a.t));
  aiEvents.filter((e) => e.u === uid).forEach((e) => add(e.t));
  return grid;
}
const fmtHearingDay = (iso: string) => fmtDay(dayOf(iso));
const inr = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)} Lac` : `₹${Math.round(n / 1000)}K`);
export function timeline(uid: string, n = 20) {
  const acts = activity.filter((a) => a.u === uid).map((a) => ({ t: a.t, a }));
  const ais = aiEvents.filter((e) => e.u === uid).map((e) => ({ t: e.t, e }));
  const all = [...acts, ...ais].sort((x, y) => y.t.localeCompare(x.t)).slice(0, n);
  return all.map((x) => {
    let text = '';
    let kind = 'case';
    if ('a' in x) {
      const a = x.a, m = a.m ? matterById.get(a.m) : undefined, title = m?.title ?? '';
      const h = a.h ? hearings.find((hh) => hh.id === a.h) : undefined;
      switch (a.k) {
        case 'outcome_recorded': text = `Recorded outcome for hearing on ${fmtHearingDay(h!.date)} in ${title}`; kind = 'hearing'; break;
        case 'hearing_updated': text = `Updated the next hearing date and stage in ${title}`; kind = 'hearing'; break;
        case 'case_viewed': text = title ? `Opened ${title} in My Cases` : 'Opened My Cases'; break;
        case 'alert_case_viewed': text = `Opened ${title} from an email alert`; break;
        case 'calendar_opened': text = 'Checked the calendar and My Queue'; break;
        case 'document_uploaded': text = title ? `Uploaded a document to ${title}` : 'Uploaded a document'; break;
        case 'research_opened': text = 'Read a judgment summary in Research'; break;
        case 'task_created': text = title ? `Created a task in ${title}` : 'Created a task'; break;
        case 'suggestion_added': text = `Added ${title} from New Cases suggestions`; kind = 'intake'; break;
        case 'suggestion_mapped': text = `Mapped a new filing to ${title}`; kind = 'intake'; break;
        case 'suggestion_deleted': text = 'Deleted a false-match suggestion in New Cases'; kind = 'intake'; break;
        case 'case_added': text = `Added ${title} ${a.x === 'court_search' ? 'from court record search' : 'manually'}`; kind = 'intake'; break;
        case 'field_updated': text = `Set ${(a.x ?? '').replace('_', ' ')} on ${title}`; kind = 'enrich'; break;
        case 'spend_logged': text = `Logged ${inr(+(a.x ?? 0))} spend on ${title}`; kind = 'value'; break;
        case 'insight_viewed': text = `Viewed Insights: ${a.x}`; kind = 'value'; break;
        case 'mis_downloaded': text = a.ai ? 'Downloaded an MIS report with AI analysis' : 'Downloaded an MIS report'; kind = 'value'; break;
        case 'keyword_group_updated': text = 'Updated saved keyword groups'; kind = 'intake'; break;
      }
    } else {
      const e = x.e, title = e.m ? matterById.get(e.m)!.title : '';
      kind = 'ai';
      if (e.b) text = `Tried ${aiLabel(e.f)}; blocked by the credit limit`;
      else if (e.f === 'ask_ai') text = title ? `Asked AI about ${title}` : 'Asked AI a question';
      else if (e.f === 'ai_diligence') text = `Ran AI Diligence on ${title || 'a case'}`;
      else if (e.f === 'case_summary') text = `Generated a case summary for ${title || 'a case'}`;
      else if (e.f === 'file_summary') text = `Summarised a file in ${title || 'a case'}`;
      else if (e.f === 'translation') text = 'Translated an order';
      else if (e.f === 'codex') text = 'Ran a Codex prompt';
      else text = 'Generated an MIS AI analysis report';
      if (!e.b && e.f !== 'mis_report') text += e.a ? ' and used the output' : '';
    }
    return { t: x.t, text, kind };
  });
}
export function userHearingList(uid: string) {
  const s = userScope(uid);
  return hearingsIn(s).filter(isAwaiting).map((h) => ({ ...h, title: matterById.get(h.matter_id)!.title, overdue: TODAY - 2 - dayOf(h.date), firm: h.firm_id ? teamById.get(h.firm_id)!.short : 'In-house' })).sort((a, b) => b.overdue - a.overdue);
}
export function lawyerCases(uid: string) {
  return mattersIn(userScope(uid), activeMattersAt()).map((m) => {
    const hs = (hearingsByMatter.get(m.id) ?? []).filter((h) => h.owner_id === uid).sort((a, b) => b.date.localeCompare(a.date));
    const last = hs[0];
    return { id: m.id, title: m.title, bu: teamById.get(m.bu)!.short, court: m.court, lastHearing: last?.date ?? null, awaiting: last ? isAwaiting(last) : false, overdue: last && isAwaiting(last) ? TODAY - 2 - dayOf(last.date) : 0 };
  }).sort((a, b) => b.overdue - a.overdue || (b.lastHearing ?? '').localeCompare(a.lastHearing ?? ''));
}
export function userAi(uid: string, period: Period) {
  const from = periodStart(period);
  const ev = aiEvents.filter((e) => e.u === uid && dayOf(e.t) >= from && !e.b);
  return [...AI_FEATURES, { id: 'mis_report' as AiFeature, label: 'MIS AI report' }].map(({ id, label }) => {
    const x = ev.filter((e) => e.f === id);
    return { id, label, uses: x.length, actionRate: pct(x.filter((e) => e.a).length, x.length), credits: x.reduce((a, e) => a + e.c, 0) };
  }).filter((r) => r.uses > 0);
}
export const ROLE_BLURB: Record<Role, string> = {
  Admin: 'Admins configure Legistify for the company: saved keywords, labels, user roles. The GC also reads Insights and MIS reports.',
  Legal: 'Legal users run cases day to day: triage New Cases, assign counsel, track hearings and record each outcome. They create most of the data.',
  Business: 'Business users follow cases in their unit. They mostly see Legistify through email alerts and case summaries.',
  Lawyer: 'Lawyers are external counsel. They see the cases assigned to them, report hearing outcomes, upload orders and bill fees.',
};
export const searchIndex = () => [
  ...teams.filter((t) => t.type !== 'leadership').map((t) => ({ id: t.id, label: t.name, sub: t.type === 'business_unit' ? 'Business unit' : `Counsel firm, ${t.city}`, href: `#/team/${t.id}` })),
  ...users.map((u) => ({ id: u.id, label: u.name, sub: `${u.role} · ${teamById.get(u.team_id)!.name}`, href: `#/user/${u.id}` })),
];
export const teamOf = (uid: string): Team => teamById.get(userById.get(uid)!.team_id)!;
export { DATA_END, DATA_START, TODAY };

// ------------------------------------------------------------------ period-aware trends
// 30 days: one point per day, each the 7 days ending that day (smooth, enough points).
// 90 and 180 days: one point per Monday-to-Sunday week inside the period.
export interface Bucket { label: string; from: number; to: number }
export function buckets(period: Period): Bucket[] {
  if (period === 30) {
    const out: Bucket[] = [];
    for (let d = periodStart(30); d <= DATA_END; d++) out.push({ label: fmtDay(d), from: d - 6, to: d });
    return out;
  }
  const n = period === 90 ? 13 : WEEKS;
  return Array.from({ length: n }, (_, i) => { const w = WEEKS - n + i; return { label: weekLabels[w], from: weekStart(w), to: weekEnd(w) }; });
}
export const bucketNote = (p: Period) => (p === 30 ? 'Each point covers the 7 days ending that day.' : 'Each point is one week, Monday to Sunday.');
export const bucketOf = (p: Period, day: number) => buckets(p).find((b) => p !== 30 && b.from <= day && day <= b.to)?.label ?? buckets(p).find((b) => p === 30 && b.to === day)?.label ?? null;

export function closeOutTrend(s: Scope, period: Period) {
  const hs = hearingsIn(s);
  return buckets(period).map((b) => {
    const x = hs.filter((h) => eligible(h, b.from, b.to));
    const r = (pred: (h: Hearing) => boolean) => { const y = x.filter(pred); return y.length ? pct(y.filter(isClosedOut).length, y.length) : null; };
    return { week: b.label, all: r(() => true), inhouse: r((h) => h.owner_type === 'inhouse'), counsel: r((h) => h.owner_type === 'counsel'), n: x.length };
  });
}
export function wauTrend(s: Scope, period: Period) {
  const us = usersIn(s);
  return buckets(period).map((b) => { const a = us.filter((u) => activeBetween(u.id, b.from, b.to)).length; return { week: b.label, active: a, rate: pct(a, us.length) }; });
}
export function activeMattersTrend(s: Scope, period: Period) {
  return buckets(period).map((b) => ({ week: b.label, count: mattersIn(s, activeMattersAt(b.to)).length }));
}
export function syncTrend(period: Period) {
  return buckets(period).map((b) => {
    const x = tech.sync.filter((r) => { const d = dayOf(r.date); return d >= b.from && d <= b.to; });
    const worst = COURT_TYPES.map((ct) => { const y = x.filter((r) => r.court_type === ct); return pct(y.reduce((a, r) => a + r.cases_synced_24h, 0), y.reduce((a, r) => a + r.cases_active, 0)); });
    return { week: b.label, rate: Math.min(...worst) };
  });
}
export function dormantTrend(s: Scope, period: Period) {
  const ms = mattersIn(s);
  return buckets(period).map((b) => {
    const a = ms.filter((m) => activeOn(m, b.to));
    const d = a.filter((m) => isDormantAt(m, b.to)).length;
    return { week: b.label, count: d, share: pct(d, a.length) };
  });
}
export function defaultPriorityTrend(period: Period) {
  return buckets(period).map((b) => { const a = activeMattersAt(b.to); return { week: b.label, rate: pct(a.filter((m) => m.priority_default).length, a.length) }; });
}
export function rejectionTrend(period: Period) {
  const resp = aiEvents.filter((e) => !e.b && e.f !== 'mis_report');
  return buckets(period).map((b) => {
    const x = resp.filter((e) => { const d = dayOf(e.t); return d >= b.from && d <= b.to; });
    return { week: b.label, regenerate: pct(x.filter((e) => e.fb === 1).length, x.length), thumbs: pct(x.filter((e) => e.fb === 2).length, x.length) };
  });
}
export function followThroughTrend(period: Period) {
  const sessions = activity.filter((a) => a.k === 'insight_viewed');
  return buckets(period).map((b) => { const x = sessions.filter((a) => { const d = dayOf(a.t); return d >= b.from && d <= b.to; }); return { week: b.label, rate: x.length ? pct(x.filter((a) => a.fo).length, x.length) : null }; });
}
export function reachTrend(period: Period) {
  const views = activity.filter((a) => a.k === 'insight_viewed');
  const mis = activity.filter((a) => a.k === 'mis_downloaded');
  return buckets(period).map((b) => {
    const inB = (t: string) => { const d = dayOf(t); return d >= b.from && d <= b.to; };
    const v = new Set(views.filter((a) => inB(a.t)).map((a) => a.u));
    const byRole = (r: Role) => [...v].filter((u) => userById.get(u)!.role === r).length;
    return { week: b.label, Admin: byRole('Admin'), Legal: byRole('Legal'), Business: byRole('Business'), total: v.size, mis: mis.filter((a) => inB(a.t)).length };
  });
}
export function accuracyTrend(period: Period) {
  return summaryAccuracy().rows.filter((r, i) => dayOf(evals[i].week_start) + 6 >= periodStart(period));
}
