import type { Migration } from '../../shared/infrastructure/sqlite/migrate-database.ts';
import {
  createPlaylistsMigration
} from '../../features/playlists/infrastructure/sqlite/migrations/0001-create-playlists.ts';

export const appMigrations: readonly Migration[] = [
  createPlaylistsMigration,
];