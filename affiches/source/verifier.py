# Contrôle les affiches fabriquées : aucun texte ne doit en chevaucher un autre, passer sur une image, sous le bas de page
# de Granville ou sortir de la feuille. Lancer après fabriquer.py : python verifier.py
import io, os, re, json, subprocess, glob, shutil, html as H

ICI = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(ICI, '_tmp')
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
JS = r"""<script>
addEventListener('load', () => setTimeout(() => {
  const out = [], page = document.querySelector('.a'), bas = document.querySelector('.bandeau').getBoundingClientRect().top;
  const court = e => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 34);
  const txt = [...page.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).display !== 'none' && e.offsetParent !== null)
    .map(e => { const r = document.createRange(); r.selectNodeContents(e); return { e, b: [...r.getClientRects()].filter(b => b.width > 1 && b.height > 1) }; }).filter(x => x.b.length);
  const img = [...page.querySelectorAll('img')].filter(e => e.offsetParent !== null && !e.closest('.bandeau')).map(e => ({ e, b: e.getBoundingClientRect() }));
  const croise = (a, b, m) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > m && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) * .3;
  for (const t of txt) for (const b of t.b) {
    if (b.right > 1000.5 || b.left < -.5) out.push('sort de la feuille : ' + court(t.e));
    if (b.bottom > bas + 1 && !t.e.closest('.bandeau')) out.push('passe sous le bas de page : ' + court(t.e));
    for (const i of img) if (!i.e.closest('.qr') || !t.e.closest('.qr')) if (croise(b, i.b, 3)) out.push('texte sur une image : ' + court(t.e));
  }
  for (let i = 0; i < txt.length; i++) for (let j = i + 1; j < txt.length; j++) {
    const a = txt[i], c = txt[j]; if (a.e.contains(c.e) || c.e.contains(a.e)) continue;
    if (a.b.some(x => c.b.some(y => croise(x, y, 3)))) out.push('deux textes se chevauchent : ' + court(a.e) + ' / ' + court(c.e));
  }
  document.body.setAttribute('data-verif', JSON.stringify([...new Set(out)]));
}, 1500));
</script>"""
total = 0
for f in sorted(glob.glob(os.path.join(TMP, '*.html'))):
    nom = os.path.basename(f)[:-5]
    if nom.startswith('_') or nom == 'modules': continue
    g = os.path.join(TMP, '_verif.html')
    io.open(g, 'w', encoding='utf-8').write(io.open(f, encoding='utf-8').read().replace('</body>', JS + '</body>'))
    dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1000,1414', '--virtual-time-budget=9000',
                          '--user-data-dir=' + os.path.join(TMP, 'chrome'), '--dump-dom', 'file:///' + g.replace('\\', '/')], capture_output=True).stdout.decode('utf-8', 'replace')
    m = re.search(r'data-verif="([^"]*)"', dom)
    pb = json.loads(H.unescape(m.group(1))) if m else ['contrôle non exécuté']
    total += len(pb); print(nom, ':', 'rien à signaler' if not pb else '')
    for x in pb: print('   -', x)
shutil.rmtree(os.path.join(TMP, 'chrome'), ignore_errors=True)
print(total, 'point(s) à corriger')
