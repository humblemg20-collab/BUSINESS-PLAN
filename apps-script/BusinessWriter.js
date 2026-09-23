/**
 * ============================================================
 * AFRIGREEN24 — BUSINESS WRITER
 * Fichier : BusinessWriter.gs
 * ============================================================
 *
 * Ce fichier transforme les réponses du questionnaire
 * en contenu professionnel.
 *
 * Il utilise WriterLibrary.gs pour sélectionner :
 * - des introductions ;
 * - des transitions ;
 * - des formulations de vision ;
 * - des conclusions.
 *
 * Il ne crée ni Google Docs ni PDF.
 */


/**
 * ============================================================
 * 1. RÉSUMÉ EXÉCUTIF
 * ============================================================
 */
function redigerResumeExecutif(data) {
  if (typeof smartWriterResumeExecutif === "function") {
    return smartWriterResumeExecutif(data);
  }

  var projet = writerValeur(data.projectName, "Le projet");
  var pays = writerValeur(data.country, "un marché africain");
  var secteur = writerValeur(data.sector, "un secteur à fort potentiel");

  return (
    projet +
    " est une initiative développée en " +
    pays +
    " dans le secteur " +
    secteur +
    ".\n\n" +
    writerPhrase(data.problem, "Le problème principal doit encore être précisé") +
    ".\n\n" +
    writerPhrase(data.solution, "La solution proposée doit encore être précisée") +
    "."
  );
}


/**
 * ============================================================
 * 2. PRÉSENTATION DU PROJET
 * ============================================================
 */
/**
 * ============================================================
 * 2. PRÉSENTATION DU PROJET
 * ============================================================
 */
function redigerPresentationProjet(data) {
  var projet = writerValeur(
    data.projectName,
    "Le projet"
  );

  var promoteur = writerValeur(
    data.promoterName,
    "le porteur du projet"
  );

  var pays = writerValeur(
    data.country,
    "un marché africain"
  );

  var stade = writerValeur(
    data.stage,
    "une phase de développement initiale"
  );

  var secteur = writerValeur(
    data.sector,
    "un secteur à préciser"
  );

  var secteurDetecte = writerDetecterSecteur(
    data
  );

  return (
    projet +
    " est une initiative portée par " +
    promoteur +
    " et développée en " +
    pays +
    ". Elle intervient dans le secteur suivant : " +
    secteur +
    ".\n\n" +

    writerContexteSecteur(data) +
    "\n\n" +

    "Le projet se situe actuellement au stade suivant : " +
    stade +
    ". Cette phase constitue une étape importante pour valider la pertinence de l’offre, structurer les opérations et préparer le développement commercial.\n\n" +

    writerTransition(
      data,
      "presentation"
    ) +
    " l’organisation devra définir des objectifs précis, mobiliser les compétences nécessaires et mettre en place des méthodes de suivi adaptées au profil sectoriel identifié : " +
    secteurDetecte +
    ".\n\n" +

    writerConclusionParagraphe(
      data,
      "presentation"
    )
  );
}


/**
 * ============================================================
 * 3. PROBLÈME ET OPPORTUNITÉ
 * ============================================================
 */
/**
 * ============================================================
 * 3. PROBLÈME ET OPPORTUNITÉ
 * ============================================================
 */
function redigerProbleme(data) {
  var probleme = writerPhrase(
    data.problem,
    "un problème important affectant le marché ciblé"
  );

  var personnes = writerPhrase(
    data.affectedPeople,
    "les populations et organisations concernées"
  );

  var urgence = writerPhrase(
    data.urgency,
    "les conséquences risquent de s’aggraver si aucune action n’est engagée"
  );

  return (
    writerIntroProbleme(data) +
    " " +
    probleme +
    ". Cette situation affecte principalement " +
    personnes +
    ".\n\n" +

    writerContexteSecteur(data) +
    "\n\n" +

    "Elle peut entraîner des pertes économiques, limiter l’accès à certaines opportunités et dégrader les conditions d’activité ou de vie des bénéficiaires concernés.\n\n" +

    writerTransition(
      data,
      "probleme"
    ) +
    " une intervention devient nécessaire car " +
    urgence +
    ". Le maintien de la situation actuelle pourrait accentuer les difficultés et ralentir le développement du marché.\n\n" +

    writerOpportuniteSecteur(data) +
    "\n\n" +

    writerConclusionParagraphe(
      data,
      "probleme"
    )
  );
}


/**
 * ============================================================
 * 4. SOLUTION PROPOSÉE
 * ============================================================
 */
/**
 * ============================================================
 * 4. SOLUTION PROPOSÉE
 * ============================================================
 */
function redigerSolution(data) {
  var solution = writerPhrase(
    data.solution,
    "une solution destinée à répondre au problème identifié"
  );

  var difference = writerPhrase(
    data.valueProposition,
    "une approche adaptée aux réalités du marché"
  );

  var benefice = writerPhrase(
    data.benefit,
    "une amélioration concrète pour les utilisateurs"
  );

  return (
    writerIntroSolution(data) +
    " " +
    solution +
    ". Cette réponse a été pensée pour agir directement sur les difficultés identifiées et produire des résultats concrets pour les utilisateurs.\n\n" +

    "La proposition de valeur repose sur " +
    difference +
    ". Cet élément doit permettre au projet de se différencier des solutions existantes et de construire un positionnement clair sur son marché.\n\n" +

    writerValeurSecteur(data) +
    "\n\n" +

    writerTransition(
      data,
      "solution"
    ) +
    " le bénéfice principal attendu est " +
    benefice +
    ". La solution devra améliorer l’expérience des clients, réduire certaines contraintes et créer une valeur économique, sociale ou environnementale mesurable.\n\n" +

    writerConclusionParagraphe(
      data,
      "solution"
    )
  );
}


/**
 * ============================================================
 * 5. ANALYSE DU MARCHÉ
 * ============================================================
 */
/**
 * ============================================================
 * 5. ANALYSE DU MARCHÉ
 * ============================================================
 */
function redigerMarche(data) {
  var clients = writerPhrase(
    data.targetCustomers,
    "les clients et bénéficiaires présentant le besoin identifié"
  );

  var zone = writerValeur(
    data.marketArea,
    data.country || "la zone de lancement du projet"
  );

  var concurrents = writerPhrase(
    data.competitors,
    "des acteurs directs, indirects ou des solutions alternatives"
  );

  return (
    writerIntroMarche(data) +
    "\n\n" +

    writerContexteSecteur(data) +
    "\n\n" +

    "La clientèle cible est constituée principalement de " +
    clients +
    ". Ces utilisateurs recherchent une solution fiable, accessible et adaptée à leurs besoins ainsi qu’à leurs habitudes.\n\n" +

    "Le lancement commercial sera prioritairement concentré dans la zone suivante : " +
    zone +
    ". Cette approche permettra de tester la demande, de recueillir les premiers retours clients et d’ajuster progressivement l’offre.\n\n" +

    "L’environnement concurrentiel comprend " +
    concurrents +
    ". Le projet devra se différencier par la qualité de son offre, sa proximité avec les clients, sa capacité d’innovation et la clarté de sa proposition de valeur.\n\n" +

    writerOpportuniteSecteur(data) +
    "\n\n" +

    writerConclusionParagraphe(
      data,
      "marche"
    )
  );
}


/**
 * ============================================================
 * 6. MODÈLE ÉCONOMIQUE
 * ============================================================
 */
function redigerModeleEconomique(data) {
  var revenus = writerPhrase(
    data.revenueModel,
    "la commercialisation de produits ou de services"
  );

  var prix = writerValeur(
    data.pricing,
    "une tarification qui sera validée par le marché"
  );

  var couts = writerPhrase(
    data.mainCosts,
    "les dépenses liées aux opérations, à l’équipe et au développement commercial"
  );

  return (
    writerIntroModele(data) +
    "\n\n" +

    "Les revenus proviendront principalement de " +
    revenus +
    ". Cette source de revenus devra progressivement permettre de couvrir les charges d’exploitation et de financer la croissance de l’activité.\n\n" +

    "La politique tarifaire envisagée est la suivante : " +
    prix +
    ". Le niveau de prix devra rester cohérent avec la valeur apportée, le pouvoir d’achat des clients et les pratiques du marché.\n\n" +

    "Les principales catégories de coûts comprennent " +
    couts +
    ". Une gestion rigoureuse de ces dépenses sera indispensable pour atteindre l’équilibre financier et préserver la rentabilité du projet.\n\n" +

    writerConclusionParagraphe(
      data,
      "modele"
    )
  );
}


/**
 * ============================================================
 * 7. STRATÉGIE COMMERCIALE ET MARKETING
 * ============================================================
 */
function redigerStrategieCommerciale(data) {
  var clients = writerPhrase(
    data.targetCustomers,
    "les clients ciblés"
  );

  var canaux = writerPhrase(
    data.salesChannels,
    "des canaux numériques, physiques et des partenariats locaux"
  );

  var zone = writerValeur(
    data.marketArea,
    "la zone de lancement"
  );

  return (
    "La stratégie commerciale vise à faire connaître l’offre auprès de " +
    clients +
    ". Le projet utilisera principalement " +
    canaux +
    " afin de toucher les utilisateurs, présenter la proposition de valeur et faciliter le passage à l’achat.\n\n" +

    writerTransition(
      data,
      "commercial"
    ) +
    " les premiers efforts seront concentrés sur " +
    zone +
    ". Cette phase permettra de mesurer l’efficacité des actions marketing, d’obtenir des retours clients et d’améliorer progressivement le positionnement de l’offre.\n\n" +

    "La fidélisation reposera sur la qualité de l’expérience client, la régularité du service, une communication claire et le développement d’une relation de confiance avec les bénéficiaires.\n\n" +

    writerConclusionParagraphe(
      data,
      "commercial"
    )
  );
}


/**
 * ============================================================
 * 8. ÉQUIPE ET ORGANISATION
 * ============================================================
 */
function redigerEquipe(data) {
  var equipe = writerPhrase(
    data.team,
    "une équipe dont les compétences seront progressivement renforcées"
  );

  return (
    "Le développement du projet repose sur " +
    equipe +
    ". La réussite de l’entreprise nécessitera une répartition claire des responsabilités entre la direction, les opérations, la commercialisation et la gestion financière.\n\n" +

    writerTransition(
      data,
      "equipe"
    ) +
    " le projet pourra intégrer de nouvelles compétences techniques, commerciales et administratives au fur et à mesure de sa croissance.\n\n" +

    "Des partenaires externes pourront également être mobilisés lorsque certaines expertises ne sont pas disponibles en interne. La gouvernance devra s’appuyer sur des objectifs clairs, des indicateurs de suivi et une communication régulière entre les membres de l’équipe.\n\n" +

    writerConclusionParagraphe(
      data,
      "equipe"
    )
  );
}


/**
 * ============================================================
 * 9. BESOIN DE FINANCEMENT
 * ============================================================
 */
function redigerFinancement(data) {
  var typeFinancement = writerValeur(
    data.fundingType,
    "un financement adapté au stade du projet"
  );

  var montant = writerValeur(
    data.fundingNeed,
    "un montant qui reste à déterminer"
  );

  var utilisation = writerPhrase(
    data.useOfFunds,
    "le lancement des opérations et le développement commercial"
  );

  return (
    writerIntroFinancement(data) +
    "\n\n" +

    "Le projet recherche " +
    typeFinancement +
    " pour un montant estimé à " +
    montant +
    ". Ces ressources doivent permettre d’accélérer la mise en œuvre du projet et de renforcer ses capacités opérationnelles.\n\n" +

    "Les fonds seront principalement consacrés à " +
    utilisation +
    ". Leur affectation devra être suivie à travers un budget détaillé, un calendrier de décaissement et des indicateurs permettant de vérifier l’atteinte des objectifs.\n\n" +

    writerTransition(
      data,
      "financement"
    ) +
    " la gestion de la trésorerie devra rester prudente afin de limiter les risques financiers et d’assurer la continuité des opérations.\n\n" +

    writerConclusionParagraphe(
      data,
      "financement"
    )
  );
}


/**
 * ============================================================
 * 10. IMPACT
 * ============================================================
 */
function redigerImpact(data) {
  var impact = writerPhrase(
    data.impact,
    "un impact économique, social ou environnemental positif"
  );

  return (
    writerIntroImpact(data) +
    "\n\n" +

    "L’initiative ambitionne de créer " +
    impact +
    ". Elle souhaite contribuer durablement au développement de son territoire et à l’amélioration des conditions de vie ou d’activité de ses bénéficiaires.\n\n" +

    "L’impact devra être mesuré à travers des indicateurs simples et vérifiables, tels que le nombre de bénéficiaires, les emplois créés, les revenus générés, les économies réalisées ou les ressources environnementales préservées.\n\n" +

    writerTransition(
      data,
      "impact"
    ) +
    " la capacité à démontrer des résultats mesurables renforcera la crédibilité du projet auprès des clients, des partenaires et des organismes de financement.\n\n" +

    writerConclusionParagraphe(
      data,
      "impact"
    )
  );
}


/**
 * ============================================================
 * 11. RISQUES ET MESURES D’ATTÉNUATION
 * ============================================================
 */
/**
 * ============================================================
 * 11. RISQUES ET MESURES D’ATTÉNUATION
 * ============================================================
 */
function redigerRisques(data) {
  var risque = writerPhrase(
    data.risks,
    "des risques commerciaux, opérationnels ou financiers"
  );

  return (
    writerIntroRisques(data) +
    "\n\n" +

    "Le principal risque identifié par le porteur de projet concerne " +
    risque +
    ". Cette situation pourrait ralentir le lancement, augmenter les coûts ou réduire la capacité de l’entreprise à atteindre ses objectifs.\n\n" +

    writerRisquesSecteur(data) +
    "\n\n" +

    "Pour limiter cette exposition, le projet devra tester progressivement son offre, suivre régulièrement ses activités et maintenir une gestion prudente de ses ressources financières.\n\n" +

    writerTransition(
      data,
      "risques"
    ) +
    " la diversification des clients et des partenaires, la constitution d’une réserve de trésorerie et l’ajustement régulier de la stratégie commerciale permettront de renforcer la résilience de l’entreprise.\n\n" +

    writerConclusionParagraphe(
      data,
      "risques"
    )
  );
}


/**
 * ============================================================
 * 12. CONCLUSION ET PROCHAINES ÉTAPES
 * ============================================================
 */
function redigerConclusion(data) {
  var projet = writerValeur(
    data.projectName,
    "Le projet"
  );

  var solution = writerPhrase(
    data.solution,
    "une solution répondant au besoin identifié"
  );

  var clients = writerPhrase(
    data.targetCustomers,
    "les clients et bénéficiaires ciblés"
  );

  var actions = writerPhrase(
    data.useOfFunds,
    "les premières actions opérationnelles"
  );

  return (
    projet +
    " présente une opportunité de création de valeur fondée sur " +
    solution +
    ". Son potentiel repose sur sa capacité à répondre efficacement aux besoins de " +
    clients +
    ".\n\n" +

    "La réussite du projet dépendra principalement de la validation du marché, de la qualité de l’exécution, de la maîtrise des coûts et de la capacité à mobiliser les ressources nécessaires.\n\n" +

    writerTransition(
      data,
      "conclusion"
    ) +
    " les prochaines étapes prioritaires consistent à mettre en œuvre " +
    actions +
    ", à obtenir les premiers résultats commerciaux et à structurer progressivement l’organisation.\n\n" +

    writerConclusionGenerale(data)
  );
}


/**
 * ============================================================
 * OUTILS DE NETTOYAGE
 * ============================================================
 */


/**
 * Prépare une valeur courte.
 */
function writerValeur(
  valeur,
  valeurParDefaut
) {
  if (
    valeur === null ||
    valeur === undefined ||
    String(valeur).trim() === ""
  ) {
    return valeurParDefaut || "";
  }

  return String(valeur).trim();
}


/**
 * Prépare un texte afin qu’il puisse être intégré
 * naturellement dans une phrase.
 */
function writerPhrase(
  valeur,
  valeurParDefaut
) {
  var texte = writerValeur(
    valeur,
    valeurParDefaut
  );

  texte = texte
    .replace(/\s+/g, " ")
    .trim();

  if (!texte) {
    return valeurParDefaut || "";
  }

  texte =
    texte.charAt(0).toLowerCase() +
    texte.slice(1);

  texte = texte.replace(
    /[.!?;:,]+$/,
    ""
  );

  return texte;
}

/**
 * ============================================================
 * TEST DE L’INTELLIGENCE SECTORIELLE
 * ============================================================
 */
function testerBusinessWriterSectoriel() {
  var projets = [
    {
      projectName: "AgroPlus",
      sector: "Agriculture et transformation agroalimentaire",
      country: "Côte d’Ivoire",
      promoterName: "Entrepreneur Test",
      stage: "Phase de lancement",
      problem: "les producteurs perdent une partie importante de leurs récoltes",
      affectedPeople: "les petits producteurs agricoles",
      urgency: "les pertes réduisent les revenus des exploitants",
      solution: "une unité locale de transformation et de conservation",
      valueProposition: "une transformation de proximité",
      benefit: "une meilleure valorisation des récoltes",
      targetCustomers: "les producteurs, les commerçants et les distributeurs",
      marketArea: "Abidjan et les zones agricoles voisines",
      competitors: "les transformateurs et commerçants locaux",
      risks: "la saisonnalité de la production"
    },

    {
      projectName: "SolarAccess",
      sector: "Énergie solaire",
      country: "Sénégal",
      promoterName: "Entrepreneur Test",
      stage: "Phase pilote",
      problem: "plusieurs entreprises subissent des coupures d’électricité",
      affectedPeople: "les petites entreprises et les ménages",
      urgency: "les interruptions ralentissent les activités économiques",
      solution: "des installations solaires accessibles",
      valueProposition: "une offre incluant installation et maintenance",
      benefit: "une alimentation électrique plus stable",
      targetCustomers: "les ménages et les petites entreprises",
      marketArea: "Dakar et sa périphérie",
      competitors: "les installateurs solaires locaux",
      risks: "le coût initial des équipements"
    },

    {
      projectName: "DigitalMarket",
      sector: "Technologie et plateforme numérique",
      country: "Cameroun",
      promoterName: "Entrepreneur Test",
      stage: "Prototype",
      problem: "les petits commerçants manquent de visibilité numérique",
      affectedPeople: "les commerçants et les consommateurs",
      urgency: "les ventes restent limitées aux zones de proximité",
      solution: "une plateforme mobile de vente locale",
      valueProposition: "une utilisation simple depuis un téléphone mobile",
      benefit: "un accès élargi aux clients",
      targetCustomers: "les commerçants et les acheteurs urbains",
      marketArea: "Douala",
      competitors: "les plateformes de commerce électronique",
      risks: "l’adoption progressive de la technologie"
    }
  ];

  for (
    var index = 0;
    index < projets.length;
    index++
  ) {
    var projet = projets[index];

    console.log(
      "===================================="
    );

    console.log(
      "PROJET : " +
      projet.projectName
    );

    console.log(
      "SECTEUR DÉTECTÉ : " +
      writerDetecterSecteur(projet)
    );

    console.log(
      "PRÉSENTATION :\n" +
      redigerPresentationProjet(projet)
    );

    console.log(
      "SOLUTION :\n" +
      redigerSolution(projet)
    );

    console.log(
      "RISQUES :\n" +
      redigerRisques(projet)
    );
  }
}