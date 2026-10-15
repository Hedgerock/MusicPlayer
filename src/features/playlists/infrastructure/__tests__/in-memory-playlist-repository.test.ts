import { createInMemoryPlaylistRepository } from '../in-memory-playlist-repository.ts';

describe('in-memory playlist repository', () => {
  test('given mutable input, when it changes after adding, then stored data stays unchanged', async () => {
    const repository = createInMemoryPlaylistRepository();

    const playlist = {
      id: 'playlist-1',
      name: 'Дорога',
      trackIds: ['track-1'],
    };

    await repository.add(playlist);

    playlist.name = 'Job';
    playlist.trackIds.push('track-2');

    expect(await repository.getAll()).toEqual([
      {
        id: 'playlist-1',
        name: 'Дорога',
        trackIds: ['track-1'],
      },
    ]);
  });
});
