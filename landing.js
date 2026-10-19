'use strict';
/*
  The landing page's opening shot, "Dawn": a slow drift over Aurora's night side while the sun
  rises over its horizon (with a lens flare), and a fleet of crew ships flies past the camera into
  the sunrise. Drawn with HeroGL (planets, crew ships) plus a 2D overlay (engine trails, flare).

    HashRushDawn(canvas) -> { replay() }
*/
const HashRushDawn = (() => {
  const H = HeroGL;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, u) => a + (b - a) * u;
  const mix3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u), add3 = (a, b) => a.map((v, i) => v + b[i]);
  const sub3 = (a, b) => a.map((v, i) => v - b[i]), mul3 = (a, k) => a.map(v => v * k);
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const eio = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const unitV = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
  const rgbaT = hex => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},A)`; };

  // crew ships as the game draws them: [crew card, variant, shine]; class and shine scale the ship
  const FLEET = [['Khaured Commander', 0, 'Stardust'], ['Mysterious Hacker', 0, 'Gold'], ['LG Soldier', 0, 'Stone'], ['Astronaut (KOGs)', 0, 'XDimension'],
    ['Nordic Warrior', 1, 'Gold'], ['Robot Supersoldier', 1, 'Stardust'], ['Grey Peacemaker', 0, 'Stone'], ['Explosives Specialist', 0, 'Antimatter']];
  function ship([name, variant, shine], base) {
    const card = AW_DATA.crew.find(c => c.name === name), tpl = typeof ShipKit !== 'undefined' ? ShipKit.tplOf(name, variant, shine) : null;
    const ok = tpl != null, st = ok ? ShipKit.styleOf(tpl) : null;
    return { name, variant, shine, rarity: card ? card.rarity : 'Common', element: card ? card.variants[variant].element : 'Neutral',
      size: base * (ok ? ShipKit.scaleOf(tpl) : 1), glowRGBA: rgbaT(ok ? ShipKit.DESIGNS[st.cls].glow : '#ffb15a') };
  }

  // a direction from azimuth (0 looks down -z, positive turns right) and elevation, in radians
  const dirOf = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
  // how far (radians) direction d from eye clears planet P's disc: below 0 it is behind the planet
  function clearOf(eye, d, P, k = 0.92) {
    const v = sub3(P.pos, eye), dist = Math.hypot(...v), c = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / dist;
    return Math.acos(clamp(c, -1, 1)) - Math.asin(Math.min(1, P.size * k / dist));
  }

  // engine trails for the distance-field ships
  function trails(ctx, o, len, alpha) {
    const k = o.h / (2 * Math.tan((o.scene.fov || 0.6) / 2));
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const s of o.ships) {
      const a = s.pos.map((v, i) => v - s.f[i] * s.size * 0.42), b = a.map((v, i) => v - s.f[i] * s.size * len);
      const A = o.project(a), B = o.project(b);
      if (A[2] <= 0.05 || B[2] <= 0.05) continue;
      const w = Math.max(1, s.size * 0.07 * k / A[2]);
      if (w > 400) continue;
      const g = ctx.createLinearGradient(A[0], A[1], B[0], B[1]);
      g.addColorStop(0, s.glowRGBA.replace('A', alpha)); g.addColorStop(1, s.glowRGBA.replace('A', 0));
      ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      H.glow(ctx, A, w * 2.4, s.glowRGBA);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // a lens flare at screen point p: a glow, a long anamorphic streak and a few ghosts toward the centre
  function flare(ctx, o, p, k) {
    if (k <= 0.002) return;
    const col = a => `rgba(255,236,200,${a})`, h = o.h, w = o.w;
    ctx.globalCompositeOperation = 'lighter';
    const big = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], h * 0.42);
    big.addColorStop(0, col(0.5 * k)); big.addColorStop(0.18, col(0.16 * k)); big.addColorStop(1, col(0));
    ctx.fillStyle = big; ctx.beginPath(); ctx.arc(p[0], p[1], h * 0.42, 0, 7); ctx.fill();
    const core = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], h * 0.05);
    core.addColorStop(0, `rgba(255,255,255,${k})`); core.addColorStop(1, col(0));
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(p[0], p[1], h * 0.05, 0, 7); ctx.fill();
    for (const [hh, a] of [[3 * o.dpr, 0.7], [16 * o.dpr, 0.12]]) {
      const s = ctx.createLinearGradient(p[0] - w * 0.8, 0, p[0] + w * 0.8, 0);
      s.addColorStop(0, 'rgba(120,170,255,0)'); s.addColorStop(0.5, `rgba(200,225,255,${a * k})`); s.addColorStop(1, 'rgba(120,170,255,0)');
      ctx.fillStyle = s; ctx.fillRect(p[0] - w * 0.8, p[1] - hh / 2, w * 1.6, hh);
    }
    for (const [f, rr, a, gc] of [[0.45, 0.025, 0.1, [255, 200, 140]], [0.8, 0.012, 0.16, [160, 220, 255]], [1.3, 0.05, 0.06, [200, 160, 255]], [1.7, 0.03, 0.08, [255, 220, 160]]]) {
      const q = [p[0] + (w / 2 - p[0]) * f * 2, p[1] + (h / 2 - p[1]) * f * 2], R = h * rr, c = gc.join(',');
      const gg = ctx.createRadialGradient(q[0], q[1], R * 0.6, q[0], q[1], R);
      gg.addColorStop(0, `rgba(${c},${a * k * 0.4})`); gg.addColorStop(0.85, `rgba(${c},${a * k})`); gg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(q[0], q[1], R, 0, 7); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return function dawn(cv) {
    const st = { t0: null, lt: 0, sun: [0, 0, -1], eye: [0, 0, 1] };
    const P = { name: 'Aurora', pos: [0.6, -3.5, -3.9], size: 3.2, R: 40, tilt: 0.2 }, L = { name: 'Luna', pos: [-3.6, 1.0, -12], size: 0.6, R: 26, tilt: 0.4 };
    const fleet = FLEET.map(c => ship(c, 0.055));
    const AZ = 0.3;
    H.view(cv, t => {
      if (st.t0 == null) st.t0 = t;
      const lt = (st.lt = t - st.t0), por = cv.clientWidth < cv.clientHeight * 0.9;
      P.yaw = 0.4 + t * 0.006; L.yaw = t * 0.02;
      const ez = 1.3 - 0.4 * (1 - Math.exp(-lt / 30));
      const eye = (st.eye = [0.1 * Math.sin(lt * 0.05), 0.08 + 0.02 * Math.sin(lt * 0.07), ez]);
      // the elevation where the sun just touches the horizon (found by halving), then the sun rises past it
      let lo = -0.8, hi = 0.3;
      for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (clearOf(eye, dirOf(AZ, m), P) < 0) lo = m; else hi = m; }
      const sun = (st.sun = dirOf(AZ, hi + mix(-0.06, 0.03, eio(ss(0.6, 12, lt)))));
      // the fleet launches past the camera and flies into the sunrise, one after another
      const ships = fleet.map((s, i) => {
        const u = ((lt + i * 2.05 + 0.6) / 16.4) % 1, side = i % 2 ? -1 : 1;
        const start = [eye[0] + side * (0.42 + 0.1 * (i % 3)), eye[1] + 0.1 + 0.07 * (i % 3), ez - 0.4];
        const end = add3(add3(eye, mul3(sun, 32)), [side * 1.2 + ((i * 5) % 3 - 1) * 0.8, 1.2 + ((i * 3) % 4) * 0.5, 0]);
        return { ...s, pos: mix3(start, end, Math.pow(u, 1.7)), fwd: unitV(sub3(end, start)) };
      });
      return { eye, at: [eye[0] * 0.5 + (por ? 0.6 : -0.3), por ? -0.6 : -0.15, -6], fov: por ? 1.05 : 0.72, light: sun, halo: [0.45, 1, 0.75], haloSun: [0.45, 0.9], planets: [P, L], ships };
    }, (ctx, o) => {
      trails(ctx, o, 1.8, 0.7);
      const p = o.project(add3(st.eye, mul3(st.sun, 100)));
      if (p[2] <= 0) return;
      const vis = ss(-0.006, 0.03, clearOf(st.eye, st.sun, P));
      // the dawn glow along the horizon, there even before the sun clears it
      const pre = ss(0, 4, st.lt) * (0.35 + 0.65 * vis);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(p[0], p[1]); ctx.scale(1, 0.16);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, o.w * 0.55);
      g.addColorStop(0, `rgba(255,190,120,${0.5 * pre})`); g.addColorStop(0.35, `rgba(255,140,80,${0.16 * pre})`); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, o.w * 0.55, 0, 7); ctx.fill(); ctx.restore();
      flare(ctx, o, p, vis * (0.9 + 0.06 * Math.sin(st.lt * 1.3)));
    });
    return { replay() { st.t0 = null; } };
  };
})();
