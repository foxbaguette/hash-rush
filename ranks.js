/* The Hash Rush: ranks for players who have found the hash (hash_found in their playerstats).
   Ranks 1 to 5 are chevrons, 6 to 10 stars, 11 to 20 pilot wings. Past 20 the same twenty symbols
   climb through ten colours, one per twenty hashes, up to 200, the top. */
const Ranks = (() => {
  const NAMES = ['Recruit', 'Rockhand', 'Digger', 'Driller', 'Blaster', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Foreman', 'Warrant Officer',
    'Ensign', 'Lieutenant', 'Captain', 'Major', 'Commander', 'Colonel', 'Commodore', 'General', 'Marshal', 'Hashwarden'];
  const TIERS = [
    { name: 'Steel', c: '#a9b2bc', d: '#4b535c' }, { name: 'Bronze', c: '#c98d4f', d: '#5e3b17' }, { name: 'Copper', c: '#e0764a', d: '#6b2a12' },
    { name: 'Silver', c: '#e6ebf1', d: '#6c7480' }, { name: 'Gold', c: '#f5c84f', d: '#7a5306' }, { name: 'Jade', c: '#43d69e', d: '#0d5a3c' },
    { name: 'Azure', c: '#45bdff', d: '#0b4a75' }, { name: 'Violet', c: '#ad82ff', d: '#3d1f80' }, { name: 'Crimson', c: '#ff5070', d: '#6e0f22' },
    { name: 'Prismatic', prism: true, d: '#2a1a3a' },
  ];

  /** How many hashes a player row has found (0 if none). */
  function hashesOf(p) {
    const stats = p && Array.isArray(p.playerstats) ? p.playerstats : [];
    const s = stats.find(x => (x.n ?? x.key ?? x.first) === 'hash_found');
    return s ? Number(s.v ?? s.value ?? s.second) || 0 : 0;
  }
  /** hashes -> { s: symbol 0..19, t: colour 0..9 }, or null below 1 */
  function rankOf(n) {
    if (!(n >= 1)) return null;
    const k = Math.min(200, Math.floor(n)) - 1;
    return { s: k % 20, t: Math.floor(k / 20) };
  }
  const title = n => { const r = rankOf(n); return r ? (r.t ? TIERS[r.t].name + ' ' : '') + NAMES[r.s] : ''; };

  // ---- drawing (a 40 x 40 badge)
  // The badge is tiny (16 to 24 px), so every symbol fills the box with bold shapes, and a near-black
  // outline drawn under the fill keeps it readable on any sky, planet or panel.
  const OUT = '#05060a';
  const shape = (d, f) => `<path d="${d}" fill="${f}" stroke="${OUT}" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"/>`;
  const n2 = v => v.toFixed(2);
  const star = (x, y, r, f) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r; p += (i ? 'L' : 'M') + n2(x + Math.cos(a) * rr) + ' ' + n2(y + Math.sin(a) * rr); } return shape(p + 'Z', f); };
  const chev = (y, t, dip, f) => shape(`M4 ${n2(y)} L20 ${n2(y + dip)} L36 ${n2(y)} L36 ${n2(y + t)} L20 ${n2(y + dip + t)} L4 ${n2(y + t)}Z`, f);
  const crown = (y, f) => shape(`M11 ${y} L12.5 ${y - 8} L16.5 ${y - 3} L20 ${y - 9.5} L23.5 ${y - 3} L27.5 ${y - 8} L29 ${y}Z`, f);
  // star layouts for 1 to 5 stars: [x, y, r]
  const STARS = [[[20, 21, 16]], [[11, 21, 9.5], [29, 21, 9.5]], [[20, 11.5, 8.5], [11, 27.5, 8.5], [29, 27.5, 8.5]],
    [[11, 11.5, 8], [29, 11.5, 8], [11, 28.5, 8], [29, 28.5, 8]], [[10, 10.5, 7.5], [30, 10.5, 7.5], [10, 29.5, 7.5], [30, 29.5, 7.5], [20, 20.5, 8.5]]];
  function symbol(s, f) {
    if (s < 5) {   // 1-5 chevrons, stacked and centred; fewer chevrons are thicker
      const n = s + 1, t = [9, 7, 5.6, 4.8, 4.2][s], dip = 8, gap = t * 0.45, h = n * t + (n - 1) * gap + dip;
      let o = ''; for (let i = 0; i < n; i++) o += chev(20 - h / 2 + i * (t + gap), t, dip, f); return o;
    }
    if (s < 10) return STARS[s - 5].map(([x, y, r]) => star(x, y, r, f)).join('');   // 6-10 stars
    // 11-20 pilot wings: feathers either side of a star (16-20 add a crown); more feathers, higher rank
    const g = s < 15 ? 2 : 3, m = (s - 10) % 5 + 2, sy = g === 2 ? 20 : 25, th = m <= 3 ? 4.8 : m <= 4 ? 3.9 : 3.3, total = m * (th + 0.9);
    let o = '';
    for (const side of [-1, 1]) for (let i = 0; i < m; i++) {
      const c = 20 + side * 5, len = 15 - i * (7 / m), y = sy - total / 2 + 1 + i * (th + 0.9);
      o += shape(`M${c} ${n2(y)} L${n2(c + side * len)} ${n2(y - 2.5)} L${n2(c + side * (len - 2))} ${n2(y + th - 1)} L${c} ${n2(y + th)}Z`, f);
    }
    return g === 2 ? o + star(20, sy, 9.5, f) : o + star(20, sy, 8, f) + crown(15, f);
  }
  let uid = 0;
  /** The badge as an SVG string for this many hashes ('' for none). */
  function badge(n, cls = 'rank') {
    const r = rankOf(n);
    if (!r) return '';
    const T = TIERS[r.t], id = 'rk' + (uid++);
    const defs = T.prism ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset=".35" stop-color="#ffd36b"/><stop offset=".65" stop-color="#5ff0dc"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs>` : '';
    return `<svg class="${cls}" viewBox="0 0 40 40" role="img" aria-label="${title(n)}">${defs}${symbol(r.s, T.prism ? `url(#${id})` : T.c, T.d)}</svg>`;
  }
  return { NAMES, TIERS, hashesOf, rankOf, title, badge };
})();
