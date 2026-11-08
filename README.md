# Litigation PM Pulse

Product analytics dashboard for Legistify Litigation Management, on a made-up sample account (Meridia Consumer Industries Ltd). Built from the pack in `docs/`.

- **Data:** `scripts/generate.ts` writes every table to `src/data/*.json`, seeded and allocation-based, so org, team and user views add up.
- **Numbers:** every chart and the three signal cards read through `src/lib/selectors.ts`.
- **Tests:** `tests/consistency.test.ts` covers the nine consistency checks in `docs/03-data-spec.md` and every sample value in the metric dictionary. `npm run build` fails if any test fails.
- **Stack:** Vite 8, React 19, TypeScript, Tailwind CSS 4, Recharts 3, Motion, cmdk.

```bash
npm install
npm run dev     # local
npm run build   # generate data, run tests, build to dist/
```

Routes: `#/org`, `#/team/<id>` (e.g. `sales-distribution`, `firm-mehra`), `#/user/<id>` (e.g. `ritika-sharma`), `#/dictionary`, `#/about`.

Deploys as a Cloudflare Worker with static assets (`wrangler.jsonc`).
