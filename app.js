'use strict';

const SAVE_KEY = 'road_charter_block_empire_v1';
const TICK_MS = 3000;
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const fmtMoney = (value) => `${Math.floor(value).toLocaleString('de-DE')} $`;
const fmtNum = (value) => Math.floor(value).toLocaleString('de-DE');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const BUILDING_BLUEPRINTS = [
  {
    id: 'clubhouse',
    icon: '🏚️',
    name: 'Clubhouse',
    desc: 'Zentrale des Charters. Erhöht Crew-Limit, Respekt-Gewinn und schaltet stärkere Upgrades frei.',
    baseCost: 250,
    costGrowth: 1.85,
    respectCost: 0,
    maxLevel: 20,
    effects: { crewCap: 4, respectPerTick: 1, defense: 2 }
  },
  {
    id: 'cashvault',
    icon: '💰',
    name: 'Geldlager',
    desc: 'Mehr Lagerplatz für Einnahmen. Ohne Lager-Ausbau geht dir später viel Geld verloren.',
    baseCost: 180,
    costGrowth: 1.75,
    respectCost: 0,
    maxLevel: 25,
    effects: { storage: 1600, defense: 1 }
  },
  {
    id: 'garage',
    icon: '🔧',
    name: 'Bike-Werkstatt',
    desc: 'Verbessert Bike-Power, Runs und Verteidigung. Vom Gefühl her wie ein CoC-Labor.',
    baseCost: 340,
    costGrowth: 1.9,
    respectCost: 4,
    maxLevel: 20,
    effects: { power: 5, defense: 2 }
  },
  {
    id: 'nomadcamp',
    icon: '⛺',
    name: 'Nomad Camp',
    desc: 'Hier kommen neue Fahrer dazu. Gibt Crew-Kapazität und kleine passive Einnahmen.',
    baseCost: 460,
    costGrowth: 1.8,
    respectCost: 8,
    maxLevel: 20,
    effects: { crewCap: 6, income: 5 }
  },
  {
    id: 'bar',
    icon: '🍻',
    name: 'Road Bar',
    desc: 'Legal getarnter Treffpunkt. Bringt stabile Einnahmen und Respekt in der Gegend.',
    baseCost: 520,
    costGrowth: 1.72,
    respectCost: 6,
    maxLevel: 20,
    effects: { income: 16, respectPerTick: 1 }
  },
  {
    id: 'eastblock',
    icon: '🏙️',
    name: 'East Block',
    desc: 'Erster Stadtblock. Je höher der Block, desto mehr Cash, aber etwas mehr Heat.',
    baseCost: 750,
    costGrowth: 1.82,
    respectCost: 12,
    maxLevel: 20,
    effects: { income: 28, heat: 0.18, control: 3 }
  },
  {
    id: 'harbor',
    icon: '⚓',
    name: 'Harbor Block',
    desc: 'Hafenviertel mit starken Einnahmen. Braucht Crew und verursacht höheren Stadt-Druck.',
    baseCost: 1100,
    costGrowth: 1.86,
    respectCost: 18,
    maxLevel: 20,
    effects: { income: 42, heat: 0.28, control: 5 }
  },
  {
    id: 'industrial',
    icon: '🏭',
    name: 'Industrial Block',
    desc: 'Industriegebiet. Teuer, aber stark für Einkommen, Lager und Verteidigung.',
    baseCost: 1550,
    costGrowth: 1.88,
    respectCost: 25,
    maxLevel: 20,
    effects: { income: 55, storage: 500, defense: 4, heat: 0.22 }
  },
  {
    id: 'lookout',
    icon: '👁️',
    name: 'Lookout Posten',
    desc: 'Senkt Risiko bei Runs und bremst Heat-Zuwachs durch bessere Übersicht.',
    baseCost: 900,
    costGrowth: 1.78,
    respectCost: 16,
    maxLevel: 20,
    effects: { defense: 5, heatReduce: 0.14 }
  }
];

const UNIT_BLUEPRINTS = [
  {
    id: 'hangaround',
    icon: '🧢',
    name: 'Hangaround',
    desc: 'Günstiger Einstieg. Hilft beim Geldfluss, ist aber schwach in Runs.',
    baseCash: 160,
    baseRespect: 0,
    power: 2,
    income: 2,
    capUse: 1
  },
  {
    id: 'prospect',
    icon: '🦺',
    name: 'Prospect',
    desc: 'Solider Aufbau-Fahrer. Bringt mehr Power und etwas passives Einkommen.',
    baseCash: 420,
    baseRespect: 6,
    power: 6,
    income: 4,
    capUse: 1
  },
  {
    id: 'member',
    icon: '🛡️',
    name: 'Member',
    desc: 'Starkes Rückgrat für Charter-Kontrolle und erfolgreiche Runs.',
    baseCash: 950,
    baseRespect: 15,
    power: 16,
    income: 8,
    capUse: 2
  },
  {
    id: 'roadcaptain',
    icon: '🏍️',
    name: 'Road Captain',
    desc: 'Verbessert Missionen deutlich und erhöht Kontrolle in allen Blöcken.',
    baseCash: 2200,
    baseRespect: 35,
    power: 38,
    income: 15,
    capUse: 3
  },
  {
    id: 'nomad',
    icon: '🔥',
    name: 'Nomad',
    desc: 'Teuer, aber extrem stark. Ideal für schwierige Runs und Block-Kontrolle.',
    baseCash: 5200,
    baseRespect: 80,
    power: 95,
    income: 35,
    capUse: 5
  }
];

const MISSION_BLUEPRINTS = [
  {
    id: 'neighborhood',
    icon: '🧭',
    name: 'Neighborhood Run',
    desc: 'Kleiner Stadtlauf. Gut für den Start und wenig Risiko.',
    requiredPower: 8,
    cash: 360,
    respect: 7,
    heat: 3,
    cooldown: 20
  },
  {
    id: 'blockdeal',
    icon: '📦',
    name: 'Block-Deal',
    desc: 'Mittlere Operation mit besserer Beute, aber spürbar mehr Aufmerksamkeit.',
    requiredPower: 36,
    cash: 1300,
    respect: 22,
    heat: 7,
    cooldown: 35
  },
  {
    id: 'rivalpush',
    icon: '🐺',
    name: 'Rivalen zurückdrängen',
    desc: 'Taktischer PvE-Kampf gegen eine fiktive Stadtfraktion.',
    requiredPower: 85,
    cash: 3100,
    respect: 55,
    heat: 12,
    cooldown: 55
  },
  {
    id: 'statewide',
    icon: '🛣️',
    name: 'Statewide Ride',
    desc: 'Großer Run für fortgeschrittene Charters. Hohe Gewinne, hohes Risiko.',
    requiredPower: 180,
    cash: 8500,
    respect: 145,
    heat: 20,
    cooldown: 85
  }
];

const FACTION_BLUEPRINTS = [
  {
    id: 'police',
    icon: '🚓',
    name: 'City Police',
    desc: 'Lokaler Druck. Steigt durch hohe Heat-Werte und unruhige Blocks.',
    baseCost: 500,
    heatDrop: 12
  },
  {
    id: 'atf',
    icon: '🕵️',
    name: 'ATF Taskforce',
    desc: 'Wird relevant, sobald dein Charter größer wird. Teurer zu beruhigen.',
    baseCost: 1450,
    heatDrop: 18
  },
  {
    id: 'fbi',
    icon: '🏛️',
    name: 'Federal Bureau',
    desc: 'Späte Spielphase. Hoher Druck bedeutet mehr Kosten und Risk-Events.',
    baseCost: 4200,
    heatDrop: 26
  },
  {
    id: 'rivals',
    icon: '🐍',
    name: 'Snake County Crew',
    desc: 'Fiktive Rivalenfraktion. Beruhigen senkt Heat und Rivalen-Störungen.',
    baseCost: 2400,
    heatDrop: 20
  }
];

const PERKS = [
  {
    id: 'leadership',
    icon: '👑',
    name: 'Leadership',
    desc: 'Mehr Crew-Kapazität und bessere Missionserfolge.',
    max: 10,
    cash: 800,
    respect: 20
  },
  {
    id: 'mechanic',
    icon: '🛠️',
    name: 'Mechanic',
    desc: 'Mehr Power aus Bike-Werkstatt und Nomads.',
    max: 10,
    cash: 950,
    respect: 24
  },
  {
    id: 'streetwise',
    icon: '🃏',
    name: 'Streetwise',
    desc: 'Senkt Heat-Risiko bei Missionen und Upgrades.',
    max: 10,
    cash: 1200,
    respect: 30
  },
  {
    id: 'logistics',
    icon: '📊',
    name: 'Logistics',
    desc: 'Mehr Lagerplatz und höhere passive Einnahmen.',
    max: 10,
    cash: 1100,
    respect: 28
  }
];

const defaultState = () => ({
  version: 1,
  name: 'Iron Wolves Charter',
  leaderName: 'Road Captain',
  cash: 950,
  respect: 20,
  heat: 6,
  level: 1,
  xp: 0,
  lastTick: Date.now(),
  buildings: Object.fromEntries(BUILDING_BLUEPRINTS.map((b, i) => [b.id, { level: i < 3 ? 1 : 0 }])),
  units: Object.fromEntries(UNIT_BLUEPRINTS.map((u) => [u.id, { count: 0 }])),
  factions: Object.fromEntries(FACTION_BLUEPRINTS.map((f) => [f.id, { pressure: f.id === 'police' ? 15 : 5, lastBribe: 0 }])),
  perks: Object.fromEntries(PERKS.map((p) => [p.id, { level: 0 }])),
  missions: {},
  log: [
    { time: Date.now(), text: 'Charter gegründet. Baue dein Clubhouse, Lager und deine Crew auf.' }
  ]
});

let state = loadState();
let derived = getDerived();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const fresh = defaultState();
    return {
      ...fresh,
      ...saved,
      buildings: { ...fresh.buildings, ...(saved.buildings || {}) },
      units: { ...fresh.units, ...(saved.units || {}) },
      factions: { ...fresh.factions, ...(saved.factions || {}) },
      perks: { ...fresh.perks, ...(saved.perks || {}) },
      missions: saved.missions || {},
      log: Array.isArray(saved.log) ? saved.log.slice(0, 30) : fresh.log
    };
  } catch (error) {
    console.warn('Savegame konnte nicht geladen werden:', error);
    return defaultState();
  }
}

function saveState(silent = false) {
  state.lastTick = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (!silent) addLog('Spielstand gespeichert.');
}

function getBuilding(id) {
  return BUILDING_BLUEPRINTS.find((building) => building.id === id);
}

function getUnit(id) {
  return UNIT_BLUEPRINTS.find((unit) => unit.id === id);
}

function getPerk(id) {
  return PERKS.find((perk) => perk.id === id);
}

function buildingCost(blueprint, level = state.buildings[blueprint.id].level) {
  const next = level + 1;
  return {
    cash: Math.floor(blueprint.baseCost * Math.pow(blueprint.costGrowth, level)),
    respect: Math.floor((blueprint.respectCost || 0) * Math.pow(1.38, Math.max(0, level - 1))),
    next
  };
}

function unitCost(unit) {
  const count = state.units[unit.id].count;
  return {
    cash: Math.floor(unit.baseCash * Math.pow(1.18, count)),
    respect: Math.floor(unit.baseRespect * Math.pow(1.12, count))
  };
}

function perkCost(perk) {
  const level = state.perks[perk.id].level;
  return {
    cash: Math.floor(perk.cash * Math.pow(1.72, level)),
    respect: Math.floor(perk.respect * Math.pow(1.55, level))
  };
}

function getDerived() {
  const d = {
    incomePerTick: 0,
    respectPerTick: 0,
    heatPerTick: 0,
    heatReduce: 0,
    storage: 1800,
    crewCap: 5,
    crewUsed: 0,
    crewCount: 0,
    power: 0,
    defense: 0,
    control: 0
  };

  for (const blueprint of BUILDING_BLUEPRINTS) {
    const level = state.buildings[blueprint.id]?.level || 0;
    if (level <= 0) continue;
    const effects = blueprint.effects || {};
    d.incomePerTick += (effects.income || 0) * level;
    d.respectPerTick += (effects.respectPerTick || 0) * level;
    d.heatPerTick += (effects.heat || 0) * level;
    d.heatReduce += (effects.heatReduce || 0) * level;
    d.storage += (effects.storage || 0) * level;
    d.crewCap += (effects.crewCap || 0) * level;
    d.power += (effects.power || 0) * level;
    d.defense += (effects.defense || 0) * level;
    d.control += (effects.control || 0) * level;
  }

  for (const unit of UNIT_BLUEPRINTS) {
    const count = state.units[unit.id]?.count || 0;
    d.crewCount += count;
    d.crewUsed += unit.capUse * count;
    d.power += unit.power * count;
    d.incomePerTick += unit.income * count;
  }

  const leadership = state.perks.leadership.level;
  const mechanic = state.perks.mechanic.level;
  const streetwise = state.perks.streetwise.level;
  const logistics = state.perks.logistics.level;

  d.crewCap += leadership * 3;
  d.power += mechanic * 12;
  d.storage += logistics * 900;
  d.incomePerTick *= 1 + logistics * 0.04;
  d.heatReduce += streetwise * 0.08;
  d.missionBonus = leadership * 2.4 + mechanic * 1.8 + d.defense * 0.15;
  d.heatPerTick = Math.max(0, d.heatPerTick - d.heatReduce);

  return d;
}

function canPay(cost) {
  return state.cash >= cost.cash && state.respect >= cost.respect;
}

function pay(cost) {
  state.cash -= cost.cash || 0;
  state.respect -= cost.respect || 0;
}

function addLog(text) {
  state.log.unshift({ time: Date.now(), text });
  state.log = state.log.slice(0, 40);
  renderLog();
}

function showModal(title, text) {
  const modal = $('#modal');
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = text;
  if (typeof modal.showModal === 'function') modal.showModal();
  else alert(`${title}\n\n${text}`);
}

function tick(seconds = TICK_MS / 1000) {
  derived = getDerived();
  const ticks = seconds / (TICK_MS / 1000);
  const income = derived.incomePerTick * ticks;
  const respectGain = derived.respectPerTick * ticks;
  const heatGain = derived.heatPerTick * ticks;

  const beforeCash = state.cash;
  state.cash = clamp(state.cash + income, 0, derived.storage);
  state.respect += respectGain;
  state.heat = clamp(state.heat + heatGain, 0, 100);

  if (state.cash >= derived.storage && beforeCash < derived.storage) {
    addLog('Dein Geldlager ist voll. Werte das Geldlager auf, damit keine Einnahmen verloren gehen.');
  }

  if (state.heat >= 85 && Math.random() < 0.16) {
    const loss = Math.min(state.cash, Math.max(250, state.cash * 0.08));
    state.cash -= loss;
    state.heat = clamp(state.heat - 4, 0, 100);
    addLog(`Risk-Event: Hoher Druck hat dich ${fmtMoney(loss)} gekostet.`);
  }

  renderAll();
  saveState(true);
}

function applyOfflineProgress() {
  const now = Date.now();
  const last = state.lastTick || now;
  const elapsed = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, Math.floor((now - last) / 1000)));
  if (elapsed < 15) return;
  derived = getDerived();
  const oldCash = state.cash;
  const oldRespect = state.respect;
  const oldHeat = state.heat;
  state.cash = clamp(state.cash + derived.incomePerTick * (elapsed / 3), 0, derived.storage);
  state.respect += derived.respectPerTick * (elapsed / 3);
  state.heat = clamp(state.heat + derived.heatPerTick * (elapsed / 3), 0, 100);
  state.lastTick = now;
  const gainedCash = state.cash - oldCash;
  const gainedRespect = state.respect - oldRespect;
  const gainedHeat = state.heat - oldHeat;
  addLog(`Offline-Fortschritt: +${fmtMoney(gainedCash)}, +${fmtNum(gainedRespect)} Respekt, +${Math.floor(gainedHeat)}% Heat.`);
}

function renderResources() {
  derived = getDerived();
  $('#clubName').textContent = state.name;
  $('#cashValue').textContent = fmtMoney(state.cash);
  $('#cashCap').textContent = `Lager: ${fmtMoney(derived.storage)}`;
  $('#respectValue').textContent = fmtNum(state.respect);
  $('#crewValue').textContent = `${fmtNum(derived.crewUsed)} / ${fmtNum(derived.crewCap)}`;
  $('#powerValue').textContent = `Power: ${fmtNum(derived.power)}`;
  $('#heatValue').textContent = `${Math.floor(state.heat)}%`;
  $('#pressureValue').textContent = `Druck: ${pressureText(state.heat)}`;
  $('#leaderName').textContent = state.leaderName;
  $('#leaderStats').textContent = `Level ${state.level} · Einfluss ${fmtNum(state.xp)}`;
}

function pressureText(heat) {
  if (heat < 25) return 'niedrig';
  if (heat < 55) return 'mittel';
  if (heat < 80) return 'hoch';
  return 'kritisch';
}

function renderBuildings() {
  const grid = $('#buildingGrid');
  grid.innerHTML = '';

  for (const blueprint of BUILDING_BLUEPRINTS) {
    const data = state.buildings[blueprint.id];
    const level = data.level || 0;
    const cost = buildingCost(blueprint, level);
    const maxed = level >= blueprint.maxLevel;
    const affordable = canPay(cost);
    const locked = blueprint.id === 'harbor' && (state.buildings.eastblock.level || 0) < 2;
    const lockedIndustrial = blueprint.id === 'industrial' && (state.buildings.harbor.level || 0) < 2;
    const isLocked = locked || lockedIndustrial;
    const effectsText = effectText(blueprint.effects, level);

    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-head">
        <div class="icon-badge">${blueprint.icon}</div>
        <span class="level-pill">Lvl ${level}/${blueprint.maxLevel}</span>
      </div>
      <div>
        <h4>${blueprint.name}</h4>
        <p>${blueprint.desc}</p>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${(level / blueprint.maxLevel) * 100}%"></span></div>
      <div class="stat-row">
        <div class="stat-box"><small>Aktuell</small><strong>${effectsText || 'Noch kein Effekt'}</strong></div>
        <div class="stat-box"><small>Nächster Preis</small><strong>${maxed ? 'Max' : `${fmtMoney(cost.cash)} · ${fmtNum(cost.respect)} R`}</strong></div>
      </div>
      <div class="card-actions">
        <button class="primary-btn" data-upgrade="${blueprint.id}" ${maxed || !affordable || isLocked ? 'disabled' : ''}>${level === 0 ? 'Bauen' : 'Upgraden'}</button>
      </div>
      <div class="cost-line">${isLocked ? lockText(blueprint.id) : maxed ? 'Maximale Stufe erreicht.' : affordable ? `Upgrade auf Level ${cost.next} bereit.` : `Benötigt ${fmtMoney(Math.max(0, cost.cash - state.cash))} & ${fmtNum(Math.max(0, cost.respect - state.respect))} Respekt mehr.`}</div>
    `;
    grid.appendChild(card);
  }
}

function lockText(id) {
  if (id === 'harbor') return 'Benötigt East Block Level 2.';
  if (id === 'industrial') return 'Benötigt Harbor Block Level 2.';
  return 'Noch gesperrt.';
}

function effectText(effects, level) {
  if (!effects || level <= 0) return '';
  const parts = [];
  if (effects.income) parts.push(`+${fmtMoney(effects.income * level)}/Tick`);
  if (effects.storage) parts.push(`+${fmtMoney(effects.storage * level)} Lager`);
  if (effects.crewCap) parts.push(`+${effects.crewCap * level} Crew`);
  if (effects.power) parts.push(`+${effects.power * level} Power`);
  if (effects.defense) parts.push(`+${effects.defense * level} Def`);
  if (effects.control) parts.push(`+${effects.control * level} Kontrolle`);
  return parts.slice(0, 2).join(' · ');
}

function renderUnits() {
  const grid = $('#unitGrid');
  grid.innerHTML = '';
  derived = getDerived();

  for (const unit of UNIT_BLUEPRINTS) {
    const count = state.units[unit.id].count || 0;
    const cost = unitCost(unit);
    const hasCap = derived.crewUsed + unit.capUse <= derived.crewCap;
    const affordable = canPay(cost);
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-head">
        <div class="icon-badge">${unit.icon}</div>
        <span class="level-pill">${fmtNum(count)}x</span>
      </div>
      <div>
        <h4>${unit.name}</h4>
        <p>${unit.desc}</p>
      </div>
      <div class="stat-row">
        <div class="stat-box"><small>Stärke</small><strong>+${unit.power} Power</strong></div>
        <div class="stat-box"><small>Slot / Einnahme</small><strong>${unit.capUse} Slot · +${fmtMoney(unit.income)}/Tick</strong></div>
      </div>
      <div class="card-actions">
        <button class="primary-btn" data-recruit="${unit.id}" ${!affordable || !hasCap ? 'disabled' : ''}>Rekrutieren</button>
      </div>
      <div class="cost-line">${hasCap ? `Kosten: ${fmtMoney(cost.cash)} · ${fmtNum(cost.respect)} Respekt` : 'Crew-Limit voll. Baue Clubhouse oder Nomad Camp aus.'}</div>
    `;
    grid.appendChild(card);
  }
}

function renderMissions() {
  const grid = $('#missionGrid');
  grid.innerHTML = '';
  derived = getDerived();
  const now = Date.now();

  for (const mission of MISSION_BLUEPRINTS) {
    const readyAt = state.missions[mission.id] || 0;
    const remaining = Math.max(0, Math.ceil((readyAt - now) / 1000));
    const chance = missionChance(mission);
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-head">
        <div class="icon-badge">${mission.icon}</div>
        <span class="level-pill">${chance}% Chance</span>
      </div>
      <div>
        <h4>${mission.name}</h4>
        <p>${mission.desc}</p>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${chance}%"></span></div>
      <div class="stat-row">
        <div class="stat-box"><small>Belohnung</small><strong>${fmtMoney(mission.cash)} · ${mission.respect} R</strong></div>
        <div class="stat-box"><small>Risiko</small><strong>+${mission.heat}% Heat</strong></div>
      </div>
      <div class="card-actions">
        <button class="primary-btn" data-run="${mission.id}" ${remaining > 0 || derived.power < Math.floor(mission.requiredPower * 0.45) ? 'disabled' : ''}>${remaining > 0 ? `${remaining}s` : 'Run starten'}</button>
      </div>
      <div class="cost-line">Empfohlen: ${mission.requiredPower} Power · Deine Power: ${fmtNum(derived.power)}</div>
    `;
    grid.appendChild(card);
  }
}

function missionChance(mission) {
  derived = getDerived();
  const base = (derived.power + derived.missionBonus) / mission.requiredPower;
  const heatPenalty = state.heat * 0.35;
  return Math.floor(clamp(base * 70 + 18 - heatPenalty, 8, 96));
}

function renderFactions() {
  const grid = $('#factionGrid');
  grid.innerHTML = '';

  for (const faction of FACTION_BLUEPRINTS) {
    const data = state.factions[faction.id];
    const pressure = clamp(data.pressure + state.heat * 0.25, 0, 100);
    const cost = Math.floor(faction.baseCost * (1 + pressure / 70) * (1 + state.level * 0.04));
    const canBribe = state.cash >= cost;
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-head">
        <div class="icon-badge">${faction.icon}</div>
        <span class="level-pill">${Math.floor(pressure)}%</span>
      </div>
      <div>
        <h4>${faction.name}</h4>
        <p>${faction.desc}</p>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${pressure}%"></span></div>
      <div class="stat-row">
        <div class="stat-box"><small>Beruhigt</small><strong>-${faction.heatDrop}% Heat</strong></div>
        <div class="stat-box"><small>Kosten</small><strong>${fmtMoney(cost)}</strong></div>
      </div>
      <div class="card-actions">
        <button class="primary-btn" data-bribe="${faction.id}" ${!canBribe ? 'disabled' : ''}>Beruhigen</button>
      </div>
      <div class="cost-line">${canBribe ? 'Sofort möglich.' : `Es fehlen ${fmtMoney(cost - state.cash)}.`}</div>
    `;
    grid.appendChild(card);
  }
}

function renderPerks() {
  const grid = $('#perkGrid');
  grid.innerHTML = '';

  for (const perk of PERKS) {
    const data = state.perks[perk.id];
    const cost = perkCost(perk);
    const maxed = data.level >= perk.max;
    const affordable = canPay(cost);
    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-head">
        <div class="icon-badge">${perk.icon}</div>
        <span class="level-pill">Lvl ${data.level}/${perk.max}</span>
      </div>
      <div>
        <h4>${perk.name}</h4>
        <p>${perk.desc}</p>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${(data.level / perk.max) * 100}%"></span></div>
      <div class="card-actions">
        <button class="primary-btn" data-perk="${perk.id}" ${maxed || !affordable ? 'disabled' : ''}>Verbessern</button>
      </div>
      <div class="cost-line">${maxed ? 'Maximale Stufe erreicht.' : `Kosten: ${fmtMoney(cost.cash)} · ${fmtNum(cost.respect)} Respekt`}</div>
    `;
    grid.appendChild(card);
  }
}

function renderLog() {
  const list = $('#logList');
  if (!list) return;
  list.innerHTML = state.log.map((entry) => {
    const time = new Date(entry.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `<div class="log-item"><strong>${time}</strong> · ${entry.text}</div>`;
  }).join('');
}

function renderAll() {
  renderResources();
  renderBuildings();
  renderUnits();
  renderMissions();
  renderFactions();
  renderPerks();
  renderLog();
}

function upgradeBuilding(id) {
  const blueprint = getBuilding(id);
  if (!blueprint) return;
  const current = state.buildings[id].level || 0;
  if (current >= blueprint.maxLevel) return;
  const cost = buildingCost(blueprint, current);
  if (!canPay(cost)) return showModal('Nicht genug Ressourcen', 'Dir fehlen Geld oder Respekt für dieses Upgrade.');
  pay(cost);
  state.buildings[id].level = current + 1;
  state.xp += 8 + state.buildings[id].level * 2;
  maybeLevelUp();
  addLog(`${blueprint.name} auf Level ${state.buildings[id].level} verbessert.`);
  renderAll();
  saveState(true);
}

function recruitUnit(id) {
  const unit = getUnit(id);
  if (!unit) return;
  derived = getDerived();
  if (derived.crewUsed + unit.capUse > derived.crewCap) {
    return showModal('Crew-Limit voll', 'Baue Clubhouse, Nomad Camp oder Leadership aus, damit mehr Leute Platz haben.');
  }
  const cost = unitCost(unit);
  if (!canPay(cost)) return showModal('Nicht genug Ressourcen', 'Dir fehlen Geld oder Respekt für diese Rekrutierung.');
  pay(cost);
  state.units[id].count += 1;
  state.xp += 6 + unit.power * 0.2;
  maybeLevelUp();
  addLog(`${unit.name} rekrutiert.`);
  renderAll();
  saveState(true);
}

function runMission(id) {
  const mission = MISSION_BLUEPRINTS.find((m) => m.id === id);
  if (!mission) return;
  const now = Date.now();
  if ((state.missions[id] || 0) > now) return;
  const chance = missionChance(mission);
  const success = Math.random() * 100 <= chance;
  const heatModifier = 1 - state.perks.streetwise.level * 0.025;
  state.missions[id] = now + mission.cooldown * 1000;

  if (success) {
    const cashReward = mission.cash * (1 + state.perks.logistics.level * 0.03);
    const respectReward = mission.respect * (1 + state.perks.leadership.level * 0.04);
    state.cash = clamp(state.cash + cashReward, 0, derived.storage);
    state.respect += respectReward;
    state.heat = clamp(state.heat + mission.heat * heatModifier, 0, 100);
    state.xp += mission.respect;
    addLog(`${mission.name} erfolgreich: +${fmtMoney(cashReward)}, +${fmtNum(respectReward)} Respekt.`);
  } else {
    const loss = Math.min(state.cash, Math.floor(mission.cash * 0.28));
    state.cash -= loss;
    state.heat = clamp(state.heat + mission.heat * 1.45 * heatModifier, 0, 100);
    addLog(`${mission.name} fehlgeschlagen: ${fmtMoney(loss)} verloren und Heat gestiegen.`);
  }

  maybeLevelUp();
  renderAll();
  saveState(true);
}

function bribeFaction(id) {
  const faction = FACTION_BLUEPRINTS.find((f) => f.id === id);
  if (!faction) return;
  const data = state.factions[id];
  const pressure = clamp(data.pressure + state.heat * 0.25, 0, 100);
  const cost = Math.floor(faction.baseCost * (1 + pressure / 70) * (1 + state.level * 0.04));
  if (state.cash < cost) return showModal('Zu wenig Geld', 'Du kannst diese Fraktion noch nicht beruhigen.');
  state.cash -= cost;
  state.heat = clamp(state.heat - faction.heatDrop, 0, 100);
  data.pressure = clamp(data.pressure - 18, 0, 100);
  data.lastBribe = Date.now();
  addLog(`${faction.name} beruhigt. Heat um ${faction.heatDrop}% gesenkt.`);
  renderAll();
  saveState(true);
}

function improvePerk(id) {
  const perk = getPerk(id);
  if (!perk) return;
  const data = state.perks[id];
  if (data.level >= perk.max) return;
  const cost = perkCost(perk);
  if (!canPay(cost)) return showModal('Nicht genug Ressourcen', 'Dir fehlen Geld oder Respekt für dieses Training.');
  pay(cost);
  data.level += 1;
  state.xp += 18 + data.level * 4;
  maybeLevelUp();
  addLog(`${perk.name} auf Level ${data.level} verbessert.`);
  renderAll();
  saveState(true);
}

function maybeLevelUp() {
  let needed = state.level * 120;
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    state.cash = clamp(state.cash + state.level * 180, 0, getDerived().storage);
    state.respect += state.level * 12;
    addLog(`Charter-Level ${state.level} erreicht. Bonus erhalten.`);
    needed = state.level * 120;
  }
}

function collectIncome() {
  derived = getDerived();
  const bonus = Math.min(derived.storage - state.cash, Math.max(50, derived.incomePerTick * 6));
  if (bonus <= 0) return showModal('Lager voll', 'Dein Geldlager ist voll. Baue es aus, bevor du mehr einsammelst.');
  state.cash += bonus;
  state.respect += Math.max(1, derived.respectPerTick * 2);
  addLog(`Schnelleinnahmen eingesammelt: +${fmtMoney(bonus)}.`);
  renderAll();
  saveState(true);
}

function upgradeCheapest() {
  const options = BUILDING_BLUEPRINTS
    .map((blueprint) => ({ blueprint, level: state.buildings[blueprint.id].level || 0, cost: buildingCost(blueprint) }))
    .filter((item) => item.level < item.blueprint.maxLevel && canPay(item.cost))
    .sort((a, b) => (a.cost.cash + a.cost.respect * 25) - (b.cost.cash + b.cost.respect * 25));
  if (!options.length) return showModal('Kein Upgrade bereit', 'Aktuell reicht es für kein Gebäude-Upgrade. Sammle mehr Geld oder Respekt.');
  upgradeBuilding(options[0].blueprint.id);
}

function cooldownHeat() {
  derived = getDerived();
  const drop = Math.max(3, 6 + state.perks.streetwise.level + derived.defense * 0.04);
  state.heat = clamp(state.heat - drop, 0, 100);
  for (const key of Object.keys(state.factions)) {
    state.factions[key].pressure = clamp((state.factions[key].pressure || 0) - 2, 0, 100);
  }
  addLog(`Heat aktiv abgebaut: -${Math.floor(drop)}%.`);
  renderAll();
  saveState(true);
}

function trainLeader() {
  const cost = {
    cash: Math.floor(650 * Math.pow(1.5, state.level - 1)),
    respect: Math.floor(18 * Math.pow(1.3, state.level - 1))
  };
  if (!canPay(cost)) {
    return showModal('Training nicht möglich', `Du brauchst ${fmtMoney(cost.cash)} und ${fmtNum(cost.respect)} Respekt.`);
  }
  pay(cost);
  state.xp += 95;
  maybeLevelUp();
  addLog('Charaktertraining abgeschlossen. Einfluss steigt.');
  renderAll();
  saveState(true);
}

function renameClub() {
  const name = prompt('Neuer Charter-Name:', state.name);
  if (!name) return;
  state.name = name.trim().slice(0, 34) || state.name;
  addLog(`Charter umbenannt in ${state.name}.`);
  renderAll();
  saveState(true);
}

function bindEvents() {
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;

    if (target.matches('.tab')) {
      $$('.tab').forEach((tab) => tab.classList.toggle('active', tab === target));
      $$('.screen').forEach((screen) => screen.classList.toggle('active-screen', screen.id === target.dataset.tab));
      return;
    }

    if (target.dataset.upgrade) upgradeBuilding(target.dataset.upgrade);
    if (target.dataset.recruit) recruitUnit(target.dataset.recruit);
    if (target.dataset.run) runMission(target.dataset.run);
    if (target.dataset.bribe) bribeFaction(target.dataset.bribe);
    if (target.dataset.perk) improvePerk(target.dataset.perk);
  });

  $('#saveBtn').addEventListener('click', () => saveState(false));
  $('#collectBtn').addEventListener('click', collectIncome);
  $('#renameBtn').addEventListener('click', renameClub);
  $('#upgradeCheapestBtn').addEventListener('click', upgradeCheapest);
  $('#cooldownBtn').addEventListener('click', cooldownHeat);
  $('#trainLeaderBtn').addEventListener('click', trainLeader);
  $('#clearLogBtn').addEventListener('click', () => {
    state.log = [];
    renderLog();
    saveState(true);
  });
}

function startGame() {
  applyOfflineProgress();
  bindEvents();
  renderAll();
  setInterval(() => tick(), TICK_MS);
  setInterval(() => renderMissions(), 1000);
  window.addEventListener('beforeunload', () => saveState(true));
}

startGame();
