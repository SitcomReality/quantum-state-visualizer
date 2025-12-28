export class GameUI {
  constructor(gameState, onThrow, onShopAction, onUpgradeAction) {
    this.state = gameState;
    this.onThrow = onThrow;
    this.onShopAction = onShopAction;
    this.onUpgradeAction = onUpgradeAction;
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex flex-col h-full w-full overflow-hidden">
        ${this.renderHeader()}
        <main class="flex-grow flex flex-col min-h-0 overflow-hidden">
          ${this.renderMainArea()}
        </main>
        ${this.renderBottomPanel()}
      </div>
    `;
    this.attachEventListeners();
  }

  renderHeader() {
    return `
      <div class="glass p-3 flex justify-between items-center">
        <div class="flex gap-4">
          <div class="stat-box">
            <div class="stat-label">Level</div>
            <div class="stat-value">${this.state.level}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Currency</div>
            <div class="stat-value">${this.state.currency}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Score</div>
            <div class="stat-value">${this.state.currentLevelScore}/${this.state.getMinScoreForLevel()}</div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Throws</div>
          <div class="stat-value">${this.state.throwsRemaining}</div>
        </div>
      </div>
    `;
  }

  renderMainArea() {
    if (this.state.phase === 'gameover') {
      return `
        <div class="flex-grow flex items-center justify-center h-full">
          <div class="glass p-8 text-center">
            <h2 class="text-2xl font-bold mb-4">Game Over</h2>
            <p class="mb-4">You reached level ${this.state.level}</p>
            <button id="btn-restart" class="btn-primary">Play Again</button>
          </div>
        </div>
      `;
    }
    
    if (this.state.phase === 'shop') {
      return `<div id="shop-container" class="flex-grow overflow-y-auto h-full"></div>`;
    }
    
    if (this.state.phase === 'upgrade') {
      return `<div id="upgrade-container" class="flex-grow overflow-y-auto h-full"></div>`;
    }
    
    return `
      <div class="flex-grow flex flex-col h-full">
        <!-- Ensure the dice canvas container has a measurable height so WebGL can initialize correctly -->
        <div id="dice-canvas" class="flex-grow relative" style="flex: 1 1 auto; min-height: 100px;"></div>
        <div class="p-6 text-center bg-gradient-to-t from-slate-900/50 to-transparent flex-shrink-0">
          ${this.state.rollResults.length > 0 ? `
            <div class="mb-4 transform transition-all duration-300 scale-110">
              ${this.state.rollResults.map(r => `<span class="text-3xl mx-1">${r.value}</span>`).join(' + ')}
              <div class="mt-1">
                <span class="text-sm text-slate-400">Total:</span> 
                <span class="text-4xl font-bold text-sky-400">${this.state.rollResults.reduce((a,r) => a + r.value, 0)}</span>
              </div>
            </div>
          ` : ''}
          <button id="btn-throw" class="btn-primary w-full max-w-xs py-4 text-lg" ${this.state.throwsRemaining === 0 ? 'disabled' : ''}>
            🎲 Throw Dice
          </button>
        </div>
      </div>
    `;
  }

  renderBottomPanel() {
    return `
      <div class="glass p-2">
        <div class="text-[10px] text-slate-400 text-center">
          Dice: ${this.state.dice.map(d => `${d.sides}-sided`).join(', ')}
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const throwBtn = document.getElementById('btn-throw');
    if (throwBtn) {
      throwBtn.onclick = () => this.onThrow();
    }
    
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.onclick = () => {
        this.state.reset();
        this.render();
      };
    }
  }
}