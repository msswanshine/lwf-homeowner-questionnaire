🔥
**FireWise Landscape Planner**
Project Specification Document
For AI Coding Agent — MVP Build

| React / Next.js | Client-Side MVP | Tailwind CSS | Pacific Northwest | Open Source |
| --- | --- | --- | --- | --- |

# **1. Project Overview**
FireWise Landscape Planner is an open-source, client-side web application that guides Pacific Northwest homeowners through a structured questionnaire and generates a personalized, fire-resistant plant list and action plan by querying an existing plant database API.
The project is community-minded: it is designed to be forked, extended, and eventually adopted at the neighborhood and HOA level. The MVP, however, is intentionally scoped to the core solo-homeowner flow only.

| Status | Greenfield — GitHub repository already created |
| --- | --- |

| Scope | MVP — questionnaire → plant list → action plan |
| --- | --- |

| Business Model | Open Source (no monetisation in MVP) |
| --- | --- |

| Target Region | Pacific Northwest (WA, OR, ID) |
| --- | --- |

| Language | English only |
| --- | --- |

| Auth | None required for MVP |
| --- | --- |

# **2. Goals & Success Criteria**
## **2.1 Primary Goal**
Make the existing plant database easy and accessible for homeowners with zero botanical knowledge, by routing them through a friendly questionnaire that surfaces the right plants for their specific property, priorities, and constraints.
## **2.2 Success Criteria for MVP**
- **A homeowner with no prior knowledge can complete the full flow (questionnaire → results) in under 10 minutes.**
- **The plant list returned is visibly filtered and ranked based on questionnaire answers.**
- **The action plan is sequential, practical, and specific to the homeowner's inputs.**
- **The app works correctly on both mobile (375px+) and desktop (1280px+) viewports.**
- **No backend server is required to run the app — it operates entirely client-side.**
- **The codebase is clean, well-commented, and structured for future community contributors.**
# **3. Technical Stack**
## **3.1 Core Framework**

| Framework | Next.js (React) — App Router preferred |
| --- | --- |

| Styling | Tailwind CSS — utility-first, no custom CSS files |
| --- | --- |

| Language | TypeScript — strict mode enabled |
| --- | --- |

| Package Manager | npm |
| --- | --- |

| Deployment Target | Vercel (agent should include vercel.json if needed) |
| --- | --- |

## **3.2 Architecture Decisions**
The app is fully client-side for MVP. All API calls to the plant database are made directly from the browser. There is no server, no database, and no authentication layer in this version.
State is managed via React state and optionally persisted to localStorage so a homeowner can resume an incomplete questionnaire. Design data models carefully — they must be forward-compatible with a future backend (e.g. Supabase) without requiring a full rewrite.
## **3.3 Key Libraries (Recommended)**
- **react-hook-form — questionnaire form state management**
- **zod — schema validation for questionnaire answers**
- **@react-pdf/renderer or jspdf — PDF report generation**
- **lucide-react — icons**
- **clsx / tailwind-merge — conditional class handling**
# **4. Plant Database API**
## **4.1 API Details**

| Base URL | https://lwf-api.vercel.app/ |
| --- | --- |

| Auth | None indicated — verify on first request |
| --- | --- |

| Docs | Agent must fetch https://lwf-api.vercel.app/ on init to read API documentation and available endpoints |
| --- | --- |

## **4.2 Integration Requirements**
- **On app load, the agent should verify the API is reachable and document its available endpoints.**
- **Build a dedicated API service module (e.g. /lib/plantApi.ts) — all API calls go through this module, never directly from components.**
- **Implement graceful error handling: if the API is unreachable, show a user-friendly message and do not crash the app.**
- **Cache API responses in memory (or sessionStorage) during a session to avoid redundant calls.**
- **The filtering logic that matches questionnaire answers to plants should live in a dedicated utility (e.g. /lib/filterPlants.ts), not inline in components. This keeps it testable and easy to tune.**
# **5. User Flow**
The MVP has a single, linear flow with no branching authentication paths:

| Step | Screen / State | Description |
| --- | --- | --- |
| 1 | Landing / Welcome | Brief intro to the app's purpose. CTA: 'Start My Plant Plan'. Optionally restore previous session from localStorage. |
| 2 | Questionnaire | Multi-step form (see Section 6). Progress indicator shown throughout. Answers stored in React state. |
| 3 | Processing | Brief loading state while the app queries the plant API and runs the filtering algorithm. |
| 4 | Plant List | Filtered, ranked list of recommended fire-resistant plants with descriptions, images (if available), and fire-resistance rating. |
| 5 | Action Plan | Phased, prioritised to-do plan generated from questionnaire answers and plant selections. |
| 6 | PDF Export | Download a compiled PDF report containing plant list, action plan, property details summary, and maintenance calendar. |

# **6. Questionnaire — Detailed Specification**
The questionnaire is the core of the app. It should feel friendly and conversational — not like a government form. Use plain language, helper text, and visual cues. Display one section at a time with a visible step progress bar (e.g. 'Step 2 of 7').
## **6.1 Section 1 — Property Basics**
- **Property size (approximate square footage or lot size)**
- Input: dropdown or slider — Small (<0.25 acre), Medium (0.25–0.5 acre), Large (0.5–1 acre), Very Large (1+ acre)
- **Climate zone / region**
- Input: dropdown pre-filtered to Pacific Northwest zones (USDA zones 5–9)
- Helper text: 'Not sure? Enter your zip code and we'll look it up.'
- **Proximity to structures — Defensible space zones**
- Input: multi-select — Zone 0 (0–5ft from home), Zone 1 (5–30ft), Zone 2 (30–100ft)
- Helper text: brief diagram or illustration explaining the zones
## **6.2 Section 2 — Water & Resources**
- **Water availability / irrigation setup**
- Input: single select — No irrigation (rain-fed only), Drip irrigation, Sprinkler system, Greywater available
- **Water use preference**
- Input: single select — Drought-tolerant only, Low water, Moderate water OK
## **6.3 Section 3 — Maintenance Capacity**
- **Time available for garden maintenance**
- Input: single select — Very low (<1 hr/month), Low (1–2 hrs/month), Moderate (2–4 hrs/month), High (4+ hrs/month)
- **Physical ability / accessibility needs**
- Input: single select — No restrictions, Prefer low-height work, Prefer minimal bending/kneeling
## **6.4 Section 4 — Budget**
- **Total planting budget**
- Input: dropdown — Under $500, $500–$1,000, $1,000–$2,500, $2,500–$5,000, $5,000+
- **Preferred plant sourcing**
- Input: multi-select — Native plant nursery, Big box store, Propagate/seed myself, Community plant swap
## **6.5 Section 5 — Aesthetic Preferences**
- **Desired aesthetic**
- Input: multi-select with image previews if possible — Naturalistic/wild, Structured/formal, Cottage garden, Minimalist/gravel garden
- **Colour preferences**
- Input: multi-select — Greens/foliage only, Warm tones (reds/oranges), Cool tones (blues/purples), White/neutral, No preference
- **Desired seasonal interest**
- Input: multi-select — Spring bloom, Summer colour, Autumn foliage, Winter structure
## **6.6 Section 6 — Existing Plants**
- **Do you have existing plants you want to keep?**
- Input: yes/no toggle. If yes → open text field to describe them (name or description). Mark these as 'existing' in output so recommendations complement them.
- **Are there plants you want to remove?**
- Input: yes/no toggle. If yes → open text field. Flag these in action plan as 'Phase 0: Remove first'.
## **6.7 Section 7 — Risk & Priority**
- **Perceived local fire risk level**
- Input: single select — Low, Moderate, High, Extreme
- Helper text: 'You can check your risk level at Oregon/Washington state fire authority websites.'
- **Top priority for this project**
- Input: rank-order drag (or single select if drag too complex) — Fire safety first, Aesthetics first, Low maintenance first, Water conservation first, Budget first
## **6.8 Questionnaire UX Requirements**
- **Each section on its own 'page' with Back / Next navigation.**
- **Progress bar at top: 'Step X of 7'.**
- **All answers saved to React state as user progresses; persist to localStorage on each step change.**
- **Validate required fields before allowing Next — show inline error messages, not alerts.**
- **Final step shows a summary of answers before submission with an Edit button per section.**
- **'Start Over' button available throughout that clears state and localStorage.**
# **7. Plant List Output**
## **7.1 Filtering Logic**
After the questionnaire is complete, the app must query the plant API and apply the following filters based on user answers. All filtering logic must live in /lib/filterPlants.ts.
- **Climate zone compatibility — only show plants rated for the user's USDA zone.**
- **Water use — filter by drought tolerance or water requirement matching the user's selection.**
- **Maintenance level — filter or down-rank high-maintenance plants for low-maintenance users.**
- **Fire resistance — always prioritise plants with high fire-resistance ratings (this is non-negotiable — the primary purpose of the app).**
- **Defensible space zone suitability — match plants to the correct defensible space zone (e.g. ground covers for Zone 0, shrubs for Zone 1).**
- **Aesthetic match — prefer plants matching colour and form preferences.**
- **Budget — optionally flag plants as 'budget-friendly' vs 'investment'.**
## **7.2 Plant Card UI**
Each plant in the list should display as a card containing:
- **Plant common name (large) + botanical name (small, italic)**
- **Fire resistance rating — displayed prominently as a badge (e.g. High / Medium / Low)**
- **Recommended defensible space zone(s)**
- **Water use rating**
- **Maintenance level**
- **Brief description (2–3 sentences from the API)**
- **Plant image (if provided by API; fallback to illustrated placeholder)**
- **A 'Learn More' expandable section for full details**
## **7.3 Sorting & Display**
- **Default sort: Fire resistance (highest first), then aesthetic match score.**
- **User can re-sort by: Water use, Maintenance, Alphabetical.**
- **Show total count: 'X plants recommended for your property'.**
- **Group plants by Defensible Space Zone (Zone 0, Zone 1, Zone 2) with collapsible sections.**
# **8. Action Plan Output**
The action plan is a phased, sequential to-do list generated from the combination of questionnaire answers and the recommended plant list. It should feel like advice from a knowledgeable friend, not a corporate manual.
## **8.1 Phase Structure**
- **Phase 0 — Remove hazards: List any plants the user identified for removal. Frame as urgent if they indicated high/extreme fire risk.**
- **Phase 1 — Zone 0 (Immediate surrounds, 0–5ft): Non-combustible ground covers, hardscaping recommendations. Plants for this zone from the list.**
- **Phase 2 — Zone 1 (5–30ft): Key shrubs and perennials. Sequence based on budget (cheapest/easiest first if budget is low).**
- **Phase 3 — Zone 2 (30–100ft): Larger plants and trees. Long-term plantings.**
- **Phase 4 — Ongoing maintenance: Seasonal tasks, watering schedule summary, annual review reminder.**
## **8.2 Action Plan UX**
- **Each phase displayed as an accordion or timeline component.**
- **Each task has a checkbox (state stored in localStorage) so homeowners can track progress.**
- **Phase 0 and Phase 1 are expanded by default; later phases collapsed.**
- **Estimated cost range shown per phase based on budget input.**
# **9. PDF Export**
The PDF is generated entirely client-side. It should be clean, printable, and professional — something a homeowner could hand to a landscaper.
- **Cover page: property summary, date generated, app name and URL.**
- **Section 1: Plant List grouped by defensible space zone with plant details.**
- **Section 2: Phased Action Plan.**
- **Section 3: Maintenance Calendar — a simple month-by-month table of key tasks derived from selected plants' seasonal needs.**
- **Section 4: Resources — links to Pacific Northwest fire safety resources, native plant nurseries.**
- **Download button labeled 'Download My Plant Plan (PDF)' — prominent on both Plant List and Action Plan screens.**
# **10. Page & Component Architecture**
## **10.1 Pages (Next.js App Router)**
- **/  — Landing page**
- **/questionnaire  — Multi-step questionnaire (all steps managed here via state)**
- **/results  — Plant list output**
- **/action-plan  — Phased action plan**
- **/about  — Brief about page explaining the open source project**
## **10.2 Key Components**
- **QuestionnaireShell — wrapper with progress bar and nav buttons**
- **StepOne through StepSeven — individual questionnaire step components**
- **AnswerSummary — review screen before final submission**
- **PlantCard — individual plant display card**
- **PlantList — filtered, sorted list of PlantCards grouped by zone**
- **ActionPlan — phased accordion component**
- **PdfExportButton — triggers client-side PDF generation**
- **ProgressBar — step progress indicator**
## **10.3 Data & Utility Modules**
- **/lib/plantApi.ts — all API calls to https://lwf-api.vercel.app/**
- **/lib/filterPlants.ts — filtering and scoring logic**
- **/lib/generateActionPlan.ts — generates action plan from answers + plant list**
- **/lib/generatePdf.ts — PDF generation logic**
- **/lib/localStorage.ts — save/restore questionnaire state**
- **/types/index.ts — all TypeScript interfaces (QuestionnaireAnswers, Plant, ActionPhase, etc.)**
# **11. Responsive Design Requirements**
The app must be fully functional on both mobile and desktop. Design mobile-first using Tailwind breakpoints.
- **Mobile (375px–767px): single column, full-width cards, large touch targets (44px min), bottom-sticky nav buttons on questionnaire.**
- **Tablet (768px–1023px): 2-column plant grid, side-by-side layout where appropriate.**
- **Desktop (1024px+): 3-column plant grid, sidebar navigation on results page.**
- **All interactive elements must have visible focus states for accessibility (keyboard navigation).**
- **Minimum contrast ratio: 4.5:1 for all text (WCAG AA).**
# **12. Out of Scope for MVP**
The following features are explicitly excluded from the MVP build. The agent must not build these, but should structure the code so they can be added later without major refactoring:
- **User accounts / authentication**
- **Community / HOA / neighborhood shared views**
- **Admin roles or dashboards**
- **Backend server or database**
- **Map / satellite view of property**
- **Integration with fire perimeter data (Cal Fire, USFS)**
- **Weather or drought data feeds**
- **Cost estimation engine (use simple budget-tier labels only)**
- **Multi-language support**
- **Native mobile app**
# **13. Future Roadmap (Post-MVP Reference)**
These features are planned for future versions. The agent should be aware of them to avoid architectural decisions that would block them later:
- **Phase 2: User accounts (Supabase auth), saved plans, multiple property profiles.**
- **Phase 3: Neighborhood / HOA layer — shared community map, role-based access, aggregate plant adoption stats.**
- **Phase 4: Integration with satellite imagery to visualise plant placement on actual property layout.**
- **Phase 5: Fire perimeter and weather data overlays, real-time risk scoring.**
- **Phase 6: Community plant swap marketplace, nursery locator.**
# **14. Coding Standards & Agent Instructions**
## **14.1 General**
- **Use TypeScript strict mode throughout. No 'any' types.**
- **All components must be functional components with typed props.**
- **Co-locate component styles with components using Tailwind classes only — no external CSS files except globals.css for resets.**
- **Use Next.js App Router conventions — no Pages Router patterns.**
## **14.2 File Structure**
- **Follow Next.js 14+ App Router conventions: /app, /components, /lib, /types, /public.**
- **Group components by feature, not by type (e.g. /components/questionnaire/, /components/results/).**
- **Keep files under 200 lines where possible — split into sub-components if larger.**
## **14.3 README Requirements**
The agent must produce a comprehensive README.md containing:
- **Project description and purpose**
- **Local development setup (npm install, npm run dev)**
- **Environment variables required (if any)**
- **Plant API documentation summary and link**
- **How to contribute (open source guidance)**
- **Architecture overview with diagram or description**
- **Roadmap reference**
## **14.4 Comments & Documentation**
- **Every function in /lib/ must have a JSDoc comment explaining its purpose, parameters, and return value.**
- **Complex filtering logic must include inline comments explaining the scoring rationale.**
- **Leave // TODO: [Phase 2] comments at extension points for future backend integration.**
# **15. Agent Kickoff Checklist**
Before writing application code, the agent must complete the following steps in order:
- Fetch and read https://lwf-api.vercel.app/ to understand all available endpoints, data shapes, and query parameters.
- Define all TypeScript interfaces in /types/index.ts based on API response shapes before writing any components.
- Build /lib/plantApi.ts and verify API connectivity with a test call.
- Scaffold the Next.js app with all pages, shell components, and routing before filling in logic.
- Build the questionnaire flow end-to-end with localStorage persistence.
- Build filterPlants.ts and test with mock data before connecting to live API.
- Build results page (Plant List) and Action Plan page.
- Implement PDF export.
- Responsive QA: test at 375px, 768px, and 1280px breakpoints.
- Write README.md.
*Document prepared: March 2026*
*This specification is the single source of truth for the MVP build. Any ambiguities should be resolved by defaulting to the simplest implementation that satisfies the stated goal.*
