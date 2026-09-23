# AfriGreen24 — Business Model Finançable

Repository canonique du module **Business Model Finançable** d’AfriGreen24.

## Architecture

- `apps-script/` — source Google Apps Script exécutable.
- `hostinger/` — façade publique du sous-domaine Hostinger.
- `docs/` — provenance et informations de déploiement.
- `business plan.zip` — archive source originale conservée comme snapshot.

## Source Apps Script

Script ID : `1eTXksbCQgmVc-Og4gblOmdt1mccMaKXPek7LbOJiLS5ftPf1tr8wSMfS`

Déploiement Web App canonique : `AKfycbzuuT3vesWHRoTmG7lkiRiG8ITwBQbTzdqbEcW-72bRZyCzUBpSGDBeyIaV9pK5Y476` (version 23 au moment de l’export).

La façade Hostinger conserve Apps Script comme moteur afin de préserver les appels `google.script.run`.

## Principe de modification

Toute évolution doit être réalisée dans les sources versionnées, validée, puis déployée. Le ZIP racine reste un snapshot historique et ne doit pas devenir la source de travail quotidienne.
