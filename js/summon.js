
initStorage();

Promise.all([
  loadJSON('./data/cards.json')
]).then(([cards]) => {
  DATA.cards = cards;
  document.getElementById('credits').textContent = getCredits();

  document.getElementById('single').addEventListener('click', () => doSummon(1));
  document.getElementById('multi').addEventListener('click', () => doSummon(10));
  document.getElementById('give100').addEventListener('click', () => {
    setCredits(getCredits() + 100);
    document.getElementById('credits').textContent = getCredits();
  });
});

function doSummon(times) {
  const cost = times === 1 ? 5 : 50;
  let credits = getCredits();
  if (credits < cost) {
    alert('Not enough credits.');
    return;
  }
  credits -= cost;
  setCredits(credits);
  document.getElementById('credits').textContent = credits;

  const res = document.getElementById('results');
  const frag = document.createDocumentFragment();

  for (let i=0; i<times; i++) {
    // Choose a card weighted by rarity (approximate: pick random then filter to that rarity)
    const rarityRoll = Math.random();
    let rarity = rarityRoll < 0.60 ? 'Common' : rarityRoll < 0.85 ? 'Rare' : rarityRoll < 0.95 ? 'Epic' : 'Legendary';
    const pool = DATA.cards.filter(c => c.rarity === rarity);
    const pick = pool.length ? pool[Math.floor(Math.random()*pool.length)] : DATA.cards[Math.floor(Math.random()*DATA.cards.length)];
    addOwned(pick);

    const div = document.createElement('div');
    div.className = `card border ${rarityColor(pick.rarity)} bg-black/40`;
    div.innerHTML = `
      <div class="relative">
        <img src="${ddSplash(pick.key)}" onerror="this.src='./assets/placeholder.svg'" alt="${pick.name}" class="w-full h-40 object-cover">
        <span class="absolute top-2 left-2 rarity-badge ${rarityBadge(pick.rarity)}">${pick.rarity}</span>
      </div>
      <div class="p-2">
        <div class="font-semibold">${pick.name}</div>
        <div class="text-xs text-slate-300">${pick.category}</div>
      </div>
    `;
    frag.appendChild(div);
  }

  res.prepend(frag);
}
