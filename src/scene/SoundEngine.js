// Web Audio API Synthesizer - Self-contained cinematic soundscape
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.engineGain = null;
    this.engineOsc = null;
    this.windGain = null;
    this.windSource = null;
    this.airGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
      this.setupEngineSynth();
      this.setupWindSynth();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  toggle() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbient();
      this.playClick(800, 0.05);
    } else {
      this.stopAmbient();
    }
    return this.enabled;
  }

  setupEngineSynth() {
    if (!this.ctx) return;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.engineGain.connect(this.ctx.destination);
  }

  setupWindSynth() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    this.windSource.start();
  }

  startAmbient() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(0.04, now, 0.5);
    }
  }

  stopAmbient() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(0, now, 0.2);
    }
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.2);
    }
  }

  setWindIntensity(ratio) {
    if (!this.enabled || !this.ctx || !this.windGain) return;
    const target = Math.min(Math.max(ratio * 0.08, 0.01), 0.12);
    this.windGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    if (this.windFilter) {
      this.windFilter.frequency.setTargetAtTime(200 + ratio * 600, this.ctx.currentTime, 0.1);
    }
  }

  playThrottleBlip() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playClick(freq = 600, duration = 0.04) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playVentWhoosh(isWarm = false) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isWarm ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isWarm ? 220 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(isWarm ? 180 : 330, now + 0.3);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const sound = new SoundEngine();
