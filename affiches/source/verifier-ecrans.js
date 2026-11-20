// Contrôle de lisibilité des écrans de l'appli : à coller dans la console du navigateur (grand écran ou téléphone).
// __v() renvoie la liste des défauts de l'écran affiché : texte qui déborde, textes qui se chevauchent, texte sur une image,
// texte sous la barre du bas, œil du fond posé sur un texte, texte sombre sur le cercle bleu.
window.__v = () => {
  const vw = innerWidth, vh = innerHeight, out = [];
  const court = e => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
  const vis = e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length; };
  const txt = [...document.querySelectorAll('#app *')].filter(e => !e.closest('.cmd') && vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    .map(e => { const r = document.createRange(); r.selectNodeContents(e); return { e, b: [...r.getClientRects()].filter(b => b.width > 1 && b.height > 1) }; }).filter(x => x.b.length);
  const croise = (a, b, m) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > m && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) * .3;
  const cmd = document.querySelector('.cmd'), bas = cmd ? cmd.getBoundingClientRect().top : vh;
  const imgs = [...document.querySelectorAll('#app img, #app .qr svg')].filter(vis).map(e => e.getBoundingClientRect());
  const yeux = [...document.querySelectorAll('#fond .yeux i')].map(e => e.getBoundingClientRect());
  const bleu = document.querySelectorAll('#fond .blob')[2].getBoundingClientRect(), rb = bleu.width / 2;
  const fondPlein = e => { for (; e && e.id !== 'app'; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return true; } return false; };
  for (const t of txt) for (const b of t.b) {
    if (b.right > vw + 1 || b.left < -1) out.push('déborde en largeur : ' + court(t.e));
    if (cmd && b.bottom > bas + 1 && b.top < vh && !t.e.closest('.flash')) out.push('passe sous la barre du bas : ' + court(t.e));
    if (cmd && b.top < -1) out.push('sort par le haut : ' + court(t.e));
    if (imgs.some(i => croise(b, i, 3))) out.push('texte sur une image : ' + court(t.e));
    if (yeux.some(y => croise(b, y, 2)) && !fondPlein(t.e)) out.push('un œil du fond passe sur le texte : ' + court(t.e));
    if (getComputedStyle(t.e).color === 'rgb(20, 20, 20)' && !fondPlein(t.e) && Math.hypot((b.left + b.right) / 2 - bleu.left - rb, (b.top + b.bottom) / 2 - bleu.top - rb) < rb * .95) out.push('texte sombre sur le cercle bleu : ' + court(t.e));
  }
  for (let i = 0; i < txt.length; i++) for (let j = i + 1; j < txt.length; j++) {
    const a = txt[i], c = txt[j]; if (a.e.contains(c.e) || c.e.contains(a.e)) continue;
    if (a.b.some(x => c.b.some(y => croise(x, y, 3)))) out.push('deux textes se chevauchent : ' + court(a.e) + ' / ' + court(c.e));
  }
  if (!cmd && document.documentElement.scrollWidth > vw + 1) out.push('la page défile en largeur');
  if (document.querySelector('.tel.fixe') && document.querySelector('.tel.fixe').scrollHeight > vh + 1) out.push("la page de bienvenue ne tient pas sur l'écran");
  return [...new Set(out)];
};
// grand écran : parcourt toute la séance (avec des réponses déjà enregistrées) et note les défauts de chaque écran dans __res
window.__parcours = async (lent = 0) => {
  const pause = ms => new Promise(r => setTimeout(r, ms)), res = {}; window.__res = res; window.__fini = false;
  for (let n = 0; n < 160; n++) {
    await pause(document.body.classList.contains('plein') ? 2400 : 900);
    while (document.querySelector('.flash')) await pause(600);
    await pause(300 + lent);
    const h1 = (document.querySelector('.gauche h1') || {}).textContent || '', nom = (document.querySelector('.cmd span') || {}).textContent + ' ' + h1.slice(0, 44) + (document.querySelector('.cols,.mots') ? ' [réponses]' : '');
    const pb = __v(); if (pb.length) res[nom] = pb;
    window.__vus = n + 1;
    if (h1.startsWith('Merci')) break;
    dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  }
  window.__fini = true;
};
// téléphone : note les défauts de chaque écran au fil de la séance dans __res
window.__suivre = () => { // n'examine un écran que 2,5 s après son arrivée, quand les cercles ont fini de bouger
  window.__res = {}; window.__noms = new Set(); let nom = '', depuis = 0;
  setInterval(() => { const t = document.querySelector('.tel h1, .tel h2'), n = (t ? t.textContent : '?').slice(0, 44); if (n !== nom) { nom = n; depuis = Date.now(); return; } if (Date.now() - depuis < 2500 || __noms.has(n)) return; __noms.add(n); const pb = __v(); if (pb.length) __res[n] = pb; }, 300);
};
