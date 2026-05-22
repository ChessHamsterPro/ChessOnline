/**
 * Obsidian Chess - Real-time Sound Synthesizer (Classic Global Script)
 * Uses the Web Audio API to create authentic wood/metallic sounding chess effects.
 */

class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    /**
     * Lazy initialize the AudioContext to comply with browser autoplay policies.
     */
    initContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Synthesizes a wood block tap for standard moves.
     */
    playMove() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        const time = this.ctx.currentTime;
        
        // Primary wooden resonance
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, time);
        // Exponential pitch decay (mimicking impact)
        osc.frequency.exponentialRampToValueAtTime(120, time + 0.08);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.start(time);
        osc.stop(time + 0.09);

        // Friction noise (adding tactile realism)
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // Generate tiny white noise buffer
        const bufferSize = this.ctx.sampleRate * 0.02; // 20ms burst
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        noise.buffer = buffer;
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 3.0;

        noiseGain.gain.setValueAtTime(0.12, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        noise.start(time);
        noise.stop(time + 0.03);
    }

    /**
     * Synthesizes a sharper impact for piece captures.
     */
    playCapture() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        const time = this.ctx.currentTime;

        // Wooden tap (slightly higher pitch, louder)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.12);

        gain.gain.setValueAtTime(0.55, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.start(time);
        osc.stop(time + 0.13);

        // High frequency transient (pieces clacking)
        const clackOsc = this.ctx.createOscillator();
        const clackGain = this.ctx.createGain();
        clackOsc.connect(clackGain);
        clackGain.connect(this.ctx.destination);

        clackOsc.type = 'sine';
        clackOsc.frequency.setValueAtTime(1800, time);
        clackOsc.frequency.exponentialRampToValueAtTime(800, time + 0.03);

        clackGain.gain.setValueAtTime(0.15, time);
        clackGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        clackOsc.start(time);
        clackOsc.stop(time + 0.04);
    }

    /**
     * Synthesizes an elegant resonant two-tone chime for checking.
     */
    playCheck() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        const time = this.ctx.currentTime;
        const duration = 0.8;

        const chords = [523.25, 659.25]; // C5 and E5 (warm major third interval)
        chords.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            // Subtle vibrato/tremolo
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 6; // 6Hz
            lfoGain.gain.value = 10; // Vibrato depth in Hz
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            gain.gain.setValueAtTime(idx === 0 ? 0.25 : 0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            lfo.start(time);
            osc.start(time);
            lfo.stop(time + duration);
            osc.stop(time + duration);
        });
    }

    /**
     * Synthesizes a sweeping ambient chord based on the outcome.
     * Major chord for victory, Minor chord for defeat/draw.
     */
    playGameOver(win) {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        const time = this.ctx.currentTime;
        const duration = 2.5;

        // Frequencies for major (win) or minor (loss/draw) chord
        const freqs = win 
            ? [261.63, 329.63, 392.00, 523.25] // C4, E4, G4, C5 (C Major)
            : [220.00, 261.63, 329.63, 440.00]; // A3, C4, E4, A4 (A minor)

        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, time);
            filter.frequency.exponentialRampToValueAtTime(1200, time + 1.2);

            // Stagger node starts slightly for an arpeggiated sweep
            const delay = idx * 0.08;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.08, time + delay + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.start(time + delay);
            osc.stop(time + duration);
        });
    }

    /**
     * Toggle sound active state.
     */
    toggle(state) {
        this.enabled = state;
        if (state) {
            this.initContext();
        }
    }
}

// Bind to window global
window.sounds = new SoundSynthesizer();
