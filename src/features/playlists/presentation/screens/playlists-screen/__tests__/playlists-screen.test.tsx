import { act, render, screen, userEvent } from '@testing-library/react-native';

import { createPlaylist } from '@/features/playlists/application/create-playlist';
import { createInMemoryPlaylistRepository } from '@/features/playlists/infrastructure/in-memory-playlist-repository';
import { PlaylistsScreen } from '@/features/playlists/presentation/screens/playlists-screen/playlists-screen';
import { createDeferred } from '@/shared/testing/create-deferred';
import type { CreatePlaylistResult } from '@/features/playlists/application/create-playlist';
import type { Playlist } from '@/features/playlists/domain/playlist';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const playlist: Playlist = {
  id: 'playlist-1',
  name: 'Дорога',
  trackIds: [],
};

describe('playlists screen', () => {
  test('given pending loading, when an empty result arrives, then the creation form and empty state become available', async () => {
    const loading = createDeferred<readonly Playlist[]>();
    const operations = createOperations();

    operations.getPlaylists.mockReturnValue(loading.promise);

    await render(<PlaylistsScreen {...operations} />);

    expect(screen.getByText('Загружаем плейлисты...')).toBeOnTheScreen();

    expect(screen.queryByLabelText('Название плейлиста')).not.toBeOnTheScreen();

    expect(
      screen.queryByText('Плейлистов пока нет. Создайте первый.'),
    ).not.toBeOnTheScreen();

    await act(async () => {
      loading.resolve([]);
      await loading.promise;
    });

    expect(
      screen.getByText('Плейлистов пока нет. Создайте первый.'),
    ).toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toBeEnabled();

    expect(screen.queryByText('Загружаем плейлисты...')).not.toBeOnTheScreen();
  });

  test('given failed loading, when retrying successfully, then saved playlists become available', async () => {
    const user = userEvent.setup();
    const retry = createDeferred<readonly Playlist[]>();
    const operations = createOperations();

    operations.getPlaylists
      .mockRejectedValueOnce(new Error('Native storage details'))
      .mockReturnValueOnce(retry.promise);

    await render(<PlaylistsScreen {...operations} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось загрузить плейлисты. Попробуйте ещё раз',
    );

    expect(screen.queryByText('Native storage details')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Повторить' }));

    expect(screen.getByText('Загружаем плейлисты...')).toBeOnTheScreen();

    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeOnTheScreen();

    await act(async () => {
      retry.resolve([playlist]);
      await retry.promise;
    });

    expect(screen.getByText('Дорога')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();

    expect(operations.getPlaylists).toHaveBeenCalledTimes(2);
  });

  test('given pending creation, when saving succeeds, then the confirmed playlist appears in the list', async () => {
    const user = userEvent.setup();
    const saving = createDeferred<CreatePlaylistResult>();
    const operations = createOperations();

    operations.createPlaylist.mockReturnValue(saving.promise);

    await render(<PlaylistsScreen {...operations} />);

    const input = await screen.findByLabelText('Название плейлиста');

    await user.type(input, ' Дорога ');
    await user.press(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    );

    expect(operations.createPlaylist).toHaveBeenCalledWith(' Дорога ');
    expect(
      screen.getByText('Плейлистов пока нет. Создайте первый.'),
    ).toBeOnTheScreen();

    expect(screen.queryByText('Дорога')).not.toBeOnTheScreen();

    await act(async () => {
      saving.resolve({ ok: true, playlist });
      await saving.promise;
    });

    expect(screen.getByText('Дорога')).toBeOnTheScreen();

    expect(screen.queryByText('Плейлист «Дорога» создан.')).toBeOnTheScreen();

    expect(
      screen.queryByText('Плейлистов пока нет. Создайте первый.'),
    ).not.toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue('');

    expect(operations.getPlaylists).toHaveBeenCalledTimes(1);
  });

  test('given failed creation, when submitting, then the existing list and entered name are preserved', async () => {
    const user = userEvent.setup();
    const operations = createOperations();

    operations.getPlaylists.mockResolvedValue([playlist]);

    await render(<PlaylistsScreen {...operations} />);

    const input = await screen.findByLabelText('Название плейлиста');

    await user.type(input, 'Работа');
    await user.press(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    );

    expect(
      await screen.findByText(
        'Не удалось сохранить плейлист. Попробуйте ещё раз',
      ),
    ).toBeOnTheScreen();

    expect(screen.getByText('Дорога')).toBeOnTheScreen();
    expect(screen.queryByText('Работа')).not.toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue(
      'Работа',
    );

    expect(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    ).toBeEnabled();
  });

  test('given an outdated loading request, when it finishes after the current request, then the current list is preserved', async () => {
    const initialLoading = createDeferred<readonly Playlist[]>();
    const operations = createOperations();

    operations.getPlaylists.mockReturnValue(initialLoading.promise);

    const { rerender } = await render(<PlaylistsScreen {...operations} />);

    const getCurrentPlaylists = jest
      .fn<Promise<readonly Playlist[]>, []>()
      .mockResolvedValue([playlist]);

    await rerender(
      <PlaylistsScreen {...operations} getPlaylists={getCurrentPlaylists} />,
    );

    expect(await screen.findByText('Дорога')).toBeOnTheScreen();

    await act(async () => {
      initialLoading.resolve([
        {
          ...playlist,
          name: 'Старый список',
        },
      ]);

      await initialLoading.promise;
    });

    expect(screen.getByText('Дорога')).toBeOnTheScreen();
    expect(screen.queryByText('Старый список')).not.toBeOnTheScreen();
  });

  test('given an existing playlist, when creating another with the same name, then both saved playlists are displayed', async () => {
    const user = userEvent.setup();
    const repository = createInMemoryPlaylistRepository();

    await repository.add(playlist);

    const operations = {
      getPlaylists: () => repository.getAll(),
      createPlaylist: (inputName: string) =>
        createPlaylist(inputName, {
          repository,
          idGenerator: {
            generate: () => 'playlist-2',
          },
        }),
    };

    await render(<PlaylistsScreen {...operations} />);

    expect(await screen.findByText('Дорога')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Название плейлиста'), ' Дорога ');

    await user.press(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    );

    expect(
      await screen.findByText('Плейлист «Дорога» создан.'),
    ).toBeOnTheScreen();

    expect(screen.getAllByText('Дорога')).toHaveLength(2);

    expect(await repository.getAll()).toEqual([
      playlist,
      {
        ...playlist,
        id: 'playlist-2',
      },
    ]);
  });
});

function createOperations() {
  return {
    getPlaylists: jest
      .fn<Promise<readonly Playlist[]>, []>()
      .mockResolvedValue([]),

    createPlaylist: jest
      .fn<Promise<CreatePlaylistResult>, [string]>()
      .mockResolvedValue({
        ok: false,
        error: 'CREATE_FAILED',
      }),
  };
}
