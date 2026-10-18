// The Hash Rush, live screen: the planet being mined on planetmining, every crew that attacked in
// the last 30 minutes in orbit, the attack log replayed as it comes in, and the hangar where a
// player changes their playertag and equips crew and weapon.
import * as chain from './chain.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = n => Number(n).toLocaleString('en-US');
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
const thumb = img => 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + img + '&size=370';

// ---------------------------------------------------------------- state
const S = {
  account: undefined, player: null,
  damage: new Map(),    // template id -> damage stored on the contract
  shown: null,          // the planet on screen: { index, total, destroyed }
  lastLog: -1, carry: 0,
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
  $('crewsWord').textContent = S.ships.size === 1 ? 'crew' : 'crews';
}
function loadPlanet(tr) {
  const total = chain.chainBlocks(Number(tr.radius)), destroyed = Math.min(total, Number(tr.destroyed_blocks));
  if (!planet.load(tr.planet, Number(tr.radius), Number(tr.seed), 1 - destroyed / total)) { $('busy').textContent = 'Unknown planet: ' + tr.planet; return; }
  S.shown = { index: Number(tr.index), total, destroyed };
  S.carry = 0;
  $('busy').hidden = true;
  document.body.classList.add('ready');
  updateHud();
}

// ---------------------------------------------------------------- the fleet
function ensureShip(p) {
  const crewT = TPL.get(Number(p.equipped_crew_template)), weaponT = TPL.get(Number(p.equipped_weapon_template));
  const sig = [p.equipped_crew_template, p.equipped_weapon_template, p.playertag, p.color].join('#');
  const cur = S.ships.get(p.wallet);
  if (cur && cur.sig === sig) return cur.id;
  if (cur) planet.fleet.remove(cur.id);
  const id = planet.fleet.addPlayer({ tag: p.playertag, color: colorOf(p), crew: crewOf(crewT), weapon: weaponOf(weaponT), wallet: p.wallet, me: p.wallet === S.account });
  S.ships.set(p.wallet, { id, sig, weapon: weaponOf(weaponT) });
  return id;
}
function dropShip(wallet) {
  const s = S.ships.get(wallet);
  if (s) { planet.fleet.remove(s.id); S.ships.delete(wallet); }
}

// ---------------------------------------------------------------- what happened: feed and banner
// kill feed: newest row on top, at most six, the older ones (and anything after 9 s) fade
function feed(html, opts = {}) {
  const el = document.createElement('div');
  el.className = 'row' + (opts.hash ? ' hash' : '');
  if (opts.color) el.style.setProperty('--pc', opts.color);
  el.innerHTML = html;
  const box = $('feed');
  box.prepend(el);
  while (box.children.length > 6) box.lastChild.remove();
  [...box.children].forEach((r, i) => r.classList.toggle('old', i >= 3));
  setTimeout(() => el.classList.add('old'), 9000);
}
const ARMS_BY_NAME = Object.fromEntries(ARMS_CARDS.map(c => [c.name, c]));
let bannerTimer = 0;
function banner(tag, color) {
  $('bannerName').innerHTML = '<span style="color:' + color + '">' + esc(tag) + '</span>';
  $('bannerText').textContent = 'broke the hash block. A new world is on its way.';
  $('banner').classList.add('on');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => $('banner').classList.remove('on'), 7000);
}
function playHit(log) {
  if (!S.shown) return;
  const dmg = Number(log.damage_done), ship = S.ships.get(log.wallet);
  // the same share of the game planet as of the contract's planet; leftovers carry over
  const exact = planet.total * dmg / S.shown.total + S.carry, n = Math.floor(exact);
  S.carry = exact - n;
  if (n > 0) planet.attack(n, ship ? ship.id : undefined);
  S.shown.destroyed = Math.min(S.shown.total, S.shown.destroyed + dmg);
  updateHud();
  const color = colorOfWallet(log.wallet);
  const weapon = ship ? ship.weapon.split('|')[0] : 'Weapon', rarity = (ARMS_BY_NAME[weapon] || {}).rarity || 'Common';
  feed('<span class="who" style="color:' + color + '">' + esc(log.playertag) + '</span><span class="ar">▸</span><span class="wchip rar-' + rarity + '">' + esc(weapon) + '</span><span class="ar">▸</span><span class="num">' + fmt(dmg) + '</span>', { color });
  if (log.hash_found) {
    feed('<b>' + esc(log.playertag) + '</b><span>found the hash</span><span>· new world incoming</span>', { hash: true });
    banner(log.playertag, color);
  }
}
const knownPlayers = new Map();   // wallet -> latest player row we have seen
const colorOfWallet = w => knownPlayers.has(w) ? colorOf(knownPlayers.get(w)) : '#ff8a3d';

// ---------------------------------------------------------------- polling
async function poll() {
  const now = Date.now() / 1000;
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
  for (const log of logs) {
    S.lastLog = Math.max(S.lastLog, Number(log.index));
    const mine = log.wallet === S.account && Date.now() - S.firedAt < 60000;
    setTimeout(() => playHit(log), mine ? 200 : Math.random() * POLL_MS * 0.9);
  }
  if (Number(tr.index) !== S.shown.index) {
    setTimeout(() => loadPlanet(tr), POLL_MS);   // the hash was found: the new world arrives after the replay
  } else {
    // after the replay, settle on the contract's own count
    setTimeout(() => { if (S.shown && S.shown.index === Number(tr.index)) { S.shown.destroyed = Math.max(S.shown.destroyed, Math.min(S.shown.total, Number(tr.destroyed_blocks))); updateHud(); } }, POLL_MS);
  }
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
  $('hangarBtn').hidden = !p; $('connectBtn').hidden = !!p && !S.spectating;
  const canMenu = !!S.account && !S.spectating;   // signing out lives behind your playertag
  $('who').classList.toggle('menu', canMenu); $('who').disabled = !canMenu;
  if (!canMenu) closeMeMenu();
  if (S.spectating) $('connectBtn').textContent = 'Use my wallet';
  $('loadout').hidden = !p;
  if (p) {
    $('who').innerHTML = '<small>Playing as</small><b style="color:' + colorOf(p) + '">' + esc(p.playertag) + '</b>';
    const c = TPL.get(Number(p.equipped_crew_template)), w = TPL.get(Number(p.equipped_weapon_template));
    renderDock($('tCrew'), c, 'crew'); renderDock($('tArms'), w, 'arms');
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
  el.innerHTML = '<img alt="" src="' + thumb(t.card.img) + '"><span class="shb" style="background:' + SHINE_COL[t.shine.shine] + '">' + short + '</span>' +
    '<div class="t"><span>' + t.card.rarity + ' ' + what + '</span><b>' + esc(t.card.name) + '</b></div>';
  el.setAttribute('aria-label', 'Your ' + what + ': ' + t.card.name + ', ' + t.card.rarity + ', ' + t.shine.shine + '. Open the hangar');
}
async function refreshPlayer() {
  S.player = S.account ? await chain.getPlayer(S.account) : null;
  if (S.player) { knownPlayers.set(S.player.wallet, S.player); ensureShip(S.player); updateHud(); }
  showMe();
}
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
// your playertag opens a small menu with Sign out
function closeMeMenu() { $('meMenu').hidden = true; $('who').setAttribute('aria-expanded', 'false'); }
$('who').addEventListener('click', e => {
  e.stopPropagation();
  const open = $('meMenu').hidden;
  $('meMenu').hidden = !open; $('who').setAttribute('aria-expanded', String(open));
  if (open) ($('hangarBtn').hidden ? $('signOut') : $('hangarBtn')).focus();
});
document.addEventListener('click', e => { if (!$('meMenu').hidden && !e.target.closest('.who-wrap')) closeMeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('meMenu').hidden) { closeMeMenu(); $('who').focus(); } });
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
  S.firing = true; updateAttack(); say($('attackStatus'), 'Confirm the attack in your wallet…');
  try {
    await chain.attack();
    S.firedAt = Date.now();
    S.player = { ...S.player, last_action: new Date().toISOString().slice(0, 19) };   // the cooldown starts now
    say($('attackStatus'), 'Fired. Watch your ship.');
    // your hit is in the log now: read it right away and play it
    for (let i = 0; i < 4; i++) { await new Promise(r => setTimeout(r, 700)); await pollNow(); }
    setTimeout(() => say($('attackStatus'), ''), 4000);
  } catch (err) {
    say($('attackStatus'), chain.friendlyError(err), true);
  } finally { S.firing = false; updateAttack(); }
});

// cooldown on the button: a filling stripe and a countdown, then a burst when it is ready again
const cooldownLeft = () => !S.player || !S.cooldown ? 0 : Math.max(0, chain.chainTime(S.player.last_action) + S.cooldown - Date.now() / 1000);
const mmss = s => { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let wasCooling = null;
function updateAttack() {
  const btn = $('attackBtn'), wrap = $('fireWrap'), left = cooldownLeft(), cooling = left > 0 && !S.spectating;
  btn.classList.toggle('cooling', cooling);
  if (cooling) {
    $('attackLbl').textContent = 'Recharging ' + mmss(left);
    $('cdFill').style.width = (100 * (1 - left / S.cooldown)).toFixed(1) + '%';
  } else $('attackLbl').textContent = S.firing ? 'Firing…' : S.attackReady ? 'Attack' : 'Equip to attack';
  btn.disabled = S.spectating || cooling || S.firing;
  if (wasCooling && !cooling) {   // charged again
    wrap.classList.remove('flash'); void wrap.offsetWidth; wrap.classList.add('flash');
    setTimeout(() => wrap.classList.remove('flash'), 1800);
    $('attackLbl').textContent = 'Attack ready';
    setTimeout(updateAttack, 1400);
  }
  wrap.classList.toggle('charged', !cooling && !S.firing && S.attackReady && !S.spectating);
  wasCooling = cooling;
}
setInterval(updateAttack, 250);

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

function setTab(tab) {
  H.tab = tab;
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
    b.innerHTML = '<img alt="" loading="lazy" src="' + thumb(c.img) + '"><span><span class="nm">' + esc(c.name) + '</span><span class="rr rar-' + c.rarity + '">' + c.rarity + ' · ' + esc(kind === 'crew' ? c.element : c.cls) + '</span></span>' +
      '<span class="own' + (n ? ' yes' : '') + '">' + (on ? (H.pending[kind] ? 'Selected' : 'Equipped') : S.owned ? (n ? n + ' owned' : 'Not owned') : '') + '</span>';
    b.addEventListener('click', () => { H.sel[kind] = c; H.shine[kind] = null; H.picked[kind] = true; renderList(); renderDetail(); });
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
function tagCount() { const n = bytes($('tagInput').value.trim()); $('tagCount').textContent = n + ' / 12'; $('tagSave').disabled = n < 4 || n > 12 || $('tagInput').value.trim() === S.player.playertag; }
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
  PV.arm = HeroGL.armory({ planet: PV_PLANET, list: [[c.name, s.shine]], every: c.rarity === 'Mythical' ? 4.2 : 2.6, delay: 0.3, aimDir: toShip, spread: 0.15 });
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
  if (as) { S.account = as; S.spectating = true; window.hashRush = { S, playHit, ensureShip, openHangar, showMe }; }
  else { try { S.account = await chain.restoreSession(); } catch (err) { S.account = undefined; } }
  try { await refreshPlayer(); } catch (err) { console.error(err); showMe(); }
  startPolling();
})();
