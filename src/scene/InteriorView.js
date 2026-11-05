import * as THREE from 'three';

export class InteriorView {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 384;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;

    this.speed = 0;
    this.targetSpeed = 284;
    this.rpm = 4200;
    this.gear = 6;
    this.mode = 'TRACK AERO';
    this.tempMode = 'cool'; // 'cool' (18.5C) or 'warm' (24.0C)
    this.temp = 18.5;
    this.fanSpeed = 3;

    // AC stream particle group
    this.ventParticleGroup = new THREE.Group();
    this.ventParticles = [];
    this.createVentParticles();

    this.lastRenderTime = 0;
  }

  createVentParticles() {
    // 3 vent origins: Left, Center-Left, Center-Right, Right
    const ventOrigins = [
      new THREE.Vector3(-0.45, 0.72, 0.28),
      new THREE.Vector3(-0.15, 0.72, 0.32),
      new THREE.Vector3(0.15, 0.72, 0.32),
      new THREE.Vector3(0.45, 0.72, 0.28)
    ];

    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    this.particleData = [];

    for (let i = 0; i < particleCount; i++) {
      const originIndex = i % ventOrigins.length;
      const origin = ventOrigins[originIndex];
      const p = {
        origin: origin.clone(),
        x: origin.x + (Math.random() - 0.5) * 0.05,
        y: origin.y + (Math.random() - 0.5) * 0.04,
        z: origin.z - Math.random() * 0.7,
        vx: (origin.x < 0 ? -1 : 1) * 0.003 * Math.random(),
        vy: -0.001 + (Math.random() - 0.5) * 0.002,
        vz: -0.015 - Math.random() * 0.02,
        life: Math.random(),
        maxLife: 1.0,
        originIndex
      };
      this.particleData.push(p);

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 1.0;
      opacities[i] = 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleMesh = new THREE.Points(geometry, material);
    this.ventParticleGroup.add(this.particleMesh);
  }

  setClimateMode(mode) {
    this.tempMode = mode;
    this.temp = mode === 'cool' ? 18.5 : 24.5;
  }

  update(time, delta) {
    // Smooth speed oscillation for dynamic feeling
    this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed + Math.sin(time * 2) * 8, delta * 2);
    this.rpm = THREE.MathUtils.lerp(this.rpm, 8600 + Math.sin(time * 3) * 450, delta * 3);

    // Update Infodynamic Display Canvas
    this.drawDisplay(time);
    this.texture.needsUpdate = true;

    // Update AC Particle Stream
    this.updateVentParticles(time, delta);
  }

  updateVentParticles(time, delta) {
    if (!this.particleMesh) return;
    const positions = this.particleMesh.geometry.attributes.position.array;
    const colors = this.particleMesh.geometry.attributes.color.array;

    const isCool = this.tempMode === 'cool';
    const rTarget = isCool ? 0.05 : 1.0;
    const gTarget = isCool ? 0.78 : 0.45;
    const bTarget = isCool ? 1.0 : 0.05;

    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      p.life += delta * (0.8 + this.fanSpeed * 0.3);

      if (p.life >= p.maxLife) {
        p.life = 0;
        p.x = p.origin.x + (Math.random() - 0.5) * 0.04;
        p.y = p.origin.y + (Math.random() - 0.5) * 0.03;
        p.z = p.origin.z;
      }

      // Airflow curves back toward seats
      const progress = p.life / p.maxLife;
      p.z -= delta * (0.9 + this.fanSpeed * 0.4);
      p.y += Math.sin(progress * Math.PI) * 0.002;
      p.x += (p.origin.x * 0.3) * delta;

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      // Color tint
      colors[i * 3] = rTarget;
      colors[i * 3 + 1] = gTarget;
      colors[i * 3 + 2] = bTarget;
    }

    this.particleMesh.geometry.attributes.position.needsUpdate = true;
    this.particleMesh.geometry.attributes.color.needsUpdate = true;
  }

  drawDisplay(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background gradient - ultra deep obsidian
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#04070d');
    grad.addColorStop(0.5, '#080d16');
    grad.addColorStop(1, '#020509');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle carbon grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top status bar
    ctx.fillStyle = '#00f0ff';
    ctx.font = '600 14px "Space Grotesk", sans-serif';
    ctx.fillText('AETHER OS v4.2 // TELEMETRY ACTIVE', 30, 32);

    ctx.fillStyle = '#8e9cae';
    ctx.font = '500 13px sans-serif';
    ctx.fillText(`CABIN CLIMATE: ${this.temp.toFixed(1)}°C [${this.tempMode.toUpperCase()} STREAM]`, 420, 32);

    ctx.fillStyle = '#00ffaa';
    ctx.fillText('AERO FLAPS: ACTIVE DEPLOY', 800, 32);

    // Left Sector: G-Force Meter & Tire Pressures
    this.drawGForce(ctx, 160, 200, time);
    this.drawTireTelemetry(ctx, 60, 310);

    // Center Sector: Speedometer & Tachometer Arch
    this.drawSpeedometer(ctx, 512, 220, time);

    // Right Sector: Navigation & Battery / Energy Recuperation
    this.drawNavAndPower(ctx, 840, 200, time);

    // Outer neon glow bezel border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);
  }

  drawSpeedometer(ctx, cx, cy, time) {
    const radius = 110;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;

    // Track arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Active speed arc
    const speedRatio = Math.min(this.speed / 450, 1.0);
    const currentAngle = startAngle + (endAngle - startAngle) * speedRatio;

    const arcGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    arcGrad.addColorStop(0, '#00f0ff');
    arcGrad.addColorStop(0.7, '#00a3ff');
    arcGrad.addColorStop(1, '#ff0055');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, currentAngle);
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Numerical Speed
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 68px "Syne", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(this.speed).toString(), cx, cy + 18);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '700 14px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('KM / H', cx, cy + 44);

    // Gear indicator
    ctx.fillStyle = '#ffaa00';
    ctx.font = '700 24px monospace';
    ctx.fillText(`GEAR ${this.gear}`, cx, cy - 35);

    // Mode Pill
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(cx - 70, cy + 58, 140, 24);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(cx - 70, cy + 58, 140, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px sans-serif';
    ctx.fillText(this.mode, cx, cy + 74);
  }

  drawGForce(ctx, cx, cy, time) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a8b9e';
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.fillText('LATERAL ACCEL / G-METER', cx, cy - 80);

    // Concentric circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    [25, 50, 75].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy);
    ctx.lineTo(cx + 80, cy);
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx, cy + 80);
    ctx.stroke();

    // Inertia dot
    const gx = Math.sin(time * 2.5) * 35;
    const gy = Math.cos(time * 1.8) * 25;
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx + gx, cy + gy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px monospace';
    const gVal = (1.2 + Math.abs(gx * 0.02)).toFixed(2);
    ctx.fillText(`${gVal} G`, cx, cy + 105);
  }

  drawTireTelemetry(ctx, x, y) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ffaa';
    ctx.font = '500 11px monospace';
    ctx.fillText('TIRES: FL 2.3  |  FR 2.3 BAR (72°C)', x, y);
    ctx.fillText('       RL 2.4  |  RR 2.4 BAR (78°C)', x, y + 16);
  }

  drawNavAndPower(ctx, cx, cy, time) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a8b9e';
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.fillText('KERS ENERGY RECOVERY', cx, cy - 80);

    // Dual vertical power bars
    const barW = 28;
    const barH = 120;
    const leftX = cx - 35;
    const rightX = cx + 8;
    const topY = cy - 60;

    // Power Output
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(leftX, topY, barW, barH);
    const powerLevel = 0.75 + Math.sin(time * 2) * 0.15;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(leftX, topY + barH * (1 - powerLevel), barW, barH * powerLevel);

    // Regen Brake
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(rightX, topY, barW, barH);
    const regenLevel = 0.45 + Math.cos(time * 2.2) * 0.2;
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(rightX, topY + barH * (1 - regenLevel), barW, barH * regenLevel);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 10px monospace';
    ctx.fillText('PWR 84%', leftX + barW / 2, topY + barH + 16);
    ctx.fillText('RGN 45%', rightX + barW / 2, topY + barH + 16);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '700 13px "Space Grotesk", sans-serif';
    ctx.fillText('TORQUE VECTORING: ACTIVE', cx, topY + barH + 42);
  }
}
