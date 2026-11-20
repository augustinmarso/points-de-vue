# Points de vue · séance du groupe d'habitants testeurs

Le site : https://augustinmarso.github.io/points-de-vue/ propose trois entrées.

- **Passer le test** : rejoindre une séance avec son téléphone, ou l'animer sur le grand écran (`?ecran`).
- **Modifier le test** : `modifier.html`, l'éditeur des écrans (ordre, textes, réponses, affiches, écran masqué).
- **Étudier les données** : `resultats.html`, les totaux anonymes, la comparaison de séances et le lien vers le Google Sheet.

## Modifier les écrans de la séance

Le plus simple : la page **Modifier le test** du site. Pour y enregistrer, il faut un jeton GitHub (la page explique comment), gardé dans le navigateur.

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
