import * as THREE from 'three';

export class DiceParticleRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.diceParticles = [];
    this.isAnimating = false;

    // internal handles for proper cleanup
    this._rafId = null;
    this._onResizeBound = this.onResize.bind(this);

    this.setupLights();
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

  createDieParticles(numDice) {
    // Clear existing
    this.diceParticles.forEach(p => {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) {
        if (p.material.map) p.material.map.dispose();
        p.material.dispose();
      }
    });
    this.diceParticles = [];

    // Calculate dynamic scaling and spacing based on dice count
    const baseScale = numDice === 1 ? 4.5 : Math.max(1.8, 5 / Math.sqrt(numDice));
    const spacing = numDice === 1 ? 0 : baseScale * 0.8;
    const startX = -(numDice - 1) * spacing / 2;

    for (let i = 0; i < numDice; i++) {
      const geometry = new THREE.BufferGeometry();
      const numParticles = numDice === 1 ? 800 : 300; // More particles for the large single die
      const positions = new Float32Array(numParticles * 3);
      const colors = new Float32Array(numParticles * 3);

      for (let j = 0; j < numParticles; j++) {
        // Uniform distribution in a cube
        positions[j * 3] = (Math.random() - 0.5);
        positions[j * 3 + 1] = (Math.random() - 0.5);
        positions[j * 3 + 2] = (Math.random() - 0.5);

        colors[j * 3] = 0.3 + Math.random() * 0.2;
        colors[j * 3 + 1] = 0.6 + Math.random() * 0.3;
        colors[j * 3 + 2] = 0.9 + Math.random() * 0.1;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: numDice === 1 ? 0.04 : 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      particles.scale.setScalar(baseScale);
      particles.position.x = startX + i * spacing;
      particles.userData = {
        baseScale: baseScale,
        rotationSpeed: 0.08 + Math.random() * 0.05
      };

      this.scene.add(particles);
      this.diceParticles.push(particles);
    }
  }

  animateThrow(callback) {
    this.isAnimating = true;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.diceParticles.forEach(p => {
        const base = p.userData.baseScale;
        // Spin wildly
        p.rotation.x += p.userData.rotationSpeed * (2 - progress);
        p.rotation.y += p.userData.rotationSpeed * (2 - progress);

        // Expand and contract around the base scale
        const scaleMod = 1 + Math.sin(progress * Math.PI * 4) * 0.2 * (1 - progress);
        p.scale.setScalar(base * scaleMod);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        if (callback) callback();
      }
    };

    animate();
  }

  showResults(results) {
    // Display result numbers on particles (kept for possible future use)
    results.forEach((result, i) => {
      if (i < this.diceParticles.length) {
        const particles = this.diceParticles[i];
        particles.userData.displayValue = result.value;
      }
    });
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  _startMainLoop() {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  dispose() {
    // Stop RAF
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // Remove resize listener
    window.removeEventListener('resize', this._onResizeBound);

    // Dispose particles
    this.diceParticles.forEach(p => {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) {
        if (p.material.map) p.material.map.dispose();
        p.material.dispose();
      }
    });
    this.diceParticles = [];

    // Dispose renderer and remove DOM element
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

    // Clean up scene references
    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}