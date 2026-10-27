import {translator} from './i18n.js';
import {commuteCard,projectRoute} from './commute.js';
import {commuteSlots} from './commute-schedule.js';
const safe = x=>JSON.stringify(x).replace(/</g,'\\u003c');
export function routeDisplay(route,now,direction,url,language='tr') {
 const projected=route?projectRoute(route.points):[];
 return {html:commuteCard({now,direction,route,url,language}),points:projected.length?Array.from({length:7},(_,i)=>projected[Math.round((projected.length-1)*i/6)]):[],at:route?.at||null,seconds:route?.seconds||null,meters:route?.meters||null};
}
export function commuteClient({now,homeURL,selectedDay,returnAt,commute,language='tr'}) {
 const routes=commute.routes||{[commute.direction]:commute.route};
 const displays=Object.fromEntries(['work','home'].map(dir=>[dir,routeDisplay(routes[dir],now,dir,homeURL,language)]));
 return `(function(){
var language=${safe(language)},arrivalLabel=${safe(translator(language)('Varış'))},base=${safe(homeURL)},records=${safe(displays)},weekdaySlots=${safe(commuteSlots(1))},weekendSlots=${safe(commuteSlots(6))},serverOffset=${+now}-new Date().getTime(),shown=${safe(commute.direction)},manual=${commute.selection?.manual?'true':'false'},activeDay=${selectedDay?'true':'false'},last={},pending={},dayTimer,routeTimer,motionTimer;
function serverNow(){return new Date(new Date().getTime()+serverOffset);}
function clock(){var d=new Date(serverNow().getTime()+10800000);return {day:d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2),weekday:d.getUTCDay(),minute:d.getUTCHours()*60+d.getUTCMinutes()};}
function autoDirection(){var m=clock().minute;return m<720?'work':'home';}
function slot(dir){var c=clock(),list=(c.weekday===0||c.weekday===6?weekendSlots:weekdaySlots)[dir],m=0;for(var i=0;i<list.length;i++){if(list[i]>c.minute)break;m=list[i];}return c.day+':'+dir+':'+m;}
last.work=slot('work');last.home=slot('home');
function animate(points){if(motionTimer)clearInterval(motionTimer);if(!points.length||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;var el=document.querySelector('#route-pane-'+shown+' #route-traveler'),i=0;if(!el)return;motionTimer=setInterval(function(){i++;if(i>=points.length){clearInterval(motionTimer);return;}el.setAttribute('cx',points[i][0]);el.setAttribute('cy',points[i][1]);},2500);}
function arrival(){var record=records[shown],el=document.querySelector('#route-pane-'+shown+' .route-details');if(!el||!record||!record.seconds)return;var d=new Date(serverNow().getTime()+record.seconds*1000+10800000);el.innerHTML=arrivalLabel+' '+('0'+d.getUTCHours()).slice(-2)+':'+('0'+d.getUTCMinutes()).slice(-2)+' · '+(record.meters/1000).toFixed(1).replace('.',language==='en'?'.':',')+' km';}
function show(dir,motion){var pane=document.getElementById('route-pane-'+dir);if(!pane||!records[dir])return;var dirs=['work','home'];for(var i=0;i<dirs.length;i++){var item=document.getElementById('route-pane-'+dirs[i]);if(item)item.style.display=dirs[i]===dir?'block':'none';}shown=dir;arrival();if(motion)animate(records[dir].points);}
function updatePane(dir){var pane=document.getElementById('route-pane-'+dir);if(pane)pane.innerHTML=records[dir].html;}
function requestRoute(dir,key){if(pending[dir])return;pending[dir]=true;last[dir]=key;var xhr=new XMLHttpRequest();xhr.open('GET',base+'?partial=traffic&route='+dir+'&lang='+language,true);xhr.timeout=15000;function done(){pending[dir]=false;}xhr.onerror=done;xhr.ontimeout=done;xhr.onload=function(){done();if(xhr.status!==200)return;try{records[dir]=JSON.parse(xhr.responseText);last[dir]=key;updatePane(dir);if(shown===dir)show(dir,true);}catch(e){}};xhr.send();}
function poll(){arrival();var dirs=['work','home'];for(var i=0;i<dirs.length;i++){var dir=dirs[i],key=slot(dir);if(last[dir]!==key)requestRoute(dir,key);}if(!manual&&shown!==autoDirection())show(autoDirection(),true);}
function calendar(url){var xhr=new XMLHttpRequest();xhr.open('GET',url+(url.indexOf('?')<0?'?':'&')+'partial=calendar&lang='+language,true);xhr.timeout=15000;xhr.onload=function(){if(xhr.status!==200)return;var box=document.createElement('div');box.innerHTML=xhr.responseText;var stamp=box.querySelector('.footer');if(stamp&&stamp.getAttribute){var epoch=Number(stamp.getAttribute('data-server-time'));if(epoch>0)serverOffset=epoch-new Date().getTime();}var names=['.brand-row','.date-block','.week','.agenda-heading','.agenda','.weather-section','.footer'];for(var i=0;i<names.length;i++){var old=document.querySelector(names[i]),fresh=box.querySelector(names[i]);if(old&&fresh)old.innerHTML=fresh.innerHTML;}};xhr.send();}
function resetDay(){activeDay=false;calendar(base);}
function chooseDay(url){activeDay=/[?&]day=/.test(url);calendar(url);if(dayTimer)clearTimeout(dayTimer);if(activeDay){var match=url.match(/[?&]until=(\\d+)/),delay=match?Math.max(0,Math.min(100000,Number(match[1])-serverNow().getTime())):100000;dayTimer=setTimeout(resetDay,delay);}}
document.addEventListener('click',function(event){var a=event.target;while(a&&a.tagName!=='A')a=a.parentNode;if(!a)return;var cls=' '+a.className+' ',href=a.getAttribute('href')||'';if(cls.indexOf(' route-option ')>=0){var found=href.match(/[?&]route=(work|home)/);if(!found)return;event.preventDefault();manual=true;show(found[1],true);if(routeTimer)clearTimeout(routeTimer);routeTimer=setTimeout(function(){manual=false;show(autoDirection(),true);},30000);}else if(cls.indexOf(' day-link ')>=0||cls.indexOf(' agenda-control ')>=0){event.preventDefault();chooseDay(href);}},false);
var meta=document.querySelector('meta[http-equiv="refresh"]');if(meta)meta.parentNode.removeChild(meta);
${selectedDay?'dayTimer=setTimeout(resetDay,'+Math.max(0,returnAt-+now)+');':''}
${commute.selection?.manual?'routeTimer=setTimeout(function(){manual=false;show(autoDirection(),true);},'+Math.max(0,commute.selection.returnAt-+now)+');':''}
setInterval(function(){if(!activeDay)calendar(base);poll();},60000);animate(records[shown].points);
})();`;
}
