/**
 * @jest-environment node
 */
import { DatabaseSync } from 'node:sqlite';

import { appMigrations } from '@/app/storage/migrations';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type {
  Migration,
  MigrationDatabase,
} from '@/shared/infrastructure/sqlite/migrate-database';

describe('database migrations (SQLite integration)', () => {
  let sqlite: DatabaseSync;
  let database: MigrationDatabase;

  beforeEach(() => {
    sqlite = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
    });

    database = createMigrationDatabase();
  });

  afterEach(() => {
    sqlite.close();
  });

  test('given a new database, when migrating, then schema version 1 is created and foreign keys are enabled', async () => {
    expect(readVersion()).toBe(0);

    await migrateDatabase(database, appMigrations);

    expect(readVersion()).toBe(1);

    expect(sqlite.prepare('PRAGMA foreign_keys').get()?.foreign_keys).toBe(1);

    expect(sqlite.prepare('SELECT * FROM playlists').all()).toEqual([]);

    expect(sqlite.prepare('SELECT * FROM playlist_tracks').all()).toEqual([]);
  });

  test('given an initialized database with data, when migrating again, then data stays unchanged', async () => {
    await migrateDatabase(database, appMigrations);

    sqlite
      .prepare('INSERT INTO playlists (id, name) VALUES (?, ?)')
      .run('playlist-1', 'Дорога');

    sqlite
      .prepare(
        `INSERT INTO playlist_tracks (
          playlist_id,
          position,
          track_id
        ) VALUES (?, ?, ?)`,
      )
      .run('playlist-1', 0, 'track-1');

    sqlite.exec('PRAGMA foreign_keys = OFF');

    await migrateDatabase(database, appMigrations);

    expect(readVersion()).toBe(1);

    expect(sqlite.prepare(`PRAGMA foreign_keys`).get()?.foreign_keys).toBe(1);

    expect(sqlite.prepare(`SELECT id, name FROM playlists`).all()).toEqual([
      { id: 'playlist-1', name: 'Дорога' },
    ]);

    expect(
      sqlite
        .prepare(`SELECT playlist_id, position, track_id FROM playlist_tracks`)
        .all(),
    ).toEqual([
      {
        playlist_id: 'playlist-1',
        position: 0,
        track_id: 'track-1',
      },
    ]);
  });

  test('given a newer database version, when migrating, then version and data stay unchanged', async () => {
    await migrateDatabase(database, appMigrations);

    sqlite
      .prepare('INSERT INTO playlists (id, name) VALUES (?, ?)')
      .run('playlist-1', 'Дорога');

    sqlite.exec('PRAGMA user_version = 2');

    await expect(migrateDatabase(database, appMigrations)).rejects.toThrow(
      'Database schema version is newer than supported',
    );

    expect(readVersion()).toBe(2);

    expect(sqlite.prepare('SELECT id, name FROM playlists').all()).toEqual([
      { id: 'playlist-1', name: 'Дорога' },
    ]);
  });

  test('given two pending migrations, when applying them, then both are committed in order', async () => {
    const secondMigration: Migration = {
      version: 2,
      statements: [
        'CREATE TABLE migration_probe (id INTEGER PRIMARY KEY )',
        'INSERT INTO migration_probe (id) VALUES (1)',
      ],
    };

    await migrateDatabase(database, [...appMigrations, secondMigration]);

    expect(readVersion()).toBe(2);

    expect(sqlite.prepare('SELECT * FROM playlists').all()).toEqual([]);

    expect(sqlite.prepare('SELECT id FROM migration_probe').all()).toEqual([
      { id: 1 },
    ]);
  });

  test('given a failing second migration, when applying, then its changes roll back and version 1 remains', async () => {
    const failingMigration: Migration = {
      version: 2,
      statements: [
        'CREATE TABLE migration_probe (id INTEGER PRIMARY KEY )',
        `INSERT INTO playlists (id, name) VALUES ('temporary', 'Временный')`,
        `INSERT INTO missing_table (id) VALUES (1)`,
      ],
    };

    await expect(
      migrateDatabase(database, [...appMigrations, failingMigration]),
    ).rejects.toThrow();

    expect(readVersion()).toBe(1);

    expect(sqlite.prepare('SELECT * FROM playlists').all()).toEqual([]);

    expect(sqlite.prepare('SELECT * FROM playlist_tracks').all()).toEqual([]);

    expect(
      sqlite
        .prepare(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND NAME = ?`,
        )
        .all('migration_probe'),
    ).toEqual([]);
  });

  function readVersion() {
    return sqlite.prepare('PRAGMA user_version').get()?.user_version;
  }

  function createMigrationDatabase(): MigrationDatabase {
    const execute: MigrationDatabase['execute'] = async sql => ({
      rows: sqlite.prepare(sql).all(),
    });

    return {
      execute,

      async transaction(work) {
        sqlite.exec('BEGIN');

        try {
          await work({ execute });
          sqlite.exec('COMMIT');
        } catch (error) {
          sqlite.exec('ROLLBACK');
          throw error;
        }
      },
    };
  }
});
