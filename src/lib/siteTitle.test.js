import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SITE_TITLE, siteTitle } from './siteTitle.js';

test('the site is named by TITLE, without surrounding space', () => {
    assert.equal(siteTitle("Harsh's Blog"), "Harsh's Blog");
    assert.equal(siteTitle('  My Blog  '), 'My Blog');
});

test('without a TITLE the site is called Inscript', () => {
    assert.equal(DEFAULT_SITE_TITLE, 'Inscript');
    assert.equal(siteTitle(undefined), 'Inscript');
    assert.equal(siteTitle(null), 'Inscript');
    assert.equal(siteTitle(''), 'Inscript');
    assert.equal(siteTitle('   '), 'Inscript');
    assert.equal(siteTitle(42), 'Inscript');
});
