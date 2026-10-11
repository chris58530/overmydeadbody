import {sampleCampaign,parseCampaign,ABILITIES,CONDITIONS} from './model.js';
import {GameEngine} from './engine.js';
import {drawRoom} from './draw.js';
const $=id=>document.getElementById(id),canvas=$('game-canvas');
let campaign=sampleCampaign();
let engine,started=false,paused=true,keys=new Set(),jumpQueued=false,last=0,accumulator=0;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function makeEngine(){engine=new GameEngine(campaign);accumulator=0;keys.clear();jumpQueued=false;updateUI();}
makeEngine();
function updateUI(){
 $('campaign-title').textContent=campaign.name;$('game-location').textContent=engine.map.name+' ／ '+engine.room.name;
 $('deaths').textContent=String(engine.deaths).padStart(2,'0');const seconds=Math.floor(engine.elapsed);$('elapsed').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 const ability=ABILITIES[engine.ability];$('ability-name').textContent=ability.name;$('ability-description').textContent=ability.description;$('ability-icon').textContent=engine.ability==='wrestler'?'↗':'➜';$('ability-icon').style.color=ability.color;
 $('card-state').textContent=engine.mode==='lift'?'選擇投擲方向 · A / D':engine.mode==='charge'?'正在衝撞':engine.rolling?'能力輪播中':engine.ready?'已鎖定 · 可以發動':'能力待抽選';
 $('cycle-button').textContent=engine.rolling?'E 鎖定這張':'E 開始輪播';$('cycle-button').disabled=paused||engine.completed||engine.mode!=='normal';$('use-button').disabled=paused||!engine.ready||engine.rolling||engine.mode!=='normal';
 $('objective').textContent=CONDITIONS[engine.room.clearCondition];$('objective-progress').textContent=engine.room.clearCondition==='collect'?engine.collected+' / '+engine.totalCollect+' 星光':engine.room.clearCondition==='break'?engine.broken+' / '+engine.totalBreak+' 障礙':'找到綠色出口';
 $('game-notice').textContent=engine.noticeTime>0?engine.notice:engine.mode==='lift'?'A / D 選方向 · 即將斜拋':'';
}
function overlay(title,description,button){const content=$('overlay').querySelector('.overlay-content');content.replaceChildren();const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.textContent='DRUNKEN SOUL / ROOM JOURNEY';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=description;const b=document.createElement('button');b.className='primary';b.textContent=button;b.onclick=()=>{if(engine.completed){makeEngine(false);}resume();};content.append(eyebrow,h,p,b);$('overlay').classList.remove('hidden');}
function resume(){started=true;paused=false;keys.clear();jumpQueued=false;accumulator=0;$('overlay').classList.add('hidden');$('pause').textContent='暫停';canvas.focus();updateUI();}
function togglePause(){if(!started){resume();return;}if(engine.completed)return;paused=!paused;keys.clear();jumpQueued=false;if(paused){overlay('先歇一口氣。','準備好了，就繼續這個夜晚。','繼續旅程 →');$('pause').textContent='繼續';}else resume();updateUI();}
$('start-game').onclick=resume;$('pause').onclick=togglePause;$('restart').onclick=()=>{makeEngine();resume();};
$('cycle-button').onclick=()=>{engine.cycle();updateUI();canvas.focus();};$('use-button').onclick=()=>{engine.activate();updateUI();canvas.focus();};
document.addEventListener('keydown',event=>{if(event.target.matches('input,select,textarea'))return;const key=event.key.toLowerCase();if([' ','arrowup','arrowleft','arrowright','w','a','d','e','k','r','escape'].includes(key))event.preventDefault();if(key==='escape'&&!event.repeat){togglePause();return;}if(paused||engine.completed)return;keys.add(key);if(event.repeat)return;if(key===' '||key==='w'||key==='arrowup')jumpQueued=true;if(key==='e')engine.cycle();if(key==='k')engine.activate();if(key==='r')engine.retry();updateUI();});
document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();jumpQueued=false;if(started&&!paused&&!engine.completed)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&!engine.completed)togglePause();});
for(const button of document.querySelectorAll('[data-control]')){const key={left:'a',right:'d',jump:' '}[button.dataset.control];button.onpointerdown=e=>{e.preventDefault();if(paused)return;button.setPointerCapture(e.pointerId);keys.add(key);if(key===' ')jumpQueued=true;};button.onpointerup=button.onpointercancel=()=>keys.delete(key);}
$('game-import').onclick=()=>$('game-file').click();$('game-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('JSON 超過 5 MB');const data=parseCampaign(await file.text());campaign=data;makeEngine();started=true;paused=true;overlay('關卡已載入。',campaign.name+' · '+campaign.maps.length+' 張地圖','開始旅程 →');updateUI();}catch(error){toast(error.message);}event.target.value='';};
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!paused&&!engine.completed){accumulator+=dt;while(accumulator>=1/120){engine.step(1/120,{move:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),jump:jumpQueued,jumpHeld:keys.has(' ')||keys.has('w')||keys.has('arrowup')});jumpQueued=false;accumulator-=1/120;if(engine.completed){paused=true;overlay('這個夜晚，過關了。','重試 '+engine.deaths+' 次 · 用時 '+Math.floor(engine.elapsed)+' 秒','再走一次 →');break;}}}drawRoom(canvas,engine.room,{player:engine.player,engine,time:now/1000});updateUI();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
