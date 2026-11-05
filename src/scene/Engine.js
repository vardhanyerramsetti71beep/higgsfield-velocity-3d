import * as THREE from 'three';
import { Lighting } from './Lighting.js';
import { InteriorView } from './InteriorView.js';
import { CarModel } from './CarModel.js';
import { Aerodynamics } from './Aerodynamics.js';

export class Engine {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060a, 0.04);

    // Camera
    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    this.cameraPos = new THREE.Vector3(3.8, 1.8, 4.5);
    this.cameraTarget = new THREE.Vector3(0, 0.4, 0.2);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);

    // Desired Camera Targets (Interpolated for butter-smooth damping)
    this.targetCameraPos = this.cameraPos.clone();
    this.targetCameraLookAt = this.cameraTarget.clone();

    // Mouse Parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isOrbiting = false;
    this.orbitAngles = { theta: 0.8, phi: 0.35, radius: 5.5 };
    this.dragStart = { x: 0, y: 0 };

    // Subsystems
    this.interiorView = new InteriorView();
    this.carModel = new CarModel(this.interiorView);
    this.aerodynamics = new Aerodynamics();
    this.lighting = new Lighting(this.scene);

    this.scene.add(this.carModel.root);
    this.scene.add(this.aerodynamics.group);

    // Camera preset definitions for the story scroll beats
    this.cameraPresets = {
      hero: {
        pos: new THREE.Vector3(3.8, 1.8, 4.5),
        target: new THREE.Vector3(0, 0.4, 0.2),
        fov: 42
      },
      aero: {
        pos: new THREE.Vector3(-4.4, 1.4, -1.8),
        target: new THREE.Vector3(0, 0.65, -0.8),
        fov: 40
      },
      xray: {
        pos: new THREE.Vector3(2.6, 3.4, 2.8),
        target: new THREE.Vector3(0, 0.35, 0),
        fov: 44
      },
      interior: {
        pos: new THREE.Vector3(-0.35, 0.82, 0.05),
        target: new THREE.Vector3(-0.35, 0.68, 1.4),
        fov: 54
      },
      wheels: {
        pos: new THREE.Vector3(-1.95, 0.5, 1.7),
        target: new THREE.Vector3(-1.0, 0.38, 1.42),
        fov: 38
      },
      configurator: {
        pos: new THREE.Vector3(3.2, 1.6, 3.8),
        target: new THREE.Vector3(0, 0.45, 0),
        fov: 42
      }
    };

    // Mode: 'scroll' or 'orbit'
    this.controlMode = 'scroll';

    // Clock
    this.clock = new THREE.Clock();

    this.setupEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (this.isOrbiting && this.controlMode === 'orbit') {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;

        this.orbitAngles.theta -= dx * 0.008;
        this.orbitAngles.phi = Math.max(0.1, Math.min(Math.PI * 0.45, this.orbitAngles.phi + dy * 0.008));
      }
    });

    this.container.addEventListener('mousedown', (e) => {
      if (this.controlMode === 'orbit') {
        this.isOrbiting = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isOrbiting = false;
    });

    this.container.addEventListener('wheel', (e) => {
      if (this.controlMode === 'orbit') {
        this.orbitAngles.radius = Math.max(2.8, Math.min(8.0, this.orbitAngles.radius + e.deltaY * 0.005));
      }
    }, { passive: true });
  }

  setCameraPreset(presetName, duration = 1.0) {
    const p = this.cameraPresets[presetName];
    if (!p) return;
    this.targetCameraPos.copy(p.pos);
    this.targetCameraLookAt.copy(p.target);
    this.camera.fov = p.fov;
    this.camera.updateProjectionMatrix();
  }

  interpolateCamera(presetA, presetB, alpha) {
    const a = this.cameraPresets[presetA];
    const b = this.cameraPresets[presetB];
    if (!a || !b) return;

    this.targetCameraPos.lerpVectors(a.pos, b.pos, alpha);
    this.targetCameraLookAt.lerpVectors(a.target, b.target, alpha);
    this.camera.fov = THREE.MathUtils.lerp(a.fov, b.fov, alpha);
    this.camera.updateProjectionMatrix();
  }

  setControlMode(mode) {
    this.controlMode = mode;
    if (mode === 'orbit') {
      this.targetCameraLookAt.set(0, 0.45, 0);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Mouse Parallax interpolation
    this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouse.targetX, 0.06);
    this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouse.targetY, 0.06);

    if (this.controlMode === 'scroll') {
      // Smooth camera dampening with gentle mouse parallax
      const parallaxX = this.mouse.x * 0.3;
      const parallaxY = -this.mouse.y * 0.2;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.targetCameraPos.x + parallaxX, delta * 3.5);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.targetCameraPos.y + parallaxY, delta * 3.5);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCameraPos.z, delta * 3.5);

      this.cameraTarget.lerp(this.targetCameraLookAt, delta * 4.0);
      this.camera.lookAt(this.cameraTarget);
    } else {
      // Orbit mode around center
      const sinPhi = Math.sin(this.orbitAngles.phi);
      const cosPhi = Math.cos(this.orbitAngles.phi);
      const sinTheta = Math.sin(this.orbitAngles.theta);
      const cosTheta = Math.cos(this.orbitAngles.theta);

      const targetX = this.orbitAngles.radius * sinPhi * sinTheta;
      const targetY = this.orbitAngles.radius * cosPhi;
      const targetZ = this.orbitAngles.radius * sinPhi * cosTheta;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, delta * 6);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, delta * 6);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, delta * 6);
      this.camera.lookAt(0, 0.45, 0);
    }

    // Update Subsystems
    this.interiorView.update(time, delta);
    this.carModel.update(time, delta, this.aerodynamics.windSpeed / 180);
    this.aerodynamics.update(delta);

    // Subtle breathing animation on car suspension
    this.carModel.root.position.y = Math.sin(time * 1.8) * 0.008;

    this.renderer.render(this.scene, this.camera);
  }
}
