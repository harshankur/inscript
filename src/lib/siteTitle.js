// The site's name, as the browser tab and the sidebar show it: the build's TITLE, or Inscript's own
// name when TITLE is unset or blank. Plain functions without import.meta, so the Vite config
// (scripts/html-head.js) and the app name the site alike and Node's test runner can test them.

export const DEFAULT_SITE_TITLE = 'Inscript';

export function siteTitle(value) {
    const title = typeof value === 'string' ? value.trim() : '';
    return title || DEFAULT_SITE_TITLE;
}
