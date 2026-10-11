export const WIDTH=32, HEIGHT=18;
export const ABILITIES={wrestler:{name:'摔角烈酒',short:'摔角',color:'#b9a1ff',description:'舉起本體，1 秒內選方向後斜拋；持有時跑得更快、跳得更高。'},charge:{name:'保鑣黑啤',short:'衝撞',color:'#ffb66e',description:'扛起本體，加速往前衝，撞碎橘色障礙。'}};
export const TILES={'.':{name:'橡皮擦',color:'#151b2b'},'#':{name:'地形',color:'#536c83'},'^':{name:'尖刺',color:'#fa7386'},'B':{name:'可撞碎',color:'#df9860'},'*':{name:'收集物',color:'#e8d59c'}};
export const CONDITIONS={'exit':'抵達出口','collect':'收集全部再抵達出口','break':'撞碎全部障礙再抵達出口'};
export const clone=value=>JSON.parse(JSON.stringify(value));
export const uid=prefix=>prefix+'-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)).slice(0,8);
export function newRoom(name='新房間') {
 return {id:uid('room'),name,spawn:{x:2,y:15},clearCondition:'exit',tiles:Array.from({length:HEIGHT},(_,y)=>y===HEIGHT-1?'#'.repeat(WIDTH):'.'.repeat(WIDTH)),exits:[{x:29,y:15,targetRoom:null}]};
}
export function newMap(name='新地圖') {const room=newRoom('01 · 起點');return {id:uid('map'),name,abilityPool:['wrestler'],cardInterval:.22,startRoom:room.id,nextMap:null,rooms:[room]};}
export function newCampaign(){const map=newMap();return {format:'drunken-rooms',version:1,name:'我的房間旅程',startMap:map.id,maps:[map]};}
export function setTile(room,x,y,tile){const row=room.tiles[y];room.tiles[y]=row.slice(0,x)+tile+row.slice(x+1);}
export function tileAt(room,x,y){return room.tiles[y]?.[x]||'.';}
export function sampleCampaign(){
 const a=newMap('摔角 · 屋頂起步'),b=newMap('衝撞 · 深夜破陣');a.id='map-wrestler';b.id='map-charge';a.nextMap=b.id;b.abilityPool=['wrestler','charge'];
 const r1=a.rooms[0];r1.id='w-1';r1.name='01 · 第一口烈酒';r1.spawn={x:2,y:15};r1.exits=[{x:29,y:15,targetRoom:'w-2'}];
 for(let x=10;x<15;x++)setTile(r1,x,16,'#');setTile(r1,13,15,'*');
 const r2=newRoom('02 · 舉起，飛越');r2.id='w-2';r2.spawn={x:2,y:15};r2.exits=[{x:29,y:15,targetRoom:'w-3'}];for(let x=12;x<20;x++)setTile(r2,x,16,'^');for(let x=23;x<27;x++)setTile(r2,x,13,'#');setTile(r2,25,12,'*');
 const r3=newRoom('03 · 屋頂的星光');r3.id='w-3';r3.clearCondition='collect';for(let x=9;x<14;x++)setTile(r3,x,14,'#');for(let x=19;x<24;x++)setTile(r3,x,11,'#');setTile(r3,11,13,'*');setTile(r3,21,10,'*');
 a.rooms=[r1,r2,r3];a.startRoom=r1.id;
 const s1=b.rooms[0];s1.id='c-1';s1.name='01 · 撞開一條路';s1.clearCondition='break';s1.exits=[{x:29,y:15,targetRoom:'c-2'}];for(let y=12;y<17;y++)setTile(s1,17,y,'B');
 const s2=newRoom('02 · 選對你的酒');s2.id='c-2';s2.exits=[{x:29,y:15,targetRoom:'c-3'}];for(let y=12;y<17;y++)setTile(s2,9,y,'B');for(let x=17;x<23;x++)setTile(s2,x,16,'^');
 const s3=newRoom('03 · 最後一場演出');s3.id='c-3';s3.clearCondition='collect';for(let x=8;x<12;x++)setTile(s3,x,14,'#');for(let x=17;x<22;x++)setTile(s3,x,11,'#');for(let y=12;y<17;y++)setTile(s3,25,y,'B');setTile(s3,10,13,'*');setTile(s3,19,10,'*');
 b.rooms=[s1,s2,s3];b.startRoom=s1.id;
 return {format:'drunken-rooms',version:1,name:'醉隱 · 深夜旅程',startMap:a.id,maps:[a,b]};
}
export function validate(data){
 const errors=[], warnings=[];const error=s=>errors.push(s);
 if(!data||data.format!=='drunken-rooms'||data.version!==1)return {errors:['不是支援的 drunken-rooms v1 JSON。'],warnings};
 if(!Array.isArray(data.maps)||!data.maps.length||data.maps.length>100)return {errors:['地圖數量必須在 1–100 之間。'],warnings};
 const mapIds=new Set();
 for(const map of data.maps){if(!map||typeof map.id!=='string'||!map.id||mapIds.has(map.id)){error('地圖 ID 空白或重複。');continue;}mapIds.add(map.id);}
 if(!mapIds.has(data.startMap))error('起始地圖不存在。');
 for(const map of data.maps){
  if(!map)continue;const label=map.name||map.id;
  if(typeof map.name!=='string')error(label+'：需要地圖名稱。');
  if(!Array.isArray(map.abilityPool)||!map.abilityPool.length||map.abilityPool.some(a=>!Object.hasOwn(ABILITIES,a))||new Set(map.abilityPool).size!==map.abilityPool.length)error(label+'：能力池無效或重複。');
  if(typeof map.cardInterval!=='number'||!Number.isFinite(map.cardInterval)||map.cardInterval<.05||map.cardInterval>2)error(label+'：輪播間隔須為 0.05–2 秒。');
  if(map.nextMap!==null&&!mapIds.has(map.nextMap))error(label+'：下一張地圖不存在。');
  if(!Array.isArray(map.rooms)||!map.rooms.length||map.rooms.length>200){error(label+'：房間數量須為 1–200。');continue;}
  const roomIds=new Set();for(const room of map.rooms){if(!room||typeof room.id!=='string'||!room.id||roomIds.has(room.id)){error(label+'：房間 ID 空白或重複。');continue;}roomIds.add(room.id);}
  if(!roomIds.has(map.startRoom))error(label+'：起始房間不存在。');
  let finishes=false;
  for(const room of map.rooms){
   if(!room)continue;const name=label+' / '+room.name;
   if(typeof room.name!=='string')error(name+'：需要房間名稱。');
   if(!Object.hasOwn(CONDITIONS,room.clearCondition))error(name+'：未知過關条件。');
   const gridOk=Array.isArray(room.tiles)&&room.tiles.length===HEIGHT&&room.tiles.every(row=>typeof row==='string'&&row.length===WIDTH&&/^[.#^B*]+$/.test(row));
   if(!gridOk){error(name+'：地形必須是 32 × 18 格。');continue;}
   const validCell=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<WIDTH&&p.y>=0&&p.y<HEIGHT;
   if(!validCell(room.spawn)||tileAt(room,room.spawn.x,room.spawn.y)!=='.')error(name+'：出生點必須在空白格。');
   if(!Array.isArray(room.exits)||!room.exits.length){error(name+'：至少要有一個出口。');continue;}
   const cells=new Set();for(const exit of room.exits){
    if(!validCell(exit)||tileAt(room,exit.x,exit.y)!=='.')error(name+'：出口必須在空白格。');
    if(exit){const key=exit.x+','+exit.y;if(cells.has(key))error(name+'：出口位置重複。');cells.add(key);if(exit.targetRoom===null)finishes=true;else if(!roomIds.has(exit.targetRoom))error(name+'：出口連到不存在的房間。');}
   }
   if(room.clearCondition==='collect'&&!room.tiles.some(row=>row.includes('*')))warnings.push(name+'：收集條件沒有收集物。');
   if(room.clearCondition==='break'&&!room.tiles.some(row=>row.includes('B')))warnings.push(name+'：破壞條件沒有障礙。');
   if(room.tiles.some(row=>row.includes('B'))&&!map.abilityPool?.includes('charge'))warnings.push(name+'：有可撞碎障礙，但能力池沒有衝撞。');
  }
  if(!finishes)error(label+'：缺少完成地圖出口。');
  const seen=new Set(),pending=[map.startRoom];let reachableFinish=false;
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);const room=map.rooms.find(r=>r?.id===id);for(const exit of room?.exits||[]){if(exit?.targetRoom===null)reachableFinish=true;else pending.push(exit?.targetRoom);}}
  if(!reachableFinish)error(label+'：起始房間無法連到完成出口。');
  for(const room of map.rooms)if(room&&!seen.has(room.id))warnings.push(label+' / '+room.name+'：沒有從起點接進來。');
 }
 return {errors,warnings};
}
export function parseCampaign(text){if(text.length>5_000_000)throw Error('JSON 超過 5 MB。');let data;try{data=JSON.parse(text);}catch{throw Error('JSON 格式錯誤。');}const result=validate(data);if(result.errors.length)throw Error(result.errors.slice(0,6).join('\n'));return data;}
export const STORAGE='drunken-room-studio-v1';
export function download(data,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
