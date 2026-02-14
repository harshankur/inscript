import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSCRIPT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(INSCRIPT_ROOT, '.env');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query, defaultValue = '') => new Promise((resolve) => {
    const prompt = defaultValue ? `${query} (${defaultValue}): ` : `${query}: `;
    rl.question(prompt, (answer) => {
        resolve(answer || defaultValue);
    });
});

const smartQuestion = async (key, query, defaultValue, existingConfig) => {
    if (existingConfig[key]) return existingConfig[key];
    return await question(query, defaultValue);
};

async function setup() {
    console.log('\n🚀 Welcome to the Inscript Setup Wizard!');
    console.log('This will help you configure your CMS environment and security.\n');

    // 0. Load existing config if available
    let existingConfig = {};
    if (await fs.pathExists(ENV_PATH)) {
        const content = await fs.readFile(ENV_PATH, 'utf8');
        existingConfig = dotenv.parse(content);
        console.log('ℹ️  Found existing .env file. Checking for missing configuration...\n');
    }

    // 1. Basic Configuration
    console.log('--- Configuration ---');
    const title = await smartQuestion('TITLE', 'Blog Title', 'My Inscript Blog', existingConfig);
    const siteUrl = await smartQuestion('SITE_URL', 'Site URL', 'https://example.com', existingConfig);
    const contentDir = await smartQuestion('CONTENT_DIR', 'Content directory (relative to inscript/)', '../content', existingConfig);
    const staticDir = await smartQuestion('STATIC_DIR', 'Static directory (relative to inscript/)', '../static', existingConfig);
    const draftsDir = await smartQuestion('DRAFTS_DIR', 'Drafts directory (relative to inscript/)', '.drafts', existingConfig);
    const distDir = await smartQuestion('DIST_DIR', 'Output (Dist) directory (relative to inscript/)', '../dist', existingConfig);
    const serverPort = await smartQuestion('SERVER_PORT', 'Server Port', '3001', existingConfig);
    const clientPort = await smartQuestion('CLIENT_PORT', 'Client Port', '5173', existingConfig);
    const allowedHosts = await smartQuestion('ALLOWED_HOSTS', 'Allowed Hosts (comma-separated or "true")', 'true', existingConfig);

    // 2. Authentication Configuration
    console.log('\n--- Authentication & Security ---');
    let authEnabled = existingConfig.AUTH_ENABLED === 'true';
    if (existingConfig.AUTH_ENABLED === undefined) {
        const enableAuthString = await question(`Enable authentication? (y/n)`, 'n');
        authEnabled = enableAuthString.toLowerCase().startsWith('y');
    }

    let authUsername = existingConfig.AUTH_USERNAME || 'admin';
    let authPasswordHash = existingConfig.AUTH_PASSWORD_HASH || '';
    let sessionSecret = existingConfig.SESSION_SECRET || '';

    if (authEnabled) {
        if (!existingConfig.AUTH_USERNAME) {
            authUsername = await question('Admin Username', 'admin');
        }

        if (!authPasswordHash) {
            const password = await question('Enter admin password');
            if (password) {
                const salt = await bcrypt.genSalt(10);
                authPasswordHash = await bcrypt.hash(password, salt);
                console.log('✅ Password hash generated.');
            } else {
                console.error('❌ Error: Password cannot be empty for initial setup.');
                process.exit(1);
            }
        }

        if (!sessionSecret) {
            sessionSecret = crypto.randomBytes(32).toString('hex');
            console.log('✅ Secure Session Secret generated.');
        }
    }

    // 3. Save to .env
    const envContent = `# Inscript Configuration Generated on ${new Date().toISOString()}

# General
TITLE=${title}
SITE_URL=${siteUrl}

# Directories
CONTENT_DIR=${contentDir}
STATIC_DIR=${staticDir}
DRAFTS_DIR=${draftsDir}
DIST_DIR=${distDir}

# Ports & Hosts
SERVER_PORT=${serverPort}
CLIENT_PORT=${clientPort}
ALLOWED_HOSTS=${allowedHosts}

# Authentication
AUTH_ENABLED=${authEnabled}
AUTH_USERNAME=${authUsername}
AUTH_PASSWORD_HASH=${authPasswordHash}
SESSION_SECRET=${sessionSecret}

# Experimental
ALLOW_PUSH=${existingConfig.ALLOW_PUSH || 'false'}
FAVICON=${existingConfig.FAVICON || 'assets/favicon_default.png'}
`;

    await fs.writeFile(ENV_PATH, envContent);
    console.log('\n✅ .env file updated successfully.');

    // 4. Asset Generation (Favicon, Robots, Manifest)
    console.log('\n--- Post-Setup Tasks ---');
    process.env.TITLE = title;
    process.env.SITE_URL = siteUrl;
    process.env.STATIC_DIR = staticDir;
    process.env.FAVICON = existingConfig.FAVICON || 'assets/favicon_default.png';

    const PUBLIC_DIR = path.join(INSCRIPT_ROOT, 'public');
    const ASSETS_DIR = path.join(INSCRIPT_ROOT, 'assets');
    await fs.ensureDir(PUBLIC_DIR);

    // Favicon
    const defaultFavicon = path.join(ASSETS_DIR, 'favicon_default.png');
    const targetFavicon = path.join(PUBLIC_DIR, 'favicon.png');
    let faviconCopied = false;

    if (process.env.FAVICON && process.env.DEMO_MODE !== 'true') {
        const customFaviconPath = path.resolve(INSCRIPT_ROOT, staticDir, process.env.FAVICON);
        if (await fs.pathExists(customFaviconPath)) {
            await fs.copy(customFaviconPath, targetFavicon);
            console.log(`- Using custom favicon from: ${customFaviconPath}`);
            faviconCopied = true;
        }
    }

    if (!faviconCopied && await fs.pathExists(defaultFavicon)) {
        await fs.copy(defaultFavicon, targetFavicon);
        console.log('- Using default Inscript favicon.');
    }

    // Manifest
    const manifestSrc = path.join(ASSETS_DIR, 'manifest.json');
    if (await fs.pathExists(manifestSrc)) {
        const manifest = await fs.readJson(manifestSrc);
        manifest.name = title;
        manifest.short_name = title;
        await fs.writeJson(path.join(PUBLIC_DIR, 'manifest.json'), manifest, { spaces: 4 });
        console.log('- Generated manifest.json');
    }

    // Robots.txt
    const robotsSrc = path.join(ASSETS_DIR, 'robots.txt');
    if (await fs.pathExists(robotsSrc)) {
        let robots = await fs.readFile(robotsSrc, 'utf8');
        robots = robots.replace(/{{SITE_URL}}/g, siteUrl);
        await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robots);
        console.log('- Generated robots.txt');
    }

    console.log('\n✨ Inscript setup complete! Run "npm run dev" to start.');
    console.log('\n💡 Tip: You can edit the .env file directly to modify any configuration you just set.');
    console.log('🔑 Forgot your credentials? Delete the AUTH_USERNAME and AUTH_PASSWORD_HASH lines from .env and run this setup again.');
    rl.close();
}

setup().catch(err => {
    console.error('\n❌ Setup failed:', err);
    rl.close();
    process.exit(1);
});
