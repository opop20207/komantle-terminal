import { PROMPT } from '../constants';

type PrintOptions = {
  variant?: 'normal' | 'banner';
};

export class OutputRenderer {
  private readonly outputElement: HTMLElement;

  constructor(outputElement: HTMLElement) {
    this.outputElement = outputElement;
  }

  print(text: string, options: PrintOptions = {}): void {
    const block = document.createElement('pre');
    block.className = [
      'terminal-output-block',
      options.variant === 'banner' ? 'terminal-output-banner' : '',
    ].filter(Boolean).join(' ');
    block.textContent = text;
    this.outputElement.append(block);
    this.scrollToBottom();
  }

  echoCommand(command: string): void {
    const line = document.createElement('div');
    line.className = 'terminal-command-line';

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = PROMPT;

    const value = document.createElement('span');
    value.textContent = ` ${command}`;

    line.append(prompt, value);
    this.outputElement.append(line);
    this.scrollToBottom();
  }

  clear(): void {
    this.outputElement.replaceChildren();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
    window.requestAnimationFrame(() => {
      this.outputElement.scrollTop = this.outputElement.scrollHeight;
    });
  }
}
