// the board: the Anthropic token, every coin trading against it, and what's trending on Solana right now (Dexscreener + Jupiter, live)
const L = require('./_lib');
const ANTH = 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw';
const DS = 'https://api.dexscreener.com';
const MAJOR = /^(sol|wsol|usdc|usdt|usd1|pyusd|jup|jlp|btc|wbtc|cbbtc|eth|weth|msol|jitosol|bsol|inf|ray|bonk)$/i;
const STOCK = t => /^[A-Z]{1,6}x$/.test(t.symbol || '') || /xstock|tokenized|\bstock\b|\binc\.?$|\bcorp|holdings|class a|\betf\b|prestocks/i.test(t.name || '') || (t.tags || []).some(g => /stock|rwa/i.test(g));
const pair = p => ({ pair: p.pairAddress, dex: p.dexId, mint: p.baseToken.address, sym: p.baseToken.symbol, name: p.baseToken.name, quote: p.quoteToken.symbol, icon: p.info?.imageUrl || null,
  price: +p.priceUsd || 0, mcap: p.marketCap || p.fdv || 0, liq: p.liquidity?.usd || 0, vol24: p.volume?.h24 || 0, vol1h: p.volume?.h1 || 0, ch5m: p.priceChange?.m5 ?? null, ch1h: p.priceChange?.h1 ?? null, ch24h: p.priceChange?.h24 ?? null,
  buys: p.txns?.h24?.buys || 0, sells: p.txns?.h24?.sells || 0, created: p.pairCreatedAt || null, url: p.url, x: (p.info?.socials || []).find(s => s.type === 'twitter')?.url || null, site: (p.info?.websites || [])[0]?.url || null });
const jtok = t => { const s5 = t.stats5m || {}, s1 = t.stats1h || {}, s24 = t.stats24h || {};
  return { mint: t.id, sym: t.symbol, name: t.name, icon: t.icon || null, price: t.usdPrice || 0, mcap: t.mcap || 0, liq: t.liquidity || 0, holders: t.holderCount || 0, organic: Math.round(t.organicScore || 0),
    ch5m: s5.priceChange ?? null, ch1h: s1.priceChange ?? null, ch24h: s24.priceChange ?? null, vol1h: (s1.buyVolume || 0) + (s1.sellVolume || 0), vol24: (s24.buyVolume || 0) + (s24.sellVolume || 0),
    buys1h: s1.numBuys || 0, sells1h: s1.numSells || 0, pad: t.launchpad || null, created: t.createdAt || t.firstPool?.createdAt || null, sus: !!t.audit?.isSus,
    mintOff: t.audit?.mintAuthorityDisabled ?? null, freezeOff: t.audit?.freezeAuthorityDisabled ?? null, top10: t.audit?.topHoldersPercentage ?? null, verified: !!t.isVerified }; };
module.exports = async (req, res) => { try {
  const out = await L.cached('market', 25000, async () => {
    const [own, pools, trend, organic] = await Promise.allSettled([
      L.getJSON(`${DS}/tokens/v1/solana/${ANTH}`), L.getJSON(`${DS}/token-pairs/v1/solana/${ANTH}`),
      L.getJSON('https://lite-api.jup.ag/tokens/v2/toptrending/1h?limit=40'), L.getJSON('https://lite-api.jup.ag/tokens/v2/toporganicscore/5m?limit=40')]);
    let anthropic = null;
    if (own.status === 'fulfilled' && Array.isArray(own.value) && own.value.length) { const ps = own.value.filter(p => p.baseToken.address === ANTH).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const top = ps[0]; if (top) anthropic = { ...pair(top), pool: top.pairAddress, vol24: ps.reduce((a, p) => a + (p.volume?.h24 || 0), 0), liq: ps.reduce((a, p) => a + (p.liquidity?.usd || 0), 0), pools: ps.length }; }
    const seen = new Map();
    for (const src of [pools, own]) if (src.status === 'fulfilled' && Array.isArray(src.value)) for (const p of src.value) if (p.quoteToken?.address === ANTH && p.baseToken.address !== ANTH) { const c = pair(p); const o = seen.get(c.mint); if (!o || c.liq > o.liq) seen.set(c.mint, c); }
    const paired = [...seen.values()].sort((a, b) => b.mcap - a.mcap).slice(0, 40);
    const tm = new Map();
    for (const src of [trend, organic]) if (src.status === 'fulfilled' && Array.isArray(src.value)) for (const t of src.value) { const x = jtok(t); if (!x.mint || STOCK(t) || MAJOR.test(x.sym) || x.sus || x.liq < 8000 || x.mcap < 30000 || tm.has(x.mint)) continue; tm.set(x.mint, x); }
    const trending = [...tm.values()].sort((a, b) => b.vol1h - a.vol1h).slice(0, 30);
    if (!anthropic && !trending.length) throw new Error('market data unavailable');
    return { anthropic, paired, trending, at: Date.now(), partial: [own, pools, trend, organic].some(s => s.status !== 'fulfilled') };
  });
  L.send(res, 200, out, 15);
} catch (e) { L.send(res, 502, { error: String(e.message || e) }); } };
