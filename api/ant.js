// the ant's brain: reads the live market it's given and the owner's mandate, picks one move (buy / sell / wait) with its reasons.
// Thinks with an Anthropic model through the Vercel AI Gateway; if that's unavailable it falls back to plain rules and says so.
const L = require('./_lib');
const MODELS = { careful: 'anthropic/claude-haiku-4.5', steady: 'anthropic/claude-haiku-4.5', antsy: 'anthropic/claude-haiku-4.5' };
const STYLE = { careful: { minOrg: 60, minLiq: 60000, maxCh1h: 60, tp: 25, sl: 12 }, steady: { minOrg: 40, minLiq: 25000, maxCh1h: 150, tp: 40, sl: 18 }, antsy: { minOrg: 20, minLiq: 10000, maxCh1h: 600, tp: 80, sl: 25 } };
const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
function rules(b) { const S = STYLE[b.style] || STYLE.steady, held = b.held || [], coins = b.coins || [];
  for (const h of held) { const c = coins.find(x => x.mint === h.mint) || h; const pnl = h.entry ? (num(c.price) / h.entry - 1) * 100 : 0;
    if (pnl >= S.tp) return { action: 'sell', mint: h.mint, sym: h.sym, reason: `up ${pnl.toFixed(0)}% from entry, past the ${S.tp}% take-profit in your mandate` };
    if (pnl <= -S.sl) return { action: 'sell', mint: h.mint, sym: h.sym, reason: `down ${Math.abs(pnl).toFixed(0)}% from entry, past the ${S.sl}% stop` }; }
  const words = String(b.mandate || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  const ok = coins.filter(c => !held.some(h => h.mint === c.mint) && num(c.organic) >= S.minOrg && num(c.liq) >= S.minLiq && num(c.ch1h) > 0 && num(c.ch1h) <= S.maxCh1h && num(c.buys1h) >= num(c.sells1h));
  const score = c => num(c.organic) + Math.min(40, num(c.ch1h) / 4) + Math.log10(1 + num(c.vol1h)) * 6 + (words.some(w => `${c.sym} ${c.name}`.toLowerCase().includes(w)) ? 40 : 0);
  ok.sort((a, b2) => score(b2) - score(a)); const p = ok[0];
  if (!p) return { action: 'wait', reason: 'nothing on the board passes your mandate right now (organic score, liquidity, momentum)' };
  return { action: 'buy', mint: p.mint, sym: p.sym, reason: `$${p.sym}: up ${num(p.ch1h).toFixed(0)}% in 1h, organic score ${p.organic}, $${num(p.liq) >= 1e6 ? (num(p.liq) / 1e6).toFixed(1) + "M" : Math.round(num(p.liq) / 1000) + "K"} liquidity, more buys than sells` }; }
async function model(token, sys, user, max = 500) { const content = typeof user === 'string' ? user : JSON.stringify(user);
  if (process.env.ANTHROPIC_API_KEY) { const r = await L.getJSON('https://api.anthropic.com/v1/messages', { method: 'POST', timeout: 20000, headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5', max_tokens: max, system: sys, messages: [{ role: 'user', content }] }) }); return (r.content || []).map(c => c.text || '').join(''); }
  const r = await L.getJSON('https://ai-gateway.vercel.sh/v1/chat/completions', { method: 'POST', timeout: 20000, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELS.steady, max_tokens: max, temperature: .5, messages: [{ role: 'system', content: sys }, { role: 'user', content }] }) }); return r.choices?.[0]?.message?.content || ''; }
const fmt = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K';
async function chat(b, token) { const ctx = b.context || {}; const q = String(b.q || '').slice(0, 500);
  if (token) try { const sys = `You are ${String(b.name || 'An1t').slice(0, 24)}, a small ant trading agent on Solana inside the An1t terminal. Owner's mandate: "${String(b.mandate || '').slice(0, 400)}". Risk: ${b.style}. Answer the owner briefly (max 4 sentences), in character but clear, using only the live data given. Never promise profits. If asked about Anthropic: An1t is independent; $ANTHROPIC is a third-party pre-IPO token (PreStocks), not a share.`;
    const a = await model(token, sys, { question: q, live: ctx }, 350); if (a) return { answer: a.trim().slice(0, 900), source: 'model', model: MODELS.steady }; } catch (_) {}
  const t = (ctx.trending || []).slice().sort((x, y) => (y.ch1h || 0) - (x.ch1h || 0)); const an = ctx.anthropic;
  const lines = []; if (/anthrop|pair|ipo/i.test(q) && an) lines.push(`$ANTHROPIC is at $${(+an.price).toFixed(2)}, ${an.ch24h >= 0 ? '+' : ''}${(+an.ch24h).toFixed(1)}% in 24h, ${fmt(an.vol24 || 0)} traded.`);
  if (t.length) lines.push(`Hottest on my board: $${t[0].sym} (${(+t[0].ch1h).toFixed(0)}% in 1h)${t[1] ? `, then $${t[1].sym} (${(+t[1].ch1h).toFixed(0)}%)` : ''}.`);
  lines.push((b.held || []).length ? `I'm holding ${(b.held || []).map(h => '$' + h.sym).join(', ')}.` : 'I hold nothing right now.');
  lines.push(`My mandate says: ${String(b.mandate || 'none set').slice(0, 140)}`);
  return { answer: lines.join(' '), source: 'rules' }; }
async function judge(b, token) { const c = b.coin || {}, flags = Array.isArray(b.flags) ? b.flags.slice(0, 12) : [];
  if (token) try { const sys = 'You are an ant trading agent judging ONE Solana coin for your owner. Use only the data given. Reply JSON only: {"verdict":"buy|watch|avoid","reason":"two plain sentences with the numbers that matter"}';
    const t = await model(token, sys, { mandate: String(b.mandate || '').slice(0, 400), style: b.style, coin: c, flags }, 250); const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
    if (['buy', 'watch', 'avoid'].includes(j.verdict)) return { verdict: j.verdict, reason: String(j.reason || '').slice(0, 400), source: 'model', model: MODELS.steady }; } catch (_) {}
  const bad = flags.filter(f => f.lvl === 'bad').length, warn = flags.filter(f => f.lvl === 'warn').length;
  const v = bad ? 'avoid' : warn > 1 || (c.ch1h ?? 0) < 0 ? 'watch' : 'buy';
  return { verdict: v, reason: bad ? `Red flags: ${flags.filter(f => f.lvl === 'bad').map(f => f.txt).join('; ')}.` : v === 'watch' ? `Mixed signals: ${flags.filter(f => f.lvl === 'warn').map(f => f.txt).join('; ') || 'momentum is negative'}.` : `Clean flags, ${(c.ch1h ?? 0).toFixed(0)}% in 1h, ${fmt(c.liq || 0)} liquidity.`, source: 'rules' }; }
module.exports = async (req, res) => { try {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'POST only' });
  const b = await L.body(req); const tk = process.env.ANTHROPIC_API_KEY || req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (b.mode === 'chat') return L.send(res, 200, await chat(b, tk));
  if (b.mode === 'judge') return L.send(res, 200, await judge(b, tk)); const style = STYLE[b.style] ? b.style : 'steady'; const size = Math.max(0.01, Math.min(5, num(b.size, .05)));
  const coins = (Array.isArray(b.coins) ? b.coins : []).slice(0, 14).map(c => ({ mint: String(c.mint || ''), sym: String(c.sym || '').slice(0, 16), name: String(c.name || '').slice(0, 40), price: num(c.price), mcap: Math.round(num(c.mcap)), liq: Math.round(num(c.liq)), organic: num(c.organic), ch5m: num(c.ch5m), ch1h: num(c.ch1h), ch24h: num(c.ch24h), vol1h: Math.round(num(c.vol1h)), buys1h: num(c.buys1h), sells1h: num(c.sells1h), holders: num(c.holders) }));
  const held = (Array.isArray(b.held) ? b.held : []).slice(0, 10).map(h => ({ mint: String(h.mint || ''), sym: String(h.sym || '').slice(0, 16), entry: num(h.entry), price: num(h.price) }));
  const brief = { ant: String(b.name || 'An1t').slice(0, 24), mandate: String(b.mandate || '').slice(0, 600), style, tradeSizeSOL: size, limits: STYLE[style], holding: held, board: coins };
  const token = tk;
  let out = null, source = 'rules', mdl = null;
  if (token) try {
    const sys = 'You are the trading brain of an ant agent on Solana. You get the owner\'s mandate, risk limits, current holdings and a live board of coins. Pick exactly ONE move. Respect the mandate and limits strictly; when in doubt, wait. Never invent coins: only use mints from the board or holdings. Reply with JSON only: {"action":"buy|sell|wait","mint":"...","sym":"...","reason":"one or two plain sentences with the numbers that matter","thoughts":["short line","short line","short line"]}';
    const txt = await model(token, sys, brief, 500); const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    if (['buy', 'sell', 'wait'].includes(j.action)) { if (j.action === 'wait' || coins.some(c => c.mint === j.mint) || held.some(h => h.mint === j.mint)) { out = j; source = 'model'; mdl = process.env.ANTHROPIC_API_KEY ? (process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5') : MODELS[style]; } }
  } catch (e) { out = null; b._err = String(e.message || e).slice(0, 160); }
  if (!out) out = rules({ ...b, style, coins, held });
  const sym = out.sym || (coins.find(c => c.mint === out.mint) || held.find(h => h.mint === out.mint) || {}).sym;
  L.send(res, 200, { action: out.action, mint: out.action === 'wait' ? null : out.mint, sym: sym || null, sol: out.action === 'buy' ? size : null, reason: String(out.reason || '').slice(0, 400), thoughts: Array.isArray(out.thoughts) ? out.thoughts.slice(0, 4).map(x => String(x).slice(0, 160)) : [], source, model: mdl, note: source === 'rules' ? (b._err ? 'model unavailable, used rules' : 'rules') : null, err: b._err || null, at: Date.now() });
} catch (e) { L.send(res, 500, { error: String(e.message || e) }); } };
