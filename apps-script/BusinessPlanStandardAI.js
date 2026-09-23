/**
 * ============================================================
 * BUSINESS PLAN STANDARD AI ENGINE 5.2 — DATA SAFE + FAIL SAFE
 * ============================================================
 *
 * PRINCIPES VERROUILLÉS
 *
 * 1. Les réponses du client restent la source de vérité factuelle.
 * 2. HumbleOS ne fait que reformuler/rédiger le narratif.
 * 3. Les données renvoyées par HumbleOS ne remplacent jamais
 *    les réponses originales.
 * 4. Une panne ou un timeout HumbleOS ne doit JAMAIS empêcher
 *    la génération du Google Docs et du PDF.
 * 5. Aucun retry automatique.
 * 6. Si la partie 1 échoue, la partie 2 n'est pas lancée :
 *    Astrid utilise immédiatement ses textes de fallback.
 */

var AG24_STANDARD_AI_52_CACHE = null;


/**
 * ============================================================
 * FONCTION PRINCIPALE
 * ============================================================
 */
function preparerBusinessPlanStandardIA52(data) {
  data = data || {};

  var donneesOriginales =
    clonerDonneesStandardIA52_(data);

  var instructions = [
    "Rédige comme un consultant senior.",
    "Évite le ton robotique et les phrases génériques.",
    "Ne recopie pas les réponses mot pour mot.",
    "Ne transforme aucune hypothèse en fait.",
    "Ne crée aucun chiffre ni aucune preuve absente.",
    "N'attribue aucune qualité non démontrée au projet ou à l'équipe."
  ].join(" ");

  var erreursHumbleOS = [];
  var partie1 = {};
  var partie2 = {};

  /*
   * ------------------------------------------------------------
   * PARTIE 1
   * ------------------------------------------------------------
   *
   * Une seule tentative.
   * Si timeout/erreur : on ne bloque pas le document et on ne lance
   * pas la partie 2 afin d'éviter un second timeout inutile.
   */
  var resultatPartie1 =
    executerPartieStandardHumbleOSSafe_(
      donneesOriginales,
      1,
      instructions
    );

  if (resultatPartie1.success === true) {
    partie1 =
      resultatPartie1.resultat || {};
  } else {
    erreursHumbleOS.push(
      resultatPartie1.error || "Erreur HumbleOS partie 1."
    );
  }

  /*
   * ------------------------------------------------------------
   * PARTIE 2
   * ------------------------------------------------------------
   *
   * Elle n'est lancée que si la partie 1 a réussi.
   * Toujours à partir des données originales.
   */
  if (resultatPartie1.success === true) {
    var resultatPartie2 =
      executerPartieStandardHumbleOSSafe_(
        donneesOriginales,
        2,
        instructions
      );

    if (resultatPartie2.success === true) {
      partie2 =
        resultatPartie2.resultat || {};
    } else {
      erreursHumbleOS.push(
        resultatPartie2.error || "Erreur HumbleOS partie 2."
      );
    }
  } else {
    console.warn(
      "Business Plan Standard — partie 2 HumbleOS ignorée après échec de la partie 1."
    );
  }

  /*
   * Fusion uniquement des narratifs réellement disponibles.
   * Si aucun narratif n'est disponible, le générateur utilisera
   * automatiquement les fallback locaux via
   * obtenirNarratifStandardIA52_().
   */
  var narratifFinal =
    Object.assign(
      {},
      partie1.narratif || {},
      partie2.narratif || {}
    );

  AG24_STANDARD_AI_52_CACHE = {
    /*
     * SOURCE DE VÉRITÉ :
     * données originales uniquement.
     */
    donnees:
      clonerDonneesStandardIA52_(
        donneesOriginales
      ),

    narratif:
      narratifFinal,

    generatedAt:
      new Date().toISOString(),

    model:
      partie2.model ||
      partie1.model ||
      "",

    durationSeconds:
      Number(
        partie1.durationSeconds || 0
      ) +
      Number(
        partie2.durationSeconds || 0
      ),

    asyncJobs: [
      partie1.jobId || "",
      partie2.jobId || ""
    ].filter(function(jobId) {
      return !!jobId;
    }),

    humbleOS: {
      success:
        erreursHumbleOS.length === 0,

      partial:
        erreursHumbleOS.length > 0 &&
        Object.keys(narratifFinal).length > 0,

      fallbackUsed:
        erreursHumbleOS.length > 0,

      errors:
        erreursHumbleOS
    }
  };

  journaliserPreservationDonneesStandardIA52_(
    donneesOriginales,
    AG24_STANDARD_AI_52_CACHE.donnees
  );

  console.log(
    JSON.stringify({
      event:
        "standard_ai_humbleos_summary",

      success:
        AG24_STANDARD_AI_52_CACHE.humbleOS.success,

      partial:
        AG24_STANDARD_AI_52_CACHE.humbleOS.partial,

      fallback_used:
        AG24_STANDARD_AI_52_CACHE.humbleOS.fallbackUsed,

      narrative_blocks:
        Object.keys(narratifFinal).length,

      errors:
        erreursHumbleOS
    })
  );

  return AG24_STANDARD_AI_52_CACHE;
}


/**
 * ============================================================
 * APPEL HUMBLEOS SÉCURISÉ
 * ============================================================
 *
 * IMPORTANT :
 * - cette fonction ne fait aucun retry ;
 * - elle capture toute erreur/timeout du helper existant ;
 * - elle retourne toujours un objet exploitable par Astrid.
 */
function executerPartieStandardHumbleOSSafe_(
  donnees,
  partie,
  instructions
) {
  try {
    var resultat =
      genererBusinessPlanStandardPartieAsyncAvecHumbleOS(
        clonerDonneesStandardIA52_(donnees),
        partie,
        instructions
      );

    return {
      success: true,
      resultat:
        resultat || {}
    };

  } catch (erreur) {
    var message =
      erreur && erreur.message
        ? erreur.message
        : String(erreur);

    console.warn(
      "Business Plan Standard — HumbleOS partie " +
      partie +
      " indisponible. Fallback Astrid conservé. " +
      message
    );

    return {
      success: false,
      resultat: {},
      error:
        "PARTIE_" +
        partie +
        " : " +
        message
    };
  }
}


/**
 * ============================================================
 * NARRATIF
 * ============================================================
 *
 * Si HumbleOS n'a pas produit le bloc demandé,
 * on garde le texte fallback construit par Astrid.
 */
function obtenirNarratifStandardIA52_(
  cle,
  fallback
) {
  var narratif =
    AG24_STANDARD_AI_52_CACHE &&
    AG24_STANDARD_AI_52_CACHE.narratif
      ? AG24_STANDARD_AI_52_CACHE.narratif
      : {};

  var texte =
    String(
      narratif[cle] || ""
    ).trim();

  return texte ||
    String(
      fallback || ""
    ).trim();
}


/**
 * ============================================================
 * DONNÉES FACTUELLES
 * ============================================================
 *
 * Retourne TOUJOURS les données originales fournies par Astrid.
 */
function obtenirDonneesStandardIA52_(
  dataOriginales
) {
  if (
    dataOriginales &&
    typeof dataOriginales === "object"
  ) {
    return dataOriginales;
  }

  if (
    AG24_STANDARD_AI_52_CACHE &&
    AG24_STANDARD_AI_52_CACHE.donnees
  ) {
    return AG24_STANDARD_AI_52_CACHE.donnees;
  }

  return {};
}


/**
 * ============================================================
 * CACHE
 * ============================================================
 */
function reinitialiserBusinessPlanStandardIA52_() {
  AG24_STANDARD_AI_52_CACHE = null;
}


/**
 * Clone déterministe des données JSON du questionnaire.
 */
function clonerDonneesStandardIA52_(objet) {
  if (
    objet === null ||
    objet === undefined
  ) {
    return {};
  }

  return JSON.parse(
    JSON.stringify(objet)
  );
}


/**
 * ============================================================
 * CONTRÔLE DE PRÉSERVATION DES DONNÉES
 * ============================================================
 */
function journaliserPreservationDonneesStandardIA52_(
  originales,
  conservees
) {
  originales = originales || {};
  conservees = conservees || {};

  var champsPerdus = [];
  var champsModifies = [];

  Object.keys(originales).forEach(
    function(cle) {
      if (
        cle === "logoUpload" ||
        cle === "organizationSlogan" ||
        cle === "projectSlogan"
      ) {
        return;
      }

      var original =
        originales[cle];

      var conserve =
        conservees[cle];

      var originalRenseigne =
        original !== null &&
        original !== undefined &&
        String(original).trim() !== "";

      if (!originalRenseigne) {
        return;
      }

      if (
        conserve === null ||
        conserve === undefined ||
        String(conserve).trim() === ""
      ) {
        champsPerdus.push(cle);
        return;
      }

      if (
        JSON.stringify(original) !==
        JSON.stringify(conserve)
      ) {
        champsModifies.push(cle);
      }
    }
  );

  console.log(
    JSON.stringify({
      event:
        "standard_ai_data_preservation",

      source_fields:
        Object.keys(originales).length,

      lost_fields_count:
        champsPerdus.length,

      modified_fields_count:
        champsModifies.length,

      lost_fields:
        champsPerdus,

      modified_fields:
        champsModifies
    })
  );
}


/**
 * ============================================================
 * MICRO-TEST LOCAL — PRÉSERVATION DES DONNÉES
 * ============================================================
 *
 * Aucun appel HumbleOS.
 */
function TEST_STANDARD_AI_52_PRESERVATION_LOCALE() {
  var source = {
    projectName:
      "GreenStep Shoes",

    affectedPeople:
      "Les jeunes actifs et les ménages à revenus modestes.",

    valueProposition:
      "Des chaussures accessibles adaptées au pouvoir d'achat local.",

    targetCustomers:
      "Classe moyenne, jeunes actifs et ménages à revenus modestes.",

    competitors:
      "Boutiques existantes et vendeurs en ligne.",

    revenueModel:
      "Vente directe de chaussures aux particuliers.",

    team:
      "Un promoteur, un responsable commercial et un responsable logistique.",

    useOfFunds:
      "Stock, site web, logistique et lancement commercial.",

    impact:
      "Améliorer l'accès à des chaussures abordables et créer des emplois.",

    risks:
      "Concurrence, disponibilité du stock et pression sur la trésorerie."
  };

  AG24_STANDARD_AI_52_CACHE = {
    donnees:
      clonerDonneesStandardIA52_(source),

    narratif: {
      resumeExecutif:
        "Narratif de test."
    }
  };

  var donneesUtilisees =
    obtenirDonneesStandardIA52_(source);

  var champs =
    Object.keys(source);

  var erreurs = [];

  champs.forEach(function(cle) {
    if (
      JSON.stringify(
        donneesUtilisees[cle]
      ) !==
      JSON.stringify(
        source[cle]
      )
    ) {
      erreurs.push(cle);
    }
  });

  reinitialiserBusinessPlanStandardIA52_();

  if (erreurs.length > 0) {
    throw new Error(
      "Données factuelles altérées : " +
      erreurs.join(", ")
    );
  }

  Logger.log(
    "=========================================="
  );

  Logger.log(
    "✅ TEST DATA PRESERVATION RÉUSSI"
  );

  Logger.log(
    "Champs vérifiés : " +
    champs.length
  );

  Logger.log(
    "Champs perdus : 0"
  );

  Logger.log(
    "Champs modifiés : 0"
  );

  Logger.log(
    "=========================================="
  );

  return {
    success: true,
    fieldsChecked:
      champs.length,
    lostFields: 0,
    modifiedFields: 0
  };
}


/**
 * ============================================================
 * MICRO-TEST LOCAL — FAIL SAFE
 * ============================================================
 *
 * Ce test ne contacte PAS HumbleOS.
 * Il vérifie seulement que le fallback narratif reste disponible
 * lorsqu'aucun narratif IA n'existe.
 */
function TEST_STANDARD_AI_52_FALLBACK_LOCAL() {
  AG24_STANDARD_AI_52_CACHE = {
    donnees: {
      projectName:
        "GreenStep Shoes"
    },

    narratif: {},

    humbleOS: {
      success: false,
      fallbackUsed: true,
      errors: [
        "Simulation timeout"
      ]
    }
  };

  var fallback =
    "Texte professionnel construit par Astrid.";

  var resultat =
    obtenirNarratifStandardIA52_(
      "resumeExecutif",
      fallback
    );

  reinitialiserBusinessPlanStandardIA52_();

  if (resultat !== fallback) {
    throw new Error(
      "Le fallback Astrid n'a pas été conservé."
    );
  }

  Logger.log(
    "✅ TEST FAIL SAFE RÉUSSI"
  );

  return {
    success: true,
    fallbackPreserved: true
  };
}
