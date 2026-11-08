// Loads the generated tables once and builds indexes. Every chart reads through selectors.ts.
import accountJson from '../data/account.json';
import activityJson from '../data/activity.json';
import aiJson from '../data/ai_events.json';
import alertsJson from '../data/alerts.json';
import evalsJson from '../data/evals.json';
import hearingsJson from '../data/hearings.json';
import mattersJson from '../data/matters.json';
import spendJson from '../data/spend.json';
import suggestionsJson from '../data/suggestions.json';
import teamsJson from '../data/teams.json';
import techJson from '../data/tech.json';
import usersJson from '../data/users.json';
import { toDay } from './dates';
import type { Account, Activity, AiEvent, Alert, Eval, Feature, Hearing, Matter, Spend, Suggestion, Team, Tech, User } from './types';

export const account = accountJson as Account;
export const teams = teamsJson as Team[];
export const users = usersJson as User[];
export const matters = mattersJson as Matter[];
export const hearings = hearingsJson as Hearing[];
export const suggestions = suggestionsJson as Suggestion[];
export const activity = activityJson as Activity[];
export const aiEvents = aiJson as AiEvent[];
export const alerts = alertsJson as Alert[];
export const spend = spendJson as Spend[];
export const tech = techJson as Tech;
export const evals = evalsJson as Eval[];

export const userById = new Map(users.map((u) => [u.id, u]));
export const teamById = new Map(teams.map((t) => [t.id, t]));
export const matterById = new Map(matters.map((m) => [m.id, m]));

const dayCache = new Map<string, number>();
export const dayOf = (iso: string): number => {
  const k = iso.slice(0, 10);
  let v = dayCache.get(k);
  if (v === undefined) { v = toDay(k); dayCache.set(k, v); }
  return v;
};
export const hourOf = (t: string): number => +t.slice(11, 13);

// Activity days per user (activity and AI requests are both meaningful actions)
export const actionDaysByUser = new Map<string, number[]>();
for (const a of activity) push(actionDaysByUser, a.u, dayOf(a.t));
for (const e of aiEvents) push(actionDaysByUser, e.u, dayOf(e.t));
function push<K, V>(m: Map<K, V[]>, k: K, v: V) { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]); }

// Feature use: (feature -> day -> users). A derived view of activity + AI requests.
const aiFeatureMap = (f: AiEvent['f']): Feature => (f === 'ask_ai' ? 'ask_ai' : f === 'codex' ? 'codex' : f === 'mis_report' ? 'insights' : 'ai_tools');
export const featureUse = new Map<Feature, Map<number, Set<string>>>();
function addUse(f: Feature, d: number, u: string) {
  let byDay = featureUse.get(f);
  if (!byDay) { byDay = new Map(); featureUse.set(f, byDay); }
  let s = byDay.get(d);
  if (!s) { s = new Set(); byDay.set(d, s); }
  s.add(u);
}
for (const a of activity) addUse(a.f, dayOf(a.t), a.u);
for (const e of aiEvents) addUse(aiFeatureMap(e.f), dayOf(e.t), e.u);

// Case-level activity days per matter (for dormancy)
export const matterActivityDays = new Map<string, number[]>();
for (const a of activity) if (a.m) push(matterActivityDays, a.m, dayOf(a.t));
for (const e of aiEvents) if (e.m) push(matterActivityDays, e.m, dayOf(e.t));
for (const m of matters) {
  const l = matterActivityDays.get(m.id) ?? [];
  l.push(dayOf(m.prior_activity_on), dayOf(m.tracked_on));
  l.sort((a, b) => a - b);
  matterActivityDays.set(m.id, l);
}

export const hearingsByMatter = new Map<string, Hearing[]>();
for (const h of hearings) push(hearingsByMatter, h.matter_id, h);

export type { Activity, AiEvent, Alert, Hearing, Matter, Spend, Suggestion, Team, User };
