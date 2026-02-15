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

function initializeSchema(database: AppDatabase): void {
    // Execute all CREATE TABLE IF NOT EXISTS statements
    database.exec(CREATE_TABLES);

    // Track schema version
    const versionRow = database
        .prepare('SELECT value FROM schema_meta WHERE key = ?')
        .get('schema_version') as { value: string } | undefined;

    const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

    if (currentVersion < SCHEMA_VERSION) {
        // Run any migration logic for version upgrades here in future
        // For now, just set the version
        database
            .prepare(
                'INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)',
            )
            .run('schema_version', String(SCHEMA_VERSION));

        console.log(
            `[DB] Schema updated from v${currentVersion} to v${SCHEMA_VERSION}`,
        );
    }
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[DB] Database closed');
    }
}