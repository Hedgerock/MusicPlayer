import { createSQLitePlaylistRepository } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';
import type {
  PlaylistDatabase,
  PlaylistSqlExecutor,
} from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

describe('SQLite playlist repository', () => {
  test('given a query failure, when reading playlists, then the original error is propagated', async () => {
    const database = createDatabase();
    const error = new Error('Query failed');

    database.execute.mockRejectedValue(error);

    const repository = createSQLitePlaylistRepository(database);

    await expect(repository.getAll()).rejects.toBe(error);
  });

  test('given a commit failure, when adding a playlist, then the operation rejects with the original error', async () => {
    const database = createDatabase();
    const error = new Error('Commit failed');

    database.transaction.mockImplementation(async work => {
      await work({ execute: database.execute });
      throw error;
    });

    const repository = createSQLitePlaylistRepository(database);

    await expect(
      repository.add({
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: [],
      }),
    ).rejects.toBe(error);
  });

  test.each([
    { id: 1, name: 'Дорога', track_id: null },
    { id: 'playlist-1', name: 1, track_id: null },
    { id: 'playlist-1', name: 'Дорога', track_id: 1 },
  ])(
    'given malformed row $#, when reading playlists, then invalid data is rejected',
    async row => {
      const database = createDatabase();

      database.execute.mockResolvedValue({
        rows: [row],
      });

      const repository = createSQLitePlaylistRepository(database);

      await expect(repository.getAll()).rejects.toThrow('Invalid playlist row');
    },
  );
});

function createDatabase() {
  const execute = jest
    .fn<
      ReturnType<PlaylistSqlExecutor['execute']>,
      Parameters<PlaylistSqlExecutor['execute']>
    >()
    .mockResolvedValue({ rows: [] });

  const transaction = jest.fn<
    ReturnType<PlaylistDatabase['transaction']>,
    Parameters<PlaylistDatabase['transaction']>
  >(async work => {
    await work({ execute });
  });

  return {
    execute,
    transaction,
  };
}
