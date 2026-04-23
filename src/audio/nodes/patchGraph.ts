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

interface Connection {
  from: string;
  to: string;
}

export class PatchGraph {
  private nodes = new Map<string, PatchNode>();
  private connections: Connection[] = [];

  private master: MasterNode | null = null;
  private active = false;

  add(node: PatchNode): void {
    this.nodes.set(node.id, node);
    if (this.active) node.start?.();
    this.rebuild();
  }

  remove(id: string): void {
    if (id === this.master?.id) return;

    const node = this.nodes.get(id);
    if (!node) return;

    node.stop?.();
    node.disconnect?.();

    this.connections = this.connections.filter(
      c => c.from !== id && c.to !== id
    );

    this.nodes.delete(id);
    this.rebuild();
  }

  connectNodes(fromId: string, toId: string): void {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return;

    // master nesmí být source
    if (fromId === this.master?.id) return;

    if (this.connections.some(c => c.from === fromId && c.to === toId)) return;

    console.log("CONNECT:", fromId, "->", toId);

    this.connections.push({ from: fromId, to: toId });
    this.rebuild();
  }

  disconnectNodes(fromId: string, toId: string): void {
    this.connections = this.connections.filter(
      c => !(c.from === fromId && c.to === toId)
    );
    this.rebuild();
  }

  connectMaster(master: MasterNode): void {
    this.master = master;
    this.nodes.set(master.id, master);
    this.rebuild();
  }

 private rebuild(): void {
  if (!this.master) return;

  console.log("REBUILD");

  this.nodes.forEach(n => {
    if (n.id === this.master?.id) return;
    try {
      n.getOutput().disconnect();
    } catch {}
  });

  // 2. ZNOVU POSTAV GRAPH
  this.connections.forEach(c => {
    const from = this.nodes.get(c.from);
    const to = this.nodes.get(c.to);
    if (!from || !to) return;

    try {
      from.getOutput().connect(to.getInput());
    } catch {}
  });
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
    return Array.from(this.nodes.values());
  }

  getConnections(): Connection[] {
    return this.connections;
  }
}