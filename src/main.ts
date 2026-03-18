import "./style.css";

import { resumeAudio } from "./audio/context";
import { MasterNode } from "./audio/nodes/masterNode";
import { OscSource } from "./audio/nodes/oscillatorNode";
import { PassFilterNode } from "./audio/nodes/passFilter";
import { PatchGraph } from "./audio/nodes/patchGraph";

const app = document.querySelector<HTMLDivElement>("#app")!;

const master = new MasterNode();
const graph = new PatchGraph();
graph.connectMaster(master);

let activated = false;

const positions = new Map<string, { x: number; y: number }>();

let draggingId: string | null = null;
let dragOffset = { x: 0, y: 0 };

let selectedOutput: string | null = null;
let selectedNodeId: string | null = null;

/* ================= ADD ================= */

function addOscNode() {
  const node = new OscSource();
  graph.add(node);
  positions.set(node.id, { x: 100, y: 100 });
  render();
}

function addFilterNode() {
  const node = new PassFilterNode();
  graph.add(node);
  positions.set(node.id, { x: 300, y: 200 });
  render();
}

/* ================= RENDER ================= */

function render() {
  app.innerHTML = `<h2>SonoPatch – Drag Graph</h2>`;

  const controls = document.createElement("div");

  const addOsc = document.createElement("button");
  addOsc.textContent = "+ Osc";
  addOsc.onclick = addOscNode;

  const addFilter = document.createElement("button");
  addFilter.textContent = "+ Filter";
  addFilter.onclick = addFilterNode;

  controls.append(addOsc, addFilter);
  app.appendChild(controls);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "1000");
  svg.setAttribute("height", "600");
  svg.style.border = "1px solid #444";
  svg.style.background = "#111";
  svg.style.marginTop = "20px";

  const nodes = graph.getNodes();
  const connections = graph.getConnections();

  svg.onclick = (e) => {
    if (e.target === svg) {
      selectedNodeId = null;
      render();
    }
  };

  /* ================= CONNECTIONS ================= */

  connections.forEach(conn => {
    const from = positions.get(conn.from);
    const to = positions.get(conn.to);
    if (!from || !to) return;

    const path = document.createElementNS(svg.namespaceURI, "path");

    const x1 = from.x + 120;
    const y1 = from.y + 30;
    const x2 = to.x;
    const y2 = to.y + 30;

    const d = `
      M ${x1} ${y1}
      C ${x1 + 80} ${y1},
        ${x2 - 80} ${y2},
        ${x2} ${y2}
    `;

    path.setAttribute("d", d);
    path.setAttribute("stroke", "#00ffcc");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "6");
    path.style.cursor = "pointer";

    path.onclick = (e) => {
      e.stopPropagation();
      graph.disconnectNodes(conn.from, conn.to);
      render();
    };

    path.onmouseenter = () =>
      path.setAttribute("stroke", "#ff5555");

    path.onmouseleave = () =>
      path.setAttribute("stroke", "#00ffcc");

    svg.appendChild(path);
  });

  /* ================= NODES ================= */

  nodes.forEach(node => {
    const pos = positions.get(node.id) ?? { x: 200, y: 200 };
    positions.set(node.id, pos);

    const group = document.createElementNS(svg.namespaceURI, "g");

    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("x", pos.x.toString());
    rect.setAttribute("y", pos.y.toString());
    rect.setAttribute("width", "120");
    rect.setAttribute("height", "60");
    rect.setAttribute("rx", "8");
    rect.setAttribute(
      "fill",
      selectedNodeId === node.id ? "#4444aa" : "#222"
    );
    rect.setAttribute("stroke", "#fff");

    rect.onclick = (e) => {
      e.stopPropagation();
      selectedNodeId =
        selectedNodeId === node.id ? null : node.id;
      render();
    };

    rect.onmousedown = (e) => {
      draggingId = node.id;
      dragOffset = {
        x: e.offsetX - pos.x,
        y: e.offsetY - pos.y
      };
    };

    const input = document.createElementNS(svg.namespaceURI, "circle");
    input.setAttribute("cx", pos.x.toString());
    input.setAttribute("cy", (pos.y + 30).toString());
    input.setAttribute("r", "6");
    input.setAttribute("fill", "#ff5555");

    input.onclick = () => {
      if (selectedOutput) {
        graph.connectNodes(selectedOutput, node.id);
        selectedOutput = null;
        render();
      }
    };

    const output = document.createElementNS(svg.namespaceURI, "circle");
    output.setAttribute("cx", (pos.x + 120).toString());
    output.setAttribute("cy", (pos.y + 30).toString());
    output.setAttribute("r", "6");
    output.setAttribute(
      "fill",
      selectedOutput === node.id ? "#ffff00" : "#55ff55"
    );

    output.onclick = () => {
      selectedOutput = node.id;
      render();
    };

    const text = document.createElementNS(svg.namespaceURI, "text");
    text.setAttribute("x", (pos.x + 60).toString());
    text.setAttribute("y", (pos.y + 35).toString());
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.textContent = node.label;

    group.append(rect, input, output, text);
    svg.appendChild(group);
  });

  svg.onmousemove = (e) => {
    if (!draggingId) return;
    const pos = positions.get(draggingId)!;
    pos.x = e.offsetX - dragOffset.x;
    pos.y = e.offsetY - dragOffset.y;
    render();
  };

  svg.onmouseup = () => draggingId = null;
  svg.onmouseleave = () => draggingId = null;

  app.appendChild(svg);

  /* ================= INFO BOX ================= */

  const infoBox = document.createElement("div");
  infoBox.style.marginTop = "20px";
  infoBox.style.padding = "10px";
  infoBox.style.border = "1px solid #555";
  infoBox.style.background = "#1a1a1a";
  infoBox.style.color = "white";

  if (!selectedNodeId) {
    infoBox.textContent = "No node selected";
  } else {
    const node = graph.getNodes().find(n => n.id === selectedNodeId);

    if (node) {
      const title = document.createElement("b");
      title.textContent = node.label;
      infoBox.appendChild(title);
      infoBox.appendChild(document.createElement("br"));
      infoBox.appendChild(document.createElement("br"));

      /* DELETE BUTTON */

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete Node";
      delBtn.style.marginBottom = "10px";

      delBtn.onclick = () => {
        graph.remove(node.id);
        positions.delete(node.id);
        selectedNodeId = null;
        selectedOutput = null;
        render();
      };

      infoBox.appendChild(delBtn);
      infoBox.appendChild(document.createElement("br"));
      infoBox.appendChild(document.createElement("br"));

      /* OSC */
      if (node instanceof OscSource) {
        createSelect(
          infoBox,
          "Wave Type",
          ["sine", "square", "sawtooth", "triangle"],
          node.getType(),
          (v) => node.setType(v)
        );

        createSlider(
          infoBox,
          "Frequency",
          50,
          2000,
          node.getFrequency(),
          (v) => node.setFrequency(v)
        );

        createSlider(
          infoBox,
          "Volume",
          0,
          1,
          node.getVolume(),
          (v) => node.setVolume(v)
        );
      }

      /* FILTER */
      if (node instanceof PassFilterNode) {
        createSelect(
          infoBox,
          "Filter Type",
          ["lowpass", "highpass"],
          node.getType(),
          (v) => node.setType(v)
        );

        createSlider(
          infoBox,
          "Frequency",
          50,
          8000,
          node.getFrequency(),
          (v) => node.setFrequency(v)
        );

        createSlider(
          infoBox,
          "Q",
          0.1,
          20,
          node.getQ(),
          (v) => node.setQ(v)
        );
      }
    }
  }

  app.appendChild(infoBox);

  /* ================= ACTIVATE ================= */

  const act = document.createElement("button");
  act.textContent = activated ? "DEACTIVATE" : "ACTIVATE";
  act.style.display = "block";
  act.style.marginTop = "20px";

  act.onclick = async () => {
    await resumeAudio();

    if (!activated) {
      graph.startAll();
      master.activate();
    } else {
      graph.stopAll();
      master.deactivate();
    }

    activated = !activated;
    render();
  };

  app.appendChild(act);
}

/* ================= HELPERS ================= */

function createSlider(
  parent: HTMLElement,
  label: string,
  min: number,
  max: number,
  value: number,
  onChange: (v: number) => void
) {
  const wrapper = document.createElement("div");

  const l = document.createElement("label");
  l.textContent = label;

  const input = document.createElement("input");
  input.type = "range";
  input.min = min.toString();
  input.max = max.toString();
  input.step = "0.01";
  input.value = value.toString();
  input.oninput = () => onChange(+input.value);

  wrapper.append(l, document.createElement("br"), input, document.createElement("br"));
  parent.appendChild(wrapper);
}

function createSelect<T extends string>(
  parent: HTMLElement,
  label: string,
  options: T[],
  value: T,
  onChange: (v: T) => void
) {
  const wrapper = document.createElement("div");

  const l = document.createElement("label");
  l.textContent = label;

  const select = document.createElement("select");

  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  });

  select.value = value;
  select.onchange = () => onChange(select.value as T);

  wrapper.append(l, document.createElement("br"), select, document.createElement("br"));
  parent.appendChild(wrapper);
}

render();