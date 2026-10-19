// Hashlings mined by your hits: a thin gold beam reaches from your balance down to the impact
// and the hashlings ride up it. One small 2D canvas over the game that only draws while something moves.

const DPR = Math.min(1.5, window.devicePixelRatio || 1);
const GOLD = ['#ffe08a', '#ffb636', '#c98a1c'];
const eOut = t => 1 - (1 - t) ** 3, eInOut = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const fmt = n => Math.round(n).toLocaleString('en-US');

export const ICON = '<svg class="hl-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z" fill="#c98a1c"/><path d="M12 2 21 7l-9 5-9-5z" fill="#ffe08a"/><path d="M12 12v10l-9-5V7z" fill="#ffb636"/></svg>';

let cv, ctx, W = 0, H = 0, running = false, last = 0;
let target = () => null;        // where the balance sits on screen: { x, y }
let onShow = () => {};          // draws the shown balance
const parts = [];               // { t, step(dt), draw(c) }
const owed = [];                // attacks still paying out: { left, blocks, at }
let beam = null;                // { x, y, bank, nextAt, lastAt, a }
export let shown = null;        // the balance on screen (null until the chain told us)
let inFlight = 0;               // hashlings riding the beam right now

function size() { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; }
export function init(opts) {
  target = opts.target; onShow = opts.onShow;
  cv = document.createElement('canvas');
  cv.className = 'gains-fx';
  cv.setAttribute('aria-hidden', 'true');
  opts.after.after(cv);
  ctx = cv.getContext('2d');
  size(); addEventListener('resize', size);
}

/** The chain's balance. The screen never goes backwards, and never shows what is still on its way up. */
export function sync(chainValue) {
  const pending = owed.reduce((s, o) => s + o.left, 0) + inFlight + (beam ? beam.bank : 0);
  const v = Math.max(0, chainValue - pending);
  if (shown == null || v > shown) { shown = v; onShow(shown, false); }
}
function pay(n) { if (!n) return; shown = (shown || 0) + n; onShow(shown, true); }

/** Your attack mined `amount` hashlings and digs `blocks` blocks of the game planet. */
export function expect(amount, blocks) {
  if (!amount) return;
  if (document.hidden || !blocks) { pay(amount); return; }
  owed.push({ left: amount, blocks, at: performance.now(), first: true });
  kick();
}
/** One of your hits removed `k` blocks at screen point p. */
export function impact(p, k) {
  const o = owed[0];
  if (!o || !p) return;
  const amt = k >= o.blocks ? o.left : Math.min(o.left, Math.round(o.left * k / o.blocks));
  o.left -= amt; o.blocks = Math.max(0, o.blocks - k);
  if (o.first) { o.first = false; rise(p, o.left + amt); }
  if (o.left <= 0 || o.blocks <= 0) { const rest = o.left; owed.shift(); o.left = 0; addToBeam(p, amt + rest); }
  else addToBeam(p, amt);
}

function addToBeam(p, amt) {
  const now = performance.now();
  if (!beam) beam = { x: p.x, y: p.y, bank: 0, nextAt: now + 120, lastAt: now, a: 0 };
  beam.x = p.x; beam.y = p.y; beam.bank += amt; beam.lastAt = now;
  kick();
}

// a "+42" rising from the first hit
function rise(p, n) {
  const dur = 0.8;
  parts.push({ t: 0, step(dt) { this.t += dt; return this.t < dur; },
    draw(c) { const k = this.t / dur; label(c, p.x, p.y - 22 - 22 * eOut(k), '+' + fmt(n), k < 0.15 ? k / 0.15 : 1 - k * k * k); } });
}
// one hashling riding the beam from (x0, y0) to the balance
function shard(x0, y0, amt) {
  inFlight += amt;
  parts.push({ t: 0, step(dt) { this.t += dt; const k = this.t / 0.5;
      if (k >= 1) { inFlight -= amt; pay(amt); return false; }
      const T = target(); if (!T) return true;
      const e = eInOut(k), dx = T.x - x0, dy = T.y - y0, L = Math.hypot(dx, dy) || 1, w = Math.sin(k * Math.PI * 3) * 4 * (1 - k);
      this.x = x0 + dx * e - dy / L * w; this.y = y0 + dy * e + dx / L * w; return true; },
    draw(c) { if (this.x != null) cube(c, this.x, this.y, 4.5, this.t * 7); } });
}

function cube(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const h = s * 0.866, q = s / 2;
  c.fillStyle = GOLD[0]; c.beginPath(); c.moveTo(0, -s); c.lineTo(h, -q); c.lineTo(0, 0); c.lineTo(-h, -q); c.fill();
  c.fillStyle = GOLD[1]; c.beginPath(); c.moveTo(-h, -q); c.lineTo(0, 0); c.lineTo(0, s); c.lineTo(-h, q); c.fill();
  c.fillStyle = GOLD[2]; c.beginPath(); c.moveTo(0, 0); c.lineTo(h, -q); c.lineTo(h, q); c.lineTo(0, s); c.fill();
  c.restore();
}
function label(c, x, y, text, a) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(x, y);
  c.font = '800 18px "Barlow Condensed", sans-serif'; c.textBaseline = 'middle';
  const w = c.measureText(text).width, x0 = -(w + 14) / 2;
  c.globalAlpha = a; cube(c, x0 + 5, 0, 5.5, 0);
  c.lineWidth = 3; c.strokeStyle = '#000b'; c.strokeText(text, x0 + 13, 1);
  c.fillStyle = '#ffd56a'; c.fillText(text, x0 + 13, 1);
  c.restore();
}
function glow(c, x, y, r, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,190,90,${a})`); g.addColorStop(1, 'rgba(255,190,90,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // a payout whose hits never showed (blocks gone quietly, tab hidden): straight onto the balance
  while (owed.length && (now - owed[0].at > 9000 || document.hidden)) pay(owed.shift().left);
  if (beam) {
    if (beam.bank > 0 && now >= beam.nextAt) { shard(beam.x, beam.y, beam.bank); beam.bank = 0; beam.nextAt = now + 90; }
    const idle = !beam.bank && !owed.length && now - beam.lastAt > 650;   // the last hashling has ridden up: fade out
    beam.a = idle ? beam.a - dt / 0.25 : Math.min(1, beam.a + dt / 0.15);
    if (idle && beam.a <= 0) beam = null;
  }
  for (let i = parts.length - 1; i >= 0; i--) if (!parts[i].step(dt)) parts.splice(i, 1);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const T = target();
  if (beam && T && beam.a > 0) {
    const a = Math.max(0, Math.min(1, beam.a));
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(beam.x, beam.y); ctx.lineTo(T.x, T.y);
    ctx.strokeStyle = `rgba(255,190,80,${0.14 * a})`; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = `rgba(255,220,140,${0.7 * a})`; ctx.lineWidth = 1.4; ctx.stroke();
    glow(ctx, beam.x, beam.y, 18, 0.5 * a);
    ctx.globalCompositeOperation = 'source-over';
  }
  for (const p of parts) p.draw(ctx);
  if (beam || parts.length || owed.length) requestAnimationFrame(frame);
  else { running = false; ctx.clearRect(0, 0, W, H); }
}
