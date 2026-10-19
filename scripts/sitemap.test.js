import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ROBOTS_FILE,
    SITEMAP_FILE,
    buildSitemap,
    isoDate,
    postLastmod,
    postUrl,
    robotsWithSitemap,
    siteRoot,
    sitemapUrl,
} from './sitemap.js';

const ROOT = 'https://blog.example.com/';

test('the files are sitemap.xml and robots.txt', () => {
    assert.equal(SITEMAP_FILE, 'sitemap.xml');
    assert.equal(ROBOTS_FILE, 'robots.txt');
});

test('isoDate reads a YAML date and a date string, and nothing else', () => {
    assert.equal(isoDate(new Date('2024-05-01T00:00:00Z')), '2024-05-01T00:00:00.000Z');
    assert.equal(isoDate('2024-05-01T10:30:00Z'), '2024-05-01T10:30:00.000Z');
    assert.equal(isoDate('not a date'), null);
    assert.equal(isoDate(new Date('nonsense')), null);
    assert.equal(isoDate(''), null);
    assert.equal(isoDate('   '), null);
    assert.equal(isoDate(undefined), null);
    assert.equal(isoDate(null), null);
    assert.equal(isoDate(true), null);
    assert.equal(isoDate(1714521600000), null);
});

test('a post\'s lastmod is its modified date, else its created date, else none', () => {
    const created = new Date('2024-05-01T00:00:00Z');
    const modified = new Date('2024-06-01T00:00:00Z');
    assert.equal(postLastmod({ created, modified }), '2024-06-01T00:00:00.000Z');
    assert.equal(postLastmod({ created }), '2024-05-01T00:00:00.000Z');
    assert.equal(postLastmod({ created, modified: 'garbage' }), '2024-05-01T00:00:00.000Z');
    assert.equal(postLastmod({ date: modified }), null);
    assert.equal(postLastmod({}), null);
    assert.equal(postLastmod(undefined), null);
});

test('siteRoot is SITE_URL with one trailing slash, or null when it is no http(s) URL', () => {
    assert.equal(siteRoot('https://blog.example.com'), ROOT);
    assert.equal(siteRoot('https://blog.example.com/'), ROOT);
    assert.equal(siteRoot(' https://blog.example.com// '), ROOT);
    assert.equal(siteRoot('https://example.com/blog'), 'https://example.com/blog/');
    assert.equal(siteRoot(''), null);
    assert.equal(siteRoot(undefined), null);
    assert.equal(siteRoot('blog.example.com'), null);
    assert.equal(siteRoot('javascript:alert(1)'), null);
});

test('a post\'s address is the home page with ?post=<name>, encoded', () => {
    assert.equal(postUrl(ROOT, 'hello-world.md'), 'https://blog.example.com/?post=hello-world');
    assert.equal(postUrl('https://example.com/blog/', 'a.md'), 'https://example.com/blog/?post=a');
    assert.equal(postUrl(ROOT, 'tom & jerry.md'), 'https://blog.example.com/?post=tom+%26+jerry');
    assert.equal(postUrl(ROOT, 'größe.md'), 'https://blog.example.com/?post=gr%C3%B6%C3%9Fe');
    // Only the extension at the end is removed.
    assert.equal(postUrl(ROOT, 'a.mdx.md'), 'https://blog.example.com/?post=a.mdx');
});

test('the sitemap\'s address is next to the home page', () => {
    assert.equal(sitemapUrl(ROOT), 'https://blog.example.com/sitemap.xml');
    assert.equal(sitemapUrl('https://example.com/blog/'), 'https://example.com/blog/sitemap.xml');
});

const entries = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
const field = (entry, name) => entry.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? null;

test('the sitemap lists the home page and every post, each with its lastmod', () => {
    const xml = buildSitemap(ROOT, [
        { filename: 'old.md', data: { created: new Date('2024-01-01T00:00:00Z') } },
        { filename: 'new.md', data: { created: new Date('2024-02-01T00:00:00Z'), modified: '2024-03-05T12:00:00Z' } },
    ]);
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(xml.endsWith('</urlset>\n'));
    const [home, old, fresh] = entries(xml);
    assert.equal(field(home, 'loc'), ROOT);
    // The home page changed when its newest post did.
    assert.equal(field(home, 'lastmod'), '2024-03-05T12:00:00.000Z');
    assert.equal(field(home, 'changefreq'), 'daily');
    assert.equal(field(home, 'priority'), '1.0');
    assert.equal(field(old, 'loc'), 'https://blog.example.com/?post=old');
    assert.equal(field(old, 'lastmod'), '2024-01-01T00:00:00.000Z');
    assert.equal(field(old, 'changefreq'), 'monthly');
    assert.equal(field(old, 'priority'), '0.8');
    assert.equal(field(fresh, 'lastmod'), '2024-03-05T12:00:00.000Z');
});

test('lastmod is left out where no date is known, never the time of the build', () => {
    const xml = buildSitemap(ROOT, [{ filename: 'undated.md', data: { title: 'Undated' } }]);
    const [home, post] = entries(xml);
    assert.equal(field(home, 'lastmod'), null);
    assert.equal(field(post, 'lastmod'), null);
    assert.equal(field(post, 'loc'), 'https://blog.example.com/?post=undated');
    assert.doesNotMatch(xml, /<lastmod>/);
});

test('a site with no posts has only its home page, without a lastmod', () => {
    const urls = entries(buildSitemap(ROOT, []));
    assert.equal(urls.length, 1);
    assert.equal(field(urls[0], 'lastmod'), null);
});

test('every <loc> is XML-escaped', () => {
    const xml = buildSitemap('https://example.com/?a=1&b=2', []);
    assert.match(xml, /<loc>https:\/\/example\.com\/\?a=1&amp;b=2<\/loc>/);
    assert.doesNotMatch(xml, /&b=/);
    const post = buildSitemap(ROOT, [{ filename: `<it's>.md`, data: {} }]);
    assert.doesNotMatch(post, /<it/);
    assert.match(post, /<loc>https:\/\/blog\.example\.com\/\?post=%3Cit%27s%3E<\/loc>/);
});

test('robots.txt gets a Sitemap line when it names no sitemap', () => {
    const url = 'https://blog.example.com/sitemap.xml';
    assert.equal(robotsWithSitemap('User-agent: *\nAllow: /\n', url), `User-agent: *\nAllow: /\n\nSitemap: ${url}\n`);
    assert.equal(robotsWithSitemap('User-agent: *\nAllow: /', url), `User-agent: *\nAllow: /\n\nSitemap: ${url}\n`);
    assert.equal(robotsWithSitemap('', url), `Sitemap: ${url}\n`);
});

test('a robots.txt that already names a sitemap is kept as it is', () => {
    const own = 'User-agent: *\nDisallow: /private\n\nsitemap: https://cdn.example.com/map.xml\n';
    assert.equal(robotsWithSitemap(own, 'https://blog.example.com/sitemap.xml'), own);
    const spaced = 'User-agent: *\n  Sitemap : https://blog.example.com/sitemap.xml\n';
    assert.equal(robotsWithSitemap(spaced, 'https://blog.example.com/sitemap.xml'), spaced);
});
