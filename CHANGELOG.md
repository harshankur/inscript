# Changelog

All notable changes to Inscript are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases before 2.3.0 are described on
the [GitHub releases page](https://github.com/harshankur/inscript/releases).

## [2.3.0] - 2026-10-25

### Added
- **Editor settings.** A button beside Focus Mode opens a panel for the line width (four presets and
  a slider from 30 to 120 rem, 72 rem as before), the text size, whether focus mode keeps the
  editor's width or has a column of its own, and whether it dims the paragraphs around the one being
  written. The choices apply as they are made and are kept in the browser as
  `inscript:editor-settings`, never in a post. What is read back is checked every time, so an old or
  hand-edited value falls back to the default. A button resets them. The panel's button is not shown
  on a phone, where the header has no room for it.

### Changed
- **Focus mode keeps the width the column has when it is entered**, where it used to narrow the
  column to a fixed 48 rem, so the text no longer wraps anywhere else when focus mode is turned on.
- Vite is 8.3.5, with Rolldown 1.2.15.

### Fixed
- **A post that has just been chosen no longer shows the title of the post before it.** Until the
  chosen post arrived, its row in the sidebar, the title box and the browser tab (which the view
  counter reads) showed the previous post's title. They show the chosen post's own saved title until
  its draft arrives.
