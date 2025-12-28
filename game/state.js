import { Die } from './dice.js';
import { GAME_CONFIG } from '../utils/constants.js';

export class GameState {
  constructor() {
    this.level = GAME_CONFIG.INITIAL_LEVEL;
    this.currency = GAME_CONFIG.INITIAL_CURRENCY;
    this.dice = GAME_CONFIG.INITIAL_DICE.map(d => new Die(d.sides, d.values));
    this.throwsRemaining = GAME_CONFIG.INITIAL_THROWS;
    this.currentLevelScore = 0;
    this.phase = 'playing'; // 'playing', 'shop', 'upgrade', 'gameover'
    this.rollResults = [];
    // UI-level flag: after a roll resolves visually, we wait for player to Collect
    this.awaitingCollect = false;
  }

  getMinScoreForLevel() {
    // Exponential scaling to match dice growth
    const base = GAME_CONFIG.LEVEL_SCALING.minScoreBase;
    const growth = GAME_CONFIG.LEVEL_SCALING.growthFactor;
    return Math.floor(base * Math.pow(growth, this.level - 1));
  }

  get entropy() {
    if (this.dice.length === 0) return 0;
    return this.dice.reduce((sum, d) => sum + d.entropy, 0) / this.dice.length;
  }

  throwDice() {
    if (this.throwsRemaining <= 0 || this.phase !== 'playing') return null;
    
    const results = this.dice.map(die => ({
      die: die,
      value: die.roll()
    }));
    
    // Do not immediately apply score/currency or advance level;
    // this is now handled by collectRoll() after the player presses Collect.
    this.rollResults = results;
    return results;
  }

  collectRoll() {
    if (!this.rollResults || this.rollResults.length === 0 || this.phase !== 'playing') {
      return;
    }

    const sum = this.rollResults.reduce((acc, r) => acc + r.value, 0);
    this.currentLevelScore += sum;
    this.currency += sum;
    this.throwsRemaining--;

    this.awaitingCollect = false;

    if (this.throwsRemaining === 0) {
      this.endLevel();
    }
  }

  endLevel() {
    if (this.currentLevelScore >= this.getMinScoreForLevel()) {
      this.phase = 'shop';
    } else {
      this.phase = 'gameover';
    }
  }

  proceedToUpgrade() {
    this.phase = 'upgrade';
  }

  nextLevel() {
    this.level++;
    this.currentLevelScore = 0;
    this.throwsRemaining = GAME_CONFIG.LEVEL_SCALING.throwsPerLevel;
    this.phase = 'playing';
    this.rollResults = [];
  }

  buyDie(dieTemplate, cost) {
    if (this.currency >= cost) {
      this.currency -= cost;
      this.dice.push(new Die(dieTemplate.sides, [...dieTemplate.values]));
      return true;
    }
    return false;
  }

  reset() {
    this.level = GAME_CONFIG.INITIAL_LEVEL;
    this.currency = GAME_CONFIG.INITIAL_CURRENCY;
    this.dice = GAME_CONFIG.INITIAL_DICE.map(d => new Die(d.sides, d.values));
    this.throwsRemaining = GAME_CONFIG.INITIAL_THROWS;
    this.currentLevelScore = 0;
    this.phase = 'playing';
    this.rollResults = [];
  }
}