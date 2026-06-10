import { KomantleApi } from '../services/komantleApi';
import type { Command } from '../terminal/types';

export const apiCommand: Command = {
  name: 'api',
  description: 'Show or update API mode.',
  usage: 'api [mock|real|day|test]',
  execute: async (args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'mock') {
      KomantleApi.setMode('mock');

      return {
        action: 'print',
        output: 'API MODE   mock',
      };
    }

    if (action === 'real') {
      KomantleApi.setMode('real');

      return {
        action: 'print',
        output: 'API MODE   real',
      };
    }

    if (action === 'day') {
      try {
        const day = await KomantleApi.getCurrentDay();

        return {
          action: 'print',
          output: `CURRENT DAY ${day}`,
        };
      } catch (error) {
        const message = error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'current day unavailable';

        return {
          action: 'print',
          output: `ERROR      ${message}`,
        };
      }
    }

    if (action === 'test') {
      const result = await KomantleApi.testRealApi();

      if (result.ok) {
        return {
          action: 'print',
          output: [
            'API TEST   succeeded',
            `CURRENT DAY ${result.day}`,
          ].join('\n'),
        };
      }

      return {
        action: 'print',
        output: [
          'API TEST   failed',
          `REASON     ${result.reason ?? 'network failed'}`,
        ].join('\n'),
      };
    }

    return {
      action: 'print',
      output: `API MODE   ${KomantleApi.getMode()}`,
    };
  },
};
