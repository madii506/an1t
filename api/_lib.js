// shared helpers: fetch with timeout + one retry on 429, a tiny in-memory cache, JSON replies
const C = new Map();
async function getJSON(u, o = {}) {
  for (let i = 0; i < 2; i++) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), o.timeout || 8000);
    try { const r = await fetch(u, { ...o, signal: ac.signal, headers: { accept: 'application/json', 'user-agent': 'an1t/1.0', ...(o.headers || {}) } });
      if (r.status === 429 && i === 0) { await new Promise(s => setTimeout(s, 700)); continue; }
      const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch (_) { throw new Error(`bad json from ${new URL(u).host} (${r.status})`); }
      if (!r.ok) throw new Error((j && (j.error?.message || j.error || j.message)) || `${new URL(u).host} ${r.status}`); return j; } finally { clearTimeout(t); } }
  throw new Error('rate limited'); }
async function cached(k, ms, fn) { const h = C.get(k); if (h && Date.now() - h.at < ms) return h.v; try { const v = await fn(); C.set(k, { at: Date.now(), v }); return v; } catch (e) { if (h) return h.v; throw e; } }
function send(res, code, obj, sMaxAge) { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', sMaxAge ? `public, s-maxage=${sMaxAge}, stale-while-revalidate=60` : 'no-store'); res.end(JSON.stringify(obj)); }
async function body(req) { if (req.body && typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (_) { return {}; } }
  let b = ''; for await (const c of req) b += c; try { return JSON.parse(b || '{}'); } catch (_) { return {}; } }
module.exports = { getJSON, cached, send, body };
