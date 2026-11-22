// 1~10웨이브 일반 몬스터 HP 배율 (운영값 유지)
const EARLY_HP_MULT=1.2;
// R안 실험: 5웨이브부터 일반 몬스터 HP 추가 25% (보스 제외)
const WAVE5_HP_MULT=1.25;
function normalHp(w){const pts=[[1,100],[10,200],[20,400],[30,700],[40,1100],[50,1600]];for(let i=1;i<pts.length;i++){if(w<=pts[i][0]){const [a,av]=pts[i-1],[b,bv]=pts[i];return Math.round(av+(bv-av)*(w-a)/(b-a))}}return 1600}
function normalDmg(w){const pts=[[1,10],[10,16],[20,25],[30,38],[40,55],[50,75]];for(let i=1;i<pts.length;i++){if(w<=pts[i][0]){const [a,av]=pts[i-1],[b,bv]=pts[i];return Math.round(av+(bv-av)*(w-a)/(b-a))}}return 75}
function normalSpeed(w){return 1+(w-1)*.25/49}
// P안 실험: 5웨이브부터 일반 몬스터 등장 수 +25% (보스는 별도)
function monsterCount(w){const pts=[[1,8],[10,25],[20,40],[30,55],[40,70],[50,85]];for(let i=1;i<pts.length;i++){if(w<=pts[i][0]){const [a,av]=pts[i-1],[b,bv]=pts[i];return Math.round((av+(bv-av)*(w-a)/(b-a))*(w>=5?1.25:1))}}return Math.round(85*1.25)}
function spawnDuration(w){return 30+Math.min(4,Math.floor((w-1)/10))*15+((w-1)%10)/9*15}
function pickType(w){let weights=w<=10?[70,20,10,0]:w<=20?[60,25,10,5]:w<=30?[50,25,15,10]:w<=40?[45,25,20,10]:[40,25,20,15];if(w<=2)weights=[100,0,0,0];if(w<5)weights=[80,20,0,0];let p=state.rng()*100;for(let i=0;i<4;i++){p-=weights[i];if(p<0)return ['normal','fast','tank','elite'][i]}return 'normal'}
function getGhostChance(w){return w<=10?0:w<=20?.2:w<=30?.35:w<=40?.45:.55}
// S안: 웨이브당 벽 파괴 탱커·원거리형 최대 수 (추가 생성 없음)
function wallBreakerLimit(w){return w<5?0:w<=10?1:w<=20?2:w<=30?3:w<=40?4:5}
function rangedLimit(w){return w<31?0:w<=40?4:5}
function limitRangedMonsters(types,w){const max=rangedLimit(w),idx=[];for(let i=0;i<types.length;i++)if(types[i]==='ranged')idx.push(i);while(idx.length>max){const k=Math.floor(state.rng()*idx.length);types[idx.splice(k,1)[0]]='normal'}}
function chooseWallBreakers(types,w){const cap=wallBreakerLimit(w),idx=[],selected=new Set();for(let i=0;i<types.length;i++)if(types[i]==='tank')idx.push(i);while(selected.size<cap&&idx.length){const k=Math.floor(state.rng()*idx.length);selected.add(idx.splice(k,1)[0])}return selected}
function makeSchedule(){const w=state.wave,total=monsterCount(w),duration=spawnDuration(w),types=Array.from({length:total},()=>pickType(w));applyMazeGhosts(types,w);applyNewMonsters(types,w);if(w>=6&&w<=10){const idx=types.findIndex(t=>t==='normal');if(idx>=0)types[idx]='ghost'}else if(state.rng()<getGhostChance(w))types[Math.floor(state.rng()*total)]='ghost';limitRangedMonsters(types,w);const wallBreakers=chooseWallBreakers(types,w);state.spawnQueue=types.map((kind,i)=>({time:spawnTime(i,total,duration,w),kind,wallBreaker:wallBreakers.has(i),spawn:state.active[i%state.active.length]}));if(w%10===0){const boss=BOSSES.find(b=>b.wave===w);state.spawnQueue.push({time:duration*.7,kind:'boss',boss,spawn:state.active[Math.floor(state.rng()*state.active.length)]})}state.spawnQueue.sort((a,b)=>a.time-b.time);state.planned=state.spawnQueue.length;state.spawned=0}
function startBattle(){if(state.phase!=='PREPARATION'||state.paused)return;state.phase='BATTLE';state.battleTime=0;makeSchedule();state.prepLeft=0;note(`웨이브 ${state.wave} 시작! ${state.active.length}방향에서 몬스터 출현`);syncControls();renderPanel()}
// P안 실험: 5웨이브부터 클리어 보상 -20%
function baseReward(w){const base=w<=5?100:w<=10?120:w<=15?150:w<=20?180:w<=25?220:w<=30?250:w<=40?300:350;return w>=5?Math.round(base*.8):base}
function finishWave(){if(state.phase!=='BATTLE')return;state.phase='WAVE_CLEAR';state.gold+=baseReward(state.wave);if(state.waveStat){state.waveStat.rewardGold+=baseReward(state.wave);state.waveStat.battleSec=state.battleTime}note(`WAVE ${state.wave} 완료! 보상 +${baseReward(state.wave)}G`);state.clearTime=1.75;renderPanel();syncControls()}
function enterPrep(){state.newDir=null;recordWaveStat('clear');if(state.wave>=MAX_WAVE){state.phase='VICTORY';syncControls();showGameOver(true);return}state.wave++;if([11,21,31].includes(state.wave)){const remain=[0,1,2,3].filter(n=>!state.active.includes(n));const n=remain[Math.floor(state.dirRng()*remain.length)];state.active.push(n);state.newDir=n;note(`⚠️ 새로운 출현 방향: ${SPAWNS[n].name}`)}state.phase='PREPARATION';beginWaveStat();state.prepLeft=[11,21,31].includes(state.wave)?30:20;state.specialShieldWave=0;state.shield=0;state.shieldTime=0;state.protectTime=0;renderPanel();syncControls()}
function spawnMonster(entry){const sp=SPAWNS[entry.spawn],boss=entry.kind==='boss'?entry.boss:null,type=boss?boss.base:entry.kind,t=TYPES[type],hp=boss?boss.hp:Math.round(normalHp(state.wave)*t.hp*(state.wave<=10?EARLY_HP_MULT:1)*(state.wave>=5?WAVE5_HP_MULT:1)*lateHpMult(state.wave)),dmg=boss?boss.damage:Math.round(normalDmg(state.wave)*t.damage);state.monsters.push({id:++state.monsterId,x:sp.x,y:sp.y,kind:entry.kind,boss,wallBreaker:!!entry.wallBreaker,hp,maxHp:hp,damage:dmg,speed:normalSpeed(state.wave)*t.speed,attackTimer:entry.kind==='ranged'?3:1.5,progress:0,slow:0,slowTime:0,burn:0,burnTime:0,weak:0,weakTime:0,blockTime:0,wallAttackTimer:2,wallTarget:-1,arrived:false,face:0,spawnDirection:entry.spawn});state.spawned++;if(boss)note(`⚠️ 보스 등장: ${boss.label}!`)}

// 웨이브별 통계 기록(밸런스 QA용, 게임 수치에 영향 없음)
function beginWaveStat(){state.waveStat={wave:state.wave,hpStart:state.hp,dmgStart:state.totalDamage,killStart:state.kills,goldStart:state.gold,battleSec:0,hpLoss:0,overkill:0,autoGold:0,killGold:0,rewardGold:0,sellRefund:0,spentHero:0,spentWall:0,spentUpgrade:0,spentHeal:0}}
function recordWaveStat(result){const s=state.waveStat;if(!s)return;if(result==='defeat')s.battleSec=state.battleTime;const income=s.autoGold+s.killGold+s.rewardGold+s.sellRefund,spent=s.spentHero+s.spentWall+s.spentUpgrade+s.spentHeal;state.waveStats.push({wave:s.wave,result,battleSec:Math.round(s.battleSec*10)/10,hpStart:s.hpStart,hpEnd:state.hp,hpLoss:Math.round(s.hpLoss),overkill:Math.round(s.overkill),kills:state.kills-s.killStart,heroes:state.heroes.size,walls:state.walls.size,goldStart:s.goldStart,autoGold:s.autoGold,killGold:s.killGold,rewardGold:s.rewardGold,sellRefund:s.sellRefund,goldIncome:income,spentHero:s.spentHero,spentWall:s.spentWall,spentUpgrade:s.spentUpgrade,spentHeal:s.spentHeal,goldSpent:spent,goldEnd:state.gold,upgrades:[...state.upgrades]});state.waveStat=null}
// 신규 몬스터: 해금 웨이브 이후 일반형 일부를 비율만큼 대체(총 생성 수·보스 규칙 유지)
const NEW_MONSTERS=[['shield',11],['vampire',16],['bomber',21],['shaman',26],['ranged',31]];
function newMonsterShare(w){return w<=10?0:w<=15?.1:w<=20?.15:w<=25?.2:w<=30?.25:w<=40?.3:.35}
function applyNewMonsters(types,w){const pool=NEW_MONSTERS.filter(([k,u])=>w>=u).map(([k])=>k);if(!pool.length)return;const idx=[];types.forEach((t,i)=>{if(t==='normal')idx.push(i)});let n=Math.min(idx.length,Math.round(types.length*newMonsterShare(w)));while(n-->0){const i=idx.splice(Math.floor(state.rng()*idx.length),1)[0];types[i]=pool[Math.floor(state.rng()*pool.length)]}}
// O안 실험: 21~30웨이브 일반형 중 전체 출현 수의 10%, 31~50웨이브 20%를 고스트로 대체
// 신규 몬스터 대체보다 먼저 적용해 비율 확보; 몬스터 총수·보스·기존 단일 고스트 추첨은 유지
function applyMazeGhosts(types,w){const share=w>=31?.2:w>=21?.1:0;if(!share)return;const idx=[];for(let i=0;i<types.length;i++)if(types[i]==='normal')idx.push(i);const n=Math.min(idx.length,Math.round(types.length*share));for(let j=0;j<n;j++){const k=Math.floor(state.rng()*idx.length),i=idx[k];types[i]='ghost';idx.splice(k,1)}}
// 후반 일반 몬스터 HP 배율(보스 제외)
function lateHpMult(w){return w>=31?1.5:w>=21?1.25:1}
// 11웨이브부터 묶음 동시 등장(2·3·4·5마리), 31~50웨이브 일반 몬스터 등장 구간 70% — 보스는 원래 duration 기준
function spawnTime(i,total,duration,w){if(w<=10)return i/(total-1)*duration;const d=w>=31?duration*.7:duration,g=w<=20?2:w<=30?3:w<=40?4:5,G=Math.ceil(total/g);return G>1?Math.floor(i/g)/(G-1)*d:0}
