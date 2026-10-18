import type { DB } from '@op-engineering/op-sqlite';

import { createAppDatabaseLoader } from '@/app/storage/create-app-database-loader';

export const getAppDatabase = createAppDatabaseLoader<DB>(async name => {
  const { open } = await import('@op-engineering/op-sqlite');

  return open({ name });
});
