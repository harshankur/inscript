// The web app manifest setup writes to public/, from assets/manifest.json: named after the site,
// with the favicon as its icon at the size the favicon really has.

export const FAVICON_FILE = 'favicon.png';
const PNG_TYPE = 'image/png';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// A PNG starts with its signature and then its IHDR chunk: a 4-byte length, the type "IHDR", and
// the width and height as 4-byte big-endian numbers.
const IHDR_TYPE_OFFSET = 12;
const IHDR_TYPE = 'IHDR';
const WIDTH_OFFSET = 16;
const HEIGHT_OFFSET = 20;
const IHDR_END = 24;

// The width and height of a PNG image, or null when `buffer` is not one.
export function pngSize(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < IHDR_END) return null;
    if (!PNG_SIGNATURE.every((byte, i) => buffer[i] === byte)) return null;
    if (buffer.toString('ascii', IHDR_TYPE_OFFSET, WIDTH_OFFSET) !== IHDR_TYPE) return null;
    const width = buffer.readUInt32BE(WIDTH_OFFSET);
    const height = buffer.readUInt32BE(HEIGHT_OFFSET);
    return width && height ? { width, height } : null;
}

// The manifest's icon list: the favicon, with its type and size when it is a PNG whose size can be
// read, and without either claim otherwise (a custom favicon may be any image).
export function faviconIcons(favicon) {
    const size = pngSize(favicon);
    return [size
        ? { src: FAVICON_FILE, sizes: `${size.width}x${size.height}`, type: PNG_TYPE }
        : { src: FAVICON_FILE }];
}

// `template` (assets/manifest.json) for the site called `title`, with `favicon` (the bytes of the
// favicon setup wrote, or null) as its icon.
export function webManifest(template, { title, favicon }) {
    return { ...template, name: title, short_name: title, icons: faviconIcons(favicon) };
}
