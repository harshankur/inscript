// Checks that every language keeps up with the English strings, so a new or reworded string
// never ships untranslated. Run `npm run check:locales` (the pre-commit hook runs it too).
//
// - inscript-editor ships English only; src/locales/editor/<lang>.json hold its strings in every
//   other language the app offers. Each must have every key of the installed editor's English,
//   with the same {{placeholders}}, and be registered in src/i18n.js.
// - src/locales/editor/_english-reference.json is the editor English those translations were
//   made from. A string the editor rewords in a later release fails the check until it is
//   retranslated; then `npm run check:locales -- --accept` records the new English.
// - The app's own src/locales/<lang>.json must each have every key of src/locales/en.json.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_LOCALES = path.join(ROOT, 'src/locales');
const EDITOR_LOCALES = path.join(APP_LOCALES, 'editor');
const REFERENCE = path.join(EDITOR_LOCALES, '_english-reference.json');
const I18N = path.join(ROOT, 'src/i18n.js');

const accept = process.argv.includes('--accept');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const placeholders = (text) => [...String(text).matchAll(/{{\s*(\w+)\s*}}/g)].map(m => m[1]).sort().join(',');
const languagesIn = (dir) => fs.readdirSync(dir)
    .filter(name => /^[a-z]{2}(-[A-Z]{2})?\.json$/.test(name))
    .map(name => name.slice(0, -5))
    .sort();

// The editor's English, found through the package's exports (its `inscript-editor/locales`
// entry imports the JSON without an import attribute, which plain Node refuses).
const editorLocalesDir = path.dirname(fileURLToPath(import.meta.resolve('inscript-editor/locales')));
const editorEnglish = readJson(path.join(editorLocalesDir, 'en.json'));
const editorVersion = readJson(path.join(editorLocalesDir, '../../package.json')).version;

const failures = [];
const warnings = [];

// Every key of `english` present in `bundle`, non-empty, with the same placeholders.
function compare(label, english, bundle) {
    const missing = Object.keys(english).filter(key => !(key in bundle));
    const empty = Object.keys(english).filter(key => key in bundle && !String(bundle[key]).trim());
    const broken = Object.keys(english).filter(key => key in bundle && placeholders(bundle[key]) !== placeholders(english[key]));
    const extra = Object.keys(bundle).filter(key => !(key in english));
    if (missing.length) failures.push(`${label}: missing ${missing.length}: ${missing.map(key => `${key} ("${english[key]}")`).join(', ')}`);
    if (empty.length) failures.push(`${label}: empty: ${empty.join(', ')}`);
    if (broken.length) failures.push(`${label}: placeholders differ from English: ${broken.join(', ')}`);
    if (extra.length) warnings.push(`${label}: keys English no longer has (safe to remove): ${extra.join(', ')}`);
}

// --- inscript-editor strings ---
const appLanguages = languagesIn(APP_LOCALES).filter(lang => lang !== 'en');
const editorLanguages = languagesIn(EDITOR_LOCALES);
for (const lang of appLanguages.filter(l => !editorLanguages.includes(l))) {
    failures.push(`editor/${lang}.json: missing; the app offers ${lang} but has no editor strings for it`);
}
for (const lang of editorLanguages.filter(l => !appLanguages.includes(l))) {
    warnings.push(`editor/${lang}.json: the app offers no ${lang}, so these strings are never used`);
}
const i18nSource = fs.readFileSync(I18N, 'utf8');
const overridesBlock = i18nSource.slice(i18nSource.indexOf('overrides'));
for (const lang of editorLanguages) {
    compare(`editor/${lang}.json`, editorEnglish, readJson(path.join(EDITOR_LOCALES, `${lang}.json`)));
    const imported = new RegExp(`import (\\w+) from './locales/editor/${lang}\\.json'`).exec(i18nSource);
    if (!imported) failures.push(`editor/${lang}.json: not imported in src/i18n.js`);
    else if (!new RegExp(`['"]?${lang}['"]?\\s*:\\s*${imported[1]}\\b`).test(overridesBlock)) {
        failures.push(`editor/${lang}.json: imported but not passed in src/i18n.js's overrides`);
    }
}

// --- English the editor bundles were translated from ---
const reference = fs.existsSync(REFERENCE) ? readJson(REFERENCE) : null;
const referenceStrings = reference?.strings ?? {};
const changed = Object.keys(editorEnglish).filter(key => key in referenceStrings && referenceStrings[key] !== editorEnglish[key]);
if (!accept) {
    if (!reference) {
        failures.push('editor/_english-reference.json: missing; run `npm run check:locales -- --accept` once the translations are up to date');
    } else if (changed.length) {
        failures.push(`inscript-editor ${editorVersion} rewords ${changed.length} string(s) translated from ${reference.version}; `
            + `retranslate them in every editor/<lang>.json, then run \`npm run check:locales -- --accept\`: `
            + changed.map(key => `${key}: "${referenceStrings[key]}" -> "${editorEnglish[key]}"`).join('; '));
    }
}

// --- The app's own strings ---
const appEnglish = readJson(path.join(APP_LOCALES, 'en.json'));
for (const lang of appLanguages) compare(`${lang}.json`, appEnglish, readJson(path.join(APP_LOCALES, `${lang}.json`)));

for (const warning of warnings) console.warn(`warning: ${warning}`);

if (accept) {
    // Recording new English means "every language has these strings translated".
    if (failures.length) {
        for (const failure of failures) console.error(`✗ ${failure}`);
        console.error('\nNot recording the English reference until the problems above are fixed.');
        process.exit(1);
    }
    fs.writeFileSync(REFERENCE, `${JSON.stringify({ version: editorVersion, strings: editorEnglish }, null, 2)}\n`);
    console.log(`Recorded inscript-editor ${editorVersion}'s English (${Object.keys(editorEnglish).length} strings) as translated.`);
    process.exit(0);
}

if (failures.length) {
    for (const failure of failures) console.error(`✗ ${failure}`);
    console.error(`\n${failures.length} locale problem(s). Translations must keep up with the English strings (see scripts/check-locales.js).`);
    process.exit(1);
}
console.log(`Locales OK: ${editorLanguages.length} editor bundles match inscript-editor ${editorVersion} (${Object.keys(editorEnglish).length} strings), `
    + `${appLanguages.length} app locales match en.json (${Object.keys(appEnglish).length} strings).`);
