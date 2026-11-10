// The metric dictionary (docs/metrics.json) is the single source for captions,
// flip panels and the Dictionary page.
import raw from '../../docs/metrics.json';

export type Tier = 'north-star' | 'decision' | 'guardrail' | 'diagnostic';
export type LensKey = 'business' | 'technical' | 'ai';
export interface MetricDef {
  id: string;
  section: string;
  name: string;
  tier: Tier;
  lens: LensKey;
  views: string;
  question: string;
  why: string;
  decision: string;
  chart: string;
  chart_why: string;
  definition: string;
  formula: string;
  events: string;
  refresh: string;
  alert: string;
  sample: string;
}
export interface SectionDef { id: string; title: string; purpose: string }
export interface UserOnlyDef { id: string; name: string; question: string; chart: string; chart_why: string }

export const SECTIONS = raw.sections as SectionDef[];
export const METRICS = raw.metrics as MetricDef[];
export const USER_ONLY = raw.user_only as UserOnlyDef[];
export const BREAKDOWNS = raw.breakdowns as { id: string; question: string; why: string }[];
export const metric = (id: string): MetricDef => METRICS.find((m) => m.id === id)!;

export type Stage = 'pulse' | 'adoption' | 'intake' | 'enrich' | 'hearing' | 'ai' | 'value' | 'health';
/** Colour of each lifecycle stage (pulse borrows the north star's hearing colour). */
export const STAGE_COLOR: Record<Stage, string> = {
  pulse: 'hearing', adoption: 'adoption', intake: 'intake', enrich: 'enrich', hearing: 'hearing', ai: 'ai', value: 'value', health: 'health',
};
/** Pulse metrics take the colour of the stage they measure. */
export const METRIC_STAGE: Record<string, Stage> = {
  M01: 'hearing', M02: 'adoption', M03: 'ai', M04: 'health', M05: 'enrich',
};
export const stageOf = (id: string): Stage => METRIC_STAGE[id] ?? (metric(id)?.section as Stage) ?? 'pulse';

export const TIER_LABEL: Record<Tier, string> = { 'north-star': 'North star', decision: 'Decision', guardrail: 'Guardrail', diagnostic: 'Diagnostic' };
export const LENS_LABEL: Record<LensKey, string> = { business: 'Business', technical: 'Tech', ai: 'AI' };
export const lensMatches = (lens: 'all' | 'business' | 'tech', l: LensKey) => lens === 'all' || (lens === 'business' ? l === 'business' : l !== 'business');

/**
 * Where the sample data needs a precise reading of a definition, we say so on the card.
 * Each note keeps the dictionary's intent and makes the computation reproducible.
 */
export const DEFINITION_NOTES: Record<string, string> = {
  M01: 'Lag is counted from the start of the hearing day. "Within 2 days" means recorded by the end of the second calendar day after the hearing, so a 2.6-day lag still counts as closed out.',
  M08: 'Window: suggestions resolved in the last 90 days (triaged in the window, or expired in it after 90 untouched days).',
  M13: 'Median over hearings in the period with an outcome recorded. Hearings still awaiting an update are counted under Hearings awaiting update.',
  M16: 'Base: the 33 Legal and Lawyer users active in the last 7 days.',
  M20: 'Window: the selected period.',
};

/**
 * The time window behind each metric's headline. "period" follows the 30/90/180-day toggle;
 * anything else is fixed by the metric's definition, and the card says so.
 */
export const WINDOW: Record<string, 'period' | string> = {
  M01: 'period', M02: 'Last 7 days', M03: 'Calendar month', M04: 'Last 7 days', M05: 'Today',
  M06: 'Last 30 days', M07: 'Since each invite', M08: 'Last 90 days', M09: 'Last 90 days', M10: 'Last 90 days',
  M11: 'Cases added in last 90 days', M12: 'Today', M13: 'period', M14: 'Right now', M15: 'Today',
  M16: 'period', M17: '1 Oct to 7 Nov', M18: 'period', M19: 'Weekly sample', M20: 'period',
  M21: 'period', M22: 'period', M23: 'Last 90 days', M24: 'Today', M25: 'Last 7 days', M26: 'period', M27: 'period',
  U01: 'Last 8 weeks', U02: 'Latest 20 actions', U03: 'period',
};
/** Metrics with a fixed headline whose trend line still follows the period. */
/** Fixed-number metrics whose chart card draws a line across the selected period. */
export const CARD_LINE = new Set(['M12', 'M15', 'M19']);
/** Fixed-number Pulse tiles whose sparkline spans the selected period. */
export const TILE_LINE = new Set(['M02', 'M04', 'M05']);
