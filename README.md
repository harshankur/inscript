# Inscript

A unified system that helps you write and publish your markdown-based blog. A modern, "plug and play" CMS built with React, Vite, Express, and Tailwind CSS.
Designed to be a seamless submodule for any static site generator (Hugo, Astro, Next.js, etc.).

## 🎮 Live Demo
Try the editor in your browser without installing anything!
[**Launch Live Demo**](https://harshankur.github.io/inscript/)

> **Note**: The demo runs entirely in your browser using `localStorage`. No data is sent to a server.


## Features

### 📝 Rich Text Editor
-   **Tiptap Power**: A Notion-style editor with slash commands (`/`) for quick formatting.
-   **Formatting**: Bold, Italic, Underline, Strike, Sub/Superscript, Alignment, and Code Blocks.
-   **Visuals**:
    -   **Images**: Drag & drop upload, resize, and extensive media library integration.
    -   **YouTube**: Embed videos directly via URL or search.
    -   **Highlights**: Multi-color highlighting text.
-   **WYSIWYG**: The look and feel of the CMS is exactly the same as the published blog. It is essentially the same application, ensuring there are no surprises in the final UI.

### 🗂️ Organization & Metadata
-   **Taxonomy**: Manage Tags and Categories with an intuitive UI.
-   **Frontmatter**: Automatically syncs YAML frontmatter (title, date, tags, etc.).
-   **Advanced Filtering**: Filter posts by tags, categories, draft status, and date ranges.

### 💾 Robust Workflow
-   **Draft System**:
    -   **Auto-Save**: Never lose work with continuous local saving.
    -   **History Stack**: Detailed undo/redo history that persists across sessions.
    -   **Conflict Resolution**: Detects if a file was modified externally.
-   **Publishing Flow**:
    -   **Save**: Updates the markdown file locally.
    -   **Publish**: Generates a static API (`data.json`) for your frontend.
    -   **Commit & Push**: (Optional) Commits changes to Git and pushes to your remote repo directly from the UI.

### 🛠️ Architecture
-   **FileSystem Based**: 100% flat-file based. No database required.
-   **Headless**: Generates a framework-agnostic `data.json` that any frontend can consume.
-   **Hybrid Mode**:
    -   **Dev**: Runs an Express server for file I/O.
    -   **Prod**: Builds to a static React app for readonly viewing.

## Installation

This tool is best installed as a **Git Submodule** within your blog's repository.

### 1. Add Submodule
Run this from your project root:

```bash
git submodule add <repository-url> inscript
```

### 2. Install Dependencies
Navigate to the Inscript folder and install:

```bash
cd inscript
npm install
```

### 3. Configure Environment
Inscript automatically creates a `.env` file on first run. You can also manually create one in `inscript/.env`:

```env
# Display Name
TITLE=My Awesome Blog

# Your Public Site URL (for Sitemap/Robots)
SITE_URL=https://myblog.com

# PATHS (Relative to inscript/ directory)
# Where your markdown files live
CONTENT_DIR=../content
# Where static assets (images) live
STATIC_DIR=../static
# Where the built Inscript app and data.json should go
DIST_DIR=../dist

# OPTIONAL
# Port for the local Inscript server
SERVER_PORT=3001
# Allow pushing to remote git repo from UI (Caution)
ALLOW_PUSH=false
```

## Usage

### Development (Writing Content)
Run Inscript locally alongside your blog generator:

```bash
cd inscript
npm run dev
```
-   **Inscript Interface**: `http://localhost:5173`
-   **API Server**: `http://localhost:3001`

### Publishing (Building for Production)
When you deploy your site, you need to build the Inscript assets and generate the content API.

```bash
cd inscript
npm run publish
```

#### What `npm run publish` does:
1.  **Setup**: Generates `public/robots.txt` and `public/manifest.json` based on your `.env`.
2.  **Build UI**: Builds the React app in `readonly` mode (no editing features).
3.  **Generate Data**: Parses all markdown files and creates a `dist/data.json` for your frontend.
4.  **Sitemap**: Generates a SEO-ready `sitemap.xml`.
5.  **Assets**: Copies all images from `STATIC_DIR` to `DIST_DIR`.

## Deployment

### Netlify
To deploy this alongside your site on Netlify, add this to your **root** `netlify.toml`:

```toml
[build]
  # Adjust 'base' if your structure is different
  # This command builds the Inscript and outputs it to 'dist'
  command = "cd inscript && npm install && npm run publish"
  publish = "dist"
```

### Deployment Environment Variables
When deploying to a provider like Netlify or Vercel, you must configure the following Environment Variables in their dashboard.

The build script `npm run setup` validates these before building.

| Variable | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `TITLE` | **Yes** | The blog title (used in Manifest). | `My Tech Blog` |
| `SITE_URL` | **Yes** | Public URL (used in Sitemap/Robots). | `https://example.com` |
| `CONTENT_DIR` | **Yes** | Relative path to markdown content. | `../content` |
| `STATIC_DIR` | **Yes** | Relative path to source images/assets. | `../static` |
| `DIST_DIR` | No | Override build output location. | `../dist` |
| `FAVICON` | No | Path to custom favicon in Static Dir. | `assets/icon.png` |
| `SERVER_PORT` | No | Port for the backend API server. | `3001` |
| `CLIENT_PORT` | No | Port for the frontend React app (Dev). | `5173` |
| `ALLOW_PUSH` | No | Enable Git Push from UI (Dangerous). | `false` |

### Advanced Build Configuration
If you need to change **where** the site is built (e.g. if your hosting provider expects a specific folder name like `public` or `build`), you can override the output directory using `DIST_DIR`.

1.  **Set the Variable**: In your hosting dashboard (Netlify/Vercel settings), add:
    ```env
    DIST_DIR=./build_output
    ```
    *(Note: This path is relative to the `inscript` folder)*

2.  **Update Publish Settings**: Ensure your hosting provider is configured to publish that same directory.
    *   **Netlify**: Update `publish = "inscript/build_output"` in `netlify.toml` or UI.
    *   **Vercel**: Update "Output Directory" in settings.

**Critical**: The `DIST_DIR` variable tells the build script where to put files. The Hosting Provider's "Publish Directory" setting tells the server which folder to serve. **These must match.**

### Self-Hosted
Serve the contents of the `DIST_DIR` (default `../dist` relative to Inscript) using Nginx, Apache, or any static file server.

## Troubleshooting

-   **"Missing setup script"**: Ensure you run `npm run setup` if you accidentally deleted generated files.
-   **"Network Error"**: Make sure the backend server (port 3001) is running if you are in Dev mode.
-   **"Git Push Failed"**: Ensure you have set `ALLOW_PUSH=true` in `.env` and have SSH keys/credentials configured on your machine.

## License

MIT
