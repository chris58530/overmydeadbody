import {clone,WIDTH,HEIGHT,tileAt,ABILITIES} from './model.js';
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export class GameEngine {
 constructor(campaign,{mapId,roomId,onEvent=()=>{}}={}){this.campaign=clone(campaign);this.onEvent=onEvent;this.deaths=0;this.elapsed=0;this.completed=false;this.map=this.campaign.maps.find(m=>m.id===(mapId||campaign.startMap));this.enterRoom(roomId||this.map.startRoom);}
 enterRoom(id){this.room=clone(this.map.rooms.find(r=>r.id===id));if(!this.room)throw Error('找不到房間');this.player={x:this.room.spawn.x+.2,y:this.room.spawn.y+.05,w:.6,h:.9,vx:0,vy:0,facing:1};this.mode='normal';this.timer=0;this.rolling=false;this.ready=false;this.cardIndex=0;this.ability=this.map.abilityPool[0];this.rollTime=0;this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.collected=0;this.broken=0;this.totalCollect=this.room.tiles.join('').split('*').length-1;this.totalBreak=this.room.tiles.join('').split('B').length-1;this.particles=[];this.notice='';this.noticeTime=0;this.onEvent('room',this);}
 retry(){this.deaths++;this.enterRoom(this.room.id);this.onEvent('death',this);}
 cycle(){if(this.completed||this.mode!=='normal')return;if(this.rolling){this.rolling=false;this.ready=true;this.onEvent('lock',this);}else{this.rolling=true;this.ready=false;this.cardIndex=0;this.ability=this.map.abilityPool[0];this.rollTime=0;}}
 activate(){if(this.completed||!this.ready||this.rolling||this.mode!=='normal')return;this.ready=false;this.timer=0;this.mode=this.ability==='wrestler'?'lift':'charge';this.chargeDirection=this.player.facing;this.player.vx=0;this.player.vy=0;this.jumpBuffer=0;this.emit(this.player.x,this.player.y,ABILITIES[this.ability].color,12);this.onEvent('ability',this);}
 emit(x,y,color,count=8){for(let i=0;i<count;i++)this.particles.push({x:x+.3,y:y+.4,vx:(Math.random()-.5)*7,vy:-Math.random()*5,life:.5+Math.random()*.4,color});}
 finishAllowed(){return this.room.clearCondition==='collect'?this.collected>=this.totalCollect:this.room.clearCondition==='break'?this.broken>=this.totalBreak:true;}
 step(dt,input={}){
  if(this.completed)return;this.elapsed+=dt;this.timer+=dt;this.noticeTime=Math.max(0,this.noticeTime-dt);
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  const p=this.player;const move=input.move||0;if(move&&this.mode!=='charge')p.facing=Math.sign(move);
  if(input.jump)this.jumpBuffer=.12;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
  if(this.rolling){this.rollTime+=dt;while(this.rollTime>=this.map.cardInterval){this.rollTime-=this.map.cardInterval;this.cardIndex=(this.cardIndex+1)%this.map.abilityPool.length;this.ability=this.map.abilityPool[this.cardIndex];}}
  if(this.mode==='lift'){p.vx=p.vy=0;if(this.timer>=1){this.mode='throw';this.timer=0;p.vx=p.facing*14;p.vy=-16;this.emit(p.x,p.y,'#b9a1ff',18);}else return;}
  if(this.mode==='charge'){p.vx=this.chargeDirection*Math.min(23,8+this.timer*30);p.vy+=28*dt;if(this.timer>=1.4){this.mode='normal';this.timer=0;}}
  else if(this.mode==='normal'){
   this.coyote=this.grounded?.1:Math.max(0,this.coyote-dt);const passive=this.ready&&this.ability==='wrestler';const target=move*(passive?8.8:7);const delta=65*dt;p.vx+=Math.max(-delta,Math.min(delta,target-p.vx));
   if(this.jumpBuffer>0&&this.coyote>0){p.vy=passive?-13:-11;this.jumpBuffer=this.coyote=0;this.grounded=false;this.emit(p.x,p.y+p.h,'#7a8da9',4);}
   p.vy+=((p.vy<0&&!input.jumpHeld)?54:32)*dt;
  }else p.vy+=30*dt;
  p.vy=Math.min(p.vy,25);this.moveAxis('x',p.vx*dt);this.grounded=false;this.moveAxis('y',p.vy*dt);
  if(this.mode==='throw'&&this.timer>.12&&this.grounded){this.mode='normal';this.timer=0;}
  if(p.y>HEIGHT+1||p.y<-4){this.retry();return;}
  p.x=Math.max(0,Math.min(WIDTH-p.w,p.x));
  for(let y=Math.max(0,Math.floor(p.y));y<=Math.min(HEIGHT-1,Math.floor(p.y+p.h));y++)for(let x=Math.max(0,Math.floor(p.x));x<=Math.min(WIDTH-1,Math.floor(p.x+p.w));x++){
   const tile=tileAt(this.room,x,y);if(tile==='^'&&overlaps(p,{x:x+.12,y:y+.25,w:.76,h:.75})){this.retry();return;}
   if(tile==='*'&&overlaps(p,{x:x+.2,y:y+.2,w:.6,h:.6})){this.setTile(x,y,'.');this.collected++;this.emit(x,y,'#e8d59c',12);this.onEvent('collect',this);}
  }
  for(const exit of this.room.exits)if(overlaps(p,{x:exit.x,y:exit.y,w:1,h:1})){
   if(!this.finishAllowed()){this.notice=this.room.clearCondition==='collect'?'先收集全部星光':'先撞碎全部橘色障礙';this.noticeTime=1.5;return;}
   if(exit.targetRoom){this.enterRoom(exit.targetRoom);return;}
   if(this.map.nextMap){this.map=this.campaign.maps.find(m=>m.id===this.map.nextMap);this.enterRoom(this.map.startRoom);this.onEvent('map',this);return;}
   this.completed=true;this.onEvent('complete',this);return;
  }
 }
 setTile(x,y,value){const row=this.room.tiles[y];this.room.tiles[y]=row.slice(0,x)+value+row.slice(x+1);}
 breakWall(x,y){const queue=[[x,y]];while(queue.length){const [cx,cy]=queue.pop();if(tileAt(this.room,cx,cy)!=='B')continue;this.setTile(cx,cy,'.');this.broken++;this.emit(cx,cy,'#ffb66e',5);queue.push([cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]);}this.onEvent('break',this);}
 moveAxis(axis,amount){
  const p=this.player;p[axis]+=amount;
  for(let y=Math.max(0,Math.floor(p.y));y<=Math.min(HEIGHT-1,Math.floor(p.y+p.h));y++)for(let x=Math.max(0,Math.floor(p.x));x<=Math.min(WIDTH-1,Math.floor(p.x+p.w));x++){
   const tile=tileAt(this.room,x,y);if(tile!=='#'&&tile!=='B')continue;const box={x,y,w:1,h:1};if(!overlaps(p,box))continue;
   if(tile==='B'&&this.mode==='charge'){this.breakWall(x,y);continue;}
   if(axis==='x'){p.x=amount>0?x-p.w:x+1;p.vx=0;if(this.mode==='charge')this.mode='normal';}
   else{p.y=amount>0?y-p.h:y+1;if(amount>0)this.grounded=true;p.vy=0;}
  }
 }
}
