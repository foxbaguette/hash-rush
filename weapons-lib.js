'use strict';
/*
  The twenty weapons and the effect engine that plays them, shared by the game
  (index.html) and the weapon style sheet (weapons.html).

  A weapon is fire(A): it schedules events, projectiles and beams through A, and
  calls A.crater() wherever it hits. What a crater does is up to the host page:
  the style sheet carves its preview planet; the game hands out the next blocks of
  its fixed removal sequence, so the planet still depends only on seed + remaining.
*/
const WeaponKit = (() => {
// ---------------------------------------------------------------------------
// small math
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => scale(a, 1 / (len(a) || 1));
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const jit = a => [(Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a];
const pick = arr => arr[(Math.random() * arr.length) | 0];
function basis(n) {
  const t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(n, t));
  return [u, cross(n, u)];
}
function rotateAround(v, axis, a) {   // Rodrigues
  const c = Math.cos(a), s = Math.sin(a);
  return add(add(scale(v, c), scale(cross(axis, v), s)), scale(axis, dot(axis, v) * (1 - c)));
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const HULL = '#5f6773', HULL_L = '#97a0ac', DARK = '#2b3038', GLASS = '#6fe3ff', ENGINE = '#ffb060';

// ---------------------------------------------------------------------------
// projectile models (voxel fill functions: put(x, y, z, colour, material, glow))
const MODEL_DEFS = {
  rocket: (put => {
    for (let z = -2; z <= 2; z++) put(0, 0, z, '#e9edf2', 'metal');
    put(0, 0, 3, '#ff3b30', 'metal', 0.4);
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { put(x, y, -2, DARK, 'metal'); put(x, y, -1, '#c8ccd2', 'metal'); }
    put(0, 0, -3, '#ffd28a', 'energy', 1);
  }),
  micro: (put => { put(0, 0, 0, '#e9edf2', 'metal'); put(0, 0, 1, '#e9edf2', 'metal'); put(0, 0, 2, '#ffffff', 'energy', 0.6); put(0, 0, -1, '#9fd8ff', 'energy', 1); }),
  warhead: (put => {
    for (let z = -4; z <= 3; z++) for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) {
      if (Math.abs(x) + Math.abs(y) === 2) continue;
      put(x, y, z, z === 0 || z === 1 ? '#f0c419' : '#d8dce2', 'metal', z === 0 || z === 1 ? 0.15 : 0);
    }
    put(0, 0, 4, '#d8dce2', 'metal'); put(0, 0, 5, '#2b3038', 'metal');
    for (const [x, y] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { put(x, y, -4, DARK, 'metal'); put(x, y, -3, DARK, 'metal'); }
    put(0, 0, -5, '#ffd28a', 'energy', 1);
  }),
  torpedo: (put => {
    for (let z = -2; z <= 2; z++) for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++)
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= 3) put(x, y, z, Math.abs(x) + Math.abs(y) <= 1 ? '#ff7bf0' : '#6a2a6a', Math.abs(x) + Math.abs(y) <= 1 ? 'energy' : 'metal', Math.abs(x) + Math.abs(y) <= 1 ? 1 : 0.2);
  }),
  rod: (put => { for (let z = -6; z <= 5; z++) put(0, 0, z, z > 3 ? '#e8ecf0' : '#9aa3ad', 'metal', z > 4 ? 0.4 : 0); for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x, y, -6, DARK, 'metal'); }),
  drill: (put => {
    for (let z = -4; z <= 5; z++) {
      const r = z > 0 ? Math.max(0, 2 - Math.floor(z / 2)) : 2;
      for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) {
        if (x * x + y * y > r * r + 1) continue;
        const spiral = z > 0 && ((x + y + z) & 1);
        put(x, y, z, z > 0 ? (spiral ? '#ffd27a' : '#b8862e') : (z === -4 ? '#ff8a3d' : '#5f6773'), z > 0 ? 'metal' : 'metal', z === -4 ? 0.6 : 0);
      }
    }
    put(0, 0, 6, '#fff0c0', 'energy', 0.6);
  }),
  bomb: (put => {
    for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++)
      if (x * x + y * y + z * z <= 5) put(x, y, z, x * x + y * y + z * z <= 2 ? '#c06bff' : '#1b1424', x * x + y * y + z * z <= 2 ? 'energy' : 'metal', x * x + y * y + z * z <= 2 ? 1 : 0);
  }),
  shell: (put => { for (let z = -2; z <= 2; z++) for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) if (Math.abs(x) + Math.abs(y) < 2) put(x, y, z, z === 2 ? '#ff8a3d' : '#4a4f57', 'metal', z === 2 ? 0.4 : 0); }),
  bomblet: (put => { put(0, 0, 0, '#ffb060', 'energy', 0.8); put(0, 0, -1, '#4a4f57', 'metal'); }),
};

// ---------------------------------------------------------------------------
// the weapons
const C3 = h => hex(h).map(v => v / 255);
const SMOKE = [0.32, 0.3, 0.3];
const W = [
  {
    name: 'Rocket Salvo', tag: 'Missiles', planet: 'Magor', heat: '#ff7a1a', colors: ['#ff8a3d', '#ffd28a', '#5a5550'],
    blurb: 'Five rockets ripple off the rails one after another, curving in on flame trails and leaving smoke behind.',
    impact: 'Flash, sparks and a smoke puff', crater: 'Round, medium',
    fire(A) {
      for (let i = 0; i < 5; i++) A.after(i * 0.16, () => {
        const s = A.ship(0), tg = A.near(A.aim, 0.18);
        A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 0.85, path: 'arc', model: 'rocket', scale: 0.022,
          trail: (p, d) => { A.emit(p, add(scale(d, -0.4), jit(0.15)), 0.35, 0.06, C3('#ff8a3d'), 1.1, { drag: 3 }); A.smoke(p, jit(0.06), 0.9, 0.045, SMOKE, 0.35); },
          hit: () => { A.flash(tg.p, 0.4, C3('#ffd28a')); A.burst(tg.p, 22, 1.0, 0.55, 0.022, [C3('#ff8a3d'), C3('#ffd28a')], tg.n); A.puff(tg.p, tg.n, 6, SMOKE); A.crater(tg, { r: 2.1 }); } });
      });
    },
  },
  {
    name: 'Swarm Missiles', tag: 'Micro-missiles', planet: 'Eyeke', heat: '#ff9a4a', colors: ['#ffffff', '#9fd8ff', '#ff9a4a'],
    blurb: 'Two ships empty their pods: sixteen tiny missiles weave and corkscrew on thin white trails, then pepper the area.',
    impact: 'Many small pops', crater: 'Pockmarked patch',
    fire(A) {
      for (let i = 0; i < 16; i++) A.after(i * 0.05, () => {
        const s = A.ship(i % 2), tg = A.near(A.aim, 0.32);
        A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: rnd(0.7, 1.0), path: 'wiggle', model: 'micro', scale: 0.016,
          trail: (p, d) => A.emit(p, jit(0.05), 0.4, 0.025, [0.9, 0.95, 1], 0.6, { drag: 2 }),
          hit: () => { A.flash(tg.p, 0.14, C3('#ffd0a0')); A.burst(tg.p, 6, 0.7, 0.35, 0.016, [C3('#ff9a4a')], tg.n); A.crater(tg, { r: 1.1 }); } });
      });
    },
  },
  {
    name: 'Laser Lance', tag: 'Beam', planet: 'Kavian', heat: '#ff2a2a', colors: ['#ff2a2a', '#ffffff', '#ff8a8a'],
    blurb: 'A hot red beam with a white core sweeps across the surface, cutting a glowing trench as it goes.',
    impact: 'Continuous spark spray where it touches', crater: 'Long trench',
    fire(A) {
      const s = A.ship(0), a = A.near(A.aim, 0.25), b = A.near(a, 0.5);
      let lastCut = -1;
      A.beam({ dur: 1.2, from: () => A.ship(0).nose, to: u => A.surfaceAlong(a, b, u).p, color: C3('#ff2a2a'), core: [1, 0.9, 0.9], width: 0.05, jag: 0.004,
        each: (u, end) => {
          A.burst(end.p, 2, 0.8, 0.3, 0.014, [C3('#ff8a8a'), [1, 1, 1]], end.n);
          const step = Math.floor(u * 14);
          if (step !== lastCut) { lastCut = step; A.crater(end, { r: 1.25 }); }
        } });
    },
  },
  {
    name: 'Plasma Bolts', tag: 'Energy bolts', planet: 'Neri', heat: '#3dffb0', colors: ['#3dffb0', '#b8fff0', '#0f8a6a'],
    blurb: 'Rapid-fire balls of green plasma, each a fat glowing blob with a short tail, splashing on impact.',
    impact: 'Splash ring of plasma droplets', crater: 'Round, small, many',
    fire(A) {
      for (let i = 0; i < 8; i++) A.after(i * 0.12, () => {
        const s = A.ship(0), tg = A.near(A.aim, 0.2);
        A.proj({ from: s.nose, to: tg, flight: 0.45, path: 'line',
          trail: (p, d) => { A.emit(p, [0, 0, 0], 0.05, 0.16, C3('#3dffb0'), 1.4, { drag: 0 }); A.emit(p, scale(d, -0.2), 0.22, 0.06, C3('#b8fff0'), 0.8, { drag: 4 }); },
          hit: () => { A.flash(tg.p, 0.25, C3('#b8fff0')); A.ring(tg.p, tg.n, 14, 0.9, 0.4, 0.03, C3('#3dffb0'), 1.2); A.crater(tg, { r: 1.5 }); } });
      });
    },
  },
  {
    name: 'Railgun', tag: 'Kinetic slug', planet: 'Rime', heat: '#9fd8ff', colors: ['#ffffff', '#9fd8ff', '#4a6a8a'],
    blurb: 'A short charge of crackling blue-white, then a hypersonic slug: an instant line of light that hangs in the air and punches a deep narrow shaft.',
    impact: 'Shockwave ring and a dust jet', crater: 'Deep, narrow shaft',
    fire(A) {
      const s = A.ship(0), tg = A.near(A.aim, 0.15);
      A.charge(() => A.ship(0).nose, 0.45, C3('#9fd8ff'));
      A.after(0.5, () => {
        const from = A.ship(0).nose;
        A.line(from, tg.p, 0.7, 0.03, [0.85, 0.95, 1], 1.5);
        A.flash(from, 0.18, [1, 1, 1]);
        A.flash(tg.p, 0.3, [1, 1, 1]);
        A.ring(tg.p, tg.n, 28, 1.3, 0.5, 0.025, C3('#9fd8ff'), 1.1);
        A.puff(tg.p, tg.n, 8, [0.6, 0.62, 0.66], 1.4);
        A.crater(tg, { r: 1.0, shape: 'shaft', depth: 9 });
      });
    },
  },
  {
    name: 'Ion Cannon', tag: 'Heavy beam', planet: 'Foundry', heat: '#3f8cff', colors: ['#3f8cff', '#c8e0ff', '#1a2a6a'],
    blurb: 'The frigate charges a blue sphere at its bow, then fires a thick, crackling beam. Electric arcs dance over the impact as the crater grows.',
    impact: 'Arcs of lightning across the surface', crater: 'Large, grows while the beam holds', ship: 'frigate',
    fire(A) {
      const tg = A.near(A.aim, 0.1);
      A.charge(() => A.ship(0).nose, 0.7, C3('#3f8cff'), 0.12);
      A.after(0.75, () => {
        let grown = 0;
        A.beam({ dur: 0.9, from: () => A.ship(0).nose, to: () => tg.p, color: C3('#3f8cff'), core: [0.85, 0.92, 1], width: 0.11, jag: 0.02,
          each: (u, end) => {
            if (Math.random() < 0.35) A.bolt(end.p, add(end.p, scale(norm(add(end.n, jit(2))), rnd(0.15, 0.35))), 0.08, C3('#c8e0ff'), 0.012);
            const g = Math.floor(u * 3);
            if (g !== grown) { grown = g; A.crater(tg, { r: 1.4 + g * 0.7 }); }
          } });
        A.crater(tg, { r: 1.4 });
      });
    },
  },
  {
    name: 'Gravity Bomb', tag: 'Implosion', planet: 'Geode', heat: '#c06bff', colors: ['#c06bff', '#1b1424', '#ffffff'],
    blurb: 'A slow, dark orb wrapped in violet light. On contact everything nearby is sucked inward for half a second, then it pops.',
    impact: 'Implosion, then a violet flash', crater: 'Big and round',
    fire(A) {
      const s = A.ship(0), tg = A.near(A.aim, 0.1);
      A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 1.4, path: 'arc', model: 'bomb', scale: 0.03,
        trail: (p) => { const [u, v] = basis([0, 1, 0]); const a = A.t() * 9; A.emit(add(p, add(scale(u, Math.cos(a) * 0.07), scale(v, Math.sin(a) * 0.07))), [0, 0, 0], 0.3, 0.03, C3('#c06bff'), 1.2, { drag: 0 }); },
        hit: () => {
          A.implode(tg.p, 0.45, 0.5, C3('#c06bff'));
          A.after(0.5, () => { A.flash(tg.p, 0.7, [0.9, 0.75, 1]); A.ring(tg.p, tg.n, 30, 1.6, 0.5, 0.03, C3('#c06bff'), 1.3); A.crater(tg, { r: 3.1 }); });
        } });
    },
  },
  {
    name: 'Cluster Bomb', tag: 'Splitting shell', planet: 'Dune', heat: '#ffb060', colors: ['#ffb060', '#4a4f57', '#ffe2b0'],
    blurb: 'One heavy shell arcs toward the planet and bursts open halfway, scattering eight bomblets that land in a loose ring.',
    impact: 'A rolling chain of small blasts', crater: 'Scattered ring of pits',
    fire(A) {
      const s = A.ship(0), tg = A.near(A.aim, 0.05);
      A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 1.2, path: 'arc', model: 'shell', scale: 0.03, splitAt: 0.55,
        trail: (p, d) => A.smoke(p, jit(0.04), 0.6, 0.035, SMOKE, 0.3),
        split: (p, d) => {
          A.flash(p, 0.2, C3('#ffe2b0'));
          for (let i = 0; i < 8; i++) {
            const t2 = A.near(tg, 0.32);
            A.proj({ from: p, fwd: norm(add(d, jit(0.8))), up: [0, 1, 0], to: t2, flight: rnd(0.45, 0.7), path: 'arc', model: 'bomblet', scale: 0.018,
              trail: (q) => A.emit(q, [0, 0, 0], 0.18, 0.025, C3('#ffb060'), 0.9),
              hit: () => { A.flash(t2.p, 0.22, C3('#ffe2b0')); A.burst(t2.p, 8, 0.8, 0.4, 0.016, [C3('#ffb060')], t2.n); A.puff(t2.p, t2.n, 2, SMOKE); A.crater(t2, { r: 1.4 }); } });
          }
        } });
    },
  },
  {
    name: 'Flak Burst', tag: 'Shotgun', planet: 'Ashfall', heat: '#ffd34a', colors: ['#ffd34a', '#fff4c0', '#8a6a2a'],
    blurb: 'A wide cone of thirty glowing pellets, fast and short-lived. Tracers everywhere, then a shower of sparks over a broad area.',
    impact: 'Dozens of tiny sparks', crater: 'Wide sandblasted scatter',
    fire(A) {
      for (let k = 0; k < 2; k++) A.after(k * 0.35, () => {
        A.flash(A.ship(0).nose, 0.15, C3('#fff4c0'));
        for (let i = 0; i < 15; i++) {
          const tg = A.near(A.aim, 0.45);
          A.proj({ from: A.ship(0).nose, to: tg, flight: rnd(0.25, 0.4), path: 'line',
            trail: (p, d) => A.emit(p, scale(d, -0.05), 0.08, 0.022, C3('#ffd34a'), 1.2, { drag: 0 }),
            hit: () => { A.burst(tg.p, 3, 0.6, 0.25, 0.012, [C3('#fff4c0')], tg.n); A.crater(tg, { r: 0.8 }); } });
        }
      });
    },
  },
  {
    name: 'Chain Lightning', tag: 'Arc', planet: 'Mycel', heat: '#b18cff', colors: ['#b18cff', '#ffffff', '#5a3aa8'],
    blurb: 'A jagged violet bolt leaps from the ship to the surface, then jumps from spot to spot across the planet, flickering.',
    impact: 'Branching bolts, scorch at each jump', crater: 'Several small pits in a chain',
    fire(A) {
      let prev = A.near(A.aim, 0.1);
      const hops = [prev];
      for (let i = 0; i < 4; i++) { prev = A.near(prev, 0.35); hops.push(prev); }
      A.zap(() => A.ship(0).nose, () => hops[0].p, 0.45, C3('#b18cff'));
      hops.forEach((h, i) => A.after(0.08 * (i + 1), () => {
        if (i < hops.length - 1) A.zap(() => h.p, () => hops[i + 1].p, 0.4 - i * 0.05, C3('#b18cff'));
        A.flash(h.p, 0.18, [0.9, 0.85, 1]);
        A.crater(h, { r: 1.2 });
      }));
    },
  },
  {
    name: 'Cryo Ray', tag: 'Freeze beam', planet: 'Veles', heat: '#bfefff', colors: ['#bfefff', '#ffffff', '#3a8ac0'],
    blurb: 'A pale beam that drifts snow instead of sparks. The target frosts over, then shatters into ice shards.',
    impact: 'Frost glow, then shatter', crater: 'Round, frosted rim',
    fire(A) {
      const tg = A.near(A.aim, 0.15);
      A.beam({ dur: 1.0, from: () => A.ship(0).nose, to: () => tg.p, color: C3('#bfefff'), core: [1, 1, 1], width: 0.06, jag: 0.006,
        each: (u, end) => { A.emit(add(end.p, jit(0.25)), add(scale(end.n, 0.1), jit(0.1)), 0.9, 0.018, [0.9, 0.97, 1], 0.9, { drag: 1 }); A.scorch(tg, 2.6); } });
      A.after(1.05, () => { A.flash(tg.p, 0.3, [0.85, 0.95, 1]); A.burst(tg.p, 30, 1.1, 0.7, 0.02, [[0.9, 0.97, 1], C3('#bfefff')], tg.n, 1.5); A.crater(tg, { r: 2.3 }); });
    },
  },
  {
    name: 'Napalm', tag: 'Fire globs', planet: 'Canopy', heat: '#ff6a1a', colors: ['#ff6a1a', '#ffc04a', '#2a1e18'],
    blurb: 'Sticky globs of burning gel lob in on high arcs and splash across the jungle. Flames and black smoke linger on the surface.',
    impact: 'Splash of fire that keeps burning', crater: 'Wide and shallow',
    fire(A) {
      for (let i = 0; i < 5; i++) A.after(i * 0.12, () => {
        const tg = A.near(A.aim, 0.28);
        A.proj({ from: A.ship(0).nose, fwd: add(A.ship(0).fwd, [0, 0.6, 0]), up: [0, 1, 0], to: tg, flight: 0.9, path: 'arc',
          trail: (p, d) => { A.emit(p, jit(0.05), 0.25, 0.07, C3('#ff6a1a'), 1.2, { drag: 2 }); A.emit(p, jit(0.08), 0.15, 0.04, C3('#ffc04a'), 1.0); },
          hit: () => {
            A.burst(tg.p, 14, 0.7, 0.5, 0.04, [C3('#ff6a1a'), C3('#ffc04a')], tg.n, 1.2);
            A.burn(tg, 1.6);
            A.crater(tg, { r: 2.0, shape: 'shallow', depth: 1.2 });
          } });
      });
    },
  },
  {
    name: 'Warhead', tag: 'Nuclear', planet: 'Eyeke', heat: '#ffd27a', colors: ['#ffffff', '#ffd27a', '#ff5a1f'],
    blurb: 'One slow, heavy missile. A blinding white flash, a fireball rolling out along the ground, and a column of smoke rising from the crater.',
    impact: 'White-out flash, ground ring, rising plume', crater: 'Huge', ship: 'frigate',
    fire(A) {
      const tg = A.near(A.aim, 0.05), s = A.ship(0);
      A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 1.3, path: 'arc', model: 'warhead', scale: 0.024,
        trail: (p, d) => { A.emit(p, add(scale(d, -0.3), jit(0.1)), 0.4, 0.07, C3('#ffd28a'), 1.1, { drag: 3 }); A.smoke(p, jit(0.05), 1.2, 0.05, SMOKE, 0.3); },
        hit: () => {
          A.flash(tg.p, 1.4, [1, 1, 1], 0.35);
          A.flash(tg.p, 0.7, C3('#ffd27a'), 0.8);
          A.ring(tg.p, tg.n, 48, 1.2, 0.9, 0.06, C3('#ff8a3d'), 1.2);
          A.after(0.1, () => A.puff(tg.p, tg.n, 26, [0.4, 0.36, 0.34], 2.2, 2.2));
          A.crater(tg, { r: 4.4 });
        } });
    },
  },
  {
    name: 'Antimatter Torpedo', tag: 'Torpedo', planet: 'Brine', heat: '#ff5ae0', colors: ['#ff5ae0', '#ffffff', '#6a2a6a'],
    blurb: 'A glowing magenta torpedo with two spiralling tails. Matter and antimatter meet: a pinpoint of white, then a violent pink burst.',
    impact: 'Pinpoint, then bright ring', crater: 'Large and clean',
    fire(A) {
      const tg = A.near(A.aim, 0.1), s = A.ship(0);
      A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 1.1, path: 'arc', model: 'torpedo', scale: 0.028,
        trail: (p, d) => {
          const [u, v] = basis(d), a = A.t() * 22;
          for (const ph of [0, Math.PI]) A.emit(add(p, add(scale(u, Math.cos(a + ph) * 0.05), scale(v, Math.sin(a + ph) * 0.05))), scale(d, -0.1), 0.45, 0.03, C3('#ff5ae0'), 1.2, { drag: 1 });
        },
        hit: () => {
          A.flash(tg.p, 0.15, [1, 1, 1], 0.15);
          A.after(0.12, () => { A.flash(tg.p, 0.8, C3('#ff5ae0'), 0.4); A.ring(tg.p, tg.n, 36, 1.5, 0.5, 0.035, C3('#ff9af0'), 1.3); A.crater(tg, { r: 3.0 }); });
        } });
    },
  },
  {
    name: 'Mining Drill', tag: 'Burrower', planet: 'Halo', heat: '#ffb347', colors: ['#ffd27a', '#b8862e', '#6a4a2a'],
    blurb: 'A spinning golden drill flies in, bites into the surface and keeps going, spraying sparks and rubble out of the hole it digs.',
    impact: 'Debris fountain', crater: 'Deep shaft, dug over a second',
    fire(A) {
      const tg = A.near(A.aim, 0.05), s = A.ship(0);
      A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 0.8, path: 'arc', model: 'drill', scale: 0.022, spin: 20, keep: 1.3,
        trail: (p, d) => A.emit(sub(p, scale(d, 0.08)), jit(0.05), 0.2, 0.03, C3('#ff8a3d'), 0.8),
        dig: (u, p) => {
          A.burst(tg.p, 2, 0.9, 0.4, 0.016, [C3('#ffd27a'), [1, 0.95, 0.8]], tg.n, 0.3);
          A.smoke(add(tg.p, scale(tg.n, 0.02)), add(scale(tg.n, rnd(0.3, 0.7)), jit(0.3)), 0.9, 0.025, [0.42, 0.33, 0.24], 0.7, 0.5);
          A.crater({ ...tg, p: sub(tg.p, scale(tg.n, u * 0.45)) }, { r: 1.2, quiet: true, shaft: true });
        },
        hit: () => A.crater(tg, { r: 1.3 }) });
    },
  },
  {
    name: 'Kinetic Rods', tag: 'Orbital strike', planet: 'Cinder', heat: '#ffffff', colors: ['#e8ecf0', '#9aa3ad', '#5a5550'],
    blurb: 'Rods of tungsten dropped from high orbit. They come straight down out of nowhere on white streaks and punch shafts with a burst of dust.',
    impact: 'Dust plume and shockwave', crater: 'Narrow shafts',
    fire(A) {
      A.flash(A.ship(0).nose, 0.12, [0.9, 0.95, 1]);
      for (let i = 0; i < 3; i++) A.after(0.15 + i * 0.22, () => {
        const tg = A.near(A.aim, 0.3);
        A.proj({ from: add(tg.p, scale(tg.n, 3.5)), to: tg, flight: 0.3, path: 'line', model: 'rod', scale: 0.02,
          trail: (p, d) => A.emit(p, [0, 0, 0], 0.25, 0.03, [0.95, 0.97, 1], 1.0, { drag: 0 }),
          hit: () => { A.flash(tg.p, 0.35, [1, 1, 1]); A.ring(tg.p, tg.n, 24, 1.1, 0.45, 0.025, [0.9, 0.9, 0.85], 0.9); A.puff(tg.p, tg.n, 10, [0.55, 0.5, 0.45], 1.6); A.crater(tg, { r: 1.3, shape: 'shaft', depth: 7 }); } });
      });
    },
  },
  {
    name: 'Sonic Pulse', tag: 'Wave', planet: 'Reef', heat: '#5af0e0', colors: ['#5af0e0', '#d8fffa', '#1d8a9a'],
    blurb: 'Rings of compressed air travel out from the ship one after another and slam the surface, rippling it away in a broad, shallow bowl.',
    impact: 'Ripple rings across the surface', crater: 'Broad and shallow',
    fire(A) {
      const tg = A.near(A.aim, 0.05);
      for (let i = 0; i < 4; i++) A.after(i * 0.15, () => {
        const from = A.ship(0).nose, d = norm(sub(tg.p, from));
        A.proj({ from, to: tg, flight: 0.7, path: 'line',
          trail: (p) => A.ringNow(p, d, 0.05 + 0.05 * A.progress(), 18, C3('#5af0e0'), 0.9),
          hit: () => { A.ring(tg.p, tg.n, 30, 1.0 + i * 0.25, 0.5, 0.025, C3('#d8fffa'), 1.0); A.crater(tg, { r: 1.8 + i * 0.6, shape: 'shallow', depth: 1.2 }); } });
      });
    },
  },
  {
    name: 'Singularity Mine', tag: 'Black hole', planet: 'Janus', heat: '#ff9a4a', colors: ['#000000', '#ff9a4a', '#ffd9a8'],
    blurb: 'A tiny black hole with a glowing accretion disk drifts in, settles on the surface and swallows the ground around it before winking out.',
    impact: 'Matter spirals in, then a flash', crater: 'Grows from a pinhole to a bowl',
    fire(A) {
      const tg = A.near(A.aim, 0.1), s = A.ship(0);
      A.proj({ from: s.nose, to: tg, flight: 1.1, path: 'line', keep: 1.2,
        trail: (p) => A.hole(p, 0.06),
        dig: (u, p) => { A.hole(tg.p, 0.06 + u * 0.05); A.swirl(tg.p, tg.n, 0.4, C3('#ff9a4a')); if (Math.random() < 0.25) A.crater(tg, { r: 0.8 + u * 2.4, quiet: true }); },
        hit: () => { A.flash(tg.p, 0.5, C3('#ffd9a8')); A.crater(tg, { r: 3.2 }); } });
    },
  },
  {
    name: 'Star Shard', tag: 'Comet', planet: 'Naron', heat: '#ffd36b', colors: ['#ffd36b', '#ffffff', '#c8902a'],
    blurb: 'A golden shard with a long sparkling tail curves in like a comet and lands in a starburst of light rays.',
    impact: 'Radial starburst', crater: 'Round, golden rim',
    fire(A) {
      const tg = A.near(A.aim, 0.1), s = A.ship(0);
      A.proj({ from: s.nose, fwd: norm(add(s.fwd, [0, 0.8, 0])), up: s.up, to: tg, flight: 1.0, path: 'arc',
        trail: (p, d) => {
          A.emit(p, [0, 0, 0], 0.06, 0.13, C3('#fff2c0'), 1.6, { drag: 0 });
          for (let i = 0; i < 2; i++) A.emit(p, add(scale(d, -0.1), jit(0.18)), rnd(0.4, 0.9), rnd(0.01, 0.025), C3('#ffd36b'), rnd(0.6, 1.4), { drag: 1.5, twinkle: true });
        },
        hit: () => { A.flash(tg.p, 0.45, [1, 0.97, 0.85]); A.starburst(tg.p, tg.n, 12, C3('#ffd36b')); A.crater(tg, { r: 2.4 }); } });
    },
  },
  {
    name: 'Nanite Swarm', tag: 'Grey goo', planet: 'Lantern', heat: '#7dff8a', colors: ['#7dff8a', '#9aa3ad', '#2a4a2e'],
    blurb: 'A cloud of tiny machines drifts over, spreads across the surface and quietly eats it, block by block, glittering green as they work.',
    impact: 'No explosion at all: the ground dissolves', crater: 'Irregular, eaten patch',
    fire(A) {
      const tg = A.near(A.aim, 0.05);
      for (let i = 0; i < 40; i++) A.after(i * 0.012, () => {
        const t2 = A.near(tg, 0.28);
        A.proj({ from: add(A.ship(0).nose, jit(0.08)), to: t2, flight: rnd(0.8, 1.2), path: 'wiggle', keep: rnd(0.6, 1.4),
          trail: (p) => A.emit(p, [0, 0, 0], 0.05, 0.02, C3('#9aa3ad'), 0.9, { drag: 0 }),
          dig: (u) => { A.emit(add(t2.p, jit(0.05)), scale(t2.n, 0.05), 0.2, 0.014, C3('#7dff8a'), 1.2, { twinkle: true }); if (Math.random() < 0.08) A.crater(A.near(t2, 0.04), { r: 0.7, quiet: true }); },
          hit: () => A.crater(t2, { r: 0.9, quiet: true }) });
      });
    },
  },
];

// ---------------------------------------------------------------------------
// ships (accent colour per ship); +z forward, +y up
const SHIP_DEFS = {
  fighter: accent => put => {
    for (let z = -5; z <= 5; z++) for (let x = -1; x <= 1; x++) for (let y = 0; y <= 1; y++) {
      if (z >= 4 && Math.abs(x) === 1) continue;
      put(x, y, z, y === 1 ? HULL_L : HULL, 'metal');
    }
    put(0, 0, 6, HULL_L, 'metal'); put(0, 0, 7, accent, 'metal', 0.2);
    put(0, 2, 0, HULL_L, 'metal'); put(0, 2, 1, GLASS, 'crystal', 0.5); put(0, 2, 2, GLASS, 'crystal', 0.5);
    for (let x = 2; x <= 6; x++) {
      const z0 = -4 + ((x - 2) >> 1), z1 = Math.max(z0, 1 - (x - 2));
      for (let z = z0; z <= z1; z++) for (const sx of [-1, 1]) put(sx * x, 0, z, x === 6 ? accent : HULL, 'metal', x === 6 ? 0.25 : 0);
    }
    for (const sx of [-1, 1]) for (let z = 1; z <= 3; z++) put(sx * 3, 0, z, DARK, 'metal');
    for (const sx of [-1, 1]) { put(sx, 0, -6, ENGINE, 'energy', 1); put(sx, 1, -6, ENGINE, 'energy', 1); }
    put(0, 2, -4, accent, 'metal', 0.2); put(0, 2, -5, HULL, 'metal'); put(0, 3, -5, accent, 'metal', 0.2);
  },
  interceptor: accent => put => {
    for (let z = -3; z <= 8; z++) { put(0, 0, z, z > 6 ? accent : HULL_L, 'metal', z > 6 ? 0.2 : 0); put(0, 1, z, HULL, 'metal'); }
    put(0, 2, 3, GLASS, 'crystal', 0.5); put(0, 2, 4, GLASS, 'crystal', 0.5);
    for (const sx of [-1, 1]) {
      for (let z = -6; z <= 3; z++) { put(sx * 4, 0, z, HULL, 'metal'); put(sx * 4, 1, z, z === 3 ? accent : HULL_L, 'metal', z === 3 ? 0.3 : 0); }
      for (let x = 1; x <= 3; x++) { put(sx * x, 0, x - 1, HULL, 'metal'); put(sx * x, 0, x, HULL, 'metal'); }
      for (let x = 5; x <= 7; x++) put(sx * x, 0, 1 - (x - 5) * 2, accent, 'metal', 0.2);
      put(sx * 4, 0, -7, ENGINE, 'energy', 1); put(sx * 4, 1, -7, ENGINE, 'energy', 1);
      put(sx * 4, 2, -5, DARK, 'metal'); put(sx * 4, 3, -6, accent, 'metal', 0.2);
    }
    put(0, 0, -4, ENGINE, 'energy', 1);
  },
  frigate: accent => put => {
    for (let z = -9; z <= 9; z++) {
      const w = z > 6 ? 1 : 2;
      for (let x = -w; x <= w; x++) for (let y = 0; y <= 2; y++) {
        if (z > 8 && y === 2) continue;
        const stripe = Math.abs(x) === w && z % 3 === 0;
        put(x, y, z, y === 2 ? HULL_L : (stripe ? accent : HULL), 'metal', stripe && y === 1 ? 0.3 : 0);
      }
    }
    put(0, 1, 10, HULL_L, 'metal'); put(0, 1, 11, accent, 'metal', 0.2);
    for (let z = -4; z <= 0; z++) for (let x = -1; x <= 1; x++) put(x, 3, z, HULL_L, 'metal');
    for (let x = -1; x <= 1; x++) put(x, 4, -1, GLASS, 'crystal', 0.6);
    put(0, 4, -2, HULL_L, 'metal'); put(0, 5, -2, DARK, 'metal'); put(0, 6, -2, accent, 'energy', 0.8);
    for (const sx of [-1, 1]) {
      for (let z = -9; z <= -2; z++) for (const y of [0, 1]) put(sx * 4, y, z, HULL, 'metal');
      put(sx * 4, 0, -10, ENGINE, 'energy', 1); put(sx * 4, 1, -10, ENGINE, 'energy', 1);
      for (let z = 2; z <= 6; z++) put(sx * 3, 2, z, DARK, 'metal');
    }
    for (let x = -1; x <= 1; x++) for (let y = 0; y <= 1; y++) put(x, y, -10, ENGINE, 'energy', 1);
  },
};

// ---------------------------------------------------------------------------
// The effect engine: scheduled events, projectiles, beams, particles.
// The host supplies the world it plays in:
//   surface(dir, tag) -> target { dir, p, n }   (dir in planet space, p and n in world space)
//   dirOf(worldPoint) -> planet-space direction
//   aim(tag) -> target the volley is aimed at
//   ship(tag, i) -> { pos, fwd, up, right, nose }
//   crater(tag, target, opts)   blocks are destroyed here
//   scorch(tag, target, r)      heat glow only
//   done(tag)                   every event, projectile and beam of this volley has finished
//   spread(tag)                 optional: scales how far hits scatter around the aim point
//   surfaceRadius()             optional: planet radius (centre at the origin); curved
//                               projectile paths are kept outside it
// A tag is any object; the engine counts its outstanding items in tag.items.
function craterWeight(o) {
  if (o.scorchOnly) return 0;
  if (o.shape === 'shaft' || o.shape === 'shallow') return o.r * o.r * (o.depth || o.r);
  return o.r * o.r * o.r;
}
function bez(t, a, b, c, d) { const m = 1 - t; return [0, 1, 2].map(i => m * m * m * a[i] + 3 * m * m * t * b[i] + 3 * m * t * t * c[i] + t * t * t * d[i]); }

function createWorld(host) {
  const CAP = host.particleCap || 4000;
  const W = { t: 0, queue: [], projs: [], beams: [], add: [], alpha: [], ptr: [0, 0], progress: 0 };
  const track = tag => { if (tag) tag.items = (tag.items || 0) + 1; };
  const untrack = tag => { if (tag && --tag.items === 0 && host.done) host.done(tag); };

  function api(tag) {
    const A = {
      t: () => W.t,
      progress: () => W.progress,
      get aim() { return host.aim(tag); },
      ship: (i = 0) => host.ship(tag, i),
      near: (tg, ang) => host.surface(norm(add(tg.dir, jit(ang * 2 * (host.spread ? host.spread(tag) : 1)))), tag),
      surfaceAlong: (a, b, u) => host.surface(norm(lerp(a.dir, b.dir, u)), tag),
      after(d, fn) { track(tag); W.queue.push({ at: W.t + d, fn, tag }); },
      emit(p, v, life, size, c, i, o = {}) {
        const which = o.add === false ? 1 : 0, list = which ? W.alpha : W.add;
        const part = { p: p.slice(), v: v.slice(), life, age: 0, size, c, i, drag: o.drag ?? 2, grow: o.grow || 0, twinkle: !!o.twinkle, pull: o.pull || null };
        if (list.length >= CAP) { W.ptr[which] = (W.ptr[which] + 1) % CAP; list[W.ptr[which]] = part; } else list.push(part);
      },
      smoke(p, v, life, size, c, a, grow = 2.5) { A.emit(p, v, life, size, c, a, { add: false, grow, drag: 1.5 }); },
      burst(p, n, speed, life, size, cols, nrm, spread = 1) {
        for (let i = 0; i < n; i++) A.emit(p, add(scale(nrm || [0, 0, 0], speed * rnd(0.3, 0.8)), jit(speed * spread)), life * rnd(0.6, 1.2), size * rnd(0.7, 1.3), pick(cols), 1.4, { drag: 3 });
      },
      flash(p, size, c, life = 0.22) { A.emit(p, [0, 0, 0], life, size, c, 1.8, { drag: 0 }); },
      puff(p, nrm, n, c, speed = 0.6, life = 1.4) {
        for (let i = 0; i < n; i++) A.smoke(add(p, jit(0.05)), add(scale(nrm, speed * rnd(0.2, 0.6)), jit(speed * 0.4)), life * rnd(0.7, 1.2), rnd(0.04, 0.08), c, 0.55, 3);
      },
      ring(p, nrm, n, speed, life, size, c, i) {
        const [u, v] = basis(nrm);
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; A.emit(add(p, scale(nrm, 0.02)), scale(add(scale(u, Math.cos(a)), scale(v, Math.sin(a))), speed), life, size, c, i, { drag: 3 }); }
      },
      ringNow(p, d, rad, n, c, i) {
        const [u, v] = basis(d);
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; A.emit(add(p, add(scale(u, Math.cos(a) * rad), scale(v, Math.sin(a) * rad))), [0, 0, 0], 0.06, 0.02, c, i, { drag: 0 }); }
      },
      line(a, b, life, size, c, i) {
        const n = Math.ceil(len(sub(b, a)) / 0.02);
        for (let k = 0; k <= n; k++) A.emit(lerp(a, b, k / n), jit(0.01), life * rnd(0.7, 1), size, c, i, { drag: 0 });
      },
      bolt(a, b, life, c, size = 0.016) {
        const segs = 7, d = sub(b, a), [u, v] = basis(norm(d)), L = len(d);
        let prev = a;
        for (let s = 1; s <= segs; s++) {
          const t = s / segs, off = s === segs ? [0, 0, 0] : add(scale(u, rnd(-1, 1) * L * 0.12), scale(v, rnd(-1, 1) * L * 0.12));
          const q = add(lerp(a, b, t), off);
          A.line(prev, q, life, size, c, 1.5);
          prev = q;
        }
      },
      zap(from, to, dur, c) { track(tag); W.beams.push({ t0: W.t, dur, zap: true, from, to, c, last: -1, tag }); },
      beam(o) { track(tag); W.beams.push({ t0: W.t, ...o, tag }); },
      charge(at, dur, c, size = 0.08) {
        for (let k = 0; k < 10; k++) A.after(k * dur / 10, () => {
          const p = at();
          for (let i = 0; i < 6; i++) { const off = scale(norm(jit(2)), size * 2); A.emit(add(p, off), scale(off, -1 / 0.25), 0.25, 0.02, c, 1.3, { drag: 0 }); }
          A.emit(p, [0, 0, 0], 0.12, size * (0.4 + k / 10), c, 1.4, { drag: 0 });
        });
      },
      implode(p, rad, dur, c) {
        for (let i = 0; i < 60; i++) { const off = scale(norm(jit(2)), rad * rnd(0.6, 1)); A.emit(add(p, off), scale(off, -1 / dur), dur, 0.025, c, 1.3, { drag: 0 }); }
      },
      hole(p, size) { A.emit(p, [0, 0, 0], 0.05, size * 2.2, [0.02, 0.0, 0.03], 1.0, { add: false, drag: 0 }); A.emit(p, [0, 0, 0], 0.05, size * 3, [1, 0.55, 0.2], 0.25, { drag: 0 }); },
      swirl(p, nrm, rad, c) {
        const [u, v] = basis(nrm);
        for (let i = 0; i < 3; i++) {
          const a = rnd(0, Math.PI * 2), r = rad * rnd(0.5, 1), q = add(p, add(add(scale(u, Math.cos(a) * r), scale(v, Math.sin(a) * r)), scale(nrm, 0.04)));
          A.emit(q, [0, 0, 0], 0.6, 0.02, c, 1.3, { drag: 0, pull: { c: p, axis: nrm } });
        }
      },
      starburst(p, nrm, rays, c) {
        const [u, v] = basis(nrm);
        for (let k = 0; k < rays; k++) {
          const a = k / rays * Math.PI * 2, d = norm(add(add(scale(u, Math.cos(a)), scale(v, Math.sin(a))), scale(nrm, 0.5)));
          for (let s = 0; s < 6; s++) A.emit(add(p, scale(d, s * 0.03)), scale(d, 1.2), 0.45, 0.03 - s * 0.003, c, 1.5, { drag: 4 });
        }
      },
      burn(tg, dur) {
        for (let k = 0; k < dur * 20; k++) A.after(k / 20, () => {
          const p = add(tg.p, add(jit(0.25), scale(tg.n, 0.01)));
          A.emit(p, add(scale(tg.n, rnd(0.2, 0.5)), jit(0.1)), 0.45, 0.04, pick([C3('#ff6a1a'), C3('#ffc04a')]), 1.1, { drag: 1 });
          if (k % 2 === 0) A.smoke(p, add(scale(tg.n, 0.35), jit(0.1)), 1.4, 0.05, [0.16, 0.13, 0.12], 0.45, 2.5);
        });
      },
      scorch(tg, r) { host.scorch(tag, tg, r); },
      crater(tg, o) {
        host.crater(tag, tg, o);
        if (!o.quiet && !o.scorchOnly) for (let i = 0; i < 4; i++) A.smoke(add(tg.p, jit(0.04)), add(scale(tg.n, rnd(0.2, 0.5)), jit(0.2)), 0.9, 0.035, [0.3, 0.27, 0.25], 0.4, 2);
      },
      proj(o) { track(tag); W.projs.push({ t0: W.t, pos: o.from.slice(), dir: o.fwd || norm(sub(o.to.p, o.from)), ...o, phase: 'fly', splitDone: false, tag }); },
    };
    return A;
  }

  const emitter = api(null);
  function update(dt) {
    W.t += dt;
    for (let i = 0; i < W.queue.length; i++) if (W.queue[i].at <= W.t) { const e = W.queue.splice(i--, 1)[0]; e.fn(); untrack(e.tag); }
    for (let i = 0; i < W.projs.length; i++) {
      const pj = W.projs[i];
      if (pj.phase === 'fly') {
        const u = Math.min(1, (W.t - pj.t0) / pj.flight);
        const to = pj.to.p;
        let pos;
        if (pj.path === 'line') pos = lerp(pj.from, to, u);
        else {
          const c1 = add(pj.from, add(scale(pj.fwd || norm(sub(to, pj.from)), 0.8), scale(pj.up || [0, 1, 0], 0.25)));
          const c2 = add(to, scale(pj.to.n, 0.6));
          pos = bez(u, pj.from, c1, c2, to);
          if (pj.path === 'wiggle') { const [a, b] = basis(norm(sub(to, pj.from))); pos = add(pos, add(scale(a, Math.sin(u * 18 + i) * 0.08 * (1 - u)), scale(b, Math.cos(u * 15 + i * 2) * 0.08 * (1 - u)))); }
          // curved paths must not cut through the planet: stay above its surface,
          // only dropping to the target's own depth on the final approach
          if (host.surfaceRadius) {
            const rs = host.surfaceRadius(), rt = len(to), rp = len(pos);
            const k = Math.min(1, Math.max(0, (u - 0.8) / 0.2)), rmin = rs + (Math.min(rt, rs) - rs) * k * k * (3 - 2 * k);
            if (rp < rmin && rp > 1e-6) pos = scale(pos, rmin / rp);
          }
        }
        pj.dir = norm(sub(pos, pj.pos)); pj.pos = pos;
        W.progress = u;
        if (pj.trail) pj.trail(pos, pj.dir, u);
        if (pj.split && !pj.splitDone && u >= pj.splitAt) { pj.splitDone = true; pj.split(pos, pj.dir); W.projs.splice(i--, 1); untrack(pj.tag); continue; }
        if (u >= 1) {
          if (pj.keep) { pj.phase = 'dig'; pj.t1 = W.t; pj.digFrom = pos; }
          else { if (pj.hit) pj.hit(); W.projs.splice(i--, 1); untrack(pj.tag); }
        }
      } else {
        const v = Math.min(1, (W.t - pj.t1) / pj.keep);
        pj.pos = sub(pj.digFrom, scale(pj.to.n, v * (pj.spin ? 0.45 : 0)));
        if (pj.dig) pj.dig(v, pj.pos);
        if (v >= 1) { if (pj.hit) pj.hit(); W.projs.splice(i--, 1); untrack(pj.tag); }
      }
    }
    for (let i = 0; i < W.beams.length; i++) {
      const b = W.beams[i], u = (W.t - b.t0) / b.dur;
      if (u >= 1) { W.beams.splice(i--, 1); untrack(b.tag); continue; }
      const from = b.from(), to = b.to(u);
      if (b.zap) {
        if (Math.floor(W.t * 25) !== b.last) { b.last = Math.floor(W.t * 25); emitter.bolt(from, to, 0.05, b.c); emitter.bolt(from, to, 0.04, [1, 1, 1], 0.008); }
        continue;
      }
      const L = len(sub(to, from)), n = Math.ceil(L / 0.025), fade = Math.min(1, u * 8, (1 - u) * 8);
      for (let k = 0; k <= n; k++) {
        const q = add(lerp(from, to, k / n), jit(b.jag || 0));
        emitter.emit(q, [0, 0, 0], 0.035, b.width * fade, b.color, 1.0, { drag: 0 });
        if (k % 2 === 0) emitter.emit(q, [0, 0, 0], 0.035, b.width * 0.4 * fade, b.core, 1.3, { drag: 0 });
      }
      emitter.flash(to, b.width * 3 * fade, b.color, 0.05);
      if (b.each) b.each(u, host.surface(host.dirOf(to), b.tag));
    }
    for (const list of [W.add, W.alpha]) {
      let j = 0;
      for (const p of list) {
        p.age += dt;
        if (p.age >= p.life) continue;
        if (p.pull) {   // swirl into a point around an axis
          const d = norm(sub(p.pull.c, p.p)), tang = cross(p.pull.axis, d);
          p.v[0] = d[0] * 0.5 + tang[0] * 1.2; p.v[1] = d[1] * 0.5 + tang[1] * 1.2; p.v[2] = d[2] * 0.5 + tang[2] * 1.2;
        } else { const k = Math.exp(-p.drag * dt); p.v[0] *= k; p.v[1] *= k; p.v[2] *= k; }
        p.p[0] += p.v[0] * dt; p.p[1] += p.v[1] * dt; p.p[2] += p.v[2] * dt;
        list[j++] = p;
      }
      list.length = j;
    }
  }
  function clear() { W.queue.length = W.projs.length = W.beams.length = W.add.length = W.alpha.length = 0; }
  return { W, api, update, clear };
}

// Dry run of a weapon against a dummy target: how much crater it digs in total
// (relative units) and when it finishes. The game uses this to share a volley's
// blocks out over that weapon's hits.
function measure(w) {
  let weight = 0, last = 0, finished = false;
  const tgt = d => ({ dir: d, n: d, p: d });
  const host = {
    surface: d => tgt(d), dirOf: p => norm(p), aim: () => tgt(norm([-0.62, 0.22, 0.75])),
    ship: () => ({ pos: [-2.2, 0.4, 0.6], fwd: norm([2.2, -0.4, -0.6]), up: [0, 1, 0], right: [1, 0, 0], nose: [-2.0, 0.36, 0.55] }),
    crater: (tag, t, o) => { weight += craterWeight(o); last = world.W.t; },
    scorch() {}, done: () => { finished = true; }, particleCap: 300,
  };
  const world = createWorld(host);
  w.fire(world.api({ items: 0 }));
  while (!finished && world.W.t < 10) world.update(1 / 30);
  return { weight: weight || 1, last, end: world.W.t };
}

return {
  WEAPONS: W, SHIP_DEFS, MODEL_DEFS, createWorld, measure, craterWeight,
  util: { add, sub, scale, dot, cross, len, norm, lerp, rnd, jit, pick, basis, rotateAround, hex, C3 },
};
})();
