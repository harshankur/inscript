// Runs the real setup script in a throwaway copy of the files it uses, so the repository's own
// .env and public/ are never touched, and checks what it writes.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);

// A developer's own .env, with a line setup does not write itself.
const DEVELOPER_ENV = [
    '# My own notes',
    'TITLE=My Real Blog',
    'SITE_URL=https://blog.example.com',
    'CONTENT_DIR=../content',
    'STATIC_DIR=../static',
    'AUTH_ENABLED=false',
    'MY_OWN_SETTING=kept',
    '',
].join('\n');
const DEMO_ENV = 'TITLE=The Demo\nSITE_URL=https://demo.example.com\n';

const roots = [];
after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })));

// What setup reads (its scripts, src/lib, assets, node_modules) in a folder of its own.
function checkout(files = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-setup-'));
    roots.push(root);
    for (const dir of ['scripts', 'src/lib', 'assets']) {
        fs.cpSync(path.join(REPO, dir), path.join(root, dir), { recursive: true });
    }
    fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'), 'dir');
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);
    return root;
}

// Longest a setup run may take; one that waits for an answer is stopped and fails the test.
const SETUP_TIMEOUT_MS = 30000;

// Setup with only `env` set and nothing to read answers from, so a question it asks ends it
// unfinished.
function setup(root, env) {
    const running = run(process.execPath, [path.join(root, 'scripts', 'setup-inscript.js')], {
        cwd: root,
        env: { PATH: process.env.PATH, ...env },
        timeout: SETUP_TIMEOUT_MS,
    });
    running.child.stdin.end();
    return running;
}

const read = (root, name) => fs.readFileSync(path.join(root, name), 'utf8');
const exists = (root, name) => fs.existsSync(path.join(root, name));

test('the demo build takes .env.demo over .env, and leaves .env exactly as it was', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV, '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true' });
    assert.equal(read(root, '.env'), DEVELOPER_ENV);
    assert.equal(JSON.parse(read(root, 'public/manifest.json')).name, 'The Demo');
    assert.doesNotMatch(read(root, 'public/robots.txt'), /sitemap/i);
});

test('the demo build asks nothing and writes no .env when there is none', async () => {
    const root = checkout({ '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true' });
    assert.equal(exists(root, '.env'), false);
    assert.equal(JSON.parse(read(root, 'public/manifest.json')).name, 'The Demo');
    assert.ok(exists(root, 'public/robots.txt'));
    assert.ok(exists(root, 'public/favicon.png'));
});

test('the manifest claims the size the favicon really has', async () => {
    const root = checkout({ '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true' });
    // The default favicon is 128 by 128 pixels.
    assert.deepEqual(JSON.parse(read(root, 'public/manifest.json')).icons, [{ src: 'favicon.png', sizes: '128x128', type: 'image/png' }]);
});

test('the environment wins over .env.demo in the demo build, as it does in Vite', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV, '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true', TITLE: 'From The Shell' });
    assert.equal(JSON.parse(read(root, 'public/manifest.json')).name, 'From The Shell');
    assert.equal(read(root, '.env'), DEVELOPER_ENV);
});

test('a normal setup still writes .env from the environment and the existing .env, ignoring .env.demo', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV, '.env.demo': DEMO_ENV });
    // The rest of what setup would otherwise ask for, as a build service sets it.
    await setup(root, {
        SITE_URL: 'https://blog.example.org',
        FAVICON: 'favicon.png',
        DRAFTS_DIR: '../drafts',
        DIST_DIR: '../dist',
        SERVER_PORT: '3001',
        CLIENT_PORT: '5173',
        ALLOWED_HOSTS: 'true',
    });
    const env = read(root, '.env');
    assert.match(env, /^TITLE=My Real Blog$/m);
    assert.match(env, /^SITE_URL=https:\/\/blog\.example\.org$/m);
    assert.match(env, /^AUTH_ENABLED=false$/m);
    assert.equal(JSON.parse(read(root, 'public/manifest.json')).name, 'My Real Blog');
    // robots.txt names no sitemap: the publish step adds it with the sitemap.
    assert.equal(read(root, 'public/robots.txt'), 'User-agent: *\nAllow: /\n');
});

// What a build service sets so that setup asks nothing.
const BUILD_ENV = {
    SITE_URL: 'https://blog.example.org',
    FAVICON: 'favicon.png',
    DRAFTS_DIR: '../drafts',
    DIST_DIR: '../dist',
    SERVER_PORT: '3001',
    CLIENT_PORT: '5173',
    ALLOWED_HOSTS: 'true',
};
const COUNTING_ENV = { VIEWCOUNTER_URL: 'https://views.example.com', VIEWCOUNTER_APP_ID: 'blog', VIEWCOUNTER_EDGE: 'true' };

test('setup carries the view counting settings into .env, the operator with them', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV });
    await setup(root, { ...BUILD_ENV, ...COUNTING_ENV, VIEWCOUNTER_OPERATOR: 'Jane Doe' });
    const env = read(root, '.env');
    assert.match(env, /^VIEWCOUNTER_URL=https:\/\/views\.example\.com$/m);
    assert.match(env, /^VIEWCOUNTER_APP_ID=blog$/m);
    assert.match(env, /^VIEWCOUNTER_EDGE=true$/m);
    assert.match(env, /^VIEWCOUNTER_OPERATOR=Jane Doe$/m);
});

test('setup keeps the operator an existing .env sets, and writes it empty when none is set', async () => {
    const kept = checkout({ '.env': `${DEVELOPER_ENV}VIEWCOUNTER_OPERATOR="Jane Doe & Co #1"\n` });
    await setup(kept, BUILD_ENV);
    assert.match(read(kept, '.env'), /^VIEWCOUNTER_OPERATOR="Jane Doe & Co #1"$/m);
    const unset = checkout({ '.env': DEVELOPER_ENV });
    await setup(unset, BUILD_ENV);
    assert.match(read(unset, '.env'), /^VIEWCOUNTER_OPERATOR=$/m);
});

test('setup refuses an operator of more than one line, and leaves .env as it was', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV });
    await assert.rejects(
        setup(root, { ...BUILD_ENV, ...COUNTING_ENV, VIEWCOUNTER_OPERATOR: 'Jane\nDoe' }),
        (err) => /VIEWCOUNTER_OPERATOR must be a single line/.test(err.stderr),
    );
    assert.equal(read(root, '.env'), DEVELOPER_ENV);
});

test('the demo build still writes no .env, whatever operator the environment sets', async () => {
    const root = checkout({ '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true', VIEWCOUNTER_OPERATOR: 'Jane Doe' });
    assert.equal(exists(root, '.env'), false);
});

test('setup carries the sign-in length into .env, from the environment or the .env that is there', async () => {
    const fromEnvironment = checkout({ '.env': DEVELOPER_ENV });
    await setup(fromEnvironment, { ...BUILD_ENV, SESSION_MAX_AGE_HOURS: '12' });
    assert.match(read(fromEnvironment, '.env'), /^SESSION_MAX_AGE_HOURS=12$/m);

    // A restart runs setup again: the value an operator wrote into .env must still be there after.
    const kept = checkout({ '.env': `${DEVELOPER_ENV}SESSION_MAX_AGE_HOURS=0.5\n` });
    await setup(kept, BUILD_ENV);
    assert.match(read(kept, '.env'), /^SESSION_MAX_AGE_HOURS=0\.5$/m);

    // The environment wins over the file, as for every other setting.
    const overridden = checkout({ '.env': `${DEVELOPER_ENV}SESSION_MAX_AGE_HOURS=0.5\n` });
    await setup(overridden, { ...BUILD_ENV, SESSION_MAX_AGE_HOURS: '6' });
    assert.match(read(overridden, '.env'), /^SESSION_MAX_AGE_HOURS=6$/m);
});

test('setup writes the sign-in length empty when none is set, which is the default', async () => {
    const root = checkout({ '.env': DEVELOPER_ENV });
    await setup(root, BUILD_ENV);
    assert.match(read(root, '.env'), /^SESSION_MAX_AGE_HOURS=$/m);
});

test('setup refuses a sign-in length that is not a number of hours, and leaves .env as it was', async () => {
    for (const SESSION_MAX_AGE_HOURS of ['soon', '0', '1e3']) {
        const root = checkout({ '.env': DEVELOPER_ENV });
        await assert.rejects(
            setup(root, { ...BUILD_ENV, SESSION_MAX_AGE_HOURS }),
            (err) => /SESSION_MAX_AGE_HOURS/.test(err.stderr),
            SESSION_MAX_AGE_HOURS,
        );
        assert.equal(read(root, '.env'), DEVELOPER_ENV);
    }
});

test('the demo build writes no .env, whatever sign-in length the environment sets', async () => {
    const root = checkout({ '.env.demo': DEMO_ENV });
    await setup(root, { DEMO_MODE: 'true', SESSION_MAX_AGE_HOURS: '12' });
    assert.equal(exists(root, '.env'), false);
});
