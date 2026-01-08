
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSCRIPT_ROOT = path.resolve(__dirname, '..');

// Configuration from Env (relative to INSCRIPT_ROOT)
const CONTENT_DIR_REL = process.env.CONTENT_DIR;
const DIST_DIR_REL = process.env.DIST_DIR;

const POSTS_DIR = path.resolve(INSCRIPT_ROOT, CONTENT_DIR_REL);
const OUTPUT_DIR = path.resolve(INSCRIPT_ROOT, DIST_DIR_REL);
const BASE_URL = process.env.SITE_URL;

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

function generateSitemap() {
    console.log('Generating sitemap.xml...');

    // 1. Get all published posts
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
    const posts = [];

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        // Only include published posts
        if (data.draft !== true) {
            posts.push({
                filename: file.replace('.md', ''),
                lastmod: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
            });
        }
    });

    // 2. Build XML content
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
`;

    posts.forEach(post => {
        // Construct deep link URL
        // Currently using query param structure: ?post=filename
        // Ideally this should match the actual production URL structure
        const postUrl = `${BASE_URL}/?post=${post.filename}`;

        xml += `    <url>
        <loc>${postUrl}</loc>
        <lastmod>${post.lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
`;
    });

    xml += `</urlset>`;

    // 3. Write to file
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), xml);
    console.log(`Sitemap generated with ${posts.length} posts to ${OUTPUT_DIR}/sitemap.xml`);
}

generateSitemap();
