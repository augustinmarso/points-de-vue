// La liaison entre les téléphones et le grand écran, par un relais internet (MQTT sur WebSocket, serveurs publics gratuits).
// Avant, les appareils se parlaient en direct (PeerJS) : cela ne marchait que sur un même réseau local.
// Ce fichier garde la même façon de s'en servir : new Peer(), connect(), on('open' | 'data' | 'close' | 'error'), send(), destroy().
// Le grand écran écoute sur tous les relais à la fois ; un téléphone prend le premier qui répond.
// shortcut: relais publics, sans compte ni chiffrement : les messages d'une séance sont lisibles par qui devine son code. À remplacer par un relais privé si les réponses deviennent sensibles.
(() => {
  // le premier passe par le port web ordinaire (443) : c'est le seul que laissent sortir les réseaux filtrés (écoles, wifi publics, certains antivirus)
  const RELAIS = ['wss://public.cloud.shiftr.io', 'wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const enc = new TextEncoder, dec = new TextDecoder;
  const coller = (...p) => { const t = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of p) { t.set(x, i); i += x.length; } return t; };
  const mot = s => { const b = enc.encode(s); return coller([b.length >> 8, b.length & 255], b); };
  const paquet = (type, corps) => { const l = []; let n = corps.length; do { const d = n % 128; n = n / 128 | 0; l.push(n ? d | 128 : d); } while (n); return coller([type], l, corps); };
  const GROS = 12000;
  const hasard = () => Math.random().toString(36).slice(2, 12);

  class Voix { // de quoi écouter et prévenir
    on(ev, f) { ((this.ecoutes = this.ecoutes || {})[ev] = this.ecoutes[ev] || []).push(f); return this; }
    emit(ev, x) { ((this.ecoutes || {})[ev] || []).slice().forEach(f => { try { f(x); } catch (e) { console.error(e); } }); }
  }

  class Fil extends Voix { // une connexion à un relais ; se rouvre toute seule
    constructor(url) { super(); this.url = url; this.sujets = new Map(); this.ouvert = false; this.ouvrir(); }
    ouvrir() {
      if (this.ferme) return;
      let ws, tas = new Uint8Array(0);
      try { ws = this.ws = new WebSocket(this.url, 'mqtt'); } catch (e) { return this.tard = setTimeout(() => this.ouvrir(), 3000); }
      ws.binaryType = 'arraybuffer';
      const garde = setTimeout(() => ws.close(), 7000); // un relais qui ne répond pas en 7 secondes est abandonné
      ws.onopen = () => ws.send(paquet(0x10, coller(mot('MQTT'), [4, 0xC2, 0, 60], mot('pdv' + hasard()), mot('public'), mot('public'))));
      ws.onmessage = m => {
        tas = coller(tas, new Uint8Array(m.data));
        for (;;) { // un paquet peut arriver en plusieurs morceaux, ou plusieurs paquets d'un coup
          if (tas.length < 2) return;
          let n = 0, k = 1, f = 1; for (; ; k++) { if (k >= tas.length) return; n += (tas[k] & 127) * f; f *= 128; if (!(tas[k] & 128)) break; if (k > 4) return ws.close(); }
          const debut = k + 1; if (tas.length < debut + n) return;
          const p = tas.subarray(debut, debut + n), type = tas[0] >> 4, qos = tas[0] >> 1 & 3; tas = tas.slice(debut + n);
          if (type === 2) { clearTimeout(garde); if (p[1]) return ws.close(); this.ouvert = true; for (const s of this.sujets.keys()) this.abonner(s); this.emit('open'); }
          if (type === 3) {
            const lt = p[0] << 8 | p[1], sujet = dec.decode(p.subarray(2, 2 + lt)); let d;
            try { d = JSON.parse(dec.decode(p.subarray(2 + lt + (qos ? 2 : 0)))); } catch (e) { continue; }
            (this.sujets.get(sujet) || []).slice().forEach(g => { try { g(d); } catch (e) { console.error(e); } });
          }
        }
      };
      ws.onclose = () => { clearTimeout(garde); if (ws !== this.ws) return; const etait = this.ouvert; this.ouvert = false; this.emit(etait ? 'close' : 'rate'); clearTimeout(this.tard); this.tard = setTimeout(() => this.ouvrir(), 2000); };
      ws.onerror = () => { };
    }
    abonner(s) { if (this.ouvert) this.ws.send(paquet(0x82, coller([0, 1], mot(s), [0]))); }
    ecouter(s, g) { if (!this.sujets.has(s)) { this.sujets.set(s, []); this.abonner(s); } this.sujets.get(s).push(g); }
    oublier(s, g) { const l = this.sujets.get(s); if (l) { const i = l.indexOf(g); if (i >= 0) l.splice(i, 1); } }
    dire(s, d) { if (!this.ouvert) return false; try { this.ws.send(paquet(0x30, coller(mot(s), enc.encode(JSON.stringify(d))))); return true; } catch (e) { return false; } }
    fermer() { this.ferme = true; clearTimeout(this.tard); clearInterval(this.pouls); try { this.ws.close(); } catch (e) { } }
  }
  const pouls = f => f.pouls = setInterval(() => { if (f.ouvert) f.ws.send(new Uint8Array([0xC0, 0])); }, 25000);

  // côté téléphone : un seul fil pour toute la page (cent robots dans une page = une seule connexion), qui change de relais si le sien ne répond plus
  let commun = null;
  const filCommun = () => {
    if (commun) return commun;
    const c = commun = new Voix; let i = 0;
    const essayer = () => {
      const f = c.fil = new Fil(RELAIS[i % RELAIS.length]); pouls(f);
      f.on('open', () => c.emit('open'));
      const suivant = () => { f.fermer(); i++; c.emit('close'); setTimeout(essayer, 300); };
      f.on('close', suivant); f.on('rate', suivant);
    };
    essayer(); return c;
  };

  class Lien extends Voix { // ce que l'appli appelle « c » : un téléphone vu du grand écran, ou le grand écran vu d'un téléphone
    emit(ev, x) { if (ev === 'open') this.open = true; if (ev === 'close') this.open = false; super.emit(ev, x); } // l'appli lit « c.open »
    // un gros message (photo d'affiche, test avec images) part en morceaux : les relais refusent les paquets trop lourds
    send(d) {
      const j = JSON.stringify(d); if (j.length <= GROS) return this.envoi({ f: this.moi, d });
      const id = hasard(), n = Math.ceil(j.length / GROS); for (let i = 0; i < n; i++) this.envoi({ f: this.moi, m: [id, i, n], s: j.slice(i * GROS, (i + 1) * GROS) });
    }
    lire(m) { // rend le message, ou rien tant qu'il manque des morceaux
      if (!m.m) return m.d;
      const [id, i, n] = m.m; if (!(n > 0 && n < 2000) || typeof m.s !== 'string') return;
      if (!this.tas || this.tas.id !== id) this.tas = { id, p: [], n: 0 }; // un seul gros message à la fois par appareil
      if (this.tas.p[i] == null) { this.tas.p[i] = m.s; this.tas.n++; }
      if (this.tas.n < n) return; const j = this.tas.p.join(''); this.tas = null; try { return JSON.parse(j); } catch (e) { }
    }
  }

  class Peer extends Voix {
    constructor(id) {
      super(); this.hote = !!id; this.id = id || hasard(); this.minuteurs = []; this.liens = new Map();
      if (this.hote) this.accueillir(); else { this.commun = filCommun(); let dit = false; const pret = () => { if (!this.fini && !dit) { dit = true; this.emit('open', this.id); } }; if (this.commun.fil.ouvert) setTimeout(pret); this.suivre(this.commun, 'open', pret); this.suivre(this.commun, 'close', () => this.emit('disconnected')); }
    }
    suivre(v, ev, f) { const g = x => { if (!this.fini) f(x); }; v.on(ev, g); }
    // ---- le grand écran ----
    accueillir() {
      const base = 'pdv-gtm/' + this.id, moi = hasard(); let ouvert = false;
      this.fils = RELAIS.map(url => {
        const f = new Fil(url); pouls(f);
        f.on('open', () => { f.dire(base + '/tous', { k: '_neuf', de: moi }); if (!ouvert) { ouvert = true; this.emit('open', this.id); } }); // les téléphones déjà là se présentent de nouveau
        f.ecouter(base + '/tous', m => { if (m && m.k === '_neuf' && m.de !== moi && !this.fini) { this.emit('error', { type: 'unavailable-id' }); this.destroy(); } }); // un autre grand écran vient de prendre cette séance
        f.ecouter(base + '/h', m => {
          if (this.fini || !m || typeof m.f !== 'string') return;
          let c = this.liens.get(m.f);
          if (m.k === '_bye') { if (c) { this.liens.delete(m.f); c.emit('close'); } return; }
          if (!c) {
            if (m.k !== '_bonjour') return f.dire(base + '/c/' + m.f, { k: '_inconnu' }); // un téléphone d'avant un rechargement : il se présentera de nouveau
            c = new Lien; c.moi = moi; c.envoi = x => c.fil.dire(base + '/c/' + m.f, x); c.fil = f; this.liens.set(m.f, c);
            c.envoi({ k: '_ok' }); this.emit('connection', c); c.emit('open'); // le « oui » part avant tout le reste : le téléphone n'écoute qu'après
          }
          else if (m.k === '_bonjour') c.envoi({ k: '_ok' });
          c.fil = f; c.vu = Date.now();
          if (!m.k) { const d = c.lire(m); if (d !== undefined) c.emit('data', d); }
        });
        return f;
      });
      this.minuteurs.push(setInterval(() => { for (const [id, c] of this.liens) if (Date.now() - c.vu > 20000) { this.liens.delete(id); c.emit('close'); } }, 5000)); // un téléphone muet depuis 20 secondes est parti
      this.minuteurs.push(setTimeout(() => { if (!ouvert && !this.fini) this.emit('error', { type: 'network' }); }, 10000));
    }
    // ---- le téléphone ----
    connect(hote) {
      const base = 'pdv-gtm/' + hote, c = new Lien, fil = () => this.commun.fil; let lie = false;
      c.moi = this.id; c.envoi = x => fil().dire(base + '/h', x);
      const recu = m => { if (this.fini || !m) return; if (m.k === '_ok') { if (!lie) { lie = true; c.emit('open'); } } else if (m.k === '_inconnu') { if (lie) { lie = false; c.emit('close'); } } else if (!m.k && lie) { const d = c.lire(m); if (d !== undefined) c.emit('data', d); } };
      const neuf = m => { if (!this.fini && m && m.k === '_neuf' && lie) { lie = false; c.emit('close'); } };
      const brancher = () => { fil().ecouter(base + '/c/' + this.id, recu); fil().ecouter(base + '/tous', neuf); };
      brancher(); this.suivre(this.commun, 'open', brancher); // après un changement de relais
      this.quitter = () => { c.envoi({ f: this.id, k: '_bye' }); fil().oublier(base + '/c/' + this.id, recu); fil().oublier(base + '/tous', neuf); };
      const signe = () => c.envoi({ f: this.id, k: lie ? '_vie' : '_bonjour' }); // se présente jusqu'à la réponse du grand écran, puis donne signe de vie
      let tic = 0; signe(); this.minuteurs.push(setInterval(() => { if (!lie || ++tic % 2 === 0) signe(); }, 3000));
      return c;
    }
    reconnect() { } // les fils se rouvrent tout seuls
    destroy() { if (this.fini) return; if (this.quitter) this.quitter(); this.fini = true; this.minuteurs.forEach(t => { clearInterval(t); clearTimeout(t); }); (this.fils || []).forEach(f => f.fermer()); }
  }
  window.Peer = Peer;
})();
