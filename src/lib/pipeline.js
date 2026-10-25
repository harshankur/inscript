// The four steps that take an edit from the editor to the world: save it, publish the site, commit
// it, push it. They are independent. Each has work left (`pending`) or not, which says what to
// offer next and is shown beside it, but whether one has been done never takes another away: a
// saved post can still be published, a committed one still pushed. Only Save needs something to
// do, since there is nothing to write when nothing changed. Plain functions without React or
// import.meta, so Node's test runner can test them.

export const STEP_SAVE = 'save';
export const STEP_PUBLISH = 'publish';
export const STEP_COMMIT = 'commit';
export const STEP_PUSH = 'push';

// In the order they happen.
export const PIPELINE_STEPS = [STEP_SAVE, STEP_PUBLISH, STEP_COMMIT, STEP_PUSH];

// The translation keys of each step: its name, and what it has left to do or not.
export const STEP_KEYS = {
    [STEP_SAVE]: { label: 'save', pending: 'saveStepPending', done: 'saveStepDone' },
    [STEP_PUBLISH]: { label: 'publish', pending: 'publishStepPending', done: 'publishStepDone' },
    [STEP_COMMIT]: { label: 'commit', pending: 'commitStepPending', done: 'commitStepDone' },
    [STEP_PUSH]: { label: 'push', pending: 'pushStepPending', done: 'pushStepDone' },
};
export const UNKNOWN_STEP_KEY = 'stepUnknown';

// A flag the server answered with, or null when it did not answer or answered with anything else.
const flagOrNull = (value) => (typeof value === 'boolean' ? value : null);

/**
 * The state the status routes answered with, as the editor keeps it. A field is null when its
 * route failed or sent something unexpected, and its step then claims nothing either way.
 * Without an upstream branch there is no telling what a push would send.
 */
export function readPipelineStatus(publishData, gitData) {
    const ahead = gitData?.hasUpstream === false || !Number.isInteger(gitData?.ahead) || gitData.ahead < 0 ? null : gitData.ahead;
    return {
        publishStale: flagOrNull(publishData?.stale),
        gitDirty: flagOrNull(gitData?.dirty),
        ahead,
    };
}

/**
 * The steps in order with what each has left. `pending` is true, false, or null when that is
 * not known. `runnable` is whether the step can be started now: always, except Save, which needs
 * something unsaved. Push is left out where pushing is not allowed.
 */
export function pipelineSteps({ isDirty, publishStale, gitDirty, ahead, pushAllowed }) {
    const steps = [
        { id: STEP_SAVE, pending: Boolean(isDirty), runnable: Boolean(isDirty) },
        { id: STEP_PUBLISH, pending: flagOrNull(publishStale), runnable: true },
        { id: STEP_COMMIT, pending: flagOrNull(gitDirty), runnable: true },
    ];
    if (pushAllowed) {
        steps.push({ id: STEP_PUSH, pending: Number.isInteger(ahead) ? ahead > 0 : null, runnable: true });
    }
    return steps;
}

/** The first step with work left, or null when everything known is done. */
export function nextStep(steps) {
    return steps.find(step => step.pending === true) ?? null;
}

/**
 * Every step from the first one with work left to the last. Doing one step leaves work for the
 * ones after it (a saved post is not yet published, a published site not yet committed), even
 * while they report nothing left, so they are all part of finishing what is left.
 */
export function remainingChain(steps) {
    const first = nextStep(steps);
    if (!first) return [];
    return steps.slice(steps.indexOf(first)).map(step => step.id);
}

/** The translation key for what `step` has left to do. */
export function stepStatusKey(step) {
    if (step.pending === null) return UNKNOWN_STEP_KEY;
    return step.pending ? STEP_KEYS[step.id].pending : STEP_KEYS[step.id].done;
}
