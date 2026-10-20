import { act, render, screen, userEvent } from '@testing-library/react-native';

import { CreatePlaylistForm } from '@/features/playlists/presentation/screens/playlists-screen/components/create-playlist-form';
import type { CreatePlaylistResult } from '@/features/playlists/application/create-playlist';

describe('playlist creation form', () => {
  test('given an invalid name result, when submitting, then the validation message is displayed', async () => {
    const user = userEvent.setup();

    const onCreatePlaylist = jest
      .fn<Promise<CreatePlaylistResult>, [string]>()
      .mockResolvedValue({
        ok: false,
        error: 'EMPTY_NAME',
      });

    await render(<CreatePlaylistForm onCreatePlaylist={onCreatePlaylist} />);

    await user.press(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Введите название плейлиста',
    );

    expect(onCreatePlaylist).toHaveBeenCalledWith('');

    expect(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    ).toBeEnabled();
  });

  test('given pending creation, when submitting, then controls stay disabled until success and the input is cleared', async () => {
    const user = userEvent.setup();
    const saving = createDeferred<CreatePlaylistResult>();

    const onCreatePlaylist = jest
      .fn<Promise<CreatePlaylistResult>, [string]>()
      .mockReturnValue(saving.promise);

    await render(<CreatePlaylistForm onCreatePlaylist={onCreatePlaylist} />);

    await user.type(screen.getByLabelText('Название плейлиста'), ' Дорога ');

    await user.press(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    );

    expect(onCreatePlaylist).toHaveBeenCalledWith(' Дорога ');
    expect(
      screen.getByRole('button', {
        name: 'Создаём...',
      }),
    ).toBeDisabled();

    expect(screen.getByLabelText('Название плейлиста')).toBeDisabled();

    expect(
      screen.queryByText('Плейлист «Дорога» создан.'),
    ).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Создаём...' }));

    expect(onCreatePlaylist).toHaveBeenCalledTimes(1);

    await act(async () => {
      saving.resolve({
        ok: true,
        playlist: {
          id: 'playlist-1',
          name: 'Дорога',
          trackIds: [],
        },
      });

      await saving.promise;
    });

    expect(screen.getByText('Плейлист «Дорога» создан.')).toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue('');

    expect(screen.getByRole('button', { name: 'Создать' })).toBeEnabled();
  });

  test('given failed creation, when retrying successfully, then the preserved name is submitted', async () => {
    const user = userEvent.setup();

    const onCreatePlaylist = jest
      .fn<Promise<CreatePlaylistResult>, [string]>()
      .mockResolvedValueOnce({
        ok: false,
        error: 'CREATE_FAILED',
      })
      .mockResolvedValueOnce({
        ok: true,
        playlist: {
          id: 'playlist-1',
          name: 'Дорога',
          trackIds: [],
        },
      });

    await render(<CreatePlaylistForm onCreatePlaylist={onCreatePlaylist} />);

    await user.type(screen.getByLabelText('Название плейлиста'), 'Дорога');

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

    expect(screen.getByRole('button', { name: 'Создать' })).toBeEnabled();

    await user.press(
      screen.getByRole('button', {
        name: 'Создать',
      }),
    );

    expect(
      await screen.findByText('Плейлист «Дорога» создан.'),
    ).toBeOnTheScreen();

    expect(onCreatePlaylist).toHaveBeenCalledTimes(2);
    expect(onCreatePlaylist).toHaveBeenNthCalledWith(2, 'Дорога');

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue('');

    expect(
      screen.queryByText('Не удалось сохранить плейлист. Попробуйте ещё раз'),
    ).not.toBeOnTheScreen();
  });

  test('given a rejected operation, when submitting, then a recovery message is shown and the input is preserved', async () => {
    const user = userEvent.setup();

    const onCreatePlaylist = jest
      .fn<Promise<CreatePlaylistResult>, [string]>()
      .mockRejectedValue(new Error('Native storage details'));

    await render(<CreatePlaylistForm onCreatePlaylist={onCreatePlaylist} />);

    await user.type(screen.getByLabelText('Название плейлиста'), 'Дорога');

    await user.press(screen.getByRole('button', { name: 'Создать' }));

    expect(
      await screen.findByText(
        'Не удалось сохранить плейлист. Попробуйте ещё раз',
      ),
    ).toBeOnTheScreen();

    expect(screen.getByLabelText('Название плейлиста')).toHaveDisplayValue(
      'Дорога',
    );

    expect(screen.getByRole('button', { name: 'Создать' })).toBeEnabled();

    expect(screen.queryByText('Native storage details')).not.toBeOnTheScreen();
  });
});

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;

  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}
