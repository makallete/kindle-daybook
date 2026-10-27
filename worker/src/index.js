import worker from './worker.js';
import regular from '../assets/manrope-400.ttf';
import semibold from '../assets/manrope-600.ttf';
import bold from '../assets/manrope-700.ttf';
const fonts = new Map([
  ['/assets/manrope-400.ttf',regular],
  ['/assets/manrope-600.ttf',semibold],
  ['/assets/manrope-700.ttf',bold]
]);
export default {
  fetch(request,env,ctx) {
    const font = fonts.get(new URL(request.url).pathname);
    if (font && ['GET','HEAD'].includes(request.method)) {
      return new Response(request.method === 'HEAD' ? null : font,{headers:{'Content-Type':'font/ttf','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
    }
    return worker.fetch(request,env,ctx);
  }
};
