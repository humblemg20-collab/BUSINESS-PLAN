# AfriGreen24 — Business Plan

Repository canonique du module **Business Plan** d’AfriGreen24.

## Source de vérité

`apps-script/` est la **source canonique**.

`business plan.zip` est conservé uniquement comme **archive historique**. Une mise à jour du ZIP ne doit jamais écraser le code canonique.

Script ID :

`1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz`

Web App canonique :

`https://script.google.com/macros/s/AKfycbylpvmb6Cao-Sog2VYdwH9G8PrINOgBCdWFW--49dmT5L_M8efZnd-UQOe9oCXq_J2R/exec`

## Architecture

- `apps-script/` — application Apps Script canonique.
- `hostinger/` — façade publique AfriGreen24.
- `scripts/validate_apps_script.py` — garde statique sécurité/architecture.
- `.github/workflows/extract-business-plan.yml` — validation continue du code canonique.
- `.github/workflows/deploy-apps-script.yml` — déploiement production contrôlé via clasp.
- `docs/SECURITY_RUNBOOK.md` — secrets, release et rollback.

## Sécurité

Le Web App reste public pour permettre l’accès utilisateur, mais les opérations sensibles sont protégées côté serveur :

- rate limiting ;
- limites de payload ;
- token obligatoire pour toutes les RPC Bancable sensibles ;
- fonctions admin/test privées via suffixe `_` ;
- aucun secret HumbleOS codé dans Git ;
- PDF conservés privés dans Drive et délivrés via RPC contrôlée ;
- brouillons locaux Bancable expirants ;
- écriture CRM sérialisée et protection contre les formules Sheets.

## Business Plan Bancable

Le calcul financier reste déterministe :

`données → contrôles → modèle financier → audit → document`

Le moteur IA intervient uniquement pour l’extraction et la rédaction qualitative.

Le moteur de dette est partagé entre l’audit et la génération documentaire, et les seuils bancaires sont configurables via `AFRIGREEN24_BANKING_RULES_JSON`.

## Release

```text
GitHub apps-script/
  -> validation sécurité
  -> validation syntaxe
  -> clasp push
  -> mise à jour du deployment existant
  -> health check
  -> succès
     ou rollback automatique vers la version précédente
```

Le déploiement nécessite les secrets GitHub décrits dans `docs/SECURITY_RUNBOOK.md`.

## Hostinger

`hostinger/index.html` conserve Apps Script comme moteur et transmet les paramètres d’URL nécessaires au parcours Bancable.


## Import Engine V5

Le parcours d’import de documents est traité comme un workflow complet :

`PDF / DOC / DOCX → validation navigateur → contrôle taille/type → vérification de signature binaire → conversion/OCR Drive → extraction texte → HumbleOS → vérification locale des preuves → FOUND / TO_CONFIRM / MISSING → confirmation utilisateur → génération`.

Le rendu est isolé dans `apps-script/ImportBusinessPlanV5.html` afin de ne pas alourdir davantage `Index.html`. Le moteur ajoute le glisser-déposer, une progression visible, un résumé du fichier, la méthode d’extraction, la qualité de lecture, un aperçu du texte extrait et une revue des informations déjà validées.

Le backend `BusinessPlanImport.js` reste décisionnaire : une information n’est classée `FOUND` que lorsque sa preuve est retrouvée dans le document et que le seuil de confiance est atteint. L’IA extrait ; le code déterministe valide.
