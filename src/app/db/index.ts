// src/app/db/index.ts

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema.js';

export type AppDatabase = Database.Database;

let db: AppDatabase | null = null;

export function getDatabase(): AppDatabase {
    if (db) return db;

    const dbPath = path.join(app.getPath('userData'), 'ams2-toolkit.db');

    console.log(`[DB] Opening database at: ${dbPath}`);

    db = new Database(dbPath);

    // Performance and safety pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    // Create/update schema
    initializeSchema(db);

    return db;
}

function ensureColumn(
    database: AppDatabase,
    table: string,
    column: string,
    definition: string,
): void {
    const cols = database.pragma(`table_info(${table})`) as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`[DB] Added missing column ${table}.${column}`);
    }
}

function initializeSchema(database: AppDatabase): void {
    // Create any tables that don't yet exist
    database.exec(CREATE_TABLES);

    // Structural column checks — run unconditionally on every startup.
    // These are idempotent and guard against partial migrations where the
    // schema_version was bumped before the ALTER TABLE actually ran.
    ensureColumn(database, 'stage_results', 'is_manual', 'INTEGER NOT NULL DEFAULT 0');

    // Index for is_manual must be created after the column is guaranteed to exist
    database.exec(
        'CREATE INDEX IF NOT EXISTS idx_stage_results_manual ON stage_results(is_manual)',
    );

    // Version-gated migrations (for non-column-additive changes)
    const versionRow = database
        .prepare('SELECT value FROM schema_meta WHERE key = ?')
        .get('schema_version') as { value: string } | undefined;

    const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

    if (currentVersion < SCHEMA_VERSION) {
        database
            .prepare('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)')
            .run('schema_version', String(SCHEMA_VERSION));

        console.log(`[DB] Schema updated from v${currentVersion} to v${SCHEMA_VERSION}`);
    }
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[DB] Database closed');
    }
}