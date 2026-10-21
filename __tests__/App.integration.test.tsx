import { DatabaseSync } from 'node:sqlite';

import { render, screen, userEvent } from '@testing-library/react-native';

import { appMigrations } from '@/app/storage/migrations';
import { createPlaylistTestDatabase } from '@/features/playlists/infrastructure/sqlite/testing/create-playlist-test-database';
import { migrateDatabase } from '@/shared/infrastructure/sqlite/migrate-database';
import type { PlaylistDatabase } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';

import App from '../App';

const mockGetAppDatabase = jest.fn<Promise<PlaylistDatabase>, []>();
const mockedGeneratedId = jest.fn<string, []>();

jest.mock('@/app/storage/get-app-database', () => ({
  getAppDatabase: () => mockGetAppDatabase(),
}));

jest.mock(
  '@/features/playlists/infrastructure/random-playlist-id-generator',
  () => ({
    createRandomPlaylistIdGenerator: () => ({
      generate: () => mockedGeneratedId(),
    }),
  }),
);

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('application playlists (SQLite integration)', () => {
  let sqlite: DatabaseSync;

  beforeEach(async () => {
    sqlite = new DatabaseSync(':memory:', {
      enableForeignKeyConstraints: false,
    });

    const database = createPlaylistTestDatabase(sqlite);

    await migrateDatabase(database, appMigrations);

    mockGetAppDatabase.mockReset().mockResolvedValue(database);
    mockedGeneratedId.mockReset().mockReturnValue('playlist-1');
  });

  afterEach(() => {
    sqlite.close();
  });

  test('given a playlist saved through the application, when remounting with the same database, then the playlist is loaded from SQLite', async () => {
    const user = userEvent.setup();
    const application = await render(<App />);

    const input = await screen.findByLabelText('Название плейлиста');

    await user.type(input, ' Дорога ');
    await user.press(screen.getByRole('button', { name: 'Создать' }));

    expect(
      await screen.findByText('Плейлист «Дорога» создан.'),
    ).toBeOnTheScreen();

    expect(sqlite.prepare('SELECT id, name FROM playlists').all()).toEqual([
      {
        id: 'playlist-1',
        name: 'Дорога',
      },
    ]);

    await application.unmount();
    await render(<App />);

    expect(await screen.findByText('Дорога')).toBeOnTheScreen();

    expect(
      screen.queryByText('Плейлист «Дорога» создан.'),
    ).not.toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue('');
    expect(mockedGeneratedId).toHaveBeenCalledTimes(1);
  });
});
