import { QubitState, Complex } from './quantum.js';
import { BlochSphereRenderer } from './bloch-sphere.js';

class App {
  constructor() {
    this.renderer = new BlochSphereRenderer('canvas-container');
    this.state = new QubitState(0, 0, 1);
    this.audioCtx = null;
    this.clickSound = null;
    
    this.initUI();
    this.update();
  }

  async playTick() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const res = await fetch('/click.mp3');
      const arrayBuffer = await res.arrayBuffer();
      this.clickSound = await this.audioCtx.decodeAudioData(arrayBuffer);
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.clickSound;
    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.1;
    source.connect(gain);
    gain.connect(this.audioCtx.destination);
    source.start(0);
  }

  initUI() {
    const sliders = {
      rx: document.getElementById('slider-rx'),
      ry: document.getElementById('slider-ry'),
      rz: document.getElementById('slider-rz')
    };

    const updateFromSliders = () => {
      const rx = parseFloat(sliders.rx.value);
      const ry = parseFloat(sliders.ry.value);
      const rz = parseFloat(sliders.rz.value);
      
      // Ensure norm <= 1
      let n = Math.hypot(rx, ry, rz);
      if (n > 1) {
        // We could clamp, but it's annoying for UX. 
        // Let's just create the state and let the class handle normalization logic.
        this.state = new QubitState(rx, ry, rz);
      } else {
        this.state = new QubitState(rx, ry, rz);
      }
      this.update();
    };

    Object.values(sliders).forEach(s => s.addEventListener('input', () => {
      updateFromSliders();
      this.playTick();
    }));

    // Preset Buttons
    document.getElementById('btn-zero').onclick = () => this.setPreset(0, 0, 1);
    document.getElementById('btn-one').onclick = () => this.setPreset(0, 0, -1);
    document.getElementById('btn-plus').onclick = () => this.setPreset(1, 0, 0);
    document.getElementById('btn-mixed').onclick = () => this.setPreset(0, 0, 0);
  }

  setPreset(x, y, z) {
    document.getElementById('slider-rx').value = x;
    document.getElementById('slider-ry').value = y;
    document.getElementById('slider-rz').value = z;
    this.state = new QubitState(x, y, z);
    this.playTick();
    this.update();
  }

  update() {
    // 1. Update Visuals
    this.renderer.updateVector(this.state.rx, this.state.ry, this.state.rz);

    // 2. Update Stats
    document.getElementById('stat-entropy').textContent = this.state.entropy().toFixed(3);
    document.getElementById('stat-purity').textContent = this.state.purity().toFixed(3);
    
    document.getElementById('val-rx').textContent = this.state.rx.toFixed(2);
    document.getElementById('val-ry').textContent = this.state.ry.toFixed(2);
    document.getElementById('val-rz').textContent = this.state.rz.toFixed(2);

    // 3. Update Probabilities
    const p0 = this.state.prob0();
    const p1 = this.state.prob1();
    document.getElementById('val-p0').textContent = (p0 * 100).toFixed(1) + '%';
    document.getElementById('val-p1').textContent = (p1 * 100).toFixed(1) + '%';
    document.getElementById('bar-p0').style.width = (p0 * 100) + '%';
    document.getElementById('bar-p1').style.width = (p1 * 100) + '%';

    // 4. Update Matrix
    const rho = this.state.densityMatrix();
    this.updateMatrixCell('m00', rho[0][0]);
    this.updateMatrixCell('m01', rho[0][1]);
    this.updateMatrixCell('m10', rho[1][0]);
    this.updateMatrixCell('m11', rho[1][1]);
  }

  updateMatrixCell(id, complex) {
    const el = document.getElementById(id);
    const r = complex.real.toFixed(2);
    const i = complex.imag.toFixed(2);
    
    // Colorize based on values
    const mag = Math.sqrt(r*r + i*i);
    const alpha = 0.2 + mag * 0.6;
    el.style.backgroundColor = `rgba(56, 189, 248, ${alpha})`;
    
    el.innerHTML = `
      <span class="font-bold">${r}</span>
      <span class="opacity-60 text-[8px]">${i}i</span>
    `;
  }
}

// Start the application
new App();