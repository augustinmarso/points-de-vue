# Points de vue · séance du groupe d'habitants testeurs

Le site : https://augustinmarso.github.io/points-de-vue/ propose trois entrées.

- **Passer le test** : rejoindre une séance avec son téléphone, ou l'animer sur le grand écran (`?ecran`).
- **Modifier le test** : `modifier.html`, l'éditeur des écrans (ordre, textes, réponses, affiches, écran masqué).
- **Passer le test** : `?passer` propose le téléphone, le papier, ou la photo des fiches remplies. En mode papier (`?ecran&papier`), le grand écran montre les affiches et les questions numérotées, sans téléphone.
- **Connexion de l'équipe** : le grand écran, « Modifier », « Étudier les données », la version papier et les participants automatiques demandent une adresse mail et un mot de passe (onglet « Comptes » du Google Sheet). Le premier compte créé est accepté d'office ; pour inviter quelqu'un, écrire son adresse dans la colonne A de l'onglet « Comptes », il choisit son mot de passe à sa première connexion. Mot de passe oublié : vider les cases « sel » et « empreinte » de sa ligne. Les données et l'historique ne sortent du Sheet qu'une fois connecté. Les participants n'ont rien à saisir.
- **Participants automatiques** : `bots.html?salle=CODE&n=100` fait entrer de faux téléphones dans une séance pour l'éprouver.
- **Version papier** : `papier.html`, la fiche A3 (questions et ronds, sans image), la présentation à imprimer, et la lecture des fiches par photo.
- **Test en ligne, chez soi** : `?enligne`, le lien à envoyer par mail aux habitants. Chacun passe le test seul, les affiches sont sur sa page, l'atelier en binômes est sauté ; les réponses arrivent dans l'onglet Données sous la séance « ligne ». `?enligne&essai` pour essayer sans rien enregistrer. Texte du mail : `../test-en-ligne/mail-habitants.txt`.
- **Plusieurs tests** : « + Nouveau test » (menu des tests de Modifier le test, ou Profil) crée un test à part à partir d'une structure de départ (notre séance complète, une affiche à tester, comparer deux affiches, questionnaire court, page blanche). Toutes les pages l'ouvrent avec `?test=nom-court`. Le Profil liste les tests avec Lancer, Essayer, Modifier, Données et le lien mail.
- **Étudier les données** : `resultats.html`, les totaux anonymes, la comparaison de séances et le lien vers le Google Sheet.

## Modifier les écrans de la séance

Le plus simple : la page **Modifier le test** du site, avec le compte de l'équipe : **pas besoin de GitHub**. Les tests sont enregistrés dans le Google Sheet, onglet « Tests » (une ligne par test, le contenu en morceaux dans les colonnes H et suivantes ; « principal » = le test principal). Les images ajoutées depuis l'ordinateur sont gardées dans le test lui-même. Un fichier modifié directement sur GitHub (seance.txt, tests/…) reprend la main sur la dernière version enregistrée depuis le site.

Tout le contenu (écrans, questions, réponses, affiches montrées) est dans **[seance.txt](seance.txt)**, modifiable aussi à la main :

1. Ouvrir [seance.txt](seance.txt) puis cliquer sur le crayon en haut à droite
   (lien direct : https://github.com/augustinmarso/points-de-vue/edit/main/seance.txt).
2. Modifier le texte. Le mode d'emploi est écrit en haut du fichier.
3. Cliquer sur le bouton vert « Commit changes ».
4. Le site est à jour une à deux minutes plus tard. Recharger la page du grand écran et celle des téléphones.

À savoir : changer le texte d'une question en cours de séance en fait une nouvelle question (les réponses déjà données à l'ancienne restent dans le Google Sheet sous l'ancien texte).

## Le reste du dépôt

- `index.html` : l'appli (téléphone et grand écran).
- `modifier.html` : l'éditeur de la séance.
- `resultats.html` : l'étude des données (totaux anonymes).
- `seance.js` : lecture et écriture de `seance.txt`, partagées par les trois pages.
- `affiches/` : les affiches montrées pendant la séance ; `affiches/source/` : les scripts qui les fabriquent et les contrôlent.
