'use strict';
/*
  An alternate set of single shots for the 49 Alien Worlds weapons, each one distinct, the spectacle
  growing with the card's rarity: Abundant really plain, Common still plain, Rare nice, Epic a second
  effect, Legendary stands out, Mythical REALLY stands out. The shine adds its finish on top (T.shineTrail,
  T.spark). Loaded after aw-designs.js, it switches itself on: AWDesign.shotOf returns these shots.
  (Designed and compared against the earlier shots in the playground's weapons-now.html.)
  Each call fires ONE shot of a burst (an attack is up to 18 of them, 0.14 s apart), so the biggest
  flourishes come on every few shots, not all of them.
*/
const ShotsAlt = (() => {
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rnd = (a, b) => a + Math.random() * (b - a), jit = r => [rnd(-r, r), rnd(-r, r), rnd(-r, r)];
  const basis = n => { const t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(n, t)); return [u, cross(n, u)]; };
  const side = d => { const s = norm(cross(d, [0, 1, 0.01])); return [s, norm(cross(s, d))]; };
  const C = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const WHITE = [1, 1, 1], DUST = [0.5, 0.45, 0.38], SMOKE = [0.22, 0.2, 0.2], BLACKS = [0.04, 0.02, 0.06];
  const count = {};   // shots fired per weapon: the big flourishes come every few shots
  const every = (name, n) => ((count[name] = (count[name] || 0) + 1) % n) === 1 || n === 1;

  // one projectile from the ship's nose to a spot near the aim; o.hit(tg) adds the weapon's touch
  function fly(A, T, o) {
    const s = A.ship(0), tg = o.tg || A.near(A.aim, o.spread ?? 0.1);
    if (o.muzzle !== false) T.muzzle(s.nose, s.fwd);
    A.proj({
      from: o.from || s.nose, fwd: o.fwd || s.fwd, up: s.up, to: tg, flight: o.flight ?? 0.32, path: o.path || 'line',
      model: o.model, scale: o.scale, spin: o.spin, keep: o.keep, dig: o.dig, splitAt: o.splitAt, split: o.split,
      trail: (p, d, u) => { if (o.trail) o.trail(p, d, u, tg); if (T.S && o.shine !== false) T.shineTrail(p, d, 0.03); },
      hit: () => { T.spark(tg, o.col || T.pal.main); if (o.hit) o.hit(tg); if (o.r) A.crater(tg, { r: o.r, quiet: o.quiet ?? true }); },
    });
    return tg;
  }
  const dot1 = (A, p, size, c, life = 0.05, i = 1.2) => A.emit(p, [0, 0, 0], life, size, c, i, { drag: 0 });
  const above = (tg, h) => add(tg.p, scale(tg.n, h));
  // a little sphere outline (a bubble) at p
  const bubbleAt = (A, p, d, r, c) => { A.ringNow(p, d, r, 10, c, 1.0); const [s1] = side(d); A.ringNow(p, s1, r, 10, c, 0.8); };
  // a helix of particles around the flight line
  const helix = (A, p, d, u, r, c, turns = 6, strands = 2, size = 0.016) => {
    const [s1, s2] = side(d);
    for (let k = 0; k < strands; k++) { const a = u * Math.PI * 2 * turns + k * Math.PI * 2 / strands; dot1(A, add(p, add(scale(s1, Math.cos(a) * r), scale(s2, Math.sin(a) * r))), size, c, 0.18, 1.3); }
  };
  // droplets thrown up and out (a splash)
  const splash = (A, tg, n, c, h = 0.9, w = 0.5, size = 0.014) => { for (let i = 0; i < n; i++) A.emit(above(tg, 0.01), add(scale(tg.n, h * rnd(0.5, 1)), jit(w)), rnd(0.4, 0.8), size * rnd(0.7, 1.3), c, 1.2, { drag: 2.5 }); };
  // bubbles drifting up from a spot
  const bubbles = (A, tg, n, c, size = 0.012) => { for (let i = 0; i < n; i++) A.after(i * 0.03, () => A.emit(add(above(tg, 0.02), jit(0.06)), add(scale(tg.n, rnd(0.15, 0.35)), jit(0.05)), rnd(0.7, 1.2), size * rnd(0.8, 1.6), c, 0.9, { drag: 0.5, twinkle: true })); };
  // a pillar of light standing on the spot
  const pillar = (A, tg, h, c, w = 0.03, life = 0.35) => A.line(tg.p, above(tg, h), life, w, c, 1.5);
  // a short beam from the ship's nose that follows the spot, then craters it
  const beam = (A, T, tg, dur, color, core, width, r, each) => {
    A.beam({ dur, from: () => A.ship(0).nose, to: () => tg.p, color, core, width, jag: width * 0.08, each });
    A.after(dur * 0.9, () => { T.spark(tg, color); A.crater(tg, { r, quiet: true }); });
  };

  const SHOTS = {
    // =============================================================== Abundant: really plain
    'Standard Sword': (A, T) => fly(A, T, { flight: 0.3, trail: (p, d) => dot1(A, p, 0.014, [0.85, 0.82, 0.75], 0.04, 0.8) }),
    'Standard Issue Axe': (A, T) => fly(A, T, { flight: 0.36, trail: (p, d, u) => { const [s1] = side(d), a = u * 30; dot1(A, add(p, scale(s1, Math.cos(a) * 0.012)), 0.013, [0.8, 0.78, 0.72], 0.05, 0.8); } }),
    'Standard Shield': (A, T) => fly(A, T, { flight: 0.34, trail: (p, d) => A.ringNow(p, d, 0.016, 6, [0.8, 0.78, 0.72], 0.7) }),
    'Rock Cudgel': (A, T) => fly(A, T, { flight: 0.45, path: 'arc', trail: (p, d) => dot1(A, p, 0.02, [0.45, 0.42, 0.38], 0.05, 0.6),
      hit: tg => A.puff(tg.p, tg.n, 1, DUST, 0.3, 0.8) }),

    // =============================================================== Common: still plain, a theme
    'Lithium Dagger': (A, T) => fly(A, T, { flight: 0.18, trail: (p, d) => A.line(p, sub(p, scale(d, 0.08)), 0.04, 0.008, [0.6, 0.9, 1], 1.2) }),
    'Sky Shield': (A, T) => fly(A, T, { flight: 0.42, path: 'arc', trail: (p, d) => A.ringNow(p, d, 0.025, 8, [0.5, 0.85, 1], 1.0),
      hit: tg => A.ring(tg.p, tg.n, 8, 0.3, 0.25, 0.008, [0.5, 0.85, 1], 1) }),
    'Stave of Deception': (A, T) => fly(A, T, { flight: 0.4, splitAt: 0.45,
      trail: (p, d) => dot1(A, p, 0.028, [1, 0.5, 0.15], 0.05, 1.2),
      split: (p, d) => {   // two decoys fizzle off, one goes on
        for (const k of [-1, 1]) { const off = side(d)[0]; for (let i = 0; i < 4; i++) A.emit(p, add(scale(off, k * 0.5), jit(0.1)), 0.3, 0.02, [1, 0.6, 0.2], 0.9, { drag: 3 }); }
        fly(A, T, { muzzle: false, from: p, fwd: d, flight: 0.18, trail: (q) => dot1(A, q, 0.028, [1, 0.5, 0.15], 0.05, 1.2) });
      } }),
    'Infernal Axe': (A, T) => fly(A, T, { flight: 0.38, trail: (p, d, u) => { const [s1, s2] = side(d), a = u * 26; dot1(A, add(p, add(scale(s2, Math.cos(a) * 0.02), scale(d, Math.sin(a) * 0.02))), 0.02, [1, 0.45, 0.1], 0.06, 1.2); if (Math.random() < 0.3) A.emit(p, jit(0.08), 0.3, 0.01, [1, 0.8, 0.3], 1.2, { drag: 2 }); },
      hit: tg => A.burst(tg.p, 4, 0.5, 0.35, 0.014, [[1, 0.5, 0.1]], tg.n) }),
    'Plasma Shield': (A, T) => fly(A, T, { flight: 0.36, trail: (p, d) => { A.ringNow(p, d, 0.026, 9, [1, 0.5, 0.15], 1.1); dot1(A, p, 0.02, [1, 0.85, 0.5], 0.04, 1); },
      hit: tg => A.ring(tg.p, tg.n, 10, 0.45, 0.25, 0.01, [1, 0.6, 0.2], 1.1) }),
    'Magori Revolver': (A, T) => fly(A, T, { flight: 0.12, trail: (p, d) => A.line(p, sub(p, scale(d, 0.14)), 0.03, 0.007, [1, 0.75, 0.35], 1.3),
      hit: tg => A.flash(tg.p, 0.05, [1, 0.8, 0.4], 0.08) }),
    'Elgem Dartgun': (A, T) => fly(A, T, { flight: 0.22, trail: (p, d) => { dot1(A, p, 0.012, [0.85, 0.5, 1], 0.04, 1.2); A.line(p, sub(p, scale(d, 0.05)), 0.04, 0.006, [0.6, 0.3, 1], 1); },
      hit: tg => A.after(0.25, () => { A.flash(tg.p, 0.07, [0.85, 0.5, 1], 0.1); A.burst(tg.p, 4, 0.4, 0.3, 0.01, [[0.85, 0.5, 1]], tg.n); }) }),   // sticks, then pops
    'Titanium Dagger': (A, T) => fly(A, T, { flight: 0.2, trail: (p, d) => { A.line(p, sub(p, scale(d, 0.06)), 0.04, 0.008, [0.85, 0.9, 0.95], 1.2); },
      hit: tg => { const [u] = basis(tg.n); A.line(add(tg.p, scale(u, -0.04)), add(tg.p, scale(u, 0.04)), 0.12, 0.006, WHITE, 1.5); } }),
    'Widow Maker': (A, T) => fly(A, T, { flight: 0.14, trail: (p, d) => A.line(p, sub(p, scale(d, 0.1)), 0.05, 0.012, [0.7, 0.75, 0.8], 1.1),
      hit: tg => { A.puff(tg.p, tg.n, 2, DUST, 0.7, 0.9); }, r: 0.7 }),
    'Spike Hammer': (A, T) => fly(A, T, { flight: 0.42, path: 'arc', trail: (p, d) => { dot1(A, p, 0.024, [0.7, 0.75, 0.82], 0.05, 1); },
      hit: tg => A.ring(tg.p, tg.n, 10, 0.5, 0.3, 0.012, DUST, 0.9) }),
    'Rock Blade': (A, T) => fly(A, T, { flight: 0.32, trail: (p, d) => { const [s1] = side(d); for (const k of [-1, 0, 1]) dot1(A, add(p, add(scale(s1, k * 0.022), scale(d, -Math.abs(k) * 0.01))), 0.014, [0.55, 0.62, 0.35], 0.05, 1); },
      hit: tg => A.puff(tg.p, tg.n, 2, DUST, 0.4, 0.8) }),
    'Kite Axe': (A, T) => fly(A, T, { flight: 0.5, path: 'wiggle', trail: (p, d, u) => { const [s1] = side(d), a = u * 30; dot1(A, add(p, scale(s1, Math.cos(a) * 0.02)), 0.018, [0.92, 0.88, 0.78], 0.06, 1); } }),
    'Confuser': (A, T) => fly(A, T, { flight: 0.45, path: 'wiggle', trail: (p, d, u) => dot1(A, p, 0.02, [[1, 0.4, 0.4], [0.4, 1, 0.4], [0.4, 0.6, 1]][Math.floor(u * 9) % 3], 0.07, 1.2) }),
    'Blackbolt Arbalest': (A, T) => fly(A, T, { flight: 0.16, trail: (p, d) => { A.emit(p, [0, 0, 0], 0.05, 0.02, BLACKS, 0.9, { add: false, drag: 0 }); A.line(p, sub(p, scale(d, 0.12)), 0.05, 0.006, WHITE, 1.2); } }),

    // =============================================================== Rare: nice, the weapon's own idea
    'Jaggered Spear': (A, T) => fly(A, T, { flight: 0.24, trail: (p, d) => { A.line(p, sub(p, scale(d, 0.12)), 0.05, 0.012, [0.6, 0.9, 1], 1.4); if (Math.random() < 0.35) A.bolt(p, add(p, jit(0.08)), 0.05, [0.85, 0.95, 1], 0.007); },
      hit: tg => A.after(0.05, () => A.bolt(above(tg, 0.5), tg.p, 0.12, [0.85, 0.95, 1], 0.014)) }),   // lightning answers from above
    'Storm Edge Sword': (A, T) => fly(A, T, { flight: 0.3, trail: (p, d) => { const [s1, s2] = side(d); for (let i = 0; i <= 4; i++) { const a = (i / 4 - 0.5) * 2.2; dot1(A, add(p, add(scale(s1, Math.sin(a) * 0.05), scale(d, -Math.cos(a) * 0.025))), 0.016, i === 2 ? WHITE : [0.45, 0.85, 1], 0.06, 1.2); } },
      hit: tg => { for (let i = 0; i < 2; i++) { const t2 = A.near(tg, 0.05); A.bolt(above(tg, 0.02), above(t2, 0.02), 0.1, [0.85, 0.95, 1], 0.01); } } }),
    'Moonshot Blade': (A, T) => fly(A, T, { flight: 0.5, path: 'arc', trail: (p, d, u) => { const [s1, s2] = side(d); for (let i = 0; i < 6; i++) { const a = i / 5 * Math.PI; dot1(A, add(p, add(scale(s1, Math.cos(a) * 0.04), scale(s2, Math.sin(a) * 0.04 - 0.02))), 0.012, [0.9, 0.93, 1], 0.05, 1.3); } },
      hit: tg => A.ring(tg.p, tg.n, 14, 0.5, 0.35, 0.012, [0.9, 0.93, 1], 1.3) }),
    'Reptiloid Blade': (A, T) => fly(A, T, { flight: 0.38, path: 'wiggle', trail: (p, d) => { dot1(A, p, 0.026, [0.5, 1, 0.2], 0.06, 1.2); A.emit(p, jit(0.04), 0.4, 0.012, [0.2, 0.7, 0.1], 1, { drag: 2 }); },
      hit: tg => { splash(A, tg, 6, [0.5, 1, 0.2], 0.5, 0.4); bubbles(A, tg, 6, [0.6, 1, 0.3]); } }),   // venom fizzes
    'Emberfire Shotgun': (A, T) => { const s = A.ship(0); T.muzzle(s.nose, s.fwd); A.flash(s.nose, 0.1, [1, 0.6, 0.2], 0.1);
      for (let i = 0; i < 4; i++) fly(A, T, { muzzle: false, spread: 0.2, flight: rnd(0.14, 0.2), trail: (p, d) => A.line(p, sub(p, scale(d, 0.06)), 0.04, 0.008, [1, 0.55, 0.15], 1.2) }); },
    'Emerald Dagger': (A, T) => fly(A, T, { flight: 0.24, trail: (p, d) => { const [s1] = side(d); for (const k of [-1, 1]) dot1(A, add(p, scale(s1, k * 0.012)), 0.014, [0.3, 1, 0.55], 0.05, 1.3); dot1(A, add(p, scale(d, 0.02)), 0.01, WHITE, 0.04, 1.4); },
      hit: tg => { for (let i = 0; i < 6; i++) A.emit(above(tg, 0.01), add(scale(tg.n, rnd(0.4, 0.8)), jit(0.5)), 0.5, 0.016, i % 2 ? [0.3, 1, 0.55] : [0.8, 1, 0.85], 1.4, { drag: 3 }); } }),   // shatters into crystals
    'Waxon Sword': (A, T) => fly(A, T, { flight: 0.3, trail: (p, d) => { const [s1] = side(d); A.line(add(p, scale(s1, -0.05)), add(p, scale(s1, 0.05)), 0.06, 0.01, [0.85, 0.5, 1], 1.3); },
      hit: tg => { const [u] = basis(tg.n); A.line(add(tg.p, scale(u, -0.12)), add(tg.p, scale(u, 0.12)), 0.5, 0.012, [1, 0.8, 1], 1.4); } }),   // leaves a glowing slash
    'Necromancers Hammer': (A, T) => fly(A, T, { flight: 0.45, path: 'arc', trail: (p, d) => { dot1(A, p, 0.03, [0.6, 0.3, 0.9], 0.06, 1.1); A.smoke(p, jit(0.05), 0.6, 0.03, [0.15, 0.08, 0.2], 0.5, 2); },
      hit: tg => { for (let i = 0; i < 4; i++) A.emit(add(above(tg, 0.03), jit(0.05)), add(scale(tg.n, rnd(0.2, 0.4)), jit(0.06)), 1.0, 0.02, [0.7, 0.9, 0.8], 0.8, { drag: 0.6, twinkle: true }); } }),   // wisps rise
    'Dawn Sword': (A, T) => fly(A, T, { flight: 0.14, trail: (p, d) => A.line(p, sub(p, scale(d, 0.3)), 0.06, 0.014, [1, 0.8, 0.45], 1.4),
      hit: tg => { A.ring(tg.p, tg.n, 16, 0.6, 0.35, 0.012, [1, 0.7, 0.35], 1.3); A.flash(tg.p, 0.1, [1, 0.95, 0.8], 0.15); } }),
    'Nordic Warhammer': (A, T) => fly(A, T, { flight: 0.42, path: 'arc', trail: (p, d) => { dot1(A, p, 0.03, [0.75, 0.8, 0.9], 0.05, 1.1); if (Math.random() < 0.25) A.bolt(p, add(p, jit(0.07)), 0.05, [0.85, 0.95, 1], 0.007); },
      hit: tg => { A.bolt(above(tg, 0.8), tg.p, 0.14, [0.9, 0.95, 1], 0.016); A.ring(tg.p, tg.n, 12, 0.6, 0.3, 0.014, DUST, 0.9); } }),   // thunder strikes
    'Green Axe': (A, T) => fly(A, T, { flight: 0.4, trail: (p, d, u) => { const [s1, s2] = side(d), a = u * 28; dot1(A, add(p, add(scale(s2, Math.cos(a) * 0.025), scale(d, Math.sin(a) * 0.025))), 0.02, [0.45, 0.9, 0.3], 0.06, 1.1); },
      hit: tg => { for (let i = 0; i < 6; i++) A.emit(above(tg, 0.05), add(scale(tg.n, rnd(0.2, 0.5)), jit(0.35)), 1.1, 0.014, i % 2 ? [0.45, 0.9, 0.3] : [0.75, 0.95, 0.4], 1, { drag: 1.5, twinkle: true }); } }),   // leaves flutter
    'Equalizer Bow': (A, T) => fly(A, T, { flight: 0.22, trail: (p, d) => { const [s1] = side(d); for (const k of [-1, 1]) A.line(add(p, scale(s1, k * 0.012)), add(sub(p, scale(d, 0.1)), scale(s1, k * 0.012)), 0.05, 0.006, [0.95, 0.9, 0.8], 1.2); },
      hit: tg => { A.ring(tg.p, tg.n, 12, 0.4, 0.3, 0.01, [0.95, 0.9, 0.8], 1.2); A.ring(tg.p, tg.n, 12, 0.25, 0.3, 0.01, [0.95, 0.9, 0.8], 1.2); } }),

    // =============================================================== Epic: nice to look at, a second effect
    'Star Fire Sword': (A, T) => fly(A, T, { flight: 0.36, path: 'arc', trail: (p, d) => { dot1(A, p, 0.045, [1, 0.6, 0.2], 0.06, 1.4); dot1(A, p, 0.022, [1, 0.95, 0.75], 0.05, 1.6); A.emit(p, add(scale(d, -0.3), jit(0.15)), 0.4, 0.012, [1, 0.9, 0.5], 1.5, { drag: 2, twinkle: true }); },
      hit: tg => { A.starburst(tg.p, tg.n, 7, [1, 0.75, 0.3]); A.flash(tg.p, 0.18, [1, 0.9, 0.6], 0.18); }, r: 0.8 }),
    'Randomizer Bow': (A, T) => { const pick = Math.floor(Math.random() * 4), cols = [[1, 0.4, 0.3], [0.3, 1, 0.5], [0.4, 0.6, 1], [1, 0.9, 0.3]][pick];
      fly(A, T, { flight: 0.24, col: cols, trail: (p, d) => A.line(p, sub(p, scale(d, 0.12)), 0.05, 0.01, cols, 1.4),
        hit: tg => [() => A.burn(tg, 0.4), () => bubbles(A, tg, 8, [0.5, 1, 0.7]), () => A.bolt(above(tg, 0.6), tg.p, 0.12, [0.6, 0.8, 1], 0.014), () => A.starburst(tg.p, tg.n, 6, [1, 0.9, 0.3])][pick]() }); },
    'Waxon Mortar': (A, T) => {   // a bomb lobbed high: whistle trail, a big blast and a smoke column
      const tg = A.near(A.aim, 0.12), s = A.ship(0);
      T.muzzle(s.nose, s.fwd); A.puff(s.nose, s.fwd, 2, SMOKE, 0.4, 0.8);
      A.proj({ from: s.nose, fwd: norm(add(s.fwd, scale(s.up, 1.2))), up: s.up, to: tg, flight: 0.7, path: 'arc', model: 'bomb', scale: 0.016,
        trail: (p, d) => { A.smoke(p, jit(0.02), 0.5, 0.018, [0.4, 0.35, 0.35], 0.35, 2); if (T.S) T.shineTrail(p, d, 0.03); },
        hit: () => { A.flash(tg.p, 0.3, [1, 0.8, 0.5], 0.2); A.burst(tg.p, 12, 0.9, 0.5, 0.02, [[1, 0.5, 0.15], [1, 0.85, 0.4]], tg.n); A.ring(tg.p, tg.n, 18, 0.9, 0.4, 0.016, [1, 0.6, 0.2], 1.2);
          for (let i = 0; i < 5; i++) A.smoke(above(tg, 0.05 + i * 0.04), add(scale(tg.n, 0.3), jit(0.05)), 1.6, 0.06, [0.25, 0.22, 0.22], 0.5, 2.5);
          T.spark(tg, [1, 0.6, 0.2]); A.crater(tg, { r: 1.2 }); } }); },
    'Waxon Staff': (A, T) => fly(A, T, { flight: 0.42, trail: (p, d, u) => { dot1(A, p, 0.028, [0.75, 0.4, 1], 0.05, 1.3); helix(A, p, d, u, 0.035, [0.95, 0.75, 1], 5, 2); },
      hit: tg => { for (let i = 0; i < 4; i++) A.swirl(tg.p, tg.n, 0.12, [0.8, 0.5, 1]); A.after(0.3, () => A.flash(tg.p, 0.12, [1, 0.8, 1], 0.12)); }, r: 0.8 }),   // a violet vortex
    'Sandmaster Spear': (A, T) => fly(A, T, { flight: 0.28, trail: (p, d) => { A.line(p, sub(p, scale(d, 0.1)), 0.05, 0.012, [0.95, 0.8, 0.5], 1.3); A.emit(p, jit(0.05), 0.5, 0.016, [0.85, 0.7, 0.45], 0.7, { add: false, drag: 2 }); },
      hit: tg => { for (let i = 0; i < 14; i++) A.after(i * 0.03, () => { const h = i * 0.025, [u, v] = basis(tg.n), a = i * 1.3, r = 0.04 + h * 0.4; A.smoke(add(above(tg, h), add(scale(u, Math.cos(a) * r), scale(v, Math.sin(a) * r))), add(scale(tg.n, 0.3), add(scale(u, -Math.sin(a) * 0.4), scale(v, Math.cos(a) * 0.4))), 0.7, 0.03, [0.85, 0.72, 0.5], 0.5, 1.5); }); }, r: 0.8 }),   // a sand twister
    'Dagger of Creation': (A, T) => fly(A, T, { flight: 0.28, trail: (p, d) => { dot1(A, p, 0.02, [0.5, 1, 0.4], 0.05, 1.3); if (Math.random() < 0.4) A.emit(p, jit(0.05), 0.5, 0.01, [0.9, 1, 0.6], 1.3, { drag: 2, twinkle: true }); },
      hit: tg => { for (let s = 0; s < 3; s++) { const t2 = A.near(tg, 0.05), [u] = basis(t2.n); for (let k = 0; k < 6; k++) A.after(k * 0.04, () => dot1(A, add(above(t2, k * 0.03), scale(u, Math.sin(k + s) * 0.015)), 0.016, k > 4 ? [1, 0.6, 0.9] : [0.4, 0.95, 0.35], 0.7, 1.2)); } } }),   // sprouts grow and bloom
    'Waxon Shield': (A, T) => fly(A, T, { flight: 0.5, path: 'arc', trail: (p, d) => bubbleAt(A, p, d, 0.035, [0.6, 0.95, 1]),
      hit: tg => { splash(A, tg, 12, [0.6, 0.9, 1], 0.9, 0.5); bubbles(A, tg, 8, [0.8, 0.95, 1], 0.014); }, r: 0.8 }),   // a bubble that bursts into a splash
    'Elite Dagger': (A, T) => { const tg = A.near(A.aim, 0.08); beam(A, T, tg, 0.13, [1, 0.85, 0.5], [1, 1, 0.95], 0.018, 0.7); },   // a precise laser
    'Toothed Dagger': (A, T) => fly(A, T, { flight: 0.32, keep: 0.25, spin: true,
      trail: (p, d, u) => { const [s1, s2] = side(d); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + u * 40; dot1(A, add(p, add(scale(s1, Math.cos(a) * 0.028), scale(s2, Math.sin(a) * 0.028))), 0.01, [0.9, 0.92, 0.95], 0.04, 1.3); } },
      dig: (v, p) => { A.emit(p, jit(0.5), 0.25, 0.01, [1, 0.8, 0.4], 1.5, { drag: 3 }); A.ringNow(p, [0, 1, 0], 0.03, 6, [0.9, 0.92, 0.95], 1.2); }, r: 0.8 }),   // a saw grinding in

    // =============================================================== Legendary: stands out
    'Healing Blade': (A, T) => { const tg = A.near(A.aim, 0.08);
      beam(A, T, tg, 0.14, [0.45, 1, 0.65], [0.95, 1, 0.95], 0.03, 0.8, (u, end) => { if (Math.random() < 0.5) A.emit(above(end, 0.02), add(scale(end.n, rnd(0.3, 0.6)), jit(0.15)), 0.8, 0.014, [0.7, 1, 0.8], 1.4, { drag: 1, twinkle: true }); });
      if (every('Healing Blade', 4)) A.after(0.12, () => { const [u, v] = basis(tg.n); for (const a of [u, v]) A.line(add(above(tg, 0.15), scale(a, -0.08)), add(above(tg, 0.15), scale(a, 0.08)), 0.5, 0.02, [0.8, 1, 0.85], 1.6); A.ring(tg.p, tg.n, 20, 0.6, 0.5, 0.014, [0.5, 1, 0.7], 1.3); pillar(A, tg, 0.4, [0.6, 1, 0.75], 0.02, 0.5); }); },
    'Moonkey Scepter': (A, T) => {   // a moon drops out of the sky onto the target
      const tg = A.near(A.aim, 0.1), from = add(above(tg, 1.3), jit(0.3)), s = A.ship(0);
      T.muzzle(s.nose, s.fwd); A.line(s.nose, add(s.nose, scale(s.up, 0.3)), 0.25, 0.012, [0.8, 0.85, 1], 1.4);
      A.proj({ from, fwd: norm(sub(tg.p, from)), up: [0, 1, 0], to: tg, flight: 0.45, path: 'line',
        trail: (p, d) => { bubbleAt(A, p, d, 0.05, [0.85, 0.9, 1]); dot1(A, p, 0.06, [0.75, 0.8, 0.95], 0.05, 1.2); A.emit(p, jit(0.08), 0.6, 0.012, [0.9, 0.95, 1], 1.5, { drag: 1, twinkle: true }); if (T.S) T.shineTrail(p, d, 0.04); },
        hit: () => { A.flash(tg.p, 0.25, [0.9, 0.95, 1], 0.25); A.ring(tg.p, tg.n, 24, 0.9, 0.5, 0.016, [0.85, 0.9, 1], 1.4); pillar(A, tg, 0.6, [0.85, 0.9, 1], 0.025, 0.4); T.spark(tg, [0.85, 0.9, 1]); A.crater(tg, { r: 1.1 }); } }); },
    'Thunders Requiem': (A, T) => { const tg = A.near(A.aim, 0.1), s = A.ship(0);   // lightning straight from the ship
      A.zap(() => A.ship(0).nose, () => tg.p, 0.12, [0.7, 0.85, 1]);
      A.after(0.1, () => { T.spark(tg, [0.7, 0.85, 1]); A.crater(tg, { r: 0.85, quiet: true }); for (let i = 0; i < 3; i++) { const t2 = A.near(tg, 0.12); A.bolt(above(tg, 0.02), above(t2, 0.02), 0.12, [0.85, 0.95, 1], 0.012); } });
      if (every('Thunders Requiem', 4)) A.after(0.1, () => { A.ring(tg.p, tg.n, 24, 1.2, 0.4, 0.014, [0.75, 0.85, 1], 1.4); A.flash(tg.p, 0.3, WHITE, 0.15); }); },
    'Galatic Fireblade': (A, T) => fly(A, T, { flight: 0.4, path: 'arc', model: 'warhead', scale: 0.013,
      trail: (p, d, u) => { dot1(A, p, 0.06, [1, 0.45, 0.1], 0.07, 1.4); helix(A, p, d, u, 0.04, [1, 0.8, 0.3], 4, 3, 0.02); A.smoke(p, jit(0.03), 0.6, 0.025, [0.25, 0.15, 0.1], 0.4, 2); },
      hit: tg => { A.flash(tg.p, 0.3, [1, 0.7, 0.3], 0.2); for (let i = 0; i < 16; i++) A.emit(above(tg, 0.01), add(scale(tg.n, rnd(0.6, 1.3)), jit(0.3)), rnd(0.5, 0.9), 0.022, i % 3 ? [1, 0.4, 0.06] : [1, 0.85, 0.45], 1.5, { drag: 2 }); A.burn(tg, 0.5); }, r: 1.0 }),   // a meteor and a lava fountain
    'Eternal Blade': (A, T) => fly(A, T, { flight: 0.3, trail: (p, d) => { dot1(A, p, 0.03, [0.8, 0.5, 1], 0.06, 1.3); A.emit(sub(p, scale(d, 0.1)), [0, 0, 0], 0.18, 0.03, [0.5, 0.3, 0.8], 0.6, { drag: 0 }); A.emit(sub(p, scale(d, 0.2)), [0, 0, 0], 0.18, 0.03, [0.35, 0.2, 0.6], 0.4, { drag: 0 }); },
      hit: tg => { for (const [t, c] of [[0.15, [0.8, 0.5, 1]], [0.3, [0.6, 0.4, 0.9]], [0.45, [0.4, 0.3, 0.7]]]) A.after(t, () => { A.flash(tg.p, 0.12, c, 0.12); A.ring(tg.p, tg.n, 14, 0.5, 0.3, 0.012, c, 1.3); }); }, r: 0.9 }),   // the hit echoes through time
    'Divine Blade': (A, T) => fly(A, T, { flight: 0.3, trail: (p, d) => { A.line(p, sub(p, scale(d, 0.12)), 0.06, 0.016, [1, 0.92, 0.65], 1.5); },
      hit: tg => { pillar(A, tg, 1.1, [1, 0.92, 0.65], 0.035, 0.45); A.ring(tg.p, tg.n, 24, 0.8, 0.5, 0.014, [1, 0.85, 0.4], 1.4);
        if (every('Divine Blade', 3)) for (let i = 0; i < 10; i++) A.emit(above(tg, 1.0 - i * 0.08), jit(0.05), 0.6, 0.02, [1, 0.95, 0.8], 1.5, { drag: 1, twinkle: true }); }, r: 0.9 }),   // a pillar of holy light
    'AI Sword': (A, T) => { const tg = A.near(A.aim, 0.08);   // a glitching green laser, pixels scatter
      beam(A, T, tg, 0.12, [0.3, 1, 0.55], [0.85, 1, 0.9], 0.022, 0.8, (u, end) => { if (Math.random() < 0.6) A.emit(add(above(end, 0.02), jit(0.08)), [0, 0, 0], 0.25, 0.018, Math.random() < 0.5 ? [0.3, 1, 0.55] : [1, 0.25, 0.2], 1.4, { drag: 0 }); });
      if (every('AI Sword', 3)) A.after(0.1, () => { const [u, v] = basis(tg.n); for (let i = -2; i <= 2; i++) { A.line(add(tg.p, add(scale(u, i * 0.04), scale(v, -0.1))), add(tg.p, add(scale(u, i * 0.04), scale(v, 0.1))), 0.25, 0.006, [0.3, 1, 0.55], 1.3); } }); },

    // =============================================================== Mythical: REALLY stands out
    'Waxon Fire Sword': (A, T) => { const tg = A.near(A.aim, 0.08);   // a roaring flame beam, a fire tornado on the ground
      beam(A, T, tg, 0.15, [1, 0.45, 0.12], [1, 0.95, 0.7], 0.06, 1.1, (u, end) => { A.emit(above(end, 0.02), add(scale(end.n, rnd(0.4, 1)), jit(0.3)), 0.6, 0.03, Math.random() < 0.5 ? [1, 0.45, 0.1] : [1, 0.85, 0.4], 1.5, { drag: 2 }); });
      const s = A.ship(0); A.flash(s.nose, 0.12, [1, 0.6, 0.2], 0.15);
      if (every('Waxon Fire Sword', 3)) A.after(0.1, () => {
        for (let i = 0; i < 24; i++) A.after(i * 0.025, () => { const h = i * 0.03, [u, v] = basis(tg.n), a = i * 1.1, r = 0.05 + h * 0.35; A.emit(add(above(tg, h), add(scale(u, Math.cos(a) * r), scale(v, Math.sin(a) * r))), add(scale(tg.n, 0.4), add(scale(u, -Math.sin(a) * 0.6), scale(v, Math.cos(a) * 0.6))), 0.6, 0.03, i % 2 ? [1, 0.5, 0.1] : [1, 0.9, 0.5], 1.6, { drag: 1.5 }); });
        A.ring(tg.p, tg.n, 30, 1.6, 0.5, 0.02, [1, 0.6, 0.2], 1.5); A.flash(tg.p, 0.45, [1, 0.85, 0.5], 0.25); T.wow(tg, 0.8, [1, 0.5, 0.15]); }); },
    'Sungorger': (A, T) => {   // a small sun flies in, swallows the light around it, then goes supernova
      const tg = A.near(A.aim, 0.1), big = every('Sungorger', 3);
      fly(A, T, { tg, flight: 0.5, path: 'arc', trail: (p, d, u) => { dot1(A, p, 0.05 + 0.03 * u, [1, 0.75, 0.25], 0.06, 1.6); dot1(A, p, 0.025, [1, 1, 0.85], 0.05, 1.8); for (let i = 0; i < 2; i++) A.emit(add(p, jit(0.12)), scale(jit(0.12), -3), 0.18, 0.012, [1, 0.85, 0.4], 1.5, { drag: 0 }); },
        hit: t => { A.implode(t.p, big ? 0.45 : 0.22, 0.25, [1, 0.8, 0.3]);
          A.after(0.25, () => { A.flash(t.p, big ? 0.6 : 0.25, [1, 0.97, 0.85], 0.3); A.starburst(t.p, t.n, big ? 12 : 6, [1, 0.8, 0.3]); A.ring(t.p, t.n, big ? 36 : 18, big ? 2.2 : 1, 0.5, 0.022, [1, 0.75, 0.3], 1.5); if (big) { A.after(0.12, () => A.ring(t.p, t.n, 30, 1.4, 0.6, 0.02, [1, 0.5, 0.9], 1.4)); T.wow(t, 1, [1, 0.75, 0.3]); } A.crater(t, { r: big ? 1.5 : 0.9 }); }); }, r: 0.5 }); },
    'Leveller Bow': (A, T) => {   // a rain of arrows from the sky, lightning chaining the hits
      const tg = A.near(A.aim, 0.1), s = A.ship(0), big = every('Leveller Bow', 3), hits = [];
      T.muzzle(s.nose, s.fwd); A.line(s.nose, add(s.nose, scale(s.up, 0.5)), 0.3, 0.014, [0.85, 0.6, 1], 1.5);
      const n = big ? 6 : 3;
      for (let i = 0; i < n; i++) A.after(0.05 + i * 0.04, () => {
        const t2 = A.near(tg, 0.1), from = add(above(t2, 1.2), jit(0.15));
        A.proj({ from, fwd: norm(sub(t2.p, from)), up: [0, 1, 0], to: t2, flight: 0.25, path: 'line',
          trail: (p, d) => { A.line(p, sub(p, scale(d, 0.12)), 0.05, 0.01, i % 2 ? [0.85, 0.6, 1] : WHITE, 1.4); if (T.S) T.shineTrail(p, d, 0.03); },
          hit: () => { hits.push(t2); A.flash(t2.p, 0.12, [0.85, 0.6, 1], 0.12); T.spark(t2, [0.85, 0.6, 1]); A.crater(t2, { r: 0.7, quiet: true });
            if (hits.length > 1) { const a = hits[hits.length - 2]; A.bolt(above(a, 0.03), above(t2, 0.03), 0.18, [0.9, 0.8, 1], 0.012); } } });
      });
      if (big) A.after(0.35, () => { A.ring(tg.p, tg.n, 30, 1.6, 0.5, 0.02, [0.85, 0.6, 1], 1.5); T.wow(tg, 0.8, [0.85, 0.6, 1]); }); },
  };

  return {
    SHOTS,
    /** Make AWDesign.shotOf use these shots (on: true) or the original ones again (on: false). */
    install(AD, on = true) {
      if (!AD.__shotOf) AD.__shotOf = AD.shotOf;
      AD.shotOf = on ? (name => SHOTS[name] || AD.__shotOf(name)) : AD.__shotOf;
    },
  };
})();
if (typeof AWDesign !== 'undefined') ShotsAlt.install(AWDesign);
