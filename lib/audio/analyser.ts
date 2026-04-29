"use client";

export interface MeterTap {
  level: () => number;
  dispose: () => void;
}

export function attachMeter(stream: MediaStream): MeterTap {
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  return {
    level: () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      return Math.min(1, Math.sqrt(sum / buf.length) * 1.6);
    },
    dispose: () => { src.disconnect(); void ctx.close(); },
  };
}

export function attachMeterFromAudioElement(el: HTMLAudioElement): MeterTap {
  const ctx = new AudioContext();
  const src = ctx.createMediaElementSource(el);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser); analyser.connect(ctx.destination);
  const buf = new Float32Array(analyser.fftSize);
  return {
    level: () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      return Math.min(1, Math.sqrt(sum / buf.length) * 1.6);
    },
    dispose: () => { src.disconnect(); void ctx.close(); },
  };
}
