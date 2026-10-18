'use strict';
/*
  Ship styles for Alien Worlds crew and weapon animations for Alien Worlds arms.

  Ships: every crew type (card name) has its own ship, built from voxels by a small
  generator. Rarity decides how impressive the base model is; the shine is a finish on
  top of the same model (Stone < Gold < XDimension < Stardust < Antimatter). Variants of a
  crew type (cards with the same name) use their card's element as accent colour.

  Voxels carry a role (hull, hull2, dark, accent, trim, glass, engine, eye, light) so a
  shine can refinish them consistently.
*/
const AWDesign = (() => {
  // ------------------------------------------------------------------ tiers
  const RARITIES = ['Abundant', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythical'];
  const SHINES = ['Stone', 'Gold', 'XDimension', 'Stardust', 'Antimatter'];
  const ELEMENT = { Air: '#5ad7ff', Fire: '#ff7a2a', Nature: '#79e05a', Gem: '#c66bff', Metal: '#a9c2dd', Neutral: '#efe6cf' };
  const rarityLevel = r => Math.max(0, RARITIES.indexOf(r));
  const shineLevel = s => Math.max(0, SHINES.indexOf(s));

  // small deterministic hash for "random" details that stay the same every build
  const h3 = (x, y, z, s = 0) => {
    let h = Math.imul(x | 0, 0x8da6b343) ^ Math.imul(y | 0, 0xd8163841) ^ Math.imul(z | 0, 0xcb1ab31f) ^ Math.imul(s | 0, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
  };

  // ------------------------------------------------------------------ voxel builder
  function builder() {
    const vox = new Map();
    const b = {
      fx: [],   // live effects the renderer plays on top (e.g. lightning arcs)
      put(x, y, z, role, col, mat = 'metal', glow = 0) {
        x = Math.round(x); y = Math.round(y); z = Math.round(z);
        vox.set(x + ',' + y + ',' + z, { x, y, z, role, col, mat, glow });
      },
      sym(x, y, z, ...a) { b.put(x, y, z, ...a); b.put(-x, y, z, ...a); },
      del(x, y, z) { vox.delete(Math.round(x) + ',' + Math.round(y) + ',' + Math.round(z)); },
      has: (x, y, z) => vox.has(x + ',' + y + ',' + z),
      box(x0, x1, y0, y1, z0, z1, ...a) {
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
          for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
            for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) b.put(x, y, z, ...a);
      },
      ell(cx, cy, cz, rx, ry, rz, ...a) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
          for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
            for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
              const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
              if (d <= 1.0001) b.put(x, y, z, ...a);
            }
      },
      // cylinder along z
      cyl(cx, cy, r, z0, z1, ...a) {
        for (let z = z0; z <= z1; z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
          for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
            if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) b.put(x, y, z, ...a);
      },
      // ring of radius R in the plane 'xz' (flat), 'xy' (facing forward) or 'yz' (side)
      ring(cx, cy, cz, R, plane, ...a) {
        const n = Math.ceil(R * 7);
        for (let i = 0; i < n; i++) {
          const t = i / n * Math.PI * 2, u = Math.cos(t) * R, v = Math.sin(t) * R;
          if (plane === 'xz') b.put(cx + u, cy, cz + v, ...a);
          else if (plane === 'xy') b.put(cx + u, cy + v, cz, ...a);
          else b.put(cx, cy + u, cz + v, ...a);
        }
      },
      line(x0, y0, z0, x1, y1, z1, ...a) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1);
        for (let i = 0; i <= n; i++) b.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, z0 + (z1 - z0) * i / n, ...a);
      },
      voxels: () => [...vox.values()],
    };
    return b;
  }

  // ------------------------------------------------------------------ ships
  // gen(b, P) with P = { L: rarity level 0..5, acc: element colour, v: variant index, eng: engine glow }
  const ENGINE = '#ffb060';
  const engines = (b, P, list, col = ENGINE) => { for (const [x, y, z] of list) b.put(x, y, z, 'engine', col, 'energy', P.eng); };

  const CREW = {};

  // -- Abundant: plain, tiny, no glow to speak of
  CREW['Stealth Mercenary'] = (b, P) => {
    const H = '#24262c', H2 = '#33363e';
    // a flat black wedge; "the stealth comes from the tech, not from the mercenary"
    for (let z = -4; z <= 4; z++) { const w = Math.max(0, Math.round((5 - z) * 0.55)); b.box(-w, w, 0, 0, z, z, 'hull', H); }
    b.box(-1, 1, 1, 1, -3, 1, 'hull2', H2);
    b.put(0, 1, 2, 'glass', '#3a4652', 'crystal', 0.05);
    b.sym(Math.round(0.55 * 9), 0, -4, 'accent', P.acc, 'metal', 0);
    engines(b, P, [[-1, 0, -5], [1, 0, -5]]);
  };

  CREW['Grey Peacemaker'] = (b, P) => {
    // a small, plain saucer: the idea of peace, nothing more
    b.ell(0, 0, 0, 5, 1, 5, 'hull', '#9aa0a8');
    b.ell(0, 1, 0, 2, 1.4, 2, 'glass', '#b8d4e0', 'crystal', 0.05);
    b.ring(0, 0, 0, 5, 'xz', 'trim', '#7c838c');
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.put(Math.cos(a) * 4, -1, Math.sin(a) * 4, 'light', P.acc, 'energy', 0.15); }
    engines(b, P, [[0, -1, 0]], '#cfe8ff');
  };

  // -- Common: small, a little nicer
  CREW['LG Soldier'] = (b, P) => {
    const H = '#5d6a4a', H2 = '#7f8b62', D = '#2f3428';
    // fast arrow fighter: speed and the element of surprise
    b.box(0, 0, 0, 1, -5, 6, 'hull', H);
    b.box(-1, 1, 0, 0, -5, 3, 'hull', H);
    b.put(0, 0, 7, 'trim', P.acc, 'metal', 0.15);
    b.box(0, 0, 2, 2, 1, 3, 'glass', '#9fd2ff', 'crystal', 0.25);
    for (let x = 2; x <= 6; x++) { const z0 = -5 + Math.floor((x - 2) * 0.4), z1 = 1 - (x - 2); for (let z = z0; z <= Math.max(z0, z1); z++) b.sym(x, 0, z, x === 6 ? 'accent' : 'hull2', x === 6 ? P.acc : H2, 'metal', x === 6 ? 0.2 : 0); }
    b.sym(1, 1, -4, 'dark', D);
    engines(b, P, [[-1, 0, -6], [1, 0, -6]]);
  };

  CREW['Grey Scientist'] = (b, P) => {
    // a lab saucer with a sensor mast and specimen pods
    b.ell(0, 0, 0, 6, 1, 6, 'hull', '#a3a9b1');
    b.ring(0, 0, 0, 6, 'xz', 'trim', '#767d86');
    b.ell(0, 1, 0, 2.5, 1.6, 2.5, 'glass', '#bfe3ee', 'crystal', 0.15);
    b.line(0, 3, 0, 0, 6, 0, 'trim', '#c9ced6');
    b.ring(0, 6, 0, 1.6, 'xz', 'accent', P.acc, 'energy', 0.35);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; b.ell(Math.cos(a) * 3, -2, Math.sin(a) * 3, 1, 1, 1, 'accent', P.acc, 'crystal', 0.3); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.put(Math.cos(a) * 5, -1, Math.sin(a) * 5, 'light', '#e8f4ff', 'energy', 0.3); }
    engines(b, P, [[0, -1, 0]], '#cfe8ff');
  };

  CREW['Nordic Warrior'] = (b, P) => {
    const W = '#8a6a48', W2 = '#a8835a';
    // a longship: curved hull, a tall prow and a row of round shields
    for (let z = -7; z <= 7; z++) {
      const w = Math.round(2.6 * Math.cos(z / 7.5 * Math.PI / 2)), keel = Math.round(Math.abs(z) / 7 * 1.5);
      b.box(-w, w, keel - 1, keel - 1, z, z, 'hull', W);
      b.sym(w, keel, z, 'hull2', W2);
    }
    for (let i = 0; i <= 4; i++) b.put(0, i, 8 + Math.floor(i / 2), 'trim', '#c9a25e', 'metal', 0);   // prow
    b.put(0, 5, 10, 'accent', P.acc, 'metal', 0.2);
    for (let z = -5; z <= 5; z += 2) b.sym(3, 1, z, 'accent', P.acc, 'metal', 0.1);   // shields
    b.line(0, 0, 0, 0, 6, 0, 'trim', '#6b5238');
    b.box(-2, 2, 3, 5, 0, 0, 'hull2', '#d8cfb8', 'none');   // sail
    engines(b, P, [[0, 0, -8], [-1, 0, -8], [1, 0, -8]]);
  };

  CREW['Terminator'] = (b, P) => {
    const C = '#c8ccd2', C2 = '#8e959e';
    // a chrome skeleton: spine, ribs, a skull nose and one red eye
    b.line(0, 0, -7, 0, 0, 5, 'hull', C);
    for (let z = -5; z <= 3; z += 2) { b.sym(1, 0, z, 'hull2', C2); b.sym(2, -1, z, 'hull2', C2); b.sym(2, 1, z, 'hull', C); }
    b.ell(0, 0, 6, 2, 1.6, 1.6, 'hull', C);
    b.sym(1, 0, 7, 'eye', '#ff2a1a', 'energy', 0.9);
    b.box(-1, 1, -1, -1, 6, 7, 'dark', '#3a3f46');
    b.sym(3, 0, -4, 'accent', P.acc, 'metal', 0.1);
    engines(b, P, [[0, 0, -8]], '#ff6a3a');
  };

  // -- Rare: something to it
  CREW['Wise Ancient One'] = (b, P) => {
    const H = '#c7d0dc', H2 = '#93a2b8';
    // a slender ark with crescent wings, glowing runes and a lantern at the bow
    b.ell(0, 0, 0, 1.6, 1.4, 9, 'hull', H);
    for (let z = -6; z <= 6; z += 2) b.put(0, 2, z, 'accent', P.acc, 'energy', 0.6);   // runes
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = 2 + i, z = Math.round(-1 - Math.sin(t * Math.PI) * 3 + t * -2); b.sym(x, 0, z, i > 6 ? 'accent' : 'hull2', i > 6 ? P.acc : H2, 'metal', i > 6 ? 0.4 : 0); b.sym(x, 0, z + 1, 'hull2', H2); }
    b.line(0, 1, 9, 0, 1, 12, 'trim', '#d9c38a');
    b.ell(0, 1, 13, 1, 1, 1, 'light', '#fff1c4', 'energy', 0.9);   // lantern
    b.line(0, 2, -3, 0, 6, -5, 'trim', '#d9c38a');
    b.put(0, 7, -5, 'accent', P.acc, 'energy', 0.7);
    engines(b, P, [[0, 0, -10], [-1, 0, -9], [1, 0, -9]], '#bfe8ff');
  };

  CREW['Explosives Specialist'] = (b, P) => {
    const H = '#b9bcc2', H2 = '#7c8189', Y = '#f2c230', K = '#1d1e22';
    // a bulky utility hauler with bomb racks, hazard stripes and a red and a blue wire
    b.box(-2, 2, -1, 1, -6, 5, 'hull', H);
    for (let z = 3; z <= 6; z++) b.box(-2, 2, -1, 1, z, z, 'trim', (z % 2) ? Y : K, 'metal', 0);   // hazard nose
    b.box(-1, 1, 2, 2, 0, 3, 'glass', '#9fd2ff', 'crystal', 0.3);
    b.box(-7, 7, 0, 0, -4, -1, 'hull2', H2);
    for (const x of [-6, -4, 4, 6]) { b.ell(x, -2, -2, 0.9, 0.9, 1.6, 'dark', K); b.put(x, -2, 0, 'eye', '#ff3b30', 'energy', 0.6); }   // bombs
    b.line(-3, 1, -5, -3, 1, 4, 'accent', '#ff3b30', 'energy', 0.5);   // red wire
    b.line(3, 1, -5, 3, 1, 4, 'accent', '#3b8bff', 'energy', 0.5);    // blue wire
    b.sym(7, 1, -2, 'accent', P.acc, 'energy', 0.4);
    engines(b, P, [[-1, 0, -7], [1, 0, -7], [-1, -1, -7], [1, -1, -7]]);
  };

  CREW['Robot Supersoldier'] = (b, P) => {
    const H = '#5f6773', H2 = '#8c95a1', D = '#2b3038';
    // an armoured robotic gunship: layered plates, shoulder cannons and a red visor
    b.box(-2, 2, -2, 2, -7, 6, 'hull', H);
    for (let z = -6; z <= 5; z += 3) b.box(-3, 3, -1, 2, z, z, 'hull2', H2);   // armour bands
    b.box(-1, 1, 1, 1, 7, 7, 'eye', '#ff2a1a', 'energy', 0.9);                 // visor
    b.box(-2, 2, 2, 2, 5, 6, 'dark', D);
    for (const sx of [-1, 1]) {
      b.box(sx * 4, sx * 6, 0, 3, -3, 2, 'hull2', H2);                         // shoulder pods
      b.line(sx * 5, 2, 3, sx * 5, 2, 8, 'dark', D);                           // cannons
      b.put(sx * 5, 2, 9, 'accent', P.acc, 'energy', 0.6);
      b.box(sx * 4, sx * 6, 3, 3, -3, 2, 'trim', P.acc, 'metal', 0.25);
    }
    engines(b, P, [[-1, -1, -8], [1, -1, -8], [-1, 1, -8], [1, 1, -8]], '#ff9a4a');
  };

  CREW['Intergalactic Zombie'] = (b, P) => {
    const H = '#4f5a48', H2 = '#6b6a52', BONE = '#d8d0b8', OOZE = '#7dff5a';
    // a rotting derelict that should not still fly: holes, exposed ribs, dripping ooze
    b.ell(0, 0, 0, 3, 2.4, 9, 'hull', H);
    for (const v of b.voxels()) if (h3(v.x, v.y, v.z, 5) < 0.18 && Math.abs(v.z) < 7) b.del(v.x, v.y, v.z);   // rot
    for (let z = -6; z <= 6; z += 2) { b.ring(0, 0, z, 3.4, 'xy', 'trim', BONE, 'none'); }                       // ribs
    for (let i = 0; i < 10; i++) { const z = -7 + i * 1.5 | 0, x = (h3(i, 1, 2) - 0.5) * 5 | 0; b.line(x, -2, z, x, -3 - (i % 3), z, 'accent', OOZE, 'energy', 0.75); }   // ooze
    b.ell(0, 1, 8, 1.5, 1.3, 1.5, 'hull2', H2);
    b.sym(1, 1, 9, 'eye', OOZE, 'energy', 1);
    b.sym(4, 0, -6, 'accent', P.acc, 'energy', 0.4);
    engines(b, P, [[0, 0, -10], [-1, -1, -9]], '#9dff6a');
  };

  // -- Epic: looks cool
  CREW['Mysterious Hacker'] = (b, P) => {
    const H = '#1c1f26', H2 = '#2a2f3a';
    // a stealth diamond laced with glowing circuit traces, an antenna array and a holo panel;
    // little data cubes orbit it
    for (let z = -9; z <= 9; z++) { const w = Math.round(6 * (1 - Math.abs(z) / 10)); b.box(-w, w, 0, 0, z, z, 'hull', H); if (w > 1) b.box(-w + 2, w - 2, 1, 1, z, z, 'hull2', H2); }
    for (let z = -7; z <= 7; z++) if (z % 3 !== 0) b.put(Math.round(Math.sin(z * 0.9) * 3), 2, z, 'accent', P.acc, 'energy', 0.75);   // circuit trace
    for (let x = -4; x <= 4; x += 2) b.put(x, 1, -2 + Math.abs(x), 'accent', P.acc, 'energy', 0.7);
    b.box(-1, 1, 2, 3, 3, 5, 'glass', P.acc, 'crystal', 0.6);   // holo panel
    for (const x of [-2, 0, 2]) b.line(x, 1, -7, x, 5 - Math.abs(x), -8, 'trim', '#8c95a1');
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.put(Math.cos(a) * 9, 3 + (i % 2) * 2, Math.sin(a) * 9, 'light', P.acc, 'energy', 0.9); }   // data cubes
    engines(b, P, [[-2, 0, -10], [2, 0, -10], [0, 0, -10]], '#6fe3ff');
  };

  CREW['Enhanced Reptiloid'] = (b, P) => {
    const H = '#2f5a3a', H2 = '#4e7d4a', CL = '#cfc8a8', CY = '#8c95a1';
    // an organic reptile hull with dorsal spines and claws, bolted full of cybernetic implants
    b.ell(0, 0, 0, 3.2, 2.2, 10, 'hull', H);
    for (let z = -8; z <= 7; z += 2) b.line(0, 2, z, 0, 4 - Math.abs(z) / 5, z - 1, 'hull2', H2);   // spines
    for (const sx of [-1, 1]) { b.line(sx * 2, -1, 9, sx * 3, -1, 13, 'trim', CL, 'none'); b.put(sx * 3, -2, 13, 'trim', CL, 'none'); }   // claws
    for (const z of [-5, 0, 5]) { b.sym(3, 0, z, 'hull2', CY, 'metal'); b.sym(4, 0, z, 'accent', P.acc, 'energy', 0.7); }   // implants
    b.sym(1, 1, 10, 'eye', '#ffcf3a', 'energy', 0.9);
    b.line(0, 0, -10, 0, 2, -14, 'hull2', H2);   // tail fin
    b.sym(2, 0, -12, 'hull2', H2);
    engines(b, P, [[-2, -1, -10], [2, -1, -10], [0, -2, -10]], '#9dff6a');
  };

  CREW['Astronaut (KOGs)'] = (b, P) => {
    const W = '#eceef0', G = '#b6bcc4', O = '#ff7a2a';
    // a retro rocket from another universe: white hull, orange bands, fins, portholes, boosters
    // and a little homing beacon - always trying to find the way home
    b.cyl(0, 0, 2.6, -9, 7, 'hull', W);
    for (let i = 0; i < 4; i++) b.cyl(0, 0, 2.6 - i * 0.7, 8 + i, 8 + i, 'hull', W);
    b.put(0, 0, 12, 'trim', O, 'metal', 0.2);
    for (const z of [-6, 2]) b.cyl(0, 0, 2.8, z, z, 'trim', O, 'metal', 0.1);
    for (const z of [3, 5]) b.put(0, 3, z, 'glass', '#7fd8ff', 'crystal', 0.5);   // portholes
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 0; i <= 3; i++) b.put(x * (3 + i), y * (3 + i), -8 + i, 'hull2', G);   // fins
    for (const sx of [-1, 1]) { b.cyl(sx * 4.5, -1, 1.2, -9, -1, 'hull2', G); b.put(sx * 4.5, -1, 0, 'trim', O); }   // boosters
    b.line(0, 3, -2, 0, 6, -2, 'trim', G);
    b.put(0, 7, -2, 'accent', P.acc, 'energy', 0.9);
    engines(b, P, [[0, 0, -10], [1, 0, -10], [-1, 0, -10], [0, 1, -10], [0, -1, -10], [4, -1, -10], [-4, -1, -10]], '#ffc070');
  };

  CREW['Alien Bat (Horrors)'] = (b, P) => {
    const BODY = '#2a1e2e', MEM = '#3d2338', BONE = '#bfae9a';
    // a bat-winged horror: membrane wings with finger bones, pointed ears and red eyes
    b.ell(0, 0, 0, 2, 1.8, 5, 'hull', BODY);
    b.ell(0, 0.5, 5, 1.5, 1.5, 1.6, 'hull', BODY);
    b.sym(1, 2, 6, 'hull2', BODY); b.sym(1, 3, 6, 'hull2', BODY);   // ears
    b.sym(1, 1, 7, 'eye', '#ff2030', 'energy', 1);
    for (let f = 0; f < 4; f++) {   // wing fingers and the membrane between them
      const ex = 6 + f * 3, ez = 3 - f * 3.2;
      for (const sx of [-1, 1]) b.line(sx * 2, 1, 1, sx * ex, 2 - f * 0.5, ez, 'trim', BONE, 'none');
    }
    for (let x = 2; x <= 15; x++) for (let z = -9; z <= 3; z++) {
      const edge = 3 - (x - 2) * 0.95, scallop = Math.sin(x * 0.9) * 1.2;
      if (z <= edge && z >= -9 + (x - 2) * 0.35 + scallop) b.sym(x, 1, z, 'hull2', MEM);
    }
    b.line(0, 0, -5, 0, -1, -9, 'hull', BODY);
    b.sym(4, 2, -1, 'accent', P.acc, 'energy', 0.5);
    engines(b, P, [[0, 0, -6]], '#ff4a5a');
  };

  CREW['Interstellar Emissary'] = (b, P) => {
    const H = '#1f1a2b', H2 = '#2e2640', GOLD = '#c9a25e';
    // a tall dark herald spire with a burning eye and cloak-like vanes trailing behind
    for (let y = -6; y <= 12; y++) { const r = 2.6 * (1 - Math.abs(y - 3) / 10); b.ell(0, y, 0, Math.max(0.6, r), 0.5, Math.max(0.6, r * 1.4), 'hull', H); }
    b.ell(0, 4, 2.6, 1.6, 1.6, 0.8, 'eye', P.acc, 'energy', 1);   // the eye
    b.ring(0, 4, 2.9, 2.4, 'xy', 'trim', GOLD, 'metal', 0.3);
    for (const sx of [-1, 1]) for (let i = 0; i < 10; i++) { const y = 8 - i * 1.6, x = sx * (2 + i * 0.7), z = -2 - i * 0.9; b.line(x, y, z, x + sx, y - 1, z - 1, 'hull2', H2); if (i % 3 === 0) b.put(x, y, z, 'accent', P.acc, 'energy', 0.6); }
    b.line(0, 13, 0, 0, 16, 0, 'trim', GOLD);
    b.put(0, 17, 0, 'light', P.acc, 'energy', 1);
    engines(b, P, [[0, -7, 0], [-1, -6, -1], [1, -6, -1]], '#b49bff');
  };

  // the Khaured build: a brutal battering-ram hull - "fist-to-face"
  function khaured(b, P, L, H = '#5a2a24', H2 = '#7d3b2e', IRON = '#3b3d44') {
    const len = 8 + L * 2;
    b.box(-3, 3, -2, 2, -len, len - 3, 'hull', H);
    b.box(-4, 4, -3, 3, len - 2, len, 'hull2', IRON);   // the fist
    for (let x = -3; x <= 3; x += 2) b.put(x, 0, len + 1, 'trim', '#9aa0a8', 'metal', 0.2);   // knuckles
    for (let z = -len + 2; z <= len - 4; z += 3) b.box(-4, 4, -1, 1, z, z, 'hull2', IRON);
    return len;
  }
  CREW['Infected Khaured'] = (b, P) => {
    // a Khaured ram ship overgrown by a parasitic fungus: glowing spore caps and tendrils
    const len = khaured(b, P, P.L, '#4a3a2e', '#5e4a3a', '#34363a');
    const CAP = '#c8e06a', SP = '#e9ff8a';
    for (let i = 0; i < 9; i++) {
      const z = -len + 2 + i * (2 * len - 4) / 8, x = (h3(i, 3, 1) - 0.5) * 6, y = 2 + h3(i, 4, 1) * 2;
      b.line(x, 2, z, x, y + 1, z, 'hull2', '#6b5a3a', 'none');
      b.ell(x, y + 2, z, 1.4, 0.8, 1.4, 'accent', i % 3 ? CAP : P.acc, 'energy', 0.55);
      b.put(x, y + 3, z, 'light', SP, 'energy', 1);
    }
    for (let i = 0; i < 6; i++) { const z = -len + 3 + i * 3; b.line(-4, -1, z, -6, -4, z - 2, 'hull2', '#6b5a3a', 'none'); b.line(4, -1, z + 1, 6, -4, z - 1, 'hull2', '#6b5a3a', 'none'); }
    engines(b, P, [[-1, 0, -len - 1], [1, 0, -len - 1]], '#c8ff6a');
  };

  CREW['R 3 X'] = (b, P) => {
    const H = '#6c727c', TEAL = '#4fe0d0';
    // a weathered guardian robot turned wanderer: patched hull, a big guardian shield ring at
    // the bow, a seeker dish, a pack of decades of data, and Altan reprogramming glowing teal
    b.box(-2, 2, -2, 2, -8, 6, 'hull', H);
    for (const v of b.voxels()) { const r = h3(v.x, v.y, v.z, 9); if (r < 0.22) b.put(v.x, v.y, v.z, 'hull2', r < 0.1 ? '#7a5a44' : '#8c95a1'); }   // patches
    b.ring(0, 0, 8, 4, 'xy', 'accent', P.acc, 'energy', 0.6);   // guardian shield
    b.ring(0, 0, 8, 3, 'xy', 'trim', '#c9ced6');
    for (let z = -6; z <= 4; z += 2) b.sym(3, 1, z, 'light', TEAL, 'energy', 0.7);   // Altan lines
    b.box(-3, 3, 3, 5, -7, -3, 'hull2', '#5d6068');   // data pack
    b.line(0, 6, -5, 0, 9, -5, 'trim', '#c9ced6');
    b.ell(0, 10, -5, 2, 0.6, 2, 'trim', '#c9ced6');   // seeker dish
    b.put(0, 11, -5, 'accent', P.acc, 'energy', 0.8);
    b.put(0, 1, 7, 'eye', TEAL, 'energy', 1);
    for (let i = 0; i < 6; i++) b.line(-3 - i, -2, -8 + i, -3 - i, -5, -9 + i, 'hull2', '#9a8a6a', 'none');   // tattered sail
    engines(b, P, [[-1, 0, -9], [1, 0, -9], [0, -1, -9]], '#7ff0e0');
  };

  // -- Legendary: flashy
  CREW['Storm Giant'] = (b, P) => {
    const STONE = '#5d6a80', STONE2 = '#435066', IRON = '#2f3746', RUNE = '#bfe8ff', GOLDT = '#d9b45e', SKY = '#e8f6ff';
    // a colossal Nordic dreadnought: its bow is a giant warhammer head, a storm tower in the
    // middle holds a blazing storm eye inside a ring of coils, four coil spires stand at the
    // corners, storm sails spread from the flanks - and lightning jumps between all of it
    // armoured hull, built up in stepped layers
    b.ell(0, 0, -2, 7, 4, 17, 'hull', STONE);
    b.ell(0, 3, -4, 5, 2.5, 13, 'hull2', STONE2);
    for (let z = -16; z <= 10; z += 4) b.ring(0, 0, z, 7.2 - Math.abs(z + 3) / 6, 'xy', 'trim', IRON, 'metal');   // armour bands
    // two great cleavers grow from the flanks and almost meet in front of the bow
    for (const sx of [-1, 1]) for (let i = 0; i <= 18; i++) {
      const t = i / 18, z = 2 + i, x = sx * (7.5 - 5.8 * t * t);
      const top = Math.round(4 - t * 1.5), bot = Math.round(-5 + t * 6.5);   // broad at the root, a point at the tip
      for (let y = bot; y <= top; y++) {
        const edge = y === bot || i === 18;
        b.put(x, y, z, edge ? 'trim' : 'hull', edge ? GOLDT : STONE, 'metal', edge ? 0.45 : 0);
        b.put(x + sx, y, z, edge ? 'trim' : 'hull2', edge ? GOLDT : IRON, 'metal', edge ? 0.45 : 0);
      }
      b.put(x + sx * 2, top, z, 'trim', IRON, 'metal');   // spine on the back of the blade
      if (i % 3 === 1 && i < 16) b.put(x + sx * 2, Math.round((top + bot) / 2), z, 'light', RUNE, 'energy', 0.9);   // runes on the outer face
    }
    // glowing rune bands down both flanks
    for (let z = -14; z <= 10; z += 2) b.sym(Math.round(6.6 * Math.sqrt(Math.max(0, 1 - ((z + 2) / 17) ** 2))), 0, z, 'light', RUNE, 'energy', 0.85);
    // the storm tower and its eye
    b.box(-2, 2, 4, 12, -6, -2, 'hull2', STONE2);
    b.box(-3, 3, 4, 5, -7, -1, 'trim', IRON);
    b.ell(0, 16, -4, 3.2, 3.2, 3.2, 'light', SKY, 'energy', 1);
    b.ring(0, 16, -4, 5.5, 'xz', 'accent', P.acc, 'energy', 0.9);
    b.ring(0, 16, -4, 6.5, 'xy', 'trim', GOLDT, 'metal', 0.5);
    // four coil spires at the corners, each crowned with an orb
    const tips = [[0, 16, -4]];
    for (const [sx, z] of [[-1, 6], [1, 6], [-1, -13], [1, -13]]) {
      for (let y = 3; y <= 13; y++) { b.put(sx * 8, y, z, 'trim', '#9aa7ba'); if (y % 2) { b.put(sx * 9, y, z, 'accent', P.acc, 'energy', 0.75); b.put(sx * 7, y, z, 'accent', P.acc, 'energy', 0.75); } }
      b.ell(sx * 8, 15, z, 1.6, 1.6, 1.6, 'light', SKY, 'energy', 1);
      tips.push([sx * 8, 15, z]);
    }
    // storm sails sweeping up and back from the flanks
    for (const sx of [-1, 1]) for (let i = 0; i <= 10; i++) {
      const x = sx * (7 + i), yTop = 1 + Math.round(i * 0.9), z0 = -2 - i, z1 = 6 - Math.round(i * 1.3);
      for (let z = z0 - 4; z <= Math.max(z0 - 4, z1); z++) b.put(x, yTop - Math.round((z1 - z) * 0.15), z, i === 10 || z === z1 ? 'accent' : 'hull2', i === 10 || z === z1 ? P.acc : STONE2, i === 10 || z === z1 ? 'energy' : 'metal', i === 10 || z === z1 ? 0.8 : 0);
    }
    // nine engines
    const eng = [];
    for (let x = -4; x <= 4; x += 2) eng.push([x, -1, -19]);
    for (const x of [-3, -1, 1, 3]) eng.push([x, 2, -18]);
    engines(b, P, eng, '#a8dcff');
    // live: lightning between the spire orbs and the storm eye
    b.fx.push({ type: 'arcs', points: tips, rate: 9, col: [0.75, 0.9, 1] });
  };

  CREW['Khaured Commander'] = (b, P) => {
    // the Khaured ram, commander-sized: red war banners, a command tower, spiked flanks,
    // knuckles burning and broadside batteries
    const len = khaured(b, P, P.L);
    const RED = '#b3221c';
    for (let x = -3; x <= 3; x += 2) b.put(x, 0, len + 1, 'accent', '#ff5a1f', 'energy', 0.9);
    b.box(-1, 1, 3, 7, -len + 4, -len + 7, 'hull2', '#3b3d44');   // command tower
    b.box(-1, 1, 6, 6, -len + 8, -len + 8, 'glass', '#ff8a5a', 'crystal', 0.7);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) b.box(sx * 5, sx * 5, 1 - i, 1 - i, -len + 4 + i, -len + 9 + i, 'trim', RED, 'none');   // banners
      for (let z = -len + 3; z <= len - 4; z += 3) { b.put(sx * 5, -2, z, 'hull2', '#9aa0a8'); b.put(sx * 6, -2, z, 'trim', '#9aa0a8'); }   // spikes
      for (let z = -4; z <= 4; z += 4) { b.line(sx * 4, 2, z, sx * 4, 2, z + 3, 'dark', '#222428'); b.put(sx * 4, 2, z + 4, 'accent', P.acc, 'energy', 0.7); }   // batteries
    }
    engines(b, P, [[-2, -1, -len - 1], [0, -1, -len - 1], [2, -1, -len - 1], [-2, 1, -len - 1], [0, 1, -len - 1], [2, 1, -len - 1]], '#ff7a3a');
  };

  // -- Mythical: "wow, did you just see that?"
  CREW['Altan Diplomat'] = (b, P) => {
    const PEARL = '#f4f7ff', PEARL2 = '#dfe6f5', TEAL = '#5ff0dc', GOLD = '#f0d27a', CRYS = '#c8fbff';
    // an Altan embassy ship: "quaint and a little primitive by our standards". Nothing touches -
    // the bow and the stern float apart around a living crystal heart, two pairs of crescent
    // wings embrace it, crystal shards hover around the ship and comets of light orbit the heart.
    const pearl = (x, y, z, col = PEARL) => b.put(x, y, z, 'hull', col, 'metal', 0);
    const ell = (cx, cy, cz, rx, ry, rz, col) => { for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1) pearl(x, y, z, col); };
    ell(0, 0, 11, 2.6, 2.4, 7, PEARL);              // the bow
    ell(0, 0, -10, 3.4, 3, 7, PEARL);               // the stern
    ell(0, 1.4, -9, 1.8, 1.6, 4.5, PEARL2);
    for (let z = 6; z <= 17; z += 3) b.sym(2, 0, z, 'accent', TEAL, 'energy', 0.8);    // light seams along the bow
    for (let z = -15; z <= -5; z += 3) b.sym(3, 0, z, 'accent', TEAL, 'energy', 0.8);
    for (const z of [5, -4]) b.ring(0, 0, z, 2.6, 'xy', 'trim', GOLD, 'metal', 0.6);   // gold collars facing the heart
    b.ell(0, 0, 0.5, 3.4, 3.4, 3.4, 'light', TEAL, 'energy', 0.75);   // the floating heart
    b.ell(0, 0, 0.5, 1.2, 1.2, 1.2, 'light', '#ffffff', 'energy', 1);
    b.ring(0, 0, 0.5, 6, 'xy', 'trim', GOLD, 'metal', 0.7);         // halo rings around the heart
    b.ring(0, 0, 0.5, 7.5, 'yz', 'accent', P.acc, 'energy', 0.85);
    // two pairs of crescent wings, raised and lowered like open hands around the heart
    for (const sy of [1, -1]) for (const sx of [-1, 1]) for (let i = 0; i <= 44; i++) {
      const th = -1.2 + i / 44 * 2.3, w = (sy > 0 ? 3.4 : 2.4) * Math.cos((i / 44 - 0.5) * Math.PI);
      const R = sy > 0 ? 16 : 13, tilt = sy > 0 ? 0.62 : -0.5;
      for (let rr = R - w; rr <= R + 0.01; rr += 0.5) {
        const out = Math.cos(th) * rr, z = Math.sin(th) * rr + (sy > 0 ? 0 : -2);
        const x = sx * out * Math.cos(tilt), y = out * Math.sin(tilt) * (sy > 0 ? 1 : 1);
        const edge = rr > R - 0.6;
        if (edge) b.put(x, y, z, 'accent', TEAL, 'energy', 0.55); else pearl(x, y, z, sy > 0 ? PEARL : PEARL2);
      }
      if (i % 6 === 3) { const rr = R - 1.2, out = Math.cos(th) * rr; b.put(sx * out * Math.cos(tilt), out * Math.sin(tilt), Math.sin(th) * rr + (sy > 0 ? 0 : -2), 'trim', GOLD, 'metal', 0.7); }
    }
    // a gold filigree arch over the heart, from bow to stern
    for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; b.put(0, 3 + Math.sin(t) * 8, 0.5 - Math.cos(t) * 11, 'trim', GOLD, 'metal', 0.7); }
    b.put(0, 12, 0, 'light', '#ffffff', 'energy', 1);
    // crystal shards hovering around the ship (little diamonds)
    const shards = [[0, 15, 6], [0, -9, 4], [-11, 3, 13], [11, 3, 13], [-9, -6, -9], [9, -6, -9], [0, 5, 20], [0, 7, -18]];
    for (const [x, y, z] of shards) {
      b.put(x, y, z, 'glass', '#ffffff', 'crystal', 1);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) b.put(x + dx, y + dy, z + dz, 'glass', CRYS, 'crystal', 0.75);
      b.put(x, y + 1, z, 'glass', CRYS, 'crystal', 0.85); b.put(x, y + 2, z, 'glass', CRYS, 'crystal', 0.6); b.put(x, y - 1, z, 'glass', CRYS, 'crystal', 0.6);
    }
    engines(b, P, [[0, 0, -17], [-2, 0, -16], [2, 0, -16], [0, 2, -16], [0, -2, -16]], '#9ff6ee');
    b.flame = [0.4, 1, 0.9];
    // live: comets of light orbiting the heart, the heart pulsing out rings, sparkles off the shards
    b.fx.push({ type: 'orbit', c: [0, 0, 0.5], rings: [
      { R: 6, u: [1, 0, 0], v: [0, 1, 0], speed: 1.8, n: 3, col: [1, 0.85, 0.45] },
      { R: 7.5, u: [0, 1, 0], v: [0, 0, 1], speed: -1.3, n: 2, col: [0.35, 1, 0.85] },
      { R: 10, u: [0.71, 0.71, 0], v: [0, 0, 1], speed: 1, n: 4, col: [0.85, 1, 1] },
      { R: 10, u: [-0.71, 0.71, 0], v: [0, 0, 1], speed: -0.8, n: 4, col: [1, 0.75, 1] },
    ] });
    b.fx.push({ type: 'pulse', c: [0, 0, 0.5], every: 1.6, R: 13, col: [0.45, 1, 0.9] });
    b.fx.push({ type: 'glints', points: shards, rate: 18, col: [0.8, 1, 1] });
  };

  // -- the 2025/26 crew, all Common
  CREW['Augment Rebel'] = (b, P) => {
    // a scrap-built raider: mismatched plates and one oversized mechanical arm
    const SCRAP = ['#7a5a44', '#5d6068', '#8c95a1', '#6b4a3a', '#4a4f57'];
    b.box(-2, 2, -1, 1, -6, 5, 'hull', '#5d6068');
    for (const v of b.voxels()) b.put(v.x, v.y, v.z, 'hull', SCRAP[(h3(v.x, v.y, v.z, 3) * SCRAP.length) | 0]);
    b.box(-1, 1, 2, 2, 0, 3, 'glass', '#ff9a6a', 'crystal', 0.35);
    b.box(-6, -3, 0, 0, -3, 0, 'hull2', '#6b4a3a');   // a stubby wing
    b.line(3, 0, 2, 6, -1, 6, 'trim', '#8c95a1');      // the arm
    b.line(6, -1, 6, 6, -1, 9, 'trim', '#8c95a1');
    b.put(5, -1, 10, 'trim', '#c9ced6'); b.put(7, -1, 10, 'trim', '#c9ced6');   // claw
    b.put(-3, 1, -2, 'accent', P.acc, 'energy', 0.4);
    engines(b, P, [[-1, 0, -7], [1, 0, -7]], '#ff8a4a');
  };

  CREW['Elgem Trader'] = (b, P) => {
    const PET = ['#ff6fa8', '#ffd24a', '#5ae0c8'];
    // a bright flower of a ship: a jewelled pod with petal fins and hanging trade baskets
    b.ell(0, 0, 0, 2.5, 2.5, 4, 'hull', '#e8d8c0');
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2, col = PET[k % 3];
      for (let i = 2; i <= 6; i++) { const r = i, w = i < 5 ? 1 : 0; for (let o = -w; o <= w; o++) b.put(Math.cos(a) * r - Math.sin(a) * o * 0.6, Math.sin(a) * r + Math.cos(a) * o * 0.6, -1 - i * 0.3, 'hull2', col, 'none'); }
    }
    b.put(0, 0, 4, 'accent', P.acc, 'crystal', 0.6);
    for (const [x, y] of [[2, 2], [-2, 2], [0, -3]]) b.put(x, y, 2, 'light', '#bff6ff', 'crystal', 0.5);   // jewels
    b.box(-1, 1, -4, -3, -1, 1, 'trim', '#a8835a', 'none');   // baskets
    engines(b, P, [[0, 0, -5]], '#ffd27a');
  };

  CREW['Lopati Technician'] = (b, P) => {
    const Y = '#c9a043', G = '#5d6068';
    // a junkyard tug: a boxy cab, tool arms with a welding spark, crates of scrap in tow
    b.box(-2, 2, -1, 2, 0, 4, 'hull', Y);
    b.box(-1, 1, 1, 2, 3, 4, 'glass', '#9fd2ff', 'crystal', 0.3);
    b.box(-2, 2, -1, 0, -6, -1, 'hull2', G);
    for (const sx of [-1, 1]) { b.line(sx * 3, 0, 2, sx * 4, -1, 6, 'trim', '#8c95a1'); }
    b.put(4, -1, 7, 'light', '#bfe8ff', 'energy', 1);   // welding spark
    b.put(-4, -1, 7, 'trim', '#c9ced6');
    b.box(-1, 1, -3, -1, -10, -8, 'trim', '#8a6a48', 'none');   // crate in tow
    b.line(0, -1, -7, 0, -1, -6, 'dark', '#2b3038');
    b.put(0, 3, 1, 'accent', P.acc, 'energy', 0.5);
    engines(b, P, [[-1, 0, -7], [1, 0, -7]], '#ffb060');
  };

  CREW['Onoros Drone'] = (b, P) => {
    // never alone: three small chitin drones flying in tight formation, humming in unison
    const C = '#5b4a7a', C2 = '#7a66a0';
    const drone = (ox, oy, oz) => {
      b.ell(ox, oy, oz, 1.8, 1, 2.2, 'hull', C);
      b.sym(ox + 2, oy, oz - 1, 'hull2', C2); b.sym(ox + 3, oy, oz - 1, 'hull2', C2);
      b.put(ox, oy + 1, oz + 1, 'accent', P.acc, 'crystal', 0.7);
      b.put(ox, oy, oz - 3, 'engine', '#d8a8ff', 'energy', P.eng);
    };
    drone(0, 0, 3); drone(-5, 0, -2); drone(5, 0, -2);
    for (const v of b.voxels()) if (v.role === 'hull2' && Math.abs(v.x) > 8) b.del(v.x, v.y, v.z);
  };

  // what each ship is, for the style sheet
  const CREW_NOTES = {
    'Stealth Mercenary': 'A flat matte-black wedge with a slit cockpit. The stealth comes from the tech, not the ship: nothing glows.',
    'Grey Peacemaker': 'A small plain Grey saucer with a glass dome and a ring of dim lights. Peaceful, and a little boring on purpose.',
    'LG Soldier': 'A light arrow fighter in olive military paint. Built for speed and surprise: swept wings, element-coloured wingtips.',
    'Grey Scientist': 'A lab saucer with a sensor mast and three specimen pods hanging below, glowing in the element colour.',
    'Nordic Warrior': 'A space longship: curved hull, tall prow, a sail and a row of round shields down each side.',
    'Terminator': 'A chrome skeleton of a ship: spine, ribs, a skull nose and a single red eye.',
    'Wise Ancient One': 'A slender ark with crescent wings, a line of glowing runes along the spine and a lantern hanging from the bow.',
    'Explosives Specialist': 'A bulky hauler with bomb racks under the wings, hazard stripes on the nose, and one red and one blue wire.',
    'Robot Supersoldier': 'An armoured robotic gunship: layered armour bands, shoulder pods with cannons and a red visor.',
    'Intergalactic Zombie': 'A rotting derelict that should not still fly: rusted holes, exposed bone ribs and glowing ooze dripping from the hull.',
    'Mysterious Hacker': 'A stealth diamond laced with glowing circuit traces, an antenna array, a holo panel and data cubes orbiting it.',
    'Enhanced Reptiloid': 'An organic reptile hull with dorsal spines and claws, bolted full of glowing cybernetic implants.',
    'Astronaut (KOGs)': 'A retro rocket from another universe: white hull, orange bands, fins, portholes, side boosters and a beacon calling home.',
    'Alien Bat (Horrors)': 'A bat-winged horror: membrane wings stretched between finger bones, pointed ears and glowing red eyes.',
    'Interstellar Emissary': 'A tall dark herald spire with one burning eye in a gold ring and cloak-like vanes trailing behind it.',
    'Infected Khaured': 'A Khaured battering-ram hull overgrown by a parasitic fungus: glowing spore caps and tendrils.',
    'R 3 X': 'A weathered guardian turned wanderer: patched hull, a big guardian shield ring at the bow, a seeker dish, a data pack, a tattered sail and teal Altan reprogramming lines.',
    'Storm Giant': 'A colossal Nordic dreadnought flanked by two great cleavers that almost meet in front of the bow. A storm tower holds a blazing storm eye in a ring of coils, four coil spires stand at the corners, storm sails spread from the flanks, and lightning keeps jumping between spires and eye. Nine engines.',
    'Khaured Commander': 'The Khaured battering ram, commander-sized: a burning iron fist, red war banners, a command tower, spiked flanks and broadside batteries. "Fist-to-face."',
    'Altan Diplomat': 'An Altan embassy ship where nothing touches: a pearl bow and stern float apart around a living crystal heart under a gold arch, two pairs of crescent wings open around it like hands, crystal shards hover around the hull, comets of light orbit the heart in four rings and the heart sends out a pulse of light every few seconds.',
    'Augment Rebel': 'A scrap-built raider of mismatched plates with one oversized mechanical arm and claw.',
    'Elgem Trader': 'A bright flower of a ship: a jewelled pod ringed by petal fins, with trade baskets underneath.',
    'Lopati Technician': 'A junkyard tug: boxy cab, tool arms with a welding spark and a crate of scrap in tow.',
    'Onoros Drone': 'Never alone: three small chitin drones flying in tight formation, humming in unison.',
  };

  // ------------------------------------------------------------------ shines
  // the same model, refinished
  function applyShine(vox, shine, L) {
    const S = shineLevel(shine);
    if (S === 0) return vox;
    return vox.map(v => {
      const o = { ...v }, r = h3(v.x, v.y, v.z, 77);
      if (S === 1) {   // Gold: gold trim and accents
        if (v.role === 'trim' || v.role === 'accent') { o.col = '#f2c14e'; o.mat = 'metal'; o.glow = Math.max(v.glow, 0.25); }
        else if (v.role === 'hull2' && r < 0.35) { o.col = '#d6a93e'; o.mat = 'metal'; }
        else if (v.role === 'engine') o.col = '#ffd27a';
      } else if (S === 2) {   // XDimension: phase-shifting violet/cyan panels
        if (v.role === 'trim' || v.role === 'accent' || v.role === 'glass' || v.role === 'light') { o.mat = 'phase'; o.glow = Math.max(0.55, v.glow); }
        else if (v.role === 'hull' || v.role === 'hull2') { o.col = mixHex(v.col, '#4a3a78', 0.35); if (r < 0.06) { o.mat = 'phase'; o.glow = 0.45; } }
        else if (v.role === 'engine') o.col = '#b6a0ff';
      } else if (S === 3) {   // Stardust: deep-navy hull with twinkling stars
        if (v.role === 'hull' || v.role === 'hull2' || v.role === 'dark') {
          o.col = v.role === 'hull' ? '#1b2344' : '#2a3462'; o.mat = 'metal';
          if (r < 0.055) { o.col = '#dfe9ff'; o.mat = 'crystal'; o.glow = 0.35 + r * 4; }   // sparse stars, not snow
        } else if (v.role === 'trim' || v.role === 'accent') { o.col = '#bcd6ff'; o.mat = 'crystal'; o.glow = Math.max(0.5, v.glow); }
        else if (v.role === 'engine') o.col = '#cfe0ff';
      } else {   // Antimatter: black hull, magenta energy veins
        if (v.role === 'hull' || v.role === 'hull2' || v.role === 'dark') {
          o.col = v.role === 'hull' ? '#120d16' : '#22172a'; o.mat = 'metal';
          if (r < 0.07) { o.col = '#ff3df0'; o.mat = 'energy'; o.glow = 0.8; }
        } else if (v.role === 'trim' || v.role === 'accent' || v.role === 'light') { o.col = '#ff3df0'; o.mat = 'energy'; o.glow = 0.9; }
        else if (v.role === 'glass') { o.col = '#2a0f30'; o.mat = 'crystal'; o.glow = 0.3; }
        else if (v.role === 'engine') o.col = '#ff6af2';
      }
      return o;
    });
  }
  function mixHex(a, b, t) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // engine exhaust per shine: colour of the main flame and the extra sparkle
  const EXHAUST = {
    Stone: { flame: [1, 0.62, 0.3], extra: null },
    Gold: { flame: [1, 0.8, 0.35], extra: [1, 0.85, 0.3] },
    XDimension: { flame: [0.7, 0.6, 1], extra: 'phase' },
    Stardust: { flame: [0.75, 0.82, 1], extra: [1, 1, 1] },
    Antimatter: { flame: [1, 0.25, 0.95], extra: 'dark' },
  };

  // build a ship: voxels (after the shine) + where its engines are
  function buildShip(name, rarity, element, variant, shine) {
    const gen = CREW[name];
    if (!gen) return null;
    const L = rarityLevel(rarity);
    const b = builder();
    gen(b, { L, acc: ELEMENT[element] || ELEMENT.Neutral, v: variant, eng: 0.45 + 0.11 * L });
    let vox = b.voxels();
    // drop voxels nobody can see (all six neighbours filled)
    const set = new Set(vox.map(v => v.x + ',' + v.y + ',' + v.z));
    vox = vox.filter(v => ![[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([dx, dy, dz]) => set.has((v.x + dx) + ',' + (v.y + dy) + ',' + (v.z + dz))) || v.role === 'engine');
    vox = applyShine(vox, shine, L);
    const engs = vox.filter(v => v.role === 'engine').map(v => [v.x, v.y, v.z - 0.6]);
    let r = 0;
    for (const v of vox) r = Math.max(r, Math.hypot(v.x, v.y, v.z));
    return { vox, engines: engs, radius: r + 1, L, shine, fx: b.fx, flame: b.flame };
  }

  // ================================================================== weapons
  // A weapon is fire(A, T): A is the effect engine (weapons-lib.js), T the tier toolkit for
  // this card's rarity, shine and class. Every weapon has its own shape; T.trail and
  // T.impact add what the rarity and the shine bring, so all weapons scale the same way.
  const CLASS_PAL = {
    Fire: { main: [1, 0.45, 0.12], hot: [1, 0.85, 0.5], dark: [0.3, 0.08, 0.02] },
    Nature: { main: [0.45, 0.9, 0.3], hot: [0.85, 1, 0.6], dark: [0.12, 0.25, 0.08] },
    Metal: { main: [0.7, 0.8, 0.92], hot: [1, 1, 1], dark: [0.25, 0.28, 0.32] },
    Air: { main: [0.4, 0.85, 1], hot: [0.9, 0.98, 1], dark: [0.1, 0.2, 0.3] },
    Gem: { main: [0.78, 0.42, 1], hot: [1, 0.8, 1], dark: [0.2, 0.08, 0.3] },
    Neutral: { main: [0.92, 0.88, 0.78], hot: [1, 1, 0.95], dark: [0.3, 0.28, 0.25] },
  };
  const GOLD = [1, 0.8, 0.3], VIOLET = [0.62, 0.38, 1], CYAN = [0.3, 0.95, 1], MAGENTA = [1, 0.25, 0.95], STAR = [0.85, 0.92, 1], BLACK = [0.03, 0, 0.05];
  const U = () => WeaponKit.util;
  const sky = n => U().norm(U().add(n, [0, 1.4, 0]));
  // a ring of chunky particles around c, facing d (ringNow is hair-thin)
  const bigRing = (A, c, d, rad, n, col, size = 0.04, i = 1.4, life = 0.05) => {
    const { add, scale, basis } = U(), [u, v] = basis(d);
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; A.emit(add(c, add(scale(u, Math.cos(a) * rad), scale(v, Math.sin(a) * rad))), [0, 0, 0], life, size, col, i, { drag: 0 }); }
  };

  function makeTier(A, rarity, shine, cls) {
    const { add, scale, jit, cross, norm, basis } = U();
    const R = rarityLevel(rarity), S = shineLevel(shine), pal = CLASS_PAL[cls] || CLASS_PAL.Neutral;
    const k = [0.45, 0.6, 0.8, 1, 1.25, 1.6][R];        // brightness / size
    const nm = [0.35, 0.55, 0.8, 1, 1.45, 2.1][R];      // particle counts
    const T = {
      R, S, k, pal,
      n: x => Math.max(1, Math.round(x * nm)),
      // everything a projectile leaves behind
      trail(p, d, size = 0.05, col = pal.main) {
        A.emit(p, add(scale(d, -0.3), jit(0.08 * k)), 0.16 + 0.07 * R, size * k, col, 0.5 + 0.2 * R, { drag: 3 });
        if (R >= 2) A.emit(p, jit(0.03), 0.22 + 0.08 * R, size * 0.5 * k, pal.hot, 1.0, { drag: 1 });
        if (R >= 4 && Math.random() < 0.5) A.emit(p, jit(0.5), 0.45, 0.012, pal.hot, 1.4, { drag: 2, twinkle: true });
        T.shineTrail(p, d, size);
      },
      shineTrail(p, d, size = 0.05) {
        if (S === 1) { if (Math.random() < 0.55) A.emit(add(p, jit(0.05)), add(scale(d, -0.1), jit(0.25)), 0.5, 0.012 + 0.004 * R, GOLD, 1.5, { drag: 2, twinkle: true }); }
        else if (S === 2) {
          const side = norm(cross(d, [0, 1, 0.01]));
          if (Math.random() < 0.6) A.emit(add(p, scale(side, (Math.random() < 0.5 ? -1 : 1) * 0.05)), [0, 0, 0], 0.12, size * 0.8 * k, Math.random() < 0.5 ? VIOLET : CYAN, 1.2, { drag: 0 });
          if (Math.random() < 0.15) A.emit(add(p, scale(d, -0.25)), [0, 0, 0], 0.08, size * 1.6 * k, VIOLET, 0.8, { drag: 0 });   // afterimage
        } else if (S === 3) { for (let i = 0; i < 2; i++) A.emit(add(p, jit(0.12)), jit(0.08), 0.6 + Math.random() * 0.5, 0.01 + Math.random() * 0.01, STAR, 1.6, { drag: 1, twinkle: true }); }
        else if (S === 4) {
          A.emit(p, jit(0.02), 0.25, size * 1.4 * k, BLACK, 0.85, { add: false, drag: 2 });
          if (Math.random() < 0.7) A.emit(add(p, jit(0.06)), jit(0.15), 0.25, size * 0.6 * k, MAGENTA, 1.4, { drag: 2 });
        }
      },
      // the hit: grows with rarity, finished by the shine
      impact(tg, size = 1, col = pal.main) {
        A.flash(tg.p, (0.12 + 0.07 * R) * size, pal.hot, 0.16 + 0.04 * R);
        A.burst(tg.p, T.n(10 * size), 0.6 + 0.12 * R, 0.4 + 0.05 * R, 0.014 * k, [col, pal.hot], tg.n);
        if (R >= 2) A.ring(tg.p, tg.n, T.n(14), 0.5 + 0.22 * R, 0.35 + 0.05 * R, 0.02 * k, col, 1.1);
        if (R >= 3) { A.puff(tg.p, tg.n, T.n(4), [0.32, 0.3, 0.3]); A.after(0.08, () => A.ring(tg.p, tg.n, T.n(18), 0.9 + 0.2 * R, 0.45, 0.022 * k, pal.hot, 1.2)); }
        if (R >= 4) { A.starburst(tg.p, tg.n, 6 + 2 * R, col); A.flash(tg.p, 0.25 * size * k, col, 0.6); }
        if (R >= 5) T.wow(tg, size, col);
        T.shineImpact(tg, size);
        A.crater(tg, { r: (0.8 + 0.28 * R) * size });
      },
      // Mythical: a pillar of light, a double shockwave and a rain of sparks
      wow(tg, size = 1, col = pal.main) {
        const up = sky(tg.n);
        A.flash(tg.p, 0.45 * size, [1, 1, 1], 0.3);
        A.after(0.12, () => A.ring(tg.p, tg.n, 40, 2.2, 0.6, 0.03, pal.hot, 1.4));
        A.after(0.26, () => A.ring(tg.p, tg.n, 40, 1.4, 0.7, 0.03, col, 1.3));
        // energy crawling over the ground around the crater
        for (let i = 0; i < 7; i++) A.after(0.05 + i * 0.06, () => { const t2 = A.near(tg, 0.14); A.bolt(add(tg.p, scale(tg.n, 0.02)), add(t2.p, scale(t2.n, 0.02)), 0.12, i % 2 ? pal.hot : col, 0.012); });
        A.after(0.2, () => { for (let i = 0; i < 30; i++) A.emit(add(tg.p, jit(0.2)), add(scale(up, 0.5 + Math.random() * 0.7), jit(0.35)), 0.9, 0.014, Math.random() < 0.5 ? pal.hot : col, 1.5, { drag: 2, twinkle: true }); });
      },
      shineImpact(tg, size = 1) {
        if (S === 1) { A.ring(tg.p, tg.n, 16, 0.8 + 0.1 * R, 0.4, 0.016, GOLD, 1.5); for (let i = 0; i < 8 + 2 * R; i++) A.emit(tg.p, add(scale(tg.n, 0.6 + Math.random() * 0.6), jit(0.6)), 0.7, 0.012, GOLD, 1.6, { drag: 2, twinkle: true }); }
        else if (S === 2) {
          A.ring(tg.p, tg.n, 22, 0.5, 0.35, 0.014, VIOLET, 1.6);
          A.after(0.07, () => A.ring(tg.p, tg.n, 18, 0.3, 0.3, 0.012, CYAN, 1.6));
          for (let i = 0; i < 3; i++) A.after(i * 0.06, () => A.flash(add(tg.p, jit(0.25)), 0.08 * k, i % 2 ? VIOLET : CYAN, 0.08));
        } else if (S === 3) { for (let i = 0; i < 14 + 3 * R; i++) A.emit(tg.p, add(scale(tg.n, 0.3), jit(1.0)), 0.8 + Math.random() * 0.6, 0.01 + Math.random() * 0.012, STAR, 1.7, { drag: 2.5, twinkle: true }); }
        else if (S === 4) {
          A.implode(tg.p, 0.25 + 0.04 * R, 0.18, MAGENTA);
          A.after(0.18, () => { A.puff(tg.p, tg.n, 5, BLACK, 0.5, 1.0); A.ring(tg.p, tg.n, 20, 0.9, 0.4, 0.02, MAGENTA, 1.5); for (let i = 0; i < 3; i++) A.bolt(tg.p, add(tg.p, add(scale(tg.n, 0.2), jit(0.6))), 0.12, MAGENTA, 0.01); });
        }
      },
      muzzle(nose, d) {
        A.flash(nose, 0.06 + 0.03 * R, pal.hot, 0.1);
        if (S) T.shineTrail(nose, d, 0.04);
      },
      // a single bullet's hit: a small flash and burst, a touch of the shine, a small crater
      spark(tg, col = pal.main) {
        A.flash(tg.p, 0.05 + 0.015 * R, pal.hot, 0.1);
        A.burst(tg.p, T.n(5), 0.4 + 0.05 * R, 0.25, 0.01 * k, [col, pal.hot], tg.n);
        if (S === 1) A.emit(tg.p, add(scale(tg.n, 0.4), jit(0.3)), 0.45, 0.01, GOLD, 1.5, { drag: 2, twinkle: true });
        else if (S === 2) A.flash(add(tg.p, jit(0.05)), 0.05 * k, Math.random() < 0.5 ? VIOLET : CYAN, 0.08);
        else if (S === 3) for (let i = 0; i < 3; i++) A.emit(tg.p, add(scale(tg.n, 0.3), jit(0.5)), 0.6, 0.009, STAR, 1.6, { drag: 2.5, twinkle: true });
        else if (S === 4) { A.emit(tg.p, jit(0.02), 0.3, 0.04 * k, BLACK, 0.8, { add: false, drag: 2 }); A.emit(tg.p, add(scale(tg.n, 0.3), jit(0.3)), 0.25, 0.012, MAGENTA, 1.4, { drag: 2 }); }
        A.crater(tg, { r: 0.55 + 0.08 * R, quiet: true });
      },
    };
    return T;
  }

  // ---------------------------------------------------------------- building blocks
  // fire a projectile from the ship to a target; the toolkit adds trail and impact
  function shot(A, T, o) {
    const s = A.ship(0), tg = o.tg || A.near(A.aim, o.spread ?? 0.12);
    T.muzzle(s.nose, s.fwd);
    A.proj({
      from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: o.flight ?? 0.7, path: o.path || 'line',
      model: o.model, scale: o.scale, spin: o.spin, keep: o.keep, splitAt: o.splitAt, split: o.split, dig: o.dig,
      trail: (p, d, u) => { if (o.trail) o.trail(p, d, u, tg); else T.trail(p, d, o.size ?? 0.05, o.col); },
      hit: () => { if (o.hit) o.hit(tg); else T.impact(tg, o.impact ?? 1, o.col); },
    });
    return tg;
  }
  // a crescent "blade wave" flying at the target
  function slash(A, T, o) {
    const { add, scale, cross, norm } = U();
    return shot(A, T, { ...o, path: 'line', trail: (p, d, u, tg) => {
      const side = norm(cross(d, [0, 1, 0.01])), up = norm(cross(side, d)), w = (o.width ?? 0.18) * T.k;
      const n = T.n(o.density ?? 7);
      for (let i = 0; i <= n; i++) {
        const a = (i / n - 0.5) * 2.2, q = add(p, add(scale(side, Math.sin(a) * w), add(scale(up, Math.cos(a) * w * 0.35), scale(d, -Math.cos(a) * w * 0.5))));
        A.emit(q, scale(d, -0.1), 0.06 + 0.02 * T.R, (o.size ?? 0.035) * T.k, i === n >> 1 ? T.pal.hot : (o.col || T.pal.main), 0.9 + 0.15 * T.R, { drag: 0 });
      }
      T.shineTrail(p, d, 0.04);
      if (o.extra) o.extra(p, d, u, tg);
    } });
  }
  // a spinning thrown weapon (axes, hammers): a wheel of particles around the projectile
  function spinner(A, T, o) {
    const { add, scale, cross, norm } = U();
    let ang = 0;
    return shot(A, T, { ...o, trail: (p, d, u, tg) => {
      ang += 0.9;
      const side = norm(cross(d, [0, 1, 0.01])), up = norm(cross(side, d)), r = (o.radius ?? 0.08) * T.k;
      for (let i = 0; i < (o.blades ?? 2); i++) {
        const a = ang + i * Math.PI * 2 / (o.blades ?? 2), q = add(p, add(scale(up, Math.cos(a) * r), scale(d, Math.sin(a) * r)));
        A.emit(q, [0, 0, 0], 0.12 + 0.03 * T.R, (o.size ?? 0.04) * T.k, o.col || T.pal.main, 1.0, { drag: 0 });
      }
      A.emit(p, [0, 0, 0], 0.05, 0.03 * T.k, T.pal.hot, 0.8, { drag: 0 });
      T.shineTrail(p, d, 0.04);
      if (o.extra) o.extra(p, d, u, tg);
    } });
  }
  // a flat energy disc pushed forward (shields)
  function disc(A, T, o) {
    const { add, scale } = U();
    return shot(A, T, { ...o, trail: (p, d, u, tg) => {
      A.ringNow(p, d, (o.radius ?? 0.12) * T.k * (0.7 + 0.3 * u), T.n(o.density ?? 14), o.col || T.pal.main, 0.7 + 0.15 * T.R);
      A.emit(p, scale(d, -0.2), 0.12, 0.05 * T.k, T.pal.hot, 0.5, { drag: 2 });
      T.shineTrail(p, d, 0.05);
      if (o.extra) o.extra(p, d, u, tg);
    } });
  }

  const ARMS = {}, ARMS_NOTES = {};
  const BROWN = [0.45, 0.33, 0.22], DUST = [0.5, 0.45, 0.38];

  // ---------------------------------------------------------------- Abundant: plain
  ARMS['Standard Sword'] = (A, T) => slash(A, T, { flight: 0.6, width: 0.14, density: 5 });
  ARMS_NOTES['Standard Sword'] = 'One small grey blade wave. That is all it does.';

  ARMS['Rock Cudgel'] = (A, T) => shot(A, T, { path: 'arc', flight: 0.9, model: 'bomblet', scale: 0.022, col: BROWN,
    trail: (p, d) => { A.smoke(p, d.map(v => -v * 0.1), 0.5, 0.03, DUST, 0.35); T.shineTrail(p, d); },
    hit: tg => { A.puff(tg.p, tg.n, 4, DUST, 0.5); T.impact(tg, 0.9, BROWN); } });
  ARMS_NOTES['Rock Cudgel'] = 'A rock, lobbed. It lands with a thud and a puff of dust.';

  ARMS['Standard Issue Axe'] = (A, T) => spinner(A, T, { path: 'arc', flight: 0.8, blades: 1, radius: 0.07 });
  ARMS_NOTES['Standard Issue Axe'] = 'An axe, thrown end over end. Everyone gets one.';

  ARMS['Standard Shield'] = (A, T) => disc(A, T, { flight: 0.7, radius: 0.1, density: 10 });
  ARMS_NOTES['Standard Shield'] = 'A dim shield disc shoved at the planet. Basic protection, basic offence.';

  // ---------------------------------------------------------------- Common: a little better
  ARMS['Rock Blade'] = (A, T) => slash(A, T, { flight: 0.6, col: [0.6, 0.55, 0.45],
    extra: (p, d) => { if (Math.random() < 0.6) A.smoke(p, U().jit(0.3), 0.6, 0.015, BROWN, 0.8, 0.5); } });
  ARMS_NOTES['Rock Blade'] = 'A stone-grey blade wave shedding rock chips. The right rock makes the cut.';

  ARMS['Stave of Deception'] = (A, T) => {
    const { add, scale } = U();
    const s = A.ship(0);
    // the eyes glare - don't look - then three bolts fly; only one is real
    for (const sx of [-1, 1]) A.emit(add(s.nose, scale(s.right, sx * 0.04)), [0, 0, 0], 0.35, 0.03, [1, 0.15, 0.1], 1.6, { drag: 0 });
    for (let i = 0; i < 3; i++) A.after(0.12 + i * 0.05, () => {
      const real = i === 1, tg = A.near(A.aim, real ? 0.08 : 0.35);
      A.proj({ from: A.ship(0).nose, to: tg, flight: 0.65, path: 'wiggle',
        trail: (p, d, u) => { if (!real && u > 0.55) return; T.trail(p, d, 0.045, real ? T.pal.main : [1, 0.6, 0.3]); },
        hit: () => { if (real) T.impact(tg); } });
    });
  };
  ARMS_NOTES['Stave of Deception'] = 'Two red eyes glare from the stave, then three fire bolts fly. Two are fakes that fade halfway; only one hits.';

  ARMS['Titanium Dagger'] = (A, T) => shot(A, T, { flight: 0.35, size: 0.03,
    trail: (p, d) => { A.emit(p, [0, 0, 0], 0.08, 0.025 * T.k, [0.9, 0.95, 1], 1.2, { drag: 0 }); if (Math.random() < 0.2) A.emit(p, [0, 0, 0], 0.05, 0.06 * T.k, [1, 1, 1], 1.4, { drag: 0 }); T.shineTrail(p, d, 0.03); } });
  ARMS_NOTES['Titanium Dagger'] = 'A quick silver dagger that glints as it flies. Grey craftsmanship.';

  ARMS['Kite Axe'] = (A, T) => spinner(A, T, { path: 'wiggle', flight: 1.0, blades: 1, radius: 0.06,
    extra: (p, d) => A.emit(p, d.map(v => -v * 0.2), 0.5, 0.018, [1, 0.5, 0.5], 0.8, { drag: 1 }) });
  ARMS_NOTES['Kite Axe'] = 'An axe that flutters in on a wobbly kite path with a ribbon tail. It does not fly for long.';

  ARMS['Widow Maker'] = (A, T) => shot(A, T, { flight: 0.75, model: 'rod', scale: 0.016, size: 0.06, col: [0.55, 0.6, 0.66],
    trail: (p, d) => { A.smoke(p, U().jit(0.05), 0.8, 0.04, [0.2, 0.2, 0.22], 0.5); T.trail(p, d, 0.04, [0.6, 0.65, 0.7]); },
    hit: tg => T.impact(tg, 1.25) });
  ARMS_NOTES['Widow Maker'] = 'One heavy dark slug trailing black smoke. Slow, and it leaves a bigger hole than its rarity suggests.';

  ARMS['Spike Hammer'] = (A, T) => {
    const { add, scale, norm, basis } = U();
    const tg = A.near(A.aim, 0.1);
    A.proj({ from: add(tg.p, scale(tg.n, 2.2)), to: tg, flight: 0.45, path: 'line', model: 'shell', scale: 0.03,
      trail: (p, d) => T.trail(p, d, 0.05),
      hit: () => {
        T.impact(tg, 1.05);
        const [u, v] = basis(tg.n);   // what, you wanted more spikes?
        for (let i = 0; i < 6 + T.R; i++) { const a = i / (6 + T.R) * Math.PI * 2, dir = norm(add(add(scale(u, Math.cos(a)), scale(v, Math.sin(a))), scale(tg.n, 0.6))); for (let s = 0; s < 4; s++) A.emit(add(tg.p, scale(dir, s * 0.025)), scale(dir, 0.9), 0.3, 0.016, T.pal.hot, 1.2, { drag: 5 }); }
      } });
  };
  ARMS_NOTES['Spike Hammer'] = 'A hammer slammed down from above; spikes burst out all around the impact. More spikes than you asked for.';

  ARMS['Confuser'] = (A, T) => {
    const { add, jit } = U();
    // a bolt that cannot make up its mind
    shot(A, T, { flight: 0.9, path: 'wiggle',
      trail: (p, d, u) => { T.trail(p, d, 0.04, Math.floor(u * 8) % 2 ? T.pal.main : [0.7, 0.75, 1]); if (Math.random() < 0.2) A.flash(add(p, jit(0.3)), 0.04, [0.8, 0.8, 1], 0.06); } });
  };
  ARMS_NOTES['Confuser'] = 'A wobbling bolt that flickers between colours and throws stray flashes around itself. What on Magor is going on?';

  ARMS['Lithium Dagger'] = (A, T) => {
    const s = A.ship(0);
    A.ringNow(s.nose, s.fwd, 0.06, 12, T.pal.hot, 1.0);   // air blast at launch
    shot(A, T, { flight: 0.4, size: 0.03, hit: tg => { T.impact(tg); A.ring(tg.p, tg.n, 16, 1.0, 0.3, 0.015, T.pal.hot, 1.0); } });
  };
  ARMS_NOTES['Lithium Dagger'] = 'A feather-light dagger with an air blast ring at launch and another on impact.';

  ARMS['Infernal Axe'] = (A, T) => spinner(A, T, { path: 'arc', flight: 0.8, blades: 2, radius: 0.08,
    extra: p => { for (let i = 0; i < 3; i++) A.emit(p, U().jit(0.4), 0.25, 0.03, Math.random() < 0.5 ? [1, 0.4, 0.1] : [1, 0.8, 0.3], 1.3, { drag: 2 }); },
    hit: tg => { A.flash(tg.p, 0.35, [1, 0.6, 0.2], 0.3); T.impact(tg, 0.75); } });
  ARMS_NOTES['Infernal Axe'] = 'A spinning axe wrapped in flickering flames and a big bright flash. What it lacks in power it makes up for in lighting effects.';

  ARMS['Sky Shield'] = (A, T) => {
    const { add, sub, scale, norm, jit } = U();
    const tg = A.near(A.aim, 0.1);
    // strong jets of air: a cone of gusts, then the shield disc
    for (let i = 0; i < T.n(18); i++) A.after(i * 0.02, () => { const nose = A.ship(0).nose; A.emit(nose, add(scale(norm(sub(tg.p, nose)), 2.4), jit(0.5)), 0.5, 0.025, [0.8, 0.95, 1], 0.6, { drag: 1 }); });
    A.after(0.15, () => disc(A, T, { tg, flight: 0.6, radius: 0.12 }));
  };
  ARMS_NOTES['Sky Shield'] = 'A cone of air jets blasts out first, then the shield disc follows through the gust.';

  ARMS['Plasma Shield'] = (A, T) => {
    const tg = A.near(A.aim, 0.1);
    disc(A, T, { tg, flight: 0.6, radius: 0.11,
      extra: p => A.emit(p, [0, 0, 0], 0.06, 0.09 * T.k, [1, 0.5, 0.2], 1.0, { drag: 0 }) });
  };
  ARMS_NOTES['Plasma Shield'] = 'A shield disc with a plasma blob burning at its centre - an outlawed plasma gun in a new job.';

  ARMS['Blackbolt Arbalest'] = (A, T) => shot(A, T, { flight: 0.35, model: 'rod', scale: 0.014,
    trail: (p, d) => { A.emit(p, U().scale(d, -0.05), 0.2, 0.02, [0.12, 0.12, 0.14], 0.7, { add: false, drag: 0 }); T.trail(p, d, 0.03, [0.8, 0.8, 0.85]); } });
  ARMS_NOTES['Blackbolt Arbalest'] = 'A heavy black crossbow bolt fired straight and fast, leaving a dark streak.';

  ARMS['Elgem Dartgun'] = (A, T) => { for (let i = 0; i < 3; i++) A.after(i * 0.07, () => shot(A, T, { flight: 0.35, spread: 0.18, size: 0.025, impact: 0.55 })); };
  ARMS_NOTES['Elgem Dartgun'] = 'Three light velocite darts in a quick volley, each a little gem-coloured pop.';

  ARMS['Magori Revolver'] = (A, T) => { for (let i = 0; i < 6; i++) A.after(i * 0.11, () => shot(A, T, { flight: 0.25, spread: 0.2, size: 0.03, impact: 0.45,
    trail: (p, d) => { A.emit(p, [0, 0, 0], 0.05, 0.02, [1, 0.85, 0.5], 1.3, { drag: 0 }); T.shineTrail(p, d, 0.03); } })); };
  ARMS_NOTES['Magori Revolver'] = 'Six shots, bang-bang-bang: quick tracers with a muzzle flash each. Wild West, Magor style.';

  // ---------------------------------------------------------------- Rare: something to it
  ARMS['Jaggered Spear'] = (A, T) => {
    const { add, scale, cross, norm, basis } = U();
    let k = 0;
    shot(A, T, { flight: 0.45, model: 'rod', scale: 0.02, spread: 0.08,
      trail: (p, d) => {   // a saw-tooth wake: warning, jaggered edges
        const side = norm(cross(d, [0, 1, 0.01])), off = (k++ % 4 < 2 ? 1 : -1) * 0.05 * T.k;
        A.emit(add(p, scale(side, off)), [0, 0, 0], 0.22, 0.022 * T.k, T.pal.main, 1.1, { drag: 0 });
        A.emit(p, [0, 0, 0], 0.08, 0.03 * T.k, T.pal.hot, 1.0, { drag: 0 });
        T.shineTrail(p, d, 0.035);
      },
      hit: tg => {
        T.impact(tg, 1.0);
        const [u, v] = basis(tg.n);   // jagged spikes burst out of the hole
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + Math.random() * 0.4, dir = norm(add(add(scale(u, Math.cos(a)), scale(v, Math.sin(a))), scale(tg.n, 0.3 + Math.random()))); A.bolt(tg.p, add(tg.p, scale(dir, 0.18 + Math.random() * 0.12)), 0.25, T.pal.hot, 0.014); }
      } });
  };
  ARMS_NOTES['Jaggered Spear'] = 'A fast spear with a saw-tooth wake; jagged spikes of light burst out of the hole it leaves.';

  ARMS['Emerald Dagger'] = (A, T) => {
    const { add, scale, jit } = U();
    const EM = [0.25, 1, 0.45];
    shot(A, T, { flight: 0.4, size: 0.035, col: EM,
      trail: (p, d) => { T.trail(p, d, 0.035, EM); if (Math.random() < 0.5) A.emit(add(p, jit(0.04)), jit(0.1), 0.35, 0.014, [0.7, 1, 0.75], 1.6, { drag: 2, twinkle: true }); },
      hit: tg => {
        T.impact(tg, 1.0, EM);
        A.starburst(tg.p, tg.n, 6, EM);   // emerald facets
        // ...and the Little Green People come for the emeralds
        A.after(0.35, () => { for (let i = 0; i < 14; i++) { const from = add(tg.p, add(scale(tg.n, 0.15), jit(0.5))); A.emit(from, scale(U().sub(tg.p, from), 1.4), 0.7, 0.012, [0.4, 1, 0.4], 1.4, { drag: 0, twinkle: true }); } });
      } });
  };
  ARMS_NOTES['Emerald Dagger'] = 'A green dagger with a sparkling emerald wake; the hit flashes emerald facets, then little green motes swarm in from all sides to collect the shards.';

  ARMS['Equalizer Bow'] = (A, T) => {
    const { add, scale } = U();
    const s = A.ship(0), tg = A.near(A.aim, 0.1);
    A.ringNow(s.nose, s.fwd, 0.07, 16, T.pal.hot, 1.0);   // the string snaps forward
    // a fragile arrow: it shatters just before the target - into three that all hit
    A.proj({ from: s.nose, fwd: s.fwd, up: s.up, to: tg, flight: 0.75, path: 'arc', model: 'rod', scale: 0.014, splitAt: 0.78,
      trail: (p, d) => T.trail(p, d, 0.035),
      split: p => {
        A.flash(p, 0.08, T.pal.hot, 0.12);
        for (let i = 0; i < 3; i++) { const t2 = i === 0 ? tg : A.near(tg, 0.06); A.proj({ from: p, to: t2, flight: 0.14 + i * 0.03, path: 'line', trail: (q, d) => T.trail(q, d, 0.025), hit: () => T.impact(t2, i === 0 ? 0.9 : 0.55) }); }
      } });
  };
  ARMS_NOTES['Equalizer Bow'] = 'The string snaps, the arrow arcs in - and shatters right before the target. Fragile, yes: all three pieces hit.';

  ARMS['Storm Edge Sword'] = (A, T) => {
    const { add, scale, jit } = U();
    const tg = A.near(A.aim, 0.1);
    slash(A, T, { tg, flight: 0.55, width: 0.2,
      extra: p => { if (Math.random() < 0.35) A.bolt(add(p, jit(0.1)), add(p, jit(0.14)), 0.06, [0.85, 0.95, 1], 0.01); },
      hit: t => {
        T.impact(t, 1.0);
        for (let i = 0; i < 2 + (T.R >> 1); i++) A.after(0.05 + i * 0.09, () => A.bolt(add(t.p, add(scale(t.n, 0.9), jit(0.3))), add(t.p, jit(0.05)), 0.12, [0.85, 0.95, 1], 0.016));   // the atmosphere answers
      } });
  };
  ARMS_NOTES['Storm Edge Sword'] = 'A wide blade wave crackling with small sparks; when it lands, lightning strikes down onto the cut.';

  ARMS['Waxon Sword'] = (A, T) => {
    const { add, scale, cross, norm, basis } = U();
    const WX = [0.95, 0.55, 1], tg = A.near(A.aim, 0.08);
    slash(A, T, { tg, flight: 0.45, width: 0.22, density: 9, size: 0.022, col: WX,
      extra: p => { if (Math.random() < 0.4) A.emit(p, U().jit(0.05), 0.6, 0.012, [1, 0.85, 1], 1.5, { drag: 2, twinkle: true }); },
      hit: t => {
        T.impact(t, 0.95, WX);
        const [u, v] = basis(t.n);   // the finest edge: one clean bright cut across the crater
        A.line(add(t.p, scale(u, -0.3)), add(t.p, scale(u, 0.3)), 0.35, 0.02, [1, 0.9, 1], 1.5);
      } });
  };
  ARMS_NOTES['Waxon Sword'] = 'A thin, razor-sharp violet blade wave that sheds Waxon glitter; the hit leaves one clean bright cut across the crater.';

  ARMS['Moonshot Blade'] = (A, T) => {
    const { add, scale, jit, norm } = U();
    const tg = A.near(A.aim, 0.1), from = add(tg.p, add(scale(tg.n, 2.4), [0.6, 0.4, 0]));
    // made from meteorites - so it falls like one, with a few smaller rocks for company
    A.flash(A.ship(0).nose, 0.08, T.pal.hot, 0.1);
    const rock = (t2, fl, big) => A.proj({ from: add(from, jit(big ? 0 : 0.25)), to: t2, flight: fl, path: 'line', model: big ? 'shell' : undefined, scale: 0.02,
      trail: (p, d) => { A.emit(p, jit(0.05), 0.3, (big ? 0.06 : 0.03) * T.k, [1, 0.55, 0.2], 1.1, { drag: 2 }); A.smoke(p, jit(0.03), 0.7, big ? 0.04 : 0.025, [0.3, 0.27, 0.27], 0.4); if (big) T.shineTrail(p, d, 0.05); },
      hit: () => big ? T.impact(t2, 1.05) : (A.flash(t2.p, 0.07, [1, 0.6, 0.3], 0.12), A.crater(t2, { r: 0.6 })) });
    rock(tg, 0.6, true);
    for (let i = 0; i < 3; i++) A.after(0.05 + i * 0.07, () => rock(A.near(tg, 0.12), 0.55, false));
  };
  ARMS_NOTES['Moonshot Blade'] = 'The blade drops from high above like the meteorites it was made from - a burning streak with smaller rocks pelting down around it.';

  ARMS['Dawn Sword'] = (A, T) => {
    const { add, scale } = U();
    const tg = A.near(A.aim, 0.08), DAWN = [1, 0.75, 0.4];
    // the chestahedron gem charges up, then a ray of first light
    A.charge(() => A.ship(0).nose, 0.4, DAWN, 0.06);
    A.after(0.4, () => A.beam({ dur: 0.45, from: () => A.ship(0).nose, to: () => tg.p, color: DAWN, core: [1, 1, 0.9], width: 0.05 * T.k, jag: 0.003 }));
    A.after(0.8, () => { T.impact(tg, 1.0, DAWN); A.ring(tg.p, tg.n, 24, 0.8, 0.5, 0.02, [1, 0.55, 0.3], 1.2); });
  };
  ARMS_NOTES['Dawn Sword'] = 'The gem in the hilt charges up with warm light, then fires a short ray of dawn-coloured light, ringed with orange on impact.';

  ARMS['Necromancers Hammer'] = (A, T) => {
    const { add, scale, jit } = U();
    const SOUL = [0.45, 1, 0.65];
    spinner(A, T, { path: 'arc', flight: 0.85, blades: 1, radius: 0.09, size: 0.05, col: [0.5, 0.25, 0.75],
      extra: p => A.smoke(p, jit(0.05), 0.6, 0.03, [0.15, 0.05, 0.2], 0.5),
      hit: tg => {
        T.impact(tg, 1.0);
        // wisps rise from the crater and spiral away
        for (let i = 0; i < 3 + T.R; i++) A.after(0.15 + i * 0.08, () => { const p0 = add(tg.p, jit(0.12)); for (let s = 0; s < 12; s++) A.after(s * 0.035, () => A.emit(add(p0, add(scale(tg.n, s * 0.05), [Math.sin(s * 0.9 + i) * 0.05, 0, Math.cos(s * 0.9 + i) * 0.05])), scale(tg.n, 0.1), 0.6, 0.04, SOUL, 1.4, { drag: 1 })); });
      } });
  };
  ARMS_NOTES['Necromancers Hammer'] = 'A dark purple hammer lobbed in a smoky arc; ghostly green wisps spiral up out of the crater after it lands.';

  ARMS['Green Axe'] = (A, T) => {
    const { add, scale, jit, norm, basis } = U();
    const LEAF = [0.35, 0.8, 0.25];
    spinner(A, T, { path: 'arc', flight: 0.8, blades: 2, radius: 0.08,
      extra: p => { if (Math.random() < 0.6) A.emit(p, add([0, -0.15, 0], jit(0.2)), 0.9, 0.018, Math.random() < 0.5 ? LEAF : [0.6, 0.9, 0.3], 0.9, { add: false, drag: 2 }); },   // falling leaves
      hit: tg => {
        T.impact(tg, 1.0);
        const [u, v] = basis(tg.n);   // the forest takes root: vines creep out over the ground
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; for (let s = 1; s <= 8; s++) A.after(s * 0.04, () => { A.emit(add(tg.p, add(scale(u, Math.cos(a + s * 0.12) * s * 0.035), add(scale(v, Math.sin(a + s * 0.12) * s * 0.035), scale(tg.n, 0.02)))), [0, 0, 0], 0.9, 0.022, LEAF, 1.0, { drag: 0 }); }); }
      } });
  };
  ARMS_NOTES['Green Axe'] = 'A twin-bladed axe shedding leaves as it spins; on impact, glowing vines creep out over the ground around the cut.';

  ARMS['Nordic Warhammer'] = (A, T) => {
    const { add, scale } = U();
    spinner(A, T, { path: 'arc', flight: 1.0, blades: 2, radius: 0.12, size: 0.06, model: 'shell', scale: 0.035, col: [0.75, 0.82, 0.92],
      hit: tg => {
        T.impact(tg, 1.3);
        A.ring(tg.p, tg.n, 36, 1.4, 0.55, 0.028, [0.75, 0.85, 1], 1.2);   // the ground shakes
        A.after(0.1, () => A.ring(tg.p, tg.n, 28, 0.9, 0.5, 0.024, [0.9, 0.95, 1], 1.0));
        A.flash(add(tg.p, scale(tg.n, 0.08)), 0.2, [0.75, 0.9, 1], 0.3);
      } });
  };
  ARMS_NOTES['Nordic Warhammer'] = 'A huge war hammer hurled end over end - slow, heavy, and it lands with a big crater and a double shockwave.';

  ARMS['Reptiloid Blade'] = (A, T) => {
    const { add, jit } = U();
    shot(A, T, { flight: 0.7, path: 'wiggle', size: 0.05,
      trail: (p, d) => { T.trail(p, d, 0.045); if (Math.random() < 0.5) A.emit(add(p, jit(0.03)), jit(0.1), 0.3, 0.02, [1, 0.25, 0.1], 1.2, { drag: 2 }); },
      hit: tg => { T.impact(tg, 1.0); A.burn(tg, 0.8); } });
  };
  ARMS_NOTES['Reptiloid Blade'] = 'A fiery blade that slithers in on a snaking path; the cut keeps burning after it hits.';

  ARMS['Emberfire Shotgun'] = (A, T) => {
    const { add, scale, jit } = U();
    const s = A.ship(0), tg = A.near(A.aim, 0.05);
    // super-heated scrap pellets in a wide spread - and they scream (rings of sound at the muzzle)
    for (let i = 0; i < 3; i++) A.after(i * 0.05, () => A.ringNow(add(s.nose, scale(s.fwd, 0.05 + i * 0.07)), s.fwd, 0.04 + i * 0.03, 14, [1, 0.6, 0.3], 0.8));
    A.flash(s.nose, 0.14, [1, 0.6, 0.25], 0.15);
    for (let i = 0; i < 9; i++) {
      const t2 = A.near(tg, 0.22);
      A.proj({ from: s.nose, to: t2, flight: 0.22 + Math.random() * 0.08, path: 'line',
        trail: (p, d) => { A.emit(p, jit(0.05), 0.15, 0.018 * T.k, Math.random() < 0.5 ? [1, 0.5, 0.15] : [1, 0.85, 0.4], 1.3, { drag: 2 }); if (i % 3 === 0) T.shineTrail(p, d, 0.025); },
        hit: () => { A.flash(t2.p, 0.06, [1, 0.6, 0.25], 0.12); A.burst(t2.p, 4, 0.4, 0.3, 0.012, [[1, 0.5, 0.15]], t2.n); A.crater(t2, { r: 0.55, quiet: i % 2 === 1 }); } });
    }
    A.after(0.3, () => T.shineImpact(tg, 0.8));
  };
  ARMS_NOTES['Emberfire Shotgun'] = 'A short-range blast of nine glowing scrap pellets; "screaming" sound rings pulse from the muzzle as they leave.';

  // ---------------------------------------------------------------- Epic: already pretty cool
  ARMS['Waxon Staff'] = (A, T) => {
    const { add, scale, basis, norm, cross } = U();
    const s = A.ship(0), tg = A.near(A.aim, 0.08);
    const [u, v] = basis(s.fwd);
    // wax on (clockwise) ... wax off (the other way) - two circles of light at the staff tip
    for (let i = 0; i < 24; i++) A.after(i * 0.012, () => { const a = i / 24 * Math.PI * 2, n = A.ship(0).nose; A.emit(add(n, add(scale(u, Math.cos(a) * 0.09), scale(v, Math.sin(a) * 0.09))), [0, 0, 0], 0.4, 0.02, T.pal.main, 1.3, { drag: 0 }); });
    for (let i = 0; i < 24; i++) A.after(0.3 + i * 0.012, () => { const a = -i / 24 * Math.PI * 2, n = A.ship(0).nose; A.emit(add(n, add(scale(u, Math.cos(a) * 0.13), scale(v, Math.sin(a) * 0.13))), [0, 0, 0], 0.35, 0.02, T.pal.hot, 1.3, { drag: 0 }); });
    let ang = 0;
    A.after(0.6, () => shot(A, T, { tg, flight: 0.8, size: 0.06,
      trail: (p, d) => {   // the orb corkscrews in
        ang += 0.7;
        const sd = norm(cross(d, [0, 1, 0.01])), up = cross(sd, d);
        for (const k of [0, Math.PI]) A.emit(add(p, add(scale(sd, Math.cos(ang + k) * 0.06), scale(up, Math.sin(ang + k) * 0.06))), [0, 0, 0], 0.3, 0.025, k ? T.pal.hot : T.pal.main, 1.2, { drag: 0 });
        T.trail(p, d, 0.05);
      },
      hit: t => { T.impact(t, 1.1); for (let i = 0; i < 20; i++) { A.swirl(t.p, t.n, 0.35, T.pal.main); } } }));
  };
  ARMS_NOTES['Waxon Staff'] = 'Wax on: a circle of light. Wax off: a circle the other way. Then a corkscrewing orb, and the crater swirls as it lands.';

  ARMS['Star Fire Sword'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.08), STAR = [1, 0.95, 0.75];
    A.charge(() => A.ship(0).nose, 0.35, STAR, 0.08);
    A.after(0.35, () => slash(A, T, { tg, flight: 0.5, width: 0.22, density: 9, col: [1, 0.7, 0.25],
      extra: p => A.emit(p, [0, 0, 0], 0.1, 0.09 * T.k, STAR, 0.9, { drag: 0 }),
      hit: t => {
        T.impact(t, 1.15);
        // do not look directly at Star Fire: a blinding glare with a lens cross
        A.flash(t.p, 0.9 * T.k, [1, 0.97, 0.85], 0.35);
        const [u, v] = basis([0.3, 0.8, 4.5]);
        A.line(add(t.p, scale(u, -1.1)), add(t.p, scale(u, 1.1)), 0.25, 0.018, STAR, 1.4);
        A.line(add(t.p, scale(v, -0.5)), add(t.p, scale(v, 0.5)), 0.25, 0.014, STAR, 1.4);
      } }));
  };
  ARMS_NOTES['Star Fire Sword'] = 'A little star ignites on the blade, then a burning blade wave - and the impact flares so bright it throws a lens cross over the whole scene.';

  ARMS['Sandmaster Spear'] = (A, T) => {
    const { add, scale, jit, basis } = U();
    const SAND = [0.85, 0.7, 0.45];
    shot(A, T, { flight: 0.5, model: 'rod', scale: 0.02,
      trail: (p, d) => { T.trail(p, d, 0.04); A.smoke(p, jit(0.05), 0.6, 0.02, SAND, 0.35, 2); },
      hit: tg => {
        T.impact(tg, 1.05);
        // the sands of Neri answer: a whirling sand devil over the impact
        const [u, v] = basis(tg.n);
        for (let i = 0; i < 70; i++) A.after(i * 0.012, () => {
          const a = i * 0.5, h = (i / 70) * 0.55, r = 0.06 + h * 0.4;
          A.emit(add(tg.p, add(scale(tg.n, h), add(scale(u, Math.cos(a) * r), scale(v, Math.sin(a) * r)))), scale(add(scale(u, -Math.sin(a)), scale(v, Math.cos(a))), 0.6), 0.7, 0.035, SAND, 0.6, { add: false, drag: 1 });
        });
      } });
  };
  ARMS_NOTES['Sandmaster Spear'] = 'A spear in a haze of sand; where it lands a whirling sand devil rises over the crater.';

  ARMS['Elite Dagger'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.04), RED = [1, 0.2, 0.2];
    // the Grey special forces way: a target reticle locks on, a cloaked dagger shimmers across,
    // three precise strikes on the exact same spot
    const [u, v] = basis(tg.n);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; A.line(add(tg.p, add(scale(u, Math.cos(a) * 0.08), scale(v, Math.sin(a) * 0.08))), add(tg.p, add(scale(u, Math.cos(a) * 0.18), scale(v, Math.sin(a) * 0.18))), 0.6, 0.01, RED, 1.3); }
    A.ring(tg.p, tg.n, 24, 0.0001, 0.6, 0.01, RED, 1.2);
    A.after(0.15, () => shot(A, T, { tg, flight: 0.35,
      trail: (p, d) => { if (Math.random() < 0.4) A.emit(p, [0, 0, 0], 0.08, 0.04, [0.7, 0.8, 0.9], 0.25, { drag: 0 }); T.shineTrail(p, d, 0.03); },
      hit: t => { for (let i = 0; i < 3; i++) A.after(i * 0.12, () => { A.line(add(t.p, scale(i % 2 ? u : v, -0.15)), add(t.p, scale(i % 2 ? u : v, 0.15)), 0.18, 0.016, [1, 1, 1], 1.6); if (i === 2) T.impact(t, 1.05); else A.crater(t, { r: 0.6, quiet: true }); }); } }));
  };
  ARMS_NOTES['Elite Dagger'] = 'A red reticle locks on, a cloaked dagger shimmers across almost invisibly, and three precise slashes hit the exact same spot.';

  ARMS['Randomizer Bow'] = (A, T) => {
    const { add } = U();
    const tg = A.near(A.aim, 0.04), paths = ['line', 'arc', 'wiggle'];
    // nothing random about the damage: wild colours, wild paths - one single spot
    let left = 5;
    for (let i = 0; i < 5; i++) A.after(i * 0.06, () => {
      const col = [Math.random(), Math.random(), Math.random()].map(x => 0.35 + 0.65 * x);
      A.proj({ from: A.ship(0).nose, fwd: A.ship(0).fwd, up: [Math.random() - 0.5, 1, Math.random() - 0.5], to: tg, flight: 0.5 + Math.random() * 0.3, path: paths[i % 3],
        trail: (p, d) => T.trail(p, d, 0.035, col),
        hit: () => { A.flash(tg.p, 0.1, col, 0.12); if (--left === 0) T.impact(tg, 1.2); } });
    });
  };
  ARMS_NOTES['Randomizer Bow'] = 'Five arrows in random colours on random paths - and every single one lands on exactly the same spot for one big hit.';

  ARMS['Dagger of Creation'] = (A, T) => {
    const { add, scale, jit } = U();
    const LAVA = [1, 0.4, 0.08];
    shot(A, T, { flight: 0.5, size: 0.04,
      trail: (p, d) => { T.trail(p, d, 0.04); if (Math.random() < 0.6) A.emit(p, add([0, -0.4, 0], jit(0.1)), 0.5, 0.018, LAVA, 1.2, { drag: 0.5 }); },   // dripping permalava
      hit: tg => {
        T.impact(tg, 1.05);
        A.burn(tg, 1.2);
        // permalava erupts: glowing droplets fly up and fall back
        for (let i = 0; i < T.n(14); i++) A.after(i * 0.05, () => A.emit(add(tg.p, jit(0.05)), add(scale(tg.n, 0.8 + Math.random() * 0.5), jit(0.35)), 0.9, 0.025, Math.random() < 0.5 ? LAVA : [1, 0.75, 0.25], 1.3, { drag: 1.5 }));
      } });
  };
  ARMS_NOTES['Dagger of Creation'] = 'A dagger dripping permalava; the wound keeps burning and spits glowing lava droplets into the air.';

  ARMS['Toothed Dagger'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.08), TOOTH = [0.95, 0.92, 0.8];
    shot(A, T, { tg, flight: 0.45,
      hit: t => {
        // the reptiloid teeth bite: two rows of fangs snap shut over the target
        const [u, v] = basis(t.n);
        for (let i = -3; i <= 3; i++) for (const side of [-1, 1]) {
          const p0 = add(t.p, add(scale(u, i * 0.04), add(scale(v, side * 0.22), scale(t.n, 0.06))));
          A.emit(p0, scale(v, -side * 1.2), 0.17, 0.02, TOOTH, 1.3, { drag: 6 });
          A.emit(add(p0, scale(v, side * 0.03)), scale(v, -side * 1.2), 0.17, 0.014, TOOTH, 1.0, { drag: 6 });
        }
        A.after(0.15, () => T.impact(t, 1.1));
      } });
  };
  ARMS_NOTES['Toothed Dagger'] = 'The dagger lands and two rows of reptiloid fangs snap shut over the target before it blows.';

  ARMS['Waxon Shield'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.1), s = A.ship(0);
    // the shield forms first: a hexagon of Waxon in front of the ship
    const [u, v] = basis(s.fwd);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, b = (i + 1) / 6 * Math.PI * 2, c = add(s.nose, scale(s.fwd, 0.08));
      A.line(add(c, add(scale(u, Math.cos(a) * 0.12), scale(v, Math.sin(a) * 0.12))), add(c, add(scale(u, Math.cos(b) * 0.12), scale(v, Math.sin(b) * 0.12))), 0.4, 0.016, T.pal.hot, 1.3); }
    A.after(0.3, () => disc(A, T, { tg, flight: 0.6, radius: 0.13, density: 6,
      hit: t => { T.impact(t, 1.1); A.starburst(t.p, t.n, 6, T.pal.hot); } }));
  };
  ARMS_NOTES['Waxon Shield'] = 'A hexagon of Waxon locks into place in front of the ship, then is hurled as a spinning hex disc that shatters into six rays.';

  ARMS['Waxon Mortar'] = (A, T) => {
    const { add, scale, jit, basis } = U();
    const tg = A.near(A.aim, 0.06), s = A.ship(0), TRI = [0.3, 1, 0.85];
    // precision: the target is marked; compressed gas lobs the Trilium shell in a high arc
    A.ring(tg.p, tg.n, 20, 0.0001, 1.1, 0.012, TRI, 1.0);
    for (let i = 0; i < 8; i++) A.smoke(add(s.nose, jit(0.03)), add(scale(s.fwd, 0.4), jit(0.2)), 0.8, 0.03, [0.75, 0.78, 0.8], 0.4, 2);
    A.proj({ from: s.nose, fwd: s.up, up: s.up, to: tg, flight: 1.1, path: 'arc', model: 'shell', scale: 0.024,
      trail: (p, d) => T.trail(p, d, 0.04, TRI),
      hit: () => { T.impact(tg, 1.3, TRI); A.after(0.08, () => A.ring(tg.p, tg.n, 30, 1.2, 0.5, 0.025, [1, 0.8, 0.4], 1.2)); } });
  };
  ARMS_NOTES['Waxon Mortar'] = 'A target ring appears, a puff of compressed gas lobs a glowing Trilium shell high over, and it comes down exactly on the mark.';

  // ---------------------------------------------------------------- Legendary: flashy
  ARMS['Healing Blade'] = (A, T) => {
    const { add, scale, jit, basis } = U();
    const HEAL = [0.5, 1, 0.75], s = A.ship(0), tg = A.near(A.aim, 0.08);
    // first it shields and heals its bearer: a sphere of light and rising motes around the ship
    for (let i = 0; i < 60; i++) { const d = U().norm(jit(1)); A.emit(add(s.pos, scale(d, 0.22)), [0, 0, 0], 0.8, 0.016, HEAL, 1.0, { drag: 0 }); }
    for (let i = 0; i < 16; i++) A.after(i * 0.03, () => A.emit(add(A.ship(0).pos, jit(0.15)), [0, 0.35, 0], 0.8, 0.022, [0.85, 1, 0.9], 1.3, { drag: 0.5, twinkle: true }));
    A.after(0.4, () => slash(A, T, { tg, flight: 0.5, width: 0.24, density: 10,
      hit: t => {
        T.impact(t, 1.1);
        const [u, v] = basis(t.n);   // a radiant cross
        A.line(add(t.p, scale(u, -0.35)), add(t.p, scale(u, 0.35)), 0.4, 0.03, HEAL, 1.5);
        A.line(add(t.p, scale(v, -0.35)), add(t.p, scale(v, 0.35)), 0.4, 0.03, HEAL, 1.5);
        for (let i = 0; i < 10; i++) { const from = add(t.p, scale(t.n, 0.1)); A.after(0.2 + i * 0.03, () => A.proj({ from: add(from, jit(0.1)), to: { p: A.ship(0).pos, n: [0, 1, 0] }, flight: 0.5, path: 'line', trail: p => A.emit(p, [0, 0, 0], 0.15, 0.015, HEAL, 1.2, { drag: 0 }) })); }   // life flows back to the ship
      } }));
  };
  ARMS_NOTES['Healing Blade'] = 'A healing sphere wraps the ship first, then a broad blade wave hits with a radiant cross - and motes of life stream back to the ship.';

  ARMS['Eternal Blade'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.06);
    const [u, v] = basis(tg.n);
    // an infinity sign is drawn over the target ... then the blade strikes, and strikes again, and again
    for (let i = 0; i <= 60; i++) A.after(i * 0.008, () => { const a = i / 60 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; A.emit(add(tg.p, add(scale(tg.n, 0.12), add(scale(u, Math.cos(a) / d * 0.3), scale(v, Math.sin(a) * Math.cos(a) / d * 0.3)))), [0, 0, 0], 0.9, 0.02, T.pal.hot, 1.4, { drag: 0 }); });
    for (let k = 0; k < 3; k++) A.after(0.45 + k * 0.32, () => slash(A, T, { tg, flight: 0.4, width: 0.22 - k * 0.04, density: 9,
      col: k ? [0.78 - k * 0.15, 0.42, 1 - k * 0.15] : undefined,
      hit: t => k === 2 ? T.impact(t, 1.15) : (A.flash(t.p, 0.2, T.pal.hot, 0.2), A.crater(t, { r: 0.8 })) }));
  };
  ARMS_NOTES['Eternal Blade'] = 'An infinity sign is drawn in light over the target, then the blade strikes three times, each echo fainter - for life and beyond.';

  ARMS['Galatic Fireblade'] = (A, T) => {
    const { add, scale, jit } = U();
    const tg = A.near(A.aim, 0.08);
    slash(A, T, { tg, flight: 0.5, width: 0.24, density: 10,
      extra: p => { for (let i = 0; i < 2; i++) A.emit(p, jit(0.3), 0.3, 0.035, Math.random() < 0.5 ? [1, 0.35, 0.05] : [1, 0.8, 0.3], 1.3, { drag: 2 }); },
      hit: t => {
        T.impact(t, 1.15);
        // the Azingoth volcano: a fountain of lava, fireballs arcing out of it
        for (let i = 0; i < 30; i++) A.after(i * 0.02, () => A.emit(add(t.p, jit(0.04)), add(scale(t.n, 1.2 + Math.random() * 0.8), jit(0.15)), 0.6, 0.05, i % 3 ? [1, 0.45, 0.08] : [1, 0.85, 0.4], 1.5, { drag: 2 }));
        for (let i = 0; i < 5; i++) A.after(0.15 + i * 0.07, () => { const t2 = A.near(t, 0.2); A.proj({ from: add(t.p, scale(t.n, 0.15)), fwd: t.n, up: t.n, to: t2, flight: 0.55, path: 'arc', trail: p => { A.emit(p, jit(0.03), 0.3, 0.04, [1, 0.5, 0.1], 1.3, { drag: 2 }); A.smoke(p, jit(0.02), 0.6, 0.02, [0.2, 0.15, 0.12], 0.4); }, hit: () => { A.flash(t2.p, 0.1, [1, 0.5, 0.15], 0.15); A.crater(t2, { r: 0.6 }); } }); });
        A.burn(t, 1.4);
      } });
  };
  ARMS_NOTES['Galatic Fireblade'] = 'A blazing blade wave; where it hits, a volcano erupts - a lava fountain that throws fireballs onto the ground around it.';

  ARMS['Divine Blade'] = (A, T) => {
    const { add, scale } = U();
    const tg = A.near(A.aim, 0.06), DIV = [1, 0.95, 0.8];
    // the cosmic force answers: a pillar of light from above, halos descending along it
    A.beam({ dur: 1.0, from: () => add(tg.p, scale(sky(tg.n), 2.5)), to: () => tg.p, color: [1, 0.9, 0.6], core: [1, 1, 1], width: 0.06, jag: 0.002 });
    for (let i = 0; i < 4; i++) A.after(i * 0.15, () => { for (let k = 0; k < 24; k++) { const [u, v] = U().basis(sky(tg.n)), a = k / 24 * Math.PI * 2; A.emit(add(tg.p, add(scale(sky(tg.n), 1.3), add(scale(u, Math.cos(a) * 0.14), scale(v, Math.sin(a) * 0.14)))), scale(sky(tg.n), -2.2), 0.55, 0.02, DIV, 1.3, { drag: 0 }); } });
    A.after(0.55, () => slash(A, T, { tg, flight: 0.35, width: 0.24, col: DIV, hit: t => { T.impact(t, 1.15, DIV); A.flash(t.p, 0.6, DIV, 0.4); } }));
  };
  ARMS_NOTES['Divine Blade'] = 'A pillar of light falls from above onto the target, golden halos sliding down it - then the blade strikes into the light.';

  ARMS['AI Sword'] = (A, T) => {
    const { add, scale, basis } = U();
    const tg = A.near(A.aim, 0.05), SCAN = [0.3, 1, 0.6], LOCK = [1, 0.25, 0.2];
    // it senses weaknesses: a scan line sweeps the surface, three weak points lock on, three strikes
    const [u, v] = basis(tg.n);
    for (let i = 0; i <= 16; i++) A.after(i * 0.02, () => { const off = (i / 16 - 0.5) * 0.9; A.line(add(tg.p, add(scale(u, off), add(scale(v, -0.45), scale(tg.n, 0.03)))), add(tg.p, add(scale(u, off), add(scale(v, 0.45), scale(tg.n, 0.03)))), 0.1, 0.008, SCAN, 1.0); });
    const pts = [tg, A.near(tg, 0.1), A.near(tg, 0.1)];
    pts.forEach((t, i) => {
      A.after(0.35 + i * 0.08, () => { A.ring(t.p, t.n, 18, 0.0001, 0.9, 0.012, LOCK, 1.3); A.flash(t.p, 0.05, LOCK, 0.6); });
      A.after(0.7 + i * 0.15, () => slash(A, T, { tg: t, flight: 0.3, width: 0.16, density: 7, hit: t2 => i === 2 ? T.impact(t2, 1.1) : T.impact(t2, 0.75) }));
    });
  };
  ARMS_NOTES['AI Sword'] = 'A green scan line sweeps the surface, three red locks appear on the weak points, then three precise blade waves hit them one after another.';

  ARMS['Moonkey Scepter'] = (A, T) => {
    const { add, scale, jit, basis } = U();
    const tg = A.near(A.aim, 0.08), PINK = [1, 0.5, 0.8], BAN = [1, 0.9, 0.3];
    spinner(A, T, { tg, path: 'arc', flight: 0.8, blades: 3, radius: 0.08, col: BAN,
      extra: p => { if (Math.random() < 0.5) A.emit(p, jit(0.2), 0.5, 0.016, Math.random() < 0.5 ? PINK : BAN, 1.4, { drag: 2, twinkle: true }); },
      hit: t => {
        T.impact(t, 1.05);
        // a beating that feels quite good: hearts float up out of the crater
        const [u, v] = basis([0.3, 0.8, 4.5]);
        for (let h = 0; h < 4; h++) A.after(0.1 + h * 0.12, () => {
          const c = add(t.p, add(scale(t.n, 0.12), U().jit(0.15)));
          for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); A.emit(add(c, add(scale(u, x * 0.012), scale(v, y * 0.012))), scale(sky(t.n), 0.3), 1.1, 0.03, PINK, 1.4, { drag: 0.5 }); }
        });
      } });
  };
  ARMS_NOTES['Moonkey Scepter'] = 'A twirling golden scepter in a cloud of pink and yellow sparkles; the bonk sends little hearts floating up. It actually feels quite good.';

  ARMS["Thunders Requiem"] = (A, T) => {
    const { add, scale, jit } = U();
    const tg = A.near(A.aim, 0.06);
    // quad-barrel ultrasonic rounds: the target vaporises first, the sonic boom arrives after
    for (let i = 0; i < 4; i++) A.after(i * 0.07, () => {
      const s = A.ship(0), t2 = i === 0 ? tg : A.near(tg, 0.08);
      A.flash(s.nose, 0.12, [0.8, 0.95, 1], 0.1);
      A.proj({ from: add(s.nose, scale(s.right, (i % 2 ? 1 : -1) * 0.03)), to: t2, flight: 0.2, path: 'line', trail: (p, d) => { A.emit(p, [0, 0, 0], 0.1, 0.03 * T.k, [0.8, 0.95, 1], 1.4, { drag: 0 }); T.shineTrail(p, d, 0.04); },
        hit: () => { A.flash(t2.p, 0.35, [1, 1, 1], 0.12); A.crater(t2, { r: 1.2 }); } });
    });
    A.after(0.6, () => {
      T.impact(tg, 1.2);
      for (let k = 0; k < 3; k++) A.after(k * 0.1, () => A.ring(tg.p, tg.n, 46, 2.4 - k * 0.5, 0.6, 0.03, k % 2 ? [0.7, 0.9, 1] : [1, 1, 1], 1.3));   // the boom
      for (let k = 0; k < 3; k++) A.after(k * 0.06, () => A.ringNow(add(A.ship(0).nose, scale(A.ship(0).fwd, 0.1 + k * 0.1)), A.ship(0).fwd, 0.06 + k * 0.05, 18, [0.8, 0.95, 1], 0.9));   // recoil
    });
  };
  ARMS_NOTES['Thunders Requiem'] = 'Four ultrasonic rounds in a burst vaporise the target in white flashes - and only then does the sonic boom roll out in huge rings.';

  // ---------------------------------------------------------------- Mythical: "wow, did you just see that?"
  ARMS['Waxon Fire Sword'] = (A, T) => {
    const { add, sub, scale, jit, basis, norm, cross, lerp } = U();
    const tg = A.near(A.aim, 0.04), FIRE = [1, 0.4, 0.06], HOT = [1, 0.85, 0.45], WX = [1, 0.4, 0.9], LAVA = [1, 0.32, 0.04];
    const up = sky(tg.n), down = scale(up, -1), side = norm(cross(up, [0.3, 0.8, 4.5]));
    // a colossal burning sword: tip at p, blade going back up along -a
    const sword = (p, a, glow = 1) => {
      const L = 0.85;
      for (let s = 0; s <= L + 1e-6; s += 0.026) {
        const f = s / L, w = 0.02 + 0.1 * Math.min(1, f * 3);
        const c = sub(p, scale(a, s));
        for (let x = -w; x <= w + 1e-6; x += 0.024) {
          const edge = Math.abs(x) > w - 0.025;
          A.emit(add(c, scale(side, x)), [0, 0, 0], 0.035, 0.04, edge || f < 0.12 ? HOT : FIRE, (edge ? 1.5 : 1.0) * glow, { drag: 0 });
        }
        if (Math.random() < 0.2) A.emit(add(c, scale(side, (Math.random() - 0.5) * 2 * w)), add(scale(a, -0.35), jit(0.15)), 0.35, 0.03, Math.random() < 0.5 ? HOT : FIRE, 1.3, { drag: 2 });   // flames licking upward
      }
      const g = sub(p, scale(a, L + 0.04));   // Waxon guard, grip and a blazing pommel gem
      for (let x = -0.28; x <= 0.28; x += 0.02) A.emit(add(sub(g, scale(a, Math.abs(x) * 0.25)), scale(side, x)), [0, 0, 0], 0.035, 0.05, WX, 1.3 * glow, { drag: 0 });
      for (let s = 0.06; s <= 0.32; s += 0.024) A.emit(sub(g, scale(a, s)), [0, 0, 0], 0.035, 0.04, [0.55, 0.2, 0.5], glow, { drag: 0 });
      A.emit(sub(g, scale(a, 0.36)), [0, 0, 0], 0.035, 0.1, WX, 1.6 * glow, { drag: 0 });
    };
    const top = add(tg.p, scale(up, 1.15));
    // 1. a burning Waxon portal tears open high above the target
    for (let k = 0; k < 40; k++) A.after(k * 0.025, () => {
      const r = 0.12 + Math.min(1, k / 14) * 0.26;
      bigRing(A, top, up, r, 44, k % 2 ? WX : FIRE, 0.05, 1.5);
      bigRing(A, top, up, r * 0.78, 34, HOT, 0.035, 1.1);
      if (k % 3 === 0) A.emit(add(top, jit(r)), jit(0.3), 0.4, 0.03, WX, 1.3, { drag: 2 });
    });
    // 2. the sword slides out of the portal point first ... and drops
    A.after(0.45, () => A.proj({ from: top, fwd: down, to: tg, flight: 0.75, path: 'line', keep: 1.6,
      trail: (p, d) => sword(p, d),
      // 3. stuck in the planet, it keeps burning while the ground cracks open
      dig: v => {
        const depth = 0.4 * (1 - (1 - Math.min(1, v * 8)) ** 3);
        sword(add(tg.p, scale(down, depth)), down, 1 + 1.2 * Math.max(0, v - 0.8) / 0.2);
        if (Math.random() < 0.6) { const [u, w] = basis(tg.n), a = Math.random() * Math.PI * 2;
          A.emit(add(tg.p, add(scale(u, Math.cos(a) * 0.06), scale(w, Math.sin(a) * 0.06))), add(scale(up, 0.5 + Math.random() * 0.6), add(scale(u, Math.cos(a) * 0.3), scale(w, Math.sin(a) * 0.3))), 0.5, 0.025, Math.random() < 0.5 ? LAVA : HOT, 1.3, { drag: 2.5 }); }
      },
      // 4. white-hot, the sword bursts and the planet erupts
      hit: () => {
        T.impact(tg, 1.4, FIRE);
        A.crater(tg, { r: 2.2, shape: 'shaft', depth: 10 });
        for (let i = 0; i < 40; i++) A.emit(add(tg.p, jit(0.05)), add(scale(up, 1.2 + Math.random() * 1.2), jit(0.4)), 0.8, 0.05, i % 3 ? FIRE : HOT, 1.5, { drag: 2 });
      } }));
    A.after(1.2, () => {
      const [u, w] = basis(tg.n);
      A.crater(tg, { r: 1.4, shape: 'shaft', depth: 7 });
      A.flash(tg.p, 0.5, HOT, 0.3);
      A.ring(tg.p, tg.n, 46, 1.4, 0.5, 0.03, LAVA, 1.4);
      // lava splashes out of the wound
      for (let i = 0; i < T.n(50); i++) {
        const a = Math.random() * Math.PI * 2, out = add(scale(u, Math.cos(a)), scale(w, Math.sin(a)));
        A.emit(add(tg.p, scale(out, 0.05)), add(scale(up, 0.6 + Math.random() * 1.0), scale(out, 0.5 + Math.random() * 0.9)), 0.6 + Math.random() * 0.5, 0.02 + Math.random() * 0.025, Math.random() < 0.6 ? LAVA : HOT, 1.5, { drag: 2.2 });
      }
      // the ground splits: glowing lava fissures race out across the surface, geysers at their ends
      for (let c = 0; c < 6; c++) {
        let ang = c / 6 * Math.PI * 2 + Math.random() * 0.5, prev = tg;
        for (let k = 1; k <= 9; k++) A.after(k * 0.05, () => {
          ang += (Math.random() - 0.5) * 0.7;
          const dd = norm(add(tg.dir, scale(add(scale(u, Math.cos(ang)), scale(w, Math.sin(ang))), k * 0.04))), t2 = A.surfaceAlong({ dir: dd }, { dir: dd }, 0);
          A.line(add(prev.p, scale(prev.n, 0.015)), add(t2.p, scale(t2.n, 0.015)), 1.6, 0.022, k < 4 ? HOT : LAVA, 1.4);
          if (k % 3 === 0) A.crater(t2, { r: 0.6, quiet: true });
          if (k === 9) { A.flash(t2.p, 0.12, LAVA, 0.3); for (let i = 0; i < 12; i++) A.after(i * 0.03, () => A.emit(add(t2.p, jit(0.02)), add(scale(sky(t2.n), 0.9 + Math.random() * 0.5), jit(0.15)), 0.6, 0.03, i % 2 ? LAVA : HOT, 1.4, { drag: 2 })); }
          prev = t2;
        });
      }
      A.burn(tg, 2.4);
    });
  };
  ARMS_NOTES['Waxon Fire Sword'] = 'A burning Waxon portal tears open high above the target and a colossal flaming sword slides out of it, point first. It plunges into the planet, lava splashes out, and glowing fissures race across the ground with lava geysers at their ends. The sword keeps burning, turns white-hot and bursts in a final eruption.';

  ARMS['Sungorger'] = (A, T) => {
    const { add, sub, scale, jit, norm, lerp, basis, len } = U();
    const tg = A.near(A.aim, 0.04), SUN = [1, 0.72, 0.25], CORE = [1, 0.97, 0.85], GEM = [0.78, 0.42, 1], PINK = [1, 0.5, 0.9];
    const s0 = A.ship(0);
    // 1. a star is born next to the ship, burning with flares
    const sunAt = add(s0.nose, add(scale(s0.fwd, 0.35), scale(s0.up, 0.5)));
    const star = (p, r, glow = 1) => {
      A.emit(p, [0, 0, 0], 0.05, r * 5, SUN, 0.8 * glow, { drag: 0 });
      A.emit(p, [0, 0, 0], 0.05, r * 3, SUN, 1.2 * glow, { drag: 0 });
      A.emit(p, [0, 0, 0], 0.05, r * 1.6, CORE, 1.6 * glow, { drag: 0 });
      for (let i = 0; i < 6; i++) { const dir = norm(jit(1)); A.emit(add(p, scale(dir, r * 1.4)), scale(dir, r * 6), 0.25, r * 0.6, Math.random() < 0.3 ? PINK : SUN, 1.4, { drag: 3 }); }   // corona flares
    };
    for (let k = 0; k < 30; k++) A.after(k * 0.025, () => star(sunAt, 0.02 + k * 0.0025));
    // 2. the ship gorges on it: the star is pulled into the hull in streams, and the ship glows
    for (let k = 0; k < 20; k++) A.after(0.75 + k * 0.025, () => {
      const u = k / 20, n = A.ship(0).nose, p = lerp(sunAt, n, u * u);
      star(p, 0.095 * (1 - u * 0.8));
      for (let i = 0; i < 4; i++) { const off = add(p, jit(0.08)); A.emit(off, scale(sub(n, off), 4), 0.2, 0.02, i % 2 ? SUN : GEM, 1.4, { drag: 0 }); }
    });
    for (let k = 0; k < 6; k++) A.after(1.25 + k * 0.06, () => { const s = A.ship(0); bigRing(A, s.pos, s.fwd, 0.14 + k * 0.04, 30, k % 2 ? GEM : SUN, 0.03, 1.4); A.flash(s.pos, 0.2, GEM, 0.12); });
    // 3. it releases the star, amplified three times by gem lenses on the way
    const from = s0.nose, to = tg.p, lens = [0.22, 0.45, 0.68].map(u => lerp(from, to, u)), dir = norm(sub(to, from));
    for (let k = 0; k < 40; k++) A.after(1.4 + k * 0.03, () => lens.forEach((c, i) => { bigRing(A, c, dir, 0.14 + i * 0.07, 34 + i * 8, k % 2 ? GEM : PINK, 0.05, 1.8); bigRing(A, c, dir, 0.1 + i * 0.06, 24 + i * 8, [1, 0.85, 1], 0.015, 1.0); }));
    let passed = 0;
    A.after(1.65, () => A.proj({ from, to: tg, flight: 0.9, path: 'line',
      trail: (p, d) => {
        const u = len(sub(p, from)) / len(sub(to, from));
        while (passed < 3 && u >= [0.22, 0.45, 0.68][passed]) { const c = lens[passed++]; A.flash(c, 0.25 + passed * 0.08, GEM, 0.2); A.ring(c, d, 30, 0.9, 0.35, 0.02, PINK, 1.4); }
        star(p, 0.035 * (1 + passed * 0.6));
        T.shineTrail(p, d, 0.06);
      },
      hit: () => {
        // 4. the star sinks into the planet: light bursts out of the ground all around ...
        A.crater(tg, { r: 2.4 });
        A.flash(tg.p, 0.6, CORE, 0.3);
        for (let i = 0; i < 12; i++) A.after(0.06 + i * 0.045, () => { const t2 = A.near(tg, 0.3); A.flash(t2.p, 0.12, i % 2 ? SUN : GEM, 0.3); A.emit(t2.p, scale(sky(t2.n), 0.8), 0.4, 0.04, CORE, 1.5, { drag: 2 }); if (i % 3 === 0) A.crater(t2, { r: 0.9, quiet: true }); });
        // ... and then goes supernova
        A.after(0.7, () => {
          A.implode(tg.p, 0.5, 0.2, GEM);
          A.after(0.2, () => {
            T.impact(tg, 1.5, SUN);
            A.flash(tg.p, 1.6, CORE, 0.5);
            A.ring(tg.p, tg.n, 60, 3.2, 0.8, 0.04, SUN, 1.5);
            A.after(0.1, () => A.ring(tg.p, tg.n, 50, 2.2, 0.9, 0.035, GEM, 1.5));
            A.starburst(tg.p, tg.n, 16, GEM);
          });
        });
      } }));
  };
  ARMS_NOTES['Sungorger'] = 'A star ignites next to the ship and the ship devours it, pulling it in until the hull glows. Then it fires the star out through three gem lenses, each one making it bigger. The star sinks into the planet, light bursts out of the ground all around, and it goes supernova.';

  ARMS['Leveller Bow'] = (A, T) => {
    const { add, scale, jit, norm, basis } = U();
    const tg = A.near(A.aim, 0.04), s = A.ship(0), GEM = [0.8, 0.45, 1], LIGHT = [0.9, 0.85, 1];
    // a protective shield closes around the bearer (a sphere of hexagon points) ...
    for (let i = 0; i < 160; i++) { const d = norm(jit(1)); A.after(Math.random() * 0.2, () => A.emit(add(A.ship(0).pos, scale(d, 0.26)), [0, 0, 0], 1.6, 0.014, i % 3 ? GEM : LIGHT, 1.1, { drag: 0 })); }
    // ... one giant arrow of light rises, splits high above and levels the whole area in a rain
    A.after(0.35, () => A.proj({ from: A.ship(0).nose, fwd: s.up, up: s.up, to: { p: add(tg.p, scale(sky(tg.n), 1.0)), n: sky(tg.n), dir: tg.dir }, flight: 0.5, path: 'arc', model: 'rod', scale: 0.03,
      trail: (p, d) => { T.trail(p, d, 0.07, GEM); A.emit(p, [0, 0, 0], 0.3, 0.06, LIGHT, 1.2, { drag: 0 }); },
      hit: () => {
        const top = add(tg.p, scale(sky(tg.n), 1.0));
        A.flash(top, 0.6, LIGHT, 0.35); A.ringNow(top, sky(tg.n), 0.2, 30, GEM, 1.4);
        const [u, v] = basis(tg.n);
        const hits = [];
        for (let k = 0; k < 24; k++) A.after(0.75 + k * 0.045, () => {
          if (hits.length < 2) return;
          const i = (Math.random() * (hits.length - 1)) | 0, a = hits[i], b = hits[i + 1];
          const lift = x => add(x.p, scale(x.n, 0.025));
          A.bolt(lift(a), lift(b), 0.1, k % 3 ? [0.85, 0.75, 1] : [1, 1, 1], 0.012);
          if (k % 4 === 0) A.flash(lift(b), 0.06, GEM, 0.1);
        });
        for (let i = 0; i < 18; i++) A.after(0.05 + i * 0.035, () => {
          const off = (i / 17 - 0.5) * 0.7, d2 = norm(add(tg.dir, add(scale(u, off), scale(v, (Math.random() - 0.5) * 0.12)))), t2 = A.surfaceAlong({ dir: d2 }, { dir: d2 }, 0);
          const from = add(top, jit(0.15));
          for (let s = 0.05; s < 0.92; s += 0.05) if (Math.hypot(...add(from, scale(U().sub(t2.p, from), s))) < 0.99) return;   // that spot is out of reach: no arrow through the planet
          A.proj({ from, to: t2, flight: 0.25, path: 'line', trail: (p, d) => { A.emit(p, [0, 0, 0], 0.12, 0.03, i % 2 ? GEM : LIGHT, 1.3, { drag: 0 }); T.shineTrail(p, d, 0.03); },
            hit: () => { hits.push(t2); A.flash(t2.p, 0.14, GEM, 0.15); A.crater(t2, { r: 0.75, quiet: i % 2 === 1 }); if (i === 9) T.impact(tg, 1.4); } });
        });
      } }));
  };
  ARMS_NOTES['Leveller Bow'] = 'A shield of light closes around the ship, one giant arrow climbs and bursts high above the target, and a rain of arrows levels a whole strip of ground. Electric arcs keep jumping between the craters along the strip after the rain.';

  // ---------------------------------------------------------------- single shots
  // The game fires an attack as a quick burst; each shot of it is one projectile in the style of
  // the weapon's type (the full animations above are for showcases). shotOf(name)(A, T) fires one.
  const SHOT_KIND = name =>
    /revolver|shotgun|dartgun|widow|requiem|confuser/i.test(name) ? 'gun' :
    /bow|arbalest/i.test(name) ? 'bow' :
    /spear/i.test(name) ? 'spear' :
    /axe|hammer|cudgel/i.test(name) ? 'throw' :
    /shield/i.test(name) ? 'disc' :
    /staff|scepter|stave|sungorger/i.test(name) ? 'orb' :
    /mortar/i.test(name) ? 'shell' : 'blade';
  const SHOTS = {
    blade: (A, T) => slash(A, T, { flight: 0.32, width: 0.07, density: 4, size: 0.022, hit: tg => T.spark(tg) }),
    gun: (A, T) => shot(A, T, { flight: 0.16, size: 0.02, hit: tg => T.spark(tg),
      trail: (p, d) => { A.emit(p, [0, 0, 0], 0.05, 0.018 * T.k, T.pal.hot, 1.4, { drag: 0 }); A.emit(p, U().scale(d, -0.2), 0.08, 0.012 * T.k, T.pal.main, 1.0, { drag: 0 }); T.shineTrail(p, d, 0.02); } }),
    bow: (A, T) => shot(A, T, { flight: 0.28, model: 'rod', scale: 0.009, hit: tg => T.spark(tg), trail: (p, d) => T.trail(p, d, 0.02) }),
    spear: (A, T) => shot(A, T, { flight: 0.3, model: 'rod', scale: 0.012, hit: tg => T.spark(tg), trail: (p, d) => T.trail(p, d, 0.025) }),
    throw: (A, T) => spinner(A, T, { flight: 0.36, blades: 1, radius: 0.04, size: 0.025, hit: tg => T.spark(tg) }),
    disc: (A, T) => disc(A, T, { flight: 0.32, radius: 0.05, density: 8, hit: tg => T.spark(tg) }),
    orb: (A, T) => shot(A, T, { flight: 0.34, hit: tg => T.spark(tg),
      trail: (p, d) => { A.emit(p, [0, 0, 0], 0.08, 0.04 * T.k, T.pal.main, 1.1, { drag: 0 }); A.emit(p, [0, 0, 0], 0.05, 0.02 * T.k, T.pal.hot, 1.3, { drag: 0 }); T.shineTrail(p, d, 0.025); } }),
    shell: (A, T) => shot(A, T, { path: 'arc', flight: 0.55, model: 'shell', scale: 0.012, hit: tg => T.spark(tg), trail: (p, d) => T.trail(p, d, 0.025) }),
  };
  const shotOf = name => SHOTS[SHOT_KIND(name)];

  return { RARITIES, SHINES, ELEMENT, rarityLevel, shineLevel, CREW, CREW_NOTES, buildShip, shotOf, SHOT_KIND,
    ARMS, ARMS_NOTES, makeTier, CLASS_PAL, EXHAUST, builder, applyShine, h3, mixHex };
})();
