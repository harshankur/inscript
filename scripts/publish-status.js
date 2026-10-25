// Whether the published site is behind the posts and files it is built from. Saving a post changes
// its file, publishing writes the site, so the site is out of date exactly when something it is
// built from is newer than the site. That is read from the files' times, so it is true after the
// editor is reloaded or the server restarted, and when posts changed outside the editor too.
import fs from 'fs/promises';
import path from 'path';

// The file a publish writes, so its time is when the site was last built.
export const PUBLISH_MARKER = 'data.json';

// Bounds on the walk, so a deep or huge folder cannot stall the check. When a bound is reached the
// folder has not been fully read, and the site is reported out of date rather than guessed fresh.
export const MAX_SCAN_DEPTH = 6;
export const MAX_SCANNED_ENTRIES = 20000;

// The newest modification time (ms) of any file under `dir`, and whether the walk stopped short.
// Symlinks are not followed and names starting with "." (.DS_Store and the like) are not built
// into the site, so they count for nothing. A folder that is missing has nothing newer.
async function newestModification(dir, limits, state, depth = 0) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    let newest = 0;
    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
        if (state.scanned >= limits.maxEntries) {
            state.truncated = true;
            break;
        }
        state.scanned += 1;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (depth + 1 > limits.maxDepth) {
                state.truncated = true;
                continue;
            }
            newest = Math.max(newest, await newestModification(full, limits, state, depth + 1));
        } else if (entry.isFile()) {
            try {
                newest = Math.max(newest, (await fs.stat(full)).mtimeMs);
            } catch {
                // Gone since it was listed: nothing to count.
            }
        }
    }
    return newest;
}

/**
 * `{ stale, publishedAt }` for the site in `distDir` against the folders it is built from
 * (`sourceDirs`). `publishedAt` is when it was last built (ms), or null when it never was; a site
 * never built is out of date.
 */
export async function publishStatus({ sourceDirs, distDir }, limits = { maxDepth: MAX_SCAN_DEPTH, maxEntries: MAX_SCANNED_ENTRIES }) {
    let publishedAt;
    try {
        publishedAt = (await fs.stat(path.join(distDir, PUBLISH_MARKER))).mtimeMs;
    } catch {
        return { stale: true, publishedAt: null };
    }
    const state = { scanned: 0, truncated: false };
    let newest = 0;
    for (const dir of sourceDirs) {
        newest = Math.max(newest, await newestModification(dir, limits, state));
    }
    return { stale: state.truncated || newest > publishedAt, publishedAt };
}
