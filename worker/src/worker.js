import {translator,normalizeLanguage,formatDate} from './i18n.js';
import {commuteClient,routeDisplay} from './commute-client.js';
import {commuteCard,commuteCSS,routeMotion,commuteSelection} from './commute.js';
import {googleRoute} from './google-route.js';
import ICAL from 'ical.js';

const TZ = 'Europe/Istanbul';
const DAY = 86400000;
const dateFormat = formatDate;
const dateKey = date => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
const time = date => dateFormat(date, {hour:'2-digit', minute:'2-digit', hour12:false});
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// iCalendar floating dates and DATE values use the calendar's local day.
function instant(value) {
  if (value.isDate || value.zone === ICAL.Timezone.localTimezone) {
    return new Date(Date.UTC(value.year, value.month - 1, value.day, value.hour || 0, value.minute || 0, value.second || 0) - 3 * 3600000);
  }
  return value.toJSDate();
}

export function calendarEvents(source, now = new Date(), range = null) {
  const calendar = new ICAL.Component(ICAL.parse(source));
  for (const component of calendar.getAllSubcomponents('vtimezone')) {
    const tz = new ICAL.Timezone(component);
    ICAL.TimezoneService.register(tz.tzid, tz);
  }
  const today = dateKey(now);
  const dayStart = Date.parse(today + 'T00:00:00+03:00');
  const until = range ? +range.end : +now + 14 * DAY;
  const output = [];
  const components = calendar.getAllSubcomponents('vevent');
  const exceptions = new Map();
  for (const component of components) {
    if (component.hasProperty('recurrence-id')) {
      const uid = component.getFirstPropertyValue('uid');
      if (!exceptions.has(uid)) exceptions.set(uid, []);
      exceptions.get(uid).push(component);
    }
  }
  const add = (event, startValue, endValue) => {
    if (event.component.getFirstPropertyValue('status') === 'CANCELLED') return;
    const start = instant(startValue);
    const end = instant(endValue);
    const allDay = startValue.isDate;
    const cutoff = range ? +range.start : (allDay ? dayStart : +now);
    if (+start >= until || Math.max(+end,+start+1) <= cutoff) return;
    output.push({title:event.summary || '', location:event.location || '', start:start.toISOString(), end:end.toISOString(), allDay});
  };
  for (const component of components) {
    if (component.hasProperty('recurrence-id')) continue;
    const event = new ICAL.Event(component, {exceptions:exceptions.get(component.getFirstPropertyValue('uid')) || []});
    if (event.isRecurrenceException() || !event.startDate || component.getFirstPropertyValue('status') === 'CANCELLED') continue;
    if (!event.isRecurring()) {
      add(event, event.startDate, event.endDate);
      continue;
    }
    const iterator = event.iterator();
    // Keep the original DTSTART so COUNT and INTERVAL rules retain their meaning.
    let count = 0;
    let occurrence;
    while ((occurrence = iterator.next())) {
      if (++count > 50000) throw new Error('Recurrence expansion limit');
      if (+instant(occurrence) >= until) break;
      const details = event.getOccurrenceDetails(occurrence);
      add(details.item, details.startDate, details.endDate);
    }
  }
  // Exceptions can move an occurrence into this window from a later original date.
  for (const list of exceptions.values()) for (const component of list) {
    const event = new ICAL.Event(component);
    if (event.startDate) add(event,event.startDate,event.endDate);
  }
  const seen = new Set();
  return output.sort((a,b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title,'tr')).filter(event => {
    const key = JSON.stringify(event);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function mergeEvents(events) {
  const seen = new Set();
  return events.sort((a,b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title,'tr')).filter(event => {
    const key = JSON.stringify([event.title,event.start,event.end,event.allDay]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// DTEND is exclusive: an event ending at midnight belongs to the preceding day.
export function eventDates(event, now = new Date(), selectedDay = null, language='tr') {
  const t=translator(language),dateFormat=(date,options)=>formatDate(date,options,language);
  const start = new Date(event.start);
  const end = new Date(event.end);
  const lastDay = new Date(Math.max(+start,+end-1));
  const reference = selectedDay ? new Date(selectedDay+'T00:00:00+03:00') : now;
  const today = selectedDay || dateKey(now);
  const tomorrow = dateKey(new Date(+reference+DAY));
  const displayStart = selectedDay && dateKey(start) < selectedDay ? reference : start;
  const label = date => dateKey(date) === today ? t('Bugün') : dateKey(date) === tomorrow ? t('Yarın') : dateFormat(date,{day:'numeric',month:'long'});
  const multiple = dateKey(displayStart) !== dateKey(lastDay);
  const dates = multiple ? label(displayStart)+' – '+label(lastDay) : label(displayStart);
  const times = event.allDay ? t('Tüm gün') : selectedDay && dateKey(start) < selectedDay ? t('Bitiş')+' '+time(end) : time(start)+' – '+time(end);
  return {multiple,dates,times};
}

export function calendarView(url, now = new Date()) {
  const day = url.searchParams.get('day');
  const date = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(day+'T00:00:00+03:00') : null;
  if (!date || !Number.isFinite(+date) || dateKey(date) !== day) return {selectedDay:null,homeURL:url.pathname};
  const expiry = Number(url.searchParams.get('until'));
  return {selectedDay:day,homeURL:url.pathname,range:{start:date,end:new Date(+date+DAY)},
    page:Math.max(0,Math.min(100000,Math.floor(Number(url.searchParams.get('page')) || 0))),
    returnAt:expiry > 0 ? Math.min(expiry,+now+100000) : +now+100000};
}

const condition = (code,language='tr') => {
  const t=translator(language);
  if (code === 0) return t('Açık');
  if (code <= 2) return t('Parçalı bulutlu');
  if (code === 3) return t('Bulutlu');
  if (code <= 48) return t('Sisli');
  if (code <= 57) return t('Çisenti');
  if (code <= 67) return t('Yağmurlu');
  if (code <= 77) return t('Karlı');
  if (code <= 82) return t('Sağanak');
  if (code <= 86) return t('Kar sağanağı');
  return t('Gök gürültülü');
};

function weatherIcon(code, size = 38) {
  const clear = code === 0;
  const cloudy = code >= 3 && code <= 48;
  const rain = code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95;
  const snow = code >= 71 && code <= 77 || code >= 85 && code <= 86;
  const sun = '<circle cx="16" cy="16" r="6"/><path d="M16 3v3m0 20v3M3 16h3m20 0h3M7 7l2 2m14 14 2 2M7 25l2-2M23 9l2-2"/>';
  const cloud = '<path d="M12 27H7a5 5 0 0 1 0-10 8 8 0 0 1 15-3 6.5 6.5 0 1 1 1 13H12z"/>';
  const content = clear ? sun : (cloudy || rain || snow ? cloud : '<circle cx="11" cy="10" r="5"/>'+cloud) + (rain ? '<path d="m10 31-2 4m10-4-2 4m10-4-2 4"/>' : snow ? '<path d="M10 31v4m-2-2h4m10-2v4m-2-2h4"/>' : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 38" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

export function render({now = new Date(), events = [], weather = null, calendarError = false, weatherError = false, stale = false, selectedDay = null, homeURL = '', page = 0, returnAt = +now+100000, commute = null, appName='Daybook', city='İstanbul',language='tr'}) {
  language=normalizeLanguage(language);
  const t=translator(language),dateFormat=(date,options)=>formatDate(date,options,language);
  const liveURL=homeURL+(language==='en'?'?lang=en':'');
  const today = dateKey(now);
  const selected = selectedDay || today;
  const dayURL = day => homeURL+'?day='+day+'&lang='+language;
  const pages = Math.max(1,Math.ceil(events.length/6));
  page = Math.min(page,pages-1);
  const visible = selectedDay ? events.slice(page*6,page*6+6) : events.slice(0,6);
  const pageURL = number => dayURL(selectedDay)+'&page='+number+'&until='+returnAt;
  const heading = selectedDay ? escape(dateFormat(new Date(selectedDay+'T12:00:00+03:00'),{day:'numeric',month:'long'})) : t('Sıradaki');
  const note = selectedDay ? (page > 0 ? '<a class="agenda-control" href="'+escape(pageURL(page-1))+'">'+t('Önceki')+'</a> ' : '')+(pages > 1 ? (page+1)+'/'+pages+' ' : '')+(page+1 < pages ? '<a class="agenda-control" href="'+escape(pageURL(page+1))+'">'+t('Sonraki')+'</a> ' : '')+'<a class="agenda-control" href="'+escape(homeURL)+'">'+t('Şimdi')+'</a>' : t('Önümüzdeki 14 gün');
  const selectedRoute = commute?.selection?.manual;
  const manualView = selectedDay || selectedRoute;
  const refreshMS = manualView ? Math.max(0,Math.min(selectedDay ? returnAt : Infinity,selectedRoute ? commute.selection.returnAt : Infinity)-+now) : commute ? 600000 : 60000;
  const refreshTarget = manualView ? ';url='+escape(liveURL) : '';
  const current = weather?.current;
  const daily = weather?.daily;
  const anchor = new Date(today+'T12:00:00+03:00');
  const monday = new Date(+anchor - ((anchor.getUTCDay()+6)%7)*DAY);
  const week = (language==='en'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']).map((day,index) => {
    const date = new Date(+monday+index*DAY);
    return `<td${dateKey(date) === selected ? ' class="selected"' : ''}><a class="day-link" href="${escape(dayURL(dateKey(date)))}" aria-label="${escape(dateFormat(date,{day:'numeric',month:'long',weekday:'long'}))}"${dateKey(date) === selected ? ' aria-current="date"' : ''}><span class="week-name">${day}</span><span class="date-chip">${dateFormat(date,{day:'numeric'})}</span></a></td>`;
  }).join('');
  const next = visible[0];
  const nextDates = next && eventDates(next,now,selectedDay,language);
  const agenda = calendarError ? `<div class="empty">${t('Takvim şu anda alınamıyor.')}<small>${t('Birazdan yeniden denenecek.')}</small></div>` : !next ? `<div class="empty">${t('Takviminde boşluk var.')}<small>${selectedDay ? t('Bu gün için planlanmış etkinlik yok.') : t('Önümüzdeki 14 gün için planlanmış etkinlik yok.')}</small></div>` : `<article class="featured"><h2>${escape(next.title||t('İsimsiz etkinlik'))}</h2><div class="featured-meta"><span>${escape(nextDates.dates)}</span><span class="feature-time">${nextDates.times}</span></div></article><div class="event-list">${visible.slice(1).map(event => {
    const start = new Date(selectedDay ? selectedDay+'T12:00:00+03:00' : event.start);
    const details = eventDates(event,now,selectedDay,language);
    return `<article class="event"><div class="event-date"><strong>${dateFormat(start,{day:'numeric'})}</strong><span>${escape(dateFormat(start,{month:'short'}))}</span></div><div class="event-body"><h3>${escape(event.title||t('İsimsiz etkinlik'))}</h3><div class="event-meta">${details.multiple ? escape(details.dates)+' · ' : ''}${details.times}${event.location ? ' · '+escape(event.location) : ''}</div></div></article>`;
  }).join('')}</div>`;
  const forecast = daily ? daily.time.slice(0,3).map((date,index) => `<td><div class="forecast-day">${index === 0 ? t('Bugün') : index === 1 ? t('Yarın') : escape(dateFormat(new Date(date+'T12:00:00+03:00'),{weekday:'long'}))}</div><div class="forecast-value">${weatherIcon(daily.weather_code[index],30)}<strong>${Math.round(daily.temperature_2m_max[index])}°<span> / ${Math.round(daily.temperature_2m_min[index])}°</span></strong></div><div class="forecast-condition">${escape(condition(daily.weather_code[index],language))}</div><div class="rain">${t('Yağış')} ${language==='tr'?'%':''}${daily.precipitation_probability_max[index] ?? '—'}${language==='en'?'%':''}</div></td>`).join('') : `<td>${t('Hava durumu alınamadı.')}<br>${t('Birazdan yeniden denenecek.')}</td>`;
  const commuteHTML = commute ? '<div class="commute-region">'+['work','home'].map(direction=>'<div id="route-pane-'+direction+'" style="display:'+(direction===commute.direction?'block':'none')+'">'+commuteCard({now,direction,language,route:commute.routes?.[direction] ?? (direction===commute.direction?commute.route:null),url:commute.url})+'</div>').join('')+'</div>' : '';
  const commuteLayout = commute ? `.date-block{height:82px;margin-top:10px}.day-number{font-size:80px;letter-spacing:-2px}.month{font-size:27px}.weekday{font-size:16px}.week{margin-top:12px}.date-chip{width:36px;height:36px;line-height:36px;font-size:21px}.day-link{padding:6px 0}.week-name{margin-bottom:3px}.agenda-heading{margin-top:12px;margin-bottom:8px}.agenda{height:331px}.featured{height:108px;padding:14px 19px}.featured h2{font-size:25px;line-height:29px;max-height:58px}.featured-meta{font-size:14px;margin-top:6px}.event-list{padding-top:6px}.event{height:43px;padding:2px 0}.event-date strong{font-size:21px;line-height:23px}.event-date span{font-size:11px;line-height:12px}.event h3{font-size:18px;line-height:22px}.event-meta{font-size:12px;line-height:15px;margin-top:1px}.weather-section{margin-top:10px}.weather-section .section-heading{font-size:21px;line-height:26px}.forecast{margin-top:6px}.forecast-value{margin-top:4px}.forecast-value strong{font-size:23px}.forecast-condition{margin-top:3px;font-size:13px;line-height:17px;min-height:17px}.rain{font-size:12px;margin-top:1px}.footer{margin-top:10px;padding-top:7px}body{padding-top:18px;padding-bottom:4px}` : '';
  return `<!DOCTYPE html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="${Math.ceil(refreshMS/1000)}${refreshTarget}"><meta name="referrer" content="no-referrer"><title>${escape(appName)}</title><style>
@font-face{font-family:DaybookFont;src:url('/assets/manrope-400.ttf') format('truetype');font-weight:400;font-style:normal}
@font-face{font-family:DaybookFont;src:url('/assets/manrope-600.ttf') format('truetype');font-weight:600;font-style:normal}
@font-face{font-family:DaybookFont;src:url('/assets/manrope-700.ttf') format('truetype');font-weight:700;font-style:normal}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{font-family:DaybookFont,Arial,sans-serif;font-size:20px;font-weight:400;padding:24px 34px 24px;max-width:800px;margin:0 auto}h1,h2,h3,p{margin:0}table{border-collapse:collapse}::selection{background:#111;color:#fff}.brand-row{height:32px}.brand{float:left;max-width:75%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:25px;font-weight:700;letter-spacing:-.6px}.clock{float:right;font-size:25px;font-weight:600;letter-spacing:-.4px}.date-block{width:100%;margin-top:16px;height:104px}.date-block td{vertical-align:middle}.calendar-date{white-space:nowrap}.day-number{display:inline-block;font-size:104px;line-height:1;font-weight:600;letter-spacing:-4px;vertical-align:middle}.month-block{display:inline-block;vertical-align:middle;padding-left:17px}.month{font-size:30px;line-height:1.25;font-weight:600}.weekday{font-size:18px;color:#444;margin-top:5px}.weather-now{text-align:right;width:205px}.weather-city{font-size:17px;color:#444;margin-bottom:5px}.weather-main{white-space:nowrap}.weather-main svg{vertical-align:middle;margin-right:8px}.weather-main strong{font-size:43px;font-weight:600;vertical-align:middle;letter-spacing:-1px}.weather-desc{font-size:17px;margin-top:5px}.week{width:100%;table-layout:fixed;margin-top:16px;border-top:1px solid #bbb;border-bottom:1px solid #bbb}.week td{text-align:center;padding:0}.day-link{display:block;padding:8px 0;color:inherit;text-decoration:none}.day-link:focus,.agenda-control:focus{outline:2px solid #111;outline-offset:-2px}.agenda-control{display:inline-block;color:#111;text-decoration:underline;min-width:42px;padding:0 5px}.week-name{display:block;font-size:15px;color:#444;margin-bottom:5px}.date-chip{display:block;width:42px;height:42px;line-height:42px;margin:0 auto;font-size:23px;font-weight:600;border-radius:50%}.selected .date-chip{background:#111;color:white}.selected .week-name{font-weight:700;color:#111}.section-heading{font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.5px}.agenda-heading{margin-top:18px;margin-bottom:12px}.heading-note{float:right;font-size:16px;font-weight:400;color:#444;letter-spacing:0}.agenda{height:405px}.featured{background:#111;color:#fff;border-radius:14px;padding:21px 23px;height:137px;overflow:hidden}.featured h2{font-size:29px;font-weight:600;line-height:1.23;max-height:72px;overflow:hidden;letter-spacing:-.5px}.featured-meta{font-size:16px;margin-top:13px;line-height:22px;white-space:nowrap;overflow:hidden}.feature-time{float:right;padding-left:12px}.event-list{padding-top:8px}.event{height:52px;padding:4px 0;border-bottom:1px solid #ddd;overflow:hidden}.event:last-child{border-bottom:0}.event-date{float:left;width:62px;text-align:center;padding-right:13px}.event-date strong{display:block;font-size:24px;line-height:26px;font-weight:600}.event-date span{display:block;font-size:12px;line-height:14px;color:#444}.event-body{margin-left:75px}.event h3{font-size:20px;line-height:24px;max-height:24px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;letter-spacing:-.35px}.event-meta{font-size:14px;line-height:18px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#444}.empty{font-size:27px;padding:27px 0;line-height:1.4}.empty small{display:block;font-size:19px;margin-top:10px;line-height:1.5}.weather-section{margin-top:13px}.forecast{width:100%;table-layout:fixed;margin-top:12px}.forecast td{vertical-align:top;padding:0 16px;border-right:1px solid #ddd}.forecast td:first-child{padding-left:0}.forecast td:last-child{border:0;padding-right:0}.forecast-day{font-size:18px;font-weight:600}.forecast-value{margin-top:9px;white-space:nowrap}.forecast-value svg{vertical-align:middle;margin-right:4px}.forecast-value strong{font-size:26px;vertical-align:middle;font-weight:600;letter-spacing:-.4px}.forecast-value strong span{font-size:20px;font-weight:400;color:#444}.forecast-condition{font-size:15px;margin-top:7px;line-height:20px;min-height:20px}.rain{font-size:14px;color:#444;margin-top:3px}.footer{border-top:1px solid #bbb;margin-top:12px;padding-top:10px;font-size:13px;line-height:20px;color:#444}.status{font-weight:600;color:#111}
@media(max-width:600px){body{padding:22px}.brand,.clock{font-size:22px}.day-number{font-size:83px;letter-spacing:-3px}.month{font-size:25px}.month-block{padding-left:12px}.weather-now{width:160px}.weather-main strong{font-size:35px}.weather-main svg{width:30px;height:30px}.weather-desc{font-size:15px}.featured h2{font-size:25px}.event h3{font-size:19px}.forecast td{padding:0 9px}.forecast-value svg{display:none}.forecast-value strong{font-size:24px}.forecast-value strong span{font-size:18px}.heading-note{font-size:14px}}
${commuteCSS}${commuteLayout}
</style></head><body><header class="brand-row"><div class="brand">${escape(appName)}</div><time class="clock">${time(now)}</time></header><table class="date-block" aria-label="${t('Tarih ve güncel hava')}"><tr><td class="calendar-date"><div class="day-number">${dateFormat(now,{day:'numeric'})}</div><div class="month-block"><h1 class="month">${escape(dateFormat(now,{month:'long'}))}</h1><div class="weekday">${escape(dateFormat(now,{weekday:'long'}))}<br>${dateFormat(now,{year:'numeric'})}</div></div></td><td class="weather-now"><div class="weather-city">${escape(city)}</div><div class="weather-main">${current ? weatherIcon(current.weather_code)+`<strong>${Math.round(current.temperature_2m)}°</strong>` : '<strong>—</strong>'}</div><div class="weather-desc">${current ? escape(condition(current.weather_code,language)) : t('Veri bekleniyor')}</div></td></tr></table><table class="week" aria-label="${t('Bu hafta')}"><tr>${week}</tr></table><main><h2 class="section-heading agenda-heading">${heading}<span class="heading-note">${note}</span></h2><div class="agenda">${agenda}</div><section class="weather-section"><h2 class="section-heading">${t('Hava durumu')}<span class="heading-note">${escape(city)}</span></h2><table class="forecast" aria-label="${t('Üç günlük hava durumu')}"><tr>${forecast}</tr></table></section>${commuteHTML}</main><footer class="footer" data-server-time="${+now}">${t('Güncelleme')} ${time(now)}</footer><script>${commute ? commuteClient({now,homeURL,selectedDay,returnAt,commute,language}) : `setTimeout(function(){${selectedDay ? "location.replace("+JSON.stringify(liveURL).replace(/</g,'\\u003c')+");" : "location.reload();"}},${refreshMS});`}</script></body></html>`;
}

const upstreamCache = new Map();
async function loadCached(kind, url, ttl) {
  const key = kind + url;
  const old = upstreamCache.get(key);
  if (old && Date.now()-old.at < ttl) return {...old, stale:false};
  try {
    const response = await fetch(url, {signal:AbortSignal.timeout(12000), headers:{'Accept':kind === 'calendar' ? 'text/calendar' : 'application/json'}});
    if (!response.ok) throw new Error('Upstream unavailable');
    const data = kind === 'calendar' ? await response.text() : await response.json();
    if (kind === 'calendar' && !data.includes('BEGIN:VCALENDAR')) throw new Error('Invalid calendar');
    if (kind === 'weather' && (!data.current || !data.daily)) throw new Error('Invalid weather');
    const result = {data,at:Date.now()};
    upstreamCache.set(key,result);
    return {...result,stale:false};
  } catch {
    if (old && Date.now()-old.at < 6*3600000) return {...old,stale:true};
    return {data:null,stale:false};
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok', {headers:{'Cache-Control':'no-store'}});
    if (!env.SCREEN_TOKEN || url.pathname !== '/d/'+env.SCREEN_TOKEN || !['GET','HEAD'].includes(request.method)) return new Response('Not found',{status:404});
    if(request.method==='HEAD')return new Response(null,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store'}});
    const now = new Date();
    const language=normalizeLanguage(url.searchParams.get('lang')||env.APP_LANGUAGE);
    if(url.searchParams.get('partial')==='traffic') {
      const direction=url.searchParams.get('route');
      if(!env.GOOGLE_MAPS_API_KEY || !['work','home'].includes(direction))return new Response('Not found',{status:404});
      try {const route=await googleRoute(env.GOOGLE_MAPS_API_KEY,direction,now,fetch,{home:env.HOME_ADDRESS,work:env.WORK_ADDRESS});return Response.json(routeDisplay(route,now,direction,url.pathname,language),{headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});}
      catch {return new Response('Route unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
    }
    const view = calendarView(url,now);
    if (view.selectedDay && view.returnAt <= +now) return new Response(null,{status:303,headers:{Location:url.pathname,'Cache-Control':'no-store'}});
    const latitude=Number(env.WEATHER_LAT??41.0082),longitude=Number(env.WEATHER_LON??28.9784);
    if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return new Response('Invalid weather coordinates',{status:503});
    const weatherURL = 'https://api.open-meteo.com/v1/forecast?latitude='+latitude+'&longitude='+longitude+'&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FIstanbul&forecast_days=3';
    const sources = [...new Set([env.ICAL_URL, env.SHARED_ICAL_URL].filter(Boolean))];
    const selection=commuteSelection(url,now);
    const trafficEnabled=Boolean(env.GOOGLE_MAPS_API_KEY && env.HOME_ADDRESS && env.WORK_ADDRESS) && url.searchParams.get('partial')!=='calendar';
    const [calendars,weather,routes] = await Promise.all([
      Promise.all(sources.map(source => loadCached('calendar',source,5*60000))),
      loadCached('weather',weatherURL,10*60000),
      trafficEnabled ? Promise.all(['work','home'].map(direction=>googleRoute(env.GOOGLE_MAPS_API_KEY,direction,now,fetch,{home:env.HOME_ADDRESS,work:env.WORK_ADDRESS}).catch(()=>null))).then(values=>({work:values[0],home:values[1]})) : null
    ]);
    const events = [];
    let available = 0;
    for (const calendar of calendars) {
      if (!calendar.data) continue;
      try { events.push(...calendarEvents(calendar.data,now,view.range)); available++; } catch {}
    }
    const merged = mergeEvents(events);
    const calendarError = available === 0;
    return new Response(request.method === 'HEAD' ? null : render({now,language,appName:env.APP_NAME||'Daybook',city:env.WEATHER_CITY||'İstanbul',...view,events:merged,weather:weather.data,commute:trafficEnabled?{route:routes[selection.direction],routes,direction:selection.direction,selection,url:request.url}:null,calendarError,weatherError:!weather.data,stale:calendars.some(calendar => calendar.stale) || weather.stale}),{headers:{
      'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'private, no-store', 'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'
    }});
  }
};
