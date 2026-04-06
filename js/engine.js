/**
 * engine.js — state, navigation, validation.
 * No DOM access. No fetch. All state mutation goes through exported functions.
 */

export const state = {
  cur:    0,
  ans:    {},
  config: null
};

/**
 * Initialise engine with loaded config.
 * Applies cost defaults and select prefills to state.ans.
 */
export function init(config) {
  state.config = config;
  state.cur    = 0;
  state.ans    = {};

  // Pre-populate cost defaults so the cost step renders correctly pre-filled
  const d = config.costDefaults;
  Object.keys(d).forEach(k => { state.ans['cost_' + k] = d[k]; });

  // Pre-populate select prefills (c_waste, c_rework)
  config.steps.forEach(step => {
    step.questions.forEach(q => {
      if (q.prefill && state.ans[q.id] === undefined) {
        state.ans[q.id] = q.prefill;
      }
    });
  });
}

/** Set a single scalar answer. */
export function setAnswer(id, value) {
  state.ans[id] = value;
}

/** Set a multi-select answer (array or undefined to clear). */
export function setMulti(id, values) {
  state.ans[id] = values && values.length ? values : undefined;
}

/** Bulk-set answers (used when restoring from storage). */
export function setAnswers(map) {
  Object.assign(state.ans, map);
}

/**
 * Validate required questions on the current step.
 * Returns { valid: boolean, failedIds: string[] }
 * No DOM side effects.
 */
export function validate() {
  const step = state.config.steps[state.cur];
  const failedIds = [];

  step.questions.forEach(q => {
    if (!q.req) return;
    const a = state.ans[q.id];
    if (a === undefined || a === '' || (Array.isArray(a) && a.length === 0)) {
      failedIds.push(q.id);
    }
  });

  return { valid: failedIds.length === 0, failedIds };
}

/**
 * Advance to next step if validation passes.
 * Returns true on success, false if validation failed.
 */
export function goNext() {
  const result = validate();
  if (!result.valid) return result;
  state.cur = Math.min(state.cur + 1, state.config.steps.length - 1);
  return result;
}

/**
 * Go back one step.
 * Returns true if moved, false if already at start.
 */
export function goPrev() {
  if (state.cur === 0) return false;
  state.cur--;
  return true;
}

/** Jump to a specific step index (used by dot navigation). */
export function goTo(i) {
  const max = state.config.steps.length - 1;
  state.cur = Math.max(0, Math.min(i, max));
}

/** Count all non-empty answers in state.ans. */
export function countAnswered() {
  return Object.values(state.ans).filter(v => v !== undefined && v !== '').length;
}

/**
 * Average the answered Likert ids for a dimension.
 * Returns 0 if none answered.
 */
export function calcDim(ids) {
  const vals = ids.map(id => Number(state.ans[id]) || 0).filter(x => x > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

/**
 * Compute maturity scores for all 8 dimensions.
 * Returns array of { key, name, ids, score }.
 */
export function getScores() {
  return state.config.dimensions.map(d => ({
    ...d,
    score: calcDim(d.ids)
  }));
}
