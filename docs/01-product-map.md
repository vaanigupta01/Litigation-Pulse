# Product map: Legistify Litigation Management

The core object is the **case**. The system finds it in court records, a litigation manager triages and enriches it, and it is then worked hearing by hearing until it is disposed. Insights for leadership sit on top and are only as good as the data people add along the way.

## Who uses it (platform roles in brackets)

| Persona | Role | Job | Uses | Rhythm |
|---|---|---|---|---|
| Head of Legal / GC | Admin | Know exposure, provisioning and team load | Insights dashboards, Excel reports, Codex prompts | Weekly |
| Litigation manager | Legal | Run each case: triage, assign counsel, track hearings, record outcomes | New Cases, My Cases, bulk actions, calendar, My Queue, Ask AI | Daily, main data source |
| Business stakeholder | Business | Sales, procurement, HR or finance staff following cases in their unit | Email alerts, followed cases, summaries | When alerted |
| External counsel | Lawyer | Argue the case, report outcomes, upload orders, bill fees | Assigned cases, tasks, documents, case spends | Around each hearing |
| Legal ops / admin | Admin | Configure so the right cases reach the right people | Saved keywords, labels, queue workflow, user roles | Setup, then monthly |

The litigation manager creates most of the data; the GC and business users consume it.

## Lifecycle and key features

1. **Intake.** New filings that name the company are suggested automatically (Add Case: Newly Filed Against / By), often before the summons. Court record search (29 Cr records) and manual add. Alerts.
2. **Triage.** Add to tracker, map to an existing case, or delete. Suggestions expire after 90 days. Ask AI on a suggestion.
3. **Enrich and staff.** Priority, risk rating, amount claimed, exposure, labels, case manager, counsel, followers, tasks (bulk). AI Diligence in bulk.
4. **Hearing loop** (repeats; 9.8 hearings per case and a 78-day gap in the demo). Next hearing date, stage and orders sync from court. Hearing status (Today, Upcoming, Overdue, Not assigned). Record the outcome, calendar, My Queue, documents, research. Ask AI, summaries, translation.
5. **Spend.** Case spends, budgets, invoices, counsel budget. Feeds the Financials tab.
6. **Close.** Disposed when the final order syncs. Archive and restore.

**Used across every stage:** Insights dashboards (Command Center, Hearings, Financials, Geography, Team & Counsel; AI insight under each chart), MIS reports with an emailed AI analysis report, Codex search-bar prompts, alerts and role-based access.

## Where AI shows up

- In the work: Ask AI (agentic case Q&A), AI Diligence, case and document summaries, translation.
- In research: summaries and translations of judgments, case law and bare acts.
- In the portfolio view: text insight under each chart, AI analysis report with MIS downloads, Codex prompts.
- Platform: Codex workspace (projects, skills, connectors, vault, monitor agent, model picker). AI draws on credits with a monthly limit.
- Gap: intake suggestions appear to use plain keyword matching.

## What the demo reveals

- 0 to 8% of cases have risk rating, amount claimed, exposure or counsel set, so Financials and Team & Counsel describe about 1 case in 20.
- 99.7% of cases are High Priority.
- The keyword "apple" also suggests Green Apple and Apple Tree Education.
- One case manager holds all 1.2K cases.
- The monthly AI limit was reached; "Rate limit exceeded" kept appearing.
- Invoice Health shows ₹12.3 Lac paid and ₹9.9 Lac due but counts 0 invoices.
