// Lecteur de seance.txt, partagé par l'appli (index.html) et par la page des résultats (resultats.html).
// ---------- le contenu de la séance : il est dans le fichier seance.txt, modifiable directement sur GitHub ----------
let PHASES = { 1: { nom: 'Étape 1', quoi: '' }, 2: { nom: 'Étape 2', quoi: '' }, 3: { nom: 'Étape 3', quoi: '' } };
let ETAPES = [{ t: 'accueil' }], MISSIONS = ["L'information à faire passer"], TESTS = [];
// lit seance.txt : un écran par mot entre crochets, des lignes « clé : valeur » et des réponses « - » ou « + » dessous
function lireSeance(texte) {
  const E = [], M = [], T = [], P = {}, ids = {};
  const sans = x => x.normalize('NFD').replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
  const id = q => { let k = sans(q).replace(/ /g, '').slice(0, 20) || 'q'; ids[k] = (ids[k] || 0) + 1; return ids[k] > 1 ? k + ids[k] : k; };
  const cinq = ['1', '2', '3', '4', '5'], fixes = { accueil: 'accueil', scores: 'scores', mission: 'mission', photos: 'photo', photo: 'photo', tests: 'vote', palmares: 'palmares', fin: 'fin' };
  let e = null;
  for (let l of texte.split(/\r?\n/)) {
    l = l.trim(); if (!l || l[0] === '#') continue;
    const tete = /^\[([^\]]+)\]\s*(.*)$/.exec(l);
    if (tete) {
      const mot = sans(tete[1]), reste = tete[2].trim(), part = reste.split('|').map(x => x.trim());
      if (fixes[mot]) e = mot === 'tests' ? { t: 'vote', id: 'vote' } : { t: fixes[mot] };
      else if (/^etape [123]$/.test(mot)) e = { t: 'phase', p: +mot.slice(-1) };
      else if (mot === 'texte') e = { t: 'info', s: part[0] || '', h: part[1] || '', x: part[2] || '' };
      else if (mot === '5 secondes') { e = { t: 'flash', img: part[0] }; const p = /([123])/.exec(sans(part[1] || '')); if (p) e.p = +p[1]; }
      else if (mot === 'jeu') e = { id: id(reste), t: 'choix', jeu: 1, q: reste, o: [] };
      else if (mot === 'note') e = { id: id(reste), t: 'echelle', q: reste, o: cinq, a: '', b: '' };
      else if (mot === 'a ou b') e = { id: id(reste), t: 'ab', q: reste, o: ['A', 'B', 'Aucune différence'], imgs: [] };
      else if (mot === 'question') e = { id: id(reste), t: 'choix', q: reste, o: [] };
      else { e = null; continue; } // mot inconnu : l'écran est ignoré plutôt que de bloquer la séance
      E.push(e); continue;
    }
    if (/^[-+]\s/.test(l) && e && e.o && e.o !== cinq && e.t !== 'ab') { if (l[0] === '+') e.bon = e.o.length; e.o.push(l.slice(1).trim()); continue; }
    const kv = /^([^:=]+?)\s*[:=]\s*(.*)$/.exec(l); if (!kv) continue;
    const k = sans(kv[1]), v = kv[2].trim(), part = v.split('|').map(x => x.trim());
    if (/^etape [123]$/.test(k) && !e) P[k.slice(-1)] = { nom: part[0], quoi: part[1] || '' };
    else if (k === 'mission' && !e) M.push(v);
    else if (/^test/.test(k) && !e) T.push({ c: 't' + T.length, t: 'echelle', q: part[0], o: cinq, a: part[1] || '', b: part[2] || '', cinq: /5 secondes/.test(k) });
    else if (!e) continue;
    else if (k === 'etape') e.p = +v || undefined;
    else if (k === 'reponses') e.t = /plusieurs/.test(sans(v)) ? 'multi' : 'choix';
    else if (k === 'precision') e.note = v;
    else if (k === 'de') e.a = v; else if (k === 'a') e.b = v;
    else if (k === 'noir et blanc') e.nb = /oui/.test(sans(v));
    else if (k === 'affiche a' && e.imgs) e.imgs[0] = v; else if (k === 'affiche b' && e.imgs) e.imgs[1] = v;
    else if (k === 'affiche') { if (e.jeu) e.img = v; else e.imgs = [v]; }
  }
  // une question sans réponse ne peut pas être posée : on la retire
  const bons = E.filter(x => !x.o || x.o.length > 1);
  if (bons.length) { ETAPES = bons; if (M.length) MISSIONS = M; TESTS = T; PHASES = { ...PHASES, ...P }; }
  return bons.length;
}
