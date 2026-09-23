# Provenance de la source

- Projet : AfriGreen24 — Business Plan
- Source canonique : `apps-script/`
- Script ID : `1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz`
- Runtime : V8
- Web App canonique : `https://script.google.com/macros/s/AKfycbylpvmb6Cao-Sog2VYdwH9G8PrINOgBCdWFW--49dmT5L_M8efZnd-UQOe9oCXq_J2R/exec`
- Façade publique : `hostinger/index.html`
- Archive historique : `business plan.zip`

## Règle canonique

`apps-script/` est modifié directement puis validé et déployé.

Le ZIP ne constitue plus une source de synchronisation et ne doit jamais écraser `apps-script/`.

L’identité d’une release est portée par le commit Git et le déploiement Apps Script correspondant.

## Sécurité

- secrets runtime dans Script Properties uniquement ;
- fonctions admin/test non exposées à `google.script.run` ;
- contrôles statiques via `scripts/validate_apps_script.py` ;
- PDF privés avec livraison contrôlée ;
- déploiement avec health check et rollback.
