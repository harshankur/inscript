import axios from 'axios';
import { exec } from 'child_process';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { marked } from 'marked';
import multer from 'multer';
import path from 'path';
import TurndownService from 'turndown';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.SERVER_PORT;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuration from Env
const CONTENT_DIR_REL = process.env.CONTENT_DIR;
const STATIC_DIR_REL = process.env.STATIC_DIR;
const DRAFTS_DIR_REL = process.env.DRAFTS_DIR;

const POSTS_DIR = path.resolve(__dirname, CONTENT_DIR_REL);
const STATIC_DIR = path.resolve(__dirname, STATIC_DIR_REL);
const DRAFTS_DIR = path.resolve(__dirname, DRAFTS_DIR_REL);

console.log('Inscript Config:');
console.log('Posts Dir:', POSTS_DIR);
console.log('Static Dir:', STATIC_DIR);
console.log('Drafts Dir:', DRAFTS_DIR);

// Serve static files from the configured static directory
app.use(express.static(STATIC_DIR));

// Ensure directories exist
fs.ensureDirSync(POSTS_DIR);
fs.ensureDirSync(DRAFTS_DIR);

// Configure Turndown
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// Helper to convert Hugo shortcodes to HTML
const processShortcodes = (markdown) => {
    // Youtube: {{< youtube ID >}}
    return markdown.replace(/{{<\s*youtube\s+([a-zA-Z0-9_-]+)\s*>}}/g, (match, id) => {
        return `<div data-youtube-video="${id}" class="youtube-embed relative w-full aspect-video rounded-lg overflow-hidden my-4"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute top-0 left-0 w-full h-full"></iframe></div>`;
    });
};

// Turndown Rule for Youtube
turndownService.addRule('youtube', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-youtube-video');
    },
    replacement: (content, node) => {
        const id = node.getAttribute('data-youtube-video');
        return `{{< youtube ${id} >}}`;
    }
});

// Configure Marked
marked.setOptions({
    gfm: true,
    breaks: true,
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, STATIC_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// List all posts
app.get('/api/youtube/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ items: [] });

    const SOURCES = [
        { url: 'https://pipedapi.kavin.rocks', type: 'piped' },
        { url: 'https://pipedapi-libre.kavin.rocks', type: 'piped' },
        { url: 'https://yewtu.be', type: 'invidious' },
        { url: 'https://inv.nadeko.net', type: 'invidious' },
        { url: 'https://iv.ggtyler.dev', type: 'invidious' },
        { url: 'https://invidious.projectsegfau.lt', type: 'invidious' },
        { url: 'https://iv.melmac.space', type: 'invidious' },
        { url: 'https://invidious.lunar.icu', type: 'invidious' },
        { url: 'https://pipedapi.leptons.xyz', type: 'piped' },
        { url: 'https://api.piped.yt', type: 'piped' }
    ];

    const axiosConfig = {
        timeout: 2500,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    for (const source of SOURCES) {
        try {
            if (source.type === 'piped') {
                const response = await axios.get(`${source.url}/search?q=${encodeURIComponent(q)}&filter=videos`, axiosConfig);
                if (response.data && response.data.items) {
                    return res.json(response.data);
                }
            } else if (source.type === 'invidious') {
                const response = await axios.get(`${source.url}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, axiosConfig);
                if (Array.isArray(response.data)) {
                    const items = response.data.map(v => ({
                        url: `/watch?v=${v.videoId}`,
                        title: v.title,
                        thumbnail: v.videoThumbnails?.find(t => t.quality === 'medium')?.url || v.videoThumbnails?.[0]?.url,
                        uploaderName: v.author,
                        views: v.viewCount,
                        duration: v.lengthSeconds
                    }));
                    return res.json({ items });
                }
            }
        } catch (err) {
            console.warn(`YouTube Search failed for ${source.url}: ${err.message}`);
            continue;
        }
    }

    res.status(502).json({ error: 'All YouTube search sources failed' });
});

app.get('/api/posts', async (req, res) => {
    try {
        const files = await fs.readdir(POSTS_DIR);
        const draftFiles = await fs.readdir(DRAFTS_DIR).catch(() => []);

        const posts = await Promise.all(
            files.filter(f => f.endsWith('.md')).map(async (filename) => {
                const filePath = path.join(POSTS_DIR, filename);
                const content = await fs.readFile(filePath, 'utf8');
                const stats = await fs.stat(filePath);
                const { data } = matter(content);

                const hasDraft = draftFiles.includes(`${filename}.json`);

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
                    hasDraft,
                    isUnpublished: false,
                    tags: data.tags || [],
                    categories: data.categories || [],
                    ...data // Spread other frontmatter fields like 'type'
                };
            })
        );

        // Handle Orphan Drafts (Unpublished Posts)
        const publishedFilenames = new Set(files.filter(f => f.endsWith('.md')));
        const orphanDrafts = draftFiles.filter(f => f.endsWith('.md.json') && !publishedFilenames.has(f.replace('.json', '')));

        const unpublishedPosts = await Promise.all(
            orphanDrafts.map(async (draftFilename) => {
                const filePath = path.join(DRAFTS_DIR, draftFilename);
                const draft = await fs.readJson(filePath);
                const filename = draftFilename.replace('.json', '');

                // Get latest state from history
                const latest = (draft.history && draft.history[draft.currentIndex]) ||
                    (draft.history && draft.history.length > 0 ? draft.history[draft.history.length - 1] : null) ||
                    { title: filename.replace('.md', ''), timestamp: new Date().toISOString() };

                return {
                    filename,
                    title: latest.title || filename,
                    created: latest.timestamp, // Draft creation/mod time
                    modified: latest.timestamp,
                    hasDraft: true,
                    isUnpublished: true,
                    tags: latest.tags || [],
                    categories: latest.categories || [],
                    type: draft.type
                };
            })
        );

        res.json([...posts, ...unpublishedPosts]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single post (with merged draft if exists)
app.get('/api/posts/:filename', async (req, res) => {
    try {
        const filePath = path.join(POSTS_DIR, req.params.filename);
        const draftPath = path.join(DRAFTS_DIR, `${req.params.filename}.json`);

        let frontmatter = {};
        let html = '';
        let title = req.params.filename.replace('.md', '');
        let savedHtml = '';
        let savedTitle = '';
        let isUnpublished = false;

        // Check if original file exists
        const fileExists = await fs.pathExists(filePath);

        if (fileExists) {
            const content = await fs.readFile(filePath, 'utf8');
            const parsed = matter(content);
            frontmatter = parsed.data;
            frontmatter = parsed.data;
            const markdown = processShortcodes(parsed.content);
            html = marked.parse(markdown);
            title = frontmatter.title || title;
            savedHtml = html;
            savedTitle = title;
        } else {
            // Check if it's an unpublished draft
            const draftExists = await fs.pathExists(draftPath);
            if (!draftExists) {
                return res.status(404).json({ error: 'Post not found' });
            }
            isUnpublished = true;
        }

        let history = [];
        let currentIndex = 0;

        const hasDraft = await fs.pathExists(draftPath);
        if (hasDraft) {
            const draft = await fs.readJson(draftPath);
            const activeItem = draft.history && draft.history[draft.currentIndex];
            if (activeItem) {
                // Drafts store HTML directly, but if we ever re-parse raw MD, we might need this.
                // Currently draft history is HTML. If the draft was loaded from MD initially, it already went through processShortcodes.
                html = activeItem.html;
                title = activeItem.title;
            }
            history = draft.history || [];
            currentIndex = draft.currentIndex || 0;

            // For unpublished drafts, populate frontmatter from latest draft state
            if (isUnpublished && activeItem) {
                frontmatter = {
                    title: activeItem.title,
                    tags: activeItem.tags || [],
                    categories: activeItem.categories || [],
                    created: activeItem.timestamp,
                    modified: activeItem.timestamp
                };
                savedTitle = activeItem.title;
                // savedHtml remains empty for unpublished drafts as there is no "published" version
            }
        }

        res.json({ filename: req.params.filename, frontmatter, html, title, savedHtml, savedTitle, hasDraft, history, currentIndex, isUnpublished });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save post (and clear draft)
app.post('/api/posts', async (req, res) => {
    try {
        const { filename, frontmatter, html } = req.body;
        const markdown = turndownService.turndown(html);

        // Enforce modified time. Preserve existing created time or set it if missing.
        const now = new Date().toISOString();
        frontmatter.modified = now;
        if (!frontmatter.created) {
            frontmatter.created = now;
        }
        const fileContent = matter.stringify(markdown, frontmatter);
        await fs.writeFile(path.join(POSTS_DIR, filename), fileContent);

        // Clear draft on successful permanent save
        const draftPath = path.join(DRAFTS_DIR, `${filename}.json`);
        await fs.remove(draftPath).catch(() => { });

        res.json({ success: true, frontmatter });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Draft Management
app.post('/api/drafts/:filename', async (req, res) => {
    try {
        const { title, history, currentIndex } = req.body;
        const draftPath = path.join(DRAFTS_DIR, `${req.params.filename}.json`);

        // Server is now a dumb store for the client-managed history stack
        await fs.writeJson(draftPath, {
            history,
            currentIndex
        }, { spaces: 4 });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/drafts/:filename', async (req, res) => {
    try {
        const draftPath = path.join(DRAFTS_DIR, `${req.params.filename}.json`);
        await fs.remove(draftPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Publish static site
app.post('/api/publish', async (req, res) => {
    try {
        console.log('🚀 Publishing static site...');
        // Execute the publish script defined in package.json
        const { stdout, stderr } = await execAsync('npm run publish', { cwd: __dirname });
        console.log('Publish Output:', stdout);
        if (stderr) console.error('Publish Error Output:', stderr);
        res.json({ success: true, output: stdout });
    } catch (err) {
        console.error('Publish Failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Git Commit
app.post('/api/git/commit', async (req, res) => {
    try {
        const { message, filename } = req.body;
        console.log(`📝 Committing changes: ${message}`);

        // Ensure we are in the project root (one level up from inscript/ if server.js is in inscript/)
        const projectRoot = path.join(__dirname, '..');

        // Add all changes (or could be specific to filename if provided)
        await execAsync('git add .', { cwd: projectRoot });
        const { stdout } = await execAsync(`git commit -m "${message || 'Update blog content'}"`, { cwd: projectRoot });

        res.json({ success: true, output: stdout });
    } catch (err) {
        // If nothing to commit, git commit returns non-zero. Check for that.
        if (err.stdout && err.stdout.includes('nothing to commit')) {
            return res.json({ success: true, output: 'Nothing to commit, working tree clean' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Git Push
app.post('/api/git/push', async (req, res) => {
    try {
        console.log('⬆️ Pushing to remote...');
        const projectRoot = path.join(__dirname, '..');
        const { stdout } = await execAsync('git push', { cwd: projectRoot });
        res.json({ success: true, output: stdout });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/posts/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(POSTS_DIR, filename);
        const draftPath = path.join(DRAFTS_DIR, `${filename}.json`);

        if (await fs.pathExists(filePath)) await fs.remove(filePath);
        if (await fs.pathExists(draftPath)) await fs.remove(draftPath);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        res.json({ url: req.file.filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper for recursive files
async function getFiles(dir) {
    const subdirs = await fs.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await fs.stat(res)).isDirectory() ? await getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

// List all images
app.get('/api/images', async (req, res) => {
    try {
        const allFiles = await getFiles(STATIC_DIR);
        const images = allFiles
            .filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))
            .map(fullPath => {
                const relativePath = path.relative(STATIC_DIR, fullPath);
                return {
                    url: `/${relativePath}`,
                    name: relativePath
                };
            });
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Inscript Server running at http://0.0.0.0:${port}`);
});
