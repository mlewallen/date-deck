import { useCallback, useEffect, useState } from 'react';
import type { Answer, AppData, Deck } from './types';

const DATA_KEY = 'date-deck:v1';
const EMPTY: AppData = { version: 1, profile: null, decks: [] };

function isAppData(value: unknown): value is AppData {
  const data = value as AppData;
  return !!data && data.version === 1 && Array.isArray(data.decks);
}

export function loadData(): AppData {
  try {
    const parsed = JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null');
    if (isAppData(parsed)) return parsed;
  } catch {
    // Corrupt or blocked storage falls back to an empty app.
  }
  return EMPTY;
}

function saveData(data: AppData) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** App data kept in localStorage and synced across open tabs. */
export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DATA_KEY) setData(loadData());
    };
    window.addEventListener('storage', onStorage);
    // Ask the browser not to evict our data under storage pressure.
    navigator.storage?.persist?.().catch(() => {});
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateDeck = useCallback((id: string, change: (deck: Deck) => Deck) => {
    setData((current) => ({
      ...current,
      decks: current.decks.map((deck) => (deck.id === id ? change(deck) : deck)),
    }));
  }, []);

  return { data, setData, updateDeck, saveFailed };
}

export function parseBackup(text: string): AppData | null {
  try {
    const parsed = JSON.parse(text);
    return isAppData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* Partner-side state: in-progress answers and the answer link they already made. */

export type Progress = { step: number; answers: Record<string, Answer>; note: string };

function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Progress is a convenience; losing it is not fatal.
  }
}

export const progressStore = {
  get: (deckId: string) => readJson<Progress>(`date-deck:progress:${deckId}`),
  set: (deckId: string, progress: Progress | null) => writeJson(`date-deck:progress:${deckId}`, progress),
};

export const sentStore = {
  get: (deckId: string) => readJson<{ link: string; at: number }>(`date-deck:sent:${deckId}`),
  set: (deckId: string, link: string) => writeJson(`date-deck:sent:${deckId}`, { link, at: Date.now() }),
};

export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 10);
}
