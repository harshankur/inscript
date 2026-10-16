import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import fontLicenses, { FONT_LICENSES, FONTS_DIR, fontAssetFileName, licensesFor } from './font-licenses.js';

test('fontAssetFileName puts font files into the font folder', () => {
    for (const name of ['KaTeX_Main-Regular.woff2', 'KaTeX_Main-Regular.woff', 'KaTeX_Main-Regular.ttf', 'x.otf', 'x.eot', 'INTER.WOFF2']) {
        assert.equal(fontAssetFileName({ names: [name] }), `${FONTS_DIR}/[name]-[hash][extname]`, name);
    }
});

test('fontAssetFileName leaves every other asset in assets/', () => {
    assert.equal(fontAssetFileName({ names: ['index.css'] }), 'assets/[name]-[hash][extname]');
    assert.equal(fontAssetFileName({ names: ['photo.png'] }), 'assets/[name]-[hash][extname]');
});

test('fontAssetFileName reads the older `name` field and copes with neither', () => {
    assert.equal(fontAssetFileName({ name: 'inter-latin.woff2' }), `${FONTS_DIR}/[name]-[hash][extname]`);
    assert.equal(fontAssetFileName({}), 'assets/[name]-[hash][extname]');
});

test('licensesFor picks the licence of every font family in the output', () => {
    const found = licensesFor([
        'index.html',
        `${FONTS_DIR}/KaTeX_Main-Regular-abc.woff2`,
        `${FONTS_DIR}/inter-latin-abc.woff2`,
        `${FONTS_DIR}/outfit-latin-ext-abc.woff2`,
    ]);
    assert.deepEqual(found.map(license => license.fileName), ['LICENSE-KaTeX.txt', 'OFL-Inter.txt', 'OFL-Outfit.txt']);
});

test('licensesFor writes no licence for fonts the output does not carry', () => {
    assert.deepEqual(licensesFor([`${FONTS_DIR}/KaTeX_AMS-Regular-abc.ttf`]).map(license => license.fileName), ['LICENSE-KaTeX.txt']);
    assert.deepEqual(licensesFor(['index.html', 'assets/index-abc.js']), []);
});

test('licensesFor only counts font files inside the font folder', () => {
    assert.deepEqual(licensesFor(['assets/KaTeX_Main-Regular-abc.woff2', `${FONTS_DIR}/inter-notes.txt`]), []);
});

test('every licence source exists in the repository', () => {
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    for (const license of FONT_LICENSES) {
        assert.ok(fs.existsSync(path.join(root, license.source)), license.source);
    }
});

test('the plugin emits the licences of the fonts in the bundle, next to them', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'font-licenses-'));
    fs.writeFileSync(path.join(dir, 'A.txt'), 'licence A');
    fs.writeFileSync(path.join(dir, 'B.txt'), 'licence B');
    const plugin = fontLicenses(dir, [
        { fonts: /^a-/, source: 'A.txt', fileName: 'LICENSE-A.txt' },
        { fonts: /^b-/, source: 'B.txt', fileName: 'LICENSE-B.txt' },
    ]);
    const emitted = [];
    plugin.generateBundle.call({ emitFile: file => emitted.push(file) }, {}, { [`${FONTS_DIR}/a-regular-xyz.woff2`]: {} });
    assert.equal(plugin.apply, 'build');
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].type, 'asset');
    assert.equal(emitted[0].fileName, `${FONTS_DIR}/LICENSE-A.txt`);
    assert.equal(emitted[0].source.toString(), 'licence A');
    fs.rmSync(dir, { recursive: true, force: true });
});
