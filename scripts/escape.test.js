import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeMarkup } from './escape.js';

test('every character with a meaning in markup is escaped', () => {
    assert.equal(escapeMarkup(`Tom & Jerry's <"Blog">`), 'Tom &amp; Jerry&#39;s &lt;&quot;Blog&quot;&gt;');
});

test('an ampersand is escaped once, so an existing entity is kept as text', () => {
    assert.equal(escapeMarkup('&amp;'), '&amp;amp;');
});

test('other text is written as it is', () => {
    assert.equal(escapeMarkup('https://example.com/?post=hello-world'), 'https://example.com/?post=hello-world');
    assert.equal(escapeMarkup('Größe 名前'), 'Größe 名前');
});

test('a missing value is empty, and a number is written as text', () => {
    assert.equal(escapeMarkup(undefined), '');
    assert.equal(escapeMarkup(null), '');
    assert.equal(escapeMarkup(2026), '2026');
});
