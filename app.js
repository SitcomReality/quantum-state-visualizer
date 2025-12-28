import { GameState } from './game/state.js';
import { GameUI } from './ui/game-ui.js';
import { ShopUI } from './ui/shop-ui.js';
import { UpgradeUI } from './ui/upgrade-ui.js';
import { EntropyPanel } from './ui/entropy-panel.js';
import { DiceParticleRenderer } from './rendering/dice-particles.js';

class DiceRoguelike {
  constructor() {
    this.gameState = new GameState();
    this.gameUI = new GameUI(
      this.gameState,
      () => this.handleThrow(),
      () => this.handleShopPurchase(),
      () => this.handleUpgrade()
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
    const canvas = document.getElementById('dice-canvas');

    // If there's an existing renderer, dispose it because the DOM node may have been replaced
    if (this.diceRenderer) {
      try { this.diceRenderer.dispose(); } catch (e) { /* ignore */ }
      this.diceRenderer = null;
    }

    if (canvas) {
      this.diceRenderer = new DiceParticleRenderer('dice-canvas');
      this.diceRenderer.createDieParticles(this.gameState.dice.length);
    }
  }

  handleThrow() {
    if (!this.diceRenderer) return;

    // Perform the roll first so we know the outcome for clustering
    const results = this.gameState.throwDice();
    if (!results) return;

    const total = results.reduce((sum, r) => sum + r.value, 0);
    // Clamp number of clusters to keep visuals readable
    const clusterCount = Math.max(1, Math.min(8, total));

    this.diceRenderer.animateThrow(clusterCount, () => {
      this.gameUI.render();

      if (this.gameState.phase === 'shop') {
        this.showShop();
      } else if (this.gameState.phase === 'gameover') {
        this.gameUI.render();
      } else {
        // After the roll, keep using the same renderer (already in clumped state)
        // but we still recreate geometry if dice count changed significantly.
        this.setupDiceRenderer();
      }
    });
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