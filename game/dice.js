export class Die {
  constructor(sides, values) {
    this.sides = sides;
    this.values = values || Array.from({ length: sides }, (_, i) => i + 1);
    this.id = Math.random().toString(36).substr(2, 9);
  }

  roll(entropy = 0) {
    // For now, standard random roll
    // TODO: Integrate entropy to bias the roll
    const index = Math.floor(Math.random() * this.values.length);
    return this.values[index];
  }

  upgradeFace(faceIndex, amount) {
    if (faceIndex >= 0 && faceIndex < this.values.length) {
      this.values[faceIndex] = Math.min(10, this.values[faceIndex] + amount);
    }
  }

  getAverageValue() {
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  clone() {
    return new Die(this.sides, [...this.values]);
  }
}