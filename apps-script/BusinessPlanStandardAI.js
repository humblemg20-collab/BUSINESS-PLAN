/**
 * ============================================================
 * AFRIGREEN24 BUSINESS PLAN AI ENGINE 6.0 — OPENAI + FAIL SAFE
 * ============================================================
 *
 * Production policy:
 * 1. User answers remain the factual source of truth.
 * 2. Deterministic code handles rules, validation and calculations.
 * 3. OpenAI is called only when the narrative quality detector says it adds value.
 * 4. At most ONE OpenAI request is made for a complete Business Plan narrative.
 * 5. OpenAI never replaces the original factual data.
 * 6. Any OpenAI failure immediately falls back to local SmartWriter / BusinessWriter.
 * 7. The Google Docs / PDF generation must remain available even when AI is unavailable.
 */

var AG24_STANDARD_AI_52_CACHE = null;


/**
 * Prepares the optional narrative enrichment used by the document composer.
 * Function name is preserved for compatibility with Code.js during migration.
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

  var narratifFinal = {};
  var openAIResult = {};
  var openAIError = "";
  var skipped = false;
  var skipReason = "";
  var qualityScore = null;

  try {
    if (
      typeof AG24_OPENAI_generateStandardNarrative_ !==
      "function"
    ) {
      throw new Error(
        "OpenAIBridge.js n'est pas disponible dans le projet Apps Script."
      );
    }

    openAIResult =
      AG24_OPENAI_generateStandardNarrative_(
        clonerDonneesStandardIA52_(
          donneesOriginales
        ),
        instructions
      ) || {};

    skipped =
      openAIResult.skipped === true;

    skipReason =
      String(
        openAIResult.reason || ""
      );

    qualityScore =
      openAIResult.qualityScore !== undefined
        ? Number(
            openAIResult.qualityScore
          )
        : null;

    narratifFinal =
      openAIResult.narratif &&
      typeof openAIResult.narratif ===
      "object"
        ? openAIResult.narratif
        : {};

  } catch (erreur) {
    openAIError =
      erreur && erreur.message
        ? erreur.message
        : String(erreur);

    console.warn(
      "Business Plan — OpenAI indisponible. " +
      "Fallback déterministe conservé. " +
      openAIError
    );

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      AG24_AUDIT_event_(
        "OPENAI_NARRATIVE_FALLBACK_USED",
        {
          reason:
            String(
              openAIError || ""
            ).slice(
              0,
              500
            )
        }
      );
    }
  }

  AG24_STANDARD_AI_52_CACHE = {
    /*
     * SOURCE DE VÉRITÉ :
     * toujours les données originales.
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
      String(
        openAIResult.model || ""
      ),

    durationSeconds:
      Number(
        openAIResult.durationSeconds || 0
      ),

    openAI: {
      called:
        !skipped &&
        !openAIError,

      skipped:
        skipped,

      skipReason:
        skipReason,

      qualityScore:
        qualityScore,

      cacheHit:
        openAIResult.cacheHit === true,

      success:
        !openAIError &&
        (
          skipped ||
          Object.keys(
            narratifFinal
          ).length > 0
        ),

      fallbackUsed:
        Boolean(
          openAIError
        ),

      error:
        openAIError,

      responseId:
        String(
          openAIResult.responseId || ""
        ),

      usage:
        openAIResult.usage || {}
    }
  };

  journaliserPreservationDonneesStandardIA52_(
    donneesOriginales,
    AG24_STANDARD_AI_52_CACHE.donnees
  );

  console.log(
    JSON.stringify({
      event:
        "business_plan_openai_summary",

      ai_called:
        AG24_STANDARD_AI_52_CACHE.openAI.called,

      ai_skipped:
        AG24_STANDARD_AI_52_CACHE.openAI.skipped,

      skip_reason:
        AG24_STANDARD_AI_52_CACHE.openAI.skipReason,

      quality_score:
        AG24_STANDARD_AI_52_CACHE.openAI.qualityScore,

      success:
        AG24_STANDARD_AI_52_CACHE.openAI.success,

      fallback_used:
        AG24_STANDARD_AI_52_CACHE.openAI.fallbackUsed,

      cache_hit:
        AG24_STANDARD_AI_52_CACHE.openAI.cacheHit,

      model:
        AG24_STANDARD_AI_52_CACHE.model,

      narrative_blocks:
        Object.keys(
          narratifFinal
        ).length,

      input_tokens:
        Number(
          (
            AG24_STANDARD_AI_52_CACHE
              .openAI
              .usage || {}
          ).input_tokens || 0
        ),

      output_tokens:
        Number(
          (
            AG24_STANDARD_AI_52_CACHE
              .openAI
              .usage || {}
          ).output_tokens || 0
        )
    })
  );

  return AG24_STANDARD_AI_52_CACHE;
}


/**
 * Returns the OpenAI narrative block when available,
 * otherwise preserves the deterministic local fallback.
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
 * Aucun appel OpenAI.
 */
function TEST_STANDARD_AI_52_PRESERVATION_LOCALE_() {
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
 * Ce test ne contacte PAS OpenAI.
 * Il vérifie seulement que le fallback narratif reste disponible
 * lorsqu'aucun narratif IA n'existe.
 */
function TEST_STANDARD_AI_52_FALLBACK_LOCAL_() {
  AG24_STANDARD_AI_52_CACHE = {
    donnees: {
      projectName:
        "GreenStep Shoes"
    },

    narratif: {},

    openAI: {
      success: false,
      fallbackUsed: true,
      error:
        "Simulation timeout"
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
