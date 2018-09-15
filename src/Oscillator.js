export default class Oscillator {
  constructor(context, f) {
    this.f = f;
    this.context = context;

    this.oscillator = context.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.frequency.value = f;

    this.gain = context.createGain();
    this.gain.gain.value = 0;

    this.oscillator.start();
    this.oscillator.connect(this.gain);

    this.gain.connect(context.destination);
  }

  schedule(gain, start, end) {
    this.gain.gain.setValueAtTime(gain, start);
    this.gain.gain.setValueAtTime(0, end);
  }

  scheduleFrequency(frequency, start) {
    this.oscillator.frequency.setValueAtTime(frequency, start);
  }

  cancelScheduledValues() {
    let now = this.context.currentTime;

    this.oscillator.frequency.cancelScheduledValues(now);
    this.gain.gain.cancelScheduledValues(now);

    this.gain.gain.value = 0;
    this.oscillator.frequency.value = this.f;
  }

  disconnect() {
    this.gain.disconnect();
    this.oscillator.disconnect();
  }
}
