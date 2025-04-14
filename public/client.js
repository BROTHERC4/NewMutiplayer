// public/client.js

import { Game } from './game/main.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing game...');
  window.game = new Game();
});