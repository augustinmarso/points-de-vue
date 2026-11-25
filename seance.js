// Lecteur et écrivain de seance.txt, partagés par l'appli (index.html), l'éditeur (modifier.html) et les résultats (resultats.html).
// ---------- le contenu de la séance : il est dans le fichier seance.txt, modifiable directement sur GitHub ----------
let PHASES = { 1: { nom: 'Étape 1', quoi: '' }, 2: { nom: 'Étape 2', quoi: '' }, 3: { nom: 'Étape 3', quoi: '' } }; // 3 étapes au départ, 6 au plus (une couleur chacune)
let ETAPES = [{ t: 'accueil' }], MISSIONS = ["L'information à faire passer"], TESTS = [];
let LOGOS = []; // un ou deux logos, montrés en bas à droite du grand écran, au début et à la fin de la séance (ligne « logo = … » du test)
// un logo n'est accepté que s'il vient du dossier « logos » du site ou a été ajouté dans l'éditeur (data:) : même règle que pour les affiches
const logoSur = v => /^logos\/[\w.-]+\.(svg|png|jpe?g|webp)$/i.test(v) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(v) ? v : '';
console.assert(logoSur('logos/granville-terre-et-mer.svg') && !logoSur('logos/x.svg" onload="alert(1)') && !logoSur('https://ailleurs.fr/x.png'), 'logoSur');
let VERSION = '', TEXTE = ''; // l'identifiant de la version du test (change dès que seance.txt change) et son contenu
const SCRIPT_GOOGLE = 'https://script.google.com/macros/s/AKfycbzPof8sEj8tZLlA-MtVDYyODv32y8lXxc9hLVmaW5zCvHLilyRIxpk4Ix6TPhzJczjn/exec';
let TOUS = ETAPES; // tous les écrans du fichier, y compris ceux qui sont masqués (pour l'éditeur)
// ---------- plusieurs tests : le principal (seance.txt) et ceux créés depuis « Modifier le test » ----------
// Une page ouvre un autre test avec ?test=nom-court ; TQ s'ajoute aux liens pour rester sur le même test d'une page à l'autre.
// Les tests sont enregistrés dans le Google Sheet (onglet « Tests »), sans GitHub. Les fichiers du site (seance.txt, tests/…, tests.txt)
// servent encore : si l'un d'eux est modifié sur GitHub après le dernier enregistrement depuis le site, c'est lui qui est repris.
const TEST = (new URLSearchParams(location.search).get('test') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
const FICHIER = TEST ? 'tests/' + TEST + '.txt' : 'seance.txt', TQ = TEST ? '&test=' + TEST : '';
const lireTests = t => [{ id: '', nom: 'Séance Points de vue (principale)' }, ...String(t || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && l[0] !== '#')
  .map(l => { const [id, nom] = l.split('|').map(x => x.trim()); return { id, nom: nom || id }; }).filter(x => /^[a-z0-9-]{1,40}$/.test(x.id))];
const listeTests = () => Promise.all([ // ceux du Sheet, plus ceux de tests.txt (créés sur GitHub)
  fetch(SCRIPT_GOOGLE + '?vue=tests').then(x => x.json()).catch(() => []), fetch('tests.txt?' + Date.now()).then(x => x.ok ? x.text() : '').catch(() => '')
]).then(([g, t]) => { const l = lireTests(t); (Array.isArray(g) ? g : []).forEach(([id, nom, par, quand]) => { if (/^[a-z0-9-]{1,40}$/.test(id) && !l.some(x => x.id === id)) l.push({ id, nom: nom || id, par, quand }); }); return l; });
// le contenu d'un test : celui du Sheet, sauf si le fichier du site a changé depuis (BASE = la version du fichier, gardée à l'enregistrement)
let BASE = '';
const lireFichier = (id = TEST) => Promise.all([
  fetch(SCRIPT_GOOGLE + '?vue=test&id=' + (id || 'principal')).then(x => x.json()).catch(() => ({})),
  fetch((id ? 'tests/' + id + '.txt' : 'seance.txt') + '?' + Date.now()).then(x => x.ok ? x.text() : '').catch(() => '')
]).then(([g, f]) => { if (id === TEST) BASE = f ? versionSeance(f) : ''; const t = g && g.texte && (!f || versionSeance(f) === g.base) ? g.texte : f; return t || Promise.reject(); });
// enregistrer un test dans le Sheet (compte de l'équipe) : { id, nom, texte, base, nouveau } → { ok, id }
const sauverTest = t => fetch(SCRIPT_GOOGLE, { method: 'POST', body: JSON.stringify({ test: { jeton: JETON(), ...t } }) }).then(x => x.json())
  .catch(() => Promise.reject(new Error('pas de réponse, vérifiez la connexion internet'))).then(x => { if (x.ok) return x; if (/connexion/.test(x.erreur || '')) try { localStorage.removeItem('pdvCompte'); } catch (e) { } return Promise.reject(new Error(x.erreur || 'refusé')); });
// supprimer un test du Sheet (compte de l'équipe). Les réponses déjà données restent dans l'onglet « Données ».
const supprimerTest = id => fetch(SCRIPT_GOOGLE, { method: 'POST', body: JSON.stringify({ supprimer: { jeton: JETON(), id } }) }).then(x => x.json())
  .catch(() => Promise.reject(new Error('pas de réponse, vérifiez la connexion internet'))).then(x => x.ok ? x : Promise.reject(new Error(x.erreur || 'refusé')));
// une image de test n'est acceptée que si c'est une affiche du dossier « affiches » du site ou une image ajoutée dans l'éditeur (data:) :
// les tests s'enregistrent depuis le site, une adresse d'image ne doit jamais pouvoir glisser du code dans les pages
const optsAB = n => [...'ABCD'.slice(0, Math.max(2, Math.min(4, n))), 'Aucune différence']; // une comparaison : de 2 à 4 affiches, une lettre chacune
const imageSure = v => /^affiches\/[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(v) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(v) ? v : '';
console.assert(imageSure('affiches/reference.jpg') && imageSure('data:image/jpeg;base64,/9j/4A==') && !imageSure('x" onerror="alert(1)') && !imageSure('affiches/a.jpg"><script>'), 'imageSure');
// lit seance.txt : un écran par mot entre crochets, des lignes « clé : valeur » et des réponses « - » ou « + » dessous
function lireSeance(texte) {
  const E = [], M = [], T = [], P = {}, ids = {}, G = [];
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
      else if (/^etape [1-6]$/.test(mot)) e = { t: 'phase', p: +mot.slice(-1) };
      else if (mot === 'texte') e = { t: 'info', s: part[0] || '', h: part[1] || '', x: part[2] || '' };
      else if (mot === '5 secondes') { e = { t: 'flash', img: imageSure(part[0]) }; part.slice(1).forEach(x => { const d = /^(\d+)\s*s/.exec(sans(x)), p = /([1-6])/.exec(x); if (d) e.s = Math.max(1, Math.min(60, +d[1])); else if (p) e.p = +p[1]; }); } // « | étape 1 | 8 s » : la durée d'affichage, 5 secondes si rien n'est écrit
      else if (mot === 'jeu') e = { id: id(reste), t: 'choix', jeu: 1, q: reste, o: [] };
      else if (mot === 'note') e = { id: id(reste), t: 'echelle', q: reste, o: cinq, a: '', b: '' };
      else if (mot === 'a ou b') e = { id: id(reste), t: 'ab', q: reste, o: ['A', 'B', 'Aucune différence'], imgs: [] };
      else if (mot === 'zones') e = { id: id(reste), t: 'choix', q: reste, o: [], zones: [] };
    else if (mot === 'question') e = { id: id(reste), t: 'choix', q: reste, o: [] };
      else if (mot === 'avis') e = { id: id(reste), t: 'texte', q: reste };
      else { e = null; continue; } // mot inconnu : l'écran est ignoré plutôt que de bloquer la séance
      E.push(e); continue;
    }
    if (/^[-+]\s/.test(l) && e && e.o && e.o !== cinq && e.t !== 'ab') { if (l[0] === '+') e.bon = e.o.length; let r = l.slice(1).trim();
      if (e.zones) { const z = /^(.*?)\s*@\s*(\d+) (\d+) (\d+) (\d+)$/.exec(r); e.zones.push(z ? z.slice(2).map(n => Math.min(100, +n)) : [5, Math.min(84, 5 + 18 * e.zones.length), 90, 16]); if (z) r = z[1]; } // « - Le titre @ 5 4 90 18 » : gauche, haut, largeur, hauteur, en % de l'affiche
      e.o.push(r); continue; }
    const kv = /^([^:=]+?)\s*[:=]\s*(.*)$/.exec(l); if (!kv) continue;
    const k = sans(kv[1]), v = kv[2].trim(), part = v.split('|').map(x => x.trim());
    if (/^etape [1-6]$/.test(k) && !e) P[k.slice(-1)] = { nom: part[0], quoi: part[1] || '' };
    else if (k === 'mission' && !e) M.push(v);
    else if (k === 'logo' && !e) { if (logoSur(v) && G.length < 2) G.push(v); }
    else if (/^test/.test(k) && !e) T.push({ c: 't' + T.length, t: 'echelle', q: part[0], o: cinq, a: part[1] || '', b: part[2] || '', cinq: /5 secondes/.test(k) });
    else if (!e) continue;
    else if (k === 'etape') e.p = +v || undefined;
    else if (k === 'reponses' && e.o) e.t = /plusieurs/.test(sans(v)) ? 'multi' : 'choix';
    else if (k === 'precision') e.note = v;
    else if (k === 'de') e.a = v; else if (k === 'a') e.b = v;
    else if (k === 'noir et blanc') e.nb = /oui/.test(sans(v));
    else if (k === 'masque') e.masque = /oui/.test(sans(v));
    else if (k === 'vote') e.abc = /lettre/.test(sans(v)); // « vote : lettres » : sur le téléphone, une comparaison se répond avec les boutons A, B, C plutôt qu'en touchant les affiches
    else if (k === 'telephone') e.telSans = /sans/.test(sans(v)); // « téléphone : sans affiche » : la question passe sur le téléphone sans ses affiches
    else if (k === 'chrono') e.chrono = Math.max(0, Math.min(600, parseInt(v, 10) || 0)); // « chrono : 30 s » : un rond se remplit pendant ce temps sur la question, sans rien faire passer
    else if (k === 'titre') e.petit = /petit/.test(sans(v)); // « titre : petit » : le titre de cet écran est écrit moins gros
    else if (k === 'zoom') { const z = /^(\d+) (\d+) (\d+) (\d+) (\d+)$/.exec(v); if (z && +z[3] && +z[4] && +z[5]) { e.zoom = z.slice(1, 5).map(n => Math.min(100, +n)); e.r = +z[5]; } } // « zoom : gauche haut largeur hauteur proportions » : l'écran ne montre que cette partie de l'affiche, agrandie
    else if (k === 'cache') { const z = /^(.*?)\s*@\s*(\d+) (\d+) (\d+) (\d+)$/.exec(v); if (z) (e.caches = e.caches || []).push({ n: z[1], z: z.slice(2).map(n => Math.min(100, +n)) }); }
    else if (/^affiche [a-d]$/.test(k) && e.imgs) e.imgs['abcd'.indexOf(k.slice(-1))] = imageSure(v);
    else if (k === 'affiche') { if (e.jeu) e.img = imageSure(v); else e.imgs = [imageSure(v)]; }
  }
  E.forEach(x => { if (x.t === 'ab') { x.imgs = [x.imgs[0] || '', x.imgs[1] || '', ...x.imgs.slice(2).filter(Boolean)]; x.o = optsAB(x.imgs.length); } });
  // une question sans réponse ne peut pas être posée, un écran masqué ne passe pas : on les retire de la séance
  const bons = E.filter(x => !x.masque && (!x.o || x.o.length > 1));
  if (bons.length) { TEXTE = texte; VERSION = versionSeance(texte); TOUS = E; ETAPES = bons; LOGOS = G; if (M.length) MISSIONS = M; TESTS = T; PHASES = { ...PHASES, ...P }; }
  return bons.length;
}

// réécrit seance.txt à partir du contenu en mémoire (utilisé par l'éditeur)
const AIDE = "# LA SÉANCE « POINTS DE VUE », ÉCRAN PAR ÉCRAN\n# ------------------------------------------------------------------\n# Le plus simple pour le modifier : la page « Modifier le test » du site (enregistré dans le Google Sheet, onglet « Tests »).\n# Ce fichier peut aussi se modifier sur GitHub : il reprend alors la main sur la dernière version enregistrée depuis le site.\n#\n# Chaque écran commence par un mot entre crochets. L'ordre du fichier est l'ordre de la séance.\n# Pour retirer un écran : supprimez ses lignes. Pour en déplacer un : coupez-collez ses lignes.\n# Une ligne qui commence par # est un commentaire, l'appli ne la lit pas.\n#\n#   [accueil]              la salle d'attente (QR code, code, participants connectés)\n#   [texte] petit titre | grand titre | phrase\n#   [5 secondes] image     une affiche montrée 5 secondes   (ajoutez « | étape 1 » pour la rattacher à une étape)\n#   [jeu] question         question avec une bonne réponse : « + » devant la bonne, « - » devant les autres\n#   [scores]               les réussites de chacun au jeu\n#   [étape 1]              l'écran de titre d'une étape (de 1 à 6)\n#   [question] question    question à choix : « - » devant chaque réponse\n#                          ligne « réponses : une » ou « réponses : plusieurs »\n#   [note] question        note de 1 à 5, avec les lignes « de : » et « à : »\n#   [a ou b] question      comparaison de 2 à 4 affiches, avec « affiche a : », « affiche b : » (puis c et d)\n#   [zones] question       une affiche découpée en zones : on touche une zone. Une ligne par zone : « - nom @ gauche haut largeur hauteur » (en % de l'affiche) ; « cache : nom @ … » recouvre une partie\n#   [avis] question        avis libre : chacun écrit sa réponse (quelques mots)\n#   [mission] [photos] [tests] [palmarès] [fin]   l'atelier en binômes et la fin\n#\n# Lignes possibles sous une question :\n#   étape : 1                      (1, 2 ou 3 : donne la couleur et le titre de l'étape)\n#   affiche : affiches/nom.jpg     (l'affiche montrée à côté de la question)\n#   précision : une phrase sous la question\n#   noir et blanc : oui            (l'affiche passe en noir et blanc)\n#   masqué : oui                   (l'écran reste dans le fichier mais ne passe pas pendant la séance)\n#   cache : nom @ 10 20 80 30      (une partie de l'affiche recouverte : gauche, haut, largeur, hauteur, en %)\n#   zoom : 10 20 80 30 707         (seule cette partie de l'affiche est montrée, en très gros ; le dernier nombre vient de l'éditeur)\n#\n# Les images sont dans le dossier « affiches » du dépôt.\n# ------------------------------------------------------------------";
function ecrireSeance(m) { // m = { phases, missions, tests, ecrans }
  const net = x => String(x ?? '').replace(/[|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); // une valeur tient sur une ligne, sans barre verticale
  const L = [AIDE, '', "# Les trois étapes : nom | phrase d'explication"];
  Object.keys(m.phases).sort().forEach(p => L.push(`étape ${p} = ${net(m.phases[p].nom)} | ${net(m.phases[p].quoi)}`));
  L.push('', "# L'atelier : les informations de santé possibles. La première est celle de la séance (le menu du grand écran permet d'en changer).");
  m.missions.map(net).filter(Boolean).forEach(x => L.push('mission = ' + x));
  if ((m.logos || []).length) L.push('', '# Les logos montrés en bas à droite du grand écran, au début et à la fin de la séance (deux au plus).', ...m.logos.filter(logoSur).slice(0, 2).map(x => 'logo = ' + x));
  L.push('', "# L'atelier : les tests passés par chaque affiche de binôme (question | note 1 | note 5). « test 5 secondes » : l'affiche est cachée au bout de 5 secondes.");
  m.tests.filter(t => net(t.q)).forEach(t => L.push(`${t.cinq ? 'test 5 secondes' : 'test'} = ${net(t.q)} | ${net(t.a)} | ${net(t.b)}`));
  L.push('', '', '# ================= LA SÉANCE =================', '');
  const fixes = { accueil: 'accueil', scores: 'scores', mission: 'mission', photo: 'photos', vote: 'tests', palmares: 'palmarès', fin: 'fin' };
  for (const e of m.ecrans) {
    if (fixes[e.t]) L.push(`[${fixes[e.t]}]`);
    else if (e.t === 'phase') L.push(`[étape ${e.p}]`);
    else if (e.t === 'info') { L.push(`[texte] ${net(e.s)} | ${net(e.h)} | ${net(e.x)}`); if (e.p) L.push('étape : ' + e.p); if (net((e.imgs || [])[0])) L.push('affiche : ' + net(e.imgs[0])); }
    else if (e.t === 'flash') L.push(`[5 secondes] ${net(e.img)}${e.p ? ' | étape ' + e.p : ''}${e.s && e.s !== 5 ? ' | ' + e.s + ' s' : ''}`);
    else {
      L.push(`[${e.zones ? 'zones' : e.jeu ? 'jeu' : e.t === 'echelle' ? 'note' : e.t === 'ab' ? 'a ou b' : e.t === 'texte' ? 'avis' : 'question'}] ${net(e.q)}`);
      if (e.p) L.push('étape : ' + e.p);
      if (!e.jeu && (e.t === 'choix' || e.t === 'multi')) L.push('réponses : ' + (e.t === 'multi' ? 'plusieurs' : 'une'));
      if (net(e.note)) L.push('précision : ' + net(e.note));
      const im = e.jeu ? [e.img] : e.imgs || [];
      if (e.t === 'ab') im.slice(0, 4).forEach((s, i) => L.push('affiche ' + 'abcd'[i] + ' : ' + net(s))); else if (net(im[0])) L.push('affiche : ' + net(im[0]));
      if (e.nb) L.push('noir et blanc : oui');
      if (e.t === 'echelle') L.push('de : ' + net(e.a), 'à : ' + net(e.b));
      else if (e.t !== 'ab') (e.o || []).forEach((o, i) => { if (net(o)) L.push((e.jeu && i === e.bon ? '+ ' : '- ') + net(o) + (e.zones ? ' @ ' + e.zones[i].map(Math.round).join(' ') : '')); });
    }
    if (e.zoom) L.push('zoom : ' + e.zoom.map(Math.round).join(' ') + ' ' + Math.round(e.r));
    (e.caches || []).forEach(c => L.push('cache : ' + net(c.n) + ' @ ' + c.z.map(Math.round).join(' '))); // une partie de l'affiche recouverte
    if (e.petit) L.push('titre : petit');
    if (e.chrono) L.push('chrono : ' + e.chrono + ' s');
    if (e.telSans) L.push('téléphone : sans affiche');
    if (e.t === 'ab' && e.abc) L.push('vote : lettres');
    if (e.masque) L.push('masqué : oui');
    L.push('');
  }
  return L.join('\n');
}

// une affiche découpée en zones (écran [zones]) : chaque zone est une réponse, posée sur l'affiche et repérée par sa lettre (la même que sur la fiche papier)
const cachesZones = e => (e.caches || []).map(c => `<i class="cache" style="left:${+c.z[0]}%;top:${+c.z[1]}%;width:${+c.z[2]}%;height:${+c.z[3]}%"></i>`).join(''); // les parties de l'affiche qu'on a choisi de ne pas montrer
// une affiche « cadrée » pour sa question : des parties recouvertes, ou une seule partie montrée en très gros (e.r = largeur / hauteur de l'image, × 1000)
const cadree = e => !e.zones && e.t !== 'ab' && !!((e.caches || []).length || e.zoom);
const afficheCadree = (e, src) => { const img = `<img src="${h(src)}" alt="L'affiche" draggable="false">`, z = e.zoom;
  return z ? `<span class="zones vz" style="--r:${z[2] * e.r / (z[3] * 1000)}"><span class="pan" style="left:${-z[0] / z[2] * 100}%;top:${-z[1] / z[3] * 100}%;width:${10000 / z[2]}%;height:${10000 / z[3]}%">${img}${cachesZones(e)}</span></span>` : `<span class="zones">${img}${cachesZones(e)}</span>`; };
const carteZones = (e, src) => `<span class="zones"><img src="${h(src)}" alt="L'affiche, découpée en zones" draggable="false">${cachesZones(e)}${e.zones.map((z, i) => `<button type="button" class="z" data-o="${i}" style="left:${+z[0]}%;top:${+z[1]}%;width:${+z[2]}%;height:${+z[3]}%" aria-label="Zone ${'ABCDEFGHIJ'[i]} : ${h(e.o[i])}"><b>${'ABCDEFGHIJ'[i]}</b></button>`).join('')}</span>`;
const legendeZones = e => e.o.map((o, i) => `<b>${'ABCDEFGHIJ'[i]}</b> ${h(o)}`).join(' · ');
if (typeof document !== 'undefined') document.head.insertAdjacentHTML('beforeend', `<style>.zones{position:relative;display:inline-block;line-height:0;vertical-align:top}.zones img{display:block}
.z{position:absolute;box-sizing:border-box;border:2px solid #141414;border-radius:8px;padding:0;cursor:pointer;font:inherit;line-height:1.3;color:#141414;background:rgba(31,111,224,calc(var(--f,0)*.75));transition:background .4s}
.z b{position:absolute;right:100%;top:-2px;background:#141414;color:#fff;border-radius:8px 0 0 8px;min-width:1.6em;padding:.1em .3em;font-size:max(13px,.55em);text-align:center;font-weight:800}
.vz{display:block;overflow:hidden;aspect-ratio:var(--r);border-radius:12px}.vz .pan{position:absolute}.vz .pan img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border-radius:0!important}
.zones .cache{position:absolute;background:#E2E2E2;border-radius:4px}.z.on{background:rgba(20,20,20,.55)}.z:focus-visible{outline:3px solid #1F6FE0;outline-offset:2px}</style>`);

const NB_ETAPES = () => Math.max(3, ETAPES.filter(e => e.t === 'phase').length); // « Étape 2 sur 4 »
// l'identifiant d'une version : une empreinte courte du contenu utile du fichier (les commentaires ne comptent pas)
function versionSeance(texte) {
  const utile = texte.split(/\r?\n/).map(l => l.trim()).filter(l => l && l[0] !== '#').join('\n');
  let a = 5381, b = 52711;
  for (let i = 0; i < utile.length; i++) { const c = utile.charCodeAt(i); a = (a * 33 ^ c) >>> 0; b = (b * 33 ^ c) >>> 0; }
  return 'v' + ((a * 4096 + (b & 4095)) >>> 0).toString(36).padStart(7, '0').slice(-7);
}
// fait connaître la version en cours au Google Sheet (onglet « Versions ») : sans effet si elle y est déjà
function declarerVersion() {
  if (!VERSION) return;
  fetch(SCRIPT_GOOGLE, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ version: { id: VERSION, ecrans: ETAPES.length, questions: ETAPES.filter(e => e.id && e.t !== 'vote').length, texte: TEXTE.slice(0, 45000) } }) }).catch(() => { }); // le Sheet n'en garde pas plus (les images ajoutées alourdiraient l'envoi)
}
// les questions dans l'ordre, numérotées : sert au test papier, à la fiche réponse et à sa lecture
const QUESTIONS = () => ETAPES.filter(e => e.id && e.t !== 'vote').map((e, i) => ({ ...e, n: i + 1 }));

// ---------- le compte de l'équipe : adresse et mot de passe, vérifiés par le script Google (onglet « Comptes » du Google Sheet) ----------
// Les pages de l'équipe (grand écran, modifier, données, papier, participants automatiques) demandent la connexion ;
// les données et l'historique ne sortent du Google Sheet qu'avec le jeton reçu à la connexion. Les participants n'ont rien à saisir.
// Le formulaire est un vrai formulaire : le navigateur propose d'enregistrer le mot de passe sur la machine.
const COMPTE = () => { try { const c = JSON.parse(localStorage.getItem('pdvCompte')); return c && c.jeton ? c : null; } catch (e) { return null; } };
const QUI = () => (COMPTE() || {}).mail || '';
const JETON = () => (COMPTE() || {}).jeton || '';
function deconnexion() { try { localStorage.removeItem('pdvCompte'); } catch (e) { } location.reload(); }
function journal(quoi, detail = '') {
  if (QUI()) fetch(SCRIPT_GOOGLE, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify({ journal: { jeton: JETON(), quoi, detail } }) }).catch(() => { });
}
// les pages s'ouvrent sans connexion : on note seulement la visite de quelqu'un déjà connecté. La connexion n'est demandée
// qu'au moment d'une action qui en a besoin (enregistrer ou créer un test) et sur les pages des données (Données, Profil).
const noterVisite = page => { if (COMPTE()) connexion(page); };
function connexion(page, annulable) { // rend une promesse tenue une fois la personne connectée ; note la connexion (une fois par onglet et par page)
  // annulable : demandée au milieu d'une action (enregistrer) ; « Annuler » la referme et la promesse échoue (« connexion annulée »)
  const noter = () => { try { if (sessionStorage.getItem('pdvVu' + page)) return; sessionStorage.setItem('pdvVu' + page, 1); } catch (e) { } journal('Connexion', page); };
  if (COMPTE()) { noter(); return Promise.resolve(); }
  return new Promise((fini, rate) => {
    const d = document.createElement('dialog'), champ = 'font:inherit;background:#F3F3F3;border:0;border-radius:14px;padding:12px 14px;min-height:46px;width:100%;box-sizing:border-box';
    d.style.cssText = 'border:0;border-radius:22px;padding:24px;width:min(420px,92vw);color:#141414;box-shadow:0 10px 60px rgba(20,20,20,.35)';
    d.innerHTML = `<form style="display:flex;flex-direction:column;gap:12px"><b style="font-size:26px;letter-spacing:-.03em;line-height:1">Connexion de l'équipe</b>
      <span>${annulable ? 'Pour enregistrer, connectez-vous avec le compte de l’équipe.' : 'Cette page est réservée à l’équipe.'} À la première connexion, le mot de passe que vous tapez devient le vôtre.</span>
      <label style="display:flex;flex-direction:column;gap:6px;font-weight:800">Adresse mail<input type="email" name="username" required autocomplete="username" style="${champ}"></label>
      <label style="display:flex;flex-direction:column;gap:6px;font-weight:800">Mot de passe<input type="password" name="password" required minlength="8" autocomplete="current-password" style="${champ}"></label>
      <span role="alert" style="font-weight:700;min-height:1.3em"></span>
      <button style="font:inherit;font-weight:800;background:#141414;color:#fff;border:0;border-radius:99px;padding:10px 20px;min-height:46px;cursor:pointer">Se connecter</button>
      ${annulable ? '<button type="button" data-annuler style="font:inherit;font-weight:700;background:none;border:0;text-decoration:underline;cursor:pointer;color:inherit">Annuler</button>' : '<a href="./" style="color:inherit;align-self:center">Retour à l’accueil</a>'}</form>`;
    document.body.appendChild(d); d.addEventListener('cancel', ev => ev.preventDefault());
    const f = d.querySelector('form'), dit = d.querySelector('[role=alert]'), b = d.querySelector('button');
    if (annulable) d.querySelector('[data-annuler]').onclick = () => { d.close(); d.remove(); rate(new Error('connexion annulée')); };
    f.addEventListener('submit', ev => { ev.preventDefault(); b.disabled = true; dit.textContent = 'Vérification…';
      fetch(SCRIPT_GOOGLE, { method: 'POST', body: JSON.stringify({ compte: { mail: f.username.value, passe: f.password.value } }) }).then(x => x.json()).then(x => {
        if (!x.ok) { b.disabled = false; dit.textContent = x.erreur || 'Connexion refusée.'; return; }
        try { localStorage.setItem('pdvCompte', JSON.stringify({ mail: x.mail, jeton: x.jeton })); } catch (e) { }
        d.close(); d.remove(); noter(); fini();
      }).catch(() => { b.disabled = false; dit.textContent = 'Pas de réponse : vérifiez la connexion internet.'; }); });
    d.showModal();
  });
}

// ---------- le rond du profil : un petit rond à deux yeux, comme ceux du logo, à côté de la maison et de la même taille ; il mène à la page Profil ----------
// Sur l'accueil du site, qui n'a pas de maison, il est seul en haut à droite. Il n'est pas sur les écrans de séance (téléphone, grand écran).
const rondProfil = (seul = '') => `<a href="profil.html" aria-label="Mon profil" title="Mon profil" style="display:inline-flex;align-items:center;justify-content:center;gap:.14em;width:1.35em;height:1.35em;border-radius:50%;background:#F5A0C6;vertical-align:-.3em;margin-left:.5em;flex:none;${seul}"><i style="width:.2em;height:.2em;border-radius:50%;background:#141414"></i><i style="width:.2em;height:.2em;border-radius:50%;background:#141414"></i></a>`;
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('a[aria-label="Accueil"]').forEach(a => a.insertAdjacentHTML('afterend', rondProfil(a.querySelector('[width="1.6em"]') ? 'font-size:1.19em;vertical-align:.1em' : ''))));

// ---------- les icônes : un seul jeu pour toutes les pages, pleines et épaisses comme la Scoutie en gras ----------
// Posées en CSS (masque teinté par la couleur du texte) sur tout élément portant data-ico="nom".
const ICONES = {
  maison: '<path d="M12 3 2.5 11.2h2.7V21h5.3v-6h3v6h5.3v-9.8h2.7z"/>',
  fiche: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>',
  crayon: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  barres: '<rect x="3" y="10" width="5" height="11" rx="1"/><rect x="9.5" y="3" width="5" height="18" rx="1"/><rect x="16" y="14" width="5" height="7" rx="1"/>',
  tel: '<path d="M8.5 1.5h7A2.5 2.5 0 0 1 18 4v16a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 20V4a2.5 2.5 0 0 1 2.5-2.5zM8.5 4.5v12h7v-12z"/>',
  feuille: '<path d="M5 2h9l5 5v15H5zM8 11v2.2h8V11zM8 15.5v2.2h8v-2.2z"/>',
  appareil: '<path d="M8 6l1.5-3h5L16 6h3.5A2.5 2.5 0 0 1 22 8.500v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.500 2.500 0 0 1 2 17.500v-9A2.500 2.500 0 0 1 4.500 6zM12 9a4 4 0 1 0 0 8a4 4 0 0 0 0-8z"/>',
  imprimante: '<rect x="6" y="2" width="12" height="4.5"/><path d="M4 8h16a2 2 0 0 1 2 2v7h-4v-4H6v4H2v-7a2 2 0 0 1 2-2z"/><rect x="7.500" y="14.500" width="9" height="7.500"/>',
  corbeille: '<rect x="9" y="2" width="6" height="3"/><rect x="4" y="4.500" width="16" height="2.600" rx="1"/><path d="M6 8.600h12l-1 12.400H7z"/>',
  disquette: '<path d="M3 3h14l4 4v14H3zM7 5v4h8V5zM12 12.500a3 3 0 1 0 0 6a3 3 0 0 0 0-6z"/>',
  copie: '<path d="M5 2h10v2.600H6.600V17H4V3a1 1 0 0 1 1-1z"/><rect x="8.500" y="6.500" width="11.500" height="15.500" rx="2"/>',
  enveloppe: '<path d="M2.500 5h19L12 12.500z"/><path d="M2 7.600V19h20V7.600l-10 7.800z"/>',
  plus: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  lecture: '<path d="M7 3.500v17L21 12z"/>',
  coche: '<path d="M9.500 20.500 2.500 13.500l3-3 4 4 9-9.500 3 3z"/>',
  croix: '<path d="M5.600 3.500 12 9.900l6.400-6.400 2.100 2.100L14.100 12l6.400 6.400-2.100 2.100L12 14.100l-6.400 6.400-2.100-2.100L9.900 12 3.500 5.600z"/>',
  question: '<path d="M8 8.500a4 4 0 1 1 6 3.500c-1.400.8-2 1.600-2 3" fill="none" stroke="#000" stroke-width="3.400" stroke-linecap="round"/><circle cx="12" cy="20" r="2"/>',
  image: '<path d="M4.500 3h15A2.500 2.500 0 0 1 22 5.500v13a2.500 2.500 0 0 1-2.500 2.500h-15A2.500 2.500 0 0 1 2 18.500v-13A2.500 2.500 0 0 1 4.500 3zM4.500 5.500v13h15v-13zM4.500 18.500l5-6.500 3.500 4 2.500-2.500 4 5zM15.500 7.700a1.800 1.800 0 1 0 0 3.600a1.800 1.800 0 0 0 0-3.600z"/>',
  sortie: '<path d="M3 3h9v3.500H6.500v11H12V21H3z"/><path d="M14 6.500 20.500 12 14 17.500v-3.800H9v-3.400h5z"/>',
  ecran: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M10 16h4v3h3v2.500H7V19h3z"/>',
  oeil: '<path d="M1.500 12s4-7 10.500-7 10.500 7 10.500 7-4 7-10.500 7S1.500 12 1.500 12zM12 8.500a3.500 3.500 0 1 0 0 7a3.500 3.500 0 0 0 0-7z"/>',
  fleche: '<path d="M3 10h10V5l8.500 7-8.500 7v-5H3z"/>',
  menu: '<rect x="3" y="4" width="18" height="3.400" rx="1"/><rect x="3" y="10.300" width="18" height="3.400" rx="1"/><rect x="3" y="16.600" width="18" height="3.400" rx="1"/>',
  tableau: '<path d="M3 3h18v18H3zM5.500 9.500v4h5v-4zM13 9.500v4h5.500v-4zM5.500 16v2.500h5V16zM13 16v2.500h5.500V16z"/>'
};
// shortcut: l'icône d'un bouton se devine à son texte (premier mot-clé trouvé), pour ne pas étiqueter 80 boutons à la main ;
// un bouton mal deviné se corrige en lui donnant data-ico="nom" (ou data-ico="" pour aucune) dans sa page.
const ICONE_DU_TEXTE = [[/photo/, 'appareil'], [/imprim/, 'imprimante'], [/supprim/, 'corbeille'], [/sheet/, 'tableau'], [/enregistr/, 'disquette'], [/copier|dupliquer/, 'copie'],
  [/mail|messagerie/, 'enveloppe'], [/déconnect/, 'sortie'], [/données|résultats/, 'barres'], [/modifier/, 'crayon'], [/tutoriel|aide/, 'question'], [/fermer|quitter/, 'croix'],
  [/valider|inscris|terminer/, 'coche'], [/démarrer|lancer|entrer dans|essayer/, 'lecture'], [/continuer|passer cette/, 'fleche'], [/voir/, 'oeil'], [/fiche/, 'feuille'],
  [/présentation/, 'ecran'], [/affiche|logo|image/, 'image'], [/ajouter/, 'plus'], [/^menu$/, 'menu']];
const iconeDe = texte => { const t = texte.trim().toLowerCase(); if (/^[+←]|▾/.test(t)) return ''; const r = ICONE_DU_TEXTE.find(x => x[0].test(t)); return r ? r[1] : ''; };
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', `<style>[data-ico]:not([data-ico=""])::before{content:"";display:inline-block;flex:none;width:1.05em;height:1.05em;margin-right:.4em;vertical-align:-.18em;background:currentColor;-webkit-mask:var(--ico) center/contain no-repeat;mask:var(--ico) center/contain no-repeat}
${Object.keys(ICONES).map(k => `[data-ico="${k}"]{--ico:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill-rule="evenodd">${ICONES[k]}</svg>`)}")}`).join('\n')}</style>`);
  const BOUTONS = '.btn,button.lien,button.chg,button.vide,button.home';
  const poser = b => { if (b.dataset.ico === undefined || b.dataset.icoAuto) { if (b.querySelector('svg,img')) return; b.dataset.ico = iconeDe(b.textContent); b.dataset.icoAuto = 1; } };
  const tout = racine => { if (racine.nodeType !== 1) return; if (racine.matches(BOUTONS)) poser(racine); racine.querySelectorAll(BOUTONS).forEach(poser); };
  document.addEventListener('DOMContentLoaded', () => { // les pages réécrivent leurs boutons en cours de route : on repasse à chaque changement
    tout(document.body);
    new MutationObserver(l => l.forEach(m => { const b = m.target.nodeType === 1 && m.target.closest(BOUTONS); if (b) poser(b); m.addedNodes.forEach(tout); })).observe(document.body, { childList: true, subtree: true });
  });
  console.assert(iconeDe('Prendre une photo') === 'appareil' && iconeDe('+ Nouveau test') === '' && iconeDe('Fermer') === 'croix', 'icônes : devinette cassée');
}
