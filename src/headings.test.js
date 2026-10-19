// Every heading in the app's markup says something: an empty <h1> to <h6> tells a search engine
// or a screen reader that a section has no name.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const EMPTY_HEADING = /<h([1-6])\b[^>]*>\s*<\/h\1>/g;

function jsxFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return jsxFiles(file);
        return entry.name.endsWith('.jsx') ? [file] : [];
    });
}

test('no component renders an empty heading', () => {
    const files = jsxFiles(SRC);
    assert.ok(files.some(file => path.basename(file) === 'App.jsx'), 'the scan finds the app');
    const empty = files.flatMap(file => [...fs.readFileSync(file, 'utf8').matchAll(EMPTY_HEADING)]
        .map(match => `${path.relative(SRC, file)}: ${match[0]}`));
    assert.deepEqual(empty, []);
});

test('the empty-heading check finds one', () => {
    assert.equal('<h1 className="x"></h1> <h2>Title</h2> <h3> </h3>'.match(EMPTY_HEADING).length, 2);
});
