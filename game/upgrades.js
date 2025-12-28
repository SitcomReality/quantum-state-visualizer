import { GAME_CONFIG } from '../utils/constants.js';

export class UpgradeSystem {
  generateUpgradeOptions(dice) {
    const options = [];
    const allFaces = [];
    
    // Collect all faces from all dice
    dice.forEach((die, dieIndex) => {
      die.values.forEach((value, faceIndex) => {
        allFaces.push({ dieIndex, die, faceIndex, currentValue: value });
      });
    });
    
    // Shuffle and pick 3
    const shuffled = allFaces.sort(() => Math.random() - 0.5);
    const rarities = ['common', 'uncommon', 'rare'];
    
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      const rarity = rarities[Math.min(i, rarities.length - 1)];
      options.push({
        ...shuffled[i],
        upgradeAmount: GAME_CONFIG.UPGRADES[rarity],
        rarity
      });
    }
    
    return options;
  }

  applyUpgrade(option) {
    option.die.upgradeFace(option.faceIndex, option.upgradeAmount);
  }
}