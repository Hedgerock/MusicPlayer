import { act, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import { createDeferred } from '@/shared/testing/create-deferred';
import type { PlaylistIdGenerator } from '@/features/playlists/application/ports/playlist-id-generator';
import type { PlaylistDatabase } from '@/features/playlists/infrastructure/sqlite/sqlite-playlist-repository';
import type { PlaylistsScreenProps } from '@/features/playlists/presentation/screens/playlists-screen/playlists-screen';

import App from '../App';

const mockGetAppDatabase = jest.fn<Promise<PlaylistDatabase>, []>();

const mockCreatePlaylistServices = jest.fn<
  PlaylistsScreenProps,
  [PlaylistDatabase, PlaylistIdGenerator]
>();

jest.mock('@/app/storage/get-app-database', () => ({
  getAppDatabase: () => mockGetAppDatabase(),
}));

jest.mock('@/app/playlists/create-playlist-services', () => ({
  createPlaylistServices: (
    database: PlaylistDatabase,
    idGenerator: PlaylistIdGenerator,
  ) => mockCreatePlaylistServices(database, idGenerator),
}));

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('application startup', () => {
  let database: PlaylistDatabase;

  beforeEach(() => {
    database = {
      transaction: jest.fn(),
    };

    const services: PlaylistsScreenProps = {
      getPlaylists: async () => [],
      createPlaylist: async () => ({
        ok: false,
        error: 'CREATE_FAILED',
      }),
    };

    mockGetAppDatabase.mockReset();

    mockCreatePlaylistServices.mockReset().mockReturnValue(services);
  });

  test('given pending initialization, when storage becomes ready, then playlist services are composed and the screen becomes available', async () => {
    const initialization = createDeferred<PlaylistDatabase>();

    mockGetAppDatabase.mockReturnValue(initialization.promise);

    await render(<App />);

    expect(screen.getByText('Готовим приложение...')).toBeOnTheScreen();

    expect(
      screen.queryByRole('header', { name: 'Плейлисты' }),
    ).not.toBeOnTheScreen();

    expect(mockCreatePlaylistServices).not.toHaveBeenCalled();

    await act(async () => {
      initialization.resolve(database);
      await initialization.promise;
    });

    expect(
      await screen.findByLabelText('Название плейлиста'),
    ).toBeOnTheScreen();

    expect(mockCreatePlaylistServices).toHaveBeenCalledTimes(1);

    expect(mockCreatePlaylistServices).toHaveBeenCalledWith(
      database,
      expect.objectContaining({
        generate: expect.any(Function),
      }),
    );

    expect(screen.queryByText('Готовим приложение...')).not.toBeOnTheScreen();
  });

  test('given failed initialization, when retrying successfully, then the playlist screen becomes available', async () => {
    const user = userEvent.setup();
    const retry = createDeferred<PlaylistDatabase>();
    const error = new Error('Native database could not be opened');

    mockGetAppDatabase
      .mockRejectedValueOnce(error)
      .mockReturnValueOnce(retry.promise);

    await render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось подготовить приложение. Попробуйте ещё раз.',
    );

    expect(screen.queryByText(error.message)).not.toBeOnTheScreen();
    expect(mockCreatePlaylistServices).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Повторить' }));

    expect(screen.getByText('Готовим приложение...')).toBeOnTheScreen();

    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeOnTheScreen();

    await act(async () => {
      retry.resolve(database);
      await retry.promise;
    });

    expect(
      await screen.findByLabelText('Название плейлиста'),
    ).toBeOnTheScreen();

    expect(mockGetAppDatabase).toHaveBeenCalledTimes(2);
    expect(mockCreatePlaylistServices).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });
});
