import type { COMMAND_NAMES } from '../constants';

export type CommandName = (typeof COMMAND_NAMES)[number];

export type CommandAction = 'print' | 'clear';

export type CommandResult = {
  action: CommandAction;
  output?: string;
};

export type ParsedCommand = {
  raw: string;
  name: string;
  args: string[];
};

export type CommandContext = {
  history: string[];
};

export type Command = {
  name: CommandName;
  description: string;
  usage: string;
  execute: (args: string[], context: CommandContext) => CommandResult | Promise<CommandResult>;
};
