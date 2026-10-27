import {decodePolyline} from './commute.js';
// Fetch on initial load and scheduled commute slots, never on minute calendar updates.
// No Google route responses are stored in the Worker, KV, D1 or logs.
export async function googleRoute(key,direction,now=new Date(),fetcher=fetch,locations={}) {
 if(!key||!locations.home||!locations.work)return null;
 const origin=direction==='work'?'home':'work';
 const response=await fetcher('https://routes.googleapis.com/directions/v2:computeRoutes',{
  method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline'},
  signal:AbortSignal.timeout(12000),
  body:JSON.stringify({origin:{address:locations[origin]},destination:{address:locations[direction]},travelMode:'DRIVE',routingPreference:'TRAFFIC_AWARE_OPTIMAL',computeAlternativeRoutes:true,polylineQuality:'OVERVIEW',polylineEncoding:'ENCODED_POLYLINE',languageCode:'tr-TR',regionCode:'TR'})
 });
 if(!response.ok)throw new Error('Route provider unavailable');
 const data=await response.json();
 // Choose the shortest traffic-aware duration among Google's returned alternatives.
 const route=(data.routes||[]).filter(r=>Number(String(r.duration).replace(/s$/,''))>0 && r.distanceMeters>0).sort((a,b)=>Number(String(a.duration).replace(/s$/,''))-Number(String(b.duration).replace(/s$/,'')))[0];
 const seconds=Number(String(route?.duration).replace(/s$/,''));const normal=Number(String(route?.staticDuration).replace(/s$/,''));
 if(!Number.isFinite(seconds)||seconds<=0||!Number.isFinite(route?.distanceMeters)||route.distanceMeters<=0)throw new Error('Invalid route');
 return {origin:locations[origin],destination:locations[direction],provider:'Google Maps',seconds,meters:route.distanceMeters,delaySeconds:Number.isFinite(normal)?Math.max(0,seconds-normal):0,points:decodePolyline(route.polyline?.encodedPolyline),at:now.toISOString()};
}
