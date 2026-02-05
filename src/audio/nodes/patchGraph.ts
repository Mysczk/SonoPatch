import { MasterNode } from "./masterNode";

export interface PatchNode {
  id: string;
  label: string;
  getInput(): AudioNode;
  getOutput(): AudioNode;
  start?(): void;
  stop?(): void;
  disconnect?(): void;
}

export class PatchGraph {
  private nodes: PatchNode[] = [];
  private active = false;
  private master: MasterNode | null = null;

  add(node: PatchNode): void {
    this.nodes.push(node);
    if (this.active) node.start?.();
    if (this.active && this.master) this.rebuild();
  }

  remove(id: string): void {
    const i = this.nodes.findIndex(n => n.id === id);
    if (i === -1) return;

    const node = this.nodes[i];
    if (this.active) node.stop?.();

    // Try to disconnect the node to avoid dangling connections
    try {
      node.getOutput().disconnect();
    } catch {}
    try {
      node.getInput().disconnect();
    } catch {}

    // Allow node-specific cleanup
    node.disconnect?.();

    this.nodes.splice(i, 1);

    if (this.active && this.master) this.rebuild();
  }

  move(id: string, dir: "up" | "down"): void {
    const i = this.nodes.findIndex(n => n.id === id);
    if (i === -1) return;

    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= this.nodes.length) return;

    [this.nodes[i], this.nodes[j]] = [this.nodes[j], this.nodes[i]];
    if (this.active && this.master) this.rebuild();
  }

  connect(master: MasterNode): void {
    this.master = master;
    this.rebuild();
  }

  private rebuild(): void {
    if (!this.master) return;

    // safely disconnect all outputs first
    this.nodes.forEach(n => {
      try {
        n.getOutput().disconnect();
      } catch {}
    });

    let current: AudioNode = this.master.input;

    // connect from bottom -> top
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      try {
        node.getOutput().connect(current);
      } catch {}
      current = node.getInput();
    }
  }

  disconnectAll(): void {
    this.nodes.forEach(n => {
      try { n.getOutput().disconnect(); } catch {}
      try { n.getInput().disconnect(); } catch {}
      n.disconnect?.();
    });
    this.master = null;
  }

  startAll(): void {
    this.active = true;
    this.nodes.forEach(n => n.start?.());
  }

  stopAll(): void {
    this.active = false;
    this.nodes.forEach(n => n.stop?.());
  }

  isActive(): boolean {
    return this.active;
  }

  getNodes(): PatchNode[] {
    return this.nodes;
  }
}
