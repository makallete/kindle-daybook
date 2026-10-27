import {translator} from './i18n.js';
const TURKEY = 'Europe/Istanbul';
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtTime = d => new Intl.DateTimeFormat('tr-TR',{timeZone:TURKEY,hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
export const COMMUTE_ADDRESSES = {home:'',work:''};
export function commuteDirection(now = new Date()) {
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:TURKEY,hour:'2-digit',hour12:false}).format(now));
 return hour<12 ? 'work' : 'home';
}
export function commuteSelection(url, now=new Date()) {
 const selected=url.searchParams.get('route');
 const deadline=Number(url.searchParams.get('routeUntil'));
 const manual=['work','home'].includes(selected) && deadline>+now;
 return {direction:manual?selected:commuteDirection(now),manual,returnAt:manual?Math.min(deadline,+now+30000):null};
}
export function routeLink(direction,route=null) {
 const origin=direction==='work'?'home':'work';
 return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(route?.origin || COMMUTE_ADDRESSES[origin])+'&destination='+encodeURIComponent(route?.destination || COMMUTE_ADDRESSES[direction])+'&travelmode=driving';
}
export function decodePolyline(encoded) {
 if(typeof encoded!=='string' || encoded.length>200000) throw new Error('Invalid polyline');
 let i=0,lat=0,lng=0;const points=[];
 function value(){let shift=0,result=0,b;do{if(i>=encoded.length || shift>30)throw new Error('Invalid polyline');b=encoded.charCodeAt(i++)-63;if(b<0||b>63)throw new Error('Invalid polyline');result|=(b&31)<<shift;shift+=5;}while(b>=32);return result&1?~(result>>1):result>>1;}
 while(i<encoded.length){lat+=value();lng+=value();if(Math.abs(lat)>9000000||Math.abs(lng)>18000000)throw new Error('Invalid coordinates');points.push([lat/1e5,lng/1e5]);}
 if(points.length<2)throw new Error('Empty polyline');return points;
}
// Preserve the real road shape with a Mercator projection; never invent a route.
export function projectRoute(points, width=260,height=96) {
 if(!Array.isArray(points)||points.length<2)throw new Error('Missing route');
 const xy=points.map(([lat,lng])=>{if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>=85||Math.abs(lng)>180)throw new Error('Invalid coordinate');return[lng*Math.PI/180,-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];});
 const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);const left=Math.min(...xs),top=Math.min(...ys),dx=Math.max(...xs)-left,dy=Math.max(...ys)-top;
 const pad=9,scale=Math.min((width-pad*2)/(dx||1e-9),(height-pad*2)/(dy||1e-9));
 return xy.map(([x,y])=>[+(pad+(width-pad*2-dx*scale)/2+(x-left)*scale).toFixed(2),+(pad+(height-pad*2-dy*scale)/2+(y-top)*scale).toFixed(2)]);
}
export function routeGraphic(route,language='tr') {
 const t=translator(language);
 const points=projectRoute(route.points);const coords=points.map(p=>p.join(',')).join(' ');const first=points[0],last=points.at(-1);
 return `<svg class="route-shape" xmlns="http://www.w3.org/2000/svg" width="260" height="96" viewBox="0 0 260 96" role="img" aria-label="${t('Gerçek sürüş rotası')}"><polyline points="${coords}" fill="none" stroke="#bbb" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${coords}" fill="none" stroke="#111" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${first[0]}" cy="${first[1]}" r="4" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="${last[0]}" cy="${last[1]}" r="5" fill="#111"/><circle id="route-traveler" cx="${first[0]}" cy="${first[1]}" r="4" fill="#111" stroke="#fff" stroke-width="2"/></svg>`;
}
function emoji(place,language='tr') {
 const t=translator(language);
 const shape=place==='home'?'<path d="m3 15 13-11 13 11v14H5V15m7 14V18h8v11"/><path d="M23 7V3h4v7"/>':'<rect x="6" y="3" width="21" height="26" rx="1"/><path d="M12 8h2m5 0h2m-9 6h2m5 0h2m-9 6h2m5 0h2M15 29v-5h4v5"/>';
 return `<span class="place-emoji" role="img" aria-label="${place==='home'?'🏠 '+t('Ev'):'🏢 '+t('İş')}"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shape}</svg></span>`;
}
export function commuteCard({now=new Date(),direction=commuteDirection(now),route=null,url='/',language='tr'}={}) {
 const t=translator(language),distance=value=>(value/1000).toFixed(1).replace('.',language==='en'?'.':',');
 const target=new URL(url,'https://kindle.invalid');
 const option=(key,label)=>{const u=new URL(target);u.searchParams.set('route',key);u.searchParams.set('routeUntil',+now+30000);return `<a href="${esc(u.pathname+u.search)}" class="route-option${direction===key?' active':''}"${direction===key?' aria-current="true"':''}>${label}</a>`;};
 const origin=direction==='work'?'home':'work';
 const start=origin==='home'?t('Ev'):t('İş');const end=direction==='work'?t('İş'):t('Ev');
 const title=direction==='work'?t('Evden işe'):t('İşten eve');
 let body;
 if(route) {
  const minutes=Math.max(1,Math.ceil(route.seconds/60));const delay=Math.max(0,Math.round(route.delaySeconds/60));const arrival=fmtTime(new Date(+now+route.seconds*1000));
  body=`<div class="route-data"><strong class="route-minutes">${minutes}<span> ${t('dk')}</span></strong><div class="route-details">${t('Varış')} ${arrival} · ${distance(route.meters)} km</div><div class="route-traffic">${delay>=2?t('Trafikte +')+delay+' '+t('dk'):t('Trafik akıcı')}</div></div><div class="route-drawing">${routeGraphic(route,language)}<a class="route-provider" href="${esc(routeLink(direction,route))}" translate="no">${esc(route.provider||'Google Maps')}${route.at ? ' · '+fmtTime(new Date(route.at)) : ''}</a></div>`;
 } else body=`<div class="route-unavailable">${t('Yol süresi henüz alınamıyor. Sonraki planlı sorgu beklenecek.')}</div>`;
 return `<section class="commute" aria-label="${title}"><div class="route-head"><h2 class="route-title">${emoji(origin,language)}<span>${title}</span>${emoji(direction,language)}</h2><div class="route-switch">${option('work',t('Ev → İş'))}${option('home',t('İş → Ev'))}</div></div><div class="route-locations">${start} <span>→</span> ${end}</div><div class="route-content">${body}</div></section>`;
}
export function routeMotion(route) {
 if(!route)return '';
 // One short, six-step traversal per refresh. A continuous loop would flash e-ink.
 const points=projectRoute(route.points);const sample=Array.from({length:7},(_,i)=>points[Math.round((points.length-1)*i/6)]);
 return `(function(){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var el=document.getElementById('route-traveler'),p=${JSON.stringify(sample)},i=0;if(!el)return;var timer=setInterval(function(){i++;if(i>=p.length){clearInterval(timer);return;}el.setAttribute('cx',p[i][0]);el.setAttribute('cy',p[i][1]);},2500);})();`;
}
export const commuteCSS=`
.commute{border-top:1px solid #bbb;border-bottom:1px solid #bbb;padding:12px 0 10px;margin-top:14px;height:169px;overflow:hidden}.route-head{height:34px}.route-title{float:left;font-size:22px;line-height:30px;font-weight:600}.route-title span{vertical-align:middle}.place-emoji{display:inline-block;vertical-align:middle;margin-right:8px}.route-title .place-emoji:last-child{margin-left:8px}.place-emoji svg{vertical-align:middle}.route-switch{float:right}.route-option{display:inline-block;font-size:14px;line-height:30px;min-height:34px;padding:0 10px;color:#444;text-decoration:none;border-radius:6px}.route-option.active{color:#fff;background:#111}.route-option:focus,.route-open:focus,.route-provider:focus{outline:2px solid #111;outline-offset:2px}.route-locations{clear:both;font-size:13px;line-height:18px;color:#444;margin-top:0}.route-locations span{padding:0 5px}.route-content{clear:both;height:88px}.route-data{float:left;width:48%;padding-top:0}.route-minutes{font-size:44px;line-height:48px;font-weight:600;letter-spacing:-1px}.route-minutes span{font-size:20px;font-weight:400;letter-spacing:0}.route-details{font-size:14px;line-height:18px}.route-traffic{font-size:13px;line-height:18px;color:#444}.route-drawing{float:right;width:46%;position:relative;height:88px}.route-shape{width:100%;height:72px;display:block}.route-provider{display:block;color:#444;text-align:right;font:400 12px Arial,sans-serif;text-decoration:none;white-space:nowrap}.route-unavailable{font-size:17px;line-height:24px;padding-top:17px}.route-open{display:inline-block;margin-left:15px;font-size:15px;color:#111;text-decoration:underline;line-height:38px}
`;
