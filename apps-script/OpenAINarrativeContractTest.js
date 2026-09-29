/**
 * AfriGreen24 — OpenAI Narrative Contract Test V1
 *
 * End-to-end narrative-path validation using synthetic data only.
 *
 * Contract:
 * - no real customer or Business Plan data;
 * - exercises the production Standard AI wrapper;
 * - forces a fresh cache key per run;
 * - at most one provider request through the canonical bridge;
 * - validates all required narrative blocks;
 * - verifies factual source preservation;
 * - persists/logs metadata only, never narrative content or API key.
 */

const AG24_OPENAI_NARRATIVE_TEST_V1 = Object.freeze({
  VERSION: '1.0.0',
  LAST_REPORT_PROPERTY:
    'AFRIGREEN24_OPENAI_NARRATIVE_TEST_LAST_REPORT'
});

function AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_() {
  const runSuffix =
    String(Date.now());

  return {
    projectName:
      'AG24 Narrative Synthetic Test ' +
      runSuffix,

    promoterName:
      'PROMOTEUR SYNTHETIQUE TEST INTERNE',

    country:
      'CAMEROUN',

    stage:
      'PILOTE STRUCTURE EN COURS DE VALIDATION COMMERCIALE',

    sector:
      'ECONOMIE CIRCULAIRE ET GESTION RESPONSABLE DES DECHETS',

    problem:
      'LES PETITES ENTREPRISES LOCALES MANQUENT DE SOLUTIONS SIMPLES POUR TRIER ET VALORISER LEURS DECHETS RECYCLABLES.',

    affectedPeople:
      'PETITES ENTREPRISES URBAINES, COMMERCES DE PROXIMITE ET COLLECTEURS LOCAUX.',

    urgency:
      'LES VOLUMES NON TRIES AUGMENTENT LES COUTS DE COLLECTE ET REDUISENT LA VALEUR DES MATIERES RECUPERABLES.',

    solution:
      'UN SERVICE DE COLLECTE PLANIFIEE AVEC TRI A LA SOURCE, SUIVI DES VOLUMES ET ORIENTATION VERS DES FILIERES DE VALORISATION.',

    valueProposition:
      'REDUIRE LE TRAVAIL MANUEL DU CLIENT ET RENDRE LA GESTION DES DECHETS PLUS PREVISIBLE ET MESURABLE.',

    benefit:
      'GAIN DE TEMPS, MEILLEURE TRAÇABILITE DES VOLUMES ET DIMINUTION DES ERREURS DE TRI.',

    targetCustomers:
      'COMMERCES, PETITES ENTREPRISES DE SERVICES ET ATELIERS SITUES DANS UNE ZONE URBAINE PILOTE.',

    marketArea:
      'DEMARRAGE DANS UNE ZONE URBAINE PILOTE AVANT EXTENSION SELON LA DENSITE DE CLIENTS ET LA CAPACITE LOGISTIQUE.',

    salesChannels:
      'PROSPECTION DIRECTE, PARTENARIATS LOCAUX ET RECOMMANDATIONS ENTRE ENTREPRISES.',

    competitors:
      'COLLECTEURS INFORMELS, PRESTATAIRES GENERALISTES ET GESTION INTERNE PAR LES ENTREPRISES.',

    revenueModel:
      'ABONNEMENT MENSUEL POUR LA COLLECTE ET SERVICES COMPLEMENTAIRES SELON LE VOLUME TRAITE.',

    pricing:
      'TARIFICATION PAR FORMULE MENSUELLE A VALIDER DURANT LE PILOTE EN FONCTION DU VOLUME ET DE LA FREQUENCE.',

    mainCosts:
      'LOGISTIQUE, EQUIPEMENTS DE TRI, MAIN-D OEUVRE, MAINTENANCE ET ACQUISITION CLIENT.',

    team:
      'UN RESPONSABLE OPERATIONS, UN RESPONSABLE COMMERCIAL ET DES AGENTS DE COLLECTE POUR LA PHASE PILOTE.',

    fundingType:
      'FINANCEMENT D AMORCAGE A STRUCTURER.',

    fundingNeed:
      'MONTANT A VALIDER APRES CONSOLIDATION DU BUDGET D EQUIPEMENT ET DU BESOIN EN FONDS DE ROULEMENT.',

    useOfFunds:
      'EQUIPEMENTS, LOGISTIQUE PILOTE, ACQUISITION CLIENT ET TRESORERIE DE DEMARRAGE.',

    impact:
      'AMELIORER LE TRI A LA SOURCE, AUGMENTER LES VOLUMES VALORISES ET STRUCTURER DES ACTIVITES LOCALES DE COLLECTE.',

    risks:
      'DENSITE CLIENT INSUFFISANTE, COUT LOGISTIQUE ELEVE, QUALITE DU TRI ET IRREGULARITE DES VOLUMES.'
  };
}

function AG24_OPENAI_NARRATIVE_TEST_safeUsageV1_(
  usage
) {
  usage = usage || {};

  return {
    inputTokens:
      Number(
        usage.input_tokens || 0
      ),

    outputTokens:
      Number(
        usage.output_tokens || 0
      ),

    totalTokens:
      Number(
        usage.total_tokens || 0
      )
  };
}

function AG24_OPENAI_NARRATIVE_TEST_persistV1_(
  report
) {
  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_OPENAI_NARRATIVE_TEST_V1
        .LAST_REPORT_PROPERTY,
      JSON.stringify(report)
    );

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  if (
    typeof AG24_AUDIT_event_ ===
    'function'
  ) {
    try {
      AG24_AUDIT_event_(
        report.success
          ? 'OPENAI_NARRATIVE_CONTRACT_TEST_PASSED'
          : 'OPENAI_NARRATIVE_CONTRACT_TEST_FAILED',
        report
      );
    } catch (auditError) {
      // Test result remains authoritative if optional audit plumbing fails.
    }
  }

  return report;
}

/**
 * Editor-safe entry point.
 *
 * This test may incur one small real OpenAI request.
 */
function AG24_OPENAI_NARRATIVE_CONTRACT_TEST_V1() {
  const startedAt =
    Date.now();

  const data =
    AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_();

  const sourceFingerprint =
    AG24_OPENAI_sha256_(
      JSON.stringify(data)
    );

  const assessment =
    AG24_OPENAI_assessNarrativeNeed_(
      data
    );

  const base = {
    success: false,
    version:
      AG24_OPENAI_NARRATIVE_TEST_V1.VERSION,
    testedAt:
      new Date().toISOString(),
    syntheticData: true,
    provider: 'OPENAI',
    model: '',
    store: false,
    qualityGateUseAI:
      Boolean(
        assessment &&
        assessment.useAI
      ),
    qualityScore:
      assessment &&
      assessment.score !== undefined
        ? Number(assessment.score)
        : null,
    aiCalled: false,
    cacheHit: false,
    fallbackUsed: false,
    factsPreserved: false,
    narrativeBlockCount: 0,
    nonEmptyBlockCount: 0,
    missingBlocks: [],
    emptyBlocks: [],
    classification: '',
    durationMs: 0,
    responseId: '',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };

  if (!base.qualityGateUseAI) {
    base.classification =
      'QUALITY_GATE_DID_NOT_CALL_AI';

    base.durationMs =
      Date.now() - startedAt;

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  let result;

  try {
    reinitialiserBusinessPlanStandardIA52_();

    result =
      preparerBusinessPlanStandardIA52(
        data
      ) || {};
  } catch (error) {
    base.classification =
      'WRAPPER_EXCEPTION';

    base.durationMs =
      Date.now() - startedAt;

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  } finally {
    reinitialiserBusinessPlanStandardIA52_();
  }

  const openAI =
    result.openAI || {};

  const narrative =
    result.narratif &&
    typeof result.narratif === 'object'
      ? result.narratif
      : {};

  const expected =
    AG24_OPENAI_NARRATIVE_KEYS.slice();

  const actualKeys =
    Object.keys(
      narrative
    );

  base.model =
    String(
      result.model || ''
    );

  base.aiCalled =
    openAI.called === true;

  base.cacheHit =
    openAI.cacheHit === true;

  base.fallbackUsed =
    openAI.fallbackUsed === true;

  base.responseId =
    String(
      openAI.responseId || ''
    );

  base.narrativeBlockCount =
    actualKeys.length;

  base.missingBlocks =
    expected.filter(function(key) {
      return !Object.prototype
        .hasOwnProperty
        .call(
          narrative,
          key
        );
    });

  base.emptyBlocks =
    expected.filter(function(key) {
      return (
        Object.prototype
          .hasOwnProperty
          .call(
            narrative,
            key
          ) &&
        !String(
          narrative[key] || ''
        ).trim()
      );
    });

  base.nonEmptyBlockCount =
    expected.length -
    base.missingBlocks.length -
    base.emptyBlocks.length;

  const preservedFingerprint =
    AG24_OPENAI_sha256_(
      JSON.stringify(
        result.donnees || {}
      )
    );

  base.factsPreserved =
    preservedFingerprint ===
    sourceFingerprint;

  const safeUsage =
    AG24_OPENAI_NARRATIVE_TEST_safeUsageV1_(
      openAI.usage
    );

  base.inputTokens =
    safeUsage.inputTokens;
  base.outputTokens =
    safeUsage.outputTokens;
  base.totalTokens =
    safeUsage.totalTokens;

  base.durationMs =
    Date.now() - startedAt;

  if (!base.aiCalled) {
    base.classification =
      base.fallbackUsed
        ? 'AI_FALLBACK_USED'
        : 'AI_NOT_CALLED';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  if (base.cacheHit) {
    base.classification =
      'UNEXPECTED_CACHE_HIT';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  if (!base.factsPreserved) {
    base.classification =
      'FACT_SOURCE_MUTATED';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  if (base.missingBlocks.length) {
    base.classification =
      'MISSING_NARRATIVE_BLOCKS';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  if (base.emptyBlocks.length) {
    base.classification =
      'EMPTY_NARRATIVE_BLOCKS';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  if (
    base.narrativeBlockCount !==
    expected.length
  ) {
    base.classification =
      'UNEXPECTED_NARRATIVE_SHAPE';

    return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
      base
    );
  }

  base.success = true;
  base.classification = 'PASS';

  return AG24_OPENAI_NARRATIVE_TEST_persistV1_(
    base
  );
}

function AG24_OPENAI_NARRATIVE_CONTRACT_LAST_REPORT_V1() {
  const raw =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_OPENAI_NARRATIVE_TEST_V1
          .LAST_REPORT_PROPERTY
      );

  if (!raw) {
    return {
      success: false,
      classification: 'NO_REPORT'
    };
  }

  return JSON.parse(raw);
}
