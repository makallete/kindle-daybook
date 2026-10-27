import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{render,eventDates} from './worker.js';
import {commuteCard} from './commute.js';
const now=new Date('2026-10-26T05:15:00Z');
const route={seconds:1440,meters:14200,delaySeconds:180,points:[[41,29],[41.01,29.01]],at:now.toISOString()};
test('English rendering translates authored UI and dates while preserving calendar content',()=>{
 const html=render({now,language:'en',events:[{title:'Bugün',start:now.toISOString(),end:new Date(+now+3600000).toISOString()}],commute:{direction:'work',route,url:'/d/test'}});
 for(const word of ['lang="en"','October','Monday','Mon','Up next','Next 14 days','Weather','Updated','Home to work','Arrive',' min','Traffic +3 min'])assert.ok(html.includes(word),word);
 assert.ok(html.includes('<h2>Bugün</h2>'));
 assert.ok(!html.includes('>Sıradaki<'));assert.ok(html.includes('lang=en'));assert.ok(html.includes('language="en"'));
});
test('English multi-day labels use selected day and exclusive end',()=>{
 const event={start:'2026-10-23T21:00:00Z',end:'2026-10-25T21:00:00Z',allDay:true};
 assert.deepEqual(eventDates(event,now,'2026-10-25','en'),{multiple:false,dates:'Today',times:'All day'});
});
test('English route uses decimal point and localized unavailable state',()=>{
 const html=commuteCard({now,language:'en',direction:'home',route});
 assert.ok(html.includes('Work to home'));assert.ok(html.includes('14.2 km'));assert.ok(html.includes('Home → Work'));
 assert.ok(commuteCard({language:'en'}).includes('Travel time unavailable'));
});
test('traffic partial responses honor the chosen language without exposing the key',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({routes:[{duration:'1440s',staticDuration:'1200s',distanceMeters:14200,polyline:{encodedPolyline:'_p~iF~ps|U_ulLnnqC_mqNvxq`@'}}]});
 try{
  const response=await worker.fetch(new Request('https://example.test/d/test?partial=traffic&route=home&lang=en'),{SCREEN_TOKEN:'test',GOOGLE_MAPS_API_KEY:'PRIVATE_TEST_KEY',HOME_ADDRESS:'Example Home',WORK_ADDRESS:'Example Office'});
  const data=await response.json();assert.equal(response.status,200);assert.ok(data.html.includes('Work to home'));assert.ok(!JSON.stringify(data).includes('PRIVATE_TEST_KEY'));
 }finally{globalThis.fetch=old;}
});
