import { GameState } from './game/state.js';
import { GameUI } from './ui/game-ui.js';
import { ShopUI } from './ui/shop-ui.js';
import { UpgradeUI } from './ui/upgrade-ui.js';
import { EntropyPanel } from './ui/entropy-panel.js';
import { DiceParticleRenderer } from './rendering/dice-particles.js';

class DiceRoguelike {
  constructor() {
    this.gameState = new GameState();
    this.lastRollTotal = 0;
    this.gameUI = new GameUI(
      this.gameState,
      () => this.handleThrow(),
      () => this.handleCollect()
    );
    this.shopUI = null;
    this.upgradeUI = null;
    this.diceRenderer = null;
    this.entropyPanel = null;
    
    this.init();
  }

  init() {
    this.gameUI.render();
    this.setupDiceRenderer();
  }

  setupDiceRenderer() {
    // With persistent canvas in index.html, we only initialize once
    if (this.diceRenderer) return;

    const canvas = document.getElementById('dice-canvas');
    if (!canvas) return;

    this.diceRenderer = new DiceParticleRenderer('dice-canvas');
    this.diceRenderer.createDieParticles(this.gameState.dice.length);
  }

  handleThrow() {
    if (!this.diceRenderer) this.setupDiceRenderer();
    if (!this.diceRenderer) return;
    if (this.gameState.awaitingCollect) return;

    const results = this.gameState.throwDice();
    if (!results) return;

    const total = results.reduce((sum, r) => sum + r.value, 0);
    this.lastRollTotal = total;
    this.gameState.awaitingCollect = true;

    const clusterCount = Math.max(1, Math.min(12, total));

    this.diceRenderer.animateThrow(clusterCount, () => {
      this.gameUI.render();
      // Particles stay clumped in the renderer's internal state
    });
  }

  handleCollect() {
    if (!this.diceRenderer) return;
    if (!this.gameState.awaitingCollect) return;
    if (!this.gameState.rollResults || this.gameState.rollResults.length === 0) return;

    const total = this.lastRollTotal || this.gameState.rollResults.reduce((s, r) => s + r.value, 0);

    // Apply game progression (score, currency, throws remaining, phase)
    this.gameState.collectRoll();

    // Currency particles fly toward Collect button
    this._spawnCollectParticles(total);

    const finalize = () => {
      if (this.gameState.phase === 'shop') {
        this.showShop();
      } else if (this.gameState.phase === 'gameover') {
        this.gameUI.render();
      } else {
        this.gameUI.render();
        // Ensure renderer is synced with the current state (num dice)
        if (this.diceRenderer) {
           // If we added dice in a previous level, we might want to refresh, 
           // but for now we keep the particle count stable.
        } else {
          this.setupDiceRenderer();
        }
      }
    };

    // Smoothly unpack clumps back to diffuse cube, then advance UI/level
    this.diceRenderer.animateUnclump(() => {
      finalize();
    });
  }

  _spawnCollectParticles(total) {
    const count = Math.max(1, Math.min(10, total | 0)); // cap visual clutter
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    const canvas = document.getElementById('dice-canvas');
    const button = document.getElementById('btn-collect');
    if (!canvas || !button) return;

    const canvasRect = canvas.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const layer = document.createElement('div');
    layer.className = 'collect-particles-layer';
    appRoot.appendChild(layer);

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'collect-particle';

      const startX =
        canvasRect.left +
        canvasRect.width / 2 +
        (Math.random() - 0.5) * canvasRect.width * 0.3;
      const startY =
        canvasRect.top +
        canvasRect.height * 0.35 +
        (Math.random() - 0.5) * canvasRect.height * 0.2;

      const endX = buttonRect.left + buttonRect.width / 2;
      const endY = buttonRect.top + buttonRect.height / 2;

      const dx = endX - startX;
      const dy = endY - startY;

      el.style.left = `${startX}px`;
      el.style.top = `${startY}px`;
      el.style.transform = 'translate3d(0,0,0)';

      layer.appendChild(el);

      // Kick off transition on next frame
      requestAnimationFrame(() => {
        // small stagger
        const delay = 40 * i;
        el.style.transition = `transform 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${delay}ms, opacity 0.6s linear ${delay}ms`;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        el.style.opacity = '0';
      });
    }

    // Cleanup after animation
    setTimeout(() => {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 1200);
  }

  showShop() {
    this.shopUI = new ShopUI(
      this.gameState,
      () => this.handleShopPurchase(),
      () => {
        this.gameState.proceedToUpgrade();
        this.showUpgrade();
      }
    );
    this.gameUI.render();
    this.shopUI.render();
  }

  handleShopPurchase() {
    this.gameUI.render();
    this.shopUI.render();
  }

  showUpgrade() {
    this.upgradeUI = new UpgradeUI(
      this.gameState,
      () => this.handleUpgrade()
    );
    this.gameUI.render();
    this.upgradeUI.render();
  }

  handleUpgrade() {
    this.gameState.nextLevel();
    this.gameUI.render();
    this.setupDiceRenderer();
  }
}

new DiceRoguelike();