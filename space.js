'use strict';
/*
  Space backdrop shared by the game and the weapon previews.

  - Nebulae, the Milky Way band with dust lanes, distant spiral galaxies and faint
    star dust are baked once into a cubemap (noise is too costly to run per pixel
    every frame).
  - Stars are drawn per frame on top, in three layers, so they stay pin-sharp at any
    resolution; the brightest also go into the glow buffer and get a bloom halo.
  - draw() writes both render targets (colour, glow) like every other pass.
    Optionally it adds a halo around the planet's silhouette.
*/
const SpaceSky = (() => {
  const NOISE = `
uint hu(uvec3 v) {
  uint h = v.x * 0x8da6b343u ^ v.y * 0xd8163841u ^ v.z * 0xcb1ab31fu;
  h ^= h >> 15; h *= 0x2c1b3c6du; h ^= h >> 12; h *= 0x297a2d39u; h ^= h >> 15;
  return h;
}
float h3(vec3 p) { return float(hu(uvec3(ivec3(floor(p)) + 4096)) & 0xffffu) / 65535.0; }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float t = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { t += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 4.1); a *= 0.5; }
  return t / 0.97;
}`;

  const FULL_VS = `#version 300 es
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)) * 2.0 - 1.0;
  vNdc = p;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

  // ---- one face of the cubemap
  const BAKE_FS = `#version 300 es
precision highp float;
uniform vec3 uFX, uFY, uFZ;   // this face: direction = FZ + s * FX + t * FY
uniform float uSize;
out vec4 o;
${NOISE}
vec3 galaxy(vec3 d, vec3 c, float rad, float tilt, float spin, vec3 tint) {
  float facing = step(0.9, dot(d, c));   // branchless: ANGLE on D3D11 dislikes early returns in fragment shaders
  vec3 u = normalize(cross(c, abs(c.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0))), v = cross(c, u);
  vec2 p = vec2(dot(d, u), dot(d, v)) / rad;
  float cs = cos(spin), sn = sin(spin);
  p = mat2(cs, -sn, sn, cs) * p;
  p.y /= tilt;
  float r = length(p), th = atan(p.y, p.x);
  float arms = 0.5 + 0.5 * cos(2.0 * (th - log(r + 0.05) * 2.6));
  float disk = exp(-r * 3.2) * (0.25 + 0.75 * arms * smoothstep(0.05, 0.3, r));
  float core = exp(-r * r * 60.0);
  return (tint * disk * 0.9 + vec3(1.0, 0.92, 0.8) * core * 1.2) * facing;
}
void main() {
  vec2 st = gl_FragCoord.xy / uSize * 2.0 - 1.0;
  vec3 d = normalize(uFZ + st.x * uFX + st.y * uFY);
  vec3 col = vec3(0.004, 0.005, 0.011);

  // the Milky Way: a soft band with clumps and dark dust lanes
  vec3 B = normalize(vec3(0.32, 0.86, -0.4));
  float b = dot(d, B);
  float band = exp(-b * b * 12.0);
  float clumps = fbm(d * 3.2 + 7.0);
  float lanes = smoothstep(0.48, 0.68, fbm(d * 5.5 + 3.0)) * exp(-b * b * 40.0);
  vec3 mw = mix(vec3(0.42, 0.42, 0.58), vec3(0.95, 0.78, 0.58), exp(-b * b * 60.0));
  col += mw * band * (0.25 + 0.75 * clumps * clumps) * (1.0 - 0.85 * lanes) * 0.16;

  // nebulae: big soft clouds with brighter wisps
  vec3 N1 = normalize(vec3(-0.75, 0.25, -0.6)), N2 = normalize(vec3(0.55, -0.35, -0.75)), N3 = normalize(vec3(0.2, 0.55, 0.8));
  float a1 = acos(clamp(dot(d, N1), -1.0, 1.0)), a2 = acos(clamp(dot(d, N2), -1.0, 1.0)), a3 = acos(clamp(dot(d, N3), -1.0, 1.0));
  float w1 = exp(-a1 * a1 / 0.35), w2 = exp(-a2 * a2 / 0.25), w3 = exp(-a3 * a3 / 0.12);
  float n1 = fbm(d * 3.0 + 11.0), n2 = fbm(d * 4.0 + 23.0), n3 = fbm(d * 5.0 + 37.0);
  float wisp = fbm(d * 9.0 + 51.0);
  col += vec3(0.55, 0.16, 0.65) * w1 * pow(max(n1 - 0.25, 0.0), 1.3) * 2.4;
  col += vec3(1.0, 0.42, 0.55) * w1 * pow(max(n1 * wisp - 0.25, 0.0), 1.1) * 2.2;
  col += vec3(0.1, 0.42, 0.62) * w2 * pow(max(n2 - 0.24, 0.0), 1.3) * 2.3;
  col += vec3(0.45, 0.9, 0.85) * w2 * pow(max(n2 * wisp - 0.25, 0.0), 1.1) * 1.4;
  col += vec3(0.9, 0.5, 0.18) * w3 * pow(max(n3 - 0.28, 0.0), 1.2) * 2.0;
  // dark dust silhouetted against the clouds
  col *= 1.0 - 0.6 * smoothstep(0.55, 0.75, fbm(d * 7.0 + 71.0)) * max(max(w1, w2), w3);

  // distant galaxies
  col += galaxy(d, normalize(vec3(0.8, 0.45, 0.3)), 0.06, 0.45, 0.7, vec3(0.75, 0.8, 1.0));
  col += galaxy(d, normalize(vec3(-0.3, -0.7, 0.6)), 0.04, 0.8, 2.1, vec3(1.0, 0.85, 0.7));
  col += galaxy(d, normalize(vec3(-0.6, 0.7, 0.3)), 0.025, 0.3, 1.2, vec3(0.8, 0.85, 1.0));
  col += galaxy(d, normalize(vec3(0.1, 0.1, -1.0)), 0.035, 0.6, 2.8, vec3(0.9, 0.8, 1.0));
  col += galaxy(d, normalize(vec3(0.9, -0.3, -0.4)), 0.018, 0.9, 0.3, vec3(1.0, 0.9, 0.8));

  // unresolved star dust, thicker in the band
  col += vec3(0.6, 0.65, 0.8) * pow(vnoise(d * 520.0), 16.0) * (0.1 + band) * 0.35;
  o = vec4(col, 1.0);
}`;

  // ---- per frame: cubemap + sharp stars (+ optional planet halo)
  const SKY_FS = `#version 300 es
precision highp float;
uniform samplerCube uSky;
uniform mat4 uInvVP;     // inverse of projection * view rotation
uniform float uPix;      // angular size of one pixel
uniform float uT;
uniform vec2 uC;         // planet halo: centre (px), radius (px), strength, tint, sun direction on screen
uniform float uRad, uAtm;
uniform vec3 uTint;
uniform vec2 uSun;
in vec2 vNdc;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oGlow;
${NOISE}
vec3 starLayer(vec3 d, float grid, float density, float size, float bright, float salt, out float glow) {
  vec3 a = abs(d);
  float mx = step(max(a.y, a.z), a.x);
  float my = (1.0 - mx) * step(a.z, a.y);
  float mz = 1.0 - mx - my;
  vec2 uv = mx * d.yz / a.x + my * d.xz / a.y + mz * d.xy / a.z;
  float face = mx * (0.5 + 0.5 * sign(d.x)) + my * (2.5 + 0.5 * sign(d.y)) + mz * (4.5 + 0.5 * sign(d.z));
  vec2 g = (uv * 0.5 + 0.5) * grid, cell = floor(g), f = fract(g);
  vec3 key = vec3(cell, face * 131.0 + salt);
  float h = h3(key);
  float on = step(h, density);
  vec2 pos = vec2(h3(key + 17.0), h3(key + 29.0)) * 0.8 + 0.1;
  float dist = length(f - pos) * 2.0 / grid;
  float s = max(size * (0.6 + 0.8 * h3(key + 41.0)), uPix * 0.7);
  float k = exp(-dist * dist / (s * s));
  float temp = h3(key + 53.0);
  vec3 tint = mix(mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.97, 0.92), step(0.25, temp)), vec3(1.0, 0.75, 0.5), step(0.8, temp));
  float tw = 0.85 + 0.15 * sin(uT * (1.5 + 3.0 * h3(key + 67.0)) + h * 60.0);
  float lum = bright * (0.35 + 0.65 * h3(key + 79.0)) * tw * on;
  glow = k * lum * step(0.85, h3(key + 79.0));
  return tint * k * lum;
}
void main() {
  vec4 wp = uInvVP * vec4(vNdc, 1.0, 1.0);
  vec3 d = normalize(wp.xyz / wp.w);
  vec3 col = texture(uSky, d).rgb;
  float g0, g1, g2;
  col += starLayer(d, 60.0, 0.10, uPix * 1.5, 2.4, 1.0, g0);
  col += starLayer(d, 160.0, 0.10, uPix * 0.95, 1.0, 2.0, g1);
  col += starLayer(d, 380.0, 0.07, uPix * 0.75, 0.5, 3.0, g2);
  // planet halo
  vec2 dv = gl_FragCoord.xy - uC;
  float dd = length(dv);
  float x = max(dd - uRad, 0.0) / max(uRad, 1.0);
  float lit = 0.35 + 0.65 * max(dot(dv / max(dd, 1.0), uSun), 0.0);
  col += uTint * exp(-x * 11.0) * 0.4 * lit * uAtm;
  // dither against banding in the dark gradients
  col += (h3(vec3(gl_FragCoord.xy, uT * 60.0)) - 0.5) / 255.0;
  o = vec4(col, 1.0);
  oGlow = vec4(vec3(1.0, 0.97, 0.92) * g0 * 0.6, 1.0);
}`;

  function invert(m) {
    const a = m, o = new Float32Array(16);
    const b00 = a[0]*a[5]-a[1]*a[4], b01 = a[0]*a[6]-a[2]*a[4], b02 = a[0]*a[7]-a[3]*a[4], b03 = a[1]*a[6]-a[2]*a[5];
    const b04 = a[1]*a[7]-a[3]*a[5], b05 = a[2]*a[7]-a[3]*a[6], b06 = a[8]*a[13]-a[9]*a[12], b07 = a[8]*a[14]-a[10]*a[12];
    const b08 = a[8]*a[15]-a[11]*a[12], b09 = a[9]*a[14]-a[10]*a[13], b10 = a[9]*a[15]-a[11]*a[13], b11 = a[10]*a[15]-a[11]*a[14];
    const det = 1 / (b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
    o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*det; o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*det; o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*det; o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*det;
    o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*det; o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*det; o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*det; o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*det;
    o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*det; o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*det; o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*det; o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*det;
    o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*det; o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*det; o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*det; o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*det;
    return o;
  }
  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, FULL_VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // size: cubemap face resolution (soft content, so 768 is plenty)
  function create(gl, size = 768) {
    const bake = program(gl, BAKE_FS), sky = program(gl, SKY_FS);
    const vao = gl.createVertexArray();
    const cube = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
    gl.texStorage2D(gl.TEXTURE_CUBE_MAP, 1, gl.RGBA8, size, size);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.useProgram(bake);
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, size, size);
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1f(gl.getUniformLocation(bake, 'uSize'), size);
    // GL cubemap face orientation: [s axis, t axis, face normal]
    const FACES = [[[0, 0, -1], [0, -1, 0], [1, 0, 0]], [[0, 0, 1], [0, -1, 0], [-1, 0, 0]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]],
                   [[1, 0, 0], [0, 0, -1], [0, -1, 0]], [[1, 0, 0], [0, -1, 0], [0, 0, 1]], [[-1, 0, 0], [0, -1, 0], [0, 0, -1]]];
    for (let f = 0; f < 6; f++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, cube, 0);
      gl.uniform3fv(gl.getUniformLocation(bake, 'uFX'), FACES[f][0]);
      gl.uniform3fv(gl.getUniformLocation(bake, 'uFY'), FACES[f][1]);
      gl.uniform3fv(gl.getUniformLocation(bake, 'uFZ'), FACES[f][2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.bindVertexArray(null);

    const U = n => gl.getUniformLocation(sky, n);
    const loc = { sky: U('uSky'), inv: U('uInvVP'), pix: U('uPix'), t: U('uT'), c: U('uC'), rad: U('uRad'), atm: U('uAtm'), tint: U('uTint'), sun: U('uSun') };
    return {
      // projRot: projection * view rotation (no translation); pix: radians per pixel
      draw(projRot, pix, t, halo) {
        gl.useProgram(sky);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
        gl.uniform1i(loc.sky, 0);
        gl.uniformMatrix4fv(loc.inv, false, invert(projRot));
        gl.uniform1f(loc.pix, pix);
        gl.uniform1f(loc.t, t);
        gl.uniform2fv(loc.c, halo ? halo.c : [0, 0]);
        gl.uniform1f(loc.rad, halo ? halo.rad : 1);
        gl.uniform1f(loc.atm, halo ? halo.atm : 0);
        gl.uniform3fv(loc.tint, halo ? halo.tint : [0, 0, 0]);
        gl.uniform2fv(loc.sun, halo ? halo.sun : [1, 0]);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
      },
    };
  }
  return { create };
})();
