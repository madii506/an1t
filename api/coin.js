// the scanner: everything public about one coin (Dexscreener pairs + Jupiter token data) and plain risk flags
const L = require('./_lib');
module.exports = async (req, res) => { try {
  const mint = new URL(req.url, 'http://x').searchParams.get('mint') || '';
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return L.send(res, 400, { error: 'not a Solana mint address' });
  const out = await L.cached('coin:' + mint, 20000, async () => {
    const [ds, jp] = await Promise.allSettled([L.getJSON('https://api.dexscreener.com/tokens/v1/solana/' + mint), L.getJSON('https://lite-api.jup.ag/tokens/v2/search?query=' + mint)]);
    const pairs = ds.status === 'fulfilled' && Array.isArray(ds.value) ? ds.value.filter(p => p.baseToken?.address === mint).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)) : [];
    const t = jp.status === 'fulfilled' && Array.isArray(jp.value) ? jp.value.find(x => x.id === mint) : null; const p = pairs[0];
    if (!p && !t) throw new Error('no market found for this mint');
    const s1 = t?.stats1h || {}, s24 = t?.stats24h || {}, a = t?.audit || {};
    const c = { mint, sym: p?.baseToken.symbol || t?.symbol, name: p?.baseToken.name || t?.name, icon: p?.info?.imageUrl || t?.icon || null, price: +(p?.priceUsd || t?.usdPrice || 0), mcap: p?.marketCap || t?.mcap || 0, liq: pairs.reduce((x, q) => x + (q.liquidity?.usd || 0), 0) || t?.liquidity || 0,
      vol24: pairs.reduce((x, q) => x + (q.volume?.h24 || 0), 0), vol1h: pairs.reduce((x, q) => x + (q.volume?.h1 || 0), 0), ch5m: p?.priceChange?.m5 ?? null, ch1h: p?.priceChange?.h1 ?? null, ch6h: p?.priceChange?.h6 ?? null, ch24h: p?.priceChange?.h24 ?? null,
      buys24: p?.txns?.h24?.buys || 0, sells24: p?.txns?.h24?.sells || 0, buys1h: p?.txns?.h1?.buys ?? s1.numBuys ?? 0, sells1h: p?.txns?.h1?.sells ?? s1.numSells ?? 0, holders: t?.holderCount || null, organic: t ? Math.round(t.organicScore || 0) : null,
      created: p?.pairCreatedAt || t?.createdAt || null, quote: p?.quoteToken?.symbol || null, dex: p?.dexId || null, pool: p?.pairAddress || null, pools: pairs.length, url: p?.url || null,
      x: (p?.info?.socials || []).find(s => s.type === 'twitter')?.url || t?.twitter || null, site: (p?.info?.websites || [])[0]?.url || t?.website || null,
      mintOff: a.mintAuthorityDisabled ?? null, freezeOff: a.freezeAuthorityDisabled ?? null, top10: a.topHoldersPercentage ?? null, sus: !!a.isSus, verified: !!t?.isVerified, traders24: s24.numTraders || null };
    const F = []; const add = (lvl, txt) => F.push({ lvl, txt });
    if (c.sus) add('bad', 'Jupiter flags this token as suspicious');
    if (c.mintOff === false) add('bad', 'mint authority is still on: more tokens can be printed'); else if (c.mintOff) add('ok', 'mint authority off');
    if (c.freezeOff === false) add('bad', 'freeze authority is on: wallets can be frozen'); else if (c.freezeOff) add('ok', 'freeze authority off');
    if (c.top10 != null) add(c.top10 > 45 ? 'bad' : c.top10 > 25 ? 'warn' : 'ok', `top 10 holders own ${c.top10.toFixed(1)}%`);
    if (c.mcap && c.liq) add(c.liq / c.mcap < .03 ? 'warn' : 'ok', `liquidity is ${(c.liq / c.mcap * 100).toFixed(1)}% of market cap`);
    if (c.buys24 + c.sells24) add(c.sells24 > c.buys24 * 1.4 ? 'warn' : 'ok', `${c.buys24} buys vs ${c.sells24} sells in 24h`);
    if (c.organic != null) add(c.organic < 20 ? 'warn' : 'ok', `organic score ${c.organic}/100`);
    if (c.created) { const h = (Date.now() - c.created) / 36e5; add(h < 2 ? 'warn' : 'ok', `trading for ${h < 48 ? h.toFixed(1) + ' hours' : Math.round(h / 24) + ' days'}`); }
    if (c.quote === 'ANTHROPIC') add('ok', 'paired to $ANTHROPIC');
    const bad = F.filter(f => f.lvl === 'bad').length, warn = F.filter(f => f.lvl === 'warn').length;
    return { coin: c, flags: F, grade: bad ? 'red' : warn > 1 ? 'amber' : 'green', at: Date.now() };
  });
  L.send(res, 200, out, 10);
} catch (e) { L.send(res, 502, { error: String(e.message || e) }); } };
