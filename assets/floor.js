// The home page's living trading floor: an engraved exchange, screens with live candles, ants at the desk and a colony marching along the floor.
(() => {
  const host = document.querySelector('#home .floor'); if (!host) return;
  const W = 1500, H = 500, SEP = '#8a6a48', NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rs = 7; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const hatch = (id, ang, gap, w, op) => `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ang})"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${SEP}" stroke-width="${w}" opacity="${op}"/></pattern>`;
  function exchange(x, y, s) {
    let g = `<g transform="translate(${x} ${y}) scale(${s})" stroke="${SEP}" fill="none" stroke-width="1.6">`;
    g += `<path d="M0 120 L190 40 L380 120 Z" fill="url(#h1)"/><path d="M14 116 L190 50 L366 116"/><rect x="-6" y="120" width="392" height="26" fill="url(#h2)"/><rect x="-6" y="146" width="392" height="10"/>`;
    for (let i = 0; i < 6; i++) { const cx = 16 + i * 70; g += `<rect x="${cx}" y="156" width="34" height="230"/>`; for (let k = 1; k < 5; k++) g += `<line x1="${cx + k * 6.8}" y1="160" x2="${cx + k * 6.8}" y2="382" stroke-width=".9"/>`; g += `<rect x="${cx - 6}" y="150" width="46" height="8"/><rect x="${cx - 6}" y="384" width="46" height="8"/>`; }
    g += `<rect x="58" y="230" width="264" height="156" fill="url(#h3)" stroke="none"/>`;
    for (let i = 0; i < 4; i++) g += `<rect x="${-20 - i * 14}" y="${392 + i * 12}" width="${420 + i * 28}" height="12"/>`;
    for (const [n, fx] of [[0, 40], [1, 150], [2, 260]]) { g += `<line x1="${fx}" y1="186" x2="${fx}" y2="96"/><g class="flag f${n}" transform="translate(${fx} 98)"><path d="M0 0 C18 -6 34 8 56 2 L56 34 C34 40 18 26 0 32 Z" fill="url(#h2)"/>`; for (let k = 1; k < 5; k++) g += `<path d="M0 ${k * 6.4} C18 ${k * 6.4 - 6} 34 ${k * 6.4 + 8} 56 ${k * 6.4 + 2}" stroke-width=".8"/>`; g += `</g>`; }
    return g + `</g>`;
  }
  function skyline(x, y, s) {
    let g = `<g transform="translate(${x} ${y}) scale(${s})" stroke="${SEP}" fill="none" stroke-width="1.5">`;
    for (const [bx, bh, bw] of [[0, 210, 60], [64, 300, 54], [122, 250, 70], [196, 380, 50], [250, 280, 64], [318, 200, 56], [378, 330, 60]]) {
      g += `<rect x="${bx}" y="${-bh}" width="${bw}" height="${bh}" fill="url(#h4)"/>`;
      for (let wy = -bh + 14; wy < -10; wy += 16) for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) if (rnd() > .25) g += `<rect class="win" x="${wx}" y="${wy}" width="5" height="8" stroke-width=".8"/>`; }
    return g + `<path d="M221 -380 L221 -440 M211 -400 L231 -400 M215 -420 L227 -420"/></g>`;
  }
  const SCR = [];   // screens with live candles
  function monitor(x, y, w, h, seed, up) {
    const id = SCR.length; rs = seed; const n = Math.max(5, Math.floor((w - 30) / 13)); const c = []; let p = y + h * .62;
    for (let i = 0; i < n; i++) { const o = p, cl = Math.max(y + 18, Math.min(y + h - 18, o + (rnd() - (up ? .6 : .46)) * 22)); c.push([o, cl, Math.min(o, cl) - rnd() * 7, Math.max(o, cl) + rnd() * 7]); p = cl; }
    SCR.push({ x, y, w, h, n, c, up, seed: seed * 977 });
    return `<g stroke="${SEP}" fill="none" stroke-width="1.5"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><rect class="glass" x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="2" fill="url(#h5)"/>
      <path d="M${x + w / 2 - 10} ${y + h} L${x + w / 2 - 16} ${y + h + 26} L${x + w / 2 + 16} ${y + h + 26} L${x + w / 2 + 10} ${y + h}"/><g class="cd" id="cd${id}"></g></g>`;
  }
  const ANT = (body, ante) => `<path d="M128 90 L148 104 L162 122 M118 96 L122 122 L112 144 M108 100 L90 120 L72 140" stroke="${SEP}" stroke-width="5" fill="none" class="legs"/>
    <ellipse cx="62" cy="122" rx="40" ry="29" transform="rotate(-25 62 122)" fill="${body}" stroke="${SEP}" stroke-width="2.6"/><circle cx="101" cy="104" r="8" fill="${body}" stroke="${SEP}" stroke-width="2.6"/>
    <ellipse cx="119" cy="92" rx="19" ry="11" transform="rotate(-25 119 92)" fill="${body}" stroke="${SEP}" stroke-width="2.6"/><ellipse cx="148" cy="72" rx="22" ry="19.5" transform="rotate(-25 148 72)" fill="${body}" stroke="${SEP}" stroke-width="2.6"/>
    <g class="${ante}"><path d="M140 55 L128 37 L140 20" stroke="${SEP}" stroke-width="3.4" fill="none"/></g><g class="${ante} b"><path d="M152 53 L160 36 L176 30" stroke="${SEP}" stroke-width="3.4" fill="none"/></g>`;
  const deskAnt = (x, y, s, rot, flip) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s}) translate(-110 -90)"><g class="bob">${ANT('url(#h6)', 'ante')}</g></g>`;
  // ---------- build
  let art = exchange(30, 40, .78) + skyline(1150, 470, .9);
  let ms = ''; for (const m of [[330, 150, 150, 96, 3, 1], [492, 130, 168, 106, 9, 1], [672, 122, 176, 112, 13, 1], [860, 130, 168, 106, 21, 0], [1040, 150, 150, 96, 27, 1]]) ms += monitor(...m);
  for (let i = 0; i < 7; i++) ms += monitor(360 + i * 116, 26, 104, 70, 40 + i * 7, i % 3 !== 1);
  art += ms + `<g stroke="${SEP}" fill="none" stroke-width="1.6"><path d="M250 300 Q750 268 1250 300 L1262 326 Q750 296 238 326 Z" fill="url(#h2)"/><path d="M262 326 L262 470 M1238 326 L1238 470 M600 316 L600 470 M900 316 L900 470"/>
    <path d="M420 290 q0 -22 14 -22 h22 q14 0 14 22 Z"/><path class="steam" d="M438 262 q-6 -10 0 -18 q6 -8 0 -16 M450 262 q-6 -10 0 -18 q6 -8 0 -16" stroke-width="1.2" opacity=".7"/><rect x="1010" y="272" width="60" height="16"/><rect x="1016" y="262" width="52" height="10"/></g>`;
  art += deskAnt(415, 236, .82, -6, false) + deskAnt(1100, 236, .82, 6, true);
  const trail = x => 452 + Math.sin(x / 52 * .55) * 14;
  let tp = ''; for (let x = -20; x <= W + 20; x += 10) tp += `${x === -20 ? 'M' : 'L'}${x} ${trail(x).toFixed(1)} `;
  const NA = 13; let march = '';
  for (let i = 0; i < NA; i++) march += `<g class="m" id="m${i}"><g transform="scale(.24) translate(-110 -90)">${ANT('url(#h6)', 'ante')}</g></g>`;
  const svg = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${hatch('h1', 45, 7, 1, .9)}${hatch('h2', -45, 6, 1, .8)}${hatch('h3', 90, 9, 1.2, .55)}${hatch('h4', 30, 8, .9, .55)}${hatch('h5', 0, 10, .6, .35)}${hatch('h6', 40, 5, 1.3, .95)}</defs>
    <g class="lay back">${art}</g><g class="lay front"><path d="${tp}" fill="none" stroke="${SEP}" stroke-width="2" stroke-dasharray="2 8" opacity=".7"/>${march}</g></svg>`;
  host.innerHTML = svg;
  const st = document.createElement('style');
  st.textContent = `#home .floor{background:none}#home .floor svg{position:absolute;inset:0;width:100%;height:100%;opacity:.8}
  #home .floor .lay{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
  #home .floor .flag{transform-box:fill-box;transform-origin:0 50%;animation:wave 2.4s ease-in-out infinite}#home .floor .flag.f1{animation-delay:-.8s}#home .floor .flag.f2{animation-delay:-1.6s}
  @keyframes wave{0%,100%{transform:skewY(0) scaleX(1)}50%{transform:skewY(5deg) scaleX(.94)}}
  #home .floor .ante{transform-box:fill-box;transform-origin:50% 100%;animation:twitch 1.3s ease-in-out infinite}#home .floor .ante.b{animation-duration:1.1s;animation-delay:-.4s}
  @keyframes twitch{0%,100%{transform:rotate(0)}30%{transform:rotate(-9deg)}60%{transform:rotate(6deg)}}
  #home .floor .bob{animation:bob 2.6s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-3px)}}
  #home .floor .steam{animation:steam 2.8s ease-in-out infinite}@keyframes steam{0%{opacity:0;transform:translateY(4px)}40%{opacity:.7}100%{opacity:0;transform:translateY(-10px)}}
  #home .floor .win{transition:fill .6s}#home .floor .win.lit{fill:${SEP};fill-opacity:.45}
  #home .floor .glass{transition:opacity .25s}
  @media (prefers-reduced-motion:reduce){#home .floor *{animation:none!important}}`;
  document.head.appendChild(st);
  // ---------- live candles
  function drawScreen(i) { const s = SCR[i], g = document.getElementById('cd' + i); if (!g) return; let out = '';
    s.c.forEach(([o, c, hi, lo], k) => { const cx = s.x + 16 + k * 13, up = c < o; out += `<line x1="${cx + 3}" y1="${hi.toFixed(1)}" x2="${cx + 3}" y2="${lo.toFixed(1)}" stroke-width="1"/><rect x="${cx}" y="${Math.min(o, c).toFixed(1)}" width="6" height="${Math.max(2, Math.abs(c - o)).toFixed(1)}" ${up ? '' : `fill="${SEP}" fill-opacity=".5"`} stroke-width="1"/>`; });
    g.innerHTML = out; }
  function stepScreen(i) { const s = SCR[i]; rs = s.seed = (s.seed * 48271) % 2147483647 || 1; const last = s.c[s.c.length - 1][1];
    const drift = s.up ? .58 : .5; const c = Math.max(s.y + 18, Math.min(s.y + s.h - 18, last + (rnd() - drift) * 22)); s.c.push([last, c, Math.min(last, c) - rnd() * 7, Math.max(last, c) + rnd() * 7]); if (s.c.length > s.n) s.c.shift(); drawScreen(i); }
  SCR.forEach((_, i) => drawScreen(i));
  const wins = [...host.querySelectorAll('.win')]; wins.forEach(w => Math.random() < .3 && w.classList.add('lit'));
  const ms2 = [...Array(NA).keys()].map(i => document.getElementById('m' + i));
  const front = host.querySelector('.front'), back = host.querySelector('.back');
  if (RM) { ms2.forEach((m, i) => { const x = i * (W / NA); m.setAttribute('transform', `translate(${x} ${trail(x) - 12})`); }); return; }
  addEventListener('pointermove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; back.style.transform = `translate(${nx * -10}px, ${ny * -6}px)`; front.style.transform = `translate(${nx * -22}px, ${ny * -10}px)`; });
  let t0 = performance.now(), lastC = 0, lastW = 0, ci = 0;
  function loop(now) { requestAnimationFrame(loop); if (document.getElementById('home').hidden || document.hidden) return; const t = (now - t0) / 1000;
    const span = W + 120, sp = 34;
    for (let i = 0; i < NA; i++) { const x = ((t * sp + i * span / NA) % span) - 60, y = trail(x), dy = trail(x + 6) - y; const ang = Math.atan2(dy, 6) * 180 / Math.PI + 22 + Math.sin(t * 14 + i) * 3;
      ms2[i].setAttribute('transform', `translate(${x.toFixed(1)} ${(y - 12 - Math.abs(Math.sin(t * 14 + i)) * 1.6).toFixed(1)}) rotate(${ang.toFixed(1)})`); }
    if (now - lastC > 220) { lastC = now; stepScreen(ci); ci = (ci + 1) % SCR.length; }
    if (now - lastW > 380) { lastW = now; const w = wins[(Math.random() * wins.length) | 0]; if (w) w.classList.toggle('lit'); }
  }
  requestAnimationFrame(loop);
})();
