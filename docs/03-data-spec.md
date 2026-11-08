# Data spec: the made-up account and its story

The dashboard runs on one made-up customer account. Every number below is a **target the generator must hit exactly**. Generate the data deterministically (seeded, allocation-based, not free random sampling) so that org, team and user views add up to the same totals. A reviewer will cross-check numbers between views; any contradiction is a red flag in the brief.

## 1. The account

| Field | Value |
|---|---|
| Name | Meridia Consumer Industries Ltd (made up; label it "sample data" in the UI) |
| Industry | Consumer goods, HQ Mumbai |
| Employees | 2,000 |
| Business units | Sales & Distribution, Procurement & Supply Chain, Human Resources, Finance & Corporate |
| Seats | 150 |
| Active matters | 412 |
| Data window | 18 May 2026 to 7 Nov 2026 (25 weeks). Dashboard "as of" 8 Nov 2026, 06:00 IST |
| Default period | Last 30 days (9 Oct to 7 Nov). Selector: 30, 90, 180 days |
| Monthly AI credit limit | 6,000 |

## 2. People (150 seats)

| Role (platform) | Seats | Split |
|---|---|---|
| Admin | 4 | Anjali Rao (General Counsel), Sameer Kulkarni (Legal Ops), Farhan Qureshi (Legal Ops), Deepa Menon (IT) |
| Legal | 22 | Sales & Distribution 7, Procurement 6, HR 5, Finance 4 |
| Business | 96 | 24 per business unit |
| Lawyer (external counsel) | 28 | Mehra & Associates, Delhi 9 · Subramanian Legal, Chennai 6 · Desai Thakkar & Co, Mumbai 5 · Banerjee Law Chambers, Kolkata 4 · Chandra & Partners, Hyderabad 4 |

**Named people for the user view** (generate realistic Indian names for everyone else; no real public figures):

| Person | Role | Team | Why they matter |
|---|---|---|---|
| Ritika Sharma | Legal, litigation manager | Sales & Distribution | Biggest bottleneck: owns 96 matters, 19 hearings awaiting update, close-out 37% |
| Pooja Nair | Legal, litigation manager | Procurement | Contrast: close-out 91%, counsel all on-platform |
| Vikram Joshi | Legal | Finance & Corporate | Runs AI Diligence in bulk: 62% of the account's AI Diligence credits |
| Adv. Karan Mehra | Lawyer, lead partner | Mehra & Associates | 34 hearings in 30 days, close-out 24%, median update lag 11.2 days, last active 16 days ago |
| Neha Iyer | Business | Procurement | Gets alerts, rarely opens cases (follow-through 12%) |
| Anjali Rao | Admin, GC | Legal leadership | Opens Insights weekly, downloads MIS with AI report |

**Teams** are of two kinds: the 4 business units (internal Legal + Business users) and the 5 counsel firms (Lawyer users). Admins belong to "Legal leadership".

## 3. Matters

- Active at period end: **412**. By business unit: Sales & Distribution 148, Procurement 104, HR 92, Finance 68.
- By court type: High Courts 118, District courts 164, Consumer forums 72, Tribunals (NCLT, labour) 46, Supreme Court 12 (total 412).
- Case types: dealer and distributor disputes, vendor and supply contract disputes, consumer complaints, employment and labour cases, cheque bounce (Sec 138 NI Act), tax and regulatory, trademark. **Contract-based share 46%** (S&D 58%, Procurement 61%, HR 29%, Finance 22%; 191 of 412).
- Case managers: every matter has one Legal user as case manager. Ritika Sharma owns 96 of the 148 S&D matters.
- Counsel: 63% of matters added in the last 90 days have counsel by day 14 (see section 6). Mehra & Associates took over S&D dealer disputes on **1 Aug 2026**; this is the cause in the story.
- New matters, last 90 days: **192** (162 from intake suggestions, 21 added manually, 9 from court search). By BU: S&D 70, Procurement 50, HR 42, Finance 30.
- Disposed, last 90 days: 180. Active count drifts from 400 (May) to 412.
- Default priority unchanged: **96%** of active matters.
- Dormant (no activity 90+ days): **63 (15%)** now, rising steadily from 41 in June.

## 4. Planted insight 1: one counsel firm breaks the hearing loop

Hearings with a date in the last 30 days: **216**.

| Owner of the hearing | Hearings | Closed out within 2 days | Close-out | Median update lag | Counsel on-platform activity (30d) |
|---|---|---|---|---|---|
| In-house legal | 58 | 51 | 88% | 1.1 days | n/a |
| Mehra & Associates | 82 | 24 | 29% | 9.4 days | 22% |
| Subramanian Legal | 24 | 18 | 75% | 1.8 days | 86% |
| Desai Thakkar & Co | 22 | 17 | 77% | 2.1 days | 79% |
| Banerjee Law Chambers | 16 | 12 | 75% | 2.6 days | 74% |
| Chandra & Partners | 14 | 10 | 71% | 2.3 days | 70% |
| **Total** | **216** | **132** | **61%** (counsel only: 81 of 158 = 51%) | | |

- Hearings by BU (30d): S&D 78, Procurement 56, HR 46, Finance 36. Mehra's 82 = S&D 64 + Finance 18.
- Ritika Sharma's matters had 70 hearings: Mehra 60 (18 closed), in-house 6 (5 closed), other firms 4 (3 closed) = 26 of 70 = **37%**.
- Hearings awaiting update right now: **47**; Ritika 19, the rest spread with no one above 6.
- Trend: close-out was **72% in June**, Mehra's share of hearings was 15%. After 1 Aug their share climbs to 38% and close-out slides to 61%. The weekly line must show this bend in August.
- WAU for Lawyers: 13 of 28; Mehra only 2 of 9.

## 5. Planted insight 2: AI credits run out on day 19, and a low-trust bulk feature burns half

Credit cost per use: Ask AI 2, case summary 3, file summary 2, translation 4, AI Diligence 10 per case, Codex prompt 2, MIS AI report 10.

October credits (total 6,000, limit reached on **day 19**):

| Feature | Credits | Share | Uses |
|---|---|---|---|
| AI Diligence | 2,760 | 46% | 276 cases, by 3 users (Vikram Joshi 62%) |
| Ask AI | 1,440 | 24% | 720 queries |
| Case summary | 720 | 12% | 240 |
| MIS AI report | 480 | 8% | 48 reports |
| Translation | 240 | 4% | 60 |
| Codex prompts | 180 | 3% | 90 |
| File summary | 180 | 3% | 90 |

- Limit day by month: June not reached (4,420 used), July not reached (5,180), August day 27, September day 22, October day 19, November projected day 18 (2,310 used by 7 Nov).
- Ask AI in October: 40 queries a day before day 19, then 3 blocked attempts a day after (down 93%).
- Adoption and trust, last 30 days, base = 33 active Legal and Lawyer users:

| AI feature | Users | Adoption | Action rate |
|---|---|---|---|
| Ask AI | 22 | 67% | 61% |
| Case summary | 18 | 55% | 72% |
| Codex prompts | 12 | 36% | 24% |
| File summary | 10 | 30% | 58% |
| Translation | 4 | 12% | 81% |
| AI Diligence | 3 | 9% | 17% |

- Regenerate rate 14%, thumbs-down 6%. A model change on 14 Sep pushes thumbs-down from 4% to 7% for two weeks, then it settles at 6%. Mark the change on the chart.
- Summary accuracy (weekly human-graded sample of 50): between 89% and 92%, last 4 weeks average 90.6%.
- Insight follow-through proxy: 7%.

## 6. Planted insight 3: intake is noisy, and Procurement hears late

Last 90 days of intake suggestions:

| Keyword group | Suggested | Reviewed | Accepted (added or mapped) | Precision |
|---|---|---|---|---|
| Company name ("Meridia") | 512 | 290 | 64 | 22% |
| Brand names ("Fresko", "Nuvia", "Kalpa") | 344 | 180 | 32 | 18% |
| Subsidiaries (by CIN) | 188 | 98 | 54 | 55% |
| Directors' names | 96 | 70 | 48 | 69% |
| **Total** | **1,140** | **638** | **198** (162 added, 36 mapped) | **31%** |

- Deleted 440. Expired untouched after 90 days 502 (44%).
- Early capture (tracked before first hearing) of the 192 new matters: S&D 40 of 70 (57%), Procurement 17 of 50 (34%), HR 28 of 42 (67%), Finance 15 of 30 (50%). Total 100 of 192 = **52%**.
- Median days from filing to tracked: 23.
- Field completeness of the 192 new matters, when added and at day 14: exposure 3% to 11%, amount claimed 5% to 14%, counsel 41% to 63%, risk rating 2% to 9%, key action 1% to 6%.

## 7. Supporting signals (visible, not the top three)

- **Adoption:** WAU 68 of 150 (45%): Admin 4/4, Legal 20/22, Lawyer 13/28, Business 31/96 (S&D 9, Procurement 4, HR 10, Finance 8).
- **Feature stickiness (DAU/MAU):** My Cases 52%, hearing updates 38%, calendar and My Queue 33%, Ask AI 29%, documents 21%, Insights 9%, research 7%, tasks 6%, Codex 4%, spend 2%.
- **Time to first value (median days):** Admin 1, Legal 2, Business 11, Lawyer 19.
- **Insights reach:** 9 distinct viewers a week (Admin 3, Legal 4, Business from Finance 2). MIS downloads: 64 in October, 48 with an AI report.
- **Alert follow-through (Business users):** HR 52%, S&D 41%, Finance 37%, Procurement 18% (Neha Iyer 12%).
- **Spend capture:** 74 of 412 active matters (18%): S&D 31, Procurement 25, HR 8, Finance 10.
- **Page load p95 (last 7 days):** Insights 6.8 s, Codex 4.1 s, My Cases 2.4 s, case page 1.9 s. Budget 3 s.
- **Rate-limit errors:** 4.1 per 100 sessions on average, 9.7 on Monday mornings (09:00 to 11:00).
- **Court sync freshness (synced in last 24 h):** Supreme Court 99%, High Courts 96%, Tribunals 83%, District courts 71%, Consumer forums 64%. Sync failure rate 6.2%.
- **Zero-result searches:** court search 21%, Codex 9%. Top missed: "Pune labour court order", "Maharashtra RERA complaint", "matters linked to dealer agreement" (Codex). The last one hints at the contract-link feature.

## 8. Event tables to generate

Generate these as JSON under `src/data/` from one script (`scripts/generate.ts`), seeded, and derive every chart from them. No chart may read a hard-coded number.

- `users` (id, name, role, team_id, team_type, seat_since, last_active)
- `teams` (id, name, type: business_unit | counsel_firm | leadership)
- `matters` (id, title, case_type, contract_based, court_type, court, bu, case_manager_id, firm_id, status, filed_on, tracked_on, first_hearing_on, priority, priority_default, fields_set {field: date}, last_activity_on)
- `hearings` (id, matter_id, date, owner_type: inhouse | counsel, firm_id, outcome_recorded_on, updater_id)
- `suggestions` (id, keyword_group, shown_on, state: added | mapped | deleted | expired, triaged_on, triaged_by)
- `ai_events` (id, ts, user_id, feature, credits, action_taken, feedback: none | regenerate | thumbs_down, blocked)
- `sessions` and `feature_use` (user_id, date, feature)
- `alerts` (id, user_id, sent_on, opened_on, case_viewed_on)
- `spend` (matter_id, logged_on, amount)
- `tech` (page_loads p95 by page by day, errors_429 by day, sync_runs by court type by day, searches by surface by day)
- `evals` (week, sample_size, accuracy)

## 9. Consistency checks (write as tests; the build must fail if any fails)

1. Sum of BU active matters = 412; sum of court-type counts = 412.
2. Hearings in the last 30 days = 216; the per-owner table above holds exactly.
3. Close-out computed from `hearings` = 61% org, 51% counsel, 88% in-house, 37% for Ritika.
4. Sum of team WAU = org WAU = 68; seats per role sum to 150.
5. October AI credits sum to 6,000 and the cumulative crossing day is 19.
6. Suggestions: 1,140 / 638 / 198 / 440 / 502 by state; precision per group as above.
7. Early capture 100 of 192; per BU as above.
8. Every user-view number, summed over the team's users, equals the team view; every team view summed equals the org view.
9. The three insight cards on the org view read their numbers from the same selectors as the charts.
