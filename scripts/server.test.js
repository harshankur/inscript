// Starts the real server.js against throwaway folders and attacks it over HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    const dirs = Object.fromEntries(['content', 'static', 'drafts'].map(name => [name, path.join(root, name)]));
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
            AUTH_ENABLED: 'false',
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
