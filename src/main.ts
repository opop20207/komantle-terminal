import './styles/theme.css';
import './styles/terminal.css';
import { Terminal } from './terminal/Terminal';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Application root was not found.');
}

const terminal = new Terminal(app);
terminal.start();
