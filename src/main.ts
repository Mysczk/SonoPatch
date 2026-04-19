import "./style.css";

import { resumeAudio } from "./audio/context";
import { MasterNode } from "./audio/nodes/masterNode";
import { OscSource } from "./audio/nodes/oscillatorNode";
import { PassFilterNode } from "./audio/nodes/passFilter";
import { PatchGraph } from "./audio/nodes/patchGraph";
import { GainNodeCustom } from "./audio/nodes/gainNode";  

const app = document.querySelector<HTMLDivElement>("#app")!;

const master = new MasterNode();
const graph = new PatchGraph();
graph.connectMaster(master);

let activated = false;

const positions = new Map<string, { x: number; y: number }>();
positions.set(master.id, { x: 800, y: 250 });

let draggingId: string | null = null;
let dragOffset = { x: 0, y: 0 };

let selectedOutput: string | null = null;
let selectedNodeId: string | null = null;

let currentKeyHandler: ((e: KeyboardEvent) => void) | null = null;

let canvas: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let visualizerStarted = false;



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

function addGainNode() {
  const node = new GainNodeCustom();
  graph.add(node);
  positions.set(node.id, { x: 400, y: 300 });
  render();
}

/* ================= RENDER ================= */

function render() {
  // Odstraň předchozí key handler před novým renderem
  if (currentKeyHandler) {
    document.removeEventListener("keydown", currentKeyHandler);
    currentKeyHandler = null;
  }

  app.innerHTML = `<h2>SonoPatch</h2>`;

  const controls = document.createElement("div");

  const addOsc = document.createElement("button");
  addOsc.textContent = "+ Osc";
  addOsc.onclick = addOscNode;

  const addFilter = document.createElement("button");
  addFilter.textContent = "+ Filter";
  addFilter.onclick = addFilterNode;

  const addGain = document.createElement("button");
  addGain.textContent = "+ Gain";
  addGain.onclick = addGainNode;

  controls.append(addOsc, addFilter, addGain);
  app.appendChild(controls);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "1000");
  svg.setAttribute("height", "600");
  svg.style.border = "1px solid #444";
  svg.style.background = "#111";

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

    const path = document.createElementNS(svg.namespaceURI, "path") as SVGPathElement;

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

    const rect = document.createElementNS(svg.namespaceURI, "rect") as SVGRectElement;
    rect.setAttribute("x", pos.x.toString());
    rect.setAttribute("y", pos.y.toString());
    rect.setAttribute("width", "120");
    rect.setAttribute("height", "60");
    rect.setAttribute("rx", "8");
    rect.setAttribute(
    "fill",
    node.id === master.id
      ? "#883333"
      : selectedNodeId === node.id
      ? "#4444aa"
      : "#222"
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

    const input = document.createElementNS(svg.namespaceURI, "circle") as SVGCircleElement;
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

    const output = document.createElementNS(svg.namespaceURI, "circle") as SVGCircleElement;
    output.setAttribute("cx", (pos.x + 120).toString());
    output.setAttribute("cy", (pos.y + 30).toString());
    output.setAttribute("r", "6");
    output.setAttribute(
      "fill",
      selectedOutput === node.id ? "#ffff00" : "#55ff55"
    );

    output.onclick = () => {
      if (node.id === master.id) return;
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

  /* ================= INFO BOX ================= */

  const infoBox = document.createElement("div");
  infoBox.style.padding = "10px";
  infoBox.style.border = "1px solid #555";
  infoBox.style.background = "#1a1a1a";
  infoBox.style.color = "white";
  infoBox.style.width = "240px";
  infoBox.style.flexShrink = "0";
  infoBox.style.minHeight = "600px";
  infoBox.style.boxSizing = "border-box";

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
      delBtn.style.background = "#aa3333";
      delBtn.style.color = "white";

      delBtn.onclick = () => {
        if (node.id === master.id) return;
        graph.remove(node.id);
        positions.delete(node.id);
        selectedNodeId = null;
        selectedOutput = null;
        render();
      };

      infoBox.appendChild(delBtn);
      infoBox.appendChild(document.createElement("br"));
      infoBox.appendChild(document.createElement("br"));

      /* GLOBAL KEY HANDLER pro Delete / Backspace */

      const keyHandler = (e: KeyboardEvent) => {
        if (e.key !== "Delete" && e.key !== "Backspace") return;

        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "SELECT") return;

        if (node.id === master.id) return;

        document.removeEventListener("keydown", keyHandler);
        currentKeyHandler = null;

        graph.remove(node.id);
        positions.delete(node.id);
        selectedNodeId = null;
        selectedOutput = null;
        render();
      };

      currentKeyHandler = keyHandler;
      document.addEventListener("keydown", keyHandler);

      /* ================= OSC ================= */

      if (node instanceof OscSource) {
        createSelect(
          infoBox,
          "Wave Type",
          ["sine", "square", "sawtooth", "triangle"],
          node.getType(),
          (v) => node.setType(v)
        );

        createControl(
          infoBox,
          "Frequency",
          0,
          10000,
          node.getFrequency(),
          1,
          (v) => node.setFrequency(v)
        );

        createControl(
          infoBox,
          "Volume",
          0,
          1,
          node.getVolume(),
          0.01,
          (v) => node.setVolume(v)
        );
      }

      /* ================= FILTER ================= */

      if (node instanceof PassFilterNode) {
        createSelect(
          infoBox,
          "Filter Type",
          ["lowpass", "highpass"],
          node.getType(),
          (v) => node.setType(v)
        );

        createControl(
          infoBox,
          "Frequency",
          0,
          10000,
          node.getFrequency(),
          1,
          (v) => node.setFrequency(v)
        );

        createControl(
          infoBox,
          "Q",
          0.1,
          20,
          node.getQ(),
          0.1,
          (v) => node.setQ(v)
        );
      }

      /* ================= GAIN ================= */

      if (node instanceof GainNodeCustom) {
        createControl(
          infoBox,
          "Gain",
          0,
          2,
          node.getGain(),
          0.01,
          (v) => node.setGain(v)
        );
      }
    }
  }

  /* ================= LAYOUT (flex) ================= */

  const layout = document.createElement("div");
  layout.style.display = "flex";
  layout.style.gap = "16px";
  layout.style.alignItems = "flex-start";
  layout.style.marginTop = "20px";

  layout.append(infoBox, svg);
  app.appendChild(layout);


  /* ================= VISUALIZER ================= */

if (!canvas) {
  canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 200;
  canvas.style.marginTop = "20px";
  canvas.style.border = "1px solid #444";
  canvas.style.background = "#000";

  ctx2d = canvas.getContext("2d")!;
}

app.appendChild(canvas);

if (!visualizerStarted) {
  visualizerStarted = true;

  function draw() {
    requestAnimationFrame(draw);

    if (!ctx2d) return;

    const data = master.getAnalyserData();

    ctx2d.fillStyle = "black";
    ctx2d.fillRect(0, 0, canvas!.width, canvas!.height);

    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = "#00ffcc";
    ctx2d.beginPath();

    const sliceWidth = canvas!.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * canvas!.height) / 2;

      if (i === 0) ctx2d.moveTo(x, y);
      else ctx2d.lineTo(x, y);

      x += sliceWidth;
    }

    ctx2d.stroke();
  }

  draw();
}

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

function createControl(
  parent: HTMLElement,
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onChange: (v: number) => void
) {
  const wrapper = document.createElement("div");
  wrapper.style.marginBottom = "10px";

  const l = document.createElement("label");
  l.textContent = label;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.style.width = "100%";
  
  const input = document.createElement("input");
  input.type = "number";
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.value = value.toString();
  input.style.width = "80px";
  input.style.marginTop = "4px";
  input.style.background = "#222";
  input.style.color = "white";
  input.style.border = "1px solid #555";
  
  slider.oninput = () => {
    input.value = slider.value;
    onChange(+slider.value);
  };

  input.oninput = () => {
    let v = +input.value;
    if (isNaN(v)) return;
    if (v < min) v = min;
    if (v > max) v = max;
    slider.value = v.toString();
    onChange(v);
  };

  input.onwheel = (e) => {
    e.preventDefault();
    let v = +input.value;
    const fineStep = e.shiftKey ? step / 10 : step;
    v += e.deltaY < 0 ? fineStep : -fineStep;
    if (v < min) v = min;
    if (v > max) v = max;
    slider.value = v.toString();
    input.value = v.toString();
    onChange(v);
  };

  input.onkeydown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      let v = +input.value;
      const fineStep = e.shiftKey ? step / 10 : step;
      v += e.key === "ArrowUp" ? fineStep : -fineStep;
      if (v < min) v = min;
      if (v > max) v = max;
      slider.value = v.toString();
      input.value = v.toString();
      onChange(v);
    }
  };

  wrapper.append(
    l,
    document.createElement("br"),
    slider,
    document.createElement("br"),
    input
  );

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
  wrapper.style.marginBottom = "10px";

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

  wrapper.append(
    l,
    document.createElement("br"),
    select
  );

  parent.appendChild(wrapper);
}

render();