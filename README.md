# 📦 Générateur de Patron de Boîte Pharmaceutique

Outil web interactif (HTML/CSS/JS, sans framework ni backend) permettant de concevoir et d'exporter le **patron (die-cut) à plat** d'un étui pharmaceutique — comprimés ou sirop — avec aperçu en temps réel et éditeur de mise en page intégré.

---

## ✨ Fonctionnalités

### Patron & géométrie

- **Deux formats de boîte**
  - Comprimés (étui horizontal)
  - Sirop / flacon liquide (étui vertical)
- **Aperçu en temps réel** du patron à plat (panneaux, rabats, pattes de collage, rabats poussière)
- **Dimensions entièrement personnalisables** (largeur, hauteur, profondeur en mm), du grand étui jusqu'au petit format collyre
- **Rabats poussière** activables/désactivables et **longueur de rabat** ajustable
- **Zones de pli (rainage) réglables** — voir la section dédiée ci-dessous
- **Tracé technique SVG** : contour de découpe rouge et lignes de pli, recalculés à chaque modification
- **Zoom du rendu** (molette Ctrl/Cmd, boutons +/−, réinitialisation) sans perdre le formulaire de côté

### Éditeur de champs (mise en page libre)

Chaque face du patron est une zone d'édition où l'on place librement autant de champs que nécessaire.

- **9 types de champs** : texte, tableau (nom … valeur), pictogramme, code-barres EAN-13, datamatrix 2D, braille, forme/zone de couleur, logo, image importée
- **Édition directe dans la maquette** : double-clic (ou `F2`) sur un texte pour le modifier à même le patron, avec sa police, sa taille et son orientation réelles
- **Glisser-déposer** avec repères d'alignement magnétiques, poignée de redimensionnement, déplacement fin au clavier
- **Rotation** des champs (0° / 90° / 180° / 270°), utile dans les zones étroites comme les trapèzes de verrouillage
- **Sélection multiple** (Maj+clic) avec alignement, distribution et duplication de groupe
- **38 formes géométriques** (unies, bicolores, dégradés, lignes) + **éditeur de formes libres** par points
- **Annuler / Rétablir** (`Ctrl+Z` / `Ctrl+Y`)
- **Détection automatique** des débordements et chevauchements, signalés visuellement
- **Ajustement au contenu** d'un champ ou d'une sélection

### Apparence

- **Logo personnalisé** (import PNG/SVG/JPG) ou logo par défaut
- **Palette de couleurs** (primaire / accent) ajustable
- **Couleur de fond par face**
- **Typographie modulable** par zone (titres, texte courant, rabats, petits textes)
- **Repères visuels** : affichage/masquage des zones nommées et des marges perdues (zone tranquille)

### Export & sauvegarde

- **Impression / PDF** via la fonction d'impression du navigateur (mise en page dédiée)
- **Export PNG haute résolution** (html2canvas, avec repli SVG → canvas ×4 si la librairie est indisponible)
- **Export / import de gabarit JSON** : champs *et* réglages globaux (dimensions, couleurs, logo, rainage…), pour réutiliser ou partager une maquette
- **Sauvegarde automatique** des champs dans le navigateur (`localStorage`)
- **Réinitialisation** globale, par face, ou des seuls champs

---

## 🪛 Zones de pli (rainage)

Sur un étui réel, un pli n'est pas une ligne sans épaisseur : le carton est **rainé** sur une bande dont la largeur vaut à peu près son épaisseur. Sans cette bande, la matière est comprimée au pliage, l'impression se déforme le long de l'arête et les faces ne tombent pas à l'équerre.

| Réglage | Rôle |
|---|---|
| **Largeur de la zone de rainage** (0 – 6 mm) | Écarte réellement les panneaux à chaque jonction pliée. À régler sur l'épaisseur du carton : **0,3 à 0,5 mm** pour un étui pharmaceutique courant. |
| **Épaisseur du trait de pli** (0,1 – 1,5 mm) | Exprimée en millimètres, comme un trait technique. |
| **Style du trait** | Pointillé, points, trait/point (convention prépresse), continu. |
| **Couleur du trait** | Libre. |
| **Teinter la bande** | Repère d'écran uniquement — **jamais imprimé ni exporté**. |

Points à retenir :

- La valeur par défaut est **0 = panneaux jointifs** : le patron est alors strictement identique au rendu historique de l'outil.
- Les faces **ne changent pas de taille** : le rainage écarte les panneaux, il ne les redimensionne pas. Textes et codes-barres conservent leurs dimensions exactes.
- L'écartement est propagé partout : contour de découpe, lignes de pli, rabats trapézoïdaux, rabats poussière, plis internes et export PNG.

---

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|---|---|
| `Double-clic` / `F2` / `Entrée` | Éditer le texte d'un champ directement dans la maquette |
| `Échap` | Annuler l'édition en cours / désélectionner |
| `Ctrl`+`Entrée` | Valider l'édition |
| `Tab` / `Maj`+`Tab` | Champ éditable suivant / précédent de la face |
| `Flèches` | Déplacer le champ sélectionné (`Maj` = pas plus large) |
| `Suppr` / `Retour arrière` | Supprimer le champ (ou le groupe) sélectionné |
| `Ctrl`/`Cmd`+`D` | Dupliquer |
| `Ctrl`/`Cmd`+`Z` / `Ctrl`+`Y` | Annuler / Rétablir |
| `Maj`+`clic` | Ajouter/retirer un champ de la sélection multiple |
| `Clic droit` | Ouvrir la barre d'outils flottante du champ |
| `Ctrl`/`Cmd`+`molette` | Zoomer sur le patron |

---

## 🚀 Utilisation

1. Ouvrez `index.html` dans un navigateur (aucune installation requise).
2. Choisissez le **type de boîte** (Comprimés ou Sirop).
3. Ajustez les **dimensions**, les **couleurs**, le **logo** et le **rainage** dans la barre latérale.
4. Placez et modifiez les **champs** directement sur le patron (double-clic pour éditer un texte).
5. Vérifiez le rendu au **zoom**, puis exportez en **PNG**, **PDF/impression** ou **gabarit JSON**.

---

## 🗂️ Structure du projet

```
.
├── index.html   # Application complète (HTML + CSS + JS embarqués)
└── tests/       # Suite de non-régression (Playwright)
```

Le fichier `index.html` est autonome : toute la logique (géométrie du patron, moteur de champs, rainage, zoom, exports) y est contenue, à l'exception des polices Google Fonts, de html2canvas et d'EmailJS chargés via CDN.

---

## 🧪 Tests

Une suite de non-régression couvre la géométrie du patron et l'éditeur de champs (**101 assertions**, exécutées dans un vrai navigateur).

```bash
npm install playwright jsdom
npx playwright install chromium
npx playwright install-deps chromium   # Linux : bibliothèques système
bash tests/run-all.sh
```

> Le test de non-régression pixel (`13`) requiert en plus `python3` avec Pillow et numpy.

Elle vérifie notamment que la position calculée de chaque champ correspond au **pixel réellement peint** par le navigateur, y compris après rotation, et que le rainage à 0 reproduit le patron d'origine sans aucun écart. Voir `tests/README.md` pour le détail.

---

## 🔐 Accès à l'impression

Une brève identification (email, prénom, nom) est demandée avant l'impression/export du patron.

---

## 🛠️ Stack technique

- HTML5 / CSS3 (Grid, Flexbox, variables CSS)
- JavaScript vanilla (aucune dépendance de build)
- SVG pour le tracé technique du die-cut
- [html2canvas](https://html2canvas.hertzen.com/) pour l'export PNG
- [EmailJS](https://www.emailjs.com/) pour la notification d'accès
- [Playwright](https://playwright.dev/) pour les tests (développement uniquement)

---

## 📋 Prérequis

Aucun pour l'utilisation : un navigateur moderne suffit (Chrome, Firefox, Edge, Safari).
Node.js est nécessaire uniquement pour exécuter la suite de tests.

---

## 📄 Licence

Précisez ici la licence de votre choix (ex. MIT, propriétaire, usage interne).

---

## 🤝 Contribuer

Les suggestions et retours sont les bienvenus via les issues / pull requests de ce dépôt.
