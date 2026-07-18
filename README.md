# 📦 Générateur de Patron de Boîte Pharmaceutique

Outil web interactif (HTML/CSS/JS, sans framework ni backend) permettant de générer et d'exporter le **patron (die-cut) à plat** d'un étui pharmaceutique — comprimés ou sirop — avec aperçu en temps réel, entièrement paramétrable.

## ✨ Fonctionnalités

- **Deux formats de boîte**
  - Comprimés (étui horizontal)
  - Sirop / flacon liquide (étui vertical)
- **Aperçu en temps réel** du patron à plat (panneaux, rabats, pattes de collage, rabats poussière)
- **Zoom du rendu** (molette Ctrl/Cmd, boutons +/−, réinitialisation) sans perdre le formulaire de côté
- **Interface contextuelle** : la barre latérale n'affiche que les champs pertinents selon le format choisi (comprimés / sirop)
- **Dimensions entièrement personnalisables** (largeur, hauteur, profondeur en mm), du grand étui jusqu'au petit format collyre
- **Textes éditables** : nom du produit, dosage, contenance, laboratoire, slogan, composition, indications/posologie, précautions, code-barres, dates de fabrication/péremption, mentions réglementaires
- **Logo personnalisé** (import PNG/SVG/JPG) ou logo par défaut
- **Palette de couleurs** (couleur primaire / accent) ajustable
- **Typographie modulable** par zone (titres, texte courant, rabats, petits textes)
- **Rabats poussière activables/désactivables** et longueur de rabat ajustable
- **Zones techniques configurables** (infos techniques, composition/posologie, code-barres, vide) par panneau
- **Repères visuels** : affichage/masquage des zones nommées et des marges perdues (zone tranquille)
- **Export prêt à imprimer / PDF** via la fonction d'impression du navigateur (mise en page dédiée à l'impression)

## 🚀 Utilisation

1. Ouvrez `index.html` dans un navigateur (aucune installation requise).
2. Choisissez le **type de boîte** (Comprimés ou Sirop).
3. Ajustez les **dimensions**, le **contenu des panneaux**, les **couleurs**, le **logo** et les **textes** dans la barre latérale.
4. Utilisez le **zoom** pour vérifier les détails du rendu.
5. Cliquez sur **Imprimer / PDF** pour générer le fichier final.

## 🗂️ Structure du projet

```
.
└── index.html   # Application complète (HTML + CSS + JS embarqués)
```

Le fichier est autonome : toute la logique (géométrie du patron, génération du contenu des panneaux, gestion du zoom, export) est contenue dans `index.html`, à l'exception des polices Google Fonts et de la librairie EmailJS chargées via CDN.

## 🔐 Accès à l'impression

Une brève identification (email, prénom, nom) est demandée avant l'impression/export du patron.

## 🛠️ Stack technique

- HTML5 / CSS3 (Grid, Flexbox, variables CSS)
- JavaScript vanilla (aucune dépendance de build)
- SVG pour le tracé technique du die-cut
- [EmailJS](https://www.emailjs.com/) pour la notification d'accès

## 📋 Prérequis

Aucun. Un navigateur moderne suffit (Chrome, Firefox, Edge, Safari).

## 📄 Licence

Précisez ici la licence de votre choix (ex. MIT, propriétaire, usage interne).

## 🤝 Contribuer

Les suggestions et retours sont les bienvenus via les issues / pull requests de ce dépôt.
