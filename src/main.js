import { Engine } from './scene/Engine.js';
import { sound } from './scene/SoundEngine.js';
import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  const engine = new Engine(container);

  // --- STATE ---
  let currentModel = 'apex_gt';
  let isXRay = false;
  let isOrbit = false;
  let soundActive = false;

  // --- SOUND TOGGLE ---
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    soundActive = sound.toggle();
    soundBtn.style.color = soundActive ? 'var(--primary-cyan)' : 'var(--text-main)';
    soundBtn.style.borderColor = soundActive ? 'var(--primary-cyan)' : 'var(--border-subtle)';
  });

  // Motor rev sound button
  const revBtn = document.getElementById('btn-rev-sound');
  if (revBtn) {
    revBtn.addEventListener('click', () => {
      sound.playThrottleBlip();
    });
  }

  // --- MODEL SWITCHING ---
  const modelPills = document.querySelectorAll('.model-pill');
  const carCards = document.querySelectorAll('.car-card');
  const resModelSelect = document.getElementById('res-model');

  // --- MODEL SPECS DICTIONARY (MATCHED TO REFERENCE IMAGES) ---
  const modelSpecs = {
    lamborghini_aventador: { speed: '355', zero: '2.80', power: '770', cd: '0.230' },
    porsche_taycan: { speed: '260', zero: '2.60', power: '750', cd: '0.220' },
    aston_martin_dbx: { speed: '310', zero: '3.10', power: '707', cd: '0.360' },
    jaguar_ftype_roadster: { speed: '300', zero: '3.50', power: '575', cd: '0.320' },
    rolls_royce_phantom: { speed: '250', zero: '5.10', power: '563', cd: '0.380' },
    mercedes_s_class: { speed: '250', zero: '4.40', power: '503', cd: '0.220' },
    toyota_tundra: { speed: '180', zero: '5.70', power: '437', cd: '0.420' }
  };

  const statSpeed = document.getElementById('hero-stat-speed');
  const statZero = document.getElementById('hero-stat-zero');
  const statPower = document.getElementById('hero-stat-power');
  const statCd = document.getElementById('hero-stat-cd');

  function switchModel(modelId) {
    currentModel = modelId;
    engine.carModel.setModel(modelId);
    sound.playClick(900, 0.04);
    sound.playThrottleBlip();

    // Update bottom HUD pills
    modelPills.forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.model === modelId);
    });

    // Update fleet showcase cards
    carCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.model === modelId);
    });

    // Update hero telemetry stats
    const sp = modelSpecs[modelId];
    if (sp) {
      if (statSpeed) statSpeed.innerHTML = `${sp.speed}<span class="stat-unit">KM/H</span>`;
      if (statZero) statZero.innerHTML = `${sp.zero}<span class="stat-unit">SEC</span>`;
      if (statPower) statPower.innerHTML = `${sp.power}<span class="stat-unit">HP</span>`;
      if (statCd) statCd.innerHTML = `${sp.cd}<span class="stat-unit">Cd</span>`;
    }

    // Sync reservation select
    if (resModelSelect) {
      resModelSelect.value = modelId;
    }
  }

  modelPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      switchModel(pill.dataset.model);
    });
  });

  carCards.forEach((card) => {
    card.addEventListener('click', () => {
      switchModel(card.dataset.model);
    });
  });

  // --- SCROLL DRIVEN CINEMATIC CAMERA ---
  const sections = [
    { id: 'hero', preset: 'hero' },
    { id: 'aerodynamics', preset: 'aero' },
    { id: 'chassis', preset: 'xray' },
    { id: 'cockpit', preset: 'interior' },
    { id: 'wheels', preset: 'wheels' },
    { id: 'models', preset: 'hero' },
    { id: 'configurator', preset: 'configurator' },
    { id: 'reviews', preset: 'hero' }
  ];

  const navLinks = document.querySelectorAll('.nav-link');

  function onScroll() {
    if (isOrbit) return;

    const scrollY = window.scrollY;
    const windowH = window.innerHeight;

    // Find section in view
    let activeIndex = 0;
    sections.forEach((sec, idx) => {
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop - windowH * 0.45;
        if (scrollY >= top) {
          activeIndex = idx;
        }
      }
    });

    // Interpolate camera between active section and next
    const currentSec = sections[activeIndex];
    const nextSec = sections[Math.min(activeIndex + 1, sections.length - 1)];

    const curEl = document.getElementById(currentSec.id);
    const nextEl = document.getElementById(nextSec.id);

    if (curEl && nextEl && activeIndex < sections.length - 1) {
      const start = curEl.offsetTop;
      const end = nextEl.offsetTop;
      const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
      engine.interpolateCamera(currentSec.preset, nextSec.preset, progress);
    } else {
      engine.setCameraPreset(currentSec.preset);
    }

    // Auto-toggle X-Ray mode in chassis section
    if (currentSec.id === 'chassis' && !isXRay) {
      toggleXRay(true);
    } else if (currentSec.id !== 'chassis' && isXRay) {
      toggleXRay(false);
    }

    // Update nav links active class
    navLinks.forEach((link) => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === currentSec.id);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- AERODYNAMICS CONTROLS ---
  const sliderWind = document.getElementById('slider-wind-speed');
  const sliderWing = document.getElementById('slider-wing-angle');
  const labelWind = document.getElementById('label-wind-speed');
  const labelWing = document.getElementById('label-wing-angle');
  const valDrag = document.getElementById('val-drag-coeff');
  const valDownforce = document.getElementById('val-downforce');
  const valAeroRatio = document.getElementById('val-aero-ratio');

  function updateAeroTelemetry() {
    const windVal = parseFloat(sliderWind.value);
    const wingVal = parseFloat(sliderWing.value);

    engine.aerodynamics.setWindSpeed(windVal);
    engine.aerodynamics.setWingAngle(wingVal);
    engine.carModel.setWingAngle(wingVal);

    labelWind.textContent = `${windVal} KM/H`;
    labelWing.textContent = `${wingVal}°`;

    const tele = engine.aerodynamics.getTelemetry();
    valDrag.textContent = tele.dragCoeff;
    valDownforce.textContent = `${tele.downforceKg} KG`;
    valAeroRatio.textContent = `${tele.aeroEfficiency}:1`;

    sound.setWindIntensity(windVal / 360);
  }

  if (sliderWind && sliderWing) {
    sliderWind.addEventListener('input', updateAeroTelemetry);
    sliderWing.addEventListener('input', updateAeroTelemetry);
    updateAeroTelemetry();
  }

  // Wind Tunnel toggle button in HUD
  const hudAeroToggle = document.getElementById('hud-aero-toggle');
  let aeroVisible = true;
  hudAeroToggle.addEventListener('click', () => {
    aeroVisible = !aeroVisible;
    engine.aerodynamics.group.visible = aeroVisible;
    hudAeroToggle.classList.toggle('active', aeroVisible);
    sound.playClick(650, 0.03);
  });

  // --- CHASSIS X-RAY CUTAWAY ---
  function toggleXRay(state = null) {
    isXRay = state !== null ? state : !isXRay;
    engine.carModel.setXRay(isXRay);
    const hudXRay = document.getElementById('hud-xray-toggle');
    if (hudXRay) hudXRay.classList.toggle('active', isXRay);
    sound.playClick(isXRay ? 720 : 520, 0.04);
  }

  const hudXRayBtn = document.getElementById('hud-xray-toggle');
  if (hudXRayBtn) hudXRayBtn.addEventListener('click', () => toggleXRay());

  const btnXRay = document.getElementById('btn-toggle-xray');
  if (btnXRay) btnXRay.addEventListener('click', () => toggleXRay());

  // --- FREE 360° ORBIT MODE ---
  const hudOrbitBtn = document.getElementById('hud-orbit-toggle');
  function toggleOrbit(enabled = null) {
    isOrbit = enabled !== null ? enabled : !isOrbit;
    engine.setControlMode(isOrbit ? 'orbit' : 'scroll');
    hudOrbitBtn.classList.toggle('active', isOrbit);
    container.classList.toggle('interactive', isOrbit);
    sound.playClick(isOrbit ? 800 : 450, 0.03);
    if (!isOrbit) {
      onScroll();
    }
  }

  hudOrbitBtn.addEventListener('click', () => toggleOrbit());

  // Auto-enable orbit mode when hovering or focusing in configurator section
  const configSection = document.getElementById('configurator');
  if (configSection) {
    configSection.addEventListener('mouseenter', () => {
      container.classList.add('interactive');
      engine.setControlMode('orbit');
      isOrbit = true;
      hudOrbitBtn.classList.add('active');
    });
  }

  // --- CABIN MICRO-CLIMATE TOGGLE ---
  const btnCool = document.getElementById('btn-climate-cool');
  const btnWarm = document.getElementById('btn-climate-warm');

  if (btnCool && btnWarm) {
    btnCool.addEventListener('click', () => {
      btnCool.classList.add('active');
      btnWarm.classList.remove('active');
      engine.interiorView.setClimateMode('cool');
      sound.playVentWhoosh(false);
    });

    btnWarm.addEventListener('click', () => {
      btnWarm.classList.add('active');
      btnCool.classList.remove('active');
      engine.interiorView.setClimateMode('warm');
      sound.playVentWhoosh(true);
    });
  }

  // --- WHEEL ARCHITECTURE CARDS ---
  const wheelCards = document.querySelectorAll('.wheel-type-card');
  wheelCards.forEach((card) => {
    card.addEventListener('click', () => {
      wheelCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const wheelType = card.dataset.wheel;
      engine.carModel.setWheelType(wheelType);
      sound.playClick(850, 0.04);
    });
  });

  // --- 3D CONFIGURATOR COLOR SWATCHES ---
  const colorSwatches = document.querySelectorAll('[data-color]');
  const selectedColorLabel = document.getElementById('selected-color-name');

  colorSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      const hex = parseInt(swatch.dataset.color, 16);
      engine.carModel.setPaintColor(hex);
      engine.lighting.setUnderGlowColor(hex);
      if (selectedColorLabel) {
        selectedColorLabel.textContent = swatch.dataset.name;
      }
      sound.playClick(950, 0.03);
    });
  });

  // Caliper swatches
  const caliperSwatches = document.querySelectorAll('[data-caliper]');
  const selectedCaliperLabel = document.getElementById('selected-caliper-name');

  caliperSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      caliperSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      const hex = parseInt(swatch.dataset.caliper, 16);
      engine.carModel.setCaliperColor(hex);
      if (selectedCaliperLabel) {
        selectedCaliperLabel.textContent = swatch.dataset.name;
      }
      sound.playClick(900, 0.03);
    });
  });

  // --- RESERVATION / TEST DRIVE MODAL ---
  const modal = document.getElementById('reserve-modal');
  const openModalBtn = document.getElementById('btn-open-reserve');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const saveSpecBtn = document.getElementById('btn-save-spec');
  const reservationForm = document.getElementById('reservation-form');

  function openModal() {
    modal.classList.add('open');
    sound.playClick(600, 0.05);
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (saveSpecBtn) saveSpecBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('res-name').value;
      const circuit = document.getElementById('res-circuit').value;

      // Celebrate with confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#00ffaa', '#ffaa00', '#ffffff']
      });

      sound.playClick(1100, 0.1);

      reservationForm.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(0, 255, 170, 0.15); border: 1px solid var(--primary-neon); color: var(--primary-neon); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
          <h4 style="font-family: var(--font-display); font-size: 1.5rem; color: #fff; margin-bottom: 8px;">ALLOCATION CONFIRMED</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
            Thank you, <strong>${name}</strong>. Your telemetry test drive at <strong>${circuit}</strong> has been prioritized. Our flight concierge will transmit your encrypted credentials within 2 hours.
          </p>
          <button id="btn-done-modal" class="btn-primary" style="margin-top: 24px;">Return to 3D Experience</button>
        </div>
      `;

      document.getElementById('btn-done-modal')?.addEventListener('click', closeModal);
    });
  }
});
