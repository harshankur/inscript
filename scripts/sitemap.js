// The published site's sitemap.xml, and the robots.txt line that points crawlers at it. Plain
// functions over the posts readPublishedPosts returns, so Node's test runner can test them;
// generate-sitemap.js writes the files.
import { escapeMarkup } from './escape.js';
import { POST_EXTENSION } from './post-path.js';
import { httpUrl } from '../src/lib/footerConfig.js';
import { PAGE_QUERY } from '../src/lib/viewCounting.js';

export const SITEMAP_FILE = 'sitemap.xml';
export const ROBOTS_FILE = 'robots.txt';

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const HOME_CHANGEFREQ = 'daily';
const HOME_PRIORITY = '1.0';
const POST_CHANGEFREQ = 'monthly';
const POST_PRIORITY = '0.8';
const INDENT = '    ';

// A robots.txt line naming a sitemap, as crawlers read it: the field name in any case.
const SITEMAP_DIRECTIVE = /^[ \t]*sitemap[ \t]*:/im;

// A frontmatter date (YAML gives a Date for `2024-05-01`, a string for anything it does not read
// as one) as an ISO 8601 timestamp, or null when it is missing or not a date.
export function isoDate(value) {
    if (!(value instanceof Date) && !(typeof value === 'string' && value.trim())) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// When a post last changed, from its frontmatter: `modified`, else `created`, else null. Never the
// file's own time, which in a build service is the time of the checkout, not of the post.
export function postLastmod(frontmatter) {
    return isoDate(frontmatter?.modified) ?? isoDate(frontmatter?.created);
}

// SITE_URL as the address of the site's home page (with one trailing slash), or null when it is
// not an absolute http(s) URL.
export function siteRoot(siteUrl) {
    const url = httpUrl(siteUrl);
    return url ? new URL(`${url.replace(/\/+$/, '')}/`).href : null;
}

// The address the app gives a post: the home page with ?post=<name> (the file name without
// POST_EXTENSION), encoded as the app's own address bar encodes it.
export function postUrl(root, filename) {
    const url = new URL(root);
    const name = filename.endsWith(POST_EXTENSION) ? filename.slice(0, -POST_EXTENSION.length) : filename;
    url.searchParams.set(PAGE_QUERY, name);
    return url.href;
}

export function sitemapUrl(root) {
    return new URL(SITEMAP_FILE, root).href;
}

function urlEntry(loc, lastmod, changefreq, priority) {
    const lines = [`<loc>${escapeMarkup(loc)}</loc>`];
    if (lastmod) lines.push(`<lastmod>${lastmod}</lastmod>`);
    lines.push(`<changefreq>${changefreq}</changefreq>`, `<priority>${priority}</priority>`);
    return [`${INDENT}<url>`, ...lines.map(line => `${INDENT}${INDENT}${line}`), `${INDENT}</url>`].join('\n');
}

// The sitemap of the site at `root` (siteRoot) with `posts` ({ filename, data }). A post's lastmod
// is postLastmod, the home page's the latest of those; either is left out when there is none.
export function buildSitemap(root, posts) {
    const entries = posts.map(post => ({ loc: postUrl(root, post.filename), lastmod: postLastmod(post.data) }));
    const homeLastmod = entries.map(entry => entry.lastmod).filter(Boolean).sort().at(-1) ?? null;
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<urlset xmlns="${SITEMAP_NAMESPACE}">`,
        urlEntry(root, homeLastmod, HOME_CHANGEFREQ, HOME_PRIORITY),
        ...entries.map(entry => urlEntry(entry.loc, entry.lastmod, POST_CHANGEFREQ, POST_PRIORITY)),
        '</urlset>',
        '',
    ].join('\n');
}

// `robots` with a line pointing at the sitemap, added only when it names no sitemap yet: a site's
// own robots.txt (copied from STATIC_DIR) keeps whatever it says.
export function robotsWithSitemap(robots, url) {
    if (SITEMAP_DIRECTIVE.test(robots)) return robots;
    const body = robots.trimEnd();
    return `${body ? `${body}\n\n` : ''}Sitemap: ${url}\n`;
}
