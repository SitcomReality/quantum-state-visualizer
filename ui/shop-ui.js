import { Shop } from '../game/shop.js';
import { RARITY_COLORS } from '../utils/constants.js';

export class ShopUI {
  constructor(gameState, onPurchase, onSkip) {
    this.state = gameState;
    this.onPurchase = onPurchase;
    this.onSkip = onSkip;
    this.shop = new Shop();
  }

  render() {
    const offerings = this.shop.generateOfferings(this.state.level);
    const container = document.getElementById('shop-container');
    
    container.innerHTML = `
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4 text-center">Shop</h2>
        <div class="grid gap-3 mb-4">
          ${offerings.map((item, i) => this.renderShopItem(item, i)).join('')}
        </div>
        <div class="text-center">
          <button id="btn-skip-shop" class="btn-secondary">Skip →</button>
        </div>
      </div>
    `;
    
    offerings.forEach((item, i) => {
      const btn = document.getElementById(`shop-item-${i}`);
      if (btn) {
        btn.onclick = () => {
          if (this.state.buyDie(item, item.cost)) {
            this.onPurchase();
          }
        };
      }
    });
    
    document.getElementById('btn-skip-shop').onclick = () => this.onSkip();
  }

  renderShopItem(item, index) {
    const canAfford = this.state.currency >= item.cost;
    return `
      <div id="shop-item-${index}" class="shop-item ${!canAfford ? 'disabled' : ''}" 
           style="border-color: ${RARITY_COLORS[item.rarity]}">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold">${item.sides}-sided Die</div>
            <div class="text-xs text-slate-400">${item.values.join(', ')}</div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold">${item.cost}</div>
            <div class="text-[10px] text-slate-400">${item.rarity}</div>
          </div>
        </div>
      </div>
    `;
  }
}