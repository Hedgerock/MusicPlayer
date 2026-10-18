import { createPlaylist } from '@/features/playlists/application/create-playlist';
import type { PlaylistIdGenerator } from '@/features/playlists/application/ports/playlist-id-generator';
import { createInMemoryPlaylistRepository } from '@/features/playlists/infrastructure/in-memory-playlist-repository';

describe('createPlaylist with an in-memory repository (integration)', () => {
  test('given an empty repository, when creating, then the playlist can be read', async () => {
    const dependencies = createDependencies();

    expect(await dependencies.repository.getAll()).toEqual([]);

    const result = await createPlaylist(' Дорога ', dependencies);

    const expectedPlaylist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: [],
    };

    expect(result).toEqual({
      ok: true,
      playlist: expectedPlaylist,
    });

    expect(await dependencies.repository.getAll()).toEqual([expectedPlaylist]);
  });

  test('given equal names, when creating twice, then both playlists are stored', async () => {
    const dependencies = createDependencies();

    const first = await createPlaylist('Дорога', dependencies);
    const second = await createPlaylist('Дорога', dependencies);

    const playlists = await dependencies.repository.getAll();

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(playlists).toHaveLength(2);

    expect(playlists.map(playlist => playlist.name)).toEqual([
      'Дорога',
      'Дорога',
    ]);

    expect(new Set(playlists.map(playlist => playlist.id)).size).toBe(2);
  });

  test('given a duplicate ID, when creating, then the existing playlist stays unchanged', async () => {
    const dependencies = createDependencies();

    await createPlaylist('Дорога', dependencies);

    const result = await createPlaylist('Работа', {
      repository: dependencies.repository,
      idGenerator: {
        generate: () => 'playlist-1',
      },
    });

    expect(result).toEqual({
      ok: false,
      error: 'CREATE_FAILED',
    });

    expect(await dependencies.repository.getAll()).toEqual([
      {
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: [],
      },
    ]);
  });

  test('given a blank name, when creating, then the repository stays empty', async () => {
    const dependencies = createDependencies();

    const result = await createPlaylist('    ', dependencies);

    expect(result).toEqual({
      ok: false,
      error: 'EMPTY_NAME',
    });

    expect(await dependencies.repository.getAll()).toEqual([]);
  });
});

function createDependencies() {
  let nextId = 0;

  const idGenerator: PlaylistIdGenerator = {
    generate() {
      nextId += 1;
      return `playlist-${nextId}`;
    },
  };

  return {
    repository: createInMemoryPlaylistRepository(),
    idGenerator,
  };
}
