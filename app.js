'use strict';

const SAVE_KEY = 'road_charter_empire_v2';
const TICK_MS = 1000;
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;
const BUILDING_MAX = 20;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const now = () => Date.now();

const fmtMoney = (value) => `${Math.floor(value).toLocaleString('de-DE')} $`;
const fmtNum = (value) => Math.floor(value).toLocaleString('de-DE');
const percent = (value) => `${Math.round(value)}%`;
const minute = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

const EMBLEMS = {
  wolf: '🐺',
  skull: '☠️',
  eagle: '🦅',
  wheel: '⚙️',
  flame: '🔥'
};

const SELECT_OPTIONS = {
  emblem: [
    ['wolf', 'Wolf'],
    ['skull', 'Skull'],
    ['eagle', 'Adler'],
    ['wheel', 'Rad'],
    ['flame', 'Flamme']
  ],
  vest: [
    ['black', 'Schwarz'],
    ['charcoal', 'Dunkelgrau'],
    ['brown', 'Lederbraun'],
    ['blue', 'Nachtblau']
  ],
  trim: [
    ['red', 'Rot'],
    ['gold', 'Gold'],
    ['steel', 'Stahl'],
    ['green', 'Grün'],
    ['blue', 'Blau']
  ]
};

const BUILDINGS = [
  {
    id: 'clubhouse',
    icon: '🏚️',
    name: 'Clubhouse',
    type: 'core',
    desc: 'Herzstück deines Charters. Erhöht Crew-Limit, Einfluss und Respekt.',
    baseCost: 900,
    growth: 1.52,
    respectCost: 0,
    unlock: 0,
    baseIncome: 18,
    effects: { crewCap: 4, respect: 1.2, influence: 3 }
  },
  {
    id: 'moneyvault',
    icon: '💰',
    name: 'Geldlager',
    type: 'core',
    desc: 'Bestimmt, wie viel Cash du maximal lagern kannst. Ohne Ausbau läuft dein Gewinn über.',
    baseCost: 760,
    growth: 1.48,
    respectCost: 0,
    unlock: 0,
    baseIncome: 0,
    effects: { storage: 8500, defense: 1 }
  },
  {
    id: 'garage',
    icon: '🔧',
    name: 'Bike-Werkstatt',
    type: 'core',
    desc: 'Verbessert Bike-Power und schaltet stärkere Runs frei.',
    baseCost: 1100,
    growth: 1.55,
    respectCost: 5,
    unlock: 0,
    baseIncome: 8,
    effects: { power: 5, defense: 2 }
  },
  {
    id: 'nomadcamp',
    icon: '⛺',
    name: 'Nomad Camp',
    type: 'core',
    desc: 'Bringt neue Fahrer und erhöht dein Crew-Limit deutlich.',
    baseCost: 1280,
    growth: 1.54,
    respectCost: 8,
    unlock: 0,
    baseIncome: 14,
    effects: { crewCap: 6, power: 2 }
  },
  {
    id: 'roadbar',
    icon: '🍻',
    name: 'Road Bar',
    type: 'income',
    desc: 'Dein erster stabiler Geldbringer mit wenig Risiko.',
    baseCost: 1350,
    growth: 1.50,
    respectCost: 6,
    unlock: 1,
    baseIncome: 42,
    effects: { respect: .7, influence: 2 }
  },
  {
    id: 'tattoo',
    icon: '🖋️',
    name: 'Tattoo Shop',
    type: 'income',
    desc: 'Gibt Geld und Respekt in der Szene.',
    baseCost: 1650,
    growth: 1.51,
    respectCost: 10,
    unlock: 2,
    baseIncome: 58,
    effects: { respect: 1.1, influence: 2 }
  },
  {
    id: 'chopshop',
    icon: '🏍️',
    name: 'Custom Shop',
    type: 'income',
    desc: 'Motorrad-Umbauten bringen Geld und Bike-Bonus.',
    baseCost: 2150,
    growth: 1.53,
    respectCost: 14,
    unlock: 3,
    baseIncome: 74,
    effects: { power: 3, heat: .08 }
  },
  {
    id: 'lookout',
    icon: '👁️',
    name: 'Lookout Posten',
    type: 'defense',
    desc: 'Senkt Risiko, bremst Heat und schützt deine Einnahmen.',
    baseCost: 1900,
    growth: 1.50,
    respectCost: 12,
    unlock: 3,
    baseIncome: 4,
    effects: { defense: 5, heatReduce: .18 }
  },
  {
    id: 'eastblock',
    icon: '🏙️',
    name: 'East Block',
    type: 'block',
    desc: 'Erster Stadtblock. Gute Einnahmen, etwas mehr Druck.',
    baseCost: 2600,
    growth: 1.55,
    respectCost: 18,
    unlock: 4,
    baseIncome: 96,
    effects: { control: 4, heat: .16 }
  },
  {
    id: 'southblock',
    icon: '🏚️',
    name: 'South Block',
    type: 'block',
    desc: 'Günstiger Block mit starker Skalierung.',
    baseCost: 3100,
    growth: 1.56,
    respectCost: 22,
    unlock: 5,
    baseIncome: 118,
    effects: { control: 5, heat: .18 }
  },
  {
    id: 'industrial',
    icon: '🏭',
    name: 'Industrial Block',
    type: 'block',
    desc: 'Teuer, aber stark für Cash und Lager.',
    baseCost: 4300,
    growth: 1.58,
    respectCost: 32,
    unlock: 6,
    baseIncome: 166,
    effects: { storage: 1200, control: 7, heat: .22 }
  },
  {
    id: 'harbor',
    icon: '⚓',
    name: 'Harbor Block',
    type: 'block',
    desc: 'Hafenviertel mit sehr starken Einnahmen und mehr Druck.',
    baseCost: 5600,
    growth: 1.60,
    respectCost: 44,
    unlock: 7,
    baseIncome: 224,
    effects: { control: 9, heat: .27 }
  },
  {
    id: 'downtown',
    icon: '🌆',
    name: 'Downtown Block',
    type: 'block',
    desc: 'Zentrum der Stadt. Viel Gewinn, viel Aufmerksamkeit.',
    baseCost: 7600,
    growth: 1.61,
    respectCost: 62,
    unlock: 9,
    baseIncome: 312,
    effects: { control: 12, heat: .32 }
  },
  {
    id: 'safehouse',
    icon: '🧱',
    name: 'Safehouse',
    type: 'defense',
    desc: 'Stärkt Verteidigung, Lager und senkt Verlust bei Fehlschlägen.',
    baseCost: 5000,
    growth: 1.57,
    respectCost: 38,
    unlock: 8,
    baseIncome: 24,
    effects: { storage: 2500, defense: 7, heatReduce: .08 }
  }
];

const UNITS = [
  {
    id: 'hangaround',
    icon: '🧢',
    name: 'Hangaround',
    desc: 'Billig, schnell, wenig Power. Gut für den Anfang.',
    baseCost: 420,
    growth: 1.22,
    respectCost: 0,
    power: 3,
    upkeep: 2
  },
  {
    id: 'prospect',
    icon: '🦺',
    name: 'Prospect',
    desc: 'Stärker und zuverlässig für kleine Runs.',
    baseCost: 1100,
    growth: 1.24,
    respectCost: 7,
    power: 9,
    upkeep: 5
  },
  {
    id: 'member',
    icon: '🧥',
    name: 'Member',
    desc: 'Solide Haupt-Crew mit gutem Power-Wert.',
    baseCost: 2900,
    growth: 1.26,
    respectCost: 20,
    power: 24,
    upkeep: 12
  },
  {
    id: 'roadcaptain',
    icon: '🧭',
    name: 'Road Captain',
    desc: 'Erhöht Erfolgschance und Run-Belohnungen.',
    baseCost: 7800,
    growth: 1.30,
    respectCost: 65,
    power: 62,
    upkeep: 28
  },
  {
    id: 'nomad',
    icon: '🏍️',
    name: 'Nomad',
    desc: 'Sehr stark, teuer, perfekt für schwere Runs.',
    baseCost: 16500,
    growth: 1.33,
    respectCost: 140,
    power: 150,
    upkeep: 72
  }
];

const RUNS = [
  {
    id: 'barmeet',
    icon: '🍻',
    name: 'Road Bar Treffen',
    desc: 'Kleiner Run für Cash und Respekt.',
    power: 12,
    reward: 1200,
    respect: 8,
    heat: 3,
    cooldown: 20
  },
  {
    id: 'partsrun',
    icon: '🔧',
    name: 'Bike-Parts Run',
    desc: 'Beschaffe Teile für Custom Bikes.',
    power: 36,
    reward: 3600,
    respect: 18,
    heat: 6,
    cooldown: 40
  },
  {
    id: 'blockpush',
    icon: '🏙️',
    name: 'Block-Kontrolle',
    desc: 'Erhöhe Einfluss im Viertel. Braucht starke Crew.',
    power: 90,
    reward: 9200,
    respect: 42,
    heat: 11,
    cooldown: 70
  },
  {
    id: 'state',
    icon: '🛣️',
    name: 'State Run',
    desc: 'Großer Ausritt mit Risiko und hoher Belohnung.',
    power: 190,
    reward: 23000,
    respect: 95,
    heat: 18,
    cooldown: 120
  },
  {
    id: 'chapterwar',
    icon: '⚔️',
    name: 'Rivalen-Challenge',
    desc: 'Taktische PvE-Herausforderung gegen eine Rivalen-Fraktion.',
    power: 380,
    reward: 54000,
    respect: 210,
    heat: 25,
    cooldown: 180
  }
];

const FACTIONS = [
  {
    id: 'police',
    icon: '🚓',
    name: 'City Police',
    desc: 'Lokaler Druck durch Streifen und Kontrollen.',
    baseCost: 850,
    heatImpact: .35
  },
  {
    id: 'atf',
    icon: '🕵️',
    name: 'ATF Taskforce',
    desc: 'Steigt, wenn du viele Blocks und Runs spielst.',
    baseCost: 2600,
    heatImpact: .55
  },
  {
    id: 'fbi',
    icon: '🏛️',
    name: 'FBI Bureau',
    desc: 'Langsamer, aber gefährlicher Druck auf große Charter.',
    baseCost: 5200,
    heatImpact: .75
  },
  {
    id: 'rivals',
    icon: '🦂',
    name: 'Rivalen-MC',
    desc: 'Andere Fraktionen wollen deine Blöcke übernehmen.',
    baseCost: 1700,
    heatImpact: .42
  },
  {
    id: 'cityhall',
    icon: '🏢',
    name: 'City Hall',
    desc: 'Politischer Druck auf deine legal getarnten Betriebe.',
    baseCost: 1450,
    heatImpact: .25
  }
];

const PERKS = [
  { id: 'negotiation', icon: '🤝', name: 'Verhandlung', desc: 'Fraktionskosten -5% pro Level.', baseCost: 2000, respectCost: 22, max: 10 },
  { id: 'engine', icon: '🏍️', name: 'Bike Build', desc: 'Crew-Power +3% pro Level.', baseCost: 2600, respectCost: 30, max: 10 },
  { id: 'stash', icon: '💼', name: 'Stash Planung', desc: 'Geldlager +4% pro Level.', baseCost: 2200, respectCost: 26, max: 10 },
  { id: 'streetwise', icon: '🧠', name: 'Streetwise', desc: 'Heat-Zuwachs -3% pro Level.', baseCost: 3000, respectCost: 36, max: 10 }
];

let state = makeDefaultState();
let lastRender = 0;
let toastTimer = null;

function makeDefaultState() {
  const buildings = {};
  const bank = {};
  for (const building of BUILDINGS) {
    buildings[building.id] = building.unlock === 0 ? 1 : 0;
    bank[building.id] = 0;
  }

  const units = {};
  for (const unit of UNITS) units[unit.id] = 0;

  const factions = {};
  for (const faction of FACTIONS) factions[faction.id] = 10;

  const perks = {};
  for (const perk of PERKS) perks[perk.id] = 0;

  const cooldowns = {};
  for (const run of RUNS) cooldowns[run.id] = 0;

  return {
    version: 2,
    setupDone: false,
    clubName: 'Iron Wolves MC',
    leaderName: 'Road Captain',
    rank: 'President',
    patchText: 'WOLVES',
    emblem: 'wolf',
    vest: 'black',
    trim: 'red',
    cash: 6200,
    respect: 35,
    heat: 8,
    leaderLevel: 1,
    influence: 0,
    buildings,
    bank,
    units,
    factions,
    perks,
    cooldowns,
    log: [{ time: minute(), text: 'Willkommen. Gründe deinen MC und baue die ersten Gebäude aus.' }],
    lastTick: now()
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return makeDefaultState();
    const loaded = JSON.parse(raw);
    return migrateState(loaded);
  } catch (error) {
    console.warn('Save konnte nicht geladen werden:', error);
    return makeDefaultState();
  }
}

function migrateState(loaded) {
  const fresh = makeDefaultState();
  const merged = { ...fresh, ...loaded };
  merged.buildings = { ...fresh.buildings, ...(loaded.buildings || {}) };
  merged.bank = { ...fresh.bank, ...(loaded.bank || {}) };
  merged.units = { ...fresh.units, ...(loaded.units || {}) };
  merged.factions = { ...fresh.factions, ...(loaded.factions || {}) };
  merged.perks = { ...fresh.perks, ...(loaded.perks || {}) };
  merged.cooldowns = { ...fresh.cooldowns, ...(loaded.cooldowns || {}) };
  merged.log = Array.isArray(loaded.log) ? loaded.log.slice(0, 40) : fresh.log;
  merged.cash = Number.isFinite(loaded.cash) ? loaded.cash : fresh.cash;
  merged.respect = Number.isFinite(loaded.respect) ? loaded.respect : fresh.respect;
  merged.heat = Number.isFinite(loaded.heat) ? loaded.heat : fresh.heat;
  merged.lastTick = Number.isFinite(loaded.lastTick) ? loaded.lastTick : now();
  return merged;
}

function save(silent = false) {
  state.lastTick = now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (!silent) toast('Gespeichert.');
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  state = makeDefaultState();
  renderAll(true);
}

function getLevel(id) {
  return clamp(Number(state.buildings[id] || 0), 0, BUILDING_MAX);
}

function effectLevel(level) {
  if (level <= 0) return 0;
  return level * (1 + level * 0.075);
}

function buildingIncome(building, level = getLevel(building.id)) {
  if (level <= 0) return 0;
  const perkBoost = 1 + (state.perks.stash || 0) * 0.005;
  return building.baseIncome * effectLevel(level) * perkBoost;
}

function buildingStorage(building, level = getLevel(building.id)) {
  const income = buildingIncome(building, level);
  return Math.max(income * 45, 300 + level * 110);
}

function upgradeCost(building, nextLevel = getLevel(building.id) + 1) {
  const modifier = nextLevel <= 1 ? .7 : 1;
  return Math.floor(building.baseCost * Math.pow(building.growth, Math.max(0, nextLevel - 1)) * modifier);
}

function upgradeRespectCost(building, nextLevel = getLevel(building.id) + 1) {
  return Math.floor((building.respectCost || 0) * Math.pow(1.18, Math.max(0, nextLevel - 1)));
}

function getTotalIncomePerMinute() {
  return BUILDINGS.reduce((sum, building) => sum + buildingIncome(building), 0);
}

function getStoredIncome() {
  return Object.values(state.bank).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function getRespectPerMinute() {
  return BUILDINGS.reduce((sum, building) => {
    const level = getLevel(building.id);
    const base = building.effects.respect || 0;
    return sum + base * effectLevel(level);
  }, 0);
}

function getCrewCount() {
  return UNITS.reduce((sum, unit) => sum + (state.units[unit.id] || 0), 0);
}

function getCrewCap() {
  let cap = 6;
  for (const building of BUILDINGS) {
    const level = getLevel(building.id);
    cap += (building.effects.crewCap || 0) * level;
  }
  return Math.floor(cap);
}

function getCrewPower() {
  const basePower = UNITS.reduce((sum, unit) => sum + (state.units[unit.id] || 0) * unit.power, 0);
  const buildingPower = BUILDINGS.reduce((sum, building) => sum + (building.effects.power || 0) * effectLevel(getLevel(building.id)), 0);
  const leaderPower = state.leaderLevel * 8;
  const perkBoost = 1 + (state.perks.engine || 0) * 0.03;
  return Math.floor((basePower + buildingPower + leaderPower) * perkBoost);
}

function getDefense() {
  return BUILDINGS.reduce((sum, building) => sum + (building.effects.defense || 0) * effectLevel(getLevel(building.id)), 0);
}

function getStorageCap() {
  let cap = 4500;
  for (const building of BUILDINGS) {
    const level = getLevel(building.id);
    cap += (building.effects.storage || 0) * effectLevel(level);
  }
  cap *= 1 + (state.perks.stash || 0) * 0.04;
  return Math.floor(cap);
}

function getInfluence() {
  let influence = state.influence || 0;
  for (const building of BUILDINGS) {
    const level = getLevel(building.id);
    influence += (building.effects.influence || 0) * effectLevel(level);
    influence += (building.effects.control || 0) * effectLevel(level);
  }
  return Math.floor(influence);
}

function getPressure() {
  const factionPressure = Object.values(state.factions).reduce((sum, value) => sum + value, 0) / FACTIONS.length;
  return clamp((state.heat * .62) + (factionPressure * .38), 0, 100);
}

function getHeatGrowthPerMinute() {
  const raw = BUILDINGS.reduce((sum, building) => sum + (building.effects.heat || 0) * effectLevel(getLevel(building.id)), 0);
  const reduceFromBuildings = BUILDINGS.reduce((sum, building) => sum + (building.effects.heatReduce || 0) * effectLevel(getLevel(building.id)), 0);
  const perkReduction = 1 - (state.perks.streetwise || 0) * 0.03;
  return Math.max(0, (raw - reduceFromBuildings) * Math.max(.4, perkReduction));
}

function tick() {
  const current = now();
  let elapsed = (current - state.lastTick) / 1000;
  if (!Number.isFinite(elapsed) || elapsed < 0) elapsed = 0;
  elapsed = Math.min(elapsed, MAX_OFFLINE_SECONDS);
  if (elapsed < .2) return;

  const minutes = elapsed / 60;
  const cashCap = getStorageCap();

  for (const building of BUILDINGS) {
    const level = getLevel(building.id);
    if (level <= 0) continue;
    const income = buildingIncome(building, level) * minutes;
    const cap = buildingStorage(building, level);
    state.bank[building.id] = clamp((state.bank[building.id] || 0) + income, 0, cap);
  }

  const respectGain = getRespectPerMinute() * minutes;
  state.respect += respectGain;

  const heatGrowth = getHeatGrowthPerMinute() * minutes;
  state.heat = clamp(state.heat + heatGrowth, 0, 100);

  for (const run of RUNS) {
    state.cooldowns[run.id] = Math.max(0, (state.cooldowns[run.id] || 0) - elapsed);
  }

  state.cash = clamp(state.cash, 0, cashCap);
  state.lastTick = current;
}

function canUnlock(building) {
  if (building.unlock <= 0) return true;
  const clubhouseLevel = getLevel('clubhouse');
  return clubhouseLevel >= building.unlock;
}

function upgradeBuilding(id) {
  const building = BUILDINGS.find((entry) => entry.id === id);
  if (!building) return;
  const level = getLevel(id);
  if (level >= BUILDING_MAX) return toast(`${building.name} ist bereits Level ${BUILDING_MAX}.`);
  if (!canUnlock(building)) return toast(`${building.name} braucht Clubhouse Level ${building.unlock}.`);

  const nextLevel = level + 1;
  const cost = upgradeCost(building, nextLevel);
  const respectCost = upgradeRespectCost(building, nextLevel);
  if (state.cash < cost) return toast(`Nicht genug Cash. Du brauchst ${fmtMoney(cost)}.`);
  if (state.respect < respectCost) return toast(`Nicht genug Respekt. Du brauchst ${fmtNum(respectCost)}.`);

  state.cash -= cost;
  state.respect -= respectCost;
  state.buildings[id] = nextLevel;
  addLog(`${building.name} auf Level ${nextLevel}/${BUILDING_MAX} ausgebaut.`);
  save(true);
  renderAll();
}

function collectBuilding(id) {
  const building = BUILDINGS.find((entry) => entry.id === id);
  if (!building) return;
  const amount = state.bank[id] || 0;
  if (amount <= 0) return toast('Hier ist noch nichts bereit.');
  const cap = getStorageCap();
  const free = Math.max(0, cap - state.cash);
  if (free <= 0) return toast('Geldlager voll. Baue dein Geldlager aus.');
  const collected = Math.min(amount, free);
  state.bank[id] -= collected;
  state.cash += collected;
  addLog(`${fmtMoney(collected)} von ${building.name} eingesammelt.`);
  save(true);
  renderAll();
}

function collectAll() {
  const cap = getStorageCap();
  let free = Math.max(0, cap - state.cash);
  if (free <= 0) return toast('Geldlager voll. Baue dein Geldlager aus.');

  let collected = 0;
  for (const building of BUILDINGS) {
    const amount = state.bank[building.id] || 0;
    if (amount <= 0 || free <= 0) continue;
    const take = Math.min(amount, free);
    state.bank[building.id] -= take;
    state.cash += take;
    free -= take;
    collected += take;
  }

  if (collected <= 0) return toast('Noch keine Einnahmen bereit.');
  addLog(`${fmtMoney(collected)} Gesamteinnahmen eingesammelt.`);
  save(true);
  renderAll();
}

function upgradeBest() {
  const candidates = BUILDINGS
    .filter((building) => canUnlock(building) && getLevel(building.id) < BUILDING_MAX)
    .map((building) => {
      const next = getLevel(building.id) + 1;
      const cost = upgradeCost(building, next);
      const incomeGain = buildingIncome(building, next) - buildingIncome(building, next - 1);
      return { building, cost, respectCost: upgradeRespectCost(building, next), score: incomeGain / Math.max(1, cost) };
    })
    .filter((item) => state.cash >= item.cost && state.respect >= item.respectCost)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return toast('Kein bezahlbares Upgrade gefunden.');
  upgradeBuilding(candidates[0].building.id);
}

function recruit(id) {
  const unit = UNITS.find((entry) => entry.id === id);
  if (!unit) return;
  const count = state.units[id] || 0;
  if (getCrewCount() >= getCrewCap()) return toast('Crew-Limit erreicht. Baue Clubhouse oder Nomad Camp aus.');
  const cost = Math.floor(unit.baseCost * Math.pow(unit.growth, count));
  const respectCost = Math.floor(unit.respectCost * Math.pow(1.13, count));
  if (state.cash < cost) return toast(`Nicht genug Cash. Du brauchst ${fmtMoney(cost)}.`);
  if (state.respect < respectCost) return toast(`Nicht genug Respekt. Du brauchst ${fmtNum(respectCost)}.`);
  state.cash -= cost;
  state.respect -= respectCost;
  state.units[id] = count + 1;
  addLog(`${unit.name} rekrutiert. Crew: ${getCrewCount()}/${getCrewCap()}.`);
  save(true);
  renderAll();
}

function runChance(run) {
  const power = getCrewPower();
  const pressure = getPressure();
  const defenseBonus = Math.min(20, getDefense() / 45);
  const leaderBonus = state.leaderLevel * 1.4;
  const chance = 58 + ((power - run.power) / Math.max(30, run.power)) * 38 - pressure * .28 + defenseBonus + leaderBonus;
  return clamp(chance, 8, 94);
}

function startRun(id) {
  const run = RUNS.find((entry) => entry.id === id);
  if (!run) return;
  if ((state.cooldowns[id] || 0) > 0) return toast('Dieser Run ist noch im Cooldown.');
  const chance = runChance(run);
  const roll = Math.random() * 100;
  const heatMultiplier = Math.max(.45, 1 - (state.perks.streetwise || 0) * .03);

  if (roll <= chance) {
    const rewardBoost = 1 + (state.leaderLevel - 1) * .035 + (state.perks.negotiation || 0) * .01;
    const reward = Math.floor(run.reward * rewardBoost);
    const free = Math.max(0, getStorageCap() - state.cash);
    const gained = Math.min(reward, free);
    const lost = reward - gained;
    state.cash += gained;
    state.respect += run.respect;
    state.influence += Math.floor(run.respect / 4);
    state.heat = clamp(state.heat + run.heat * heatMultiplier, 0, 100);
    state.cooldowns[id] = run.cooldown;
    addLog(`${run.name} erfolgreich: +${fmtMoney(gained)}, +${run.respect} Respekt${lost > 0 ? `, ${fmtMoney(lost)} wegen vollem Lager verloren` : ''}.`);
  } else {
    const loss = Math.min(state.cash, Math.floor(run.reward * .18));
    state.cash -= loss;
    state.heat = clamp(state.heat + run.heat * 1.45 * heatMultiplier, 0, 100);
    raiseFactionPressure(run.heat * .7);
    state.cooldowns[id] = Math.floor(run.cooldown * .75);
    addLog(`${run.name} fehlgeschlagen: -${fmtMoney(loss)}, Heat steigt.`);
  }

  save(true);
  renderAll();
}

function raiseFactionPressure(amount) {
  for (const faction of FACTIONS) {
    const gain = amount * faction.heatImpact * (0.65 + Math.random() * 0.7);
    state.factions[faction.id] = clamp((state.factions[faction.id] || 0) + gain, 0, 100);
  }
}

function reduceFaction(id) {
  const faction = FACTIONS.find((entry) => entry.id === id);
  if (!faction) return;
  const current = state.factions[id] || 0;
  if (current <= 0) return toast(`${faction.name} ist ruhig.`);
  const perkDiscount = 1 - (state.perks.negotiation || 0) * 0.05;
  const cost = Math.floor(faction.baseCost * (1 + current / 34) * Math.max(.45, perkDiscount));
  if (state.cash < cost) return toast(`Du brauchst ${fmtMoney(cost)} für diesen Deal.`);
  state.cash -= cost;
  state.factions[id] = clamp(current - 24, 0, 100);
  state.heat = clamp(state.heat - 4, 0, 100);
  addLog(`${faction.name} beruhigt. Druck gesenkt.`);
  save(true);
  renderAll();
}

function layLow() {
  const cost = Math.floor(1200 + getInfluence() * 14 + state.heat * 120);
  if (state.cash < cost) return toast(`Unauffällig bleiben kostet ${fmtMoney(cost)}.`);
  state.cash -= cost;
  state.heat = clamp(state.heat - 18, 0, 100);
  for (const faction of FACTIONS) {
    state.factions[faction.id] = clamp((state.factions[faction.id] || 0) - 8, 0, 100);
  }
  addLog(`Der Charter bleibt unauffällig. Heat und Druck sinken.`);
  save(true);
  renderAll();
}

function trainLeader() {
  const cost = Math.floor(1800 * Math.pow(1.45, state.leaderLevel - 1));
  const respectCost = Math.floor(18 * Math.pow(1.22, state.leaderLevel - 1));
  if (state.cash < cost) return toast(`Training kostet ${fmtMoney(cost)}.`);
  if (state.respect < respectCost) return toast(`Training braucht ${fmtNum(respectCost)} Respekt.`);
  state.cash -= cost;
  state.respect -= respectCost;
  state.leaderLevel += 1;
  addLog(`${state.leaderName} erreicht Level ${state.leaderLevel}.`);
  save(true);
  renderAll();
}

function upgradePerk(id) {
  const perk = PERKS.find((entry) => entry.id === id);
  if (!perk) return;
  const level = state.perks[id] || 0;
  if (level >= perk.max) return toast(`${perk.name} ist auf Max-Level.`);
  const cost = Math.floor(perk.baseCost * Math.pow(1.58, level));
  const respectCost = Math.floor(perk.respectCost * Math.pow(1.24, level));
  if (state.cash < cost) return toast(`Nicht genug Cash. Du brauchst ${fmtMoney(cost)}.`);
  if (state.respect < respectCost) return toast(`Nicht genug Respekt. Du brauchst ${fmtNum(respectCost)}.`);
  state.cash -= cost;
  state.respect -= respectCost;
  state.perks[id] = level + 1;
  addLog(`${perk.name} auf Level ${level + 1}/${perk.max} verbessert.`);
  save(true);
  renderAll();
}

function addLog(text) {
  state.log.unshift({ time: minute(), text });
  state.log = state.log.slice(0, 40);
}

function toast(text) {
  const toastEl = $('#toast');
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2300);
}

function showDialog(title, text) {
  const dialog = $('#confirmDialog');
  $('#dialogTitle').textContent = title;
  $('#dialogText').textContent = text;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else alert(`${title}\n\n${text}`);
}

function renderAll(force = false) {
  const current = now();
  if (!force && current - lastRender < 120) return;
  lastRender = current;
  renderSetup();
  renderHeader();
  renderStats();
  renderBuildings();
  renderCrew();
  renderRuns();
  renderFactions();
  renderMc();
  renderProfile();
  renderLog();
}

function renderSetup() {
  $('#setupOverlay').hidden = !!state.setupDone;
}

function renderHeader() {
  $('#clubTitle').textContent = state.clubName;
  $('#clubNameHero').textContent = state.clubName;
  $('#leaderLine').textContent = `${state.rank}: ${state.leaderName}`;
  updateKutte($('#heroKutte'));
  updateKutte($('#mcKutteBig'));
}

function renderStats() {
  const cap = getStorageCap();
  $('#cashValue').textContent = fmtMoney(state.cash);
  $('#cashCapValue').textContent = `Lager ${fmtMoney(cap)}`;
  $('#incomeValue').textContent = `${fmtMoney(getTotalIncomePerMinute())}/min`;
  $('#storedValue').textContent = `${fmtMoney(getStoredIncome())} bereit`;
  $('#respectValue').textContent = fmtNum(state.respect);
  $('#respectGainValue').textContent = `+${fmtNum(getRespectPerMinute())}/min`;
  $('#crewValue').textContent = `${getCrewCount()}/${getCrewCap()}`;
  $('#powerValue').textContent = `Power ${fmtNum(getCrewPower())}`;
  $('#heatValue').textContent = percent(state.heat);
  const pressure = getPressure();
  $('#dangerValue').textContent = pressure < 30 ? 'Druck niedrig' : pressure < 65 ? 'Druck mittel' : 'Druck hoch';
}

function renderBuildings() {
  const grid = $('#buildingGrid');
  grid.innerHTML = BUILDINGS.map((building) => {
    const level = getLevel(building.id);
    const locked = !canUnlock(building);
    const next = Math.min(BUILDING_MAX, level + 1);
    const income = buildingIncome(building, level);
    const nextIncome = level < BUILDING_MAX ? buildingIncome(building, next) : income;
    const incomeGain = Math.max(0, nextIncome - income);
    const stored = state.bank[building.id] || 0;
    const collectCap = buildingStorage(building, level);
    const cost = level < BUILDING_MAX ? upgradeCost(building, next) : 0;
    const respectCost = level < BUILDING_MAX ? upgradeRespectCost(building, next) : 0;
    const canAfford = state.cash >= cost && state.respect >= respectCost && !locked;
    const progress = (level / BUILDING_MAX) * 100;
    const buttonText = level <= 0 ? 'Bauen' : level >= BUILDING_MAX ? 'Max' : 'Upgrade';

    return `
      <article class="card ${locked ? 'locked' : ''}">
        <div class="card-top">
          <div class="card-icon">${building.icon}</div>
          <div class="card-title">
            <h3>${building.name}</h3>
            <p>${locked ? `Benötigt Clubhouse Level ${building.unlock}.` : building.desc}</p>
          </div>
          <div class="level-pill">Lvl ${level}/${BUILDING_MAX}</div>
        </div>
        <div class="card-body">
          <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="meta-grid">
            <div class="meta"><span>Gewinn</span><strong>${fmtMoney(income)}/min</strong></div>
            <div class="meta"><span>Nächstes +</span><strong>${fmtMoney(incomeGain)}/min</strong></div>
            <div class="meta"><span>Bereit</span><strong>${fmtMoney(stored)}</strong></div>
            <div class="meta"><span>Gebäude-Lager</span><strong>${fmtMoney(collectCap)}</strong></div>
          </div>
          <div class="badge-row">
            ${building.effects.storage ? `<span class="badge gold">Lager +${fmtMoney(building.effects.storage * effectLevel(level || 1))}</span>` : ''}
            ${building.effects.crewCap ? `<span class="badge green">Crew +${Math.floor(building.effects.crewCap * level)}</span>` : ''}
            ${building.effects.heat ? `<span class="badge red">Heat +${building.effects.heat.toFixed(2)}/Lvl</span>` : ''}
            ${building.effects.defense ? `<span class="badge">Defense +${Math.floor(building.effects.defense * level)}</span>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-ghost" type="button" data-action="collect-building" data-id="${building.id}" ${stored <= 0 || level <= 0 ? 'disabled' : ''}>Einsammeln</button>
            <button class="btn ${canAfford && level < BUILDING_MAX ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="upgrade-building" data-id="${building.id}" ${locked || level >= BUILDING_MAX ? 'disabled' : ''}>
              ${buttonText} · ${level >= BUILDING_MAX ? 'fertig' : `${fmtMoney(cost)}${respectCost ? ` · ${fmtNum(respectCost)} Respekt` : ''}`}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCrew() {
  const grid = $('#crewGrid');
  grid.innerHTML = UNITS.map((unit) => {
    const count = state.units[unit.id] || 0;
    const cost = Math.floor(unit.baseCost * Math.pow(unit.growth, count));
    const respectCost = Math.floor(unit.respectCost * Math.pow(1.13, count));
    const canRecruit = state.cash >= cost && state.respect >= respectCost && getCrewCount() < getCrewCap();

    return `
      <article class="card">
        <div class="card-top">
          <div class="card-icon">${unit.icon}</div>
          <div class="card-title">
            <h3>${unit.name}</h3>
            <p>${unit.desc}</p>
          </div>
          <div class="level-pill">x${count}</div>
        </div>
        <div class="card-body">
          <div class="meta-grid">
            <div class="meta"><span>Power je</span><strong>${fmtNum(unit.power)}</strong></div>
            <div class="meta"><span>Gesamt</span><strong>${fmtNum(unit.power * count)}</strong></div>
            <div class="meta"><span>Kosten</span><strong>${fmtMoney(cost)}</strong></div>
            <div class="meta"><span>Respekt</span><strong>${fmtNum(respectCost)}</strong></div>
          </div>
          <div class="card-actions single">
            <button class="btn ${canRecruit ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="recruit" data-id="${unit.id}">Rekrutieren</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderRuns() {
  const grid = $('#runGrid');
  grid.innerHTML = RUNS.map((run) => {
    const chance = runChance(run);
    const cd = Math.ceil(state.cooldowns[run.id] || 0);
    const ready = cd <= 0;
    const enough = getCrewPower() >= run.power * .45;

    return `
      <article class="card">
        <div class="card-top">
          <div class="card-icon">${run.icon}</div>
          <div class="card-title">
            <h3>${run.name}</h3>
            <p>${run.desc}</p>
          </div>
          <div class="level-pill">${percent(chance)}</div>
        </div>
        <div class="card-body">
          <div class="progress-track"><div class="progress-fill" style="width:${chance}%"></div></div>
          <div class="meta-grid">
            <div class="meta"><span>Power nötig</span><strong>${fmtNum(run.power)}</strong></div>
            <div class="meta"><span>Deine Power</span><strong>${fmtNum(getCrewPower())}</strong></div>
            <div class="meta"><span>Belohnung</span><strong>${fmtMoney(run.reward)}</strong></div>
            <div class="meta"><span>Heat</span><strong>+${run.heat}%</strong></div>
          </div>
          <div class="card-actions single">
            <button class="btn ${ready && enough ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="start-run" data-id="${run.id}" ${!ready ? 'disabled' : ''}>${ready ? 'Run starten' : `Cooldown ${cd}s`}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderFactions() {
  const grid = $('#factionGrid');
  grid.innerHTML = FACTIONS.map((faction) => {
    const value = clamp(state.factions[faction.id] || 0, 0, 100);
    const perkDiscount = 1 - (state.perks.negotiation || 0) * 0.05;
    const cost = Math.floor(faction.baseCost * (1 + value / 34) * Math.max(.45, perkDiscount));
    const label = value < 30 ? 'ruhig' : value < 65 ? 'angespannt' : 'kritisch';

    return `
      <article class="card">
        <div class="card-top">
          <div class="card-icon">${faction.icon}</div>
          <div class="card-title">
            <h3>${faction.name}</h3>
            <p>${faction.desc}</p>
          </div>
          <div class="level-pill">${Math.round(value)}%</div>
        </div>
        <div class="card-body">
          <div class="progress-track"><div class="progress-fill" style="width:${value}%"></div></div>
          <div class="meta-grid">
            <div class="meta"><span>Status</span><strong>${label}</strong></div>
            <div class="meta"><span>Deal kostet</span><strong>${fmtMoney(cost)}</strong></div>
          </div>
          <div class="card-actions single">
            <button class="btn ${state.cash >= cost ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="reduce-faction" data-id="${faction.id}">Druck senken</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function fillSelect(select, options, value) {
  select.innerHTML = options.map(([id, label]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${label}</option>`).join('');
}

function renderMc() {
  $('#editClubName').value = state.clubName;
  $('#editLeaderName').value = state.leaderName;
  $('#editPatchText').value = state.patchText;
  fillSelect($('#editEmblem'), SELECT_OPTIONS.emblem, state.emblem);
  fillSelect($('#editVest'), SELECT_OPTIONS.vest, state.vest);
  fillSelect($('#editTrim'), SELECT_OPTIONS.trim, state.trim);
  $('#editRank').value = state.rank;
}

function renderProfile() {
  $('#profileName').textContent = state.leaderName;
  $('#profileStats').textContent = `Level ${state.leaderLevel} · Einfluss ${fmtNum(getInfluence())}`;
  const grid = $('#perkGrid');
  grid.innerHTML = PERKS.map((perk) => {
    const level = state.perks[perk.id] || 0;
    const cost = Math.floor(perk.baseCost * Math.pow(1.58, level));
    const respectCost = Math.floor(perk.respectCost * Math.pow(1.24, level));
    const maxed = level >= perk.max;
    const can = state.cash >= cost && state.respect >= respectCost && !maxed;
    return `
      <article class="card">
        <div class="card-top">
          <div class="card-icon">${perk.icon}</div>
          <div class="card-title">
            <h3>${perk.name}</h3>
            <p>${perk.desc}</p>
          </div>
          <div class="level-pill">${level}/${perk.max}</div>
        </div>
        <div class="card-body">
          <div class="progress-track"><div class="progress-fill" style="width:${(level / perk.max) * 100}%"></div></div>
          <div class="meta-grid">
            <div class="meta"><span>Cash</span><strong>${maxed ? 'Max' : fmtMoney(cost)}</strong></div>
            <div class="meta"><span>Respekt</span><strong>${maxed ? 'Max' : fmtNum(respectCost)}</strong></div>
          </div>
          <div class="card-actions single">
            <button class="btn ${can ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="upgrade-perk" data-id="${perk.id}" ${maxed ? 'disabled' : ''}>${maxed ? 'Max-Level' : 'Perk verbessern'}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderLog() {
  const log = $('#logList');
  log.innerHTML = state.log.map((entry) => `<div class="log-item"><span class="log-time">${entry.time}</span>${entry.text}</div>`).join('');
}

function updateKutte(el) {
  if (!el) return;
  el.className = el.className
    .split(' ')
    .filter((part) => !part.startsWith('vest-') && !part.startsWith('trim-') && !part.startsWith('emblem-'))
    .join(' ');
  el.classList.add(`vest-${state.vest}`, `trim-${state.trim}`, `emblem-${state.emblem}`);
  const top = el.querySelector('.top-rocker');
  const bottom = el.querySelector('.bottom-rocker');
  const emblem = el.querySelector('.emblem');
  const words = String(state.patchText || 'MC').trim().toUpperCase().split(/\s+/);
  top.textContent = words[0] || 'ROAD';
  bottom.textContent = words.slice(1).join(' ') || state.clubName.replace(/\s?MC$/i, '').slice(0, 12).toUpperCase();
  emblem.textContent = EMBLEMS[state.emblem] || '🏍️';
}

function updateSetupPreview() {
  const temp = {
    patchText: $('#setupPatchText').value || 'MC',
    clubName: $('#setupClubName').value || 'Road Charter MC',
    emblem: $('#setupEmblem').value,
    vest: $('#setupVest').value,
    trim: $('#setupTrim').value
  };
  const old = { ...state };
  Object.assign(state, temp);
  updateKutte($('#setupKuttePreview'));
  Object.assign(state, old);
}

function createClub() {
  state.clubName = $('#setupClubName').value.trim() || 'Road Charter MC';
  state.leaderName = $('#setupLeaderName').value.trim() || 'Road Captain';
  state.patchText = $('#setupPatchText').value.trim() || 'MC';
  state.emblem = $('#setupEmblem').value;
  state.vest = $('#setupVest').value;
  state.trim = $('#setupTrim').value;
  state.setupDone = true;
  addLog(`${state.clubName} wurde gegründet. Kutte und Patch sind bereit.`);
  save(true);
  renderAll(true);
  toast('MC gegründet. Viel Spaß!');
}

function applyMcEdit() {
  state.clubName = $('#editClubName').value.trim() || state.clubName;
  state.leaderName = $('#editLeaderName').value.trim() || state.leaderName;
  state.patchText = $('#editPatchText').value.trim() || state.patchText;
  state.emblem = $('#editEmblem').value;
  state.vest = $('#editVest').value;
  state.trim = $('#editTrim').value;
  state.rank = $('#editRank').value;
  addLog('MC-Daten und Kutte aktualisiert.');
  save(true);
  renderAll(true);
  toast('MC gespeichert.');
}

function switchScreen(screen) {
  $$('.screen').forEach((el) => el.classList.remove('active-screen'));
  $(`#screen-${screen}`).classList.add('active-screen');
  $$('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screen));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'upgrade-building') upgradeBuilding(id);
  if (action === 'collect-building') collectBuilding(id);
  if (action === 'recruit') recruit(id);
  if (action === 'start-run') startRun(id);
  if (action === 'reduce-faction') reduceFaction(id);
  if (action === 'upgrade-perk') upgradePerk(id);
}

function bindEvents() {
  document.addEventListener('click', handleClick);
  $$('.nav-btn').forEach((btn) => btn.addEventListener('click', () => switchScreen(btn.dataset.screen)));
  $('#collectAllBtn').addEventListener('click', collectAll);
  $('#saveBtn').addEventListener('click', () => save(false));
  $('#upgradeBestBtn').addEventListener('click', upgradeBest);
  $('#layLowBtn').addEventListener('click', layLow);
  $('#trainBtn').addEventListener('click', trainLeader);
  $('#clearLogBtn').addEventListener('click', () => {
    state.log = [];
    save(true);
    renderLog();
  });
  $('#applyMcBtn').addEventListener('click', applyMcEdit);
  $('#openMcEditorBtn').addEventListener('click', () => switchScreen('mc'));
  $('#createClubBtn').addEventListener('click', createClub);

  ['setupClubName', 'setupPatchText', 'setupEmblem', 'setupVest', 'setupTrim'].forEach((id) => {
    $(`#${id}`).addEventListener('input', updateSetupPreview);
    $(`#${id}`).addEventListener('change', updateSetupPreview);
  });

  window.addEventListener('beforeunload', () => save(true));

  let secret = '';
  window.addEventListener('keydown', (event) => {
    secret += event.key.toLowerCase();
    secret = secret.slice(-8);
    if (secret === 'resetapp') {
      resetSave();
      toast('Spielstand zurückgesetzt.');
    }
  });
}

function gameLoop() {
  tick();
  renderStats();
  renderBuildings();
  renderRuns();
  if (Math.random() < 0.018) {
    raiseFactionPressure(0.25);
  }
}

function boot() {
  state = load();
  tick();
  bindEvents();
  updateSetupPreview();
  renderAll(true);
  setInterval(gameLoop, TICK_MS);
  setInterval(() => save(true), 15000);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  showDialog('Neue bessere Version', 'Diese Version ist mobile-first, zeigt jedes Gebäude mit Level 0/20 bis 20/20, hat prozentuale Gewinnsteigerung, MC-Gründung, Kutten-Editor, Crew, Runs, Geldlager und Stadt-Druck.');
}

boot();
