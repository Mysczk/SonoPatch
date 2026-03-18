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

  /* ============================= */

  add(node: PatchNode): void {
    this.nodes.set(node.id, node);
    if (this.active) node.start?.();
    this.rebuild();
  }

  remove(id: string): void {
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

    // zabrání duplicitě
    if (this.connections.some(c => c.from === fromId && c.to === toId)) return;

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
    this.rebuild();
  }

  /* ============================= */

  private rebuild(): void {
    if (!this.master) return;

    // odpoj vše
    this.nodes.forEach(n => {
      try { n.getOutput().disconnect(); } catch {}
    });

    // spoj podle connections
    this.connections.forEach(c => {
      const from = this.nodes.get(c.from);
      const to = this.nodes.get(c.to);
      if (!from || !to) return;

      try {
        from.getOutput().connect(to.getInput());
      } catch {}
    });

    // leaf nodes → master
    const hasOutgoing = new Set(this.connections.map(c => c.from));

    this.nodes.forEach((node, id) => {
      if (!hasOutgoing.has(id)) {
        try {
          node.getOutput().connect(this.master!.input);
        } catch {}
      }
    });
  }

  /* ============================= */

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