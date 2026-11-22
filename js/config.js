// 꾸한성 길막 디펜스 — 의존성 없는 PC 브라우저 게임
const W=32,H=20,S=40,MAX_WAVE=50;
const SPAWNS=[{x:15,y:0,name:'위 ↑'},{x:31,y:9,name:'오른쪽 →'},{x:15,y:19,name:'아래 ↓'},{x:0,y:9,name:'왼쪽 ←'}];
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const TYPES={normal:{label:'일반',color:'#83c975',hp:1,damage:1,speed:1,bounty:10},fast:{label:'빠른',color:'#f39d65',hp:.65,damage:.75,speed:1.5,bounty:12},tank:{label:'탱커',color:'#a5bac9',hp:2.5,damage:1,speed:.65,bounty:20},elite:{label:'강화',color:'#d75f78',hp:1.6,damage:1.5,speed:.9,bounty:25},ghost:{label:'고스트',color:'#77d5f7',hp:.5,damage:.5,speed:2,bounty:8},shield:{label:'방패병',color:'#7f9cc9',hp:1.8,damage:1,speed:.8,bounty:10,dmgTaken:.75},vampire:{label:'흡혈형',color:'#a05fc9',hp:.8,damage:1,speed:1.3,bounty:10},bomber:{label:'폭탄병',color:'#d0703c',hp:.7,damage:3,speed:1.15,bounty:10},shaman:{label:'주술사',color:'#8a62d6',hp:.9,damage:1,speed:.85,bounty:10,dmgTaken:.9},ranged:{label:'원거리형',color:'#6fa45a',hp:.65,damage:.5,speed:.9,bounty:10}};
const BOSSES=[{wave:10,hp:2500,damage:60,bounty:150,resist:.15,label:'강화 대장',base:'normal'},{wave:20,hp:5000,damage:100,bounty:200,resist:.20,label:'거대 골렘',base:'tank'},{wave:30,hp:8500,damage:130,bounty:250,resist:0,label:'질풍 군주',base:'fast'},{wave:40,hp:13000,damage:160,bounty:300,resist:0,label:'철갑 파괴왕',base:'elite'},{wave:50,hp:20000,damage:180,bounty:500,resist:0,label:'심연의 군주',base:'elite'}];
const HEROES=[
{id:'kkuti',name:'꾸티뉴',icon:'👑',role:'지휘·피해 감소',cost:200,atk:12,interval:1.2,range:3,cd:30},
{id:'yappu',name:'야뿌',icon:'⚔️',role:'연속 공격',cost:170,atk:11,interval:.65,range:1.2,cd:15},
{id:'haru',name:'하루노츠키',icon:'❄️',role:'광역 둔화',cost:180,atk:9,interval:1.4,range:3.2,cd:18},
{id:'manjo',name:'만조',icon:'🎯',role:'장거리 저격',cost:210,atk:27.5,interval:2,range:5.5,cd:16},
{id:'moya',name:'모야',icon:'✨',role:'약화 지원',cost:200,atk:6,interval:1.6,range:3,cd:25},
{id:'yuntami',name:'윤타미',icon:'⚡',role:'연쇄 번개',cost:190,atk:15,interval:1.3,range:3.5,cd:17},
{id:'yamuji',name:'야무지',icon:'🛡️',role:'꾸한성 보호',cost:190,atk:9,interval:1.5,range:1.7,cd:45},
{id:'nanwoni',name:'난워니',icon:'🔥',role:'화상 공격',cost:180,atk:10,interval:1.25,range:3.4,cd:18},
{id:'okdok',name:'김옥독',icon:'🔨',role:'광역 타격',cost:210,atk:17,interval:1.7,range:1.6,cd:20},
{id:'damyu',name:'다뮤_',icon:'🎵',role:'공격 지원',cost:170,atk:7,interval:1.4,range:3,cd:22}
];
const UPGRADES=[
{name:'⚔️ 공격력',values:[0,8,15,23,30,40,50,63,75,90],cost:[150,250,400,600,850,1150,1500,1950,2500],unit:'%'},
{name:'⚡ 공격속도',values:[0,7,13,20,27,33,40,47,53,60],cost:[200,300,500,750,1000,1300,1700,2150,2750],unit:'%'},
{name:'🎯 사거리',values:[0,.25,.5,.75,1,1.2,1.4,1.6,1.8,2],cost:[250,400,600,900,1100,1450,1850,2300,2900],unit:'칸'},
{name:'✨ 스킬효과',values:[0,10,20,30,40,50,60,75,85,100],cost:[200,300,500,750,900,1200,1600,2050,2650],unit:'%'},
{name:'💰 골드 획득',values:[0,1,2,3,5,6,7,9,10,12],cost:[200,350,550,800,1000,1300,1700,2200,2800],unit:'G/초'}];
