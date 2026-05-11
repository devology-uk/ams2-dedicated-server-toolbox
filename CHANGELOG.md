# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **ams2_stats Lua plugin** — community alternative to `sms_stats` that captures per-lap sector times, complete DNF tracking, and per-session driver/result arrays. Bundled with the app as an `extraResources` package.
- **Lua Plugins page** — new home-screen tile and dedicated view for installing bundled plugins. Includes a 4-step wizard (about → folder selection → install → configure) that copies plugin files into the AMS2 dedicated server folder.
- **ams2_stats format support in Stats Viewer** — auto-detects which format a file uses (badge shown in header); `ams2_stats` files show an expandable session list with results, sector times (S1/S2/S3), and a summary bar. Separate "Import to Database" buttons for each format.
- **ams2_stats database import** — new `AMS2EnhancedStatsImportService` stores sessions, stage results (including best sector times), and full per-lap records in the SQLite database. Sessions are deduplicated by `source_uid` (the plugin's timestamp UID).
- **Sector time columns in Results Viewer** — S1/S2/S3 best-sector columns appear automatically in the results table when the session contains sector data.
- **lap_records table** — new DB table stores every individual lap with lap time and sector splits for ams2_stats sessions.
- **Known plugins panel in Config Builder** — Lua API tab replaces the raw Chips input with named plugin toggles for `sms_base`, `sms_stats`, and `ams2_stats`; custom addons shown separately. Enabling `sms_stats` automatically enables `sms_base`; disabling `sms_base` cascades to disable `sms_stats`. A "required by" badge appears on `sms_base` when pulled in as a dependency.

### Changed
- Home screen header is now a horizontal layout (icon left of title/subtitle) to prevent a vertical scrollbar appearing with five tiles.
- Reduced top padding on the home screen to eliminate the remaining scrollbar.
- Plugin installer wording changed from "server folder" to "selected folder" to make clear the app works with local copies uploaded via FTP, not only servers running locally.

### Fixed
- Plugin installer failed with "Plugin source files not found" because the plugin package folder (`ams2_stats`) did not match the addon name (`ams_stats`) used as the lookup key. Plugin `id` now matches the package folder; `addonName` is used separately for the server-side `lua/` subfolder.
- Addon load order is now enforced at serialization time, so a config that was imported with `ams2_stats` at the top will export with the correct order: `sms_base` → other `sms_*` addons → custom addons → `ams2_stats` last.

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


