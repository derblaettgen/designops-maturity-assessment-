# CLAUDE.md – DesignOps Maturity Survey

## Project Context

DesignOps Maturity Survey for the DACH region. Measures the DesignOps maturity level of an organization across 8 dimensions — with benchmark comparison and ROI analysis.

Standalone React + Vite + TypeScript app. Builds to a static `dist/` for iframe embedding (e.g. inside an Astro page). Backend API at `https://designops-maturity.de/api/v1` (Express + MongoDB).

The survey scope is frozen: only `survey.config.json` changes from year to year. Maintenance is limited to JSON edits and small component changes.

---

## Architecture

```
├── index.html                   # Vite entry, minimal shell
├── vite.config.ts
├── tsconfig.json
├── package.json
├── survey.config.json           # Single source of truth, imported as a module
└── src/
    ├── main.tsx                 # React root + 5 global CSS imports + store persistence wiring
    ├── App.tsx                  # BrowserRouter (basename="/survey"), routes: / and /result/:id
    ├── vite-env.d.ts
    ├── config.ts                # surveyConfig – typed cast of survey.config.json
    ├── styles/                  # Global stylesheets (imported once in main.tsx)
    │   ├── tokens.css           # Design tokens (:root CSS custom properties)
    │   ├── reset.css            # Universal box model + body baseline
    │   ├── animations.css       # Shared @keyframes (slideIn, cardIn, shake, pop)
    │   ├── buttons.css          # .btn + variants (shared atom)
    │   └── badge.css            # .badge + colour variants (shared atom)
    ├── types/
    │   └── survey.ts            # SurveyConfig, Section, Question (discriminated union), AnswerValue, etc.
    ├── store/
    │   └── useSurveyStore.ts    # Zustand: state + actions (init, setAnswer, validate, navigation)
    ├── lib/
    │   ├── scoring.ts           # calculateDimensionScore, getAllDimensionScores, getOverallScore, getDimensionGaps
    │   ├── waste.ts             # extractCosts, wasteMultiplier, calculateWaste
    │   ├── roi.ts               # projectRoi – 3-year ROI projection (ramp + investment ratio)
    │   ├── maturity.ts          # maturityLevelKey, maturityLabel
    │   ├── format.ts            # formatNumber, formatCompact (de-DE)
    │   ├── constants.ts         # LIKERT_MIN/MAX/SCALE, TARGET_MATURITY_LEVEL
    │   ├── storage.ts           # save/load/clear (localStorage), submitToMongoDB, fetchSubmissionById
    │   ├── pdfExport.ts         # exportElementAsPdf – html2canvas + jsPDF via CDN, block-based rendering
    │   └── dashboardPdfRenderer.tsx  # @react-pdf/renderer – alternative native PDF renderer (not primary)
    ├── pages/
    │   ├── SurveyPage.tsx       # Flow: WelcomeScreen → StepView → DashboardView (+ MongoDB submit)
    │   └── ResultPage.tsx       # Loads submission by ID from API, renders DashboardView (precomputed)
    ├── components/              # Each .tsx imports its own colocated .css
    │   ├── SurveyShell.tsx + .css       # Topbar, hero, footer
    │   ├── WelcomeScreen.tsx + .css     # Entry screen with feature highlights and start CTA
    │   ├── ProgressBar.tsx + .css       # Sticky global progress + dots
    │   ├── StepView.tsx + .css          # Container, step transitions, step keyframes
    │   ├── StepHeader.tsx + .css        # Section number, title, description, study note
    │   ├── SectionProgressBar.tsx + .css # Likert completion bar inside a step
    │   ├── NavigationButtons.tsx + .css  # Back / Next / Submit row
    │   ├── QuestionCard.tsx + .css       # Wrapper; switches on question.type
    │   └── inputs/
    │       ├── LikertScale.tsx + .css
    │       ├── SelectInput.tsx + .css
    │       ├── MultiSelect.tsx + .css
    │       ├── TextareaInput.tsx + .css
    │       └── CostBlock.tsx + .css
    └── dashboard/
        ├── DashboardView.tsx + .css     # Orchestrates DashboardContent + off-screen export stage for PDF
        ├── DashboardContent.tsx         # Actual layout container; receives precomputed data as props
        ├── DashCard.tsx                 # Dash-card primitive (shared layout wrapper)
        ├── KpiCard.tsx + .css           # KPI grid + 12 data-level colour rules
        ├── DimensionBars.tsx + .css     # Dim row, fill colours by data-level, benchmark markers
        ├── RankingTable.tsx + .css      # User-branch highlight
        ├── GapAnalysisTable.tsx + .css  # Score colours by data-level, top-performer column
        ├── RoiHighlight.tsx + .css      # Annual saving highlight card
        └── charts/                      # No CSS — Chart.js handles canvas styling
            ├── RadarChart.tsx
            ├── WasteLevelsChart.tsx
            ├── RoiChart.tsx
            └── registerChartJs.ts
```

---

## Routing

`App.tsx` uses `BrowserRouter` with `basename="/survey"`.

| Route | Component | Description |
|---|---|---|
| `/` | `SurveyPage` | Survey flow (Welcome → Steps → Dashboard) |
| `/result/:id` | `ResultPage` | Shared result — loads submission by ID from API |

After a successful submit, a share URL is generated in the format `${origin}/survey/result/${documentId}`.

---

## Backend / Persistence

**API Base:** `https://designops-maturity.de/api/v1`

**Access:** Survey creation and read endpoints are public. Destructive maintenance
requests require a server-only `API_KEY` sent in the `X-API-Key` header. Never put
this key in a `VITE_*` variable because Vite exposes those values to browsers.

**Database:** MongoDB (not Postgres)

Relevant functions in `src/lib/storage.ts`:

- `save(data)` / `load()` / `clear()` — localStorage adapter for in-progress state (`designops-survey-v1`)
- `submitToMongoDB(config, answers, results)` — POST `/survey`, returns `documentId`
- `fetchSubmissionById(id)` — GET `/survey/:id`, returns `SurveySubmission`

**DEV mode:** When `import.meta.env.DEV === true`, submissions are stored in localStorage as `designops-dev-submission-{uuid}` instead of being sent to the API. No backend required for local development.

**Submission data shape:**
```ts
{
  meta: { submittedAt: string; surveyYear: number; locale: string; }
  rawAnswers: Record<string, AnswerValue>;
  results: {
    overallScore: number;
    maturityLabel: string;
    dimensionScores: DimensionWithScore[];
    currentWaste: number;
    annualSaving: number;
  }
}
```

---

## PDF Export

**Two implementations — primary is `pdfExport.ts`.**

### Primary: `lib/pdfExport.ts` (html2canvas + jsPDF)
- Lazily loads html2canvas 1.4.1 and jsPDF 2.5.1 via CDN script tags
- Mounts an off-screen export stage (`EXPORT_WIDTH_PX = 1440px`, `position: fixed`, left of viewport)
- Queries all `[data-pdf-block]` elements and captures each individually via html2canvas (scale: 2, JPEG 92%)
- Places blocks on A4 pages with automatic page-break and oversized-block handling
- Trigger: `handlePdfClick` in `DashboardView` → `exportElementAsPdf(element, filename)`

### Alternative: `lib/dashboardPdfRenderer.tsx` (@react-pdf/renderer)
- Native vector PDF via `@react-pdf/renderer` (in dependencies)
- Exports `DashboardPdf` (Document component) and `DashboardPdfDownload` (link wrapper)
- Not the primary active path — fallback or future replacement candidate

---

## Technical Decisions

- **React 18 + Vite + TypeScript** — component model, type safety, fast dev server, static build for iframe
- **react-router-dom v7** — client-side routing for the survey flow and shareable result URLs
- **Zustand** — global state in a single hook (`useSurveyStore`). No providers, no reducers.
- **TypeScript strict mode** — no `any`. `Question` is a discriminated union on `type`.
- **survey.config.json** — imported as a module via `resolveJsonModule`. Single source of truth.
- **Colocated global CSS, no CSS framework** — BEM-like class names, no CSS Modules.
- **react-chartjs-2 + chart.js v4** — React wrappers for radar/bar/line charts.
- **lib/storage.ts** — adapter pattern. localStorage today, swappable without touching components.
- **@react-pdf/renderer** — in dependencies, for native PDF export (currently secondary).
- **Google Fonts (Inter)** — via `<link>` in `index.html`
- **Build output** — `dist/` with hashed JS/CSS, `vite.config.ts` sets `base: './'`

---

## CSS Conventions

- **Colocated:** every component has a sibling `.css` file and imports it at the top.
- **Globals in `src/styles/`:** `tokens.css` (`:root`), `reset.css`, `animations.css`, `buttons.css`, `badge.css`. Imported once in `main.tsx`.
- **Shared atoms** (`.btn*`, `.badge*`) live in `src/styles/` — used by multiple unrelated components.
- **Shared layout primitives** between sibling components live in the parent's CSS file.
- **BEM-like class names.** No generic names like `.container` or `.wrapper`.
- **No `style={{...}}`** except for genuinely dynamic values (chart colours, progress widths, computed bench positions).
- **Mobile-first.** Single breakpoint: `@media (max-width: 700px)`. At the bottom of each component's CSS, not in a global mobile sheet.
- **No CSS framework, no CSS Modules, no CSS-in-JS.**

---

## TypeScript / React Conventions

- **Components are pure functions** of props + store state. No imperative DOM manipulation.
- **State lives in `useSurveyStore`.** Read with selectors, dispatch via actions.
- **Pure logic lives in `src/lib/`.** No React, no store imports. Plain data in → plain data out.
- **Types live in `src/types/survey.ts`.** Components import from there, never redefine.
- **One component per file.** File name matches the default export.
- **No business logic in components.** Calculations belong in `src/lib/`.
- **Event handlers are inline JSX props** (`onClick`, `onChange`). No event delegation.
- **No `any`, no `as` casts** without a documented reason.

---

## survey.config.json – Structure

Top-level keys:

```jsonc
{
  "meta": { "title": "...", "subtitle": "...", "description": "...", "duration": 12, "year": 2026, "locale": "de-DE" },
  "likertLabels": ["...", "...", "...", "...", "..."],
  "costDefaults": {
    "designer": 95, "developer": 110, "pm": 105, "researcher": 100,
    "numDesigners": 12, "numDevs": 30, "numPMs": 8, "hoursYear": 1700
  },
  "benchmarks": {
    "overall": { "marketAvg": 2.71, "topPerformer": 4.35 },
    "bySize":   { /* key: number */ },
    "byBranch": { /* key: number */ }
  },
  "sections": [
    {
      "id": "demo",
      "name": "...",
      "icon": "🏢",
      "title": "...",
      "desc": "...",
      "note": "...",
      "dimensions": [
        {
          "key": "...",
          "name": "...",
          "marketAvg": 2.5,
          "topPerformer": 4.2,
          "waste": { "design": 0.3, "validation": 0.2, "production": 0.1 }
        }
      ],
      "questions": [
        {
          "id": "d1_1",
          "type": "likert" | "select" | "multi" | "textarea" | "cost",
          "text": "...",
          "req": true,
          "options": ["..."],   // select + multi only
          "prefill": "...",     // select only
          "hint": "..."
        }
      ]
    }
  ]
}
```

**Important:** `dimensions` are defined at the `Section` level, not on individual questions. Question IDs with a prefix (e.g. `d1_`) are mapped to a dimension key via `id.split('_')[0]` in `scoring.ts`.

---

## Design Language

- **Heritage:** adesso blue `#004C93` as primary brand colour
- **Typography:** Inter, clear hierarchy, no corporate soup
- **Whitespace:** generous — no cramped layout
- **Dashboard:** data-viz quality, not PowerPoint aesthetics
- **Avoid:** gradient overkill, unnecessary shadow stacking, animation without function

---

## Naming Conventions (Clean Code)

- **Intention-revealing names** — `designerRate` not `cD`, `annualSaving` not `saving`
- **No single-letter variables** — `index` not `i`, `question` not `q`, `event` not `e`
- **No abbreviations** — `percent` not `pct`, `answer` not `ans`. Exception: universally understood acronyms (HTML, CSS, KPI, ROI, URL)
- **Functions describe actions** — `calculateDimensionScore()` not `calcDim()`
- **Components are nouns** — `QuestionCard`, `DashboardView`, `LikertScale`
- **Booleans read as conditions** — `isAnswered`, `isAboveAverage`, `isFirstStep`
- **Collections are plural nouns** — `dimensionScores`, `likertQuestions`, `failedIds`
- **No comments explaining what** — only why

---

## Hard Rules

- No code in `index.html` except the Vite shell (`<div id="root">`, font link, module script)
- No imperative DOM access (`document.querySelector`, `innerHTML`) in components
- No `var` — only `const` / `let`
- No state mutation outside `useSurveyStore` actions
- No business logic in components — it belongs in `src/lib/`
- No comments explaining what the code does — only why
- No new dependencies without a reason that fits the project's sustainability goal
- localStorage is only touched through `src/lib/storage.ts`

---

## Change Protocol

For structural refactors: update CLAUDE.md first, then implement.

For non-trivial changes: document the *why* in the commit message, not in code comments.

---

## Backlog

- [ ] Locale switching (DE/EN)
- [ ] Admin view: aggregated results across all submissions
- [ ] Test framework (Vitest for `src/lib/`, optional Playwright for survey flow)
- [ ] Evaluate `dashboardPdfRenderer.tsx` — replace or promote to primary PDF path
