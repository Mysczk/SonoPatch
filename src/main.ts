import { resumeAudio } from "./audio/context";
import { MasterNode } from "./audio/nodes/masterNode";
import { OscSource } from "./audio/nodes/oscillatorNode";

const master = new MasterNode();
const osc = new OscSource();
osc.connect(master.input);

// UI – dvě tlačítka a slider frekvence
const btnPower = document.createElement("button");
btnPower.textContent = "Zapnout zvuk";
document.body.appendChild(btnPower);

const btnMute = document.createElement("button");
btnMute.textContent = "Mute";
btnMute.style.marginLeft = "8px";
document.body.appendChild(btnMute);

const freq = document.createElement("input");
freq.type = "range";
freq.min = "50";
freq.max = "2000";
freq.value = "220";
freq.style.marginLeft = "12px";
document.body.appendChild(freq);

const freqLabel = document.createElement("span");
freqLabel.textContent = " 220 Hz";
freqLabel.style.marginLeft = "6px";
document.body.appendChild(freqLabel);

let powered = false;
let muted = false;

// Power: start/stop oscilátoru
btnPower.addEventListener("click", async () => {
  await resumeAudio(); // odblokování po uživatelském gestu
  powered = !powered;
  if (powered) {
    osc.start(parseFloat(freq.value));
    btnPower.textContent = "Vypnout zvuk";
  } else {
    osc.stop();
    btnPower.textContent = "Zapnout zvuk";
  }
});

// Mute přes master gain
btnMute.addEventListener("click", () => {
  muted = !muted;
  if (muted) {
    master.mute();
    btnMute.textContent = "Unmute";
  } else {
    master.unmute();
    btnMute.textContent = "Mute";
  }
});

// Změna frekvence za běhu
freq.addEventListener("input", () => {
  const v = parseFloat(freq.value);
  freqLabel.textContent = ` ${v} Hz`;
  osc.setFrequency(v);
});
