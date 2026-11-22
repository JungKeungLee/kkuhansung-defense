const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const key=(x,y)=>y*W+x, inside=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
const clamp=(a,b,c)=>Math.max(b,Math.min(c,a));
const rndInt=(r,min,max)=>min+Math.floor(r()*(max-min+1));
function rngFrom(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}};
function distance(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by)}
const state={seed:0,rng:Math.random,castle:null,fixed:new Set(),walls:new Map(),heroes:new Map(),monsters:[],effects:[],pending:[],spawnQueue:[],wave:1,phase:'PREPARATION',prepLeft:30,paused:false,speed:1,gold:500,hp:2000,shield:0,shieldTime:0,protectTime:0,heroSelection:null,pendingDraw:null,tool:'wall',tab:'champions',upgrades:[1,1,1,1,1],healCount:0,active:[],startingDirection:0,monsterId:0,spawned:0,planned:0,kills:0,totalDamage:0,totalSpent:0,gameTime:0,autoGoldTime:0,specialShieldWave:0,layoutVersion:0,distNormal:null,distGhost:null,message:'',messageTime:0,showPath:true,hover:null,wallBuilds:0,waveStats:[],waveStat:null};
function isCastle(x,y){const c=state.castle;return x>=c.x&&x<c.x+2&&y>=c.y&&y<c.y+2}
function isWall(x,y){const k=key(x,y);return state.fixed.has(k)||state.walls.has(k)||state.pending.some(p=>p.kind==='wall'&&p.x===x&&p.y===y)}
function castleTargets(){const c=state.castle;return [[c.x,c.y-1],[c.x+1,c.y-1],[c.x,c.y+2],[c.x+1,c.y+2],[c.x-1,c.y],[c.x-1,c.y+1],[c.x+2,c.y],[c.x+2,c.y+1]].filter(([x,y])=>inside(x,y))}
