import fs from 'node:fs';
import {render} from '../worker/src/worker.js';
const now=new Date('2026-10-26T05:15:00Z');
// All fixtures are fictional; this build makes no calendar, weather or traffic API calls.
const titles={tr:['Haftaya birlikte başlayalım','Tasarım değerlendirmesi','Kütüphaneye uğra','Öğle arası yürüyüşü','Proje notlarını tamamla','Akşam yemeği'],en:['A good start to the week','Design review','Visit the library','A lunchtime walk','Finish the project notes','Dinner together']};
for(const language of ['tr','en']){
 const events=titles[language].map((title,i)=>({title,start:new Date(+now+i*3600000).toISOString(),end:new Date(+now+(i+1)*3600000).toISOString(),allDay:false}));
 const route={seconds:1440,meters:14200,delaySeconds:180,at:now.toISOString(),provider:language==='en'?'Example route':'Örnek rota',origin:'Example Home',destination:'Example Office',points:[[41.01,28.98],[41.012,28.984],[41.018,28.981],[41.023,28.99],[41.028,28.996],[41.033,28.992]]};
 const weather={current:{temperature_2m:18,weather_code:2},daily:{time:['2026-10-26','2026-10-27','2026-10-28'],weather_code:[2,3,61],temperature_2m_max:[21,20,19],temperature_2m_min:[14,13,12],precipitation_probability_max:[10,20,60]}};
 let html=render({now,language,appName:'Daybook',city:'İstanbul',homeURL:'/demo.html',events,weather,commute:{direction:'work',route,routes:{work:route,home:{...route,points:[...route.points].reverse()}},url:'/demo.html'}});
 html=html.replace(/<meta http-equiv="refresh"[^>]*>/,'').replace(/<script>[\s\S]*?<\/script>/,'');
 html=html.replace('</body>',`<script>window.addEventListener('message',function(event){if(event.origin!==location.origin||!event.data||event.data.type!=='daybook-name')return;document.querySelector('.brand').textContent=String(event.data.name).slice(0,40);});document.addEventListener('click',function(e){var a=e.target;while(a&&a.tagName!=='A')a=a.parentNode;if(a)e.preventDefault();});</script></body>`);
 html=html.replaceAll('Gerçek sürüş rotası','Örnek rota / illustrative route').replaceAll('Actual driving route','Illustrative route');
 html=html.replace('<title>Daybook</title>','<title>Daybook — fictional demo / örnek veriler</title>');
 fs.writeFileSync(new URL('../website/'+(language==='en'?'demo-en.html':'demo.html'),import.meta.url),html);
}
