import test from 'node:test';
import assert from 'node:assert/strict';
import { displayTitle, editableTitle, ownsTitle } from './postTitle.js';

test('a post owns the live title only when it is the one loaded last', () => {
    assert.equal(ownsTitle({ filename: 'a.md', titleOwner: 'a.md' }), true);
    assert.equal(ownsTitle({ filename: 'b.md', titleOwner: 'a.md' }), false);
});

test('no post owns the live title before one is loaded, or when none is open', () => {
    assert.equal(ownsTitle({ filename: 'a.md', titleOwner: null }), false);
    assert.equal(ownsTitle({ filename: null, titleOwner: null }), false);
    assert.equal(ownsTitle({ filename: undefined, titleOwner: undefined }), false);
});

test('the post being edited shows its live title, so a rename shows at once', () => {
    assert.equal(
        displayTitle({ postFilename: 'a.md', activeFilename: 'a.md', titleOwner: 'a.md', liveTitle: 'Renamed', savedTitle: 'Saved' }),
        'Renamed',
    );
});

test('an emptied live title shows the saved title, not a blank row', () => {
    assert.equal(
        displayTitle({ postFilename: 'a.md', activeFilename: 'a.md', titleOwner: 'a.md', liveTitle: '', savedTitle: 'Saved' }),
        'Saved',
    );
});

test('regression: a post just chosen never shows the title of the one before it', () => {
    // A was open; B was clicked. The live title is still A's while B loads.
    const switching = { activeFilename: 'b.md', titleOwner: 'a.md', liveTitle: 'Title of A' };
    assert.equal(displayTitle({ ...switching, postFilename: 'b.md', savedTitle: 'Title of B' }), 'Title of B');
    // A's row is not the active one any more, so it shows the title its file has.
    assert.equal(displayTitle({ ...switching, postFilename: 'a.md', savedTitle: 'Saved title of A' }), 'Saved title of A');
});

test('once the new post has loaded it shows its own live title', () => {
    assert.equal(
        displayTitle({ postFilename: 'b.md', activeFilename: 'b.md', titleOwner: 'b.md', liveTitle: 'Draft title of B', savedTitle: 'Title of B' }),
        'Draft title of B',
    );
});

test('a post that is not being edited shows its saved title whoever owns the live one', () => {
    assert.equal(
        displayTitle({ postFilename: 'c.md', activeFilename: 'a.md', titleOwner: 'a.md', liveTitle: 'Title of A', savedTitle: 'Title of C' }),
        'Title of C',
    );
});

test('a post with no saved title shows nothing rather than another post\'s title', () => {
    assert.equal(displayTitle({ postFilename: 'b.md', activeFilename: 'b.md', titleOwner: 'a.md', liveTitle: 'Title of A' }), '');
    assert.equal(displayTitle({ postFilename: 'b.md', activeFilename: 'a.md', titleOwner: 'a.md', liveTitle: 'x', savedTitle: null }), '');
});

test('the title box holds the live title once the post owns it, even when it is empty', () => {
    assert.equal(editableTitle({ filename: 'a.md', titleOwner: 'a.md', liveTitle: 'Typing', savedTitle: 'Saved' }), 'Typing');
    assert.equal(editableTitle({ filename: 'a.md', titleOwner: 'a.md', liveTitle: '', savedTitle: 'Saved' }), '');
});

test('regression: the title box shows the saved title, not the previous post\'s, while a post loads', () => {
    assert.equal(editableTitle({ filename: 'b.md', titleOwner: 'a.md', liveTitle: 'Title of A', savedTitle: 'Title of B' }), 'Title of B');
    assert.equal(editableTitle({ filename: 'b.md', titleOwner: 'a.md', liveTitle: 'Title of A' }), '');
    assert.equal(editableTitle({ filename: 'b.md', titleOwner: null, liveTitle: '', savedTitle: 'Title of B' }), 'Title of B');
});
