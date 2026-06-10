import type { Command, CommandResult } from '../terminal/types';

const commandDescriptions = [
  ['help', 'Show available commands'],
  ['clear', 'Clear terminal output'],
  ['history', 'Show command history'],
  ['guess [word]', 'Submit a word'],
  ['rank', 'Show all guessed words sorted by similarity'],
  ['top', 'Show top 10 guessed words'],
  ['find [word]', 'Find a previous guess'],
  ['api', 'Show API mode'],
  ['api mock', 'Switch to mock API mode'],
  ['api real', 'Switch to real API mode'],
  ['api day', 'Show current official puzzle day'],
  ['reset', 'Clear all stored data'],
];

export const helpCommand: Command = {
  name: 'help',
  description: 'Display available commands.',
  usage: 'help',
  execute: (): CommandResult => {
    const rows = commandDescriptions.map(([command, description]) => {
      return `${command.padEnd(13)} ${description}`;
    });

    return {
      action: 'print',
      output: ['## Available Commands', '', ...rows].join('\n'),
    };
  },
};
