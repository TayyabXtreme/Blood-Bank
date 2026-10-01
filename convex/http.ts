import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { authComponent, createAuth } from './auth';
const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });
http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(
    async () =>
      new Response(JSON.stringify({ status: 'ok', app: 'BloodBank' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
  ),
});
export default http;
