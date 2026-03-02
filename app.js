(() => {
  "use strict";

  /* =========================
     Storage / State
  ========================= */
  const STORAGE_KEY = "multiSlotSystem.v4";
  const DAY_MS = 24 * 60 * 60 * 1000;

  const defaultState = {
    balance: 20.00,
    bet: 0.10,
    selectedSlotId: "lucky_pharaoh",
    lastWheelAt: 0,
    customSlots: {},
    soundOn: true,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        customSlots: parsed.customSlots && typeof parsed.customSlots === "object" ? parsed.customSlots : {},
      };
    } catch {
      return { ...defaultState };
    }
  }
  let state = loadState();
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  /* =========================
     RNG
  ========================= */
  function rand01() { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 2 ** 32; }
  function randInt(a, b) { return a + Math.floor(rand01() * (b - a + 1)); }
  function weightedChoice(map) {
    const entries = Object.entries(map).filter(([, w]) => Number(w) > 0);
    let total = 0;
    for (const [, w] of entries) total += Number(w);
    if (total <= 0) return entries.length ? entries[0][0] : null;
    let pick = rand01() * total;
    for (const [k, w] of entries) { pick -= Number(w); if (pick <= 0) return k; }
    return entries[entries.length - 1][0];
  }

  /* =========================
     Audio (optional)
  ========================= */
  class AudioEngine {
    constructor() { this.ctx = null; this.master = null; this.ambGain = null; this.ambOsc = null; this.started = false; }
    ensure() {
      if (this.started) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);

      this.ambGain = this.ctx.createGain();
      this.ambGain.gain.value = 0.06;
      this.ambGain.connect(this.master);

      this.ambOsc = this.ctx.createOscillator();
      this.ambOsc.type = "sine";
      this.ambOsc.frequency.value = 55;
      this.ambOsc.connect(this.ambGain);
      this.ambOsc.start();

      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.12;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(this.ambGain.gain);
      lfo.start();

      this.started = true;
    }
    blip(freq, dur = 0.06, vol = 0.12, type = "square") {
      if (!this.started || !state.soundOn) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(this.master);
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    }
    reelTick() { this.blip(520 + randInt(-40, 40), 0.05, 0.08, "square"); }
    reelStop() { this.blip(220, 0.08, 0.10, "triangle"); }
    win() { this.blip(740, 0.10, 0.14, "sine"); setTimeout(() => this.blip(980, 0.10, 0.14, "sine"), 90); }
    lose(){ this.blip(140, 0.12, 0.11, "sawtooth"); }
  }
  const audio = new AudioEngine();

  /* =========================
     Slot Config (Lucky Pharaoh)
     - Auszahlung: Multiplikator × Gesamteinsatz (wie Bild)
  ========================= */
  const WILD = "__WILD__";
  const SYM = {
    MASK: "MASK", DIA: "DIA", RUB: "RUB", SAP: "SAP", EME: "EME",
    A: "A", K: "K", Q: "Q", J: "J", T10: "10",
  };

  function makeLuckyPharaohSlot() {
    return {
      id: "lucky_pharaoh",
      name: "Lucky Pharaoh",
      reels: 5,
      rows: 3,
      paylines: 10,
      features: {
        powerSpins: true,
        powerTriggerMultiplier: 4,
        mysterySymbol: SYM.MASK,
        wildMode: true,
        wildExpandChancePower: 0.06,
      },
      symbols: [
        { key: SYM.MASK, label: "🎭" },
        { key: SYM.DIA,  label: "💎" },
        { key: SYM.RUB,  label: "🛑" },
        { key: SYM.SAP,  label: "💠" },
        { key: SYM.EME,  label: "❇️" },
        { key: SYM.A,    label: "A" },
        { key: SYM.K,    label: "K" },
        { key: SYM.Q,    label: "Q" },
        { key: SYM.J,    label: "J" },
        { key: SYM.T10,  label: "10" },
      ],
      weights: {
        base: {
          [SYM.MASK]: 7, [SYM.DIA]: 5, [SYM.RUB]: 8, [SYM.SAP]: 9, [SYM.EME]: 10,
          [SYM.A]: 14, [SYM.K]: 14, [SYM.Q]: 14, [SYM.J]: 14, [SYM.T10]: 16,
        },
        power: {
          [SYM.MASK]: 7, [SYM.DIA]: 5, [SYM.RUB]: 9, [SYM.SAP]: 9, [SYM.EME]: 11,
          [SYM.A]: 12, [SYM.K]: 12, [SYM.Q]: 15, [SYM.J]: 14, [SYM.T10]: 15,
        }
      },
      paytable: {
        [SYM.DIA]: { 3: 5,   4: 10,  5: 50 },
        [SYM.RUB]: { 3: 4,   4: 10,  5: 40 },
        [SYM.SAP]: { 3: 2,   4: 6,   5: 30 },
        [SYM.EME]: { 3: 2,   4: 6,   5: 30 },
        [SYM.A]:   { 3: 1,   4: 4,   5: 20 },
        [SYM.K]:   { 3: 1,   4: 4,   5: 20 },
        [SYM.Q]:   { 3: 0.5, 4: 2,   5: 10 },
        [SYM.J]:   { 3: 0.5, 4: 2,   5: 10 },
        [SYM.T10]: { 3: 0.5, 4: 2,   5: 10 },
      }
    };
  }

  function getAllSlots() {
    const defaults = { lucky_pharaoh: makeLuckyPharaohSlot() };
    return { ...defaults, ...(state.customSlots || {}) };
  }

  const PAYLINES = [
    [1,1,1,1,1],
    [0,0,0,0,0],
    [2,2,2,2,2],
    [0,1,2,1,0],
    [2,1,0,1,2],
    [0,0,1,0,0],
    [2,2,1,2,2],
    [1,0,0,0,1],
    [1,2,2,2,1],
    [0,1,1,1,0],
  ];

  /* =========================
     DOM
  ========================= */
  const $ = (id) => document.getElementById(id);

  const slotSelect = $("slotSelect");
  const betSelect = $("betSelect");
  const spinBtn = $("spinBtn");
  const autoBtn = $("autoBtn");
  const midMsg = $("midMsg");
  const slotMeta = $("slotMeta");

  const wheelBtn = $("wheelBtn");
  const wheelCooldownText = $("wheelCooldownText");

  const baseBoardEl = $("baseBoard");
  const balanceBottom = $("balanceBottom");

  const soundBtn = $("soundBtn");

  // Power Buy Modal
  const powerModalOverlay = $("powerModalOverlay");
  const powerModalText = $("powerModalText");
  const powerBuyRange = $("powerBuyRange");
  const powerBuySpins = $("powerBuySpins");
  const powerBuyCost = $("powerBuyCost");
  const takeWinBtn = $("takeWinBtn");
  const buyPowerBtn = $("buyPowerBtn");
  const closePowerModal = $("closePowerModal");

  // Power Play Overlay
  const powerPlayOverlay = $("powerPlayOverlay");
  const powerStopBtn = $("powerStopBtn");
  const powerCloseBtn = $("powerCloseBtn");
  const powerSpinsLeftEl = $("powerSpinsLeft");
  const powerSpinWinEl = $("powerSpinWin");
  const powerTotalWinEl = $("powerTotalWin");
  const pBoards = [ $("pBoard1"), $("pBoard2"), $("pBoard3"), $("pBoard4") ];

  // Wheel
  const wheelModalOverlay = $("wheelModalOverlay");
  const wheel = $("wheel");
  const wheelInfo = $("wheelInfo");
  const wheelReadyText = $("wheelReadyText");
  const spinWheelBtn = $("spinWheelBtn");
  const closeWheelModal = $("closeWheelModal");

  // Admin / Builder
  const adminOverlay = $("adminOverlay");
  const closeAdmin = $("closeAdmin");
  const adminBalanceInput = $("adminBalanceInput");
  const adminSetBalanceBtn = $("adminSetBalanceBtn");
  const adminResetWheelBtn = $("adminResetWheelBtn");
  const adminExportDataBtn = $("adminExportDataBtn");
  const adminResetAllBtn = $("adminResetAllBtn");

  const builderNewBtn = $("builderNewBtn");
  const builderCloneBtn = $("builderCloneBtn");
  const builderDeleteBtn = $("builderDeleteBtn");
  const builderSlotSelect = $("builderSlotSelect");
  const builderJson = $("builderJson");
  const builderSaveBtn = $("builderSaveBtn");
  const builderExportSlotBtn = $("builderExportSlotBtn");
  const builderImportSlotBtn = $("builderImportSlotBtn");

  /* =========================
     UI helpers
  ========================= */
  function eur(n){ return "€" + Number(n || 0).toFixed(2); }
  function setMid(main, sub){
    midMsg.querySelector(".midMain").textContent = main;
    midMsg.querySelector(".midSub").textContent = sub || "";
  }
  function renderBalance(){
    balanceBottom.textContent = eur(state.balance);
  }
  function getSelectedSlot(){
    const all = getAllSlots();
    return all[state.selectedSlotId] || all.lucky_pharaoh;
  }
  function renderSlotMeta(){
    const s = getSelectedSlot();
    slotMeta.textContent = `${s.reels}×${s.rows} · ${s.paylines} Linien · Paytable = Gesamt-Einsatz`;
  }

  function fillBetOptions(){
    const bets = [0.10,0.20,0.30,0.40,0.50,0.60,0.70,0.80,0.90,1.00,2.00,3.00,4.00,5.00,10.00];
    betSelect.innerHTML = "";
    for (const b of bets){
      const o = document.createElement("option");
      o.value = String(b);
      o.textContent = eur(b);
      betSelect.appendChild(o);
    }
    if (!bets.includes(Number(state.bet))) state.bet = 0.10;
    betSelect.value = String(state.bet);
  }

  function fillSlotOptions(){
    const all = getAllSlots();
    slotSelect.innerHTML = "";
    for (const [id, cfg] of Object.entries(all)){
      const o = document.createElement("option");
      o.value = id;
      o.textContent = cfg.name + (id === "lucky_pharaoh" ? " (Default)" : "");
      slotSelect.appendChild(o);
    }
    if (!all[state.selectedSlotId]) state.selectedSlotId = "lucky_pharaoh";
    slotSelect.value = state.selectedSlotId;

    builderSlotSelect.innerHTML = "";
    for (const [id, cfg] of Object.entries(all)){
      const o = document.createElement("option");
      o.value = id;
      o.textContent = cfg.name + (state.customSlots[id] ? " (Custom)" : " (Built-in)");
      builderSlotSelect.appendChild(o);
    }
    builderSlotSelect.value = state.selectedSlotId;
  }

  function updateWheelCooldownUI(){
    const now = Date.now();
    const next = (state.lastWheelAt || 0) + DAY_MS;
    if (now >= next) {
      wheelCooldownText.textContent = "Wheel: bereit";
    } else {
      const ms = next - now;
      const h = Math.floor(ms / (60*60*1000));
      const m = Math.floor((ms % (60*60*1000)) / (60*1000));
      const s = Math.floor((ms % (60*1000)) / 1000);
      wheelCooldownText.textContent = `Wheel: in ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }
  }

  /* =========================
     Board build + cell update
  ========================= */
  function symbolDef(slot, key){
    return slot.symbols.find(x => x.key === key) || { key, label: key };
  }
  function safeClassKey(key){ return String(key).replace(/[^a-zA-Z0-9_-]/g, ""); }

  function buildBoard(boardEl, slot){
    boardEl.innerHTML = "";
    const cells = Array.from({length: slot.rows}, () => Array.from({length: slot.reels}, () => null));
    for (let r=0; r<slot.rows; r++){
      for (let c=0; c<slot.reels; c++){
        const cell = document.createElement("div");
        cell.className = "symbol";
        const icon = document.createElement("div");
        icon.className = "icon";
        icon.textContent = "?";
        cell.appendChild(icon);
        boardEl.appendChild(cell);
        cells[r][c] = cell;
      }
    }
    boardEl._cells = cells;
  }

  function setCell(boardEl, slot, r, c, key){
    const cell = boardEl._cells?.[r]?.[c];
    if (!cell) return;
    const def = symbolDef(slot, key);
    const icon = cell.querySelector(".icon");

    cell.classList.remove("win");
    [...cell.classList].forEach(cl => { if (cl.startsWith("sym-")) cell.classList.remove(cl); });
    cell.classList.add("sym-" + safeClassKey(key));
    cell.dataset.key = key;
    icon.textContent = def.label;
  }

  function clearWin(boardEl){
    boardEl.querySelectorAll(".symbol.win").forEach(el => el.classList.remove("win"));
  }
  function highlight(boardEl, positions){
    for (const p of positions){
      const el = boardEl._cells?.[p.r]?.[p.c];
      if (el) el.classList.add("win");
    }
  }

  /* =========================
     Grid + wild
  ========================= */
  function generateGrid(slot, mode){
    const w = mode === "power" ? slot.weights.power : slot.weights.base;
    const g = Array.from({length: slot.rows}, () => Array.from({length: slot.reels}, () => SYM.T10));
    for (let c=0; c<slot.reels; c++){
      for (let r=0; r<slot.rows; r++){
        g[r][c] = weightedChoice(w);
      }
    }
    return g;
  }

  function applyMysteryAndWild(slot, grid, mode){
    const out = grid.map(row => row.slice());
    const mystery = slot.features.mysterySymbol;
    const wildMode = !!slot.features.wildMode;
    const chPower = Number(slot.features.wildExpandChancePower || 0);

    for (let r=0; r<slot.rows; r++){
      for (let c=0; c<slot.reels; c++){
        if (out[r][c] === mystery){
          if (wildMode) out[r][c] = WILD;
          if (mode === "power" && chPower > 0 && rand01() < chPower){
            for (let rr=0; rr<slot.rows; rr++) out[rr][c] = WILD;
          }
        }
      }
    }
    return out;
  }

  /* =========================
     Win eval (Left→Right)
     payout = mult × totalBet
  ========================= */
  function evaluateWins(slot, evalGrid, betTotal){
    let totalWin = 0;
    const lineWins = [];

    for (let li=0; li<PAYLINES.length; li++){
      const pat = PAYLINES[li];
      const seq = [];
      const pos = [];
      for (let c=0; c<slot.reels; c++){
        const r = pat[c];
        seq.push(evalGrid[r][c]);
        pos.push({r, c});
      }

      let base = null;
      let len = 0;
      const positions = [];

      for (let c=0; c<seq.length; c++){
        const s = seq[c];
        if (base === null){
          if (s === WILD){ len++; positions.push(pos[c]); }
          else { base = s; len++; positions.push(pos[c]); }
        } else {
          if (s === base || s === WILD){ len++; positions.push(pos[c]); }
          else break;
        }
      }
      if (base === null) base = SYM.DIA;

      if (len >= 3){
        const mult = slot.paytable?.[base]?.[len];
        if (mult){
          const amount = Math.round(mult * betTotal * 100) / 100;
          totalWin += amount;
          lineWins.push({ lineIndex: li, amount, symbol: base, length: len, positions: positions.slice(0, len) });
        }
      }
    }

    totalWin = Math.round(totalWin * 100) / 100;
    return { totalWin, lineWins };
  }

  /* =========================
     Reel animation + QUICK STOP
  ========================= */
  async function spinBoardAnimated(boardEl, slot, mode, finalGrid, stopToken){
    boardEl.classList.add("reelSpinning");
    const weights = mode === "power" ? slot.weights.power : slot.weights.base;

    const intervals = [];
    for (let c=0; c<slot.reels; c++){
      const iv = setInterval(() => {
        audio.reelTick();
        for (let r=0; r<slot.rows; r++){
          setCell(boardEl, slot, r, c, weightedChoice(weights));
        }
      }, 65);
      intervals.push(iv);
    }

    const stopNow = () => {
      for (const iv of intervals) clearInterval(iv);
      for (let c=0; c<slot.reels; c++){
        for (let r=0; r<slot.rows; r++){
          setCell(boardEl, slot, r, c, finalGrid[r][c]);
        }
      }
      boardEl.classList.remove("reelSpinning");
    };

    for (let c=0; c<slot.reels; c++){
      // wenn STOP gedrückt -> sofort final setzen
      if (stopToken?.stop) {
        stopNow();
        return;
      }

      const stopDelay = 520 + c * 240;
      await wait(stopDelay);

      if (stopToken?.stop) {
        stopNow();
        return;
      }

      clearInterval(intervals[c]);
      for (let r=0; r<slot.rows; r++){
        setCell(boardEl, slot, r, c, finalGrid[r][c]);
      }
      audio.reelStop();
    }

    boardEl.classList.remove("reelSpinning");
  }

  function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

  /* =========================
     Game flow / Auto / Stop
  ========================= */
  let isSpinning = false;
  let autoSpin = false;

  // STOP für Base-Spin
  let baseStopToken = { stop: false };

  function stopAuto(reason){
    if (!autoSpin) return;
    autoSpin = false;
    autoBtn.textContent = "AUTO: AUS";
    autoBtn.classList.remove("primary");
    setMid("Auto gestoppt", reason || "");
  }

  function setButtonsForSpin(spinning){
    if (spinning){
      spinBtn.textContent = "STOP";
      spinBtn.classList.add("danger");
    } else {
      spinBtn.textContent = "SPIN";
      spinBtn.classList.remove("danger");
    }
  }

  async function spinBase(){
    audio.ensure();

    if (isSpinning) return;

    const slot = getSelectedSlot();
    const bet = Number(state.bet);

    if (state.balance < bet){
      setMid("Zu wenig €", "Daily Wheel oder Admin");
      stopAuto("Balance zu niedrig");
      audio.lose();
      return;
    }

    isSpinning = true;
    baseStopToken = { stop: false };
    setButtonsForSpin(true);

    // Bet abziehen
    state.balance = Math.round((state.balance - bet) * 100) / 100;
    saveState();
    renderBalance();

    setMid("Dreht…", `Einsatz ${eur(bet)}`);
    clearWin(baseBoardEl);

    const raw = generateGrid(slot, "base");
    await spinBoardAnimated(baseBoardEl, slot, "base", raw, baseStopToken);

    const evalGrid = applyMysteryAndWild(slot, raw, "base");
    const res = evaluateWins(slot, evalGrid, bet);

    clearWin(baseBoardEl);
    for (const lw of res.lineWins) highlight(baseBoardEl, lw.positions);

    const win = res.totalWin;

    if (win > 0){
      state.balance = Math.round((state.balance + win) * 100) / 100;
      saveState();
      renderBalance();
      setMid("WIN ✅", `+${eur(win)} · Linien ${res.lineWins.length}`);
      audio.win();

      // Power Trigger?
      if (slot.features.powerSpins && win >= slot.features.powerTriggerMultiplier * bet){
        stopAuto("Power verfügbar");
        pendingPower = { baseWin: win, bet, slotId: slot.id };
        openPowerBuyModal(pendingPower);
      }
    } else {
      setMid("LOSE ❌", `-${eur(bet)}`);
      audio.lose();
    }

    isSpinning = false;
    setButtonsForSpin(false);

    if (autoSpin && !pendingPower && powerModalOverlay.classList.contains("hidden") && powerPlayOverlay.classList.contains("hidden")){
      await wait(650);
      if (autoSpin) spinBase();
    }
  }

  // Spin Button: wenn läuft -> STOP, sonst spin
  spinBtn.addEventListener("click", () => {
    audio.ensure();
    if (isSpinning){
      baseStopToken.stop = true; // QUICK STOP
      setMid("Stop…", "schneller fertig");
      return;
    }
    spinBase();
  });

  autoBtn.addEventListener("click", () => {
    audio.ensure();
    autoSpin = !autoSpin;
    autoBtn.textContent = autoSpin ? "AUTO: AN" : "AUTO: AUS";
    autoBtn.classList.toggle("primary", autoSpin);

    if (autoSpin){
      setMid("Auto ✅", "läuft…");
      if (!isSpinning) spinBase();
    } else {
      setMid("Auto ❌", "aus");
    }
  });

  // Bet / Slot
  betSelect.addEventListener("change", () => {
    state.bet = Number(betSelect.value);
    saveState();
    setMid("Einsatz", eur(state.bet));
  });

  slotSelect.addEventListener("change", () => {
    state.selectedSlotId = slotSelect.value;
    saveState();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    stopAuto("Slot gewechselt");
    setMid("Slot", getSelectedSlot().name);
  });

  /* =========================
     Sound Toggle
  ========================= */
  function renderSoundBtn(){
    soundBtn.textContent = state.soundOn ? "Sound: AN" : "Sound: AUS";
  }
  soundBtn.addEventListener("click", () => {
    audio.ensure();
    state.soundOn = !state.soundOn;
    saveState();
    renderSoundBtn();
    setMid("Sound", state.soundOn ? "AN" : "AUS");
  });

  /* =========================
     Power Spins
  ========================= */
  let pendingPower = null;

  function openPowerBuyModal(info){
    const costPerSpin = info.bet * 4;
    const maxSpins = Math.max(1, Math.floor(info.baseWin / costPerSpin));

    powerBuyRange.min = "1";
    powerBuyRange.max = String(maxSpins);
    powerBuyRange.value = String(Math.min(2, maxSpins));

    powerModalText.innerHTML =
      `Gewinn: <b>${eur(info.baseWin)}</b> (≥ 4× Einsatz).<br>
       Power-Spins laufen auf <b>4 Feldern nacheinander</b> (sieht echter aus).<br>
       Kosten pro Power-Spin: <b>${eur(costPerSpin)}</b> (Einsatz × 4).`;

    syncPowerBuyText(info.bet);
    powerModalOverlay.classList.remove("hidden");
  }

  function closePowerBuyModal(){ powerModalOverlay.classList.add("hidden"); }

  function syncPowerBuyText(bet){
    const spins = Number(powerBuyRange.value);
    powerBuySpins.textContent = spins === 1 ? "1 Spin" : `${spins} Spins`;
    powerBuyCost.textContent = eur(spins * bet * 4);
  }

  powerBuyRange.addEventListener("input", () => {
    if (!pendingPower) return;
    syncPowerBuyText(pendingPower.bet);
  });

  closePowerModal.addEventListener("click", () => {
    // schließen = Gewinn behalten, kein Power
    if (pendingPower){
      setMid("WIN ✅", `+${eur(pendingPower.baseWin)} (kein Power)`);
      pendingPower = null;
    }
    closePowerBuyModal();
  });

  takeWinBtn.addEventListener("click", () => {
    if (!pendingPower) return;
    setMid("WIN ✅", `+${eur(pendingPower.baseWin)} (genommen)`);
    pendingPower = null;
    closePowerBuyModal();
  });

  buyPowerBtn.addEventListener("click", async () => {
    if (!pendingPower) return;
    const spins = Number(powerBuyRange.value);

    const info = pendingPower;
    pendingPower = null;
    closePowerBuyModal();

    await startPowerPlay(info, spins);
  });

  // PowerPlay STOP Token
  let powerStopToken = { stop: false };

  powerStopBtn.addEventListener("click", () => {
    powerStopToken.stop = true; // QUICK STOP in Power
    setMid("Power STOP", "schneller…");
  });

  powerCloseBtn.addEventListener("click", () => {
    // wenn user schließt, stoppen wir und lassen overlay zu
    powerStopToken.stop = true;
    powerPlayOverlay.classList.add("hidden");
    setMid("Power", "geschlossen");
  });

  async function startPowerPlay(info, spinsToBuy){
    const slot = getAllSlots()[info.slotId] || getSelectedSlot();
    const bet = info.bet;

    const cost = Math.round(spinsToBuy * bet * 4 * 100) / 100;
    const immediate = Math.round((info.baseWin - cost) * 100) / 100;

    // sofort Restguthaben aus Gewinn auszahlen
    state.balance = Math.round((state.balance + immediate) * 100) / 100;
    saveState();
    renderBalance();

    // overlay öffnen
    powerPlayOverlay.classList.remove("hidden");
    powerStopToken = { stop: false };

    // Boards bauen
    for (const pb of pBoards){
      if (!pb._cells) buildBoard(pb, slot);
      clearWin(pb);
    }

    let powerTotal = 0;
    powerTotalWinEl.textContent = eur(0);
    powerSpinWinEl.textContent = eur(0);

    let spinsLeft = spinsToBuy;
    powerSpinsLeftEl.textContent = String(spinsLeft);

    // ✅ Jede Power-Runde: 4 Felder NACHEINANDER
    while (spinsLeft > 0){
      powerStopToken.stop = false; // pro Spin wieder “normal”, aber Stop bleibt möglich durch Button

      powerSpinsLeftEl.textContent = String(spinsLeft);
      let spinWin = 0;

      for (let i=0; i<4; i++){
        clearWin(pBoards[i]);

        const raw = generateGrid(slot, "power");
        await spinBoardAnimated(pBoards[i], slot, "power", raw, powerStopToken);

        const evalGrid = applyMysteryAndWild(slot, raw, "power");
        const res = evaluateWins(slot, evalGrid, bet);

        for (const lw of res.lineWins) highlight(pBoards[i], lw.positions);

        spinWin += res.totalWin;

        // wenn STOP: restliche Felder sofort fertig machen
        if (powerStopToken.stop){
          // Direkt für restliche Boards final setzen (ohne lange Animation)
          for (let j=i+1; j<4; j++){
            clearWin(pBoards[j]);
            const raw2 = generateGrid(slot, "power");
            // sofort final setzen
            for (let c=0; c<slot.reels; c++){
              for (let r=0; r<slot.rows; r++){
                setCell(pBoards[j], slot, r, c, raw2[r][c]);
              }
            }
            const eval2 = applyMysteryAndWild(slot, raw2, "power");
            const res2 = evaluateWins(slot, eval2, bet);
            for (const lw of res2.lineWins) highlight(pBoards[j], lw.positions);
            spinWin += res2.totalWin;
          }
          break;
        }
      }

      spinWin = Math.round(spinWin * 100) / 100;
      powerTotal = Math.round((powerTotal + spinWin) * 100) / 100;

      powerSpinWinEl.textContent = eur(spinWin);
      powerTotalWinEl.textContent = eur(powerTotal);

      spinsLeft -= 1;
      powerSpinsLeftEl.textContent = String(spinsLeft);

      await wait(250);
    }

    // Auszahlen
    state.balance = Math.round((state.balance + powerTotal) * 100) / 100;
    saveState();
    renderBalance();

    powerPlayOverlay.classList.add("hidden");
    setMid("Power ✅", `+${eur(powerTotal)}`);
    audio.win();
  }

  /* =========================
     Daily Wheel
  ========================= */
  const WHEEL_VALUES = [10,20,30,40,50,60,70,80,90,100];
  function wheelReady(){ return Date.now() >= (state.lastWheelAt || 0) + DAY_MS; }

  function openWheelModal(){
    updateWheelModalText();
    wheelModalOverlay.classList.remove("hidden");
    stopAuto("Wheel geöffnet");
  }
  function closeWheelModalNow(){ wheelModalOverlay.classList.add("hidden"); }

  function updateWheelModalText(){
    const now = Date.now();
    const next = (state.lastWheelAt || 0) + DAY_MS;
    if (now >= next){
      wheelReadyText.textContent = "Bereit ✅";
      spinWheelBtn.disabled = false;
    } else {
      const ms = next - now;
      const h = Math.floor(ms / (60*60*1000));
      const m = Math.floor((ms % (60*60*1000)) / (60*1000));
      const s = Math.floor((ms % (60*1000)) / 1000);
      wheelReadyText.textContent = `In ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      spinWheelBtn.disabled = true;
    }
  }

  let wheelSpinning = false;
  async function spinDailyWheel(){
    audio.ensure();
    if (wheelSpinning) return;
    if (!wheelReady()){ updateWheelModalText(); return; }

    wheelSpinning = true;
    spinWheelBtn.disabled = true;

    const index = randInt(0, WHEEL_VALUES.length - 1);
    const prize = WHEEL_VALUES[index];

    const segmentDeg = 360 / WHEEL_VALUES.length;
    const targetDeg = (360 - (index * segmentDeg) - (segmentDeg / 2));
    const extraTurns = 5 * 360;
    const finalDeg = extraTurns + targetDeg + randInt(-6, 6);

    wheel.style.transform = `rotate(${finalDeg}deg)`;
    wheelInfo.textContent = "Dreht…";

    await wait(2700);

    state.balance = Math.round((state.balance + prize) * 100) / 100;
    state.lastWheelAt = Date.now();
    saveState();
    renderBalance();

    wheelInfo.innerHTML = `Gewonnen: <b>${eur(prize)}</b> ✅`;
    setMid("Wheel ✅", `+${eur(prize)}`);
    audio.win();

    updateWheelCooldownUI();
    updateWheelModalText();

    wheelSpinning = false;
    spinWheelBtn.disabled = false;
  }

  wheelBtn.addEventListener("click", openWheelModal);
  closeWheelModal.addEventListener("click", closeWheelModalNow);
  spinWheelBtn.addEventListener("click", spinDailyWheel);

  /* =========================
     Admin / Builder
  ========================= */
  const ADMIN_PASSWORD = "1403";

  function exportAllData(){
    copyToClipboard(JSON.stringify(state, null, 2));
    alert("Save JSON kopiert.");
  }
  function resetAll(){
    if (!confirm("Wirklich ALLES zurücksetzen?")) return;
    state = { ...defaultState };
    saveState();
    initUI();
    alert("Zurückgesetzt.");
  }

  async function copyToClipboard(text){
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); ta.remove();
    }
  }

  function validateSlotConfig(cfg){
    const errors = [];
    const req = (cond, msg) => { if (!cond) errors.push(msg); };

    req(cfg && typeof cfg === "object", "Config muss Objekt sein.");
    if (!cfg || typeof cfg !== "object") return { ok:false, errors };

    req(typeof cfg.id === "string" && cfg.id.length >= 3, "id fehlt.");
    req(typeof cfg.name === "string" && cfg.name.length >= 2, "name fehlt.");
    req(cfg.reels === 5, "reels muss 5 sein.");
    req(cfg.rows === 3, "rows muss 3 sein.");
    req(cfg.paylines === 10, "paylines muss 10 sein.");
    req(cfg.features && typeof cfg.features === "object", "features fehlt.");
    req(Array.isArray(cfg.symbols) && cfg.symbols.length >= 6, "symbols fehlt.");
    req(cfg.weights && cfg.weights.base && cfg.weights.power, "weights fehlen.");
    req(cfg.paytable && typeof cfg.paytable === "object", "paytable fehlt.");

    if (cfg.symbols){
      const keys = cfg.symbols.map(s => s.key);
      req(new Set(keys).size === keys.length, "symbol keys müssen eindeutig sein.");
    }
    return { ok: errors.length === 0, errors };
  }

  function refreshBuilderJson(){
    const all = getAllSlots();
    const id = builderSlotSelect.value || state.selectedSlotId;
    const cfg = all[id] || getSelectedSlot();
    builderJson.value = JSON.stringify(cfg, null, 2);
    builderSlotSelect.value = id;
  }

  function saveBuilderJson(){
    let obj;
    try { obj = JSON.parse(builderJson.value); }
    catch (e){ alert("JSON Fehler: " + e.message); return; }

    const v = validateSlotConfig(obj);
    if (!v.ok){ alert("Ungültig:\n- " + v.errors.join("\n- ")); return; }

    const isBuiltIn = (obj.id === "lucky_pharaoh");
    const id = isBuiltIn ? (obj.id + "_custom_" + randInt(1000,9999)) : obj.id;
    obj.id = id;

    state.customSlots[id] = obj;
    state.selectedSlotId = id;
    saveState();

    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    alert("Gespeichert: " + obj.name);
  }

  function slugify(s){
    return String(s||"").toLowerCase().trim().replace(/[^\wäöüß]+/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"");
  }
  function builderNewSlot(){
    const name = prompt("Name für neuen Slot:");
    if (!name) return;
    const id = slugify(name) || ("slot_" + randInt(1000,9999));
    const base = makeLuckyPharaohSlot();
    const cfg = structuredClone(base);
    cfg.id = id; cfg.name = name;
    state.customSlots[id] = cfg;
    state.selectedSlotId = id;
    saveState();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    refreshBuilderJson();
    alert("Erstellt: " + name);
  }
  function builderCloneSelected(){
    const all = getAllSlots();
    const srcId = builderSlotSelect.value || state.selectedSlotId;
    const src = all[srcId];
    if (!src) return;
    const clone = structuredClone(src);
    clone.id = `${src.id}_clone_${randInt(1000,9999)}`;
    clone.name = `${src.name} (Clone)`;
    state.customSlots[clone.id] = clone;
    state.selectedSlotId = clone.id;
    saveState();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    refreshBuilderJson();
    alert("Geklont.");
  }
  function builderDeleteSelected(){
    const id = builderSlotSelect.value || state.selectedSlotId;
    if (!state.customSlots[id]) return alert("Nur Custom Slots löschbar.");
    if (!confirm("Löschen? " + id)) return;
    delete state.customSlots[id];
    state.selectedSlotId = "lucky_pharaoh";
    saveState();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    refreshBuilderJson();
    alert("Gelöscht.");
  }
  function builderExportSlot(){
    const all = getAllSlots();
    const id = builderSlotSelect.value || state.selectedSlotId;
    if (!all[id]) return;
    copyToClipboard(JSON.stringify(all[id], null, 2));
    alert("Slot JSON kopiert.");
  }
  function builderImportSlot(){
    const str = prompt("Slot JSON einfügen:");
    if (!str) return;
    let obj;
    try { obj = JSON.parse(str); }
    catch (e){ return alert("JSON Fehler: " + e.message); }
    const v = validateSlotConfig(obj);
    if (!v.ok) return alert("Ungültig:\n- " + v.errors.join("\n- "));
    const id = obj.id && obj.id !== "lucky_pharaoh" ? obj.id : ("import_" + randInt(1000,9999));
    obj.id = id;
    state.customSlots[id] = obj;
    state.selectedSlotId = id;
    saveState();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    refreshBuilderJson();
    alert("Importiert.");
  }

  closeAdmin.addEventListener("click", () => adminOverlay.classList.add("hidden"));
  adminSetBalanceBtn.addEventListener("click", () => {
    const v = Number(adminBalanceInput.value);
    if (!Number.isFinite(v) || v < 0) return alert("Ungültig.");
    state.balance = Math.round(v * 100) / 100;
    saveState();
    renderBalance();
    setMid("Balance", eur(state.balance));
  });
  adminResetWheelBtn.addEventListener("click", () => {
    state.lastWheelAt = 0;
    saveState();
    updateWheelCooldownUI();
    updateWheelModalText();
    setMid("Wheel", "reset");
  });
  adminExportDataBtn.addEventListener("click", exportAllData);
  adminResetAllBtn.addEventListener("click", resetAll);

  builderSlotSelect.addEventListener("change", refreshBuilderJson);
  builderSaveBtn.addEventListener("click", saveBuilderJson);
  builderNewBtn.addEventListener("click", builderNewSlot);
  builderCloneBtn.addEventListener("click", builderCloneSelected);
  builderDeleteBtn.addEventListener("click", builderDeleteSelected);
  builderExportSlotBtn.addEventListener("click", builderExportSlot);
  builderImportSlotBtn.addEventListener("click", builderImportSlot);

  // Admin Hotkey
  window.addEventListener("keydown", (e) => {
    const ctrlAlt = e.ctrlKey && e.altKey;
    const isHash = (e.key === "#") || (e.code === "Digit3") || (e.code === "Backslash");
    if (ctrlAlt && isHash) {
      e.preventDefault();
      const pwd = prompt("Admin Passwort:");
      if (pwd !== ADMIN_PASSWORD) return alert("Falsch.");
      adminBalanceInput.value = String(state.balance.toFixed(2));
      refreshBuilderJson();
      adminOverlay.classList.remove("hidden");
      stopAuto("Admin geöffnet");
    }
  });

  /* =========================
     Rebuild base board
  ========================= */
  function rebuildBaseBoard(){
    const slot = getSelectedSlot();
    buildBoard(baseBoardEl, slot);
    const g = generateGrid(slot, "base");
    for (let r=0; r<slot.rows; r++){
      for (let c=0; c<slot.reels; c++){
        setCell(baseBoardEl, slot, r, c, g[r][c]);
      }
    }
  }

  /* =========================
     Init
  ========================= */
  function initUI(){
    renderBalance();
    fillBetOptions();
    fillSlotOptions();
    renderSlotMeta();
    rebuildBaseBoard();
    renderSoundBtn();
    updateWheelCooldownUI();
    setMid("Bereit", "Tippe SPIN");
  }

  setInterval(() => {
    updateWheelCooldownUI();
    if (!wheelModalOverlay.classList.contains("hidden")) updateWheelModalText();
  }, 1000);

  initUI();
})();
