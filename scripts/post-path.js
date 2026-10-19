import path from 'path';

export const POST_EXTENSION = '.md';
export const DRAFT_EXTENSION = '.json';
// The longest file name most file systems allow, in bytes; a draft adds DRAFT_EXTENSION to it.
export const MAX_POST_FILENAME_BYTES = 255 - DRAFT_EXTENSION.length;

/**
 * Whether `name` is a post's file name: a single name ending in POST_EXTENSION, with no
 * directory part, no separator of any platform, no NUL, not hidden, and short enough for a
 * draft file next to it.
 */
export function isPostFilename(name) {
    return typeof name === 'string'
        && name.endsWith(POST_EXTENSION)
        && name.length > POST_EXTENSION.length
        && !name.startsWith('.')
        && !/[/\\\0]/.test(name)
        && path.basename(name) === name
        && Buffer.byteLength(name) <= MAX_POST_FILENAME_BYTES;
}

/**
 * The absolute path of `filename` inside `root`, or null when `filename` is not a post's file
 * name or would resolve to anywhere but directly inside `root`.
 */
export function resolveInside(root, filename) {
    const base = path.resolve(root);
    const resolved = path.resolve(base, filename);
    return path.dirname(resolved) === base ? resolved : null;
}

/** The path of the post file `filename` in `postsDir`, or null when the name is not allowed. */
export function postPath(postsDir, filename) {
    return isPostFilename(filename) ? resolveInside(postsDir, filename) : null;
}

/** The path of the draft for the post `filename` in `draftsDir`, or null when the name is not allowed. */
export function draftPath(draftsDir, filename) {
    return isPostFilename(filename) ? resolveInside(draftsDir, `${filename}${DRAFT_EXTENSION}`) : null;
}
