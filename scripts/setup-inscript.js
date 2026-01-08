
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSCRIPT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(INSCRIPT_ROOT, '.env');

// Template for .env
const ENV_TEMPLATE = `# Inscript Configuration
# NOTE: All the directory paths are relative to inscript/ directory or absolute paths.

# Title shown in the browser tab and sidebar
# Default: My Inscript Blog
TITLE=
# Used in sitemap and robots.txt
# Default: https://example.com
SITE_URL=

# MUST BE SET
# Content directory - where markdown files are stored.
# Default: ../content
CONTENT_DIR=
# Static directory - where static files like the images used in the posts are stored.
# Default: ../static
STATIC_DIR=

# OPTIONAL
# Favicon path - the icon shown in the browser tab and sidebar.
FAVICON=assets/favicon_default.png
# Drafts directory - where drafts which are autosaved or unpublished are stored.
DRAFTS_DIR=.drafts
# Output directory - where the generated files are stored.
DIST_DIR=../dist
# Port for the Inscript Server
SERVER_PORT=3001
# Port for the Inscript Client
CLIENT_PORT=5173

# EXPERIMENTAL FEATURES
# Allow push to remote after publishing
ALLOW_PUSH=false
`;

async function setup() {
    console.log('Setting up Inscript environment...');

    // 0. Load Environment Variables (Try .env if exists)
    if (await fs.pathExists(ENV_PATH)) {
        dotenv.config({ path: ENV_PATH });
    }

    // 1. Validate Required Variables
    // Check if we have what we need (either from .env or system/Netlify environment)
    const requiredVars = ['TITLE', 'SITE_URL', 'CONTENT_DIR', 'STATIC_DIR'];
    // In demo mode, we don't need these
    const missingVars = process.env.DEMO_MODE === 'true' ? [] : requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        // Variables are missing.
        console.error('\n❌ Error: Missing required environment variables:');
        missingVars.forEach(v => console.error(`   - ${v}`));

        // Check if we are in a CI environment
        if (process.env.CI) {
            console.error('\n🚫 CI Environment detected.');
            console.error('Please add the missing variables to your CI/Deployment configuration (e.g., Netlify Environment Variables).');
        } else {
            // Local Development: Help the user by creating the file
            if (!await fs.pathExists(ENV_PATH)) {
                await fs.writeFile(ENV_PATH, ENV_TEMPLATE);
                console.warn('\n⚠️  .env file was missing and has been created with default template.');
                console.warn('⚠️  Please configure: ' + ENV_PATH);
                console.warn('⚠️  Update TITLE, SITE_URL, SERVER_PORT and the required directory paths\n');
            } else {
                console.error('Please update your .env file or system environment variables.\n');
            }
        }
        process.exit(1);
    }

    // Directories
    const STATIC_DIR_REL = process.env.STATIC_DIR;
    const STATIC_DIR = path.resolve(INSCRIPT_ROOT, STATIC_DIR_REL);
    const PUBLIC_DIR = path.join(INSCRIPT_ROOT, 'public');
    const ASSETS_DIR = path.join(INSCRIPT_ROOT, 'assets');

    // Ensure public directory exists
    await fs.ensureDir(PUBLIC_DIR);

    const defaultFavicon = path.join(ASSETS_DIR, 'favicon_default.png');
    const targetFavicon = path.join(PUBLIC_DIR, 'favicon.png');

    // Logic:
    // 1. Check if FAVICON is set and exists in STATIC_DIR.
    // 2. If yes, copy that to public/favicon.png.
    // 3. If no, copy favicon_default.png to public/favicon.png.

    let faviconCopied = false;

    if (process.env.FAVICON) {
        const customFaviconPath = path.resolve(STATIC_DIR, process.env.FAVICON);
        if (await fs.pathExists(customFaviconPath)) {
            await fs.copy(customFaviconPath, targetFavicon);
            console.log(`Using custom favicon from: ${customFaviconPath}`);
            faviconCopied = true;
        } else {
            console.warn(`Custom favicon configured but not found at: ${customFaviconPath}`);
        }
    }

    if (!faviconCopied) {
        if (await fs.pathExists(defaultFavicon)) {
            await fs.copy(defaultFavicon, targetFavicon);
            console.log('Using default Inscript favicon.');
        } else {
            console.error('Error: favicon_default.png not found in assets directory. Favicon setup failed.');
        }
    }

    // 4. Generate Dynamic Assets (Manifest & Robots)

    // Strict requirement: No defaults in code, must come from Env.

    // Check for DEMO_MODE to skip env vars
    const isDemo = process.env.DEMO_MODE === 'true';
    if (isDemo) {
        console.log('🎭 DEMO MODE: Using default values for Demo build.');
    }

    const config = {
        title: isDemo ? 'Inscript Demo' : process.env.TITLE,
        siteUrl: isDemo ? 'https://harshankur.github.io/inscript' : process.env.SITE_URL
    };

    // Process Manifest
    const manifestSrc = path.join(ASSETS_DIR, 'manifest.json');
    if (await fs.pathExists(manifestSrc)) {
        const manifest = await fs.readJson(manifestSrc);
        if (config.title) {
            manifest.name = config.title;
            manifest.short_name = config.title;
        }
        await fs.writeJson(path.join(PUBLIC_DIR, 'manifest.json'), manifest, { spaces: 4 });
        console.log(`Generated manifest.json${config.title ? ` with title: "${config.title}"` : ''}`);
    } else {
        console.warn('Warning: assets/manifest.json not found.');
    }

    // Process Robots.txt
    const robotsSrc = path.join(ASSETS_DIR, 'robots.txt');
    if (await fs.pathExists(robotsSrc)) {
        let robots = await fs.readFile(robotsSrc, 'utf8');
        // Replace template placeholder {{SITE_URL}}
        if (config.siteUrl) {
            robots = robots.replace(/{{SITE_URL}}/g, config.siteUrl);
        }
        await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robots);
        console.log(`Generated robots.txt${config.siteUrl ? ` with Site URL: "${config.siteUrl}"` : ''}`);
    } else {
        console.warn('Warning: assets/robots.txt not found.');
    }
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
