import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CreatePlaylistResult } from '@/features/playlists/application/create-playlist';

export type CreatePlaylistFormProps = {
  onCreatePlaylist: (inputName: string) => Promise<CreatePlaylistResult>;
};

type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'success'; name: string };

const errorMessages = {
  EMPTY_NAME: 'Введите название плейлиста',
  CREATE_FAILED: 'Не удалось сохранить плейлист. Попробуйте ещё раз',
};

export function CreatePlaylistForm({
  onCreatePlaylist,
}: CreatePlaylistFormProps) {
  const [name, setName] = useState('');
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
  });

  const inProgress = useRef(false);
  const active = useRef(false);

  const isSubmitting = submission.status === 'submitting';

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
    };
  }, []);

  function handleNameChange(value: string) {
    if (inProgress.current) {
      return;
    }

    setName(value);
    setSubmission({ status: 'idle' });
  }

  async function handleSubmit() {
    if (inProgress.current) {
      return;
    }

    inProgress.current = true;
    setSubmission({ status: 'submitting' });

    try {
      const result = await onCreatePlaylist(name);

      if (!active.current) {
        return;
      }

      if (!result.ok) {
        setSubmission({
          status: 'error',
          message: errorMessages[result.error],
        });

        return;
      }

      setName('');
      setSubmission({
        status: 'success',
        name: result.playlist.name,
      });
    } catch {
      if (active.current) {
        setSubmission({
          status: 'error',
          message: errorMessages.CREATE_FAILED,
        });
      }
    } finally {
      inProgress.current = false;
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Название плейлиста</Text>

      <TextInput
        accessibilityLabel="Название плейлиста"
        accessibilityState={{ disabled: isSubmitting }}
        editable={!isSubmitting}
        value={name}
        onChangeText={handleNameChange}
        style={styles.input}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: isSubmitting,
          busy: isSubmitting,
        }}
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Создаём...' : 'Создать'}
        </Text>
      </Pressable>

      {submission.status === 'error' && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.message, styles.error]}
        >
          {submission.message}
        </Text>
      )}

      {submission.status === 'success' && (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {`Плейлист «${submission.name}» создан.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  label: {
    fontSize: 18,
    color: '#111111',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#687386',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: '#111111',
    backgroundColor: '#ffffff',
  },
  button: {
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#174ea6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#111111',
  },
  error: {
    color: '#a11d1d',
  },
});
