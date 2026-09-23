/**
 * ============================================================
 * AFRIGREEN24 — STRATEGIC SUMMARY ENGINE
 * Fichier : StrategicSummary.gs
 * Phase 2.3 — Étape 3
 * ============================================================
 *
 * Ce moteur génère une synthèse stratégique d’une page
 * à partir des données du questionnaire et des analyses :
 *
 * - Customer Fit Engine ;
 * - Hypothesis Engine ;
 * - détection sectorielle ;
 * - données générales du projet.
 *
 * Ce fichier ne crée pas encore le Google Docs ni le PDF.
 */


/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

var STRATEGIC_SUMMARY_CONFIG = {
  nombreHypothesesAffichees: 3,
  nombrePrioritesAffichees: 5,
  longueurResumeMaximum: 6500
};


/**
 * ============================================================
 * FONCTION PRINCIPALE
 * ============================================================
 */

/**
 * Génère toutes les données nécessaires à la synthèse.
 *
 * @param {Object} data Données du questionnaire.
 * @return {Object} Synthèse stratégique structurée.
 */
function genererSyntheseStrategique(data) {
  data = data || {};

  var customerFit =
    analyserCustomerFit(data);

  var analyseHypotheses =
    analyserHypothesesProjet(data);

  var secteur =
    strategicSummaryDetecterSecteur(data);

  var synthese = {
    projet:
      strategicSummaryIdentiteProjet(
        data,
        secteur
      ),

    vision:
      strategicSummaryVision(data),

    probleme:
      strategicSummaryProbleme(data),

    solution:
      strategicSummarySolution(data),

    clients:
      strategicSummaryClients(data),

    propositionValeur:
      strategicSummaryPropositionValeur(
        data
      ),

    customerFit:
      strategicSummaryCustomerFit(
        customerFit
      ),

    modeleEconomique:
      strategicSummaryModeleEconomique(
        data
      ),

    marche:
      strategicSummaryMarche(
        data,
        secteur
      ),

    impact:
      strategicSummaryImpact(data),

    financement:
      strategicSummaryFinancement(data),

    hypothesesCritiques:
      strategicSummaryHypotheses(
        analyseHypotheses
      ),

    prioritesImmediates:
      strategicSummaryPriorites(
        data,
        customerFit,
        analyseHypotheses
      ),

    diagnostic:
      strategicSummaryDiagnostic(
        data,
        customerFit,
        analyseHypotheses,
        secteur
      ),

    indicateurs: {
      secteur: secteur,

      customerFitScore:
        customerFit.score,

      customerFitNiveau:
        customerFit.niveau,

      scorePreparation:
        analyseHypotheses.scorePreparation,

      nombreHypotheses:
        analyseHypotheses.nombreHypotheses,

      nombreHypothesesCritiques:
        analyseHypotheses
          .hypothesesCritiques
          .length
    }
  };

  synthese.texteComplet =
    redigerSyntheseStrategique(
      data,
      synthese
    );

  return synthese;
}


/**
 * ============================================================
 * IDENTITÉ DU PROJET
 * ============================================================
 */

function strategicSummaryIdentiteProjet(
  data,
  secteur
) {
  return {
    nom:
      strategicSummaryValeur(
        data.projectName,
        "Projet non nommé"
      ),

    promoteur:
      strategicSummaryValeur(
        data.promoterName,
        "Porteur du projet à préciser"
      ),

    pays:
      strategicSummaryValeur(
        data.country,
        "Pays à préciser"
      ),

    zone:
      strategicSummaryValeur(
        data.marketArea,
        data.country ||
        "Zone de lancement à préciser"
      ),

    secteurDeclare:
      strategicSummaryValeur(
        data.sector,
        "Secteur à préciser"
      ),

    secteurDetecte:
      secteur,

    stade:
      strategicSummaryValeur(
        data.stage,
        "Stade de développement à préciser"
      )
  };
}


/**
 * ============================================================
 * VISION
 * ============================================================
 */

function strategicSummaryVision(data) {
  var projet =
    strategicSummaryValeur(
      data.projectName,
      "Le projet"
    );

  var vision =
    strategicSummaryValeur(
      data.vision ||
      data.longTermVision ||
      data.projectVision,
      ""
    );

  if (vision) {
    return strategicSummaryNettoyerPhrase(
      vision
    );
  }

  var benefice =
    strategicSummaryPhrase(
      data.benefit,
      "une amélioration durable pour ses clients et bénéficiaires"
    );

  return (
    projet +
    " ambitionne de créer " +
    benefice +
    " grâce à une solution viable, accessible et adaptée à son marché."
  );
}


/**
 * ============================================================
 * PROBLÈME
 * ============================================================
 */

function strategicSummaryProbleme(data) {
  if (typeof smartWriterProbleme === "function") {
    return smartWriterProbleme(data);
  }

  var probleme =
    strategicSummaryPhrase(
      data.problem,
      "un problème important reste insuffisamment résolu"
    );

  var personnes =
    strategicSummaryPhrase(
      data.affectedPeople,
      "les populations et organisations concernées"
    );

  var urgence =
    strategicSummaryPhrase(
      data.urgency,
      "la situation peut produire des conséquences économiques, sociales ou environnementales importantes"
    );

  return (
    "Le projet répond au problème suivant : " +
    probleme +
    ". Cette situation affecte principalement " +
    personnes +
    ". Elle exige une réponse adaptée car " +
    urgence +
    "."
  );
}


/**
 * ============================================================
 * SOLUTION
 * ============================================================
 */

function strategicSummarySolution(data) {
  if (typeof smartWriterSolution === "function") {
    return smartWriterSolution(data);
  }

  var solution =
    strategicSummaryPhrase(
      data.solution,
      "une solution adaptée au problème identifié"
    );

  var benefice =
    strategicSummaryPhrase(
      data.benefit,
      "un bénéfice concret pour les utilisateurs"
    );

  return (
    "La solution proposée repose sur " +
    solution +
    ". Elle doit permettre de produire " +
    benefice +
    "."
  );
}


/**
 * ============================================================
 * CLIENTS
 * ============================================================
 */

function strategicSummaryClients(data) {
  if (typeof smartWriterClients === "function") {
    return smartWriterClients(data);
  }

  var clients =
    strategicSummaryPhrase(
      data.targetCustomers,
      "les clients et bénéficiaires concernés par le problème"
    );

  var zone =
    strategicSummaryPhrase(
      data.marketArea,
      data.country ||
      "la zone de lancement du projet"
    );

  return (
    "La clientèle prioritaire est constituée de " +
    clients +
    ". Le lancement doit être concentré en priorité dans " +
    zone +
    " afin de tester l’offre et d’obtenir des preuves de marché."
  );
}


/**
 * ============================================================
 * PROPOSITION DE VALEUR
 * ============================================================
 */

function strategicSummaryPropositionValeur(
  data
) {
  if (typeof smartWriterPropositionValeur === "function") {
    return smartWriterPropositionValeur(data);
  }

  var valeur =
    strategicSummaryPhrase(
      data.valueProposition,
      "une approche adaptée aux réalités du marché"
    );

  var concurrents =
    strategicSummaryPhrase(
      data.competitors,
      "les solutions alternatives disponibles"
    );

  return (
    "La proposition de valeur repose sur " +
    valeur +
    ". Cette différence devra être démontrée face à " +
    concurrents +
    "."
  );
}


/**
 * ============================================================
 * CUSTOMER FIT
 * ============================================================
 */

function strategicSummaryCustomerFit(
  customerFit
) {
  return {
    score:
      customerFit.score,

    niveau:
      customerFit.niveau,

    diagnostic:
      customerFit.diagnostic,

    forces:
      customerFit.forces.slice(
        0,
        3
      ),

    pointsAClarifier:
      customerFit
        .pointsAClarifier
        .slice(
          0,
          3
        )
  };
}


/**
 * ============================================================
 * MODÈLE ÉCONOMIQUE
 * ============================================================
 */

function strategicSummaryModeleEconomique(
  data
) {
  if (typeof smartWriterModeleEconomique === "function") {
    return smartWriterModeleEconomique(data);
  }

  var modele =
    strategicSummaryValeur(
      data.revenueModel ||
      data.businessModel ||
      data.pricingModel,
      ""
    );

  if (modele) {
    return (
      "Le projet prévoit de générer ses revenus grâce à " +
      strategicSummaryPhrase(
        modele,
        ""
      ) +
      ". Cette hypothèse devra être validée par des tests de prix et de paiement auprès de clients réels."
    );
  }

  return (
    "Le mécanisme précis de génération des revenus doit encore être clarifié. " +
    "Le projet devra identifier qui paiera, pour quelle offre, à quel prix et selon quelle fréquence."
  );
}


/**
 * ============================================================
 * MARCHÉ ET OPPORTUNITÉ SECTORIELLE
 * ============================================================
 */

function strategicSummaryMarche(
  data,
  secteur
) {
  var zone =
    strategicSummaryValeur(
      data.marketArea,
      data.country ||
      "la zone de lancement"
    );

  var introduction =
    "Le projet sera initialement développé dans " +
    zone +
    ". ";

  var opportunites = {
    agriculture:
      "L’opportunité repose notamment sur la croissance des besoins alimentaires, la transformation locale, la réduction des pertes et l’amélioration des revenus des producteurs.",

    technologie:
      "L’opportunité repose sur l’adoption croissante des outils numériques, le besoin de simplification des services et la recherche de solutions accessibles depuis les équipements mobiles.",

    energie:
      "L’opportunité repose sur les besoins d’accès à une énergie fiable, la réduction des coûts énergétiques et le développement des solutions renouvelables.",

    recyclage:
      "L’opportunité repose sur l’augmentation des volumes de déchets, le besoin de collecte structurée, la valorisation des matières et le développement de l’économie circulaire.",

    transport:
      "L’opportunité repose sur les besoins croissants de mobilité, de livraison, de traçabilité et d’optimisation des déplacements.",

    commerce:
      "L’opportunité repose sur l’évolution des habitudes d’achat, l’amélioration de la distribution et l’accès à des produits mieux adaptés aux attentes des clients.",

    services:
      "L’opportunité repose sur la recherche de prestations plus fiables, accessibles, professionnelles et adaptées aux besoins locaux.",

    general:
      "L’opportunité devra être démontrée à partir de la taille du besoin, du nombre de clients concernés et de leur capacité réelle d’adoption."
  };

  return (
    introduction +
    (
      opportunites[secteur] ||
      opportunites.general
    )
  );
}


/**
 * ============================================================
 * IMPACT
 * ============================================================
 */

function strategicSummaryImpact(data) {
  var impact =
    strategicSummaryValeur(
      data.impact ||
      data.expectedImpact ||
      data.socialImpact ||
      data.environmentalImpact,
      ""
    );

  if (impact) {
    return (
      "L’impact attendu du projet est " +
      strategicSummaryPhrase(
        impact,
        ""
      ) +
      ". Cet impact devra être traduit en indicateurs mesurables."
    );
  }

  var benefice =
    strategicSummaryPhrase(
      data.benefit,
      "une amélioration concrète de la situation des bénéficiaires"
    );

  return (
    "L’impact attendu repose sur " +
    benefice +
    ". Le projet devra définir des indicateurs simples permettant de mesurer les résultats économiques, sociaux ou environnementaux."
  );
}


/**
 * ============================================================
 * FINANCEMENT
 * ============================================================
 */

function strategicSummaryFinancement(data) {
  var besoin =
    strategicSummaryValeur(
      data.fundingNeeded ||
      data.financingNeeded ||
      data.amountNeeded ||
      data.fundingAmount,
      ""
    );

  var utilisation =
    strategicSummaryValeur(
      data.fundingUse ||
      data.useOfFunds ||
      data.financingUse,
      ""
    );

  if (besoin && utilisation) {
    return (
      "Le financement recherché est estimé à " +
      besoin +
      ". Il sera principalement utilisé pour " +
      strategicSummaryPhrase(
        utilisation,
        ""
      ) +
      "."
    );
  }

  if (besoin) {
    return (
      "Le financement recherché est estimé à " +
      besoin +
      ". L’utilisation détaillée des fonds devra être clairement répartie entre équipements, opérations, commercialisation et trésorerie."
    );
  }

  if (utilisation) {
    return (
      "Le financement sera principalement utilisé pour " +
      strategicSummaryPhrase(
        utilisation,
        ""
      ) +
      ". Le montant total et le calendrier de mobilisation doivent encore être précisés."
    );
  }

  return (
    "Le besoin de financement, son calendrier et l’utilisation exacte des fonds doivent encore être précisés avant toute présentation à un partenaire financier."
  );
}


/**
 * ============================================================
 * HYPOTHÈSES CRITIQUES
 * ============================================================
 */

function strategicSummaryHypotheses(
  analyseHypotheses
) {
  var hypotheses =
    analyseHypotheses
      .hypothesesCritiques
      .slice(
        0,
        STRATEGIC_SUMMARY_CONFIG
          .nombreHypothesesAffichees
      );

  var resultat = [];

  for (
    var index = 0;
    index < hypotheses.length;
    index++
  ) {
    var hypothese =
      hypotheses[index];

    resultat.push({
      categorie:
        hypothese.categorie,

      hypothese:
        hypothese.hypothese,

      risque:
        hypothese.risque,

      validation:
        hypothese.methodeValidation,

      indicateur:
        hypothese.indicateurAttendu
    });
  }

  return resultat;
}


/**
 * ============================================================
 * PRIORITÉS IMMÉDIATES
 * ============================================================
 */

function strategicSummaryPriorites(
  data,
  customerFit,
  analyseHypotheses
) {
  var priorites = [];

  if (
    customerFit.score < 85
  ) {
    priorites.push(
      "Clarifier les informations encore faibles dans l’adéquation client-solution."
    );
  }

  if (
    analyseHypotheses
      .hypothesesCritiques
      .length > 0
  ) {
    var premiereHypothese =
      analyseHypotheses
        .hypothesesCritiques[0];

    priorites.push(
      "Valider en priorité l’hypothèse « " +
      premiereHypothese.categorie +
      " » à l’aide du test recommandé."
    );
  }

  priorites.push(
    "Interroger au moins 10 clients ou bénéficiaires directement concernés par le problème."
  );

  priorites.push(
    "Tester une version minimale de la solution avant un investissement important."
  );

  if (
    !strategicSummaryChampEstRenseigne(
      data.revenueModel ||
      data.businessModel ||
      data.pricingModel
    )
  ) {
    priorites.push(
      "Définir clairement qui paiera, combien, pour quelle offre et selon quelle fréquence."
    );
  } else {
    priorites.push(
      "Tester le prix et obtenir au moins une preuve concrète de paiement ou d’engagement."
    );
  }

  if (
    !strategicSummaryChampEstRenseigne(
      data.fundingNeeded ||
      data.financingNeeded ||
      data.amountNeeded
    )
  ) {
    priorites.push(
      "Calculer précisément le financement nécessaire au lancement et son utilisation."
    );
  }

  return priorites.slice(
    0,
    STRATEGIC_SUMMARY_CONFIG
      .nombrePrioritesAffichees
  );
}


/**
 * ============================================================
 * DIAGNOSTIC STRATÉGIQUE
 * ============================================================
 */

function strategicSummaryDiagnostic(
  data,
  customerFit,
  analyseHypotheses,
  secteur
) {
  var projet =
    strategicSummaryValeur(
      data.projectName,
      "Le projet"
    );

  var texte =
    projet +
    " intervient dans le secteur " +
    secteur +
    " et obtient un score Customer Fit de " +
    customerFit.score +
    "/100. ";

  if (
    customerFit.score >= 85
  ) {
    texte +=
      "La cohérence entre le problème, la clientèle, la solution et la proposition de valeur est forte. ";
  } else if (
    customerFit.score >= 65
  ) {
    texte +=
      "La logique client-solution est encourageante, mais elle doit encore être renforcée. ";
  } else {
    texte +=
      "L’adéquation client-solution demeure insuffisamment démontrée. ";
  }

  texte +=
    "Le score de préparation est de " +
    analyseHypotheses.scorePreparation +
    "/100. ";

  if (
    analyseHypotheses.scorePreparation >=
    70
  ) {
    texte +=
      "Le projet peut avancer vers une phase pilote structurée, sous réserve de valider les hypothèses prioritaires.";
  } else if (
    analyseHypotheses.scorePreparation >=
    45
  ) {
    texte +=
      "Le projet doit encore obtenir des preuves de terrain avant un déploiement commercial important.";
  } else {
    texte +=
      "La priorité doit rester la compréhension du marché, les tests clients et la validation opérationnelle avant toute expansion.";
  }

  return texte;
}


/**
 * ============================================================
 * RÉDACTION DE LA PAGE
 * ============================================================
 */

/**
 * Produit le texte complet de la synthèse stratégique.
 *
 * @param {Object} data Données du questionnaire.
 * @param {Object=} synthese Synthèse déjà calculée.
 * @return {string} Texte prêt à intégrer dans un document.
 */
function redigerSyntheseStrategique(
  data,
  synthese
) {
  synthese =
    synthese ||
    genererSyntheseStrategique(data);

  var texte = "";

  texte +=
    "SYNTHÈSE STRATÉGIQUE\n\n";

  texte +=
    strategicSummaryTitre(
      "PROJET"
    );

  texte +=
    synthese.projet.nom +
    " — " +
    synthese.projet.secteurDeclare +
    "\n";

  texte +=
    "Promoteur : " +
    synthese.projet.promoteur +
    "\n";

  texte +=
    "Pays : " +
    synthese.projet.pays +
    "\n";

  texte +=
    "Zone de lancement : " +
    synthese.projet.zone +
    "\n";

  texte +=
    "Stade : " +
    synthese.projet.stade +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "VISION"
    );

  texte +=
    synthese.vision +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "PROBLÈME"
    );

  texte +=
    synthese.probleme +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "SOLUTION"
    );

  texte +=
    synthese.solution +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "CLIENTS PRIORITAIRES"
    );

  texte +=
    synthese.clients +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "PROPOSITION DE VALEUR"
    );

  texte +=
    synthese.propositionValeur +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "ADÉQUATION CLIENT-SOLUTION"
    );

  texte +=
    "Score : " +
    synthese.customerFit.score +
    "/100 — " +
    synthese.customerFit.niveau +
    ".\n";

  texte +=
    synthese.customerFit.diagnostic +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "MODÈLE ÉCONOMIQUE"
    );

  texte +=
    synthese.modeleEconomique +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "MARCHÉ ET OPPORTUNITÉ"
    );

  texte +=
    synthese.marche +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "IMPACT"
    );

  texte +=
    synthese.impact +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "FINANCEMENT"
    );

  texte +=
    synthese.financement +
    "\n\n";


  texte +=
    strategicSummaryTitre(
      "HYPOTHÈSES CRITIQUES"
    );

  for (
    var index = 0;
    index <
    synthese.hypothesesCritiques.length;
    index++
  ) {
    var hypothese =
      synthese.hypothesesCritiques[
        index
      ];

    texte +=
      (index + 1) +
      ". " +
      hypothese.categorie +
      " — Risque : " +
      hypothese.risque +
      "\n";

    texte +=
      hypothese.hypothese +
      "\n";

    texte +=
      "Validation : " +
      hypothese.validation +
      "\n";

    texte +=
      "Indicateur attendu : " +
      hypothese.indicateur +
      "\n\n";
  }


  texte +=
    strategicSummaryTitre(
      "PRIORITÉS IMMÉDIATES"
    );

  for (
    var prioriteIndex = 0;
    prioriteIndex <
    synthese.prioritesImmediates.length;
    prioriteIndex++
  ) {
    texte +=
      "• " +
      synthese.prioritesImmediates[
        prioriteIndex
      ] +
      "\n";
  }

  texte +=
    "\n";


  texte +=
    strategicSummaryTitre(
      "DIAGNOSTIC STRATÉGIQUE"
    );

  texte +=
    synthese.diagnostic;

  texte =
    strategicSummaryLimiterLongueur(
      texte,
      STRATEGIC_SUMMARY_CONFIG
        .longueurResumeMaximum
    );

  return texte.trim();
}


/**
 * ============================================================
 * VERSION STRUCTURÉE POUR GOOGLE DOCS
 * ============================================================
 */

/**
 * Retourne une liste de sections utilisables plus tard
 * par Code.gs pour la création du Google Docs.
 */
function obtenirSectionsSyntheseStrategique(
  data
) {
  var synthese =
    genererSyntheseStrategique(data);

  var hypotheses = [];

  for (
    var index = 0;
    index <
    synthese.hypothesesCritiques.length;
    index++
  ) {
    var element =
      synthese.hypothesesCritiques[
        index
      ];

    hypotheses.push(
      element.categorie +
      " — " +
      element.hypothese +
      " Validation : " +
      element.validation
    );
  }

  return [
    {
      titre: "Vision",
      contenu:
        synthese.vision
    },

    {
      titre: "Problème",
      contenu:
        synthese.probleme
    },

    {
      titre: "Solution",
      contenu:
        synthese.solution
    },

    {
      titre: "Clients prioritaires",
      contenu:
        synthese.clients
    },

    {
      titre: "Proposition de valeur",
      contenu:
        synthese.propositionValeur
    },

    {
      titre:
        "Adéquation client-solution",

      contenu:
        "Score : " +
        synthese.customerFit.score +
        "/100 — " +
        synthese.customerFit.niveau +
        ". " +
        synthese.customerFit.diagnostic
    },

    {
      titre: "Modèle économique",
      contenu:
        synthese.modeleEconomique
    },

    {
      titre: "Marché et opportunité",
      contenu:
        synthese.marche
    },

    {
      titre: "Impact",
      contenu:
        synthese.impact
    },

    {
      titre: "Financement",
      contenu:
        synthese.financement
    },

    {
      titre: "Hypothèses critiques",
      contenu:
        hypotheses.join(
          "\n\n"
        )
    },

    {
      titre: "Priorités immédiates",
      contenu:
        synthese
          .prioritesImmediates
          .join("\n")
    },

    {
      titre: "Diagnostic stratégique",
      contenu:
        synthese.diagnostic
    }
  ];
}


/**
 * ============================================================
 * OUTILS UTILITAIRES
 * ============================================================
 */

function strategicSummaryDetecterSecteur(
  data
) {
  if (
    typeof writerDetecterSecteur ===
    "function"
  ) {
    return writerDetecterSecteur(data);
  }

  return "general";
}


function strategicSummaryChampEstRenseigne(
  valeur
) {
  if (
    typeof customerFitChampEstRenseigne ===
    "function"
  ) {
    return customerFitChampEstRenseigne(
      valeur
    );
  }

  if (
    valeur === null ||
    valeur === undefined
  ) {
    return false;
  }

  return String(
    valeur
  ).trim().length >= 5;
}


function strategicSummaryValeur(
  valeur,
  valeurParDefaut
) {
  if (
    !strategicSummaryChampEstRenseigne(
      valeur
    )
  ) {
    return valeurParDefaut || "";
  }

  return String(
    valeur
  )
    .replace(/\s+/g, " ")
    .trim();
}


function strategicSummaryPhrase(
  valeur,
  valeurParDefaut
) {
  var texte =
    strategicSummaryValeur(
      valeur,
      valeurParDefaut
    );

  texte = String(
    texte || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!texte) {
    return valeurParDefaut || "";
  }

  texte =
    texte.charAt(0).toLowerCase() +
    texte.slice(1);

  return texte.replace(
    /[.!?;:,]+$/,
    ""
  );
}


function strategicSummaryNettoyerPhrase(
  texte
) {
  texte = String(
    texte || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!texte) {
    return "";
  }

  texte =
    texte.charAt(0).toUpperCase() +
    texte.slice(1);

  if (
    !/[.!?]$/.test(texte)
  ) {
    texte += ".";
  }

  return texte;
}


function strategicSummaryTitre(
  titre
) {
  return titre + "\n";
}


function strategicSummaryLimiterLongueur(
  texte,
  longueurMaximum
) {
  texte = String(
    texte || ""
  );

  if (
    texte.length <=
    longueurMaximum
  ) {
    return texte;
  }

  return (
    texte.substring(
      0,
      longueurMaximum - 3
    )
    .trim() +
    "..."
  );
}


/**
 * ============================================================
 * TEST DU MOTEUR
 * ============================================================
 */

function testerStrategicSummaryEngine_() {
  var projet = {
    projectName:
      "EcoCycle Africa",

    promoterName:
      "Entrepreneur Test",

    country:
      "Côte d’Ivoire",

    marketArea:
      "Abidjan et sa périphérie",

    sector:
      "Économie circulaire et gestion des déchets",

    stage:
      "Phase pilote",

    vision:
      "Devenir un acteur de référence dans la collecte et la valorisation locale des déchets plastiques",

    problem:
      "les déchets plastiques s’accumulent dans les quartiers urbains et restent insuffisamment valorisés",

    affectedPeople:
      "les ménages, les commerces, les collectivités locales et les habitants des zones polluées",

    urgency:
      "l’accumulation des déchets augmente les risques sanitaires et dégrade l’environnement urbain",

    solution:
      "un service structuré de collecte, de tri et de transformation des déchets plastiques",

    valueProposition:
      "une collecte de proximité associée à la traçabilité, à la création d’emplois verts et à la valorisation locale",

    benefit:
      "une réduction de la pollution, une amélioration de la propreté et de nouvelles opportunités économiques",

    targetCustomers:
      "les entreprises, les commerces, les collectivités et les ménages",

    competitors:
      "les collecteurs informels, les entreprises de collecte et les recycleurs existants",

    revenueModel:
      "la facturation des services de collecte et la vente des matières plastiques valorisées",

    salesChannels:
      "la prospection directe, les partenariats avec les collectivités et les campagnes locales",

    promoterExperience:
      "une équipe possédant une connaissance du terrain et de la gestion communautaire",

    impact:
      "la réduction des déchets abandonnés, la création d’emplois verts et l’amélioration de la propreté urbaine",

    fundingNeeded:
      "25 000 000 FCFA",

    fundingUse:
      "l’acquisition des équipements de collecte, de tri et de transformation, le recrutement initial et le besoin en fonds de roulement"
  };

  var synthese =
    genererSyntheseStrategique(
      projet
    );

  console.log(
    "===================================="
  );

  console.log(
    "PROJET : " +
    synthese.projet.nom
  );

  console.log(
    "SECTEUR : " +
    synthese.indicateurs.secteur
  );

  console.log(
    "CUSTOMER FIT : " +
    synthese.indicateurs
      .customerFitScore +
    "/100"
  );

  console.log(
    "SCORE DE PRÉPARATION : " +
    synthese.indicateurs
      .scorePreparation +
    "/100"
  );

  console.log(
    "HYPOTHÈSES AFFICHÉES : " +
    synthese.hypothesesCritiques
      .length
  );

  console.log(
    "PRIORITÉS AFFICHÉES : " +
    synthese.prioritesImmediates
      .length
  );

  console.log(
    "===================================="
  );

  console.log(
    synthese.texteComplet
  );

  console.log(
    "===================================="
  );

  console.log(
    JSON.stringify(
      obtenirSectionsSyntheseStrategique(
        projet
      ),
      null,
      2
    )
  );

  return synthese;
}