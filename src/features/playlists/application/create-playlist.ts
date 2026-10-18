import type { PlaylistIdGenerator } from '@/features/playlists/application/ports/playlist-id-generator';
import type { PlaylistRepository } from '@/features/playlists/application/ports/playlist-repository';
import type { Playlist } from '@/features/playlists/domain/playlist';
import { parsePlaylistName } from '@/features/playlists/domain/playlist-name';

export type CreatePlaylistDependencies = {
  readonly repository: PlaylistRepository;
  readonly idGenerator: PlaylistIdGenerator;
};

export type CreatePlaylistResult =
  | { readonly ok: true; readonly playlist: Playlist }
  | { readonly ok: false; readonly error: 'EMPTY_NAME' | 'CREATE_FAILED' };

export async function createPlaylist(
  inputName: string,
  dependencies: CreatePlaylistDependencies,
): Promise<CreatePlaylistResult> {
  const nameResult = parsePlaylistName(inputName);

  if (!nameResult.ok) {
    return nameResult;
  }

  try {
    const playlist: Playlist = {
      id: dependencies.idGenerator.generate(),
      name: nameResult.name,
      trackIds: [],
    };

    await dependencies.repository.add(playlist);

    return {
      ok: true,
      playlist,
    };
  } catch {
    return {
      ok: false,
      error: 'CREATE_FAILED',
    };
  }
}
