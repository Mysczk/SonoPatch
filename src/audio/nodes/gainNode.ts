import { getAudioContext } from "../context";
import type { PatchNode } from "./patchGraph";

export class GainNodeCustom implements PatchNode {
  readonly id = crypto.randomUUID();
  readonly label = "Gain";

  private gainNode: GainNode;
  private gain = 1;

  constructor() {
    const ctx = getAudioContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.gain;
  }

  getInput(): AudioNode {
    return this.gainNode;
  }

  getOutput(): AudioNode {
    return this.gainNode;
  }

  setGain(v: number): void {
    this.gain = v;
    this.gainNode.gain.setTargetAtTime(
      v,
      getAudioContext().currentTime,
      0.01
    );
  }

  getGain(): number {
    return this.gain;
  }
}