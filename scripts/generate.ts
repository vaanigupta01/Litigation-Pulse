/*
 * Deterministic generator for the Meridia Consumer Industries sample account.
 * Every target in docs/03-data-spec.md is hit by allocation (counts are placed,
 * not sampled). Randomness only decides *which* row gets a value, and is seeded.
 * Output: src/data/*.json. Run: npm run generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_END, DATA_START, dow, fromDay, periodStart, toDay } from '../src/lib/dates';
import { rollingStickiness } from '../src/lib/stickiness';
import type {
  Account, Activity, ActivityKind, AiEvent, AiFeature, Alert, CourtType, ErrorDay, Eval, Feature, FieldName,
  Hearing, Matter, MissedQuery, PageLoadDay, Role, SearchDay, Spend, Suggestion, SyncDay, Team, TeamType, User,
} from '../src/lib/types';

const D = toDay;
const W30 = periodStart(30); // 9 Oct
const W90 = periodStart(90); // 10 Aug
const LAST_HEARING = D('2026-11-05');
const AUG1 = D('2026-08-01');
const SEP14 = D('2026-09-14');
const NOV1 = D('2026-11-01');

// ---------------------------------------------------------------- rng
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(20261108);
const reseed = (s: number) => { rnd = mulberry32(s); };
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const rf = (a: number, b: number) => a + rnd() * (b - a);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function h01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
function assert(c: unknown, msg: string): asserts c { if (!c) throw new Error('generator: ' + msg); }
const r1 = (x: number) => Math.round(x * 10) / 10;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const isWorkday = (d: number) => dow(d) !== 6; // courts and offices sit Mon to Sat

/** n integers whose median is exactly `m` (middle element(s) forced). */
function withMedian(n: number, m: number, lo: number, hi: number): number[] {
  const lowIdx = Math.floor((n - 1) / 2), hiIdx = Math.ceil((n - 1) / 2);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i < lowIdx ? ri(lo, m) : i > hiIdx ? ri(m, hi) : m);
  return shuffle(out);
}

// ---------------------------------------------------------------- teams
const BUS: Team[] = [
  { id: 'sales-distribution', name: 'Sales & Distribution', short: 'Sales', type: 'business_unit' },
  { id: 'procurement', name: 'Procurement & Supply Chain', short: 'Procurement', type: 'business_unit' },
  { id: 'human-resources', name: 'Human Resources', short: 'HR', type: 'business_unit' },
  { id: 'finance-corporate', name: 'Finance & Corporate', short: 'Finance', type: 'business_unit' },
];
const FIRMS: Team[] = [
  { id: 'firm-mehra', name: 'Mehra & Associates', short: 'Mehra', type: 'counsel_firm', city: 'Delhi' },
  { id: 'firm-subramanian', name: 'Subramanian Legal', short: 'Subramanian', type: 'counsel_firm', city: 'Chennai' },
  { id: 'firm-desai', name: 'Desai Thakkar & Co', short: 'Desai Thakkar', type: 'counsel_firm', city: 'Mumbai' },
  { id: 'firm-banerjee', name: 'Banerjee Law Chambers', short: 'Banerjee', type: 'counsel_firm', city: 'Kolkata' },
  { id: 'firm-chandra', name: 'Chandra & Partners', short: 'Chandra', type: 'counsel_firm', city: 'Hyderabad' },
];
const LEAD: Team = { id: 'legal-leadership', name: 'Legal leadership', short: 'Leadership', type: 'leadership' };
const teams: Team[] = [LEAD, ...BUS, ...FIRMS];
const [SD, PR, HR, FI] = BUS.map((b) => b.id);
const [MEHRA, SUBRA, DESAI, BANER, CHAND] = FIRMS.map((f) => f.id);

// ---------------------------------------------------------------- people
const FIRST = ['Aarav', 'Aditi', 'Akash', 'Amit', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepak', 'Divya', 'Gaurav', 'Harish', 'Isha', 'Jaya', 'Kavita', 'Kunal', 'Lakshmi', 'Manish', 'Meera', 'Mohit', 'Nandini', 'Nikhil', 'Nisha', 'Pankaj', 'Pallavi', 'Prakash', 'Priya', 'Rahul', 'Rajesh', 'Rekha', 'Rohit', 'Sakshi', 'Sanjay', 'Shalini', 'Shreya', 'Siddharth', 'Sneha', 'Sunil', 'Swati', 'Tanvi', 'Tarun', 'Uday', 'Varun', 'Vidya', 'Yash', 'Zoya', 'Abhishek', 'Aparna', 'Gayatri', 'Hemant', 'Ishaan', 'Jatin', 'Kiran', 'Madhuri', 'Naveen', 'Omkar', 'Payal', 'Ravi', 'Ruchi', 'Suresh', 'Tejas', 'Usha', 'Vandana', 'Vivek', 'Anil', 'Bindu', 'Dinesh', 'Geeta', 'Harsha', 'Irfan', 'Javed', 'Kamala', 'Lalit', 'Mansi', 'Neeraj', 'Preeti', 'Rakesh', 'Seema', 'Tushar', 'Vinay', 'Asha', 'Girish', 'Hina', 'Imran', 'Jyoti', 'Keshav', 'Leela', 'Mahesh', 'Nitin', 'Padma'];
const LAST = ['Agarwal', 'Bansal', 'Bhatt', 'Chatterjee', 'Chopra', 'Das', 'Deshpande', 'Dutta', 'Gill', 'Goyal', 'Hegde', 'Jain', 'Kapoor', 'Khanna', 'Krishnan', 'Kumar', 'Malhotra', 'Mishra', 'Mukherjee', 'Naidu', 'Pandey', 'Patel', 'Patil', 'Pillai', 'Rajan', 'Reddy', 'Saxena', 'Sethi', 'Shah', 'Shetty', 'Singh', 'Sinha', 'Srinivasan', 'Tiwari', 'Trivedi', 'Varma', 'Verma', 'Yadav', 'Bose', 'Ghosh', 'Gokhale', 'Bhatia', 'Kamath', 'Rangan', 'Sood', 'Wagle', 'Thakur', 'Ahuja', 'Bajaj', 'Dixit'];
const usedNames = new Set(['Ritika Sharma', 'Pooja Nair', 'Vikram Joshi', 'Karan Mehra', 'Neha Iyer', 'Anjali Rao', 'Sameer Kulkarni', 'Farhan Qureshi', 'Deepa Menon']);
function newName(): string {
  for (;;) {
    const n = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(n)) { usedNames.add(n); return n; }
  }
}
const slug = (s: string) => s.toLowerCase().replace(/^adv\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Plan { last: number | null; wau: boolean; peak: number; late: number }
const users: User[] = [];
const plan = new Map<string, Plan>();
const byId = new Map<string, User>();

function addUser(name: string, role: Role, title: string, team: Team, wau: boolean, last: number | null): User {
  const u: User = {
    id: slug(name), name, role, title, team_id: team.id, team_type: team.type as TeamType,
    seat_since: fromDay(D('2025-01-06') + ri(0, 400)), last_active: last === null ? null : fromDay(last), first_value_on: null,
  };
  assert(!byId.has(u.id), 'duplicate user ' + u.id);
  users.push(u); byId.set(u.id, u);
  plan.set(u.id, { last, wau, peak: ri(10, 12), late: ri(17, 20) });
  return u;
}
const nov = (d: number) => D('2026-11-0' + d);

// Admins (Legal leadership)
addUser('Anjali Rao', 'Admin', 'General Counsel', LEAD, true, nov(6));
addUser('Sameer Kulkarni', 'Admin', 'Legal Ops lead', LEAD, true, nov(7));
addUser('Farhan Qureshi', 'Admin', 'Legal Ops analyst', LEAD, true, nov(5));
addUser('Deepa Menon', 'Admin', 'IT administrator', LEAD, true, nov(3));

// Legal: S&D 7, Procurement 6, HR 5 (one not weekly-active), Finance 4 (one not weekly-active)
const legalByBu: Record<string, User[]> = { [SD]: [], [PR]: [], [HR]: [], [FI]: [] };
const legalSpec: [string, string[], number, [number, number][]][] = [
  [SD, ['Ritika Sharma'], 7, []],
  [PR, ['Pooja Nair'], 6, []],
  [HR, [], 5, [[4, D('2026-10-28')]]],
  [FI, ['Vikram Joshi'], 4, [[3, D('2026-10-20')]]],
];
for (const [bu, named, n, inactive] of legalSpec) {
  const team = BUS.find((b) => b.id === bu)!;
  for (let i = 0; i < n; i++) {
    const name = named[i] ?? newName();
    const ina = inactive.find(([idx]) => idx === i);
    const last = ina ? ina[1] : i === 0 ? nov(7) : nov(h01(name) < 0.5 ? 6 : 7);
    const title = name === 'Ritika Sharma' || name === 'Pooja Nair' ? 'Litigation manager' : name === 'Vikram Joshi' ? 'Senior legal counsel' : i % 2 ? 'Legal counsel' : 'Litigation manager';
    legalByBu[bu].push(addUser(name, 'Legal', title, team, !ina, last));
  }
}
const RITIKA = 'ritika-sharma', POOJA = 'pooja-nair', VIKRAM = 'vikram-joshi', KARAN = 'karan-mehra', NEHA = 'neha-iyer';

// Business: 24 per BU. Weekly-active: S&D 9, Procurement 4, HR 10, Finance 8.
const bizWau: Record<string, number> = { [SD]: 9, [PR]: 4, [HR]: 10, [FI]: 8 };
const bizTitles: Record<string, string[]> = {
  [SD]: ['Regional sales manager', 'Distributor relations lead', 'Area sales manager', 'Trade marketing manager'],
  [PR]: ['Category buyer', 'Procurement lead', 'Vendor manager', 'Supply planner'],
  [HR]: ['HR business partner', 'Employee relations manager', 'Plant HR manager', 'Payroll lead'],
  [FI]: ['Finance controller', 'Tax manager', 'Treasury analyst', 'Company secretary'],
};
const bizByBu: Record<string, User[]> = { [SD]: [], [PR]: [], [HR]: [], [FI]: [] };
for (const team of BUS) {
  for (let i = 0; i < 24; i++) {
    const isNeha = team.id === PR && i === 23;
    const name = isNeha ? 'Neha Iyer' : newName();
    const wau = i < bizWau[team.id];
    let last: number | null;
    if (wau) last = nov(2 + Math.floor(h01(name + 'l') * 6));
    else if (isNeha) last = D('2026-10-27');
    else {
      const k = i - bizWau[team.id];
      const r = h01(name + 'k');
      last = r < 0.2 ? W30 + Math.floor(h01(name + 'a') * 23) : r < 0.82 ? DATA_START + 3 + Math.floor(h01(name + 'b') * (W30 - DATA_START - 4)) : null;
      if (k === 0) last = D('2026-10-30');
    }
    bizByBu[team.id].push(addUser(name, 'Business', pick(bizTitles[team.id]), team, wau, last));
  }
}

// Lawyers. Weekly-active: Mehra 2 of 9, Subramanian 4/6, Desai 3/5, Banerjee 2/4, Chandra 2/4.
const lawyersByFirm: Record<string, User[]> = {};
const firmSpec: [string, number, number, (number | null)[]][] = [
  [MEHRA, 9, 2, [D('2026-10-23'), D('2026-10-16'), D('2026-09-28'), D('2026-08-30'), D('2026-07-12'), D('2026-06-20'), null]],
  [SUBRA, 6, 4, [D('2026-10-22'), D('2026-10-14')]],
  [DESAI, 5, 3, [D('2026-10-26'), D('2026-10-12')]],
  [BANER, 4, 2, [D('2026-10-29'), D('2026-10-19')]],
  [CHAND, 4, 2, [D('2026-10-21'), D('2026-10-15')]],
];
const lawyerTitles = ['Partner', 'Senior associate', 'Associate', 'Associate', 'Senior associate'];
for (const [firmId, n, nW, inactiveLasts] of firmSpec) {
  const team = FIRMS.find((f) => f.id === firmId)!;
  lawyersByFirm[firmId] = [];
  for (let i = 0; i < n; i++) {
    let name: string, title: string, wau: boolean, last: number | null;
    if (firmId === MEHRA && i === nW) { name = 'Adv. Karan Mehra'; title = 'Lead partner'; }
    else { name = 'Adv. ' + newName(); title = i === 0 ? 'Partner' : lawyerTitles[i % lawyerTitles.length]; }
    if (i < nW) { wau = true; last = nov(3 + Math.floor(h01(name) * 5)); }
    else { wau = false; last = inactiveLasts[i - nW] ?? null; }
    lawyersByFirm[firmId].push(addUser(name, 'Lawyer', title, team, wau, last));
  }
}
assert(users.length === 150, 'seats = 150');
const legalAll = Object.values(legalByBu).flat();
const lawyersAll = Object.values(lawyersByFirm).flat();
const admins = users.filter((u) => u.role === 'Admin');
const canAct = (uid: string, d: number) => { const p = plan.get(uid)!; return p.last !== null && d >= DATA_START && d <= p.last; };
const P = (uid: string) => plan.get(uid)!;

// Time to first value (median days by role, historical, from invite to first role-specific action)
const ttfvSpec: Record<Role, [number, number, number]> = { Admin: [1, 0, 2], Legal: [2, 0, 6], Business: [11, 2, 45], Lawyer: [19, 4, 62] };
for (const role of ['Admin', 'Legal', 'Business', 'Lawyer'] as Role[]) {
  const reached = users.filter((u) => u.role === role && u.last_active !== null);
  const vals = withMedian(reached.length, ...ttfvSpec[role]);
  reached.forEach((u, i) => { u.first_value_on = fromDay(D(u.seat_since) + vals[i]); });
}

// ---------------------------------------------------------------- timestamps
function ts(uid: string, d: number, salt: string): string {
  const p = P(uid);
  const r = h01(uid + d + salt);
  // Most work in office hours around a personal peak; litigation managers also work evenings before hearings.
  let hour: number;
  if (r < 0.62) hour = p.peak + Math.floor(h01(salt + uid + d) * 4) - 1;
  else if (r < 0.86) hour = 14 + Math.floor(h01(d + salt + uid) * 4);
  else hour = p.late + Math.floor(h01(salt + d) * 3) - 1;
  if (dow(d) === 6) hour = 11 + Math.floor(r * 4);
  const min = Math.floor(h01(salt + uid + 'm' + d) * 60);
  return `${fromDay(d)}T${String(Math.min(22, Math.max(8, hour))).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- matters
const DEALERS = ['Traders', 'Distributors', 'Agencies', 'Enterprises', 'Marketing', 'Retail'];
const VENDORS = ['Packaging Pvt Ltd', 'Logistics', 'Polymers Pvt Ltd', 'Agro Foods', 'Industries', 'Containers Ltd'];
const CORP = ['Capital Ltd', 'Realty Pvt Ltd', 'Infra Ltd', 'Holdings', 'Ventures'];
const COURTS: Record<CourtType, string[]> = {
  'High Court': ['Bombay High Court', 'Delhi High Court', 'Madras High Court', 'Calcutta High Court', 'Telangana High Court'],
  'District court': ['District Court, Pune', 'City Civil Court, Mumbai', 'District Court, Thane', 'Saket District Court, Delhi', 'District Court, Nagpur', 'City Civil Court, Chennai', 'District Court, Nashik'],
  'Consumer forum': ['District Consumer Commission, Mumbai', 'State Consumer Commission, Maharashtra', 'District Consumer Commission, Pune', 'District Consumer Commission, Bengaluru'],
  Tribunal: ['NCLT Mumbai', 'Labour Court, Pune', 'Industrial Tribunal, Thane', 'ITAT Mumbai', 'GSTAT Mumbai'],
  'Supreme Court': ['Supreme Court of India'],
};

interface Slot { bu: string; mgr: string; firm: string | null; transfer?: boolean; karan?: boolean; cohort?: 'new' | 'inwin' | 'pre'; dormant?: boolean }
const slots: Slot[] = [];
const addSlots = (n: number, s: Slot) => { for (let i = 0; i < n; i++) slots.push({ ...s }); };
const others = (bu: string, exclude: string[]) => legalByBu[bu].map((u) => u.id).filter((id) => !exclude.includes(id));

// Sales & Distribution (148): Ritika owns 96. Mehra took over 50 dealer disputes from Desai Thakkar on 1 Aug.
addSlots(30, { bu: SD, mgr: RITIKA, firm: MEHRA, transfer: true, karan: true, cohort: 'inwin' });
addSlots(10, { bu: SD, mgr: RITIKA, firm: MEHRA, transfer: true, cohort: 'inwin' });
addSlots(10, { bu: SD, mgr: RITIKA, firm: MEHRA, transfer: true, cohort: 'pre' });
addSlots(10, { bu: SD, mgr: RITIKA, firm: MEHRA, karan: true, cohort: 'new' });
addSlots(2, { bu: SD, mgr: RITIKA, firm: MEHRA, cohort: 'new' });
addSlots(12, { bu: SD, mgr: RITIKA, firm: MEHRA, cohort: 'pre', dormant: true });
addSlots(1, { bu: SD, mgr: RITIKA, firm: SUBRA, cohort: 'new' });
addSlots(2, { bu: SD, mgr: RITIKA, firm: SUBRA, cohort: 'pre' });
addSlots(1, { bu: SD, mgr: RITIKA, firm: DESAI, cohort: 'new' });
addSlots(1, { bu: SD, mgr: RITIKA, firm: DESAI, cohort: 'pre' });
addSlots(12, { bu: SD, mgr: RITIKA, firm: null, cohort: 'new' });
addSlots(2, { bu: SD, mgr: RITIKA, firm: null, cohort: 'pre' });
addSlots(3, { bu: SD, mgr: RITIKA, firm: null, cohort: 'pre', dormant: true });
// S&D others (52)
addSlots(6, { bu: SD, mgr: 'other', firm: MEHRA, cohort: 'new' });
addSlots(1, { bu: SD, mgr: 'other', firm: DESAI, cohort: 'new' });
addSlots(3, { bu: SD, mgr: 'other', firm: BANER, cohort: 'new' });
addSlots(34, { bu: SD, mgr: 'other', firm: null, cohort: 'new' });
addSlots(2, { bu: SD, mgr: 'other', firm: null, cohort: 'pre' });
addSlots(6, { bu: SD, mgr: 'other', firm: null, cohort: 'pre', dormant: true });
// Procurement (104): Pooja owns 28.
const firmMix = (bu: string, mgr: string, spec: [string | null, number][]) => spec.forEach(([f, n]) => addSlots(n, { bu, mgr, firm: f }));
firmMix(PR, POOJA, [[null, 12], [DESAI, 9], [CHAND, 7]]);
firmMix(PR, 'other', [[null, 43], [SUBRA, 16], [DESAI, 9], [CHAND, 8]]);
firmMix(HR, 'other', [[null, 54], [SUBRA, 10], [DESAI, 7], [BANER, 16], [CHAND, 5]]);
firmMix(FI, 'other', [[MEHRA, 20], [SUBRA, 7], [BANER, 4], [null, 37]]);

// Cohorts for Procurement, HR, Finance: new (90d) / in-window older / pre-window. New prefers firm slots.
const cohortSpec: Record<string, { newFirm: number; newIn: number; inwin: number; pre: number; dormant: number; risingInwin: number }> = {
  [PR]: { newFirm: 40, newIn: 10, inwin: 30, pre: 24, dormant: 15, risingInwin: 4 },
  [HR]: { newFirm: 34, newIn: 8, inwin: 24, pre: 26, dormant: 16, risingInwin: 4 },
  [FI]: { newFirm: 26, newIn: 4, inwin: 16, pre: 22, dormant: 11, risingInwin: 3 },
};
for (const bu of [PR, HR, FI]) {
  const c = cohortSpec[bu];
  const s = shuffle(slots.filter((x) => x.bu === bu));
  const firmS = s.filter((x) => x.firm), inS = s.filter((x) => !x.firm);
  firmS.slice(0, c.newFirm).forEach((x) => (x.cohort = 'new'));
  inS.slice(0, c.newIn).forEach((x) => (x.cohort = 'new'));
  // dormant matters come from in-house slots so counsel activity stays readable
  const rest = shuffle([...inS.slice(c.newIn), ...firmS.slice(c.newFirm)]);
  const restIn = rest.filter((x) => !x.firm), restFirm = rest.filter((x) => x.firm);
  const ordered = [...restIn, ...restFirm];
  // pre cohort first from in-house (dormant early ones need pre), then inwin
  const dormantInwin = ordered.slice(0, c.risingInwin);
  dormantInwin.forEach((x) => { x.cohort = 'inwin'; x.dormant = true; });
  const preList = ordered.slice(c.risingInwin, c.risingInwin + c.pre);
  preList.forEach((x) => (x.cohort = 'pre'));
  preList.slice(0, c.dormant - c.risingInwin).forEach((x) => (x.dormant = true));
  ordered.slice(c.risingInwin + c.pre).forEach((x) => (x.cohort = 'inwin'));
}
assert(slots.length === 412, 'active slots 412');
assert(slots.every((s) => s.cohort), 'cohort assigned');

// Manager assignment for 'other' slots: round-robin with weights.
for (const bu of [SD, PR, HR, FI]) {
  const pool = others(bu, [RITIKA, POOJA]);
  let i = 0;
  for (const s of shuffle(slots.filter((x) => x.bu === bu && x.mgr === 'other'))) { s.mgr = pool[i++ % pool.length]; }
}

// Contract-based, court types
const contractQuota: Record<string, number> = { [SD]: 86, [PR]: 63, [HR]: 27, [FI]: 15 };
const courtQuota: [CourtType, number][] = [['Consumer forum', 72], ['Supreme Court', 12], ['Tribunal', 46], ['High Court', 118], ['District court', 164]];
const slotContract = new Map<Slot, boolean>();
for (const bu of [SD, PR, HR, FI]) shuffle(slots.filter((x) => x.bu === bu)).forEach((s, i) => slotContract.set(s, i < contractQuota[bu]));
const slotCourt = new Map<Slot, CourtType>();
{
  // consumer forums only for non-contract S&D / Procurement / Finance matters; tribunals prefer HR and Finance
  const pool = shuffle(slots);
  const take = (n: number, pred: (s: Slot) => boolean, ct: CourtType) => {
    let k = 0;
    for (const s of pool) { if (k >= n) break; if (!slotCourt.has(s) && pred(s)) { slotCourt.set(s, ct); k++; } }
    assert(k === n, 'court quota ' + ct);
  };
  take(72, (s) => !slotContract.get(s) && s.bu !== HR, 'Consumer forum');
  take(12, (s) => s.bu === FI || s.bu === SD, 'Supreme Court');
  take(46, (s) => s.bu === HR || s.bu === FI || h01(String(pool.indexOf(s))) < 0.2, 'Tribunal');
  take(118, () => true, 'High Court');
  take(164, () => true, 'District court');
}
function caseType(bu: string, contract: boolean, ct: CourtType): string {
  if (contract) {
    if (bu === SD) return 'Dealer and distributor dispute';
    if (bu === PR) return 'Vendor and supply contract dispute';
    if (bu === HR) return 'Employment contract dispute';
    return ct === 'Tribunal' ? 'Commercial dispute (NCLT)' : 'Commercial contract dispute';
  }
  if (ct === 'Consumer forum') return 'Consumer complaint';
  if (bu === HR) return 'Employment and labour case';
  if (ct === 'Tribunal' || ct === 'Supreme Court') return 'Tax and regulatory';
  if (ct === 'High Court') return bu === FI ? 'Tax and regulatory' : 'Trademark';
  return 'Cheque bounce (Sec 138 NI Act)';
}
function titleFor(type: string): string {
  const L = pick(LAST);
  switch (type) {
    case 'Dealer and distributor dispute': return h01(L + type) < 0.5 ? `Meridia v. ${L} ${pick(DEALERS)}` : `${L} ${pick(DEALERS)} v. Meridia`;
    case 'Vendor and supply contract dispute': return `${L} ${pick(VENDORS)} v. Meridia`;
    case 'Employment contract dispute':
    case 'Employment and labour case': return `${pick(FIRST)} ${L} v. Meridia`;
    case 'Commercial contract dispute':
    case 'Commercial dispute (NCLT)': return `Meridia v. ${L} ${pick(CORP)}`;
    case 'Consumer complaint': return `${pick(FIRST)} ${L} v. Meridia`;
    case 'Cheque bounce (Sec 138 NI Act)': return `Meridia v. ${L} ${pick(DEALERS)}`;
    case 'Tax and regulatory': return pick(['Meridia v. Commissioner of GST, Mumbai', 'Meridia v. Union of India', 'Meridia v. Deputy Commissioner of Income Tax', 'Meridia v. FSSAI', 'Meridia v. State of Maharashtra']);
    default: return `Meridia v. ${pick(['Freshko', 'Nuviya', 'Kalpaa', 'Fresqo', 'Nuvea'])} Foods`;
  }
}

const matters: Matter[] = [];
const mById = new Map<string, Matter>();
const dormantLast = new Map<string, number>(); // matter -> last activity day (dormant ones)
const slotOf = new Map<string, Slot>();
let mSeq = 0;
const lawyerPick = (firm: string, karan?: boolean): string => {
  if (karan) return KARAN;
  const pool = lawyersByFirm[firm].filter((u) => u.id !== KARAN);
  return pick(pool).id;
};
function makeMatter(s: Slot | null, bu: string, mgr: string, firm: string | null, contract: boolean, ct: CourtType, tracked: number, disposed: number | null): Matter {
  const id = `M${String(++mSeq).padStart(4, '0')}`;
  const ctype = caseType(bu, contract, ct);
  const m: Matter = {
    id, title: titleFor(ctype), case_type: ctype, contract_based: contract, court_type: ct, court: pick(COURTS[ct]), bu,
    case_manager_id: mgr, firm_id: firm, lawyer_id: firm ? lawyerPick(firm, s?.karan) : null, prior_firm_id: null, prior_lawyer_id: null,
    firm_since: null, status: disposed ? 'disposed' : 'ongoing', filed_on: fromDay(tracked - ri(5, 60)), tracked_on: fromDay(tracked),
    disposed_on: disposed ? fromDay(disposed) : null, first_hearing_on: null, source: 'legacy', priority: 'High', priority_default: true,
    fields_set: {}, prior_activity_on: fromDay(DATA_START - ri(1, 40)), last_activity_on: '',
  };
  if (s?.transfer) { m.prior_firm_id = DESAI; m.prior_lawyer_id = pick(lawyersByFirm[DESAI]).id; m.firm_since = fromDay(AUG1); }
  matters.push(m); mById.set(id, m); if (s) slotOf.set(id, s);
  return m;
}
// tracked dates
const newDays = shuffle(range(W90, DATA_END).filter(isWorkday));
let ndI = 0;
for (const s of shuffle(slots)) {
  let tracked: number;
  if (s.cohort === 'new') tracked = newDays[ndI++ % newDays.length];
  else if (s.cohort === 'inwin') tracked = s.transfer ? ri(DATA_START, AUG1 - 3) : ri(DATA_START, W90 - 1);
  else tracked = D('2024-04-01') + ri(0, 760);
  makeMatter(s, s.bu, s.mgr, s.firm, slotContract.get(s)!, slotCourt.get(s)!, tracked, null);
}
// Dormant: 41 dormant since before June (last activity before 2 Mar), 22 slide in steadily.
{
  const dorm = matters.filter((m) => slotOf.get(m.id)?.dormant);
  assert(dorm.length === 63, 'dormant 63, got ' + dorm.length);
  const inwin = dorm.filter((m) => slotOf.get(m.id)!.cohort === 'inwin');
  const pre = shuffle(dorm.filter((m) => slotOf.get(m.id)!.cohort === 'pre'));
  const risingPre = pre.slice(0, 22 - inwin.length);
  const early = pre.slice(22 - inwin.length);
  assert(early.length === 41, 'early dormant 41');
  early.forEach((m, i) => {
    const last = D('2025-11-03') + Math.floor((i * 118) / 41);
    m.tracked_on = fromDay(Math.min(D(m.tracked_on), last - ri(20, 200)));
    m.prior_activity_on = fromDay(last); dormantLast.set(m.id, last);
  });
  // rising: evenly from 10 Mar to 9 Aug
  const rising = [...risingPre.map((m) => ({ m, pre: true })), ...inwin.map((m) => ({ m, pre: false }))];
  const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + Math.round(((i + 0.5) * (b - a)) / n));
  const preDays = spread(D('2026-03-10'), DATA_START - 1, risingPre.length);
  const inDays = spread(DATA_START, W90 - 1, inwin.length);
  risingPre.forEach((m, i) => { m.tracked_on = fromDay(Math.min(D(m.tracked_on), preDays[i] - 30)); m.prior_activity_on = fromDay(preDays[i]); dormantLast.set(m.id, preDays[i]); });
  inwin.forEach((m, i) => { m.tracked_on = fromDay(inDays[i]); m.prior_activity_on = fromDay(inDays[i]); dormantLast.set(m.id, inDays[i]); });
  for (const m of matters) if (D(m.prior_activity_on) < D(m.tracked_on) && D(m.tracked_on) < DATA_START) m.prior_activity_on = m.tracked_on;
}
const isDormant = (m: Matter) => dormantLast.has(m.id);

// Disposed matters: 110 between 18 May and 9 Aug, 180 in the last 90 days. All tracked before the window.
const disposedSpec: [string, number, number][] = [[SD, 40, 64], [PR, 27, 46], [HR, 25, 40], [FI, 18, 30]];
const buFirms: Record<string, (string | null)[]> = {
  [SD]: [MEHRA, MEHRA, DESAI, DESAI, null, null, SUBRA, BANER], [PR]: [SUBRA, DESAI, CHAND, null, null], [HR]: [BANER, SUBRA, null, null, CHAND], [FI]: [MEHRA, SUBRA, null, null],
};
for (const [bu, early, late] of disposedSpec) {
  for (let i = 0; i < early + late; i++) {
    const disp = i < early ? ri(DATA_START + 3, W90 - 1) : ri(W90, DATA_END);
    const firm = pick(buFirms[bu]);
    const mgr = pick(legalByBu[bu]).id;
    const ct = pick(courtQuota.map(([c]) => c).filter((c) => c !== 'Supreme Court'));
    const m = makeMatter(null, bu, mgr, firm === MEHRA && bu === SD && disp > AUG1 && h01('t' + i) < 0.6 ? MEHRA : firm, h01(bu + i) < 0.45, ct, D('2024-06-01') + ri(0, 680), disp);
    if (m.firm_id === MEHRA && bu === SD && disp > AUG1 + 10 && h01('tr' + i) < 0.6) { m.prior_firm_id = DESAI; m.prior_lawyer_id = pick(lawyersByFirm[DESAI]).id; m.firm_since = fromDay(AUG1); }
  }
}
const active = matters.filter((m) => m.status === 'ongoing');
assert(active.length === 412, 'active 412');

// New-matter sources, filed dates (median 23 days from filing to tracked), early capture.
const newMatters = active.filter((m) => D(m.tracked_on) >= W90);
assert(newMatters.length === 192, 'new matters 192, got ' + newMatters.length);
const sourceSpec: Record<string, [number, number, number]> = { [SD]: [59, 8, 3], [PR]: [42, 6, 2], [HR]: [35, 4, 3], [FI]: [26, 3, 1] };
const earlySpec: Record<string, number> = { [SD]: 40, [PR]: 17, [HR]: 28, [FI]: 15 };
const earlyCaptured = new Set<string>();
for (const bu of [SD, PR, HR, FI]) {
  const list = shuffle(newMatters.filter((m) => m.bu === bu));
  const [sug, man] = sourceSpec[bu];
  list.forEach((m, i) => { m.source = i < sug ? 'suggestion' : i < sug + man ? 'manual' : 'court_search'; });
  shuffle(list).slice(0, earlySpec[bu]).forEach((m) => earlyCaptured.add(m.id));
}
{
  const lags = withMedian(192, 23, 3, 70);
  newMatters.forEach((m, i) => { m.filed_on = fromDay(D(m.tracked_on) - lags[i]); });
}

// Priority: 96% still at default
shuffle(active).slice(0, 16).forEach((m, i) => { m.priority = i % 3 ? 'Medium' : 'Low'; m.priority_default = false; });

// ---------------------------------------------------------------- field completeness (new matters): dates only, events later
{
  const atAdd: Record<FieldName, number> = { exposure: 6, amount_claimed: 10, counsel: 79, risk_rating: 4, key_action: 2 };
  const by14: Record<FieldName, number> = { exposure: 21, amount_claimed: 27, counsel: 121, risk_rating: 17, key_action: 12 };
  const later: Record<FieldName, number> = { exposure: 2, amount_claimed: 2, counsel: 3, risk_rating: 1, key_action: 1 };
  for (const f of Object.keys(atAdd) as FieldName[]) {
    let pool = f === 'counsel' ? shuffle(newMatters.filter((m) => m.firm_id)) : shuffle(newMatters);
    if (f === 'counsel') assert(pool.length >= by14.counsel + later.counsel, 'enough firm-new matters ' + pool.length);
    const old = pool.filter((m) => D(m.tracked_on) <= DATA_END - 20);
    const lateSet = new Set(old.slice(0, later[f]).map((m) => m.id));
    pool = pool.filter((m) => !lateSet.has(m.id));
    // matters added on the last day can only have a field "at add" (counsel) or not at all
    const lastDay = pool.filter((m) => D(m.tracked_on) === DATA_END), rest = pool.filter((m) => D(m.tracked_on) !== DATA_END);
    pool = f === 'counsel' ? [...lastDay, ...rest] : [...rest, ...lastDay];
    pool.forEach((m, i) => {
      const tr = D(m.tracked_on);
      if (i < atAdd[f]) m.fields_set[f] = fromDay(tr);
      else if (i < by14[f]) m.fields_set[f] = fromDay(Math.min(tr + ri(1, 14), DATA_END));
    });
    for (const id of lateSet) { const m = mById.get(id)!; m.fields_set[f] = fromDay(Math.min(D(m.tracked_on) + ri(15, 20), DATA_END)); }
    if (f === 'counsel') for (const m of newMatters) if (m.firm_id && !m.fields_set.counsel) { m.firm_id = null; m.lawyer_id = null; }
  }
  for (const m of active.filter((x) => D(x.tracked_on) < W90)) {
    if (m.firm_id) m.fields_set.counsel = m.firm_since ?? m.tracked_on;
    for (const [f, p] of [['exposure', 0.06], ['amount_claimed', 0.08], ['risk_rating', 0.05]] as [FieldName, number][]) if (h01(m.id + f) < p) m.fields_set[f] = m.tracked_on;
  }
  for (const m of matters) if (D(m.tracked_on) >= DATA_START) m.prior_activity_on = m.tracked_on;
}

// ---------------------------------------------------------------- activity log
const activity: Activity[] = [];
const lastByMatter = new Map<string, number>();
function act(uid: string, d: number, k: ActivityKind, f: Feature, extra: Partial<Activity> = {}, salt = ''): Activity {
  assert(canAct(uid, d), `actor ${uid} cannot act on ${fromDay(d)} (${k})`);
  if (extra.m) {
    const m = mById.get(extra.m)!;
    assert(!isDormant(m) || d <= dormantLast.get(m.id)!, `activity on dormant matter ${m.id}`);
    lastByMatter.set(m.id, Math.max(lastByMatter.get(m.id) ?? 0, d));
  }
  const a: Activity = { t: ts(uid, d, k + salt + (extra.m ?? '') + (extra.h ?? '')), u: uid, k, f, ...extra };
  activity.push(a);
  return a;
}
/** Legal user who records work for a matter on day d: the case manager, else a colleague in the unit. */
function legalActor(m: Matter, d: number): string {
  if (canAct(m.case_manager_id, d)) return m.case_manager_id;
  const pool = legalByBu[m.bu].filter((u) => canAct(u.id, d));
  assert(pool.length, `no legal actor in ${m.bu} on ${fromDay(d)}`);
  return pool[0].id;
}
const activeOn = (m: Matter, d: number) => D(m.tracked_on) <= d && (!m.disposed_on || D(m.disposed_on) >= d);
const ownerFirmOn = (m: Matter, d: number) => (m.firm_since && d < D(m.firm_since) ? m.prior_firm_id : m.firm_id);
const ownerLawyerOn = (m: Matter, d: number) => (m.firm_since && d < D(m.firm_since) ? m.prior_lawyer_id : m.lawyer_id);

// Counsel "on-platform" target sets: active firm matters with any action by the firm's lawyers in 30 days.
const firmActivityTarget: Record<string, number> = { [MEHRA]: 22, [SUBRA]: 31, [DESAI]: 22, [BANER]: 17, [CHAND]: 14 };
const firmTargets: Record<string, Set<string>> = {};

// ---------------------------------------------------------------- hearings
const hearings: Hearing[] = [];
const hearingsByMatter = new Map<string, number[]>();
let hSeq = 0;
function addHearing(m: Matter, d: number): Hearing {
  const firm = ownerFirmOn(m, d);
  const h: Hearing = {
    id: `H${String(++hSeq).padStart(5, '0')}`, matter_id: m.id, date: fromDay(d), owner_type: firm ? 'counsel' : 'inhouse', firm_id: firm,
    owner_id: firm ? ownerLawyerOn(m, d)! : m.case_manager_id, outcome_recorded_on: null, lag_days: null, updater_id: null,
  };
  hearings.push(h);
  const l = hearingsByMatter.get(m.id) ?? []; l.push(d); hearingsByMatter.set(m.id, l);
  return h;
}
const freeFor = (m: Matter, d: number, gap: number) => (hearingsByMatter.get(m.id) ?? []).every((x) => Math.abs(x - d) >= gap);

// Period (last 30 days) hearings by cell: [bu, manager group, owner, karan?, n, closed, awaiting]
type Cell = { bu: string; mgr: 'ritika' | 'pooja' | 'other'; owner: string | null; karan?: boolean; n: number; closed: number; awaiting: number };
const cells: Cell[] = [
  { bu: SD, mgr: 'ritika', owner: MEHRA, karan: true, n: 34, closed: 8, awaiting: 12 },
  { bu: SD, mgr: 'ritika', owner: MEHRA, karan: false, n: 26, closed: 10, awaiting: 6 },
  { bu: SD, mgr: 'ritika', owner: null, n: 6, closed: 5, awaiting: 0 },
  { bu: SD, mgr: 'ritika', owner: SUBRA, n: 2, closed: 2, awaiting: 0 },
  { bu: SD, mgr: 'ritika', owner: DESAI, n: 2, closed: 1, awaiting: 1 },
  { bu: SD, mgr: 'other', owner: MEHRA, n: 4, closed: 1, awaiting: 2 },
  { bu: SD, mgr: 'other', owner: null, n: 2, closed: 2, awaiting: 0 },
  { bu: SD, mgr: 'other', owner: BANER, n: 2, closed: 1, awaiting: 1 },
  { bu: PR, mgr: 'pooja', owner: null, n: 8, closed: 8, awaiting: 0 },
  { bu: PR, mgr: 'pooja', owner: DESAI, n: 8, closed: 7, awaiting: 0 },
  { bu: PR, mgr: 'pooja', owner: CHAND, n: 6, closed: 5, awaiting: 0 },
  { bu: PR, mgr: 'other', owner: null, n: 8, closed: 7, awaiting: 1 },
  { bu: PR, mgr: 'other', owner: SUBRA, n: 12, closed: 9, awaiting: 2 },
  { bu: PR, mgr: 'other', owner: DESAI, n: 8, closed: 6, awaiting: 1 },
  { bu: PR, mgr: 'other', owner: CHAND, n: 6, closed: 4, awaiting: 1 },
  { bu: HR, mgr: 'other', owner: null, n: 22, closed: 19, awaiting: 2 },
  { bu: HR, mgr: 'other', owner: BANER, n: 12, closed: 10, awaiting: 2 },
  { bu: HR, mgr: 'other', owner: SUBRA, n: 6, closed: 4, awaiting: 1 },
  { bu: HR, mgr: 'other', owner: CHAND, n: 2, closed: 1, awaiting: 1 },
  { bu: HR, mgr: 'other', owner: DESAI, n: 4, closed: 3, awaiting: 0 },
  { bu: FI, mgr: 'other', owner: MEHRA, n: 18, closed: 5, awaiting: 11 },
  { bu: FI, mgr: 'other', owner: null, n: 12, closed: 10, awaiting: 1 },
  { bu: FI, mgr: 'other', owner: SUBRA, n: 4, closed: 3, awaiting: 1 },
  { bu: FI, mgr: 'other', owner: BANER, n: 2, closed: 1, awaiting: 1 },
];
const periodDays = range(W30, LAST_HEARING).filter(isWorkday);
const cellHearings = new Map<Cell, Hearing[]>();
for (const c of cells) {
  const cands = active.filter((m) => m.bu === c.bu && !isDormant(m) && m.firm_id === c.owner &&
    (c.mgr === 'ritika' ? m.case_manager_id === RITIKA : c.mgr === 'pooja' ? m.case_manager_id === POOJA : m.case_manager_id !== RITIKA && m.case_manager_id !== POOJA) &&
    (c.karan === undefined || (m.lawyer_id === KARAN) === c.karan));
  const list: Hearing[] = [];
  let guard = 0;
  while (list.length < c.n) {
    assert(guard++ < 20000, 'cannot place hearings for cell ' + JSON.stringify(c));
    const d = pick(periodDays);
    const m = pick(cands);
    if (!m || D(m.tracked_on) >= d) continue;
    const counselSet = m.fields_set.counsel ? D(m.fields_set.counsel) : D(m.tracked_on);
    if (c.owner && counselSet > d) continue;
    if (!freeFor(m, d, 10)) continue;
    list.push(addHearing(m, d));
  }
  cellHearings.set(c, list);
}
// History hearings, 18 May to 8 Oct: ~50 a week. Mehra's share 15% until August, then 38%.
{
  const cand = matters.filter((m) => !isDormant(m));
  for (let w = 0; w < 21; w++) {
    const ws = DATA_START + 7 * w;
    const n = 48 + ri(-3, 4);
    const mid = ws + 3;
    const mehraShare = mid < AUG1 ? 0.15 : Math.min(0.38, 0.15 + ((mid - AUG1) / 28) * 0.23);
    const quotas: [string, number][] = [['mehra', Math.round(n * mehraShare)], ['inhouse', Math.round(n * 0.27)]];
    quotas.push(['other', n - quotas[0][1] - quotas[1][1]]);
    const days = range(ws, ws + 5).filter((d) => d < W30);
    if (!days.length) continue;
    for (const [g, q0] of quotas) {
      const q = Math.round((q0 * days.length) / 6);
      let placed = 0, guard = 0;
      while (placed < q && guard++ < 4000) {
        const d = pick(days);
        const m = pick(cand);
        if (!activeOn(m, d) || D(m.tracked_on) >= d) continue;
        const f = ownerFirmOn(m, d);
        const grp = f === MEHRA ? 'mehra' : f ? 'other' : 'inhouse';
        if (grp !== g || !freeFor(m, d, 14)) continue;
        addHearing(m, d); placed++;
      }
    }
  }
}

// Outcome lags. Lag is measured from the start of the hearing day; closed out = recorded within 2 calendar days (lag < 3).
function closedRegion(c: number, l: number, t: number): { closed: number[]; late: number[] } {
  const n = c + l, lo = Math.floor((n - 1) / 2), hi = Math.ceil((n - 1) / 2);
  assert(c > hi, 'median must fall in closed region');
  const closed: number[] = [];
  for (let i = 0; i < c; i++) closed.push(i < lo ? r1(rf(0.2, t)) : i > hi ? r1(rf(t, 2.95)) : t);
  return { closed: closed.map((x) => Math.min(x, 2.9)), late: Array.from({ length: l }, () => r1(rf(3.2, 8))) };
}
const periodByOwner = (pred: (c: Cell) => boolean) => cells.filter(pred);
const cellStatus = new Map<Hearing, 'closed' | 'late' | 'awaiting'>();
const awaitingCap = new Map<string, number>();
for (const c of cells) {
  const hs = [...cellHearings.get(c)!].sort((a, b) => D(a.date) - D(b.date));
  const late = c.n - c.closed - c.awaiting;
  // late outcomes need room to be recorded: pick them from the earlier three quarters of the cell, spread out
  const early = hs.slice(0, Math.max(late, Math.ceil(hs.length * (c.owner === MEHRA ? 0.5 : 0.75))));
  const lateSet = new Set(shuffle(early).slice(0, late));
  hs.filter((h) => lateSet.has(h)).forEach((h) => cellStatus.set(h, 'late'));
  const restH = shuffle(hs.filter((h) => !lateSet.has(h)));
  let aw = 0;
  for (const h of restH) {
    const mgr = mById.get(h.matter_id)!.case_manager_id;
    const cap = mgr === RITIKA ? 99 : 6;
    if (aw < c.awaiting && (awaitingCap.get(mgr) ?? 0) < cap) { cellStatus.set(h, 'awaiting'); awaitingCap.set(mgr, (awaitingCap.get(mgr) ?? 0) + 1); aw++; }
    else cellStatus.set(h, 'closed');
  }
  assert(aw === c.awaiting, 'awaiting cap hit in cell ' + JSON.stringify(c));
}
function applyLags(hs: Hearing[], closedVals: number[], lateVals: number[]) {
  const closedH = shuffle(hs.filter((h) => cellStatus.get(h) === 'closed'));
  const lateH = hs.filter((h) => cellStatus.get(h) === 'late').sort((a, b) => D(a.date) - D(b.date));
  assert(closedH.length === closedVals.length && lateH.length === lateVals.length, 'lag counts');
  closedH.forEach((h, i) => (h.lag_days = closedVals[i]));
  const lv = [...lateVals].sort((a, b) => b - a);
  lateH.forEach((h, i) => {
    h.lag_days = lv[i];
    assert(D(h.date) + Math.floor(lv[i]) <= DATA_END, `late lag ${lv[i]} infeasible for ${h.date}`);
  });
}
const hsOf = (pred: (c: Cell) => boolean) => periodByOwner(pred).flatMap((c) => cellHearings.get(c)!);
const groupCounts = (hs: Hearing[]) => ({ c: hs.filter((h) => cellStatus.get(h) === 'closed').length, l: hs.filter((h) => cellStatus.get(h) === 'late').length });
for (const [owner, t] of [[null, 1.1], [SUBRA, 1.8], [DESAI, 2.1], [BANER, 2.6], [CHAND, 2.3]] as [string | null, number][]) {
  const hs = hsOf((c) => c.owner === owner);
  const { c, l } = groupCounts(hs);
  const v = closedRegion(c, l, t);
  applyLags(hs, v.closed, v.late);
}
{
  // Mehra: Karan's hearings have a median of 11.2 days, the firm overall 9.4.
  const karanH = hsOf((c) => c.owner === MEHRA && c.karan === true);
  const k = groupCounts(karanH); // 8 closed, 14 late
  assert(k.c === 8 && k.l === 14, 'karan counts');
  const kLate = [r1(rf(9.5, 10.4)), r1(rf(10.5, 11.1)), 11.2, 11.2, ...Array.from({ length: 10 }, () => r1(rf(11.3, 15.5)))];
  applyLags(karanH, Array.from({ length: 8 }, () => r1(rf(0.3, 2.9))), kLate);
  const restH = hsOf((c) => c.owner === MEHRA && c.karan !== true);
  const r = groupCounts(restH); // 16 closed, 13 late
  assert(r.c === 16 && r.l === 13, 'mehra rest counts');
  const rLate = [r1(rf(4, 9)), 9.4, 9.4, ...Array.from({ length: 10 }, () => r1(rf(9.6, 15)))];
  applyLags(restH, Array.from({ length: 16 }, () => r1(rf(0.3, 2.9))), rLate);
}
// History lags: in-house 88%, other firms 76%, Mehra 29% closed within 2 days.
{
  const hist = hearings.filter((h) => D(h.date) < W30);
  const byWeek = new Map<string, Hearing[]>();
  for (const h of hist) {
    const g = h.firm_id === MEHRA ? 'mehra' : h.firm_id ? 'other' : 'inhouse';
    const key = Math.floor((D(h.date) - DATA_START) / 7) + g;
    byWeek.set(key, [...(byWeek.get(key) ?? []), h]);
  }
  const rate: Record<string, number> = { mehra: 0.29, other: 0.76, inhouse: 0.88 };
  const carry: Record<string, number> = { mehra: 0, other: 0, inhouse: 0 };
  for (const [key, hs] of byWeek) {
    const g = key.replace(/^\d+/, '');
    const wobble = (h01('wk2' + key) - 0.5) * (g === 'inhouse' ? 0.08 : 0.16);
    const exact = hs.length * (rate[g] + wobble) + carry[g];
    const closedN = Math.max(0, Math.min(hs.length, Math.round(exact))); carry[g] = exact - closedN - hs.length * wobble;
    shuffle(hs).forEach((h, i) => {
      h.lag_days = i < closedN ? r1(rf(0.2, 2.9)) : g === 'mehra' ? r1(rf(4, 24)) : r1(rf(3.1, 9));
    });
  }
}
// Record outcomes (activity) and pick updaters.
for (const h of hearings) {
  const st = cellStatus.get(h);
  if (st === 'awaiting') continue;
  assert(h.lag_days !== null, 'lag set');
  const d = D(h.date) + Math.floor(h.lag_days);
  h.outcome_recorded_on = fromDay(d);
}
// choose firm on-platform target matters (prefer those with hearings in the period)
for (const f of FIRMS) {
  const maxLast = Math.max(...lawyersByFirm[f.id].map((u) => P(u.id).last ?? -1));
  const fm = active.filter((m) => m.firm_id === f.id && !isDormant(m) && D(m.tracked_on) <= maxLast);
  const withH = shuffle(fm.filter((m) => hearings.some((h) => h.matter_id === m.id && D(h.date) >= W30)));
  const without = shuffle(fm.filter((m) => !withH.includes(m)));
  const all = [...withH, ...without];
  const n = firmActivityTarget[f.id];
  assert(all.length >= n, 'firm target ' + f.id);
  // keep Karan on a few early targets so his last action (23 Oct) lands on one
  firmTargets[f.id] = new Set(all.slice(0, n).map((m) => m.id));
}
const firmActive30 = (firm: string) => lawyersByFirm[firm].filter((u) => { const p = P(u.id); return p.last !== null && p.last >= W30; });
for (const h of [...hearings].sort((a, b) => a.date.localeCompare(b.date))) {
  if (!h.outcome_recorded_on) continue;
  const d = D(h.outcome_recorded_on);
  const m = mById.get(h.matter_id)!;
  let up: string | null = null;
  if (h.owner_type === 'counsel') {
    const inWin = d >= W30;
    const lawyerOk = canAct(h.owner_id, d) && (!inWin || firmTargets[h.firm_id!].has(m.id));
    const p = h.firm_id === MEHRA ? 0.25 : 0.6;
    if (lawyerOk && h01(h.id + 'up') < p * (P(h.owner_id).wau ? 1 : 0.35)) up = h.owner_id;
  }
  up ??= legalActor(m, d);
  h.updater_id = up;
  act(up, d, 'outcome_recorded', 'hearing_updates', { m: m.id, h: h.id });
}

// first hearing date + early capture
for (const m of newMatters) {
  const hs = (hearingsByMatter.get(m.id) ?? []).sort((a, b) => a - b);
  if (earlyCaptured.has(m.id)) {
    m.first_hearing_on = fromDay(hs.length ? hs[0] : D(m.tracked_on) + ri(8, 75));
  } else {
    const filed = D(m.filed_on), tr = D(m.tracked_on);
    if (tr - filed < 2) m.filed_on = fromDay(tr - 3);
    m.first_hearing_on = fromDay(ri(D(m.filed_on) + 1, tr - 1));
  }
}
for (const m of matters) if (!m.first_hearing_on) {
  const hs = (hearingsByMatter.get(m.id) ?? []).sort((a, b) => a - b);
  m.first_hearing_on = fromDay(Math.min(hs[0] ?? D(m.tracked_on) + 30, D(m.tracked_on) + ri(10, 60)));
}

// ---------------------------------------------------------------- intake suggestions
const suggestions: Suggestion[] = [];
let sSeq = 0;
const addSug = (g: Suggestion['keyword_group'], shown: number, state: Suggestion['state'], tri: number | null, by: string | null, mid: string | null) =>
  suggestions.push({ id: `S${String(++sSeq).padStart(5, '0')}`, keyword_group: g, shown_on: fromDay(shown), state, triaged_on: tri === null ? null : fromDay(tri), triaged_by: by, matter_id: mid });
const groups: Suggestion['keyword_group'][] = ['company', 'brand', 'subsidiary', 'director'];
const addedN = [52, 24, 44, 42], mappedN = [12, 8, 10, 6], deletedN = [226, 148, 44, 22], expiredN = [222, 164, 90, 26];
{
  const sugMatters = shuffle(newMatters.filter((m) => m.source === 'suggestion'));
  assert(sugMatters.length === 162, 'suggestion matters');
  let i = 0;
  groups.forEach((g, gi) => {
    for (let k = 0; k < addedN[gi]; k++) {
      const m = sugMatters[i++];
      const tr = D(m.tracked_on);
      const by = legalActor(m, tr);
      addSug(g, tr - ri(0, 9), 'added', tr, by, m.id);
      act(by, tr, 'suggestion_added', 'new_cases', { m: m.id });
    }
    for (let k = 0; k < mappedN[gi]; k++) {
      const m = pick(active.filter((x) => !isDormant(x) && D(x.tracked_on) < W90));
      const d = pick(range(W90, DATA_END).filter(isWorkday));
      const by = legalActor(m, d);
      addSug(g, d - ri(0, 12), 'mapped', d, by, m.id);
      act(by, d, 'suggestion_mapped', 'new_cases', { m: m.id });
    }
    for (let k = 0; k < deletedN[gi]; k++) {
      const d = pick(range(W90, DATA_END).filter(isWorkday));
      const pool = legalAll.filter((u) => canAct(u.id, d));
      const by = pick(pool).id;
      addSug(g, d - ri(0, 20), 'deleted', d, by, null);
      act(by, d, 'suggestion_deleted', 'new_cases', {}, 's' + sSeq);
    }
    for (let k = 0; k < expiredN[gi]; k++) addSug(g, ri(W90 - 90, W90 - 1), 'expired', null, null, null);
  });
  for (const m of newMatters.filter((x) => x.source !== 'suggestion')) act(legalActor(m, D(m.tracked_on)), D(m.tracked_on), 'case_added', 'new_cases', { m: m.id, x: m.source });
}

// ---------------------------------------------------------------- field update events
for (const m of newMatters) for (const [f, iso] of Object.entries(m.fields_set)) {
  const d = D(iso!);
  act(legalActor(m, d), d, 'field_updated', 'my_cases', { m: m.id, x: f }, f);
}
for (const m of active.filter((x) => D(x.tracked_on) < W90)) if (m.firm_since) act(legalActor(m, AUG1), AUG1, 'field_updated', 'my_cases', { m: m.id, x: 'counsel' }, 'tr');

// ---------------------------------------------------------------- keepalive (case work that keeps live matters warm)
function keepalive() {
  for (const m of matters) {
    if (isDormant(m)) {
      const ld = dormantLast.get(m.id)!;
      if (ld >= DATA_START && !activity.some((a) => a.m === m.id && D(a.t.slice(0, 10)) === ld)) act(legalActor(m, ld), ld, 'case_viewed', 'my_cases', { m: m.id }, 'dl');
      continue;
    }
    const end = m.disposed_on ? D(m.disposed_on) : DATA_END;
    const evDays = activity.filter((a) => a.m === m.id).map((a) => D(a.t.slice(0, 10)));
    let last = Math.max(D(m.prior_activity_on), D(m.tracked_on));
    const marks = [...evDays].sort((a, b) => a - b);
    for (;;) {
      const nextReal = marks.find((x) => x > last);
      const gap = ri(30, 75);
      if (nextReal !== undefined && nextReal - last <= gap) { last = nextReal; continue; }
      let d = Math.max(last + gap, DATA_START + 1);
      if (d > end) break;
      while (!isWorkday(d) && d > DATA_START) d--;
      act(legalActor(m, d), d, 'case_viewed', 'my_cases', { m: m.id }, 'ka' + d);
      last = d;
    }
  }
}

// ---------------------------------------------------------------- alerts (business users)
const alerts: Alert[] = [];
{
  let aSeq = 0;
  const spec: [string, number, number][] = [[SD, 200, 82], [PR, 150, 27], [HR, 100, 52], [FI, 100, 37]];
  for (const [bu, sent, viewed] of spec) {
    const bizUsers = bizByBu[bu];
    const buMatters = active.filter((m) => m.bu === bu && !isDormant(m));
    const recipients: string[] = [];
    if (bu === PR) for (let i = 0; i < 25; i++) recipients.push(NEHA);
    for (let i = 0; recipients.length < sent; i++) {
      const u = bizUsers[i % bizUsers.length];
      if (u.id !== NEHA) recipients.push(u.id);
    }
    let viewsLeft = viewed - (bu === PR ? 3 : 0);
    let nehaViews = bu === PR ? 3 : 0;
    for (const uid of shuffle(recipients)) {
      const sentDay = ri(W30, DATA_END);
      let viewDay: number | null = null;
      const wants = uid === NEHA ? nehaViews > 0 : viewsLeft > 0;
      if (wants) {
        const p = P(uid);
        const hi = Math.min(p.last ?? -1, DATA_END);
        if (hi >= W30) {
          const sd = ri(W30, hi);
          viewDay = Math.min(sd + (h01(uid + sd) < 0.6 ? 0 : 1), hi);
          if (uid === NEHA) nehaViews--; else viewsLeft--;
          const m = pick(buMatters);
          alerts.push({ id: `A${++aSeq}`, user_id: uid, matter_id: m.id, sent_on: fromDay(sd), opened_on: fromDay(viewDay), case_viewed_on: fromDay(viewDay) });
          act(uid, viewDay, 'alert_case_viewed', 'my_cases', { m: m.id }, 'al' + aSeq);
          continue;
        }
      }
      const opened = canAct(uid, sentDay) && h01('o' + aSeq) < 0.35 ? fromDay(sentDay) : null;
      alerts.push({ id: `A${++aSeq}`, user_id: uid, matter_id: pick(buMatters).id, sent_on: fromDay(sentDay), opened_on: opened, case_viewed_on: null });
    }
    assert(viewsLeft === 0 && nehaViews === 0, 'alert views placed for ' + bu + ' left ' + viewsLeft);
  }
  // earlier alerts (context for 90/180-day periods)
  for (let d = DATA_START; d < W30; d++) {
    if (!isWorkday(d)) continue;
    for (const bu of [SD, PR, HR, FI]) {
      const nA = bu === SD ? 4 : bu === PR ? 3 : 2;
      const rate = bu === HR ? 0.5 : bu === SD ? 0.42 : bu === FI ? 0.38 : 0.2;
      for (let i = 0; i < nA; i++) {
        const u = pick(bizByBu[bu]);
        const m = pick(active.filter((x) => x.bu === bu && !isDormant(x) && D(x.tracked_on) <= d));
        const view = canAct(u.id, d) && h01(`${d}${bu}${i}`) < rate * (P(u.id).wau ? 1 : 0.2);
        alerts.push({ id: `A${++aSeq}`, user_id: u.id, matter_id: m.id, sent_on: fromDay(d), opened_on: view ? fromDay(d) : null, case_viewed_on: view ? fromDay(d) : null });
        if (view) act(u.id, d, 'alert_case_viewed', 'my_cases', { m: m.id }, 'ah' + aSeq);
      }
    }
  }
}

// ---------------------------------------------------------------- lawyer on-platform actions (30 days)
for (const f of FIRMS) {
  const lawyers30 = firmActive30(f.id);
  for (const mid of firmTargets[f.id]) {
    const has = activity.some((a) => a.m === mid && D(a.t.slice(0, 10)) >= W30 && byId.get(a.u)!.team_id === f.id);
    if (has) continue;
    const m = mById.get(mid)!;
    const lo = Math.max(W30, D(m.tracked_on));
    const okL = lawyers30.filter((u) => P(u.id).last! >= lo);
    assert(okL.length, 'lawyer for firm target ' + mid);
    const lw = okL.find((u) => u.id === m.lawyer_id) ?? pick(okL);
    const d = ri(lo, Math.min(P(lw.id).last!, DATA_END));
    act(lw.id, d, 'document_uploaded', 'documents', { m: mid }, 'fa');
  }
}
// Karan's last action is on 23 Oct
{
  const mid = [...firmTargets[MEHRA]].find((id) => mById.get(id)!.lawyer_id === KARAN) ?? [...firmTargets[MEHRA]][0];
  act(KARAN, D('2026-10-23'), 'document_uploaded', 'documents', { m: mid }, 'karan-last');
}

// ---------------------------------------------------------------- insights views, MIS downloads
{
  const legalViewers = [VIKRAM, POOJA, ...legalAll.filter((u) => u.id !== VIKRAM && u.id !== POOJA && u.id !== RITIKA && P(u.id).wau).slice(0, 6).map((u) => u.id)];
  const finBiz = bizByBu[FI].filter((u) => P(u.id).wau).map((u) => u.id);
  const adminIds = admins.map((u) => u.id);
  const insightTabs = ['Command Center', 'Hearings', 'Financials', 'Geography', 'Team & Counsel'];
  const viewDays = new Map<string, number[]>(); // user -> days
  let nWeeks = 0;
  for (let w = 0; w < 26; w++) {
    const ws = DATA_START + 7 * w;
    const recent = w >= 19;
    const nA = recent ? 3 : 2 + (w % 3 === 0 ? 1 : 0);
    const nL = recent ? 4 : 3 + (w % 2);
    const nB = recent ? 2 : w % 4 === 0 ? 1 : 2;
    const chosen = [
      ...(recent ? ['anjali-rao', ...shuffle(adminIds.filter((x) => x !== 'anjali-rao')).slice(0, nA - 1)] : shuffle(adminIds).slice(0, nA)),
      ...shuffle(legalViewers).slice(0, nL),
      ...shuffle(finBiz).slice(0, nB),
    ];
    for (const uid of chosen) {
      const p = P(uid);
      const days = range(ws, Math.min(ws + 6, DATA_END)).filter((d) => isWorkday(d) && canAct(uid, d));
      if (!days.length) continue;
      const d = uid === 'anjali-rao' ? days[0] : pick(days);
      viewDays.set(uid, [...(viewDays.get(uid) ?? []), d]);
      void p;
    }
    nWeeks++;
  }
  // tune extra repeat-view days to hit 9% stickiness on Insights
  const base = new Map([...viewDays].map(([u, ds]) => [u, [...ds]]));
  let chosenExtra = -1;
  for (let extra = 0; extra < 200; extra++) {
    const ud = new Map<number, Set<string>>();
    const add = (u: string, d: number) => { if (!ud.has(d)) ud.set(d, new Set()); ud.get(d)!.add(u); };
    for (const [u, ds] of base) ds.forEach((d) => add(u, d));
    reseed(777);
    let k = 0;
    for (const [u, ds] of shuffle([...base])) for (const d of ds) {
      if (k >= extra) break;
      const d2 = d + 1;
      if (d2 <= DATA_END && isWorkday(d2) && canAct(u, d2) && !ud.get(d2)?.has(u)) { add(u, d2); k++; }
    }
    const v = rollingStickiness(ud, W30, DATA_END);
    if (Math.round(v * 100) === 9) { chosenExtra = extra; break; }
  }
  assert(chosenExtra >= 0, 'insights stickiness tuning');
  reseed(777);
  {
    const ud = new Map<number, Set<string>>();
    for (const [u, ds] of base) ds.forEach((d) => { if (!ud.has(d)) ud.set(d, new Set()); ud.get(d)!.add(u); });
    let k = 0;
    for (const [u, ds] of shuffle([...base])) for (const d of ds) {
      if (k >= chosenExtra) break;
      const d2 = d + 1;
      if (d2 <= DATA_END && isWorkday(d2) && canAct(u, d2) && !ud.get(d2)?.has(u)) { viewDays.get(u)!.push(d2); if (!ud.has(d2)) ud.set(d2, new Set()); ud.get(d2)!.add(u); k++; }
    }
  }
  reseed(4242);
  // sessions: one per user-day, plus extra sessions in the window so that follow-through lands at 7%
  const sessions: { u: string; d: number }[] = [];
  for (const [u, ds] of viewDays) for (const d of [...new Set(ds)]) sessions.push({ u, d });
  const winSessions = sessions.filter((s) => s.d >= W30);
  let followed = 0;
  for (let k = 1; k < 20; k++) if (Math.round((k / winSessions.length) * 100) === 7) { followed = k; break; }
  if (!followed) {
    // add a second session on some days until 7% is reachable
    for (let extra = 1; extra < 20 && !followed; extra++) {
      const n = winSessions.length + extra;
      for (let k = 1; k < 20; k++) if (Math.round((k / n) * 100) === 7) { followed = k; for (let e = 0; e < extra; e++) winSessions.push({ ...winSessions[e] }); break; }
    }
  }
  assert(followed, 'follow-through');
  const followIdx = new Set(shuffle(winSessions.map((_, i) => i)).slice(0, followed));
  winSessions.forEach((s, i) => act(s.u, s.d, 'insight_viewed', 'insights', { x: pick(insightTabs), ...(followIdx.has(i) ? { fo: 1 as const } : {}) }, 'iv' + i));
  sessions.filter((s) => s.d < W30).forEach((s, i) => act(s.u, s.d, 'insight_viewed', 'insights', { x: pick(insightTabs), ...(h01('f' + i) < 0.07 ? { fo: 1 as const } : {}) }, 'ivh' + i));
  // MIS downloads by Admin and Legal viewers, on days they viewed Insights.
  const misPlan: [number, number, number, number][] = [ // month, ai count, plain count, last AI day
    [4, 18, 8, 31], [5, 30, 12, 30], [6, 36, 14, 31], [7, 40, 14, 26], [8, 44, 15, 21], [9, 48, 16, 18], [10, 10, 4, 7],
  ];
  const ivDays = sessions.filter((s) => byId.get(s.u)!.role !== 'Business');
  for (const [mo, nAi, nPlain, lastAiDay] of misPlan) {
    const inMonth = ivDays.filter((s) => new Date(s.d * 86400000).getUTCMonth() === mo);
    const aiDays = inMonth.filter((s) => new Date(s.d * 86400000).getUTCDate() <= lastAiDay);
    assert(aiDays.length > 0 && inMonth.length > 0, 'MIS days in month ' + mo);
    for (let i = 0; i < nAi; i++) { const s = aiDays[i % aiDays.length]; act(s.u, s.d, 'mis_downloaded', 'insights', { ai: 1 }, `mis${mo}-${i}`); }
    for (let i = 0; i < nPlain; i++) { const s = inMonth[(i * 7) % inMonth.length]; act(s.u, s.d, 'mis_downloaded', 'insights', {}, `misp${mo}-${i}`); }
  }
}

// ---------------------------------------------------------------- AI events
const aiEvents: AiEvent[] = [];
const COST: Record<AiFeature, number> = { ask_ai: 2, case_summary: 3, file_summary: 2, translation: 4, ai_diligence: 10, codex: 2, mis_report: 10 };
{
  const base33 = [...legalAll, ...lawyersAll].filter((u) => P(u.id).wau).map((u) => u.id);
  assert(base33.length === 33, 'AI base 33');
  const lw = base33.filter((id) => byId.get(id)!.role === 'Lawyer');
  const lg = base33.filter((id) => byId.get(id)!.role === 'Legal');
  const sets: Record<string, string[]> = {
    ask_ai: [...lg.slice(0, 16), ...lw.slice(0, 6)],
    case_summary: [...lg.slice(2, 15), ...lw.slice(1, 6)],
    codex: [...lg.slice(0, 9), ...lw.slice(0, 3)],
    file_summary: [...lg.slice(4, 11), ...lw.slice(3, 6)],
    translation: [lg[5], lg[8], lw[7], lw[9]],
    ai_diligence: [VIKRAM, lg.find((x) => x !== VIKRAM && byId.get(x)!.team_id === FI)!, lg.find((x) => byId.get(x)!.team_id === SD && x !== RITIKA)!],
  };
  if (!sets.ask_ai.includes(RITIKA)) sets.ask_ai[0] = RITIKA;
  for (const [k, v] of Object.entries(sets)) assert(new Set(v).size === v.length && v.every((x) => base33.includes(x)), 'ai set ' + k);
  assert(sets.ask_ai.length === 22 && sets.case_summary.length === 18 && sets.codex.length === 12 && sets.file_summary.length === 10 && sets.translation.length === 4 && sets.ai_diligence.length === 3, 'ai set sizes');
  // historical pools add people who were active earlier
  const histExtra = [...legalAll, ...lawyersAll].filter((u) => !P(u.id).wau && P(u.id).last !== null).map((u) => u.id);

  type Plan = { f: AiFeature; n: number; from: number; to: number }[];
  const monthPlans: { start: number; end: number; limit: number | null; ask: number; plan: [AiFeature, number][]; batch?: number }[] = [
    { start: D('2026-05-18'), end: D('2026-05-31'), limit: null, ask: 28, plan: [['ai_diligence', 50], ['case_summary', 90], ['translation', 20], ['codex', 30], ['file_summary', 40]] },
    { start: D('2026-06-01'), end: D('2026-06-30'), limit: null, ask: 30, plan: [['ai_diligence', 120], ['case_summary', 200], ['translation', 40], ['codex', 80], ['file_summary', 100]] },
    { start: D('2026-07-01'), end: D('2026-07-31'), limit: null, ask: 34, plan: [['ai_diligence', 170], ['case_summary', 220], ['translation', 45], ['codex', 66], ['file_summary', 20]] },
    { start: D('2026-08-01'), end: D('2026-08-31'), limit: 27, ask: 36, plan: [['ai_diligence', 200], ['case_summary', 250], ['translation', 60], ['codex', 90], ['file_summary', 79]], batch: 40 },
    { start: D('2026-09-01'), end: D('2026-09-30'), limit: 22, ask: 38, plan: [['ai_diligence', 230], ['case_summary', 240], ['translation', 60], ['codex', 80], ['file_summary', 22]], batch: 50 },
    { start: D('2026-10-01'), end: D('2026-10-31'), limit: 19, ask: 40, plan: [['ai_diligence', 216], ['case_summary', 240], ['translation', 60], ['codex', 90], ['file_summary', 90]], batch: 60 },
    { start: D('2026-11-01'), end: DATA_END, limit: null, ask: 35, plan: [['ai_diligence', 121], ['case_summary', 70], ['translation', 20], ['codex', 60], ['file_summary', 50]] },
  ];
  void (0 as unknown as Plan);
  const matterPool = (uid: string, d: number) => {
    const u = byId.get(uid)!;
    let pool = active.filter((m) => !isDormant(m) && D(m.tracked_on) <= d);
    if (u.role === 'Lawyer') pool = pool.filter((m) => m.firm_id === u.team_id && (d < W30 || firmTargets[u.team_id].has(m.id)));
    else pool = pool.filter((m) => m.case_manager_id === uid || m.bu === u.team_id);
    return pool.length ? pool : null;
  };
  const push = (uid: string, d: number, f: AiFeature, blocked: boolean, salt: string, withMatter: boolean) => {
    assert(canAct(uid, d), `ai actor ${uid} ${fromDay(d)}`);
    let m: string | undefined;
    if (withMatter) {
      const pool = matterPool(uid, d);
      if (pool) { m = pick(pool).id; lastByMatter.set(m, Math.max(lastByMatter.get(m) ?? 0, d)); }
    }
    aiEvents.push({ t: ts(uid, d, 'ai' + f + salt), u: uid, f, c: blocked ? 0 : COST[f], a: 0, fb: 0, b: blocked ? 1 : 0, ...(m ? { m } : {}), model: d < SEP14 ? 'lx-2.1' : 'lx-3.0' });
  };
  const usersFor = (f: string, d: number) => {
    const inWin = d >= W30;
    const pool = inWin ? sets[f] : [...sets[f], ...histExtra.slice(0, f === 'ask_ai' ? 6 : 3)];
    return pool.filter((u) => canAct(u, d));
  };

  // --- Ask AI and Codex: per-day user counts are tuned so rolling DAU/MAU lands on 29% and 4%.
  const askQueries = new Map<number, number>(); // day -> successful queries
  const askBlocked = new Map<number, number>();
  for (const mp of monthPlans) {
    const lastOk = mp.limit ? mp.start + mp.limit - 2 : mp.end; // last day with successful Ask AI
    for (let d = mp.start; d <= mp.end; d++) {
      if (d <= lastOk) askQueries.set(d, mp.ask);
      else askBlocked.set(d, 3);
    }
  }
  function askUserDays(a: number, c: number, seed: number): Map<number, string[]> {
    reseed(seed);
    const out = new Map<number, string[]>();
    let rr = 0;
    for (let d = DATA_START; d <= DATA_END; d++) {
      const q = askQueries.get(d) ?? 0, b = askBlocked.get(d) ?? 0;
      const pool = usersFor('ask_ai', d);
      let k: number;
      if (q) k = d >= W30 ? (d >= NOV1 ? c : a) : 6 + Math.floor(h01('ak' + d) * 4);
      else k = Math.min(b, 2 + Math.floor(h01('ab' + d) * 2));
      k = Math.min(k, pool.length, q || b);
      const chosen: string[] = [];
      // round-robin through the pool so all 22 appear in the window
      for (let i = 0; i < k; i++) chosen.push(pool[(rr + i * 3) % pool.length]);
      rr += k;
      out.set(d, [...new Set(chosen)]);
    }
    return out;
  }
  const toUD = (m: Map<number, string[]>) => new Map([...m].map(([d, us]) => [d, new Set(us)]));
  let askBest: Map<number, string[]> | null = null;
  outer: for (let a = 5; a <= 16; a++) for (let c = 5; c <= 16; c++) {
    const ud = askUserDays(a, c, 99);
    const v = rollingStickiness(toUD(ud), W30, DATA_END);
    const win = new Set([...ud].filter(([d]) => d >= W30 && (askQueries.get(d) ?? 0) > 0).flatMap(([, us]) => us));
    if (Math.round(v * 100) === 29 && win.size === 22) { askBest = ud; break outer; }
  }
  assert(askBest, 'ask ai stickiness tuning');
  reseed(5150);
  for (const [d, us] of askBest) {
    const q = askQueries.get(d) ?? 0, b = askBlocked.get(d) ?? 0;
    const n = q || b;
    for (let i = 0; i < n; i++) push(us[i % us.length], d, 'ask_ai', !q, `${d}-${i}`, h01('am' + d + i) < 0.5);
  }

  // Codex: prompts spread over the days before the limit; per-day users tuned to 4%.
  const codexCount = new Map<number, number>();
  for (const mp of monthPlans) {
    const n = mp.plan.find(([f]) => f === 'codex')![1];
    const lastOk = mp.limit ? mp.start + mp.limit - 2 : mp.end;
    const days = range(mp.start, lastOk).filter(isWorkday);
    for (let i = 0; i < n; i++) codexCount.set(days[i % days.length], (codexCount.get(days[i % days.length]) ?? 0) + 1);
  }
  let codexBest: Map<number, string[]> | null = null;
  for (let twos = 0; twos <= 30 && !codexBest; twos++) {
    reseed(31);
    const ud = new Map<number, string[]>();
    let rr = 0, t2 = 0;
    for (const [d, n] of [...codexCount].sort((a, b) => a[0] - b[0])) {
      const pool = usersFor('codex', d);
      let k = d >= W30 ? 1 : 1 + (h01('cx' + d) < 0.5 ? 1 : 0);
      if (d >= W30 && t2 < twos) { k = 2; t2++; }
      k = Math.min(k, n, pool.length);
      const us = Array.from({ length: k }, (_, i) => pool[(rr + i) % pool.length]); rr += k;
      ud.set(d, [...new Set(us)]);
    }
    const v = rollingStickiness(toUD(ud), W30, DATA_END);
    const win = new Set([...ud].filter(([d]) => d >= W30).flatMap(([, us]) => us));
    if (Math.round(v * 100) === 4 && win.size === 12) codexBest = ud;
  }
  assert(codexBest, 'codex stickiness tuning');
  for (const [d, us] of codexBest) {
    const n = codexCount.get(d)!;
    for (let i = 0; i < n; i++) push(us[i % us.length], d, 'codex', false, `${d}-${i}`, false);
  }

  // Other AI features
  for (const mp of monthPlans) {
    const lastOk = mp.limit ? mp.start + mp.limit - 2 : mp.end;
    const days = range(mp.start, lastOk);
    for (const [f, n] of mp.plan) {
      if (f === 'codex') continue;
      if (f === 'ai_diligence' && mp.start === D('2026-10-01')) continue; // handled below
      for (let i = 0; i < n; i++) {
        const d = days[Math.floor((i * days.length) / n)];
        const pool = usersFor(f, d);
        const rr = pool[(i * 7 + d) % pool.length];
        const uid = f === 'ai_diligence' ? (h01('dil' + d + i) < 0.62 && canAct(VIKRAM, d) ? VIKRAM : rr) : rr;
        push(uid, d, f, false, `${d}-${i}`, f !== 'translation');
      }
    }
    if (mp.batch) {
      const d = mp.start + mp.limit! - 1;
      const pool = usersFor('ai_diligence', d);
      for (let i = 0; i < mp.batch; i++) push(mp.start === D('2026-10-01') ? VIKRAM : pick(pool), d, 'ai_diligence', false, `b${d}-${i}`, true);
    }
  }
  // October AI Diligence: 216 cases on days 1 to 18 plus the 60-case run on day 19; Vikram runs 171 of 276 (62%).
  {
    const oct = D('2026-10-01');
    const others2 = sets.ai_diligence.filter((x) => x !== VIKRAM);
    const vikDays = range(oct, oct + 17);
    for (let i = 0; i < 216; i++) {
      const d = vikDays[Math.floor((i * 18) / 216)];
      const uid = i < 111 ? VIKRAM : others2[i % 2];
      push(uid, d, 'ai_diligence', false, `o${i}`, true);
    }
  }
  // MIS AI reports mirror MIS downloads with an AI analysis
  for (const a of activity.filter((x) => x.k === 'mis_downloaded' && x.ai)) {
    aiEvents.push({ t: a.t, u: a.u, f: 'mis_report', c: COST.mis_report, a: 1, fb: 0, b: 0, model: D(a.t.slice(0, 10)) < SEP14 ? 'lx-2.1' : 'lx-3.0' });
  }
  aiEvents.sort((a, b) => a.t.localeCompare(b.t));

  // action rate and feedback. Window rates are exact; earlier weeks follow the same story.
  const actionRate: Record<AiFeature, number> = { ask_ai: 0.61, case_summary: 0.72, codex: 0.24, file_summary: 0.58, translation: 0.81, ai_diligence: 0.17, mis_report: 1 };
  const resp = aiEvents.filter((e) => !e.b && e.f !== 'mis_report');
  for (const f of Object.keys(actionRate) as AiFeature[]) {
    if (f === 'mis_report') continue;
    const win = shuffle(resp.filter((e) => e.f === f && D(e.t.slice(0, 10)) >= W30));
    const k = Math.round(win.length * actionRate[f]);
    win.forEach((e, i) => (e.a = i < k ? 1 : 0));
    resp.filter((e) => e.f === f && D(e.t.slice(0, 10)) < W30).forEach((e, i) => (e.a = h01(f + i) < actionRate[f] ? 1 : 0));
  }
  // low-discrepancy assignment keeps every week of the window at the same rate
  const winResp = resp.filter((e) => D(e.t.slice(0, 10)) >= W30);
  winResp.forEach((e, i) => { const u = (i * 0.6180339887 + 0.37) % 1; e.fb = u < 0.14 ? 1 : u < 0.2 ? 2 : 0; });
  const histByWeek = new Map<number, AiEvent[]>();
  for (const e of resp.filter((x) => D(x.t.slice(0, 10)) < W30)) {
    const w = Math.floor((D(e.t.slice(0, 10)) - DATA_START) / 7);
    histByWeek.set(w, [...(histByWeek.get(w) ?? []), e]);
  }
  for (const [w, es] of histByWeek) {
    const ws = DATA_START + 7 * w;
    const td = ws < SEP14 ? 0.04 : ws < SEP14 + 14 ? 0.07 : 0.06;
    const reg = 0.135 + h01('rg' + w) * 0.01;
    const s = shuffle(es);
    const a = Math.round(s.length * reg), b = Math.round(s.length * td);
    s.forEach((e, i) => (e.fb = i < a ? 1 : i < a + b ? 2 : 0));
  }
}

// ---------------------------------------------------------------- spend
const spend: Spend[] = [];
{
  const spendSpec: Record<string, number> = { [SD]: 31, [PR]: 25, [HR]: 8, [FI]: 10 };
  const targetMatters: Matter[] = [];
  for (const bu of [SD, PR, HR, FI]) targetMatters.push(...shuffle(active.filter((m) => m.bu === bu && !isDormant(m) && D(m.tracked_on) < W90 - 5)).slice(0, spendSpec[bu]));
  const targetSet = new Set(targetMatters.map((m) => m.id));
  const loggers = ['sameer-kulkarni', 'farhan-qureshi', ...legalAll.filter((u) => P(u.id).wau).map((u) => u.id)];
  // Spend is logged in month-end invoice batches. We tune how many batch days fall inside the last 30 days.
  function build(winDays: number, seed: number) {
    reseed(seed);
    const sessions: { u: string; d: number }[] = [];
    // month-end batches through the window, several people each
    for (const me of [D('2026-05-29'), D('2026-06-29'), D('2026-07-30'), D('2026-08-28'), D('2026-09-29'), D('2026-10-06')]) {
      const crew = shuffle(loggers).slice(0, 7);
      crew.forEach((u, i) => { const d = me - (i % 3); if (canAct(u, d) && d < W30) sessions.push({ u, d }); });
    }
    const winCands = range(W30, DATA_END).filter(isWorkday);
    for (let i = 0; i < winDays; i++) {
      const d = winCands[(i * 5) % winCands.length];
      const u = loggers.filter((x) => canAct(x, d))[i % 3];
      sessions.push({ u, d });
    }
    return sessions;
  }
  let chosen: { u: string; d: number }[] | null = null;
  for (let k = 1; k <= 25 && !chosen; k++) {
    const s = build(k, 8080);
    const ud = new Map<number, Set<string>>();
    s.forEach(({ u, d }) => { if (!ud.has(d)) ud.set(d, new Set()); ud.get(d)!.add(u); });
    if (Math.round(rollingStickiness(ud, W30, DATA_END) * 100) === 2) chosen = s;
  }
  assert(chosen, 'spend stickiness');
  reseed(9090);
  const s90 = chosen.filter((s) => s.d >= W90);
  const sOld = chosen.filter((s) => s.d < W90);
  assert(s90.length > 0, 'spend sessions in 90d');
  // cover the 74 target matters inside 90 days, then add more entries; older sessions log against any matters
  const tm = shuffle(targetMatters);
  tm.forEach((m, i) => { const s = s90[i % s90.length]; spend.push({ matter_id: m.id, logged_on: fromDay(s.d), amount: ri(18, 420) * 1000, logged_by: s.u }); });
  for (const s of s90) for (let j = 0; j < 2; j++) { const m = pick(tm); spend.push({ matter_id: m.id, logged_on: fromDay(s.d), amount: ri(18, 300) * 1000, logged_by: s.u }); }
  for (const s of sOld) for (let j = 0; j < 4; j++) {
    const m = pick(matters.filter((x) => !isDormant(x) && activeOn(x, s.d) && D(x.tracked_on) < s.d));
    spend.push({ matter_id: m.id, logged_on: fromDay(s.d), amount: ri(18, 300) * 1000, logged_by: s.u });
  }
  for (const s of spend) {
    const m = mById.get(s.matter_id)!;
    if (D(s.logged_on) >= W90) assert(targetSet.has(m.id), 'spend in 90d only on target');
    act(s.logged_by, D(s.logged_on), 'spend_logged', 'spend', { m: m.id, x: String(s.amount) }, 'sp' + spend.indexOf(s));
  }
}

// ---------------------------------------------------------------- last-active anchors
for (const u of users) {
  const p = P(u.id);
  if (p.last === null) continue;
  const has = activity.some((a) => a.u === u.id && a.t.startsWith(fromDay(p.last!))) || aiEvents.some((e) => e.u === u.id && e.t.startsWith(fromDay(p.last!)));
  if (has) continue;
  if (u.role === 'Lawyer') {
    const tg = [...firmTargets[u.team_id]].map((id) => mById.get(id)!).find((m) => D(m.tracked_on) <= p.last!);
    if (p.last >= W30 && tg) act(u.id, p.last, 'document_uploaded', 'documents', { m: tg.id }, 'anchor');
    else if (p.last < W30) { const m = active.find((x) => x.firm_id === u.team_id && !isDormant(x) && D(x.tracked_on) <= p.last!)!; act(u.id, p.last, 'case_viewed', 'my_cases', { m: m.id }, 'anchor'); }
    else act(u.id, p.last, 'calendar_opened', 'calendar_queue', {}, 'anchor');
  } else if (u.role === 'Admin') act(u.id, p.last, u.id === 'deepa-menon' ? 'keyword_group_updated' : 'research_opened', u.id === 'deepa-menon' ? 'settings' : 'research', {}, 'anchor');
  else {
    const pool = active.filter((m) => !isDormant(m) && (m.case_manager_id === u.id || m.bu === u.team_id) && D(m.tracked_on) <= p.last!);
    act(u.id, p.last, 'case_viewed', 'my_cases', { m: pick(pool).id }, 'anchor');
  }
}

// ---------------------------------------------------------------- filler: everyday use, tuned to the stickiness targets
keepalive();
{
  type FSpec = { f: Feature; k: ActivityKind; target: number; roles: Role[]; matter: boolean };
  const specs: FSpec[] = [
    { f: 'my_cases', k: 'case_viewed', target: 52, roles: ['Admin', 'Legal', 'Business', 'Lawyer'], matter: true },
    { f: 'hearing_updates', k: 'hearing_updated', target: 38, roles: ['Legal', 'Lawyer'], matter: true },
    { f: 'calendar_queue', k: 'calendar_opened', target: 33, roles: ['Legal', 'Lawyer', 'Admin'], matter: false },
    { f: 'documents', k: 'document_uploaded', target: 21, roles: ['Legal', 'Lawyer'], matter: true },
    { f: 'research', k: 'research_opened', target: 7, roles: ['Legal', 'Lawyer', 'Admin'], matter: false },
    { f: 'tasks', k: 'task_created', target: 6, roles: ['Legal', 'Admin'], matter: true },
  ];
  const propensity = (u: User, f: Feature) => {
    const base: Record<Role, number> = { Legal: 1, Lawyer: 0.55, Admin: 0.5, Business: 0.25 };
    let p = base[u.role] * (0.5 + h01(u.id + f));
    if (u.id === RITIKA) p *= 1.4;
    if (u.team_id === MEHRA) p *= 0.4;
    if (!P(u.id).wau) p *= 0.03; // lapsed users show up rarely, not daily
    return p;
  };
  const domainUD = (f: Feature) => {
    const ud = new Map<number, Set<string>>();
    const add = (u: string, d: number) => { if (!ud.has(d)) ud.set(d, new Set()); ud.get(d)!.add(u); };
    for (const a of activity) if (a.f === f) add(a.u, D(a.t.slice(0, 10)));
    return ud;
  };
  for (const s of specs) {
    const dom = domainUD(s.f);
    const elig = users.filter((u) => s.roles.includes(u.role));
    const sel = (lam: number) => {
      const ud = new Map([...dom].map(([d, us]) => [d, new Set(us)]));
      const extra: [string, number][] = [];
      for (const u of elig) {
        const pu = propensity(u, s.f);
        for (let d = DATA_START; d <= DATA_END; d++) {
          if (!canAct(u.id, d)) continue;
          const wk = dow(d) === 6 ? 0.25 : 1;
          if (h01(s.f + u.id + d) < Math.min(1, pu * lam * wk) && !ud.get(d)?.has(u.id)) {
            if (!ud.has(d)) ud.set(d, new Set()); ud.get(d)!.add(u.id); extra.push([u.id, d]);
          }
        }
      }
      return { v: rollingStickiness(ud, W30, DATA_END), extra };
    };
    let lo = 0, hi = 4, best: [string, number][] | null = null;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      const { v, extra } = sel(mid);
      if (Math.round(v * 100) === s.target) { best = extra; break; }
      if (v * 100 < s.target) lo = mid; else hi = mid;
    }
    assert(best, 'filler tuning ' + s.f);
    for (const [uid, d] of best) {
      const u = byId.get(uid)!;
      let m: string | undefined;
      if (s.matter) {
        let pool: Matter[];
        if (u.role === 'Lawyer') pool = active.filter((x) => x.firm_id === u.team_id && !isDormant(x) && D(x.tracked_on) <= d && (d < W30 || firmTargets[u.team_id].has(x.id)));
        else if (u.role === 'Legal') pool = active.filter((x) => (x.case_manager_id === uid || (x.bu === u.team_id && h01(x.id + uid) < 0.15)) && !isDormant(x) && D(x.tracked_on) <= d);
        else if (u.role === 'Business') pool = active.filter((x) => x.bu === u.team_id && !isDormant(x) && D(x.tracked_on) <= d);
        else pool = active.filter((x) => !isDormant(x) && D(x.tracked_on) <= d);
        if (!pool.length) pool = active.filter((x) => !isDormant(x) && D(x.tracked_on) <= d && u.role !== 'Lawyer');
        if (pool.length) m = pick(pool).id;
      }
      act(uid, d, s.k, s.f, m ? { m } : {}, 'fill' + s.f);
    }
  }
}

// ---------------------------------------------------------------- last activity per matter
for (const m of matters) {
  let last = D(m.prior_activity_on);
  last = Math.max(last, D(m.tracked_on) <= DATA_END ? Math.min(D(m.tracked_on), DATA_END) : last, lastByMatter.get(m.id) ?? 0);
  m.last_activity_on = fromDay(last);
}
activity.sort((a, b) => a.t.localeCompare(b.t));

// ---------------------------------------------------------------- tech
const tech = (() => {
  reseed(6060);
  const page_loads: PageLoadDay[] = [];
  const pageTargets: [string, number, number][] = [['Insights', 6800, 6300], ['Codex', 4100, 3900], ['My Cases', 2400, 2450], ['Case page', 1900, 1950]];
  for (const [page, t, prevT] of pageTargets) {
    for (const [from, target] of [[DATA_END - 6, t], [DATA_END - 13, prevT]] as [number, number][]) {
      const n = 7 * 30, idx = Math.ceil(0.95 * n) - 1;
      const vals: number[] = [];
      for (let i = 0; i < n; i++) vals.push(i < idx ? Math.round(rf(0.28, 0.97) * target) : i === idx ? target : Math.round(rf(1.01, 1.7) * target));
      const s = shuffle(vals);
      for (let k = 0; k < 7; k++) page_loads.push({ page, date: fromDay(from + k), ms: s.slice(k * 30, k * 30 + 30) });
    }
  }
  const errors: ErrorDay[] = [];
  for (let d = DATA_START; d <= DATA_END; d++) {
    const wd = dow(d);
    const sessions = wd === 6 ? ri(28, 40) : ri(118, 162);
    const mm = wd === 0 ? ri(38, 46) : 0;
    errors.push({ date: fromDay(d), sessions, errors_429: 0, mm_sessions: mm, mm_errors: 0 });
  }
  const fill = (rows: ErrorDay[], avg: number, mmRate: number) => {
    const fit = (key: 'sessions' | 'mm_sessions', rate: number) => {
      for (let t = 0; t < 50; t++) {
        const tot = rows.reduce((s, r) => s + r[key], 0);
        const e = Math.round((tot * rate) / 100);
        if (r1((e / tot) * 100) === rate) return e;
        const row = rows.find((r) => r[key] > 0)!; row[key]++; if (key === 'mm_sessions') row.sessions++;
      }
      throw new Error('cannot fit rate');
    };
    const Emm = fit('mm_sessions', mmRate);
    const E = fit('sessions', avg);
    const S = rows.reduce((s, r) => s + r.sessions, 0);
    const Smm = rows.reduce((s, r) => s + r.mm_sessions, 0);
    assert(r1((E / S) * 100) === avg && r1((Emm / Smm) * 100) === mmRate, 'error rates exact');
    const mmRows = rows.filter((r) => r.mm_sessions);
    mmRows.forEach((r, i) => { r.mm_errors = Math.floor(Emm / mmRows.length) + (i < Emm % mmRows.length ? 1 : 0); r.errors_429 = r.mm_errors; });
    const rest = E - Emm;
    const weights = rows.map((r) => r.sessions * (0.6 + h01(r.date) * 0.8));
    const W = weights.reduce((a, b) => a + b, 0);
    rows.forEach((r, i) => { const x = Math.floor((rest * weights[i]) / W); r.errors_429 += x; });
    let left = E - rows.reduce((s, r) => s + r.errors_429, 0);
    for (let i = 0; left > 0; i = (i + 1) % rows.length) { rows[i].errors_429++; left--; }
  };
  fill(errors.filter((r) => D(r.date) >= W30), 4.1, 9.7);
  fill(errors.filter((r) => D(r.date) < W30), 3.6, 8.2);

  const sync: SyncDay[] = [];
  const courtCases: Record<CourtType, number> = { 'Supreme Court': 12, 'High Court': 118, Tribunal: 46, 'District court': 164, 'Consumer forum': 72 };
  const fresh7: Record<CourtType, number> = { 'Supreme Court': 83, 'High Court': 793, Tribunal: 267, 'District court': 815, 'Consumer forum': 323 };
  const freshEarly: Record<CourtType, number> = { 'Supreme Court': 0.99, 'High Court': 0.96, Tribunal: 0.86, 'District court': 0.8, 'Consumer forum': 0.7 };
  let runsTot = 0;
  const recent: SyncDay[] = [];
  for (const ct of Object.keys(courtCases) as CourtType[]) {
    for (let d = DATA_START; d <= DATA_END; d++) {
      const n = courtCases[ct];
      const row: SyncDay = { court_type: ct, date: fromDay(d), cases_active: n, cases_synced_24h: 0, runs: Math.round(n * 1.15) + ri(0, 3), runs_failed: 0 };
      if (d > DATA_END - 7) recent.push(row);
      else {
        const prog = (d - DATA_START) / (DATA_END - DATA_START);
        const target = freshEarly[ct] - prog * (freshEarly[ct] - fresh7[ct] / (n * 7)) * 0.9;
        row.cases_synced_24h = Math.min(n, Math.round(n * (target + rf(-0.015, 0.015))));
        row.runs_failed = Math.round(row.runs * rf(0.04, 0.07));
      }
      sync.push(row);
    }
  }
  for (const ct of Object.keys(courtCases) as CourtType[]) {
    const rows = recent.filter((r) => r.court_type === ct);
    let left = fresh7[ct];
    rows.forEach((r, i) => { const x = Math.min(r.cases_active, Math.round(left / (rows.length - i))); r.cases_synced_24h = x; left -= x; });
    assert(left === 0, 'sync fill ' + ct);
  }
  runsTot = recent.reduce((s, r) => s + r.runs, 0);
  const failed = Math.round(runsTot * 0.062);
  assert(r1((failed / runsTot) * 100) === 6.2, 'sync failure exact');
  let fl = failed;
  recent.forEach((r, i) => { const x = Math.round(fl / (recent.length - i)); r.runs_failed = x; fl -= x; });

  const searches: SearchDay[] = [];
  const codexByDay = new Map<string, number>();
  aiEvents.filter((e) => e.f === 'codex').forEach((e) => codexByDay.set(e.t.slice(0, 10), (codexByDay.get(e.t.slice(0, 10)) ?? 0) + 1));
  for (let d = DATA_START; d <= DATA_END; d++) {
    searches.push({ surface: 'court', date: fromDay(d), searches: dow(d) === 6 ? ri(6, 12) : ri(34, 52), zero_results: 0 });
    searches.push({ surface: 'codex', date: fromDay(d), searches: codexByDay.get(fromDay(d)) ?? 0, zero_results: 0 });
  }
  for (const [surf, rate, prev] of [['court', 21, 19], ['codex', 9, 11]] as const) {
    for (const [win, r] of [[true, rate], [false, prev]] as const) {
      const rows = searches.filter((s) => s.surface === surf && (D(s.date) >= W30) === win);
      const S = rows.reduce((a, b) => a + b.searches, 0);
      let Z = Math.round((S * r) / 100);
      assert(Math.round((Z / S) * 100) === r, 'zero result rate');
      const withS = rows.filter((x) => x.searches > 0);
      for (let i = 0; Z > 0; i = (i + 7) % withS.length) { if (withS[i].zero_results < withS[i].searches) { withS[i].zero_results++; Z--; } }
    }
  }
  const zc = searches.filter((s) => s.surface === 'court' && D(s.date) >= W30).reduce((a, b) => a + b.zero_results, 0);
  const zx = searches.filter((s) => s.surface === 'codex' && D(s.date) >= W30).reduce((a, b) => a + b.zero_results, 0);
  const missed_queries: MissedQuery[] = [];
  const spread = (surface: 'court' | 'codex', total: number, list: [string, number][]) => {
    let left = total;
    list.forEach(([q, w], i) => { const c = i === list.length - 1 ? left : Math.round(total * w); missed_queries.push({ surface, query: q, count: c }); left -= c; });
  };
  spread('court', zc, [['Pune labour court order', 0.12], ['Maharashtra RERA complaint', 0.09], ['Bombay HC commercial division cause list', 0.07], ['Thane consumer forum case status', 0.06], ['Other queries', 1]]);
  spread('codex', zx, [['matters linked to dealer agreement', 0.3], ['total exposure by counsel firm', 0.2], ['hearings next week without counsel', 0.15], ['Other queries', 1]]);
  return { page_loads, errors, sync, searches, missed_queries };
})();

// ---------------------------------------------------------------- evals
const evals: Eval[] = [];
{
  reseed(1212);
  const lastComplete = D('2026-10-26');
  const last4 = [225, 228, 226, 227];
  for (let w = 0; ; w++) {
    const ws = DATA_START + 7 * w;
    if (ws > lastComplete) break;
    const idx4 = 3 - Math.round((lastComplete - ws) / 7);
    let correct: number;
    if (idx4 >= 0) correct = last4[idx4];
    else if (ws >= SEP14 && ws < SEP14 + 14) correct = 223;
    else correct = ri(224, 230);
    evals.push({ week_start: fromDay(ws), sample_size: 50, facts_checked: 250, facts_correct: correct });
  }
}

// ---------------------------------------------------------------- write
const account: Account = {
  name: 'Meridia Consumer Industries Ltd', short: 'Meridia Consumer Industries', industry: 'Consumer goods', hq: 'Mumbai', employees: 2000, seats: 150,
  monthly_ai_limit: 6000, as_of: '2026-11-08T06:00+05:30', model_changes: [{ date: '2026-09-14', label: 'Model update' }], credit_costs: COST,
};
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
mkdirSync(out, { recursive: true });
const write = (name: string, data: unknown) => writeFileSync(join(out, name + '.json'), JSON.stringify(data));
write('account', account);
write('teams', teams);
write('users', users);
write('matters', matters);
write('hearings', hearings);
write('suggestions', suggestions);
write('activity', activity);
write('ai_events', aiEvents);
write('alerts', alerts);
write('spend', spend);
write('tech', tech);
write('evals', evals);
console.log(`generated: ${users.length} users, ${matters.length} matters, ${hearings.length} hearings, ${suggestions.length} suggestions, ${activity.length} activity, ${aiEvents.length} ai events, ${alerts.length} alerts, ${spend.length} spend rows`);
