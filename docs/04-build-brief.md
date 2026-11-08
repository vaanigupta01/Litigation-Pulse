# Build brief: Litigation PM Pulse

Build the product analytics dashboard a Legistify PM opens every morning for the **Litigation Management** module. It must have an organisation view and a user view with a drill path between them, show business and technical signals, give a rationale for every chart, and surface three clear insights within 60 seconds.

Read these first: `01-product-map.md` (the module), `02-metric-dictionary.md` and `metrics.json` (every metric and its rationale), `03-data-spec.md` (the made-up account and every number it must show).

## 1. Who uses this dashboard

The **PM** is the user. Founders, engineers and customer success read it too:

- Founders read Pulse and the three signals.
- Engineers read Platform health and AI behaviour.
- Customer success reads the team and user views to find at-risk accounts and people.

The people *inside* the data (GC, litigation managers, business users, counsel) are the subjects being measured, not the readers. Write every label for a reader who has never seen Legistify.

## 2. Stack and hosting

- Vite + React + TypeScript, Tailwind CSS, Recharts (custom-styled) for charts, Framer Motion for view transitions, `cmdk` for the jump-to search.
- All data is generated at build time by `scripts/generate.ts` into `src/data/*.json`, following `03-data-spec.md`. Every chart computes from these tables through shared selectors in `src/lib/selectors.ts`. No hard-coded chart numbers.
- Vitest tests for the consistency checks in section 9 of the data spec. The build fails if a check fails.
- Deploy as a static site on Cloudflare Pages (or Vercel). **Public link, no login, no gate, no cookie wall.** Test the link in a private window before handing it over.
- Hash routing so every view has a shareable link and the browser back button works: `#/org`, `#/team/sales-distribution`, `#/team/firm-mehra`, `#/user/ritika-sharma`, `#/dictionary`, `#/about`.

## 3. Information architecture

### Global top bar (sticky, every view)

- Left: wordmark "Litigation · PM Pulse" and a small "Legistify sample" tag.
- Centre: **breadcrumb** that is also the drill path: `Meridia Consumer Industries › Sales & Distribution › Ritika Sharma`. Each crumb is clickable.
- Right: period selector (30 / 90 / 180 days), lens filter (All · Business · Technical & AI), "Jump to…" search (⌘K or /) listing every team and user, and links to Dictionary and About.
- A thin line under the bar shows "Sample data · as of 8 Nov 2026, 06:00 IST · refreshed daily".

### Organisation view (`#/org`), one scroll, in this order

1. **Today's three signals**: three large insight cards, side by side. Each has a one-line headline with the number, a mini chart, and two actions: "Show me" (smooth-scrolls to the source chart and pulses its border) and "Drill in" (opens the team or user view). Headlines:
   - "Mehra & Associates closes only 29% of hearings on time and carries 38% of them"
   - "AI credits ran out on day 19; AI Diligence used 46% of them with a 17% action rate"
   - "69% of reviewed intake suggestions are false matches; Procurement tracks only 34% of cases before the first hearing"
2. **Pulse**: five KPI tiles (M01 to M05). Each shows the value, change against the previous period, a 26-week sparkline and a status pill (on track, watch, act). M01 is visually larger: it is the north star.
3. Then one section per lifecycle stage, each with a sticky section nav on the left (desktop) or a horizontal chip row (mobile): **Adoption, Intake, Enrich and staff, Hearing loop, AI behaviour, Value, Platform health**. Each section opens with a single sentence saying why the section exists (take `purpose` from `metrics.json`).
4. A **Teams** table at the end: the 4 business units and 5 counsel firms as rows, with key rates (M01, M02, M10, M11, M22) as columns, sortable, with inline bars. Clicking a row opens that team.

### Team view (`#/team/:id`)

- Header: team name, type (business unit or counsel firm), member count, and the same five Pulse tiles filtered to the team, each with an "org average" tick.
- The charts from the org view that make sense for the team (see `views` in `metrics.json`), filtered.
- **Members table**: name, role, matters owned, close-out rate, hearings awaiting update, last active, AI actions. Sortable, with a row click to the user view.
- For a counsel firm: hearings by owning BU, update lag distribution, and the list of their lawyers.

### User view (`#/user/:id`)

- Profile card: name, platform role (Admin, Legal, Business, Lawyer), team, seat since, last active, and a plain-language line about what this role does on Legistify.
- KPI strip: matters owned, hearings in period, close-out rate, hearings awaiting update, AI actions. Each has a team-median tick (U03).
- **U01 activity heatmap** (day × hour, last 8 weeks), **U02 recent activity timeline** (last 20 events, in plain words: "Recorded outcome for hearing on 4 Nov in Meridia v. Sharma Traders").
- Their list of hearings awaiting update (for Legal users) or assigned cases (for Lawyers), with how many days each is overdue.
- AI usage by feature for this person, with action rate.

### Drill-down rules

- Any chart grouped by business unit, firm or person is clickable at the mark: bar, bubble or row. The cursor and hover state make this obvious, and the tooltip ends with "Click to open".
- Org → team → user, and back with the breadcrumb, the browser back button or Esc.
- Filters (period, lens) carry across views.
- The default user when someone opens the user view from the top bar is Ritika Sharma (the bottleneck).

### Dictionary (`#/dictionary`) and About (`#/about`)

- Dictionary renders `metrics.json` as a searchable, filterable table (section, tier, lens). Each row expands to the full rationale. Each chart's "i" panel links to its row.
- About explains in 6 short lines: who the dashboard is for, the sample account, how the data was made, how to read tiers, and the AI tools used (Claude Code for the build, Claude for research and writing). The brief asks candidates to disclose this.

## 4. Rationale on every chart (brief requirement)

Every chart card has:

- **Title** = metric name, and a **one-line caption** under it = the `question` from `metrics.json`.
- Top-right **"i" button** that flips the card (3D flip, 300 ms) to show four short blocks: *Question it answers*, *Why it matters*, *If it moves, we would…*, *Why this chart*, plus Definition, Refresh and a "Full entry in dictionary" link. Flip back with the same button or Esc.
- Bottom-left **tier chip** (North star, Decision, Guardrail, Diagnostic) and **lens chip** (Business, Tech, AI).
- Bottom-right: "Updated daily" (or the metric's refresh).

## 5. Visual direction

Super premium, ultra modern, chic. Colourful but sophisticated: colour carries meaning (lifecycle stage), never decoration. Think of a well-made fintech or design-tool analytics product, not a default admin template.

**Tokens (light theme first, dark theme as a toggle in the top bar):**

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #F6F6FA | #0E0F14 | Page background, a faint cool porcelain |
| surface | #FFFFFF | #16171F | Cards |
| ink | #14151F | #ECEDF3 | Primary text |
| muted | #6B6E80 | #9A9DB0 | Secondary text, axes |
| hairline | #E6E7EF | #262836 | Borders, gridlines |
| intake | #4F5BD5 | #8B93F0 | Intake section and its charts |
| enrich | #0E9C8E | #4FD1C1 | Enrich and staff |
| hearing | #EF5B3F | #FF8A70 | Hearing loop (the north star's colour) |
| ai | #8B5CF6 | #B79BFF | AI behaviour |
| value | #D9931F | #F2BC5C | Value and spend |
| health | #3E7CB1 | #7DB3E0 | Platform health |
| adoption | #C2417E | #EE7DB0 | Adoption |
| good / watch / act | #1E9E6A / #E08A1E / #D64545 | lighter tints in dark | Status pills only |

- **Type:** Geist for UI and numbers (tight tracking, tabular numerals), Instrument Serif for section titles and the three signal headlines (a touch of editorial chic), Geist Mono for IDs, formulas and timestamps. Load from Fontsource or Google Fonts.
- **Scale:** KPI numbers 40 px (north star 56 px), section titles 28 px serif, card titles 15 px semibold, captions 13 px muted.
- **Cards:** 16 px radius, 1 px hairline border, very soft shadow (0 1px 2px plus 0 8px 24px at 4% opacity). No border-left accent bars. Generous padding (20 to 24 px), 16 px grid gap.
- **Section accents:** each section title gets a small dot in its stage colour, and that section's charts use its stage colour as the focus colour. Everything not in focus is grey (`muted` at 35%).
- **Charts:** 1.75 px lines, rounded 4 px bar ends, dotted horizontal gridlines only, no chart borders. Direct labels at line ends instead of legends wherever possible. Targets and limits as dashed rules with a small label. Tooltips are frosted glass (backdrop blur 12 px, surface at 80%).
- **Header flourish:** one subtle multi-colour mesh gradient behind the three signal cards only, built from the stage colours at about 8% opacity. Nowhere else.
- **Avoid:** emoji, neon, gradients on every card, pie charts, 3D charts, dense legends, all-caps paragraphs.

## 6. Motion and transitions

The view changes must feel natural and light:

- Use Framer Motion `AnimatePresence` for route changes: the outgoing view fades and moves 8 px up (160 ms), the incoming fades in and settles from 8 px below (220 ms, ease-out).
- **Shared-element drill:** when a bar or row is clicked, the team or user name morphs into the breadcrumb and the page header (`layoutId`), so the user sees where they went.
- Remember the scroll position per view, so going back lands where they were.
- Charts animate their marks once on first view (300 ms), not on every re-render.
- The "Show me" action smooth-scrolls and pulses the target card's border twice in its stage colour.
- Respect `prefers-reduced-motion`: swap all of this for instant changes.

## 7. Responsiveness and accessibility

- Desktop first (1440 px), clean at 1280 px, usable on a phone (single column, section chips instead of the side nav).
- Keyboard: Tab through cards, Enter opens drill targets, Esc goes up a level, ⌘K or / opens search.
- Colour is never the only signal: status pills carry words, lines carry direct labels.
- Contrast AA in both themes.

## 8. Build order

1. Data generator, selectors and the consistency tests. Run the tests until all pass.
2. App shell: top bar, breadcrumb, routing, transitions, theme toggle.
3. Org view: signals, Pulse, then sections in order. Chart card component with the flip rationale first, and reuse it everywhere.
4. Team view and user view, then the drill interactions.
5. Dictionary and About.
6. Polish pass: take screenshots of each view at 1440 px and 390 px, fix anything clipped, misaligned or unreadable.
7. Deploy and test the public link in a private window.

## 9. Acceptance checklist (mapped to how Legistify evaluates)

| Criterion (weight) | Done when |
|---|---|
| Product understanding (20%) | Sections follow the case lifecycle from the product map. Roles use Legistify's own names (Admin, Legal, Business, Lawyer). Labels use the product's terms: New Cases, My Cases, Insights, Ask AI, AI Diligence, Codex. |
| Metric selection and depth (20%) | All 27 metrics from `metrics.json` appear, business and technical lenses both visible, no vanity counts as headline numbers. |
| Quality of rationale (15%) | Every chart has a caption and a flip panel with question, why, decision and why this chart. |
| Org vs user design (10%) | Org, team and user views are clearly different pages, drilling works from every grouped chart, the breadcrumb always shows where you are. |
| Data storytelling (10%) | The three signals are readable in under 60 seconds. All consistency tests pass. |
| Insights to decisions (15%) | Each signal card links to its evidence, and its "Drill in" opens the team or person behind it. |
| Visual clarity and polish (10%) | Matches section 5. One focus colour per chart, everything else quiet. Nothing clipped at 1280 px or 390 px. |

Red flags to check before shipping: any number that differs between two views, any chart without a caption or rationale, any chart that does not lead to a decision.
