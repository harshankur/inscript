// Font licences ask for their notice to travel with every copy of the font (the SIL Open Font
// License and MIT alike), so the build publishes each font's licence next to the font files it
// writes. Fonts go to assets/fonts/ (see fontAssetFileName), and a licence is only written when
// the output actually contains that font: the published blog carries KaTeX's fonts, the demo
// site also the landing page's Inter and Outfit.
import fs from 'fs';
import path from 'path';

export const FONTS_DIR = 'assets/fonts';
const FONT_EXTENSION = /\.(woff2?|ttf|otf|eot)$/i;

// `fonts` matches the file names of the fonts a licence covers, `source` is the licence text
// (relative to the repository root) and `fileName` its name in the output's font folder.
export const FONT_LICENSES = [
    { fonts: /^KaTeX_/, source: 'node_modules/katex/LICENSE', fileName: 'LICENSE-KaTeX.txt' },
    { fonts: /^inter-/, source: 'assets/fonts/OFL-Inter.txt', fileName: 'OFL-Inter.txt' },
    { fonts: /^outfit-/, source: 'assets/fonts/OFL-Outfit.txt', fileName: 'OFL-Outfit.txt' },
];

// Rollup's `assetFileNames`: font files into the font folder, every other asset where Vite
// puts it by default.
export function fontAssetFileName(assetInfo) {
    const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
    return FONT_EXTENSION.test(name)
        ? `${FONTS_DIR}/[name]-[hash][extname]`
        : 'assets/[name]-[hash][extname]';
}

// The licences that cover at least one font among the output's file names.
export function licensesFor(fileNames, licenses = FONT_LICENSES) {
    const fonts = fileNames
        .filter(fileName => fileName.startsWith(`${FONTS_DIR}/`) && FONT_EXTENSION.test(fileName))
        .map(fileName => path.posix.basename(fileName));
    return licenses.filter(license => fonts.some(font => license.fonts.test(font)));
}

// The Vite plugin that writes those licences into the build output.
export default function fontLicenses(root, licenses = FONT_LICENSES) {
    return {
        name: 'inscript:font-licenses',
        apply: 'build',
        generateBundle(_options, bundle) {
            for (const license of licensesFor(Object.keys(bundle), licenses)) {
                this.emitFile({
                    type: 'asset',
                    fileName: `${FONTS_DIR}/${license.fileName}`,
                    source: fs.readFileSync(path.resolve(root, license.source)),
                });
            }
        },
    };
}
