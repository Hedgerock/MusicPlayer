import { appMigrations } from '@/app/storage/migrations';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type { MigrationDatabase } from '@/shared/infrastructure/sqlite/migrate-database';

export type AppDatabase = MigrationDatabase & {
  close(): void;
};

export type OpenAppDatabase<T extends AppDatabase> = (
  name: string,
) => Promise<T>;

export async function initializeAppDatabase<T extends AppDatabase>(
  openDatabase: OpenAppDatabase<T>,
): Promise<T> {
  const database = await openDatabase('music-player.sqlite');

  try {
    await migrateDatabase(database, appMigrations);

    return database;
  } catch (error) {
    try {
      database.close();
    } catch {
      // Preserve the original initialization error.
    }

    throw error;
  }
}
