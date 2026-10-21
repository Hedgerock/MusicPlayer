import { createRandomPlaylistIdGenerator } from '@/features/playlists/infrastructure/random-playlist-id-generator';

describe('random playlist ID generator', () => {
  test('given known bytes, when generation an ID, then each byte is encoded as two lowercase hexadecimal characters', () => {
    const generator = createRandomPlaylistIdGenerator(bytes => {
      bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 254, 255]);
    });

    expect(generator.generate()).toBe('000102030405060708090a0b0c0dfeff');
  });

  test('given different random bytes, when generating twice, then each call produces its own ID', () => {
    let nextValue = 1;

    const generator = createRandomPlaylistIdGenerator(bytes => {
      bytes.fill(nextValue);
      nextValue += 1;
    });

    expect(generator.generate()).toBe('01'.repeat(16));
    expect(generator.generate()).toBe('02'.repeat(16));
  });

  test('given a failing random source, when generating an ID, then the error is propagated', () => {
    const error = new Error('Random source unavailable');

    const generator = createRandomPlaylistIdGenerator(() => {
      throw error;
    });

    expect(() => generator.generate()).toThrow(error);
  });
});
