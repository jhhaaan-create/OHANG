import { ElementType } from '@/lib/constants/archetypes';

// ═══════════════════════════════════════════════════════
// OHANG Elemental Synthesizer
// Real-time Web Audio Synthesis (No MP3s, Pure Math)
// ═══════════════════════════════════════════════════════

class AmbientEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isInitialized = false;

    // 1. Initialize Context (Must call on User Click)
    public init() {
        if (this.isInitialized) return;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.0; // Start silent
        this.masterGain.connect(this.ctx.destination);

        this.isInitialized = true;
    }

    // 2. Resume Context (Bypass Autoplay Policy)
    public resume() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 3. Play Elemental Sound
    public play(element: ElementType) {
        if (!this.ctx || !this.masterGain) return;

        const t = this.ctx.currentTime;
        const duration = 10; // Play for 10 seconds then fade out

        // Fade In
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setValueAtTime(0, t);
        this.masterGain.gain.linearRampToValueAtTime(0.15, t + 2); // 15% Volume

        switch (element) {
            case 'Metal': // Singing Bowl (FM Synthesis)
                this.synthBowl(t, 528, duration); // C5 (DNA Repair Freq)
                break;
            case 'Fire': // Crackling Fire (Brown Noise + Impulses)
                this.synthNoise(t, 'brown', duration, 'highpass', 400);
                this.synthCrackle(t, duration);
                break;
            case 'Earth': // Deep Rumble (Brown Noise + Sub Bass)
                this.synthNoise(t, 'brown', duration, 'lowpass', 100);
                this.synthOsc(t, 60, 'sine', duration, 0.3); // Sub-bass
                break;
            case 'Water': // Ocean Waves (Pink Noise + LFO Filter)
                this.synthNoise(t, 'pink', duration, 'lowpass', 600, true);
                break;
            case 'Wood': // Forest Wind (Pink Noise + Highpass)
                this.synthNoise(t, 'pink', duration, 'highpass', 400, true);
                break;
        }

        // Auto Fade Out (Battery Saving)
        this.masterGain.gain.setValueAtTime(0.15, t + duration - 2);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    }

    // ── Synthesis Primitives ──

    private synthOsc(t: number, freq: number, type: OscillatorType, dur: number, vol: number = 1) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + dur);
    }

    private synthBowl(t: number, freq: number, dur: number) {
        // Fundamental + Harmonics
        this.synthOsc(t, freq, 'sine', dur, 0.8);
        this.synthOsc(t, freq * 1.5, 'sine', dur, 0.3); // Harmonic

        // Modulation for "Beating" effect
        const lfo = this.ctx!.createOscillator();
        lfo.frequency.value = 2; // 2Hz Wobble
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        // Note: Complex routing omitted for tree-shaking simplicity, using detune instead
        this.synthOsc(t, freq + 4, 'sine', dur, 0.4); // Detuned layer
    }

    private synthNoise(t: number, type: 'white' | 'pink' | 'brown', dur: number, filterType: BiquadFilterType, filterFreq: number, lfo = false) {
        const bufferSize = this.ctx!.sampleRate * dur;
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);

        // Simple Noise Generation
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'brown') {
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            } else {
                data[i] = white; // Simplification for Pink/White
            }
        }

        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx!.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;

        // LFO for movement (Wind/Waves)
        if (lfo) {
            // Since we can't easily connect LFO to AudioParam in this simple class without node management,
            // we use a linear ramp for a simple "gust" effect
            filter.frequency.setValueAtTime(filterFreq, t);
            filter.frequency.linearRampToValueAtTime(filterFreq + 300, t + (dur / 2));
            filter.frequency.linearRampToValueAtTime(filterFreq, t + dur);
        }

        noise.connect(filter);
        filter.connect(this.masterGain!);
        noise.start(t);
    }

    private synthCrackle(t: number, dur: number) {
        // Random high frequency bursts
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        filter.connect(this.masterGain!);

        for (let i = 0; i < 20; i++) {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            const start = t + (Math.random() * dur);

            osc.frequency.value = 100 + Math.random() * 200;
            gain.gain.setValueAtTime(0.5, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

            osc.connect(gain);
            gain.connect(filter);
            osc.start(start);
            osc.stop(start + 0.1);
        }
    }
}

// Singleton Export
export const ambientSound = new AmbientEngine();
