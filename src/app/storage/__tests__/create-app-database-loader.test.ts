import { createAppDatabaseLoader } from '@/app/storage/create-app-database-loader';
import { initializeAppDatabase } from '@/app/storage/initialize-app-database';
import { createDeferred } from '@/shared/testing/create-deferred';
import type {
  AppDatabase,
  OpenAppDatabase,
} from '@/app/storage/initialize-app-database';

jest.mock('@/app/storage/initialize-app-database', () => ({
  initializeAppDatabase: jest.fn(),
}));

const mockedInitializeAppDatabase = jest.mocked(initializeAppDatabase);

describe('createAppDatabaseLoader', () => {
  const database: AppDatabase = {
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
  };

  const openedDatabase: OpenAppDatabase<AppDatabase> = jest.fn();

  beforeEach(() => {
    mockedInitializeAppDatabase.mockReset();
  });

  test('given an opener, when creating a loader, then initialization does not start', () => {
    createAppDatabaseLoader(openedDatabase);

    expect(mockedInitializeAppDatabase).not.toHaveBeenCalled();
  });

  test('given pending initialization, when requesting the database concurrently, then callers share one attempt', async () => {
    const pending = createDeferred<AppDatabase>();

    mockedInitializeAppDatabase.mockReturnValue(pending.promise);

    const getDatabase = createAppDatabaseLoader(openedDatabase);

    const first = getDatabase();
    const second = getDatabase();

    expect(second).toBe(first);

    expect(mockedInitializeAppDatabase).toHaveBeenCalledTimes(1);
    expect(mockedInitializeAppDatabase).toHaveBeenLastCalledWith(
      openedDatabase,
    );

    pending.resolve(database);

    await expect(first).resolves.toBe(database);
  });

  test('given successful initialization, when requesting the database again, then the ready connection is reused', async () => {
    mockedInitializeAppDatabase.mockResolvedValue(database);

    const getDatabase = createAppDatabaseLoader(openedDatabase);

    const first = await getDatabase();
    const second = await getDatabase();

    expect(first).toBe(database);
    expect(second).toBe(first);

    expect(mockedInitializeAppDatabase).toHaveBeenCalledTimes(1);
  });

  test('given failed initialization, when requesting the database again, then a new attempt can succeed', async () => {
    const error = new Error('Initialization failed');

    mockedInitializeAppDatabase
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(database);

    const getDatabase = createAppDatabaseLoader(openedDatabase);

    const first = getDatabase();
    const concurrent = getDatabase();

    expect(concurrent).toBe(first);

    await expect(first).rejects.toBe(error);
    await expect(concurrent).rejects.toBe(error);

    const retry = getDatabase();

    expect(retry).not.toBe(first);

    await expect(retry).resolves.toBe(database);

    expect(mockedInitializeAppDatabase).toHaveBeenCalledTimes(2);
  });
});
