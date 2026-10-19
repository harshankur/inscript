// The <head> of the app's page (index.html), filled in by the build: the site's own title instead of
// a fixed one, a link to the web app manifest when setup wrote one, and, for a page search engines
// must leave out (the demo editor), a robots noindex. Other pages (the demo's landing page) are
// left as they are.
import fs from 'fs';
import path from 'path';
import { escapeMarkup } from './escape.js';
import { siteTitle } from '../src/lib/siteTitle.js';

export const APP_PAGE = 'index.html';
export const MANIFEST_FILE = 'manifest.json';

const TITLE_ELEMENT = /<title>[\s\S]*?<\/title>/i;
const HEAD_END = /<\/head>/i;
const INDENT = '    ';

// A file's path with symbolic links resolved (Vite names pages by it; a temporary folder on macOS
// is one), or as given when it does not exist.
function realPath(file) {
    try {
        return fs.realpathSync(file);
    } catch {
        return path.resolve(file);
    }
}

// `html` with its title set to siteTitle(title) (escaped), and the manifest link and the noindex
// tag added at the end of its head when asked for.
export function appHead(html, { title, manifest = false, noindex = false } = {}) {
    const titleElement = `<title>${escapeMarkup(siteTitle(title))}</title>`;
    const tags = [];
    if (!TITLE_ELEMENT.test(html)) tags.push(titleElement);
    if (manifest) tags.push(`<link rel="manifest" href="/${MANIFEST_FILE}" />`);
    if (noindex) tags.push('<meta name="robots" content="noindex" />');
    // Functions as replacements, so a "$" in the title is taken as it is.
    const titled = html.replace(TITLE_ELEMENT, () => titleElement);
    if (!tags.length) return titled;
    return titled.replace(HEAD_END, (end) => `${tags.map(tag => `${INDENT}${tag}\n`).join('')}${end}`);
}

// The Vite plugin. `root` is the folder of index.html, `title` the build's TITLE, and `noindex`
// whether search engines must leave the page out.
export default function htmlHead({ root, title, noindex = false }) {
    const page = realPath(path.resolve(root, APP_PAGE));
    let publicDir = '';
    return {
        name: 'inscript:html-head',
        configResolved(config) {
            publicDir = config.publicDir;
        },
        transformIndexHtml: {
            // Before Vite's own pass, which then serves the manifest link from the right base.
            order: 'pre',
            handler(html, context) {
                if (realPath(context.filename) !== page) return html;
                const manifest = Boolean(publicDir) && fs.existsSync(path.join(publicDir, MANIFEST_FILE));
                return appHead(html, { title, manifest, noindex });
            },
        },
    };
}
