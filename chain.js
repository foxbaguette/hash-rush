// Million Block Planets on WAX: wallet sessions (WharfKit: Anchor and WAX Cloud Wallet) and
// reads from the game contract. Shared by the landing page and the game screen.

export const CONTRACT = 'planetmining';
export const APP_NAME = 'The Hash Rush';
export const CHAIN_ID = '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4';
/** WAX API nodes, one per operator; reads try them in turn. */
export const RPC_NODES = [
  'https://wax.greymass.com',
  'https://api.wax.alohaeos.com',
  'https://wax.eosphere.io',
  'https://api.waxsweden.org',
  'https://wax.eosusa.io',
];

// ---------------------------------------------------------------- reads
let nodeAt = 0;
async function rpc(path, body) {
  let lastErr;
  for (let n = 0; n < RPC_NODES.length; n++) {
    const node = RPC_NODES[(nodeAt + n) % RPC_NODES.length];
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
      const res = await fetch(node + path, { method: 'POST', body: JSON.stringify(body), signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(node + ' answered ' + res.status);
      const json = await res.json();
      nodeAt = (nodeAt + n) % RPC_NODES.length;   // stay on a node that works
      return json;
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error('No WAX node answered.');
}
function rows(table, opts = {}) {
  return rpc('/v1/chain/get_table_rows', { json: true, code: CONTRACT, scope: CONTRACT, table, limit: 1, ...opts }).then(r => r.rows || []);
}

/** The player's row, or null when the account has not signed up yet. */
export async function getPlayer(account) {
  const [row] = await rows('players', { lower_bound: account, upper_bound: account });
  return row && row.wallet === account ? row : null;
}

/** The game config: radius limits, expected time per planet and the cooldown between attacks. */
export async function getConfig() {
  const [row] = await rows('config', { lower_bound: '0', upper_bound: '0' });
  return row || null;
}

/** The damage the contract has stored per template (it adds a template the first time someone equips it). */
export async function getTemplates() {
  return rows('templates', { limit: 1000 });
}

/** The planet being mined right now: the newest row of the track table. */
export async function getCurrentPlanet() {
  const [row] = await rows('track', { reverse: true });
  return row || null;
}

/** Players whose last attack was at or after this unix time (secondary index lastaction). */
export async function getActivePlayers(sinceSec) {
  return rows('players', { index_position: 2, key_type: 'i64', lower_bound: String(Math.floor(sinceSec)), limit: 200 });
}
/** Attack log entries after this index, oldest first. */
export async function getLogsAfter(index) {
  return rows('log', { lower_bound: String(index + 1), limit: 100 });
}
/** Index of the newest log entry, or -1 when nothing has been logged yet. */
export async function getLatestLogIndex() {
  const [row] = await rows('log', { reverse: true });
  return row ? Number(row.index) : -1;
}
/** Seconds since the epoch of a chain timestamp (time_point_sec is UTC without a zone). */
export const chainTime = s => Date.parse(s + 'Z') / 1000;

// ---------------------------------------------------------------- Alien Worlds NFTs
const AA_NODES = ['https://wax.api.atomicassets.io', 'https://wax-aa.eu.eosamsterdam.net', 'https://aa.wax.blacklusion.io'];
/** asset ids by template id for one schema (crew.worlds / arms.worlds) of the alien.worlds collection. */
export async function getOwned(owner, schema) {
  for (const node of AA_NODES) {
    try {
      const out = {};
      for (let page = 1; page < 20; page++) {
        const res = await fetch(node + '/atomicassets/v1/assets?owner=' + owner + '&collection_name=alien.worlds&schema_name=' + schema + '&limit=1000&page=' + page);
        if (!res.ok) throw new Error(node + ' answered ' + res.status);
        const { data } = await res.json();
        for (const a of data) (out[a.template.template_id] ||= []).push(a.asset_id);
        if (data.length < 1000) return out;
      }
      return out;
    } catch (err) { /* next node */ }
  }
  throw new Error('Could not load your Alien Worlds cards right now.');
}

/** Blocks of a planet with this radius, counted exactly like the contract's getplanetblocks. */
export function chainBlocks(radius) {
  const r2 = radius * radius;
  let blocks = 0;
  for (let x = 0; x <= radius; x++) for (let y = 0; y <= radius; y++) {
    const rest = r2 - (x + 0.5) * (x + 0.5) - (y + 0.5) * (y + 0.5);
    if (rest >= 0.25) blocks += Math.floor(Math.sqrt(rest) - 0.5) + 1;
  }
  return blocks * 8;
}

// ---------------------------------------------------------------- wallet
const QUICK_PERMISSION = 'hashrush';   // the account permission auto-signed actions are signed with
// the game's actions a player may let sign by themselves (signup comes before there is a player)
export const AUTO_ACTIONS = [
  { name: 'attack', label: 'Attack', note: 'Fire at the planet' },
  { name: 'setequip', label: 'Equip', note: 'Change your crew or weapon' },
  { name: 'settag', label: 'Playertag', note: 'Change your playertag' },
  { name: 'powerup', contract: 'eosio', label: 'CPU powerup', note: 'Rent CPU for 24 hours. Spends WAX' },
];
const contractOf = name => AUTO_ACTIONS.find(a => a.name === name)?.contract || CONTRACT;
// the whitelist, one entry per contract
const groupAuto = names => [...new Set(names.map(contractOf))].map(c => ({ contract: c, actions: names.filter(n => contractOf(n) === c) }));
const AUTO_KEY = 'hashrush.autosign.v1';
const savedAuto = () => { try { const a = JSON.parse(localStorage.getItem(AUTO_KEY)); if (Array.isArray(a)) return a; } catch { /* none */ } return ['attack']; };
let Name = null;
const whitelistOf = names => groupAuto(names).map(g => ({ contract: Name.from(g.contract), actions: g.actions.map(n => Name.from(n)) }));
let kit = null, current;
let onPickerClosed = null;   // set while the wallet picker is open

// The wallet code (about 600 KB) is only downloaded when someone reaches for it.
function getKit() {
  kit ??= (async () => {
    const W = await import('./vendor/wharfkit.js?v=4.0.2b');
    const { SessionKit, ChainDefinition, WebRenderer, WalletPluginAnchor, WalletPluginCloudWallet } = W;
    Name = W.Name;
    const ui = new WebRenderer();
    // closing the picker (x, Escape, backdrop) cancels login silently; hear it so login() settles
    const addCancelable = ui.addCancelablePromise;
    ui.addCancelablePromise = cancel => addCancelable((reason, silent) => { onPickerClosed?.(); return cancel(reason, silent); });
    return new SessionKit({
      appName: APP_NAME,
      chains: [ChainDefinition.from({ id: CHAIN_ID, url: RPC_NODES[0] })],
      ui,
      walletPlugins: [new WalletPluginCloudWallet(), new WalletPluginAnchor()],
    }, {
      // auto-sign: a key kept in this browser that may sign only the actions the player chose
      sessionKey: { permission: QUICK_PERMISSION, whitelist: groupAuto(savedAuto()) },
    });
  })();
  kit.catch(() => { kit = null; });   // a failed download can be retried
  return kit;
}
export function preloadWallet() { getKit().catch(() => undefined); }

function hasStoredSession() {
  try { return localStorage.getItem('wharf--session') !== null; } catch { return false; }
}
const isUserCancel = err => /cancel|closed|rejected by user|user rejected|denied/i.test(err instanceof Error ? err.message : String(err ?? ''));

/** The account of the last session in this browser, if the wallet still has it. */
export async function restoreSession() {
  if (!hasStoredSession()) return undefined;
  try { current = await (await getKit()).restore(); } catch { current = undefined; }
  return current ? String(current.actor) : undefined;
}

/** Opens the wallet picker. Resolves to the account, or undefined when the player closes it. */
export async function login() {
  const k = await getKit();
  const closed = new Promise(resolve => { onPickerClosed = () => resolve(undefined); });
  try {
    const result = await Promise.race([k.login(), closed]);
    if (!result) return undefined;
    current = result.session;
    return String(current.actor);
  } catch (err) {
    if (isUserCancel(err)) return undefined;
    throw err;
  } finally { onPickerClosed = null; }
}

export async function logout() {
  const k = await getKit();
  await k.logout(current);
  current = undefined;
}

export function account() { return current ? String(current.actor) : undefined; }

/** Signs and broadcasts the actions; resolves to the transaction id. */
export async function transact(actions) {
  if (!current) await restoreSession();
  if (!current) throw new Error('Connect a wallet first.');
  const result = await current.transact({ actions }, { broadcast: true, expireSeconds: 120 });
  return String(result.resolved?.transaction.id ?? '');
}

/** Signs the player up with their playertag (the player pays the RAM for their row). */
export function signup(playertag) {
  const actor = String(current.actor), permission = String(current.permission);
  return transact([{ account: CONTRACT, name: 'signup', authorization: [{ actor, permission }], data: { wallet: actor, playertag } }]);
}

/** Changes the playertag. */
export function settag(playertag) {
  const actor = String(current.actor), permission = String(current.permission);
  return transact([{ account: CONTRACT, name: 'settag', authorization: [{ actor, permission }], data: { wallet: actor, playertag } }]);
}
/** Equips a weapon (arms.worlds) and a crew (crew.worlds) asset; both are required. */
export function setequip(weaponAssetId, crewAssetId) {
  const actor = String(current.actor), permission = String(current.permission);
  return transact([{ account: CONTRACT, name: 'setequip', authorization: [{ actor, permission }], data: { wallet: actor, weapon_asset_id: String(weaponAssetId), crew_asset_id: String(crewAssetId) } }]);
}

/** Attacks the current planet with the equipped crew and weapon. */
export function attack(mine = false) {
  const actor = String(current.actor), permission = String(current.permission);
  return attackHasMine().then(has => transact([{ account: CONTRACT, name: 'attack', authorization: [{ actor, permission }],
    data: has ? { wallet: actor, mine: !!mine } : { wallet: actor } }]));
}

// ---------------------------------------------------------------- CPU and the eosio powerup
/** An account's CPU right now, in microseconds, and its WAX. */
export async function getCpu(account) {
  const a = await rpc('/v1/chain/get_account', { account_name: account });
  const c = a.cpu_limit || {};
  return { used: Number(c.used) || 0, available: Number(c.available) || 0, max: Number(c.max) || 0, wax: parseFloat(a.core_liquid_balance) || 0 };
}
const POWERUP_FRAC = 1e15;
const CPU_SAMPLE = 'm.federation';   // a big, steady staker: how much CPU one unit of stake gives right now
/** What the powerup estimate needs: the market's state and CPU per unit of weight. */
export async function getPowerup() {
  const [st, sample] = await Promise.all([
    rpc('/v1/chain/get_table_rows', { json: true, code: 'eosio', scope: '0', table: 'powup.state', limit: 1 }).then(r => r.rows?.[0]),
    rpc('/v1/chain/get_account', { account_name: CPU_SAMPLE }),
  ]);
  if (!st) throw new Error('The powerup is not available right now.');
  return { cpu: st.cpu, at: Date.now() / 1000, usPerWeight: Number(sample.cpu_limit.max) / Number(sample.cpu_weight) };
}
// the fee in WAX for a share (frac of 1e15) of the CPU market, as eosio's powerup.cpp computes it
function powerupFee(pw, frac) {
  const r = pw.cpu, weight = Number(r.weight), util = Number(r.utilization), exp = Number(r.exponent);
  const min = parseFloat(r.min_price), max = parseFloat(r.max_price);
  // adjusted utilization decays toward utilization over decay_secs
  let adj = Number(r.adjusted_utilization);
  if (adj > util) adj = util + (adj - util) * Math.exp(-(pw.at - chainTime(r.utilization_timestamp)) / Number(r.decay_secs));
  const priceAt = u => exp - 1 <= 0 ? max : min + (max - min) * Math.pow(u / weight, exp - 1);
  const integral = (a, b) => min * (b - a) / weight + (max - min) / exp * (Math.pow(b / weight, exp) - Math.pow(a / weight, exp));
  const inc = frac * weight / POWERUP_FRAC;
  let start = util, fee = 0;
  if (start < adj) { fee += priceAt(adj) * Math.min(inc, adj - start) / weight; start = adj; }
  if (start < util + inc) fee += integral(start, util + inc);
  return fee;
}
/** How much CPU `wax` buys for 24 hours: the share to ask for and about how many ms it gives. */
export function powerupFor(pw, wax) {
  if (!(wax > 0)) return { frac: 0, ms: 0 };
  let lo = 0, hi = POWERUP_FRAC;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (powerupFee(pw, mid) <= wax) lo = mid; else hi = mid; }
  const frac = Math.floor(lo);
  return { frac, ms: frac / POWERUP_FRAC * Number(pw.cpu.weight) * pw.usPerWeight / 1000 };
}
/** Rents CPU for 24 hours, paying at most `wax`. */
export async function powerup(wax) {
  const pw = await getPowerup();
  const { frac } = powerupFor(pw, wax * 0.98);   // a little room for the price moving before the block
  if (frac <= 0) throw new Error('That is too little WAX for a powerup.');
  const actor = String(current.actor), permission = String(current.permission);
  return transact([{ account: 'eosio', name: 'powerup', authorization: [{ actor, permission }],
    data: { payer: actor, receiver: actor, days: 1, net_frac: 0, cpu_frac: String(frac), max_payment: wax.toFixed(8) + ' WAX' } }]);
}

/** Whether the deployed contract's attack takes "mine" (mining: hashlings per block, automated tasks).
 *  Read once from the contract's ABI, so the site works before and after that version is deployed. */
let mineCheck = null;
export function attackHasMine() {
  mineCheck ??= rpc('/v1/chain/get_abi', { account_name: CONTRACT })
    .then(r => !!r.abi?.structs?.find(s => s.name === 'attack')?.fields?.some(f => f.name === 'mine'))
    .catch(() => { mineCheck = null; return false; });
  return mineCheck;
}

/** The planets so far, newest first: index, planet, radius, spawn_time, destroyed_blocks. */
export function getPlanetHistory(limit = 60) {
  return rows('track', { reverse: true, limit });
}
/** Who found the hash of each planet (newest first); empty until the contract has the finders table. */
export function getFinders(limit = 60) {
  return rows('finders', { reverse: true, limit }).catch(() => []);
}

/** Auto-sign (WharfKit session keys): the chosen actions sign in this browser without the wallet
 *  window. A key is generated here and added to the account as the "hashrush" permission, linked
 *  to exactly those actions; everything else still goes through the wallet. */
export async function autoSignActions() {
  if (!current) await restoreSession();
  if (!current) return [];
  try {
    if (!(await current.getSessionKeyStatus()).active) return [];
    return current.walletPlugin.getWhitelist().flatMap(e => (e.actions || []).map(String));
  } catch { return []; }
}
/** Applies a new set of auto-signed actions: one wallet approval (first set-up, a change of the
 *  set, or turning it all off). */
export async function setAutoSign(names) {
  if (!current) await restoreSession();
  if (!current) throw new Error('Connect a wallet first.');
  await getKit();
  const mgr = current.sessionKeyManager, active = (await current.getSessionKeyStatus()).active;
  const before = { mgr: mgr.whitelist, wallet: active ? current.walletPlugin.whitelist : null };
  const list = whitelistOf(names);
  try {
    if (!names.length) {
      if (active) await current.removeSessionKey();
    } else if (!active) {
      mgr.whitelist = list;
      await current.setupSessionKey();
    } else {
      mgr.whitelist = list;
      current.walletPlugin.whitelist = list;   // signs what was chosen; saved with the session
      await current.updateSessionKeyLinks();
    }
  } catch (err) {
    mgr.whitelist = before.mgr;
    if (before.wallet) current.walletPlugin.whitelist = before.wallet;
    throw err;
  }
  try { localStorage.setItem(AUTO_KEY, JSON.stringify(names)); } catch { /* the chain still has it */ }
}

/** Turns a wallet or chain error into a sentence a player can read. */
export function friendlyError(err) {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (isUserCancel(err)) return 'The wallet request was closed.';
  const msg = raw.replace(/^.*assertion failure with message:\s*/i, '').replace(/\s*- 3\s*$/, '').trim();
  return msg ? msg.charAt(0).toUpperCase() + msg.slice(1) : 'The transaction failed.';
}
