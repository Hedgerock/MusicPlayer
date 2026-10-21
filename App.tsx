/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createPlaylistServices } from '@/app/playlists/create-playlist-services';
import { getAppDatabase } from '@/app/storage/get-app-database';
import { createRandomPlaylistIdGenerator } from '@/features/playlists/infrastructure/random-playlist-id-generator';
import { PlaylistsScreen } from '@/features/playlists/presentation/screens/playlists-screen/playlists-screen';

type AppInitializationState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; services: ReturnType<typeof createPlaylistServices> };

type AppStartupProps = {
  status: 'loading' | 'error';
  onRetry: () => void;
};

const playlistIdGenerator = createRandomPlaylistIdGenerator(bytes => {
  globalThis.crypto.getRandomValues(bytes);
});

function App() {
  const [state, setState] = useState<AppInitializationState>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const database = await getAppDatabase();

        if (!active) {
          return;
        }

        const services = createPlaylistServices(database, playlistIdGenerator);

        setState({ status: 'ready', services });
      } catch {
        if (active) {
          setState({ status: 'error' });
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [attempt]);

  function retryInitialization() {
    setState({ status: 'loading' });
    setAttempt(curAttempt => curAttempt + 1);
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />

      {state.status === 'ready' ? (
        <PlaylistsScreen {...state.services} />
      ) : (
        <AppStartup status={state.status} onRetry={retryInitialization} />
      )}
    </SafeAreaProvider>
  );
}

function AppStartup({ status, onRetry }: AppStartupProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Запуск приложения
        </Text>

        <Text
          accessibilityRole={status === 'error' ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          accessibilityState={{ busy: status === 'loading' }}
          style={[styles.message, status === 'error' && styles.error]}
        >
          {status === 'loading'
            ? 'Готовим приложение...'
            : 'Не удалось подготовить приложение. Попробуйте ещё раз.'}
        </Text>

        {status === 'error' && (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Повторить</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
  },
  message: {
    fontSize: 18,
    color: '#111111',
  },
  error: {
    color: '#a11d1d',
  },
  button: {
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#174ea6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default App;
