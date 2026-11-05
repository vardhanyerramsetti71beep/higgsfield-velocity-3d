import * as THREE from 'three';

export class Aerodynamics {
  constructor() {
    this.group = new THREE.Group();
    this.windSpeed = 240; // km/h
    this.wingAngle = 18; // degrees
    this.streamlines = [];
    this.visible = true;

    this.initStreamlines();
  }

  initStreamlines() {
    const streamlineCount = 120;
    const pointsPerLine = 40;

    this.linesData = [];

    // Create instanced or individual buffer geometry lines
    for (let i = 0; i < streamlineCount; i++) {
      // Stratified lane positions around the car
      const laneX = (Math.random() - 0.5) * 1.9;
      const startY = 0.2 + Math.random() * 1.4;
      const startZ = 4.5 + Math.random() * 0.8;
      const speed = 0.8 + Math.random() * 0.4;

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsPerLine * 3);
      const colors = new Float32Array(pointsPerLine * 3);

      for (let j = 0; j < pointsPerLine; j++) {
        positions[j * 3] = laneX;
        positions[j * 3 + 1] = startY;
        positions[j * 3 + 2] = startZ - (j * 0.22);

        // Gradient from cyan to purple
        colors[j * 3] = 0.0;
        colors[j * 3 + 1] = 0.9;
        colors[j * 3 + 2] = 1.0;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        linewidth: 1.5
      });

      const line = new THREE.Line(geometry, material);
      this.group.add(line);

      this.linesData.push({
        line,
        laneX,
        startY,
        startZ,
        speed,
        progress: Math.random() * 10
      });
    }
  }

  // Aerodynamic curve contour fitting the car geometry
  sampleAeroHeight(x, z, wingAngleRad) {
    // Nose / Hood (z from 3.0 to 1.0)
    if (z > 1.2) {
      const t = (3.2 - z) / 2.0;
      return 0.35 + Math.sin(t * Math.PI * 0.5) * 0.45;
    }
    // Windshield & Roof (z from 1.2 to -0.6)
    else if (z > -0.6) {
      const t = (1.2 - z) / 1.8;
      const roofPeak = 1.22;
      return 0.8 + Math.sin(t * Math.PI) * (roofPeak - 0.8);
    }
    // Rear Deck & Active Wing (z from -0.6 to -2.6)
    else {
      const t = (-0.6 - z) / 2.0;
      const baseH = 1.1 - t * 0.35;
      if (z < -1.8 && Math.abs(x) < 0.85) {
        // Influence of active rear wing flap
        return baseH + Math.sin(wingAngleRad) * 0.25;
      }
      return baseH;
    }
  }

  setWingAngle(degrees) {
    this.wingAngle = degrees;
  }

  setWindSpeed(speedKmH) {
    this.windSpeed = speedKmH;
  }

  getTelemetry() {
    const v = this.windSpeed;
    const angle = this.wingAngle;
    // Aerodynamic calculations based on speed and wing flap inclination
    const vMps = v / 3.6;
    const rho = 1.225; // air density kg/m3
    const frontalArea = 1.95; // m2
    const baseCd = 0.198;
    const activeCd = baseCd + (angle / 35) * 0.12;
    const downforceKg = Math.round(0.5 * rho * Math.pow(vMps, 2) * (1.1 + (angle / 35) * 1.8) * frontalArea * 0.10197);
    const dragKg = Math.round(0.5 * rho * Math.pow(vMps, 2) * activeCd * frontalArea * 0.10197);

    return {
      windSpeed: Math.round(v),
      wingAngle: Math.round(angle),
      dragCoeff: activeCd.toFixed(3),
      downforceKg,
      dragKg,
      aeroEfficiency: (downforceKg / Math.max(dragKg, 1)).toFixed(2)
    };
  }

  update(delta) {
    if (!this.group.visible) return;

    const wingAngleRad = (this.wingAngle * Math.PI) / 180;
    const speedMultiplier = (this.windSpeed / 200) * 8.0;

    for (let i = 0; i < this.linesData.length; i++) {
      const d = this.linesData[i];
      d.progress += delta * speedMultiplier * d.speed;

      const pos = d.line.geometry.attributes.position.array;
      const col = d.line.geometry.attributes.color.array;
      const len = pos.length / 3;

      for (let j = 0; j < len; j++) {
        const offsetZ = (j * 0.24);
        const z = d.startZ - ((d.progress + offsetZ) % 8.5) + 3.0;
        const x = d.laneX * (1.0 + (z < -1.0 ? 0.35 : 0.05)); // vortex dispersion at tail
        const y = this.sampleAeroHeight(x, z, wingAngleRad) + (d.startY * 0.25);

        pos[j * 3] = x;
        pos[j * 3 + 1] = y;
        pos[j * 3 + 2] = z;

        // Dynamic color by region / pressure
        if (z > 2.0) {
          // Front nose compression zone (amber/coral)
          col[j * 3] = 1.0;
          col[j * 3 + 1] = 0.4;
          col[j * 3 + 2] = 0.1;
        } else if (z < -1.8) {
          // Rear downforce / vortex trail (magenta/electric purple)
          col[j * 3] = 0.9;
          col[j * 3 + 1] = 0.1;
          col[j * 3 + 2] = 0.9;
        } else {
          // Laminar high-velocity roof flow (cyan)
          col[j * 3] = 0.0;
          col[j * 3 + 1] = 0.85;
          col[j * 3 + 2] = 1.0;
        }
      }

      d.line.geometry.attributes.position.needsUpdate = true;
      d.line.geometry.attributes.color.needsUpdate = true;
    }
  }
}
