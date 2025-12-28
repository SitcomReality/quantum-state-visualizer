import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class BlochSphereRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.camera.position.set(2.5, 2.5, 4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.setupSphere();
    this.setupCloud();
    this.setupLights();
    this.animate();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupSphere() {
    // Sphere wireframe
    const geometry = new THREE.SphereGeometry(1, 24, 24);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x475569, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.05 
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    // Axes
    const axesHelper = new THREE.AxesHelper(1.2);
    this.scene.add(axesHelper);

    // Labels for axes
    this.createLabel('X', new THREE.Vector3(1.3, 0, 0), '#f87171');
    this.createLabel('Y', new THREE.Vector3(0, 1.3, 0), '#4ade80');
    this.createLabel('Z', new THREE.Vector3(0, 0, 1.3), '#60a5fa');
    this.createLabel('|0⟩', new THREE.Vector3(0, 0, 1.05), '#fff');
    this.createLabel('|1⟩', new THREE.Vector3(0, 0, -1.05), '#fff');

    // Vector
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), 
      new THREE.Vector3(0, 0, 0), 
      1, 
      0x38bdf8,
      0.1,
      0.05
    );
    this.vector = arrowHelper;
    this.scene.add(arrowHelper);

    // State point
    const pointGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const pointMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.point = new THREE.Mesh(pointGeo, pointMat);
    this.scene.add(this.point);
  }

  setupCloud() {
    const numPoints = 2000;
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);
    const sizes = new Float32Array(numPoints);

    // Fibonacci Sphere for uniform distribution
    const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.8;
      sizes[i] = 1.0;
    }

    this.cloudGeometry = new THREE.BufferGeometry();
    this.cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.cloudGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.cloudGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.cloud = new THREE.Points(this.cloudGeometry, material);
    this.scene.add(this.cloud);
  }

  createLabel(text, pos, color) {
    const div = document.createElement('div');
    div.className = 'absolute text-[10px] font-bold pointer-events-none';
    div.style.color = color;
    div.textContent = text;
    document.getElementById('label-overlay').appendChild(div);
    
    // Store label data to update in animation loop
    if (!this.labels) this.labels = [];
    this.labels.push({ element: div, position: pos });
  }

  updateLabels() {
    if (!this.labels) return;
    this.labels.forEach(l => {
      const vector = l.position.clone().project(this.camera);
      const x = (vector.x + 1) / 2 * this.container.clientWidth;
      const y = -(vector.y - 1) / 2 * this.container.clientHeight;
      l.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    });
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);
  }

  updateVector(rx, ry, rz) {
    // Mapping: rz is vertical (Y in Three.js), rx is X, ry is -Z
    const dir = new THREE.Vector3(rx, rz, -ry); 
    const len = dir.length();
    
    if (len > 0.001) {
      this.vector.setDirection(dir.clone().normalize());
      this.vector.setLength(len, 0.1, 0.05);
      this.point.position.copy(dir);
    } else {
      this.vector.setLength(0);
      this.point.position.set(0, 0, 0);
    }

    // Update Probability Cloud
    if (this.cloudGeometry) {
      const colors = this.cloudGeometry.attributes.color.array;
      const positions = this.cloudGeometry.attributes.position.array;
      
      // The probability of measuring state in direction 'n' given Bloch vector 'r'
      // P = (1 + r · n) / 2
      for (let i = 0; i < colors.length / 3; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];

        // Dot product with the state vector
        const dot = px * dir.x + py * dir.y + pz * dir.z;
        const prob = (1 + dot) / 2;
        
        // Map probability to color intensity
        // Use a stronger non-linear scaling so low probabilities fall off much faster
        const intensity = Math.pow(prob, 3.5);
        
        // Make base colors darker and amplify the intensity contribution
        // This causes low-probability points to become much less visible (faded)
        colors[i * 3]     = 0.02 + intensity * 0.25;  // R
        colors[i * 3 + 1] = 0.05 + intensity * 0.60;  // G
        colors[i * 3 + 2] = 0.08 + intensity * 1.20;  // B
      }
      this.cloudGeometry.attributes.color.needsUpdate = true;
    }
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  }
}