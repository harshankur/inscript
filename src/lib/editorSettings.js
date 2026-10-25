// Editor settings: how the writing column looks. They are a view preference of the person writing,
// kept in this browser next to the other interface settings (theme, sidebar widths), and they never
// change a post. Plain functions without import.meta or React, so Node's test runner can test them.
//
// What is read back from storage is outside input: it may be old, edited by hand or not JSON at all.
// Every field is checked against its allowed range or list, and anything else falls back to the
// default, so a bad value can never reach the editor.

export const EDITOR_SETTINGS_KEY = 'inscript:editor-settings';

// A stored value longer than this is not ours (the real one is under 150 characters).
export const MAX_STORED_SETTINGS_LENGTH = 2000;

// Line width, in rem. 72 is inscript-editor's own column, so the editor looks as it always did
// until a width is chosen.
export const LINE_WIDTH_MIN = 30;
export const LINE_WIDTH_MAX = 120;
export const LINE_WIDTH_STEP = 2;
export const DEFAULT_LINE_WIDTH = 72;

// The narrower column focus mode can use instead of the editor's width, in rem.
export const FOCUS_LINE_WIDTH_MIN = 30;
export const FOCUS_LINE_WIDTH_MAX = 120;
export const FOCUS_LINE_WIDTH_STEP = 2;
export const DEFAULT_FOCUS_LINE_WIDTH = 48;

// Text size, in rem. 1.125 is inscript-editor's own size (18px).
export const TEXT_SIZE_MIN = 0.875;
export const TEXT_SIZE_MAX = 1.75;
export const TEXT_SIZE_STEP = 0.0625;
export const DEFAULT_TEXT_SIZE = 1.125;

export const CSS_UNIT = 'rem';
export const PIXEL_UNIT = 'px';
export const PERCENT_FACTOR = 100;

// Whether focus mode keeps the width of the editor or uses a column of its own.
export const FOCUS_WIDTH_SAME = 'same';
export const FOCUS_WIDTH_CUSTOM = 'custom';
export const FOCUS_WIDTH_MODES = [FOCUS_WIDTH_SAME, FOCUS_WIDTH_CUSTOM];

// Ready-made widths. `id` names the translation (`lineWidth` + id with a capital).
export const LINE_WIDTH_PRESETS = [
    { id: 'narrow', value: 40 },
    { id: 'comfortable', value: 56 },
    { id: 'wide', value: DEFAULT_LINE_WIDTH },
    { id: 'full', value: 100 },
];

export const DEFAULT_EDITOR_SETTINGS = Object.freeze({
    lineWidth: DEFAULT_LINE_WIDTH,
    focusWidthMode: FOCUS_WIDTH_SAME,
    focusLineWidth: DEFAULT_FOCUS_LINE_WIDTH,
    focusDim: true,
    textSize: DEFAULT_TEXT_SIZE,
});

// Decimals kept, so a slider step never leaves float dust (1.1875000000000002) in storage.
const DECIMALS = 4;
const roundTo = (value) => Number(value.toFixed(DECIMALS));

// `value` as a number inside [min, max]; a missing or non-numeric value is `fallback`.
function clampNumber(value, min, max, fallback) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return roundTo(Math.min(max, Math.max(min, value)));
}

/** A complete, valid settings object from anything: unknown fields are dropped, bad ones defaulted. */
export function normalizeEditorSettings(input) {
    const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
        lineWidth: clampNumber(source.lineWidth, LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_EDITOR_SETTINGS.lineWidth),
        focusWidthMode: FOCUS_WIDTH_MODES.includes(source.focusWidthMode) ? source.focusWidthMode : DEFAULT_EDITOR_SETTINGS.focusWidthMode,
        focusLineWidth: clampNumber(source.focusLineWidth, FOCUS_LINE_WIDTH_MIN, FOCUS_LINE_WIDTH_MAX, DEFAULT_EDITOR_SETTINGS.focusLineWidth),
        focusDim: typeof source.focusDim === 'boolean' ? source.focusDim : DEFAULT_EDITOR_SETTINGS.focusDim,
        textSize: clampNumber(source.textSize, TEXT_SIZE_MIN, TEXT_SIZE_MAX, DEFAULT_EDITOR_SETTINGS.textSize),
    };
}

/** The settings a stored string holds. Defaults for a missing, oversized or malformed string. */
export function parseEditorSettings(text) {
    if (typeof text !== 'string' || text.length > MAX_STORED_SETTINGS_LENGTH) return normalizeEditorSettings(null);
    try {
        return normalizeEditorSettings(JSON.parse(text));
    } catch {
        return normalizeEditorSettings(null);
    }
}

/** The settings kept in `storage`. Defaults when there are none or the browser refuses to read them. */
export function readEditorSettings(storage) {
    try {
        return parseEditorSettings(storage.getItem(EDITOR_SETTINGS_KEY));
    } catch {
        return normalizeEditorSettings(null);
    }
}

/** Keeps `settings` in `storage`. False when the browser refuses (private mode, a full disk). */
export function writeEditorSettings(storage, settings) {
    try {
        storage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(normalizeEditorSettings(settings)));
        return true;
    } catch {
        return false;
    }
}

/** Forgets the settings in `storage`, so the next read gives the defaults. False when it refuses. */
export function clearEditorSettings(storage) {
    try {
        storage.removeItem(EDITOR_SETTINGS_KEY);
        return true;
    } catch {
        return false;
    }
}

/** `settings` with `patch` applied, checked again. */
export function updateEditorSettings(settings, patch) {
    return normalizeEditorSettings({ ...settings, ...patch });
}

/** Whether `settings` are the defaults, so there is nothing to reset. */
export function isDefaultEditorSettings(settings) {
    const normalized = normalizeEditorSettings(settings);
    return Object.keys(DEFAULT_EDITOR_SETTINGS).every(key => normalized[key] === DEFAULT_EDITOR_SETTINGS[key]);
}

/** A width in rem as the CSS length the editor takes. */
export function remLength(value) {
    return `${value}${CSS_UNIT}`;
}

/** The text size as a percentage of the default, for display. */
export function textSizePercent(textSize) {
    return Math.round((textSize / DEFAULT_TEXT_SIZE) * PERCENT_FACTOR);
}

/**
 * What to hand `<InscriptEditor>`: its `theme` (column width, focus-mode width, text size) and
 * `focusDim`. Focus mode keeps the width the column has when it is entered (`retainedWidth`, in
 * pixels, measured by lib/editorColumn.js), so the text does not wrap anywhere else; without a
 * measurement it keeps the editor's width setting. A column of its own for focus mode, when
 * chosen, wins over both.
 */
export function editorViewFor(settings, retainedWidth = null) {
    const { lineWidth, focusWidthMode, focusLineWidth, focusDim, textSize } = normalizeEditorSettings(settings);
    const maxWidth = remLength(lineWidth);
    const keptWidth = typeof retainedWidth === 'number' && Number.isFinite(retainedWidth) && retainedWidth > 0
        ? `${Math.round(retainedWidth)}${PIXEL_UNIT}`
        : maxWidth;
    return {
        theme: {
            maxWidth,
            focusMaxWidth: focusWidthMode === FOCUS_WIDTH_CUSTOM ? remLength(focusLineWidth) : keptWidth,
            fontSize: remLength(textSize),
        },
        focusDim,
    };
}
