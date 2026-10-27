import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commuteSlots,scheduledSlot,turkeyDay} from './commute-schedule.js';
test('weekdays allocate exactly 36 outbound, 36 inbound peak calls and 14 each off peak',()=>{
 for(let weekday=1;weekday<=5;weekday++){
  const slots=commuteSlots(weekday);assert.equal(slots.work.length,50);assert.equal(slots.home.length,50);
  assert.equal(new Set(slots.work).size,50);assert.equal(new Set(slots.home).size,50);
  assert.deepEqual(slots.work.filter(m=>m>=480&&m<660),Array.from({length:36},(_,i)=>480+5*i));
  assert.deepEqual(slots.home.filter(m=>m>=900&&m<1080),Array.from({length:36},(_,i)=>900+5*i));
  for(const [dir,start,end] of [['work',480,660],['home',900,1080]]){
   const off=slots[dir].filter(m=>m<start||m>=end);assert.equal(off.length,14);
   const normalized=off.map(m=>m>=end?m-(end-start):m);const length=1440-(end-start);
   const gaps=normalized.map((m,i)=>(normalized[(i+1)%14]-m+length)%length);assert.ok(Math.max(...gaps)-Math.min(...gaps)<=5);
  }
 }
});
test('weekends request both directions once per hour, 48 queries in total',()=>{
 for(const weekday of [0,6])for(const slots of Object.values(commuteSlots(weekday)))assert.deepEqual(slots,Array.from({length:24},(_,i)=>60*i));
});
test('scheduling follows Istanbul midnight and does not replay missed slots',()=>{
 const before=new Date('2026-10-25T20:59:00Z'),after=new Date('2026-10-25T21:00:00Z');
 assert.equal(turkeyDay(before).weekday,0);assert.equal(turkeyDay(after).weekday,1);
 assert.equal(scheduledSlot('work',new Date('2026-10-26T05:04:00Z')),'2026-10-26:work:480');
 assert.equal(scheduledSlot('work',new Date('2026-10-26T05:05:00Z')),'2026-10-26:work:485');
});
