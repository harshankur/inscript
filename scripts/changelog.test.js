// The changelog follows Keep a Changelog, as inscript-editor's does: a section for every version,
// newest first, under the Added, Changed and Fixed headings. A version without its section is a
// release nobody can read about, so the version in package.json must have one.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const VERSION_HEADING = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm;
const ALLOWED_HEADINGS = ['Added', 'Changed', 'Fixed'];
const parts = (value) => value.split('.').map(Number);
const newerThan = (a, b) => {
    const [x, y] = [parts(a), parts(b)];
    return x[0] !== y[0] ? x[0] > y[0] : x[1] !== y[1] ? x[1] > y[1] : x[2] > y[2];
};

test('the changelog has a dated section for the version in package.json', () => {
    const versions = [...changelog.matchAll(VERSION_HEADING)].map(match => match[1]);
    assert.ok(versions.includes(version), `CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" section`);
});

test('the sections are newest first, and no version is listed twice', () => {
    const versions = [...changelog.matchAll(VERSION_HEADING)].map(match => match[1]);
    assert.equal(new Set(versions).size, versions.length);
    for (let i = 1; i < versions.length; i += 1) {
        assert.ok(newerThan(versions[i - 1], versions[i]), `${versions[i - 1]} must come before ${versions[i]}`);
    }
});

test('a section is split under Added, Changed and Fixed, and nothing else', () => {
    const headings = [...changelog.matchAll(/^### (.+)$/gm)].map(match => match[1]);
    assert.ok(headings.length > 0);
    for (const heading of headings) assert.ok(ALLOWED_HEADINGS.includes(heading), `unexpected heading "${heading}"`);
});

test('the version in package.json is not behind the newest section', () => {
    const [newest] = [...changelog.matchAll(VERSION_HEADING)].map(match => match[1]);
    assert.ok(!newerThan(newest, version), `the changelog is at ${newest} but package.json says ${version}`);
});
