import test from 'node:test';
import assert from 'node:assert/strict';
import { measureColumnWidth } from './editorColumn.js';

// A tree of stand-ins for the editor's elements: [name, maxWidth, width].
function tree(levels) {
    let parent = null;
    const elements = {};
    for (const [name, maxWidth, width] of levels) {
        elements[name] = { name, maxWidth, parentElement: parent, getBoundingClientRect: () => ({ width }) };
        parent = elements[name];
    }
    return elements;
}
const style = (element) => ({ maxWidth: element.maxWidth });
const rootWith = (text) => ({ querySelector: (selector) => (selector === '.ProseMirror' ? text : null) });

test('the column is the nearest element around the text that caps its width', () => {
    const els = tree([['root', 'none', 1400], ['column', '1152px', 1036.4], ['wrapper', 'none', 1036.4], ['text', 'none', 1000]]);
    els.root.querySelector = () => els.text;
    assert.equal(measureColumnWidth(els.root, style), 1036);
});

test('the width is a whole number of pixels', () => {
    const els = tree([['root', 'none', 1400], ['column', '640px', 639.6], ['text', 'none', 600]]);
    els.root.querySelector = () => els.text;
    assert.equal(measureColumnWidth(els.root, style), 640);
});

test('the text itself counts when it is the element that caps the width', () => {
    const els = tree([['root', 'none', 1400], ['text', '48rem', 768]]);
    els.root.querySelector = () => els.text;
    assert.equal(measureColumnWidth(els.root, style), 768);
});

test('the search stops at the editor\'s own container and never reads the page around it', () => {
    const els = tree([['page', '500px', 500], ['root', 'none', 1400], ['wrapper', 'none', 1000], ['text', 'none', 1000]]);
    els.root.querySelector = () => els.text;
    assert.equal(measureColumnWidth(els.root, style), null);
});

test('there is no column when there is no text, no container or no width', () => {
    assert.equal(measureColumnWidth(null, style), null);
    assert.equal(measureColumnWidth(undefined, style), null);
    assert.equal(measureColumnWidth(rootWith(null), style), null);
    assert.equal(measureColumnWidth({}, style), null);
    const els = tree([['root', 'none', 0], ['column', '1152px', 0], ['text', 'none', 0]]);
    els.root.querySelector = () => els.text;
    assert.equal(measureColumnWidth(els.root, style), null, 'a column with no width yet');
});
