import { getAudioContext } from "../context";
import type { PatchNode } from "./patchGraph";

export class MasterNode implements PatchNode {
  readonly id = crypto.randomUUID();
  readonly label = "Master";

  private gainNode: GainNode;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array<ArrayBuffer>;
  private active = false;

  constructor() {
    const ctx = getAudioContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 32768;

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.gainNode.connect(ctx.destination);
    this.gainNode.connect(this.analyser);
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
 
  getAnalyserData(): Uint8Array {
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }
}