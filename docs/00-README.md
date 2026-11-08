# Litigation PM Pulse: build pack for Claude Code

This folder is everything Claude Code needs to build the Legistify Litigation PM dashboard.

| File | What it is |
|---|---|
| `01-product-map.md` | The module: personas, case lifecycle, features, where AI shows up |
| `02-metric-dictionary.md` | Every metric and chart with its rationale, formula, events, refresh and alert |
| `metrics.json` | The same dictionary as data. The app reads captions, flip panels and the Dictionary page from it |
| `03-data-spec.md` | The made-up account, every number it must show, and the consistency tests |
| `04-build-brief.md` | Views, drill-down, rationale UI, visual direction, motion, build order, acceptance checklist |
| `05-event-tracking-plan.md` | Event names and properties behind each metric (bonus deliverable, also shown on the About page) |

## How to start

1. Make an empty folder, put these files in a `docs/` subfolder, and open Claude Code in the folder.
2. Paste this as the first message:

> Read every file in `docs/` fully before writing code. Build the dashboard described in `docs/04-build-brief.md`, using the data in `docs/03-data-spec.md` and the metrics in `docs/metrics.json`. Follow the build order in section 8 of the brief. Start with the data generator and the consistency tests, and do not move on until they all pass. Show me your plan first, then build. After each view is done, take screenshots at 1440 px and 390 px and fix what looks off. The finished site must be a public link with no login.

3. Review the plan it shows you. Push back on anything that drops a metric, a drill path or a rationale panel.
4. After it deploys, open the link in a private window and click: a signal card's "Drill in", a business unit bar, a person in the members table, the breadcrumb back to the org, and an "i" button on any chart.
