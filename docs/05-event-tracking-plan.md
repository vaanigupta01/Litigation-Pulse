# Event tracking plan (bonus deliverable)

Every metric in the dictionary is computed from these events. Naming: `object_action`, snake_case. Every event carries the common properties.

**Common properties:** `account_id`, `user_id`, `role` (admin | legal | business | lawyer), `team_id`, `business_unit`, `ts` (IST), `platform` (web | mobile | email), `session_id`.

| Event | Fired when | Key properties | Feeds |
|---|---|---|---|
| `session_started` | A user opens the app | entry_page | M02, M26 |
| `feature_used` | Any feature screen is used with an action | feature | M02, M06 |
| `user_invited` | An admin adds a user | invited_role | M07 |
| `suggestion_shown` | Intake surfaces a new filing | keyword_group, court_type, filed_on | M08, M09 |
| `suggestion_triaged` | A user adds, maps or deletes a suggestion | action (added, mapped, deleted), keyword_group | M08, M09 |
| `suggestion_expired` | A suggestion passes 90 days untouched (system) | keyword_group | M08 |
| `case_created` | A case enters My Cases | source (suggestion, manual, court_search), case_type, court_type, business_unit | M05, M10, M11, M24 |
| `case_field_updated` | A case field changes | field, was_empty | M11, M12 |
| `case_viewed` / `case_followed` | A case page is opened / followed | via (alert, list, search) | M07, M22 |
| `hearing_synced` | Court sync creates or updates a hearing (system) | hearing_date, court_type | M01, M10, M14 |
| `hearing_outcome_recorded` | Someone records what happened at a hearing | lag_days, updater_role, firm_id, via (web, email) | M01, M13, M14 |
| `task_created`, `document_uploaded` | Case work happens | task_type, doc_type | M15 |
| `case_disposed`, `case_archived` | A case closes | reason | M05 |
| `spend_logged` | A spend or invoice is recorded | type, amount, source | M23 |
| `ai_request` | Any AI feature is called | feature, credits, model, prompt_version, latency_ms, blocked | M03, M16, M17 |
| `ai_response` | An AI answer is shown | feature, model, tokens | M16, M18 |
| `ai_output_actioned` | Within 10 min, the output is copied, exported, turned into a task or document, or a field is edited | action | M16 |
| `ai_feedback` | Regenerate or thumbs-down | type | M18 |
| `ai_limit_reached` | Account crosses its monthly credit limit (system) | day_of_month | M03, M17 |
| `eval_graded` | A sampled summary is graded | score, grader (human, ai) | M19 |
| `insight_viewed` | An Insights chart is in view for 2 s | chart_id, dimension | M20, M21 |
| `case_list_opened` | A filtered case list opens | filters | M20 |
| `mis_downloaded` | An MIS report is downloaded | format, ai_report | M21 |
| `alert_sent` / `alert_opened` | An alert is sent / opened | alert_type, channel | M22 |
| `page_loaded` | A page becomes interactive | page, load_ms | M25 |
| `api_error` | The client receives an error | code, endpoint | M26 |
| `court_sync_run` | A sync job finishes (system) | court_type, court_id, status, records_changed | M04 |
| `search_performed` | A search runs | surface (court, codex, my_cases), results_count, query_hash | M27 |

**Privacy:** never send case content, party names or query text in events; use IDs and hashes.
