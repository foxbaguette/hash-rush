// Hashlings mined by your hits: a bright hashling streaks out of the impact on a glowing trail,
// swings wide and lands in your balance, its "+42" riding along. Hits close together share one comet.
// One small 2D canvas over the game that only draws while something moves.

const DPR = Math.min(1.5, window.devicePixelRatio || 1);
const GOLD = ['#ffe08a', '#ffb636', '#c98a1c'];
const eInOut = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const fmt = n => Math.round(n).toLocaleString('en-US');

export const ICON = '<svg class="hl-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z" fill="#c98a1c"/><path d="M12 2 21 7l-9 5-9-5z" fill="#ffe08a"/><path d="M12 12v10l-9-5V7z" fill="#ffb636"/></svg>';

let cv, ctx, W = 0, H = 0, running = false, last = 0;
let target = () => null;        // where the balance sits on screen: { x, y }
let onShow = () => {};          // draws the shown balance
const parts = [];               // { t, step(dt), draw(c) }
const owed = [];                // attacks still paying out: { left, blocks, at }
let bank = null;                // hashlings mined but not launched yet: { x, y, amt, nextAt }
let nextLaunch = 0;             // comets leave at least COMET_GAP apart
const COMET_GAP = 600, COMET_WAIT = 250, COMET_SEC = 0.95;
export let shown = null;        // the balance on screen (null until the chain told us)
let inFlight = 0;               // hashlings on a comet right now
let reserved = [];              // your mined attacks the chain already counts but the screen has not played yet: { amt, at }
let chainVal = null, owner = null;

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

/** The chain's balance for `account`. The screen holds back only what is still on its way up,
 *  and never shows more than the chain has. */
export function sync(chainValue, account) {
  if (account !== owner) reset(account);
  const now = performance.now();
  reserved = reserved.filter(r => now - r.at < 20000);   // never played (hidden tab, hash sequence): stop holding it back
  chainVal = Math.max(0, Number(chainValue) || 0);
  const pending = reserved.reduce((s, r) => s + r.amt, 0) + owed.reduce((s, o) => s + o.left, 0) + inFlight + (bank ? bank.amt : 0);
  const low = Math.max(0, chainVal - pending);
  const v = pending ? Math.min(chainVal, Math.max(shown ?? low, low)) : chainVal;
  if (v !== shown) { shown = v; onShow(shown, false); }
}
/** A mined attack of yours just came in from the chain; it plays in a moment, so hold it back until then. */
export function reserve(amount) { if (amount > 0) reserved.push({ amt: amount, at: performance.now() }); }
function reset(account) {
  owner = account; shown = null; chainVal = null; reserved = []; owed.length = 0; parts.length = 0; bank = null; inFlight = 0;
}
function pay(n) { if (!n) return; shown = Math.min(chainVal ?? Infinity, (shown || 0) + n); onShow(shown, true); }

/** Your attack mined `amount` hashlings and digs `blocks` blocks of the game planet. */
export function expect(amount, blocks) {
  if (!amount) return;
  const r = reserved.findIndex(x => x.amt === amount);
  if (r >= 0) reserved.splice(r, 1); else if (reserved.length) reserved.shift();
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
  if (o.left <= 0 || o.blocks <= 0) { const rest = o.left; owed.shift(); o.left = 0; addToBank(p, amt + rest); }
  else addToBank(p, amt);
}

function addToBank(p, amt) {
  if (!amt) return;
  const now = performance.now();
  if (!bank) bank = { amt: 0, nextAt: Math.max(now + COMET_WAIT, nextLaunch) };
  bank.x = p.x; bank.y = p.y; bank.amt += amt;
  kick();
}

// one comet from (x0, y0): out away from the middle of the screen, then a wide swing into the balance
function comet(x0, y0, amt) {
  inFlight += amt;
  const ox = x0 - W / 2, oy = y0 - H / 2, L = Math.hypot(ox, oy) || 1, A = { x: x0, y: y0 };
  const C1 = { x: x0 + ox / L * 90, y: y0 + oy / L * 90 - 40 };
  parts.push({ t: 0, hist: [], step(dt) { this.t += dt; const k = Math.min(1, this.t / COMET_SEC), T = target();
      if (k >= 1 || !T) { if (k >= 1 || this.t > 3) { inFlight -= amt; pay(amt); return false; } return true; }
      this.p = cubic(A, C1, { x: T.x - 60, y: T.y + 70 }, T, eInOut(k)); this.k = k;
      this.hist.push(this.p); if (this.hist.length > 16) this.hist.shift();
      return true; },
    draw(c) { if (!this.p) return;
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let i = 1; i < this.hist.length; i++) { const f = i / this.hist.length;
        c.strokeStyle = `rgba(255,170,60,${f * 0.8})`; c.lineWidth = 1 + 5 * f;
        c.beginPath(); c.moveTo(this.hist[i - 1].x, this.hist[i - 1].y); c.lineTo(this.hist[i].x, this.hist[i].y); c.stroke(); }
      glow(c, this.p.x, this.p.y, 16, 0.55); c.globalCompositeOperation = 'source-over';
      cube(c, this.p.x, this.p.y, 6, this.t * 8);
      label(c, this.p.x + 4, this.p.y + 18, '+' + fmt(amt), this.k < 0.1 ? this.k * 10 : 1 - this.k ** 3); } });
}
const cubic = (a, c1, c2, b, t) => { const u = 1 - t; return { x: u*u*u*a.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*b.x, y: u*u*u*a.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*b.y }; };

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
  if (bank && now >= bank.nextAt) { comet(bank.x, bank.y, bank.amt); bank = null; nextLaunch = now + COMET_GAP; }
  for (let i = parts.length - 1; i >= 0; i--) if (!parts[i].step(dt)) parts.splice(i, 1);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  for (const p of parts) p.draw(ctx);
  if (bank || parts.length || owed.length) requestAnimationFrame(frame);
  else { running = false; ctx.clearRect(0, 0, W, H); }
}
