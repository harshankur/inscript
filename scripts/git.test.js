import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { commitAll, commitMessage, DEFAULT_COMMIT_MESSAGE, GIT_STATUS_TIMEOUT_MS, MAX_COMMIT_MESSAGE_LENGTH, repoStatus } from './git.js';

// A commit hook runs with git's own variables set (GIT_INDEX_FILE=.git/index and the like). The
// repositories made here must not inherit them: inside a submodule, whose .git is a file, that
// path is wrong. Each test file runs in a process of its own, so this reaches no other test.
for (const key of Object.keys(process.env)) {
    if (key.startsWith('GIT_')) delete process.env[key];
}

function tempRepo(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-git-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
    git('init', '--quiet');
    git('config', 'user.name', 'Inscript Test');
    git('config', 'user.email', 'test@example.com');
    git('config', 'commit.gpgsign', 'false');
    return { dir, git, lastMessage: () => git('log', '-1', '--format=%B').replace(/\n+$/, '') };
}

test('a message with shell syntax is committed word for word and runs nothing', async (t) => {
    const { dir, lastMessage } = tempRepo(t);
    const marker = path.join(dir, 'pwned');
    const payloads = [
        `"; touch ${marker}; echo "`,
        `$(touch ${marker})`,
        `\`touch ${marker}\``,
        `x' && touch ${marker} && echo '`,
        `line one\ntouch ${marker}`,
    ];
    for (const [i, message] of payloads.entries()) {
        fs.writeFileSync(path.join(dir, `post-${i}.md`), `post ${i}`);
        const result = await commitAll(dir, message);
        assert.equal(result.committed, true);
        assert.equal(lastMessage(), message);
        assert.equal(fs.existsSync(marker), false, `the payload ran: ${message}`);
    }
});

test('a message that looks like a git option is taken as the message', async (t) => {
    const { dir, git, lastMessage } = tempRepo(t);
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await commitAll(dir, 'first');
    fs.writeFileSync(path.join(dir, 'b.md'), 'b');
    await commitAll(dir, '--amend');
    assert.equal(lastMessage(), '--amend');
    assert.equal(git('rev-list', '--count', 'HEAD').trim(), '2');
});

test('nothing to commit is reported as success, without a new commit', async (t) => {
    const { dir, git } = tempRepo(t);
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await commitAll(dir, 'first');
    const result = await commitAll(dir, 'second');
    assert.equal(result.committed, false);
    assert.equal(git('rev-list', '--count', 'HEAD').trim(), '1');
});

test('a missing, empty or non-text message falls back to the default', () => {
    for (const message of [undefined, null, '', '   ', 42, ['a'], { toString: () => 'x' }]) {
        assert.equal(commitMessage(message), DEFAULT_COMMIT_MESSAGE);
    }
    assert.equal(commitMessage('Fix a typo'), 'Fix a typo');
});

test('an overlong message is refused before git runs', async (t) => {
    const { dir, git } = tempRepo(t);
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    assert.equal(commitMessage('x'.repeat(MAX_COMMIT_MESSAGE_LENGTH)).length, MAX_COMMIT_MESSAGE_LENGTH);
    await assert.rejects(commitAll(dir, 'x'.repeat(MAX_COMMIT_MESSAGE_LENGTH + 1)), RangeError);
    assert.equal(git('status', '--porcelain').trim(), '?? a.md');
});

test('a repository with nothing changed and no remote has nothing to commit and nothing to push', async (t) => {
    const { dir } = tempRepo(t);
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await commitAll(dir, 'first');
    assert.deepEqual(await repoStatus(dir), { dirty: false, ahead: 0, hasUpstream: false });
});

test('a new, a changed and a staged file each leave something to commit', async (t) => {
    const { dir, git } = tempRepo(t);
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await commitAll(dir, 'first');

    fs.writeFileSync(path.join(dir, 'new.md'), 'new');
    assert.equal((await repoStatus(dir)).dirty, true, 'untracked');
    fs.rmSync(path.join(dir, 'new.md'));
    assert.equal((await repoStatus(dir)).dirty, false);

    fs.writeFileSync(path.join(dir, 'a.md'), 'changed');
    assert.equal((await repoStatus(dir)).dirty, true, 'modified');

    git('add', 'a.md');
    assert.equal((await repoStatus(dir)).dirty, true, 'staged');

    await commitAll(dir, 'second');
    assert.equal((await repoStatus(dir)).dirty, false, 'committed');
});

test('commits the remote does not have are counted until they are pushed', async (t) => {
    const { dir, git } = tempRepo(t);
    const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-remote-'));
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    execFileSync('git', ['init', '--bare', '--quiet'], { cwd: remote });
    git('remote', 'add', 'origin', remote);

    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await commitAll(dir, 'first');
    git('push', '--quiet', '-u', 'origin', 'HEAD');
    assert.deepEqual(await repoStatus(dir), { dirty: false, ahead: 0, hasUpstream: true });

    fs.writeFileSync(path.join(dir, 'b.md'), 'b');
    await commitAll(dir, 'second');
    fs.writeFileSync(path.join(dir, 'c.md'), 'c');
    await commitAll(dir, 'third');
    assert.deepEqual(await repoStatus(dir), { dirty: false, ahead: 2, hasUpstream: true });

    git('push', '--quiet');
    assert.deepEqual(await repoStatus(dir), { dirty: false, ahead: 0, hasUpstream: true });
});

test('a submodule whose files changed is not a change to commit, but a new commit in it is', async (t) => {
    const sub = tempRepo(t);
    fs.writeFileSync(path.join(sub.dir, 'lib.js'), 'v1');
    await commitAll(sub.dir, 'sub first');

    const { dir, git } = tempRepo(t);
    git('-c', 'protocol.file.allow=always', 'submodule', 'add', '--quiet', sub.dir, 'sub');
    await commitAll(dir, 'add submodule');
    assert.equal((await repoStatus(dir)).dirty, false);

    fs.writeFileSync(path.join(dir, 'sub', 'lib.js'), 'edited, not committed');
    fs.writeFileSync(path.join(dir, 'sub', 'untracked.js'), 'x');
    assert.equal((await repoStatus(dir)).dirty, false, 'only the submodule\'s files changed');
    assert.ok(git('status', '--porcelain').includes('sub'), 'plain git status does see it');

    execFileSync('git', ['config', 'user.name', 'Inscript Test'], { cwd: path.join(dir, 'sub') });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: path.join(dir, 'sub') });
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: path.join(dir, 'sub') });
    execFileSync('git', ['commit', '--quiet', '-am', 'sub second'], { cwd: path.join(dir, 'sub') });
    assert.equal((await repoStatus(dir)).dirty, true, 'the submodule is at a new commit');
});

test('a folder that is not a repository is an error, not an empty status', async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-notgit-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    await assert.rejects(repoStatus(dir));
});

test('a status check has a time limit', () => {
    assert.ok(Number.isInteger(GIT_STATUS_TIMEOUT_MS) && GIT_STATUS_TIMEOUT_MS > 0);
});
