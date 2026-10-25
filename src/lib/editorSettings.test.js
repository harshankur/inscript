import test from 'node:test';
import assert from 'node:assert/strict';
import {
    clearEditorSettings,
    DEFAULT_EDITOR_SETTINGS,
    DEFAULT_FOCUS_LINE_WIDTH,
    DEFAULT_LINE_WIDTH,
    DEFAULT_TEXT_SIZE,
    editorViewFor,
    EDITOR_SETTINGS_KEY,
    FOCUS_LINE_WIDTH_MAX,
    FOCUS_LINE_WIDTH_MIN,
    FOCUS_WIDTH_CUSTOM,
    FOCUS_WIDTH_SAME,
    isDefaultEditorSettings,
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    LINE_WIDTH_PRESETS,
    LINE_WIDTH_STEP,
    MAX_STORED_SETTINGS_LENGTH,
    normalizeEditorSettings,
    parseEditorSettings,
    readEditorSettings,
    remLength,
    TEXT_SIZE_MAX,
    TEXT_SIZE_MIN,
    textSizePercent,
    updateEditorSettings,
    writeEditorSettings,
} from './editorSettings.js';

// A stand-in for localStorage.
function memoryStorage(initial = {}) {
    const items = new Map(Object.entries(initial));
    return {
        items,
        getItem: (key) => (items.has(key) ? items.get(key) : null),
        setItem: (key, value) => { items.set(key, String(value)); },
        removeItem: (key) => { items.delete(key); },
    };
}

// A storage that refuses everything, as the browser's does in some private modes.
const refusingStorage = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
};

test('the defaults keep the editor looking as it did: its own 72rem column and 18px text', () => {
    assert.equal(DEFAULT_EDITOR_SETTINGS.lineWidth, 72);
    assert.equal(DEFAULT_EDITOR_SETTINGS.textSize, 1.125);
    assert.equal(DEFAULT_EDITOR_SETTINGS.focusDim, true);
});

test('by default focus mode keeps the editor\'s width instead of narrowing it', () => {
    const { theme } = editorViewFor(DEFAULT_EDITOR_SETTINGS);
    assert.equal(DEFAULT_EDITOR_SETTINGS.focusWidthMode, FOCUS_WIDTH_SAME);
    assert.equal(theme.focusMaxWidth, theme.maxWidth);
});

test('focus mode follows the editor\'s width when that width is changed', () => {
    const { theme } = editorViewFor(updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { lineWidth: 50 }));
    assert.equal(theme.maxWidth, '50rem');
    assert.equal(theme.focusMaxWidth, '50rem');
});

test('a column of its own for focus mode is used only when chosen', () => {
    const settings = updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { focusWidthMode: FOCUS_WIDTH_CUSTOM, focusLineWidth: 40, lineWidth: 80 });
    const { theme } = editorViewFor(settings);
    assert.equal(theme.maxWidth, '80rem');
    assert.equal(theme.focusMaxWidth, '40rem');
    // Its width is kept while it is off, ready for when it is turned on again.
    const off = updateEditorSettings(settings, { focusWidthMode: FOCUS_WIDTH_SAME });
    assert.equal(off.focusLineWidth, 40);
    assert.equal(editorViewFor(off).theme.focusMaxWidth, '80rem');
});

test('the editor view carries the text size and the dimming choice', () => {
    const view = editorViewFor(updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { textSize: 1.5, focusDim: false }));
    assert.equal(view.theme.fontSize, '1.5rem');
    assert.equal(view.focusDim, false);
});

test('the editor view of broken settings is the view of the defaults', () => {
    assert.deepEqual(editorViewFor(null), editorViewFor(DEFAULT_EDITOR_SETTINGS));
    assert.deepEqual(editorViewFor('nonsense'), editorViewFor(DEFAULT_EDITOR_SETTINGS));
});

test('numbers outside their range are brought to its nearest end', () => {
    const low = normalizeEditorSettings({ lineWidth: 1, focusLineWidth: -5, textSize: 0 });
    assert.equal(low.lineWidth, LINE_WIDTH_MIN);
    assert.equal(low.focusLineWidth, FOCUS_LINE_WIDTH_MIN);
    assert.equal(low.textSize, TEXT_SIZE_MIN);
    const high = normalizeEditorSettings({ lineWidth: 9999, focusLineWidth: 1e9, textSize: 50 });
    assert.equal(high.lineWidth, LINE_WIDTH_MAX);
    assert.equal(high.focusLineWidth, FOCUS_LINE_WIDTH_MAX);
    assert.equal(high.textSize, TEXT_SIZE_MAX);
});

test('values that are not finite numbers fall back to the default', () => {
    for (const bad of [NaN, Infinity, -Infinity, '60', null, undefined, {}, [], true]) {
        const result = normalizeEditorSettings({ lineWidth: bad, focusLineWidth: bad, textSize: bad });
        assert.equal(result.lineWidth, DEFAULT_LINE_WIDTH, `lineWidth ${String(bad)}`);
        assert.equal(result.focusLineWidth, DEFAULT_FOCUS_LINE_WIDTH, `focusLineWidth ${String(bad)}`);
        assert.equal(result.textSize, DEFAULT_TEXT_SIZE, `textSize ${String(bad)}`);
    }
});

test('the focus width mode is one of the two known modes, or the default', () => {
    assert.equal(normalizeEditorSettings({ focusWidthMode: FOCUS_WIDTH_CUSTOM }).focusWidthMode, FOCUS_WIDTH_CUSTOM);
    assert.equal(normalizeEditorSettings({ focusWidthMode: FOCUS_WIDTH_SAME }).focusWidthMode, FOCUS_WIDTH_SAME);
    for (const bad of ['narrow', '', 'SAME', 1, null, undefined, {}, '__proto__']) {
        assert.equal(normalizeEditorSettings({ focusWidthMode: bad }).focusWidthMode, FOCUS_WIDTH_SAME, String(bad));
    }
});

test('dimming is a boolean, or the default', () => {
    assert.equal(normalizeEditorSettings({ focusDim: false }).focusDim, false);
    assert.equal(normalizeEditorSettings({ focusDim: true }).focusDim, true);
    for (const bad of ['false', 0, 1, null, undefined, {}]) {
        assert.equal(normalizeEditorSettings({ focusDim: bad }).focusDim, true, String(bad));
    }
});

test('fields that are not settings are dropped, and the result is always complete', () => {
    const result = normalizeEditorSettings({ lineWidth: 60, evil: '<script>', __proto__: { polluted: 1 } });
    assert.deepEqual(Object.keys(result).sort(), Object.keys(DEFAULT_EDITOR_SETTINGS).sort());
    assert.equal(result.lineWidth, 60);
    assert.equal({}.polluted, undefined);
});

test('settings that are not an object give the defaults', () => {
    for (const bad of [null, undefined, 'x', 7, true, [], [1, 2]]) {
        assert.deepEqual(normalizeEditorSettings(bad), { ...DEFAULT_EDITOR_SETTINGS }, String(bad));
    }
});

test('a slider step leaves no float dust in what is stored', () => {
    const result = normalizeEditorSettings({ textSize: 1.1875000000000002 });
    assert.equal(result.textSize, 1.1875);
});

test('a stored string is read back into settings', () => {
    const stored = JSON.stringify({ lineWidth: 60, focusWidthMode: FOCUS_WIDTH_CUSTOM, focusLineWidth: 44, focusDim: false, textSize: 1.25 });
    assert.deepEqual(parseEditorSettings(stored), { lineWidth: 60, focusWidthMode: FOCUS_WIDTH_CUSTOM, focusLineWidth: 44, focusDim: false, textSize: 1.25 });
});

test('a stored string that is missing, malformed or not an object gives the defaults', () => {
    for (const bad of [null, undefined, '', '{', 'not json', '[1,2]', '"text"', '42', 'null', 7, {}]) {
        assert.deepEqual(parseEditorSettings(bad), { ...DEFAULT_EDITOR_SETTINGS }, String(bad));
    }
});

test('an oversized stored string is ignored before it is parsed', () => {
    const huge = JSON.stringify({ lineWidth: 60, padding: 'x'.repeat(MAX_STORED_SETTINGS_LENGTH) });
    assert.ok(huge.length > MAX_STORED_SETTINGS_LENGTH);
    assert.deepEqual(parseEditorSettings(huge), { ...DEFAULT_EDITOR_SETTINGS });
});

test('settings written to storage are read back', () => {
    const storage = memoryStorage();
    const settings = updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { lineWidth: 56, focusDim: false });
    assert.equal(writeEditorSettings(storage, settings), true);
    assert.ok(storage.items.has(EDITOR_SETTINGS_KEY));
    assert.deepEqual(readEditorSettings(storage), settings);
});

test('what is written is checked first, so storage never holds a bad value', () => {
    const storage = memoryStorage();
    writeEditorSettings(storage, { lineWidth: 5000, focusWidthMode: 'x', surprise: 1 });
    const stored = JSON.parse(storage.items.get(EDITOR_SETTINGS_KEY));
    assert.equal(stored.lineWidth, LINE_WIDTH_MAX);
    assert.equal(stored.focusWidthMode, FOCUS_WIDTH_SAME);
    assert.equal('surprise' in stored, false);
});

test('reading from an empty storage gives the defaults', () => {
    assert.deepEqual(readEditorSettings(memoryStorage()), { ...DEFAULT_EDITOR_SETTINGS });
});

test('reading what someone hand-edited in storage never gives the editor a bad value', () => {
    const storage = memoryStorage({ [EDITOR_SETTINGS_KEY]: '{"lineWidth":"99999px; background:url(x)","textSize":-3}' });
    const settings = readEditorSettings(storage);
    assert.equal(settings.lineWidth, DEFAULT_LINE_WIDTH);
    assert.equal(settings.textSize, TEXT_SIZE_MIN);
    assert.match(editorViewFor(settings).theme.maxWidth, /^\d+(\.\d+)?rem$/);
});

test('a storage the browser refuses to use gives the defaults and reports the failure', () => {
    assert.deepEqual(readEditorSettings(refusingStorage), { ...DEFAULT_EDITOR_SETTINGS });
    assert.equal(writeEditorSettings(refusingStorage, DEFAULT_EDITOR_SETTINGS), false);
    assert.equal(clearEditorSettings(refusingStorage), false);
});

test('clearing forgets the settings, so the next read gives the defaults', () => {
    const storage = memoryStorage();
    writeEditorSettings(storage, updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { lineWidth: 44 }));
    assert.equal(clearEditorSettings(storage), true);
    assert.equal(storage.items.has(EDITOR_SETTINGS_KEY), false);
    assert.deepEqual(readEditorSettings(storage), { ...DEFAULT_EDITOR_SETTINGS });
});

test('updating one setting leaves the others and is checked', () => {
    const base = updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { lineWidth: 50 });
    assert.equal(base.lineWidth, 50);
    assert.equal(base.textSize, DEFAULT_TEXT_SIZE);
    assert.equal(updateEditorSettings(base, { lineWidth: 9999 }).lineWidth, LINE_WIDTH_MAX);
    assert.equal(base.lineWidth, 50, 'the original is not changed');
});

test('the defaults are recognised as the defaults, and nothing else is', () => {
    assert.equal(isDefaultEditorSettings(DEFAULT_EDITOR_SETTINGS), true);
    assert.equal(isDefaultEditorSettings({}), true);
    assert.equal(isDefaultEditorSettings(null), true);
    for (const patch of [{ lineWidth: 50 }, { focusWidthMode: FOCUS_WIDTH_CUSTOM }, { focusLineWidth: 40 }, { focusDim: false }, { textSize: 1.25 }]) {
        assert.equal(isDefaultEditorSettings(updateEditorSettings(DEFAULT_EDITOR_SETTINGS, patch)), false, JSON.stringify(patch));
    }
});

test('a width becomes the CSS length in rem', () => {
    assert.equal(remLength(72), '72rem');
    assert.equal(remLength(1.125), '1.125rem');
});

test('the text size is shown as a percentage of the default', () => {
    assert.equal(textSizePercent(DEFAULT_TEXT_SIZE), 100);
    assert.equal(textSizePercent(TEXT_SIZE_MIN), 78);
    assert.equal(textSizePercent(TEXT_SIZE_MAX), 156);
});

test('every preset is a width the slider can reach, and the wide one is the default', () => {
    const ids = LINE_WIDTH_PRESETS.map(preset => preset.id);
    assert.equal(new Set(ids).size, ids.length, 'ids are unique');
    for (const { id, value } of LINE_WIDTH_PRESETS) {
        assert.ok(value >= LINE_WIDTH_MIN && value <= LINE_WIDTH_MAX, `${id} is in range`);
        assert.equal((value - LINE_WIDTH_MIN) % LINE_WIDTH_STEP, 0, `${id} lies on a slider step`);
    }
    assert.equal(LINE_WIDTH_PRESETS.find(preset => preset.id === 'wide').value, DEFAULT_LINE_WIDTH);
    assert.deepEqual(LINE_WIDTH_PRESETS.map(preset => preset.value), [...LINE_WIDTH_PRESETS.map(preset => preset.value)].sort((a, b) => a - b));
});

test('focus mode keeps the width the column has when it is entered', () => {
    const { theme } = editorViewFor(DEFAULT_EDITOR_SETTINGS, 1036);
    assert.equal(theme.maxWidth, '72rem');
    assert.equal(theme.focusMaxWidth, '1036px');
});

test('the width kept is whole pixels', () => {
    assert.equal(editorViewFor(DEFAULT_EDITOR_SETTINGS, 640.4).theme.focusMaxWidth, '640px');
    assert.equal(editorViewFor(DEFAULT_EDITOR_SETTINGS, 640.6).theme.focusMaxWidth, '641px');
});

test('a column of its own for focus mode wins over the width kept', () => {
    const settings = updateEditorSettings(DEFAULT_EDITOR_SETTINGS, { focusWidthMode: FOCUS_WIDTH_CUSTOM, focusLineWidth: 40 });
    assert.equal(editorViewFor(settings, 1036).theme.focusMaxWidth, '40rem');
});

test('a width kept that is not a usable number is ignored', () => {
    for (const bad of [null, undefined, 0, -10, NaN, Infinity, '1036', '1036px; x', {}, []]) {
        assert.equal(editorViewFor(DEFAULT_EDITOR_SETTINGS, bad).theme.focusMaxWidth, '72rem', String(bad));
    }
});

test('the width kept never changes the editor\'s own width', () => {
    assert.equal(editorViewFor(DEFAULT_EDITOR_SETTINGS, 500).theme.maxWidth, editorViewFor(DEFAULT_EDITOR_SETTINGS).theme.maxWidth);
});
