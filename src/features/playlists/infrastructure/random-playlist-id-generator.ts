import type { PlaylistIdGenerator } from '@/features/playlists/application/ports/playlist-id-generator';

type FillRandomBytes = (bytes: Uint8Array) => void;

export function createRandomPlaylistIdGenerator(
  fillRandomBytes: FillRandomBytes,
): PlaylistIdGenerator {
  return {
    generate() {
      const bytes = new Uint8Array(16);

      fillRandomBytes(bytes);

      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    },
  };
}
