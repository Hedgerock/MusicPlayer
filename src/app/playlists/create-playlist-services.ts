import { createPlaylist } from '@/features/playlists/application/create-playlist';
import { createSQLitePlaylistRepository } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';
import type { PlaylistIdGenerator } from '@/features/playlists/application/ports/playlist-id-generator';
import type { PlaylistDatabase } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

export function createPlaylistServices(
  database: PlaylistDatabase,
  idGenerator: PlaylistIdGenerator,
) {
  const repository = createSQLitePlaylistRepository(database);

  const dependencies = {
    repository,
    idGenerator,
  };

  return {
    createPlaylist: (inputName: string) =>
      createPlaylist(inputName, dependencies),

    getPlaylists: () => repository.getAll(),
  };
}
