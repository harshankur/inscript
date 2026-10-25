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

### Changed
- **The save button is no longer disabled once nothing is unsaved.** Its menu offered only chains
  that began with a save, so a saved post could not be published, committed or pushed from it.
  Saving alone still needs something unsaved, and the other steps never do.
- **Focus mode keeps the width the column has when it is entered**, where it used to narrow the
  column to a fixed 48 rem, so the text no longer wraps anywhere else when focus mode is turned on.
- Vite is 8.3.5, with Rolldown 1.2.15.

### Fixed
- **A post that has just been chosen no longer shows the title of the post before it.** Until the
  chosen post arrived, its row in the sidebar, the title box and the browser tab (which the view
  counter reads) showed the previous post's title. They show the chosen post's own saved title until
  its draft arrives.
