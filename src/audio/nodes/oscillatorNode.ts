import { getAudioContext } from "../context";

export type OscWaveType = OscillatorType;

export class OscSource {
  readonly id = crypto.randomUUID();
  readonly label = "Osc";

  private osc: OscillatorNode | null = null;
  private gain: GainNode;

  private enabled = true;
  private frequency = 220;
  private volume = 0.2;
  private type: OscWaveType = "sine";

  constructor() {
    const ctx = getAudioContext();
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
  }

  /* PATCH IO */
  getInput(): AudioNode {
    return this.gain;
  }

  getOutput(): AudioNode {
    return this.gain;
  }

  /* STATE */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.stop();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setType(type: OscWaveType): void {
    this.type = type;
    if (this.osc) this.osc.type = type;
  }

  getType(): OscWaveType {
    return this.type;
  }

  setFrequency(hz: number): void {
    this.frequency = hz;
    if (this.osc) {
      this.osc.frequency.setTargetAtTime(
        hz,
        getAudioContext().currentTime,
        0.01
      );
    }
  }

  getFrequency(): number {
    return this.frequency;
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.osc) {
      this.gain.gain.setTargetAtTime(
        v,
        getAudioContext().currentTime,
        0.01
      );
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /* AUDIO */
  start(): void {
    if (!this.enabled || this.osc) return;

    const ctx = getAudioContext();
    const o = ctx.createOscillator();
    o.type = this.type;
    o.frequency.value = this.frequency;
    o.connect(this.gain);
    o.start();

    this.gain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.01);
    this.osc = o;
  }

  stop(): void {
    if (!this.osc) return;

    const ctx = getAudioContext();
    this.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    this.osc.stop(ctx.currentTime + 0.05);
    this.osc.disconnect();
    this.osc = null;
  }
}
