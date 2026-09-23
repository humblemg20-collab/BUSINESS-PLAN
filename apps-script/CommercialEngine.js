/**
 * ============================================================
 * AFRIGREEN24 — COMMERCIAL ENGINE
 * Fichier : CommercialEngine.gs
 * ============================================================
 *
 * Analyse les réponses du questionnaire et détermine :
 *
 * 1. Le score commercial.
 * 2. Le niveau de maturité.
 * 3. Le segment entrepreneurial.
 * 4. Le besoin principal.
 * 5. L'offre AfriGreen24 recommandée.
 * 6. La priorité commerciale.
 * 7. La prochaine action.
 */


/**
 * Fonction principale du moteur commercial.
 *
 * @param {Object} data Réponses du questionnaire.
 * @return {Object} Profil commercial.
 */
function analyserProfilCommercial(data) {
  data = data || {};

  var scores = calculerScoresCommerciaux(data);

  var scoreCommercial = calculerScoreCommercialGlobal(
    scores
  );

  var maturite = determinerNiveauMaturite(
    data,
    scores
  );

  var segment = determinerSegmentCommercial(
    data,
    scores,
    maturite
  );

  var besoinPrincipal = determinerBesoinPrincipal(
    data,
    scores,
    segment
  );

  var offreRecommandee = determinerOffreRecommandee(
    segment,
    maturite,
    scores
  );

  var niveauUrgence = determinerNiveauUrgence(
    data,
    segment,
    scoreCommercial
  );

  var priorite = determinerPrioriteCommerciale(
    scoreCommercial,
    niveauUrgence,
    segment
  );

  var actionCommerciale = determinerActionCommerciale(
    segment,
    priorite,
    offreRecommandee
  );

  return {
    scoreCommercial: scoreCommercial,

    scores: scores,

    maturite: maturite,

    segment: segment,

    besoinPrincipal: besoinPrincipal,

    offreRecommandee: offreRecommandee,

    niveauUrgence: niveauUrgence,

    priorite: priorite,

    actionCommerciale: actionCommerciale,

    dateAnalyse: new Date()
  };
}


/**
 * Calcule les différentes composantes du profil.
 */
function calculerScoresCommerciaux(data) {
  return {
    clarteProjet: calculerScoreClarteProjet(data),

    connaissanceMarche:
      calculerScoreConnaissanceMarche(data),

    modeleEconomique:
      calculerScoreModeleEconomique(data),

    capaciteExecution:
      calculerScoreCapaciteExecution(data),

    preparationFinancement:
      calculerScorePreparationFinancement(data),

    potentielCommercial:
      calculerScorePotentielCommercial(data)
  };
}


/**
 * Mesure la clarté générale du projet.
 */
function calculerScoreClarteProjet(data) {
  var score = 0;

  score += noterChamp(
    data.projectName,
    10
  );

  score += noterChamp(
    data.problem,
    20
  );

  score += noterChamp(
    data.solution,
    20
  );

  score += noterChamp(
    data.valueProposition,
    20
  );

  score += noterChamp(
    data.benefit,
    15
  );

  score += noterChamp(
    data.affectedPeople,
    15
  );

  return limiterScore(score);
}


/**
 * Mesure la compréhension du marché.
 */
function calculerScoreConnaissanceMarche(data) {
  var score = 0;

  score += noterChamp(
    data.targetCustomers,
    30
  );

  score += noterChamp(
    data.marketArea,
    20
  );

  score += noterChamp(
    data.competitors,
    25
  );

  score += noterChamp(
    data.salesChannels,
    25
  );

  return limiterScore(score);
}


/**
 * Mesure la qualité du modèle économique.
 */
function calculerScoreModeleEconomique(data) {
  var score = 0;

  score += noterChamp(
    data.revenueModel,
    35
  );

  score += noterChamp(
    data.pricing,
    25
  );

  score += noterChamp(
    data.mainCosts,
    25
  );

  score += noterChamp(
    data.salesChannels,
    15
  );

  return limiterScore(score);
}


/**
 * Mesure la capacité actuelle d'exécution.
 */
function calculerScoreCapaciteExecution(data) {
  var score = 0;

  score += noterChamp(
    data.team,
    45
  );

  score += scoreSelonStade(
    data.stage
  );

  score += noterChamp(
    data.useOfFunds,
    20
  );

  return limiterScore(score);
}


/**
 * Mesure la préparation à une recherche de financement.
 */
function calculerScorePreparationFinancement(data) {
  var score = 0;

  score += noterChamp(
    data.fundingType,
    20
  );

  score += noterChamp(
    data.fundingNeed,
    25
  );

  score += noterChamp(
    data.useOfFunds,
    30
  );

  score += noterChamp(
    data.revenueModel,
    15
  );

  score += noterChamp(
    data.team,
    10
  );

  return limiterScore(score);
}


/**
 * Mesure le potentiel commercial du prospect
 * pour les services AfriGreen24.
 */
function calculerScorePotentielCommercial(data) {
  var score = 0;

  score += noterChamp(
    data.projectName,
    5
  );

  score += noterChamp(
    data.promoterName,
    5
  );

  score += noterChamp(
    data.email,
    15
  );

  score += noterChamp(
    lireContactTelephoneCommercial(data),
    15
  );

  score += noterChamp(
    data.fundingNeed,
    20
  );

  score += noterChamp(
    data.useOfFunds,
    15
  );

  score += noterChamp(
    data.revenueModel,
    15
  );

  score += noterChamp(
    data.team,
    10
  );

  return limiterScore(score);
}


/**
 * Calcule la moyenne pondérée finale.
 */
function calculerScoreCommercialGlobal(scores) {
  var total =
    scores.clarteProjet * 0.15 +
    scores.connaissanceMarche * 0.15 +
    scores.modeleEconomique * 0.20 +
    scores.capaciteExecution * 0.15 +
    scores.preparationFinancement * 0.20 +
    scores.potentielCommercial * 0.15;

  return Math.round(
    limiterScore(total)
  );
}


/**
 * Détermine la maturité globale.
 */
function determinerNiveauMaturite(
  data,
  scores
) {
  var stade = normaliserTexteCommercial(
    data.stage
  );

  if (
    contientUnDesTermes(
      stade,
      [
        "croissance",
        "developpement",
        "operationnel",
        "en activite",
        "commercialisation",
        "deja lance",
        "phase pilote"
      ]
    ) &&
    scores.modeleEconomique >= 60
  ) {
    return "MATURE";
  }

  if (
    contientUnDesTermes(
      stade,
      [
        "lancement",
        "prototype",
        "pilote",
        "test",
        "preparation"
      ]
    ) ||
    scores.clarteProjet >= 55
  ) {
    return "EN_STRUCTURATION";
  }

  return "DEBUTANT";
}


/**
 * Détermine le segment commercial principal.
 */
function determinerSegmentCommercial(
  data,
  scores,
  maturite
) {
  var financementDemande =
    champEstRenseigne(data.fundingNeed) ||
    champEstRenseigne(data.fundingType);

  if (financementDemande) {
    return "RECHERCHE_FINANCEMENT";
  }

  if (
    maturite === "DEBUTANT" ||
    scores.clarteProjet < 50 ||
    scores.modeleEconomique < 45
  ) {
    return "BESOIN_STRUCTURATION";
  }

  if (
    maturite === "MATURE" ||
    scores.capaciteExecution >= 65
  ) {
    return "PROJET_MATURE";
  }

  return "BESOIN_DIAGNOSTIC";
}


/**
 * Identifie le blocage principal.
 */
function determinerBesoinPrincipal(
  data,
  scores,
  segment
) {
  if (
    segment === "RECHERCHE_FINANCEMENT"
  ) {
    if (
      scores.preparationFinancement < 70
    ) {
      return "Renforcer le dossier avant la recherche de financement";
    }

    return "Préparer un dossier de financement convaincant et structuré";
  }

  if (scores.clarteProjet < 50) {
    return "Clarifier le problème, la solution et la proposition de valeur";
  }

  if (scores.connaissanceMarche < 50) {
    return "Mieux définir les clients, le marché et la concurrence";
  }

  if (scores.modeleEconomique < 50) {
    return "Structurer le modèle économique et les sources de revenus";
  }

  if (scores.capaciteExecution < 50) {
    return "Construire un plan opérationnel et renforcer l'équipe";
  }

  if (segment === "PROJET_MATURE") {
    return "Accélérer le développement commercial et le passage à l'échelle";
  }

  return "Établir un diagnostic stratégique complet";
}


/**
 * Associe le prospect à l'une des trois offres validées.
 */
function determinerOffreRecommandee(
  segment,
  maturite,
  scores
) {
  if (segment === "RECHERCHE_FINANCEMENT") {
    return "PREPARATION_FINANCEMENT";
  }

  if (
    segment === "BESOIN_STRUCTURATION" ||
    maturite === "DEBUTANT" ||
    scores.modeleEconomique < 50
  ) {
    return "STRUCTURATION_PROJET";
  }

  return "DIAGNOSTIC_STRATEGIQUE";
}


/**
 * Mesure l'urgence commerciale.
 */
function determinerNiveauUrgence(
  data,
  segment,
  scoreCommercial
) {
  var urgenceDeclaree =
    normaliserTexteCommercial(
      data.urgency
    );

  if (
    segment === "RECHERCHE_FINANCEMENT" &&
    champEstRenseigne(data.fundingNeed)
  ) {
    return "ELEVEE";
  }

  if (
    contientUnDesTermes(
      urgenceDeclaree,
      [
        "urgent",
        "immediat",
        "rapidement",
        "critique",
        "prioritaire"
      ]
    )
  ) {
    return "ELEVEE";
  }

  if (scoreCommercial >= 65) {
    return "MOYENNE";
  }

  return "NORMALE";
}


/**
 * Classe le prospect pour le suivi commercial.
 */
function determinerPrioriteCommerciale(
  scoreCommercial,
  niveauUrgence,
  segment
) {
  if (
    scoreCommercial >= 70 &&
    niveauUrgence === "ELEVEE"
  ) {
    return "TRES_HAUTE";
  }

  if (
    segment === "RECHERCHE_FINANCEMENT" ||
    scoreCommercial >= 65
  ) {
    return "HAUTE";
  }

  if (scoreCommercial >= 45) {
    return "MOYENNE";
  }

  return "FAIBLE";
}


/**
 * Produit la prochaine action concrète.
 */
function determinerActionCommerciale(
  segment,
  priorite,
  offreRecommandee
) {
  if (priorite === "TRES_HAUTE") {
    return "CONTACTER_SOUS_24H";
  }

  if (
    segment === "RECHERCHE_FINANCEMENT"
  ) {
    return "PROPOSER_DIAGNOSTIC_FINANCEMENT";
  }

  if (
    offreRecommandee ===
    "STRUCTURATION_PROJET"
  ) {
    return "PROPOSER_ENTRETIEN_STRUCTURATION";
  }

  if (priorite === "HAUTE") {
    return "CONTACTER_SOUS_48H";
  }

  return "ENVOYER_MESSAGE_DIAGNOSTIC";
}


/**
 * Attribue des points selon la qualité d'un champ.
 */
function noterChamp(
  valeur,
  maximum
) {
  if (!champEstRenseigne(valeur)) {
    return 0;
  }

  var texte = String(valeur).trim();
  var longueur = texte.length;

  if (longueur >= 120) {
    return maximum;
  }

  if (longueur >= 60) {
    return maximum * 0.85;
  }

  if (longueur >= 25) {
    return maximum * 0.65;
  }

  return maximum * 0.4;
}


/**
 * Attribue des points selon le stade déclaré.
 */
function scoreSelonStade(stade) {
  var texte = normaliserTexteCommercial(
    stade
  );

  if (
    contientUnDesTermes(
      texte,
      [
        "croissance",
        "operationnel",
        "commercialisation",
        "en activite",
        "phase pilote"
      ]
    )
  ) {
    return 35;
  }

  if (
    contientUnDesTermes(
      texte,
      [
        "lancement",
        "prototype",
        "test",
        "preparation"
      ]
    )
  ) {
    return 25;
  }

  if (
    contientUnDesTermes(
      texte,
      [
        "idee",
        "reflexion",
        "concept"
      ]
    )
  ) {
    return 10;
  }

  return champEstRenseigne(stade)
    ? 15
    : 0;
}


/**
 * Vérifie qu'un champ contient une information exploitable.
 */
function champEstRenseigne(valeur) {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return false;
  }

  var texte = String(valeur).trim();

  if (!texte) {
    return false;
  }

  var texteNormalise =
    normaliserTexteCommercial(texte);

  var valeursVides = [
    "non precise",
    "non renseigne",
    "aucun",
    "aucune",
    "a definir",
    "a determiner",
    "je ne sais pas",
    "n a",
    "na"
  ];

  return valeursVides.indexOf(
    texteNormalise
  ) === -1;
}


/**
 * Normalise un texte pour faciliter les comparaisons.
 */
function normaliserTexteCommercial(valeur) {
  return String(valeur || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * Recherche plusieurs termes dans un texte.
 */
function contientUnDesTermes(
  texte,
  termes
) {
  for (
    var index = 0;
    index < termes.length;
    index++
  ) {
    if (
      texte.indexOf(
        termes[index]
      ) !== -1
    ) {
      return true;
    }
  }

  return false;
}


/**
 * Limite une note entre 0 et 100.
 */
function limiterScore(score) {
  return Math.max(
    0,
    Math.min(
      100,
      Number(score || 0)
    )
  );
}


/**
 * Cherche le téléphone ou WhatsApp.
 */
function lireContactTelephoneCommercial(
  data
) {
  return (
    data.phone ||
    data.telephone ||
    data.whatsapp ||
    data.contactPhone ||
    ""
  );
}


/**
 * Test direct depuis Apps Script.
 */
function testerCommercialEngine_() {
  var donneesTest = {
    projectName:
      "EcoCycle Africa",

    promoterName:
      "Aminata Koné",

    email:
      "aminata@example.com",

    telephone:
      "+225 01 02 03 04 05",

    country:
      "Côte d'Ivoire",

    sector:
      "Économie circulaire",

    stage:
      "Phase pilote",

    problem:
      "Les déchets plastiques s'accumulent dans les villes et sont insuffisamment valorisés.",

    affectedPeople:
      "Les ménages, les commerces et les collectivités urbaines.",

    urgency:
      "La situation devient urgente en raison de l'augmentation de la pollution.",

    solution:
      "Un service de collecte, de tri et de transformation des déchets plastiques.",

    valueProposition:
      "Une solution locale de collecte et de valorisation créant des emplois verts.",

    benefit:
      "Réduction de la pollution et création de revenus.",

    targetCustomers:
      "Les entreprises, collectivités, ménages et recycleurs.",

    marketArea:
      "Abidjan et les principales zones urbaines.",

    competitors:
      "Les collecteurs privés, les récupérateurs informels et les recycleurs.",

    revenueModel:
      "Vente de matières recyclées, contrats de collecte et abonnements.",

    pricing:
      "Tarification selon le volume collecté et le type de service.",

    mainCosts:
      "Équipements, transport, salaires, stockage et communication.",

    salesChannels:
      "Prospection directe, partenariats et réseaux sociaux.",

    team:
      "Une fondatrice, un responsable opérationnel, des collecteurs et un commercial.",

    fundingType:
      "Subvention et investissement d'amorçage",

    fundingNeed:
      "25 000 000 FCFA",

    useOfFunds:
      "Achat d'équipements, recrutement, logistique et lancement commercial."
  };

  var profil =
    analyserProfilCommercial(
      donneesTest
    );

  console.log(
    JSON.stringify(
      profil,
      null,
      2
    )
  );

  return profil;
}