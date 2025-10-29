import { getAudioContext } from "../context";

export class OscSource {
  private osc: OscillatorNode | null = null;
  private gain: GainNode;

  constructor() {
    const ctx = getAudioContext();
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
  }

  connect(dest: AudioNode) {
    this.gain.connect(dest);
  }

  setFrequency(hz: number) {
    const ctx = getAudioContext();
    if (this.osc) {
      this.osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.01);
    }
  }

  start(hz = 220, type: OscillatorType = "sine") {
    if (this.osc) return;

    const ctx = getAudioContext();
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz;
    o.connect(this.gain);
    o.start();

    this.gain.gain.setTargetAtTime(0.2, ctx.currentTime, 0.01);

    this.osc = o;
  }

  stop() {
    if (!this.osc) return;

    const ctx = getAudioContext();
    this.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    this.osc.stop(ctx.currentTime + 0.05);
    this.osc.disconnect();
    this.osc = null;
  }
}
