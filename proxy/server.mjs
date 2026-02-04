/**
 * Proxy nhỏ để gọi Google Apps Script (tránh CORS + tránh phụ thuộc proxy công cộng).
 *
 * Chạy:
 *   node proxy/server.mjs
 *
 * Env:
 *   PORT=8787
 *
 * Frontend cấu hình:
 *   VITE_SHEET_PROXY_URL=http://localhost:8787
 * hoặc dán URL deploy lên Render/Vercel vào Cài đặt.
 */

import http from 'node:http';
import { URL } from 'node:url';

const port = Number(process.env.PORT || 8787);

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...headers,
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return send(res, 400, JSON.stringify({ ok: false, error: 'Missing url' }));

    if (req.method === 'OPTIONS') return send(res, 204, '');

    const u = new URL(req.url, `http://${req.headers.host}`);

    // GET /api/sheet?url=<encoded>
    if (req.method === 'GET' && u.pathname === '/api/sheet') {
      const target = u.searchParams.get('url');
      if (!target) return send(res, 400, JSON.stringify({ ok: false, error: 'Missing url param' }));

      const r = await fetch(target, { method: 'GET' });
      const text = await r.text();
      return send(res, r.status, text, { 'content-type': r.headers.get('content-type') || 'application/json' });
    }

    // POST /api/sheet  body: payload=...&target=<encoded>
    if (req.method === 'POST' && u.pathname === '/api/sheet') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf8');

      const params = new URLSearchParams(body);
      const target = params.get('target');
      if (!target) return send(res, 400, JSON.stringify({ ok: false, error: 'Missing target' }));

      params.delete('target');
      const forwardBody = params.toString();

      const r = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: forwardBody,
      });
      const text = await r.text();
      return send(res, r.status, text, { 'content-type': r.headers.get('content-type') || 'application/json' });
    }

    return send(res, 404, JSON.stringify({ ok: false, error: 'Not found' }));
  } catch (err) {
    return send(res, 500, JSON.stringify({ ok: false, error: String(err?.message || err) }));
  }
});

server.listen(port, () => {
  console.log(`Sheet proxy listening on http://localhost:${port}`);
});

