import type { Playlist } from '../../domain/playlist';

export interface PlaylistRepository {
  add(playlist: Playlist): Promise<void>;
  getAll(): Promise<readonly Playlist[]>;
}
