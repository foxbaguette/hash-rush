// The Hash Rush, live screen: the planet being mined on planetmining, every crew that attacked in
// the last 30 minutes in orbit, the attack log replayed as it comes in, and the hangar where a
// player changes their playertag and equips crew and weapon.
import * as chain from './chain.js?v=20261020l';
import * as gains from './gains.js?v=20261020l';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = n => Number(n).toLocaleString('en-US');
const statOf = (p, name) => Number(((p && p.playerstats) || []).find(s => s.n === name)?.v || 0);
const POLL_MS = 10000;          // how often the chain is read; what happened is replayed over the next 10 s
const ACTIVE_SEC = 30 * 60;     // crews shown in orbit: attacked within the last 30 minutes
const DEFAULT_CREW = { name: 'Stealth Mercenary', rarity: 'Abundant', element: 'Neutral', variant: 0, shine: 'Stone' };
const DEFAULT_WEAPON = 'Standard Sword|Stone';

// ---------------------------------------------------------------- the cards
// every template id points at its card and shine; the hangar lists cards, shines live inside them
const TPL = new Map(), CREW_CARDS = [], ARMS_CARDS = [];
for (const g of AW_DATA.crew) g.variants.forEach((v, vi) => {
  const card = { kind: 'crew', key: 'c' + v.cardid, name: g.name, race: g.race, rarity: g.rarity, element: v.element, variant: vi, img: v.img, description: v.description, shines: v.shines };
  CREW_CARDS.push(card);
  for (const s of v.shines) for (const t of s.templates) TPL.set(t, { card, shine: s });
});
for (const a of AW_DATA.arms) {
  const card = { kind: 'arms', key: 'a' + a.cardid, name: a.name, cls: a.class, rarity: a.rarity, img: a.img, description: a.description, shines: a.shines };
  ARMS_CARDS.push(card);
  for (const s of a.shines) for (const t of s.templates) TPL.set(t, { card, shine: s });
}
// the damage the contract has stored for the template; templates it has not added yet get its formula
const damageOf = (card, s, id) => S.damage.get(id) ?? s.templates.map(t => S.damage.get(t)).find(d => d != null) ??
  s.attack + s.defense + 5 * AWDesign.rarityLevel(card.rarity) + 5 * AWDesign.shineLevel(s.shine);
const crewOf = t => t && t.card.kind === 'crew' ? { name: t.card.name, rarity: t.card.rarity, element: t.card.element, variant: t.card.variant, shine: t.shine.shine } : DEFAULT_CREW;
const weaponOf = t => t && t.card.kind === 'arms' ? t.card.name + '|' + t.shine.shine : DEFAULT_WEAPON;
const colorOf = p => /^[0-9a-f]{6}$/i.test(p.color || '') ? '#' + p.color : '#ff8a3d';
// card art from the AtomicHub resizer. It refuses requests that name another site as the referrer
// (hotlink protection: our live address gets a 403), so the images are loaded without one
const thumb = img => 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + img + '&size=370';
// if a picture still fails, the same art from other IPFS gateways (full size, so only as a fallback)
const IMG_FALLBACK = ['https://ipfs.alienworlds.io/ipfs/', 'https://gateway.pinata.cloud/ipfs/'];
document.addEventListener('error', e => {
  const im = e.target;
  if (!(im instanceof HTMLImageElement) || !im.dataset.ipfs) return;
  const n = Number(im.dataset.try || 0);
  if (n < IMG_FALLBACK.length) { im.dataset.try = n + 1; im.src = IMG_FALLBACK[n] + im.dataset.ipfs; }
}, true);

// ---------------------------------------------------------------- state
const S = {
  account: undefined, player: null,
  damage: new Map(),    // template id -> damage stored on the contract
  shown: null,          // the planet on screen: { index, total, destroyed }
  lastLog: -1, carry: 0,
  away: null, gen: 0,   // the tab is hidden: { since, fromLog, index, hash }; gen drops replays from before a catch-up
  ships: new Map(),     // wallet -> { id, sig }
  owned: null,          // { crew: {templateId: [assetIds]}, arms: {...} }
  spectating: false,    // ?as=account: read-only
  firedAt: 0,           // when you last attacked: your own hit is shown at once, not spread out
  polling: null,        // the poll in flight (polls never overlap, so nothing is replayed twice)
  cooldown: 0,          // seconds between two attacks (config.cooldown_sec)
  attackReady: false,   // a crew and a weapon are equipped
  firing: false,        // an attack is being signed
};

// ---------------------------------------------------------------- the planet
function updateHud() {
  if (!S.shown) return;
  const { total, destroyed } = S.shown;
  $('destroyed').textContent = fmt(destroyed);
  $('total').textContent = fmt(total);
  const pct = Math.min(100, destroyed / total * 100);
  $('meterFill').style.width = pct.toFixed(2) + '%';
  $('meter').setAttribute('aria-valuenow', pct.toFixed(1));
  $('crews').textContent = S.ships.size;
  $('crewsWord').textContent = S.ships.size === 1 ? 'vessel' : 'vessels';
}
function loadPlanet(tr) {
  const total = chain.chainBlocks(Number(tr.radius)), destroyed = Math.min(total, Number(tr.destroyed_blocks));
  if (!planet.load(tr.planet, Number(tr.radius), Number(tr.seed), 1 - destroyed / total)) { $('busy').textContent = 'Unknown planet: ' + tr.planet; return; }
  S.shown = { index: Number(tr.index), total, destroyed };
  S.track = tr;
  S.carry = 0;
  $('busy').hidden = true;
  document.body.classList.add('ready');
  updateHud();
}

// ---------------------------------------------------------------- the fleet
function ensureShip(p) {
  const crewT = TPL.get(Number(p.equipped_crew_template)), weaponT = TPL.get(Number(p.equipped_weapon_template));
  const sig = [p.equipped_crew_template, p.equipped_weapon_template, p.playertag, p.color, Ranks.hashesOf(p)].join('#');
  const cur = S.ships.get(p.wallet);
  if (cur && cur.sig === sig) return cur.id;
  if (cur) planet.fleet.remove(cur.id);
  const id = planet.fleet.addPlayer({ tag: p.playertag, color: colorOf(p), crew: crewOf(crewT), crewTemplate: Number(p.equipped_crew_template) || 0, weapon: weaponOf(weaponT), wallet: p.wallet, me: p.wallet === S.account, rank: Ranks.badge(Ranks.hashesOf(p)) });
  S.ships.set(p.wallet, { id, sig, weapon: weaponOf(weaponT) });
  return id;
}
function dropShip(wallet) {
  const s = S.ships.get(wallet);
  if (s) { planet.fleet.remove(s.id); S.ships.delete(wallet); }
}

// ---------------------------------------------------------------- what happened: the feed and the hash found
// kill feed: newest row on top, at most six, the older ones (and anything after 9 s) fade
function feed(html, opts = {}) {
  const el = document.createElement('div');
  el.className = 'row' + (opts.hash ? ' hash' : '');
  if (opts.color) el.style.setProperty('--pc', opts.color);
  el.innerHTML = html;
  const box = $('feed');
  box.prepend(el);
  if (S.errRow) box.prepend(S.errRow);   // an unresolved error stays the newest row
  while (box.children.length > 6 + (S.errRow ? 1 : 0)) box.lastChild.remove();
  [...box.children].filter(r => r !== S.errRow).forEach((r, i) => { if (i >= 3) r.classList.add('old'); });   // a row only ever fades, never lights up again
  setTimeout(() => el.classList.add('old'), 9000);
}
// An attack error is the newest row of the battle log and stays there, on top, until an attack goes
// through again. It only says what went wrong. Once resolved it says so, then lets go and fades
// with the rest of the log.
function pinError(title, message) {
  if (!S.errRow) { S.errRow = document.createElement('div'); S.errRow.className = 'row fault'; }
  clearTimeout(S.errLetGo);
  S.errRow.classList.remove('ok');
  S.errRow.innerHTML = '<span class="t">' + esc(title) + '</span><span class="m">' + esc(message) + '</span>';
  $('feed').prepend(S.errRow);
}
function clearError(text) {
  const row = S.errRow;
  if (!row || row.classList.contains('ok')) return;
  row.classList.add('ok');
  row.innerHTML = '<span class="t">' + esc(text) + '</span>';
  S.errLetGo = setTimeout(() => {   // from here on an ordinary row: the next hits push it down and it fades
    if (S.errRow !== row) return;
    S.errRow = null;
    setTimeout(() => row.classList.add('old'), 6000);
  }, 2500);
}
const ARMS_BY_NAME = Object.fromEntries(ARMS_CARDS.map(c => [c.name, c]));
// The hash found: the attack that found it lands first, then the planet breaks up, a band names
// the finder and counts down 10 seconds, and the next planet warps in. Hits logged on the next
// planet meanwhile wait for it; late hits on the old one only show in the feed.
const BAND_AFTER = 1.7, COUNTDOWN = 10;
function hashFound(log) {
  if (S.seq) return;
  S.seq = { hashIndex: Number(log.index), held: [], done: false };
  // the finding attack lands first (its ship may still be flying round to the crater), then the planet breaks up
  const t0 = Date.now();
  const go = () => {
    if (planet.busy && Date.now() - t0 < 8000) { setTimeout(go, 200); return; }
    planet.breakUp();
    setTimeout(() => showBand(log), BAND_AFTER * 1000);
  };
  setTimeout(go, 3200);
}
function showBand(log) {
  $('hbTag').textContent = log.playertag;
  $('hbWhere').textContent = 'Hash found · ' + planet.name;
  const bars = [...$('hbBars').children], end = Date.now() + COUNTDOWN * 1000;
  $('hashBand').hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => $('hashBand').classList.add('on')));
  const tick = () => {
    if (!S.seq) return;
    const left = Math.max(0, end - Date.now()), n = Math.ceil(left / 1000);
    bars.forEach((b, i) => b.classList.toggle('on', i < n));
    $('hbNext').textContent = (S.nextTrack ? 'Next · ' + S.nextTrack.planet + ' in ' : 'Next planet in ') + n + ' s';
    if (left > 0) { setTimeout(tick, 200); return; }
    S.seq.done = true;
    if (S.nextTrack) arrive(); else $('hbNext').textContent = 'Waiting for the next planet…';
  };
  tick();
}
function arrive() {
  const tr = S.nextTrack;
  S.nextTrack = null;
  loadPlanet(tr);   // after a break-up it warps in
  $('hashBand').classList.remove('on');
  setTimeout(() => { $('hashBand').hidden = true; }, 500);
  const held = S.seq ? S.seq.held : [];
  S.seq = null;
  held.forEach((l, i) => setTimeout(() => playHit(l), 1200 + i * 350));
}
gains.init({
  after: document.querySelector('.shade'),
  target() { const i = document.querySelector('#hlBal .hl-icon'); if (!i) return null; const r = i.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; },
  onShow(n, bump) { const el = $('hlBal'); if (!el) return; el.lastChild.textContent = fmt(n); if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } },
});
planet.onImpact = (p, k, wallet) => { if (wallet && wallet === S.account) gains.impact(p, k); };
function playHit(log) {
  if (!S.shown) return;
  if (S.away) { if (log.hash_found) S.away.hash = log; return; }   // the tab is hidden: nothing to animate, it catches up on return
  if (S.seq && !log.hash_found) {
    if (Number(log.index) > S.seq.hashIndex) { S.seq.held.push(log); return; }   // a hit on the next planet: after it arrives
    return feed('<span class="who" style="color:' + colorOfWallet(log.wallet) + '">' + esc(log.playertag) + '</span>' + rankOfWallet(log.wallet) + '<span class="ar">▸</span><span class="num">' + fmt(Number(log.damage_done)) + '</span>', { color: colorOfWallet(log.wallet) });
  }
  const dmg = Number(log.damage_done), ship = S.ships.get(log.wallet);
  // the same share of the game planet as of the contract's planet; leftovers carry over
  const exact = planet.total * dmg / S.shown.total + S.carry, n = Math.floor(exact);
  S.carry = exact - n;
  // your own mining attack: its hashlings fly from the hits to your balance as comets
  if (log.wallet === S.account && S.firedMine && !log.simulated && Date.now() - S.firedAt < 70000) gains.expect(dmg, n);
  if (n > 0) planet.attack(n, ship ? ship.id : undefined);
  S.shown.destroyed = Math.min(S.shown.total, S.shown.destroyed + dmg);
  updateHud();
  const color = colorOfWallet(log.wallet);
  const weapon = ship ? ship.weapon.split('|')[0] : 'Weapon', rarity = (ARMS_BY_NAME[weapon] || {}).rarity || 'Common';
  feed('<span class="who" style="color:' + color + '">' + esc(log.playertag) + '</span>' + rankOfWallet(log.wallet) + '<span class="ar">▸</span><span class="wchip rar-' + rarity + '">' + esc(weapon) + '</span><span class="ar">▸</span><span class="num">' + fmt(dmg) + '</span>', { color });
  if (log.hash_found) {
    feed('<b>' + esc(log.playertag) + '</b><span>found the hash</span><span>· new world incoming</span>', { hash: true });
    hashFound(log);
  }
}
const knownPlayers = new Map();   // wallet -> latest player row we have seen
const colorOfWallet = w => knownPlayers.has(w) ? colorOf(knownPlayers.get(w)) : '#ff8a3d';
const rankOfWallet = w => knownPlayers.has(w) ? Ranks.badge(Ranks.hashesOf(knownPlayers.get(w))) : '';

// ---------------------------------------------------------------- polling
async function poll() {
  const now = Date.now() / 1000, gen = S.gen;   // a catch-up that starts while this read is on its way makes it stale
  const [tr, logs, active, cfg, me, tpls] = await Promise.all([chain.getCurrentPlanet(), chain.getLogsAfter(S.lastLog), chain.getActivePlayers(now - ACTIVE_SEC), chain.getConfig(), S.account ? chain.getPlayer(S.account) : null, chain.getTemplates()]);
  const known = S.damage.size;
  for (const t of tpls) S.damage.set(Number(t.template_id), Number(t.damage));
  if (S.damage.size !== known && S.player) showMe();
  if (cfg) S.cooldown = Number(cfg.cooldown_sec) || 0;   // 0 until the contract with cooldowns is deployed; a failed read keeps the last value
  if (me && S.player && !S.firing) S.player = { ...me, last_action: chain.chainTime(me.last_action) >= chain.chainTime(S.player.last_action) ? me.last_action : S.player.last_action };
  if (!tr) { $('busy').textContent = 'No planet is being mined right now.'; return; }
  if (!S.shown) loadPlanet(tr);

  // who is in orbit: everyone who attacked in the last 30 minutes, and you
  const keep = new Set();
  for (const p of active) {
    if (chain.chainTime(p.last_action) < now - ACTIVE_SEC) continue;
    knownPlayers.set(p.wallet, p); ensureShip(p); keep.add(p.wallet);
  }
  if (S.player) { knownPlayers.set(S.player.wallet, S.player); ensureShip(S.player); keep.add(S.player.wallet); }
  for (const w of [...S.ships.keys()]) if (!keep.has(w)) dropShip(w);
  updateHud();

  // replay everything logged since the last look, spread at random over the next 10 seconds
  logs.sort((a, b) => Number(a.index) - Number(b.index));
  // back from a hidden tab: the catch-up shows the planet as it is now, so a read that left before it
  // (or lands while it runs) replays nothing; it would play every hit since you left in a rush
  if (gen !== S.gen || S.catching) return;
  // a backlog (the catch-up failed, or a long stall): no rush of replays, just the count and the planet as it is now
  if (logs.length > 20 && !S.away) {
    S.lastLog = Math.max(S.lastLog, ...logs.map(l => Number(l.index)));
    feed('<span class="num">' + fmt(logs.length) + '</span><span>hits while you were away</span>');
    if (me) gains.sync(statOf(me, 'hashlings'), S.account);
    loadPlanet(tr);
    return;
  }
  for (const log of logs) {
    S.lastLog = Math.max(S.lastLog, Number(log.index));
    if (S.away) { if (log.hash_found) S.away.hash = log; continue; }
    const mine = log.wallet === S.account && Date.now() - S.firedAt < 60000;
    if (mine && S.firedMine) gains.reserve(Number(log.damage_done));   // held back on the balance until its comet brings it in
    setTimeout(() => { if (gen === S.gen) playHit(log); }, mine ? 200 : Math.random() * POLL_MS * 0.9);
  }
  if (me) gains.sync(statOf(me, 'hashlings'), S.account);
  if (S.away) return;   // a hidden tab only keeps count; the planet is redrawn on return
  if (Number(tr.index) !== S.shown.index) {
    // the hash was found: the next planet arrives when the countdown ends (or right away if it already has)
    S.nextTrack = tr;
    if (S.seq && S.seq.done) arrive();
    else if (!S.seq && !S.nextTimer) S.nextTimer = setTimeout(() => {   // no hash in the log we replayed (found before this page opened): just swap
      S.nextTimer = null;
      if (!S.seq && S.nextTrack) { const t = S.nextTrack; S.nextTrack = null; loadPlanet(t); }
    }, POLL_MS * 1.5);
  } else {
    // after the replay, settle on the contract's own count
    setTimeout(() => { if (S.shown && S.shown.index === Number(tr.index)) { S.shown.destroyed = Math.max(S.shown.destroyed, Math.min(S.shown.total, Number(tr.destroyed_blocks))); updateHud(); } }, POLL_MS);
  }
}
// Back from a hidden tab: instead of replaying everything that happened (it can be thousands of
// hits), "Catching up…" and then the chain's current planet as it is now, with one line in the feed.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (S.shown && !S.away) S.away = { since: Date.now(), fromLog: S.lastLog, index: S.shown.index, hash: null };
    return;
  }
  const away = S.away;
  S.away = null;
  if (away && Date.now() - away.since > 4000) catchUp(away);
});
async function catchUp(away) {
  S.gen++;   // replays still waiting from before are dropped
  S.catching = true;
  $('catchup').hidden = false;
  try {
    const [tr, latest] = await Promise.all([chain.getCurrentPlanet(), chain.getLatestLogIndex()]);
    if (S.seq) { S.seq = null; $('hashBand').classList.remove('on'); $('hashBand').hidden = true; }
    clearTimeout(S.nextTimer); S.nextTimer = null; S.nextTrack = null;
    S.lastLog = Math.max(S.lastLog, latest);
    if (tr) loadPlanet(tr);
    const hits = Math.max(0, latest - away.fromLog);
    if (tr && Number(tr.index) !== away.index) {
      feed(away.hash ? '<b>' + esc(away.hash.playertag) + '</b><span>found the hash while you were away</span>' : '<span>The hash was found while you were away</span><span>· now on ' + esc(String(tr.planet)) + '</span>', { hash: true });
    }
    if (hits) feed('<span class="num">' + fmt(hits) + '</span><span>' + (hits === 1 ? 'hit' : 'hits') + ' while you were away</span>');
  } catch (err) { console.error(err); }
  finally { S.catching = false; }
  setTimeout(() => { $('catchup').hidden = true; }, 400);
}
function pollNow() {
  S.polling ??= poll().catch(err => console.error(err)).finally(() => { S.polling = null; });
  return S.polling;
}
async function startPolling() {
  S.lastLog = await chain.getLatestLogIndex();   // only what happens from now on is replayed
  const loop = async () => { await pollNow(); setTimeout(loop, POLL_MS); };
  loop();
}

// ---------------------------------------------------------------- you
function showMe() {
  const p = S.player;
  $('hangarBtn').hidden = !p || S.spectating; $('connectBtn').hidden = !!p && !S.spectating;
  $('signOut').hidden = S.spectating;
  $('autoBtn').hidden = !p || S.spectating;   // auto-sign needs your own signed-in wallet
  const canMenu = !!S.account;   // the menu (the speed dial) is there once a wallet is connected
  $('dialFab').hidden = !canMenu;
  if (!canMenu) closeMeMenu();
  if (S.spectating) $('connectBtn').textContent = 'Use my wallet';
  $('loadout').hidden = !p;
  placeDial(); setTimeout(placeDial, 600);   // after the dock shows (and once its cards have their size)
  if (p) {
    const hashes = Ranks.hashesOf(p);
    gains.sync(statOf(p, 'hashlings'), p.wallet);
    $('who').innerHTML = '<small>Playing as</small><b style="color:' + colorOf(p) + '">' + esc(p.playertag) + Ranks.badge(hashes) + '</b>' +
      '<span class="hl" id="hlBal" title="Hashlings">' + gains.ICON + '<span>' + fmt(gains.shown ?? 0) + '</span></span>';
    const c = TPL.get(Number(p.equipped_crew_template)), w = TPL.get(Number(p.equipped_weapon_template));
    renderDock($('tCrew'), c, 'crew'); renderDock($('tArms'), w, 'arms');
    $('ddHangar').textContent = (c ? c.card.name : 'No crew') + ' · ' + (w ? w.card.name : 'no weapon');
    $('loDmg').textContent = c && w ? damageOf(c.card, c.shine, Number(p.equipped_crew_template)) + damageOf(w.card, w.shine, Number(p.equipped_weapon_template)) : '–';
    const ready = !!(c && w && Number(p.equipped_crew_asset) && Number(p.equipped_weapon_asset));
    S.attackReady = ready;
    updateAttack();
    if (S.spectating) say($('attackStatus'), 'You are watching as ' + p.playertag + '. Press Use my wallet to play yourself.');
  } else if (S.account) {
    $('who').innerHTML = '<small>' + esc(S.account) + '</small><b>Not signed up yet</b>';
    $('connectBtn').textContent = 'Join the rush';
  } else {
    $('who').innerHTML = '';
    $('connectBtn').textContent = 'Connect wallet';
  }
}
// a docked card on the loadout plate: card art in its rarity colour with a shine badge, or an empty slot
const RARITY_COL = { Abundant: '#9aa0a6', Common: '#c9c3b8', Rare: '#5aa9ff', Epic: '#c66bff', Legendary: '#ffa53d', Mythical: '#ff4d6d' };
const SHINE_COL = { Stone: '#a59d92', Gold: '#f2c14e', XDimension: '#b29bff', Stardust: '#bcd6ff', Antimatter: '#ff5ae8' };
function renderDock(el, t, kind) {
  const what = kind === 'crew' ? 'crew' : 'weapon';
  el.classList.toggle('empty', !t);
  if (!t) {
    el.style.removeProperty('--rc');
    el.innerHTML = '<div class="t"><span>No ' + what + '</span><b>Choose one</b></div>';
    el.setAttribute('aria-label', 'No ' + what + ' equipped. Open the hangar');
    return;
  }
  el.style.setProperty('--rc', RARITY_COL[t.card.rarity] || '#ffffff55');
  const short = t.shine.shine === 'XDimension' ? 'XDim' : t.shine.shine;
  el.innerHTML = '<img alt="" referrerpolicy="no-referrer" data-ipfs="' + t.card.img + '" src="' + thumb(t.card.img) + '"><span class="shb" style="background:' + SHINE_COL[t.shine.shine] + '">' + short + '</span>' +
    '<div class="t"><span>' + t.card.rarity + ' ' + what + '</span><b>' + esc(t.card.name) + '</b></div>';
  el.setAttribute('aria-label', 'Your ' + what + ': ' + t.card.name + ', ' + t.card.rarity + ', ' + t.shine.shine + '. Open the hangar');
}
async function refreshPlayer() {
  S.player = S.account ? await chain.getPlayer(S.account) : null;
  if (S.player) { knownPlayers.set(S.player.wallet, S.player); ensureShip(S.player); updateHud(); }
  showMe();
  refreshAutoFire();
  refreshMining();
}
// Auto attack: fires whenever the trigger has recharged. Offered only while attacks sign by themselves
// (auto-sign on for attack in this browser), so it never opens the wallet window on its own.
const AUTOFIRE_KEY = 'hashrush.autofire.v1';
async function refreshAutoFire() {
  const acts = S.spectating || !S.player ? [] : await chain.autoSignActions();
  S.autoSignAttack = acts.includes('attack');
  $('autoFireRow').hidden = !S.autoSignAttack;
  let saved = false;
  try {
    if (!S.autoSignAttack && !S.spectating && S.player) localStorage.setItem(AUTOFIRE_KEY, '0');   // no auto-sign: forget it, so it starts off when auto-sign comes back
    saved = localStorage.getItem(AUTOFIRE_KEY) === '1';
  } catch { /* off */ }
  S.autoFire = S.autoSignAttack && saved;
  $('autoFire').checked = S.autoFire;
}
// Mining: each attack also earns 1 hashling per block destroyed and runs automated tasks (more CPU).
// Off, only finding the hash pays. Offered once the deployed contract's attack takes "mine".
const MINE_KEY = 'hashrush.mine.v1';
async function refreshMining() {
  const has = !S.spectating && !!S.player && await chain.attackHasMine();
  $('mineRow').hidden = !has;
  let saved = false;
  try { saved = localStorage.getItem(MINE_KEY) === '1'; } catch { /* off */ }
  S.mine = has && saved;
  $('mineOn').checked = S.mine;
}
$('mineOn').addEventListener('change', e => {
  S.mine = e.target.checked;
  try { localStorage.setItem(MINE_KEY, S.mine ? '1' : '0'); } catch { /* this visit only */ }
  say($('attackStatus'), S.mine ? 'Mining on: every attack earns 1 hashling per block destroyed. It also runs automated tasks, so each attack uses more CPU.'
    : 'Mining off: attacks cost less CPU. Only finding the hash pays hashlings.');
  clearTimeout(S.mineNote); S.mineNote = setTimeout(() => say($('attackStatus'), ''), 8000);
});
// why mining costs more CPU: what the extra work is
$('mineWhy').addEventListener('click', e => { e.preventDefault(); $('mineInfo').showModal(); });
$('mineInfoClose').addEventListener('click', () => $('mineInfo').close());
$('mineInfoCpu').addEventListener('click', () => { $('mineInfo').close(); $('cpuBtn').click(); });
$('autoFire').addEventListener('change', e => {
  S.autoFire = e.target.checked && S.autoSignAttack;
  S.autoPause = 0;
  try { localStorage.setItem(AUTOFIRE_KEY, S.autoFire ? '1' : '0'); } catch { /* this visit only */ }
});
$('connectBtn').addEventListener('click', async () => {
  if (S.spectating) { location.href = 'play.html'; return; }   // leave the read-only view
  if (S.account && !S.player) { location.href = 'index.html'; return; }   // sign-up lives on the landing page
  try {
    S.account = await chain.login();
    if (!S.account) return;
    await refreshPlayer();
    if (!S.player) location.href = 'index.html';
  } catch (err) { feed('<em>' + esc(chain.friendlyError(err)) + '</em>'); }
});
// the menu: a speed dial. The round button opens a stack of actions, each with a line of state
const dialAnim = () => { document.body.classList.add('dial-anim'); clearTimeout(dialAnim.t); dialAnim.t = setTimeout(() => document.body.classList.remove('dial-anim'), 500); };
function closeMeMenu() { if (document.body.classList.contains('dial-open')) dialAnim(); document.body.classList.remove('dial-open'); $('dialFab').setAttribute('aria-expanded', 'false'); }
function openDial() {
  dialAnim(); document.body.classList.add('dial-open'); $('dialFab').setAttribute('aria-expanded', 'true');
  dialStates();
  const first = [...document.querySelectorAll('.dd')].reverse().find(b => !b.hidden);   // the one nearest the button
  first?.focus({ preventScroll: true });
}
$('dialFab').addEventListener('click', () => (document.body.classList.contains('dial-open') ? closeMeMenu() : openDial()));
$('dialDim').addEventListener('click', closeMeMenu);
// on upright phones the round button sits just above the dock (whose height depends on the cards)
function placeDial() {
  const phone = matchMedia('(max-width: 640px) and (orientation: portrait)').matches, lo = $('loadout');
  if (!phone) { document.documentElement.style.removeProperty('--fabB'); return; }
  const top = lo.hidden ? innerHeight - 12 : lo.getBoundingClientRect().top;
  document.documentElement.style.setProperty('--fabB', Math.max(12, innerHeight - top + 12) + 'px');
}
addEventListener('resize', placeDial);
// each action's line of state, read when the dial opens
function dialStates() {
  const p = S.player, set = (id, text, cls = '') => { $(id).textContent = text; $(id).className = cls; };
  set('ddOut', S.account || '');
  set('ddAuto', S.autoSignAttack ? 'On for attack' : 'Off', S.autoSignAttack ? 'on' : '');
  set('ddPlanets', S.track ? Number(S.track.index) + ' destroyed · now ' + S.track.planet : '');
  if (S.account) chain.getCpu(S.account).then(c => set('ddCpu', ms(c.available) + ' of ' + ms(c.max) + ' ms left', c.max && c.available / c.max < 0.15 ? 'low' : '')).catch(() => set('ddCpu', ''));
  chain.hasSwap().then(has => has ? Promise.all([chain.getSwapPool(), chain.getSwapConfig()]) : null).then(r => {
    if (!r || !r[0] || !(Number(r[0].shards) > 0)) return set('ddMarket', r ? 'No liquidity yet' : 'Opens soon');
    const q = chain.poolAt(r[0], r[1], Date.now() / 1000);
    set('ddMarket', '~' + big(Math.round(Number(q.hashlings) / (Number(q.shards) / 10))) + ' hashlings per shard');
  }).catch(() => set('ddMarket', ''));
  if (!p) set('ddHangar', '');
}
// auto-sign: a switch per action; Save applies them together (the wallet approves once)
const AUTO = { saved: [] };
const autoChosen = () => [...document.querySelectorAll('#autoRows input')].filter(b => b.checked).map(b => b.value);
const autoDirty = () => autoChosen().join() !== AUTO.saved.join();
function renderAutoRows() {
  $('autoRows').innerHTML = chain.AUTO_ACTIONS.map(a => '<label class="row"><span><b>' + a.label + '</b><small>' + a.note + '</small></span>' +
    '<span class="switch"><input type="checkbox" value="' + a.name + '"' + (AUTO.saved.includes(a.name) ? ' checked' : '') + '></span></label>').join('');
  for (const b of document.querySelectorAll('#autoRows input')) b.addEventListener('change', () => { $('autoSave').disabled = !autoDirty(); say($('autoStatus'), ''); });
}
$('autoBtn').addEventListener('click', async () => {
  closeMeMenu();
  AUTO.saved = [];
  renderAutoRows();
  for (const b of document.querySelectorAll('#autoRows input')) b.disabled = true;
  $('autoSave').disabled = true;
  say($('autoStatus'), 'Checking your wallet…');
  $('autoSign').showModal();
  AUTO.saved = await chain.autoSignActions();
  renderAutoRows();
  say($('autoStatus'), AUTO.saved.length ? 'On for ' + AUTO.saved.length + ' of ' + chain.AUTO_ACTIONS.length + ' actions.' : 'Everything goes through your wallet.');
});
$('autoClose').addEventListener('click', () => $('autoSign').close());

// Destroyed planets: every planet so far, newest first, with when it fell, who found the hash and how
// much of it was still standing (the finders table; planets from before it existed show no finder)
const ago = sec => sec < 60 ? 'just now' : sec < 3600 ? Math.floor(sec / 60) + ' min ago' : sec < 86400 ? Math.floor(sec / 3600) + ' h ago' : Math.floor(sec / 86400) + (sec < 172800 ? ' day ago' : ' days ago');
const lasted = s => s < 5400 ? Math.round(s / 60) + ' min' : Math.floor(s / 3600) + ' h ' + String(Math.round(s % 3600 / 60)).padStart(2, '0') + ' m';   // no line break inside a duration
// a planet's picture (planets/, rendered with million-cubes/planet-thumbs.html), broken open once destroyed;
// a renamed planet still finds its picture under its old name
function planetPic(name, cut) {
  const def = PlanetKit.PLANETS.find(p => p.name === name || (p.aka || []).includes(name));
  return def ? '<img src="planets/' + def.name + (cut ? '-cut' : '') + '.webp?v=1" alt="" width="76" height="76" loading="lazy">' : '';
}
$('historyBtn').addEventListener('click', async () => {
  closeMeMenu();
  $('historyList').innerHTML = '<div class="empty">Loading…</div>';
  $('history').showModal();
  try {
    const [planets, finders] = await Promise.all([chain.getPlanetHistory(), chain.getFinders()]);
    const byIndex = new Map(finders.map(f => [Number(f.index), f]));
    const now = Date.now() / 1000;
    // each planet as a bounty ticket: the one being mined is open (the hash pays as many hashlings as the
    // planet has blocks), the destroyed ones are claimed by whoever found their hash
    $('historyList').innerHTML = planets.map((p, i) => {
      const blocks = chain.chainBlocks(Number(p.radius)), gone = Math.min(blocks, Number(p.destroyed_blocks)), no = Number(p.index) + 1;
      const stub = '<div class="stub">' + planetPic(p.planet, i > 0) + '<b>#' + no + '</b></div>';
      if (i === 0) return '<div class="tk now"><div class="main"><div class="k">Open bounty · now mining</div><h3>' + esc(p.planet) + '</h3>' +
        '<p>Reward <b>' + fmt(blocks) + ' hashlings</b> to whoever finds the hash · <b>' + fmt(gone) + '</b> of ' + fmt(blocks) + ' blocks gone · arrived ' + ago(now - chain.chainTime(p.spawn_time)) + '</p>' +
        '<div class="bar"><i style="width:' + (100 * gone / blocks).toFixed(1) + '%"></i></div></div>' + stub + '</div>';
      const fell = chain.chainTime(planets[i - 1].spawn_time), f = byIndex.get(Number(p.index));
      const known = f && knownPlayers.get(String(f.wallet)), who = f ? '<span class="fn" style="color:' + (known ? colorOf(known) : '#a3501a') + '">' + esc(f.playertag) + '</span>' + (known ? Ranks.badge(Ranks.hashesOf(known)) : '') : '';
      return '<div class="tk"><div class="main"><div class="k">Bounty #' + no + ' · ' + ago(now - fell) + '</div><h3>' + esc(p.planet) + '</h3>' +
        '<p>' + (f ? 'Claimed by ' + who + ' · paid <b>' + fmt(Number(f.planet_blocks) || blocks) + '</b> hashlings' : 'Claimed') + ' · lasted ' + lasted(fell - chain.chainTime(p.spawn_time)) + '</p></div>' +
        stub + '<span class="stamp">Claimed</span></div>';
    }).join('') || '<div class="empty">No planets yet.</div>';
  } catch (err) { $('historyList').innerHTML = '<div class="empty">Could not load the planets right now.</div>'; console.error(err); }
});
$('historyClose').addEventListener('click', () => $('history').close());

// CPU: used and left, and renting more for 24 hours with the eosio powerup
const CPU = { pw: null, wax: 0 };
const ms = us => (us / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 });
async function showCpu() {
  if (!S.account) return;
  const c = await chain.getCpu(S.account);
  const pct = c.max ? Math.min(100, 100 * c.used / c.max) : 100;
  $('cpuBar').style.width = pct.toFixed(1) + '%'; $('cpuBar').classList.toggle('low', pct > 85);
  $('cpuUsed').textContent = ms(c.used); $('cpuLeft').textContent = ms(c.available); $('cpuMax').textContent = ms(c.max);
  CPU.wax = c.wax; $('cpuBal').textContent = c.wax.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' WAX';
}
function cpuEstimate() {
  const wax = Number($('cpuWax').value);
  if (!CPU.pw || !(wax > 0)) { $('cpuGet').textContent = '–'; return; }
  $('cpuGet').textContent = Math.floor(chain.powerupFor(CPU.pw, wax).ms).toLocaleString('en-US');
}
$('cpuBtn').addEventListener('click', async () => {
  closeMeMenu();
  $('cpuWho').textContent = S.player ? S.player.playertag + ' · ' + S.account : S.account;
  $('cpuUp').disabled = !!S.spectating;
  say($('cpuStatus'), S.spectating ? 'Watching: connect your own wallet to power up.' : '');
  $('cpu').showModal();
  try { await Promise.all([showCpu(), chain.getPowerup().then(pw => { CPU.pw = pw; cpuEstimate(); })]); }
  catch (err) { say($('cpuStatus'), 'Could not read the chain right now.', true); console.error(err); }
});
$('cpuWax').addEventListener('input', cpuEstimate);
$('cpuUp').addEventListener('click', async () => {
  const wax = Number($('cpuWax').value);
  if (!(wax > 0)) return say($('cpuStatus'), 'Enter how much WAX to spend.', true);
  if (wax > CPU.wax) return say($('cpuStatus'), 'You have ' + CPU.wax.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' WAX.', true);
  $('cpuUp').disabled = true; say($('cpuStatus'), 'Confirm in your wallet…');
  try {
    if (!chain.account()) { S.account = await chain.login(); if (!S.account) { say($('cpuStatus'), ''); return; } }
    await chain.powerup(wax);
    say($('cpuStatus'), 'Powered up for 24 hours.');
    setTimeout(() => showCpu().catch(() => undefined), 1500);
    CPU.pw = await chain.getPowerup(); cpuEstimate();
  } catch (err) { say($('cpuStatus'), chain.friendlyError(err), true); }
  finally { $('cpuUp').disabled = false; }
});
$('cpuClose').addEventListener('click', () => $('cpu').close());

// the hashling market: hashlings into the swap pool, shards out. Every full minute shards flow into the pool
// and take hashlings out (the chain adds that up at the next swap), so the quote counts them in first
const MK = { pool: null, cfg: null };
const big = x => Number(x).toLocaleString('en-US');
// shards are counted in tenths on the chain: 100 there is 10.0 here (the swap itself still sends chain units)
const shardsUI = x => (Number(x) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hashlingsHave = () => statOf(S.player, 'hashlings');
function mkQuote() {
  const n = Math.floor(Number($('mkIn').value));
  if (!MK.pool) { for (const id of ['mkOut', 'mkMin', 'mkRate', 'mkImpact']) $(id).textContent = '–'; return 0n; }
  const p = chain.poolAt(MK.pool, MK.cfg, Date.now() / 1000);
  $('mkPoolH').textContent = big(p.hashlings); $('mkPoolS').textContent = shardsUI(p.shards);
  const none = () => { for (const id of ['mkOut', 'mkMin', 'mkRate', 'mkImpact']) $(id).textContent = '–'; $('mkImpact').classList.remove('warn'); return 0n; };
  if (!(n > 0)) return none();
  const out = chain.quoteShards(p, n);
  if (out <= 0n) return none();
  // the rate you actually get, and how much worse it is than the pool's price for a tiny swap
  const impact = 1 - Number(out) / (n * Number(p.shards) / Number(p.hashlings));
  $('mkOut').textContent = shardsUI(out); $('mkMin').textContent = shardsUI(out * 99n / 100n);
  $('mkRate').textContent = big(Math.round(n / (Number(out) / 10)));
  $('mkImpact').textContent = (impact * 100).toFixed(1) + '%'; $('mkImpact').classList.toggle('warn', impact > 0.05);
  return out;
}
async function mkLoad() {
  const has = await chain.hasSwap();   // the tables only exist once the contract with the market is deployed
  const [pool, cfg] = has ? await Promise.all([chain.getSwapPool(), chain.getSwapConfig()]) : [null, null];
  MK.pool = pool; MK.cfg = cfg;
  const open = has && pool && Number(pool.shards) > 0;
  $('mkSwap').disabled = !open || !!S.spectating || !S.player;
  $('mkInfo').textContent = !has ? 'The market opens soon.' : !pool ? 'The pool has no liquidity yet.'
    : (cfg && Number(cfg.shards_per_minute) > 0 ? shardsUI(cfg.shards_per_minute) + ' shards flow into the pool every minute and take hashlings out of it, so shards slowly get cheaper.' : 'The more you swap at once, the higher the price of each shard.');
  $('mkHave').textContent = S.player ? big(hashlingsHave()) : '–';
  $('mkHaveS').textContent = S.player ? shardsUI(statOf(S.player, 'shards')) : '–';
  $('mkHlIcon').innerHTML = gains.ICON;
  if (S.spectating) say($('mkStatus'), 'Watching: connect your own wallet to swap.');
  mkQuote();
}
$('marketBtn').addEventListener('click', async () => {
  closeMeMenu(); say($('mkStatus'), '');
  $('market').showModal();
  try { await mkLoad(); } catch (err) { say($('mkStatus'), 'Could not read the chain right now.', true); console.error(err); }
  clearInterval(MK.tick); MK.tick = setInterval(() => { if (!$('market').open) clearInterval(MK.tick); else mkQuote(); }, 5000);   // the inflow keeps moving the price
});
$('mkIn').addEventListener('input', mkQuote);
$('mkMax').addEventListener('click', () => { $('mkIn').value = hashlingsHave(); mkQuote(); });
document.querySelectorAll('#market [data-pct]').forEach(b => b.addEventListener('click', () => { $('mkIn').value = Math.floor(hashlingsHave() * Number(b.dataset.pct)); mkQuote(); }));
$('mkSwap').addEventListener('click', async () => {
  const n = Math.floor(Number($('mkIn').value));
  if (!(n > 0)) return say($('mkStatus'), 'Enter how many hashlings to swap.', true);
  if (n > hashlingsHave()) return say($('mkStatus'), 'You have ' + big(hashlingsHave()) + ' hashlings.', true);
  const out = mkQuote();
  if (out <= 0n) return say($('mkStatus'), 'Too few hashlings for 0.1 shards.', true);
  $('mkSwap').disabled = true; say($('mkStatus'), 'Confirm in your wallet…');
  try {
    await chain.swap(n, out * 99n / 100n);   // at most 1% fewer shards than shown, or the chain turns it down
    say($('mkStatus'), 'Swapped ' + big(n) + ' hashlings for about ' + shardsUI(out) + ' shards.');
    setTimeout(async () => { try { S.player = await chain.getPlayer(S.account); showMe(); } catch { /* next poll */ } mkLoad().catch(() => undefined); }, 1500);
  } catch (err) { say($('mkStatus'), chain.friendlyError(err), true); }
  finally { $('mkSwap').disabled = false; }
});
$('marketClose').addEventListener('click', () => $('market').close());
$('autoSave').addEventListener('click', async () => {
  const want = autoChosen(), boxes = [...document.querySelectorAll('#autoRows input')];
  boxes.forEach(b => { b.disabled = true; }); $('autoSave').disabled = true;
  say($('autoStatus'), 'Approve it in your wallet…');
  try {
    await chain.setAutoSign(want);
    // turning on auto-sign for attack never switches auto attack on: that is its own choice, off to begin with
    if (want.includes('attack') && !AUTO.saved.includes('attack')) try { localStorage.setItem(AUTOFIRE_KEY, '0'); } catch { /* this visit only */ }
    AUTO.saved = want;
    refreshAutoFire();   // auto attack is offered only while attacks sign by themselves
    say($('autoStatus'), want.length ? 'Saved. These actions now sign without the wallet window.' : 'Saved. Everything goes through your wallet again.');
  } catch (err) {
    say($('autoStatus'), /cancel|closed|reject|denied/i.test(String(err?.message ?? err)) ? 'Not saved: the wallet was closed.' : chain.friendlyError(err));
  } finally {
    boxes.forEach(b => { b.disabled = false; });
    $('autoSave').disabled = !autoDirty();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('dial-open')) { closeMeMenu(); $('dialFab').focus(); } });
$('signOut').addEventListener('click', async () => {
  try { await chain.logout(); } catch (err) { console.error(err); }   // leave even if the wallet complains
  location.href = 'index.html';
});

$('attackBtn').addEventListener('click', async () => {
  const p = S.player, btn = $('attackBtn');
  if (S.spectating) return;
  if (!p || !chain.account()) {   // the wallet session is gone (or never restored): connect first
    try { S.account = await chain.login(); if (!S.account) return; await refreshPlayer(); } catch (err) { say($('attackStatus'), chain.friendlyError(err), true); return; }
    if (!S.player) { location.href = 'index.html'; return; }
  }
  const p2 = S.player;
  if (!(Number(p2.equipped_crew_asset) && Number(p2.equipped_weapon_asset))) { openHangar(); return; }
  if (cooldownLeft() > 0) return;
  S.firing = true; updateAttack(); say($('attackStatus'), S.autoSignAttack ? '' : 'Confirm the attack in your wallet…');   // auto-signed: no wallet window to confirm in
  try {
    // never wait forever: a phone waking up can leave a request hanging, and the button would stay on "Firing…"
    await Promise.race([chain.attack(S.mine), new Promise((_, no) => setTimeout(() => no(new Error('The network timed out.')), 45000))]);
    S.firedAt = Date.now();
    S.firedMine = S.mine;
    S.cdEnd = Date.now() + (S.cooldown + 1) * 1000;
    S.player = { ...S.player, last_action: new Date().toISOString().slice(0, 19) };   // the cooldown starts now
    say($('attackStatus'), '');   // the shots on screen say it
    clearError('Attack went through again');
    // your hit is in the log now: read it right away and play it (not in a background tab: its slowed
    // timers would hold up the next auto attack for minutes, and the catch-up on return shows it anyway)
    for (let i = 0; i < 4 && !document.hidden; i++) { await new Promise(r => setTimeout(r, 700)); await pollNow(); }
  } catch (err) {
    const wait = /wait (\d+) more second/i.exec(String(err?.message ?? err));
    if (wait && S.player) { chainCooldown(Number(wait[1])); say($('attackStatus'), ''); clearError('The last attack went through'); }   // not an error: still recharging on the chain (so the last attack did land)
    else if (/cancel|closed|rejected by user|user rejected|denied/i.test(String(err?.message ?? err))) { say($('attackStatus'), ''); feed('<em>Attack cancelled: the wallet window was closed.</em>'); }   // the player's own choice, nothing to fix
    else if (isNetworkError(err) || isExpired(err)) {
      // the connection dropped, or the phone slept between signing and sending (the transaction expired):
      // not the attack's fault, so auto attack stays on and tries again in a little while; if the attack
      // did go through, the chain answers "wait N seconds"
      S.autoPause = Date.now() + 20000;
      say($('attackStatus'), '');
      pinError(isExpired(err) ? 'Attack expired' : 'Lost the connection', chain.friendlyError(err) + (S.autoFire ? ' Auto attack tries again shortly.' : ''));
    } else {
      // a failed attack switches auto attack off, so it never keeps firing into the same error
      const wasAuto = S.autoFire;
      if (wasAuto) {
        S.autoFire = false; $('autoFire').checked = false;
        try { localStorage.setItem(AUTOFIRE_KEY, '0'); } catch { /* this visit only */ }
      }
      say($('attackStatus'), '');
      pinError('Attack failed', chain.friendlyError(err) + (wasAuto ? ' Auto attack is off.' : ''));
    }
  } finally { S.firing = false; updateAttack(); }
});

// a dropped or timed-out connection, as fetch and the wallets word it in different browsers
const isExpired = err => /expired transaction|transaction (has )?expired|expired_tx/i.test(String(err?.message ?? err));
const isNetworkError = err => /failed to fetch|networkerror|network error|load failed|network request failed|timed out|timeout|aborted|no wax node/i.test(String(err?.message ?? err));

// cooldown on the button: a filling stripe and a countdown, then a burst when it is ready again
// the end of the recharge: from the chain's time of your last attack, or, right after you fired, from
// this clock plus a second (the block that holds the attack is a little later than the click)
const cooldownLeft = () => !S.player || !S.cooldown ? 0 :
  Math.max(0, Math.max(chain.chainTime(S.player.last_action) + S.cooldown + (S.skew || 0), (S.cdEnd || 0) / 1000) - Date.now() / 1000);
// the chain said "wait N more seconds": its clock and this one disagree. Recharge for exactly that
// long, and remember the difference (S.skew, seconds) so later recharges end when the chain's do
function chainCooldown(seconds) {
  const end = Date.now() / 1000 + seconds + 0.5, chainEnd = chain.chainTime(S.player.last_action) + S.cooldown;
  S.skew = Math.min(60, Math.max(S.skew || 0, end - chainEnd));
  S.cdEnd = end * 1000;
}
const mmss = s => { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let wasCooling = null;
function updateAttack() {
  const btn = $('attackBtn'), wrap = $('fireWrap'), left = cooldownLeft(), cooling = left > 0 && !S.spectating;
  btn.classList.toggle('cooling', cooling);
  if (cooling) {
    $('attackLbl').textContent = 'Recharging ' + mmss(left);
  } else $('attackLbl').textContent = S.firing ? 'Firing…' : S.attackReady ? 'Attack' : 'Equip to attack';
  btn.disabled = S.spectating || cooling || S.firing;
  if (wasCooling && !cooling && $('attackStatus').classList.contains('err')) say($('attackStatus'), '');   // an old error goes once it is ready again
  if (wasCooling && !cooling) {   // charged again
    wrap.classList.remove('flash'); void wrap.offsetWidth; wrap.classList.add('flash');
    setTimeout(() => wrap.classList.remove('flash'), 1800);
    $('attackLbl').textContent = 'Attack ready';
    setTimeout(updateAttack, 1400);
  }
  wrap.classList.toggle('charged', !cooling && !S.firing && S.attackReady && !S.spectating);
  wasCooling = cooling;
  // auto attack: recharged, equipped, signed in and not paused after an error. It keeps going with the
  // tab unfocused or in the background (an idle miner); coming back, the catch-up shows the planet as it is
  if (S.autoFire && S.autoSignAttack && !cooling && !S.firing && S.attackReady && !S.spectating && chain.account() && Date.now() > (S.autoPause || 0)) {
    S.autoPause = Date.now() + 3000;
    btn.click();
  }
}
setInterval(updateAttack, 250);
// A background tab slows its timers to one a second, and after a few minutes to one a minute, which would
// leave auto attack waiting long after the recharge. A worker's timer is not slowed like that, so it ticks
// here every second; its messages reach the page even while the tab is hidden.
try {
  const ticker = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 1000);'], { type: 'text/javascript' })));
  ticker.onmessage = () => { if (document.hidden) updateAttack(); };
} catch { /* no workers: the page's own timer above still runs */ }
// the recharge bar, drawn every frame; within one recharge it only ever moves forward (a later time
// from the chain makes it wait a moment instead of pulling back)
let cdShown = 0, cdOn = false;
(function drawCooldown() {
  const left = cooldownLeft(), on = left > 0 && !S.spectating;
  if (on) {
    if (!cdOn) cdShown = 0;
    cdShown = Math.max(cdShown, 1 - left / S.cooldown);
    $('cdFill').style.width = (100 * cdShown).toFixed(2) + '%';
  }
  cdOn = on;
  requestAnimationFrame(drawCooldown);
})();

// ---------------------------------------------------------------- the hangar
const H = {
  tab: 'crew',
  sel: { crew: null, arms: null },     // card shown in the detail pane
  picked: { crew: false, arms: false }, // true once the player (or the equipped card) chose it
  shine: { crew: null, arms: null },   // shine shown in the detail pane
  pending: { crew: null, arms: null }, // first-time picks waiting for the other slot
  busy: false,
};
const kindOf = tab => tab === 'weapons' ? 'arms' : 'crew';
const ownedOf = kind => (S.owned && S.owned[kind]) || {};
const ownedCount = (kind, s) => s.templates.reduce((n, t) => n + ((ownedOf(kind)[t] || []).length), 0);
const cardOwned = card => card.shines.reduce((n, s) => n + ownedCount(card.kind, s), 0);

// the loadout on chain, as long as its cards are still in the wallet
function chainSlot(kind) {
  const p = S.player, tid = Number(kind === 'crew' ? p.equipped_crew_template : p.equipped_weapon_template);
  const asset = String(kind === 'crew' ? p.equipped_crew_asset : p.equipped_weapon_asset), t = TPL.get(tid);
  if (!t || !Number(asset)) return null;
  if (S.owned && !(ownedOf(kind)[tid] || []).includes(asset)) return null;   // sold or moved since
  return { tid, asset, card: t.card, shine: t.shine };
}
const slotOf = kind => H.pending[kind] || chainSlot(kind);
const needsSetup = () => !chainSlot('crew') || !chainSlot('arms');
const tabOf = kind => kind === 'arms' ? 'weapons' : 'crew';

async function openHangar() {
  $('hangar').showModal();
  H.pending = { crew: null, arms: null };
  // start on what is equipped; a first-time player starts at step 1
  for (const kind of ['crew', 'arms']) {
    const cur = chainSlot(kind);
    if (cur && !H.picked[kind]) { H.sel[kind] = cur.card; H.shine[kind] = cur.shine; H.picked[kind] = true; }
  }
  if (needsSetup()) H.tab = !chainSlot('crew') ? 'crew' : 'weapons';
  setTab(H.tab);
  if (!S.owned) {
    say($('hgStatus'), 'Loading your Alien Worlds cards…');
    try {
      const [crew, arms] = await Promise.all([chain.getOwned(S.account, 'crew.worlds'), chain.getOwned(S.account, 'arms.worlds')]);
      S.owned = { crew, arms };
      say($('hgStatus'), '');
    } catch (err) { say($('hgStatus'), err.message, true); }
    if (needsSetup() && H.tab !== 'profile') H.tab = !chainSlot('crew') ? 'crew' : 'weapons';
    setTab(H.tab);
  }
  renderFoot();
}
function say(el, text, err = false) { el.textContent = text; el.classList.toggle('err', err); }
$('hangarBtn').addEventListener('click', () => { closeMeMenu(); openHangar(); });
// the docked cards open the hangar on their own tab
for (const [id, tab] of [['tCrew', 'crew'], ['tArms', 'weapons']]) $(id).addEventListener('click', () => { if (S.spectating || !S.player) return; H.tab = tab; openHangar(); });
$('hgClose').addEventListener('click', () => $('hangar').close());
$('dBack').addEventListener('click', () => $('hgCards').classList.remove('detail-open'));

function setTab(tab) {
  H.tab = tab;
  $('hgCards').classList.remove('detail-open');   // phones: back to the list
  $('dBack').textContent = tab === 'crew' ? '‹ All crew' : '‹ All weapons';
  for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  const profile = tab === 'profile';
  $('hgCards').hidden = profile; $('hgFoot').hidden = profile; $('hgProfile').hidden = !profile;
  renderSteps();
  if (profile) { $('tagInput').value = S.player.playertag; tagCount(); $('tagInput').focus(); return; }
  renderList(); renderDetail();
}
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
$('hgSteps').addEventListener('click', e => { const s = e.target.closest('.step'); if (s) setTab(tabOf(s.dataset.kind)); });
$('hgSearch').addEventListener('input', renderList);
$('hgOwned').addEventListener('change', renderList);

// first time (or a slot is empty): Step 1 spacecraft, Step 2 weapon
function renderSteps() {
  const show = !!S.player && H.tab !== 'profile' && (needsSetup() || !!H.pending.crew || !!H.pending.arms);
  $('hgSteps').hidden = !show;
  if (!show) return;
  for (const el of $('hgSteps').children) {
    const kind = el.dataset.kind, cur = slotOf(kind);
    el.classList.toggle('done', !!cur);
    el.classList.toggle('active', kindOf(H.tab) === kind);
    el.title = cur ? cur.card.name + ' · ' + cur.shine.shine : (kind === 'crew' ? 'Your crew card becomes your ship' : 'What your ship fires');
  }
}

function renderList() {
  if (H.tab === 'profile') return;
  const kind = kindOf(H.tab), q = $('hgSearch').value.trim().toLowerCase(), onlyOwned = $('hgOwned').checked;
  const cards = (kind === 'crew' ? CREW_CARDS : ARMS_CARDS)
    .filter(c => !q || c.name.toLowerCase().includes(q))
    .filter(c => !onlyOwned || cardOwned(c) > 0)
    .sort((a, b) => (cardOwned(b) > 0) - (cardOwned(a) > 0) || AWDesign.rarityLevel(b.rarity) - AWDesign.rarityLevel(a.rarity) || a.name.localeCompare(b.name));
  if (!H.picked[kind] && cards.length) { H.sel[kind] = cards[0]; H.shine[kind] = null; }   // nothing chosen yet: the top of the list
  const list = $('hgList'), cur = slotOf(kind);
  list.innerHTML = cards.length ? '' : '<p style="color:var(--mute);padding:10px">' + (onlyOwned ? 'You do not own any of these yet.' : 'Nothing found.') + '</p>';
  for (const c of cards) {
    const n = cardOwned(c), b = document.createElement('button'), on = cur && cur.card === c;
    b.type = 'button'; b.className = 'item' + (n ? '' : ' dim'); b.setAttribute('role', 'listitem');
    if (H.sel[kind] === c) b.setAttribute('aria-current', 'true');
    b.innerHTML = '<img alt="" loading="lazy" referrerpolicy="no-referrer" data-ipfs="' + c.img + '" src="' + thumb(c.img) + '"><span><span class="nm">' + esc(c.name) + '</span><span class="rr rar-' + c.rarity + '">' + c.rarity + ' · ' + esc(kind === 'crew' ? c.element : c.cls) + '</span></span>' +
      '<span class="own' + (n ? ' yes' : '') + '">' + (on ? (H.pending[kind] ? 'Selected' : 'Equipped') : S.owned ? (n ? n + ' owned' : 'Not owned') : '') + '</span>';
    b.addEventListener('click', () => { H.sel[kind] = c; H.shine[kind] = null; H.picked[kind] = true; renderList(); renderDetail(); $('hgCards').classList.add('detail-open'); });
    list.appendChild(b);
  }
}

function renderDetail() {
  if (H.tab === 'profile') return;
  const kind = kindOf(H.tab), c = H.sel[kind];
  if (!c) return;
  // show an owned shine first (the best one), otherwise the plain one
  if (!H.shine[kind] || !c.shines.includes(H.shine[kind])) H.shine[kind] = [...c.shines].reverse().find(s => ownedCount(kind, s) > 0) || c.shines[0];
  const s = H.shine[kind], have = ownedCount(kind, s);
  $('dRar').innerHTML = '<span class="rar-' + c.rarity + '">' + c.rarity + '</span>';
  $('dName').textContent = c.name;
  $('dMeta').textContent = kind === 'crew' ? (c.race && c.race !== 'Unknown' ? c.race + ' · ' : '') + c.element : c.cls + ' class';
  $('dShines').innerHTML = '';
  for (const x of c.shines) {
    const n = ownedCount(kind, x), b = document.createElement('button');
    b.type = 'button'; b.className = 'shine ' + x.shine + (n ? ' owned' : ' missing');
    b.setAttribute('aria-pressed', String(x === s));
    b.innerHTML = '<b>' + x.shine + '</b><span>' + (S.owned ? (n ? n + ' owned' : 'Not owned') : '…') + '</span>';
    b.addEventListener('click', () => { H.shine[kind] = x; renderDetail(); });
    $('dShines').appendChild(b);
  }
  $('dDmg').textContent = damageOf(c, s);
  $('dAD').textContent = s.attack + ' · ' + s.defense;
  $('dLore').textContent = c.description.length > 260 ? c.description.slice(0, 257) + '…' : c.description;
  const cur = slotOf(kind), isOn = cur && cur.card === c && cur.shine === s, other = slotOf(kind === 'crew' ? 'arms' : 'crew');
  const btn = $('dEquip');
  btn.disabled = !have || isOn || H.busy;
  const otherPending = other && H.pending[kind === 'crew' ? 'arms' : 'crew'];
  btn.textContent = H.busy ? 'Equipping…' : isOn ? (H.pending[kind] ? 'Selected' : 'Equipped') : otherPending ? 'Equip loadout' : other ? 'Equip' : (kind === 'crew' ? 'Choose this ship' : 'Choose this weapon');
  $('dNote').textContent = !S.owned ? '' :
    isOn ? (H.pending[kind] ? 'Selected. Now choose your ' + (kind === 'crew' ? 'weapon' : 'spacecraft') + ' to finish.' : 'This is on your ship right now.') :
    !have ? 'You do not own this ' + (kind === 'crew' ? 'crew' : 'weapon') + ' in ' + s.shine + '. You can still look at it.' :
    otherPending ? 'Step 2 of 2. This equips your ' + other.card.name + ' and this ' + (kind === 'crew' ? 'spacecraft' : 'weapon') + ' together.' :
    other ? 'One click: your ' + (kind === 'crew' ? 'weapon' : 'spacecraft') + ' stays as it is.' :
    'Step ' + (kind === 'crew' ? '1 of 2' : '2 of 2') + '. Next you choose your ' + (kind === 'crew' ? 'weapon' : 'spacecraft') + '.';
  setPreview(kind, c, s);
}

$('dEquip').addEventListener('click', async () => {
  const kind = kindOf(H.tab), c = H.sel[kind], s = H.shine[kind];
  const tid = s.templates.find(t => (ownedOf(kind)[t] || []).length);
  if (!tid || H.busy) return;
  const pick = { tid, asset: String(ownedOf(kind)[tid][0]), card: c, shine: s };
  const otherKind = kind === 'crew' ? 'arms' : 'crew', other = slotOf(otherKind);
  if (!other) {   // first pick done: hold it and move on to the other slot
    H.pending[kind] = pick;
    say($('hgStatus'), 'Nice choice. Now pick your ' + (otherKind === 'crew' ? 'spacecraft' : 'weapon') + '.');
    setTab(tabOf(otherKind)); renderFoot();
    return;
  }
  const crew = kind === 'crew' ? pick : other, arms = kind === 'arms' ? pick : other;
  H.busy = true; renderDetail(); say($('hgStatus'), 'Confirm in your wallet…');
  try {
    await chain.setequip(arms.asset, crew.asset);
    say($('hgStatus'), 'Equipped. Your ship is being refitted.');
    for (let i = 0; i < 10; i++) {   // wait until the chain shows it
      await new Promise(r => setTimeout(r, 800));
      const p = await chain.getPlayer(S.account);
      if (p && String(p.equipped_crew_asset) === crew.asset && String(p.equipped_weapon_asset) === arms.asset) { S.player = p; break; }
    }
    H.pending = { crew: null, arms: null };
    ensureShip(S.player); showMe();
  } catch (err) { say($('hgStatus'), chain.friendlyError(err), true); }
  H.busy = false;
  renderList(); renderDetail(); renderFoot();
});

function renderFoot() {
  for (const [kind, el] of [['crew', $('slotCrew')], ['arms', $('slotWeapon')]]) {
    const st = slotOf(kind);
    el.querySelector('b').textContent = st ? st.card.name + ' · ' + st.shine.shine + (H.pending[kind] ? ' (selected)' : '') : 'Not chosen yet';
    el.classList.toggle('changed', !!H.pending[kind]);
  }
  renderSteps();
}

// playertag
const bytes = s => new TextEncoder().encode(s).length;   // the contract counts bytes
function tagCount() { const n = bytes($('tagInput').value.trim()); $('tagCount').textContent = n + ' / 10'; $('tagSave').disabled = n < 4 || n > 10 || $('tagInput').value.trim() === S.player.playertag; }
$('tagInput').addEventListener('input', tagCount);
$('tagSave').addEventListener('click', async () => {
  const tag = $('tagInput').value.trim();
  $('tagSave').disabled = true; say($('tagStatus'), 'Confirm the new playertag in your wallet…');
  try {
    await chain.settag(tag);
    for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 800)); const p = await chain.getPlayer(S.account); if (p && p.playertag === tag) { S.player = p; break; } }
    say($('tagStatus'), 'Saved. Everyone in orbit now sees you as ' + tag + '.');
    ensureShip(S.player); showMe();
  } catch (err) { say($('tagStatus'), chain.friendlyError(err), true); }
  tagCount();
});

// the preview: a crew ship turning on its stand, or a ship firing the weapon at a small planet
const PV = { kind: 'crew', crew: DEFAULT_CREW, arm: null };
const PV_PLANET = { name: 'Ashfall', pos: [0.95, -0.3, -1.1], size: 0.8, R: 22, tilt: 0.3 };
const PV_SHIP_POS = [-0.75, 0.25, 0.55];
function setPreview(kind, c, s) {
  if (kind === 'crew') { PV.kind = 'crew'; PV.crew = { name: c.name, rarity: c.rarity, element: c.element, variant: c.variant, shine: s.shine }; PV.arm = null; return; }
  PV.kind = 'arms';
  const staged = slotOf('crew');
  PV.crew = staged ? crewOf({ card: staged.card, shine: staged.shine }) : DEFAULT_CREW;   // your spacecraft fires it
  const toShip = PV_SHIP_POS.map((v, i) => v - PV_PLANET.pos[i]);
  // fired as in the game: a burst of single shots, about one per 5 damage
  const shots = Math.max(4, Math.min(18, Math.round(damageOf(c, s) / 5)));
  PV.arm = HeroGL.armory({ planet: PV_PLANET, list: [[c.name, s.shine]], every: 1.6, delay: 0.3, aimDir: toShip, spread: 0.15, burst: { shots, gap: 0.14 } });
}
HeroGL.view($('hgPreview'), t => PV.kind === 'crew'
  ? { eye: [0, 0.55, 3.4], at: [0, 0, 0], fov: 0.55, halo: null, ships: [{ ...PV.crew, pos: [0, 0, 0], fwd: [Math.sin(t * 0.5), 0, Math.cos(t * 0.5)], size: 0.62 }] }
  : { eye: [-0.2, 0.35, 2.4], at: [0.1, 0, -0.3], fov: 0.62, halo: [1, 0.6, 0.35], planets: [{ ...PV_PLANET, yaw: 0.6 }], fx: PV.arm ? [PV.arm] : [],
      ships: [{ ...PV.crew, pos: PV_SHIP_POS, fwd: PV_PLANET.pos.map((v, i) => v - PV_SHIP_POS[i]), size: 0.32 }] },
  (ctx, o) => HeroGL.plumes(ctx, o, 'rgba(255,150,80,A)', 0.6));

// ---------------------------------------------------------------- start
(async () => {
  // ?as=account looks at the game as that player, read-only (for testing; nothing can be signed)
  const as = new URLSearchParams(location.search).get('as');
  if (as) { S.account = as; S.spectating = true; window.hashRush = { S, playHit, ensureShip, openHangar, showMe, catchUp }; }
  else { try { S.account = await chain.restoreSession(); } catch (err) { S.account = undefined; } }
  try { await refreshPlayer(); } catch (err) { console.error(err); showMe(); }
  startPolling();
})();
