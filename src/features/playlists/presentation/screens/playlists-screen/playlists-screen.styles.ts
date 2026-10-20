import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111111',
  },
  feedback: {
    gap: 16,
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
  playlist: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  playlistName: {
    fontSize: 20,
    color: '#111111',
  },
});
