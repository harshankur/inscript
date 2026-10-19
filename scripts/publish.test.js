// Runs the publish steps after the Vite build (generate-data.js, then generate-sitemap.js) against
// throwaway folders, as `npm run publish` does, and checks what a visitor or a crawler gets.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const run = promisify(execFile);
const SITE_URL = 'https://blog.example.com';
const ROBOTS = 'User-agent: *\nAllow: /\n';

// Throwaway sites, removed once every test has run.
const roots = [];
after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })));

function site() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-publish-'));
    roots.push(root);
    const dirs = Object.fromEntries(['content', 'static', 'dist'].map(name => [name, path.join(root, name)]));
    Object.values(dirs).forEach(dir => fs.mkdirSync(dir));
    fs.writeFileSync(path.join(dirs.content, 'public-post.md'), '---\ntitle: Public\ncreated: 2024-05-01\nmodified: 2024-06-01\n---\nHello.\n');
    fs.writeFileSync(path.join(dirs.content, 'secret-post.md'), '---\ntitle: Secret\ndraft: true\ncreated: 2024-05-02\n---\nNot yet.\n');
    fs.writeFileSync(path.join(dirs.content, 'undated-post.md'), '---\ntitle: Undated\n---\nNo date.\n');
    // What the Vite build leaves in dist/: public/robots.txt, as setup wrote it.
    fs.writeFileSync(path.join(dirs.dist, 'robots.txt'), ROBOTS);
    return { root, ...dirs };
}

// Each step from the throwaway folder, so no .env of a real installation is read.
const publishOptions = (folders, env = {}) => ({
    cwd: folders.root,
    env: {
        PATH: process.env.PATH,
        CONTENT_DIR: folders.content,
        STATIC_DIR: folders.static,
        DIST_DIR: folders.dist,
        SITE_URL,
        ...env,
    },
});

async function publish(folders, env = {}) {
    const options = publishOptions(folders, env);
    await run(process.execPath, [path.join(SCRIPTS, 'generate-data.js')], options);
    await run(process.execPath, [path.join(SCRIPTS, 'generate-sitemap.js')], options);
}

const read = (folders, name) => fs.readFileSync(path.join(folders.dist, name), 'utf8');

// Publishing takes seconds, so the tests that only read the output share one published site.
let published;
const publishedSite = () => {
    published ??= (async () => {
        const folders = site();
        await publish(folders);
        return folders;
    })();
    return published;
};

test('a post marked draft: true is in neither data.json nor the sitemap', async () => {
    const folders = await publishedSite();
    const data = JSON.parse(read(folders, 'data.json'));
    assert.deepEqual(data.map(post => post.filename).sort(), ['public-post.md', 'undated-post.md']);
    assert.doesNotMatch(read(folders, 'data.json'), /Secret|Not yet/);
    const sitemap = read(folders, 'sitemap.xml');
    assert.match(sitemap, /<loc>https:\/\/blog\.example\.com\/\?post=public-post<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/blog\.example\.com\/\?post=undated-post<\/loc>/);
    assert.doesNotMatch(sitemap, /secret-post/);
});

test('the sitemap dates posts by their frontmatter, never by the build', async () => {
    const folders = await publishedSite();
    const sitemap = read(folders, 'sitemap.xml');
    assert.match(sitemap, /\?post=public-post<\/loc>\s*<lastmod>2024-06-01T00:00:00\.000Z<\/lastmod>/);
    assert.match(sitemap, /\?post=undated-post<\/loc>\s*<changefreq>/);
    assert.match(sitemap, /<loc>https:\/\/blog\.example\.com\/<\/loc>\s*<lastmod>2024-06-01T00:00:00\.000Z<\/lastmod>/);
    assert.equal(sitemap.match(/<lastmod>/g).length, 2);
});

test('robots.txt names the sitemap once it is written', async () => {
    const folders = await publishedSite();
    assert.equal(read(folders, 'robots.txt'), `${ROBOTS}\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    // Writing the sitemap again adds no second line.
    await run(process.execPath, [path.join(SCRIPTS, 'generate-sitemap.js')], publishOptions(folders));
    assert.equal(read(folders, 'robots.txt'), `${ROBOTS}\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

test('without a usable SITE_URL there is no sitemap, and robots.txt names none', async () => {
    const folders = site();
    await publish(folders, { SITE_URL: '' });
    assert.equal(fs.existsSync(path.join(folders.dist, 'sitemap.xml')), false);
    assert.equal(read(folders, 'robots.txt'), ROBOTS);
    // data.json does not depend on it.
    assert.equal(JSON.parse(read(folders, 'data.json')).length, 2);
});

test('a site without a robots.txt does not get one', async () => {
    const folders = site();
    fs.rmSync(path.join(folders.dist, 'robots.txt'));
    await publish(folders);
    assert.equal(fs.existsSync(path.join(folders.dist, 'robots.txt')), false);
    assert.ok(fs.existsSync(path.join(folders.dist, 'sitemap.xml')));
});
