import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatePlaylistForm } from '@/features/playlists/presentation/screens/playlists-screen/components/create-playlist-form';
import { styles } from '@/features/playlists/presentation/screens/playlists-screen/playlists-screen.styles';
import type { CreatePlaylistResult } from '@/features/playlists/application/create-playlist';
import type { Playlist } from '@/features/playlists/domain/playlist';

export type PlaylistsScreenProps = {
  getPlaylists: () => Promise<readonly Playlist[]>;
  createPlaylist: (inputName: string) => Promise<CreatePlaylistResult>;
};

type PlaylistsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; playlists: readonly Playlist[] };

export function PlaylistsScreen({
  getPlaylists,
  createPlaylist,
}: PlaylistsScreenProps) {
  const [state, setState] = useState<PlaylistsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const requestRevision = useRef(0);

  useEffect(() => {
    requestRevision.current += 1;

    const version = requestRevision.current;

    setState({ status: 'loading' });

    async function loadPlaylists() {
      try {
        const playlists = await getPlaylists();

        if (requestRevision.current === version) {
          setState({ status: 'ready', playlists });
        }
      } catch {
        if (requestRevision.current === version) {
          setState({ status: 'error' });
        }
      }
    }

    void loadPlaylists();

    return () => {
      requestRevision.current += 1;
    };
  }, [getPlaylists, attempt]);

  function retryLoading() {
    setState({ status: 'loading' });
    setAttempt(curAttempt => curAttempt + 1);
  }

  async function handleCreatePlaylist(inputName: string) {
    const version = requestRevision.current;
    const result = await createPlaylist(inputName);

    if (result.ok && requestRevision.current === version) {
      setState(current => {
        if (current.status !== 'ready') {
          return current;
        }

        return {
          status: 'ready',
          playlists: [...current.playlists, result.playlist],
        };
      });
    }

    return result;
  }

  const playlists = state.status === 'ready' ? state.playlists : [];

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList<Playlist>
        data={playlists}
        keyExtractor={playlist => playlist.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Плейлисты
            </Text>

            {state.status === 'ready' && (
              <>
                <Text accessibilityRole="header" style={styles.heading}>
                  Новый плейлист
                </Text>

                <CreatePlaylistForm onCreatePlaylist={handleCreatePlaylist} />

                <Text accessibilityRole="header" style={styles.heading}>
                  Сохранённые плейлисты
                </Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.feedback}>
            {state.status === 'loading' && (
              <Text accessibilityLiveRegion="polite" style={styles.message}>
                Загружаем плейлисты...
              </Text>
            )}

            {state.status === 'error' && (
              <>
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={[styles.message, styles.error]}
                >
                  Не удалось загрузить плейлисты. Попробуйте ещё раз
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={retryLoading}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Повторить</Text>
                </Pressable>
              </>
            )}

            {state.status === 'ready' && (
              <Text style={styles.message}>
                Плейлистов пока нет. Создайте первый.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.playlist}>
            <Text style={styles.playlistName}>{item.name}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
