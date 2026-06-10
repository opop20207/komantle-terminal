import type { Command } from '../terminal/types';

export const clearCommand: Command = {
  name: 'clear',
  description: 'Clear terminal output.',
  usage: 'clear',
  execute: () => ({
    action: 'clear',
  }),
};
