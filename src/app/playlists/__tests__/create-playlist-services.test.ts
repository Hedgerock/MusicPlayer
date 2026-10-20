import { createPlaylistServices } from '@/app/playlists/create-playlist-services';
import type { PlaylistDatabase } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

describe('playlist services', () => {
  test('given a blank name, when creating a playlist, then no ID or database operation is requested', async () => {
    const dependencies = createDependencies();

    const services = createPlaylistServices(
      dependencies.database,
      dependencies.idGenerator,
    );

    const result = await services.createPlaylist('    ');

    expect(result).toEqual({
      ok: false,
      error: 'EMPTY_NAME',
    });

    expect(dependencies.idGenerator.generate).not.toHaveBeenCalled();
    expect(dependencies.database.transaction).not.toHaveBeenCalled();
  });

  test('given a database failure, when creating a playlist, then creation fails', async () => {
    const dependencies = createDependencies();

    dependencies.database.transaction.mockRejectedValue(
      new Error('Storage unavailable'),
    );

    const services = createPlaylistServices(
      dependencies.database,
      dependencies.idGenerator,
    );

    await expect(services.createPlaylist('Дорога')).resolves.toEqual({
      ok: false,
      error: 'CREATE_FAILED',
    });
  });

  test('given a database failure, when reading playlists, then the original error is propagated', async () => {
    const dependencies = createDependencies();
    const error = new Error('Read failed');

    dependencies.database.transaction.mockRejectedValue(error);

    const services = createPlaylistServices(
      dependencies.database,
      dependencies.idGenerator,
    );

    await expect(services.getPlaylists()).rejects.toBe(error);
  });
});

function createDependencies() {
  const transaction = jest
    .fn<
      ReturnType<PlaylistDatabase['transaction']>,
      Parameters<PlaylistDatabase['transaction']>
    >()
    .mockResolvedValue(undefined);

  return {
    database: {
      transaction,
    },
    idGenerator: {
      generate: jest.fn(() => 'playlist-1'),
    },
  };
}
