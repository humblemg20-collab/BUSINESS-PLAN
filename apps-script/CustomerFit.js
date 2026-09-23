/**
 * ============================================================
 * AFRIGREEN24 — CUSTOMER FIT ENGINE
 * Fichier : CustomerFit.gs
 * ============================================================
 */

function customerFitChampEstRenseigne(valeur) {
  if (valeur === null || valeur === undefined) {
    return false;
  }
  var texte = String(valeur).trim();
  if (!texte) {
    return false;
  }
  return texte.length >= 8 && !/^(non|aucun|aucune|néant|neant|n\/a|à préciser|a preciser)$/i.test(texte);
}

function analyserCustomerFit(data) {
  data = data || {};

  var criteres = [
    { cle: "problem", libelle: "Problème clairement décrit", poids: 18 },
    { cle: "affectedPeople", libelle: "Personnes concernées identifiées", poids: 12 },
    { cle: "urgency", libelle: "Urgence et conséquences expliquées", poids: 8 },
    { cle: "solution", libelle: "Solution compréhensible", poids: 16 },
    { cle: "valueProposition", libelle: "Proposition de valeur différenciante", poids: 14 },
    { cle: "benefit", libelle: "Bénéfice client explicite", poids: 10 },
    { cle: "targetCustomers", libelle: "Clientèle cible précise", poids: 12 },
    { cle: "competitors", libelle: "Alternatives et concurrence identifiées", poids: 10 }
  ];

  var score = 0;
  var forces = [];
  var pointsAClarifier = [];

  criteres.forEach(function(critere) {
    var valeur = data[critere.cle];
    if (customerFitChampEstRenseigne(valeur)) {
      var longueur = String(valeur).trim().length;
      var facteur = longueur >= 45 ? 1 : longueur >= 20 ? 0.8 : 0.6;
      score += critere.poids * facteur;
      forces.push(critere.libelle);
    } else {
      pointsAClarifier.push(critere.libelle);
    }
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  var niveau;
  var diagnostic;
  if (score >= 85) {
    niveau = "Très solide";
    diagnostic = "L’adéquation entre le problème, les clients, la solution et la proposition de valeur est fortement structurée.";
  } else if (score >= 65) {
    niveau = "Encourageant";
    diagnostic = "La logique client-solution est cohérente, mais certains éléments doivent encore être validés par des preuves de marché.";
  } else if (score >= 45) {
    niveau = "À renforcer";
    diagnostic = "Le projet présente une base utile, mais la compréhension du client, la différenciation ou le bénéfice attendu restent insuffisamment démontrés.";
  } else {
    niveau = "Fragile";
    diagnostic = "L’adéquation client-solution doit être retravaillée avant un investissement ou un lancement commercial important.";
  }

  if (!forces.length) {
    forces.push("Une première intention entrepreneuriale a été formulée");
  }
  if (!pointsAClarifier.length) {
    pointsAClarifier.push("Obtenir des preuves de terrain et des engagements clients");
  }

  return {
    score: score,
    niveau: niveau,
    diagnostic: diagnostic,
    forces: forces,
    pointsAClarifier: pointsAClarifier
  };
}
