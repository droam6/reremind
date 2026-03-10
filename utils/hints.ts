import AsyncStorage from '@react-native-async-storage/async-storage';

const HINTS_KEY = '@reremind/hintsShown';

export async function getHintsShown(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read hints:', e);
    return [];
  }
}

export async function markHintShown(hintId: string): Promise<void> {
  try {
    const shown = await getHintsShown();
    if (!shown.includes(hintId)) {
      shown.push(hintId);
      await AsyncStorage.setItem(HINTS_KEY, JSON.stringify(shown));
    }
  } catch (e) {
    console.error('Failed to mark hint shown:', e);
  }
}

export async function isHintShown(hintId: string): Promise<boolean> {
  const shown = await getHintsShown();
  return shown.includes(hintId);
}
