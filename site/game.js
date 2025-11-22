import { initializeGame } from './js/actions.js';
import { setupEventListeners } from './js/events.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    setupEventListeners();
    initializeGame();
  } catch (error) {
    console.error('Game initialization failed:', error);
  }
});
