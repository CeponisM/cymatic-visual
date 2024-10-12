let audioContext = null;
let oscillator = null;

export const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

export const playTone = (frequency) => {
  if (!audioContext) {
    initAudio();
  }
  if (oscillator) {
    oscillator.stop();
  }
  oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // Sine wave for pure tone
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
};

export const stopTone = () => {
  if (oscillator) {
    oscillator.stop();
    oscillator = null;
  }
};