# Sécurité et confidentialité

## Limites actuelles

Ce projet est une application statique exécutée dans le navigateur. La clé
`localStorage` utilisée pour mémoriser l'accès à l'impression n'est **pas une
authentification** et peut être modifiée par l'utilisateur. Elle ne doit pas
servir à protéger une ressource confidentielle.

Le formulaire d'accès demande un consentement distinct avant de transmettre
les coordonnées. L'application ne conserve pas l'adresse, le prénom ou le nom
dans `localStorage`. Les données restent néanmoins visibles par le service
d'envoi configuré au déploiement.

## Configuration d'envoi

EmailJS est désactivé par défaut. Un déploiement qui souhaite l'utiliser doit
définir `window.PACKAGING_EMAIL_CONFIG` avant les scripts de l'application avec
`publicKey`, `serviceId`, `templateId` et `notifyEmail`. Ces valeurs publiques
ne constituent pas une protection contre le spam : les restrictions, quotas et
la rotation des identifiants doivent être configurés dans EmailJS.

Pour une authentification réelle ou le traitement de données personnelles en
production, utilisez un backend avec validation serveur, limitation de débit,
journalisation minimale et politique de conservation documentée.

## Signaler une vulnérabilité

Ne publiez pas de donnée personnelle, de clé de service ou de preuve
d'exploitation dans une issue publique. Contactez les mainteneurs par un canal
privé avant toute divulgation.
