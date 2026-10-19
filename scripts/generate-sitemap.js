import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPublishedPosts } from './published-posts.js';
import { ROBOTS_FILE, SITEMAP_FILE, buildSitemap, robotsWithSitemap, siteRoot, sitemapUrl } from './sitemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSCRIPT_ROOT = path.resolve(__dirname, '..');

// Configuration from Env (relative to INSCRIPT_ROOT)
const CONTENT_DIR_REL = process.env.CONTENT_DIR;
const DIST_DIR_REL = process.env.DIST_DIR;

const POSTS_DIR = path.resolve(INSCRIPT_ROOT, CONTENT_DIR_REL);
const OUTPUT_DIR = path.resolve(INSCRIPT_ROOT, DIST_DIR_REL);

async function generateSitemap() {
    console.log(`Generating ${SITEMAP_FILE}...`);

    // A sitemap lists absolute addresses, so without the site's own there is none to write.
    const root = siteRoot(process.env.SITE_URL);
    if (!root) {
        console.warn(`SITE_URL is not an absolute http(s) URL, so no ${SITEMAP_FILE} is written.`);
        return;
    }

    await fs.ensureDir(OUTPUT_DIR);
    const posts = await readPublishedPosts(POSTS_DIR);
    await fs.writeFile(path.join(OUTPUT_DIR, SITEMAP_FILE), buildSitemap(root, posts));
    console.log(`Sitemap generated with ${posts.length} posts to ${path.join(OUTPUT_DIR, SITEMAP_FILE)}`);

    // robots.txt names the sitemap only now that there is one, so a build without this step (the
    // demo, a plain `vite build`) never publishes a robots.txt pointing at a sitemap it lacks.
    const robotsPath = path.join(OUTPUT_DIR, ROBOTS_FILE);
    if (await fs.pathExists(robotsPath)) {
        const robots = await fs.readFile(robotsPath, 'utf8');
        const updated = robotsWithSitemap(robots, sitemapUrl(root));
        if (updated !== robots) {
            await fs.writeFile(robotsPath, updated);
            console.log(`Pointed ${ROBOTS_FILE} at the sitemap.`);
        }
    }
}

generateSitemap().catch(err => {
    console.error('Error generating sitemap:', err);
    process.exit(1);
});
