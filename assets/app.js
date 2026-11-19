// An1t: launch a coin, get an agent terminal, your ant trades for you.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MARK = `<svg viewBox="20 6 166 148" xmlns="http://www.w3.org/2000/svg"><g stroke-linecap="round" stroke-linejoin="round"><path d="M128 90 L148 104 L162 122 M118 96 L122 122 L112 144 M108 100 L90 120 L72 140" stroke="currentColor" stroke-width="8.5" fill="none"/><ellipse cx="62" cy="122" rx="40" ry="29" transform="rotate(-25 62 122)" fill="currentColor"/><circle cx="101" cy="104" r="8" fill="currentColor"/><ellipse cx="119" cy="92" rx="19" ry="11" transform="rotate(-25 119 92)" fill="currentColor"/><ellipse cx="148" cy="72" rx="22" ry="19.5" transform="rotate(-25 148 72)" fill="currentColor"/><path d="M163 82 q12 2 14 12" stroke="currentColor" stroke-width="6" fill="none"/><circle cx="157" cy="66" r="4.6" fill="var(--eye,#f4eadb)"/><path d="M140 55 L128 37 L140 20" stroke="currentColor" stroke-width="6.5" fill="none"/><path d="M152 53 L161 34 L179 28" stroke="currentColor" stroke-width="6.5" fill="none"/></g></svg>`;
$$('[data-mark]').forEach(e => e.innerHTML = MARK);
const SOL = 'So11111111111111111111111111111111111111112', JUP = 'https://lite-api.jup.ag', ANTH = 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw';
const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
const PRESETS = { momentum: 'Trade fresh Solana memecoins with real organic volume. Only buy coins moving up with more buyers than sellers. Take profit fast, cut losers early.',
  'dip buyer': 'Buy strong coins (organic score above 60, deep liquidity) after a pullback: down on the day but turning up in the last hour. Hold for a bounce, sell into strength.',
  'anthropic pairs': 'Focus on coins paired to $ANTHROPIC and AI-themed coins. Small size, only when buyers outnumber sellers.',
  'blue chips': 'Only trade the biggest, most liquid memecoins (over $20M market cap, organic score above 80). Slow and steady, small moves.',
  'new launches': 'Hunt new launches with fast momentum and clean flags (mint and freeze authority off). Tiny size, quick exits.' };
const S = { m: null, wallet: null, prov: null, auto: false, prop: null, busy: false, loop: 0, rr: 0, awake: new Set(), cur: 0, tf: '1h',
  ants: store.get('an1t:ants', [store.get('an1t:ant', null) || { name: 'An1t', mandate: PRESETS.momentum, style: 'steady', size: .05, max: 6 }]),
  pos: store.get('an1t:pos', []), hist: store.get('an1t:hist', []), coins: store.get('an1t:coins', []), day: store.get('an1t:day', { d: '', n: 0 }), scans: store.get('an1t:scans', []) };
const A = () => S.ants[S.cur] || S.ants[0];
Object.defineProperty(S, 'ant', { get: A, set: v => { S.ants[S.cur] = v; } });
Object.defineProperty(S, 'awakeAny', { get: () => S.awake.size > 0 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (v, d) => v == null || !isFinite(v) ? '—' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + v.toFixed(d ?? 2);
const px = v => !v ? '—' : v >= 1 ? '$' + v.toFixed(2) : v >= .01 ? '$' + v.toFixed(4) : '$' + v.toPrecision(3);
const pc = v => v == null || !isFinite(v) ? '<span class="mut">—</span>' : `<span class="${v >= 0 ? 'up' : 'dn'}">${v >= 0 ? '+' : ''}${Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)}%</span>`;
const ic = c => `<span class="ic">${c.icon ? `<img src="${esc(c.icon)}" alt="" loading="lazy" onerror="this.remove()">` : ''}${c.icon ? '' : esc((c.sym || '?')[0])}</span>`;
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'on'; t.style.background = err ? 'var(--dn)' : ''; clearTimeout(toast.h); toast.h = setTimeout(() => t.className = '', 3200); }
// ---------------- views
const H = document.documentElement;
function show(view) { const t = ['terminal', 'scan', 'launch', 'board', 'how'].includes(view) ? view : null;
  $('#home').hidden = !!t; $('#term').hidden = !t; if (!t) return;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + t)); window.scrollTo(0, 0); }
function route() { show(location.hash.slice(1)); }
addEventListener('hashchange', route); route();
$('#enter').onclick = () => location.hash = 'terminal'; $('#toHome').onclick = () => { location.hash = ''; show(''); };
$$('.tab').forEach(b => b.onclick = () => location.hash = b.dataset.t); $$('[data-go]').forEach(b => b.onclick = () => location.hash = b.dataset.go);
// ---------------- the console
const LOG = [];
function log(k, msg) { const d = new Date(), tm = d.toTimeString().slice(0, 8); LOG.push({ tm, k, msg }); if (LOG.length > 300) LOG.shift();
  const el = $('#log'); const line = document.createElement('div'); line.className = 'ln'; line.innerHTML = `<span class="tm">${tm}</span><span class="k ${k}">${k.toUpperCase()}</span><span>${msg}</span>`; el.appendChild(line);
  while (el.children.length > 300) el.firstChild.remove(); el.scrollTop = el.scrollHeight; }
// ---------------- the ant's settings
function antUI() { const A = S.ant; renderColony(); if (S.hist) renderHist(); $('#fName').value = A.name; $('#fMandate').value = A.mandate; $('#fSize').value = A.size; $('#fMax').value = A.max; $$('#fStyle button').forEach(b => b.classList.toggle('on', b.dataset.s === A.style));
  $('#antName').textContent = A.name || 'An1t'; $('#cTitle').textContent = (A.name || 'An1t') + ' console'; const st = $('#antSt'); const aw = S.awake.has(S.cur); st.classList.toggle('awake', aw); st.querySelector('span').textContent = aw ? (S.auto ? 'awake · autopilot' : 'awake · proposing') : 'asleep';
  $('#bWake').textContent = aw ? 'sleep' : 'wake up'; $('#fAuto').classList.toggle('on', S.auto); }
function saveAnt() { const A = S.ant; A.name = $('#fName').value.trim() || 'An1t'; A.mandate = $('#fMandate').value.trim(); A.size = Math.max(.01, Math.min(5, +$('#fSize').value || .05)); A.max = Math.max(1, Math.min(50, +$('#fMax').value || 6)); store.set('an1t:ants', S.ants); antUI(); }
function renderColony() { $('#colony').innerHTML = S.ants.map((a, i) => `<button class="chip ${i === S.cur ? 'on' : ''} ${S.awake.has(i) ? 'awake' : ''}" data-ant="${i}"><i></i>${esc(a.name)}</button>`).join('') + (S.ants.length < 5 ? '<button class="chip" id="addAnt">+ ant</button>' : '');
  $$('[data-ant]').forEach(b => b.onclick = () => { S.cur = +b.dataset.ant; antUI(); });
  const add = $('#addAnt'); if (add) add.onclick = () => { const k = Object.keys(PRESETS)[S.ants.length % 5]; S.ants.push({ name: 'Worker ' + (S.ants.length + 1), mandate: PRESETS[k], style: ['careful', 'steady', 'antsy'][S.ants.length % 3], size: .05, max: 6 }); S.cur = S.ants.length - 1; store.set('an1t:ants', S.ants); antUI(); log('you', `added ${esc(A().name)} to the colony (${k})`); }; }
$('#presets').innerHTML = Object.keys(PRESETS).map(k => `<button data-p="${k}">${k}</button>`).join('');
$$('#presets button').forEach(b => b.onclick = () => { $('#fMandate').value = PRESETS[b.dataset.p]; saveAnt(); log('you', `${esc(A().name)} mandate → ${b.dataset.p}`); });
['#fName', '#fMandate', '#fSize', '#fMax'].forEach(s => $(s).addEventListener('change', saveAnt));
$$('#fStyle button').forEach(b => b.onclick = () => { S.ant.style = b.dataset.s; saveAnt(); log('you', `risk set to ${b.dataset.s}`); });
$('#fAuto').onclick = () => { S.auto = !S.auto; antUI(); log('you', S.auto ? 'autopilot on: your ant opens its trades in your wallet by itself' : 'autopilot off: your ant will propose trades'); if (S.auto && !S.wallet) toast('connect a wallet so your ant can trade'); };
$('#bWake').onclick = () => S.awake.has(S.cur) ? sleep() : wake();
$('#bThink').onclick = () => think(true);
function wake(i = S.cur) { S.awake.add(i); antUI(); log('scan', `${esc(S.ants[i].name)} is awake. The colony reads the market every 30 s, one awake ant per turn.`); think(false, i); if (!S.loop) S.loop = setInterval(tick, 30000); }
function sleep(i = S.cur) { S.awake.delete(i); antUI(); log('wait', `${esc(S.ants[i].name)} went to sleep.`); if (!S.awake.size) { clearInterval(S.loop); S.loop = 0; } }
function tick() { const L = [...S.awake]; if (!L.length) return; S.rr = (S.rr + 1) % L.length; think(false, L[S.rr]); }
// ---------------- market
async function loadMarket() { try { const r = await fetch('/api/market'); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); S.m = j; renderMarket(); if (S.awakeAny) scanLine(); if (!S.chartAt || Date.now() - S.chartAt > 60000) loadChart(); } catch (e) { ($('#hAnth') || {}).textContent = '$ANTHROPIC · market data unavailable'; if (S.awakeAny) log('err', 'market read failed: ' + esc(e.message)); } }
function renderMarket() { const m = S.m, a = m.anthropic;
  if (a) { ($('#hAnth') || {}).innerHTML = `$ANTHROPIC ${px(a.price)} ${pc(a.ch24h)}`; $('#tAnth').innerHTML = `$ANTHROPIC ${px(a.price)} ${pc(a.ch24h)}`; $('#aPx').textContent = px(a.price); $('#aCh').innerHTML = `5m ${pc(a.ch5m)} · 1h ${pc(a.ch1h)} · 24h ${pc(a.ch24h)}`;
    $('#aMc').textContent = usd(a.mcap); $('#aVol').textContent = usd(a.vol24); $('#aLiq').textContent = usd(a.liq); $('#aPools').textContent = a.pools; }
  ($('#hPaired') || {}).textContent = `${m.paired.length} coins paired`; ($('#hTrend') || {}).textContent = `${m.trending.length} coins in view`; $('#pN').textContent = m.paired.length + ' live';
  $('#paired').innerHTML = m.paired.length ? m.paired.slice(0, 8).map(c => `<a class="it" href="${esc(c.url)}" target="_blank" rel="noopener">${ic(c)}<span class="n"><b>$${esc(c.sym)}</b><small>${esc(c.name).slice(0, 22)}</small></span><span class="v">${usd(c.mcap)}<small>${pc(c.ch24h)}</small></span></a>`).join('') : '<div class="empty">No coins paired yet. Be first.</div>';
  $('#trend').innerHTML = m.trending.slice(0, 10).map(c => `<a class="it" href="https://jup.ag/tokens/${esc(c.mint)}" target="_blank" rel="noopener">${ic(c)}<span class="n"><b>$${esc(c.sym)}</b> ${shield(c)}<small>${usd(c.mcap)} · org ${c.organic}</small></span><span class="v">${pc(c.ch1h)}<small class="mut">1h</small></span></a>`).join('') || '<div class="empty">nothing trending</div>';
  const tk = [...(a ? [`<span><b>$ANTHROPIC</b> ${px(a.price)} ${pc(a.ch24h)}</span>`] : []), ...m.paired.slice(0, 10).map(c => `<span><b>$${esc(c.sym)}</b>/ANTHROPIC ${usd(c.mcap)} ${pc(c.ch24h)}</span>`), ...m.trending.slice(0, 14).map(c => `<span><b>$${esc(c.sym)}</b> ${px(c.price)} ${pc(c.ch1h)}</span>`)].join('');
  $('#tick').innerHTML = tk + tk;
  $('#bAt').textContent = 'updated ' + new Date(m.at).toTimeString().slice(0, 5);
  const q = ($('#bQ').value || '').toLowerCase(), so = SORT[$('#bSort').value] || SORT.mcap, F = L => L.filter(c => !q || `${c.sym} ${c.name}`.toLowerCase().includes(q)).sort((a, b) => so(b) - so(a));
  $('#bPaired').innerHTML = F(m.paired).length ? F(m.paired).map(c => `<a class="card cc" href="${esc(c.url)}" target="_blank" rel="noopener"><div class="top">${ic(c)}<div class="nm">${esc(c.name).slice(0, 24)}<small>$${esc(c.sym)} / $ANTHROPIC · ${esc(c.dex)}</small></div></div><div class="kv"><div><span>mcap</span><b>${usd(c.mcap)}</b></div><div><span>24h</span><b>${pc(c.ch24h)}</b></div><div><span>vol 24h</span><b>${usd(c.vol24)}</b></div><div><span>buys / sells</span><b>${c.buys} / ${c.sells}</b></div></div></a>`).join('') : '<div class="card empty">No coins paired to $ANTHROPIC yet.</div>';
  $('#bTrend').innerHTML = F(m.trending).map(c => `<tr><td><div style="display:flex;gap:10px;align-items:center">${ic(c)}<b>$${esc(c.sym)}</b></div></td><td class="n">${px(c.price)}</td><td class="n">${usd(c.mcap)}</td><td class="n">${pc(c.ch1h)}</td><td class="n">${pc(c.ch24h)}</td><td class="n">${usd(c.vol1h)}</td><td class="n">${usd(c.liq)}</td><td class="n">${c.organic}</td><td class="n">${c.top10 == null ? '—' : c.top10.toFixed(0) + '%'}</td><td>${shield(c)}</td><td style="white-space:nowrap"><button class="btn sm" data-scan="${esc(c.mint)}">scan</button></td></tr>`).join('');
  $$('[data-scan]').forEach(b => b.onclick = () => { location.hash = 'scan'; $('#sCa').value = b.dataset.scan; scan(); });
  renderPos(); }
function shield(c) { const bad = c.sus || c.mintOff === false || c.freezeOff === false || (c.top10 ?? 0) > 45, warn = (c.top10 ?? 0) > 25 || (c.organic ?? 100) < 30; return bad ? '<span class="sh bad">risky</span>' : warn ? '<span class="sh warn">care</span>' : '<span class="sh ok">clean</span>'; }
async function loadChart(tf = S.tf) { const a = S.m?.anthropic; if (!a?.pool) return; S.tf = tf; S.chartAt = Date.now(); $$('#aTf button').forEach(b => b.classList.toggle('on', b.dataset.tf === tf));
  try { const j = await (await fetch(`/api/chart?pool=${a.pool}&tf=${tf}`)).json(); $('#aChart').innerHTML = j.candles?.length > 2 ? spark(j.candles) : '<div class="empty">no chart data</div>'; } catch (_) { $('#aChart').innerHTML = '<div class="empty">chart unavailable</div>'; } }
$$('#aTf button').forEach(b => b.onclick = () => loadChart(b.dataset.tf));
function spark(c, w = 300, h = 120) { const v = c.map(x => x.c), lo = Math.min(...c.map(x => x.l)), hi = Math.max(...c.map(x => x.h)), n = c.length; const X = i => i / (n - 1) * w, Y = p => h - 6 - (p - lo) / ((hi - lo) || 1) * (h - 14);
  const up = v[n - 1] >= v[0], col = up ? 'var(--up)' : 'var(--dn)', d = v.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="g${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${up ? '#1d8a4e' : '#c8381e'}" stop-opacity=".22"/><stop offset="1" stop-color="${up ? '#1d8a4e' : '#c8381e'}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#g${n})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`; }
const SORT = { mcap: c => c.mcap, ch1h: c => c.ch1h ?? -1e9, ch24h: c => c.ch24h ?? -1e9, vol: c => c.vol1h || c.vol24 || 0 };
['#bQ', '#bSort'].forEach(s => $(s).addEventListener('input', () => S.m && renderMarket()));
function scanLine() { const t = S.m?.trending || []; if (!t.length) return; const up = t.filter(c => c.ch1h > 0).length, top = [...t].sort((a, b) => b.vol1h - a.vol1h)[0];
  log('scan', `read ${t.length} coins · ${up} up in the last hour · most traded $${esc(top.sym)} (${usd(top.vol1h)} in 1h)`); }
// ---------------- thinking
async function think(manual, idx = S.cur) { if (S.busy) return; if (!S.m) { await loadMarket(); if (!S.m) return; } const ant = S.ants[idx] || A(); if (manual) log('you', `think now (${esc(ant.name)})`);
  S.busy = true; const board = S.m.trending.slice(0, 14);
  log('think', `<b>${esc(ant.name)}</b> weighs ${board.length} coins against its mandate${S.pos.length ? ` and ${S.pos.length} position${S.pos.length > 1 ? 's' : ''}` : ''}…`);
  try { const held = S.pos.map(p => ({ mint: p.mint, sym: p.sym, entry: p.entry, price: priceOf(p.mint) || p.entry }));
    const r = await fetch('/api/ant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: ant.name, mandate: ant.mandate, style: ant.style, size: ant.size, coins: board, held }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status);
    for (const t of j.thoughts || []) log('think', esc(t));
    const by = j.source === 'model' ? 'Claude' : 'rules'; brain(j);
    if (j.action === 'wait') { log('wait', `${esc(j.reason)} <span class="mut">· ${by}</span>`); hideProp(); }
    else { j.ant = ant.name; log('move', `<b>${esc(ant.name)} · ${j.action.toUpperCase()} $${esc(j.sym)}</b>${j.sol ? ` · ${j.sol} SOL` : ''} · ${esc(j.reason)} <span class="mut">· ${by}</span>`); propose(j); }
  } catch (e) { log('err', 'think failed: ' + esc(e.message)); } finally { S.busy = false; } }
function priceOf(mint) { const c = (S.m?.trending || []).find(x => x.mint === mint) || (S.m?.paired || []).find(x => x.mint === mint); return c ? c.price : null; }
function brain(j) { const b = $('#brain'); b.textContent = j.source === 'model' ? 'brain · Claude Haiku' : 'brain · rules'; b.classList.toggle('model', j.source === 'model'); }
function propose(j) { S.prop = j; $('#propH').innerHTML = `${j.ant ? esc(j.ant) + ' · ' : ''}<span class="org">${j.action.toUpperCase()}</span> $${esc(j.sym)}`; $('#propS').textContent = j.action === 'buy' ? `${j.sol} SOL` : 'whole position'; $('#propR').textContent = j.reason; $('#prop').classList.add('on');
  if (S.auto && S.wallet) { const today = new Date().toISOString().slice(0, 10); if (S.day.d !== today) S.day = { d: today, n: 0 };
    if (S.day.n >= S.ant.max) { log('wait', `daily cap of ${S.ant.max} trades reached; holding the proposal for you`); return; } setTimeout(() => execProp(), 900); } }
function hideProp() { S.prop = null; $('#prop').classList.remove('on'); }
$('#propNo').onclick = () => { if (S.prop) log('you', `skipped ${S.prop.action} $${esc(S.prop.sym)}`); hideProp(); };
$('#propGo').onclick = () => execProp();
// ---------------- trading (Jupiter, signed in your wallet)
async function web3() { if (!window.solanaWeb3) throw new Error('wallet library not loaded'); return window.solanaWeb3; }
async function rpc(method, params) { const r = await fetch('/api/rpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ method, params }) }); const j = await r.json(); if (j.error) throw new Error(j.error.message || j.error); return j.result; }
async function jget(path, o) { const r = await fetch(JUP + path, o); const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (_) {} if (!r.ok) throw new Error(j.error || j.message || 'Jupiter ' + r.status); return j; }
const A58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(bytes) { let n = 0n; for (const b of bytes) n = n * 256n + BigInt(b); let s = ''; while (n > 0n) { s = A58[Number(n % 58n)] + s; n /= 58n; } for (const b of bytes) { if (b) break; s = '1' + s; } return s; }
async function signSend(b64) { const { VersionedTransaction } = await web3(); const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  const r = await S.prov.signAndSendTransaction(tx); const sig = typeof r === 'string' ? r : r?.signature; if (!sig) throw new Error('no signature returned'); return typeof sig === 'string' ? sig : b58(sig); }
async function confirm(sig, ms = 75000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { await new Promise(r => setTimeout(r, 1600)); try { const v = (await rpc('getSignatureStatuses', [[sig], { searchTransactionHistory: false }]))?.value?.[0]; if (v?.err) throw new Error('transaction failed on-chain'); if (v && ['confirmed', 'finalized'].includes(v.confirmationStatus)) return true; } catch (e) { if (/failed/.test(e.message)) throw e; } } throw new Error('not confirmed yet: check your wallet'); }
async function swap(inMint, outMint, amount) { const q = await jget(`/swap/v1/quote?inputMint=${inMint}&outputMint=${outMint}&amount=${amount}&slippageBps=300`);
  const s = await jget('/swap/v1/swap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quoteResponse: q, userPublicKey: S.wallet, wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true, prioritizationFeeLamports: 'auto' }) });
  const sig = await signSend(s.swapTransaction); log('trade', `sent · <a href="https://solscan.io/tx/${sig}" target="_blank" rel="noopener"><u>${short(sig)}</u></a> · confirming…`); await confirm(sig); return { q, sig }; }
async function execProp() { const j = S.prop; if (!j) return; if (!S.wallet && !(await connect())) return; hideProp(); const btn = $('#propGo'); btn.disabled = true;
  try { if (j.action === 'buy') { const lam = Math.round(j.sol * 1e9); log('trade', `buying $${esc(j.sym)} with ${j.sol} SOL through Jupiter: check your wallet`);
      const { q, sig } = await swap(SOL, j.mint, lam); const p = priceOf(j.mint) || 0; const tok = +q.outAmount;
      S.pos.push({ mint: j.mint, sym: j.sym, sol: j.sol, entry: p, raw: tok, ts: Date.now(), sig }); store.set('an1t:pos', S.pos); log('trade', `<b>bought $${esc(j.sym)}</b> · entry ${px(p)}`); bump(); addHist({ side: 'buy', sym: j.sym, mint: j.mint, sol: j.sol, sig, ant: j.ant || A().name }); }
    else { const p = S.pos.find(x => x.mint === j.mint); const r = await rpc('getTokenAccountsByOwner', [S.wallet, { mint: j.mint }, { encoding: 'jsonParsed' }]); const amt = (r?.value || []).reduce((a, x) => a + BigInt(x.account.data.parsed.info.tokenAmount.amount || '0'), 0n);
      if (amt === 0n) { log('wait', `no $${esc(j.sym)} in your wallet to sell`); S.pos = S.pos.filter(x => x.mint !== j.mint); store.set('an1t:pos', S.pos); renderPos(); return; }
      log('trade', `selling $${esc(j.sym)} through Jupiter: check your wallet`); const { q } = await swap(j.mint, SOL, amt.toString()); const back = +q.outAmount / 1e9;
      log('trade', `<b>sold $${esc(j.sym)}</b> for ${back.toFixed(4)} SOL${p ? ` (${back >= p.sol ? '+' : ''}${((back / p.sol - 1) * 100).toFixed(1)}%)` : ''}`); S.pos = S.pos.filter(x => x.mint !== j.mint); store.set('an1t:pos', S.pos); bump(); addHist({ side: 'sell', sym: j.sym, mint: j.mint, sol: back, pnl: p ? back - p.sol : null, ant: j.ant || A().name }); }
    renderPos(); } catch (e) { log('err', esc(e.message || 'cancelled')); toast(e.message || 'cancelled', 1); } finally { btn.disabled = false; } }
function addHist(h) { S.hist = [{ ...h, ts: Date.now() }, ...S.hist].slice(0, 60); store.set('an1t:hist', S.hist); renderHist(); }
function renderHist() { const H2 = S.hist; $('#hist').innerHTML = H2.length ? H2.slice(0, 8).map(h => `<div class="it"><span class="ic">${h.side === 'buy' ? 'B' : 'S'}</span><span class="n"><b>${h.side} $${esc(h.sym)}</b><small>${esc(h.ant || '')} · ${new Date(h.ts).toTimeString().slice(0, 5)}</small></span><span class="v">${(+h.sol).toFixed(3)} SOL<small>${h.pnl == null ? (h.sig ? `<a href="https://solscan.io/tx/${h.sig}" target="_blank" rel="noopener"><u>tx</u></a>` : '') : `<span class="${h.pnl >= 0 ? 'up' : 'dn'}">${h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(3)}</span>`}</small></span></div>`).join('') : '<div class="empty">No trades yet.</div>';
  const sells = H2.filter(h => h.side === 'sell' && h.pnl != null), wins = sells.filter(h => h.pnl > 0).length, pnl = sells.reduce((a, h) => a + h.pnl, 0), vol = H2.reduce((a, h) => a + (+h.sol || 0), 0); const today = new Date().toISOString().slice(0, 10);
  $('#stats').innerHTML = `<div><span>trades today</span><b>${S.day.d === today ? S.day.n : 0} / ${A().max}</b></div><div><span>all trades</span><b>${H2.length}</b></div><div><span>win rate</span><b>${sells.length ? Math.round(wins / sells.length * 100) + '%' : '—'}</b></div><div><span>realized</span><b class="${pnl >= 0 ? 'up' : 'dn'}">${sells.length ? (pnl >= 0 ? '+' : '') + pnl.toFixed(3) + ' SOL' : '—'}</b></div><div><span>volume</span><b>${vol.toFixed(2)} SOL</b></div><div><span>ants</span><b>${S.ants.length} · ${S.awake.size} awake</b></div>`; }
$('#hClear').onclick = () => { S.hist = []; store.set('an1t:hist', []); renderHist(); };
function bump() { const today = new Date().toISOString().slice(0, 10); if (S.day.d !== today) S.day = { d: today, n: 0 }; S.day.n++; store.set('an1t:day', S.day); }
function renderPos() { const L = S.pos; if (!L.length) { $('#pos').innerHTML = '<div class="empty">No positions yet. Wake your ant, or type <span class="mono">buy BONK 0.05</span>.</div>'; $('#posSum').textContent = ''; return; }
  let tot = 0, now = 0; $('#pos').innerHTML = L.map((p, i) => { const cur = priceOf(p.mint); const ch = cur && p.entry ? (cur / p.entry - 1) * 100 : null; tot += p.sol; now += ch == null ? p.sol : p.sol * (1 + ch / 100);
    return `<div class="it">${ic(p)}<span class="n"><b>$${esc(p.sym)}</b><small>${p.sol} SOL · entry ${px(p.entry)}</small></span><span class="v">${px(cur)}<small>${pc(ch)}</small></span><button class="btn sm" data-sell="${i}">sell</button></div>`; }).join('');
  $('#posSum').innerHTML = `${tot.toFixed(2)} SOL in · ${pc((now / tot - 1) * 100)}`;
  $$('[data-sell]').forEach(b => b.onclick = () => { const p = S.pos[+b.dataset.sell]; S.prop = { action: 'sell', mint: p.mint, sym: p.sym, reason: 'you asked to sell' }; execProp(); }); }
// ---------------- wallet
function wallets() { const L = []; const ph = window.phantom?.solana; if (ph?.isPhantom) L.push({ id: 'phantom', name: 'Phantom', p: ph }); if (window.solflare?.isSolflare) L.push({ id: 'solflare', name: 'Solflare', p: window.solflare }); if (window.backpack?.isBackpack) L.push({ id: 'backpack', name: 'Backpack', p: window.backpack });
  if (!L.length && window.solana?.connect) L.push({ id: 'injected', name: 'Solana wallet', p: window.solana }); return L; }
function connect() { return new Promise(res => { const L = wallets(), box = $('#wList'); const u = encodeURIComponent(location.href);
  box.innerHTML = L.length ? L.map((w, i) => `<button class="wopt" data-i="${i}">${w.name}<span class="mut">detected</span></button>`).join('') : `<p class="note">No Solana wallet in this browser. Get <a href="https://phantom.app" target="_blank" rel="noopener"><u>Phantom</u></a> or <a href="https://solflare.com" target="_blank" rel="noopener"><u>Solflare</u></a>. On a phone: <a href="https://phantom.app/ul/browse/${u}"><u>open in Phantom</u></a>.</p>`;
  $('#mWal').classList.add('on'); $('#mWal').onclick = e => { if (e.target.id === 'mWal') { $('#mWal').classList.remove('on'); res(false); } };
  $$('.wopt', box).forEach(b => b.onclick = async () => { const w = L[+b.dataset.i]; try { const r = await w.p.connect(); const pk = (r?.publicKey || w.p.publicKey)?.toString(); if (!pk) throw new Error('no public key'); S.wallet = pk; S.prov = w.p; store.set('an1t:w', w.id); $('#mWal').classList.remove('on'); walletUI(); log('you', `wallet connected · ${short(pk)}`); res(true); } catch (e) { toast(e.message || 'cancelled', 1); res(false); } }); }); }
async function walletUI() { const b = $('#wal'); if (!S.wallet) { b.textContent = 'connect wallet'; return; } b.textContent = short(S.wallet); try { const r = await rpc('getBalance', [S.wallet]); b.textContent = `${short(S.wallet)} · ${((r?.value || 0) / 1e9).toFixed(3)} SOL`; } catch (_) {} }
$('#wal').onclick = async () => { if (S.wallet) { try { await S.prov?.disconnect?.(); } catch (_) {} S.wallet = null; S.prov = null; store.set('an1t:w', ''); walletUI(); log('you', 'wallet disconnected'); } else connect(); };
(async () => { const id = store.get('an1t:w', ''); if (!id) return; await new Promise(r => setTimeout(r, 500)); const w = wallets().find(x => x.id === id); if (!w) return; try { const r = await w.p.connect({ onlyIfTrusted: true }); const pk = (r?.publicKey || w.p.publicKey)?.toString(); if (pk) { S.wallet = pk; S.prov = w.p; walletUI(); } } catch (_) {} })();
// ---------------- launch + bind
let img = null;
$('#lImg').onchange = e => { const f = e.target.files[0]; if (!f) return; if (f.size > 4e6) return toast('image must be under 4 MB', 1); const fr = new FileReader(); fr.onload = () => { img = fr.result; $('#lDrop').innerHTML = `<img src="${img}" alt="">`; $('#lDrop').appendChild($('#lImg')); $('#pvImg').innerHTML = `<img src="${img}" alt="">`; }; fr.readAsDataURL(f); };
$$('#lStyle button').forEach(b => b.onclick = () => { $$('#lStyle button').forEach(x => x.classList.toggle('on', x === b)); });
['#lName', '#lSym', '#lAnt'].forEach(s => $(s).addEventListener('input', pv)); function pv() { $('#pvName').textContent = $('#lName').value || 'Your coin'; $('#pvSym').textContent = `$${($('#lSym').value || 'TICKER').toUpperCase()} / $ANTHROPIC`; $('#pvAnt').textContent = 'ant: ' + ($('#lAnt').value || '—'); }
function draft() { return { name: $('#lName').value.trim(), sym: $('#lSym').value.trim().toUpperCase(), desc: $('#lDesc').value.trim(), x: $('#lX').value.trim(), web: $('#lWeb').value.trim(), ant: $('#lAnt').value.trim() || 'Worker', mandate: $('#lMandate').value.trim(), style: $('#lStyle .on')?.dataset.s || 'steady' }; }
$('#lSave').onclick = () => { store.set('an1t:draft', draft()); toast('draft saved'); };
$('#lGo').onclick = () => { const d = draft(); if (!d.name || !d.sym) return toast('add a name and a ticker', 1); store.set('an1t:draft', d); window.open('https://pump.fun/create', '_blank', 'noopener'); toast('draft saved · bind the CA here once it is live'); };
$('#bGo').onclick = async () => { const ca = $('#bCa').value.trim(); if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) return toast('that is not a Solana mint address', 1); const d = store.get('an1t:draft', {});
  let info = null; try { const r = await fetch('https://api.dexscreener.com/tokens/v1/solana/' + ca); const j = await r.json(); const p = (j || []).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]; if (p) info = { sym: p.baseToken.symbol, name: p.baseToken.name, icon: p.info?.imageUrl || null, quote: p.quoteToken.symbol }; } catch (_) {}
  const c = { mint: ca, sym: info?.sym || d.sym || 'COIN', name: info?.name || d.name || '', icon: info?.icon || null, ant: d.ant || 'Worker', mandate: d.mandate || '', style: d.style || 'steady', quote: info?.quote || null, ts: Date.now() };
  S.coins = [c, ...S.coins.filter(x => x.mint !== ca)].slice(0, 12); store.set('an1t:coins', S.coins); renderCoins(); if (c.mandate) { S.ant = { ...S.ant, name: c.ant, mandate: c.mandate, style: c.style }; store.set('an1t:ants', S.ants); antUI(); }
  location.hash = 'terminal'; log('you', `bound ${esc(c.ant)} to $${esc(c.sym)} (${short(ca)})${c.quote && c.quote !== 'ANTHROPIC' ? ` · note: this coin trades against ${esc(c.quote)}, not $ANTHROPIC` : ''}`); };
function renderCoins() { $('#myCoins').innerHTML = S.coins.length ? S.coins.map(c => `<a class="it" href="https://dexscreener.com/solana/${esc(c.mint)}" target="_blank" rel="noopener">${ic(c)}<span class="n"><b>$${esc(c.sym)}</b><small>ant: ${esc(c.ant)}</small></span><span class="v mono mut">${short(c.mint)}</span></a>`).join('') : '<div class="empty">No coin bound yet. Launch one, then bind its CA so your ant runs it.</div>'; }
// ---------------- command line
const CMD = { help: () => log('you', 'commands: <b>wake</b> · <b>sleep</b> · <b>think</b> · <b>buy SYM 0.05</b> · <b>sell SYM</b> · <b>scan CA</b> · <b>ants</b> · <b>style careful|steady|antsy</b> · <b>auto on|off</b> · <b>mandate …</b> · <b>launch</b> · <b>board</b> · <b>clear</b> · or just ask your ant a question'),
  wake, sleep, think: () => think(true), clear: () => { $('#log').innerHTML = ''; }, launch: () => location.hash = 'launch', board: () => location.hash = 'board', how: () => location.hash = 'how',
  style: a => { if (!['careful', 'steady', 'antsy'].includes(a[0])) return log('err', 'style careful | steady | antsy'); S.ant.style = a[0]; saveAnt(); antUI(); log('you', 'risk ' + a[0]); },
  auto: a => { const on = a[0] !== 'off'; if (on !== S.auto) $('#fAuto').click(); },
  mandate: a => { $('#fMandate').value = a.join(' '); saveAnt(); log('you', 'new mandate: ' + esc(a.join(' '))); },
  buy: a => { const sym = (a[0] || '').replace('$', '').toUpperCase(), sol = Math.min(5, +a[1] || S.ant.size); const c = [...(S.m?.trending || []), ...(S.m?.paired || [])].find(x => x.sym.toUpperCase() === sym); if (!c) return log('err', `$${esc(sym)} is not on the board`); propose({ action: 'buy', mint: c.mint, sym: c.sym, sol, reason: 'you asked' }); },
  sell: a => { const sym = (a[0] || '').replace('$', '').toUpperCase(); const p = S.pos.find(x => x.sym.toUpperCase() === sym); if (!p) return log('err', `no $${esc(sym)} position`); propose({ action: 'sell', mint: p.mint, sym: p.sym, reason: 'you asked' }); } };
CMD.scan = a => { location.hash = 'scan'; $('#sCa').value = a[0] || ''; scan(); }; CMD.ask = a => ask(a.join(' '));
CMD.ants = () => log('you', S.ants.map((x, i) => `${esc(x.name)} (${x.style}${S.awake.has(i) ? ', awake' : ''})`).join(' · '));
$('#cmd').addEventListener('keydown', e => { if (e.key !== 'Enter') return; const v = e.target.value.trim(); e.target.value = ''; if (!v) return; const [c, ...a] = v.split(/\s+/); log('you', '› ' + esc(v)); (CMD[c.toLowerCase()] || (() => ask(v)))(a); });
async function ask(q) { if (!q) return; const ant = A(); log('think', `<b>${esc(ant.name)}</b> is thinking…`);
  try { const held = S.pos.map(p => ({ sym: p.sym, entry: p.entry, price: priceOf(p.mint) })); const ctx = { anthropic: S.m?.anthropic ? { price: S.m.anthropic.price, ch24h: S.m.anthropic.ch24h, vol24: S.m.anthropic.vol24, mcap: S.m.anthropic.mcap } : null, trending: (S.m?.trending || []).slice(0, 10).map(c => ({ sym: c.sym, mcap: Math.round(c.mcap), ch1h: c.ch1h, ch24h: c.ch24h, organic: c.organic })), paired: (S.m?.paired || []).slice(0, 6).map(c => ({ sym: c.sym, mcap: Math.round(c.mcap), ch24h: c.ch24h })) };
    const j = await (await fetch('/api/ant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', q, name: ant.name, mandate: ant.mandate, style: ant.style, held, context: ctx }) })).json();
    brain(j); log('ant', `<b>${esc(ant.name)}:</b> ${esc(j.answer || j.error || '…')}`); } catch (e) { log('err', 'no answer: ' + esc(e.message)); } }
// ---------------- scanner
async function scan() { const ca = $('#sCa').value.trim(); const out = $('#sOut'); if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) { out.innerHTML = '<div class="card empty">Paste a Solana mint address.</div>'; return; }
  out.innerHTML = '<div class="card empty">your ant is reading the coin…</div>';
  try { const r = await fetch('/api/coin?mint=' + ca); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); const c = j.coin;
    S.scans = [{ mint: c.mint, sym: c.sym, name: c.name, icon: c.icon, grade: j.grade, ts: Date.now() }, ...S.scans.filter(x => x.mint !== c.mint)].slice(0, 10); store.set('an1t:scans', S.scans); renderScans();
    out.innerHTML = `<div class="scan"><div class="card"><div class="top" style="display:flex;gap:12px;align-items:center">${ic(c).replace('class="ic"', 'class="ic" style="width:52px;height:52px;border-radius:14px"')}<div><div style="font:900 26px FR">${esc(c.name)}</div><div class="mono mut">$${esc(c.sym)}${c.quote ? ' / ' + esc(c.quote) : ''} · ${esc(c.dex || '')} · ${short(c.mint)}</div></div><span class="sh ${j.grade === 'green' ? 'ok' : j.grade === 'amber' ? 'warn' : 'bad'}" style="margin-left:auto">${j.grade}</span></div>
      <div class="chart" id="sChart" style="height:150px"><div class="empty">loading chart…</div></div>
      <div class="kv" style="grid-template-columns:repeat(4,1fr)"><div><span>price</span><b>${px(c.price)}</b></div><div><span>mcap</span><b>${usd(c.mcap)}</b></div><div><span>liquidity</span><b>${usd(c.liq)}</b></div><div><span>holders</span><b>${c.holders ? c.holders.toLocaleString() : '—'}</b></div><div><span>1h</span><b>${pc(c.ch1h)}</b></div><div><span>24h</span><b>${pc(c.ch24h)}</b></div><div><span>vol 24h</span><b>${usd(c.vol24)}</b></div><div><span>buys / sells</span><b>${c.buys24} / ${c.sells24}</b></div></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm org" id="sBuy">have ${esc(A().name)} buy ${A().size} SOL</button>${c.url ? `<a class="btn sm" href="${esc(c.url)}" target="_blank" rel="noopener">dexscreener</a>` : ''}<a class="btn sm" href="https://jup.ag/tokens/${esc(c.mint)}" target="_blank" rel="noopener">jupiter</a>${c.x ? `<a class="btn sm" href="${esc(c.x)}" target="_blank" rel="noopener">𝕏</a>` : ''}</div></div>
      <div class="card"><h4>risk flags</h4><div class="flags">${j.flags.map(f => `<div class="flag ${f.lvl}"><b></b><span>${esc(f.txt)}</span></div>`).join('')}</div><div class="verdict" id="sVerdict"><div class="mono" style="font-size:11px;opacity:.7">${esc(A().name)}'s verdict</div><div class="v">…</div><div id="sWhy" style="font-size:13.5px;margin-top:6px;opacity:.9">thinking…</div></div></div></div>`;
    $('#sBuy').onclick = () => { location.hash = 'terminal'; propose({ action: 'buy', mint: c.mint, sym: c.sym, sol: A().size, reason: 'from your scan', ant: A().name }); log('move', `<b>${esc(A().name)} · BUY $${esc(c.sym)}</b> · from your scan`); };
    if (c.pool) fetch(`/api/chart?pool=${c.pool}&tf=1h`).then(r => r.json()).then(k => { const el = $('#sChart'); if (el) el.innerHTML = k.candles?.length > 2 ? spark(k.candles, 600, 150) : '<div class="empty">no chart data</div>'; }).catch(() => {});
    const v = await (await fetch('/api/ant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'judge', coin: c, flags: j.flags, mandate: A().mandate, style: A().style }) })).json();
    const vv = $('#sVerdict .v'); if (vv) { vv.textContent = v.verdict || '—'; vv.className = 'v ' + (v.verdict || ''); $('#sWhy').textContent = (v.reason || '') + (v.source === 'model' ? ' · Claude' : ' · rules'); }
  } catch (e) { out.innerHTML = `<div class="card empty">${esc(e.message)}</div>`; } }
function renderScans() { $('#sRecent').innerHTML = S.scans.length ? S.scans.map(x => `<a class="it" href="#scan" data-rs="${esc(x.mint)}">${ic(x)}<span class="n"><b>$${esc(x.sym)}</b><small>${esc(x.name)}</small></span><span class="v"><span class="sh ${x.grade === 'green' ? 'ok' : x.grade === 'amber' ? 'warn' : 'bad'}">${x.grade}</span></span></a>`).join('') : '<div class="empty">Nothing scanned yet. Try a coin from the board.</div>';
  $$('[data-rs]').forEach(a => a.onclick = e => { e.preventDefault(); $('#sCa').value = a.dataset.rs; scan(); }); }
$('#sGo').onclick = scan; $('#sCa').addEventListener('keydown', e => e.key === 'Enter' && scan());
// ---------------- boot
antUI(); renderCoins(); renderPos(); renderHist(); renderScans();
log('scan', 'An1t terminal online. Your ant reads live Solana markets and trades against your mandate.');
log('wait', 'Set your ant’s mandate and risk, then <b>wake up</b>, or ask it anything below.');
loadMarket(); setInterval(loadMarket, 20000);
