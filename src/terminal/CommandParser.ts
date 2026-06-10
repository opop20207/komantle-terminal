import type { ParsedCommand } from './types';

export class CommandParser {
  parse(rawInput: string): ParsedCommand {
    const raw = rawInput.trim();
    const [name = '', ...args] = raw.split(/\s+/).filter(Boolean);

    return {
      raw,
      name: name.toLowerCase(),
      args,
    };
  }
}
