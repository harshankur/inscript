import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MAX_SCAN_DEPTH, MAX_SCANNED_ENTRIES, PUBLISH_MARKER, publishStatus } from './publish-status.js';

const SECOND = 1000;
const BASE = new Date('2026-01-01T12:00:00Z').getTime() / SECOND;

// A site folder and two source folders, with times that are set rather than waited for.
function workspace(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-publish-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const dirs = { content: path.join(root, 'content'), staticDir: path.join(root, 'static'), dist: path.join(root, 'dist') };
    Object.values(dirs).forEach(dir => fs.mkdirSync(dir, { recursive: true }));
    const write = (file, at, text = 'x') => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, text);
        fs.utimesSync(file, BASE + at, BASE + at);
    };
    const status = (limits) => publishStatus({ sourceDirs: [dirs.content, dirs.staticDir], distDir: dirs.dist }, limits);
    return { root, dirs, write, status, publish: (at) => write(path.join(dirs.dist, PUBLISH_MARKER), at, '[]') };
}

test('a site that was never built is out of date', async (t) => {
    const { dirs, write, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    assert.deepEqual(await status(), { stale: true, publishedAt: null });
});

test('a site built after every post and file is up to date', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    write(path.join(dirs.staticDir, 'cover.png'), 1);
    publish(10);
    const result = await status();
    assert.equal(result.stale, false);
    assert.ok(Math.abs(result.publishedAt - (BASE + 10) * SECOND) < 1, 'it reports when the site was built');
});

test('a post saved after the site was built makes it out of date', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    publish(10);
    assert.equal((await status()).stale, false);
    write(path.join(dirs.content, 'a.md'), 20);
    assert.equal((await status()).stale, true);
});

test('a new image after the site was built makes it out of date, however deep it is', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    publish(10);
    write(path.join(dirs.staticDir, 'images', '2026', 'photo.jpg'), 30);
    assert.equal((await status()).stale, true);
});

test('files made at the same moment as the site do not make it out of date', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 10);
    publish(10);
    assert.equal((await status()).stale, false);
});

test('hidden files are not part of the site, so touching one changes nothing', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    publish(10);
    write(path.join(dirs.content, '.DS_Store'), 50);
    write(path.join(dirs.staticDir, '.cache', 'thing'), 50);
    assert.equal((await status()).stale, false);
});

test('a source folder that does not exist counts for nothing', async (t) => {
    const { dirs, write, publish } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    publish(10);
    const result = await publishStatus({ sourceDirs: [dirs.content, path.join(dirs.content, 'missing')], distDir: dirs.dist });
    assert.equal(result.stale, false);
});

test('a symlink is not followed, so a loop cannot stall the check and a link out counts for nothing', async (t) => {
    const { root, dirs, write, publish, status } = workspace(t);
    write(path.join(dirs.content, 'a.md'), 0);
    write(path.join(root, 'outside', 'newer.md'), 99);
    fs.symlinkSync(dirs.content, path.join(dirs.content, 'loop'));
    fs.symlinkSync(path.join(root, 'outside'), path.join(dirs.staticDir, 'link'));
    publish(10);
    assert.equal((await status()).stale, false);
});

test('folders nested deeper than the limit are not read, and the site is reported out of date', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    publish(10);
    const deep = path.join(dirs.staticDir, ...Array.from({ length: MAX_SCAN_DEPTH + 2 }, (_, i) => `d${i}`));
    write(path.join(deep, 'old.md'), 0);
    assert.equal((await status()).stale, true);
    // Within the limit the same layout is read in full.
    const shallow = workspace(t);
    shallow.publish(10);
    shallow.write(path.join(shallow.dirs.staticDir, ...Array.from({ length: MAX_SCAN_DEPTH }, (_, i) => `d${i}`), 'old.md'), 0);
    assert.equal((await shallow.status()).stale, false);
});

test('more files than the limit are not all read, and the site is reported out of date', async (t) => {
    const { dirs, write, publish, status } = workspace(t);
    for (let i = 0; i < 6; i += 1) write(path.join(dirs.content, `p${i}.md`), 0);
    publish(10);
    assert.equal((await status({ maxDepth: MAX_SCAN_DEPTH, maxEntries: 100 })).stale, false);
    assert.equal((await status({ maxDepth: MAX_SCAN_DEPTH, maxEntries: 3 })).stale, true);
});

test('the limits are bounds, not zero', () => {
    assert.ok(MAX_SCAN_DEPTH >= 1);
    assert.ok(MAX_SCANNED_ENTRIES >= 1000);
    assert.equal(PUBLISH_MARKER, 'data.json');
});
