
initStorage();

const grid = document.getElementById('grid');
const owned = getOwned();
const keys = Object.keys(owned);
document.getElementById('ownedCount').textContent = keys.length;

function cardTile(entry) {
  const c = entry;
  const div = document.createElement('div');
  div.className = `card border ${rarityColor(c.rarity)} bg-black/40 cursor-pointer`;
  div.innerHTML = `
    <div class="relative">
      <img src="${ddSplash(c.key)}" onerror="this.src='./assets/placeholder.svg'" alt="${c.name}" class="w-full h-36 object-cover">
      <span class="absolute top-2 left-2 rarity-badge ${rarityBadge(c.rarity)}">${c.rarity}</span>
      <span class="absolute top-2 right-2 bg-black/60 text-xs rounded px-2 py-1">x${c.count}</span>
    </div>
    <div class="p-2">
      <div class="font-semibold">${c.name}</div>
      <div class="text-xs text-slate-300">${c.category}</div>
    </div>
  `;
  div.addEventListener('click', () => openModal(c));
  return div;
}

keys.sort().forEach(k => grid.appendChild(cardTile(owned[k])));

// Modal
const modal = document.getElementById('modal');
document.getElementById('mClose').addEventListener('click', () => modal.classList.add('hidden'));

function openModal(c) {
  document.getElementById('mImg').src = ddSplash(c.key);
  document.getElementById('mImg').onerror = (e)=>{ e.target.src = './assets/placeholder.svg'; };
  document.getElementById('mName').textContent = `${c.name}`;
  document.getElementById('mMeta').textContent = `${c.rarity} • ${c.category}`;
  const s = c.stats || {str:0,dex:0,int:0,arcane:0,luck:0};
  document.getElementById('mStats').innerHTML = `
    <div>STR<br><span class="font-mono">${s.str}</span></div>
    <div>DEX<br><span class="font-mono">${s.dex}</span></div>
    <div>INT<br><span class="font-mono">${s.int}</span></div>
    <div>ARC<br><span class="font-mono">${s.arcane}</span></div>
    <div>LCK<br><span class="font-mono">${s.luck}</span></div>
  `;
  document.getElementById('mEffect').textContent = c.effect || '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
