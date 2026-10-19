// The project's landing page (landing.html, published by `npm run build:demo` as
// inscript.harshankur.com): what search engines and link previews read from its head.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { siteRoot } from './sitemap.js';

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const LANDING = read('landing.html');
// The head without its comments, which may name tags the page does not have.
const HEAD = LANDING.slice(0, LANDING.indexOf('</head>')).replace(/<!--[\s\S]*?-->/g, '');

// The content of the <meta> whose `attribute` (name or property) is `key`.
function meta(attribute, key) {
    const tag = HEAD.match(new RegExp(`<meta ${attribute}="${key}" content="([^"]*)">`));
    return tag?.[1] ?? null;
}

test('the landing page describes itself, once and briefly', () => {
    const description = meta('name', 'description');
    assert.ok(description && description.length >= 50 && description.length <= 160, description);
    assert.equal(HEAD.match(/name="description"/g).length, 1);
    assert.equal(meta('property', 'og:description'), description);
    assert.equal(meta('name', 'twitter:description'), description);
});

test('its canonical address is the demo build\'s SITE_URL, and the Open Graph address matches', () => {
    const { SITE_URL } = dotenv.parse(read('.env.demo'));
    const root = siteRoot(SITE_URL);
    assert.equal(root, 'https://inscript.harshankur.com/');
    assert.match(HEAD, new RegExp(`<link rel="canonical" href="${root}">`));
    assert.equal(meta('property', 'og:url'), root);
});

test('link previews get its title and type, and no picture from anywhere', () => {
    const title = HEAD.match(/<title>([^<]*)<\/title>/)[1];
    assert.equal(meta('property', 'og:title'), title);
    assert.equal(meta('name', 'twitter:title'), title);
    assert.equal(meta('property', 'og:type'), 'website');
    assert.equal(meta('property', 'og:site_name'), 'Inscript');
    assert.equal(meta('name', 'twitter:card'), 'summary');
    assert.doesNotMatch(HEAD, /og:image|twitter:image/);
});

test('the landing page is indexed, unlike the demo editor', () => {
    assert.doesNotMatch(HEAD, /name="robots"/);
});
