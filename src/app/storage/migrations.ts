import { createPlaylistsMigration } from '@/features/playlists/infrastructure/sqlite/migrations/0001-create-playlists';
import type { Migration } from '@/shared/infrastructure/sqlite/migrate-database';

export const appMigrations: readonly Migration[] = [createPlaylistsMigration];
