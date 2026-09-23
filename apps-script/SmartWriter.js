/**
 * ============================================================
 * AFRIGREEN24 — SMART WRITER
 * Fichier : SmartWriter.gs
 * ============================================================
 *
 * Couche de rédaction déterministe utilisée avant l'intégration
 * de l'IA. Elle transforme les réponses brutes en formulations
 * complètes sans inventer d'informations.
 */

function smartWriterValeur(valeur, valeurParDefaut) {
  if (valeur === null || valeur === undefined) {
    return valeurParDefaut || "";
  }

  var texte = String(valeur)
    .replace(/\s+/g, " ")
    .trim();

  return texte || valeurParDefaut || "";
}

function smartWriterNettoyer(texte) {
  texte = smartWriterValeur(texte, "");

  if (!texte) {
    return "";
  }

  texte = texte
    .replace(/\ben fait\b[,:;]?\s*/gi, "")
    .replace(/\bdu coup\b[,:;]?\s*/gi, "")
    .replace(/\bplusieur\b/gi, "plusieurs")
    .replace(/\bfinacements?\b/gi, "financements")
    .replace(/\bfinancement\b(?=\s|[.,;:!?]|$)/gi, "financement")
    .replace(/\bpresence\b/gi, "présence")
    .replace(/\bdeveloppe\b/gi, "développe")
    .replace(/\bdevelopper\b/gi, "développer")
    .replace(/\breseaux\b/gi, "réseaux")
    .replace(/\bgrace a\b/gi, "grâce à")
    .replace(/\bd une\b/gi, "d’une")
    .replace(/\bd un\b/gi, "d’un")
    .replace(/\bl impact\b/gi, "l’impact")
    .replace(/\bl automatisation\b/gi, "l’automatisation")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?]){2,}/g, "$1")
    .trim();

  return texte.replace(/[.;:,!?]+$/, "");
}

function smartWriterPhraseComplete(texte, valeurParDefaut) {
  texte = smartWriterNettoyer(
    smartWriterValeur(texte, valeurParDefaut)
  );

  if (!texte) {
    return "";
  }

  texte = texte.charAt(0).toUpperCase() + texte.slice(1);

  if (!/[.!?]$/.test(texte)) {
    texte += ".";
  }

  return texte;
}

function smartWriterEstReponseIncertaine(texte) {
  texte = smartWriterValeur(texte, "").toLowerCase();

  return !texte ||
    /je ne sais pas/.test(texte) ||
    /je ne vois personne/.test(texte) ||
    /aucune id[eé]e/.test(texte) ||
    /[àa] pr[eé]ciser/.test(texte) ||
    /pas encore/.test(texte);
}

function smartWriterProbleme(data) {
  data = data || {};

  var probleme = smartWriterPhraseComplete(
    data.problem,
    "Un besoin important reste insuffisamment satisfait sur le marché ciblé."
  );

  var personnes = smartWriterNettoyer(
    smartWriterValeur(
      data.affectedPeople,
      "les clients et organisations concernés"
    )
  );

  var urgence = smartWriterPhraseComplete(
    data.urgency,
    "Sans réponse adaptée, cette difficulté peut limiter leur développement et leur accès aux opportunités."
  );

  return (
    "Le projet part du constat suivant : " +
    probleme +
    " Les publics principalement concernés sont " +
    personnes +
    ". " +
    urgence
  );
}

function smartWriterSolution(data) {
  data = data || {};

  var solution = smartWriterPhraseComplete(
    data.solution,
    "Une solution adaptée sera mise en place pour répondre directement au problème identifié."
  );

  var benefice = smartWriterPhraseComplete(
    data.benefit,
    "Le bénéfice attendu devra être concret, observable et mesurable pour les utilisateurs."
  );

  return (
    "La réponse envisagée est la suivante : " +
    solution +
    " Le bénéfice principal attendu est le suivant : " +
    benefice
  );
}

function smartWriterClients(data) {
  data = data || {};

  var clients = smartWriterNettoyer(
    smartWriterValeur(
      data.targetCustomers,
      "les clients et bénéficiaires directement concernés"
    )
  );

  var zone = smartWriterNettoyer(
    smartWriterValeur(
      data.marketArea || data.country,
      "la zone de lancement du projet"
    )
  );

  return (
    "L’offre cible en priorité " +
    clients +
    ". Le lancement sera concentré dans " +
    zone +
    " afin de tester la demande, recueillir des retours et obtenir les premières preuves de marché."
  );
}

function smartWriterPropositionValeur(data) {
  data = data || {};

  var valeur = smartWriterPhraseComplete(
    data.valueProposition,
    "La proposition de valeur doit encore être formulée de manière plus précise."
  );

  var concurrents = smartWriterValeur(data.competitors, "");
  var concurrence;

  if (smartWriterEstReponseIncertaine(concurrents)) {
    concurrence =
      "Les concurrents directs, indirects et les solutions alternatives n’ont pas encore été identifiés avec précision. Une analyse concurrentielle devra être réalisée.";
  } else {
    concurrence =
      "Cette différence devra être comparée aux offres de " +
      smartWriterNettoyer(concurrents) +
      " afin de démontrer clairement l’avantage du projet.";
  }

  return (
    "La valeur proposée aux clients est la suivante : " +
    valeur +
    " " +
    concurrence
  );
}

function smartWriterModeleEconomique(data) {
  data = data || {};

  var modele = smartWriterValeur(
    data.revenueModel || data.businessModel || data.pricingModel,
    ""
  );

  if (!modele) {
    return (
      "Le mécanisme de génération des revenus doit encore être précisé. " +
      "Le projet devra définir qui paiera, pour quelle offre, à quel prix et selon quelle fréquence."
    );
  }

  return (
    "Le mécanisme de revenus envisagé est le suivant : " +
    smartWriterPhraseComplete(modele, "") +
    " Cette hypothèse devra être validée par des tests de prix et par des preuves concrètes de paiement ou d’engagement."
  );
}

function smartWriterResumeExecutif(data) {
  data = data || {};

  var projet = smartWriterValeur(data.projectName, "Le projet");
  var pays = smartWriterValeur(data.country, "un marché à préciser");
  var secteur = smartWriterValeur(data.sector, "un secteur à préciser");
  var financement = smartWriterValeur(
    data.fundingNeed || data.fundingNeeded || data.fundingAmount,
    "un montant qui reste à préciser"
  );

  var paragrapheIdentite =
    projet +
    " est une initiative développée en " +
    pays +
    " dans le secteur " +
    secteur +
    ".";

  var paragrapheProblemeSolution =
    smartWriterProbleme(data) +
    " " +
    smartWriterSolution(data);

  var paragrapheMarche =
    smartWriterClients(data) +
    " " +
    smartWriterModeleEconomique(data);

  var paragrapheFinancement =
    "Le projet recherche " +
    financement +
    " afin de financer ses priorités de lancement, renforcer ses capacités opérationnelles et soutenir son développement.";

  var vision = "";
  if (typeof writerVision === "function") {
    vision = writerVision(data);
  } else if (data.vision) {
    vision = smartWriterPhraseComplete(data.vision, "");
  }

  return [
    paragrapheIdentite,
    paragrapheProblemeSolution,
    paragrapheMarche,
    paragrapheFinancement,
    vision
  ].filter(function(element) {
    return String(element || "").trim() !== "";
  }).join("\n\n");
}
