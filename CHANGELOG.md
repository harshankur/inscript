# Changelog

All notable changes to Inscript are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases before 2.3.0 are described on
the [GitHub releases page](https://github.com/harshankur/inscript/releases).

## [2.3.0] - 2026-10-25

### Added
- **`SESSION_MAX_AGE_HOURS` sets how long a sign-in lasts**, from 0.25 to 8760 hours (a year), and
  24 by default as before. Setup keeps it in `.env` when it rewrites the file, and the server
  refuses to start on a value that is not a number of hours in that range, signed in or not, so a
  typo cannot quietly change every sign-in. The sign-in ends that long after it began, however much
  the editor is used, and a restart of the server still ends every sign-in.
- **The save, publish, commit and push steps are independent.** The button in the editor header does
  the next step that has work left (Save, then Publish, Commit, Push), and its menu lists all four
  with what each has left, runs any one of them on its own, or finishes everything left. What each
  has left is read from the files and Git, so it is right after a reload, a pull or work done
  outside the editor: `GET /api/publish/status` says whether the site is older than the posts and
  static files it is built from, and `GET /api/git/status` whether there is a change to commit and
  how many commits the branch is ahead of its upstream. A submodule whose own files changed, but
  whose commit did not, is not a change to commit.
- **Editor settings.** A button beside Focus Mode opens a panel for the line width (four presets and
  a slider from 30 to 120 rem, 72 rem as before), the text size, whether focus mode keeps the
  editor's width or has a column of its own, and whether it dims the paragraphs around the one being
  written. The choices apply as they are made and are kept in the browser as
  `inscript:editor-settings`, never in a post. What is read back is checked every time, so an old or
  hand-edited value falls back to the default. A button resets them. The panel's button is not shown
  on a phone, where the header has no room for it.

- **Images dropped, pasted or picked in the editor are uploaded**, as the media library's are, and go
  into the post from where the server stored them, with a "Loading image…" placeholder meanwhile. A
  refused file says why (not an accepted image, or too large). SVG files are not taken, since they can
  hold script.
- **inscript-editor 0.13's tools:** keyboard keys (`<kbd>`), disclosures (`<details>`), inline math, and
  column alignment in tables (saved as a GFM column alignment). They are in the toolbar's Full preset,
  disclosures and inline math in the slash menu too, and the editor's 38 new strings are translated
  into every language.
- **Saved toolbar and selection-menu layouts follow their preset.** The editor release a layout is
  saved with is kept beside it (`inscript:toolbar-config-saved-with`,
  `inscript:bubble-menu-config-saved-with`), so a layout that was a built-in preset picks up the
  tools later releases add to it. Layouts saved before are read as saved with inscript-editor 0.7.0.

### Changed
- **The save button is no longer disabled once nothing is unsaved.** Its menu offered only chains
  that began with a save, so a saved post could not be published, committed or pushed from it.
  Saving alone still needs something unsaved, and the other steps never do.
- **Focus mode keeps the width the column has when it is entered**, where it used to narrow the
  column to a fixed 48 rem, so the text no longer wraps anywhere else when focus mode is turned on.
- Vite is 8.3.5, with Rolldown 1.2.15.

- **inscript-editor 0.13.0** (from 0.7.0). Documents, pastes and saved versions are treated as
  untrusted: a post can no longer set a link's target, rel or class, links to other sites open in a
  new tab with `noopener` on the published site, diagrams are drawn at Mermaid's `strict` level and
  formulas with KaTeX's `trust` off, and very large tables and code blocks are bounded so a crafted
  post cannot stop the page. Existing posts are saved exactly as before.
- **KaTeX 0.18 and Mermaid 12.3**, which share that one KaTeX instead of Mermaid 11's own 0.16 (the
  editor needs 0.18.2 or later: GHSA-238p-pmpm-9mq7).

### Fixed
- **A post that has just been chosen no longer shows the title of the post before it.** Until the
  chosen post arrived, its row in the sidebar, the title box and the browser tab (which the view
  counter reads) showed the previous post's title. They show the chosen post's own saved title until
  its draft arrives.
- **The toolbar customizer drawer opens at the editor column's edge.** It could be left a drawer's
  width to the left of the column, with the column uncovered to its right.
- **Formulas and diagrams show their source while their library loads**, instead of "Empty math".
  Footnote numbers follow the document, and a text cursor is never left between blocks.
