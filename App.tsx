/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import {
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import { checkSqliteStorage } from './src/features/playlists/infrastructure/check-sqlite-storage.ts';
import ScrollView = Animated.ScrollView;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={__DEV__ || !isDarkMode ? 'dark-content' : 'light-content'}
      />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const inProgress = useRef(false);

  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('Click button for checking database');

  async function handleStorageCheck() {
    if (inProgress.current) {
      return;
    }

    inProgress.current = true;

    setIsChecking(true);
    setMessage('Check is updating');

    try {
      const count = await checkSqliteStorage();

      setMessage(`Checking completed: Counter ${count}.`);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);

      setMessage(`Error checked: ${details}`);
    } finally {
      inProgress.current = false;
      setIsChecking(false);
    }
  }

  if (__DEV__) {
    return (
      <View
        style={[
          styles.container,
          styles.diagnosticScreen,
          {
            paddingTop: safeAreaInsets.top,
            paddingBottom: safeAreaInsets.bottom,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.diagnosticContent}>
          <Text accessibilityRole="header" style={styles.diagnosticTitle}>
            Проверка хранилища
          </Text>

          <Text accessibilityLiveRegion="polite" style={styles.diagnosticText}>
            {message}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: isChecking,
              busy: isChecking,
            }}
            disabled={isChecking}
            onPress={handleStorageCheck}
            style={[
              styles.diagnosticButton,
              isChecking && styles.diagnosticButtonDisabled,
            ]}
          >
            <Text style={styles.diagnosticButtonText}>
              {isChecking ? 'Проверяем...' : 'Проверить хранилище'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  diagnosticScreen: {
    backgroundColor: '#ffffff',
  },
  diagnosticContent: {
    padding: 24,
    gap: 16,
  },
  diagnosticTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
  },
  diagnosticText: {
    fontSize: 18,
    color: '#111111',
  },
  diagnosticButton: {
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#174ea6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticButtonText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  diagnosticButtonDisabled: {
    opacity: 0.6,
  },
});

export default App;
