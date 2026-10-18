import { initializeAppDatabase } from '@/app/storage/initialize-app-database';
import type {
  AppDatabase,
  OpenAppDatabase,
} from '@/app/storage/initialize-app-database';

export function createAppDatabaseLoader<T extends AppDatabase>(
  openDatabase: OpenAppDatabase<T>,
): () => Promise<T> {
  let initialization: Promise<T> | undefined;

  return () => {
    if (!initialization) {
      initialization = initializeAppDatabase(openDatabase).catch(error => {
        initialization = undefined;
        throw error;
      });
    }

    return initialization;
  };
}
