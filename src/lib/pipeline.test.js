import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    nextStep,
    PIPELINE_STEPS,
    pipelineSteps,
    readPipelineStatus,
    remainingChain,
    STEP_COMMIT,
    STEP_KEYS,
    STEP_PUBLISH,
    STEP_PUSH,
    STEP_SAVE,
    stepStatusKey,
    UNKNOWN_STEP_KEY,
} from './pipeline.js';

const english = JSON.parse(fs.readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'));

const state = (overrides = {}) => ({ isDirty: false, publishStale: false, gitDirty: false, ahead: 0, pushAllowed: true, ...overrides });
const ids = (steps) => steps.map(step => step.id);

test('the steps are save, publish, commit, push, in that order', () => {
    assert.deepEqual(PIPELINE_STEPS, [STEP_SAVE, STEP_PUBLISH, STEP_COMMIT, STEP_PUSH]);
    assert.deepEqual(ids(pipelineSteps(state())), PIPELINE_STEPS);
});

test('without permission to push there is no push step', () => {
    assert.deepEqual(ids(pipelineSteps(state({ pushAllowed: false }))), [STEP_SAVE, STEP_PUBLISH, STEP_COMMIT]);
});

test('regression: once a post is saved, publish, commit and push can still be run', () => {
    const saved = pipelineSteps(state({ isDirty: false, publishStale: true, gitDirty: true, ahead: 0 }));
    for (const id of [STEP_PUBLISH, STEP_COMMIT, STEP_PUSH]) {
        assert.equal(saved.find(step => step.id === id).runnable, true, id);
    }
});

test('a step is never taken away by another being done or not done', () => {
    for (const isDirty of [true, false]) {
        for (const publishStale of [true, false, null]) {
            for (const gitDirty of [true, false, null]) {
                for (const ahead of [0, 3, null]) {
                    const steps = pipelineSteps(state({ isDirty, publishStale, gitDirty, ahead }));
                    for (const step of steps.filter(s => s.id !== STEP_SAVE)) {
                        assert.equal(step.runnable, true, `${step.id} with ${JSON.stringify({ isDirty, publishStale, gitDirty, ahead })}`);
                    }
                }
            }
        }
    }
});

test('save is the one step that needs something to do', () => {
    assert.equal(pipelineSteps(state({ isDirty: true }))[0].runnable, true);
    assert.equal(pipelineSteps(state({ isDirty: false }))[0].runnable, false);
    assert.equal(pipelineSteps(state({ isDirty: undefined }))[0].pending, false);
});

test('each step has work left when its own state says so', () => {
    const pending = (overrides, id) => pipelineSteps(state(overrides)).find(step => step.id === id).pending;
    assert.equal(pending({ isDirty: true }, STEP_SAVE), true);
    assert.equal(pending({ publishStale: true }, STEP_PUBLISH), true);
    assert.equal(pending({ gitDirty: true }, STEP_COMMIT), true);
    assert.equal(pending({ ahead: 2 }, STEP_PUSH), true);
    assert.equal(pending({}, STEP_PUBLISH), false);
    assert.equal(pending({}, STEP_COMMIT), false);
    assert.equal(pending({}, STEP_PUSH), false);
});

test('a step whose state is not known claims neither that it is done nor that it is not', () => {
    const steps = pipelineSteps(state({ publishStale: null, gitDirty: undefined, ahead: null }));
    assert.deepEqual(steps.map(step => step.pending), [false, null, null, null]);
    assert.equal(pipelineSteps(state({ publishStale: 'yes', gitDirty: 1, ahead: '2' })).slice(1).every(step => step.pending === null), true);
});

test('the next step is the first with work left', () => {
    assert.equal(nextStep(pipelineSteps(state({ isDirty: true, publishStale: true }))).id, STEP_SAVE);
    assert.equal(nextStep(pipelineSteps(state({ publishStale: true, gitDirty: true }))).id, STEP_PUBLISH);
    assert.equal(nextStep(pipelineSteps(state({ gitDirty: true, ahead: 1 }))).id, STEP_COMMIT);
    assert.equal(nextStep(pipelineSteps(state({ ahead: 1 }))).id, STEP_PUSH);
});

test('with nothing left, and with nothing known, there is no next step', () => {
    assert.equal(nextStep(pipelineSteps(state())), null);
    assert.equal(nextStep(pipelineSteps(state({ publishStale: null, gitDirty: null, ahead: null }))), null);
});

test('an edit goes through the steps one at a time as each is done', () => {
    // Edited, nothing else done yet.
    assert.equal(nextStep(pipelineSteps(state({ isDirty: true }))).id, STEP_SAVE);
    // Saved: the site is behind and there is a change to commit.
    assert.equal(nextStep(pipelineSteps(state({ publishStale: true, gitDirty: true }))).id, STEP_PUBLISH);
    // Published.
    assert.equal(nextStep(pipelineSteps(state({ publishStale: false, gitDirty: true }))).id, STEP_COMMIT);
    // Committed: one commit waits to be pushed.
    assert.equal(nextStep(pipelineSteps(state({ gitDirty: false, ahead: 1 }))).id, STEP_PUSH);
    // Pushed.
    assert.equal(nextStep(pipelineSteps(state())), null);
});

test('finishing what is left runs from the first step with work to the last', () => {
    assert.deepEqual(remainingChain(pipelineSteps(state({ isDirty: true }))), [STEP_SAVE, STEP_PUBLISH, STEP_COMMIT, STEP_PUSH]);
    assert.deepEqual(remainingChain(pipelineSteps(state({ publishStale: true }))), [STEP_PUBLISH, STEP_COMMIT, STEP_PUSH]);
    assert.deepEqual(remainingChain(pipelineSteps(state({ gitDirty: true }))), [STEP_COMMIT, STEP_PUSH]);
    assert.deepEqual(remainingChain(pipelineSteps(state({ ahead: 1 }))), [STEP_PUSH]);
});

test('finishing what is left stops short of push where pushing is not allowed', () => {
    assert.deepEqual(remainingChain(pipelineSteps(state({ isDirty: true, pushAllowed: false }))), [STEP_SAVE, STEP_PUBLISH, STEP_COMMIT]);
    assert.deepEqual(remainingChain(pipelineSteps(state({ ahead: 5, pushAllowed: false }))), []);
});

test('with nothing left there is nothing to finish', () => {
    assert.deepEqual(remainingChain(pipelineSteps(state())), []);
});

test('the status the server sent is read into the editor\'s state', () => {
    assert.deepEqual(readPipelineStatus({ stale: true, publishedAt: 5 }, { dirty: true, ahead: 2, hasUpstream: true }), { publishStale: true, gitDirty: true, ahead: 2 });
    assert.deepEqual(readPipelineStatus({ stale: false }, { dirty: false, ahead: 0, hasUpstream: true }), { publishStale: false, gitDirty: false, ahead: 0 });
});

test('a status that failed or is not what was expected claims nothing', () => {
    const unknown = { publishStale: null, gitDirty: null, ahead: null };
    assert.deepEqual(readPipelineStatus(undefined, undefined), unknown);
    assert.deepEqual(readPipelineStatus(null, null), unknown);
    assert.deepEqual(readPipelineStatus({ error: 'x' }, '<html>'), unknown);
    assert.deepEqual(readPipelineStatus({ stale: 'true' }, { dirty: 1, ahead: '3' }), unknown);
    assert.deepEqual(readPipelineStatus({}, { dirty: true, ahead: -1 }), { publishStale: null, gitDirty: true, ahead: null });
    assert.deepEqual(readPipelineStatus({}, { dirty: true, ahead: 1.5 }), { publishStale: null, gitDirty: true, ahead: null });
});

test('with no upstream branch there is no telling what a push would send', () => {
    assert.equal(readPipelineStatus({ stale: false }, { dirty: false, ahead: 0, hasUpstream: false }).ahead, null);
});

test('the status of a step is the text for its state', () => {
    const [save, publish, commit, push] = pipelineSteps(state({ isDirty: true, publishStale: false, gitDirty: null, ahead: 1 }));
    assert.equal(stepStatusKey(save), 'saveStepPending');
    assert.equal(stepStatusKey(publish), 'publishStepDone');
    assert.equal(stepStatusKey(commit), UNKNOWN_STEP_KEY);
    assert.equal(stepStatusKey(push), 'pushStepPending');
});

test('every text a step can show exists in the English strings', () => {
    for (const id of PIPELINE_STEPS) {
        for (const key of Object.values(STEP_KEYS[id])) {
            assert.equal(typeof english[key], 'string', `${id}: ${key}`);
            assert.notEqual(english[key].trim(), '', `${id}: ${key}`);
        }
    }
    assert.equal(typeof english[UNKNOWN_STEP_KEY], 'string');
});
