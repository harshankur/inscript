import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { commitAll, commitMessage, DEFAULT_COMMIT_MESSAGE, MAX_COMMIT_MESSAGE_LENGTH } from './git.js';

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
