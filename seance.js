// Lecteur et écrivain de seance.txt, partagés par l'appli (index.html), l'éditeur (modifier.html) et les résultats (resultats.html).
// ---------- le contenu de la séance : il est dans le fichier seance.txt, modifiable directement sur GitHub ----------
let PHASES = { 1: { nom: 'Étape 1', quoi: '' }, 2: { nom: 'Étape 2', quoi: '' }, 3: { nom: 'Étape 3', quoi: '' } };
let ETAPES = [{ t: 'accueil' }], MISSIONS = ["L'information à faire passer"], TESTS = [];
let TOUS = ETAPES; // tous les écrans du fichier, y compris ceux qui sont masqués (pour l'éditeur)
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
    else if (k === 'masque') e.masque = /oui/.test(sans(v));
    else if (k === 'affiche a' && e.imgs) e.imgs[0] = v; else if (k === 'affiche b' && e.imgs) e.imgs[1] = v;
    else if (k === 'affiche') { if (e.jeu) e.img = v; else e.imgs = [v]; }
  }
  // une question sans réponse ne peut pas être posée, un écran masqué ne passe pas : on les retire de la séance
  const bons = E.filter(x => !x.masque && (!x.o || x.o.length > 1));
  if (bons.length) { TOUS = E; ETAPES = bons; if (M.length) MISSIONS = M; TESTS = T; PHASES = { ...PHASES, ...P }; }
  return bons.length;
}

// réécrit seance.txt à partir du contenu en mémoire (utilisé par l'éditeur)
const AIDE = "# LA SÉANCE « POINTS DE VUE », ÉCRAN PAR ÉCRAN\n# ------------------------------------------------------------------\n# Le plus simple pour le modifier : la page « Modifier le test » du site.\n# Il se modifie aussi directement sur GitHub : bouton crayon en haut à droite,\n# puis bouton vert « Commit changes ». Le site est à jour une à deux minutes après.\n#\n# Chaque écran commence par un mot entre crochets. L'ordre du fichier est l'ordre de la séance.\n# Pour retirer un écran : supprimez ses lignes. Pour en déplacer un : coupez-collez ses lignes.\n# Une ligne qui commence par # est un commentaire, l'appli ne la lit pas.\n#\n#   [accueil]              la salle d'attente (QR code, code, participants connectés)\n#   [texte] petit titre | grand titre | phrase\n#   [5 secondes] image     une affiche montrée 5 secondes   (ajoutez « | étape 1 » pour la rattacher à une étape)\n#   [jeu] question         question avec une bonne réponse : « + » devant la bonne, « - » devant les autres\n#   [scores]               les réussites de chacun au jeu\n#   [étape 1]              l'écran de titre d'une étape (1, 2 ou 3)\n#   [question] question    question à choix : « - » devant chaque réponse\n#                          ligne « réponses : une » ou « réponses : plusieurs »\n#   [note] question        note de 1 à 5, avec les lignes « de : » et « à : »\n#   [a ou b] question      comparaison de deux affiches, avec « affiche a : » et « affiche b : »\n#   [mission] [photos] [tests] [palmarès] [fin]   l'atelier en binômes et la fin\n#\n# Lignes possibles sous une question :\n#   étape : 1                      (1, 2 ou 3 : donne la couleur et le titre de l'étape)\n#   affiche : affiches/nom.jpg     (l'affiche montrée à côté de la question)\n#   précision : une phrase sous la question\n#   noir et blanc : oui            (l'affiche passe en noir et blanc)\n#   masqué : oui                   (l'écran reste dans le fichier mais ne passe pas pendant la séance)\n#\n# Les images sont dans le dossier « affiches » du dépôt.\n# ------------------------------------------------------------------";
function ecrireSeance(m) { // m = { phases, missions, tests, ecrans }
  const net = x => String(x ?? '').replace(/[|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); // une valeur tient sur une ligne, sans barre verticale
  const L = [AIDE, '', "# Les trois étapes : nom | phrase d'explication"];
  [1, 2, 3].forEach(p => L.push(`étape ${p} = ${net(m.phases[p].nom)} | ${net(m.phases[p].quoi)}`));
  L.push('', "# L'atelier : les informations de santé possibles. La première est celle de la séance (le menu du grand écran permet d'en changer).");
  m.missions.map(net).filter(Boolean).forEach(x => L.push('mission = ' + x));
  L.push('', "# L'atelier : les tests passés par chaque affiche de binôme (question | note 1 | note 5). « test 5 secondes » : l'affiche est cachée au bout de 5 secondes.");
  m.tests.filter(t => net(t.q)).forEach(t => L.push(`${t.cinq ? 'test 5 secondes' : 'test'} = ${net(t.q)} | ${net(t.a)} | ${net(t.b)}`));
  L.push('', '', '# ================= LA SÉANCE =================', '');
  const fixes = { accueil: 'accueil', scores: 'scores', mission: 'mission', photo: 'photos', vote: 'tests', palmares: 'palmarès', fin: 'fin' };
  for (const e of m.ecrans) {
    if (fixes[e.t]) L.push(`[${fixes[e.t]}]`);
    else if (e.t === 'phase') L.push(`[étape ${e.p}]`);
    else if (e.t === 'info') L.push(`[texte] ${net(e.s)} | ${net(e.h)} | ${net(e.x)}`);
    else if (e.t === 'flash') L.push(`[5 secondes] ${net(e.img)}${e.p ? ' | étape ' + e.p : ''}`);
    else {
      L.push(`[${e.jeu ? 'jeu' : e.t === 'echelle' ? 'note' : e.t === 'ab' ? 'a ou b' : 'question'}] ${net(e.q)}`);
      if (e.p) L.push('étape : ' + e.p);
      if (!e.jeu && (e.t === 'choix' || e.t === 'multi')) L.push('réponses : ' + (e.t === 'multi' ? 'plusieurs' : 'une'));
      if (net(e.note)) L.push('précision : ' + net(e.note));
      const im = e.jeu ? [e.img] : e.imgs || [];
      if (e.t === 'ab') L.push('affiche a : ' + net(im[0]), 'affiche b : ' + net(im[1])); else if (net(im[0])) L.push('affiche : ' + net(im[0]));
      if (e.nb) L.push('noir et blanc : oui');
      if (e.t === 'echelle') L.push('de : ' + net(e.a), 'à : ' + net(e.b));
      else if (e.t !== 'ab') e.o.forEach((o, i) => { if (net(o)) L.push((e.jeu && i === e.bon ? '+ ' : '- ') + net(o)); });
    }
    if (e.masque) L.push('masqué : oui');
    L.push('');
  }
  return L.join('\n');
}
