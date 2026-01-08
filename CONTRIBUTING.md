# Contributing to Inscript

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Inscript. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/harshankur/inscript.git
    cd inscript
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## Development Workflow

Inscript is a React + Vite app with a lightweight Express backend for file operations.

1.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    This concurrently starts the Express server (port 3001) and the Client (port 5173).

2.  **Pre-commit Hooks**:
    We use `husky` to ensure quality. Commits will automatically trigger a build of the demo documentation to keep it in sync.

## Project Structure

*   `src/` - React frontend code.
*   `server.js` - Express backend (handles file system operations).
*   `scripts/` - Utility scripts (setup, sitemap generation, etc).
*   `content/` - Default location for markdown posts.

## API & Architecture

The app runs in two modes:
1.  **Real Mode**: Connects to `server.js` via `axios`. Used for local development.
2.  **Demo/Readonly Mode**: Uses `src/lib/api.js` (mock adapter) or reads from `data.json`. Used for the live demo and static deployment.

## Submitting Pull Requests

1.  Push your changes to your fork.
2.  Open a Pull Request against the `main` branch.
3.  Describe your changes clearly.
4.  Ensure `npm run build` passes locally.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
