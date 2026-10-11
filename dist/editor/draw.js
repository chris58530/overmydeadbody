import {WIDTH,HEIGHT,ABILITIES} from './model.js';
export function drawRoom(canvas,room,{grid=false,player=null,engine=null,selectedExit=-1,time=0}={}){
 const ctx=canvas.getContext('2d'),s=canvas.width/WIDTH;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(s,s);
 const background=ctx.createLinearGradient(0,0,0,HEIGHT);background.addColorStop(0,'#151b30');background.addColorStop(1,'#242c43');ctx.fillStyle=background;ctx.fillRect(0,0,WIDTH,HEIGHT);
 ctx.fillStyle='#abb4d5';ctx.globalAlpha=.4;for(let i=0;i<32;i++){const x=(i*7.37)%32,y=(i*3.79)%10;ctx.fillRect(x,y,.04,.04);}ctx.globalAlpha=1;
 ctx.fillStyle='#1b243a';for(let i=0;i<13;i++){const h=2+(i*2.73)%4;ctx.fillRect(i*2.8,17-h,2.5,h);}ctx.fillStyle='#3a4059';for(let i=0;i<30;i++)ctx.fillRect((i*5.17)%32,14+(i%3),.12,.22);
 ctx.beginPath();ctx.arc(27,3,1,0,Math.PI*2);ctx.fillStyle='#e8d6b9';ctx.fill();ctx.beginPath();ctx.arc(27.45,2.7,1,0,Math.PI*2);ctx.fillStyle='#171e32';ctx.fill();
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  const tile=room.tiles[y]?.[x];if(tile==='#'){ctx.fillStyle='#3b5061';ctx.fillRect(x,y,1,1);ctx.fillStyle='#728794';ctx.fillRect(x,y,1,.12);ctx.fillStyle='#28384b';ctx.fillRect(x+.05,y+.88,.9,.12);ctx.strokeStyle='#2c3c4f';ctx.lineWidth=.025;ctx.strokeRect(x+.025,y+.025,.95,.95);}
  if(tile==='B'){ctx.fillStyle='#b67b53';ctx.fillRect(x+.03,y+.03,.94,.94);ctx.strokeStyle='#f0bb7c';ctx.lineWidth=.05;ctx.strokeRect(x+.12,y+.12,.76,.76);ctx.beginPath();ctx.moveTo(x+.15,y+.15);ctx.lineTo(x+.85,y+.85);ctx.moveTo(x+.85,y+.15);ctx.lineTo(x+.15,y+.85);ctx.stroke();}
  if(tile==='^'){ctx.fillStyle='#fa7386';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+i/3,y+1);ctx.lineTo(x+(i+.5)/3,y+.2);ctx.lineTo(x+(i+1)/3,y+1);ctx.fill();}ctx.fillStyle='#a74e63';ctx.fillRect(x,y+.93,1,.07);}
  if(tile==='*'){const offset=engine?Math.sin(time*3+x)*.08:0;ctx.save();ctx.translate(x+.5,y+.5+offset);ctx.rotate(Math.PI/4);ctx.fillStyle='#ffe2a2';ctx.shadowColor='#ffe2a2';ctx.shadowBlur=grid?0:10;ctx.fillRect(-.17,-.17,.34,.34);ctx.restore();}
 }
 room.exits.forEach((exit,i)=>{const allowed=!engine||engine.finishAllowed();ctx.fillStyle=allowed?'#7dceb3':'#827d97';ctx.globalAlpha=.15;ctx.fillRect(exit.x,exit.y,1,1);ctx.globalAlpha=1;ctx.strokeStyle=i===selectedExit?'#ffb66e':allowed?'#8ce4c3':'#827d97';ctx.lineWidth=.07;ctx.strokeRect(exit.x+.18,exit.y+.08,.64,.87);ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(exit.x+.64,exit.y+.5,.07,.07);});
 if(grid){ctx.strokeStyle='#ffffff0b';ctx.lineWidth=.018;ctx.beginPath();for(let x=0;x<=WIDTH;x++){ctx.moveTo(x,0);ctx.lineTo(x,HEIGHT);}for(let y=0;y<=HEIGHT;y++){ctx.moveTo(0,y);ctx.lineTo(WIDTH,y);}ctx.stroke();ctx.fillStyle='#8ce4c3';ctx.font='.45px sans-serif';ctx.textAlign='center';ctx.fillText('S',room.spawn.x+.5,room.spawn.y+.7);ctx.strokeStyle='#8ce4c3';ctx.lineWidth=.035;ctx.strokeRect(room.spawn.x+.1,room.spawn.y+.1,.8,.8);}
 if(player){
  const p=player,mode=engine.mode,color=ABILITIES[engine.ability].color;let sx=p.x-.45*p.facing,sy=p.y+.38;
  if(mode==='lift'){sx=p.x+.3;sy=p.y+1;}if(mode==='charge'){sx=p.x+.3;sy=p.y+.95;}
  ctx.save();ctx.globalAlpha=.7;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(sx,sy,.42,.55,0,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle='#192032';ctx.fillRect(sx-.15,sy-.18,.08,.1);ctx.fillRect(sx+.1,sy-.18,.08,.1);
  const by=p.y+(mode==='lift'?-.7:mode==='charge'?-.3:0);ctx.fillStyle='#e8d4b4';ctx.fillRect(p.x+.12,by+.03,.38,.33);ctx.fillStyle='#292c3f';ctx.fillRect(p.x+.08,by,.42,.12);ctx.fillStyle='#e5e8ee';ctx.fillRect(p.x+.08,by+.37,.44,.32);ctx.fillStyle='#e39c68';ctx.fillRect(p.x+.13,by+.4,.34,.07);ctx.fillStyle='#a5afc5';ctx.fillRect(p.x+.12,by+.71,.13,.18);ctx.fillRect(p.x+.36,by+.71,.13,.18);ctx.fillStyle='#1b253d';ctx.fillRect(p.x+(p.facing>0?.38:.15),by+.18,.06,.07);
  if(mode==='charge'||mode==='throw'){ctx.strokeStyle=color;ctx.lineWidth=.06;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(p.x-.3*p.facing,by+.25+i*.2);ctx.lineTo(p.x-(.8+i*.2)*p.facing,by+.25+i*.2);ctx.stroke();}}
 }
 if(engine)for(const p of engine.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,.08,.08);}ctx.globalAlpha=1;ctx.restore();
}
