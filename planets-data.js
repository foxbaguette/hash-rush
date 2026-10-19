'use strict';
/*
  The planets, shared by the game (index.html) and the style sheet (planets.html).

  Each planet:
    shape(dir)  surface radius as a fraction of R (<= 1) for a unit direction
    sea         optional sea level (fraction); cells above the ground and below it are water
    ring(...)   optional blocks outside the sphere (Halo)
    hollow      [fmin, fmax]: radius band where block() can return null (caves, cavities)
    block(c)    -> [rgb 0..255, glow 0..1, material] or null for an empty cell
    surface / inside   swatches for the cards and the HUD legend

  Materials drive the lightweight shader effects: lava, crystal, water, ice, metal, energy.
  Everything is a pure function of position, so a planet always builds the same way.
*/
const PlanetKit = (() => {
  // ---------------------------------------------------------------- noise
  function h3(x, y, z, s) {
    let h = Math.imul(x | 0, 0x8da6b343) ^ Math.imul(y | 0, 0xd8163841) ^ Math.imul(z | 0, 0xcb1ab31f) ^ Math.imul(s | 0, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
  }
  function vn(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const L = (a, b, t) => a + (b - a) * t;
    return L(L(L(h3(xi, yi, zi, s), h3(xi + 1, yi, zi, s), u), L(h3(xi, yi + 1, zi, s), h3(xi + 1, yi + 1, zi, s), u), v),
             L(L(h3(xi, yi, zi + 1, s), h3(xi + 1, yi, zi + 1, s), u), L(h3(xi, yi + 1, zi + 1, s), h3(xi + 1, yi + 1, zi + 1, s), u), v), w);
  }
  function fbm(x, y, z, s, oct = 4) {
    let t = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { t += a * vn(x * f, y * f, z * f, s + i * 17); n += a; f *= 2; a *= 0.5; }
    return t / n;
  }
  const dn = (d, k, s, o) => fbm(d[0] * k + 11, d[1] * k + 23, d[2] * k + 37, s, o);   // noise over directions
  const ridge = (d, k, s) => 1 - Math.abs(dn(d, k, s, 4) * 2 - 1);

  // ---------------------------------------------------------------- colour helpers
  const cache = new Map();
  const C = hex => {
    let c = cache.get(hex);
    if (!c) { c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; cache.set(hex, c); }
    return c;
  };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const vary = (c, j, amt = 0.12) => [c[0] * (1 - amt / 2 + amt * j), c[1] * (1 - amt / 2 + amt * j), c[2] * (1 - amt / 2 + amt * j)];
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // longitude and latitude of a direction, and a hex grid over them (0 on a cell wall)
  const lon = d => Math.atan2(d[2], d[0]), lat = d => Math.asin(Math.max(-1, Math.min(1, d[1])));
  function hexWall(d, k) {
    const u = lon(d) * k * Math.cos(lat(d)), v = lat(d) * k;
    const q = (Math.sqrt(3) / 3 * u - v / 3), r = 2 / 3 * v;
    let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r);
    const dx = Math.abs(rx - q), dy = Math.abs(ry + q + r), dz = Math.abs(rz - r);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
    const fx = q - rx, fz = r - rz, fy = -fx - fz;
    return 0.5 - Math.max(Math.abs(fx), Math.abs(fy), Math.abs(fz));
  }
  // pick an interior layer by radius fraction (boundaries wobble a little)
  function layer(c, list) {
    const f = c.f + (c.wob - 0.5) * 0.06;
    let L = list[list.length - 1];
    for (const l of list) if (f >= l.f) { L = l; break; }
    return [vary(C(L.col), c.j, L.v ?? 0.14), L.e || 0, L.m];
  }

  // ---------------------------------------------------------------- the planets
  const PLANETS = [
    // ============ Alien Worlds ============
    {
      name: 'Eyeke', aw: true, tagline: 'Second Earth',
      blurb: 'Also called Terra Alterna: the Alien Worlds planet nearest to Earth. Green continents and sandy deserts in blue oceans. A monastic order of Greys treats it as a spiritual place.',
      surface: [['Ocean', '#1f5fa8'], ['Grassland', '#5a9a3f'], ['Desert', '#d9b36b'], ['Monastery', '#e9e4d6']],
      inside: [['Topsoil', '#6b4a2b'], ['Bedrock', '#7d7d82'], ['Mantle', '#b4461c', 1], ['Iron core', '#ffb24a', 1]],
      sea: 0.93,
      shape: d => { const n = dn(d, 1.6, 101); return n > 0.5 ? 0.94 + (n - 0.5) * 0.25 : 0.86 + n * 0.1; },
      block(c) {
        if (c.water) return [mixc(C('#2f86c9'), C('#163f80'), sstep(0.5, 3, c.d24)), 0.04, 'water'];
        if (c.depth < 1.5) {
          if (c.s > 1.0 && dn(c.dir, 6, 109) > 0.72) return [vary(C('#e9e4d6'), c.j), 0];
          return [vary(dn(c.dir, 2.4, 107) > 0.56 ? C('#d9b36b') : mixc(C('#4f8f3a'), C('#6aa84f'), c.j), c.j), 0];
        }
        if (c.d24 < 3) return [vary(C('#6b4a2b'), c.j), 0];
        return layer(c, [{ f: 0.62, col: '#7d7d82' }, { f: 0.3, col: '#b4461c', e: 0.35, m: 'lava' }, { f: 0, col: '#ffb24a', e: 0.9, v: 0.05, m: 'lava' }]);
      },
    },
    {
      name: 'Kavian', aw: true, tagline: 'Rock and ice',
      blurb: 'Mostly rocky and icy, but with a few strangely lush patches that legend says ancient aliens terraformed. Small Reptiloid villages hide among the rocks.',
      surface: [['Rust rock', '#8a4a28'], ['Polar ice', '#e8f2ff'], ['Terraformed oasis', '#3f8a3a'], ['Reptiloid village', '#c9b48a']],
      inside: [['Permafrost', '#8fa6b8'], ['Frozen rock', '#4a4f5a'], ['Cold mantle', '#2c5560', 1], ['Cryo core', '#9ff0ff', 1]],
      shape: d => 0.95 + dn(d, 3, 201) * 0.07,
      block(c) {
        if (c.depth < 1.5) {
          const ice = Math.abs(c.lat) + (dn(c.dir, 4, 203) - 0.5) * 0.35;
          if (ice > 0.78) return [vary(C('#e8f2ff'), c.j, 0.06), 0.03, 'ice'];
          if (dn(c.dir, 3.2, 205) > 0.68) return [vary(C('#3f8a3a'), c.j), 0];
          if (dn(c.dir, 9, 207) > 0.78) return [vary(C('#c9b48a'), c.j), 0];
          return [vary(mixc(C('#5a2e1a'), C('#9c5a32'), dn(c.dir, 7, 209)), c.j), 0];
        }
        if (c.d24 < 3.5) return [vary(C('#8fa6b8'), c.j), 0, 'ice'];
        return layer(c, [{ f: 0.6, col: '#4a4f5a' }, { f: 0.28, col: '#2c5560', e: 0.15 }, { f: 0, col: '#9ff0ff', e: 0.8, v: 0.05, m: 'crystal' }]);
      },
    },
    {
      name: 'Magor', aw: true, tagline: 'Hostile and volcanic',
      blurb: 'The most hostile planet in the federation: volcanic, smoke-choked and steeply mountainous, with no permanent settlements. Its one sandy region is an anomaly, rumoured to hide ancient secrets. Here, attacks on the sand dig up ruins.',
      surface: [['Basalt peaks', '#3d3430'], ['Ash', '#6b625c'], ['Lava valleys', '#ff5a1f'], ['Anomalous sand', '#d98a3a']],
      inside: [['Basalt', '#2b2522'], ['Buried ruins', '#e8c35a', 1], ['Magma', '#a8320f', 1], ['Molten core', '#ffd27a', 1]],
      shape(d) { const n = dn(d, 2.4, 301); return 0.86 + sstep(0.3, 0.72, n) * 0.11 + ridge(d, 6, 303) * 0.03; },
      block(c) {
        const sandy = c.dir[0] * 0.6 + c.dir[1] * 0.55 + c.dir[2] * 0.58 > 0.82;
        if (c.depth < 1.5) {
          if (sandy) return [vary(C('#d98a3a'), c.j), 0];
          if (c.s < 0.895) return [vary(C('#ff5a1f'), c.j, 0.1), 0.85, 'lava'];
          return [vary(c.s > 0.975 ? C('#6b625c') : mixc(C('#2b2522'), C('#3d3430'), c.j), c.j), 0];
        }
        if (sandy && c.d24 < 6 && c.h > 0.55) return [vary(C('#e8c35a'), c.j), 0.45, 'metal'];   // ruins under the sand
        if (c.d24 < 4) return [vary(sandy ? C('#b8742f') : C('#2b2522'), c.j), 0];
        return layer(c, [{ f: 0.62, col: '#3a1d14' }, { f: 0.3, col: '#a8320f', e: 0.55, m: 'lava' }, { f: 0, col: '#ffd27a', e: 1, v: 0.04, m: 'lava' }]);
      },
    },
    {
      name: 'Naron', aw: true, tagline: 'Striped world',
      blurb: 'Bands of terrain run pole to pole: ice caps, mountains, rocky grassland with two huge lakes, then sandy desert at the equator. An island in Lake Nyari is sacred to many races and has been fought over.',
      surface: [['Ice cap', '#eef4fb'], ['Mountains', '#6e6458'], ['Grassland', '#5f8f3f'], ['Lake Nyari', '#2a6fb5'], ['Sacred island', '#f1e3a6'], ['Equator sand', '#d7b46e']],
      inside: [['Banded strata', '#7c4a3a'], ['Violet strata', '#5a3a52'], ['Deep rock', '#3a3340'], ['Gold core', '#f0d68a', 1]],
      sea: 0.92,
      shape(d) {
        const a = Math.abs(d[1]), lon = Math.atan2(d[2], d[0]);
        if (a > 0.3 && a < 0.58 && Math.abs(Math.sin(lon - 0.5)) < 0.32) {
          const isl = d[1] > 0 && Math.abs(lon - 0.5) < 0.1 && Math.abs(a - 0.44) < 0.05;
          return isl ? 0.95 : 0.88;
        }
        return a > 0.6 && a < 0.82 ? 0.95 + ridge(d, 3, 401) * 0.05 : 0.94 + dn(d, 4, 403) * 0.02;
      },
      block(c) {
        if (c.water) return [mixc(C('#2a6fb5'), C('#173f78'), sstep(0.5, 3, c.d24)), 0.04, 'water'];
        const a = Math.abs(c.lat) + (dn(c.dir, 5, 405) - 0.5) * 0.06;
        if (c.depth < 1.5) {
          if (a > 0.82) return [vary(C('#eef4fb'), c.j, 0.05), 0.03, 'ice'];
          if (a > 0.6) return [vary(C('#6e6458'), c.j), 0];
          if (a > 0.3) return [vary(c.s > 0.94 && c.s < 0.96 && a < 0.5 ? C('#f1e3a6') : mixc(C('#5f8f3f'), C('#7a6a4f'), dn(c.dir, 8, 407)), c.j), 0];
          return [vary(C('#d7b46e'), c.j), 0];
        }
        if (c.f < 0.2) return [vary(C('#f0d68a'), c.j, 0.05), 0.6, 'energy'];
        if (c.f < 0.45) return [vary(C('#3a3340'), c.j), 0];
        return [vary(Math.floor(a * 9) % 2 ? C('#7c4a3a') : C('#5a3a52'), c.j), 0];   // the inside keeps the stripes
      },
    },
    {
      name: 'Neri', aw: true, tagline: 'Forests and methane',
      blurb: 'A striped planet with the largest forests and sandy areas, and huge methane swamps. Little green people live in the forests so quietly that most visitors never notice them.',
      surface: [['Forest', '#2f6b2a'], ['Sand belt', '#d8b26a'], ['Methane swamp', '#6d8a3a'], ['Rocky poles', '#8d8a80']],
      inside: [['Peat and roots', '#4a3424'], ['Clay', '#6d6a4f'], ['Methane pockets', '#8cff6a', 1], ['Green-gold core', '#c8e06a', 1]],
      shape: d => 0.95 + dn(d, 5, 501) * 0.04,
      block(c) {
        const a = Math.abs(c.lat) + (dn(c.dir, 4, 503) - 0.5) * 0.08;
        if (c.depth < 1.5) {
          if (a > 0.85) return [vary(C('#e6e9ee'), c.j, 0.06), 0, 'ice'];
          if (a > 0.7) return [vary(C('#8d8a80'), c.j), 0];
          if (a < 0.22) return [vary(C('#d8b26a'), c.j), 0];
          if (a > 0.5 && dn(c.dir, 6, 505) > 0.55) return [vary(C('#6d8a3a'), c.j), 0.12, 'energy'];
          return [vary(mixc(C('#2f6b2a'), C('#3d8a34'), c.j), c.j), 0];
        }
        if (c.d24 < 3.5) return [vary(C('#4a3424'), c.j), 0];
        if (c.f > 0.3 && c.n3 > 0.66) return [vary(C('#8cff6a'), c.j, 0.1), 0.55, 'energy'];
        return layer(c, [{ f: 0.3, col: '#6d6a4f' }, { f: 0, col: '#c8e06a', e: 0.6, v: 0.06, m: 'energy' }]);
      },
    },
    {
      name: 'Veles', aw: true, tagline: 'Ocean world',
      blurb: 'Almost as watery as Earth, with some of the most beautiful landscapes in the federation. Its islands carry unusual exoflora, and Nordic aliens have made it their home.',
      surface: [['Ocean', '#1e66b0'], ['Island green', '#4e9a3e'], ['Exoflora', '#e8822e'], ['Polar ice', '#e7f0fa']],
      inside: [['Deep water', '#0b2550', 1], ['Seabed sand', '#c9b27a'], ['Pressure ice', '#9fd8ff', 1], ['Rock core', '#8c6a4a'], ['Hot heart', '#ffcf6a', 1]],
      sea: 0.97,
      shape: d => { const n = dn(d, 2.2, 601); return n > 0.6 ? 0.97 + (n - 0.6) * 0.15 : 0.82 + n * 0.1; },
      block(c) {
        if (c.water) {
          if (Math.abs(c.lat) > 0.88 && c.d24 < 1.5) return [vary(C('#e7f0fa'), c.j, 0.05), 0.02, 'ice'];
          return [mixc(C('#1e66b0'), C('#0b2550'), sstep(0.5, 4, c.d24)), 0.06, 'water'];
        }
        if (c.depth < 1.5) return [vary(dn(c.dir, 7, 603) > 0.6 ? C('#e8822e') : C('#4e9a3e'), c.j), 0];
        if (c.d24 < 3) return [vary(C('#c9b27a'), c.j), 0];
        return layer(c, [{ f: 0.45, col: '#9fd8ff', e: 0.12, m: 'crystal' }, { f: 0.15, col: '#8c6a4a' }, { f: 0, col: '#ffcf6a', e: 0.85, v: 0.05, m: 'lava' }]);
      },
    },

    // ============ new ideas ============
    {
      name: 'Cinder', tagline: 'Embers and magma',
      blurb: 'Black volcanic glass dotted with still-glowing embers instead of moving rivers. Under the crust, layer after layer of hotter stone.',
      surface: [['Obsidian', '#1b1719'], ['Embers', '#ff6a1f']],
      inside: [['Cooling crust', '#3a2a26'], ['Hot stone', '#8a2a10', 1], ['Magma', '#e0551a', 1], ['White core', '#fff0d0', 1]],
      shape: d => 0.96 + dn(d, 4, 701) * 0.04,
      block(c) {
        if (c.depth < 1.5) return c.h > 0.93 ? [vary(C('#ff6a1f'), c.j), 0.9, 'lava'] : [vary(C('#1b1719'), c.j, 0.3), 0, 'metal'];
        return layer(c, [{ f: 0.78, col: '#3a2a26' }, { f: 0.5, col: '#8a2a10', e: 0.35, m: 'lava' }, { f: 0.22, col: '#e0551a', e: 0.75, m: 'lava' }, { f: 0, col: '#fff0d0', e: 1, v: 0.03, m: 'lava' }]);
      },
    },
    {
      name: 'Geode', tagline: 'Plain rock, jewel inside', hollow: [0, 0.56],
      blurb: 'A dull grey stone from outside. Crack it and it is lined with amethyst, and the middle is a hollow cave of glittering crystal.',
      surface: [['Limestone', '#8a857c'], ['Lichen', '#7f8a6a']],
      inside: [['Chalcedony band', '#d8d4e8'], ['Amethyst', '#7b4bb5', 1], ['Crystal points', '#d9b8ff', 1], ['Hollow cavity', '#000000']],
      shape: d => 0.93 + dn(d, 3, 801) * 0.07,
      block(c) {
        if (c.depth < 2) return [vary(dn(c.dir, 8, 803) > 0.65 ? C('#7f8a6a') : C('#8a857c'), c.j, 0.18), 0];
        if (c.f > 0.78) return [vary(C('#a29c90'), c.j), 0];
        if (c.f > 0.68) return [vary(C('#d8d4e8'), c.j, 0.06), 0.05, 'crystal'];
        if (c.f < 0.55 && c.n3 < 0.6) return null;   // the cave; crystal points stick into it where n3 is high
        return c.h > 0.9 ? [vary(C('#d9b8ff'), c.j), 0.55, 'crystal'] : [vary(mixc(C('#5d3496'), C('#a77be0'), c.n3), c.j), 0.12, 'crystal'];
      },
    },
    {
      name: 'Rime', tagline: 'Ice over a hidden sea',
      blurb: 'Cracked white ice with rusty fractures. A few blocks down, a glowing blue ocean wraps the whole world, above a rocky mantle and an iron core.',
      surface: [['Ice shell', '#e6f0fb'], ['Rust fractures', '#9b5a3c']],
      inside: [['Ice shell', '#cfe2f6'], ['Hidden ocean', '#1a6fc0', 1], ['Rock mantle', '#6b5f55'], ['Iron core', '#b8a48a']],
      shape: () => 0.98,
      block(c) {
        if (c.depth < 1.5) return Math.abs(dn(c.dir, 3, 901, 3) - 0.5) < 0.025 ? [vary(C('#9b5a3c'), c.j), 0] : [vary(C('#e6f0fb'), c.j, 0.06), 0.02, 'ice'];
        return layer(c, [{ f: 0.84, col: '#cfe2f6', m: 'ice' }, { f: 0.6, col: '#1a6fc0', e: 0.4, v: 0.08, m: 'water' }, { f: 0.25, col: '#6b5f55' }, { f: 0, col: '#b8a48a', m: 'metal' }]);
      },
    },
    {
      name: 'Halo', tagline: 'Ringed giant',
      blurb: 'A banded gas giant with a rust-red storm and a ring of loose blocks that can be shot away too. Deep inside, the gas turns into liquid metal around a small hot core.',
      surface: [['Cream band', '#e8d5b0'], ['Tan band', '#c9a477'], ['Brown band', '#8a5a3a'], ['Storm', '#c8502a'], ['Ring', '#cdbb9a']],
      inside: [['Cloud deck', '#d9c49a'], ['Metallic hydrogen', '#a9b3c8'], ['Rock core', '#5a4636'], ['Hot centre', '#ffb060', 1]],
      ext: 1.85, scale: 0.62, rScale: 0.55,
      shape: () => 0.99,
      ring(x, y, z, R) {
        const rr = Math.hypot(x, z) / R;
        if (Math.abs(y) > Math.max(0.6, R * 0.025) || rr < 1.3 || rr > 1.8) return null;
        if (Math.abs(rr - 1.52) < 0.04) return null;   // the gap
        if (h3(x * 2, y * 2, z * 2, 1001) > 0.82) return null;
        return [vary(rr > 1.55 ? C('#9e8f75') : C('#cdbb9a'), h3(x * 2, y * 2, z * 2, 1003)), 0, 'ice'];
      },
      block(c) {
        if (c.depth < 1.5) {
          if (Math.hypot(c.dir[0] - 0.75, c.dir[1] + 0.25, c.dir[2] - 0.6) < 0.22) return [vary(C('#c8502a'), c.j), 0.05];
          const b = Math.sin((c.lat + (dn(c.dir, 3, 1005) - 0.5) * 0.12) * 14);
          return [vary(b > 0.4 ? C('#e8d5b0') : b > -0.3 ? C('#c9a477') : C('#8a5a3a'), c.j, 0.06), 0];
        }
        return layer(c, [{ f: 0.75, col: '#d9c49a' }, { f: 0.3, col: '#a9b3c8', m: 'metal' }, { f: 0.12, col: '#5a4636' }, { f: 0, col: '#ffb060', e: 0.8, m: 'lava' }]);
      },
    },
    {
      name: 'Dune', tagline: 'Layer cake',
      blurb: 'Wind-ribbed sand dunes on top. Underneath, a stack of red and ochre sandstone strata like a canyon wall, all the way down to a dark iron core.',
      surface: [['Dune sand', '#e2b878'], ['Dune shadow', '#c9975a']],
      inside: [['Red sandstone', '#b5652f'], ['Ochre sandstone', '#d08a4a'], ['Rust sandstone', '#8f4a2a'], ['Iron core', '#5f5a5a'], ['Hot centre', '#ff9a4a', 1]],
      shape: d => 0.95 + (Math.sin((d[0] * 0.8 + d[2] * 0.6) * 22 + dn(d, 2, 1101) * 6) * 0.5 + 0.5) * 0.04,
      block(c) {
        if (c.depth < 1.5) return [vary(c.s > 0.97 ? C('#e2b878') : C('#c9975a'), c.j, 0.06), 0];
        if (c.f < 0.1) return [C('#ff9a4a'), 0.8, 'lava'];
        if (c.f < 0.3) return [vary(C('#5f5a5a'), c.j), 0, 'metal'];
        const band = Math.floor((c.f + (c.wob - 0.5) * 0.03) * 22) % 3;
        return [vary(C(['#b5652f', '#d08a4a', '#8f4a2a'][band]), c.j, 0.08), 0];
      },
    },
    {
      name: 'Canopy', tagline: 'Jungle with caves', hollow: [0.29, 0.9],
      blurb: 'A jungle moon threaded with rivers. Below the roots, limestone is riddled with caves, and the core glows with bioluminescent life.',
      surface: [['Canopy', '#2e7a32'], ['Deep jungle', '#1f5a26'], ['Rivers', '#3a8fd0']],
      inside: [['Root soil', '#4a3424'], ['Limestone (caves)', '#cfc6ad'], ['Glow moss', '#5dffb0', 1], ['Living core', '#b8ffe0', 1]],
      shape: d => 0.95 + dn(d, 4, 1201) * 0.05,
      block(c) {
        if (c.depth < 1.5) {
          if (Math.abs(dn(c.dir, 2.5, 1203, 3) - 0.5) < 0.018) return [vary(C('#3a8fd0'), c.j), 0.04, 'water'];
          return [vary(mixc(C('#1f5a26'), C('#2e7a32'), dn(c.dir, 9, 1205)), c.j), 0];
        }
        if (c.d24 < 3.5) return [vary(C('#4a3424'), c.j), 0];
        if (c.f > 0.3 && c.n3 > 0.62) return null;   // caves
        if (c.f > 0.3 && c.n3 > 0.58) return [vary(C('#5dffb0'), c.j), 0.6, 'energy'];   // moss lining the caves
        return layer(c, [{ f: 0.3, col: '#cfc6ad' }, { f: 0, col: '#b8ffe0', e: 0.75, v: 0.05, m: 'energy' }]);
      },
    },
    {
      name: 'Foundry', tagline: 'Machine world',
      blurb: 'Plated in steel panels with running lights. Under the armour sit copper conduits, dark machinery with live circuits, and a reactor at the heart.',
      surface: [['Steel plate', '#8c9099'], ['Dark plate', '#5c6068'], ['Running lights', '#ffd27a']],
      inside: [['Copper conduits', '#b8693a'], ['Machinery', '#2a2d33'], ['Live circuits', '#3fe0ff', 1], ['Reactor', '#7ff7ff', 1]],
      shape: () => 0.97,
      block(c) {
        const P = Math.max(3, Math.round(4 * c.u)), Wp = Math.max(4, Math.round(5 * c.u));
        if (c.depth < 1.5) {
          const seam = (c.x % P === 0) + (c.y % P === 0) + (c.z % P === 0) >= 2;
          if (seam && c.h > 0.85) return [C('#ffd27a'), 0.9, 'energy'];
          return [vary(((c.x / P | 0) + (c.y / P | 0) + (c.z / P | 0)) & 1 ? C('#8c9099') : C('#5c6068'), c.j, 0.05), 0, 'metal'];
        }
        if (c.f > 0.78) return [vary(C('#b8693a'), c.j), 0.05, 'metal'];
        if (c.f < 0.16) return [C('#7ff7ff'), 1, 'energy'];
        const wire = (c.x % Wp === 0 && c.y % Wp === 0) || (c.y % Wp === 0 && c.z % Wp === 0) || (c.x % Wp === 0 && c.z % Wp === 0);
        return wire ? [C('#3fe0ff'), 0.7, 'energy'] : [vary(C('#2a2d33'), c.j), 0, 'metal'];
      },
    },
    {
      name: 'Reef', tagline: 'Shallow coral seas',
      blurb: 'Turquoise shallows full of pink and coral reefs and little white sand cays. Inside is soft chalk and shimmering mother-of-pearl around a glowing pearl.',
      surface: [['Shallows', '#3fc1c9'], ['Coral', '#ff7a8a'], ['Peach coral', '#ffb3a0'], ['Sand cay', '#f4ead2']],
      inside: [['Chalk', '#e9e2cf'], ['Nacre', '#e6dcf0', 1], ['Pearl core', '#fff2f8', 1]],
      sea: 0.97,
      shape: d => { const n = dn(d, 3, 1301); return n > 0.66 ? 0.98 : 0.93 + n * 0.04; },
      block(c) {
        if (c.water) return [mixc(C('#46d0d6'), C('#1d8a9a'), sstep(0.5, 2.5, c.d24)), 0.06, 'water'];
        if (c.depth < 1.5) {
          if (c.s > 0.975) return [vary(C('#f4ead2'), c.j, 0.05), 0];
          return [vary(dn(c.dir, 8, 1303) > 0.55 ? C('#ff7a8a') : C('#ffb3a0'), c.j), 0.05];
        }
        return layer(c, [{ f: 0.55, col: '#e9e2cf', v: 0.06 }, { f: 0.2, col: '#e6dcf0', e: 0.12, v: 0.1, m: 'crystal' }, { f: 0, col: '#fff2f8', e: 0.6, v: 0.03, m: 'crystal' }]);
      },
    },
    {
      name: 'Noxa', aka: ['Bog'], tagline: 'Toxic',
      blurb: 'Purple mud and yellow sulphur crust around glowing acid-green pools. The rock below is banded with sulphur, and the core glows radioactive green.',
      surface: [['Purple mud', '#4a2a5a'], ['Sulphur crust', '#d9c83a'], ['Acid pools', '#7dff3a', 1]],
      inside: [['Sulphur strata', '#b5a62e'], ['Dark shale', '#2e2436'], ['Radioactive core', '#9dff3a', 1]],
      shape: d => 0.95 + dn(d, 4, 1401) * 0.05,
      block(c) {
        if (c.depth < 1.5) {
          if (c.s < 0.965) return [vary(C('#7dff3a'), c.j, 0.1), 0.6, 'water'];
          return [vary(dn(c.dir, 7, 1403) > 0.62 ? C('#d9c83a') : C('#4a2a5a'), c.j), 0];
        }
        if (c.f < 0.25) return [vary(C('#9dff3a'), c.j, 0.06), 0.9, 'energy'];
        return [vary(Math.floor(c.f * 18) % 2 ? C('#b5a62e') : C('#2e2436'), c.j), 0];
      },
    },
    {
      name: 'Ashfall', tagline: 'Dead world',
      blurb: 'Grey ash, old craters and nothing glowing at all. It is quiet and muted all the way down to a cold iron core. Good contrast next to the bright planets.',
      surface: [['Ash', '#7a7774'], ['Crater floor', '#4d4a47']],
      inside: [['Ash rock', '#5d5a57'], ['Dark stone', '#3b3a3c'], ['Cold iron core', '#4a4f57']],
      craters: [[0.7, 0.3, 0.65, 0.25], [-0.5, 0.6, 0.62, 0.18], [0.1, -0.8, 0.6, 0.2], [-0.7, -0.2, -0.68, 0.22], [0.2, 0.4, -0.9, 0.15]],
      shape(d) {
        let s = 0.97 + dn(d, 5, 1501) * 0.02;
        for (const [x, y, z, r] of this.craters) {
          const l = Math.hypot(x, y, z), dd = Math.acos(Math.min(1, (d[0] * x + d[1] * y + d[2] * z) / l));
          if (dd < r) s -= 0.08 * (1 - (dd / r) ** 2);
          else if (dd < r * 1.25) s += 0.02;
        }
        return Math.min(1, s);
      },
      block(c) {
        if (c.depth < 1.5) return [vary(c.s < 0.95 ? C('#4d4a47') : C('#7a7774'), c.j, 0.1), 0];
        return layer(c, [{ f: 0.55, col: '#5d5a57' }, { f: 0.25, col: '#3b3a3c' }, { f: 0, col: '#4a4f57', m: 'metal' }]);
      },
    },
    {
      name: 'Brine', tagline: 'Salt flats',
      blurb: 'Blinding white salt flats split into polygons, with pink brine lakes. The inside is made of pink and white salt crystal around a rose-quartz core.',
      surface: [['Salt', '#f1eee8'], ['Polygon cracks', '#cfc7bd'], ['Pink brine', '#e89ab0']],
      inside: [['Halite', '#f5c9d3'], ['White halite', '#fbe7ec'], ['Rose quartz core', '#ff8fb0', 1]],
      shape: d => dn(d, 3, 1601) < 0.38 ? 0.95 : 0.97,
      block(c) {
        if (c.depth < 1.5) {
          if (c.s < 0.96) return [vary(C('#e89ab0'), c.j, 0.06), 0.06, 'water'];
          const cell = vn(c.dir[0] * 9, c.dir[1] * 9, c.dir[2] * 9, 1603);
          return [vary(Math.abs(cell - 0.5) < 0.04 ? C('#cfc7bd') : C('#f1eee8'), c.j, 0.04), 0, 'crystal'];
        }
        if (c.f < 0.22) return [vary(C('#ff8fb0'), c.j, 0.06), 0.45, 'crystal'];
        return [vary(Math.floor(c.f * 14 + c.wob) % 2 ? C('#f5c9d3') : C('#fbe7ec'), c.j, 0.05), 0.04, 'crystal'];
      },
    },
    {
      name: 'Lantern', tagline: 'Hollow world, inner sun', hollow: [0.17, 0.67],
      blurb: 'A thin shell of rock with forests on its inner face and a small sun hanging in the middle. Break through anywhere and light pours out.',
      surface: [['Outer rock', '#6f7a5a'], ['Moss', '#55704a']],
      inside: [['Shell rock', '#5a5248'], ['Inner forest', '#3f9a3a'], ['Hollow sky', '#000000'], ['Inner sun', '#fff0b0', 1]],
      shape: d => 0.97 + dn(d, 4, 1701) * 0.03,
      block(c) {
        if (c.f < 0.18) return [C('#fff0b0'), 1, 'energy'];
        if (c.f < 0.66) return null;
        if (c.f < 0.7) return [vary(C('#3f9a3a'), c.j), 0.15];
        if (c.depth < 1.5) return [vary(dn(c.dir, 8, 1703) > 0.6 ? C('#55704a') : C('#6f7a5a'), c.j), 0];
        return [vary(C('#5a5248'), c.j), 0];
      },
    },
    {
      name: 'Janus', tagline: 'Fire and ice',
      blurb: 'Tidally locked: one half is a sea of lava, the other half is frozen solid, with a rocky twilight band between. The core is split too.',
      surface: [['Lava sea', '#ff6a1f', 1], ['Crust rafts', '#2b2320'], ['Twilight rock', '#6a5a50'], ['Night ice', '#cfe3ff']],
      inside: [['Hot mantle', '#a8320f', 1], ['Cold mantle', '#3a4a66'], ['Split core', '#ffd27a', 1]],
      shape: d => d[0] > 0.15 ? 0.95 : 0.97,
      block(c) {
        const side = c.dir[0] + (dn(c.dir, 4, 1801) - 0.5) * 0.2;
        if (c.depth < 1.5) {
          if (side > 0.25) return c.h > 0.82 ? [vary(C('#2b2320'), c.j), 0] : [vary(C('#ff6a1f'), c.j, 0.1), 0.85, 'lava'];
          if (side > -0.15) return [vary(C('#6a5a50'), c.j), 0];
          return [vary(C('#cfe3ff'), c.j, 0.05), 0.03, 'ice'];
        }
        if (c.f < 0.22) return c.dir[0] > 0 ? [C('#ffd27a'), 0.85, 'lava'] : [C('#bfe8ff'), 0.85, 'crystal'];
        return c.dir[0] > 0 ? [vary(C('#a8320f'), c.j), 0.45, 'lava'] : [vary(C('#3a4a66'), c.j), 0, 'ice'];
      },
    },
    {
      name: 'Mycel', tagline: 'Glowing fungus',
      blurb: 'A dark night-blue world covered in glowing blue fungus fields. Inside, a white mycelium network threads through the rock down to a teal glowing heart.',
      surface: [['Night soil', '#141a2e'], ['Glow fungus', '#3fb6ff', 1]],
      inside: [['Dark loam', '#1d2238'], ['Mycelium threads', '#d8e8ff', 1], ['Teal heart', '#3fffd2', 1]],
      shape: d => 0.95 + dn(d, 5, 1901) * 0.05,
      block(c) {
        if (c.depth < 1.5) return dn(c.dir, 6, 1903) > 0.58 ? [vary(C('#3fb6ff'), c.j), 0.55, 'energy'] : [vary(C('#141a2e'), c.j, 0.2), 0];
        if (c.f < 0.2) return [vary(C('#3fffd2'), c.j, 0.05), 0.9, 'energy'];
        if (Math.abs(c.n3 - 0.5) < 0.035) return [vary(C('#d8e8ff'), c.j, 0.05), 0.5, 'energy'];
        return [vary(C('#1d2238'), c.j, 0.2), 0];
      },
    },
    // ============ added from the planet sheet ============
    {
      name: 'Luna', tagline: 'A wandering moon',
      blurb: 'Not round at all: a lumpy potato of grey rock pocked with craters, dragged in from the belt. Crack it and it is full of iron-nickel veins and pockets of old ice.',
      surface: [['Regolith', '#7d776f'], ['Crater floor', '#55504a'], ['Fresh rock', '#a49d92']],
      inside: [['Breccia', '#5f5a54'], ['Iron-nickel', '#b9b2a6'], ['Ice pocket', '#cfeaff'], ['Dense core', '#3e3a37']],
      shape: d => {
        let s = 0.81 + dn(d, 1.15, 3101, 3) * 0.2;
        for (let i = 0; i < 9; i++) {   // craters: shallow bowls with a raised rim
          const a = h3(i, 0, 0, 3103) * 2 - 1, t = h3(i, 1, 0, 3103) * 6.283, q = Math.sqrt(1 - a * a);
          const dist = Math.acos(Math.min(1, d[0] * q * Math.cos(t) + d[1] * a + d[2] * q * Math.sin(t)));
          const rad = 0.18 + h3(i, 2, 0, 3103) * 0.28;
          if (dist < rad) s -= 0.07 * (1 - (dist / rad) ** 2); else if (dist < rad * 1.3) s += 0.02;
        }
        return Math.max(0.8, Math.min(1, s));
      },
      block(c) {
        if (c.depth < 1.5) return [vary(c.s < 0.86 ? C('#55504a') : dn(c.dir, 9, 3105) > 0.66 ? C('#a49d92') : C('#7d776f'), c.j, 0.16), 0];
        if (c.n3 > 0.66) return [vary(C('#cfeaff'), c.j, 0.05), 0.04, 'ice'];
        if (Math.abs(c.n3 - 0.4) < 0.025) return [vary(C('#b9b2a6'), c.j, 0.08), 0, 'metal'];
        return layer(c, [{ f: 0.35, col: '#5f5a54', v: 0.2 }, { f: 0, col: '#3e3a37' }]);
      },
    },
    {
      name: 'Bonbon', tagline: 'Candy world',
      blurb: 'Swirled pastel candy stripes like a giant boiled sweet. Inside, layer after layer of rock candy in every colour, around a gooey glowing raspberry centre.',
      surface: [['Pink stripe', '#ff8fc8'], ['Mint stripe', '#8ff0cf'], ['Lemon stripe', '#fff08a'], ['Sugar white', '#fff7fb']],
      inside: [['Rock candy', '#ffb3de'], ['Lavender candy', '#c7a8ff'], ['Mint candy', '#9ff5d8'], ['Raspberry goo', '#ff2e7a', 1]],
      shape: () => 0.97,
      block(c) {
        if (c.depth < 1.6) {
          const sw = (lon(c.dir) + lat(c.dir) * 2.2 + dn(c.dir, 2, 3201) * 1.2) * 3 / Math.PI;
          return [vary(C(['#ff8fc8', '#fff7fb', '#8ff0cf', '#fff7fb', '#fff08a', '#fff7fb'][((Math.floor(sw * 2) % 6) + 6) % 6]), c.j, 0.05), 0.04, 'crystal'];
        }
        if (c.f < 0.24) return [vary(C('#ff2e7a'), c.j, 0.06), 0.65, 'energy'];
        const band = Math.floor((c.f + (c.wob - 0.5) * 0.05) * 16) % 3;
        return [vary(C(['#ffb3de', '#c7a8ff', '#9ff5d8'][band]), c.j, 0.06), 0.06, 'crystal'];
      },
    },
    {
      name: 'Hive', tagline: 'Honeycomb world',
      blurb: 'Wax hexagons from pole to pole, some capped, some dripping with honey. Underneath, the comb goes deep, full of cells and glowing honey, around a royal jelly heart.',
      surface: [['Wax comb', '#e3b23c'], ['Capped cell', '#f4d27a'], ['Honey', '#ff9f1a', 1]],
      inside: [['Comb', '#c98f22'], ['Honey cells', '#ff9f1a', 1], ['Royal jelly', '#fff2c2', 1]],
      shape: () => 0.97,
      block(c) {
        if (c.depth < 1.6) {
          const w = hexWall(c.dir, 9);
          if (w < 0.07) return [vary(C('#e3b23c'), c.j, 0.06), 0];
          return h3(Math.round(lon(c.dir) * 9), Math.round(lat(c.dir) * 9), 0, 3601) > 0.5 ? [vary(C('#f4d27a'), c.j, 0.05), 0] : [vary(C('#ff9f1a'), c.j, 0.05), 0.35, 'water'];
        }
        if (c.f < 0.18) return [C('#fff2c2'), 0.7, 'energy'];
        return c.n3 > 0.55 ? [vary(C('#ff9f1a'), c.j, 0.06), 0.3, 'water'] : [vary(C('#c98f22'), c.j, 0.1), 0];
      },
    },
    {
      name: 'Aurora', tagline: 'Northern lights',
      blurb: 'A dark blue ice world where green and violet curtains of light never stop dancing over the poles. Under the ice is deep blue glacier, then a warm salty sea around a stone core.',
      surface: [['Night ice', '#1f3a66'], ['Aurora green', '#5affa0', 1], ['Aurora violet', '#b07aff', 1]],
      inside: [['Glacier', '#3a6fb0'], ['Salt sea', '#1fb0c8', 1], ['Stone core', '#4f4a5a']],
      shape: () => 0.97,
      block(c) {
        if (c.depth < 1.6) {
          const band = Math.abs(c.lat) - 0.55 + Math.sin(lon(c.dir) * 5 + dn(c.dir, 3, 4401) * 5) * 0.08;
          if (Math.abs(band) < 0.07) return [mixc(C('#5affa0'), C('#b07aff'), sstep(-0.07, 0.07, band)), 0.8, 'energy'];
          return [vary(C('#1f3a66'), c.j, 0.1), 0.02, 'ice'];
        }
        return layer(c, [{ f: 0.6, col: '#3a6fb0', m: 'ice' }, { f: 0.25, col: '#1fb0c8', e: 0.35, m: 'water' }, { f: 0, col: '#4f4a5a' }]);
      },
    },
    {
      name: 'Melon', tagline: 'Summer slice',
      blurb: 'Striped dark and light green rind on the outside. A thin white layer, then sweet red flesh full of black seeds, around a juicy glowing heart.',
      surface: [['Dark stripe', '#1f6a2a'], ['Light stripe', '#7fc456']],
      inside: [['White rind', '#e9f5d0'], ['Red flesh', '#ff4a5a'], ['Seeds', '#1a1414'], ['Juicy heart', '#ff8a9a', 1]],
      shape: d => 0.96 + Math.abs(Math.sin(lon(d) * 7)) * 0.015,
      block(c) {
        if (c.depth < 1.6) return [vary(Math.sin(lon(c.dir) * 7 + dn(c.dir, 4, 4601) * 1.2) > 0 ? C('#1f6a2a') : C('#7fc456'), c.j, 0.06), 0];
        if (c.d24 < 3) return [vary(C('#e9f5d0'), c.j, 0.05), 0];
        if (c.f < 0.15) return [C('#ff8a9a'), 0.6, 'water'];
        if (c.f > 0.35 && c.f < 0.75 && c.h > 0.94) return [C('#1a1414'), 0];
        return [vary(C('#ff4a5a'), c.j, 0.08), 0.05, 'water'];
      },
    },
  ];

  // ---------------------------------------------------------------- evaluation
  const MATERIALS = { none: 0, lava: 1, crystal: 2, water: 3, ice: 4, metal: 5, energy: 6 };
  const INNER = 0.8;   // every planet is solid below this fraction (all shapes stay above it)

  // context for a block at (x, y, z) relative to the planet centre, grid cell (gi, gj, gk)
  function ctx(def, R, x, y, z, gi, gj, gk) {
    const r = Math.hypot(x, y, z), dir = r > 0 ? [x / r, y / r, z / r] : [0, 1, 0];
    const s = def.shape(dir), sR = s * R, top = Math.max(sR, (def.sea || 0) * R);
    const u = R / 24, k6 = 6 / R, k3 = 2.9 / R;
    let wob, n3;   // 3D noise is only computed if the planet asks for it
    return {
      r, R, u, f: r / R, dir, lat: dir[1], s, sR, top, sea: def.sea || 0,
      water: !!def.sea && r > sR, depth: top - r, d24: (top - r) / u,
      j: h3(gi, gj, gk, 7), h: h3(gi, gj, gk, 9),
      get wob() { return wob ?? (wob = vn(x * k6, y * k6, z * k6, 5)); },
      get n3() { return n3 ?? (n3 = fbm(x * k3 + 50, y * k3 + 50, z * k3 + 50, 13, 3)); },
      x: Math.round(x + 1000), y: Math.round(y + 1000), z: Math.round(z + 1000),
    };
  }
  // does a block exist here (ignoring hollow cavities)?
  function inside(def, R, x, y, z) {
    const r = Math.hypot(x, y, z);
    if (r > R + 0.5) return !!(def.ring && def.ring(x, y, z, R));
    if (r < INNER * R) return true;
    const d = [x / r, y / r, z / r];
    return r <= Math.max(def.shape(d), def.sea || 0) * R;
  }
  // full evaluation: [r, g, b, packed material/glow] or null
  function block(def, R, x, y, z, gi, gj, gk) {
    const r = Math.hypot(x, y, z);
    let out;
    if (r > R + 0.5) out = def.ring ? def.ring(x, y, z, R) : null;
    else {
      const c = ctx(def, R, x, y, z, gi, gj, gk);
      if (r > c.top) return null;
      out = def.block(c);
    }
    if (!out) return null;
    const cl = v => Math.max(0, Math.min(255, Math.round(v)));
    const glow = Math.max(0, Math.min(31, Math.round((out[1] || 0) * 31)));
    return [cl(out[0][0]), cl(out[0][1]), cl(out[0][2]), (MATERIALS[out[2] || 'none'] << 5) | glow];
  }
  return { PLANETS, MATERIALS, block, inside, h3 };
})();
