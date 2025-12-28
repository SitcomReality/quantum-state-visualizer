import { UpgradeSystem } from '../game/upgrades.js';
import { RARITY_COLORS } from '../utils/constants.js';

export class UpgradeUI {
  constructor(gameState, onUpgrade) {
    this.state = gameState;
    this.onUpgrade = onUpgrade;
    this.upgradeSystem = new UpgradeSystem();
  }

  render() {
    const options = this.upgradeSystem.generateUpgradeOptions(this.state.dice);
    const container = document.getElementById('upgrade-container');
    
    container.innerHTML = `
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4 text-center">Choose an Upgrade</h2>
        <div class="grid gap-3">
          ${options.map((opt, i) => this.renderUpgradeOption(opt, i)).join('')}
        </div>
      </div>
    `;
    
    options.forEach((opt, i) => {
      document.getElementById(`upgrade-${i}`).onclick = () => {
        this.upgradeSystem.applyUpgrade(opt);
        this.onUpgrade();
      };
    });
  }

  renderUpgradeOption(option, index) {
    return `
      <div id="upgrade-${index}" class="upgrade-option" 
           style="border-color: ${RARITY_COLORS[option.rarity]}">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold">Face Upgrade</div>
            <div class="text-sm">${option.currentValue} → ${option.currentValue + option.upgradeAmount}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-success">+${option.upgradeAmount}</div>
            <div class="text-[10px]" style="color: ${RARITY_COLORS[option.rarity]}">${option.rarity}</div>
          </div>
        </div>
      </div>
    `;
  }
}