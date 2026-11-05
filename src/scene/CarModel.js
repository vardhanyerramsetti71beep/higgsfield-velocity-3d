import * as THREE from 'three';

export class CarModel {
  constructor(interiorView) {
    this.interiorView = interiorView;
    this.root = new THREE.Group();
    this.currentModelType = 'apex_gt';
    this.currentColor = 0x00f0ff; // Liquid Cyan / Mercury default
    this.currentWheelType = 'aero_blade';
    this.currentCaliperColor = 0xff0055;
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

    // Active wing reference
    this.activeWing = null;
    this.wheels = [];

    this.initMaterials();
    this.buildCurrentCar();
  }

  initMaterials() {
    // Body Paint Material (Automotive Clearcoat PBR)
    this.paintMat = new THREE.MeshPhysicalMaterial({
      color: this.currentColor,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
      envMapIntensity: 1.5
    });

    // Carbon Fiber Material
    this.carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.6,
      roughness: 0.35
    });

    // Glass Canopy Material
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a101d,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.45,
      ior: 1.52
    });

    // Headlight / Taillight Glow Materials
    this.lightHeadMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00e1ff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });

    this.lightTailMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff002b,
      emissiveIntensity: 4.0,
      roughness: 0.1
    });

    // Brake Caliper Material
    this.caliperMat = new THREE.MeshStandardMaterial({
      color: this.currentCaliperColor,
      metalness: 0.8,
      roughness: 0.2
    });

    // Brake Rotor Carbon Ceramic
    this.rotorMat = new THREE.MeshStandardMaterial({
      color: 0x2d3238,
      metalness: 0.9,
      roughness: 0.3
    });

    // Rim Alloy Material
    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      metalness: 0.9,
      roughness: 0.2
    });

    // Tire Rubber Material
    this.tireMat = new THREE.MeshStandardMaterial({
      color: 0x151618,
      metalness: 0.05,
      roughness: 0.85
    });

    // Interior Alcantara
    this.alcantaraMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e22,
      roughness: 0.92,
      metalness: 0.05
    });

    // Steering Wheel Accents
    this.steeringTrimMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a3cc,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });

    // Chassis X-Ray Materials
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

    // 1. Build Exterior based on model
    if (this.currentModelType === 'apex_gt') {
      this.buildApexGT();
    } else if (this.currentModelType === 'spectre_gt') {
      this.buildSpectreGT();
    } else if (this.currentModelType === 'cyber_suv') {
      this.buildCyberSUV();
    } else if (this.currentModelType === 'mach_iv') {
      this.buildMachIV();
    }

    // 2. Build High-Fidelity Cockpit Interior
    this.buildInterior();

    // 3. Build Model-Specific Wheels & Brakes
    this.buildWheels();

    // 4. Build Internal Chassis & Powertrain (for X-Ray cutaway)
    this.buildChassis();

    // Reset X-Ray state
    this.setXRay(this.isXRayMode);
  }

  // --- MODEL 1: APEX GT (HYPERCAR) ---
  buildApexGT() {
    // Main fuselage / monocoque base
    const baseGeo = new THREE.BoxGeometry(1.85, 0.35, 4.4, 4, 2, 8);
    // Taper front and rear
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 0.8) {
        // Nose slope down
        pos.setY(i, y - (z - 0.8) * 0.12);
        // Taper width toward front nose
        pos.setX(i, pos.getX(i) * (1.0 - (z - 0.8) * 0.18));
      }
      if (z < -0.8) {
        // Rear diffuser slope up
        pos.setY(i, y + (-0.8 - z) * 0.08);
      }
    }
    baseGeo.computeVertexNormals();
    const baseMesh = new THREE.Mesh(baseGeo, this.paintMat);
    baseMesh.position.y = 0.42;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.bodyGroup.add(baseMesh);

    // Front aerodynamic hood & air extractors
    const hoodGeo = new THREE.CylinderGeometry(0.75, 0.95, 1.4, 16);
    hoodGeo.scale(1.0, 0.22, 1.3);
    hoodGeo.rotateX(Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, this.paintMat);
    hood.position.set(0, 0.58, 1.25);
    hood.castShadow = true;
    this.bodyGroup.add(hood);

    // Front carbon fiber splitter & dive planes
    const splitterGeo = new THREE.BoxGeometry(1.95, 0.06, 0.9);
    const splitter = new THREE.Mesh(splitterGeo, this.carbonMat);
    splitter.position.set(0, 0.18, 2.2);
    this.bodyGroup.add(splitter);

    // Aerodynamic dive planes (canards)
    [-0.95, 0.95].forEach((side) => {
      const canardGeo = new THREE.BoxGeometry(0.28, 0.03, 0.35);
      const canard = new THREE.Mesh(canardGeo, this.carbonMat);
      canard.position.set(side, 0.32, 2.05);
      canard.rotation.z = side < 0 ? -0.2 : 0.2;
      this.bodyGroup.add(canard);
    });

    // Glass Cockpit Canopy
    const canopyGeo = new THREE.SphereGeometry(0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    canopyGeo.scale(0.95, 0.55, 1.6);
    const canopy = new THREE.Mesh(canopyGeo, this.glassMat);
    canopy.position.set(0, 0.62, 0.05);
    this.bodyGroup.add(canopy);

    // Roof Scoop
    const scoopGeo = new THREE.BoxGeometry(0.32, 0.12, 0.7);
    const scoop = new THREE.Mesh(scoopGeo, this.carbonMat);
    scoop.position.set(0, 1.05, -0.15);
    this.bodyGroup.add(scoop);

    // Rear Aero Fenders & Side Pods
    [-0.88, 0.88].forEach((side) => {
      const podGeo = new THREE.BoxGeometry(0.3, 0.45, 1.8);
      const pod = new THREE.Mesh(podGeo, this.paintMat);
      pod.position.set(side, 0.5, -0.7);
      pod.castShadow = true;
      this.bodyGroup.add(pod);

      // Carbon side skirts
      const skirtGeo = new THREE.BoxGeometry(0.12, 0.05, 2.3);
      const skirt = new THREE.Mesh(skirtGeo, this.carbonMat);
      skirt.position.set(side * 1.05, 0.18, 0.1);
      this.bodyGroup.add(skirt);
    });

    // Rear Venturi Diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.85, 0.25, 0.9);
    const diffuser = new THREE.Mesh(diffuserGeo, this.carbonMat);
    diffuser.position.set(0, 0.26, -2.1);
    diffuser.rotation.x = -0.15;
    this.bodyGroup.add(diffuser);

    // Diffuser vertical aero strakes
    [-0.6, -0.2, 0.2, 0.6].forEach((x) => {
      const strakeGeo = new THREE.BoxGeometry(0.03, 0.2, 0.8);
      const strake = new THREE.Mesh(strakeGeo, this.carbonMat);
      strake.position.set(x, 0.25, -2.1);
      strake.rotation.x = -0.15;
      this.bodyGroup.add(strake);
    });

    // Active Dual-Element Rear Wing
    this.buildActiveWing(1.9, -2.15, 0.98);

    // Headlights (Signature LED Blades)
    [-0.68, 0.68].forEach((side) => {
      const headGeo = new THREE.BoxGeometry(0.32, 0.05, 0.25);
      const head = new THREE.Mesh(headGeo, this.lightHeadMat);
      head.position.set(side, 0.52, 2.05);
      head.rotation.y = side < 0 ? 0.35 : -0.35;
      this.bodyGroup.add(head);
    });

    // Full-width rear photonic lightbar
    const tailGeo = new THREE.BoxGeometry(1.7, 0.04, 0.08);
    const tail = new THREE.Mesh(tailGeo, this.lightTailMat);
    tail.position.set(0, 0.62, -2.2);
    this.bodyGroup.add(tail);
  }

  // --- MODEL 2: SPECTRE GRAND TOURER (ELECTRIC LUXURY GT) ---
  buildSpectreGT() {
    // Elegant sweeping streamline fastback
    const baseGeo = new THREE.BoxGeometry(1.92, 0.42, 4.8, 6, 2, 8);
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 1.0) {
        pos.setY(i, y - (z - 1.0) * 0.1);
        pos.setX(i, pos.getX(i) * 0.88);
      }
      if (z < -0.8) {
        // Fastback tail slope
        pos.setY(i, y - (-0.8 - z) * 0.08);
      }
    }
    baseGeo.computeVertexNormals();
    const baseMesh = new THREE.Mesh(baseGeo, this.paintMat);
    baseMesh.position.y = 0.46;
    baseMesh.castShadow = true;
    this.bodyGroup.add(baseMesh);

    // Full Panoramic Glass Teardrop Canopy
    const canopyGeo = new THREE.CylinderGeometry(0.78, 0.92, 2.6, 20);
    canopyGeo.scale(1.0, 0.48, 1.25);
    canopyGeo.rotateX(Math.PI / 2);
    const canopy = new THREE.Mesh(canopyGeo, this.glassMat);
    canopy.position.set(0, 0.82, -0.2);
    this.bodyGroup.add(canopy);

    // Front Integrated Matrix Light Ribbon
    const ribbonGeo = new THREE.BoxGeometry(1.82, 0.04, 0.06);
    const ribbon = new THREE.Mesh(ribbonGeo, this.lightHeadMat);
    ribbon.position.set(0, 0.54, 2.38);
    this.bodyGroup.add(ribbon);

    // Clean Aerodynamic Flush Diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.8, 0.22, 0.7);
    const diffuser = new THREE.Mesh(diffuserGeo, this.carbonMat);
    diffuser.position.set(0, 0.3, -2.35);
    this.bodyGroup.add(diffuser);

    // Subtle Integrated Flush Active Spoiler
    this.buildActiveWing(1.65, -2.3, 0.82, 0.08);

    // Rear Light Ribbon
    const tailGeo = new THREE.BoxGeometry(1.85, 0.04, 0.05);
    const tail = new THREE.Mesh(tailGeo, this.lightTailMat);
    tail.position.set(0, 0.65, -2.42);
    this.bodyGroup.add(tail);
  }

  // --- MODEL 3: VALKYRIE CYBER-SUV ---
  buildCyberSUV() {
    // Muscular high-clearance body
    const baseGeo = new THREE.BoxGeometry(2.05, 0.65, 4.6, 4, 2, 6);
    const baseMesh = new THREE.Mesh(baseGeo, this.paintMat);
    baseMesh.position.y = 0.68;
    baseMesh.castShadow = true;
    this.bodyGroup.add(baseMesh);

    // Flared Hexagonal Wheel Arches
    [-1.02, 1.02].forEach((x) => {
      [1.3, -1.3].forEach((z) => {
        const archGeo = new THREE.BoxGeometry(0.18, 0.45, 0.95);
        const arch = new THREE.Mesh(archGeo, this.carbonMat);
        arch.position.set(x, 0.65, z);
        this.bodyGroup.add(arch);
      });
    });

    // Elevated Cabin Glass Box
    const cabinGeo = new THREE.BoxGeometry(1.72, 0.58, 2.5);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    cabin.position.set(0, 1.25, -0.2);
    this.bodyGroup.add(cabin);

    // Roof Aero Expedition Rack with Matrix Light Pods
    const rackGeo = new THREE.BoxGeometry(1.65, 0.06, 2.1);
    const rack = new THREE.Mesh(rackGeo, this.carbonMat);
    rack.position.set(0, 1.58, -0.2);
    this.bodyGroup.add(rack);

    const lightPodGeo = new THREE.BoxGeometry(1.2, 0.08, 0.12);
    const lightPods = new THREE.Mesh(lightPodGeo, this.lightHeadMat);
    lightPods.position.set(0, 1.62, 0.85);
    this.bodyGroup.add(lightPods);

    // Heavy-duty Front Skid Plate
    const skidGeo = new THREE.BoxGeometry(1.4, 0.18, 0.6);
    const skid = new THREE.Mesh(skidGeo, this.carbonMat);
    skid.position.set(0, 0.32, 2.25);
    skid.rotation.x = -0.3;
    this.bodyGroup.add(skid);

    // Quad Headlights
    [-0.75, 0.75].forEach((x) => {
      const quadGeo = new THREE.BoxGeometry(0.35, 0.18, 0.12);
      const quad = new THREE.Mesh(quadGeo, this.lightHeadMat);
      quad.position.set(x, 0.78, 2.3);
      this.bodyGroup.add(quad);
    });

    // Rear Roof Spoiler
    this.buildActiveWing(1.7, -1.45, 1.58, 0.15);

    // Rear Light Blade
    const tailGeo = new THREE.BoxGeometry(1.9, 0.06, 0.06);
    const tail = new THREE.Mesh(tailGeo, this.lightTailMat);
    tail.position.set(0, 0.95, -2.32);
    this.bodyGroup.add(tail);
  }

  // --- MODEL 4: MACH-IV SPEEDSTER (OPEN-COCKPIT PROTOTYPE) ---
  buildMachIV() {
    // Ultra-low aerodynamic wedge monocoque
    const baseGeo = new THREE.BoxGeometry(1.88, 0.3, 4.3);
    const baseMesh = new THREE.Mesh(baseGeo, this.paintMat);
    baseMesh.position.y = 0.36;
    baseMesh.castShadow = true;
    this.bodyGroup.add(baseMesh);

    // Twin Aerodynamic Rollover Cowls / Headrest Nacelles
    [-0.38, 0.38].forEach((x) => {
      const cowlGeo = new THREE.ConeGeometry(0.24, 1.2, 16);
      cowlGeo.rotateX(-Math.PI / 2);
      cowlGeo.scale(1.0, 0.8, 1.0);
      const cowl = new THREE.Mesh(cowlGeo, this.paintMat);
      cowl.position.set(x, 0.72, -0.6);
      this.bodyGroup.add(cowl);
    });

    // Central Aero Shark Fin
    const finGeo = new THREE.BoxGeometry(0.04, 0.45, 1.5);
    const fin = new THREE.Mesh(finGeo, this.carbonMat);
    fin.position.set(0, 0.82, -1.2);
    this.bodyGroup.add(fin);

    // Low Deflector Windscreen
    const aeroShieldGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.25, 16, 1, true, 0, Math.PI);
    aeroShieldGeo.rotateX(Math.PI / 2);
    const shield = new THREE.Mesh(aeroShieldGeo, this.glassMat);
    shield.position.set(0, 0.58, 0.55);
    this.bodyGroup.add(shield);

    // Aggressive Front Air Tunnel Splitter
    const splitterGeo = new THREE.BoxGeometry(1.92, 0.05, 1.0);
    const splitter = new THREE.Mesh(splitterGeo, this.carbonMat);
    splitter.position.set(0, 0.15, 2.15);
    this.bodyGroup.add(splitter);

    // High Downforce Twin Carbon Wing
    this.buildActiveWing(1.98, -2.08, 1.05);

    // Headlight slit
    [-0.7, 0.7].forEach((x) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.1), this.lightHeadMat);
      head.position.set(x, 0.42, 2.12);
      this.bodyGroup.add(head);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.03, 0.06), this.lightTailMat);
    tail.position.set(0, 0.52, -2.15);
    this.bodyGroup.add(tail);
  }

  // --- ACTIVE REAR SPOILER / WING ---
  buildActiveWing(width = 1.9, zPos = -2.15, yPos = 0.98, chord = 0.35) {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(0, yPos, zPos);

    // Wing Aerofoil Blade
    const wingGeo = new THREE.BoxGeometry(width, 0.04, chord);
    const wing = new THREE.Mesh(wingGeo, this.carbonMat);
    wing.castShadow = true;
    wingGroup.add(wing);

    // Endplates (Vertical Stabilizers)
    [-width / 2, width / 2].forEach((x) => {
      const plateGeo = new THREE.BoxGeometry(0.03, 0.22, chord + 0.1);
      const plate = new THREE.Mesh(plateGeo, this.carbonMat);
      plate.position.set(x, 0.04, 0);
      wingGroup.add(plate);
    });

    // Dual Hydraulic Struts
    [-width * 0.28, width * 0.28].forEach((x) => {
      const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45);
      const strut = new THREE.Mesh(strutGeo, this.carbonMat);
      strut.position.set(x, -0.22, 0);
      strut.rotation.x = 0.2;
      wingGroup.add(strut);
    });

    this.activeWing = wingGroup;
    this.aeroGroup.add(wingGroup);
  }

  // --- COCKPIT INTERIOR: STEERING WHEEL, INFODYNAMIC SCREEN, AC VENTS, SEATS ---
  buildInterior() {
    // Interior floor tub
    const floorGeo = new THREE.BoxGeometry(1.5, 0.1, 2.2);
    const floor = new THREE.Mesh(floorGeo, this.alcantaraMat);
    floor.position.set(0, 0.28, 0.1);
    this.interiorGroup.add(floor);

    // Twin Sports Bucket Seats
    [-0.38, 0.38].forEach((x) => {
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.58), this.alcantaraMat);
      seatBase.position.set(x, 0.35, -0.1);

      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.12), this.alcantaraMat);
      seatBack.position.set(x, 0.68, -0.42);
      seatBack.rotation.x = 0.25;

      const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.1), this.alcantaraMat);
      headRest.position.set(x, 1.05, -0.55);

      this.interiorGroup.add(seatBase, seatBack, headRest);
    });

    // Center Console Tunnel
    const consoleGeo = new THREE.BoxGeometry(0.24, 0.32, 1.4);
    const consoleMesh = new THREE.Mesh(consoleGeo, this.carbonMat);
    consoleMesh.position.set(0, 0.45, 0.1);
    this.interiorGroup.add(consoleMesh);

    // Illuminated Engine Start / Drive Selector
    const startBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0044, emissiveIntensity: 2.0 })
    );
    startBtn.position.set(0, 0.62, 0.2);
    this.interiorGroup.add(startBtn);

    // Dashboard Structure
    const dashGeo = new THREE.BoxGeometry(1.62, 0.28, 0.55);
    const dash = new THREE.Mesh(dashGeo, this.alcantaraMat);
    dash.position.set(0, 0.65, 0.68);
    this.interiorGroup.add(dash);

    // --- CURVED PANORAMIC INFODYNAMIC COCKPIT DISPLAY ---
    if (this.interiorView && this.interiorView.texture) {
      // Curved surface for high-tech OLED look
      const screenGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.32, 32, 1, true, -Math.PI * 0.18, Math.PI * 0.36);
      screenGeo.rotateY(Math.PI);
      const screenMat = new THREE.MeshBasicMaterial({
        map: this.interiorView.texture,
        side: THREE.DoubleSide
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0.74, 0.62);
      this.interiorGroup.add(screen);
    }

    // --- AC MICRO-CLIMATE VENTILATION SLOTS ---
    // Physical metallic louvers
    [-0.45, -0.15, 0.15, 0.45].forEach((x) => {
      const ventGeo = new THREE.BoxGeometry(0.18, 0.04, 0.08);
      const ventMat = new THREE.MeshStandardMaterial({
        color: 0x11161d,
        metalness: 0.9,
        roughness: 0.1
      });
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(x, 0.68, 0.78);
      this.interiorGroup.add(vent);

      // Subtle glow border
      const ventGlowGeo = new THREE.BoxGeometry(0.19, 0.048, 0.02);
      const ventGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const ventGlow = new THREE.Mesh(ventGlowGeo, ventGlowMat);
      ventGlow.position.set(x, 0.68, 0.82);
      this.interiorGroup.add(ventGlow);
    });

    // Add dynamic AC air particles from InteriorView
    if (this.interiorView) {
      this.interiorGroup.add(this.interiorView.ventParticleGroup);
    }

    // --- ERGONOMIC FORMULA YOKE STEERING WHEEL ---
    this.buildYokeSteeringWheel();
  }

  buildYokeSteeringWheel() {
    const steerGroup = new THREE.Group();
    // Positioned directly in front of the driver (left-hand drive)
    steerGroup.position.set(-0.38, 0.68, 0.38);
    steerGroup.rotation.x = -0.32;

    // Steering Column
    const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35);
    const col = new THREE.Mesh(colGeo, this.carbonMat);
    col.position.set(0, -0.08, 0.15);
    col.rotation.x = Math.PI / 2;
    steerGroup.add(col);

    // Central Hub
    const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.carbonMat);
    steerGroup.add(hub);

    // Center Aether Emblem
    const crestGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.045, 16);
    crestGeo.rotateX(Math.PI / 2);
    const crest = new THREE.Mesh(crestGeo, this.steeringTrimMat);
    steerGroup.add(crest);

    // Yoke Dual Ergonomic Hand Grips (Left & Right)
    [-0.18, 0.18].forEach((x) => {
      const gripGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.22, 16);
      const grip = new THREE.Mesh(gripGeo, this.alcantaraMat);
      grip.position.set(x, 0, 0);
      steerGroup.add(grip);

      // Horizontal crossbars connecting to hub
      const barGeo = new THREE.BoxGeometry(0.12, 0.035, 0.03);
      const bar = new THREE.Mesh(barGeo, this.carbonMat);
      bar.position.set(x * 0.5, 0, 0);
      steerGroup.add(bar);

      // Aluminum Paddle Shifter (Behind Grip)
      const paddleGeo = new THREE.BoxGeometry(0.03, 0.14, 0.015);
      const paddle = new THREE.Mesh(paddleGeo, this.rimMat);
      paddle.position.set(x, 0.02, 0.04);
      paddle.rotation.z = x < 0 ? -0.1 : 0.1;
      steerGroup.add(paddle);

      // Rotary Thumb Dials (Drive Mode & Traction)
      const dialGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 12);
      dialGeo.rotateX(Math.PI / 2);
      const dial = new THREE.Mesh(dialGeo, this.steeringTrimMat);
      dial.position.set(x * 0.6, -0.04, -0.02);
      steerGroup.add(dial);
    });

    // Lower Crossbar
    const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.02), this.carbonMat);
    bottomBar.position.set(0, -0.1, 0);
    steerGroup.add(bottomBar);

    // Top LED Shift Light Arc (Formula 1 Rev Strip)
    const ledCount = 9;
    for (let i = 0; i < ledCount; i++) {
      const ledX = (i - (ledCount - 1) / 2) * 0.025;
      const isHighRev = i >= 6;
      const ledMat = new THREE.MeshBasicMaterial({
        color: isHighRev ? 0xff0044 : (i >= 4 ? 0xffaa00 : 0x00ff88)
      });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 0.01), ledMat);
      led.position.set(ledX, 0.065, -0.01);
      steerGroup.add(led);
    }

    this.steeringWheel = steerGroup;
    this.interiorGroup.add(steerGroup);
  }

  // --- MODEL-SPECIFIC WHEELS & CARBON CERAMIC BRAKES ---
  buildWheels() {
    // Wheel coordinates
    const isSUV = this.currentModelType === 'cyber_suv';
    const trackWidth = isSUV ? 1.05 : 0.98;
    const wheelY = isSUV ? 0.44 : 0.36;
    const wheelbaseFront = isSUV ? 1.45 : 1.42;
    const wheelbaseRear = isSUV ? -1.45 : -1.42;
    const wheelRadius = isSUV ? 0.44 : 0.38;
    const tireWidth = isSUV ? 0.32 : 0.28;

    const positions = [
      { x: -trackWidth, y: wheelY, z: wheelbaseFront, isLeft: true },
      { x: trackWidth, y: wheelY, z: wheelbaseFront, isLeft: false },
      { x: -trackWidth, y: wheelY, z: wheelbaseRear, isLeft: true },
      { x: trackWidth, y: wheelY, z: wheelbaseRear, isLeft: false }
    ];

    positions.forEach((p, idx) => {
      const wheelUnit = new THREE.Group();
      wheelUnit.position.set(p.x, p.y, p.z);

      // Rotating Wheel Assembly
      const rotatingGroup = new THREE.Group();

      // 1. Tire Rubber
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, tireWidth, 28);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, this.tireMat);
      tire.castShadow = true;
      rotatingGroup.add(tire);

      // 2. Wheel Rim Outer Barrel
      const barrelGeo = new THREE.CylinderGeometry(wheelRadius * 0.78, wheelRadius * 0.78, tireWidth + 0.01, 24, 1, true);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, this.rimMat);
      rotatingGroup.add(barrel);

      // 3. Model-Tailored Rim Architecture
      this.buildRimSpokes(rotatingGroup, wheelRadius, p.isLeft);

      // 4. Center Nut / Hub Cap
      const hubNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.95, roughness: 0.1 })
      );
      hubNut.rotation.z = Math.PI / 2;
      hubNut.position.x = p.isLeft ? -tireWidth / 2 - 0.02 : tireWidth / 2 + 0.02;
      rotatingGroup.add(hubNut);

      wheelUnit.add(rotatingGroup);

      // Stationary Brake Assembly (Does NOT rotate with wheel)
      const brakeAssembly = new THREE.Group();

      // Slotted Carbon-Ceramic Rotor
      const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.035, 24);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeo, this.rotorMat);
      brakeAssembly.add(rotor);

      // Multi-piston Caliper
      const caliperGeo = new THREE.BoxGeometry(0.12, 0.18, 0.14);
      const caliper = new THREE.Mesh(caliperGeo, this.caliperMat);
      caliper.position.set(p.isLeft ? -0.05 : 0.05, wheelRadius * 0.42, 0.05);
      caliper.castShadow = true;
      brakeAssembly.add(caliper);

      wheelUnit.add(brakeAssembly);

      this.wheelGroup.add(wheelUnit);
      this.wheels.push({ unit: wheelUnit, rotating: rotatingGroup });
    });
  }

  buildRimSpokes(group, radius, isLeft) {
    const rimType = this.currentWheelType;
    const rimRadius = radius * 0.76;
    const faceX = isLeft ? -0.12 : 0.12;

    if (rimType === 'aero_blade') {
      // 5-Spoke Forged Carbon Aero-Blades
      const spokeCount = 5;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(0.03, rimRadius, 0.08);
        const spoke = new THREE.Mesh(spokeGeo, this.carbonMat);
        spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
        spoke.rotation.x = -angle;
        spoke.rotation.y = 0.15; // Aero twisted blade angle
        group.add(spoke);
      }
    } else if (rimType === 'turbine') {
      // 10-Spoke Diamond-Cut Directional Turbine Blades
      const spokeCount = 10;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(0.02, rimRadius, 0.04);
        const spoke = new THREE.Mesh(spokeGeo, this.rimMat);
        spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
        spoke.rotation.x = -angle + 0.25;
        group.add(spoke);
      }
    } else if (rimType === 'hex_forged') {
      // 8-Spoke Heavy-Duty Geometric Hexagonal Forged Rims
      const spokeCount = 8;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(0.04, rimRadius, 0.06);
        const spoke = new THREE.Mesh(spokeGeo, this.rimMat);
        spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
        spoke.rotation.x = -angle;
        group.add(spoke);
      }
    } else {
      // Monoblock Center-Lock Racing Spoke
      const spokeCount = 12;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.CylinderGeometry(0.012, 0.012, rimRadius, 8);
        const spoke = new THREE.Mesh(spokeGeo, this.rimMat);
        spoke.position.set(faceX, Math.cos(angle) * (rimRadius * 0.5), Math.sin(angle) * (rimRadius * 0.5));
        spoke.rotation.x = -angle;
        group.add(spoke);
      }
    }
  }

  // --- CHASSIS & POWERTRAIN CUTAWAY (X-RAY MODE) ---
  buildChassis() {
    // 1. Carbon Monocoque Structural Safety Tub
    const tubGeo = new THREE.BoxGeometry(1.6, 0.7, 2.6);
    const tub = new THREE.Mesh(tubGeo, this.xRayBoneMat);
    tub.position.set(0, 0.6, 0);
    this.chassisGroup.add(tub);

    // 2. 800V High-Density Floor Battery Pack
    const batGeo = new THREE.BoxGeometry(1.4, 0.14, 2.2);
    const battery = new THREE.Mesh(batGeo, this.batteryMat);
    battery.position.set(0, 0.24, 0);
    this.chassisGroup.add(battery);

    // Battery individual modular cell partitions
    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const barGeo = new THREE.BoxGeometry(1.35, 0.08, 0.03);
      const bar = new THREE.Mesh(barGeo, this.carbonMat);
      bar.position.set(0, 0.28, i);
      this.chassisGroup.add(bar);
    }

    // 3. Dual Electric Drive Motors (Front & Rear)
    [1.4, -1.4].forEach((z, idx) => {
      const motorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
      motorGeo.rotateZ(Math.PI / 2);
      const motor = new THREE.Mesh(motorGeo, this.xRayBoneMat);
      motor.position.set(0, 0.36, z);
      this.chassisGroup.add(motor);

      // High-voltage copper power conduit
      const conduitGeo = new THREE.CylinderGeometry(0.02, 0.02, Math.abs(z), 8);
      const conduit = new THREE.Mesh(
        conduitGeo,
        new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff7700, emissiveIntensity: 1.5 })
      );
      conduit.position.set(0.25, 0.32, z * 0.5);
      conduit.rotation.x = Math.PI / 2;
      this.chassisGroup.add(conduit);
    });

    // 4. Pushrod Double-Wishbone Suspension Arms
    [-0.85, 0.85].forEach((x) => {
      [1.4, -1.4].forEach((z) => {
        const wishboneGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35);
        const wishbone = new THREE.Mesh(wishboneGeo, this.xRayBoneMat);
        wishbone.position.set(x * 0.8, 0.45, z);
        wishbone.rotation.z = x < 0 ? -0.5 : 0.5;
        this.chassisGroup.add(wishbone);
      });
    });

    this.chassisGroup.visible = false;
  }

  // --- INTERACTION & CONFIGURATION METHODS ---
  setModel(type) {
    this.currentModelType = type;
    // Set matching default wheels
    if (type === 'apex_gt') this.currentWheelType = 'aero_blade';
    else if (type === 'spectre_gt') this.currentWheelType = 'turbine';
    else if (type === 'cyber_suv') this.currentWheelType = 'hex_forged';
    else if (type === 'mach_iv') this.currentWheelType = 'center_lock';

    this.buildCurrentCar();
  }

  setPaintColor(hex) {
    this.currentColor = hex;
    this.paintMat.color.set(hex);
  }

  setWheelType(type) {
    this.currentWheelType = type;
    this.buildWheels();
  }

  setCaliperColor(hex) {
    this.currentCaliperColor = hex;
    this.caliperMat.color.set(hex);
  }

  setXRay(enabled) {
    this.isXRayMode = enabled;
    this.chassisGroup.visible = enabled;
    if (enabled) {
      this.paintMat.transparent = true;
      this.paintMat.opacity = 0.22;
      this.paintMat.wireframe = false;
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
      // Rotation on X axis
      this.activeWing.rotation.x = (degrees * Math.PI) / 180;
    }
  }

  update(time, delta, speedRatio = 1.0) {
    // Rotate wheels based on simulated road velocity
    const rotationSpeed = delta * 18.0 * speedRatio;
    this.wheels.forEach((w) => {
      w.rotating.rotation.x += rotationSpeed;
    });

    // Slight dynamic steering oscillation for realism
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = Math.sin(time * 1.5) * 0.08;
    }
  }
}
