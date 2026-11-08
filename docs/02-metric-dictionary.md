# Metric dictionary: Legistify Litigation PM dashboard

Every metric and chart on the dashboard. Each has the question it answers, why it matters, the decision it drives, why that chart, and how it is computed. Sample values are from the made-up account Meridia Consumer Industries Ltd (see 03-data-spec.md).

**Tiers.** North star: the one number that says the module works. Decision: moves a roadmap or account decision. Guardrail: must not break while we push the others. Diagnostic: context for reading the rest.

**Left out as vanity:** total cases tracked, total logins, total AI queries, total documents uploaded. Each rises without telling us whether anyone's work got easier.

## Summary

| ID | Metric | Section | Tier | Lens | Views | Sample value |
|---|---|---|---|---|---|---|
| M01 | Hearing close-out rate | Pulse | north-star | business | org, team, user | 61% (in-house 88%, counsel 51%) |
| M02 | Weekly active seats by role | Pulse | decision | business | org, team | 45% overall (Admin 100%, Legal 91%, Lawyer 46%, Business 32%) |
| M03 | AI credit runway | Pulse | guardrail | ai | org | Limit of 6,000 hit on day 19 in October (day 22 in September) |
| M04 | Court sync freshness | Pulse | guardrail | technical | org | District courts 71%, consumer forums 64% vs high courts 96% |
| M05 | Active matters | Pulse | diagnostic | business | org, team, user | 412 (Sales & Distribution 148, Procurement 104, HR 92, Finance 68) |
| M06 | Feature stickiness | Adoption | decision | business | org, team | My Cases 52%, hearing updates 38%; Codex 4% and Spend 2% are near dead |
| M07 | Time to first value | Adoption | decision | business | org, team | Legal 2 days, Admin 1, Business 11, Lawyer 19 |
| M08 | Intake suggestion funnel | Intake | decision | business | org | 1,140 suggested, 638 reviewed, 198 accepted, 440 deleted, 502 expired (44%) |
| M09 | Intake precision by keyword group | Intake | decision | business | org | 31% overall; brand names 18%, company name 22%, directors' names 69% |
| M10 | Early-capture rate | Intake | decision | business | org, team | 52% overall; Procurement 34% |
| M11 | Field completeness at day 14 | Enrich and staff | decision | business | org, team, user | Exposure 3% to 11%, risk rating 2% to 9%, counsel 41% to 63% |
| M12 | Default-priority share | Enrich and staff | diagnostic | business | org | 96% |
| M13 | Outcome update lag by counsel firm | Hearing loop | decision | business | org, team | Mehra & Associates: 38% of hearings, 9.4-day lag, 22% active; others 1.8 to 2.6 days |
| M14 | Hearings awaiting update | Hearing loop | decision | business | org, team, user | 47 open; Ritika Sharma 19 |
| M15 | Dormant matters | Hearing loop | diagnostic | business | org, team, user | 63 (15%), up from 41 in June |
| M16 | AI adoption vs trust by feature | AI behaviour | decision | ai | org, user | Ask AI 67% / 61%; AI Diligence 9% / 17% but 46% of credits |
| M17 | AI usage after the credit limit | AI behaviour | guardrail | ai | org | 40 queries a day before the limit, 3 attempts a day after (down 93%) |
| M18 | Answer rejection signals | AI behaviour | guardrail | ai | org | Regenerate 14%, thumbs-down 6% |
| M19 | Summary accuracy (evaluation) | AI behaviour | guardrail | ai | org | 90.6% (last 4 weeks: 89 to 92%) |
| M20 | Insight follow-through (proxy) | AI behaviour | diagnostic | ai | org | 7% |
| M21 | Insights and MIS reach | Value | decision | business | org | 9 viewers a week; 64 MIS downloads in October, 48 with an AI report |
| M22 | Business-user alert follow-through | Value | decision | business | org, team | HR 52%, Sales 41%, Finance 37%, Procurement 18% |
| M23 | Spend capture | Value | decision | business | org, team | 18% |
| M24 | Contract-dispute share | Value | diagnostic | business | org, team | 46% (Procurement 61%, Sales 58%) |
| M25 | Page load time (p95) | Platform health | guardrail | technical | org | Insights 6.8 s, Codex 4.1 s, My Cases 2.4 s, case page 1.9 s |
| M26 | Rate-limit errors | Platform health | guardrail | technical | org | 4.1 on average, 9.7 on Monday mornings |
| M27 | Zero-result searches | Platform health | diagnostic | technical | org | Court search 21%, Codex 9% |

## Pulse

_The five numbers a PM checks first each morning_

### M01 · Hearing close-out rate

- **Question:** When a hearing happens, does someone record the outcome and next step on Legistify within 2 days?
- **Why it matters:** The hearing is the heartbeat of a litigation case. If outcomes are recorded on time, Legistify is the system of record; if not, it is only a tracker and the team works from email and Excel.
- **If it moves:** A drop points to who is not closing the loop (a counsel firm, a case manager), and leads to reminders, counsel self-update or AI drafting of outcomes from synced orders.
- **Chart:** Weekly line against an 80% target band, split into in-house and counsel-owned hearings. A trend against a target shows direction and gap at once; the split shows where the gap comes from without a second chart.
- **Definition:** Share of hearings whose date has passed in the period that have an outcome or next step recorded within 2 calendar days.
- **Formula:** `count(hearings with hearing_outcome_recorded.lag_days <= 2) / count(hearings with hearing_date in period and hearing_date <= today - 2)`
- **Source events:** `hearing_synced, hearing_outcome_recorded {lag_days, updater_role, firm_id}`
- **Refresh:** Daily, 06:00 IST · **Alert:** Below 65% for 2 consecutive weeks
- **Tier / lens / views:** north-star · business · org, team, user
- **Sample value:** 61% (in-house 88%, counsel 51%)

### M02 · Weekly active seats by role

- **Question:** Of the seats the customer pays for, how many people actually work on the module each week, by role?
- **Why it matters:** Renewal depends on usage across roles. A tool used only by the legal team is easy to cut; one used by counsel and business users is hard to replace.
- **If it moves:** A weak role gets targeted onboarding (counsel, business users) or a lighter surface built for it, such as email or WhatsApp actions.
- **Chart:** Horizontal bullet bars: active users against seats, one bar per role. Bullet bars show actual against capacity per role in one glance; a pie would hide the seat count.
- **Definition:** Users with at least one meaningful action (not just a login) in a rolling 7 days, divided by provisioned seats, per role.
- **Formula:** `count(distinct user_id with meaningful_action in last 7 days) / seats, grouped by role`
- **Source events:** `session_started, any *_recorded / *_created / *_updated event, user_invited`
- **Refresh:** Daily · **Alert:** Any role below 30%
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** 45% overall (Admin 100%, Legal 91%, Lawyer 46%, Business 32%)

### M03 · AI credit runway

- **Question:** On which day of the month does this account run out of AI credits?
- **Why it matters:** When credits run out, every AI feature stops for the whole account. The value the customer sees from AI is capped by the calendar, not by need.
- **If it moves:** An early limit day leads to a cheaper model or separate pool for bulk features, usage caps per feature, or an upgrade conversation with the account manager.
- **Chart:** Cumulative credits by day of month, one line per month, with the limit as a horizontal rule. Cumulative lines make the crossing day visible and show whether it is moving earlier month after month.
- **Definition:** Credits consumed per calendar day, accumulated within the month, against the account's monthly limit.
- **Formula:** `sum(ai_request.credits) cumulative by day; limit_day = first day cumulative >= monthly_limit`
- **Source events:** `ai_request {feature, credits, model}, ai_limit_reached`
- **Refresh:** Hourly · **Alert:** Projected limit day earlier than day 25
- **Tier / lens / views:** guardrail · ai · org
- **Sample value:** Limit of 6,000 hit on day 19 in October (day 22 in September)

### M04 · Court sync freshness

- **Question:** Is the hearing and order data the user sees today actually up to date?
- **Why it matters:** Every downstream number, from hearing status to close-out rate, assumes the court data is fresh. Stale sync silently breaks trust.
- **If it moves:** Low freshness for a court type sends engineering to fix that scraper first, ranked by how many active cases depend on it.
- **Chart:** Horizontal bars by court type with a 95% target line. Court types are categories with very different reliability; sorted bars rank where to fix first.
- **Definition:** Share of active cases whose court data synced successfully in the last 24 hours, by court type.
- **Formula:** `count(active cases with court_sync_run.status = success in last 24h) / count(active cases), by court_type`
- **Source events:** `court_sync_run {court_type, court_id, status, records_changed}`
- **Refresh:** Hourly · **Alert:** Any court type below 85%
- **Tier / lens / views:** guardrail · technical · org
- **Sample value:** District courts 71%, consumer forums 64% vs high courts 96%

### M05 · Active matters

- **Question:** How many live cases is the account running, and is the book growing?
- **Why it matters:** Context for every other number: rates mean little without the size of the book behind them. Shown as context, not as a success metric.
- **If it moves:** None on its own. A sharp change prompts a check of intake and disposal before reading other metrics.
- **Chart:** Number tile with a 26-week sparkline. One number with its trend is all that context needs; a full chart would give a size metric too much weight.
- **Definition:** Cases not disposed or archived at the end of the period.
- **Formula:** `count(cases where status in (ongoing) at period end)`
- **Source events:** `case_created, case_disposed, case_archived`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** diagnostic · business · org, team, user
- **Sample value:** 412 (Sales & Distribution 148, Procurement 104, HR 92, Finance 68)

## Adoption

_Who is using the module, and which features stick_

### M06 · Feature stickiness

- **Question:** Which features have become a daily habit, and which are dead weight?
- **Why it matters:** Daily features are the product's core; features nobody returns to are either broken, misplaced or not needed.
- **If it moves:** High-traffic, low-stickiness features get UX work; features under 5% become candidates to merge, move or retire.
- **Chart:** Sorted horizontal bars of DAU/MAU per feature, with features under 5% marked. One measure across many features is a ranking, so sorted bars read fastest; the 5% marker shows the cut.
- **Definition:** Average daily users of a feature divided by its monthly users, over the last 30 days.
- **Formula:** `avg(daily distinct users of feature) / distinct users of feature in 30 days`
- **Source events:** `feature_used {feature}`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** My Cases 52%, hearing updates 38%; Codex 4% and Spend 2% are near dead

### M07 · Time to first value

- **Question:** After a new user is invited, how long until they do the thing their role needs?
- **Why it matters:** Users who do not reach their first meaningful action in the first weeks rarely come back. Counsel and business users are the at-risk roles.
- **If it moves:** A long time for a role leads to a role-specific first-run flow or an invite email that lands them on their first task.
- **Chart:** Dot plot of median days per role, with the interquartile range as a line. A few roles with a median and spread each; dots with whiskers show both without the clutter of box plots.
- **Definition:** Median days from invite to first role-specific action: Legal = first hearing outcome; Business = first followed-case view; Lawyer = first case update; Admin = first keyword group or user change.
- **Formula:** `median(first_value_action.ts - user_invited.ts) by role`
- **Source events:** `user_invited, hearing_outcome_recorded, case_followed, case_viewed, keyword_group_updated`
- **Refresh:** Weekly · **Alert:** None
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** Legal 2 days, Admin 1, Business 11, Lawyer 19

## Intake

_Do new court filings reach the legal team, early and accurately_

### M08 · Intake suggestion funnel

- **Question:** Of the cases the system suggests from new court filings, how many get reviewed, accepted, rejected or ignored until they expire?
- **Why it matters:** Intake is the module's front door. Ignored suggestions mean real cases can slip past; rejected ones are wasted review time.
- **If it moves:** High expiry leads to better alerts or a review queue; high rejection leads to better matching (see M09).
- **Chart:** Funnel bars: suggested, reviewed, accepted (added or mapped), with deleted and expired shown as the drop-offs. Stage counts with the drop between them are what a funnel is for.
- **Definition:** Counts of suggestions in the last 90 days by final state: added, mapped to an existing case, deleted, or expired after 90 days untouched.
- **Formula:** `count(suggestion_shown); count(suggestion_triaged by action); count(suggestion_expired)`
- **Source events:** `suggestion_shown {keyword_group}, suggestion_triaged {action: added|mapped|deleted}, suggestion_expired`
- **Refresh:** Daily · **Alert:** Expired share above 30%
- **Tier / lens / views:** decision · business · org
- **Sample value:** 1,140 suggested, 638 reviewed, 198 accepted, 440 deleted, 502 expired (44%)

### M09 · Intake precision by keyword group

- **Question:** Of the suggestions people review, how many are really about the company? Which keyword groups create the noise?
- **Why it matters:** A keyword like a company or brand name also matches unrelated parties. Every false match is a case someone must open and reject.
- **If it moves:** Low precision justifies entity matching (party name, CIN, address) instead of plain keywords, and helps admins prune noisy groups.
- **Chart:** Horizontal bars of precision by keyword group, labelled with suggestion volume. Precision per category is a ranking; the volume label shows which noisy group costs the most time.
- **Definition:** Accepted suggestions (added or mapped) divided by reviewed suggestions, per keyword group, last 90 days.
- **Formula:** `count(suggestion_triaged.action in (added, mapped)) / count(suggestion_triaged), by keyword_group`
- **Source events:** `suggestion_triaged {action, keyword_group}`
- **Refresh:** Daily · **Alert:** Any group below 25% with more than 50 suggestions
- **Tier / lens / views:** decision · business · org
- **Sample value:** 31% overall; brand names 18%, company name 22%, directors' names 69%

### M10 · Early-capture rate

- **Question:** Are new cases tracked before their first hearing, so the team is not caught off guard?
- **Why it matters:** Catching a case before the first hearing, often before the summons, is the core promise of automated intake.
- **If it moves:** A low rate for a business unit points to missing keywords for its entities or slow review, and to faster alert channels.
- **Chart:** Bars by business unit against a 75% target line. Four units compared on one rate with a target: bars with a reference line.
- **Definition:** Share of new cases tracked (added) before their first listed hearing date, last 90 days.
- **Formula:** `count(case_created.ts < first hearing_date) / count(case_created), by business_unit`
- **Source events:** `case_created {source, business_unit}, hearing_synced`
- **Refresh:** Daily · **Alert:** Below 50%
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** 52% overall; Procurement 34%

## Enrich and staff

_Do cases get the data that the GC's Insights depend on_

### M11 · Field completeness at day 14

- **Question:** Two weeks after a case is added, does it have the fields the GC's Insights tabs need?
- **Why it matters:** Financials and Team & Counsel tabs are only as good as these fields. In the demo, about 1 case in 20 had exposure filled in.
- **If it moves:** Low completeness leads to prompts at the moment of adding a case, required fields per role, or AI extraction of amounts from the plaint.
- **Chart:** Dumbbell per field: completeness when added and at day 14. Two points per field show both the starting gap and how little it closes later; that change is the story.
- **Definition:** Share of cases added in the last 90 days with the field set when added, and by day 14.
- **Formula:** `count(cases with field set within N days of case_created) / count(cases), for N = 0 and 14, per field`
- **Source events:** `case_created, case_field_updated {field}`
- **Refresh:** Daily · **Alert:** Exposure below 30% at day 14
- **Tier / lens / views:** decision · business · org, team, user
- **Sample value:** Exposure 3% to 11%, risk rating 2% to 9%, counsel 41% to 63%

### M12 · Default-priority share

- **Question:** Is priority a real judgment or a value nobody changes?
- **Why it matters:** If nearly every case is high priority, priority cannot help anyone choose what to work on, and priority-based views are meaningless.
- **If it moves:** A share above 90% supports deriving priority from exposure and hearing proximity instead of asking users.
- **Chart:** Number tile with a sparkline. One share and its trend; nothing to compare it against.
- **Definition:** Share of active cases whose priority still equals the default set at creation.
- **Formula:** `count(active cases where priority = default and never updated) / count(active cases)`
- **Source events:** `case_created, case_field_updated {field: priority}`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** diagnostic · business · org
- **Sample value:** 96%

## Hearing loop

_Is each hearing closed out on the platform, and by whom_

### M13 · Outcome update lag by counsel firm

- **Question:** Which counsel firms take longest to report what happened at a hearing, and how much of the docket do they carry?
- **Why it matters:** Counsel own most hearings. One slow firm with a large share can pull the whole account's close-out rate down.
- **If it moves:** A slow, high-volume firm gets an escalation through the GC, an email-reply update option, or reallocation of new matters.
- **Chart:** Scatter: median update lag (x) against on-platform activity (y), bubble size = hearings in period. Three attributes per firm at once; the scatter puts the problem firm alone in one corner.
- **Definition:** Per firm, the median days between a hearing and its recorded outcome; on-platform activity = share of the firm's assigned cases with any action by its lawyers in 30 days.
- **Formula:** `median(hearing_outcome_recorded.lag_days) by firm; count(cases with firm action in 30d) / count(firm cases)`
- **Source events:** `hearing_outcome_recorded {firm_id, lag_days}, any action by role = Lawyer`
- **Refresh:** Daily · **Alert:** Firm median lag above 5 days with more than 20 hearings
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** Mehra & Associates: 38% of hearings, 9.4-day lag, 22% active; others 1.8 to 2.6 days

### M14 · Hearings awaiting update

- **Question:** Right now, which past hearings still have no outcome, and on whose desk are they?
- **Why it matters:** This is the PM's view of the bottleneck: it turns the close-out rate into named people.
- **If it moves:** A concentration on one person leads to workload rebalancing, nudges, or delegation to counsel.
- **Chart:** Ranked horizontal bars, top 10 case managers, each bar split by who owns the hearing (in-house or counsel). A ranked list of people is the natural drill path to the user view; the split shows if the delay is theirs or their counsel's.
- **Definition:** Hearings more than 2 days past with no outcome recorded, grouped by case manager.
- **Formula:** `count(hearings where hearing_date < today - 2 and no hearing_outcome_recorded), by case_manager`
- **Source events:** `hearing_synced, hearing_outcome_recorded`
- **Refresh:** Daily · **Alert:** Any person above 15
- **Tier / lens / views:** decision · business · org, team, user
- **Sample value:** 47 open; Ritika Sharma 19

### M15 · Dormant matters

- **Question:** How many live cases have had no activity at all for 90 days?
- **Why it matters:** Dormant cases are where hearings get missed and exposure goes unmanaged. The product promises nothing slips.
- **If it moves:** A rising count makes dormancy an assigned follow-up, not a passive chart.
- **Chart:** Area chart over 26 weeks, with the share of active matters as a label. A single quantity over time; the area emphasises the growing backlog.
- **Definition:** Active cases with no user action, task or document event for 90 or more days.
- **Formula:** `count(active cases where max(activity.ts) < today - 90)`
- **Source events:** `all case-level events`
- **Refresh:** Daily · **Alert:** Share above 12%
- **Tier / lens / views:** diagnostic · business · org, team, user
- **Sample value:** 63 (15%), up from 41 in June

## AI behaviour

_Is AI used, trusted, affordable and accurate_

### M16 · AI adoption vs trust by feature

- **Question:** Which AI features are used, and which are used but not trusted?
- **Why it matters:** High use with low follow-through means people try AI but do not rely on it. That is the difference between an AI feature and an AI demo.
- **If it moves:** Low trust with high use calls for output-quality work; high trust with low use calls for better placement or discovery.
- **Chart:** Quadrant scatter: adoption (x) against action rate (y), one point per AI feature, bubble size = credits used. Two measures per feature define four clear actions; quadrants make the action readable without a legend.
- **Definition:** Adoption = share of active Legal and Lawyer users who used the feature in 30 days. Action rate = share of AI outputs followed within 10 minutes by copy, export, task, document or field edit.
- **Formula:** `distinct users(ai_request.feature) / active legal+lawyer users; count(ai_output_actioned) / count(ai_response)`
- **Source events:** `ai_request {feature, credits}, ai_response, ai_output_actioned {action}`
- **Refresh:** Daily · **Alert:** Action rate below 25% for a feature using more than 20% of credits
- **Tier / lens / views:** decision · ai · org, user
- **Sample value:** Ask AI 67% / 61%; AI Diligence 9% / 17% but 46% of credits

### M17 · AI usage after the credit limit

- **Question:** What happens to AI use once the account runs out of credits?
- **Why it matters:** Shows the cost of the limit in lost usage, which is what the account manager and pricing team need to see.
- **If it moves:** A steep drop supports moving bulk features to a separate pool or cheaper model, so everyday Ask AI keeps working.
- **Chart:** Daily Ask AI queries for the current month, with the limit day marked. A daily line with one annotated event shows the cliff better than any summary number.
- **Definition:** Ask AI requests per day, before and after the day the monthly limit is reached.
- **Formula:** `count(ai_request where feature = ask_ai) by day; compare mean before and after limit_day`
- **Source events:** `ai_request, ai_limit_reached`
- **Refresh:** Daily · **Alert:** None (reported with M03)
- **Tier / lens / views:** guardrail · ai · org
- **Sample value:** 40 queries a day before the limit, 3 attempts a day after (down 93%)

### M18 · Answer rejection signals

- **Question:** How often do users reject AI answers outright?
- **Why it matters:** Regenerations and thumbs-down are the cheapest live signals of AI quality, available every day.
- **If it moves:** A rise after a model or prompt change triggers rollback or a deeper evaluation of that change.
- **Chart:** Two weekly lines: regenerate rate and thumbs-down rate, with model changes marked. Two rates over time with release markers show cause and effect.
- **Definition:** Share of AI responses regenerated, and share given a thumbs-down, per week.
- **Formula:** `count(ai_feedback.type = regenerate) / count(ai_response); same for thumbs_down`
- **Source events:** `ai_response {model, prompt_version}, ai_feedback {type}`
- **Refresh:** Daily · **Alert:** Thumbs-down above 10%
- **Tier / lens / views:** guardrail · ai · org
- **Sample value:** Regenerate 14%, thumbs-down 6%

### M19 · Summary accuracy (evaluation)

- **Question:** Are AI case summaries factually right?
- **Why it matters:** A wrong date or party in a summary can mislead a legal decision. Usage signals cannot catch this; only evaluation can.
- **If it moves:** Accuracy below target blocks new AI features from release and triggers prompt or model changes.
- **Chart:** Weekly line of sampled accuracy with a 90% target line. A quality score over time against a bar to clear.
- **Definition:** Phase 1: a reviewer grades 50 random summaries a week against the source documents (parties, dates, stage, relief, next hearing). Phase 2: an AI grader, checked against the human grades, scores every summary.
- **Formula:** `correct facts / facts checked across the weekly sample`
- **Source events:** `ai_response {feature: case_summary}, eval_graded {score, grader: human|ai}`
- **Refresh:** Weekly · **Alert:** Below 88%
- **Tier / lens / views:** guardrail · ai · org
- **Sample value:** 90.6% (last 4 weeks: 89 to 92%)

### M20 · Insight follow-through (proxy)

- **Question:** Do the AI-written insights under Insights charts lead anyone to look closer?
- **Why it matters:** Insights are plain text today. If nobody follows them up, they are decoration; if people do, making them clickable is worth building.
- **If it moves:** A meaningful rate supports turning insights into links to the filtered case list.
- **Chart:** Number tile with a 12-week sparkline. A single proxy rate; showing more would claim more precision than it has.
- **Definition:** Share of Insights sessions in which the user opens a case list filtered on the dimension an insight names, within 10 minutes.
- **Formula:** `count(insights sessions with case_list_opened matching viewed insight) / count(insights sessions)`
- **Source events:** `insight_viewed {chart_id, dimension}, case_list_opened {filters}`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** diagnostic · ai · org
- **Sample value:** 7%

## Value

_Do leadership, business users and finance get something out of it_

### M21 · Insights and MIS reach

- **Question:** Do the GC and finance actually use the reporting built for them?
- **Why it matters:** Reporting is what the buyer (the GC) sees. If they do not open it, the renewal case rests on the legal team alone.
- **If it moves:** Low reach from the GC leads to a scheduled email digest, or reporting placed where they already are.
- **Chart:** Weekly stacked bars of Insights viewers by role, with MIS downloads as a line. Viewers by role are parts of a whole each week; the line adds the export habit without a second chart.
- **Definition:** Distinct weekly viewers of any Insights tab by role, plus MIS downloads per week (including AI analysis reports).
- **Formula:** `distinct users(insight_viewed) by week and role; count(mis_downloaded) by week`
- **Source events:** `insight_viewed, mis_downloaded {format, ai_report}`
- **Refresh:** Daily · **Alert:** No Admin viewer for 14 days
- **Tier / lens / views:** decision · business · org
- **Sample value:** 9 viewers a week; 64 MIS downloads in October, 48 with an AI report

### M22 · Business-user alert follow-through

- **Question:** When a business user gets an alert about a case in their unit, do they open the case?
- **Why it matters:** Business users are the long tail of seats and mostly interact through alerts. An ignored alert is a seat with no value.
- **If it moves:** Low follow-through leads to fewer, sharper alerts and a summary inside the alert itself.
- **Chart:** Bars by business unit. Four units compared on one rate.
- **Definition:** Share of alerts opened by Business-role users that lead to a case view within 24 hours.
- **Formula:** `count(alert_opened followed by case_viewed within 24h) / count(alert_sent), Business role, by business_unit`
- **Source events:** `alert_sent, alert_opened, case_viewed`
- **Refresh:** Daily · **Alert:** Below 20% for a unit
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** HR 52%, Sales 41%, Finance 37%, Procurement 18%

### M23 · Spend capture

- **Question:** Is legal spend recorded against cases on the platform?
- **Why it matters:** Spend is half of the Financials story. In the demo, the invoice count read 0 while amounts showed, so this data is fragile.
- **If it moves:** Low capture supports counsel invoice upload or a link to the company's finance system.
- **Chart:** Number tile plus bars by business unit. The headline share and where it is weakest.
- **Definition:** Share of active cases with at least one spend or invoice entry in the last 90 days.
- **Formula:** `count(active cases with spend_logged in 90d) / count(active cases)`
- **Source events:** `spend_logged {type, amount, source}`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** decision · business · org, team
- **Sample value:** 18%

### M24 · Contract-dispute share

- **Question:** How many litigation cases arise from a contract, and so could be linked to the contract in CLM?
- **Why it matters:** Sizes the opportunity behind Legistify's unified CLM and litigation thesis. After a 'link to contract' feature ships, this becomes 'share of cases linked to a contract'.
- **If it moves:** A large share justifies building the contract link and the cross-module views it enables.
- **Chart:** Bars by business unit, with the account average marked. One share across four units with a reference.
- **Definition:** Share of active cases whose case type is contract-based (dealer, vendor, commercial, employment contract).
- **Formula:** `count(active cases where case_type in contract_types) / count(active cases), by business_unit`
- **Source events:** `case_created {case_type}, case_field_updated`
- **Refresh:** Weekly · **Alert:** None
- **Tier / lens / views:** diagnostic · business · org, team
- **Sample value:** 46% (Procurement 61%, Sales 58%)

## Platform health

_Is the product fast, fresh and reliable enough for daily work_

### M25 · Page load time (p95)

- **Question:** Are the pages people use daily fast enough?
- **Why it matters:** A slow Insights tab is a quiet reason the GC stops opening it. In the demo, several screens sat on loading skeletons.
- **If it moves:** Pages over budget get performance work ahead of new features.
- **Chart:** Horizontal bars per page against a 3-second budget line. A few pages compared to one budget.
- **Definition:** 95th percentile time to interactive per page, last 7 days.
- **Formula:** `p95(page_loaded.load_ms) by page`
- **Source events:** `page_loaded {page, load_ms}`
- **Refresh:** Hourly · **Alert:** Any page above 5 s
- **Tier / lens / views:** guardrail · technical · org
- **Sample value:** Insights 6.8 s, Codex 4.1 s, My Cases 2.4 s, case page 1.9 s

### M26 · Rate-limit errors

- **Question:** How often do users hit 'Rate limit exceeded' while working?
- **Why it matters:** Seen repeatedly in the demo. Every error interrupts a task and makes the product feel broken.
- **If it moves:** Peaks at busy times justify raising limits or caching on the heaviest calls.
- **Chart:** Daily line of errors per 100 sessions, Mondays marked. A daily rate over time; the Monday markers show the pattern.
- **Definition:** HTTP 429 responses seen by users per 100 sessions.
- **Formula:** `count(api_error.code = 429) / count(session_started) * 100`
- **Source events:** `api_error {code, endpoint}, session_started`
- **Refresh:** Hourly · **Alert:** Above 5 per 100 sessions
- **Tier / lens / views:** guardrail · technical · org
- **Sample value:** 4.1 on average, 9.7 on Monday mornings

### M27 · Zero-result searches

- **Question:** What are people searching for and not finding?
- **Why it matters:** A search with no results is a user telling us what is missing, from a court not covered to a query Codex cannot answer.
- **If it moves:** Frequent misses feed court coverage priorities and Codex prompt and data improvements.
- **Chart:** Two bars (court search, Codex) with the top missed queries listed beside them. Two surfaces compared; the query list is what someone can act on.
- **Definition:** Share of searches returning no results, by surface.
- **Formula:** `count(search_performed.results_count = 0) / count(search_performed), by surface`
- **Source events:** `search_performed {surface, results_count, query_hash}`
- **Refresh:** Daily · **Alert:** None
- **Tier / lens / views:** diagnostic · technical · org
- **Sample value:** Court search 21%, Codex 9%

## User view only

The user view reuses M01, M05, M11, M14, M15 and M16 filtered to one person, plus:

- **U01 · Activity heatmap.** When does this person work on the module? Chart: Day-of-week by hour grid, last 8 weeks. Shows habit at a glance and whether work bunches before hearing days.
- **U02 · Recent activity timeline.** What did they do recently? Chart: Vertical timeline of the last 20 actions. The quickest way for support or a PM to see a person's real workflow.
- **U03 · Compared with team median.** Is this person above or below their team on the key rates? Chart: Small bars with a team-median tick for M01, M11, M14, M16. A tick on each bar compares without a second chart.
