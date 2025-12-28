export class Die {
  constructor(sides, values, rx = 0, ry = 0, rz = 0) {
    this.sides = sides;
    this.values = values || Array.from({ length: sides }, (_, i) => i + 1);
    this.id = Math.random().toString(36).substr(2, 9);
    
    // Normalize Bloch vector
    let norm = Math.hypot(rx, ry, rz);
    if (norm > 1 + 1e-9) {
      rx /= norm; ry /= norm; rz /= norm;
    }
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
  }

  get entropy() {
    const norm = Math.hypot(this.rx, this.ry, this.rz);
    // Eigenvalues of density matrix from Bloch vector length n: (1±n)/2
    const lambda0 = 0.5 * (1 + norm);
    const lambda1 = 0.5 * (1 - norm);
    
    // Von Neumann entropy = -sum(lambda * log2(lambda))
    if (lambda0 <= 1e-9 || lambda1 <= 1e-9) return 0; // Pure state
    
    return -(lambda0 * Math.log2(lambda0) + lambda1 * Math.log2(lambda1));
  }

  roll() {
    const S = this.entropy;
    const n = this.values.length;
    const maxVal = Math.max(...this.values);
    
    // Bias towards maxVal based on entropy
    // S=1 (mixed) -> uniform. S=0 (pure) -> biased to max.
    
    // Formula from prompt:
    const pMax = 1 - S + (S / n);
    const pOther = S / n;
    
    // Distribute probability
    // Note: If multiple faces have the max value, they all get boosted.
    // We normalize afterwards to ensure sum is 1.0
    const probs = this.values.map(v => v === maxVal ? pMax : pOther);
    const totalProb = probs.reduce((a, b) => a + b, 0);
    const normalized = probs.map(p => p / totalProb);
    
    const rand = Math.random();
    let cum = 0;
    for (let i = 0; i < n; i++) {
      cum += normalized[i];
      if (rand <= cum) return this.values[i];
    }
    return this.values[n - 1];
  }

  upgrade() {
    // 1. Purify: Move Bloch vector toward (0,0,1)
    const decay = 0.8;
    this.rx *= decay;
    this.ry *= decay;
    this.rz = Math.min(1, this.rz + (1 - decay));
    
    // 2. Boost values: Multiply by 1.5x (min +1)
    this.values = this.values.map(v => Math.max(v + 1, Math.floor(v * 1.5)));
  }

  getAverageValue() {
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  clone() {
    return new Die(this.sides, [...this.values], this.rx, this.ry, this.rz);
  }
}