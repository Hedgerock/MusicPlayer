import { act, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import App from '../App';

const mockGetAppDatabase = jest.fn<Promise<unknown>, []>();

jest.mock('@/app/storage/get-app-database', () => ({
  getAppDatabase: () => mockGetAppDatabase(),
}));

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('application startup', () => {
  beforeEach(() => {
    mockGetAppDatabase.mockReset();
  });

  test('given pending initialization, when the application starts, then content appears only after storage is ready', async () => {
    const initialization = createDeferred();

    mockGetAppDatabase.mockReturnValue(initialization.promise);

    await render(<App />);

    expect(mockGetAppDatabase).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Готовим приложение...')).toBeOnTheScreen();
    expect(screen.queryByText('Проверка хранилища')).not.toBeOnTheScreen();

    await act(async () => {
      initialization.resolve();

      await initialization.promise;
    });

    expect(screen.getByText('Проверка хранилища')).toBeOnTheScreen();
    expect(screen.queryByText('Готовим приложение...')).not.toBeOnTheScreen();
  });

  test('given failed initialization, when the user retries successfully, then application content becomes available', async () => {
    const user = userEvent.setup();
    const error = new Error('Native database could not be opened');
    const retry = createDeferred();

    mockGetAppDatabase
      .mockRejectedValueOnce(error)
      .mockReturnValueOnce(retry.promise);

    await render(<App />);

    expect(
      screen.getByText(
        'Не удалось подготовить приложение. Попробуйте ещё раз.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Повторить')).toBeOnTheScreen();
    expect(screen.queryByText('Проверка хранилища')).not.toBeOnTheScreen();
    expect(screen.queryByText(error.message)).not.toBeOnTheScreen();

    const retryButton = screen.getByRole('button', {
      name: 'Повторить',
    });

    expect(retryButton).toBeEnabled();

    await user.press(retryButton);

    expect(mockGetAppDatabase).toHaveBeenCalledTimes(2);

    expect(screen.getByText('Готовим приложение...')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeOnTheScreen();
    expect(screen.queryByText('Проверка хранилища')).not.toBeOnTheScreen();

    await act(async () => {
      retry.resolve();

      await retry.promise;
    });

    expect(screen.getByText('Проверка хранилища')).toBeOnTheScreen();
    expect(screen.queryByText('Готовим приложение...')).not.toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Повторить' }),
    ).not.toBeOnTheScreen();
  });
});

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
