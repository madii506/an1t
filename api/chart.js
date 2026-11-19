// price history for a pool (GeckoTerminal OHLCV): ?pool=<address>&tf=15m|1h|4h|1d
const L = require('./_lib');
const TF = { '15m': ['minute', 15, 96], '1h': ['hour', 1, 72], '4h': ['hour', 4, 90], '1d': ['day', 1, 90] };
module.exports = async (req, res) => { try {
  const u = new URL(req.url, 'http://x'); const pool = u.searchParams.get('pool') || ''; const tf = TF[u.searchParams.get('tf')] ? u.searchParams.get('tf') : '1h';
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(pool)) return L.send(res, 400, { error: 'bad pool' });
  const [p, ag, lim] = TF[tf];
  const out = await L.cached(`c:${pool}:${tf}`, 60000, async () => { const j = await L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${p}?aggregate=${ag}&limit=${lim}&currency=usd`, { timeout: 8000 });
    const l = (j.data?.attributes?.ohlcv_list || []).map(r => ({ t: r[0] * 1000, o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] })).sort((a, b) => a.t - b.t); return { pool, tf, candles: l, at: Date.now() }; });
  L.send(res, 200, out, 30);
} catch (e) { L.send(res, 502, { error: String(e.message || e), candles: [] }); } };
