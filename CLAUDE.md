# CLAUDE.md – DesignOps Maturity Survey

## Project Context

DesignOps Maturity Survey for the DACH region. Measures the DesignOps maturity level of an organization across 8 dimensions – with benchmark comparison and ROI analysis.

Standalone React + Vite + TypeScript app. Builds to a static `dist/` for iframe embedding (e.g. inside an Astro page). No backend yet.

The survey scope is frozen: only `survey.config.json` changes year to year. Maintenance should be limited to JSON edits and small component changes.

---

## Architecture

```
├── index.html                 # Vite entry, minimal shell
├── vite.config.ts
├── tsconfig.json
├── package.json
├── survey.config.json         # Single source of truth, imported as a module
└── src/
    ├── main.tsx               # React root + 5 global CSS imports + store persistence wiring
    ├── App.tsx                # Switches StepView ↔ DashboardView based on store state
    ├── vite-env.d.ts          # Vite client types (enables side-effect .css imports)
    ├── styles/                # Global stylesheets (imported once in main.tsx)
    │   ├── tokens.css         # Design tokens (:root CSS custom properties)
    │   ├── reset.css          # Universal box model + body baseline
    │   ├── animations.css     # Shared @keyframes (slideIn, cardIn, shake, pop)
    │   ├── buttons.css        # .btn + variants (shared atom)
    │   └── badge.css          # .badge + colour variants (shared atom)
    ├── types/
    │   └── survey.ts          # SurveyConfig, Section, Question (discriminated union), AnswerValue, etc.
    ├── store/
    │   └── useSurveyStore.ts  # Zustand: state + actions (init, setAnswer, validate, navigation)
    ├── lib/
    │   ├── scoring.ts         # calculateDimensionScore, getAllDimensionScores, getOverallScore
    │   ├── waste.ts           # extractCosts, wasteMultiplier, calculateWaste
    │   ├── maturity.ts        # maturityLevelKey, maturityLabel
    │   ├── format.ts          # formatNumber, formatCompact (de-DE)
    │   └── storage.ts         # save / load / clear adapter (localStorage today, swappable)
    ├── components/            # Each .tsx imports its own colocated .css
    │   ├── SurveyShell.tsx + .css       # Topbar, hero, footer
    │   ├── ProgressBar.tsx + .css       # Sticky global progress + dots
    │   ├── StepView.tsx + .css          # Container, step transitions, step keyframes
    │   ├── StepHeader.tsx + .css        # Section number, title, description, study note
    │   ├── SectionProgressBar.tsx + .css # Likert completion bar inside a step
    │   ├── NavigationButtons.tsx + .css # Back / Next / Submit row
    │   ├── QuestionCard.tsx + .css      # Wrapper; switches on question.type
    │   └── inputs/                       # Each input has its own .tsx + .css
    │       ├── LikertScale.tsx + .css
    │       ├── SelectInput.tsx + .css
    │       ├── MultiSelect.tsx + .css
    │       ├── TextareaInput.tsx + .css
    │       └── CostBlock.tsx + .css
    └── dashboard/             # Each .tsx imports its own colocated .css
        ├── DashboardView.tsx + .css     # Layout, hero, dash-card primitives, shared .rank-table
        ├── KpiCard.tsx + .css           # KPI grid + 12 data-level colour rules
        ├── DimensionBars.tsx + .css     # Dim row, fill colours by data-level, benchmark markers
        ├── RankingTable.tsx + .css      # User-branch highlight (table layout from DashboardView.css)
        ├── GapAnalysisTable.tsx + .css  # Score colours by data-level, top-performer column
        ├── RoiHighlight.tsx + .css      # Annual saving highlight card
        └── charts/                       # No CSS — Chart.js handles canvas styling
            ├── RadarChart.tsx
            ├── WasteLevelsChart.tsx
            ├── RoiChart.tsx
            └── registerChartJs.ts
```

---

## Technical Decisions

- **React 18 + Vite + TypeScript** – component model, type safety, fast dev server, static build for iframe
- **Zustand** – global state in a single hook (`useSurveyStore`). Mirrors the original `engine.js` state shape. No providers, no reducers.
- **TypeScript strict mode** – no `any`. The `Question` type is a discriminated union on `type` so each input component is exhaustively typed.
- **survey.config.json** – unchanged from the vanilla version. Imported as a module via `resolveJsonModule`. Single source of truth for questions, benchmarks, cost defaults, German UI strings.
- **Colocated global CSS, no CSS framework** – Each component imports its own `.css` file from the same folder (e.g. `QuestionCard.tsx` imports `QuestionCard.css`). BEM-like class names. Five global stylesheets live in `src/styles/`: tokens (`:root` custom properties), reset, animations, plus shared atom files for `.btn` and `.badge`. No CSS Modules — all class names are global, BEM keeps them collision-free.
- **react-chartjs-2 + chart.js v4** – React wrappers for the existing radar / bar / line charts. Same datasets and options as the vanilla version.
- **lib/storage.ts** – adapter pattern preserved. Only `save()`, `load()`, `clear()`. localStorage key `designops-survey-v1` kept identical so in-progress surveys survive deploys. Future: swap to an API call without touching components.
- **Google Fonts (Inter)** – via `<link>` in `index.html`
- **Build output** – `dist/` with hashed JS/CSS and a single `index.html`. `vite.config.ts` sets `base: './'` so the build is portable into any iframe host.

---

## CSS Conventions

- **Colocated:** every component owns a sibling `.css` file (`QuestionCard.tsx` ↔ `QuestionCard.css`) and imports it at the top. Mobile rules for that component go in the same file.
- **Globals in `src/styles/`:** `tokens.css` (`:root` custom properties — colours, spacing, radii, shadows, motion, type scale), `reset.css`, `animations.css`, `buttons.css`, `badge.css`. Imported once in `main.tsx`. Don't add more globals without a clear reason.
- **Shared atoms** (`.btn*`, `.badge*`) live in `src/styles/` because they're used by multiple unrelated components. Anything used by one component lives next to that component.
- **Shared layout primitives** between sibling components (e.g. `.rank-table` table layout used by `RankingTable` + `GapAnalysisTable`) live in the parent's CSS file (`DashboardView.css`).
- **BEM-like class names.** No generic names like `.container` or `.wrapper`. Class names are global (no CSS Modules) — BEM keeps them collision-free.
- **No inline `style={{...}}`** except for genuinely dynamic values (chart colours, progress widths, computed bench positions).
- **Mobile-first.** Single breakpoint: `@media (max-width: 700px)`. Lives at the bottom of each component's CSS file, not in a separate global mobile sheet.
- **No CSS framework**, no CSS Modules, no CSS-in-JS. Don't reach for any of these without an explicit reason.

---

## TypeScript / React Conventions

- **Components are pure functions of props + store state.** No imperative DOM manipulation, no `useRef` for state, no `dangerouslySetInnerHTML`.
- **State lives in `useSurveyStore`.** Components read with selectors (`useSurveyStore(state => state.answers[id])`) and dispatch via actions (`setAnswer`, `goNext`, etc.). Do not mutate state outside of store actions.
- **Pure logic lives in `src/lib/`.** Scoring, waste, maturity mapping, formatting — none of these import React or touch the store. They take plain data in, return plain data out. Easy to reason about and easy to test.
- **Types live in `src/types/survey.ts`.** Components import types from there, never redefine them.
- **One component per file.** File name matches the default export.
- **No business logic in components.** If a component is doing math, the math belongs in `src/lib/`.
- **Event handlers are inline JSX props (`onClick`, `onChange`).** No event delegation, no manual `addEventListener`.
- **No `any`, no `as` casts** unless there's a documented reason.

---

## survey.config.json – Structure

Unchanged from the vanilla version. Top-level keys:

```jsonc
{
  "meta": { "title": "...", "duration": 12, "year": 2026, "locale": "de-DE" },
  "likertLabels": ["...", "...", "...", "...", "..."],
  "costDefaults": {
    "rates": { "designer": 95, "developer": 110, "pm": 105, "researcher": 100 },
    "team":  { "designers": 12, "developers": 30, "pms": 8, "hoursPerYear": 1700 }
  },
  "benchmarks": {
    "overall": { "marketAvg": 2.71, "topPerformer": 4.35 },
    "bySize":  { /* ... */ },
    "byBranch": { /* ... */ }
  },
  "sections": [
    {
      "id": "demo",
      "icon": "🏢",
      "title": "...",
      "desc": "...",
      "note": "...",
      "questions": [
        {
          "id": "d1_1",
          "type": "likert" | "select" | "multi" | "textarea" | "cost",
          "text": "...",
          "req": true,
          "options": ["..."],
          "hint": "...",
          "dimensions": [ /* benchmark + waste data */ ]
        }
      ]
    }
  ]
}
```

---

## Design Language

- **Heritage:** adesso blue `#004C93` as primary brand color
- **Typography:** Inter, clear hierarchy, no corporate soup
- **Whitespace:** generous – no cramped layout
- **Dashboard:** data-viz quality, not PowerPoint aesthetics
- **Avoid:** gradient overkill, unnecessary shadow stacking, animation without function

---

## Naming Conventions (Clean Code)

- **Intention-revealing names** – every variable, function, parameter, and component prop must communicate its purpose without context. `designerRate` not `cD`. `annualSaving` not `saving`. `dimensionScores` not `scores`.
- **No single-letter variables** – not in loops, not in callbacks, not in lambdas. Use `index` not `i`, `question` not `q`, `event` not `e`, `dimension` not `d`.
- **No abbreviations** – `percent` not `pct`, `answer` not `ans`, `current` not `cur`, `template` not `tpl`, `element` not `el`. Exception: universally understood acronyms (HTML, CSS, KPI, ROI, URL).
- **Functions describe actions** – `calculateDimensionScore()` not `calcDim()`. `persistState()` not `save()` at the call site.
- **Components are nouns / noun phrases** – `QuestionCard`, `DashboardView`, `LikertScale`. Not `RenderQCard`.
- **Booleans read as conditions** – `isAnswered`, `isAboveAverage`, `isFirstStep`, `isUserBranch`.
- **Collections are plural nouns** – `dimensionScores`, `likertQuestions`, `hourlyRates`, `failedIds`.
- **No comments** – if a name needs a comment to explain what it does, the name is wrong. Comments are only for *why*, never for *what*.

---

## Hard Rules

- No code in `index.html` except the Vite shell (`<div id="root">`, font link, module script)
- No imperative DOM access (`document.querySelector`, `innerHTML`, manual `addEventListener`) in components
- No `var` – only `const` / `let`
- No state mutation outside `useSurveyStore` actions
- No business logic in components – it goes in `src/lib/`
- No comments explaining what the code does – only why
- No new dependencies without a reason that fits the migration's sustainability goal
- localStorage is only touched through `src/lib/storage.ts`

---

## Change Protocol

For structural refactors: update CLAUDE.md first, then implement.

For non-trivial changes, document the *why* in the commit message, not in code comments.

---

## Backlog

- [ ] Postgres persistence via API route (swap `lib/storage.ts` implementation)
- [ ] Locale switching (DE/EN)
- [ ] PDF export of dashboard
- [ ] Admin view: aggregated results across all submissions
- [ ] Test framework (Vitest for `src/lib/`, optional Playwright for survey flow)
