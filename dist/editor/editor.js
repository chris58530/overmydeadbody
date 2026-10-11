import {sampleCampaign,newCampaign,newMap,newRoom,clone,uid,WIDTH,HEIGHT,TILES,ABILITIES,CONDITIONS,STORAGE,validate,parseCampaign,download,setTile,tileAt} from './model.js';
import {drawRoom} from './draw.js';
const $=id=>document.getElementById(id),canvas=$('editor-canvas');
let campaign=sampleCampaign();try{const saved=localStorage.getItem(STORAGE);if(saved)campaign=parseCampaign(saved);}catch{}
let mapId=campaign.startMap,roomId=campaign.maps.find(m=>m.id===mapId).startRoom,tool='#',grid=true,selectedExit=0,painting=false,lastCell='',strokeChanged=false;
let history=[],future=[];
const currentMap=()=>campaign.maps.find(m=>m.id===mapId),currentRoom=()=>currentMap().rooms.find(r=>r.id===roomId);
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(campaign));$('save-status').textContent='● 草稿已存本機';}catch{$('save-status').textContent='儲存空間不足，請匯出';}render();}
function snapshot(){history.push({campaign:clone(campaign),mapId,roomId});if(history.length>60)history.shift();future=[];}
function change(fn){snapshot();fn();save();$('validation').textContent='';}
function options(select,items,value){select.replaceChildren(...items.map(([id,name])=>{const option=document.createElement('option');option.value=id;option.textContent=name;return option;}));select.value=value;}
function render(){
 const map=currentMap(),room=currentRoom();$('campaign-name').value=campaign.name;$('room-count').textContent=map.rooms.length+' ROOMS';
 options($('map-select'),campaign.maps.map(m=>[m.id,m.name]),mapId);
 $('room-heading').textContent=room.name;$('room-name').value=room.name;$('map-name').value=map.name;$('spawn-x').value=room.spawn.x;$('spawn-y').value=room.spawn.y;$('condition').value=room.clearCondition;$('start-room').checked=room.id===map.startRoom;$('start-map').checked=map.id===campaign.startMap;$('card-interval').value=map.cardInterval;
 options($('next-map'),[['','旅程結束'],...campaign.maps.filter(m=>m.id!==mapId).map(m=>[m.id,m.name])],map.nextMap||'');
 const list=$('room-list');list.replaceChildren();
 map.rooms.forEach((r,i)=>{const button=document.createElement('button');button.className='room-item'+(r.id===roomId?' selected':'');button.setAttribute('aria-label','選擇房間 '+r.name);button.setAttribute('aria-pressed',String(r.id===roomId));const thumb=document.createElement('canvas');thumb.width=320;thumb.height=180;drawRoom(thumb,r);button.append(thumb);const text=document.createElement('div');text.className='room-text';const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.textContent=r.name;text.append(number,name);if(r.id===map.startRoom){const badge=document.createElement('span');badge.className='start-badge';badge.textContent='起點';text.append(badge);}button.append(text);button.onclick=()=>{roomId=r.id;selectedExit=0;render();};list.append(button);});
 selectedExit=Math.min(Math.max(0,selectedExit),room.exits.length-1);
 options($('exit-select'),room.exits.map((exit,i)=>[String(i),'出口 '+(i+1)+' · ('+exit.x+', '+exit.y+')']),String(selectedExit));
 options($('exit-target'),[['','完成這張地圖'],...map.rooms.filter(r=>r.id!==roomId).map(r=>[r.id,r.name])],room.exits[selectedExit]?.targetRoom||'');
 $('exit-target').disabled=$('remove-exit').disabled=!room.exits.length;
 for(const key of Object.keys(ABILITIES))$('pool-'+key).checked=map.abilityPool.includes(key);
 $('undo').disabled=!history.length;$('redo').disabled=!future.length;$('delete-room').disabled=map.rooms.length===1;$('delete-map').disabled=campaign.maps.length===1;
 for(const button of $('tools').children){const selected=button.dataset.tool===tool;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 drawRoom(canvas,room,{grid,selectedExit});
 $('room-flow').replaceChildren();for(const r of map.rooms){const node=document.createElement('button');node.className='flow-node'+(r.id===roomId?' selected':'');node.textContent=r.name;node.onclick=()=>{roomId=r.id;selectedExit=0;render();};const targets=r.exits.map(e=>e.targetRoom?map.rooms.find(other=>other.id===e.targetRoom)?.name||'?':'完成地圖');node.title='→ '+targets.join(' / ');$('room-flow').append(node);const arrow=document.createElement('span');arrow.textContent='→ '+targets.join(' / ');$('room-flow').append(arrow);}
}
const toolDefs=[['#','▦','地形'],['^','▲','尖刺'],['B','▧','撞碎'],['*','✦','星光'],['spawn','◎','出生'],['exit','⇥','出口'],['.','◇','擦除']];
toolDefs.forEach(([value,symbol,label],index)=>{const button=document.createElement('button');button.dataset.tool=value;button.title=(index+1)+' · '+label;button.setAttribute('aria-label',label+'工具');const icon=document.createElement('span');icon.className='tool-symbol';icon.textContent=symbol;button.append(icon,document.createTextNode(label));button.onclick=()=>{tool=value;render();};$('tools').append(button);});
options($('condition'),Object.entries(CONDITIONS),'exit');
for(const [key,ability] of Object.entries(ABILITIES)){const div=document.createElement('div');div.className='ability-option';const label=document.createElement('label');label.className='check';const check=document.createElement('input');check.type='checkbox';check.id='pool-'+key;label.append(check,document.createTextNode(ability.name));const small=document.createElement('small');small.textContent=key==='wrestler'?'舉起本體，選方向斜拋':'扛起本體，加速破壞障礙';div.append(label,small);$('ability-pool').append(div);check.onchange=()=>{const map=currentMap();if(!check.checked&&map.abilityPool.length===1){check.checked=true;toast('至少保留一種能力');return;}change(()=>{map.abilityPool=Object.keys(ABILITIES).filter(a=>$('pool-'+a).checked);});};}
function cellLocation(event){const rect=canvas.getBoundingClientRect();return {x:Math.floor((event.clientX-rect.left)/rect.width*WIDTH),y:Math.floor((event.clientY-rect.top)/rect.height*HEIGHT)};}
function paint(event){
 const {x,y}=cellLocation(event);if(x<0||x>=WIDTH||y<0||y>=HEIGHT)return;const key=x+','+y;if(key===lastCell)return;lastCell=key;const room=currentRoom();const active=event.buttons===2?'.':tool;
 if(active==='spawn'){room.spawn={x,y};setTile(room,x,y,'.');room.exits=room.exits.filter(e=>e.x!==x||e.y!==y);}
 else if(active==='exit'){setTile(room,x,y,'.');let i=room.exits.findIndex(e=>e.x===x&&e.y===y);if(i<0){room.exits.push({x,y,targetRoom:null});i=room.exits.length-1;}selectedExit=i;}
 else {if(x===room.spawn.x&&y===room.spawn.y&&active!=='.')return;setTile(room,x,y,active);if(active!=='.')room.exits=room.exits.filter(e=>e.x!==x||e.y!==y);}
 strokeChanged=true;drawRoom(canvas,room,{grid,selectedExit});
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);snapshot();painting=true;lastCell='';strokeChanged=false;paint(e);});
canvas.addEventListener('pointermove',e=>{const {x,y}=cellLocation(e);$('cursor-pos').textContent='X '+x+' · Y '+y;if(painting)paint(e);});
function endStroke(){if(!painting)return;painting=false;if(!strokeChanged)history.pop();save();$('validation').textContent='';}
canvas.addEventListener('pointerup',endStroke);canvas.addEventListener('pointercancel',endStroke);
function undo(){if(!history.length)return;future.push({campaign:clone(campaign),mapId,roomId});const old=history.pop();campaign=old.campaign;mapId=old.mapId;roomId=old.roomId;save();}
function redo(){if(!future.length)return;history.push({campaign:clone(campaign),mapId,roomId});const next=future.pop();campaign=next.campaign;mapId=next.mapId;roomId=next.roomId;save();}
$('undo').onclick=undo;$('redo').onclick=redo;
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(/^[1-7]$/.test(e.key)){tool=toolDefs[Number(e.key)-1][0];render();}});
$('grid-toggle').onclick=()=>{grid=!grid;$('grid-toggle').setAttribute('aria-pressed',String(grid));render();};
$('map-select').onchange=()=>{mapId=$('map-select').value;roomId=currentMap().startRoom;selectedExit=0;render();};
for(const [id,get,key] of [['campaign-name',()=>campaign,'name'],['map-name',currentMap,'name'],['room-name',currentRoom,'name']])$(id).oninput=()=>{const value=$(id).value;if(!value.trim())return;change(()=>get()[key]=value);};
$('condition').onchange=()=>change(()=>currentRoom().clearCondition=$('condition').value);
for(const axis of ['x','y'])$('spawn-'+axis).onchange=()=>{const value=Number($('spawn-'+axis).value),room=currentRoom();if(!Number.isInteger(value)||value<0||value>=(axis==='x'?WIDTH:HEIGHT)){render();return;}change(()=>{room.spawn[axis]=value;setTile(room,room.spawn.x,room.spawn.y,'.');});};
$('start-room').onchange=()=>{if(!$('start-room').checked){render();return;}change(()=>currentMap().startRoom=roomId);};
$('start-map').onchange=()=>{if(!$('start-map').checked){render();return;}change(()=>campaign.startMap=mapId);};
$('card-interval').onchange=()=>{const value=Number($('card-interval').value);if(!Number.isFinite(value)||value<.05||value>2){render();return;}change(()=>currentMap().cardInterval=value);};
$('next-map').onchange=()=>change(()=>currentMap().nextMap=$('next-map').value||null);
$('exit-select').onchange=()=>{selectedExit=Number($('exit-select').value);render();};
$('exit-target').onchange=()=>change(()=>currentRoom().exits[selectedExit].targetRoom=$('exit-target').value||null);
$('remove-exit').onclick=()=>change(()=>currentRoom().exits.splice(selectedExit,1));
$('add-map').onclick=()=>change(()=>{const map=newMap('地圖 '+(campaign.maps.length+1));campaign.maps.push(map);mapId=map.id;roomId=map.startRoom;});
$('add-room').onclick=()=>change(()=>{const room=newRoom(String(currentMap().rooms.length+1).padStart(2,'0')+' · 新房間');currentMap().rooms.push(room);roomId=room.id;selectedExit=0;});
$('duplicate-room').onclick=()=>change(()=>{const room=clone(currentRoom());room.id=uid('room');room.name+=' 副本';currentMap().rooms.push(room);roomId=room.id;});
$('delete-room').onclick=()=>{const map=currentMap();if(map.rooms.length<=1)return;if(!confirm('刪除「'+currentRoom().name+'」？可以復原。'))return;change(()=>{map.rooms=map.rooms.filter(r=>r.id!==roomId);for(const room of map.rooms)for(const exit of room.exits)if(exit.targetRoom===roomId)exit.targetRoom=null;if(map.startRoom===roomId)map.startRoom=map.rooms[0].id;roomId=map.startRoom;selectedExit=0;});};
$('delete-map').onclick=()=>{if(campaign.maps.length<=1)return;if(!confirm('刪除「'+currentMap().name+'」？可以復原。'))return;change(()=>{campaign.maps=campaign.maps.filter(m=>m.id!==mapId);for(const map of campaign.maps)if(map.nextMap===mapId)map.nextMap=null;if(campaign.startMap===mapId)campaign.startMap=campaign.maps[0].id;mapId=campaign.startMap;roomId=currentMap().startRoom;});};
function check(){const result=validate(campaign);$('validation').replaceChildren();$('validation').classList.toggle('error',result.errors.length>0);const messages=[...result.errors,...result.warnings];if(!messages.length)messages.push('✓ 地圖格式與房間連接都有效，可以試玩或匯出。');for(const text of messages){const line=document.createElement('div');line.textContent=text;$('validation').append(line);}return result.errors.length===0;}
$('validate').onclick=check;
$('export').onclick=()=>{if(!check()){toast('請先修正地圖錯誤');return;}download(campaign,'drunken-rooms.json');toast('JSON 已匯出，可交給遊戲本體載入');};
$('import').onclick=()=>$('file-input').click();$('file-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('JSON 超過 5 MB');const data=parseCampaign(await file.text());change(()=>{campaign=data;mapId=data.startMap;roomId=currentMap().startRoom;selectedExit=0;});toast('JSON 載入完成');}catch(error){toast(error.message);}e.target.value='';};
$('sample').onclick=()=>{if(!confirm('載入範例旅程？目前草稿可用復原取回。'))return;change(()=>{campaign=sampleCampaign();mapId=campaign.startMap;roomId=currentMap().startRoom;selectedExit=0;});};
$('new-campaign').onclick=()=>{if(!confirm('建立空白旅程？目前草稿可用復原取回。'))return;change(()=>{campaign=newCampaign();mapId=campaign.startMap;roomId=currentMap().startRoom;selectedExit=0;});};
$('play').onclick=()=>{if(!check()){toast('請先修正地圖錯誤');return;}download(campaign,'drunken-rooms.json');toast('JSON 已匯出。請在遊戲網頁按「載入關卡 JSON」試玩。');};
render();
