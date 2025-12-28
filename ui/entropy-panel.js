export class EntropyPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(entropy) {
    this.container.innerHTML = `
      <div class="glass p-2 min-w-[100px]">
        <div class="text-[10px] text-slate-400 text-center mb-1">System Entropy</div>
        <div class="text-lg font-bold text-center text-purple-400">${entropy.toFixed(3)}</div>
        <div class="text-[8px] text-slate-500 text-center">Avg. Disorder</div>
      </div>
    `;
  }
}