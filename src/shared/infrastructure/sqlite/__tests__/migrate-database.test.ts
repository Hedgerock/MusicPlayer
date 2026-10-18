import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type { MigrationDatabase } from '@/shared/infrastructure/sqlite/migrate-database';

describe('migrateDatabase', () => {
  test.each([
    { versions: [0] },
    { versions: [1, 1] },
    { versions: [1, 3] },
    { versions: [2, 1] },
    { versions: [1.5] },
  ])(
    'given migration versions $versions, when migrating, then invalid configuration is rejected before database access',
    async ({ versions }) => {
      const database = createDatabase();

      const migrations = versions.map(version => ({
        version,
        statements: [],
      }));

      await expect(migrateDatabase(database, migrations)).rejects.toThrow(
        'Migration version must be sequential starting at 1',
      );

      expect(database.execute).not.toHaveBeenCalled();
      expect(database.transaction).not.toHaveBeenCalled();
    },
  );

  test.each([undefined, '1', -1, 0.5])(
    'given invalid database version %p, when migrating, then migration fails',
    async version => {
      const database = createDatabase();

      database.execute.mockResolvedValue({
        rows: [{ user_version: version }],
      });

      await expect(
        migrateDatabase(database, [{ version: 1, statements: [] }]),
      ).rejects.toThrow('Invalid database schema version');

      expect(database.transaction).not.toHaveBeenCalled();
    },
  );
});

function createDatabase(): jest.Mocked<MigrationDatabase> {
  return {
    execute: jest.fn().mockResolvedValue({
      rows: [{ user_version: 0 }],
    }),
    transaction: jest.fn(),
  };
}
