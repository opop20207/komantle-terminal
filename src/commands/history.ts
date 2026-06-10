import { StorageService } from '../services/storage';
import type { Command } from '../terminal/types';

export const historyCommand: Command = {
  name: 'history',
  description: 'Show previously entered commands.',
  usage: 'history',
  execute: () => {
    const history = StorageService.getCommandHistory();

    if (history.length === 0) {
      return {
        action: 'print',
        output: 'No command history found.',
      };
    }

    const output = history
      .map((command, index) => `${String(index + 1).padStart(3, ' ')}  ${command}`)
      .join('\n');

    return {
      action: 'print',
      output,
    };
  },
};
