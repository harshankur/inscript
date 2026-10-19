import test from 'node:test';
import assert from 'node:assert/strict';
import { imageExtension } from './image-upload.js';

const bytes = (...parts) => Buffer.concat(parts.map(part => typeof part === 'string' ? Buffer.from(part, 'latin1') : Buffer.from(part)));
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'rest');

test('accepted image formats are told apart by their content', () => {
    assert.equal(imageExtension(PNG), '.png');
    assert.equal(imageExtension(bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF')), '.jpg');
    assert.equal(imageExtension(bytes('GIF89a', 'rest')), '.gif');
    assert.equal(imageExtension(bytes('GIF87a', 'rest')), '.gif');
    assert.equal(imageExtension(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 ')), '.webp');
    assert.equal(imageExtension(bytes([0, 0, 0, 0x1c], 'ftypavif', 'rest')), '.avif');
    assert.equal(imageExtension(bytes([0, 0, 0, 0x1c], 'ftypavis', 'rest')), '.avif');
});

test('anything else is refused, whatever it is called', () => {
    const refused = [
        bytes('<!doctype html><script>alert(1)</script>'),
        bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        bytes('<?xml version="1.0"?><svg/>'),
        bytes('RIFF', [0, 0, 0, 0], 'WAVEfmt '),
        bytes([0, 0, 0, 0x18], 'ftypmp42'),
        bytes([0x89, 0x50, 0x4e, 0x47]),
        bytes('%PDF-1.7'),
        bytes('GIF8'),
        Buffer.alloc(0),
        undefined, null, 'GIF89a', [0xff, 0xd8, 0xff],
    ];
    for (const value of refused) assert.equal(imageExtension(value), null, String(value));
});
