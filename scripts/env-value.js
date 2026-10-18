// A value as it must be written into a .env file to read back unchanged, by Vite (the published
// app's settings) and by dotenv (the server and the build scripts) alike. Both end an unquoted value
// at "#" and trim it, so a value with "#", a quote, or space at either end is quoted, with the
// quote it does not contain; everything else is written as is.
//
// "$" has no spelling both read alike (Vite expands "$NAME" even in single quotes, and dotenv keeps
// a backslash before it), and a value with both kinds of quote has no quoting either, so those are
// refused with an error naming the key, rather than written to come back different.
export function envValue(value, key = 'A setting') {
    const text = String(value ?? '');
    if (text.includes('$')) throw new Error(`${key} cannot contain "$", which .env readers do not read alike`);
    if (/[\r\n]/.test(text)) throw new Error(`${key} must be a single line`);
    const needsQuotes = text.includes('#') || text.includes('"') || text.includes("'") || text !== text.trim();
    if (!needsQuotes) return text;
    if (!text.includes('"')) return `"${text}"`;
    if (!text.includes("'")) return `'${text}'`;
    throw new Error(`${key} cannot contain both kinds of quote`);
}
