# Points de vue · séance du groupe d'habitants testeurs

- Participants : https://augustinmarso.github.io/points-de-vue/
- Grand écran : https://augustinmarso.github.io/points-de-vue/?ecran
- Résultats : https://augustinmarso.github.io/points-de-vue/resultats.html

## Modifier les écrans de la séance

Tout le contenu (écrans, questions, réponses, affiches montrées) est dans **[seance.txt](seance.txt)**.

1. Ouvrir [seance.txt](seance.txt) puis cliquer sur le crayon en haut à droite
   (lien direct : https://github.com/augustinmarso/points-de-vue/edit/main/seance.txt).
2. Modifier le texte. Le mode d'emploi est écrit en haut du fichier.
3. Cliquer sur le bouton vert « Commit changes ».
4. Le site est à jour une à deux minutes plus tard. Recharger la page du grand écran et celle des téléphones.

À savoir : changer le texte d'une question en cours de séance en fait une nouvelle question (les réponses déjà données à l'ancienne restent dans le Google Sheet sous l'ancien texte).

## Le reste du dépôt

- `index.html` : l'appli (téléphone et grand écran).
- `resultats.html` : la page qui montre les résultats (totaux anonymes).
- `seance.js` : le lecteur de `seance.txt`, partagé par les deux pages.
- `affiches/` : les affiches montrées pendant la séance ; `affiches/source/` : les scripts qui les fabriquent et les contrôlent.
