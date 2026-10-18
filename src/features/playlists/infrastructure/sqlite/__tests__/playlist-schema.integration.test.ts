/**
 * @jest-environment node
 */

import { DatabaseSync } from 'node:sqlite';

import { createPlaylistsMigration } from '@/features/playlists/infrastructure/sqlite/migrations/0001-create-playlists';

describe('playlist schema (SQLite integration)', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');

    for (const statement of createPlaylistsMigration.statements) {
      database.exec(statement);
    }
  });

  afterEach(() => {
    database.close();
  });

  test('given a new database, when applying the migration, then both tables are empty', () => {
    expect(database.prepare('SELECT * FROM playlists').all()).toEqual([]);

    expect(database.prepare('SELECT * FROM playlist_tracks').all()).toEqual([]);
  });

  test('given equal names, when inserting different IDs, then both playlists are stored', () => {
    insertPlaylist('playlist-1', 'Дорога');
    insertPlaylist('playlist-2', 'Дорога');

    const playlists = database
      .prepare('SELECT id, name FROM playlists ORDER BY id')
      .all();

    expect(playlists).toEqual([
      { id: 'playlist-1', name: 'Дорога' },
      { id: 'playlist-2', name: 'Дорога' },
    ]);
  });

  test('given a duplicate ID, when inserting, then the existing playlist stays unchanged', () => {
    insertPlaylist('playlist-1', 'Работа');

    expect(() => {
      insertPlaylist('playlist-1', 'Дорога');
    }).toThrow();

    expect(database.prepare('SELECT id, name FROM playlists').all()).toEqual([
      { id: 'playlist-1', name: 'Работа' },
    ]);
  });

  test('given a null playlist ID, when inserting, then insert is rejected', () => {
    expect(() => {
      database
        .prepare(`INSERT INTO playlists (id, name) VALUES (?, ?)`)
        .run(null, 'Дорога');
    }).toThrow();

    expect(database.prepare(`SELECT * FROM playlists`).all()).toEqual([]);
  });

  test('given repeated tracks, when reading by position, then their order and repetitions are preserved', () => {
    insertPlaylist('playlist-1');

    insertTrack(2, 'track-1');
    insertTrack(0, 'track-1');
    insertTrack(1, 'track-2');

    const tracks = database
      .prepare(
        `SELECT position, track_id
         FROM playlist_tracks
         WHERE playlist_id = ?
         ORDER BY position
        `,
      )
      .all('playlist-1');

    expect(tracks).toEqual([
      { position: 0, track_id: 'track-1' },
      { position: 1, track_id: 'track-2' },
      { position: 2, track_id: 'track-1' },
    ]);
  });

  test('given an occupied position, when inserting another track, then the existing entry stays unchanged', () => {
    insertPlaylist('playlist-1');
    insertTrack(0, 'track-1');

    expect(() => {
      insertTrack(0, 'track-2');
    }).toThrow();

    expect(
      database.prepare(`SELECT position, track_id FROM playlist_tracks`).all(),
    ).toEqual([{ position: 0, track_id: 'track-1' }]);
  });

  test.each([
    {
      condition: 'a missing playlist',
      playlistId: 'missing',
      position: 0,
    },
    {
      condition: 'a negative position',
      playlistId: 'playlist-1',
      position: -1,
    },
  ])(
    'given $condition, when inserting a track, then the insert is rejected',
    ({ playlistId, position }) => {
      insertPlaylist('playlist-1');

      expect(() => {
        insertTrack(position, 'track-1', playlistId);
      }).toThrow();

      expect(database.prepare(`SELECT * FROM playlist_tracks`).all()).toEqual(
        [],
      );
    },
  );

  test('given a playlist with tracks, when deleting it, then its entries are deleted', () => {
    insertPlaylist('playlist-1');
    insertTrack(0, 'track-1');
    insertTrack(1, 'track-2');

    database.prepare(`DELETE FROM playlists WHERE id = ?`).run('playlist-1');

    expect(database.prepare(`SELECT * FROM playlists`).all()).toEqual([]);
    expect(database.prepare(`SELECT * FROM playlist_tracks`).all()).toEqual([]);
  });

  function insertPlaylist(id: string, name = 'Дорога') {
    database
      .prepare('INSERT INTO playlists (id, name) VALUES ( ?, ? )')
      .run(id, name);
  }

  function insertTrack(
    position: number,
    trackId: string,
    playlistId = 'playlist-1',
  ) {
    database
      .prepare(
        `INSERT INTO playlist_tracks (
          playlist_id,
          position,
          track_id
        
      ) VALUES (?, ?, ?)`,
      )
      .run(playlistId, position, trackId);
  }
});
