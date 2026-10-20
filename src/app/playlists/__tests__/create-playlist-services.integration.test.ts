/**
 * @jest-environment node
 */
import { DatabaseSync } from 'node:sqlite';

import { createPlaylistServices } from '@/app/playlists/create-playlist-services';
import { appMigrations } from '@/app/storage/migrations';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type {
  PlaylistDatabase,
  PlaylistSqlExecutor,
} from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

describe('playlist services (SQLite integration)', () => {
  let sqlite: DatabaseSync;
  let database: PlaylistDatabase & PlaylistSqlExecutor;

  beforeEach(async () => {
    sqlite = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
    });

    database = createDatabase(sqlite);

    await migrateDatabase(database, appMigrations);
  });

  afterEach(() => {
    sqlite.close();
  });

  test('given two service instances, when creating playlists through both, then both read the shared database', async () => {
    const first = createPlaylistServices(database, {
      generate: () => 'playlist-1',
    });

    const second = createPlaylistServices(database, {
      generate: () => 'playlist-2',
    });

    const road = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: [],
    };

    const work = {
      id: 'playlist-2',
      name: 'Работа',
      trackIds: [],
    };

    expect(await first.getPlaylists()).toEqual([]);

    await expect(first.createPlaylist(' Дорога')).resolves.toEqual({
      ok: true,
      playlist: road,
    });

    await expect(second.createPlaylist('Работа')).resolves.toEqual({
      ok: true,
      playlist: work,
    });

    const fromFirst = await first.getPlaylists();
    const fromSecond = await second.getPlaylists();

    expect(fromFirst).toHaveLength(2);

    expect(fromFirst).toEqual(expect.arrayContaining([road, work]));
    expect(fromSecond).toEqual(fromFirst);
  });

  test('given a repeated generated ID, when creating another playlist, then creation fails and existing data stays unchanged', async () => {
    const services = createPlaylistServices(database, {
      generate: () => 'playlist-1',
    });

    const original = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: [],
    };

    await expect(services.createPlaylist('Дорога')).resolves.toEqual({
      ok: true,
      playlist: original,
    });

    await expect(services.createPlaylist('Работа')).resolves.toEqual({
      ok: false,
      error: 'CREATE_FAILED',
    });

    expect(await services.getPlaylists()).toEqual([original]);
  });
});

function createDatabase(
  sqlite: DatabaseSync,
): PlaylistDatabase & PlaylistSqlExecutor {
  const execute: PlaylistSqlExecutor['execute'] = async (sql, params = []) => ({
    rows: sqlite.prepare(sql).all(...params),
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
