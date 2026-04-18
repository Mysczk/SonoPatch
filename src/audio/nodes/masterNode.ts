import { getAudioContext } from "../context";
import type { PatchNode } from "./patchGraph";

export class MasterNode implements PatchNode {
  readonly id = crypto.randomUUID();
  readonly label = "Master";

  private gainNode: GainNode;
  private active = false;

  constructor() {
    const ctx = getAudioContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(ctx.destination);
  }

  getInput(): AudioNode {
    return this.gainNode;
  }

  getOutput(): AudioNode {
    return this.gainNode;
  }

  activate(): void {
    this.active = true;
    this.gainNode.gain.setTargetAtTime(
      1,
      getAudioContext().currentTime,
      0.01
    );
  }

  deactivate(): void {
    this.active = false;
    this.gainNode.gain.setTargetAtTime(
      0,
      getAudioContext().currentTime,
      0.6
    );
  }

  isActive(): boolean {
    return this.active;
  }
}