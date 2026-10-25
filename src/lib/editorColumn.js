// The width the writing column has on screen. Focus mode keeps it, so entering it does not make the
// text wrap anywhere else. The column is the nearest element around the text that caps its width
// (the editor's `max-width`). `getStyle` is the browser's getComputedStyle, passed in so Node's
// test runner can test this without a browser.

const TEXT_SELECTOR = '.ProseMirror';

/** The column's width in whole pixels, or null when it cannot be found or has no width yet. */
export function measureColumnWidth(root, getStyle = (element) => window.getComputedStyle(element)) {
    let element = root?.querySelector?.(TEXT_SELECTOR) ?? null;
    while (element && element !== root) {
        if (getStyle(element).maxWidth !== 'none') {
            const { width } = element.getBoundingClientRect();
            return width > 0 ? Math.round(width) : null;
        }
        element = element.parentElement;
    }
    return null;
}
