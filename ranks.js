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
  const star = (x, y, r, f, d) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(2) + ' ' + (y + Math.sin(a) * rr).toFixed(2); } return `<path d="${p}Z" fill="${f}" stroke="${d}" stroke-width=".8" stroke-linejoin="round"/>`; };
  const row = (n, y, w, fn) => { let o = ''; for (let i = 0; i < n; i++) o += fn(20 + (i - (n - 1) / 2) * w, y, i); return o; };
  const chev = (y, f, d) => `<path d="M7 ${y} L20 ${y + 5} L33 ${y} L33 ${y + 3} L20 ${y + 8} L7 ${y + 3}Z" fill="${f}" stroke="${d}" stroke-width=".8" stroke-linejoin="round"/>`;
  const dot = (x, y, r, f, d) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${d}" stroke-width=".8"/>`;
  const crown = (y, f, d) => `<path d="M12 ${y} L14 ${y - 6} L17 ${y - 2} L20 ${y - 7} L23 ${y - 2} L26 ${y - 6} L28 ${y} Z" fill="${f}" stroke="${d}" stroke-width=".8" stroke-linejoin="round"/>`;
  function symbol(s, f, d) {
    if (s < 5) { const n = s + 1; return row(n, 0, 0, (x, y, i) => chev(9 + i * 5 - (n - 1) * 2.5, f, d)); }   // 1-5 chevrons
    if (s < 10) return row(s - 4, 20, 6.6, (x, y) => star(x, y, 5, f, d));                                    // 6-10 stars
    const g = s < 15 ? 2 : 3, n = (s - 10) % 5 + 1;                                                           // 11-20 pilot wings
    let o = '';
    for (const side of [-1, 1]) for (let i = 0; i < n + 1; i++) { const w = 14 - i * 1.6, y = 17 + i * 2.6; o += `<path d="M${20 + side * 4} ${y} L${20 + side * (4 + w)} ${y - 2} L${20 + side * (4 + w - 1.5)} ${y + 1.6} L${20 + side * 4} ${y + 2}Z" fill="${f}" stroke="${d}" stroke-width=".5"/>`; }
    return g === 2 ? o + star(20, 20, 6, f, d) : o + star(20, 21, 5.5, f, d) + crown(13, f, d);
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
