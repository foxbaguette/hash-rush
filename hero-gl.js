'use strict';
/*
  HeroGL: real game renders for marketing pages. One shared WebGL2 context draws the space
  sky, voxel planets (planets-data.js) and Alien Worlds crew ships (ships-sdf.js, else aw-designs.js) for every
  registered canvas that is on screen, then copies the frame into that canvas. A 2D overlay
  callback can paint glows, beams and HUD lines on top using project().

    HeroGL.view(canvas, t => scene, overlay?)
    scene = { eye, at, fov?, sky?: true, halo?: [r,g,b],
              planets: [{ name, pos, R?, size, yaw?, tilt?, pit?: { dir, r, depth } | cut?: true }],
              ships:   [{ name, rarity, element?, shine?, pos, fwd, up?, size }] }
*/
const HeroGL = (() => {
  const glc = document.createElement('canvas');
  const gl = glc.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false });
  if (!gl) return { view() {}, ok: false };
  // Phones drop the GPU memory of a background tab (the WebGL context is lost): coming back, the page
  // would show its interface over an empty canvas. A fresh start is the reliable recovery (the wallet
  // session and settings are kept); never more than once in 15 s, so it cannot loop.
  (() => {
    const restart = () => {
      try { if (Date.now() - Number(sessionStorage.getItem('hashrush.glRestart') || 0) < 15000) return; sessionStorage.setItem('hashrush.glRestart', String(Date.now())); } catch { /* reload anyway */ }
      location.reload();
    };
    glc.addEventListener('webglcontextlost', e => e.preventDefault());   // ask the browser to give it back
    glc.addEventListener('webglcontextrestored', restart);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && gl.isContextLost()) setTimeout(() => { if (gl.isContextLost()) restart(); }, 1200); });
  })();

  const VS = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in uint aCell;
layout(location = 1) in vec4 aCol;
uniform mat4 uMVP;
uniform vec3 uCam;
uniform int uN;
uniform float uScale;
out vec3 vLocal;
out vec3 vPos;
flat out vec4 vCol;
flat out vec3 vSN;
const vec3 F[7] = vec3[7](
  vec3( 1, 1, 1), vec3(-1, 1, 1), vec3( 1,-1, 1), vec3( 1, 1,-1),
  vec3(-1,-1, 1), vec3(-1, 1,-1), vec3( 1,-1,-1));
void main() {
  int id = int(aCell);
  ivec3 ic = ivec3(id % uN, (id / uN) % uN, id / (uN * uN));
  vec3 p = (vec3(ic) + 0.5 - float(uN) * 0.5) * uScale;
  vec3 s = sign(uCam - p);
  s += vec3(equal(s, vec3(0.0)));
  vec3 loc = F[gl_VertexID] * s;
  vec3 pos = p + loc * 0.5 * uScale;
  gl_Position = uMVP * vec4(pos, 1.0);
  vLocal = loc; vPos = pos; vCol = aCol; vSN = normalize(p + 1e-6);
}`;
  const FS = `#version 300 es
precision mediump float;
uniform vec3 uLight;
uniform highp vec3 uCam;
uniform float uSph;
uniform float uT;
in vec3 vLocal;
in vec3 vPos;
flat in vec4 vCol;
flat in vec3 vSN;
out vec4 o;
void main() {
  vec3 a = abs(vLocal);
  float mx = step(max(a.y, a.z), a.x);
  float my = (1.0 - mx) * step(a.z, a.y);
  vec3 m = vec3(mx, my, 1.0 - mx - my);
  vec3 n = m * sign(vLocal);
  vec3 tt = a * (1.0 - m);
  float e = max(max(tt.x, tt.y), tt.z);
  float fw = fwidth(e);
  float edgeK = (1.0 - smoothstep(0.08, 0.3, fw)) * smoothstep(0.78 - fw, 1.0 - fw * 0.5, e);
  vec3 nl = normalize(n * 0.75 + vSN * 0.45 * uSph);
  vec3 V = normalize(uCam - vPos);
  float d = max(dot(nl, uLight), 0.0);
  float sp = pow(max(dot(nl, normalize(uLight + V)), 0.0), 40.0) * 0.3 * d;
  float rim = pow(1.0 - max(dot(vSN, V), 0.0), 3.0) * uSph;
  vec3 base = vCol.rgb;
  float glow = vCol.a * (0.85 + 0.15 * sin(uT * 3.0 + vPos.x * 40.0));
  vec3 col = base * (0.06 + 1.05 * d) * (1.0 - 0.3 * edgeK) * (1.0 - vCol.a)
           + base * glow * 1.6 * (1.0 - 0.2 * edgeK)
           + sp * (1.0 - vCol.a) + vec3(0.55, 0.7, 1.0) * rim * 0.1 * (0.3 + d);
  col = col / (1.0 + col * 0.25);
  o = vec4(pow(col, vec3(0.92)), 1.0);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  const U = {}; for (const n of ['uMVP', 'uCam', 'uN', 'uScale', 'uLight', 'uSph', 'uT']) U[n] = gl.getUniformLocation(prog, n);
  const ibo = gl.createBuffer();
  const IDX = new Uint8Array([0, 2, 6, 0, 6, 3, 0, 3, 5, 0, 5, 1, 0, 1, 4, 0, 4, 2]);
  const sky = typeof SpaceSky !== 'undefined' ? SpaceSky.create(gl, 640) : null;
  const PVS = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aP;
layout(location = 1) in vec4 aC;
uniform mat4 uVP;
uniform float uPx;
out vec4 vC;
void main() {
  gl_Position = uVP * vec4(aP.xyz, 1.0);
  gl_PointSize = clamp(aP.w * uPx / gl_Position.w, 1.0, 256.0);
  vC = aC;
}`;
  const PADD = `#version 300 es
precision mediump float;
in vec4 vC;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float f = max(1.0 - dot(q, q), 0.0); f *= f;
  o = vec4(vC.rgb * vC.a * f, 1.0);
}`;
  const PALPHA = `#version 300 es
precision mediump float;
in vec4 vC;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float f = max(1.0 - dot(q, q), 0.0);
  float a = vC.a * f * f;
  o = vec4(vC.rgb * a, a);
}`;
  const mkProg = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return { p, vp: gl.getUniformLocation(p, 'uVP'), px: gl.getUniformLocation(p, 'uPx') }; };
  const addProg = mkProg(PVS, PADD), alphaProg = mkProg(PVS, PALPHA);
  const PMAX = 6000, pData = new Float32Array(PMAX * 8), pBuf = gl.createBuffer(), pVao = gl.createVertexArray();
  gl.bindVertexArray(pVao); gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferData(gl.ARRAY_BUFFER, pData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
  gl.bindVertexArray(null);
  // draws a WeaponKit particle list that lives in a planet's local frame (planet at the origin, radius 1)
  function drawParts(list, prog, VP, px, t, pos, unit, gain, sizeK = 1.8) {
    let n = 0;
    for (const p of list) {
      if (n >= PMAX) break;
      const k = 1 - p.age / p.life, o = n * 8;
      const tw = p.twinkle ? 0.3 + 0.7 * Math.abs(Math.sin(t * 18 + p.size * 977)) : 1;
      pData[o] = pos[0] + p.p[0] * unit; pData[o + 1] = pos[1] + p.p[1] * unit; pData[o + 2] = pos[2] + p.p[2] * unit;
      pData[o + 3] = p.size * unit * sizeK * (p.grow ? 1 + p.grow * (1 - k) : 0.6 + 0.4 * k);
      pData[o + 4] = p.c[0]; pData[o + 5] = p.c[1]; pData[o + 6] = p.c[2]; pData[o + 7] = p.i * gain * (p.grow ? k : k * tw);
      n++;
    }
    if (!n) return;
    gl.useProgram(prog.p); gl.uniformMatrix4fv(prog.vp, false, VP); gl.uniform1f(prog.px, px);
    gl.bindVertexArray(pVao); gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pData, 0, n * 8);
    gl.drawArrays(gl.POINTS, 0, n);
  }

  // ---- math (column-major)
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
  const persp = (f, asp, n, fr) => { const t = 1 / Math.tan(f / 2), nf = 1 / (n - fr); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fr + n) * nf, -1, 0, 0, 2 * fr * n * nf, 0]); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lookAt = (eye, at, up) => { const z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]); };
  const rotOnly = m => { const o = m.slice(); o[12] = o[13] = o[14] = 0; return o; };
  const model = (pos, r, u, f) => new Float32Array([r[0], r[1], r[2], 0, u[0], u[1], u[2], 0, f[0], f[1], f[2], 0, pos[0], pos[1], pos[2], 1]);
  const LW = norm([0.75, 0.45, 0.5]);
  // crew ships as in the game (ships-sdf.js, loaded before this file): the ship formula, drawn once its
  // shader has compiled (until then, and for anything without a crew card, the voxel ship)
  const kit = typeof ShipKit !== 'undefined' ? ShipKit.create(gl) : null;
  if (kit) kit.prewarm();
  // planets in the game's distance-field look (sdf.js, loaded before this file): the planet's cells as
  // a smooth surface with the game's planet settings; the voxel planet until its copy is built
  const sdf = typeof SdfKit !== 'undefined' ? SdfKit.create(gl, 64) : null, sdfVao = gl.createVertexArray();
  function sdfPlanet(m) {
    if (m.sdf !== undefined) return m.sdf;
    const { kind, colour, N } = m.grid, pos = [], col = [];
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const idx = i + j * N + k * N * N;
      if (!kind[idx]) continue;
      pos.push(i - N / 2, j - N / 2, k - N / 2);
      col.push(colour[idx * 4], colour[idx * 4 + 1], colour[idx * 4 + 2], colour[idx * 4 + 3]);
    }
    const md = sdf.modelTextures(pos, new Uint8Array(col));
    sdf.modelSoft(md, SdfKit.DEFAULTS.planet.soft);
    gl.activeTexture(gl.TEXTURE0);
    return (m.sdf = md);
  }
  function drawSdfPlanet(md, pos, r, u, f, s, VP, eye, t) {
    const pr = sdf.progs().shipProg, U2 = pr.u, L = SdfKit.DEFAULTS.planet, D = SdfKit.DEFAULTS;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(U2.uMVP, false, mul(VP, new Float32Array([r[0] * s, r[1] * s, r[2] * s, 0, u[0] * s, u[1] * s, u[2] * s, 0, f[0] * s, f[1] * s, f[2] * s, 0, pos[0], pos[1], pos[2], 1])));
    const dc = sub(eye, pos);
    gl.uniform3fv(U2.uCamM, [dot(r, dc) / s, dot(u, dc) / s, dot(f, dc) / s]);
    gl.uniform3fv(U2.uLight, [dot(r, LW), dot(u, LW), dot(f, LW)]);
    gl.uniform3fv(U2.uBoxMin, md.box[0]); gl.uniform3fv(U2.uBoxMax, md.box[1]);
    gl.uniform3fv(U2.uOrigin, md.origin); gl.uniform3fv(U2.uDims, md.dims); gl.uniform1f(U2.uCell, 1);
    gl.uniform1f(U2.uSmooth, L.smooth); gl.uniform1f(U2.uSoft, L.soft); gl.uniform1f(U2.uRound, L.round);
    gl.uniform1f(U2.uNoise, L.noise); gl.uniform1f(U2.uColBlend, L.colBlend); gl.uniform1f(U2.uSphere, L.sphere);
    gl.uniform1f(U2.uGloss, L.gloss ?? 1); gl.uniform1f(U2.uTex, L.tex || 0); gl.uniform1f(U2.uTexScale, L.texScale || 1); gl.uniform1f(U2.uSlope, L.slope || 0);
    gl.uniform1f(U2.uStep, D.step); gl.uniform1f(U2.uAO, D.ao); gl.uniform1f(U2.uT, t);
    gl.uniform1i(U2.uDens, 3); gl.uniform1i(U2.uCol, 4); gl.uniform1i(U2.uSoftD, 5); gl.uniform1f(U2.uBound, 0);
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_3D, md.soft);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_3D, md.col);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_3D, md.dens);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(sdfVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.useProgram(prog);
  }
  const basisOf = p => { const yaw = p.yaw || 0, tilt = p.tilt ?? 0.3, cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt); return [[cy, 0, -sy], [sy * st, ct, cy * st], [sy * ct, -st, cy * ct]]; };
  // world position of a point on (or k times the radius of) a planet, given a direction in the planet's own frame
  const surface = (p, dir, k = 1) => { const [r, u, f] = basisOf(p), d = norm(dir); return [0, 1, 2].map(i => p.pos[i] + (r[i] * d[0] + u[i] * d[1] + f[i] * d[2]) * p.size * k); };

  // ---- models
  function upload(m) {
    m.vao = gl.createVertexArray(); gl.bindVertexArray(m.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, IDX, gl.STATIC_DRAW);
    const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, m.cells, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribIPointer(0, 1, gl.UNSIGNED_INT, 0, 0); gl.vertexAttribDivisor(0, 1);
    const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, m.cols, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 0, 0); gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
    return m;
  }
  function packed(kind, colour, N) {
    const NN = N * N, cells = [], cols = [];
    for (let idx = 0; idx < kind.length; idx++) {
      if (!kind[idx]) continue;
      const i = idx % N, j = ((idx / N) | 0) % N, k = (idx / NN) | 0;
      const open = i === 0 || j === 0 || k === 0 || i === N - 1 || j === N - 1 || k === N - 1 || !kind[idx - 1] || !kind[idx + 1] || !kind[idx - N] || !kind[idx + N] || !kind[idx - NN] || !kind[idx + NN];
      if (!open) continue;
      cells.push(idx); const o = idx * 4; cols.push(colour[o], colour[o + 1], colour[o + 2], colour[o + 3]);
    }
    return { N, count: cells.length, cells: new Uint32Array(cells), cols: new Uint8Array(cols) };
  }
  const planetCache = new Map(), shipCache = new Map();
  function planetModel(p) {
    const key = JSON.stringify([p.name, p.R || 26, p.cut, p.pit]);
    if (planetCache.has(key)) return planetCache.get(key);
    const def = PlanetKit.PLANETS.find(d => d.name === p.name || (d.aka || []).includes(p.name)), R = p.R || 26, ext = def.ext || 1.02;
    const half = Math.ceil(R * ext) + 1, N = half * 2, Cc = N / 2, NN = N * N;
    const kind = new Uint8Array(N * NN), colour = new Uint8Array(N * NN * 4);
    const pit = p.pit && { d: norm(p.pit.dir), r: p.pit.r, depth: p.pit.depth };
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i + 0.5 - Cc, y = j + 0.5 - Cc, z = k + 0.5 - Cc;
      if (p.cut && x > 0 && y > 0 && z > 0) continue;
      if (!PlanetKit.inside(def, R, x, y, z)) continue;
      if (pit) {   // a mining pit: a stepped cone dug in from the surface along dir
        const along = R - dot([x, y, z], pit.d), perp = Math.hypot(...sub([x, y, z], pit.d.map(v => v * (R - along))));
        if (along < pit.depth && perp < pit.r * (1 - 0.65 * along / pit.depth) + (Math.floor(along / 2) % 2) * 0.6) continue;
      }
      const b = PlanetKit.block(def, R, x, y, z, i, j, k);
      if (!b) continue;
      const idx = i + j * N + k * NN, o = idx * 4;
      kind[idx] = 1; colour[o] = b[0]; colour[o + 1] = b[1]; colour[o + 2] = b[2]; colour[o + 3] = Math.round((b[3] & 31) / 31 * 255);
    }
    const m = upload(packed(kind, colour, N));
    m.scale = (def.scale || 0.92) / R;
    m.grid = { kind, colour, N };
    planetCache.set(key, m);
    return m;
  }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function shipModel(s) {
    const key = [s.name, s.rarity, s.element, s.variant || 0, s.shine || 'Stone'].join('|');
    if (shipCache.has(key)) return shipCache.get(key);
    const ship = AWDesign.buildShip(s.name, s.rarity, s.element || 'Neutral', s.variant || 0, s.shine || 'Stone');
    let mx = 0; for (const v of ship.vox) mx = Math.max(mx, Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
    const N = mx * 2 + 3, C = mx + 1, NN = N * N;
    const kind = new Uint8Array(N * NN), colour = new Uint8Array(N * NN * 4);
    for (const v of ship.vox) {
      const idx = (v.x + C) + (v.y + C) * N + (v.z + C) * NN, o = idx * 4, c = hex(v.col);
      const g = v.role === 'engine' ? 0.9 : v.mat === 'energy' || v.mat === 'phase' ? Math.max(0.5, v.glow || 0) : (v.glow || 0);
      kind[idx] = 1; colour[o] = c[0]; colour[o + 1] = c[1]; colour[o + 2] = c[2]; colour[o + 3] = Math.round(Math.min(1, g) * 255);
    }
    const m = upload(packed(kind, colour, N));
    m.radius = ship.radius; m.C = C; m.engines = ship.engines;
    shipCache.set(key, m);
    return m;
  }

  // ---- views
  const views = [];
  function view(canvas, scene, overlay) {
    const v = { canvas, ctx: canvas.getContext('2d'), scene, overlay, visible: false, t: Math.random() * 10 };
    new IntersectionObserver(es => { v.visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    views.push(v);
    return v;
  }
  function draw(m, M, VP, eye, sph, scale, t) {
    gl.uniformMatrix4fv(U.uMVP, false, mul(VP, M));
    const r = [M[0], M[1], M[2]], u = [M[4], M[5], M[6]], f = [M[8], M[9], M[10]], pos = [M[12], M[13], M[14]], e = sub(eye, pos);
    gl.uniform3fv(U.uCam, [dot(e, r), dot(e, u), dot(e, f)]);
    gl.uniform3fv(U.uLight, [dot(LW, r), dot(LW, u), dot(LW, f)]);
    gl.uniform1i(U.uN, m.N); gl.uniform1f(U.uScale, scale); gl.uniform1f(U.uSph, sph); gl.uniform1f(U.uT, t);
    gl.bindVertexArray(m.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, 18, gl.UNSIGNED_BYTE, 0, m.count);
  }
  let last = performance.now(), builds = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; builds = 0;
    for (const v of views) {
      if (!v.visible) continue;
      v.t += dt;
      const sc = v.scene(v.t);
      // build at most one new planet per frame so the page never stalls
      const need = (sc.planets || []).filter(p => !planetCache.has(JSON.stringify([p.name, p.R || 26, p.cut, p.pit])));
      if (need.length && builds++) continue;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(v.canvas.clientWidth * dpr), h = Math.round(v.canvas.clientHeight * dpr);
      if (!w || !h) continue;
      if (v.canvas.width !== w || v.canvas.height !== h) { v.canvas.width = w; v.canvas.height = h; }
      if (glc.width !== w || glc.height !== h) { glc.width = w; glc.height = h; }
      gl.viewport(0, 0, w, h);
      const fov = sc.fov || 0.6, P = persp(fov, w / h, 0.02, 80), V = lookAt(sc.eye, sc.at, sc.up || [0, 1, 0]), VP = mul(P, V);
      const bg = sc.bg || [0.02, 0.02, 0.035]; gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (sky && sc.sky !== false) {
        gl.disable(gl.DEPTH_TEST);
        const p0 = sc.planets && sc.planets[0];
        let halo;
        if (p0 && sc.halo) {   // atmosphere glow around the first planet
          const c = mul(VP, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...p0.pos, 1])), cw = [c[12], c[13], c[15]];
          const dist = Math.hypot(...sub(sc.eye, p0.pos)), rad = p0.size / Math.sqrt(Math.max(1e-4, dist * dist - p0.size * p0.size)) / Math.tan(fov / 2) * h / 2;
          halo = { c: [(cw[0] / cw[2] * 0.5 + 0.5) * w, (cw[1] / cw[2] * 0.5 + 0.5) * h], rad, atm: 1, tint: sc.halo, sun: [0.8, 0.6] };
        }
        sky.draw(mul(P, rotOnly(V)), 2 * Math.tan(fov / 2) / h, v.t, halo);
      }
      gl.enable(gl.DEPTH_TEST); gl.useProgram(prog);
      for (const p of sc.planets || []) {
        const m = planetModel(p), [r, u, f] = basisOf(p);
        // the distance-field copy is built at most once per frame (the voxel planet shows meanwhile)
        if (sdf && m.grid && (m.sdf !== undefined || !builds++)) drawSdfPlanet(sdfPlanet(m), p.pos, r, u, f, m.scale * p.size, VP, sc.eye, v.t);
        else draw(m, model(p.pos, r, u, f), VP, sc.eye, 1, m.scale * p.size, v.t);
      }
      const shipsOut = [], kitShips = [];
      for (const s of sc.ships || []) {
        const m = shipModel(s), f = norm(s.fwd), r = norm(cross(s.up || [0, 1, 0], f)), u = cross(f, r);
        const tpl = kit && ShipKit.tplOf(s.name, s.variant, s.shine);
        if (tpl && kit.ready(tpl)) {   // the scene's size is the ship's size here, whatever its scale in the game
          kitShips.push({ pos: s.pos, right: r, up: u, fwd: f, size: s.size / ShipKit.scaleOf(tpl), tpl, accent: s.accent });
          shipsOut.push({ ...s, r, u, f, scale: s.size / m.radius, engines: [] });
          continue;
        }
        draw(m, model(s.pos, r, u, f), VP, sc.eye, 0, s.size / m.radius, v.t);
        shipsOut.push({ ...s, r, u, f, scale: s.size / m.radius, engines: m.engines });
      }
      if (kitShips.length) { kit.draw(kitShips, VP, sc.eye, LW, (1 / Math.tan(fov / 2)) * h / 2); gl.useProgram(prog); }
      if (sc.fx && sc.fx.length) {
        const px = (1 / Math.tan(fov / 2)) * h / 2;
        gl.depthMask(false); gl.enable(gl.BLEND);
        for (const fx of sc.fx) {
          fx.step(v.t, shipsOut);
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); drawParts(fx.world.W.alpha, alphaProg, VP, px, v.t, fx.pos, fx.unit, 1);
          gl.blendFunc(gl.ONE, gl.ONE); drawParts(fx.world.W.add, addProg, VP, px, v.t, fx.pos, fx.unit, fx.gain || 1.6);
        }
        gl.disable(gl.BLEND); gl.depthMask(true); gl.useProgram(prog);
      }
      v.ctx.globalCompositeOperation = 'source-over';
      v.ctx.drawImage(glc, 0, 0);
      if (v.overlay) {
        const project = p => { const x = VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12], y = VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13], ww = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15]; return [(x / ww * 0.5 + 0.5) * w, (0.5 - y / ww * 0.5) * h, ww]; };
        v.ctx.save(); v.overlay(v.ctx, { t: v.t, w, h, dpr, project, ships: shipsOut, scene: sc }); v.ctx.restore();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // helpers for overlays: a glowing beam and an engine plume
  function beam(ctx, a, b, col, width, flicker = 1) {
    ctx.globalCompositeOperation = 'lighter';
    for (const [wm, al] of [[6, 0.08], [3, 0.18], [1.4, 0.5], [0.5, 1]]) {
      ctx.strokeStyle = col.replace('A', String(al * flicker)); ctx.lineWidth = width * wm; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  function glow(ctx, p, r, col) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    g.addColorStop(0, col.replace('A', '0.9')); g.addColorStop(0.3, col.replace('A', '0.35')); g.addColorStop(1, col.replace('A', '0'));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
  }
  function plumes(ctx, o, col = 'rgba(255,170,90,A)', len = 1) {
    for (const s of o.ships) for (const e of s.engines.filter((_, i) => i % 2 === 0)) {
      const wp = [0, 1, 2].map(i => s.pos[i] + (s.r[i] * e[0] + s.u[i] * e[1] + s.f[i] * e[2]) * s.scale);
      const tail = wp.map((v, i) => v - s.f[i] * s.size * 0.5 * len);
      const a = o.project(wp), b = o.project(tail);
      if (a[2] <= 0) continue;
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, col.replace('A', '0.8')); g.addColorStop(1, col.replace('A', '0'));
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = g; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, s.size * 40 / a[2] * o.dpr * 0.6); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  /*
    armory({ planet, list: [[weapon name, shine], ...], every?, delay?, spread?, nearScale?, shooters?, aimDir?, scatter?, viewDir?, burst?, turn? })
    Fires Alien Worlds weapons (aw-designs.js ARMS) from the scene's ships, one after another, at
    the planet's pit (or aimDir). Put the result in scene.fx. Craters are visual only here.
    burst: { shots, gap } fires the weapon as the game does: a quick burst of single shots
    (AWDesign.shotOf) from one ship at one spot, then waits 'every'.
    turn: seconds the firing ship gets to turn towards its target first. While it turns and fires,
    arm.focus = { ship, p (world), until } says which ship should face where; the scene steers it.
  */
  function armory(cfg) {
    const P = cfg.planet, def = PlanetKit.PLANETS.find(x => x.name === P.name || (x.aka || []).includes(P.name)), sc = def.scale || 0.92, R = P.R || 26;
    const unit = () => P.size * sc;
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], jit = s => [(Math.random() - 0.5) * 2 * s, (Math.random() - 0.5) * 2 * s, (Math.random() - 0.5) * 2 * s];
    const toL = w => [0, 1, 2].map(i => (w[i] - P.pos[i]) / unit());
    const pitW = () => P.pit ? norm(sub(surface(P, P.pit.dir, 1), P.pos)) : null;
    const surf = dir => {
      const d = norm(dir), pw = pitW(); let r = 1;
      // only the open middle of the mine is deep; its sloped edge counts as ground, so nothing clips the wall
      if (pw) { const ang = Math.acos(Math.max(-1, Math.min(1, dot(d, pw)))), angM = Math.asin(Math.min(1, P.pit.r / R)) * 0.55; if (ang < angM) r = 1 - (P.pit.depth / R) * (1 - ang / angM) * 0.85; }
      return { dir: d, n: d, p: d.map(v => v * r) };
    };
    const arm = { pos: P.pos, unit: unit(), gain: cfg.gain, ships: [], last: null, next: cfg.delay ?? 0.5, k: 0 };
    // nearScale shrinks how far multi-hit weapons scatter around the target (keeps them in view)
    arm.world = WeaponKit.createWorld({ particleCap: 3000, surface: d => surf(d), dirOf: p => norm(p), surfaceRadius: () => 1, aim: tag => tag.aim, spread: () => cfg.nearScale ?? 1,
      ship: tag => { const s = arm.ships[tag.ship % arm.ships.length]; return { pos: toL(s.pos), fwd: s.f, up: s.u, right: s.r, nose: toL(s.pos.map((v, i) => v + s.f[i] * s.size * 0.5)) }; },
      crater() {}, scorch() {} });
    arm.step = (t, ships) => {
      arm.ships = ships; arm.pos = P.pos; arm.unit = unit();
      const dt = arm.last == null ? 0 : Math.max(0, Math.min(0.05, t - arm.last)); arm.last = t;
      arm.world.update(dt);
      if (t < arm.next || !ships.length) return;
      const [name, shine] = cfg.list[arm.k % cfg.list.length], data = AW_DATA.arms.find(a => a.name === name);
      // a clear shot: the ship is on the target's side of the planet and the straight line from its
      // nose to the target stays outside the rock (the open middle of a mine counts as open)
      const clear = (i, base, aim) => {
        const s = ships[i], n = toL(s.pos.map((v, j) => v + s.f[j] * s.size * 0.5)), dl = sub(aim.p, n);
        if (dot(norm(n), base) < (cfg.scatter ? 0.25 : 0.45)) return false;
        const pw = pitW(), cosPit = pw ? Math.cos(Math.asin(Math.min(1, P.pit.r / R)) * 0.55) : 2;
        // check the line up to just before the target (an angled shot grazes the ground there)
        const uMax = Math.min(0.99, 1 - 0.06 / Math.max(1e-6, Math.hypot(...dl)));
        for (let u = 0; u <= uMax; u += 0.01) {
          const q = [n[0] + dl[0] * u, n[1] + dl[1] * u, n[2] + dl[2] * u], r = Math.hypot(...q);
          if (r < 1.0 && !(pw && dot(q, pw) / r > cosPit)) return false;
        }
        return true;
      };
      const order = cfg.shooters || ships.map((_, i) => i);
      let who = -1, aim = null;
      if (arm.left > 0 || arm.ready) {   // turned and ready, or the rest of a burst: same ship, same spot, while the line stays clear
        const i = arm.bWho % ships.length;
        if (clear(i, arm.bAim.dir, arm.bAim)) { who = i; aim = arm.bAim; }
        else { arm.left = 0; arm.ready = false; if (arm.focus) arm.focus.until = t; }
      }
      if (who >= 0) { /* continuing the burst */ }
      else if (cfg.scatter) {
        // a different spot every shot: anywhere on the side the viewer sees (within cfg.scatter
        // radians of the view direction), fired by whichever ship has a clear line to it
        const view = norm(cfg.viewDir || [0, 0, 1]), [vu, vv] = (() => { const a = Math.abs(view[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = norm(cross(a, view)); return [u, cross(view, u)]; })();
        for (let tries = 0; tries < 8 && who < 0; tries++) {
          const ang = Math.acos(1 - Math.random() * (1 - Math.cos(cfg.scatter))), phi = Math.random() * Math.PI * 2;
          const base = norm([0, 1, 2].map(k => view[k] * Math.cos(ang) + (vu[k] * Math.cos(phi) + vv[k] * Math.sin(phi)) * Math.sin(ang)));
          const a = surf(base);
          for (let j = 0; j < order.length && who < 0; j++) { const i = order[(arm.k + j) % order.length] % ships.length; if (clear(i, base, a)) { who = i; aim = a; } }
        }
      } else {
        const base = cfg.aimDir ? norm(cfg.aimDir) : pitW() || [0, 0, 1];
        const a = surf(add(base, jit(cfg.spread ?? 0.08)));
        for (let j = 0; j < order.length && who < 0; j++) { const i = order[(arm.k + j) % order.length] % ships.length; if (clear(i, base, a)) { who = i; aim = a; } }
      }
      if (who < 0) { arm.next = t + 0.15; return; }   // nobody has a clear shot right now
      if (cfg.turn && !arm.ready && !(arm.left > 0)) {   // first the ship turns to face the target
        arm.ready = true; arm.bWho = who; arm.bAim = aim;
        arm.focus = { ship: who, p: [0, 1, 2].map(k => P.pos[k] + aim.p[k] * arm.unit), until: Infinity };
        arm.next = t + cfg.turn;
        return;
      }
      arm.ready = false;
      const tag = { ship: who, aim };
      const A = arm.world.api(tag);
      const fire = cfg.burst ? AWDesign.shotOf(name) : AWDesign.ARMS[name];
      try { fire(A, AWDesign.makeTier(A, data.rarity, shine || 'Stone', data.class)); } catch (e) { console.error(name, e); }
      if (cfg.burst) {
        if (!(arm.left > 0)) { arm.left = cfg.burst.shots; arm.bWho = who; arm.bAim = aim; }
        if (--arm.left > 0) { arm.next = t + (cfg.burst.gap ?? 0.14); return; }
      }
      if (arm.focus) arm.focus.until = t + 0.7;   // hold the aim a moment, then back to the orbit
      arm.k++; arm.next = t + (cfg.every ?? 1.8);
    };
    return arm;
  }
  return { ok: true, view, beam, glow, plumes, surface, armory, norm, cross, sub };
})();
