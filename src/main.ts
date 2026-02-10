import "./style.css";

import { resumeAudio } from "./audio/context";
import { MasterNode } from "./audio/nodes/masterNode";
import { OscSource } from "./audio/nodes/oscillatorNode";
import type { OscWaveType } from "./audio/nodes/oscillatorNode";
import { PatchGraph } from "./audio/nodes/patchGraph";
import { PassFilterNode } from "./audio/nodes/passFilter";
import type { PassFilterType } from "./audio/nodes/passFilter";

const app = document.querySelector<HTMLDivElement>("#app")!;

const master = new MasterNode();
const graph = new PatchGraph();

let activated = false;

const waveTypes: OscWaveType[] = [
  "sine",
  "square",
  "sawtooth",
  "triangle",
];

const filterTypes: PassFilterType[] = ["lowpass", "highpass"];

/* ===== ADD ===== */

function addOscNode() {
  graph.add(new OscSource());
  render();
}

function addFilterNode() {
  graph.add(new PassFilterNode());
  render();
}

/* ===== UI ===== */

function render() {
  app.innerHTML = `<h2>SonoPatch – Test Mode</h2>`;

  const addOsc = document.createElement("button");
  addOsc.textContent = "+ Add Osc";
  addOsc.onclick = addOscNode;

  const addFilter = document.createElement("button");
  addFilter.textContent = "+ Add Filter";
  addFilter.onclick = addFilterNode;

  app.append(addOsc, addFilter, document.createElement("hr"));

  graph.getNodes().forEach((node) => {
    const row = document.createElement("div");
    row.className = "node-row";

    /* ===== OSC ===== */
    if (node instanceof OscSource) {
      const osc = node;

      row.append("Osc ");

      const en = document.createElement("input");
      en.type = "checkbox";
      en.checked = osc.isEnabled();
      en.onchange = () => {
        osc.setEnabled(en.checked);
        if (en.checked && graph.isActive()) osc.start();
      };
      row.append(" enable ", en);

      const wave = document.createElement("select");
      waveTypes.forEach(t => {
        const o = document.createElement("option");
        o.value = t;
        o.textContent = t;
        wave.appendChild(o);
      });
      wave.value = osc.getType();
      wave.onchange = () =>
        osc.setType(wave.value as OscWaveType);
      row.append(" wave ", wave);

      const freq = document.createElement("input");
      freq.type = "range";
      freq.min = "50";
      freq.max = "2000";
      freq.value = osc.getFrequency().toString();
      freq.oninput = () => osc.setFrequency(+freq.value);
      row.append(" freq ", freq);

      const vol = document.createElement("input");
      vol.type = "range";
      vol.min = "0";
      vol.max = "1";
      vol.step = "0.01";
      vol.value = osc.getVolume().toString();
      vol.oninput = () => osc.setVolume(+vol.value);
      row.append(" vol ", vol);
    }

    /* ===== FILTER ===== */
    if (node instanceof PassFilterNode) {
      const f = node;

      row.append("Filter ");

      const en = document.createElement("input");
      en.type = "checkbox";
      en.checked = f.isEnabled();
      en.onchange = () => f.setEnabled(en.checked);
      row.append(" enable ", en);

      const type = document.createElement("select");
      filterTypes.forEach(t => {
        const o = document.createElement("option");
        o.value = t;
        o.textContent = t;
        type.appendChild(o);
      });
      type.value = f.getType();
      type.onchange = () =>
        f.setType(type.value as PassFilterType);
      row.append(" type ", type);

      const cut = document.createElement("input");
      cut.type = "range";
      cut.min = "50";
      cut.max = "8000";
      cut.value = f.getFrequency().toString();
      cut.oninput = () => f.setFrequency(+cut.value);
      row.append(" freq ", cut);

      const q = document.createElement("input");
      q.type = "range";
      q.min = "0.1";
      q.max = "20";
      q.step = "0.1";
      q.value = f.getQ().toString();
      q.oninput = () => f.setQ(+q.value);
      row.append(" Q ", q);
    }

    /* ===== ORDER ===== */
    const up = document.createElement("button");
    up.textContent = "↑";
    up.onclick = () => {
      graph.move(node.id, "up");
      render();
    };

    const down = document.createElement("button");
    down.textContent = "↓";
    down.onclick = () => {
      graph.move(node.id, "down");
      render();
    };

    /* ===== DELETE ===== */
    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = () => {
      graph.remove(node.id);
      render();
    };

    row.append(" ", up, down, del);
    app.appendChild(row);
  });

  const act = document.createElement("button");
  act.textContent = activated ? "DEACTIVATE" : "ACTIVATE";
  act.className = activated ? "active" : "";

  act.onclick = async () => {
    await resumeAudio();

    if (!activated) {
      graph.connect(master);
      graph.startAll();
      master.activate();
    } else {
      graph.stopAll();
      master.deactivate();
    }

    activated = !activated;
    render();
  };

  app.appendChild(document.createElement("hr"));
  app.appendChild(act);
}

render();