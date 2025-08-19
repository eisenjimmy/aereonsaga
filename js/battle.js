
initStorage();

const ATTRS = ["str","dex","int","arcane"];
const ATTR_LABEL = {str:"STR", dex:"DEX", int:"INT", arcane:"ARC", luck:"LCK"};

let ENEMY = null;
let TEAM = [];
let teamHP = 100;
let enemyHP = 100;
let AUTO = false;

Promise.all([
  loadJSON('./data/cards.json'),
  loadJSON('./data/stage.json')
]).then(([cards, stages]) => {
  DATA.cards = cards;
  DATA.stages = stages;

  const sid = parseInt(localStorage.getItem('selectedStage') || '1', 10);
  const st = stages.find(s => s.id === sid) || stages[0];
  const enemy = cards.find(c => c.key === st.enemyKey || c.name === st.enemyKey) || cards[0];
  ENEMY = enemy;

  // render enemy
  document.getElementById('eName').textContent = `${enemy.name} • ${enemy.rarity} • ${enemy.category}`;
  document.getElementById('eImg').src = ddSplash(enemy.key);
  document.getElementById('eImg').onerror = (e)=>{ e.target.src = './assets/placeholder.svg'; };
  document.getElementById('eHP').textContent = enemyHP;
  document.getElementById('eStats').innerHTML = `
    <div>STR<br><span class="font-mono">${enemy.stats.str}</span></div>
    <div>DEX<br><span class="font-mono">${enemy.stats.dex}</span></div>
    <div>INT<br><span class="font-mono">${enemy.stats.int}</span></div>
    <div>ARC<br><span class="font-mono">${enemy.stats.arcane}</span></div>
    <div>LCK<br><span class="font-mono">${enemy.stats.luck}</span></div>
  `;

  // team list from owned
  const owned = getOwned();
  const list = document.getElementById('teamList');
  Object.values(owned).sort((a,b)=>a.name.localeCompare(b.name)).forEach(c => {
    const item = document.createElement('label');
    item.className = 'flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2';
    item.innerHTML = `
      <input type="checkbox" class="accent-emerald-500">
      <img src="${ddSplash(c.key)}" onerror="this.src='./assets/placeholder.svg'" class="w-12 h-12 object-cover rounded">
      <div class="flex-1">
        <div class="text-sm font-semibold">${c.name} <span class="text-[11px] opacity-75">x${c.count}</span></div>
        <div class="text-xs text-slate-400">${c.rarity} • ${c.category}</div>
      </div>
    `;
    const cb = item.querySelector('input');
    cb.addEventListener('change', () => {
      const checked = list.querySelectorAll('input:checked').length;
      if (checked > 5) { cb.checked = false; alert('Max 5 team members.'); }
    });
    list.appendChild(item);
    // attach card data
    item.dataset.key = c.key;
  });

  document.getElementById('auto').addEventListener('change', (e)=>{ AUTO = e.target.checked; });
  document.getElementById('start').addEventListener('click', startBattle);
});

function startBattle() {
  // collect TEAM from checked boxes
  const list = document.getElementById('teamList');
  const checked = Array.from(list.querySelectorAll('input:checked')).map(cb => cb.closest('label'));
  if (checked.length === 0) { alert('Select at least one team member.'); return; }
  TEAM = checked.map(el => {
    const key = el.dataset.key;
    // take base info from owned map stored in localStorage
    const owned = getOwned();
    return owned[key];
  });

  // reset HP & log
  teamHP = 100; enemyHP = 100;
  document.getElementById('tHP').textContent = teamHP;
  document.getElementById('eHP').textContent = enemyHP;
  const log = document.getElementById('log');
  log.textContent = 'Battle start!\\n';

  if (AUTO) {
    runAutoRounds();
  } else {
    runRound(); // run one round per click
  }
}

function teamTotals() {
  // base totals
  const base = {str:0,dex:0,int:0,arcane:0,luck:0};
  TEAM.forEach(c => {
    base.str += c.stats?.str || 0;
    base.dex += c.stats?.dex || 0;
    base.int += c.stats?.int || 0;
    base.arcane += c.stats?.arcane || 0;
    base.luck += c.stats?.luck || 0;
  });
  // apply effects (simple parse)
  TEAM.forEach(c => {
    const eff = c.effect || '';
    const inc = /Increases\\s+(Strength|Dexterity|Intelligence|Arcane|Luck)\\s+of\\s+all\\s+([A-Za-z]+)\\s+allies\\s+by\\s+(\\d+)/i.exec(eff);
    const dec = /Reduces\\s+(Strength|Dexterity|Intelligence|Arcane|Luck)\\s+of\\s+all\\s+([A-Za-z]+)\\s+allies\\s+by\\s+(\\d+)/i.exec(eff);
    let alliesInCategory = TEAM.filter(x => (x.category||'').toLowerCase() === ((inc?.[2]||dec?.[2]||'').toLowerCase())).length;
    if (inc) {
      const map = {Strength:'str',Dexterity:'dex',Intelligence:'int',Arcane:'arcane',Luck:'luck'};
      base[map[inc[1]]] += alliesInCategory * parseInt(inc[3],10);
    } else if (dec) {
      const map = {Strength:'str',Dexterity:'dex',Intelligence:'int',Arcane:'arcane',Luck:'luck'};
      base[map[dec[1]]] -= alliesInCategory * parseInt(dec[3],10);
    }
  });
  return base;
}

function enemyTotals() {
  // Enemy is single card; effect self-buffs own category
  const e = ENEMY;
  const base = {...e.stats};
  const eff = e.effect || '';
  const inc = /Increases\\s+(Strength|Dexterity|Intelligence|Arcane|Luck)\\s+of\\s+all\\s+([A-Za-z]+)\\s+allies\\s+by\\s+(\\d+)/i.exec(eff);
  const dec = /Reduces\\s+(Strength|Dexterity|Intelligence|Arcane|Luck)\\s+of\\s+all\\s+([A-Za-z]+)\\s+allies\\s+by\\s+(\\d+)/i.exec(eff);
  if (inc && e.category.toLowerCase() === inc[2].toLowerCase()) {
    const map = {Strength:'str',Dexterity:'dex',Intelligence:'int',Arcane:'arcane',Luck:'luck'};
    base[map[inc[1]]] += parseInt(inc[3],10);
  } else if (dec && e.category.toLowerCase() === dec[2].toLowerCase()) {
    const map = {Strength:'str',Dexterity:'dex',Intelligence:'int',Arcane:'arcane',Luck:'luck'};
    base[map[dec[1]]] -= parseInt(dec[3],10);
  }
  return base;
}

function runRound() {
  if (teamHP <= 0 || enemyHP <= 0) return;
  const log = document.getElementById('log');
  const t = teamTotals();
  const e = enemyTotals();
  const attr = ATTRS[Math.floor(Math.random()*ATTRS.length)];
  const tVal = t[attr];
  const eVal = e[attr];
  let line = `• ${ATTR_LABEL[attr]} | Team ${tVal} vs Enemy ${eVal}. `;

  if (tVal === eVal) {
    // tie -> luck tiebreaker
    if (t.luck > e.luck) {
      enemyHP -= 20;
      line += `Tie! Team wins by Luck. Enemy -20 HP.`;
    } else if (e.luck > t.luck) {
      teamHP -= 20;
      line += `Tie! Enemy wins by Luck. Team -20 HP.`;
    } else {
      line += `Perfect tie. No damage.`;
    }
  } else if (tVal > eVal) {
    // team hits
    let dmg = 20;
    const luckDelta = t.luck - e.luck;
    if (luckDelta > Math.floor(Math.random()*100)) {
      dmg *= 2; line += `Team CRITICAL! `;
    }
    enemyHP -= dmg;
    line += `Enemy -${dmg} HP.`;
  } else {
    // enemy hits
    let dmg = 20;
    const luckDelta = e.luck - t.luck;
    if (luckDelta > Math.floor(Math.random()*100)) {
      dmg *= 2; line += `Enemy CRITICAL! `;
    }
    teamHP -= dmg;
    line += `Team -${dmg} HP.`;
  }

  teamHP = Math.max(0, teamHP);
  enemyHP = Math.max(0, enemyHP);
  document.getElementById('tHP').textContent = teamHP;
  document.getElementById('eHP').textContent = enemyHP;
  log.textContent += line + "\\n";
  log.scrollTop = log.scrollHeight;

  if (teamHP <= 0) {
    log.textContent += "You Lose!\\n";
  } else if (enemyHP <= 0) {
    log.textContent += "You Win!\\n";
    // reward credits (find stage)
    const sid = parseInt(localStorage.getItem('selectedStage') || '1', 10);
    const st = DATA.stages.find(s => s.id === sid) || DATA.stages[0];
    setCredits(getCredits() + (st?.rewardCredits || 0));
    log.textContent += `Reward: +${st?.rewardCredits || 0} credits added.\\n`;
  } else if (!AUTO) {
    // do nothing; wait for user to click start again
  }
}

async function runAutoRounds() {
  while (teamHP > 0 && enemyHP > 0) {
    runRound();
    await new Promise(r => setTimeout(r, 900));
  }
}
