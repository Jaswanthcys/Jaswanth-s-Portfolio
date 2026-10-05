let audioContext = null;
let muted = false;
let masterGain = null;

export function startAudioFromGesture() {
  if (audioContext) {
    if (audioContext.state === "suspended") void audioContext.resume();
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = muted ? 0 : 0.42;
  masterGain.connect(audioContext.destination);
  playCue("enter");
}

export function setMuted(value) {
  muted = Boolean(value);
  if (masterGain && audioContext) {
    const now = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.42, now, 0.035);
  }
  return muted;
}

function oscillator({ frequency, type = "sine", start, duration, gain = 0.1, endFrequency }) {
  if (!audioContext || muted || !masterGain) return;
  const osc = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, frequency), start);
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), start + Math.min(0.018, duration * 0.22));
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(envelope);
  envelope.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.025);
}

function noiseBurst(start, duration, volume = 0.06, highPass = 700) {
  if (!audioContext || muted || !masterGain) return;
  const length = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const envelope = 1 - i / length;
    data[i] = (Math.random() * 2 - 1) * envelope * envelope;
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = highPass;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function playCue(name) {
  if (!audioContext || muted || !masterGain || audioContext.state !== "running") return;
  const now = audioContext.currentTime + 0.008;
  switch (name) {
    case "enter":
      oscillator({ frequency: 118, endFrequency: 54, type: "sine", start: now, duration: 0.34, gain: 0.12 });
      oscillator({ frequency: 396, endFrequency: 174, type: "triangle", start: now + 0.04, duration: 0.23, gain: 0.045 });
      break;
    case "sword_draw":
      noiseBurst(now, 0.62, 0.035, 1250);
      oscillator({ frequency: 390, endFrequency: 1180, type: "sine", start: now + 0.06, duration: 0.44, gain: 0.025 });
      break;
    case "sword_clash":
      noiseBurst(now, 0.38, 0.14, 430);
      oscillator({ frequency: 930, endFrequency: 225, type: "triangle", start: now, duration: 0.27, gain: 0.12 });
      oscillator({ frequency: 1480, endFrequency: 680, type: "sine", start: now + 0.012, duration: 0.19, gain: 0.055 });
      break;
    case "spark":
      noiseBurst(now, 0.12, 0.04, 2800);
      oscillator({ frequency: 1320, endFrequency: 450, type: "sine", start: now, duration: 0.11, gain: 0.04 });
      break;
    case "katana_land":
      oscillator({ frequency: 170, endFrequency: 53, type: "triangle", start: now, duration: 0.72, gain: 0.17 });
      noiseBurst(now, 0.22, 0.055, 180);
      break;
    case "transition":
      oscillator({ frequency: 132, endFrequency: 590, type: "sine", start: now, duration: 0.82, gain: 0.075 });
      oscillator({ frequency: 264, endFrequency: 880, type: "triangle", start: now + 0.05, duration: 0.76, gain: 0.035 });
      break;
    case "button_hover":
      oscillator({ frequency: 620, endFrequency: 760, type: "sine", start: now, duration: 0.055, gain: 0.018 });
      break;
    case "section_transition":
      oscillator({ frequency: 245, endFrequency: 340, type: "sine", start: now, duration: 0.12, gain: 0.035 });
      break;
    default:
      break;
  }
}

export function destroyAudio() {
  if (audioContext && audioContext.state !== "closed") void audioContext.close();
  audioContext = null;
  masterGain = null;
}
