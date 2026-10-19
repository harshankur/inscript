import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { draftPath, isPostFilename, MAX_POST_FILENAME_BYTES, postPath, resolveInside } from './post-path.js';

const POSTS = path.resolve('/srv/blog/content');
const DRAFTS = path.resolve('/srv/blog/drafts');

test('a plain post file name resolves inside its folder', () => {
    for (const name of ['hello.md', 'Introduction.md', 'whateuropegetsright!.md', 'two words.md', 'ümlaut.md']) {
        assert.equal(postPath(POSTS, name), path.join(POSTS, name));
        assert.equal(draftPath(DRAFTS, name), path.join(DRAFTS, `${name}.json`));
    }
});

test('names that leave the folder, or are not a post file, are refused', () => {
    const refused = [
        '../outside.md', '../../etc/passwd', '..', '.', '', 'a/b.md', 'a\\b.md', '..\\outside.md',
        '/etc/hosts.md', 'C:\\Windows\\x.md', '.env', '.hidden.md', '.md', 'post.txt', 'post.md\0.png',
        'post.MD', `${'a'.repeat(MAX_POST_FILENAME_BYTES)}.md`,
        undefined, null, 42, ['a.md'], { toString: () => 'a.md' },
    ];
    for (const name of refused) {
        assert.equal(isPostFilename(name), false, `accepted: ${String(name)}`);
        assert.equal(postPath(POSTS, name), null);
        assert.equal(draftPath(DRAFTS, name), null);
    }
});

test('the longest allowed name still fits a draft file next to it', () => {
    const longest = `${'a'.repeat(MAX_POST_FILENAME_BYTES - 3)}.md`;
    assert.equal(isPostFilename(longest), true);
    assert.equal(path.basename(draftPath(DRAFTS, longest)).length, 255);
});

test('resolveInside only accepts a path directly inside the folder', () => {
    assert.equal(resolveInside(POSTS, 'a.md'), path.join(POSTS, 'a.md'));
    assert.equal(resolveInside(POSTS, '../a.md'), null);
    assert.equal(resolveInside(POSTS, 'sub/a.md'), null);
    assert.equal(resolveInside(POSTS, '/etc/passwd'), null);
});
