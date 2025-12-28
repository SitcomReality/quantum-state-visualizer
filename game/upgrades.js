import { GAME_CONFIG } from '../utils/constants.js';

export class UpgradeSystem {
  generateUpgradeOptions(dice) {
    const options = [];
    
    // We offer to upgrade whole dice now (Quantum Purification)
    // Create options for up to 3 different dice
    const diceIndices = dice.map((_, i) => i);
    const shuffled = diceIndices.sort(() => Math.random() - 0.5);
    
    const selectedIndices = shuffled.slice(0, 3);
    
    selectedIndices.forEach((dieIndex, i) => {
      options.push({
        type: 'quantum',
        dieIndex: dieIndex,
        die: dice[dieIndex],
        rarity: 'rare' // Quantum upgrades are powerful
      });
    });
    
    return options;
  }

  applyUpgrade(option) {
    if (option.type === 'quantum') {
      option.die.upgrade();
    }
  }
}