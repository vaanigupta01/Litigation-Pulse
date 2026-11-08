export type Role = 'Admin' | 'Legal' | 'Business' | 'Lawyer';
export type TeamType = 'business_unit' | 'counsel_firm' | 'leadership';

export interface Team {
  id: string;
  name: string;
  short: string;
  type: TeamType;
  city?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  team_id: string;
  team_type: TeamType;
  seat_since: string;
  last_active: string | null;
  first_value_on: string | null;
}

export type CourtType = 'High Court' | 'District court' | 'Consumer forum' | 'Tribunal' | 'Supreme Court';
export type FieldName = 'exposure' | 'amount_claimed' | 'counsel' | 'risk_rating' | 'key_action';

export interface Matter {
  id: string;
  title: string;
  case_type: string;
  contract_based: boolean;
  court_type: CourtType;
  court: string;
  bu: string;
  case_manager_id: string;
  firm_id: string | null;
  lawyer_id: string | null;
  prior_firm_id: string | null; // counsel before firm_since (Mehra takeover on 1 Aug)
  prior_lawyer_id: string | null;
  firm_since: string | null;
  status: 'ongoing' | 'disposed';
  filed_on: string;
  tracked_on: string;
  disposed_on: string | null;
  first_hearing_on: string | null;
  source: 'suggestion' | 'manual' | 'court_search' | 'legacy';
  priority: 'High' | 'Medium' | 'Low';
  priority_default: boolean;
  fields_set: Partial<Record<FieldName, string>>;
  prior_activity_on: string; // last case activity before the data window
  last_activity_on: string;
}

export interface Hearing {
  id: string;
  matter_id: string;
  date: string;
  owner_type: 'inhouse' | 'counsel';
  firm_id: string | null;
  owner_id: string; // in-house: case manager; counsel: the assigned lawyer
  outcome_recorded_on: string | null;
  lag_days: number | null; // days from the start of the hearing day to the recorded outcome
  updater_id: string | null;
}

export interface Suggestion {
  id: string;
  keyword_group: 'company' | 'brand' | 'subsidiary' | 'director';
  shown_on: string;
  state: 'added' | 'mapped' | 'deleted' | 'expired';
  triaged_on: string | null;
  triaged_by: string | null;
  matter_id: string | null;
}

export type Feature =
  | 'my_cases'
  | 'hearing_updates'
  | 'calendar_queue'
  | 'ask_ai'
  | 'documents'
  | 'insights'
  | 'research'
  | 'tasks'
  | 'codex'
  | 'spend'
  | 'new_cases'
  | 'ai_tools'
  | 'settings';

export type ActivityKind =
  | 'case_viewed'
  | 'alert_case_viewed'
  | 'outcome_recorded'
  | 'hearing_updated'
  | 'calendar_opened'
  | 'document_uploaded'
  | 'research_opened'
  | 'task_created'
  | 'suggestion_added'
  | 'suggestion_mapped'
  | 'suggestion_deleted'
  | 'case_added'
  | 'field_updated'
  | 'spend_logged'
  | 'insight_viewed'
  | 'mis_downloaded'
  | 'keyword_group_updated';

/** One meaningful user action. Compact keys keep the bundle small. */
export interface Activity {
  t: string; // ISO local timestamp, IST: 2026-11-04T10:32
  u: string; // user id
  k: ActivityKind;
  f: Feature;
  m?: string; // matter id
  h?: string; // hearing id
  x?: string; // extra detail (field name, amount, insights tab)
  fo?: 1; // insight_viewed: followed by a matching filtered case list within 10 min
  ai?: 1; // mis_downloaded: with AI analysis report
}

export type AiFeature = 'ask_ai' | 'case_summary' | 'file_summary' | 'translation' | 'ai_diligence' | 'codex' | 'mis_report';

export interface AiEvent {
  t: string;
  u: string;
  f: AiFeature;
  c: number; // credits (0 when blocked)
  a: 0 | 1; // output actioned within 10 min
  fb: 0 | 1 | 2; // 0 none, 1 regenerate, 2 thumbs-down
  b: 0 | 1; // blocked by the credit limit
  m?: string;
  model: string;
}

export interface Alert {
  id: string;
  user_id: string;
  matter_id: string;
  sent_on: string;
  opened_on: string | null;
  case_viewed_on: string | null;
}

export interface Spend {
  matter_id: string;
  logged_on: string;
  amount: number;
  logged_by: string;
}

export interface PageLoadDay {
  page: string;
  date: string;
  ms: number[];
}
export interface ErrorDay {
  date: string;
  sessions: number;
  errors_429: number;
  mm_sessions: number; // Monday 09:00 to 11:00
  mm_errors: number;
}
export interface SyncDay {
  court_type: CourtType;
  date: string;
  cases_active: number;
  cases_synced_24h: number;
  runs: number;
  runs_failed: number;
}
export interface SearchDay {
  surface: 'court' | 'codex';
  date: string;
  searches: number;
  zero_results: number;
}
export interface MissedQuery {
  surface: 'court' | 'codex';
  query: string;
  count: number;
}
export interface Tech {
  page_loads: PageLoadDay[];
  errors: ErrorDay[];
  sync: SyncDay[];
  searches: SearchDay[];
  missed_queries: MissedQuery[];
}

export interface Eval {
  week_start: string;
  sample_size: number;
  facts_checked: number;
  facts_correct: number;
}

export interface Account {
  name: string;
  short: string;
  industry: string;
  hq: string;
  employees: number;
  seats: number;
  monthly_ai_limit: number;
  as_of: string;
  model_changes: { date: string; label: string }[];
  credit_costs: Record<AiFeature, number>;
}
