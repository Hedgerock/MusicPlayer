import React from 'react';
import { Pressable, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

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
  let renderer: ReactTestRenderer.ReactTestRenderer;

  beforeEach(() => {
    mockGetAppDatabase.mockReset();
  });

  afterEach(async () => {
    if (renderer) {
      await ReactTestRenderer.act(() => {
        renderer.unmount();
      });
    }
  });

  test('given pending initialization, when the application starts, then content appears only after storage is ready', async () => {
    const initialization = createDeferred();

    mockGetAppDatabase.mockReturnValue(initialization.promise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    expect(mockGetAppDatabase).toHaveBeenCalledTimes(1);
    expect(readText()).toContain('Готовим приложение...');
    expect(readText()).not.toContain('Проверка хранилища');

    await ReactTestRenderer.act(async () => {
      initialization.resolve();

      await initialization.promise;
    });

    expect(readText()).not.toContain('Готовим приложение...');
    expect(readText()).toContain('Проверка хранилища');
  });

  test('given failed initialization, when the user retries successfully, then application content becomes available', async () => {
    const error = new Error('Native database could not be opened');
    const retry = createDeferred();

    mockGetAppDatabase
      .mockRejectedValueOnce(error)
      .mockReturnValueOnce(retry.promise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    expect(readText()).toContain(
      'Не удалось подготовить приложение. Попробуйте ещё раз.',
    );
    expect(readText()).toContain('Повторить');
    expect(readText()).not.toContain('Проверка хранилища');
    expect(readText()).not.toContain(error.message);

    await ReactTestRenderer.act(() => {
      renderer.root
        .find(
          node =>
            node.props.accessibilityRole === 'button' &&
            typeof node.props.onPress === 'function',
        )
        .props.onPress();
    });

    expect(mockGetAppDatabase).toHaveBeenCalledTimes(2);
    expect(readText()).toContain('Готовим приложение...');

    expect(renderer.root.findAllByType(Pressable)).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      retry.resolve();

      await retry.promise;
    });

    expect(readText()).toContain('Проверка хранилища');
    expect(readText()).not.toContain('Повторить');
  });

  function readText() {
    return renderer.root.findAllByType(Text).map(node => node.props.children);
  }
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
