/**
 * The address to show an image the server stored under `url` at: the server answers with the
 * file's name in the static folder, which the site serves from its root (as the media library
 * lists it). An address that is already absolute (the demo's placeholder, or one with a scheme)
 * is kept. Null when the server gave no usable name.
 */
export function uploadedImageSrc(url) {
    if (typeof url !== 'string' || !url.trim()) return null;
    const value = url.trim();
    if (value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
    return `/${value}`;
}
