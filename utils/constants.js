export const GAME_CONFIG = {
  INITIAL_DICE: [{ sides: 6, values: [1, 2, 3, 4, 5, 6] }],
  INITIAL_THROWS: 3,
  INITIAL_LEVEL: 1,
  INITIAL_CURRENCY: 0,
  
  LEVEL_SCALING: {
    throwsPerLevel: 3,
    minScoreBase: 10,
    minScoreIncrease: 5
  },
  
  SHOP: {
    dicePool: [
      { sides: 4, values: [1, 1, 2, 3], cost: 5, rarity: 'common' },
      { sides: 6, values: [1, 2, 2, 3, 3, 4], cost: 8, rarity: 'common' },
      { sides: 6, values: [2, 3, 4, 5, 6, 7], cost: 15, rarity: 'uncommon' },
      { sides: 8, values: [1, 2, 3, 4, 5, 6, 7, 8], cost: 20, rarity: 'uncommon' },
      { sides: 6, values: [3, 4, 5, 6, 7, 8], cost: 25, rarity: 'rare' }
    ]
  },
  
  UPGRADES: {
    common: 1,
    uncommon: 2,
    rare: 3
  }
};

export const RARITY_COLORS = {
  common: '#94a3b8',
  uncommon: '#4ade80',
  rare: '#8b5cf6',
  legendary: '#f59e0b'
};