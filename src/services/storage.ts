import { STORAGE_KEYS } from '../constants';
import type { ApiMode, GuessResult } from './komantleApi';

export type AppStorageState = {
  commandHistory: string[];
  guesses: GuessResult[];
  apiMode: ApiMode;
};

const MAX_HISTORY_ITEMS = 100;
const DEFAULT_API_MODE: ApiMode = 'mock';

const createDefaultState = (): AppStorageState => ({
  commandHistory: [],
  guesses: [],
  apiMode: DEFAULT_API_MODE,
});

const isGuessResult = (value: unknown): value is GuessResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.word === 'string'
    && typeof candidate.similarity === 'number'
    && Number.isFinite(candidate.similarity)
    && (
      candidate.rank === null
      || (typeof candidate.rank === 'number' && Number.isFinite(candidate.rank))
    )
    && typeof candidate.createdAt === 'number'
    && Number.isFinite(candidate.createdAt)
  );
};

const normalizeCommandHistory = (history: unknown): string[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
};

const normalizeGuesses = (guesses: unknown): GuessResult[] => {
  if (!Array.isArray(guesses)) {
    return [];
  }

  return guesses
    .filter(isGuessResult)
    .map((guess) => ({
      word: guess.word.trim(),
      similarity: guess.similarity,
      rank: guess.rank,
      createdAt: guess.createdAt,
    }))
    .filter((guess) => guess.word.length > 0);
};

const normalizeApiMode = (apiMode: unknown): ApiMode => {
  return apiMode === 'real' || apiMode === 'mock' ? apiMode : DEFAULT_API_MODE;
};

const isStorageStateShape = (value: unknown): value is AppStorageState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.commandHistory) && Array.isArray(candidate.guesses);
};

export const StorageService = {
  loadState(): AppStorageState {
    try {
      const storedState = window.localStorage.getItem(STORAGE_KEYS.appState);

      if (!storedState) {
        return createDefaultState();
      }

      const parsedState: unknown = JSON.parse(storedState);

      if (!isStorageStateShape(parsedState)) {
        this.clearState();
        return createDefaultState();
      }

      return {
        commandHistory: normalizeCommandHistory(parsedState.commandHistory),
        guesses: normalizeGuesses(parsedState.guesses),
        apiMode: normalizeApiMode(parsedState.apiMode),
      };
    } catch {
      this.clearState();
      return createDefaultState();
    }
  },

  saveState(state: AppStorageState): void {
    const normalizedState: AppStorageState = {
      commandHistory: normalizeCommandHistory(state.commandHistory),
      guesses: normalizeGuesses(state.guesses),
      apiMode: normalizeApiMode(state.apiMode),
    };

    window.localStorage.setItem(STORAGE_KEYS.appState, JSON.stringify(normalizedState));
  },

  clearState(): void {
    window.localStorage.removeItem(STORAGE_KEYS.appState);
  },

  addCommand(command: string): void {
    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
      return;
    }

    const state = this.loadState();
    this.saveState({
      ...state,
      commandHistory: [...state.commandHistory, normalizedCommand],
    });
  },

  getCommandHistory(): string[] {
    return this.loadState().commandHistory;
  },

  addGuess(result: GuessResult): void {
    const state = this.loadState();
    const guesses = state.guesses.filter((guess) => guess.word !== result.word);

    this.saveState({
      ...state,
      guesses: [...guesses, result],
    });
  },

  getGuesses(): GuessResult[] {
    return this.loadState().guesses;
  },

  clearGuesses(): void {
    const state = this.loadState();
    this.saveState({
      ...state,
      guesses: [],
    });
  },

  getApiMode(): ApiMode {
    return this.loadState().apiMode;
  },

  setApiMode(apiMode: ApiMode): void {
    const state = this.loadState();
    this.saveState({
      ...state,
      apiMode,
    });
  },
};
