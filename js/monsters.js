function isNearCastle(x,y){return castleTargets().some(([tx,ty])=>tx===x&&ty===y)}
function monsterStep(m,dt){if(m.hp<=0)return;if(m.slowTime>0)m.slowTime-=dt;else m.slow=0;if(m.weakTime>0)m.weakTime-=dt;else m.weak=0;if(m.burnTime>0&&m.burn>0){const tick=Math.min(dt,m.burnTime);m.burnTime-=dt;damageMonster(m,m.burn*tick);if(m.hp<=0)return}if(m.kind==='ranged'&&castleDist(m.x,m.y)<=4){m.arrived=true;m.attackTimer-=dt;if(m.attackTimer<=0){damageCastle(m.damage);m.attackTimer+=3}return}if(isNearCastle(m.x,m.y)){m.arrived=true;if(m.kind==='bomber'){damageCastle(m.damage);state.effects.push({x:m.x+.5,y:m.y+.5,time:.4,r:1.5,color:'#ff9f43'});m.hp=0;m.exploded=true;return}m.attackTimer-=dt;if(m.attackTimer<=0){let dmg=m.damage;if(m.boss?.wave===50&&m.hp<m.maxHp*.5)dmg*=1.2;if(m.boss?.wave===40)dmg*=1.2;damageCastle(dmg);if(m.kind==='vampire'&&m.hp>0)m.hp=Math.min(m.maxHp,m.hp+m.maxHp*.15);m.attackTimer+=1.5}return}m.arrived=false;if(m.kind==='tank'&&tankAttackWall(m,dt))return;const dist=m.kind==='ghost'?state.distGhost:state.distNormal;const current=dist[key(m.x,m.y)];if(current<0){m.blockTime+=dt;return}m.blockTime=0;let rate=m.speed*(1-clamp(m.slow,0,.6));if(shamanAura(m))rate*=1.15;if(m.boss?.wave===30&&m.hp<m.maxHp*.5)rate*=1.3;if(m.boss?.wave===50&&m.hp<m.maxHp*.5)rate*=1.2;m.progress+=dt*rate;let steps=0;while(m.progress>=1&&steps++<5){let best=null,bestD=9999;for(const [dx,dy] of DIRS){const nx=m.x+dx,ny=m.y+dy;if(!inside(nx,ny)||isCastle(nx,ny))continue;const nk=key(nx,ny);if(m.kind!=='ghost'&&isWall(nx,ny))continue;const d=dist[nk];if(d>=0&&d<bestD){best=[nx,ny];bestD=d}}if(!best||bestD>=dist[key(m.x,m.y)]){m.progress=0;break}m.x=best[0];m.y=best[1];m.progress-=1;if(isNearCastle(m.x,m.y)){m.progress=0;break}}}

const WALL_MAX_HP=100,WALL_RUBBLE_TIME=12,TANK_WALL_DAMAGE=30,TANK_WALL_INTERVAL=2;
// 탱커는 기본 랜덤 벽이 아닌 플레이어 벽만 공격. 미로 우회보다 지름길이 충분히 짧은 경우에만 철거 시도.
function tankAttackWall(m,dt){
 const here=key(m.x,m.y),normal=state.distNormal,ghost=state.distGhost;
 if(!normal||!ghost||normal[here]<0)return false;
 let target=-1,best=Infinity;
 for(const [dx,dy] of DIRS){
  const nx=m.x+dx,ny=m.y+dy;if(!inside(nx,ny))continue;
  const k=key(nx,ny),wall=state.walls.get(k);
  if(!wall||state.pending.some(p=>p.kind==='sell'&&p.x===nx&&p.y===ny))continue;
  // 물리적으로 인접한 벽을 뚫으면 최소 6칸 이상의 우회가 단축될 가능성이 있을 때만 공격
  if(ghost[k]<0||ghost[k]+6>=normal[here]||ghost[k]>=ghost[here])continue;
  if(ghost[k]<best){best=ghost[k];target=k}
 }
 if(target<0){m.wallTarget=-1;m.wallAttackTimer=TANK_WALL_INTERVAL;return false}
 if(m.wallTarget!==target){m.wallTarget=target;m.wallAttackTimer=TANK_WALL_INTERVAL}
 m.wallAttackTimer-=dt;
 if(m.wallAttackTimer<=0){
  m.wallAttackTimer+=TANK_WALL_INTERVAL;
  const wall=state.walls.get(target);
  if(wall){
   wall.hp=(wall.hp??WALL_MAX_HP)-TANK_WALL_DAMAGE;
   const x=target%W,y=Math.floor(target/W);
   state.effects.push({x:x+.5,y:y+.5,time:.25,r:.5,color:'#ff945b'});
   if(wall.hp<=0){
    state.walls.delete(target);
    state.wallRuins.set(target,WALL_RUBBLE_TIME);
    refreshPaths();
    m.wallTarget=-1;
    note('💥 탱커가 성벽을 파괴했습니다! 12초 뒤 재건설할 수 있습니다.');
   }
  }
 }
 return true
}

function damageCastle(d){if(state.phase!=='BATTLE')return;const yamuji=[...state.heroes.values()].some(h=>h.id==='yamuji');let reduction=yamuji?.08:0;if(state.protectTime>0)reduction=1-(1-reduction)*(1-.2*(1+UPGRADES[3].values[state.upgrades[3]-1]/100));reduction=Math.min(.6,reduction);let value=d*(1-reduction);if(state.shield>0){const absorbed=Math.min(value,state.shield);state.shield-=absorbed;value-=absorbed}if(state.waveStat){const real=Math.min(state.hp,value);state.waveStat.hpLoss+=real;state.waveStat.overkill+=value-real}state.hp=Math.max(0,state.hp-value);state.totalDamage+=value;if(state.hp<=0){recordWaveStat('defeat');state.phase='DEFEAT';showGameOver(false);syncControls();return}if(yamuji&&state.hp<=1000&&state.specialShieldWave!==state.wave){state.specialShieldWave=state.wave;state.shield=300*(1+UPGRADES[3].values[state.upgrades[3]-1]/100);state.shieldTime=12;note(`야무지: 꾸한성 보호막 +${Math.round(state.shield)}`)}if(state.hp<=600&&Math.random()<.015)note('🚨 꾸한성 HP 위험! 회복 상점에서 골드로 회복하세요.')}
function damageMonster(m,amount){if(m.hp<=0)return;let d=amount*(1+Math.max(0,m.weak));if(m.boss)d*=1-m.boss.resist;else if(TYPES[m.kind].dmgTaken)d*=TYPES[m.kind].dmgTaken;m.hp-=d;if(m.hp<=0){const bounty=m.boss?m.boss.bounty:Math.max(1,Math.round(TYPES[m.kind].bounty*(state.wave>=5?.7:1)));state.gold+=bounty;{const ex=farKillBonus(m,bounty);if(ex>0){state.gold+=ex;if(state.waveStat)state.waveStat.killGold+=ex}}if(state.waveStat)state.waveStat.killGold+=bounty;state.kills++;state.effects.push({x:m.x+.5,y:m.y+.5,text:`+${bounty}G`,time:.8,color:'#f6ce65'})}}

// 신규 몬스터 보조: 꾸한성(2×2)까지 최소 거리, 주술사 오라(3칸·중첩 없음·사망 즉시 해제)
function castleDist(x,y){const c=state.castle,dx=Math.max(c.x-(x+.5),0,(x+.5)-(c.x+2)),dy=Math.max(c.y-(y+.5),0,(y+.5)-(c.y+2));return Math.hypot(dx,dy)}
// 같은 프레임(battleTime·몬스터 수 동일) 동안 주술사 목록 재사용, 생존·위치는 매번 실시간 확인
let shamanCache={t:-1,n:-1,list:[]};
function shamanAura(m){if(shamanCache.t!==state.battleTime||shamanCache.n!==state.monsters.length)shamanCache={t:state.battleTime,n:state.monsters.length,list:state.monsters.filter(o=>o.kind==='shaman')};for(const o of shamanCache.list)if(o!==m&&o.hp>0&&distance(o.x,o.y,m.x,m.y)<=3)return true;return false}
// 원거리 처치 보너스: 처치 칸에서 꾸한성까지 경로 거리 기준, 최대 +25%
function farKillBonus(m,bounty){const d=state.distNormal?state.distNormal[key(m.x,m.y)]:0;return Math.round(bounty*.25*Math.max(0,Math.min(1,(d-3)/27)))}
