/**
 * ============================================================
 * AFRIGREEN24 — WRITER LIBRARY
 * Fichier : WriterLibrary.gs
 * ============================================================
 * Bibliothèque de formulations utilisée par BusinessWriter.gs.
 */

var WRITER_LIBRARY = {
  general: {
    contexte: "Le marché ciblé évolue rapidement et exige une offre claire, accessible et capable de démontrer sa valeur.",
    opportunite: "Cette évolution crée une opportunité pour une solution structurée, proche des utilisateurs et adaptée aux contraintes locales.",
    valeur: "La création de valeur reposera sur la compréhension du besoin, la qualité d’exécution et la capacité à mesurer les résultats.",
    risques: "Les principaux risques concernent l’adoption du marché, la maîtrise des coûts, l’organisation opérationnelle et la disponibilité des ressources."
  },
  agriculture: {
    contexte: "Le secteur agricole reste essentiel à l’économie et à l’emploi, mais il demeure exposé aux aléas climatiques, aux pertes post-récolte, aux difficultés d’accès au marché et au financement.",
    opportunite: "Une solution améliorant la productivité, la qualité, la transformation ou l’accès au marché peut créer une valeur économique et sociale importante.",
    valeur: "La proposition devra démontrer des gains concrets pour les producteurs, les transformateurs, les acheteurs ou les communautés rurales.",
    risques: "Les risques prioritaires concernent la saisonnalité, le climat, l’approvisionnement, la qualité des produits, la logistique et la volatilité des prix."
  },
  energie: {
    contexte: "La demande énergétique progresse alors que de nombreux ménages et entreprises restent confrontés à un accès coûteux, instable ou insuffisant à l’électricité.",
    opportunite: "Les solutions énergétiques fiables, propres et adaptées aux capacités de paiement disposent d’un potentiel de croissance important.",
    valeur: "La valeur devra être démontrée par la fiabilité, les économies réalisées, la facilité d’installation et la qualité du service après-vente.",
    risques: "Les risques principaux concernent le coût des équipements, la maintenance, le financement client, les autorisations et la qualité technique."
  },
  dechets: {
    contexte: "L’urbanisation et l’augmentation de la consommation accroissent les volumes de déchets, tandis que les capacités de collecte, de tri et de valorisation restent souvent insuffisantes.",
    opportunite: "La collecte structurée, le recyclage et la valorisation des matières peuvent améliorer l’environnement tout en créant des revenus et des emplois verts.",
    valeur: "La proposition devra sécuriser les volumes, la qualité des matières, les débouchés commerciaux et la régularité des opérations.",
    risques: "Les risques prioritaires concernent l’irrégularité des volumes, la contamination des matières, la logistique, les prix de revente et les autorisations."
  },
  eau: {
    contexte: "L’accès à une eau sûre et à des services d’assainissement fiables demeure un enjeu sanitaire, environnemental et économique majeur.",
    opportunite: "Les solutions abordables de traitement, distribution, suivi ou assainissement répondent à un besoin durable des ménages, entreprises et collectivités.",
    valeur: "La confiance reposera sur la qualité de l’eau, la continuité du service, la conformité, la maintenance et la tarification.",
    risques: "Les risques principaux concernent la qualité sanitaire, les autorisations, la maintenance, les infrastructures et la capacité de paiement."
  },
  numerique: {
    contexte: "La numérisation transforme les usages et ouvre de nouveaux marchés, mais l’adoption dépend de la simplicité, de la confiance, de l’accès à internet et de la valeur réellement créée.",
    opportunite: "Une solution numérique centrée sur un problème précis peut être testée rapidement et déployée progressivement à plus grande échelle.",
    valeur: "La proposition devra démontrer un gain de temps, une réduction de coût, une amélioration de l’accès ou une meilleure qualité de décision.",
    risques: "Les risques prioritaires concernent l’adoption, la cybersécurité, la protection des données, la disponibilité technique et le coût d’acquisition client."
  },
  finance: {
    contexte: "Les entreprises et populations restent confrontées à des besoins importants de financement, de paiement, d’épargne, d’assurance et d’accompagnement financier.",
    opportunite: "Les offres financières simples, transparentes et adaptées peuvent améliorer l’inclusion et soutenir le développement des activités économiques.",
    valeur: "La crédibilité reposera sur la conformité, la sécurité, la transparence des coûts, la gestion des risques et la confiance des utilisateurs.",
    risques: "Les risques principaux concernent la réglementation, le crédit, la fraude, la liquidité, la cybersécurité et la protection des clients."
  }
};

function writerDetecterSecteur(data) {
  var texte = [
    data && data.sector,
    data && data.projectName,
    data && data.problem,
    data && data.solution
  ].join(" ").toLowerCase();

  if (/agri|agro|ferme|élevage|elevage|culture|aliment|cacao|café|cafe|riz|maïs|mais/.test(texte)) {
    return "agriculture";
  }
  if (/énergie|energie|solaire|photovolta|électric|electric|biogaz|cuisson propre/.test(texte)) {
    return "energie";
  }
  if (/déchet|dechet|recycl|plastique|circulaire|collecte|valorisation/.test(texte)) {
    return "dechets";
  }
  if (/eau|assainissement|forage|irrigation|sanitaire/.test(texte)) {
    return "eau";
  }
  if (/digital|numérique|numerique|logiciel|plateforme|application|tech|saas|data/.test(texte)) {
    return "numerique";
  }
  if (/finance|fintech|crédit|credit|assurance|paiement|investissement|banque/.test(texte)) {
    return "finance";
  }
  return "general";
}

function writerBlocSecteur(data) {
  var secteur = writerDetecterSecteur(data);
  return WRITER_LIBRARY[secteur] || WRITER_LIBRARY.general;
}

function writerContexteSecteur(data) {
  return writerBlocSecteur(data).contexte;
}

function writerOpportuniteSecteur(data) {
  return writerBlocSecteur(data).opportunite;
}

function writerValeurSecteur(data) {
  return writerBlocSecteur(data).valeur;
}

function writerRisquesSecteur(data) {
  return writerBlocSecteur(data).risques;
}

function writerIndexVariation(data, cle, longueur) {
  var source = String(
    (data && data.projectName) ||
    (data && data.promoterName) ||
    "AfriGreen24"
  ) + String(cle || "");
  var total = 0;
  for (var i = 0; i < source.length; i++) {
    total += source.charCodeAt(i) * (i + 1);
  }
  return longueur > 0 ? total % longueur : 0;
}

function writerChoisir(data, cle, options) {
  return options[writerIndexVariation(data, cle, options.length)];
}

function writerTransition(data, section) {
  return writerChoisir(data, "transition-" + section, [
    "Dans cette perspective,",
    "Pour transformer cette intention en résultats,",
    "À ce stade,",
    "Sur le plan opérationnel,",
    "Pour sécuriser la prochaine phase,"
  ]);
}

function writerConclusionParagraphe(data, section) {
  var projet = writerValeur(data && data.projectName, "Le projet");
  var conclusions = {
    presentation: projet + " devra convertir cette vision en objectifs, responsabilités et indicateurs clairement définis.",
    probleme: "La validation du problème auprès des personnes concernées constituera une condition essentielle avant tout investissement important.",
    solution: "Une phase pilote permettra de vérifier la facilité d’utilisation, la valeur perçue et les résultats réellement obtenus.",
    marche: "L’étude de marché devra confirmer la taille de la demande, les critères d’achat et les segments les plus accessibles.",
    modele: "La viabilité dépendra de la capacité à tester les prix, suivre les marges et maîtriser les coûts dès le lancement.",
    commercial: "Les actions commerciales devront être suivies par des indicateurs simples : prospects contactés, conversions, revenus et fidélisation.",
    equipe: "Une organisation légère, des responsabilités claires et un suivi régulier faciliteront la montée en puissance.",
    financement: "Le dossier de financement devra relier chaque dépense à un résultat attendu, une échéance et un indicateur de suivi.",
    impact: "La mesure régulière des résultats renforcera la crédibilité du projet auprès des clients, partenaires et financeurs.",
    risques: "La cartographie des risques devra être actualisée à mesure que le projet obtient de nouvelles données de terrain."
  };
  return conclusions[section] || "Les prochaines décisions devront être fondées sur des données vérifiables et des tests progressifs.";
}

function writerIntroProbleme(data) {
  return writerChoisir(data, "probleme", [
    "Le projet part d’un constat central :",
    "L’opportunité entrepreneuriale repose sur un problème clairement identifié :",
    "Le besoin auquel le projet souhaite répondre peut être résumé ainsi :"
  ]);
}

function writerIntroSolution(data) {
  return writerChoisir(data, "solution", [
    "Pour répondre à cette situation, le projet propose",
    "La réponse envisagée consiste à développer",
    "La solution portée par l’équipe repose sur"
  ]);
}

function writerIntroMarche(data) {
  return writerChoisir(data, "marche", [
    "L’analyse du marché doit vérifier l’existence d’une demande réelle et accessible.",
    "Le potentiel commercial dépend de la capacité à cibler les utilisateurs les plus concernés et disposés à adopter l’offre.",
    "Le marché sera abordé de manière progressive afin de transformer les hypothèses en preuves de terrain."
  ]);
}

function writerIntroModele(data) {
  return writerChoisir(data, "modele", [
    "Le modèle économique doit convertir la valeur créée en revenus durables.",
    "La viabilité financière reposera sur une offre compréhensible, un prix testé et des coûts maîtrisés.",
    "Le projet doit définir une mécanique de revenus cohérente avec les habitudes et la capacité de paiement des clients."
  ]);
}

function writerIntroFinancement(data) {
  return writerChoisir(data, "financement", [
    "Le financement recherché doit permettre d’atteindre des étapes de développement précises.",
    "La mobilisation de ressources financières doit être directement liée à un plan d’exécution mesurable.",
    "Le besoin de financement doit être présenté comme un moyen d’obtenir des résultats définis, et non comme une fin en soi."
  ]);
}

function writerIntroImpact(data) {
  return writerChoisir(data, "impact", [
    "Au-delà de sa viabilité économique, le projet vise des résultats sociaux ou environnementaux mesurables.",
    "L’impact constitue un axe de différenciation et de crédibilité pour le projet.",
    "La contribution du projet au développement durable doit être traduite en indicateurs simples et vérifiables."
  ]);
}

function writerIntroRisques(data) {
  return writerChoisir(data, "risques", [
    "Tout projet entrepreneurial comporte des incertitudes qui doivent être identifiées et suivies.",
    "La maîtrise des risques repose sur l’anticipation, les tests progressifs et la capacité d’adaptation.",
    "Les principaux risques doivent être reliés à des mesures d’atténuation, des responsables et des indicateurs d’alerte."
  ]);
}

function writerVision(data) {
  var projet = writerValeur(data && data.projectName, "Le projet");
  var pays = writerValeur(data && data.country, "son marché");
  var benefice = writerPhrase(
    data && (data.benefit || data.impact),
    "une amélioration durable pour ses clients et bénéficiaires"
  );
  return projet + " ambitionne de devenir une solution de référence en " + pays + " en produisant " + benefice + ".";
}

function writerConclusionGenerale(data) {
  var projet = writerValeur(data && data.projectName, "Le projet");
  return projet + " dispose d’une base stratégique encourageante. La prochaine étape consiste à valider les hypothèses prioritaires auprès du marché, structurer le budget, préciser les responsabilités et suivre des indicateurs simples avant d’accélérer le déploiement.";
}
