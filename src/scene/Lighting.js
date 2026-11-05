import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.initLights();
    this.initFloor();
  }

  initLights() {
    // 1. Ambient Light
    this.ambient = new THREE.AmbientLight(0x0a111c, 1.2);
    this.scene.add(this.ambient);

    // 2. Overhead Key Studio Soft Spotlight
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    this.keyLight.position.set(4, 8, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 25;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.camera.left = -4;
    this.keyLight.shadow.camera.right = 4;
    this.keyLight.shadow.camera.top = 4;
    this.keyLight.shadow.camera.bottom = -4;
    this.scene.add(this.keyLight);

    // 3. Cybernetic Cyan Rim Light (Accentuates aero body silhouette)
    this.rimLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
    this.rimLight.position.set(-6, 3, -5);
    this.scene.add(this.rimLight);

    // 4. Warm Magenta/Amber Counter Rim Light
    this.counterLight = new THREE.DirectionalLight(0xff0077, 1.8);
    this.counterLight.position.set(5, 2, -6);
    this.scene.add(this.counterLight);

    // 5. Front Fill Light
    this.frontFill = new THREE.PointLight(0xddeeff, 1.5, 12);
    this.frontFill.position.set(0, 1.5, 5.5);
    this.scene.add(this.frontFill);

    // 6. Under-Glow Ground Neon
    this.underGlow = new THREE.PointLight(0x00f0ff, 2.0, 4);
    this.underGlow.position.set(0, 0.1, 0);
    this.scene.add(this.underGlow);
  }

  initFloor() {
    // Reflective Studio Floor with radial falloff
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.25,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle holographic circular pedestal under the car
    const ringGeo = new THREE.RingGeometry(2.4, 2.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);

    const outerRingGeo = new THREE.RingGeometry(3.6, 3.65, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.004;
    this.scene.add(outerRing);
  }

  setUnderGlowColor(hex) {
    this.underGlow.color.set(hex);
  }
}
