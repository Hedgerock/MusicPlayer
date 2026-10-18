export async function checkSqliteStorage(): Promise<number> {
  const { open } = await import('@op-engineering/op-sqlite');

  const database = open({
    name: 'musicPlayer-storage-check.sqlite',
  });

  try {
    let count = 0;

    await database.transaction(async transaction => {
      await transaction.execute(
        `CREATE TABLE IF NOT EXISTS storage_probe (
            id INTEGER PRIMARY KEY,
            runs INTEGER NOT NULL 
        )`,
      );

      await transaction.execute(
        `INSERT INTO storage_probe (id, runs)
         VALUES (?, ?)
         ON CONFLICT(id) DO NOTHING`,
        [1, 0],
      );

      await transaction.execute(
        'UPDATE storage_probe SET runs = runs + 1 WHERE id = ?',
        [1],
      );

      const result = await transaction.execute(
        'SELECT runs FROM storage_probe WHERE id = ?',
        [1],
      );

      const value = result.rows[0]?.runs;

      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new Error('Unexpected SQLite counter value');
      }

      count = value;
    });

    return count;
  } finally {
    database.close();
  }
}
