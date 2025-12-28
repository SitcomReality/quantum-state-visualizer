// ---- 1. Helper classes (Complex, QubitState) ----
export class Complex {
  constructor(real, imag = 0) {
    this.real = real;
    this.imag = imag;
  }
  add(o) { return new Complex(this.real + o.real, this.imag + o.imag); }
  sub(o) { return new Complex(this.real - o.real, this.imag - o.imag); }
  mul(o) {
    return new Complex(
      this.real * o.real - this.imag * o.imag,
      this.real * o.imag + this.imag * o.real
    );
  }
  mulScalar(s) { return new Complex(this.real * s, this.imag * s); }
  conj() { return new Complex(this.real, -this.imag); }
  toString(precision = 2) {
    const r = this.real.toFixed(precision);
    const i = Math.abs(this.imag).toFixed(precision);
    const sign = this.imag >= 0 ? '+' : '-';
    return `${r}${sign}${i}i`;
  }
}

// ---- 2. Fixed matrices ----
export const I2 = [[new Complex(1), new Complex(0)], [new Complex(0), new Complex(1)]];
export const sigmaX = [[new Complex(0), new Complex(1)], [new Complex(1), new Complex(0)]];
export const sigmaY = [[new Complex(0), new Complex(0, -1)], [new Complex(0, 1), new Complex(0)]];
export const sigmaZ = [[new Complex(1), new Complex(0)], [new Complex(0), new Complex(-1)]];

// ---- 3. Linear‑algebra helpers ----
export function trace(m) { return m[0][0].add(m[1][1]); }
export function matMul(A, B) {
  const R = [[new Complex(0), new Complex(0)], [new Complex(0), new Complex(0)]];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let s = new Complex(0);
      for (let k = 0; k < 2; k++) s = s.add(A[i][k].mul(B[k][j]));
      R[i][j] = s;
    }
  }
  return R;
}
export function matSquare(A) { return matMul(A, A); }

// ---- 4. Bloch → density matrix ----
export function densityMatrixFromBloch(rx, ry, rz) {
  const norm = Math.hypot(rx, ry, rz);
  let nx = rx, ny = ry, nz = rz;
  if (norm > 1 + 1e-9) {
    nx /= norm; ny /= norm; nz /= norm;
  }
  const half = new Complex(0.5);
  let ρ = [[half, new Complex(0)], [new Complex(0), half]];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      ρ[i][j] = ρ[i][j].add(sigmaX[i][j].mulScalar(nx * 0.5));
      ρ[i][j] = ρ[i][j].add(sigmaY[i][j].mulScalar(ny * 0.5));
      ρ[i][j] = ρ[i][j].add(sigmaZ[i][j].mulScalar(nz * 0.5));
    }
  }
  return ρ;
}

// ---- 5. Entropy helper ----
export function eigenvaluesFromBloch(rx, ry, rz) {
  const n = Math.hypot(rx, ry, rz);
  return [0.5 * (1 + n), 0.5 * (1 - n)];
}

export function vonNeumannEntropyFromBloch(rx, ry, rz) {
  const [λ0, λ1] = eigenvaluesFromBloch(rx, ry, rz);
  const s0 = λ0 <= 1e-12 ? 0 : λ0 * Math.log2(λ0);
  const s1 = λ1 <= 1e-12 ? 0 : λ1 * Math.log2(λ1);
  return -(s0 + s1);
}

// ---- 6. QubitState class ----
export class QubitState {
  constructor(rx, ry, rz) {
    let n = Math.hypot(rx, ry, rz);
    if (n > 1 + 1e-9) {
      rx /= n; ry /= n; rz /= n; n = 1;
    }
    this.rx = rx; this.ry = ry; this.rz = rz; this.norm = n;
  }
  densityMatrix() { return densityMatrixFromBloch(this.rx, this.ry, this.rz); }
  purity() {
    const ρ = this.densityMatrix();
    const ρ2 = matSquare(ρ);
    return trace(ρ2).real;
  }
  entropy() { return vonNeumannEntropyFromBloch(this.rx, this.ry, this.rz); }
  prob0() { const ρ = this.densityMatrix(); return ρ[0][0].real; }
  prob1() { const ρ = this.densityMatrix(); return ρ[1][1].real; }
}

export function stateFromSpherical(theta, phi) {
  return new QubitState(
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta)
  );
}

// ---- 7. Mixing function ----
export function mixDensityMatrices(a, b, p) {
  const q = 1 - p;
  return [
    [
      a[0][0].mulScalar(p).add(b[0][0].mulScalar(q)),
      a[0][1].mulScalar(p).add(b[0][1].mulScalar(q))
    ],
    [
      a[1][0].mulScalar(p).add(b[1][0].mulScalar(q)),
      a[1][1].mulScalar(p).add(b[1][1].mulScalar(q))
    ]
  ];
}