
const DATA = {
  cards: null,
  stages: null
};

function ddSplash(key) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${key}_0.jpg`;
}

function loadJSON(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${url}`);
    return r.json();
  });
}

function initStorage() {
  if (!localStorage.getItem('credits')) {
    localStorage.setItem('credits', '100');
  }
  if (!localStorage.getItem('owned')) {
    localStorage.setItem('owned', JSON.stringify({}));
  }
}

function getCredits() { return parseInt(localStorage.getItem('credits') || '0', 10); }
function setCredits(v) { localStorage.setItem('credits', String(v)); }

function getOwned() { try { return JSON.parse(localStorage.getItem('owned') || '{}'); } catch { return {}; } }
function setOwned(obj) { localStorage.setItem('owned', JSON.stringify(obj)); }

function addOwned(card) {
  const owned = getOwned();
  const key = card.key;
  if (!owned[key]) {
    owned[key] = { count: 0, ...card };
  }
  owned[key].count += 1;
  setOwned(owned);
}

function rarityColor(r) {
  return ({
    "Common": "border-slate-400",
    "Rare": "border-blue-500",
    "Epic": "border-violet-500",
    "Legendary": "border-amber-400"
  })[r] || "border-slate-500";
}

function rarityBadge(r) {
  return ({
    "Common": "bg-slate-700",
    "Rare": "bg-blue-700",
    "Epic": "bg-violet-700",
    "Legendary": "bg-amber-600 text-black"
  })[r] || "bg-slate-700";
}
