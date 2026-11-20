# Fabrique le kit de modules à découper pour l'atelier en binômes (PDF A4, 6 pages) :
# titres et slogans en plusieurs tailles, informations pratiques, images de plusieurs types, formes et aplats, bas de page.
# Toute la salle a la même information à faire passer (un atelier d'équilibre) ; chaque binôme compose son affiche A4.
# Lancer après fabriquer.py (il réutilise ses images) : python modules.py
import io, os, subprocess, shutil

ICI = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(ICI, '_tmp')
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LOGO_GTM = 'file:///C:/claude/groupe-testeur-sante/03-livrables/affiche-invitation/logo-gtm-officiel.svg'
POLICE = 'file:///C:/claude/portfolio/src/app/fonts/scoutie-normal-latin.woff2'
SORTIES = [os.path.join(ICI, '..', 'modules-atelier-A4.pdf'), os.path.join(ICI, '..', '..', '..', 'affiches-test', 'modules-atelier-A4.pdf')]

R, J, B, N = '#F5A0C6', '#F7C33B', '#1F6FE0', '#141414'
CSS = """
@font-face{font-family:"Scoutie Sans";font-weight:200 800;src:url("%s") format("woff2")}
@page{size:A4;margin:0}
html,body{margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.p{width:210mm;height:297mm;padding:12mm;font-family:'Scoutie Sans',Helvetica,Arial,sans-serif;color:#141414;page-break-after:always;display:flex;flex-wrap:wrap;gap:6mm;align-content:flex-start;position:relative}
.nom{width:100%%;font-size:9pt;font-weight:600;color:#888}
.m{outline:.3mm dashed #BBB;outline-offset:2mm;line-height:.9;font-weight:800;letter-spacing:-.045em}
.t1{font-size:64pt;width:100%%}.t2{font-size:40pt}.t3{font-size:26pt}.t4{font-size:17pt;letter-spacing:-.02em;line-height:1.15;font-weight:700}
.script{font-family:'Pacifico',cursive;font-weight:400;letter-spacing:0;line-height:1.1}
.bande{padding:3mm 5mm;font-size:20pt}
.img{width:88mm;height:88mm;object-fit:cover;display:block}
.img.petit{width:55mm;height:55mm}.img.rond{border-radius:50%%}.img.large{width:186mm;height:70mm}
.f{display:block}
""" % POLICE

def page(nom, *blocs):
    return '<div class="p"><div class="nom">%s · à découper</div>%s</div>' % (nom, ''.join(blocs))
m = lambda classes, texte, style='': '<div class="m %s" style="%s">%s</div>' % (classes, style, texte)
img = lambda src, classes='': '<img class="m img %s" src="%s" alt="">' % (classes, src)
forme = lambda w, h, c, rond=False: '<div class="m f" style="width:%dmm;height:%dmm;background:%s;%s"></div>' % (w, h, c, 'border-radius:50%' if rond else '')

PAGES = [
    page('Titres',
         m('t1', 'Restez debout&nbsp;!'), m('t1', "L'équilibre,<br>ça s'entretient"), m('t2', 'Bouger sans tomber'), m('t2', 'Restez debout&nbsp;!'),
         m('t2 script', "L'équilibre, ça s'entretient"), m('t3', "Atelier Gym'équilibre"), m('t3', 'Prévenez les chutes'), m('t3 script', 'Restez debout !')),
    page('Phrases',
         m('t3', 'Et si vous repreniez confiance dans vos pas&nbsp;?'), m('t3', 'Une heure par semaine pour rester solide sur ses jambes.'),
         m('t4', 'Des exercices simples, en petit groupe, avec un professionnel de santé.'), m('t4', 'Venez comme vous êtes, avec des chaussures plates.'),
         m('t4', "Une chute sur trois peut être évitée. L'équilibre se travaille à tout âge."), m('t4', 'Vous pouvez venir avec un proche.'),
         m('t4', 'Des exercices simples, en petit groupe, avec un professionnel de santé.', 'font-size:10pt'), m('t4', 'Venez comme vous êtes, avec des chaussures plates.', 'font-size:10pt')),
    page('Informations pratiques',
         m('t2', 'Jeudi 10 septembre'), m('t3', 'Jeudi 10 septembre'), m('t4', 'Jeudi 10 septembre'), m('t2', 'Tous les jeudis'), m('t3', 'de 14&nbsp;h à 15&nbsp;h'), m('t4', 'de 14&nbsp;h à 15&nbsp;h'),
         m('t3', 'Salle de Hérel, Granville'), m('t4', 'Salle de Hérel, boulevard des Amiraux, Granville'),
         m('bande', 'Gratuit', 'background:%s' % R), m('bande', 'Sans inscription', 'background:%s' % J), m('bande', 'À partir de 60&nbsp;ans', 'background:%s;color:#fff' % B),
         m('bande', 'Gratuit', 'background:%s;color:#fff' % N), m('bande', 'Places limitées', 'background:%s' % J), m('bande', 'Gratuit', 'background:%s;font-size:11pt' % R),
         m('t4', 'Renseignements&nbsp;: Maison Sport Santé, 02&nbsp;33&nbsp;69&nbsp;10&nbsp;05'), m('t3', '02&nbsp;33&nbsp;69&nbsp;10&nbsp;05')),
    page('Images', img('equilibre.jpg'), img('salon-tramee.jpg'), img('salon.jpg', 'rond'), img('dessin.png')),
    page('Images et chiffres', img('salon-large.jpg', 'large'), img('equilibre.jpg', 'petit rond'), img('salon-tramee.jpg', 'petit'), img('dessin.png', 'petit'),
         m('t1', '1', 'width:auto'), m('t1', '2', 'width:auto'), m('t1', '3', 'width:auto'), m('t1', '10', 'width:auto;font-size:120pt'), m('t2', '60&nbsp;ans')),
    page('Formes, aplats et bas de page',
         forme(186, 26, R), forme(120, 18, J), forme(56, 18, B), forme(70, 70, R, True), forme(50, 50, J, True), forme(40, 40, B, True), forme(60, 60, N, True),
         forme(90, 40, J), forme(86, 40, B),
         '<img class="m" src="qr.svg" style="width:34mm;height:34mm" alt="">', m('t4', 'Le programme complet&nbsp;: scannez ce code'),
         '<img class="m" src="partenaires.png" style="height:14mm" alt="">', '<img class="m" src="%s" style="height:20mm" alt="">' % LOGO_GTM),
]
html = os.path.join(TMP, 'modules.html')
io.open(html, 'w', encoding='utf-8').write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pacifico&display=block"><style>' + CSS + '</style></head><body>' + ''.join(PAGES) + '</body></html>')
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', '--user-data-dir=' + os.path.join(TMP, 'chrome'),
                '--print-to-pdf=' + SORTIES[0], 'file:///' + html.replace('\\', '/')], check=True, capture_output=True)
shutil.copy(SORTIES[0], SORTIES[1]); shutil.rmtree(os.path.join(TMP, 'chrome'), ignore_errors=True)
print('ok', SORTIES[0])
