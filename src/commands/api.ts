import { KomantleApi } from '../services/komantleApi';
import type { Command } from '../terminal/types';

export const apiCommand: Command = {
  name: 'api',
  description: 'Show API mode or test real API connectivity.',
  usage: 'api [test]',
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

    if (action === 'test') {
      const result = await KomantleApi.testRealApi();

      if (result.ok) {
        return {
          action: 'print',
          output: [
            'API TEST   succeeded',
            `DAY        ${result.day}`,
          ].join('\n'),
        };
      }

      return {
        action: 'print',
        output: result.reason === 'proxy endpoint is not configured'
          ? [
            'API TEST   failed',
            'REASON     proxy endpoint is not configured',
          ].join('\n')
          : [
            'API TEST   failed',
            `DAY        ${result.day}`,
            `REASON     ${result.reason ?? 'network failed'}`,
            `MESSAGE    ${result.message ?? 'network failed'}`,
          ].join('\n'),
      };
    }

    return {
      action: 'print',
      output: `API MODE   ${KomantleApi.getMode()}`,
    };
  },
};
