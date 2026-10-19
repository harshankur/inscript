import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import htmlHead, { APP_PAGE, MANIFEST_FILE, appHead } from './html-head.js';

const PAGE = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>Inscript</title>
</head>
<body><div id="root"></div></body>
</html>`;

const titleOf = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1];

test('the page is titled after TITLE', () => {
    assert.equal(titleOf(appHead(PAGE, { title: "Harsh's Blog" })), 'Harsh&#39;s Blog');
    assert.equal(titleOf(appHead(PAGE, { title: '  My Blog ' })), 'My Blog');
});

test('without a TITLE the page is called Inscript', () => {
    assert.equal(titleOf(appHead(PAGE, { title: undefined })), 'Inscript');
    assert.equal(titleOf(appHead(PAGE, { title: '' })), 'Inscript');
    assert.equal(titleOf(appHead(PAGE)), 'Inscript');
});

test('a title is escaped, and a "$" in it is kept as it is', () => {
    const html = appHead(PAGE, { title: '</title><script>alert(1)</script> & $& $1' });
    assert.equal(titleOf(html), '&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; $&amp; $1');
    assert.equal(html.match(/<title>/g).length, 1);
    assert.doesNotMatch(html, /<script>/);
});

test('a page without a title gets one in its head', () => {
    const html = appHead('<html><head><meta charset="UTF-8" /></head><body></body></html>', { title: 'Blog' });
    assert.match(html, /<head><meta charset="UTF-8" \/> {4}<title>Blog<\/title>\n<\/head>/);
});

test('the manifest link and the noindex tag are added only when asked for', () => {
    const plain = appHead(PAGE, { title: 'Blog' });
    assert.doesNotMatch(plain, /manifest|noindex/);
    assert.equal(plain, PAGE.replace('<title>Inscript</title>', '<title>Blog</title>'));
    const both = appHead(PAGE, { title: 'Blog', manifest: true, noindex: true });
    assert.match(both, /<link rel="manifest" href="\/manifest\.json" \/>\n {4}<meta name="robots" content="noindex" \/>\n<\/head>/);
});

const roots = [];
after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })));

// A site with the app page, another page, and (when `manifest`) a manifest in public/.
function site({ manifest }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-html-head-'));
    roots.push(root);
    fs.writeFileSync(path.join(root, APP_PAGE), PAGE);
    fs.writeFileSync(path.join(root, 'landing.html'), PAGE.replace('<title>Inscript</title>', '<title>Landing</title>'));
    fs.mkdirSync(path.join(root, 'public'));
    if (manifest) fs.writeFileSync(path.join(root, 'public', MANIFEST_FILE), '{}');
    return root;
}

// The plugin's hooks as Vite calls them.
function transform(root, page, options) {
    const plugin = htmlHead({ root, ...options });
    plugin.configResolved({ publicDir: path.join(root, 'public') });
    return plugin.transformIndexHtml.handler(PAGE, { filename: path.join(root, page) });
}

test('the plugin fills in the app page only, and links the manifest only when it exists', () => {
    const withManifest = site({ manifest: true });
    const app = transform(withManifest, APP_PAGE, { title: 'Blog' });
    assert.equal(titleOf(app), 'Blog');
    assert.match(app, /rel="manifest"/);
    assert.doesNotMatch(app, /noindex/);
    assert.equal(transform(withManifest, 'landing.html', { title: 'Blog', noindex: true }), PAGE);
    assert.doesNotMatch(transform(site({ manifest: false }), APP_PAGE, { title: 'Blog' }), /manifest/);
    assert.match(transform(withManifest, APP_PAGE, { title: 'Blog', noindex: true }), /<meta name="robots" content="noindex" \/>/);
});

test('in a real Vite build the app page gets its title, noindex and a manifest link from the build\'s base', async () => {
    const root = site({ manifest: true });
    const outDir = path.join(root, 'out');
    await build({
        configFile: false,
        root,
        base: './',
        logLevel: 'silent',
        plugins: [htmlHead({ root, title: 'Demo & Co', noindex: true })],
        build: {
            outDir,
            rollupOptions: { input: { app: path.join(root, APP_PAGE), landing: path.join(root, 'landing.html') } },
        },
    });
    const app = fs.readFileSync(path.join(outDir, APP_PAGE), 'utf8');
    assert.equal(titleOf(app), 'Demo &amp; Co');
    assert.match(app, /<meta name="robots" content="noindex"/);
    assert.match(app, /<link rel="manifest" href="\.\/manifest\.json"/);
    assert.ok(fs.existsSync(path.join(outDir, MANIFEST_FILE)));
    const landing = fs.readFileSync(path.join(outDir, 'landing.html'), 'utf8');
    assert.equal(titleOf(landing), 'Landing');
    assert.doesNotMatch(landing, /noindex|rel="manifest"/);
});
