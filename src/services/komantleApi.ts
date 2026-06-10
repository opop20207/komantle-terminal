import { KOMANTLE_PROXY_BASE_URL } from '../constants';
import { StorageService } from './storage';

export type ApiMode = 'mock' | 'real';

export type GuessRequest = {
  word: string;
};

export type GuessResult = {
  word: string;
  similarity: number;
  rank: number | null;
  createdAt: number;
};

export type GuessError = {
  code: string;
  message: string;
};

export type ApiTestResult = {
  ok: boolean;
  mode: ApiMode;
  day: number | null;
  reason?: string;
  message?: string;
};

type RealGuessPayload = Record<string, unknown>;
type CurrentDayPayload = {
  day: number;
};

const API_TEST_WORD = '\uC0AC\uB791';
const REQUEST_TIMEOUT_MS = 5000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const createGuessError = (code: string, message: string): GuessError => ({
  code,
  message,
});

const getProxyBaseUrl = (): string => KOMANTLE_PROXY_BASE_URL.trim().replace(/\/+$/, '');

const calculateSeed = (word: string): number => {
  return Array.from(word).reduce((total, character, index) => {
    return total + character.codePointAt(0)! * (index + 3);
  }, 0);
};

const normalizeWord = (word: string): string => word.trim();

const createRequest = (word: string): GuessRequest => ({
  word: normalizeWord(word),
});

const getNextKoreanMidnightTimestamp = (): number => {
  const now = Date.now();
  const nowKst = now + KST_OFFSET_MS;
  const nextMidnightKst = (Math.floor(nowKst / 86_400_000) + 1) * 86_400_000;

  return nextMidnightKst - KST_OFFSET_MS;
};

export const isGuessError = (error: unknown): error is GuessError => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
};

const readNumber = (payload: RealGuessPayload, keys: string[]): number | null => {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return null;
};

const normalizeSimilarity = (similarity: number): number => {
  const percentageLikeSimilarity = Math.abs(similarity) <= 1 ? similarity * 100 : similarity;
  return Number(percentageLikeSimilarity.toFixed(2));
};

const hasUnknownWordSignal = (payload: RealGuessPayload): boolean => {
  const message = String(payload.error ?? payload.message ?? payload.detail ?? '').toLowerCase();
  return message.includes('unknown') || message.includes('not found') || message.includes('없는');
};

const parseRealGuessPayload = (word: string, payload: unknown): GuessResult => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createGuessError('INVALID_RESPONSE', 'invalid response');
  }

  const data = payload as RealGuessPayload;

  if (hasUnknownWordSignal(data)) {
    throw createGuessError('UNKNOWN_WORD', 'unknown word');
  }

  const similarity = readNumber(data, ['similarity', 'score', 'sim']);
  const rank = readNumber(data, ['rank', 'ranking']);

  if (similarity === null) {
    throw createGuessError('INVALID_RESPONSE', 'invalid response');
  }

  return {
    word,
    similarity: normalizeSimilarity(similarity),
    rank,
    createdAt: Date.now(),
  };
};

const parseCurrentDayPayload = (payload: unknown): CurrentDayPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createGuessError('INVALID_RESPONSE', 'invalid response');
  }

  const day = (payload as Record<string, unknown>).day;

  if (typeof day !== 'number' || !Number.isInteger(day) || day <= 0) {
    throw createGuessError('INVALID_RESPONSE', 'invalid response');
  }

  return { day };
};

const guessMock = async (word: string): Promise<GuessResult> => {
  const request = createRequest(word);

  if (!request.word) {
    throw createGuessError('WORD_REQUIRED', 'word is required');
  }

  const seed = calculateSeed(request.word);
  const similarity = Number((((seed % 6500) / 100) + 8).toFixed(2));
  const rank = similarity < 25 ? null : (seed % 997) + 1;

  return {
    word: request.word,
    similarity,
    rank,
    createdAt: Date.now(),
  };
};

const fetchJson = async (url: string): Promise<unknown> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw createGuessError('UNKNOWN_ENDPOINT', 'unknown endpoint');
    }

    if (!response.ok) {
      throw createGuessError('NETWORK_FAILED', 'network failed');
    }

    try {
      return await response.json();
    } catch {
      throw createGuessError('INVALID_RESPONSE', 'invalid response');
    }
  } catch (error) {
    if (isGuessError(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createGuessError('NETWORK_FAILED', 'network failed');
    }

    throw createGuessError('CORS_BLOCKED', 'CORS blocked');
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getCurrentDay = async (): Promise<number> => {
  const proxyBaseUrl = getProxyBaseUrl();

  if (!proxyBaseUrl) {
    throw createGuessError('PROXY_NOT_CONFIGURED', 'proxy endpoint is not configured');
  }

  const cachedDay = StorageService.getCurrentDayCache();

  if (cachedDay && cachedDay.expiresAt > Date.now()) {
    return cachedDay.day;
  }

  const payload = await fetchJson(`${proxyBaseUrl}/current-day`);
  const { day } = parseCurrentDayPayload(payload);

  StorageService.setCurrentDayCache({
    day,
    expiresAt: getNextKoreanMidnightTimestamp(),
  });

  return day;
};

const guessReal = async (word: string): Promise<GuessResult> => {
  const request = createRequest(word);

  if (!request.word) {
    throw createGuessError('WORD_REQUIRED', 'word is required');
  }

  const proxyBaseUrl = getProxyBaseUrl();

  if (!proxyBaseUrl) {
    throw createGuessError('PROXY_NOT_CONFIGURED', 'proxy endpoint is not configured');
  }

  const day = await getCurrentDay();
  const encodedWord = encodeURIComponent(request.word);

  const payload = await fetchJson(`${proxyBaseUrl}/guess?day=${day}&word=${encodedWord}`);

  return parseRealGuessPayload(request.word, payload);
};

const guessWithMode = async (word: string, mode: ApiMode): Promise<GuessResult> => {
  if (mode === 'real') {
    return guessReal(word);
  }

  return guessMock(word);
};

const getLikelyReason = (error: unknown): string => {
  if (!isGuessError(error)) {
    return 'network failed';
  }

  if (error.code === 'CORS_BLOCKED') {
    return 'CORS blocked';
  }

  if (error.code === 'INVALID_RESPONSE') {
    return 'invalid response';
  }

  if (error.code === 'UNKNOWN_ENDPOINT') {
    return 'unknown endpoint';
  }

  if (error.code === 'PROXY_NOT_CONFIGURED') {
    return 'proxy endpoint is not configured';
  }

  if (error.code === 'CURRENT_DAY_UNAVAILABLE') {
    return 'current day unavailable';
  }

  return error.message;
};

export const KomantleApi = {
  getMode(): ApiMode {
    return StorageService.getApiMode();
  },

  setMode(mode: ApiMode): void {
    StorageService.setApiMode(mode);
  },

  async guess(word: string): Promise<GuessResult> {
    return guessWithMode(word, StorageService.getApiMode());
  },

  async getCurrentDay(): Promise<number> {
    return getCurrentDay();
  },

  async testRealApi(): Promise<ApiTestResult> {
    let day: number | null = null;

    try {
      day = await getCurrentDay();
      await guessReal(API_TEST_WORD);

      return {
        ok: true,
        mode: 'real',
        day,
      };
    } catch (error) {
      return {
        ok: false,
        mode: 'real',
        day,
        reason: getLikelyReason(error),
        message: isGuessError(error) ? error.message : 'network failed',
      };
    }
  },
};
