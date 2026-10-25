// Which title to show for a post. The editor holds one live title; it belongs to the post that was
// loaded last (`titleOwner`). Between choosing another post and that post arriving, `filename`
// already names the new post while the live title is still the old post's, so a title may only be
// shown as a post's own when that post owns it. Every other time the post shows the title its
// file has. Plain functions, so Node's test runner can test them.

/** Whether the live title is the title of the post named `filename`. */
export function ownsTitle({ filename, titleOwner }) {
    return Boolean(filename) && filename === titleOwner;
}

/**
 * The title for a post in a list, the header or the browser tab: the live title while the post
 * being edited owns it (so a rename shows at once, and an emptied title shows the saved one),
 * otherwise the title its file has.
 */
export function displayTitle({ postFilename, activeFilename, titleOwner, liveTitle, savedTitle }) {
    const isLive = postFilename === activeFilename && ownsTitle({ filename: postFilename, titleOwner });
    return (isLive && liveTitle) || savedTitle || '';
}

/**
 * The text of the title box. Once the post owns the live title it is that, even when empty, so
 * the author can clear the box to type a new title; until then it is the title its file has.
 */
export function editableTitle({ filename, titleOwner, liveTitle, savedTitle }) {
    return ownsTitle({ filename, titleOwner }) ? liveTitle : (savedTitle ?? '');
}
