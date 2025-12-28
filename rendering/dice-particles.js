import * as THREE from 'three';

export class DiceParticleRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.diceParticles = [];
    this.isAnimating = false;
    
    this.setupLights();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
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
    this.diceParticles.forEach(p => this.scene.remove(p));
    this.diceParticles = [];

    const spacing = 1.5;
    const startX = -(numDice - 1) * spacing / 2;

    for (let i = 0; i < numDice; i++) {
      const geometry = new THREE.BufferGeometry();
      const numParticles = 200;
      const positions = new Float32Array(numParticles * 3);
      const colors = new Float32Array(numParticles * 3);

      for (let j = 0; j < numParticles; j++) {
        positions[j * 3] = (Math.random() - 0.5) * 0.5;
        positions[j * 3 + 1] = (Math.random() - 0.5) * 0.5;
        positions[j * 3 + 2] = (Math.random() - 0.5) * 0.5;
        
        colors[j * 3] = 0.2 + Math.random() * 0.3;
        colors[j * 3 + 1] = 0.5 + Math.random() * 0.3;
        colors[j * 3 + 2] = 0.8 + Math.random() * 0.2;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      particles.position.x = startX + i * spacing;
      particles.userData = { 
        targetRotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotationSpeed: 0.1
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
        // Spin wildly
        p.rotation.x += p.userData.rotationSpeed * (1 - progress);
        p.rotation.y += p.userData.rotationSpeed * (1 - progress);
        
        // Expand and contract
        const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.3 * (1 - progress);
        p.scale.setScalar(scale);
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
    // Display result numbers on particles
    results.forEach((result, i) => {
      if (i < this.diceParticles.length) {
        const particles = this.diceParticles[i];
        particles.userData.displayValue = result.value;
      }
    });
  }

  onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}