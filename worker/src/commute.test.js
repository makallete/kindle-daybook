import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commuteDirection,commuteSelection,routeLink,decodePolyline,projectRoute,commuteCard,routeMotion} from './commute.js';
import {render} from './worker.js';
test('commute uses Turkey time and direction boundaries, including overnight',()=>{
 for(const [t,expected] of [['20:59','home'],['21:00','work'],['08:59','work'],['09:00','home'],['20:59','home']])assert.equal(commuteDirection(new Date('2026-10-24T'+t+':00Z')),expected);
});
test('manual route choice expires after 30 seconds and ignores unknown values',()=>{
 const now=new Date('2026-10-24T07:00:00Z');const u=new URL('https://example.com/d/token?route=home&routeUntil='+(+now+30000));
 assert.equal(commuteSelection(u,now).direction,'home');assert.equal(commuteSelection(u,new Date(+now+30001)).direction,'work');
 u.searchParams.set('route','attacker');assert.equal(commuteSelection(u,now).direction,'work');
});
test('Maps links keep the correct origin and destination for each commute direction',()=>{
 const out=new URL(routeLink('work',{origin:'Example Home',destination:'Example Office'}));
 assert.equal(out.searchParams.get('origin'),'Example Home');assert.equal(out.searchParams.get('destination'),'Example Office');
});
test('polyline decodes real coordinates and rejects truncated/corrupt data',()=>{
 assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'),[[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]);
 for(const s of ['', '?','~','abc☃'])assert.throws(()=>decodePolyline(s));
});
test('route projection preserves road bends and stays inside the card',()=>{
 const points=projectRoute([[40.91,29.2],[40.94,29.21],[40.96,29.19],[40.98,29.13]]);
 assert.equal(points.length,4);assert.ok(points.every(([x,y])=>x>=9&&x<=251&&y>=9&&y<=87));assert.ok(points[1][0]>points[0][0]);
 assert.throws(()=>projectRoute([[NaN,1],[2,3]]));
});
test('missing live data shows no invented ETA, route shape, or motion',()=>{
 const html=commuteCard({direction:'home',now:new Date('2026-10-24T17:00:00Z')});
 assert.match(html,/Yol süresi henüz alınamıyor/);assert.ok(!html.includes('route-shape'));assert.ok(!html.includes('route-minutes'));assert.equal(routeMotion(null),'');
});
test('route controls preserve selected calendar day and render real route metrics safely',()=>{
 const now=new Date('2026-10-24T17:00:00Z');const route={seconds:1800,delaySeconds:420,meters:16200,points:[[40.98,29.13],[40.94,29.21],[40.91,29.2]],provider:'Google Maps'};
 const html=commuteCard({now,direction:'home',route,url:'/d/private?day=2026-10-25&until=123'});
 assert.match(html,/30<span> dk/);assert.match(html,/Varış 20:30/);assert.match(html,/Trafikte \+7 dk/);assert.match(html,/day=2026-10-25&amp;until=123/);assert.match(html,/route=work/);assert.match(html,/🏠 Ev/);assert.match(html,/🏢 İş/);
 const dashboard=render({now,commute:{route,direction:'home',url:'/d/private'}});assert.match(dashboard,/id="route-traveler"/);assert.match(dashboard,/prefers-reduced-motion/);assert.match(dashboard,/clearInterval/);assert.ok(dashboard.indexOf('class="weather-section"')<dashboard.indexOf('class="commute-region"'));assert.match(dashboard,/id="route-pane-work"/);assert.match(dashboard,/id="route-pane-home"/);
});

test('commute stays on one page while calendar navigation and route choice preserve live results',()=>{
 let current=Date.parse('2026-10-26T05:00:00Z');const now=new Date(current);
 const html=render({now,homeURL:'/d/private',commute:{direction:'work',url:'/d/private'}});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];let interval,click;const timers=[],sent=[];
 class MockDate extends Date {constructor(...args){super(...(args.length?args:[current]));}static now(){return current;}}
 const panes={work:{style:{display:'block'}},home:{style:{display:'none'}}};
 const target={innerHTML:'old',parentNode:{replaceChild(){throw new Error('Direction switching must keep existing route DOM');},removeChild(){}}};
 const box={innerHTML:'',querySelector:()=>target};
 class XHR {open(method,url){this.url=url;}send(){sent.push(this.url);this.status=200;this.responseText=this.url.includes('partial=traffic')?JSON.stringify({html:'fixture',points:[]}):'calendar fixture';this.onload();}}
 const context={Date:MockDate,window:{matchMedia:()=>({matches:true})},setInterval:(fn,ms)=>{interval={fn,ms};},clearInterval(){},setTimeout:(fn,ms)=>{timers.push({fn,ms});},clearTimeout(){},document:{createElement:()=>box,getElementById:id=>panes[id.replace('route-pane-','')],querySelector:selector=>selector.startsWith('meta')?null:target,addEventListener:(type,fn)=>{click=fn;}},XMLHttpRequest:XHR};
 vm.runInNewContext(script,context);assert.equal(interval.ms,60000);
 function tap(cls,href){click({target:{tagName:'A',className:cls,getAttribute:()=>href},preventDefault(){}});}
 tap('route-option','/d/private?route=home');assert.equal(sent.length,0);assert.equal(timers.at(-1).ms,30000);assert.equal(panes.home.style.display,'block');assert.equal(panes.work.style.display,'none');timers.at(-1).fn();assert.equal(panes.work.style.display,'block');assert.equal(panes.home.style.display,'none');
 tap('day-link','/d/private?day=2026-10-27');assert.ok(sent.at(-1).includes('partial=calendar'));assert.equal(sent.filter(u=>u.includes('partial=traffic')).length,0);
 current+=5*60000;interval.fn();assert.equal(sent.filter(u=>u.includes('partial=traffic')).length,1);assert.equal(new URL(sent.at(-1),'https://example.test').searchParams.get('route'),'work');assert.equal(new URL(sent.at(-1),'https://example.test').searchParams.get('lang'),'tr');
 interval.fn();assert.equal(sent.filter(u=>u.includes('partial=traffic')).length,1);
});
