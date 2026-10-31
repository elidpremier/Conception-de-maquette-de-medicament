# Audit approfondi — Conception de maquette de médicament

**Dépôt audité :** `elidpremier/Conception-de-maquette-de-medicament`  
**Branche :** `main`  
**Dernier commit observé :** `8d1af14` — 3 août 2026  
**Périmètre :** analyse statique, historique Git, exécution JavaScript, parcours navigateur Playwright, axe-core, responsive mobile, exports et robustesse de la persistance.

## 1. Synthèse exécutive

Le projet est déjà un prototype fonctionnel et ambitieux : générateur de patrons pharmaceutiques comprimés/sirop, éditeur de champs, géométrie SVG, drag-and-drop, sélection multiple, sauvegarde locale et exports. Les parcours critiques testés dans Chromium fonctionnent globalement.

En revanche, le projet est arrivé à un point où l’ajout de fonctionnalités dans un unique `index.html` de **349 Ko / 8 752 lignes** augmente fortement le risque de régression. La priorité n’est pas d’ajouter immédiatement de nouvelles fonctions, mais de sécuriser le socle : tests réellement versionnés, découpage du code, validation de données, accessibilité, sécurité de la collecte email et robustesse des exports.

### Niveau de maturité estimé

- **Fonctionnalités :** bon prototype avancé.
- **Maintenabilité :** faible à moyenne ; logique, styles et markup fortement couplés.
- **Tests :** insuffisant en l’état du dépôt ; la documentation annonce 101 assertions mais `tests/` n’est pas présent.
- **Sécurité :** acceptable pour une démo statique non sensible, insuffisante pour un outil avec collecte de données ou usage professionnel.
- **Accessibilité :** insuffisante ; plusieurs violations critiques/serious détectées par axe-core.
- **Industrialisation :** faible ; pas de licence définie, pas de CI applicative, pas de branche protégée, Dependabot désactivé.

## 2. Inventaire technique

Le dépôt contient seulement :

```text
index.html                    # application complète HTML/CSS/JS embarquée
README.md                     # documentation
.gitignore                    # minimal
google7a8ef8713ba8c3f8.html   # vérification Google
```

Il n’y a ni `package.json`, ni lockfile, ni dossier `tests/`, ni workflow applicatif GitHub Actions. Le seul workflow détecté est le workflow automatique de publication GitHub Pages.

La page charge trois ressources externes : Google Fonts, `html2canvas@1.4.1` via cdnjs et EmailJS via jsDelivr. Le projet repose donc sur une exécution statique sans bundler ni backend.

## 3. Résultats des contrôles effectués

### Contrôles réussis

- Les quatre scripts JavaScript embarqués passent `node --check`.
- Chromium charge l’application sans `pageerror` JavaScript.
- Les dimensions `120 × 80 × 30` sont acceptées et recalculent le SVG.
- Le basculement Comprimés → Sirop → Comprimés fonctionne.
- L’éditeur rend les champs par défaut et permet l’ajout de champs.
- L’export JSON déclenche bien un téléchargement `gabarit-complet.json`.
- L’export PNG déclenche bien un téléchargement `patron.png` dans Chromium.
- Les données locales malformées testées (`not-json`, objet inattendu, tableau de couleurs, état de sections) ne font pas planter la page ; les valeurs par défaut sont restaurées.
- À 375 px de largeur, aucun débordement horizontal global n’a été détecté (`scrollWidth = 375`).
- Aucun identifiant HTML dupliqué n’a été détecté dans le markup initial.
- `git fsck --full` ne signale pas d’objet Git corrompu ou inaccessible.

### Résultats observés

Le rendu desktop est cohérent et exploitable. L’interface est dense mais riche, avec une hiérarchie visuelle claire. Le parcours a néanmoins produit trois erreurs réseau liées à deux scripts Cloudflare `/cdn-cgi/challenge-platform/scripts/jsd/main.js` présents à la fin de `index.html` : ces scripts sont absents du dépôt et retournent 404 sur un hébergement statique ordinaire.

La mesure d’une page chargée représente environ **349 Ko pour le HTML principal**, environ **40 Ko de ressources JS externes mesurées**, et environ **2 448 nœuds DOM** après initialisation. Ces chiffres restent raisonnables pour un prototype, mais le coût de chaque rerender peut devenir sensible sur mobile ou avec de nombreux champs.

## 4. Problèmes prioritaires

### P0 — L’accès à l’outil n’est pas une authentification

Le contrôle d’accès repose sur :

```js
localStorage.getItem("packaging_tool_access_granted") === "1"
```

N’importe quel utilisateur peut donc ouvrir les outils développeur et positionner cette clé. La porte protège seulement l’interface d’impression/export, pas une ressource sécurisée. Il faut documenter ce mécanisme comme un simple écran de collecte/consentement, ou le remplacer par une authentification côté serveur si l’accès doit être contrôlé.

**Action recommandée :** ne jamais présenter ce mécanisme comme une protection. Pour un vrai contrôle, déplacer la décision côté backend avec session signée, expiration, rate limiting et vérification serveur.

### P0 — Collecte de données personnelles sans vrai cadre de consentement

L’application collecte l’email, le prénom et le nom, les stocke dans `localStorage`, puis les envoie à EmailJS. L’adresse de notification est directement visible dans le JavaScript. Il manque au minimum : finalité claire, base légale/consentement explicite, durée de conservation, politique de confidentialité, mécanisme de retrait et limitation de la conservation locale.

**Action recommandée :** ajouter une case de consentement distincte, une notice de confidentialité, ne pas conserver l’email en clair plus longtemps que nécessaire, et idéalement remplacer EmailJS par une route backend contrôlée.

### P0 — Identifiants EmailJS et historique Git

La clé publique, le service, le template et l’adresse destinataire sont présents dans `index.html` et répétés dans l’historique. Une clé EmailJS publique n’est pas un secret au sens strict, mais elle permet d’exposer le service au spam et de révéler la configuration. L’envoi ne semble pas protégé par quota applicatif, anti-abus ou serveur intermédiaire.

**Action recommandée :** vérifier les restrictions et quotas EmailJS, régénérer/révoquer les identifiants si nécessaire, supprimer les données de configuration sensibles du client lorsque possible et migrer l’envoi côté backend.

### P1 — Documentation de tests incohérente avec le dépôt

Le README décrit `tests/run-all.sh`, `tests/README.md`, Playwright, jsdom et 101 assertions, mais aucun de ces fichiers n’est versionné. Un nouveau contributeur ne peut donc pas reproduire la validation annoncée.

**Action recommandée :** restaurer la suite annoncée ou corriger le README immédiatement. La suite doit être commitée, installable par une commande et exécutée en CI.

### P1 — Accessibilité insuffisante

Axe-core a détecté :

- `label` : **220 nœuds**, notamment les champs générés dynamiquement et les contrôles de l’éditeur ; impact `critical`.
- `select-name` : **108 nœuds**, dont `#boxType`, les sélecteurs de champs et des contrôles générés ; impact `critical`.
- `color-contrast` : **24 nœuds** ; impact `serious`.
- `landmark-one-main` : absence de landmark principal.
- `region` : contenu hors landmarks.

Les labels statiques comme `label>Type de boîte</label>` ne sont pas reliés par `for`/`id`, et les contrôles créés dans `renderFieldEditor()` n’ont pas de nom accessible individualisé.

**Action recommandée :** introduire `<main>`, relier chaque label à un contrôle, utiliser `aria-label`/`aria-labelledby` pour les champs générés, annoncer les erreurs dans une région `aria-live`, corriger les contrastes et tester clavier seul.

### P1 — Artefacts Cloudflare non maîtrisés

Deux scripts Cloudflare inline sont enregistrés en fin de page et pointent vers `/cdn-cgi/challenge-platform/scripts/jsd/main.js`. En local et sur un hébergement statique ne fournissant pas cette route, ils génèrent des 404.

**Action recommandée :** supprimer ces injections du dépôt si elles ne sont pas nécessaires au déploiement ; si elles sont ajoutées par la plateforme, vérifier la source de publication et ne pas les versionner manuellement.

### P1 — Monolithe difficile à faire évoluer

Le fichier unique contient simultanément le markup, environ 2 000 lignes de CSS, l’état global, les modèles par défaut, la géométrie, l’éditeur, l’historique, l’import/export, la génération SVG et la porte d’accès. Plusieurs fonctions dépassent largement la responsabilité d’un module isolé, notamment le rendu des champs, la géométrie et l’export PNG.

**Action recommandée :** migrer progressivement vers des modules ES ou TypeScript sans changer le modèle fonctionnel d’un coup : `state`, `geometry`, `fields`, `renderer`, `persistence`, `export`, `access-gate`, `ui`.

## 5. Risques fonctionnels à couvrir par tests

1. **Géométrie :** limites min/max, valeurs décimales, changement de format, rabats activés/désactivés, rainage à 0 et rainage maximal.
2. **Placement :** rotation 0/90/180/270, déplacement aux limites, redimensionnement, snap, champ hors face, faces de formes différentes.
3. **Éditeur :** ajout, duplication, suppression, sélection multiple, alignement, distribution, annuler/rétablir, édition inline, raccourcis clavier.
4. **Persistance :** rechargement, migration de version, JSON invalide, JSON très volumineux, champs image, données incompatibles avec le mode courant.
5. **Exports :** PNG avec et sans html2canvas, image importée, logo SVG/PNG, texte long, caractères accentués, formes libres, haute résolution, téléchargement annulé.
6. **Impression :** accès non accordé, formulaire invalide, EmailJS indisponible, EmailJS en erreur, taille `@page`, impression après changement de dimensions.
7. **Responsive/accessibilité :** 375, 768 et 1440 px ; zoom navigateur 200 % ; navigation clavier ; lecteur d’écran ; contraste ; focus visible.
8. **Sécurité :** contenu utilisateur avec `<script>`, URLs d’image non sûres, JSON malveillant, quota localStorage, spam EmailJS et contournement de la porte.

## 6. Plan d’amélioration proposé

### Phase 0 — Stabilisation immédiate (1 à 2 jours)

- Supprimer les scripts Cloudflare 404 du dépôt si leur présence n’est pas intentionnelle.
- Ajouter un `package.json` minimal, un lockfile et les dépendances de test.
- Restaurer ou réécrire la suite Playwright annoncée dans le README.
- Ajouter une commande unique `npm test` et une commande `npm run lint`.
- Corriger le README : structure réelle, installation réelle, limitations de la porte d’accès et statut de la licence.
- Choisir et déclarer une licence, ou indiquer explicitement un usage propriétaire.
- Ajouter un `SECURITY.md` et un modèle de rapport de bug.

### Phase 1 — Qualité et accessibilité (3 à 5 jours)

- Ajouter les landmarks sémantiques et relier tous les labels.
- Rendre les contrôles générés accessibles et navigables au clavier.
- Ajouter une gestion uniforme des erreurs et une zone `aria-live`.
- Corriger les contrastes avec une palette validée WCAG AA.
- Ajouter des tests axe-core dans CI.
- Vérifier le comportement avec zoom 200 %, clavier seul et mobile.

### Phase 2 — Découpage technique sans changement fonctionnel (1 à 2 semaines)

- Extraire CSS et JavaScript dans des fichiers distincts.
- Créer un modèle d’état unique versionné avec schéma de migration.
- Isoler les fonctions pures de géométrie et les tester sans navigateur.
- Isoler le rendu SVG et le calcul des placements.
- Isoler la persistance avec validation de schéma et quota contrôlé.
- Isoler les exporters JSON/PNG/PDF.
- Remplacer les `innerHTML` non nécessaires par des constructions DOM sûres ; conserver `escapeHtml` pour les contenus textuels et ajouter une validation stricte des URLs.

### Phase 3 — Sécurité et confidentialité (3 à 7 jours)

- Décider si l’accès est un simple formulaire de contact ou une vraie authentification.
- Pour une vraie protection, créer un backend ou une fonction serverless ; ne jamais faire confiance à `localStorage`.
- Déplacer l’envoi email côté serveur, ajouter rate limiting, validation et journalisation minimale.
- Ajouter consentement, politique de confidentialité, durée de conservation et suppression locale.
- Ne pas transmettre le contenu complet de la maquette si seules quelques métadonnées sont nécessaires.
- Ajouter CSP, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options` et headers adaptés sur l’hébergement.
- Épingler les dépendances CDN par version et prévoir un fallback explicite si CDN indisponible.

### Phase 4 — Performance et expérience de production (1 semaine)

- Éviter les rerenders complets de l’éditeur à chaque modification ; mettre à jour uniquement le champ ou la face affectée.
- Débouncer les recalculs coûteux et regrouper les mises à jour avec `requestAnimationFrame`.
- Réduire le DOM initial et rendre l’éditeur de face virtuel ou repliable.
- Compresser et éventuellement bundler CSS/JS.
- Ajouter Web Vitals et un budget de taille de page.
- Tester des documents avec 50, 100 et 250 champs.
- Ajouter un mode autosave explicite et une gestion de quota localStorage avec message utilisateur.

### Phase 5 — Fonctionnalités métier avancées (après stabilisation)

- Gestion de projets et plusieurs maquettes nommées.
- Bibliothèque de composants pharmaceutiques réutilisables.
- Import/export SVG/PDF vectoriel réellement prépresse.
- Fonds perdus, traits de coupe/rainage dédiés, unités et profils colorimétriques documentés.
- Règles de validation métier : EAN-13 valide, datamatrix valide, dimensions cohérentes, zones de sécurité et contraintes d’impression.
- Comparaison de versions et historique persistant.
- Collaboration ou partage uniquement après mise en place de l’authentification et des règles de confidentialité.

## 7. CI recommandée

Créer au minimum `.github/workflows/quality.yml` avec :

1. installation Node avec version épinglée ;
2. vérification syntaxique ;
3. tests unitaires géométrie/persistance ;
4. installation Chromium Playwright ;
5. tests E2E desktop et mobile ;
6. audit axe-core ;
7. vérification de taille et recherche de secrets ;
8. publication seulement si la qualité passe.

Activer ensuite la protection de `main` : pull request obligatoire, workflow vert obligatoire et revue avant fusion.

## 8. Critères de sortie recommandés

Le projet peut être considéré comme stabilisé lorsque :

- la suite annoncée est présente dans Git et s’exécute sur une machine neuve ;
- les scénarios géométrie, éditeur, persistance et exports sont couverts ;
- aucune violation axe-core critique/serious ne subsiste ;
- aucun 404 Cloudflare ou script parasite n’apparaît dans la console ;
- l’accès est documenté comme non sécurisé ou réellement contrôlé côté serveur ;
- le consentement et la conservation des emails sont traités ;
- la page principale est découpée ou au minimum automatiquement vérifiée ;
- la CI bloque les régressions avant publication ;
- un test de charge avec au moins 100 champs reste utilisable.

## 9. Conclusion

Le meilleur investissement immédiat est de transformer le prototype riche actuel en base fiable : **tests versionnés → accessibilité → découpage modulaire → sécurité/confidentialité → performance**. Ajouter encore des fonctionnalités avant ces étapes augmenterait la dette technique et rendrait les régressions géométriques et d’export plus coûteuses à diagnostiquer.
