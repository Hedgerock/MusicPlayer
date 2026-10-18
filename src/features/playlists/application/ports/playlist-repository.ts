import type { Playlist } from '@/features/playlists/domain/playlist';

export interface PlaylistRepository {
  add(playlist: Playlist): Promise<void>;
  getAll(): Promise<readonly Playlist[]>;
}
