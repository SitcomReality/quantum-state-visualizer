import * as THREE from 'three';

export class DiceParticleRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight * 0.5;

    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // Single particle field
    this.points = null;
    this.numParticles = 1200;

    // Per-particle simulation data
    this.basePositions = null;      // idle cube positions
    this.velocities = null;         // idle velocities
    this.clusterTargets = null;     // target positions during clump animation
    this.clusterCenters = [];       // current set of cluster centers
    this.clusterCount = 1;

    // Animation state
    this.phase = 'idle';            // 'idle' | 'rolling' | 'clumped'
    this.rollStartTime = 0;
    this.rollDuration = 1500;
    this.rollCallback = null;

    // Timekeeping
    this._lastTime = performance.now();
    this._rafId = null;
    this._onResizeBound = this.onResize.bind(this);

    this.setupLights();
    this.createDieParticles();
    this._startMainLoop();

    window.addEventListener('resize', this._onResizeBound);
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 0.8);
    point.position.set(5, 5, 5);
    this.scene.add(point);
  }

  // We no longer care about numDice for geometry; keep signature for compatibility.
  createDieParticles(_numDice = 1) {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
      this.points = null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numParticles * 3);
    const colors = new Float32Array(this.numParticles * 3);
    this.basePositions = new Float32Array(this.numParticles * 3);
    this.velocities = new Float32Array(this.numParticles * 3);
    this.clusterTargets = new Float32Array(this.numParticles * 3);

    // Initial diffuse cube
    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 3;

      // Cube in [-0.5, 0.5]^3
      const x = (Math.random() - 0.5);
      const y = (Math.random() - 0.5);
      const z = (Math.random() - 0.5);

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      this.basePositions[idx] = x;
      this.basePositions[idx + 1] = y;
      this.basePositions[idx + 2] = z;

      // Random small velocity for swirling
      this.velocities[idx] = (Math.random() - 0.5) * 0.15;
      this.velocities[idx + 1] = (Math.random() - 0.5) * 0.15;
      this.velocities[idx + 2] = (Math.random() - 0.5) * 0.15;

      // Soft blue-ish colors
      colors[idx] = 0.3 + Math.random() * 0.2;
      colors[idx + 1] = 0.6 + Math.random() * 0.3;
      colors[idx + 2] = 0.9 + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, material);

    // Scale so that the cube occupies ~75% of min viewport dimension
    const baseScale = this._computeBaseScale();
    this.points.scale.setScalar(baseScale);

    this.scene.add(this.points);
  }

  _computeBaseScale() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight * 0.5;

    const fovRad = (this.camera.fov * Math.PI) / 180;
    const worldHeight = 2 * Math.tan(fovRad / 2) * Math.abs(this.camera.position.z);
    const worldWidth = worldHeight * (width / Math.max(1, height));
    const maxWorldDim = 0.75 * Math.min(worldWidth, worldHeight);

    // Our cube is ~1 unit across; choose scale so it fits within 75% of view
    const capScale = Math.max(0.1, maxWorldDim * 0.5);
    return capScale;
  }

  // clusterCount is how many clumps we want to end up with (clamped externally)
  animateThrow(clusterCount, callback) {
    if (!this.points) return;

    this.phase = 'rolling';
    this.rollStartTime = performance.now();
    this.rollDuration = 1500;
    this.rollCallback = callback;
    this.clusterCount = Math.max(1, clusterCount | 0);

    this._computeClusterCenters();
    this._assignClusterTargets();
  }

  _computeClusterCenters() {
    this.clusterCenters = [];

    const n = this.clusterCount;
    if (n === 1) {
      this.clusterCenters.push(new THREE.Vector3(0, 0, 0));
      return;
    }

    // Arrange clusters in a horizontal line or small grid, centered
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const spacing = 0.5; // in local particle space

    const totalWidth = (cols - 1) * spacing;
    const totalHeight = (rows - 1) * spacing;

    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * spacing - totalWidth / 2;
      const y = totalHeight / 2 - row * spacing;
      const z = 0;
      this.clusterCenters.push(new THREE.Vector3(x, y, z));
    }
  }

  _assignClusterTargets() {
    // For each particle, assign to a cluster and give it a local spherical offset
    const radius = 0.12; // compact clump radius

    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 3;
      const clusterIndex = i % this.clusterCount;
      const center = this.clusterCenters[clusterIndex];

      // Random point in sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());

      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      this.clusterTargets[idx] = center.x + sx;
      this.clusterTargets[idx + 1] = center.y + sy;
      this.clusterTargets[idx + 2] = center.z + sz;
    }
  }

  _updateIdle(dt) {
    if (!this.points) return;
    const positions = this.points.geometry.attributes.position.array;

    // Particles swirl around their base cube positions
    const springStrength = 0.9;   // how strongly they stay near cube
    const maxOffset = 0.6;        // cube "radius"

    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 3;

      let x = positions[idx];
      let y = positions[idx + 1];
      let z = positions[idx + 2];

      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      let vx = this.velocities[idx];
      let vy = this.velocities[idx + 1];
      let vz = this.velocities[idx + 2];

      // Simple spring toward base position
      vx += (bx - x) * springStrength * dt;
      vy += (by - y) * springStrength * dt;
      vz += (bz - z) * springStrength * dt;

      // Add small swirling noise
      vx += (Math.random() - 0.5) * 0.05 * dt;
      vy += (Math.random() - 0.5) * 0.05 * dt;
      vz += (Math.random() - 0.5) * 0.05 * dt;

      // Integrate
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      // Soft bounds to keep diffuse cube
      const clamp = (val) => Math.max(-maxOffset, Math.min(maxOffset, val));
      x = clamp(x);
      y = clamp(y);
      z = clamp(z);

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      this.velocities[idx] = vx;
      this.velocities[idx + 1] = vy;
      this.velocities[idx + 2] = vz;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.y += 0.1 * dt;
  }

  _updateRolling(dt) {
    if (!this.points) return;
    const positions = this.points.geometry.attributes.position.array;

    const now = performance.now();
    const t = Math.min(1, (now - this.rollStartTime) / this.rollDuration);
    const ease = t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t; // smooth ease in-out

    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 3;

      const sx = this.basePositions[idx];
      const sy = this.basePositions[idx + 1];
      const sz = this.basePositions[idx + 2];

      const tx = this.clusterTargets[idx];
      const ty = this.clusterTargets[idx + 1];
      const tz = this.clusterTargets[idx + 2];

      // Interpolate from cube to cluster targets
      const x = sx + (tx - sx) * ease;
      const y = sy + (ty - sy) * ease;
      const z = sz + (tz - sz) * ease;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.y += 0.3 * dt;

    if (t >= 1) {
      // Transition to clumped idle
      this.phase = 'clumped';
      // Update base positions to new cluster layout, so they drift gently around clumps
      for (let i = 0; i < this.numParticles * 3; i++) {
        this.basePositions[i] = positions[i];
      }
      // Slightly randomize velocities for gentle motion
      for (let i = 0; i < this.numParticles * 3; i++) {
        this.velocities[i] = (Math.random() - 0.5) * 0.08;
      }

      if (this.rollCallback) {
        const cb = this.rollCallback;
        this.rollCallback = null;
        cb();
      }
    }
  }

  _updateClumped(dt) {
    if (!this.points) return;
    const positions = this.points.geometry.attributes.position.array;

    const springStrength = 0.6;
    const maxOffset = 0.18; // keep particles near clump centers

    for (let i = 0; i < this.numParticles; i++) {
      const idx = i * 3;

      let x = positions[idx];
      let y = positions[idx + 1];
      let z = positions[idx + 2];

      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      let vx = this.velocities[idx];
      let vy = this.velocities[idx + 1];
      let vz = this.velocities[idx + 2];

      // Gentle spring around clump center
      vx += (bx - x) * springStrength * dt;
      vy += (by - y) * springStrength * dt;
      vz += (bz - z) * springStrength * dt;

      // Small jitter
      vx += (Math.random() - 0.5) * 0.03 * dt;
      vy += (Math.random() - 0.5) * 0.03 * dt;
      vz += (Math.random() - 0.5) * 0.03 * dt;

      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      const clamp = (val, base) =>
        Math.max(base - maxOffset, Math.min(base + maxOffset, val));

      x = clamp(x, bx);
      y = clamp(y, by);
      z = clamp(z, bz);

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      this.velocities[idx] = vx;
      this.velocities[idx + 1] = vy;
      this.velocities[idx + 2] = vz;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.y += 0.15 * dt;
  }

  _updateSimulation(dt) {
    if (!this.points) return;

    if (this.phase === 'idle') {
      this._updateIdle(dt);
    } else if (this.phase === 'rolling') {
      this._updateRolling(dt);
    } else if (this.phase === 'clumped') {
      this._updateClumped(dt);
    }
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight * 0.5;

    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.points) {
      const scale = this._computeBaseScale();
      this.points.scale.setScalar(scale);
    }
  }

  _startMainLoop() {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);

      const now = performance.now();
      const dt = Math.min(0.05, (now - this._lastTime) / 1000);
      this._lastTime = now;

      this._updateSimulation(dt);

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  dispose() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    window.removeEventListener('resize', this._onResizeBound);

    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
      this.points = null;
    }

    if (this.renderer) {
      try {
        this.renderer.forceContextLoss();
      } catch (e) {}
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}