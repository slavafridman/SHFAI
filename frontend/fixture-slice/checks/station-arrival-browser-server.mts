// Process-owned port0 servers. No environment/Oracle/EMS/private configuration.
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import type { Server } from 'node:http';
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from '../../../backend/fixture-slice/stage-arrival-sample.mts';
import { createStationArrivalFixture } from '../../../backend/fixture-slice/station-arrival-fixture.mts';
import { createRuntime } from '../../../backend/fixture-slice/synthetic-identity.mts';
import { createLoopbackServer } from '../../../backend/fixture-slice/http-adapter.mts';
import type { StationArrivalFixtureEnvelopeV1 } from '../../../backend/fixture-slice/station-arrival-contracts.mts';
export async function startStationBrowserServer(realFixture = false) {
  const root = resolve('dist/fixture-slice/browser');
  let backend: Server | undefined, backendPort = 0;
  let fixture: ReturnType<typeof createStationArrivalFixture> | undefined;
  const ui = createServer(async (req, res) => {
    if (req.url?.startsWith('/api/')) {
      if (!backendPort) { res.writeHead(503); res.end(); return; }
      const upstream = request({ host: '127.0.0.1', port: backendPort, method: req.method, path: req.url,
        headers: { ...req.headers, host: `127.0.0.1:${backendPort}` } },
      response => { res.writeHead(response.statusCode!, response.headers); response.pipe(res); });
      upstream.once('error', () => { res.writeHead(503); res.end(); }); req.pipe(upstream); return;
    }
    try {
      const path = resolve(root, '.' + new URL(req.url!, 'http://127.0.0.1').pathname);
      if (!path.startsWith(root + '/') && !path.startsWith(root + '\\') && path !== root) { res.writeHead(403); res.end(); return; }
      const file = extname(path) ? path : resolve(root, 'index.html');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' } as Record<string, string>)[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store' }); res.end(data);
    } catch { res.writeHead(404); res.end(); }
  });
  const close = async (server: Server) => {
    const closed = new Promise<void>(resolve => server.close(() => resolve()));
    server.closeAllConnections(); await closed;
  };
  try {
    ui.listen(0, '127.0.0.1'); await once(ui, 'listening');
    const address = ui.address(); if (!address || typeof address === 'string') throw Error('No owned UI address');
    const origin = `http://127.0.0.1:${address.port}`;
    if (realFixture) {
      const clock = { now: () => new Date('2026-10-20T07:22:06.000Z') };
      const envelope: StationArrivalFixtureEnvelopeV1 = {
        stageRows: [structuredClone(sampleStageArrivalFacts)], stationFacts: [{
          ...sampleStageArrivalFacts.selection, revision: 'f2-browser-original', stationArrivalUser: null,
          stationExitUser: null, stationLate: null, flagPresent: false, locked: false,
          fullDayExceptionPresent: false, overlappingShiftPresent: false, policyRevision: 'f2-browser-policy',
        }],
      };
      fixture = createStationArrivalFixture(envelope, clock, 'Asia/Jerusalem');
      const runtime = await createRuntime({ ...sampleStageArrivalConfig, attendanceStationArrivalMode: 'isolated-fixture' },
        fixture.detail, undefined, { reader: fixture.current, attendanceReader: fixture.attendance, stageArrivalStore: fixture.store, clock });
      backend = createLoopbackServer(runtime, { stageArrivalOrigins: [origin], stationArrivalOrigins: [origin] });
      backend.listen(0, '127.0.0.1'); await once(backend, 'listening');
      const address = backend.address(); if (!address || typeof address === 'string') throw Error('No owned fixture address');
      backendPort = address.port;
    }
    return { origin, inspect: () => fixture?.store.inspectSnapshot(),
      close: async () => { await close(ui); if (backend) await close(backend); } };
  } catch (e) { await close(ui); if (backend) await close(backend); throw e; }
}
