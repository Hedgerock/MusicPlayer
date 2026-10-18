export const createPlaylistsMigration = {
  version: 1,
  statements: [
    `CREATE TABLE playlists (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL
     )`,
    `CREATE TABLE playlist_tracks (
        playlist_id TEXT NOT NULL,
        position INTEGER NOT NULL CHECK (position >= 0),
        track_id TEXT NOT NULL,
        PRIMARY KEY (playlist_id, position),
        FOREIGN KEY (playlist_id)
            REFERENCES playlists (id)
            ON DELETE CASCADE
     )`,
  ],
} as const;
