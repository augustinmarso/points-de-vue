// Lecteur et écrivain de seance.txt, partagés par l'appli (index.html), l'éditeur (modifier.html) et les résultats (resultats.html).
// ---------- le contenu de la séance : il est dans le fichier seance.txt, modifiable directement sur GitHub ----------
let PHASES = { 1: { nom: 'Étape 1', quoi: '' }, 2: { nom: 'Étape 2', quoi: '' }, 3: { nom: 'Étape 3', quoi: '' } };
let ETAPES = [{ t: 'accueil' }], MISSIONS = ["L'information à faire passer"], TESTS = [];
let VERSION = '', TEXTE = ''; // l'identifiant de la version du test (change dès que seance.txt change) et son contenu
const SCRIPT_GOOGLE = 'https://script.google.com/macros/s/AKfycbzPof8sEj8tZLlA-MtVDYyODv32y8lXxc9hLVmaW5zCvHLilyRIxpk4Ix6TPhzJczjn/exec';
let TOUS = ETAPES; // tous les écrans du fichier, y compris ceux qui sont masqués (pour l'éditeur)
// ---------- plusieurs tests : le principal est seance.txt ; les autres sont dans le dossier tests/ et listés dans tests.txt (une ligne « nom-court | Nom du test ») ----------
// Une page ouvre un autre test avec ?test=nom-court ; TQ s'ajoute aux liens pour rester sur le même test d'une page à l'autre.
const TEST = (new URLSearchParams(location.search).get('test') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
const FICHIER = TEST ? 'tests/' + TEST + '.txt' : 'seance.txt', TQ = TEST ? '&test=' + TEST : '';
const lireTests = t => [{ id: '', nom: 'Séance Points de vue (principale)' }, ...String(t || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && l[0] !== '#')
  .map(l => { const [id, nom] = l.split('|').map(x => x.trim()); return { id, nom: nom || id }; }).filter(x => /^[a-z0-9-]{1,40}$/.test(x.id))];
const listeTests = () => fetch('tests.txt?' + Date.now()).then(x => x.ok ? x.text() : '').catch(() => '').then(lireTests);
// le contenu du test ; un test tout juste créé met une à deux minutes à arriver sur le site : en attendant, la copie gardée à sa création sert
const lireFichier = () => fetch(FICHIER + '?' + Date.now()).then(x => x.ok ? x.text() : Promise.reject())
  .catch(() => { let t = ''; try { t = localStorage.getItem('pdvNeuf' + TEST) || ''; } catch (e) { } return TEST && t ? t : Promise.reject(); });
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
      else if (mot === 'avis') e = { id: id(reste), t: 'texte', q: reste };
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
    else if (k === 'reponses' && e.o) e.t = /plusieurs/.test(sans(v)) ? 'multi' : 'choix';
    else if (k === 'precision') e.note = v;
    else if (k === 'de') e.a = v; else if (k === 'a') e.b = v;
    else if (k === 'noir et blanc') e.nb = /oui/.test(sans(v));
    else if (k === 'masque') e.masque = /oui/.test(sans(v));
    else if (k === 'affiche a' && e.imgs) e.imgs[0] = v; else if (k === 'affiche b' && e.imgs) e.imgs[1] = v;
    else if (k === 'affiche') { if (e.jeu) e.img = v; else e.imgs = [v]; }
  }
  // une question sans réponse ne peut pas être posée, un écran masqué ne passe pas : on les retire de la séance
  const bons = E.filter(x => !x.masque && (!x.o || x.o.length > 1));
  if (bons.length) { TEXTE = texte; VERSION = versionSeance(texte); TOUS = E; ETAPES = bons; if (M.length) MISSIONS = M; TESTS = T; PHASES = { ...PHASES, ...P }; }
  return bons.length;
}

// réécrit seance.txt à partir du contenu en mémoire (utilisé par l'éditeur)
const AIDE = "# LA SÉANCE « POINTS DE VUE », ÉCRAN PAR ÉCRAN\n# ------------------------------------------------------------------\n# Le plus simple pour le modifier : la page « Modifier le test » du site.\n# Il se modifie aussi directement sur GitHub : bouton crayon en haut à droite,\n# puis bouton vert « Commit changes ». Le site est à jour une à deux minutes après.\n#\n# Chaque écran commence par un mot entre crochets. L'ordre du fichier est l'ordre de la séance.\n# Pour retirer un écran : supprimez ses lignes. Pour en déplacer un : coupez-collez ses lignes.\n# Une ligne qui commence par # est un commentaire, l'appli ne la lit pas.\n#\n#   [accueil]              la salle d'attente (QR code, code, participants connectés)\n#   [texte] petit titre | grand titre | phrase\n#   [5 secondes] image     une affiche montrée 5 secondes   (ajoutez « | étape 1 » pour la rattacher à une étape)\n#   [jeu] question         question avec une bonne réponse : « + » devant la bonne, « - » devant les autres\n#   [scores]               les réussites de chacun au jeu\n#   [étape 1]              l'écran de titre d'une étape (1, 2 ou 3)\n#   [question] question    question à choix : « - » devant chaque réponse\n#                          ligne « réponses : une » ou « réponses : plusieurs »\n#   [note] question        note de 1 à 5, avec les lignes « de : » et « à : »\n#   [a ou b] question      comparaison de deux affiches, avec « affiche a : » et « affiche b : »\n#   [avis] question        avis libre : chacun écrit sa réponse (quelques mots)\n#   [mission] [photos] [tests] [palmarès] [fin]   l'atelier en binômes et la fin\n#\n# Lignes possibles sous une question :\n#   étape : 1                      (1, 2 ou 3 : donne la couleur et le titre de l'étape)\n#   affiche : affiches/nom.jpg     (l'affiche montrée à côté de la question)\n#   précision : une phrase sous la question\n#   noir et blanc : oui            (l'affiche passe en noir et blanc)\n#   masqué : oui                   (l'écran reste dans le fichier mais ne passe pas pendant la séance)\n#\n# Les images sont dans le dossier « affiches » du dépôt.\n# ------------------------------------------------------------------";
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
    else if (e.t === 'info') { L.push(`[texte] ${net(e.s)} | ${net(e.h)} | ${net(e.x)}`); if (e.p) L.push('étape : ' + e.p); if (net((e.imgs || [])[0])) L.push('affiche : ' + net(e.imgs[0])); }
    else if (e.t === 'flash') L.push(`[5 secondes] ${net(e.img)}${e.p ? ' | étape ' + e.p : ''}`);
    else {
      L.push(`[${e.jeu ? 'jeu' : e.t === 'echelle' ? 'note' : e.t === 'ab' ? 'a ou b' : e.t === 'texte' ? 'avis' : 'question'}] ${net(e.q)}`);
      if (e.p) L.push('étape : ' + e.p);
      if (!e.jeu && (e.t === 'choix' || e.t === 'multi')) L.push('réponses : ' + (e.t === 'multi' ? 'plusieurs' : 'une'));
      if (net(e.note)) L.push('précision : ' + net(e.note));
      const im = e.jeu ? [e.img] : e.imgs || [];
      if (e.t === 'ab') L.push('affiche a : ' + net(im[0]), 'affiche b : ' + net(im[1])); else if (net(im[0])) L.push('affiche : ' + net(im[0]));
      if (e.nb) L.push('noir et blanc : oui');
      if (e.t === 'echelle') L.push('de : ' + net(e.a), 'à : ' + net(e.b));
      else if (e.t !== 'ab') (e.o || []).forEach((o, i) => { if (net(o)) L.push((e.jeu && i === e.bon ? '+ ' : '- ') + net(o)); });
    }
    if (e.masque) L.push('masqué : oui');
    L.push('');
  }
  return L.join('\n');
}

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
  fetch(SCRIPT_GOOGLE, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ version: { id: VERSION, ecrans: ETAPES.length, questions: ETAPES.filter(e => e.id && e.t !== 'vote').length, texte: TEXTE } }) }).catch(() => { });
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
function connexion(page) { // rend une promesse tenue une fois la personne connectée ; note la connexion (une fois par onglet et par page)
  const noter = () => { try { if (sessionStorage.getItem('pdvVu' + page)) return; sessionStorage.setItem('pdvVu' + page, 1); } catch (e) { } journal('Connexion', page); };
  if (COMPTE()) { noter(); return Promise.resolve(); }
  return new Promise(fini => {
    const d = document.createElement('dialog'), champ = 'font:inherit;background:#F3F3F3;border:0;border-radius:14px;padding:12px 14px;min-height:46px;width:100%;box-sizing:border-box';
    d.style.cssText = 'border:0;border-radius:22px;padding:24px;width:min(420px,92vw);color:#141414;box-shadow:0 10px 60px rgba(20,20,20,.35)';
    d.innerHTML = `<form style="display:flex;flex-direction:column;gap:12px"><b style="font-size:26px;letter-spacing:-.03em;line-height:1">Connexion de l'équipe</b>
      <span>Cette page est réservée à l'équipe. À la première connexion, le mot de passe que vous tapez devient le vôtre.</span>
      <label style="display:flex;flex-direction:column;gap:6px;font-weight:800">Adresse mail<input type="email" name="username" required autocomplete="username" style="${champ}"></label>
      <label style="display:flex;flex-direction:column;gap:6px;font-weight:800">Mot de passe<input type="password" name="password" required minlength="8" autocomplete="current-password" style="${champ}"></label>
      <span role="alert" style="font-weight:700;min-height:1.3em"></span>
      <button style="font:inherit;font-weight:800;background:#141414;color:#fff;border:0;border-radius:99px;padding:10px 20px;min-height:46px;cursor:pointer">Se connecter</button>
      <a href="./" style="color:inherit;align-self:center">Retour à l'accueil</a></form>`;
    document.body.appendChild(d); d.addEventListener('cancel', ev => ev.preventDefault());
    const f = d.querySelector('form'), dit = d.querySelector('[role=alert]'), b = d.querySelector('button');
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
