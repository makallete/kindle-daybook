import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{render} from './worker.js';
import {googleRoute} from './google-route.js';
test('custom display name and city are escaped in the public rendering',()=>{
 const html=render({appName:'My <Day>',city:'A & B'});
 assert.ok(html.includes('<div class="brand">My &lt;Day&gt;</div>'));
 assert.ok(html.includes('<div class="weather-city">A &amp; B</div>'));
 assert.ok(!html.includes('My <Day>'));
});
test('traffic stays disabled until both user locations exist',async()=>{
 let calls=0;
 assert.equal(await googleRoute('test','home',new Date(),()=>{calls++;},{home:'Home'}),null);
 assert.equal(calls,0);
});
test('invalid weather coordinates fail before requesting an upstream service',async()=>{
 const r=await worker.fetch(new Request('https://example.test/d/test-token'),{SCREEN_TOKEN:'test-token',WEATHER_LAT:'999'});
 assert.equal(r.status,503);
});
