/**
 * @jest-environment node
 */
import { DatabaseSync } from 'node:sqlite';

import { createAppDatabaseLoader } from '@/app/storage/create-app-database-loader';
import { initializeAppDatabase } from '@/app/storage/initialize-app-database';
import type { AppDatabase } from '@/app/storage/initialize-app-database';
import type { MigrationDatabase } from '@/shared/infrastructure/sqlite/migrate-database';

describe('application database initialization (SQLite integration)', () => {
  let sqlite: DatabaseSync;
  let database: AppDatabase;
  let isClosed: boolean;

  beforeEach(() => {
    sqlite = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
    });

    isClosed = false;
    database = createDatabase();
  });

  afterEach(() => {
    if (!isClosed) {
      sqlite.close();
    }
  });

  test('given a new SQLite database, when requesting it concurrently through the loader, then both callers receive one initialized connection', async () => {
    const openDatabase = jest.fn().mockResolvedValue(database);
    const getDatabase = createAppDatabaseLoader(openDatabase);

    const [first, second] = await Promise.all([getDatabase(), getDatabase()]);

    expect(first).toBe(database);
    expect(second).toBe(first);

    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(openDatabase).toHaveBeenLastCalledWith('music-player.sqlite');

    assertSqlite();
    expect(isClosed).toBe(false);
  });

  test('given a new SQLite database, when initializing, then the returned connection has the application schema and foreign keys enabled', async () => {
    const openDatabase = jest.fn().mockResolvedValue(database);

    const result = await initializeAppDatabase(openDatabase);

    expect(result).toBe(database);
    expect(isClosed).toBe(false);

    assertSqlite();
  });

  test('given an unsupported newer schema, when initializing, then initialization fails and the connection is closed', async () => {
    sqlite.exec('PRAGMA user_version = 2');

    const openDatabase = jest.fn().mockResolvedValue(database);

    await expect(initializeAppDatabase(openDatabase)).rejects.toThrow(
      'Database schema version is newer than supported',
    );

    expect(isClosed).toBe(true);

    expect(() => {
      sqlite.prepare('PRAGMA user_version');
    }).toThrow();
  });

  function assertSqlite() {
    expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(1);
    expect(sqlite.prepare('PRAGMA foreign_keys').get()?.foreign_keys).toBe(1);
    expect(sqlite.prepare('SELECT * FROM playlists').all()).toEqual([]);
    expect(sqlite.prepare('SELECT * FROM playlist_tracks').all()).toEqual([]);
  }

  function createDatabase(): AppDatabase {
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

      close() {
        sqlite.close();
        isClosed = true;
      },
    };
  }
});
