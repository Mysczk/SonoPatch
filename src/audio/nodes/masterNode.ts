// src/audio/nodes/masterNode.ts
import { getAudioContext } from "../context";

export class MasterNode {
  private gainNode: GainNode;
  private isMuted = false;

  constructor() {
    const ctx = getAudioContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(ctx.destination);
  }

  get input() {
    return this.gainNode;
  }

  mute() {
    this.isMuted = true;
    this.gainNode.gain.value = 0;
  }

  unmute() {
    this.isMuted = false;
    this.gainNode.gain.value = 1;
  }

  toggle() {
    this.isMuted ? this.unmute() : this.mute();
  }
}
