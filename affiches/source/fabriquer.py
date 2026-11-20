# Fabrique les affiches de test « Bien vivre chez soi » en A4 (1000 x 1414 px), avec la police et les couleurs de la charte
# Points de vue et le bas de page de Granville Terre et Mer (bandeau blanc des partenaires, cartouche arrondi à droite).
# Trois compositions (titre géant, date d'abord, question + bandeau photo) et des variantes qui ne changent qu'UNE chose
# à la fois (police, taille du titre, taille du texte, contraste, couleurs, densité, type d'image), pour comparer A et B.
# Lancer : python fabriquer.py   (Chrome installé ; sorties dans ../ et un PDF dans 03-livrables/affiches-test/)
import io, os, subprocess, shutil, segno, fitz
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.dirname(ICI)
IMG = os.path.join(ICI, 'images')
TMP = os.path.join(ICI, '_tmp'); os.makedirs(TMP, exist_ok=True)
PDF = os.path.join(SORTIE, '..', '..', 'affiches-test'); os.makedirs(PDF, exist_ok=True)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LOGO_GTM = 'file:///C:/claude/groupe-testeur-sante/03-livrables/affiche-invitation/logo-gtm-officiel.svg'
POLICE = 'file:///C:/claude/portfolio/src/app/fonts/scoutie-normal-latin.woff2'
TRAME = r"C:\Users\marso\.claude\skills\charte-graphique\scripts\trame.py"
ORIGINE = r"C:\claude\groupe-testeur-sante\01-recherche\affiches-seniors-mathilde\chutes-reunions.pdf"

# --- les images : une photo en couleurs, la même tramée en gros points, une autre photo, le dessin et les logos de l'affiche d'origine ---
salon = Image.open(os.path.join(IMG, 'salon.jpg')).convert('RGB')
salon.crop((0, 0, 900, 900)).save(os.path.join(TMP, 'salon.jpg'), quality=92); salon.save(os.path.join(TMP, 'salon-large.jpg'), quality=92)
Image.open(os.path.join(IMG, 'equilibre.jpg')).convert('RGB').crop((533, 0, 1600, 1067)).save(os.path.join(TMP, 'equilibre.jpg'), quality=92)
subprocess.run(['python', '-I', TRAME, os.path.join(TMP, 'salon.jpg'), TMP, '--nom', 'salon', '--pas', '22', '--largeur', '1200', '--eclaircir'], check=True, capture_output=True)
pg = fitz.open(ORIGINE)[0]; r = pg.rect
clip = lambda x0, y0, x1, y1: fitz.Rect(r.width * x0, r.height * y0, r.width * x1, r.height * y1)
pg.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip(.36, .325, .64, .52)).save(os.path.join(TMP, 'dessin.png'))
pg.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip(.205, .866, .9, .928)).save(os.path.join(TMP, 'partenaires.png'))  # les logos des partenaires, sans celui de GTM (il est dans le cartouche)
segno.make('https://www.granville-terre-mer.fr', error='m').save(os.path.join(TMP, 'qr.svg'), scale=10, border=0, dark='#141414')

CSS = """
@font-face{font-family:"Scoutie Sans";font-weight:200 800;src:url("%s") format("woff2")}
html,body{margin:0}
*{box-sizing:border-box}
.a{width:1000px;height:1414px;padding:72px;background:#fff;color:#141414;font-family:'Scoutie Sans',Helvetica,Arial,sans-serif;position:relative;overflow:hidden}
h1{margin:0;font-weight:800;letter-spacing:-.055em;line-height:.86}
p{margin:0}
.photo{position:absolute;object-fit:cover;display:block}
.plus,.qr{display:none}
.n{font-weight:800;letter-spacing:-.05em;line-height:.9;flex:none}
.rt{font-weight:800;letter-spacing:-.02em;line-height:1.05}
/* le bas de page de Granville : bandeau blanc des partenaires, cartouche arrondi à droite */
.bandeau{position:absolute;left:0;right:0;bottom:0;height:120px;padding:0 72px;background:#fff;box-shadow:0 -4px 20px rgba(20,20,20,.16);display:flex;align-items:center}
.bandeau img{height:84px;margin-left:-14px}
.gtm{position:absolute;right:0;bottom:59px;width:350px;height:128.5px;padding-left:14px;background:#fff;border-radius:64.25px 0 0 64.25px;box-shadow:0 4px 20px rgba(20,20,20,.22);display:flex;align-items:center;justify-content:center}
.gtm img{height:84px}

/* ===== composition 1 : le titre géant sur trois lignes, la photo en hauteur ===== */
.c1 h1{font-size:160px;line-height:.84}
.c1 .photo{right:0;top:0;width:360px;height:560px}
.c1 .chapo{margin-top:34px;font-size:28px;line-height:1.25;font-weight:700;max-width:560px}
.c1 .gratuit{margin:26px 0 0 -72px;padding:14px 26px 14px 72px;display:table;background:#F5A0C6;font-size:30px;font-weight:800;letter-spacing:-.02em}
.c1 .date{margin-top:34px;font-size:72px;line-height:.95;font-weight:800;letter-spacing:-.045em}
.c1 .heure{margin-top:8px;font-size:38px;line-height:1.1;font-weight:700;letter-spacing:-.02em}
.c1 .rows{margin-top:36px;display:grid;grid-template-columns:1fr 1fr;gap:20px 36px}
.c1 .row{display:flex;gap:14px;align-items:flex-start}
.c1 .n{font-size:64px;width:46px}
.c1 .rt{font-size:33px}
.c1 .rs{font-size:24px;line-height:1.3;margin-top:4px}
.c1 .lieu{margin-top:34px;font-size:26px;line-height:1.4;max-width:600px}

.titre-petit h1{font-size:54px!important;line-height:1!important;letter-spacing:-.03em;max-width:540px}
.titre-petit h1 br{display:none}
.titre-petit .photo{height:190px!important}

.typo-script h1{font-family:'Pacifico',cursive;font-weight:400;letter-spacing:0;font-size:124px!important;line-height:1.02!important}
.typo-script .chapo,.typo-script .gratuit,.typo-script .date,.typo-script .heure,.typo-script .rt,.typo-script .n{font-family:'Pacifico',cursive;font-weight:400!important;letter-spacing:0!important}
.typo-script .date{font-size:60px!important}
.typo-script .rs,.typo-script .lieu{font-weight:300;font-style:italic}

.texte-petit .chapo{font-size:14px!important;max-width:300px!important}
.texte-petit .gratuit{font-size:14px!important;padding:6px 12px 6px 72px!important}
.texte-petit .date{font-size:30px!important}.texte-petit .heure{font-size:16px!important}
.texte-petit .rows{gap:8px 14px!important;max-width:420px}
.texte-petit .n{font-size:24px!important;width:20px!important}.texte-petit .rt{font-size:14px!important}.texte-petit .rs{font-size:11px!important}
.texte-petit .lieu{font-size:12px!important;max-width:330px!important}

.contraste-faible h1{color:#F5A0C6}
.contraste-faible .chapo,.contraste-faible .rt,.contraste-faible .rs,.contraste-faible .lieu,.contraste-faible .n{color:#C8C8C8}
.contraste-faible .date,.contraste-faible .heure{color:#F7C33B}
.contraste-faible .gratuit{background:#FCE3EE;color:#fff}

.couleurs-multi h1{color:#1B6E8C}
.couleurs-multi .chapo{color:#2B9AA8}
.couleurs-multi .gratuit{background:#F7941D;color:#fff}
.couleurs-multi .date{color:#0E5A75}.couleurs-multi .heure{color:#8DC63F}
.couleurs-multi .row{padding:12px 14px;border-radius:22px}
.couleurs-multi .rows{gap:10px 12px!important}
.couleurs-multi .row:nth-child(1){background:#8DC63F;color:#0E5A75}.couleurs-multi .row:nth-child(2){background:#F7941D;color:#0E5A75}
.couleurs-multi .row:nth-child(3){background:#FFC843;color:#0E5A75}.couleurs-multi .row:nth-child(4){background:#00B5D8;color:#fff}
.couleurs-multi .lieu{color:#D6336C;margin-top:18px!important}

.dense h1{font-size:104px!important}
.dense .photo{width:300px!important;height:330px!important}
.dense .chapo{font-size:20px!important;margin-top:20px!important}
.dense .gratuit{font-size:20px!important;margin-top:14px!important;padding-top:8px!important;padding-bottom:8px!important}
.dense .date{margin-top:18px!important;font-size:40px!important}.dense .heure{font-size:22px!important}
.dense .rows{gap:12px 26px!important;margin-top:18px!important}.dense .n{font-size:34px!important;width:26px!important}.dense .rt{font-size:20px!important}.dense .rs{font-size:15px!important}
.dense .lieu{font-size:16px!important;margin-top:16px!important;max-width:640px!important}
.dense .plus{display:block;font-size:16px;line-height:1.3;margin-top:12px;max-width:560px}
.dense span.plus{display:inline;margin:0}

.fond-couleur{background:#F7C33B}
.fond-couleur .gratuit{background:#141414;color:#fff}

.leger .chapo,.leger .rs,.leger .lieu .suite{display:none}
.leger .rows{gap:30px 36px!important;margin-top:44px!important}
.leger .date{margin-top:44px!important}
.leger .gratuit{margin-top:120px!important}

/* ===== composition 2 : la date d'abord, la photo dans un grand rond ===== */
.c2 .photo{right:-150px;top:70px;width:580px;height:580px;border-radius:50%%}
.c2 .sur{font-size:28px;font-weight:800;letter-spacing:-.02em;max-width:400px;line-height:1.1}
.c2 .jour{margin-top:34px;font-size:66px;font-weight:800;letter-spacing:-.04em;line-height:1}
.c2 .num{font-size:420px;font-weight:800;letter-spacing:-.07em;line-height:.78;margin-left:-14px}
.c2 .mois{font-size:112px;font-weight:800;letter-spacing:-.055em;line-height:.9;margin-top:8px}
.c2 .heure{font-size:44px;font-weight:700;letter-spacing:-.02em;margin-top:18px}
.c2 h1{font-size:88px;margin-top:54px}
.c2 .rows{display:grid;grid-template-columns:1fr 1fr;gap:16px 30px;margin-top:34px;max-width:800px}
.c2 .row{display:flex;align-items:baseline;gap:12px}
.c2 .n{font-size:40px;width:30px}
.c2 .rt{font-size:28px}
.c2 .rs{display:none}
.c2 .lieu{margin-top:30px;font-size:26px;line-height:1.3;max-width:560px}
.c2 .lieu .suite{display:none}

/* ===== composition 3 : une question, la photo en bandeau, les quatre ateliers sur un aplat bleu, le QR code ===== */
.c3 h1{font-size:92px;line-height:.9;max-width:860px}
.c3 .photo{position:static;width:1000px;height:390px;margin:40px -72px 0}
.c3 .rows{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin:0 -72px;padding:30px 72px 34px;background:#1F6FE0;color:#fff}
.c3 .n{font-size:60px;display:block}
.c3 .rt{font-size:25px;margin-top:8px}
.c3 .rs{display:none}
.c3 .bas{display:flex;justify-content:space-between;align-items:flex-start;gap:30px;margin-top:38px}
.c3 .date{font-size:54px;line-height:.95;font-weight:800;letter-spacing:-.04em}
.c3 .heure{font-size:32px;font-weight:700;margin-top:8px}
.c3 .lieu{font-size:24px;line-height:1.3;margin-top:14px;max-width:470px}
.c3 .lieu .suite{display:none}
.c3 .qr{display:flex;align-items:center;gap:16px;width:330px;font-size:20px;line-height:1.2}
.c3 .qr img{width:140px;height:140px;flex:none}
""" % POLICE

BAS = '<div class="bandeau"><img src="partenaires.png" alt=""></div><div class="gtm"><img src="' + LOGO_GTM + '" alt=""></div>'
ATELIERS = [('Bouger en sécurité', "L'équilibre, pour éviter les chutes", ". Vous pourrez vous inscrire aux ateliers «&nbsp;Gym'équilibre&nbsp;» proposés toute l'année."),
            ('Bien manger', 'Pour rester en forme', ", avec les conseils d'une diététicienne."),
            ('Adapter son logement', 'Prévenir les risques chez soi', ', avec un ergothérapeute qui répond à vos questions.'),
            ("S'informer", 'Aides et accompagnement', '&nbsp;: les acteurs locaux vous expliquent vos droits.')]
ROWS = '<div class="rows">' + ''.join('<div class="row"><span class="n">%d</span><div><div class="rt">%s</div><div class="rs">%s<span class="plus">%s</span></div></div></div>' % ((i + 1,) + a) for i, a in enumerate(ATELIERS)) + '</div>'
LIEU = '<div class="lieu"><b>Salle de Hérel</b>, boulevard des Amiraux, Granville<span class="suite"><br>Aussi à Villedieu-les-Poêles Rouffigny, salle des fêtes, le jeudi 17 septembre 2026</span></div>'

def c1(img):
    return ('<img class="photo" src="%s" alt=""><h1>Bien<br> vivre<br> chez soi</h1>' % img
            + '<p class="chapo">Quatre ateliers pratiques pour rester chez vous le plus longtemps possible.</p>'
            + '<p class="plus">Des conseils utiles et des solutions concrètes. Animé par des professionnels de santé du territoire&nbsp;: médecin, diététicienne, ergothérapeute, enseignants en activité physique adaptée, acteurs locaux, etc.</p>'
            + '<div class="gratuit">Gratuit. Sans inscription. À partir de 60&nbsp;ans.</div>'
            + '<div class="date">Jeudi 10 septembre</div><div class="heure">de 14&nbsp;h à 17&nbsp;h</div>' + ROWS + LIEU
            + "<p class=\"plus\">Avec Granville Terre et Mer, Villedieu Intercom, le Département de la Manche, Siel Bleu, la CPTS Sud Manche, Santé Sport, l'EPGV et les secteurs d'action gérontologique.</p>")
def c2(img):
    return ('<img class="photo" src="%s" alt=""><div class="sur">Ateliers gratuits, à partir de 60&nbsp;ans, sans inscription</div>' % img
            + '<div class="jour">Jeudi</div><div class="num">10</div><div class="mois">septembre</div><div class="heure">de 14&nbsp;h à 17&nbsp;h</div>'
            + '<h1>Bien vivre chez soi</h1>' + ROWS + LIEU)
def c3(img):
    return ('<h1>Et si vous restiez chez vous plus longtemps&nbsp;?</h1><img class="photo" src="%s" alt="">' % img + ROWS
            + '<div class="bas"><div><div class="date">Jeudi 10 septembre</div><div class="heure">de 14&nbsp;h à 17&nbsp;h, gratuit</div>' + LIEU + '</div>'
            + '<div class="qr"><img src="qr.svg" alt=""><div>Le programme&nbsp;: scannez ce code ou demandez-le <b>à votre mairie</b></div></div></div>')

TRAMEE, COULEUR, DESSIN, EQUI, LARGE = 'salon-tramee.jpg', 'salon.jpg', 'dessin.png', 'equilibre.jpg', 'salon-large.jpg'
# nom du fichier -> (composition, classes, image)
AFFICHES = {
    'reference': (c1, 'c1', TRAMEE),                      # étapes 1 et 2 : l'affiche de référence
    'date': (c2, 'c2', EQUI),                             # autre structure : la date d'abord
    'cercles-qr': (c3, 'c3', LARGE),                      # étape 3 : la question, le bandeau photo, le QR code
    'typo-script': (c1, 'c1 typo-script', TRAMEE),
    'titre-petit': (c1, 'c1 titre-petit', TRAMEE),
    'texte-petit': (c1, 'c1 texte-petit', TRAMEE),
    'contraste-faible': (c1, 'c1 contraste-faible', TRAMEE),
    'couleurs-multi': (c1, 'c1 couleurs-multi', COULEUR),
    'dense': (c1, 'c1 dense', TRAMEE),
    'leger': (c1, 'c1 leger', TRAMEE),
    'image-couleur': (c1, 'c1', COULEUR),
    'image-dessin': (c1, 'c1', DESSIN),
    'fond-couleur': (c1, 'c1 fond-couleur', COULEUR),             # un aplat de couleur sur tout le fond (vu sur des affiches repérées sur Pinterest)
}
pages = []
for nom, (compo, classes, img) in AFFICHES.items():
    html = os.path.join(TMP, nom + '.html'); png = os.path.join(TMP, nom + '.png')
    io.open(html, 'w', encoding='utf-8').write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pacifico&display=block"><style>'
                                              + CSS + '</style></head><body><div class="a ' + classes + '">' + compo(img) + BAS + '</div></body></html>')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1000,1414', '--virtual-time-budget=7000',
                    '--user-data-dir=' + os.path.join(TMP, 'chrome'), '--screenshot=' + png, 'file:///' + html.replace('\\', '/')], check=True, capture_output=True)
    im = Image.open(png).convert('RGB'); assert im.size == (1000, 1414), im.size
    im.save(os.path.join(SORTIE, nom + '.jpg'), quality=84); pages.append(im); print(nom, 'ok')
pages[0].save(os.path.join(PDF, 'affiches-test-A4.pdf'), save_all=True, append_images=pages[1:], resolution=120.9)  # 1000 px sur 210 mm
shutil.rmtree(os.path.join(TMP, 'chrome'), ignore_errors=True)
