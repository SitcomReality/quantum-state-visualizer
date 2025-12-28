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
    this.setupLights();
    this.animate();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupSphere() {
    // Sphere wireframe
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x475569, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.1 
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
    const pointMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.point = new THREE.Mesh(pointGeo, pointMat);
    this.scene.add(this.point);
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
    // In Three.js standard coordinates:
    // User rx -> X
    // User ry -> Y
    // User rz -> Z
    // Note: Standard Bloch sphere has Z vertical.
    // Three.js vertical is Y. We swap Z and Y for visual mapping if needed, 
    // but usually we just let users see the coordinates as defined.
    // Let's stick to standard Physics convention where Z is UP.
    // So Z stays Z, but in Three.js Z is forward/back. 
    // Let's map Z to Three.js Y (Vertical).
    
    const dir = new THREE.Vector3(rx, rz, -ry); // Mapping for visual intuition: rz is 'up'
    const len = dir.length();
    if (len > 0) {
      this.vector.setDirection(dir.clone().normalize());
      this.vector.setLength(len, 0.1, 0.05);
      this.point.position.copy(dir);
    } else {
      this.vector.setLength(0);
      this.point.position.set(0,0,0);
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