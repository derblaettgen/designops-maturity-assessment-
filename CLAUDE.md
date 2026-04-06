# CLAUDE.md – DesignOps Maturity Survey

## Project Context

DesignOps Maturity Survey for the DACH region. Measures the DesignOps maturity level of an organization across 8 dimensions – with benchmark comparison and ROI analysis.

Standalone HTML/JS/CSS tool. Iframe-ready for an Astro page. No build step, no framework.

---

## Architecture

```
├── index.html
├── survey.config.json
├── css/
│   ├── base.css
│   ├── components.css
│   └── dashboard.css
├── js/
│   ├── engine.js
│   ├── renderer.js
│   ├── dashboard.js
│   └── storage.js
└── assets/
```

---

## Technical Decisions

- **Vanilla JS** – no framework, no build step
- **survey.config.json** – all questions, steps, labels, benchmark data
- **CSS Custom Properties** – no utility classes, no external CSS frameworks
- **storage.js** – abstracted interface (`save()`, `load()`, `clear()`), currently LocalStorage, later Postgres via Astro API route
- **Chart.js** – via CDN, no local copy needed
- **Google Fonts (Inter)** – via CDN

---

## CSS Conventions

- Tokens in `:root` in `base.css`
- BEM-like class names, no generic names like `.container` or `.wrapper`
- No inline styles in JS except for dynamic values (chart colors, progress width)
- Mobile-first, no framework

---

## JS Conventions

- **engine.js** – state, navigation, validation. No DOM access.
- **renderer.js** – reads config + state, writes DOM. No business logic.
- **dashboard.js** – clones `<template>` elements from `index.html`, fills text via DOM, sets `data-level` attributes for color mapping. Chart.js init, score calculation, ROI formulas. Zero HTML strings.
- **storage.js** – adapter pattern. Only `save(data)`, `load()`, `clear()`. No direct `localStorage` calls outside this file.

No global variables except the state object in `engine.js`.

---

## survey.config.json – Structure

```json
{
  "meta": {
    "title": "...",
    "duration": 12,
    "year": 2026
  },
  "benchmark": {
    "topPerformer": { "d1": 4.5 },
    "marketAvg": { "d1": 2.9 }
  },
  "steps": [
    {
      "id": "demo",
      "icon": "🏢",
      "title": "...",
      "desc": "...",
      "questions": [
        {
          "id": "d_branch",
          "type": "select",
          "text": "...",
          "required": true,
          "options": ["..."]
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

- **Intention-revealing names** – every variable, function, and parameter must communicate its purpose without context. `designerRate` not `cD`. `annualSaving` not `saving`. `dimensionScores` not `scores`.
- **No single-letter variables** – not in loops, not in callbacks, not in lambdas. Use `index` not `i`, `question` not `q`, `event` not `e`, `dimension` not `d`.
- **No abbreviations** – `percent` not `pct`, `answer` not `ans`, `current` not `cur`, `template` not `tpl`, `element` not `el`. Exception: universally understood acronyms (HTML, CSS, KPI, ROI).
- **Functions describe actions** – `calculateDimensionScore()` not `calcDim()`. `fillRankingTable()` not `buildRankingTable()` when cloning templates. `persistState()` not `save()` at the call site.
- **Booleans read as conditions** – `isAnswered`, `isAboveAverage`, `isFirstStep`, `isUserBranch`.
- **Collections are plural nouns** – `dimensionScores`, `likertQuestions`, `hourlyRates`, `failedIds`.
- **No comments** – if a name needs a comment to explain what it does, the name is wrong. Comments are only for *why*, never for *what*.

---

## Hard Rules

- No code in `index.html` except shell markup, `<template>` elements, and script tags
- No inline event handlers (`onclick="..."`) in rendered HTML
- No `var` – only `const` / `let`
- No state mutation outside `engine.js`
- No comments explaining what the code does – only why

---

## Change Protocol

Document before any significant change:
```
// CHANGE: [what] → [why]
```

For structural refactors: update CLAUDE.md first, then implement.

---

## Backlog

- [ ] Postgres persistence via Astro API route (`/api/survey/submit`)
- [ ] Locale switching (DE/EN)
- [ ] PDF export of dashboard
- [ ] Admin view: aggregated results across all submissions