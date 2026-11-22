function spend(n,cat){if(state.gold<n){note(`골드가 부족합니다. ${Math.ceil(n).toLocaleString()}G 필요`);return false}state.gold-=n;state.totalSpent+=n;statAdd(cat,n);return true}
function statAdd(f,n){if(state.waveStat&&f)state.waveStat[f]+=n}
function heroCount(id){return [...state.heroes.values()].filter(h=>h.id===id).length+state.pending.filter(p=>p.kind==='hero'&&p.hero.id===id).length}
function nextUpgrade(i){const level=state.upgrades[i];return level>=10?null:UPGRADES[i].cost[level-1]}
function upgrade(i){if(state.phase!=='PREPARATION'||state.paused){note('공통 강화는 준비 단계에서만 가능합니다.');return}const cost=nextUpgrade(i);if(cost==null)return;if(!spend(cost,'spentUpgrade'))return;state.upgrades[i]++;note(`${UPGRADES[i].name} Lv.${state.upgrades[i]} 강화 완료`);renderPanel()}
