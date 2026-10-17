import {readFileSync,writeFileSync} from 'node:fs';
import {makeGame,ACTIONS,expand,compress} from './dsim.mjs';
const campaign=JSON.parse(readFileSync(new URL('days.json',import.meta.url)));
const out={};
for(const map of campaign.maps)for(const room of map.rooms){
 if(!process.argv.slice(2).includes(room.id))continue;
 let best=null;
 outer: for(const wait of [0,10,25,40,50,65])for(const run of [0,3,6,10,15,20,25])for(const jump of [0,2,4,6,8,10])for(const up of [false,true]){
 const route=`${wait?`Nx${wait} `:''}${run?`Rx${run} `:''}${jump?`RJ RHx${jump} `:''}${up?'RUS':'RS'} ${up?'RH':'R'}x40`;
 const plan=expand(route),g=makeGame(room,map.cells),trace=[];
 for(let frame=0;frame<plan.length*24;frame++){
 const [first,hold]=ACTIONS[plan[Math.floor(frame/24)]];g.step(1/240,frame%24===0?{...hold,...first}:hold);g.particles.length=0;g.events.length=0;
 if(frame%24===0)trace.push([Math.round(g.body.x),Math.round(g.body.y)]);
 if(g.state==='dead')break;
 if(g.phase!=='play'){
 const candidate={route:compress(plan.slice(0,Math.floor(frame/24)+1)),caps:g.capsGot.size+g.roomCaps.length,trace};
 if(!best||candidate.caps>best.caps)best=candidate;
 if(candidate.caps)break outer;break;
 }
 }
 }
 out[room.id]=best;console.log(room.id,JSON.stringify(best));
}
writeFileSync(new URL('probe-results.json',import.meta.url),JSON.stringify(out,null,2));
