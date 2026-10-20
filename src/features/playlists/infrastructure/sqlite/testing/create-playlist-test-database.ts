import type { DatabaseSync } from 'node:sqlite';

import type {
  PlaylistDatabase,
  PlaylistSqlExecutor,
} from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

export function createPlaylistTestDatabase(
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
