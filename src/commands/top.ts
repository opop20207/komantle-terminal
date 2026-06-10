import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';
import { formatRankRows, sortGuessesBySimilarity } from './guessFormat';

const TOP_LIMIT = 10;

export const topCommand: Command = {
  name: 'top',
  description: 'Show top 10 guessed words.',
  usage: 'top',
  execute: () => {
    const guesses = sortGuessesBySimilarity(StorageService.getGuesses()).slice(0, TOP_LIMIT);

    if (guesses.length === 0) {
      return {
        action: 'print',
        output: 'No guesses yet.',
      };
    }

    return {
      action: 'print',
      output: formatRankRows(guesses),
    };
  },
};
