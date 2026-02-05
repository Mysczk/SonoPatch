import { getAudioContext } from "../context";

export type PassFilterType = "lowpass" | "highpass";

export class PassFilterNode {
  readonly id = crypto.randomUUID();
  readonly label = "Filter";

  private filter: BiquadFilterNode;
  private enabled = true;
  private type: PassFilterType = "lowpass";
  private frequency = 1000;
  private q = 1;

  constructor() {
    const ctx = getAudioContext();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = this.type;
    this.filter.frequency.value = this.frequency;
    this.filter.Q.value = this.q;
  }

  /* PATCH IO */
  getInput(): AudioNode {
    return this.filter;
  }

  getOutput(): AudioNode {
    return this.filter;
  }

  /* STATE */
  setEnabled(on: boolean): void {
    this.enabled = on;
    this.filter.frequency.value = on ? this.frequency : 22050;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setType(type: PassFilterType): void {
    this.type = type;
    this.filter.type = type;
  }

  getType(): PassFilterType {
    return this.type;
  }

  setFrequency(hz: number): void {
    this.frequency = hz;
    if (this.enabled) {
      this.filter.frequency.setTargetAtTime(
        hz,
        getAudioContext().currentTime,
        0.01
      );
    }
  }

  getFrequency(): number {
    return this.frequency;
  }

  setQ(q: number): void {
    this.q = q;
    this.filter.Q.setTargetAtTime(
      q,
      getAudioContext().currentTime,
      0.01
    );
  }

  getQ(): number {
    return this.q;
  }
}
