import { parsePlaylistName } from '../playlist-name.ts';

describe('parsePlaylistName', () => {
  test.each([
    ['Дорога', 'Дорога'],
    ['  Дорога  ', 'Дорога'],
    ['  Моя  МуЗыКа  ', 'Моя  МуЗыКа'],
  ])('given %p, when parsed, then the name is %p', (input, expectedName) => {
    const result = parsePlaylistName(input);

    expect(result).toEqual({
      ok: true,
      name: expectedName,
    });
  });

  test.each(['', '    ', '\t\n'])(
    'given blank input %p, when parsed, then it is rejected',
    input => {
      const result = parsePlaylistName(input);

      expect(result).toEqual({
        ok: false,
        error: 'EMPTY_NAME',
      });
    },
  );
});
