import type { PlaylistRepository } from '../ports/playlist-repository.ts';
import type { PlaylistIdGenerator } from '../ports/playlist-id-generator.ts';
import type { Playlist } from '../../domain/playlist.ts';
import { createPlaylist } from '../create-playlist.ts';

describe('createPlaylist', () => {
  test('given a valid name, when creating, then an empty playlist is saved', async () => {
    const dependencies = createDependencies();

    const expectedPlaylist: Playlist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: [],
    };

    const result = await createPlaylist(' Дорога ', dependencies);

    expect(result).toEqual({
      ok: true,
      playlist: expectedPlaylist,
    });

    expect(dependencies.repository.add).toHaveBeenCalledTimes(1);

    expect(dependencies.repository.add).toHaveBeenCalledWith(expectedPlaylist);
  });

  test.each(['', '    ', '\t\n'])(
    'given blank input %p, when creating, then nothing is saved',
    async input => {
      const dependencies = createDependencies();

      const result = await createPlaylist(input, dependencies);

      expect(result).toEqual({
        ok: false,
        error: 'EMPTY_NAME',
      });

      expect(dependencies.idGenerator.generate).not.toHaveBeenCalled();
      expect(dependencies.repository.add).not.toHaveBeenCalled();
    },
  );

  test('given a storage error, when creating, then creation fails', async () => {
    const dependencies = createDependencies();

    dependencies.repository.add.mockRejectedValue(
      new Error('Storage unavailable'),
    );

    const result = await createPlaylist('Дорога', dependencies);

    expect(result).toEqual({
      ok: false,
      error: 'CREATE_FAILED',
    });
  });

  test('given an ID error, when creating, then nothing is saved', async () => {
    const dependencies = createDependencies();

    dependencies.idGenerator.generate.mockImplementationOnce(() => {
      throw new Error('ID generation failed');
    });

    const result = await createPlaylist('Дорога', dependencies);

    expect(result).toEqual({
      ok: false,
      error: 'CREATE_FAILED',
    });
  });
});

function createDependencies() {
  const repository: jest.Mocked<PlaylistRepository> = {
    add: jest.fn().mockResolvedValue(undefined),
    getAll: jest.fn().mockResolvedValue([]),
  };

  const idGenerator: jest.Mocked<PlaylistIdGenerator> = {
    generate: jest.fn().mockReturnValue('playlist-1'),
  };

  return { repository, idGenerator };
}
