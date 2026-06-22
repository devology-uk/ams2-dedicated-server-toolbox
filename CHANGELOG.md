# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed


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


