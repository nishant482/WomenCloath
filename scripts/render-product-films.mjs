// Run with a local Vite server: node scripts/render-product-films.mjs
// Creates real 7-second WebM files with motion photography and synthesized music.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { products } from '../src/products.js';

const origin = process.env.STOREFRONT_URL || 'http://localhost:5174';
fs.mkdirSync('public/videos', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

// MediaRecorder leaves duration unspecified. Write the measured duration into
// the EBML Info element so native players show a finite, seekable timeline.
function withDuration(bytes, milliseconds) {
  const readVint = (offset, strip = true) => {
    let length = 1, mask = 128;
    while (!(bytes[offset] & mask) && length < 8) { length++; mask >>= 1; }
    let value = strip ? bytes[offset] & (mask - 1) : bytes[offset];
    for (let i = 1; i < length; i++) value = value * 256 + bytes[offset + i];
    return { length, value };
  };
  let offset = 0;
  while (offset < bytes.length) {
    const id = readVint(offset, false); const size = readVint(offset + id.length);
    const body = offset + id.length + size.length;
    if (id.value === 0x18538067) { offset = body; continue; }
    if (id.value === 0x1549a966) {
      const duration = Buffer.alloc(11); duration[0] = 0x44; duration[1] = 0x89; duration[2] = 0x88; duration.writeDoubleBE(milliseconds, 3);
      const newSize = size.value + duration.length;
      let width = size.length; while (newSize >= 2 ** (7 * width) - 1) width++;
      const encoded = Buffer.alloc(width); let value = newSize;
      for (let i = width - 1; i >= 0; i--) { encoded[i] = value % 256; value = Math.floor(value / 256); }
      encoded[0] |= 1 << (8 - width);
      return Buffer.concat([bytes.subarray(0, offset + id.length), encoded, bytes.subarray(body, body + size.value), duration, bytes.subarray(body + size.value)]);
    }
    offset = body + size.value;
  }
  throw new Error('Could not write WebM duration');
}

try {
  const page = await browser.newPage();
  await page.goto(origin);
  for (const p of products) {
    const result = await page.evaluate(async product => {
      const duration = 7;
      const photo = new Image(); photo.src = `/images/${product.image}.jpg`; await photo.decode();
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 960;
      const ctx = canvas.getContext('2d');
      const audio = new AudioContext({ sampleRate: 48000 }); await audio.resume();
      const destination = audio.createMediaStreamDestination();
      const master = audio.createGain(); master.gain.value = .55; master.connect(destination);
      const start = audio.currentTime + .12;
      const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66, 261.63, 392, 329.63, 523.25];
      // Original, soft bell melody with a sustained warm chord. No external music.
      notes.forEach((frequency, index) => {
        const at = start + index * .5; const gain = audio.createGain();
        gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(.15, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + .85); gain.connect(master);
        [1, 2].forEach((harmonic, i) => { const osc = audio.createOscillator(); const level = audio.createGain(); osc.type = 'sine'; osc.frequency.value = frequency * harmonic * (product.id % 2 ? 1 : 1.12246); level.gain.value = i ? .2 : 1; osc.connect(level); level.connect(gain); osc.start(at); osc.stop(at + .9); });
      });
      [130.81, 164.81, 196].forEach(frequency => { const osc = audio.createOscillator(); const gain = audio.createGain(); osc.frequency.value = frequency; osc.type = 'sine'; gain.gain.setValueAtTime(.0001, start); gain.gain.linearRampToValueAtTime(.045, start + .7); gain.gain.setValueAtTime(.045, start + 5.8); gain.gain.linearRampToValueAtTime(.0001, start + 6.7); osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + 6.8); });
      const stream = canvas.captureStream(24); destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 1400000, audioBitsPerSecond: 96000 });
      const chunks = []; recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      const begin = performance.now();
      const paint = () => {
        const progress = Math.min((performance.now() - begin) / (duration * 1000), 1);
        const scale = Math.max(720 / photo.width, 960 / photo.height) * (1 + .07 * Math.sin(progress * Math.PI / 2));
        const width = photo.width * scale, height = photo.height * scale;
        ctx.drawImage(photo, (720 - width) / 2, (960 - height) * .28, width, height);
        const gradient = ctx.createLinearGradient(0, 690, 0, 960); gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, '#10253bc9'); ctx.fillStyle = gradient; ctx.fillRect(0, 690, 720, 270);
        ctx.fillStyle = '#fffdf0'; ctx.font = '46px Georgia'; ctx.fillText('rang', 38, 68);
        ctx.font = '12px sans-serif'; ctx.fillText('THE MOTION EDIT  /  ' + String(product.id).padStart(2, '0'), 40, 845);
        ctx.font = '28px Georgia'; const words = product.name.split(' '); let line = '', y = 886;
        for (const word of words) { if (ctx.measureText(line + word).width > 635) { ctx.fillText(line, 40, y); line = ''; y += 35; } line += word + ' '; } ctx.fillText(line, 40, y);
      };
      paint(); recorder.start(); const timer = setInterval(paint, 1000 / 24);
      await new Promise(resolve => setTimeout(resolve, duration * 1000)); clearInterval(timer); recorder.stop(); await stopped;
      stream.getTracks().forEach(t => t.stop()); await audio.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      return await new Promise(resolve => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob); });
    }, p);
    const bytes = withDuration(Buffer.from(result, 'base64'), 7000);
    fs.writeFileSync(`public/videos/${p.image}.webm`, bytes);
    console.log(`Rendered ${p.id}/12: ${p.image}.webm (${Math.round(bytes.length / 1024)} KB)`);
  }
} finally { await browser.close(); }
