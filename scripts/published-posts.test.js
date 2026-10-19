import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isDraft, readPublishedPosts } from './published-posts.js';

test('draft: true marks a post as a draft, as a boolean or as the text "true"', () => {
    assert.equal(isDraft({ draft: true }), true);
    assert.equal(isDraft({ draft: 'true' }), true);
    assert.equal(isDraft({ draft: ' TRUE ' }), true);
});

test('any other draft value, or none, is a published post', () => {
    assert.equal(isDraft({ draft: false }), false);
    assert.equal(isDraft({ draft: 'false' }), false);
    assert.equal(isDraft({ draft: 'yes please' }), false);
    assert.equal(isDraft({ draft: 1 }), false);
    assert.equal(isDraft({ title: 'Hello' }), false);
    assert.equal(isDraft({}), false);
    assert.equal(isDraft(undefined), false);
});

function contentFolder(t, files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inscript-posts-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
    return dir;
}

test('readPublishedPosts reads every post but the drafts, with its frontmatter, Markdown and file stats', async (t) => {
    const dir = contentFolder(t, {
        'hello.md': '---\ntitle: Hello\ncreated: 2024-05-01\n---\n# Hi\n',
        'secret.md': '---\ntitle: Secret\ndraft: true\n---\nNot yet.\n',
        'quoted.md': '---\ntitle: Quoted\ndraft: "true"\n---\nNot yet either.\n',
        'plain.md': 'No frontmatter.\n',
        'notes.txt': 'Not a post.\n',
    });
    const posts = await readPublishedPosts(dir);
    const byName = Object.fromEntries(posts.map(post => [post.filename, post]));
    assert.deepEqual(Object.keys(byName).sort(), ['hello.md', 'plain.md']);
    assert.equal(byName['hello.md'].data.title, 'Hello');
    assert.ok(byName['hello.md'].data.created instanceof Date);
    assert.equal(byName['hello.md'].content.trim(), '# Hi');
    assert.deepEqual(byName['plain.md'].data, {});
    assert.ok(byName['plain.md'].stats.isFile());
});

test('readPublishedPosts of an empty folder is empty', async (t) => {
    assert.deepEqual(await readPublishedPosts(contentFolder(t, {})), []);
});
