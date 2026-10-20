import { initializeAppDatabase } from '@/app/storage/initialize-app-database';
import { appMigrations } from '@/app/storage/migrations';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type { AppDatabase } from '@/app/storage/initialize-app-database';

jest.mock('@/shared/infrastructure/sqlite/migrate-database', () => ({
  migrateDatabase: jest.fn(),
}));

const mockedMigrateDatabase = jest.mocked(migrateDatabase);

describe('initializeAppDatabase', () => {
  beforeEach(() => {
    mockedMigrateDatabase.mockReset();
    mockedMigrateDatabase.mockResolvedValue(undefined);
  });

  test('given a database opener, when initializing, then the migrated connection is returned and stays open', async () => {
    const database = createDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);

    const result = await initializeAppDatabase(openDatabase);

    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(openDatabase).toHaveBeenCalledWith('music-player.sqlite');

    expect(mockedMigrateDatabase).toHaveBeenCalledTimes(1);
    expect(mockedMigrateDatabase).toHaveBeenCalledWith(database, appMigrations);

    expect(result).toBe(database);
    expect(database.close).not.toHaveBeenCalled();
  });

  test('given pending migrations, when initializing, then the connection is not returned before migration completes', async () => {
    const database = createDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);
    const migrationStarted = createDeferred();
    const migrationCompleted = createDeferred();
    const onReady = jest.fn();

    mockedMigrateDatabase.mockImplementation(() => {
      migrationStarted.resolve();

      return migrationCompleted.promise;
    });

    const initialization = initializeAppDatabase(openDatabase).then(result => {
      onReady(result);

      return result;
    });

    await migrationStarted.promise;

    expect(onReady).not.toHaveBeenCalled();
    expect(database.close).not.toHaveBeenCalled();

    migrationCompleted.resolve();

    await expect(initialization).resolves.toBe(database);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledWith(database);
  });

  test('given an opening failure, when initializing, then the error is propagated and migration does not start', async () => {
    const error = new Error('Database could not be opened');
    const openDatabase = jest.fn().mockRejectedValue(error);

    await expect(initializeAppDatabase(openDatabase)).rejects.toBe(error);

    expect(mockedMigrateDatabase).not.toHaveBeenCalled();
  });

  test('given a migration failure, when initializing, then the connection is closed and the error is propagated', async () => {
    const database = createDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);
    const error = new Error('Migration failed');

    mockedMigrateDatabase.mockRejectedValue(error);

    await expect(initializeAppDatabase(openDatabase)).rejects.toBe(error);

    expect(database.close).toHaveBeenCalledTimes(1);
  });

  test('given migration and cleanup failures, when initializing, then the original migration error is preserved', async () => {
    const database = createDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);
    const error = new Error('Migration failed');

    mockedMigrateDatabase.mockRejectedValue(error);

    database.close.mockImplementation(() => {
      throw new Error('Connection could not be closed');
    });

    await expect(initializeAppDatabase(openDatabase)).rejects.toBe(error);

    expect(database.close).toHaveBeenCalledTimes(1);
  });
});

function createDatabase(): jest.Mocked<AppDatabase> {
  return {
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
  };
}

function createDeferred() {
  let complete!: () => void;

  const promise = new Promise<void>(resolve => {
    complete = resolve;
  });

  return {
    promise,
    resolve: complete,
  };
}
