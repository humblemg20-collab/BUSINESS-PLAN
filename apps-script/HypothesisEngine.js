/**
 * ============================================================
 * AFRIGREEN24 — HYPOTHESIS ENGINE
 * Fichier : HypothesisEngine.gs
 * ============================================================
 */

function analyserHypothesesProjet(data) {
  data = data || {};

  var hypotheses = [];

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Problème",
    data.problem,
    "Le problème est suffisamment fréquent et important pour déclencher une action.",
    "Élevé",
    "Réaliser au moins 10 entretiens structurés avec les personnes concernées.",
    "Au moins 7 personnes sur 10 confirment le problème et ses conséquences."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Clientèle",
    data.targetCustomers,
    "Le segment ciblé est accessible et possède une capacité ou une volonté de paiement.",
    "Élevé",
    "Tester l’offre auprès d’un segment précis et recueillir des engagements concrets.",
    "Au moins 3 intentions d’achat, précommandes, lettres d’intérêt ou engagements pilotes."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Solution",
    data.solution,
    "La solution peut être délivrée avec la qualité et le coût attendus.",
    "Élevé",
    "Construire une version minimale et l’utiliser avec de vrais bénéficiaires.",
    "Le pilote produit le bénéfice attendu avec un niveau de satisfaction mesurable."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Prix et revenus",
    data.revenueModel && data.pricing,
    "Le modèle de revenus et le prix sont acceptables pour les clients et couvrent les coûts essentiels.",
    "Élevé",
    "Présenter plusieurs niveaux de prix et demander un engagement réel.",
    "Un prix préféré est identifié et au moins un client accepte de payer ou signer."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Canaux commerciaux",
    data.salesChannels,
    "Les canaux choisis permettent d’acquérir des clients à un coût soutenable.",
    "Moyen",
    "Tester deux canaux pendant une période courte avec le même message commercial.",
    "Le taux de conversion et le coût d’acquisition sont mesurés pour chaque canal."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Opérations",
    data.team && data.mainCosts,
    "L’équipe, les partenaires et les ressources peuvent assurer les opérations prévues.",
    "Moyen",
    "Réaliser un pilote opérationnel avec un budget, des rôles et un calendrier précis.",
    "Le service est délivré dans les délais, le budget et la qualité définis."
  );

  ajouterHypotheseSiNecessaire(
    hypotheses,
    "Financement",
    data.fundingNeed && data.useOfFunds,
    "Le montant demandé est cohérent avec les étapes à financer et les résultats attendus.",
    "Moyen",
    "Construire un budget détaillé et relier chaque dépense à un jalon mesurable.",
    "100 % du montant est justifié par des devis, hypothèses et résultats attendus."
  );

  var champsPreparation = [
    data.projectName,
    data.promoterName,
    data.country,
    data.stage,
    data.problem,
    data.solution,
    data.targetCustomers,
    data.valueProposition,
    data.revenueModel,
    data.pricing,
    data.mainCosts,
    data.team,
    data.fundingNeed,
    data.useOfFunds,
    data.impact,
    data.risks
  ];

  var renseignes = 0;
  champsPreparation.forEach(function(valeur) {
    if (typeof customerFitChampEstRenseigne === "function"
        ? customerFitChampEstRenseigne(valeur)
        : String(valeur || "").trim().length >= 8) {
      renseignes += 1;
    }
  });

  var scorePreparation = Math.round((renseignes / champsPreparation.length) * 100);

  hypotheses.sort(function(a, b) {
    var ordre = { "Élevé": 3, "Moyen": 2, "Faible": 1 };
    return (ordre[b.risque] || 0) - (ordre[a.risque] || 0);
  });

  return {
    scorePreparation: scorePreparation,
    nombreHypotheses: hypotheses.length,
    hypothesesCritiques: hypotheses
  };
}

function ajouterHypotheseSiNecessaire(
  liste,
  categorie,
  preuveDeclaree,
  hypothese,
  risque,
  methodeValidation,
  indicateurAttendu
) {
  var preuveSolide = false;

  if (preuveDeclaree !== null && preuveDeclaree !== undefined) {
    var texte = String(preuveDeclaree).trim();
    preuveSolide = texte.length >= 60;
  }

  liste.push({
    categorie: categorie,
    hypothese: hypothese,
    risque: preuveSolide && risque === "Élevé" ? "Moyen" : risque,
    methodeValidation: methodeValidation,
    indicateurAttendu: indicateurAttendu
  });
}
