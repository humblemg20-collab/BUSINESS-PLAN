# AfriGreen24 — Business Plan

Repository canonique du module **Business Plan** d’AfriGreen24.

## Architecture

- `apps-script/` — code Google Apps Script lisible et modifiable.
- `hostinger/` — façade publique destinée au sous-domaine Hostinger.
- `docs/` — provenance, empreintes SHA-256 et informations de déploiement.
- `business plan.zip` — snapshot original de l’export Apps Script.
- `.github/workflows/extract-business-plan.yml` — moteur automatique d’extraction, validation et synchronisation.

## Source Apps Script

Script ID canonique :

`1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz`

Web App canonique :

`https://script.google.com/macros/s/AKfycbylpvmb6Cao-Sog2VYdwH9G8PrINOgBCdWFW--49dmT5L_M8efZnd-UQOe9oCXq_J2R/exec`

Le code `doGet` autorise explicitement l’intégration en iframe avec `HtmlService.XFrameOptionsMode.ALLOWALL`.

## Synchronisation

Toute mise à jour de `business plan.zip` déclenche automatiquement :

`ZIP → extraction → validation Script ID/runtime/doGet → SHA-256 → commit du code extrait`

La source de travail lisible est `apps-script/`. Le ZIP est conservé comme snapshot d’origine.

## Hostinger

`hostinger/index.html` est la façade publique. Elle conserve Apps Script comme moteur afin de préserver `google.script.run` et transmet automatiquement tous les paramètres d’URL au Web App.
