// The posts the published site carries: every post in the content folder except those whose
// frontmatter says `draft: true`. The one place that decides it, so data.json (generate-data.js)
// and the sitemap (generate-sitemap.js) can never disagree about which posts are public.
import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { POST_EXTENSION } from './post-path.js';

// The frontmatter value that marks a post as not for publishing, as YAML reads `draft: true`
// (a boolean) or `draft: "true"` (a string, compared without case or surrounding space).
const DRAFT_VALUE = 'true';

export function isDraft(frontmatter) {
    const draft = frontmatter?.draft;
    if (draft === true) return true;
    return typeof draft === 'string' && draft.trim().toLowerCase() === DRAFT_VALUE;
}

// Each published post in `postsDir` as { filename, data (its frontmatter), content (its Markdown),
// stats (its file's fs.Stats) }, in the folder's order.
export async function readPublishedPosts(postsDir) {
    const filenames = (await fs.readdir(postsDir)).filter(name => name.endsWith(POST_EXTENSION));
    const posts = await Promise.all(filenames.map(async (filename) => {
        const filePath = path.join(postsDir, filename);
        const [source, stats] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
        const { data, content } = matter(source);
        return { filename, data, content, stats };
    }));
    return posts.filter(post => !isDraft(post.data));
}
