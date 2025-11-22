import { initializeGame } from './js/actions.js';
import { setupEventListeners } from './js/events.js';

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initializeGame();
});
