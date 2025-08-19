
initStorage();

Promise.all([
  loadJSON('./data/stage.json'),
  loadJSON('./data/cards.json')
]).then(([stages, cards]) => {
  DATA.stages = stages;
  DATA.cards = cards;
  const wrap = document.getElementById('stages');
  stages.forEach(st => {
    const enemy = cards.find(c => c.key === st.enemyKey || c.name === st.enemyKey) || cards[Math.floor(Math.random()*cards.length)];
    const el = document.createElement('div');
    el.className = 'card bg-black/40 border border-white/10 overflow-hidden';
    el.innerHTML = `
      <div class="relative">
        <img src="${ddSplash(enemy.key)}" onerror="this.src='./assets/placeholder.svg'" class="w-full h-36 object-cover" alt="${enemy.name}">
        <span class="absolute top-2 left-2 bg-black/60 text-xs rounded px-2 py-1">${st.name}</span>
      </div>
      <div class="p-3 text-sm flex items-center justify-between">
        <div>
          <div class="font-semibold">${enemy.name}</div>
          <div class="text-slate-400 text-xs">Reward: ${st.rewardCredits} credits</div>
        </div>
        <button data-id="${st.id}" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Fight</button>
      </div>
    `;
    el.querySelector('button').addEventListener('click', () => {
      localStorage.setItem('selectedStage', String(st.id));
      location.href = './battle.html';
    });
    wrap.appendChild(el);
  });
});
