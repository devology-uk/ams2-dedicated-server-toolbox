# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed


## [1.3.0] - 2026-07-21

### Added
- **Export in API Explorer** — export any endpoint's data to JSON or CSV, choosing which fields to include, renaming columns with aliases, and reordering them. Lookups let you combine endpoints (e.g. vehicles enriched with class name and liveries) into a single export. CSV exports can optionally omit the header row. Export configurations can be saved and reused as named presets.


## [1.2.3] - 2026-07-20

### Fixed
- **Sessions no longer show "Allocating" as their type** — now correctly falls back to Practice, like other sessions with an unspecified type.
- **DNF/retired drivers now sort to the bottom of race results** instead of the top, ordered by laps completed.


## [1.2.2] - 2026-06-22

### Added
- **Steam ID and IsPlayer fields in ams2_stats plugin** — plugin now captures each driver's Steam ID and human/AI flag from the server API. Import service uses real Steam IDs instead of synthetic placeholders, enabling league websites and external tools to match drivers by Steam ID.
- **Hide AI drivers toggle in Results Viewer** — when a session contains AI drivers, a toggle appears to show or hide them. Defaults to hidden. Filtering applies to the results table, driver count, fastest lap highlight, and CSV/JSON exports.
- **Outdated plugin warning on import** — importing an ams2_stats file from an older plugin version shows a warning in the import dialog with instructions to update via the Lua Plugins page.
- **Plugin update notifications** — the Server Plugins tile on the home screen shows a badge when a plugin update is available. The Lua Plugins page shows the detected server version alongside an "Update" button with a description of what's new.

### Changed
- Plugin installer now preserves existing `lua_config/` files (e.g. `config.json`) when updating, so user customisations like `max_sessions` are not overwritten.


## [1.2.0] - 2026-06-22

### Added
- **ams2_stats Lua plugin** — alternative to `sms_stats` that captures per-lap sector times (S1/S2/S3), complete DNF tracking, and full lap history per driver. Bundled with the app and installable via the new Lua Plugins page.
- **Lua Plugins page** — new home-screen tile with a step-by-step wizard to install bundled plugins into an AMS2 dedicated server folder.
- **ams2_stats support in Stats Viewer and Results Viewer** — both viewers auto-detect file format; `ams2_stats` files show sector times and full lap history. Results Viewer import routes to the correct importer based on format and imports into the currently selected server.
- **Sector time columns in Results Viewer** — S1/S2/S3 best-sector columns appear when the session contains sector data.
- **Known plugins panel in Config Builder** — Lua API tab replaces the raw Chips input with named plugin toggles for `sms_base`, `sms_stats`, and `ams2_stats`.
- **Delete session** — trash icon on each row in the Results Viewer stage list removes the session and all its data after confirmation.

### Changed
- Home screen layout to accommodate the new Lua Plugins page.

## [1.1.3] - 2026-03-18

### Fixed
- Bundled game data still not found on Linux — the file was placed in `extraResources` (outside the asar) but the path lookup had a wrong directory level (`handlers/data/` instead of `dist-app/data/`); moved data file back into the asar and fixed the relative path

## [1.1.2] - 2026-03-16

### Added
- Session Attributes tab now has a "Jump to field" search box that scrolls to the first matching field as you type

### Changed
- Improvements to layout to keep search boxes in view and minimise scrolling

### Fixed
- Manual Pit Stops dropdown on Session Attributes tab was empty due to missing `pit_control` enum in bundled game data
- Bundled game data changes were not picked up by existing installs — app now re-seeds from the bundled file whenever `bundledDataVersion` is incremented; for server-synced installs, missing lists are patched in from the bundle without overwriting server-provided values

## [1.1.1] - 2026-03-13

### Fixed
- Bundled game data not found on Linux (and other packaged builds) — added `process.resourcesPath` to the file lookup paths in `loadBundledGameData`


## [1.1.0] - 2026-02-24

### Added
- Ability to add an alias for driver in driver profile dialog
- Ability to add a missing result to a session in results viewer, required when users exit the game before sms_stats plugin captures results
- What's New dialog displays when new update is installed
- Export session results to CSV or JSON from Results Viewer


## [1.0.3] - 2026-02-23

### Changed
- Numerous UX improvements
- Replaced some number inputs with drop down selectors
- Replaced some number inputs with sliders where range is known
- Stats and Results viewers now fallback to previous name when results file does not provide one for existing member
- Limited Stats Viewer overview to real events with quali and race stages due to presence of negative values


## [1.0.2] - 2026-02-17

### Added
- Button to open documentation web site

### Fixed
- Issue preventing the app from rendering correctly after install


## [1.0.1] - 2026-02-17

### Added
- Display 'Restart to Update' button when new update downloaded


## [1.0.0] - 2026-02-17

### Added
- Initial feature set
  - API Explorer
  - Config Builder
  - Stats Viewer
  - Results Viewer
- Automatic Updates


