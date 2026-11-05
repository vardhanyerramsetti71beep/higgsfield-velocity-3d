import * as THREE from 'three';

export class CarModel {
  constructor(interiorView) {
    this.interiorView = interiorView;
    this.root = new THREE.Group();
    // Default model: Lamborghini Aventador SVJ (from user reference images)
    this.currentModelType = 'lamborghini_aventador';
    this.currentColor = 0x111317; // Nero base
    this.currentWheelType = 'lambo_leirion';
    this.currentCaliperColor = 0xff002b; // Rosso Corsa Red
    this.isXRayMode = false;

    // Sub-groups
    this.bodyGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.wheelGroup = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.aeroGroup = new THREE.Group();

    this.root.add(this.bodyGroup);
    this.root.add(this.interiorGroup);
    this.root.add(this.wheelGroup);
    this.root.add(this.chassisGroup);
    this.root.add(this.aeroGroup);

    this.activeWing = null;
    this.wheels = [];

    this.initMaterials();
    this.buildCurrentCar();
  }

  initMaterials() {
    this.paintMat = new THREE.MeshPhysicalMaterial({
      color: this.currentColor,
      metalness: 0.75,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95
    });

    this.accentPaintMat = new THREE.MeshPhysicalMaterial({
      color: 0xee1122, // Rosso Corsa
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.08
    });

    this.carbonMat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      metalness: 0.6,
      roughness: 0.35
    });

    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a101d,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.45,
      ior: 1.52
    });

    this.lightHeadMat = new THREE.MeshStandardMaterial({
      color: 0xeef8ff,
      emissive: 0xccf0ff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });

    this.lightTailMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0022,
      emissiveIntensity: 4.0,
      roughness: 0.1
    });

    this.caliperMat = new THREE.MeshStandardMaterial({
      color: this.currentCaliperColor,
      metalness: 0.8,
      roughness: 0.2
    });

    this.rotorMat = new THREE.MeshStandardMaterial({
      color: 0x333840,
      metalness: 0.92,
      roughness: 0.25
    });

    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      metalness: 0.9,
      roughness: 0.2
    });

    this.tireMat = new THREE.MeshStandardMaterial({
      color: 0x141517,
      metalness: 0.05,
      roughness: 0.85
    });

    this.alcantaraMat = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      roughness: 0.92,
      metalness: 0.05
    });

    this.leatherLightMat = new THREE.MeshStandardMaterial({
      color: 0xeeece8,
      roughness: 0.65,
      metalness: 0.1
    });

    this.xRayBoneMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    this.batteryMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x008855,
      emissiveIntensity: 1.2,
      metalness: 0.7,
      roughness: 0.3
    });
  }

  clearGroup(g) {
    while (g.children.length > 0) {
      const obj = g.children[0];
      if (obj.geometry) obj.geometry.dispose();
      g.remove(obj);
    }
  }

  buildCurrentCar() {
    this.clearGroup(this.bodyGroup);
    this.clearGroup(this.interiorGroup);
    this.clearGroup(this.wheelGroup);
    this.clearGroup(this.chassisGroup);
    this.clearGroup(this.aeroGroup);
    this.wheels = [];

    const m = this.currentModelType;

    // Route to exact redesigned vehicle based on reference photos
    if (m === 'lamborghini_aventador' || m === 'apex_gt') {
      this.buildLamborghiniAventador();
    } else if (m === 'porsche_taycan') {
      this.buildPorscheTaycan();
    } else if (m === 'aston_martin_dbx') {
      this.buildAstonMartinDBX();
    } else if (m === 'jaguar_ftype_roadster') {
      this.buildJaguarFTypeRoadster();
    } else if (m === 'rolls_royce_phantom' || m === 'spectre_gt') {
      this.buildRollsRoycePhantom();
    } else if (m === 'mercedes_s_class' || m === 'mach_iv') {
      this.buildMercedesSClass();
    } else if (m === 'toyota_tundra' || m === 'cyber_suv') {
      this.buildToyotaTundra();
    } else {
      this.buildLamborghiniAventador();
    }

    this.buildInterior();
    this.buildWheels();
    this.buildChassis();
    this.setXRay(this.isXRayMode);
  }

  // =========================================================================
  // MODEL 1: LAMBORGHINI AVENTADOR SVJ (Reference Images 3 & 4)
  // Low wedge nose, angular Y-intakes, Nero & Rosso Corsa livery, active wing.
  // =========================================================================
  buildLamborghiniAventador() {
    const bodyGeo = new THREE.BoxGeometry(1.88, 0.32, 4.4, 6, 2, 8);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 0.6) {
        pos.setY(i, y - (z - 0.6) * 0.14);
        pos.setX(i, pos.getX(i) * (1.0 - (z - 0.6) * 0.2));
      }
      if (z < -0.8) {
        pos.setY(i, y + (-0.8 - z) * 0.08);
      }
    }
    bodyGeo.computeVertexNormals();

    const lamboPaint = new THREE.MeshPhysicalMaterial({
      color: 0x111317,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, lamboPaint);
    bodyMesh.position.y = 0.40;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Red geometric racing livery (matching photo)
    const liveryMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 1.8), this.accentPaintMat);
    liveryMesh.position.set(0, 0.58, 0.4);
    this.bodyGroup.add(liveryMesh);

    [-0.82, 0.82].forEach((x) => {
      const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.4), this.accentPaintMat);
      sideStripe.position.set(x, 0.48, -0.2);
      this.bodyGroup.add(sideStripe);
    });

    // Splitter & canards
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.04, 0.9), this.carbonMat);
    splitter.position.set(0, 0.16, 2.18);
    this.bodyGroup.add(splitter);

    [-0.5, 0.5].forEach((x) => {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2), this.carbonMat);
      intake.position.set(x, 0.32, 2.12);
      intake.rotation.y = x < 0 ? 0.2 : -0.2;
      this.bodyGroup.add(intake);
    });

    [-0.65, 0.65].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.3), this.lightHeadMat);
      head.position.set(x, 0.48, 1.95);
      head.rotation.y = x < 0 ? 0.42 : -0.42;
      head.rotation.x = -0.2;
      this.bodyGroup.add(head);
    });

    const canopyGeo = new THREE.SphereGeometry(0.82, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    canopyGeo.scale(0.92, 0.46, 1.6);
    const canopy = new THREE.Mesh(canopyGeo, this.glassMat);
    canopy.position.set(0, 0.58, 0.05);
    this.bodyGroup.add(canopy);

    // Side air intakes
    [-0.92, 0.92].forEach((x) => {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.75), this.carbonMat);
      scoop.position.set(x, 0.48, -0.55);
      this.bodyGroup.add(scoop);
    });

    // Active SVJ Wing
    const wingGroup = new THREE.Group();
    wingGroup.position.set(0, 0.95, -2.12);
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.035, 0.36), this.carbonMat);
    wingGroup.add(wingBlade);
    [-0.98, 0.98].forEach((x) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.42), this.carbonMat);
      plate.position.set(x, 0.03, 0);
      wingGroup.add(plate);
    });
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.28), this.carbonMat);
    pylon.position.set(0, -0.16, -0.05);
    wingGroup.add(pylon);
    this.activeWing = wingGroup;
    this.aeroGroup.add(wingGroup);

    // Dual high center exhausts
    [-0.12, 0.12].forEach((x) => {
      const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.95, roughness: 0.2 })
      );
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(x, 0.52, -2.24);
      this.bodyGroup.add(exhaust);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 0.06), this.lightTailMat);
    tail.position.set(0, 0.58, -2.22);
    this.bodyGroup.add(tail);
  }

  // =========================================================================
  // MODEL 2: PORSCHE TAYCAN TURBO S (Reference Image 9)
  // Carmine Red, 4-point matrix lights in vertical air curtains ("tear ducts"),
  // low sloping bonnet between raised wings, continuous rear lightbar.
  // =========================================================================
  buildPorscheTaycan() {
    const bodyGeo = new THREE.BoxGeometry(1.92, 0.42, 4.8, 6, 2, 8);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 0.8) {
        pos.setY(i, y - (z - 0.8) * 0.11);
        pos.setX(i, pos.getX(i) * 0.91);
      }
      if (z < -0.8) {
        pos.setY(i, y - (-0.8 - z) * 0.07);
      }
    }
    bodyGeo.computeVertexNormals();

    const carmineRed = new THREE.MeshPhysicalMaterial({
      color: 0xbb1122, // Porsche Carmine Red
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, carmineRed);
    bodyMesh.position.y = 0.46;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Front raised fender shoulders
    [-0.78, 0.78].forEach((x) => {
      const fender = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 1.4), carmineRed);
      fender.position.set(x, 0.62, 1.4);
      this.bodyGroup.add(fender);
    });

    // 4-Point LED Matrix Headlights inside Vertical Air Curtains ("Tear Ducts")
    [-0.75, 0.75].forEach((x) => {
      // Vertical black air curtain housing
      const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.14), this.carbonMat);
      curtain.position.set(x, 0.52, 2.3);
      this.bodyGroup.add(curtain);

      // 4-Point Matrix LED cluster
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), this.lightHeadMat);
      head.position.set(x, 0.62, 2.32);
      this.bodyGroup.add(head);
    });

    // Lower front aerodynamic air dam
    const dam = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 0.2), this.carbonMat);
    dam.position.set(0, 0.24, 2.38);
    this.bodyGroup.add(dam);

    // Panoramic glass roof
    const canopyGeo = new THREE.CylinderGeometry(0.76, 0.90, 2.6, 20);
    canopyGeo.scale(1.0, 0.44, 1.25);
    canopyGeo.rotateX(Math.PI / 2);
    const canopy = new THREE.Mesh(canopyGeo, this.glassMat);
    canopy.position.set(0, 0.8, -0.1);
    this.bodyGroup.add(canopy);

    // Rear continuous photonic lightbar
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.035, 0.05), this.lightTailMat);
    tailBar.position.set(0, 0.62, -2.42);
    this.bodyGroup.add(tailBar);

    // Aerodynamic flush rear diffuser
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.5), this.carbonMat);
    diffuser.position.set(0, 0.28, -2.35);
    diffuser.rotation.x = -0.15;
    this.bodyGroup.add(diffuser);
  }

  // =========================================================================
  // MODEL 3: ASTON MARTIN DBX707 (Reference Image 6)
  // Metallic Cobalt Blue, massive DB vane grille, horizontal DRL blades,
  // muscular SUV shoulders, carbon side sills, rear ducktail spoiler.
  // =========================================================================
  buildAstonMartinDBX() {
    const bodyGeo = new THREE.BoxGeometry(2.05, 0.62, 4.8, 6, 2, 8);
    const cobaltBlue = new THREE.MeshPhysicalMaterial({
      color: 0x0a3c75, // Cobalt Blue Metallic
      metalness: 0.82,
      roughness: 0.19,
      clearcoat: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, cobaltBlue);
    bodyMesh.position.y = 0.62;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Massive Iconic Aston Martin Vane Grille (6-Bar Frame)
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.52, 0.12), this.chromeMat);
    grille.position.set(0, 0.58, 2.42);
    this.bodyGroup.add(grille);

    // Grille horizontal vanes
    for (let y = 0.42; y <= 0.76; y += 0.07) {
      const vane = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.025, 0.06), this.chromeMat);
      vane.position.set(0, y, 2.46);
      this.bodyGroup.add(vane);
    }

    // Oval swept-back headlights
    [-0.78, 0.78].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.25), this.lightHeadMat);
      head.position.set(x, 0.78, 2.2);
      head.rotation.y = x < 0 ? 0.25 : -0.25;
      this.bodyGroup.add(head);

      // Horizontal DRL light blades below
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.08), this.lightHeadMat);
      blade.position.set(x, 0.46, 2.42);
      this.bodyGroup.add(blade);
    });

    // Hood Twin Heat Extraction Vents
    [-0.35, 0.35].forEach((x) => {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.6), this.carbonMat);
      vent.position.set(x, 0.94, 1.4);
      this.bodyGroup.add(vent);
    });

    // Elevated cabin glass
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.55, 2.6), this.glassMat);
    cabin.position.set(0, 1.15, -0.2);
    this.bodyGroup.add(cabin);

    // Carbon fiber side sills with aero winglets
    [-1.06, 1.06].forEach((x) => {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 2.6), this.carbonMat);
      sill.position.set(x, 0.32, 0);
      this.bodyGroup.add(sill);
    });

    // Rear Roof Ducktail Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.05, 0.35), this.carbonMat);
    spoiler.position.set(0, 1.44, -1.45);
    this.bodyGroup.add(spoiler);

    // Slim animated rear lightblade
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.04, 0.06), this.lightTailMat);
    tail.position.set(0, 0.88, -2.42);
    this.bodyGroup.add(tail);
  }

  // =========================================================================
  // MODEL 4: JAGUAR F-TYPE CONVERTIBLE / ROADSTER (Reference Image 7)
  // Open cockpit, twin rollover hoops, ultra-slim chicane LED taillights,
  // central trapezoidal exhaust embedded in aerodynamic rear diffuser.
  // =========================================================================
  buildJaguarFTypeRoadster() {
    const bodyGeo = new THREE.BoxGeometry(1.86, 0.38, 4.4, 6, 2, 8);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 0.8) {
        pos.setY(i, y - (z - 0.8) * 0.1);
        pos.setX(i, pos.getX(i) * 0.88);
      }
      if (z < -0.6) {
        // Muscular rear haunches
        pos.setY(i, y + 0.04);
      }
    }
    bodyGeo.computeVertexNormals();

    const velocityRed = new THREE.MeshPhysicalMaterial({
      color: 0xc8102e, // Jaguar Velocity Red
      metalness: 0.82,
      roughness: 0.18,
      clearcoat: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, velocityRed);
    bodyMesh.position.y = 0.44;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Open Cockpit Cutout & Low Windshield
    const shieldGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.32, 16, 1, true, 0, Math.PI);
    shieldGeo.rotateX(Math.PI / 2);
    const shield = new THREE.Mesh(shieldGeo, this.glassMat);
    shield.position.set(0, 0.68, 0.52);
    this.bodyGroup.add(shield);

    // Twin Gloss Black Rollover Safety Hoops
    [-0.38, 0.38].forEach((x) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.024, 12, 24, Math.PI), this.carbonMat);
      hoop.position.set(x, 0.78, -0.42);
      this.bodyGroup.add(hoop);
    });

    // Front oval grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.38, 0.1), this.carbonMat);
    grille.position.set(0, 0.46, 2.22);
    this.bodyGroup.add(grille);

    // Slim J-Blade Headlights
    [-0.68, 0.68].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.2), this.lightHeadMat);
      head.position.set(x, 0.58, 2.1);
      head.rotation.y = x < 0 ? 0.3 : -0.3;
      this.bodyGroup.add(head);
    });

    // Ultra-Slim Horizontal Chicane LED Taillights (Exact Jaguar Signature)
    [-0.72, 0.72].forEach((x) => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.05), this.lightTailMat);
      tail.position.set(x, 0.62, -2.22);
      this.bodyGroup.add(tail);
    });

    // Central Trapezoidal Exhaust Tip embedded in Gloss Diffuser (Matching Image 7)
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.22, 0.45), this.carbonMat);
    diffuser.position.set(0, 0.3, -2.18);
    this.bodyGroup.add(diffuser);

    const centerExhaust = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.95, roughness: 0.15 })
    );
    centerExhaust.position.set(0, 0.32, -2.24);
    this.bodyGroup.add(centerExhaust);
  }

  // =========================================================================
  // MODEL 5: ROLLS-ROYCE PHANTOM VIII (Reference Image 2)
  // Upright Pantheon chrome grille with vertical vanes, Spirit of Ecstasy.
  // =========================================================================
  buildRollsRoycePhantom() {
    const bodyGeo = new THREE.BoxGeometry(1.98, 0.65, 5.2, 4, 2, 8);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 1.2) pos.setY(i, y + 0.05);
      if (z < -1.4) pos.setY(i, y - (-1.4 - z) * 0.08);
    }
    bodyGeo.computeVertexNormals();

    const phantomPaint = new THREE.MeshPhysicalMaterial({
      color: 0xf5f7fb, // Arctic White
      metalness: 0.25,
      roughness: 0.08,
      clearcoat: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, phantomPaint);
    bodyMesh.position.y = 0.58;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Upright Chrome Pantheon Grille with 22 Vertical Vanes
    const grilleBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.58, 0.12), this.chromeMat);
    grilleBox.position.set(0, 0.62, 2.62);
    this.bodyGroup.add(grilleBox);

    for (let i = -0.38; i <= 0.38; i += 0.04) {
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.52, 0.04), this.chromeMat);
      vane.position.set(i, 0.62, 2.68);
      this.bodyGroup.add(vane);
    }

    // Spirit of Ecstasy Mascot & Bonnet Spear
    const mascot = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 8), this.chromeMat);
    mascot.position.set(0, 0.99, 2.57);
    mascot.rotation.x = -0.4;
    const spear = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 2.2), this.chromeMat);
    spear.position.set(0, 0.92, 1.4);
    this.bodyGroup.add(mascot, spear);

    // Laser Headlights with Frosted DRL Outline
    [-0.72, 0.72].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), this.lightHeadMat);
      head.position.set(x, 0.68, 2.58);
      this.bodyGroup.add(head);
    });

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.52, 2.8), this.glassMat);
    cabin.position.set(0, 1.15, -0.2);
    this.bodyGroup.add(cabin);

    // Paired Coach Door Handles
    [-1.01, 1.01].forEach((x) => {
      const handleFront = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.12), this.chromeMat);
      handleFront.position.set(x, 0.68, 0.06);
      const handleRear = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.12), this.chromeMat);
      handleRear.position.set(x, 0.68, -0.1);
      this.bodyGroup.add(handleFront, handleRear);
    });

    [-0.82, 0.82].forEach((x) => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.06), this.lightTailMat);
      tail.position.set(x, 0.66, -2.61);
      this.bodyGroup.add(tail);
    });
  }

  // =========================================================================
  // MODEL 6: MERCEDES-BENZ S-CLASS W223 (Reference Images 5 & 8)
  // 3-blade chrome shield grille, upright star, Digital Light, flush handles.
  // =========================================================================
  buildMercedesSClass() {
    const bodyGeo = new THREE.BoxGeometry(1.92, 0.52, 4.9, 6, 2, 8);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 0.8) {
        pos.setY(i, y - (z - 0.8) * 0.09);
        pos.setX(i, pos.getX(i) * 0.9);
      }
      if (z < -0.9) pos.setY(i, y - (-0.9 - z) * 0.08);
    }
    bodyGeo.computeVertexNormals();

    const sClassPaint = new THREE.MeshPhysicalMaterial({
      color: 0x474c54, // Selenite Grey Metallic
      metalness: 0.88,
      roughness: 0.16,
      clearcoat: 1.0
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, sClassPaint);
    bodyMesh.position.y = 0.50;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // 3-Blade Chrome Shield Grille with Radar Plate
    const shieldFrame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.1), this.chromeMat);
    shieldFrame.position.set(0, 0.56, 2.45);
    this.bodyGroup.add(shieldFrame);

    [0.48, 0.56, 0.64].forEach((y) => {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.025, 0.06), this.chromeMat);
      blade.position.set(0, y, 2.5);
      this.bodyGroup.add(blade);
    });

    // Upright Three-Pointed Star
    const starStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06), this.chromeMat);
    starStem.position.set(0, 0.84, 2.4);
    const starRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 8, 24), this.chromeMat);
    starRing.position.set(0, 0.88, 2.4);
    this.bodyGroup.add(starStem, starRing);

    [-0.72, 0.72].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.14), this.lightHeadMat);
      head.position.set(x, 0.58, 2.38);
      this.bodyGroup.add(head);
    });

    const cabinGeo = new THREE.CylinderGeometry(0.78, 0.92, 2.8, 20);
    cabinGeo.scale(1.0, 0.46, 1.25);
    cabinGeo.rotateX(Math.PI / 2);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    cabin.position.set(0, 0.84, -0.15);
    this.bodyGroup.add(cabin);

    // Retractable Door Handles
    [-0.97, 0.97].forEach((x) => {
      [0.4, -0.5].forEach((z) => {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.14), this.chromeMat);
        handle.position.set(x, 0.62, z);
        this.bodyGroup.add(handle);
      });
    });

    [-0.78, 0.78].forEach((x) => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.06), this.lightTailMat);
      tail.position.set(x, 0.64, -2.46);
      this.bodyGroup.add(tail);
    });
  }

  // =========================================================================
  // MODEL 7: TOYOTA TUNDRA CAPSTONE (Reference Image 1)
  // Heavy-duty pickup truck, octagonal grille, bracket LEDs, CrewMax cab & bed.
  // =========================================================================
  buildToyotaTundra() {
    const cabGeo = new THREE.BoxGeometry(2.08, 0.75, 2.6);
    const truckPaint = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf0, // Wind Chill Pearl
      metalness: 0.45,
      roughness: 0.18,
      clearcoat: 0.9
    });
    const cabMesh = new THREE.Mesh(cabGeo, truckPaint);
    cabMesh.position.set(0, 0.85, 0.4);
    cabMesh.castShadow = true;
    this.bodyGroup.add(cabMesh);

    // Truck bed & liner
    const bedOuter = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.65, 2.2), truckPaint);
    bedOuter.position.set(0, 0.78, -1.8);
    const bedInner = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.55, 1.9), this.carbonMat);
    bedInner.position.set(0, 0.84, -1.8);
    this.bodyGroup.add(bedOuter, bedInner);

    // Octagonal Chrome Grille with Slats
    const grilleFrame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.65, 0.15), this.chromeMat);
    grilleFrame.position.set(0, 0.75, 2.35);
    this.bodyGroup.add(grilleFrame);

    for (let y = 0.52; y <= 0.95; y += 0.08) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.035, 0.08), this.chromeMat);
      slat.position.set(0, y, 2.42);
      this.bodyGroup.add(slat);
    }

    // Bracket / Y-Shaped Headlights
    [-0.92, 0.92].forEach((x) => {
      const dRLVert = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.1), this.lightHeadMat);
      dRLVert.position.set(x, 0.78, 2.32);
      const dRLHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), this.lightHeadMat);
      dRLHoriz.position.set(x * 0.92, 0.9, 2.32);
      this.bodyGroup.add(dRLVert, dRLHoriz);
    });

    [-1.06, 1.06].forEach((x) => {
      [1.4, -1.7].forEach((z) => {
        const arch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.95), this.carbonMat);
        arch.position.set(x, 0.72, z);
        this.bodyGroup.add(arch);
      });
    });
  }

  // =========================================================================
  // MODEL-SPECIFIC INTERIOR ARCHITECTURE
  // =========================================================================
  buildInterior() {
    const isTruck = this.currentModelType === 'toyota_tundra' || this.currentModelType === 'cyber_suv';
    const isPhantom = this.currentModelType === 'rolls_royce_phantom' || this.currentModelType === 'spectre_gt';
    const isMercedes = this.currentModelType === 'mercedes_s_class' || this.currentModelType === 'mach_iv';

    const floorY = isTruck ? 0.45 : (isPhantom ? 0.36 : 0.28);
    const seatMat = isPhantom || isMercedes ? this.leatherLightMat : this.alcantaraMat;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.4), this.alcantaraMat);
    floor.position.set(0, floorY, 0.1);
    this.interiorGroup.add(floor);

    [-0.42, 0.42].forEach((x) => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.58), seatMat);
      seat.position.set(x, floorY + 0.12, -0.1);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.14), seatMat);
      back.position.set(x, floorY + 0.45, -0.42);
      back.rotation.x = isTruck ? 0.12 : 0.25;
      this.interiorGroup.add(seat, back);
    });

    const dashY = isTruck ? 1.05 : (isPhantom ? 0.88 : (isMercedes ? 0.78 : 0.68));
    const dashZ = isTruck ? 0.85 : 0.7;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 0.55), this.alcantaraMat);
    dash.position.set(0, dashY, dashZ);
    this.interiorGroup.add(dash);

    // Infodynamic display screen
    if (this.interiorView && this.interiorView.texture) {
      const screenGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.32, 32, 1, true, -Math.PI * 0.18, Math.PI * 0.36);
      screenGeo.rotateY(Math.PI);
      const screenMat = new THREE.MeshBasicMaterial({
        map: this.interiorView.texture,
        side: THREE.DoubleSide
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, dashY + 0.08, dashZ - 0.06);
      this.interiorGroup.add(screen);
    }

    // AC Micro-climate louvers
    if (isPhantom) {
      [-0.45, -0.15, 0.15, 0.45].forEach((x) => {
        const vent = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 12, 24), this.chromeMat);
        vent.position.set(x, dashY + 0.02, dashZ + 0.08);
        this.interiorGroup.add(vent);
      });
    } else {
      [-0.45, -0.15, 0.15, 0.45].forEach((x) => {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.06), this.carbonMat);
        vent.position.set(x, dashY + 0.04, dashZ + 0.06);
        this.interiorGroup.add(vent);
      });
    }

    if (this.interiorView) {
      this.interiorGroup.add(this.interiorView.ventParticleGroup);
    }

    this.buildModelSpecificSteeringWheel(dashY, dashZ, isPhantom, isTruck, isMercedes);
  }

  buildModelSpecificSteeringWheel(dashY, dashZ, isPhantom, isTruck, isMercedes) {
    const steerGroup = new THREE.Group();
    const steerX = -0.42;
    const steerY = dashY - 0.04;
    const steerZ = dashZ - 0.32;
    steerGroup.position.set(steerX, steerY, steerZ);
    steerGroup.rotation.x = -0.28;

    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3), this.carbonMat);
    col.rotation.x = Math.PI / 2;
    col.position.set(0, -0.06, 0.12);
    steerGroup.add(col);

    if (isPhantom) {
      // Rolls-Royce Thin-Rim 3-Spoke Luxury Wheel
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.016, 16, 32), this.alcantaraMat);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), this.chromeMat);
      hub.rotation.x = Math.PI / 2;
      steerGroup.add(rim, hub);
    } else if (isTruck) {
      // Toyota Tundra Chunky 4-Spoke Wheel
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 16, 32), this.alcantaraMat);
      const hub = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.04), this.carbonMat);
      steerGroup.add(rim, hub);
    } else if (isMercedes) {
      // Mercedes S-Class Twin-Horizontal Spoke Wheel
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 16, 32), this.alcantaraMat);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 20), this.chromeMat);
      hub.rotation.x = Math.PI / 2;
      steerGroup.add(rim, hub);
    } else {
      // Lamborghini Aventador Flat-Bottom Racing Wheel with Red Center Stripe & Paddle Shifters
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 6), this.carbonMat);
      hub.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.024, 16, 32), this.alcantaraMat);
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.035, 12), this.accentPaintMat);
      stripe.position.set(0, 0.18, 0);

      [-0.18, 0.18].forEach((x) => {
        const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.015), this.chromeMat);
        paddle.position.set(x, 0.04, 0.05);
        paddle.rotation.z = x < 0 ? -0.1 : 0.1;
        steerGroup.add(paddle);
      });
      steerGroup.add(hub, rim, stripe);
    }

    this.steeringWheel = steerGroup;
    this.interiorGroup.add(steerGroup);
  }

  // =========================================================================
  // MODEL-SPECIFIC WHEELS & ROTORS
  // =========================================================================
  buildWheels() {
    const isTruck = this.currentModelType === 'toyota_tundra' || this.currentModelType === 'cyber_suv';
    const isPhantom = this.currentModelType === 'rolls_royce_phantom' || this.currentModelType === 'spectre_gt';
    const isMercedes = this.currentModelType === 'mercedes_s_class' || this.currentModelType === 'mach_iv';

    const trackWidth = isTruck ? 1.08 : (isPhantom ? 1.02 : 0.98);
    const wheelY = isTruck ? 0.48 : (isPhantom ? 0.42 : 0.36);
    const wheelbaseFront = isTruck ? 1.55 : (isPhantom ? 1.6 : 1.42);
    const wheelbaseRear = isTruck ? -1.65 : (isPhantom ? -1.6 : -1.42);
    const wheelRadius = isTruck ? 0.48 : (isPhantom ? 0.42 : 0.38);
    const tireWidth = isTruck ? 0.35 : (isPhantom ? 0.30 : 0.28);

    const positions = [
      { x: -trackWidth, y: wheelY, z: wheelbaseFront, isLeft: true },
      { x: trackWidth, y: wheelY, z: wheelbaseFront, isLeft: false },
      { x: -trackWidth, y: wheelY, z: wheelbaseRear, isLeft: true },
      { x: trackWidth, y: wheelY, z: wheelbaseRear, isLeft: false }
    ];

    positions.forEach((p) => {
      const wheelUnit = new THREE.Group();
      wheelUnit.position.set(p.x, p.y, p.z);

      const rotatingGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, tireWidth, 28);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, this.tireMat);
      tire.castShadow = true;
      rotatingGroup.add(tire);

      const rimRadius = wheelRadius * 0.78;
      const barrelGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.01, 24, 1, true);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, isPhantom || isMercedes ? this.chromeMat : this.rimMat);
      rotatingGroup.add(barrel);

      const faceX = p.isLeft ? -0.12 : 0.12;

      if (isPhantom) {
        // Rolls-Royce Multi-Vane Disc Wheel
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.5, rimRadius * 0.5, 0.03, 24), this.chromeMat);
        disc.rotation.z = Math.PI / 2;
        disc.position.x = faceX;
        rotatingGroup.add(disc);
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2;
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.015, rimRadius * 0.48, 0.02), this.chromeMat);
          fin.position.set(faceX, Math.cos(angle) * (rimRadius * 0.72), Math.sin(angle) * (rimRadius * 0.72));
          fin.rotation.x = -angle;
          rotatingGroup.add(fin);
        }
      } else if (isTruck) {
        // Tundra 10-Spoke Machined Wheel
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, rimRadius, 0.06), this.chromeMat);
          spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
          spoke.rotation.x = -angle;
          rotatingGroup.add(spoke);
        }
      } else if (isMercedes) {
        // Mercedes 21-inch AMG Multi-Spoke
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.015, rimRadius, 0.025), this.chromeMat);
          spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
          spoke.rotation.x = -angle;
          rotatingGroup.add(spoke);
        }
      } else {
        // Lamborghini Leirion Center-Lock Y-Spokes
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2;
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.028, rimRadius, 0.04), this.carbonMat);
          spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
          spoke.rotation.x = -angle;
          rotatingGroup.add(spoke);
        }
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 6), this.accentPaintMat);
        nut.rotation.z = Math.PI / 2;
        nut.position.x = p.isLeft ? -0.15 : 0.15;
        rotatingGroup.add(nut);
      }

      wheelUnit.add(rotatingGroup);

      // Brakes
      const brakeAssembly = new THREE.Group();
      const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.035, 24);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeo, this.rotorMat);
      brakeAssembly.add(rotor);

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.14), this.caliperMat);
      caliper.position.set(p.isLeft ? -0.05 : 0.05, wheelRadius * 0.42, 0.05);
      caliper.castShadow = true;
      brakeAssembly.add(caliper);

      wheelUnit.add(brakeAssembly);
      this.wheelGroup.add(wheelUnit);
      this.wheels.push({ unit: wheelUnit, rotating: rotatingGroup });
    });
  }

  // =========================================================================
  // CHASSIS CUTAWAY
  // =========================================================================
  buildChassis() {
    const tubGeo = new THREE.BoxGeometry(1.6, 0.7, 2.6);
    const tub = new THREE.Mesh(tubGeo, this.xRayBoneMat);
    tub.position.set(0, 0.6, 0);
    this.chassisGroup.add(tub);

    const batGeo = new THREE.BoxGeometry(1.4, 0.14, 2.2);
    const battery = new THREE.Mesh(batGeo, this.batteryMat);
    battery.position.set(0, 0.24, 0);
    this.chassisGroup.add(battery);

    [1.4, -1.4].forEach((z) => {
      const motorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
      motorGeo.rotateZ(Math.PI / 2);
      const motor = new THREE.Mesh(motorGeo, this.xRayBoneMat);
      motor.position.set(0, 0.36, z);
      this.chassisGroup.add(motor);
    });

    this.chassisGroup.visible = false;
  }

  setModel(type) {
    this.currentModelType = type;
    this.buildCurrentCar();
  }

  setPaintColor(hex) {
    this.currentColor = hex;
    this.paintMat.color.set(hex);
  }

  setCaliperColor(hex) {
    this.currentCaliperColor = hex;
    this.caliperMat.color.set(hex);
  }

  setWheelType(type) {
    this.currentWheelType = type;
    this.buildWheels();
  }

  setXRay(enabled) {
    this.isXRayMode = enabled;
    this.chassisGroup.visible = enabled;
    if (enabled) {
      this.paintMat.transparent = true;
      this.paintMat.opacity = 0.22;
      this.carbonMat.transparent = true;
      this.carbonMat.opacity = 0.35;
    } else {
      this.paintMat.transparent = false;
      this.paintMat.opacity = 1.0;
      this.carbonMat.transparent = false;
      this.carbonMat.opacity = 1.0;
    }
  }

  setWingAngle(degrees) {
    if (this.activeWing) {
      this.activeWing.rotation.x = (degrees * Math.PI) / 180;
    }
  }

  update(time, delta, speedRatio = 1.0) {
    const rotationSpeed = delta * 18.0 * speedRatio;
    this.wheels.forEach((w) => {
      w.rotating.rotation.x += rotationSpeed;
    });

    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = Math.sin(time * 1.5) * 0.08;
    }
  }
}
