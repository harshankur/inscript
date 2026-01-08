import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSCRIPT_ROOT = path.resolve(__dirname, '..');

// Configuration from Env (relative to INSCRIPT_ROOT)
const CONTENT_DIR_REL = process.env.CONTENT_DIR;
const STATIC_DIR_REL = process.env.STATIC_DIR;
const DIST_DIR_REL = process.env.DIST_DIR;

const POSTS_DIR = path.resolve(INSCRIPT_ROOT, CONTENT_DIR_REL);
const STATIC_DIR = path.resolve(INSCRIPT_ROOT, STATIC_DIR_REL);
const OUTPUT_DIR = path.resolve(INSCRIPT_ROOT, DIST_DIR_REL);

// Configure Marked
marked.setOptions({
    gfm: true,
    breaks: true,
});

const processShortcodes = (markdown) => {
    return markdown.replace(/{{<\s*youtube\s+([a-zA-Z0-9_-]+)\s*>}}/g, (match, id) => {
        return `<div data-youtube-video="${id}" class="youtube-embed relative w-full aspect-video rounded-lg overflow-hidden my-4"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute top-0 left-0 w-full h-full"></iframe></div>`;
    });
};

async function main() {
    console.log(`Building static data to ${OUTPUT_DIR}...`);

    // 1. Ensure output directory exists (it should, if run after vite build)
    await fs.ensureDir(OUTPUT_DIR);

    // 2. Copy Static Assets
    console.log('Copying static assets...');
    // Copy all files from static to dist, merging with vite build output
    if (await fs.pathExists(STATIC_DIR)) {
        await fs.copy(STATIC_DIR, OUTPUT_DIR, { overwrite: true });
        console.log(`Copied static assets from ${STATIC_DIR} to ${OUTPUT_DIR}`);
    } else {
        console.warn(`Static directory not found: ${STATIC_DIR}`);
    }

    // Copy Custom Favicon if configured
    if (process.env.FAVICON) {
        const faviconSource = path.resolve(STATIC_DIR, process.env.FAVICON);
        const faviconDest = path.join(OUTPUT_DIR, 'favicon.png');
        if (await fs.pathExists(faviconSource)) {
            await fs.copy(faviconSource, faviconDest);
            console.log(`Copied custom favicon from ${faviconSource}`);
        } else {
            console.warn(`Custom favicon not found: ${faviconSource}`);
        }
    }

    // 3. Process Posts
    console.log('Processing posts...');
    const files = await fs.readdir(POSTS_DIR);
    const posts = await Promise.all(
        files.filter(f => f.endsWith('.md')).map(async (filename) => {
            const filePath = path.join(POSTS_DIR, filename);
            const content = await fs.readFile(filePath, 'utf8');
            const stats = await fs.stat(filePath);
            const { data, content: markdown } = matter(content);

            // Convert Markdown to HTML
            const processedMarkdown = processShortcodes(markdown);
            const html = marked.parse(processedMarkdown);

            // Use frontmatter created/modified or fallback to file stats
            const created = data.created
                ? new Date(data.created).toISOString()
                : (stats.birthtime || stats.ctime).toISOString();

            const modified = data.modified
                ? new Date(data.modified).toISOString()
                : stats.mtime.toISOString();

            return {
                filename,
                title: data.title || filename,
                created,
                modified,
                html, // Full content for static preview
                hasDraft: false, // No drafts in static preview
                isUnpublished: false,
                tags: data.tags || [],
                categories: data.categories || [],
                type: data.type,
            };
        })
    );

    // Sort posts (optional, but good for consistency)
    posts.sort((a, b) => new Date(b.created) - new Date(a.created));

    // 4. Write data.json
    await fs.writeJson(path.join(OUTPUT_DIR, 'data.json'), posts, { spaces: 2 });
    console.log(`Generated data.json with ${posts.length} posts.`);
}

main().catch(err => {
    console.error('Error generating data:', err);
    process.exit(1);
});
