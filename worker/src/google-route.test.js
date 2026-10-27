import {test} from 'node:test';
import assert from 'node:assert/strict';
import {googleRoute} from './google-route.js';
const locations={home:'Example Home',work:'Example Office'};
test('live route uses traffic, departure now, private header key, and correct return direction',async()=>{
 let request;
 const route=await googleRoute('PRIVATE_TEST_KEY','home',new Date('2026-10-24T17:00:00Z'),async(url,options)=>{
  request={url,...options,body:JSON.parse(options.body)};
  return Response.json({routes:[{duration:'1800s',staticDuration:'1200s',distanceMeters:16000,polyline:{encodedPolyline:'_p~iF~ps|U_ulLnnqC_mqNvxq`@'}}]});
 },locations);
 assert.deepEqual(request.body.origin,{address:locations.work});assert.deepEqual(request.body.destination,{address:locations.home});assert.equal(request.body.computeAlternativeRoutes,true);assert.equal(request.body.routingPreference,'TRAFFIC_AWARE_OPTIMAL');assert.ok(!('departureTime' in request.body));
 assert.equal(request.headers['X-Goog-Api-Key'],'PRIVATE_TEST_KEY');assert.ok(!request.url.includes('PRIVATE_TEST_KEY'));
 assert.equal(route.seconds,1800);assert.equal(route.delaySeconds,600);assert.equal(route.points.length,3);assert.ok(!JSON.stringify(route).includes('PRIVATE_TEST_KEY'));
});
test('missing key makes no external calls and provider errors reveal no key',async()=>{
 assert.equal(await googleRoute(null,'work',new Date(),()=>{throw new Error('should not call');}),null);
 await assert.rejects(googleRoute('secret','work',new Date(),async()=>new Response('',{status:403}),locations),{message:'Route provider unavailable'});
 await assert.rejects(googleRoute('secret','work',new Date(),async()=>Response.json({routes:[]}),locations),{message:'Invalid route'});
});

test('selects the fastest returned traffic-aware route rather than the shortest distance',async()=>{
 const fixture={staticDuration:'900s',polyline:{encodedPolyline:'_p~iF~ps|U_ulLnnqC_mqNvxq`@'}};let body;
 const route=await googleRoute('PRIVATE_TEST_KEY','work',new Date(),async(url,options)=>{body=JSON.parse(options.body);return Response.json({routes:[{...fixture,duration:'2000s',distanceMeters:17000},{...fixture,duration:'1500s',distanceMeters:21000}]});},locations);
 assert.equal(route.seconds,1500);assert.equal(route.meters,21000);assert.deepEqual(body.origin,{address:locations.home});assert.deepEqual(body.destination,{address:locations.work});
});
