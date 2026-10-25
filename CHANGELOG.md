# Changelog

All notable changes to Inscript are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases before 2.3.0 are described on
the [GitHub releases page](https://github.com/harshankur/inscript/releases).

## [2.3.0] - 2026-10-25

### Changed
- Vite is 8.3.5, with Rolldown 1.2.15.

### Fixed
- **A post that has just been chosen no longer shows the title of the post before it.** Until the
  chosen post arrived, its row in the sidebar, the title box and the browser tab (which the view
  counter reads) showed the previous post's title. They show the chosen post's own saved title until
  its draft arrives.
