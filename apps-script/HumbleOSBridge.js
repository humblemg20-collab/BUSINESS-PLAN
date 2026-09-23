/**
 * AfriGreen24 × HumbleOS Bridge 5.0
 * Google Apps Script -> HumbleOS AI Gateway.
 */

const HUMBLEOS_AI_50 = Object.freeze({
  URL_PROPERTY: 'HUMBLEOS_GATEWAY_URL',
  SECRET_PROPERTY: 'HUMBLEOS_GATEWAY_SECRET',
  TIMEOUT_NOTE: 'UrlFetchApp ne permet pas de régler explicitement le timeout ; le gateway doit répondre rapidement.',

  /*
   * Business Plan Standard — politique fail-fast.
   *
   * HumbleOS reste optionnel pour la rédaction :
   * Astrid doit pouvoir continuer avec son fallback si un job
   * reste trop longtemps en PROCESSING.
   */
  STANDARD_JOB_TIMEOUT_SECONDS: 45,
  STANDARD_JOB_POLL_INTERVAL_MS: 3000,
  STANDARD_JOB_MAX_TRANSIT_ERRORS: 3
});

function configurerHumbleOSAfriGreen24() {
  const url =
    'https://humbleos-afrigreen24.humblemg2-0.workers.dev';

  const secret =
    'Hmichel1s@';

  PropertiesService
    .getScriptProperties()
    .setProperties({
      [HUMBLEOS_AI_50.URL_PROPERTY]:
        url.replace(/\/+$/, ''),

      [HUMBLEOS_AI_50.SECRET_PROPERTY]:
        secret
    }, false);

  Logger.log(
    'HumbleOS configuré : ' +
    url.replace(/\/+$/, '')
  );

  Logger.log(
    'Secret HumbleOS enregistré dans Script Properties.'
  );
}

/**
 * Déclenche l'autorisation OAuth requise pour les appels UrlFetchApp.
 * À exécuter une seule fois manuellement depuis l'éditeur Apps Script.
 */
function autoriserUrlFetchApp() {
  const response = UrlFetchApp.fetch('https://www.google.com/generate_204', {
    method: 'get',
    muteHttpExceptions: true
  });

  return {
    succes: true,
    codeHttp: response.getResponseCode()
  };
}

function obtenirConfigurationHumbleOS_() {
  var props =
    PropertiesService
      .getScriptProperties();

  var url = String(
    props.getProperty(
      HUMBLEOS_AI_50.URL_PROPERTY
    ) || ""
  ).trim();

  var secret = String(
    props.getProperty(
      HUMBLEOS_AI_50.SECRET_PROPERTY
    ) || ""
  ).trim();

  if (!url) {
    throw new Error(
      "URL HumbleOS non configurée."
    );
  }

  if (!secret) {
    throw new Error(
      "Secret HumbleOS non configuré."
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    secret: secret
  };
}

function appelerHumbleOS_(endpoint, method, payload) {
  const cfg = obtenirConfigurationHumbleOS_();
  const options = {
    method: method || 'get',
    muteHttpExceptions: true,
    headers: {
      'Authorization': 'Bearer ' + cfg.secret,
      'X-AfriGreen-Source': 'GoogleAppsScript'
    }
  };

  if (payload !== undefined && payload !== null) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(cfg.url + endpoint, options);
  const code = response.getResponseCode();
  const text = response.getContentText();
  let json;

  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error('Réponse HumbleOS non JSON (' + code + ') : ' + text.slice(0, 500));
  }

  if (code < 200 || code >= 300 || json.success !== true) {
    throw new Error('HumbleOS (' + code + ') : ' + (json.error || text));
  }

  return json;
}

function verifierConnexionHumbleOS() {
  const result = appelerHumbleOS_('/health', 'get');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function redigerSectionBusinessPlanAvecHumbleOS(section, rawData, calculatedData, instructions) {
  const result = appelerHumbleOS_('/generate-section', 'post', {
    section: section,
    rawData: rawData || {},
    calculatedData: calculatedData || {},
    instructions: instructions || ''
  });
  return String(result.content || '').trim();
}

function testerRedactionBusinessPlanAvecHumbleOS() {
  const texte = redigerSectionBusinessPlanAvecHumbleOS(
    'Problème, solution et proposition de valeur',
    {
      probleme: 'beaucoup de mangues se perdent apres recolte et producteurs vendent moins cher',
      solution: 'on transforme en mangue sechee et on vend aux boutiques et hotels',
      clients: 'supermarches hotels restaurants',
      avantage: 'achat local et controle qualite'
    },
    {},
    'Rédige deux paragraphes courts, naturels et professionnels.'
  );

  Logger.log('=== TEXTE HUMBLEOS ===');
  Logger.log(texte);
  return texte;
}

/**
 * Génère en un seul appel les blocs rédactionnels professionnels
 * utilisés par le Business Plan Bancable.
 */
function genererNarratifBusinessPlanAvecHumbleOS(rawData, calculatedData, instructions) {
  const result = appelerHumbleOS_('/generate-bundle', 'post', {
    rawData: rawData || {},
    calculatedData: calculatedData || {},
    instructions: instructions || ''
  });

  if (!result.content || typeof result.content !== 'object') {
    throw new Error('HumbleOS n’a pas retourné un narratif exploitable.');
  }

  return result.content;
}

function testerNarratifBusinessPlanAvecHumbleOS() {
  const narratif = genererNarratifBusinessPlanAvecHumbleOS(
    {
      nomProjet: 'Unité de transformation de mangues',
      nomPromoteur: 'Awa Diallo',
      descriptionProjet: 'on transforme les mangues locales qui se perdent apres recolte',
      problemeResolu: 'pertes apres recolte et faible prix payé aux producteurs',
      solution: 'mangues séchées vendues aux boutiques hôtels et distributeurs',
      clientsCibles: 'supermarchés hôtels restaurants distributeurs',
      avantageConcurrentiel: 'achat local, traçabilité et contrôle qualité',
      sourcesRevenus: 'vente de mangues séchées',
      strategieCommerciale: 'prospection b2b, distributeurs et réseaux sociaux',
      risques: [
        { risque: 'approvisionnement saisonnier', mesure: 'diversifier les producteurs' }
      ]
    },
    {
      devise: 'XOF',
      financementRecherche: 20000000,
      apportPromoteur: 8000000,
      chiffreAffairesAnnuel: 80880000,
      margeBruteMensuelle: 3775000,
      couvertureMensuelle: 3.59
    },
    'Rédaction sobre, professionnelle et orientée financeur. Ne transforme aucune hypothèse en fait certain.'
  );

  Logger.log(JSON.stringify(narratif, null, 2));
  return narratif;
}


/**
 * ============================================================
 * BUSINESS PLAN STANDARD — HUMBLEOS 5.2
 * ============================================================
 */

function normaliserDonneesBusinessPlanStandardAvecHumbleOS(rawData) {
  const result = appelerHumbleOS_('/normalize-standard', 'post', {
    rawData: rawData || {}
  });

  if (!result.content || typeof result.content !== 'object') {
    throw new Error('HumbleOS n’a pas retourné de données Standard normalisées.');
  }

  return result.content;
}

function genererNarratifStandardAvecHumbleOS(rawData, instructions) {
  const result = appelerHumbleOS_('/generate-standard-bundle', 'post', {
    rawData: rawData || {},
    instructions: instructions || ''
  });

  if (!result.content || typeof result.content !== 'object') {
    throw new Error('HumbleOS n’a pas retourné de narratif Standard exploitable.');
  }

  return result.content;
}

function testerBusinessPlanStandardAvecHumbleOS() {
  const brut = {
    projectName: 'humble OS',
    promoterName: 'humble mg',
    country: 'CAMEROUN',
    sector: 'Technologie',
    stage: 'J’ai déjà un prototype',
    problem: 'ON VOULAIS INTEGRER UNE IA SANS RIEN DEPENSER NOUS AVONS PENSER A UTILISER HUMBLE OS',
    affectedPeople: 'AFRIGREEN24',
    urgency: 'PARCE QUE SI IL NE LANCE PAS SON PROJET IL NE VAS PAS OBTENIR DE financement',
    solution: 'NOUS AIDONS LES ENTREPRENEURS A INTEGRER L IA DANS LEUR PROJET A MOINDRE COUT',
    valueProposition: 'J AI MA PROPRE IA',
    benefit: 'GAIN DE TEPS DAGENT ET DE RESSOURCE',
    targetCustomers: 'LES STARTUP ET ENTREPRENEURS',
    marketArea: 'AFRIQUE',
    salesChannels: 'LINKEDIN',
    competitors: 'DES NIGERIANS ET AUSSI DES FRANCAIS',
    revenueModel: 'EN VENDANT CETTE MAGNIFIQUE SOLUTION AUX PLUS OFFRANTS',
    pricing: '5000',
    mainCosts: 'API ET AUTRE APPLICATIONS COMME ABBONEMEN CLAUDE',
    team: 'MON CTO',
    fundingType: 'Investissement',
    fundingNeed: '10 000',
    useOfFunds: 'UNE ECRAN ET PLUS DE MATERIELS POUR LA CREATION DE MES AGENTS IA',
    impact: 'LA FACILITER D INTEGRATION DE L IA DANS N IMPORTE QUEL PROJET',
    risks: 'LE FAIT DE NE PAS REUSSIR A HEBERGER MON IA SUR GOOGLE'
  };

  const propre = normaliserDonneesBusinessPlanStandardAvecHumbleOS(brut);
  const narratif = genererNarratifStandardAvecHumbleOS(
    propre,
    'Rédaction sobre, concrète, sans répétitions et sans invention.'
  );

  Logger.log('=== DONNEES NORMALISEES ===');
  Logger.log(JSON.stringify(propre, null, 2));
  Logger.log('=== NARRATIF STANDARD ===');
  Logger.log(JSON.stringify(narratif, null, 2));

  return { propre: propre, narratif: narratif };
}


/**
 * ============================================================
 * BUSINESS PLAN STANDARD — HUMBLEOS 5.3 — APPEL UNIQUE
 * ============================================================
 */
function genererBusinessPlanStandardCompletAvecHumbleOS(rawData, instructions) {
  const result = appelerHumbleOS_('/generate-standard-full', 'post', {
    rawData: rawData || {},
    instructions: instructions || ''
  });

  if (
    !result.content ||
    typeof result.content !== 'object' ||
    !result.content.normalizedData ||
    !result.content.narrative
  ) {
    throw new Error(
      'HumbleOS n’a pas retourné le Business Plan Standard complet attendu.'
    );
  }

  return {
    donnees: result.content.normalizedData,
    narratif: result.content.narrative,
    model: result.model || '',
    durationSeconds: result.durationSeconds || 0
  };
}

function testerBusinessPlanStandardOptimiseAvecHumbleOS() {
  const brut = {
    projectName: 'humble OS',
    promoterName: 'humble mg',
    country: 'CAMEROUN',
    sector: 'Technologie',
    stage: 'J’ai déjà un prototype',
    problem: 'ON VOULAIS INTEGRER UNE IA SANS RIEN DEPENSER NOUS AVONS PENSER A UTILISER HUMBLE OS',
    affectedPeople: 'AFRIGREEN24',
    urgency: 'PARCE QUE SI IL NE LANCE PAS SON PROJET IL NE VAS PAS OBTENIR DE financement',
    solution: 'NOUS AIDONS LES ENTREPRENEURS A INTEGRER L IA DANS LEUR PROJET A MOINDRE COUT',
    valueProposition: 'J AI MA PROPRE IA',
    benefit: 'GAIN DE TEPS DAGENT ET DE RESSOURCE',
    targetCustomers: 'LES STARTUP ET ENTREPRENEURS',
    marketArea: 'AFRIQUE',
    salesChannels: 'LINKEDIN',
    competitors: 'DES NIGERIANS ET AUSSI DES FRANCAIS',
    revenueModel: 'EN VENDANT CETTE MAGNIFIQUE SOLUTION AUX PLUS OFFRANTS',
    pricing: '5000',
    mainCosts: 'API ET AUTRE APPLICATIONS COMME ABBONEMEN CLAUDE',
    team: 'MON CTO',
    fundingType: 'Investissement',
    fundingNeed: '10 000',
    useOfFunds: 'UNE ECRAN ET PLUS DE MATERIELS POUR LA CREATION DE MES AGENTS IA',
    impact: 'LA FACILITER D INTEGRATION DE L IA DANS N IMPORTE QUEL PROJET',
    risks: 'LE FAIT DE NE PAS REUSSIR A HEBERGER MON IA SUR GOOGLE'
  };

  const resultat = genererBusinessPlanStandardCompletAvecHumbleOS(
    brut,
    'Rédaction sobre, concrète, professionnelle, sans répétitions ni invention.'
  );

  Logger.log('=== HUMBLEOS 5.3 — APPEL UNIQUE ===');
  Logger.log('Durée IA : ' + resultat.durationSeconds + ' s');
  Logger.log(JSON.stringify(resultat, null, 2));

  return resultat;
}


/**
 * ============================================================
 * BUSINESS PLAN STANDARD — HUMBLEOS 5.4 — ANTI-TIMEOUT
 * Deux appels courts au lieu d'un gros appel.
 * ============================================================
 */
function genererBusinessPlanStandardPartieAvecHumbleOS(
  rawData,
  part,
  instructions
) {
  const result = appelerHumbleOS_('/generate-standard-part', 'post', {
    rawData: rawData || {},
    part: Number(part),
    instructions: instructions || ''
  });

  if (
    !result.content ||
    typeof result.content !== 'object' ||
    !result.content.normalizedData ||
    !result.content.narrative
  ) {
    throw new Error(
      'HumbleOS n’a pas retourné la partie Standard attendue.'
    );
  }

  return {
    donnees: result.content.normalizedData,
    narratif: result.content.narrative,
    model: result.model || '',
    durationSeconds: result.durationSeconds || 0,
    part: Number(part)
  };
}

function testerBusinessPlanStandardAntiTimeoutAvecHumbleOS() {
  const brut = {
    projectName: 'humble OS',
    promoterName: 'humble mg',
    country: 'CAMEROUN',
    sector: 'Technologie',
    stage: 'J’ai déjà un prototype',
    problem: 'ON VOULAIS INTEGRER UNE IA SANS RIEN DEPENSER NOUS AVONS PENSER A UTILISER HUMBLE OS',
    affectedPeople: 'AFRIGREEN24',
    urgency: 'PARCE QUE SI IL NE LANCE PAS SON PROJET IL NE VAS PAS OBTENIR DE financement',
    solution: 'NOUS AIDONS LES ENTREPRENEURS A INTEGRER L IA DANS LEUR PROJET A MOINDRE COUT',
    valueProposition: 'J AI MA PROPRE IA',
    benefit: 'GAIN DE TEPS DAGENT ET DE RESSOURCE',
    targetCustomers: 'LES STARTUP ET ENTREPRENEURS',
    marketArea: 'AFRIQUE',
    salesChannels: 'LINKEDIN',
    competitors: 'DES NIGERIANS ET AUSSI DES FRANCAIS',
    revenueModel: 'EN VENDANT CETTE MAGNIFIQUE SOLUTION AUX PLUS OFFRANTS',
    pricing: '5000',
    mainCosts: 'API ET AUTRE APPLICATIONS COMME ABBONEMEN CLAUDE',
    team: 'MON CTO',
    fundingType: 'Investissement',
    fundingNeed: '10 000',
    useOfFunds: 'UNE ECRAN ET PLUS DE MATERIELS POUR LA CREATION DE MES AGENTS IA',
    impact: 'LA FACILITER D INTEGRATION DE L IA DANS N IMPORTE QUEL PROJET',
    risks: 'LE FAIT DE NE PAS REUSSIR A HEBERGER MON IA SUR GOOGLE'
  };

  const p1 = genererBusinessPlanStandardPartieAvecHumbleOS(
    brut,
    1,
    'Rédaction professionnelle, sans répétition ni invention.'
  );

  Logger.log('Partie 1 terminée en ' + p1.durationSeconds + ' s');

  const p2 = genererBusinessPlanStandardPartieAvecHumbleOS(
    p1.donnees || brut,
    2,
    'Rédaction professionnelle, sans répétition ni invention.'
  );

  Logger.log('Partie 2 terminée en ' + p2.durationSeconds + ' s');

  const resultat = {
    donnees: p2.donnees || p1.donnees || brut,
    narratif: Object.assign({}, p1.narratif || {}, p2.narratif || {}),
    durationSeconds:
      Number(p1.durationSeconds || 0) +
      Number(p2.durationSeconds || 0)
  };

  Logger.log(JSON.stringify(resultat, null, 2));
  return resultat;
}


/**
 * ============================================================
 * BUSINESS PLAN STANDARD — HUMBLEOS 5.7 — ASYNCHRONE
 * ============================================================
 *
 * Cloudflare ne garde plus une connexion ouverte pendant
 * la génération. Le Gateway répond immédiatement avec un jobId,
 * puis Apps Script interroge son statut pendant une fenêtre courte.
 *
 * Si le job reste trop longtemps en PROCESSING, l'appel échoue
 * rapidement et le moteur DATA SAFE + FAIL SAFE laisse Astrid
 * poursuivre la génération du document avec son fallback local.
 */

function demarrerJobStandardHumbleOS57_(
  rawData,
  part,
  instructions
) {
  var result = appelerHumbleOS_(
    '/start-standard-part',
    'post',
    {
      rawData: rawData || {},
      part: Number(part),
      instructions: instructions || ''
    }
  );

  if (!result.jobId) {
    throw new Error(
      'HumbleOS n’a pas retourné de jobId.'
    );
  }

  return result;
}


function obtenirStatutJobStandardHumbleOS57_(
  jobId
) {
  return appelerHumbleOS_(
    '/standard-job?id=' +
      encodeURIComponent(jobId),
    'get'
  );
}


function attendreJobStandardHumbleOS57_(
  jobId,
  timeoutSeconds
) {
  var timeout = Number(
    timeoutSeconds ||
    HUMBLEOS_AI_50.STANDARD_JOB_TIMEOUT_SECONDS
  );

  var intervallePolling =
    Number(
      HUMBLEOS_AI_50.STANDARD_JOB_POLL_INTERVAL_MS ||
      3000
    );

  var maxErreursTransit =
    Number(
      HUMBLEOS_AI_50.STANDARD_JOB_MAX_TRANSIT_ERRORS ||
      3
    );

  var debut = Date.now();
  var dernierStatut = '';
  var erreursTransit = 0;

  while (
    (Date.now() - debut) <
    timeout * 1000
  ) {
    var etat;

    /*
     * Seules les erreurs de lecture/polling sont considérées
     * comme transitoires.
     *
     * Les statuts FAILED ou COMPLETED invalides sont traités
     * immédiatement comme des erreurs définitives.
     */
    try {
      etat =
        obtenirStatutJobStandardHumbleOS57_(
          jobId
        );

      erreursTransit = 0;

    } catch (erreurPolling) {
      erreursTransit++;

      Logger.log(
        'Polling HumbleOS temporairement indisponible (' +
        erreursTransit +
        '/' +
        maxErreursTransit +
        ') : ' +
        (
          erreurPolling &&
          erreurPolling.message
            ? erreurPolling.message
            : String(erreurPolling)
        )
      );

      if (
        erreursTransit >=
        maxErreursTransit
      ) {
        throw erreurPolling;
      }

      Utilities.sleep(
        intervallePolling
      );

      continue;
    }

    dernierStatut =
      String(
        etat.status || ''
      ).toUpperCase();

    if (
      dernierStatut ===
      'COMPLETED'
    ) {
      if (
        !etat.result ||
        !etat.result.content
      ) {
        throw new Error(
          'Job HumbleOS terminé sans résultat exploitable.'
        );
      }

      return etat.result;
    }

    if (
      dernierStatut ===
      'FAILED'
    ) {
      throw new Error(
        'Job HumbleOS échoué : ' +
        (
          etat.error ||
          'Erreur inconnue'
        )
      );
    }

    Utilities.sleep(
      intervallePolling
    );
  }

  /*
   * Pas de retry automatique.
   *
   * Cette erreur est capturée par le moteur DATA SAFE + FAIL SAFE.
   * Astrid poursuit alors la génération avec son texte source.
   */
  throw new Error(
    'HumbleOS dépasse le délai maximal de ' +
    timeout +
    ' secondes pour le job ' +
    jobId +
    '. Dernier statut : ' +
    (
      dernierStatut ||
      'INCONNU'
    )
  );
}


function genererBusinessPlanStandardPartieAsyncAvecHumbleOS(
  rawData,
  part,
  instructions
) {
  var job =
    demarrerJobStandardHumbleOS57_(
      rawData,
      part,
      instructions
    );

  Logger.log(
    'HumbleOS partie ' +
    part +
    ' démarrée : ' +
    job.jobId
  );

  var result =
    attendreJobStandardHumbleOS57_(
      job.jobId,
      HUMBLEOS_AI_50.STANDARD_JOB_TIMEOUT_SECONDS
    );

  if (
    !result.content ||
    typeof result.content !== 'object' ||
    !result.content.normalizedData ||
    !result.content.narrative
  ) {
    throw new Error(
      'HumbleOS n’a pas retourné la partie Standard attendue.'
    );
  }

  Logger.log(
    'HumbleOS partie ' +
    part +
    ' terminée en ' +
    Number(
      result.durationSeconds || 0
    ) +
    ' s'
  );

  return {
    donnees:
      result.content.normalizedData,
    narratif:
      result.content.narrative,
    model:
      result.model || '',
    durationSeconds:
      result.durationSeconds || 0,
    part:
      Number(part),
    jobId:
      job.jobId
  };
}


function testerBusinessPlanStandardAsyncAvecHumbleOS() {
  var brut = {
    projectName: 'GreenStep Shoes',
    promoterName: 'Client Test',
    email: 'test@example.com',
    country: 'CAMEROUN',
    sector: 'Commerce',
    stage: 'Prototype',
    problem:
      'Une partie de la population a difficilement accès à des chaussures abordables.',
    affectedPeople:
      'Les ménages à revenus modestes et la classe moyenne.',
    urgency:
      'Le coût élevé des chaussures limite l’accès à des produits adaptés.',
    solution:
      'Commercialiser des chaussures de qualité à prix accessible.',
    valueProposition:
      'Une offre adaptée au pouvoir d’achat local.',
    benefit:
      'Améliorer l’accès à des chaussures de qualité.',
    targetCustomers:
      'Classe moyenne, jeunes actifs et ménages à revenus modestes.',
    marketArea:
      'Cameroun avec extension progressive dans d’autres marchés africains.',
    competitors:
      'Boutiques de chaussures existantes et vendeurs en ligne.',
    revenueModel:
      'Vente directe de chaussures aux particuliers.',
    pricing:
      '10 000 FCFA en moyenne par paire.',
    mainCosts:
      'Achat du stock, logistique, communication et maintenance du site web.',
    salesChannels:
      'Site web, réseaux sociaux et vente directe.',
    team:
      'Un promoteur, un responsable technique et des partenaires commerciaux.',
    fundingType:
      'Prêt bancaire',
    fundingNeed:
      '10 000 000 FCFA',
    useOfFunds:
      'Augmentation du stock, finalisation du site web et lancement commercial.',
    impact:
      'Améliorer l’accès à des chaussures abordables et créer des emplois.',
    risks:
      'Concurrence, disponibilité du stock et pression sur la trésorerie.'
  };

  var p1 =
    genererBusinessPlanStandardPartieAsyncAvecHumbleOS(
      brut,
      1,
      'Rédaction professionnelle, sans répétition ni invention.'
    );

  var p2 =
    genererBusinessPlanStandardPartieAsyncAvecHumbleOS(
      p1.donnees || brut,
      2,
      'Rédaction professionnelle, sans répétition ni invention.'
    );

  var resultat = {
    donnees:
      p2.donnees ||
      p1.donnees ||
      brut,
    narratif:
      Object.assign(
        {},
        p1.narratif || {},
        p2.narratif || {}
      ),
    durationSeconds:
      Number(
        p1.durationSeconds || 0
      ) +
      Number(
        p2.durationSeconds || 0
      ),
    jobs: [
      p1.jobId,
      p2.jobId
    ]
  };

  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}
function TEST_BP_GENERATION_ROUTE_INTERNE() {
  var brut = {
    projectName: "TEST ROUTE HUMBLEOS",
    promoterName: "Michel Test",
    country: "Côte d'Ivoire",
    sector: "Transport / Mobilité",
    stage: "Je prépare le lancement",

    problem: "la réduction de la pauvreté",
    affectedPeople: "la population",
    urgency: "la concurrence augmente",

    solution: "nourrir les plus souffrants",
    valueProposition: "aider réellement les personnes âgées",
    benefit: "améliorer les conditions de vie",

    targetCustomers: "organisations et PME",
    marketArea: "Régionale",
    salesChannels: "LinkedIn",
    competitors: "plusieurs ONG",

    revenueModel: "vente d'expertise",
    pricing: "1000 FCFA",
    mainCosts: "carburant et maintenance",
    team: "deux chauffeurs",

    fundingType: "Subvention",
    fundingNeed: "1 000 000 FCFA",
    useOfFunds: "achat de matériel",

    impact: "sensibilisation des personnes aisées à la situation des plus pauvres",
    risks: "Risque ESG faible"
  };

  Logger.log("========================================");
  Logger.log("TEST ROUTE GENERATION BUSINESS PLAN");
  Logger.log("========================================");

  Logger.log("1. Test /generate-standard-full");

  try {
    var full =
      genererBusinessPlanStandardCompletAvecHumbleOS(
        brut,
        "Rédaction strictement descriptive. Aucun conseil, aucune recommandation, aucune prochaine étape."
      );

    Logger.log("FULL OK");
    Logger.log(
      JSON.stringify(
        full,
        null,
        2
      )
    );

    var texteFull =
      JSON.stringify(
        full.narratif || {}
      ).toLowerCase();

    Logger.log(
      "FULL CONTIENT 'devra' : " +
      (
        texteFull.indexOf("devra") !== -1
      )
    );

    Logger.log(
      "FULL CONTIENT 'tester' : " +
      (
        texteFull.indexOf("tester") !== -1
      )
    );

    Logger.log(
      "FULL CONTIENT 'il faut' : " +
      (
        texteFull.indexOf("il faut") !== -1
      )
    );

    Logger.log(
      "FULL CONTIENT 'recommand' : " +
      (
        texteFull.indexOf("recommand") !== -1
      )
    );

  } catch (errorFull) {

    Logger.log(
      "FULL ERREUR : " +
      (
        errorFull &&
        errorFull.message
          ? errorFull.message
          : String(errorFull)
      )
    );
  }

  Logger.log("----------------------------------------");
  Logger.log("2. Test /generate-standard-bundle");

  try {
    var bundle =
      genererNarratifStandardAvecHumbleOS(
        brut,
        "Rédaction strictement descriptive. Aucun conseil, aucune recommandation, aucune prochaine étape."
      );

    Logger.log("BUNDLE OK");
    Logger.log(
      JSON.stringify(
        bundle,
        null,
        2
      )
    );

    var texteBundle =
      JSON.stringify(
        bundle || {}
      ).toLowerCase();

    Logger.log(
      "BUNDLE CONTIENT 'devra' : " +
      (
        texteBundle.indexOf("devra") !== -1
      )
    );

    Logger.log(
      "BUNDLE CONTIENT 'tester' : " +
      (
        texteBundle.indexOf("tester") !== -1
      )
    );

    Logger.log(
      "BUNDLE CONTIENT 'il faut' : " +
      (
        texteBundle.indexOf("il faut") !== -1
      )
    );

    Logger.log(
      "BUNDLE CONTIENT 'recommand' : " +
      (
        texteBundle.indexOf("recommand") !== -1
      )
    );

  } catch (errorBundle) {

    Logger.log(
      "BUNDLE ERREUR : " +
      (
        errorBundle &&
        errorBundle.message
          ? errorBundle.message
          : String(errorBundle)
      )
    );
  }

  Logger.log("========================================");
  Logger.log("FIN TEST");
  Logger.log("========================================");
}
