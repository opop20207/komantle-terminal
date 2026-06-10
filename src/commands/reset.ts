import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';

export const resetCommand: Command = {
  name: 'reset',
  description: 'Clear command history and guessed words.',
  usage: 'reset',
  execute: () => {
    StorageService.clearState();

    return {
      action: 'print',
      output: 'Terminal storage reset.',
    };
  },
};
