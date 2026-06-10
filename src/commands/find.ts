import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';
import { formatGuessTimestamp } from './guessFormat';

export const findCommand: Command = {
  name: 'find',
  description: 'Find a previous guess.',
  usage: 'find [word]',
  execute: (args) => {
    const word = args.join(' ').trim();

    if (!word) {
      return {
        action: 'print',
        output: 'ERROR      word is required',
      };
    }

    const result = StorageService.getGuesses().find((guess) => guess.word === word);

    if (!result) {
      return {
        action: 'print',
        output: `No result found for: ${word}`,
      };
    }

    return {
      action: 'print',
      output: [
        `WORD       ${result.word}`,
        `SIMILARITY ${result.similarity.toFixed(2)}`,
        `RANK       ${result.rank ?? '-'}`,
        `TIME       ${formatGuessTimestamp(result.createdAt)}`,
      ].join('\n'),
    };
  },
};
