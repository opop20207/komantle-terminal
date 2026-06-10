export const PROMPT = 'C:\\Users\\komantle >';
export const API_MODE: 'mock' | 'real' = 'mock';
export const KOMANTLE_PROXY_BASE_URL = 'https://komantle-proxy.opop202077.workers.dev';
export const WELCOME_BANNER = [
  'Microsoft Windows',
  '(c) Microsoft Corporation. All rights reserved.',
].join('\n');

export const STORAGE_KEYS = {
  appState: 'komantle-terminal-state',
} as const;

export const COMMAND_NAMES = [
  'help',
  'clear',
  'history',
  'rank',
  'top',
  'find',
  'api',
  'guess',
  'reset',
] as const;
