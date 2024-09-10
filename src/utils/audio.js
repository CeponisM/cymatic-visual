import * as Tone from 'tone';

let synth = null;

export function initAudio() {
  synth = new Tone.Synth().toDestination();
}

export function playTone(frequency) {
  if (synth) {
    synth.frequency.value = frequency;
    synth.triggerAttack();
  }
}

export function stopTone() {
  if (synth) {
    synth.triggerRelease();
  }
}
