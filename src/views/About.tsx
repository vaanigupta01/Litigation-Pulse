const EVENTS: [string, string, string, string][] = [
  ['session_started', 'A user opens the app', 'entry_page', 'M02, M26'],
  ['feature_used', 'Any feature screen is used with an action', 'feature', 'M02, M06'],
  ['user_invited', 'An admin adds a user', 'invited_role', 'M07'],
  ['suggestion_shown', 'Intake surfaces a new filing', 'keyword_group, court_type, filed_on', 'M08, M09'],
  ['suggestion_triaged', 'A user adds, maps or deletes a suggestion', 'action (added, mapped, deleted), keyword_group', 'M08, M09'],
  ['suggestion_expired', 'A suggestion passes 90 days untouched (system)', 'keyword_group', 'M08'],
  ['case_created', 'A case enters My Cases', 'source (suggestion, manual, court_search), case_type, court_type, business_unit', 'M05, M10, M11, M24'],
  ['case_field_updated', 'A case field changes', 'field, was_empty', 'M11, M12'],
  ['case_viewed / case_followed', 'A case page is opened / followed', 'via (alert, list, search)', 'M07, M22'],
  ['hearing_synced', 'Court sync creates or updates a hearing (system)', 'hearing_date, court_type', 'M01, M10, M14'],
  ['hearing_outcome_recorded', 'Someone records what happened at a hearing', 'lag_days, updater_role, firm_id, via (web, email)', 'M01, M13, M14'],
  ['task_created, document_uploaded', 'Case work happens', 'task_type, doc_type', 'M15'],
  ['case_disposed, case_archived', 'A case closes', 'reason', 'M05'],
  ['spend_logged', 'A spend or invoice is recorded', 'type, amount, source', 'M23'],
  ['ai_request', 'Any AI feature is called', 'feature, credits, model, prompt_version, latency_ms, blocked', 'M03, M16, M17'],
  ['ai_response', 'An AI answer is shown', 'feature, model, tokens', 'M16, M18'],
  ['ai_output_actioned', 'Within 10 min, the output is copied, exported, turned into a task or document, or a field is edited', 'action', 'M16'],
  ['ai_feedback', 'Regenerate or thumbs-down', 'type', 'M18'],
  ['ai_limit_reached', 'Account crosses its monthly credit limit (system)', 'day_of_month', 'M03, M17'],
  ['eval_graded', 'A sampled summary is graded', 'score, grader (human, ai)', 'M19'],
  ['insight_viewed', 'An Insights chart is in view for 2 s', 'chart_id, dimension', 'M20, M21'],
  ['case_list_opened', 'A filtered case list opens', 'filters', 'M20'],
  ['mis_downloaded', 'An MIS report is downloaded', 'format, ai_report', 'M21'],
  ['alert_sent / alert_opened', 'An alert is sent / opened', 'alert_type, channel', 'M22'],
  ['page_loaded', 'A page becomes interactive', 'page, load_ms', 'M25'],
  ['api_error', 'The client receives an error', 'code, endpoint', 'M26'],
  ['court_sync_run', 'A sync job finishes (system)', 'court_type, court_id, status, records_changed', 'M04'],
  ['search_performed', 'A search runs', 'surface (court, codex, my_cases), results_count, query_hash', 'M27'],
];

export function About() {
  const lines: [string, string][] = [
    ['Who it is for', 'The product manager for Legistify Litigation Management, every morning. Founders read the three signals and Pulse; engineers read Platform health and AI behaviour; customer success reads the team and user views to find at-risk accounts and people.'],
    ['The sample account', 'Meridia Consumer Industries Ltd, a made-up consumer goods company in Mumbai: 2,000 employees, 150 seats, 412 active cases, four business units and five external counsel firms. No real company or person is described.'],
    ['How the data was made', 'One seeded script (scripts/generate.ts) writes every table: users, matters, hearings, suggestions, activity, AI requests, alerts, spend, platform telemetry and evaluations. Targets are placed by allocation, not random sampling, and 45 tests check that org, team and user views add up before every build.'],
    ['How to read it', 'The case lifecycle runs top to bottom: Adoption, Intake, Enrich and staff, Hearing loop, AI behaviour, Value, Platform health. Each colour belongs to one stage. Click any business unit, firm or person to drill in; Esc or the breadcrumb goes back.'],
    ['Tiers', 'North star: the one number that says the module works (hearing close-out). Decision: moves a roadmap or account decision. Guardrail: must not break while we push the others. Diagnostic: context for reading the rest.'],
    ['AI tools used', 'Built with Claude Code (code, data generator, tests, screenshots and fixes). Research and writing of the metric dictionary, data spec and brief with Claude.'],
  ];
  return (
    <div className="pt-4">
      <h1 className="serif text-[44px] leading-tight">About this dashboard</h1>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {lines.map(([k, v]) => (
          <div key={k} className="card p-5"><div className="text-[12px] font-medium uppercase tracking-wide text-muted">{k}</div><p className="mt-1 text-[14px] leading-relaxed">{v}</p></div>
        ))}
      </div>
      <h2 className="serif mt-12 text-[28px]">Event tracking plan</h2>
      <p className="mt-1 max-w-2xl text-[14px] text-muted">Every metric is computed from these events. Naming is object_action in snake_case. Every event carries account_id, user_id, role, team_id, business_unit, ts (IST), platform and session_id. Events never carry case content, party names or query text; they use IDs and hashes.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="border-b border-hairline bg-surface-2 text-left text-[12px] text-muted"><tr><th className="px-4 py-2 font-medium">Event</th><th className="px-4 py-2 font-medium">Fired when</th><th className="px-4 py-2 font-medium">Key properties</th><th className="px-4 py-2 font-medium">Feeds</th></tr></thead>
          <tbody>
            {EVENTS.map(([e, w, p, f]) => (
              <tr key={e} className="border-b border-hairline/60 last:border-0"><td className="px-4 py-2 font-mono text-[12px]">{e}</td><td className="px-4 py-2">{w}</td><td className="px-4 py-2 font-mono text-[11px] text-muted">{p}</td><td className="px-4 py-2 font-mono text-[11px]">{f}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
