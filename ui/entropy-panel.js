export class EntropyPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(entropy) {
    this.container.innerHTML = `
      <div class="glass p-2">
        <div class="text-[10px] text-slate-400 text-center mb-1">Von Neumann Entropy</div>
        <div class="text-lg font-bold text-center text-purple-400">${entropy.toFixed(3)}</div>
      </div>
    `;
  }
}