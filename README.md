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

- **Logo personnalisé** (import PNG/JPEG/GIF/WebP) ou logo par défaut
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
├── src/         # Utilitaires purs et presets de champs (sanitation, géométrie, migration, JSON, stockage)
└── tests/       # Tests unitaires, smoke et navigateur
```

Le fichier `index.html` contient encore le markup, l'état et les contrôleurs DOM
principaux. Les données de presets sont isolées dans
`src/packaging-defaults.js`, l'historique Annuler/Rétablir dans
`src/history-controller.js`, tandis que les calculs et validations partagés
sont isolés dans `src/packaging-utils.js`. La géométrie des formes SVG
partagée par l'éditeur et l'export est isolée dans `src/shape-geometry.js`.
Le découpage de texte de l’export PNG est isolé dans `src/png-text.js`.
Les polices Google Fonts,
html2canvas et EmailJS sont chargés via CDN.

---

## 🧪 Tests

Le dépôt contient un contrôle de fumée reproductible qui vérifie la structure
HTML, l'absence des injections Cloudflare, la présence du consentement et la
syntaxe de tous les scripts embarqués.

```bash
npm test
npm run lint
```

La commande `npm test` inclut les tests unitaires des utilitaires de
sanitation, de géométrie, de migration de schéma, de sérialisation JSON et
de l'adaptateur de stockage, les contrôles de fumée et un test navigateur
Playwright couvrant le rendu initial, les deux modes de boîte, le
redimensionnement, l'import d'un gabarit, la porte d'accès à l'impression et
la présence des contrôles clavier. Le test exécute également axe-core et bloque
les violations d'accessibilité critiques ou sérieuses.

Sur une machine neuve, installez Chromium avant le test :

```bash
npx playwright install chromium
```

La CI applique la même séquence sur Node.js 20 : `npm ci`, installation de
Chromium avec ses dépendances système, `npm test` puis `git diff --check`.
Le workflow est défini dans
[.github/workflows/quality.yml](./.github/workflows/quality.yml).

---

## 🔐 Accès à l'impression

Une identification (email obligatoire, prénom et nom facultatifs) ainsi qu'un
consentement distinct sont demandés avant l'impression. Cette porte est un
formulaire de contact et **ne constitue pas une authentification** : la valeur
`localStorage` qui mémorise l'accès peut être modifiée par l'utilisateur.

EmailJS est désactivé par défaut. Pour l'activer dans un déploiement, injectez
avant les scripts de l'application :

```html
<script>
  window.PACKAGING_EMAIL_CONFIG = {
    publicKey: "...",
    serviceId: "...",
    templateId: "...",
    notifyEmail: "..."
  };
</script>
```

Les coordonnées saisies ne sont pas enregistrées dans `localStorage`. Consultez
[SECURITY.md](./SECURITY.md) pour les limites et recommandations de production.

Les réglages et champs de la maquette sont sauvegardés localement lorsque le
navigateur l'autorise. La persistance passe par un adaptateur isolé qui gère
les lectures, écritures et réinitialisations. En cas de quota dépassé ou de
stockage désactivé, un message visible indique que les modifications ne seront
pas conservées après fermeture.
La réinitialisation globale ne recharge la page qu'après une suppression
réussie ; si le navigateur refuse l'opération, les données sont conservées et
un message d'erreur est affiché.
Les valeurs JSON restaurées depuis ce stockage sont parsées de manière sûre et
revalidées avant d'être appliquées ; une donnée corrompue est ignorée sans
bloquer le rendu.

Les images importées sont limitées aux formats PNG, JPEG, GIF et WebP, avec une
taille maximale de 5 Mo. Les gabarits JSON importés sont limités à 2 Mo.
Un gabarit peut contenir au maximum 250 champs ; les positions, dimensions,
rotations, types et contenus sont bornés à l'import.
Les identifiants de champs sont limités aux caractères sûrs pour les
sélecteurs (`A-Z`, `a-z`, chiffres, `_` et `-`) et régénérés en cas de
collision.
Les réglages importés sont également normalisés : dimensions et rabats sont
bornés, couleurs et logos sont validés, textes tronqués et options booléennes
limitées à leurs types attendus. Les logos qui ne sont pas des images PNG,
JPEG, GIF ou WebP encodées en base64 sont rejetés.
Les tests unitaires vérifient également qu'un gabarit valide conserve ses
champs et réglages après un cycle export JSON puis import et sanitation.

Les modifications des contrôles sont regroupées par frame d'affichage afin de
limiter les recalculs géométriques pendant la saisie et le déplacement des curseurs.
Les imports de gabarits et d'images ainsi que les exports JSON et PNG utilisent
des chemins d'erreur explicites : les échecs de lecture, de conversion ou de
téléchargement sont affichés à l'utilisateur et journalisés.
La lecture des fichiers est centralisée dans les utilitaires partagés et reste
adaptée aux APIs navigateur via un mince adaptateur dans l'application.
La suite navigateur vérifie également l'export PNG de secours basé sur SVG
lorsque `html2canvas` n'est pas disponible.
Elle couvre aussi les erreurs d'import JSON : contenu invalide et fichier
dépassant la limite de 2 Mo.
Le téléchargement JSON est également relu par le test navigateur pour
confirmer la version du schéma, les champs et les réglages exportés.
Les tests couvrent enfin le rejet d'un format d'image interdit et le
signalement d'un échec de téléchargement PNG.

## Confidentialité

L'outil collecte une adresse email pour traiter une demande d'impression, avec
consentement explicite. La transmission dépend de la configuration EmailJS du
déploiement ; sans configuration, aucune notification n'est envoyée. Pour un
usage professionnel ou une authentification réelle, un backend doit gérer la
validation, la conservation, le retrait du consentement et la limitation de
débit.

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
