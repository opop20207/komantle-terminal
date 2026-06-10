import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';
import { formatRankRows, sortGuessesBySimilarity } from './guessFormat';

export const rankCommand: Command = {
  name: 'rank',
  description: 'Display stored guesses by similarity.',
  usage: 'rank',
  execute: () => {
    const guesses = sortGuessesBySimilarity(StorageService.getGuesses());

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
