# AfriGreen24 — Business Plan

Repository canonique du module **Business Plan** d’AfriGreen24.

## Architecture

- `apps-script/` — code Google Apps Script lisible et modifiable.
- `docs/` — provenance, empreintes SHA-256 et informations de synchronisation.
- `business plan.zip` — snapshot original de l’export Apps Script.
- `.github/workflows/extract-business-plan.yml` — moteur automatique d’extraction, validation et synchronisation.

## Source Apps Script

Script ID détecté directement dans l’archive :

`1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz`

La source de vérité technique est désormais le code versionné sous `apps-script/`. Le ZIP reste conservé comme snapshot d’origine.

## Synchronisation

Toute mise à jour de `business plan.zip` déclenche automatiquement :

`ZIP → extraction → validation Script ID/runtime/doGet → SHA-256 → commit du code extrait`

Cela évite l’extraction et le copier-coller manuels.

## Hostinger

Aucune URL Web App n’est enregistrée ici tant que le déploiement `/exec` correspondant à ce Script ID n’a pas été vérifié. Cela empêche de relier le sous-domaine au mauvais projet Apps Script.
