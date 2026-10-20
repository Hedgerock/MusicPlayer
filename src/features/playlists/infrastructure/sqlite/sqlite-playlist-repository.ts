import type { PlaylistRepository } from '@/features/playlists/application/ports/playlist-repository';
import type { Playlist } from '@/features/playlists/domain/playlist';

export type PlaylistSqlExecutorQuery = {
  readonly rows: readonly Record<string, unknown>[];
};

export type PlaylistSqlExecutor = {
  execute(
    sql: string,
    params?: (string | number)[],
  ): Promise<PlaylistSqlExecutorQuery>;
};

export type PlaylistDatabase = {
  transaction(
    work: (transaction: PlaylistSqlExecutor) => Promise<void>,
  ): Promise<void>;
};

type MutablePlaylist = {
  id: string;
  name: string;
  trackIds: string[];
};

export function createSQLitePlaylistRepository(
  database: PlaylistDatabase,
): PlaylistRepository {
  return {
    async add(playlist) {
      const { id, name } = playlist;
      const trackIds = [...playlist.trackIds];

      await database.transaction(async transaction => {
        await transaction.execute(
          'INSERT INTO playlists (id, name) VALUES (?, ?)',
          [id, name],
        );

        for (const [position, trackId] of trackIds.entries()) {
          await transaction.execute(
            `INSERT INTO playlist_tracks (
                        playlist_id,
                        position,
                        track_id
                      ) VALUES (?, ?, ?)`,
            [id, position, trackId],
          );
        }
      });
    },

    async getAll() {
      let playlists: readonly Playlist[] = [];

      await database.transaction(async transaction => {
        const result = await transaction.execute(
          `SELECT
                    playlists.id,
                    playlists.name,
                    playlist_tracks.track_id
                   FROM playlists
                   LEFT JOIN playlist_tracks
                    ON playlist_tracks.playlist_id = playlists.id
                   ORDER BY playlists.id, playlist_tracks.position`,
        );

        playlists = readPlaylists(result.rows);
      });

      return playlists;
    },
  };
}

function readPlaylists(
  rows: readonly Record<string, unknown>[],
): readonly Playlist[] {
  const playlists = new Map<string, MutablePlaylist>();

  for (const row of rows) {
    const { id, name, track_id: trackId } = row;

    if (
      typeof id !== 'string' ||
      typeof name !== 'string' ||
      (trackId !== null && typeof trackId !== 'string')
    ) {
      throw new Error('Invalid playlist row');
    }

    let playlist = playlists.get(id);

    if (!playlist) {
      playlist = {
        id,
        name,
        trackIds: [],
      };

      playlists.set(id, playlist);
    }

    if (trackId !== null) {
      playlist.trackIds.push(trackId);
    }
  }

  return Array.from(playlists.values());
}
