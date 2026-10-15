export type PlaylistNameResult =
  | { readonly ok: true; readonly name: string }
  | { readonly ok: false; readonly error: 'EMPTY_NAME' };

export function parsePlaylistName(input: string): PlaylistNameResult {
  const name = input.trim();

  if (name.length === 0) {
    return { ok: false, error: 'EMPTY_NAME' };
  }

  return {
    ok: true,
    name,
  };
}
