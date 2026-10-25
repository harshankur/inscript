// Starts the real server.js against throwaway folders and attacks it over HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { MAX_IMAGE_UPLOAD_BYTES } from './image-upload.js';

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server.js');
const START_TIMEOUT_MS = 15000;
// How long a server that must refuse to start gets to exit before the test fails.
const REFUSAL_TIMEOUT_MS = 10000;
const ALLOWED_ORIGIN = 'https://cms.example.com';
const OTHER_ORIGIN = 'https://evil.example';

const freePort = () => new Promise((resolve, reject) => {
    const probe = net.createServer().once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
        const { port } = probe.address();
        probe.close(() => resolve(port));
    });
});

function blogFolders(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-server-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const dirs = Object.fromEntries(['content', 'static', 'drafts', 'dist'].map(name => [name, path.join(root, name)]));
    Object.values(dirs).forEach(dir => fs.mkdirSync(dir));
    return { root, ...dirs };
}

// Runs server.js from the throwaway folder, so no .env of a real installation is read.
function runServer(t, folders, env) {
    const child = spawn(process.execPath, [SERVER], {
        cwd: folders.root,
        env: {
            PATH: process.env.PATH,
            CONTENT_DIR: folders.content,
            STATIC_DIR: folders.static,
            DRAFTS_DIR: folders.drafts,
            DIST_DIR: folders.dist,
            AUTH_ENABLED: 'false',
            // Any git command the server runs points at nothing, so a regression in a test can
            // never commit to or push the repository this checkout sits in.
            GIT_DIR: path.join(folders.root, 'no-repository'),
            ...env,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const exited = new Promise(resolve => child.once('exit', code => resolve(code)));
    t.after(() => child.kill());
    return { child, exited, output: () => output };
}

// The exit code of a server that must refuse to start; fails the test if it keeps running.
function exitCode(server) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`server.js started when it should have refused:\n${server.output()}`)), REFUSAL_TIMEOUT_MS);
    });
    return Promise.race([server.exited, timeout]).finally(() => clearTimeout(timer));
}

async function startServer(t, env = {}) {
    const folders = blogFolders(t);
    const port = await freePort();
    const server = runServer(t, folders, { SERVER_PORT: String(port), ...env });
    const base = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + START_TIMEOUT_MS;
    while (Date.now() < deadline) {
        try {
            await fetch(`${base}/api/me`);
            return { base, folders };
        } catch {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    throw new Error(`server.js did not start:\n${server.output()}`);
}

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function uploadForm(content, name, type) {
    const form = new FormData();
    form.append('image', new Blob([content], { type }), name);
    return { method: 'POST', body: form };
}

const json = (body) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('post and draft routes refuse file names that leave their folder', async (t) => {
    const { base, folders } = await startServer(t);
    const outside = path.join(folders.root, 'outside.md');
    const outsideJson = path.join(folders.root, 'outside.md.json');
    fs.writeFileSync(outside, 'keep me');
    fs.writeFileSync(outsideJson, '{}');

    // %2F reaches the route as "/" once Express decodes the parameter.
    for (const name of ['..%2Foutside.md', '..%2F..%2Foutside.md', '..%5Coutside.md', '.env', 'outside.txt']) {
        assert.equal((await fetch(`${base}/api/posts/${name}`)).status, 400, `GET ${name}`);
        assert.equal((await fetch(`${base}/api/posts/${name}`, { method: 'DELETE' })).status, 400, `DELETE post ${name}`);
        assert.equal((await fetch(`${base}/api/drafts/${name}`, { method: 'DELETE' })).status, 400, `DELETE draft ${name}`);
        assert.equal((await fetch(`${base}/api/drafts/${name}`, json({ history: [], currentIndex: 0 }))).status, 400, `POST draft ${name}`);
    }
    for (const filename of ['../outside.md', '../written.md', 'a/b.md', undefined]) {
        const res = await fetch(`${base}/api/posts`, json({ filename, frontmatter: {}, html: '<p>x</p>' }));
        assert.equal(res.status, 400, `POST post ${filename}`);
    }

    assert.equal(fs.readFileSync(outside, 'utf8'), 'keep me');
    assert.equal(fs.existsSync(outsideJson), true);
    assert.equal(fs.existsSync(path.join(folders.root, 'written.md')), false);
});

test('a plain post name still saves, drafts, opens and deletes', async (t) => {
    const { base, folders } = await startServer(t);
    const name = 'whateuropegetsright!.md';

    assert.equal((await fetch(`${base}/api/posts`, json({ filename: name, frontmatter: { title: 'Hi' }, html: '<p>Hello</p>' }))).status, 200);
    assert.equal(fs.existsSync(path.join(folders.content, name)), true);

    const draft = { history: [{ html: '<p>Draft</p>', title: 'Hi' }], currentIndex: 0 };
    assert.equal((await fetch(`${base}/api/drafts/${encodeURIComponent(name)}`, json(draft))).status, 200);
    assert.equal(fs.existsSync(path.join(folders.drafts, `${name}.json`)), true);

    const opened = await (await fetch(`${base}/api/posts/${encodeURIComponent(name)}`)).json();
    assert.equal(opened.hasDraft, true);
    assert.equal(opened.html, '<p>Draft</p>');

    assert.equal((await fetch(`${base}/api/posts/${encodeURIComponent(name)}`, { method: 'DELETE' })).status, 200);
    assert.equal(fs.existsSync(path.join(folders.content, name)), false);
    assert.equal(fs.existsSync(path.join(folders.drafts, `${name}.json`)), false);
});

test('no other site may read the API unless CORS_ORIGINS lists it', async (t) => {
    const closed = await startServer(t);
    const res = await fetch(`${closed.base}/api/me`, { headers: { origin: OTHER_ORIGIN } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);

    const open = await startServer(t, { CORS_ORIGINS: ALLOWED_ORIGIN });
    const allowed = await fetch(`${open.base}/api/me`, { headers: { origin: ALLOWED_ORIGIN } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
    const other = await fetch(`${open.base}/api/me`, { headers: { origin: OTHER_ORIGIN } });
    assert.notEqual(other.headers.get('access-control-allow-origin'), OTHER_ORIGIN);
    assert.notEqual(other.headers.get('access-control-allow-origin'), '*');
});

test('with authentication on and no session secret, the server does not start', async (t) => {
    const folders = blogFolders(t);
    const server = runServer(t, folders, { SERVER_PORT: String(await freePort()), AUTH_ENABLED: 'true', AUTH_USERNAME: 'admin', AUTH_PASSWORD_HASH: 'x' });
    assert.notEqual(await exitCode(server), 0);
    assert.match(server.output(), /SESSION_SECRET is not set/);
});

test('an invalid CORS_ORIGINS stops the server instead of opening access', async (t) => {
    const folders = blogFolders(t);
    const server = runServer(t, folders, { SERVER_PORT: String(await freePort()), CORS_ORIGINS: '*' });
    assert.notEqual(await exitCode(server), 0);
    assert.match(server.output(), /CORS_ORIGINS/);
});

test('only real images can be uploaded, and they get a name and type from the server', async (t) => {
    const { base, folders } = await startServer(t);

    const res = await fetch(`${base}/api/upload`, uploadForm(PNG, '../../evil.html', 'text/html'));
    assert.equal(res.status, 200);
    const { url } = await res.json();
    assert.match(url, /^\d+-\d+\.png$/);
    assert.deepEqual(fs.readFileSync(path.join(folders.static, url)), PNG);

    const served = await fetch(`${base}/${url}`);
    assert.equal(served.headers.get('content-type'), 'image/png');
    assert.equal(served.headers.get('x-content-type-options'), 'nosniff');

    const attacks = [
        ['<script>alert(document.cookie)</script>', 'photo.png', 'image/png'],
        ['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', 'logo.svg', 'image/svg+xml'],
        ['<!doctype html><script>alert(1)</script>', 'page.html', 'text/html'],
    ];
    for (const [content, name, type] of attacks) {
        assert.equal((await fetch(`${base}/api/upload`, uploadForm(content, name, type))).status, 415, name);
    }
    assert.deepEqual(fs.readdirSync(folders.static), [url]);
    assert.equal(fs.existsSync(path.join(folders.root, 'evil.html')), false);
});

test('an upload over the size limit is refused and not written', async (t) => {
    const { base, folders } = await startServer(t);
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_UPLOAD_BYTES)]);
    assert.equal((await fetch(`${base}/api/upload`, uploadForm(big, 'big.png', 'image/png'))).status, 413);
    assert.deepEqual(fs.readdirSync(folders.static), []);
});

test('an SVG already in the static folder is served without the power to run script', async (t) => {
    const { base, folders } = await startServer(t);
    fs.writeFileSync(path.join(folders.static, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    const res = await fetch(`${base}/icon.svg`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy'), /sandbox/);
    assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
});

test('the push route refuses unless ALLOW_PUSH is true', async (t) => {
    for (const ALLOW_PUSH of [undefined, 'false', 'TRUE', '1']) {
        const { base } = await startServer(t, ALLOW_PUSH === undefined ? {} : { ALLOW_PUSH });
        assert.equal((await fetch(`${base}/api/git/push`, { method: 'POST' })).status, 403, String(ALLOW_PUSH));
    }
});

test('the publish status says the site is out of date until it is built, and again after a post is saved', async (t) => {
    const { base, folders } = await startServer(t);
    const status = async () => (await fetch(`${base}/api/publish/status`)).json();

    assert.deepEqual(await status(), { stale: true, publishedAt: null }, 'never built');

    // A built site, older than nothing.
    const marker = path.join(folders.dist, 'data.json');
    fs.writeFileSync(marker, '[]');
    const builtAt = new Date(Date.now() - 60000);
    fs.utimesSync(marker, builtAt, builtAt);
    const built = await status();
    assert.equal(built.stale, false);
    assert.ok(Math.abs(built.publishedAt - builtAt.getTime()) < 1, 'it reports when the site was built');

    assert.equal((await fetch(`${base}/api/posts`, json({ filename: 'new.md', frontmatter: { title: 'New' }, html: '<p>x</p>' }))).status, 200);
    assert.equal((await status()).stale, true, 'a post was saved after the build');
});

test('the git status route answers with the error, not a hang, when the folder is no repository', async (t) => {
    // runServer points GIT_DIR at nothing, so git has no repository to read.
    const { base } = await startServer(t);
    const res = await fetch(`${base}/api/git/status`);
    assert.equal(res.status, 500);
    assert.equal(typeof (await res.json()).error, 'string');
});

test('the status routes are for a signed-in author only', async (t) => {
    const { base } = await startServer(t, { AUTH_ENABLED: 'true', SESSION_SECRET: 'test-secret-for-this-run', AUTH_USERNAME: 'a', AUTH_PASSWORD_HASH: 'x' });
    assert.equal((await fetch(`${base}/api/publish/status`)).status, 401);
    assert.equal((await fetch(`${base}/api/git/status`)).status, 401);
});

// A server with sign-in on and one author, and the cookie the server sets when they sign in.
const SIGN_IN_USER = 'author';
const SIGN_IN_PASSWORD = 'correct horse battery staple';
const BCRYPT_TEST_COST = 4;
async function signInCookie(t, env = {}) {
    const AUTH_PASSWORD_HASH = await bcrypt.hash(SIGN_IN_PASSWORD, BCRYPT_TEST_COST);
    const { base } = await startServer(t, {
        AUTH_ENABLED: 'true',
        AUTH_USERNAME: SIGN_IN_USER,
        AUTH_PASSWORD_HASH,
        SESSION_SECRET: 'a-secret-for-this-test-run',
        ...env,
    });
    const res = await fetch(`${base}/auth/login`, json({ username: SIGN_IN_USER, password: SIGN_IN_PASSWORD }));
    assert.equal(res.status, 200);
    const cookie = res.headers.getSetCookie().find(line => line.startsWith('connect.sid='));
    assert.ok(cookie, 'signing in sets the session cookie');
    return cookie;
}
// How long from now the cookie lasts, in seconds, from its Expires date (express-session sends
// the lifetime as a date).
const cookieLifetime = (cookie) => Math.round((Date.parse(/Expires=([^;]+)/i.exec(cookie)?.[1]) - Date.now()) / 1000);
// The cookie is made a moment before it is read, so a few seconds either way are the same lifetime.
const SAME_LIFETIME_TOLERANCE_SECONDS = 10;
const assertLifetime = (cookie, seconds) => {
    const lifetime = cookieLifetime(cookie);
    assert.ok(Math.abs(lifetime - seconds) <= SAME_LIFETIME_TOLERANCE_SECONDS, `the cookie lasts ${lifetime}s, expected ${seconds}s`);
};

test('a sign-in lasts 24 hours when SESSION_MAX_AGE_HOURS is not set', async (t) => {
    assertLifetime(await signInCookie(t), 24 * 60 * 60);
});

test('SESSION_MAX_AGE_HOURS sets how long a sign-in lasts', async (t) => {
    assertLifetime(await signInCookie(t, { SESSION_MAX_AGE_HOURS: '2' }), 2 * 60 * 60);
    assertLifetime(await signInCookie(t, { SESSION_MAX_AGE_HOURS: '0.5' }), 30 * 60);
});

test('a blank SESSION_MAX_AGE_HOURS is the default, not zero', async (t) => {
    assertLifetime(await signInCookie(t, { SESSION_MAX_AGE_HOURS: '  ' }), 24 * 60 * 60);
});

test('a SESSION_MAX_AGE_HOURS that is not a sensible number stops the server, signed in or not', async (t) => {
    for (const AUTH_ENABLED of ['false', 'true']) {
        for (const SESSION_MAX_AGE_HOURS of ['soon', '0', '-3', '99999', '1e2']) {
            const folders = blogFolders(t);
            const server = runServer(t, folders, {
                SERVER_PORT: String(await freePort()),
                AUTH_ENABLED,
                SESSION_SECRET: 'a-secret-for-this-test-run',
                SESSION_MAX_AGE_HOURS,
            });
            assert.notEqual(await exitCode(server), 0, `${AUTH_ENABLED} ${SESSION_MAX_AGE_HOURS}`);
            assert.match(server.output(), /SESSION_MAX_AGE_HOURS/);
        }
    }
});
