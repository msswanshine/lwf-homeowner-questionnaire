# AGENTS.md — guidance for AI assistants and contributors

Short reference for working in this repo. Full product intent lives in [`docs/FireWise_Landscape_Planner_Spec.md`](docs/FireWise_Landscape_Planner_Spec.md); onboarding for humans is in [`README.md`](README.md).

## What this project is

- **FireWise Landscape Planner** — Next.js app: questionnaire → plant recommendations (from the Living with Fire catalog) → printable results and a phased action plan.
- **No server database** for end users: questionnaire answers and optional cached results live in **browser `localStorage`**.
- **Plant data** always comes from the **LWF HTTP API** (see [`src/lib/plantApi.ts`](src/lib/plantApi.ts)).

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # typecheck + production bundle
npm run lint
npm start        # serve after build
```

## Architecture (where to edit what)

| Area | Location |
| --- | --- |
| Pages / routes | `src/app/` (`/`, `/questionnaire`, `/results`, `/action-plan`, `/about`) |
| UI | `src/components/` (questionnaire, results, action-plan, layout, home) |
| LWF API gateway | `src/lib/plantApi.ts` — **all** `fetch` calls to the plant API should go here |
| Planner bundle (server) | `src/app/api/planner-catalog/route.ts` — aggregates catalog for the client; cached ~1h |
| Scoring & sort | `src/lib/filterPlants.ts` |
| Client fetch of bundle | `src/lib/plannerData.ts` → `GET /api/planner-catalog` |
| Answers + migration | `src/lib/questionnaireState.ts`, `src/lib/localStorage.ts` |
| Action plan copy/logic | `src/lib/generateActionPlan.ts` |
| Shared types | `src/types/index.ts` |
| PNW ZIP → USDA (approximate) | `src/data/pnw-zip-prefix-to-usda-zone.json` |

## Plant API rules

1. **Do not** call the LWF base URL from React components; use **`plannerData`** (bundled catalog) or extend **`plantApi`** if you need new server-side access.
2. **Catalog load path:** `loadPlantsForPlanning` lists plants, then loads values via **`GET /values/bulk?plantIds=…&resolve=true`** (see `plantApi.ts`) instead of one request per plant.
3. **Attribute matching** in scoring/UI uses **`attributeName` strings** aligned with [plant-fields.json](https://lwf-api.vercel.app/plant-fields.json) (e.g. `Hardiness Zone`, `Character Score`, `Min Mature Height`).
4. **Env:** `NEXT_PUBLIC_PLANT_API_BASE` overrides the default `https://lwf-api.vercel.app/api/v2`.

## localStorage

- Keys are versioned (e.g. `fw.questionnaire.results.v7`). If you change **`ScoredPlant`** or cached payload shape, **bump the key** in `src/lib/localStorage.ts` so stale JSON does not break the UI.

## Project conventions (please follow)

- **Scope:** Fix only what the task needs; avoid drive-by refactors and unrelated files.
- **Markdown:** Do not add or edit `.md` files unless the user asked (this file and the spec/README are exceptions maintained deliberately).
- **Accessibility:** Follow [`.cursor/rules/client-accessibility.mdc`](.cursor/rules/client-accessibility.mdc) for interactive UI.
- **Layering / quality:** Additional conventions live under [`.cursor/rules/`](.cursor/rules/) when relevant.

## Verification

- After substantive changes, run **`npm run build`** (TypeScript is part of the build).
- Use **`npm run lint`** when touching components or libs.
