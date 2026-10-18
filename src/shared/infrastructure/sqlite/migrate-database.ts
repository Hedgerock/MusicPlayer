export type Migration = {
  readonly version: number;
  readonly statements: readonly string[];
};

export type SqlQueryResult = {
  readonly rows: readonly Record<string, unknown>[];
};

export type MigrationExecutor = {
  execute(sql: string): Promise<SqlQueryResult>;
};

export type MigrationDatabase = MigrationExecutor & {
  transaction(
    work: (transaction: MigrationExecutor) => Promise<void>,
  ): Promise<void>;
};

export async function migrateDatabase(
  database: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<void> {
  for (const [index, migration] of migrations.entries()) {
    if (migration.version !== index + 1) {
      throw new Error('Migration version must be sequential starting at 1');
    }
  }

  const result = await database.execute('PRAGMA user_version');
  const currentVersion = result.rows[0]?.user_version;

  if (
    typeof currentVersion !== 'number' ||
    !Number.isInteger(currentVersion) ||
    currentVersion < 0
  ) {
    throw new Error('Invalid database schema version');
  }

  if (currentVersion > migrations.length) {
    throw new Error('Database schema version is newer than supported');
  }

  await database.execute('PRAGMA foreign_keys = ON');

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.transaction(async transaction => {
      for (const statement of migration.statements) {
        await transaction.execute(statement);
      }

      await transaction.execute(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
