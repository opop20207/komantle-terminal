import { apiCommand } from '../commands/api';
import { clearCommand } from '../commands/clear';
import { findCommand } from '../commands/find';
import { guessCommand } from '../commands/guess';
import { helpCommand } from '../commands/help';
import { historyCommand } from '../commands/history';
import { rankCommand } from '../commands/rank';
import { resetCommand } from '../commands/reset';
import { topCommand } from '../commands/top';
import { PROMPT, WELCOME_BANNER } from '../constants';
import { StorageService } from '../services/storage';
import { CommandParser } from './CommandParser';
import { OutputRenderer } from './OutputRenderer';
import type { Command, CommandContext } from './types';

const commands: Command[] = [
  helpCommand,
  clearCommand,
  historyCommand,
  rankCommand,
  topCommand,
  findCommand,
  apiCommand,
  guessCommand,
  resetCommand,
];

const historyExcludedCommands = new Set(['help', 'history', 'rank', 'top', 'find', 'api', 'reset']);

export class Terminal {
  private readonly parser = new CommandParser();
  private readonly commandMap = new Map<string, Command>();
  private readonly rootElement: HTMLElement;
  private readonly outputElement: HTMLDivElement;
  private readonly inputElement: HTMLInputElement;
  private readonly renderer: OutputRenderer;
  private history: string[] = StorageService.getCommandHistory();
  private historyCursor: number = this.history.length;
  private historyDraft = '';

  constructor(mountElement: HTMLElement) {
    this.rootElement = document.createElement('main');
    this.rootElement.className = 'terminal-shell';
    this.rootElement.setAttribute('aria-label', 'Komantle command terminal');

    this.outputElement = document.createElement('div');
    this.outputElement.className = 'terminal-output';
    this.outputElement.setAttribute('aria-live', 'polite');

    this.inputElement = document.createElement('input');
    this.inputElement.className = 'terminal-input';
    this.inputElement.type = 'text';
    this.inputElement.autocomplete = 'off';
    this.inputElement.autocapitalize = 'off';
    this.inputElement.spellcheck = false;
    this.inputElement.setAttribute('aria-label', 'Command input');

    this.renderer = new OutputRenderer(this.outputElement);
    commands.forEach((command) => this.commandMap.set(command.name, command));
    this.rootElement.append(this.outputElement, this.createInputRow());
    mountElement.replaceChildren(this.rootElement);
  }

  start(): void {
    this.renderer.print(WELCOME_BANNER, { variant: 'banner' });
    this.bindEvents();
    this.focusInput();
  }

  private bindEvents(): void {
    this.rootElement.addEventListener('click', () => this.focusInput());
    this.inputElement.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('focus', () => this.focusInput());
  }

  private createInputRow(): HTMLFormElement {
    const form = document.createElement('form');
    form.className = 'terminal-input-row';
    form.setAttribute('aria-label', 'Terminal prompt');

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = PROMPT;

    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    cursor.setAttribute('aria-hidden', 'true');

    form.append(prompt, this.inputElement, cursor);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.runCurrentCommand();
    });

    return form;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.runCurrentCommand();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.recallHistory(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.recallHistory(1);
    }
  }

  private async runCurrentCommand(): Promise<void> {
    const commandText = this.inputElement.value.trim();
    this.inputElement.value = '';
    this.historyCursor = this.history.length;
    this.historyDraft = '';

    if (!commandText) {
      this.renderer.echoCommand('');
      return;
    }

    this.renderer.echoCommand(commandText);
    await this.executeCommand(commandText);
    this.syncHistory();
  }

  private async executeCommand(commandText: string): Promise<void> {
    const parsedCommand = this.parser.parse(commandText);
    const command = this.commandMap.get(parsedCommand.name);

    if (!command) {
      this.renderer.print(`Unknown command: ${parsedCommand.name}\nType 'help' to begin.`);
      return;
    }

    this.persistCommand(parsedCommand.name, commandText);

    const context: CommandContext = {
      history: [...this.history],
    };
    const result = await command.execute(parsedCommand.args, context);

    if (result.action === 'clear') {
      this.renderer.clear();
      return;
    }

    if (result.output) {
      this.renderer.print(result.output);
    }
  }

  private persistCommand(commandName: string, commandText: string): void {
    const normalizedCommand = commandText.trim();

    if (!normalizedCommand || historyExcludedCommands.has(commandName)) {
      return;
    }

    StorageService.addCommand(normalizedCommand);
    this.syncHistory();
  }

  private recallHistory(direction: -1 | 1): void {
    if (this.history.length === 0) {
      return;
    }

    if (direction === -1 && this.historyCursor === this.history.length) {
      this.historyDraft = this.inputElement.value;
    }

    this.historyCursor = Math.min(
      this.history.length,
      Math.max(0, this.historyCursor + direction),
    );

    this.inputElement.value = this.historyCursor === this.history.length
      ? this.historyDraft
      : this.history[this.historyCursor] ?? '';
    this.inputElement.setSelectionRange(
      this.inputElement.value.length,
      this.inputElement.value.length,
    );
  }

  private focusInput(): void {
    this.inputElement.focus({ preventScroll: true });
  }

  private syncHistory(): void {
    this.history = StorageService.getCommandHistory();
    this.historyCursor = this.history.length;
  }
}
