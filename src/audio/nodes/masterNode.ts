import { getAudioContext } from "../context";

export class MasterNode {
  private gainNode: GainNode;
  private active = false;

  constructor() {
    const ctx = getAudioContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(ctx.destination);
  }

  get input(): AudioNode {
    return this.gainNode;
  }

  activate(): void {
    this.active = true;
    this.gainNode.gain.setTargetAtTime(1, getAudioContext().currentTime, 0.01);
  }

  deactivate(): void {
    this.active = false;
    this.gainNode.gain.setTargetAtTime(0, getAudioContext().currentTime, 0.01);
  }

  toggle(): void {
    this.active ? this.deactivate() : this.activate();
  }

  isActive(): boolean {
    return this.active;
  }
}
