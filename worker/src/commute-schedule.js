export function turkeyDay(now=new Date()) {
 const local=new Date(+now+3*3600000);
 return {day:local.toISOString().slice(0,10),weekday:local.getUTCDay(),minute:local.getUTCHours()*60+local.getUTCMinutes()};
}
export function commuteSlots(weekday) {
 if(weekday===0||weekday===6){const hours=Array.from({length:24},(_,i)=>i*60);return {work:hours,home:[...hours]};}
 const slots=(start,end)=>{
  const peak=Array.from({length:(end-start)/5},(_,i)=>start+i*5);
  const off=Array.from({length:288},(_,i)=>i*5).filter(m=>m<start||m>=end);
  const spread=Array.from({length:14},(_,i)=>off[Math.floor(i*off.length/14)]);
  return [...peak,...spread].sort((a,b)=>a-b);
 };
 return {work:slots(480,660),home:slots(900,1080)};
}
export function scheduledSlot(direction,now=new Date()) {
 const {day,weekday,minute}=turkeyDay(now);const slots=commuteSlots(weekday)[direction];
 return day+':'+direction+':'+slots.filter(m=>m<=minute).at(-1);
}
