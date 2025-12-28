import { GAME_CONFIG } from '../utils/constants.js';

export class Shop {
  generateOfferings(level) {
    const pool = GAME_CONFIG.SHOP.dicePool;
    
    // Select 3 random dice from pool
    const offerings = [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      offerings.push({ ...shuffled[i] });
    }
    
    return offerings;
  }
}