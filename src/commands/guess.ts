import { isGuessError, KomantleApi } from '../services/komantleApi';
import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';

export const guessCommand: Command = {
  name: 'guess',
  description: 'Display mock Komantle result.',
  usage: 'guess [word]',
  execute: async (args) => {
    const word = args.join(' ').trim();

    try {
      const result = await KomantleApi.guess(word);
      StorageService.addGuess(result);

      return {
        action: 'print',
        output: [
          `WORD       ${result.word}`,
          `SIMILARITY ${result.similarity.toFixed(2)}`,
          `RANK       ${result.rank ?? '-'}`,
        ].join('\n'),
      };
    } catch (error) {
      const isWordRequiredError = isGuessError(error) && error.code === 'WORD_REQUIRED';
      const isProxyNotConfiguredError = isGuessError(error) && error.code === 'PROXY_NOT_CONFIGURED';
      const message = isGuessError(error) ? error.message : 'guess failed';
      const output = isProxyNotConfiguredError
        ? `ERROR      ${message}\nSet KOMANTLE_PROXY_BASE_URL in constants.ts`
        : KomantleApi.getMode() === 'real' && !isWordRequiredError
        ? `ERROR      ${message}\nTry: api test`
        : `ERROR      ${message}`;

      return {
        action: 'print',
        output,
      };
    }
  },
};
