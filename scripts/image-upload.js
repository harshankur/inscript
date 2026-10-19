// The largest image the editor accepts, in bytes.
export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

const startsWith = (buffer, bytes, offset = 0) =>
    buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);
const ascii = (text) => [...text].map(char => char.charCodeAt(0));

// Raster image formats only. SVG is left out on purpose: it can carry script, and uploads are
// served from the editor's own address.
const SIGNATURES = [
    { extension: '.png', matches: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    { extension: '.jpg', matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
    { extension: '.gif', matches: (b) => startsWith(b, ascii('GIF87a')) || startsWith(b, ascii('GIF89a')) },
    { extension: '.webp', matches: (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8) },
    { extension: '.avif', matches: (b) => startsWith(b, ascii('ftyp'), 4) && (startsWith(b, ascii('avif'), 8) || startsWith(b, ascii('avis'), 8)) },
];

/**
 * The file extension for an uploaded image, taken from its content rather than its name or
 * stated type, or null when it is not one of the accepted image formats.
 */
export function imageExtension(buffer) {
    if (!Buffer.isBuffer(buffer)) return null;
    return SIGNATURES.find(signature => signature.matches(buffer))?.extension ?? null;
}
