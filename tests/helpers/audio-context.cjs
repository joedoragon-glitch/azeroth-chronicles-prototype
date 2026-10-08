'use strict';
const Audio = require('../../src/prototype/audio.js');
function context() {
  const param = () => ({
    value: 1,
    calls: [],
    setValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['set', v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['ramp', v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.value = v;
      this.calls.push(['exp', v, t]);
    },
    setTargetAtTime(v, t) {
      this.value = v;
      this.calls.push(['target', v, t]);
    },
    cancelScheduledValues(t) {
      this.calls.push(['cancel', t]);
    },
  });
  const node = () => ({
    gain: param(),
    pan: param(),
    frequency: param(),
    connect() {},
    disconnect() {
      this.disconnected = true;
    },
    start(...args) {
      this.started = args;
    },
    stop(at) {
      this.stopped = at ?? 0;
    },
  });
  const ctx = {
    state: 'running',
    currentTime: 1,
    sampleRate: 22050,
    createGain: node,
    createBufferSource: node,
    createStereoPanner: node,
    createOscillator: node,
    async suspend() {
      this.state = 'suspended';
    },
    async resume() {
      this.state = 'running';
    },
    async close() {
      this.state = 'closed';
    },
    async decodeAudioData(bytes) {
      const view = new DataView(bytes),
        length = view.getUint32(40, true) / 2,
        sampleRate = view.getUint32(24, true);
      const samples = new Float32Array(length);
      for (let i = 0; i < length; i++) samples[i] = view.getInt16(44 + 2 * i, true) / 32768;
      return {
        length,
        sampleRate,
        duration: length / sampleRate,
        numberOfChannels: 1,
        getChannelData: () => samples,
      };
    },
  };
  return ctx;
}
function audio() {
  const a = new Audio();
  a.ctx = context();
  a.buses = {};
  for (const key of ['master', 'music', 'ambience', 'effects', 'interface'])
    a.buses[key] = a.ctx.createGain();
  return a;
}
module.exports = { audio, context };
