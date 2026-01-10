// Axios is imported dynamically in non-demo mode

const isDemo = import.meta.env.MODE === 'demo';

// Mock Data for Demo
const DEMO_POSTS_KEY = 'inscript_demo_posts';
const DEMO_DRAFTS_KEY = 'inscript_demo_drafts';

const getDemoPosts = () => {
    const stored = localStorage.getItem(DEMO_POSTS_KEY);
    return stored ? JSON.parse(stored) : [
        {
            filename: 'welcome-to-inscript.md',
            title: 'Welcome to Inscript (Demo)',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: ['demo', 'welcome'],
            categories: ['Guide'],
            isUnpublished: false,
            content: '<h1>Welcome to Inscript!</h1><p>This is a <strong>live demo</strong> running entirely in your browser.</p><p>Feel free to edit this post or create new ones.</p><blockquote><p>Note: Changes are saved to your browser\'s LocalStorage.</p></blockquote>'
        }
    ];
};

const saveDemoPosts = (posts) => {
    localStorage.setItem(DEMO_POSTS_KEY, JSON.stringify(posts));
};

const getDemoDrafts = () => {
    const stored = localStorage.getItem(DEMO_DRAFTS_KEY);
    if (stored) return JSON.parse(stored);

    // Default demo drafts with version history for the welcome post
    return {
        'welcome-to-inscript.md': {
            history: [
                {
                    html: '<h1>My First Post</h1><p>Just getting started...</p>',
                    title: 'My First Post',
                    tags: [],
                    categories: [],
                    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
                },
                {
                    html: '<h1>Getting Started with Inscript</h1><p>This is my first blog post using Inscript.</p><p>It\'s pretty cool!</p>',
                    title: 'Getting Started with Inscript',
                    tags: ['first-post'],
                    categories: ['Personal'],
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
                },
                {
                    html: '<h1>Welcome to Inscript</h1><p>This is a <strong>live demo</strong> running entirely in your browser.</p><p>Feel free to explore the editor!</p>',
                    title: 'Welcome to Inscript',
                    tags: ['demo', 'tutorial'],
                    categories: ['Guide'],
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
                },
                {
                    html: '<h1>Welcome to Inscript!</h1><p>This is a <strong>live demo</strong> running entirely in your browser.</p><p>Feel free to edit this post or create new ones.</p><blockquote><p>Tip: All changes are saved to your browser\'s LocalStorage.</p></blockquote>',
                    title: 'Welcome to Inscript!',
                    tags: ['demo', 'welcome', 'tutorial'],
                    categories: ['Guide', 'Documentation'],
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
                },
                {
                    html: '<h1>Welcome to Inscript!</h1><p>This is a <strong>live demo</strong> running entirely in your browser.</p><p>Feel free to edit this post or create new ones.</p><blockquote><p>Note: Changes are saved to your browser\'s LocalStorage.</p></blockquote>',
                    title: 'Welcome to Inscript (Demo)',
                    tags: ['demo', 'welcome'],
                    categories: ['Guide'],
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
                }
            ],
            currentIndex: 4 // Point to the latest version
        }
    };
};

const saveDemoDraft = (filename, draftData) => {
    const drafts = getDemoDrafts();
    drafts[filename] = draftData;
    localStorage.setItem(DEMO_DRAFTS_KEY, JSON.stringify(drafts));
};

const deleteDemoDraft = (filename) => {
    const drafts = getDemoDrafts();
    delete drafts[filename];
    localStorage.setItem(DEMO_DRAFTS_KEY, JSON.stringify(drafts));
};


// Mock Implementation
const mockApi = {
    get: async (url, config) => {
        await new Promise(r => setTimeout(r, 400)); // Simulate latency

        if (url === '/api/posts') {
            return { data: getDemoPosts().map(({ content, ...meta }) => meta) };
        }

        // Strip query parameters for filename matching
        const cleanUrl = url.split('?')[0];

        if (cleanUrl.startsWith('/api/posts/')) {
            const filename = cleanUrl.split('/').pop();
            const post = getDemoPosts().find(p => p.filename === filename);
            if (post) {
                // Draft check
                const drafts = getDemoDrafts();
                const draft = drafts[filename];

                return {
                    data: {
                        filename,
                        frontmatter: {
                            title: post.title,
                            tags: post.tags,
                            categories: post.categories,
                            created: post.created,
                            modified: post.modified
                        },
                        html: post.content, // Simplified for demo, we mock HTML directly
                        title: post.title,
                        savedHtml: post.content,
                        savedTitle: post.title,
                        hasDraft: !!draft,
                        history: draft?.history || [],
                        currentIndex: draft?.currentIndex || 0,
                        isUnpublished: false
                    }
                };
            }
            // Check if it's a draft-only post (unpublished)
            const drafts = getDemoDrafts();
            const draftFilename = `${filename}.json`;

            // In real app, we check if draft exists. Here simplified.
            // If we want to support "New Post" in demo, we need to handle it.
            return { status: 404 };
        }

        if (url === '/api/images') {
            return {
                data: [
                    { url: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74', name: 'demo-nature.jpg' },
                    { url: 'https://images.unsplash.com/photo-1707345512638-997d31a10cee', name: 'demo-tech.jpg' }
                ]
            };
        }

        if (url === '/api/youtube/search') {
            return { data: { items: [] } }; // Mock empty search
        }

        return { data: {} };
    },

    post: async (url, data, config) => {
        await new Promise(r => setTimeout(r, 600));

        if (url === '/api/posts') {
            const { filename, frontmatter, html } = data;
            const posts = getDemoPosts();
            const index = posts.findIndex(p => p.filename === filename);

            const newPost = {
                filename,
                title: frontmatter.title || 'Untitled',
                created: frontmatter.created || new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: frontmatter.tags || [],
                categories: frontmatter.categories || [],
                content: html,
                isUnpublished: false
            };

            if (index >= 0) {
                posts[index] = newPost;
            } else {
                posts.push(newPost);
            }
            saveDemoPosts(posts);
            deleteDemoDraft(filename); // Clear draft on save
            return { data: { success: true, frontmatter } };
        }

        if (url.startsWith('/api/drafts/')) {
            const filename = url.split('/').pop();
            const { title, history, currentIndex } = data;
            saveDemoDraft(filename, { history, currentIndex, title });
            return { data: { success: true } };
        }

        if (url === '/api/upload') {
            // Mock upload - just return a random unsplash image to simulate "hosting"
            return { data: { url: 'https://source.unsplash.com/random/800x600' } };
        }

        return { data: { success: true } };
    },

    delete: async (url) => {
        await new Promise(r => setTimeout(r, 300));
        if (url.startsWith('/api/drafts/')) {
            const filename = url.split('/').pop();
            deleteDemoDraft(filename);
            return { data: { success: true } };
        }
        if (url.startsWith('/api/posts/')) {
            const filename = url.split('/').pop();
            const posts = getDemoPosts().filter(p => p.filename !== filename);
            saveDemoPosts(posts);
            deleteDemoDraft(filename);
            return { data: { success: true } };
        }
        return { data: { success: true } };
    }
};

// Fallback for Real Mode (Dynamic Import)
const realApi = {
    get: async (...args) => { const axios = (await import('axios')).default; return axios.get(...args); },
    post: async (...args) => { const axios = (await import('axios')).default; return axios.post(...args); },
    delete: async (...args) => { const axios = (await import('axios')).default; return axios.delete(...args); }
};

const api = isDemo ? mockApi : realApi;

export default api;
