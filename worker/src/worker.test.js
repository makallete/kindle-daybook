import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker, {calendarEvents,render,mergeEvents,eventDates,calendarView} from './worker.js';
const now = new Date('2026-10-24T10:00:00Z');
const cal = events => 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Test//EN\r\n'+events+'END:VCALENDAR\r\n';
const event = fields => 'BEGIN:VEVENT\r\n'+fields.join('\r\n')+'\r\nEND:VEVENT\r\n';

test('recurrences preserve COUNT, EXDATE, moved and cancelled exceptions',()=>{
 const source=cal(
 event(['UID:repeat','DTSTART:20261023T120000Z','DTEND:20261023T130000Z','RRULE:FREQ=DAILY;COUNT=5','EXDATE:20261025T120000Z','SUMMARY:Original'])+
 event(['UID:repeat','RECURRENCE-ID:20261024T120000Z','DTSTART:20261024T140000Z','DTEND:20261024T150000Z','SUMMARY:Moved'])+
 event(['UID:repeat','RECURRENCE-ID:20261026T120000Z','DTSTART:20261026T120000Z','DTEND:20261026T130000Z','STATUS:CANCELLED','SUMMARY:Cancelled']));
 const result=calendarEvents(source,now);
 assert.deepEqual(result.map(e=>[e.title,e.start]),[['Moved','2026-10-24T14:00:00.000Z'],['Original','2026-10-27T12:00:00.000Z']]);
});
test('all-day end is exclusive and floating time uses Istanbul',()=>{
 const result=calendarEvents(cal(
 event(['UID:past','DTSTART;VALUE=DATE:20261023','DTEND;VALUE=DATE:20261024','SUMMARY:Past'])+
 event(['UID:today','DTSTART;VALUE=DATE:20261024','DTEND;VALUE=DATE:20261025','SUMMARY:Today'])+
 event(['UID:float','DTSTART:20261024T150000','DTEND:20261024T160000','SUMMARY:Local'])),now);
 assert.deepEqual(result.map(e=>e.title),['Today','Local']);
 assert.equal(result[1].start,'2026-10-24T12:00:00.000Z');
});
test('VTIMEZONE offsets resolve international events',()=>{
 const zone='BEGIN:VTIMEZONE\r\nTZID:Custom\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0500\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n';
 const result=calendarEvents(cal(zone+event(['UID:zone','DTSTART;TZID=Custom:20261024T090000','DTEND;TZID=Custom:20261024T100000','SUMMARY:Remote'])),now);
 assert.equal(result[0].start,'2026-10-24T14:00:00.000Z');
});
test('calendar titles are escaped and error states do not claim an empty calendar',()=>{
 const html=render({now,events:[{title:'<script>unsafe</script>',location:'A & B',start:'2026-10-24T14:00:00Z',end:'2026-10-24T15:00:00Z'}]});
 assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
 assert.ok(html.includes('17:00'));
 const error=render({now,calendarError:true});
 assert.ok(error.includes('Takvim şu anda alınamıyor'));
 assert.ok(!error.includes('planlanmış etkinlik yok'));
});
test('calendar screen requires its private token',async()=>{
 const response=await worker.fetch(new Request('https://example.com/d/wrong'),{SCREEN_TOKEN:'correct'});
 assert.equal(response.status,404);
 assert.equal((await worker.fetch(new Request('https://example.com/health'),{})).status,200);
});

test('shared calendars merge chronologically and omit mirrored events',()=>{
 const a={title:'Same',start:'2026-10-24T14:00:00Z',end:'2026-10-24T15:00:00Z',allDay:false};
 const b={...a,title:'Another',start:'2026-10-24T13:00:00Z'};
 assert.deepEqual(mergeEvents([a,b,{...a,location:'Shared copy'}]),[b,a]);
});
test('each calendar uses its own cache and one failed feed preserves other events',async()=>{
 const original=globalThis.fetch;
 const stamp=new Date(Date.now()+3600000).toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
 const end=new Date(Date.now()+7200000).toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
 let requests=[];
 globalThis.fetch=async url=>{
  requests.push(url);
  if(url.includes('open-meteo')) return Response.json({current:{temperature_2m:20,weather_code:0},daily:{time:[],weather_code:[]}});
  if(url.includes('failed')) return new Response('',{status:503});
  return new Response(cal(event(['UID:'+url,'DTSTART:'+stamp,'DTEND:'+end,'SUMMARY:'+ (url.includes('secondary')?'Shared meeting':'Personal meeting')])));
 };
 try {
  const env={SCREEN_TOKEN:'merge-test',ICAL_URL:'https://test.local/personal',SHARED_ICAL_URL:'https://test.local/secondary'};
  let html=await (await worker.fetch(new Request('https://example.com/d/merge-test'),env)).text();
  assert.ok(html.includes('Personal meeting')); assert.ok(html.includes('Shared meeting'));
  assert.ok(!html.includes('Çıkış:')); assert.ok(!html.includes('class="sources"'));
  await worker.fetch(new Request('https://example.com/d/merge-test'),env);
  assert.equal(requests.filter(x=>x===env.ICAL_URL).length,1);
  html=await (await worker.fetch(new Request('https://example.com/d/merge-test'),{...env,SHARED_ICAL_URL:'https://test.local/failed'})).text();
  assert.ok(html.includes('Personal meeting')); assert.ok(!html.includes('Takvim şu anda alınamıyor'));
 } finally {globalThis.fetch=original;}
});

test('agenda shows six upcoming events and keeps later events outside the first screen',()=>{
 const events=Array.from({length:8},(_,i)=>({title:'EVENT_'+i+'_END',start:'2026-10-24T14:00:00Z',end:'2026-10-24T15:00:00Z'}));
 const html=render({now,events});
 for(let i=0;i<6;i++) assert.ok(html.includes('EVENT_'+i+'_END'));
 assert.ok(!html.includes('EVENT_6_END'));
 assert.ok(!html.includes('EVENT_7_END'));
});

test('two-day all-day events include both dates but exclude DTEND day',()=>{
 const source=cal(event(['UID:final','DTSTART;VALUE=DATE:20261024','DTEND;VALUE=DATE:20261026','SUMMARY:Final']));
 const span=calendarEvents(source,now)[0];
 assert.deepEqual(eventDates(span,now),{multiple:true,dates:'Bugün – Yarın',times:'Tüm gün'});
 for(const day of ['2026-10-24','2026-10-25','2026-10-26']) {
  const view=calendarView(new URL('https://example.com/d/token?day='+day),now);
  const result=calendarEvents(source,now,view.range);
  assert.equal(result.length,day==='2026-10-26'?0:1);
 }
});
test('selected days retain earlier meetings and overlapping overnight events',()=>{
 const source=cal(
  event(['UID:past','DTSTART:20261023T060000Z','DTEND:20261023T070000Z','SUMMARY:Previous day'])+
  event(['UID:morning','DTSTART:20261024T060000Z','DTEND:20261024T070000Z','SUMMARY:Morning'])+
  event(['UID:overnight','DTSTART:20261023T220000','DTEND:20261024T020000','SUMMARY:Overnight'])+
  event(['UID:boundary','DTSTART:20261023T220000','DTEND:20261024T000000','SUMMARY:Ends at midnight']));
 const current=calendarView(new URL('https://example.com/d/token?day=2026-10-24'),now);
 assert.deepEqual(calendarEvents(source,now,current.range).map(e=>e.title),['Overnight','Morning']);
 const past=calendarView(new URL('https://example.com/d/token?day=2026-10-23'),now);
 assert.equal(calendarEvents(source,now,past.range).length,3);
});
test('month and year boundaries preserve exclusive end and default one-day duration',()=>{
 const event= {start:'2026-12-31T21:00:00Z',end:'2027-01-02T21:00:00Z',allDay:true};
 assert.equal(eventDates(event,now).dates,'1 Ocak – 2 Ocak');
 const oneDay=calendarEvents(cal('BEGIN:VEVENT\r\nUID:one\r\nDTSTART;VALUE=DATE:20261024\r\nSUMMARY:One\r\nEND:VEVENT\r\n'),now)[0];
 assert.equal(eventDates(oneDay,now).multiple,false);
 assert.equal(oneDay.end,'2026-10-24T21:00:00.000Z');
});
test('day selection returns home in 100 seconds without the normal minute refresh',()=>{
 const view=calendarView(new URL('https://example.com/d/token?day=2026-10-25'),now);
 const html=render({now,...view});
 assert.ok(html.includes('content="100;url=/d/token"'));
 assert.ok(html.includes('location.replace("/d/token");},100000)'));
 assert.ok(!html.includes('location.reload()'));
 assert.ok(html.includes('Bu gün için planlanmış etkinlik yok'));
 assert.ok(html.includes('href="/d/token?day=2026-10-25&amp;lang=tr"'));
 assert.ok(html.includes('25 Ekim'));
 const home=render({now,homeURL:'/d/token'});
 assert.ok(home.includes('location.reload();},60000)'));
 for(const day of ['2026-02-30','not-a-date','2026-13-01']) assert.equal(calendarView(new URL('https://example.com/d/token?day='+day),now).selectedDay,null);
});
test('busy selected days keep every event and paginate without extending the return deadline',()=>{
 const source=cal(Array.from({length:25},(_,i)=>event(['UID:event'+i,'DTSTART:20261024T120000Z','DTEND:20261024T130000Z','SUMMARY:Meeting '+String(i).padStart(2,'0')])).join(''));
 const view=calendarView(new URL('https://example.com/d/token?day=2026-10-24&page=4&until='+(+now+70000)),now);
 const events=mergeEvents(calendarEvents(source,now,view.range));
 assert.equal(events.length,25);
 const html=render({now,events,...view});
 assert.ok(html.includes('Meeting 24'));
 assert.ok(!html.includes('Meeting 23'));
 assert.ok(html.includes('5/5'));
 assert.ok(html.includes('until='+view.returnAt));
 assert.ok(html.includes('},70000)'));
});
test('expired selected views redirect to fresh upcoming agenda',async()=>{
 const response=await worker.fetch(new Request('https://example.com/d/expiry?day=2026-10-25&until=1'),{SCREEN_TOKEN:'expiry'});
 assert.equal(response.status,303);
 assert.equal(response.headers.get('location'),'/d/expiry');
});

test('rendered legacy client waits 100 seconds and navigates back to the live route',()=>{
 const view=calendarView(new URL('https://example.com/d/client-test?day=2026-10-25'),now);
 const html=render({now,...view});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 let callback,delay,destination;
 vm.runInNewContext(script,{setTimeout:(fn,ms)=>{callback=fn;delay=ms;},location:{replace:url=>{destination=url;}}});
 assert.equal(delay,100000);
 assert.equal(destination,undefined);
 callback();
 assert.equal(destination,'/d/client-test');
});

test('day-view labels use the selected day and omit completed days of a multi-day event',()=>{
 const final={title:'Final',start:'2026-10-23T21:00:00Z',end:'2026-10-25T21:00:00Z',allDay:true};
 assert.equal(eventDates(final,now,'2026-10-24').dates,'Bugün – Yarın');
 assert.equal(eventDates(final,now,'2026-10-25').dates,'Bugün');
 assert.equal(eventDates(final,now).dates,'Bugün – Yarın');
 const html=render({now,selectedDay:'2026-10-25',events:[final]});
 assert.ok(html.includes('<span>Bugün</span>'));
 assert.ok(!html.includes('Bugün – Yarın'));
 const overnight={...final,allDay:false,start:'2026-10-24T19:00:00Z',end:'2026-10-25T17:00:00Z'};
 assert.deepEqual(eventDates(overnight,now,'2026-10-25'),{multiple:false,dates:'Bugün',times:'Bitiş 20:00'});
});
