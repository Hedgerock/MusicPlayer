import type { PlaylistRepository } from '@/features/playlists/application/ports/playlist-repository';
import type { Playlist } from '@/features/playlists/domain/playlist';

export function createInMemoryPlaylistRepository(): PlaylistRepository {
  const playlists = new Map<string, Playlist>();

  return {
    async add(playlist) {
      if (playlists.has(playlist.id)) {
        throw new Error('A playlist with this ID already exists');
      }

      playlists.set(playlist.id, copyPlaylist(playlist));
    },

    async getAll() {
      return Array.from(playlists.values(), copyPlaylist);
    },
  };
}

function copyPlaylist(playlist: Playlist): Playlist {
  return {
    ...playlist,
    trackIds: [...playlist.trackIds],
  };
}
