// Markdown <-> editor HTML, shared by the server (loading and saving posts) and
// generate-data.js (the published site), so every reader of a post sees what the
// editor wrote. inscript-editor's own rules carry the editor's nodes (source comments,
// embeds, YouTube, citations, checklists, tables, ...) and read GFM task lists and
// <!-- --> comments on load; this file only reads legacy Hugo YouTube shortcodes.
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { applyInscriptEditorTurndownRules } from 'inscript-editor';

const escapeAttr = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// --- Markdown -> HTML ---

marked.use({ gfm: true, breaks: true });

const youtubeEmbed = (id, label) => {
    const labelAttr = label ? ` data-embed-label="${escapeAttr(label)}"` : '';
    return `<div data-youtube-video="${id}"${labelAttr} class="youtube-embed relative w-full aspect-video rounded-lg overflow-hidden my-4"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute top-0 left-0 w-full h-full"></iframe></div>`;
};

// Hugo's youtube shortcode, positional (`{{< youtube ID >}}`) or named
// (`{{< youtube id="ID" title="Caption" >}}`), from posts written before Inscript saved the
// standard embed. Read only: the post upgrades to the embed the next time it is saved.
const processShortcodes = (markdown) => {
    return markdown.replace(/{{<\s*youtube\s+(.*?)\s*>}}/g, (match, args) => {
        if (/^[a-zA-Z0-9_-]+$/.test(args)) return youtubeEmbed(args);
        const params = {};
        for (const [, key, value] of args.matchAll(/(\w+)="((?:[^"\\]|\\.)*)"/g)) {
            params[key] = value.replace(/\\(.)/g, '$1');
        }
        return /^[a-zA-Z0-9_-]+$/.test(params.id || '') ? youtubeEmbed(params.id, params.title) : match;
    });
};

/** Converts a post's Markdown body to HTML. */
export const markdownToHtml = (markdown) => marked.parse(processShortcodes(markdown));

// --- HTML -> Markdown ---

/** A TurndownService that writes the editor's HTML back to Markdown without losing its nodes. */
export const createTurndownService = () => {
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    turndownService.use(gfm);

    // inscript-editor's nodes (after gfm, so its rules take precedence). YouTube videos are
    // saved as the standard <iframe> embed in the editor's wrapper, which keeps the caption,
    // width and alignment; never as a Hugo shortcode.
    applyInscriptEditorTurndownRules(turndownService);

    return turndownService;
};
