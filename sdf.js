/* The Hash Rush: an alternative look for the game's planet and ships, drawn as distance fields.
   The planet's cell grid and every ship's voxels are turned into 3D textures (how solid each cell
   is, a blurred copy of that for the melted shapes, and its colour); a shader marches rays through them inside each object's bounding box and
   finds a surface anywhere between hard blocks and smooth, melted shapes. It writes real depth,
   so shots, smoke and labels sit in front of or behind it as before. */
const SdfKit = (() => {
  // the settings the in-game sliders change (planet and ships each have their own shape)
  const DEFAULTS = {
    planet: { smooth: 1, soft: 0.75, round: 0, noise: 0, colBlend: 0.84, sphere: 0.34, tex: 1, texScale: 1, slope: 0.16, gloss: 0.12 },
    ship: { smooth: 0.41, soft: 0, round: 0, noise: 0, colBlend: 0.42, sphere: 0, gloss: 0 },
    step: 0.5, ao: 0.08, atmo: 0.5, atmoWide: 2.95, atmoEdge: 1.06, atmoSoft: 1,
  };

  const VS = `#version 300 es
precision highp float;
uniform mat4 uMVP;
uniform vec3 uBoxMin, uBoxMax;
out vec3 vP;
const int IDX[36] = int[36](0,1,3, 0,3,2, 4,6,7, 4,7,5, 0,4,5, 0,5,1, 2,3,7, 2,7,6, 0,2,6, 0,6,4, 1,5,7, 1,7,3);
void main() {
  int c = IDX[gl_VertexID];
  vP = mix(uBoxMin, uBoxMax, vec3(float(c & 1), float((c >> 1) & 1), float((c >> 2) & 1)));
  gl_Position = uMVP * vec4(vP, 1.0);
}`;

  const FS = (planet, SLOTS) => `#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;
precision highp usampler3D;
uniform mat4 uMVP;
uniform vec3 uCamM, uLight;            // model space
uniform vec3 uBoxMin, uBoxMax;
uniform vec3 uOrigin, uDims;           // grid: g = (p - uOrigin) / uCell, cells 0 .. uDims
uniform float uCell, uBound;
uniform sampler3D uDens, uSoftD, uCol;   // solidness per cell, the same blurred (melt), colour
uniform float uSmooth, uSoft, uRound, uNoise, uColBlend, uSphere, uStep, uAO, uT;
uniform float uGloss;                    // highlights and sheen: 1 as the blocks have them, 0 fully matte
uniform float uTex, uTexScale, uSlope;   // planet ground texture: strength, scale, bare rock on steep ground
${planet ? `uniform usampler3D uMask;
uniform sampler3D uHeatT, uHeatC;
uniform float uSlotT[${SLOTS}], uMelt;` : ''}
in vec3 vP;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oGlow;

float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float dens(vec3 g) { return texture(uSoftD, g / uDims).r; }
ivec3 cellOf(vec3 g) { return clamp(ivec3(floor(g)), ivec3(0), ivec3(uDims) - 1); }
// smooth: the blurred solidness; its 0.5 contour is the surface
float fSmooth(vec3 g) { return (0.5 - dens(g)) * (1.0 + uSoft); }
// blocks: a rounded box in every solid cell (melting cells shrink)
float fBox(vec3 g) {
  vec3 c = floor(g);
  float occ = texelFetch(uDens, cellOf(g), 0).r;
  if (occ < 0.02) return 0.5;
  float hs = 0.5 * pow(occ, 0.333), r = min(uRound, hs * 0.95);
  vec3 q = abs(g - c - 0.5) - vec3(hs - r);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float field(vec3 g) {
  float f = uSmooth >= 0.999 ? fSmooth(g) : uSmooth <= 0.001 ? fBox(g) : mix(fBox(g), fSmooth(g), uSmooth);
  if (uNoise > 0.0) f += (vnoise(g * 1.3) - 0.5) * uNoise * 2.0;
  return f;
}
float is(float m, float k) { return 1.0 - min(abs(m - k), 1.0); }
float fbm(vec3 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(x); x = x * 2.07 + 11.3; a *= 0.5; } return s; }

void main() {
  vec3 ro = uCamM, rd = normalize(vP - uCamM);
  // the back faces do the marching (that also works with the camera inside the box)
  vec3 cen = (uBoxMin + uBoxMax) * 0.5, lp = (vP - cen) / ((uBoxMax - uBoxMin) * 0.5), a = abs(lp);
  vec3 fn = step(max(a.yzx, a.zxy), a) * sign(lp);
  if (dot(fn, uCamM - vP) > 0.0) discard;
  vec3 inv = 1.0 / rd, t0 = (uBoxMin - ro) * inv, t1 = (uBoxMax - ro) * inv, tmin = min(t0, t1), tmax = max(t0, t1);
  float tn = max(max(max(tmin.x, tmin.y), tmin.z), 0.0), tf = min(min(tmax.x, tmax.y), tmax.z);
  if (uBound > 0.0) {   // the planet: only inside its bounding sphere
    float b = dot(ro, rd), c = dot(ro, ro) - uBound * uBound, disc = b * b - c;
    if (disc < 0.0) discard;
    float sq = sqrt(disc);
    tn = max(tn, -b - sq); tf = min(tf, -b + sq);
  }
  if (tn >= tf) discard;

  // march in grid units, then narrow the crossing down
  vec3 go = (ro - uOrigin) / uCell, gd = rd / uCell;
  float dt = uStep * uCell, t = tn, tl = tn;
  bool hit = field(go + gd * t) < 0.0;
  for (int i = 0; i < 480 && !hit; i++) {
    t += dt;
    if (t > tf) break;
    if (field(go + gd * t) < 0.0) hit = true; else tl = t;
  }
  if (!hit) discard;
  float a0 = tl, a1 = t;
  for (int i = 0; i < 6; i++) { float m = (a0 + a1) * 0.5; if (field(go + gd * m) < 0.0) a1 = m; else a0 = m; }
  t = a1;
  vec3 g = go + gd * t, p = ro + rd * t;
  float e = mix(0.04, 0.3, uSmooth);
  vec3 n = normalize(vec3(field(g + vec3(e, 0, 0)) - field(g - vec3(e, 0, 0)),
                          field(g + vec3(0, e, 0)) - field(g - vec3(0, e, 0)),
                          field(g + vec3(0, 0, e)) - field(g - vec3(0, 0, e))) + 1e-6);

  // the cell just under the surface gives the colour and material
  vec3 gi = g - n * 0.35;
  ivec3 ic = cellOf(gi);
  vec4 cn = texelFetch(uCol, ic, 0);
  vec3 base = mix(cn.rgb, texture(uCol, gi / uDims).rgb, uColBlend);
  uint mg = uint(cn.a * 255.0 + 0.5);
  float mat = float(mg >> 5u), glow = float(mg & 31u) / 31.0;
  float rnd = h31(vec3(ic) + 0.37);
  float lava = is(mat, 1.0), crystal = is(mat, 2.0), water = is(mat, 3.0), ice = is(mat, 4.0), metal = is(mat, 5.0), energy = is(mat, 6.0);
  float plain = max(0.0, 1.0 - crystal - water - ice - metal);
${planet ? `
  // the ground texture: grain and broad colour patches everywhere, speckled grass, rippled sand,
  // bare rock wherever the ground is steep (crater walls, cliffs), and fine bumps that catch the light
  if (uTex > 0.0) {
    vec3 q = p * 40.0 * uTexScale;
    float detail = fbm(q), macro = fbm(p * 3.0 * uTexScale), grain = vnoise(p * 170.0 * uTexScale);
    float lum = dot(base, vec3(0.3, 0.59, 0.11));
    float green = clamp((base.g - max(base.r, base.b)) * 5.0, 0.0, 1.0);
    float sandy = clamp((base.r - base.b) * 3.0 - green * 2.0, 0.0, 1.0) * step(0.3, lum);
    float slope = 1.0 - max(dot(n, normalize(p)), 0.0);
    vec3 tex = base * (0.8 + 0.4 * detail) * (0.88 + 0.24 * macro);
    tex *= mix(1.0, 0.78 + 0.44 * grain, green * (1.0 - ice));
    float rip = sin(dot(p, vec3(71.0, 17.0, 43.0)) * uTexScale + detail * 7.0);
    tex *= mix(1.0, 0.9 + 0.1 * rip, sandy);
    vec3 rock = mix(vec3(0.34, 0.31, 0.28), vec3(0.52, 0.48, 0.42), detail) * (0.8 + 0.4 * macro) * (0.6 + 0.7 * lum);
    float cliff = smoothstep(0.3, 0.65, slope + (detail - 0.5) * 0.35) * uSlope * (1.0 - lava) * (1.0 - energy) * (1.0 - ice * 0.7);
    tex = mix(tex, rock, cliff);
    base = mix(base, tex, uTex);
    vec3 grad = vec3(fbm(q + vec3(0.2, 0, 0)), fbm(q + vec3(0, 0.2, 0)), fbm(q + vec3(0, 0, 0.2))) - detail;
    n = normalize(n - (grad - n * dot(grad, n)) * (0.9 + cliff) * uTex);
  }` : ''}
${planet ? `
  uint m = texelFetch(uMask, ic, 0).r;
  float heat;
  if (m > 0u && m < 254u) heat = 1.0;
  else { float age = uT - texelFetch(uHeatT, ic, 0).r; heat = min(1.0, exp(-age * 1.1) + 0.8 * exp(-age * 9.0)); }
  vec3 gm = (vec3(ic) + 0.5) / uDims * 2.0 - 1.0;
  float churn = sin(dot(gm, vec3(5.3, 4.1, 6.7)) * 2.5 + uT * 0.7) * sin(dot(gm, vec3(-3.7, 6.1, 2.3)) * 2.0 - uT * 0.5);
  float kk = 1.0 + lava * (0.18 * sin(uT * 2.3 + rnd * 6.28) + 0.35 * churn) + energy * 0.15 * sin(uT * 1.5 + rnd * 6.28);
  vec3 hot = mix(base, vec3(1.0, 0.85, 0.5), lava * max(churn, 0.0) * 0.5);
  vec3 em = hot * glow * 1.4 * kk + texelFetch(uHeatC, ic, 0).rgb * 1.7 * heat + vec3(1.2, 1.0, 0.85) * pow(heat, 4.0) * 1.4;` : `
  vec3 em = base * glow * 1.5 * (1.0 + energy * 0.25 * sin(uT * 23.0 + rnd * 6.28));`}

  // light, as the blocks are lit, with ambient occlusion from the solidness around
  float occ = clamp((dens(g + n * 0.9) - 0.15) * 1.3 + dens(g + n * 1.8) * 0.8, 0.0, 1.0);
  float ao = 1.0 - uAO * occ;
  vec3 nl = normalize(n + normalize(p) * uSphere);
  vec3 V = normalize(uCamM - p);
  vec3 rip = vec3(sin(uT * 1.7 + rnd * 40.0), sin(uT * 1.3 + rnd * 57.0), sin(uT * 1.1 + rnd * 23.0)) * 0.12;
  vec3 ne = normalize(nl + rip * water);
  float d = max(dot(ne, uLight), 0.0);
  float ndh = max(dot(ne, normalize(uLight + V)), 0.0);
  float fres = pow(1.0 - max(dot(ne, V), 0.0), 4.0);
  float sp = (pow(ndh, 40.0) * 0.2 * plain + pow(ndh, 140.0) * 2.6 * crystal + pow(ndh, 90.0) * 1.8 * water
            + pow(ndh, 60.0) * 0.9 * ice + pow(ndh, 28.0) * 1.1 * metal) * smoothstep(0.0, 0.15, d) * uGloss;
  fres *= uGloss;
  vec3 col = base * (0.07 + 1.05 * d * (1.0 - 0.45 * metal)) * ao
           + sp * mix(vec3(1.0), base, metal * 0.7)
           + vec3(0.35, 0.5, 0.7) * fres * water * 0.5 + vec3(0.8, 0.9, 1.0) * fres * ice * 0.35 + base * fres * crystal * 0.6;
  col += em;
  col = col / (1.0 + col * 0.25);
  o = vec4(pow(col, vec3(0.92)), 1.0);
  oGlow = vec4(em * 0.5 + sp * (water + crystal) * 0.12, 1.0);
  vec4 clip = uMVP * vec4(p, 1.0);
  gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
}`;

  function create(gl, SLOTS) {
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = fs => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const cache = {};
      return { p, u: new Proxy(cache, { get: (c, n) => (n in c ? c[n] : (c[n] = gl.getUniformLocation(p, n))) }) };
    };
    // compiled on first use, so the voxel look costs nothing
    let planetProg = null, shipProg = null;
    const progs = () => { if (!planetProg) { planetProg = program(FS(true, SLOTS)); shipProg = program(FS(false, SLOTS)); } return { planetProg, shipProg }; };

    function tex3d(old, dims, internal, format, data, linear) {
      if (old) gl.deleteTexture(old);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, t);
      const f = linear ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, f);
      for (const w of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, w, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage3D(gl.TEXTURE_3D, 0, internal, dims[0], dims[1], dims[2], 0, format, gl.UNSIGNED_BYTE, data);
      return t;
    }
    // empty cells next to solid ones take a neighbour's colour, so blended colours never fade to black
    function dilate(col, solid, dims, passes = 2) {
      const [X, Y, Z] = dims, XY = X * Y;
      for (let pass = 0; pass < passes; pass++) {
        const add = [];
        for (let k = 0; k < Z; k++) for (let j = 0; j < Y; j++) for (let i = 0; i < X; i++) {
          const c = i + j * X + k * XY;
          if (solid[c]) continue;
          const nb = [i > 0 && c - 1, i < X - 1 && c + 1, j > 0 && c - X, j < Y - 1 && c + X, k > 0 && c - XY, k < Z - 1 && c + XY];
          for (const q of nb) if (q !== false && solid[q]) { add.push([c, q]); break; }
        }
        for (const [c, q] of add) { col.copyWithin(c * 4, q * 4, q * 4 + 4); solid[c] = 1; }
      }
    }
    // the melt: a separable blur of the solidness over the cells of box (whole grid when box is
    // left out), reading raw and writing out; outside the grid counts as empty
    function blur(raw, out, dims, soft, box) {
      const [X, Y, Z] = dims, XY = X * Y;
      const b = box || [0, 0, 0, X - 1, Y - 1, Z - 1];
      if (soft < 0.05) {
        for (let k = b[2]; k <= b[5]; k++) for (let j = b[1]; j <= b[4]; j++) { const o = j * X + k * XY; out.set(raw.subarray(o + b[0], o + b[3] + 1), o + b[0]); }
        return;
      }
      const sigma = Math.max(0.3, soft), r = Math.min(4, Math.ceil(sigma * 2));
      const w = []; let ws = 0;
      for (let i = -r; i <= r; i++) { w.push(Math.exp(-i * i / (2 * sigma * sigma))); ws += w[w.length - 1]; }
      for (let i = 0; i < w.length; i++) w[i] /= ws;
      // pass 1 along x over the box grown in y and z, pass 2 along y over the box grown in z, pass 3 along z
      const y0 = Math.max(0, b[1] - r), y1 = Math.min(Y - 1, b[4] + r), z0 = Math.max(0, b[2] - r), z1 = Math.min(Z - 1, b[5] + r);
      const bx = b[3] - b[0] + 1, by = y1 - y0 + 1, bz = z1 - z0 + 1;
      const t1 = new Float32Array(bx * by * bz), t2 = new Float32Array(bx * (b[4] - b[1] + 1) * bz);
      for (let k = z0; k <= z1; k++) for (let j = y0; j <= y1; j++) for (let i = b[0]; i <= b[3]; i++) {
        let s = 0;
        for (let q = -r; q <= r; q++) { const x = i + q; if (x >= 0 && x < X) s += raw[x + j * X + k * XY] * w[q + r]; }
        t1[(i - b[0]) + (j - y0) * bx + (k - z0) * bx * by] = s;
      }
      const ny = b[4] - b[1] + 1;
      for (let k = z0; k <= z1; k++) for (let j = b[1]; j <= b[4]; j++) for (let i = 0; i < bx; i++) {
        let s = 0;
        for (let q = -r; q <= r; q++) { const y = j + q; if (y >= y0 && y <= y1) s += t1[i + (y - y0) * bx + (k - z0) * bx * by] * w[q + r]; }
        t2[i + (j - b[1]) * bx + (k - z0) * bx * ny] = s;
      }
      for (let k = b[2]; k <= b[5]; k++) for (let j = b[1]; j <= b[4]; j++) for (let i = 0; i < bx; i++) {
        let s = 0;
        for (let q = -r; q <= r; q++) { const z = k + q; if (z >= z0 && z <= z1) s += t2[i + (j - b[1]) * bx + (z - z0) * bx * ny] * w[q + r]; }
        out[(i + b[0]) + j * X + k * XY] = Math.min(255, Math.round(s));
      }
    }
    const blurReach = soft => soft < 0.05 ? 0 : Math.min(4, Math.ceil(Math.max(0.3, soft) * 2));
    // a model's melted copy for this melt amount (redone when the slider moves)
    function modelSoft(m, soft) {
      if (m.softFor === soft) return;
      blur(m.raw, m.softData, m.dims, soft);
      gl.activeTexture(gl.TEXTURE5);
      m.soft = tex3d(m.soft, m.dims, gl.R8, gl.RED, m.softData, true);
      gl.activeTexture(gl.TEXTURE0);
      m.softFor = soft;
    }
    // a ship or projectile model: its voxels (integer positions, one cube each) as textures
    function modelTextures(pos, col) {
      const n = pos.length / 3, lo = [99, 99, 99], hi = [-99, -99, -99];
      for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], pos[i * 3 + a]); hi[a] = Math.max(hi[a], pos[i * 3 + a]); }
      const dims = [0, 1, 2].map(a => hi[a] - lo[a] + 3), [X, Y] = dims;
      const d = new Uint8Array(dims[0] * dims[1] * dims[2]), c = new Uint8Array(d.length * 4), solid = new Uint8Array(d.length);
      for (let i = 0; i < n; i++) {
        const idx = (pos[i * 3] - lo[0] + 1) + (pos[i * 3 + 1] - lo[1] + 1) * X + (pos[i * 3 + 2] - lo[2] + 1) * X * Y;
        d[idx] = 255; solid[idx] = 1; c.set(col.subarray(i * 4, i * 4 + 4), idx * 4);
      }
      dilate(c, solid, dims);
      const origin = lo.map(v => v - 1.5);
      return { dims, origin, cell: 1, box: [origin, origin.map((v, a) => v + dims[a])], raw: d, softData: new Uint8Array(d.length), softFor: null, soft: null,
        dens: tex3d(null, dims, gl.R8, gl.RED, d, false), col: tex3d(null, dims, gl.RGBA8, gl.RGBA, c, true) };
    }
    return { DEFAULTS, progs, tex3d, dilate, blur, blurReach, modelSoft, modelTextures };
  }
  return { create, DEFAULTS };
})();
