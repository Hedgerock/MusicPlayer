/**
 * @jest-environment node
 */
import { DatabaseSync } from 'node:sqlite';

import { appMigrations } from '@/app/storage/migrations';
import { createPlaylist } from '@/features/playlists/application/create-playlist';
import { createSQLitePlaylistRepository } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type { PlaylistRepository } from '@/features/playlists/application/ports/playlist-repository';
import type { Playlist } from '@/features/playlists/domain/playlist';
import type {
  PlaylistDatabase,
  PlaylistSqlExecutor,
} from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

describe('SQLite playlist repository (integration)', () => {
  let sqlite: DatabaseSync;
  let repository: PlaylistRepository;

  beforeEach(async () => {
    sqlite = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
    });

    const database = createDatabase(sqlite);

    await migrateDatabase(database, appMigrations);

    repository = createSQLitePlaylistRepository(database);
  });

  afterEach(() => {
    sqlite.close();
  });

  test('given an empty database, when reading playlists, then an empty list is returned', async () => {
    expect(await repository.getAll()).toEqual([]);
  });

  test('given a name and ID containing quotes, when creating a playlist, then their exact values are stored', async () => {
    const expected: Playlist = {
      id: `playlist-'1`,
      name: `Дорога 'ночью'`,
      trackIds: [],
    };

    const result = await createPlaylist(` Дорога 'ночью'`, {
      repository,
      idGenerator: {
        generate: () => expected.id,
      },
    });

    expect(result).toEqual({
      ok: true,
      playlist: expected,
    });

    expect(await repository.getAll()).toEqual([expected]);
  });

  test('given repeated tracks, when adding a playlist, then positions and repetitions are preserved', async () => {
    const playlist: Playlist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: ['track-2', 'track-1', 'track-2'],
    };

    await repository.add(playlist);

    expect(await repository.getAll()).toEqual([playlist]);

    expect(
      sqlite
        .prepare(
          `SELECT position, track_id
       FROM playlist_tracks
       WHERE playlist_id = ?
       ORDER BY position`,
        )
        .all(playlist.id),
    ).toEqual([
      { position: 0, track_id: 'track-2' },
      { position: 1, track_id: 'track-1' },
      { position: 2, track_id: 'track-2' },
    ]);
  });

  test('given equal names, when storing different playlists, then their tracks remain separate', async () => {
    const playlists: Playlist[] = [
      {
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: [],
      },
      {
        id: 'playlist-2',
        name: 'Дорога',
        trackIds: ['track-1', 'track-1'],
      },
    ];

    for (const playlist of playlists) {
      await repository.add(playlist);
    }

    const stored = await repository.getAll();

    expect(stored).toHaveLength(2);
    expect(stored).toEqual(expect.arrayContaining(playlists));
  });

  test('given a duplicate ID, when adding a playlist, then existing data stays unchanged', async () => {
    const original: Playlist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: ['track-1'],
    };

    await repository.add(original);

    await expect(
      repository.add({
        id: original.id,
        name: 'Работа',
        trackIds: ['track-2'],
      }),
    ).rejects.toThrow();

    expect(await repository.getAll()).toEqual([original]);
  });

  test('given a failure on the second track, when adding a playlist, then all its writes roll back', async () => {
    sqlite.exec(`
      CREATE TRIGGER reject_test_track
      BEFORE INSERT ON playlist_tracks
      WHEN NEW.track_id = 'rejected-track'
      BEGIN
        SELECT RAISE(ABORT, 'Track insert rejected');
      END;
    `);

    await expect(
      repository.add({
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: ['track-1', 'rejected-track'],
      }),
    ).rejects.toThrow('Track insert rejected');

    expect(await repository.getAll()).toEqual([]);

    expect(sqlite.prepare('SELECT * FROM playlist_tracks').all()).toEqual([]);
  });

  test('given tracks inserted out of order, when reading a playlist, then positions define their order', async () => {
    sqlite
      .prepare('INSERT INTO playlists (id, name) VALUES (?, ?)')
      .run('playlist-1', 'Дорога');

    const insertTrack = sqlite.prepare(
      `INSERT INTO playlist_tracks (
        playlist_id,
        position,
        track_id
      ) VALUES (?, ?, ?)`,
    );

    insertTrack.run('playlist-1', 2, 'track-3');
    insertTrack.run('playlist-1', 0, 'track-1');
    insertTrack.run('playlist-1', 1, 'track-2');

    expect(await repository.getAll()).toEqual([
      {
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: ['track-1', 'track-2', 'track-3'],
      },
    ]);
  });

  test('given mutable input, when it changes during saving, then the original snapshot is stored', async () => {
    const playlist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: ['track-1'],
    };

    const saving = repository.add(playlist);

    playlist.name = 'Работа';
    playlist.trackIds.push('track-2');

    await saving;

    expect(await repository.getAll()).toEqual([
      {
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: ['track-1'],
      },
    ]);
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
