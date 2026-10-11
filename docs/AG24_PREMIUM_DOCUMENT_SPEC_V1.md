# AG24 PREMIUM DOCUMENT SPEC V1

**Version:** 1.0.0  
**Statut:** architecture canonique — Business Plan premier client  
**Principe:** une vérité projet, plusieurs documents, plusieurs audiences.

## 1. Transformation

AfriGreen24 ne cherche pas à produire un Google Docs « joli ». Le système doit transformer une vérité projet canonique en un document financier et éditorial crédible, rapide à lire, vérifiable et adapté au décideur.

La cible est :

```
CANONICAL PROJECT MODEL
→ PROJECT INTELLIGENCE
→ EVIDENCE / PROVENANCE
→ AUDIENCE ROUTER
→ EDITORIAL PLANNER
→ FINANCIAL STORY
→ VISUAL REPRESENTATION
→ DESIGN SYSTEM
→ FLOW LAYOUT
→ QUALITY GATES
→ PDF / DOCS / DATA ROOM
```

## 2. Règle fondamentale de pagination

Une section sémantique n'est pas une page physique.

- Couverture : page dédiée.
- Executive Snapshot : page dédiée.
- Corps du document : flux naturel.
- Aucun label fixe « n / 15 ».
- Une section peut continuer sur plusieurs pages.
- Une nouvelle section peut démarrer sur la même page si l'espace le permet.
- Les sauts forcés supplémentaires sont supprimés par le Flow Pagination Engine.

## 3. Grammaire éditoriale

Le document principal doit permettre trois niveaux de lecture :

1. **30 secondes** — couverture + Executive Snapshot.
2. **5 minutes** — titres, KPI, graphiques, encadrés, risques, financement.
3. **lecture complète** — narratif, hypothèses, tableaux, sources, annexes.

Le texte n'est pas la représentation par défaut. Le moteur choisit la meilleure représentation :

| Nature de l'information | Représentation |
|---|---|
| KPI | Metric Strip |
| Nombre critique | Hero Metric |
| Série temporelle | Line Chart |
| Comparaison | Bar Chart |
| TAM / SAM / SOM | Market Visual |
| Concurrence | Comparison Matrix |
| Usage des fonds | Allocation Visual |
| Risques | Risk Matrix |
| Roadmap | Timeline |
| Modèle financier | Financial Table |
| Preuve | Evidence Card |
| Source | Source Note |
| Hypothèse | Assumption Note |
| Explication | Narrative |

## 4. Composants du Design System

Le renderer premium doit être composé de briques réutilisables :

- Cover
- Executive Snapshot
- Section Header
- Metric Strip
- Hero Metric
- Insight Card
- Evidence Card
- Fact Grid
- Process Flow
- Market Visual
- Comparison Matrix
- Financial Table
- Line Chart
- Bar Chart
- Allocation Visual
- Risk Matrix
- Timeline
- Source Note
- Assumption Note
- Appendix Table

Chaque composant doit être déterministe, testable, white-label, compatible avec les thèmes et compatible avec le Flow Layout Engine.

## 5. Modules éditoriaux cibles

Le Business Plan Premium cible les modules suivants :

```
Cover
Executive Snapshot
Résumé exécutif
Entreprise / projet
Problème & opportunité
Solution & proposition de valeur
Marché
Concurrence & positionnement
Modèle économique
Traction & preuves
Go-to-market
Opérations
Équipe & gouvernance
Financial Story
Financement & usage des fonds
Risques & mitigation
Impact & ESG
Roadmap
Annexes & preuves
Closing
```

Tous les modules ne doivent pas être rendus artificiellement lorsqu'aucune donnée fiable n'existe. Le Gap Engine doit signaler les données manquantes plutôt que fabriquer du contenu.

## 6. Routage par audience

### Banque / prêteur

Priorité : capacité de remboursement, historique, cash-flow, gouvernance, financement, risques, preuves.

```
Executive Summary
→ Project
→ Traction
→ Market
→ Business Model
→ Operations
→ Team & Governance
→ Financial Story
→ Funding
→ Risks
→ Go-to-market
→ Impact
→ Roadmap
→ Evidence Appendix
```

### Investisseur

Priorité : opportunité, croissance, avantage concurrentiel, traction, economics, équipe, upside.

```
Executive Summary
→ Problem
→ Solution
→ Market
→ Competition
→ Traction
→ Business Model
→ Go-to-market
→ Team & Governance
→ Financial Story
→ Funding
→ Risks
→ Impact
→ Roadmap
→ Evidence Appendix
```

### Grant / programme public

Priorité : problème de développement, bénéficiaires, impact, exécution, budget, preuves.

### Impact investor

Priorité : marché + traction + impact mesurable + finance + risques.

## 7. Executive Snapshot

Le Snapshot est une page décisionnelle et non une mini table des matières.

Il doit présenter, lorsque les données existent :

- projet, pays, secteur, stade ;
- problème ;
- solution ;
- proposition de valeur ;
- clientèle ;
- financement recherché ;
- 4 à 6 KPI critiques ;
- top risques ;
- usage des fonds ;
- statut de readiness ;
- signaux de preuve.

Les valeurs absentes ne sont jamais inventées.

## 8. Financial Story

La couche financière ne doit pas être une annexe narrative. Elle doit expliquer :

```
HISTORIQUE / TRACTION
→ HYPOTHÈSES
→ REVENUS
→ MARGE
→ OPEX
→ CASH-FLOW
→ BESOIN DE FINANCEMENT
→ SERVICE DE LA DETTE / DILUTION
→ SCÉNARIOS
→ RISQUES
```

Pour la dette, le Financial Model Engine canonique reste la source déterministe pour l'échéancier. Aucun calcul financier ne doit être délégué à l'IA.

## 9. Preuves et provenance

Une affirmation matérielle doit avoir un statut de vérité et, lorsque requis, une preuve ou une source.

Le renderer doit distinguer :

- déclaré par le porteur ;
- documenté ;
- vérifié externe ;
- calculé ;
- estimé ;
- hypothèse ;
- conflit ;
- manquant.

Le design ne doit jamais rendre une estimation comme une certitude.

## 10. Quality Gates

Un document premium n'est publiable que si :

- la source canonique est identifiable ;
- les règles audience sont résolues ;
- les calculs déterministes sont cohérents ;
- les claims matériels respectent la politique de preuve ;
- les risques critiques ont une mitigation ou un blocage explicite ;
- la pagination est en mode FLOW ;
- aucun label sémantique fixe n'est rendu ;
- le document reste white-label ;
- le PDF passe le contrôle physique et de taille ;
- l'audit conserve version, audience, règles, erreurs et résultat.

## 11. État actuel de V2

Le renderer V2 possède déjà plusieurs briques utiles : Cover, Executive Snapshot, Facts Grid, Cards, Callouts, Process Flow, Risk Register, Roadmap, thèmes, white-label et quality gate.

Les principaux modules premium encore structurellement absents sont :

- Competition autonome ;
- Traction & Evidence ;
- Team & Governance autonome ;
- Financial Story ;
- Evidence Appendix ;
- vrais graphiques de séries / comparaisons / allocation.

Le système V3 doit réutiliser V2 lorsque pertinent au lieu de le réécrire inutilement.

## 12. Workflow système

### Déclencheur
Une génération de Business Plan ou une nouvelle version de données projet.

### Source canonique
Canonical Project Model + Project Intelligence + Financial Model + Evidence Store.

### Décision
Audience Router + règles déterministes de disponibilité et de preuve.

### Action
Editorial Planner → Visual Representation → Design Renderer → Flow Layout.

### Validation
Quality Gates + PDF postflight + contrat d'audience.

### Persistance
Version du document, audience, snapshot source, règles, métriques, preuves, logs.

### Suite
Publication / téléchargement / Data Room / recalcul des readiness scores.

### Échec
Validation → retry contrôlé → fallback de représentation → blocage propre → intervention humaine uniquement si nécessaire.

## 13. Principe de non-régression

La baseline UI Apps Script V92 reste inchangée. Le Premium Document Engine est une couche documentaire réutilisable. Il ne doit pas modifier le parcours utilisateur tant qu'une release dédiée n'a pas passé les tests système.
