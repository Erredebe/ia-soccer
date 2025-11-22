import { SVG_NS } from '../constants.js';
import { gameState } from '../state.js';

export class PitchRenderer {
  constructor(container) {
    this.container = container;
    this.pitch = null;
    this.elements = {
      players: new Map(),
      ball: null
    };
  }

  initialize(dimensions) {
    this.dimensions = dimensions;
    this.pitch = document.createElementNS(SVG_NS, 'svg');
    this.pitch.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);
    this.pitch.classList.add('match-visualization__pitch');
    this.pitch.setAttribute('aria-hidden', 'true');
    
    // Ensure container is clean
    this.container.innerHTML = '';
    this.container.appendChild(this.pitch);
  }

  clear() {
    if (this.pitch) {
      this.pitch.innerHTML = '';
      this.elements.players.clear();
      this.elements.ball = null;
    }
  }

  renderFrame(frame) {
    if (!this.pitch) return;

    // Clear for simple redraw (optimization can be added later)
    this.pitch.innerHTML = '';

    // Render players
    if (Array.isArray(frame.players)) {
      frame.players.forEach(player => {
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('transform', `translate(${player.x}, ${player.y})`);
        
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('r', '0.4');
        circle.classList.add('match-visualization__player');
        
        if (player.side === 'home') {
          circle.classList.add('match-visualization__player--home');
          if (gameState.club?.primaryColor) {
            circle.style.fill = gameState.club.primaryColor;
          }
        } else {
          circle.classList.add('match-visualization__player--away');
          if (gameState.club?.secondaryColor) {
            circle.style.fill = gameState.club.secondaryColor;
          }
        }
        
        group.appendChild(circle);
        this.pitch.appendChild(group);
      });
    }

    // Render ball
    if (frame.ball) {
      const ball = document.createElementNS(SVG_NS, 'circle');
      ball.setAttribute('cx', frame.ball.x);
      ball.setAttribute('cy', frame.ball.y);
      ball.setAttribute('r', '0.2');
      ball.classList.add('match-visualization__ball');
      this.pitch.appendChild(ball);
    }
  }

  destroy() {
    if (this.pitch) {
      this.pitch.remove();
      this.pitch = null;
    }
    this.elements.players.clear();
    this.elements.ball = null;
  }
}
