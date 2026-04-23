import { getAudioContext } from "../context";
import type { PatchNode } from "./patchGraph";

const NOTES = [
  { name: "C", freq: 261.63 },
  { name: "D", freq: 293.66 },
  { name: "E", freq: 329.63 },
  { name: "F", freq: 349.23 },
  { name: "G", freq: 392.0 },
  { name: "A", freq: 440.0 },
  { name: "B", freq: 493.88 },
  { name: "C2", freq: 523.25 },
];

export class PianoNode implements PatchNode {
  readonly id = crypto.randomUUID();
  readonly label = "Piano";

  private gain: GainNode;

  constructor() {
    const ctx = getAudioContext();
    this.gain = ctx.createGain();
    this.gain.gain.value = 1;
  }

  getInput(): AudioNode {
    return this.gain;
  }

  getOutput(): AudioNode {
    return this.gain;
  }

  triggerNote(index: number) {
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    const note = NOTES[index];
    if (!note) return;

    osc.frequency.value = note.freq;
    osc.type = "sine";

    osc.connect(g);
    g.connect(this.gain);

    // envelope
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
}