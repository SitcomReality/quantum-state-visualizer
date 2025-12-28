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
    const die = option.die;
    const currentS = die.entropy;
    
    // Simulate upgrade for preview
    const clone = die.clone();
    clone.upgrade();
    const newS = clone.entropy;
    const currentAvg = Math.round(die.values.reduce((a,b)=>a+b,0)/die.values.length);
    const newAvg = Math.round(clone.values.reduce((a,b)=>a+b,0)/clone.values.length);

    return `
      <div id="upgrade-${index}" class="upgrade-option" 
           style="border-color: ${RARITY_COLORS[option.rarity]}">
        <div class="flex justify-between items-center w-full">
          <div class="flex-grow">
            <div class="font-bold text-lg mb-1">Quantum Purification</div>
            <div class="text-xs text-slate-400 mb-2">${die.sides}-sided Die</div>
            
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-slate-900/50 p-2 rounded">
                <div class="text-[10px] text-slate-500 uppercase">Entropy</div>
                <div class="font-mono text-purple-400">
                  ${currentS.toFixed(2)} <span class="text-white">→</span> ${newS.toFixed(2)}
                </div>
              </div>
              <div class="bg-slate-900/50 p-2 rounded">
                <div class="text-[10px] text-slate-500 uppercase">Avg Value</div>
                <div class="font-mono text-green-400">
                  ~${currentAvg} <span class="text-white">→</span> ~${newAvg}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}