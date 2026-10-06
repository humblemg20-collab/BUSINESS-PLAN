/**
 * AfriGreen24 — Premium Real-World QA Regression V1
 *
 * Fixture derived from defects observed in a real generated document.
 * Deterministic: no AI call, no external API, no persistent business data.
 */
var AG24_PREMIUM_REALWORLD_QA_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_REALWORLD_QA_SYSTEM_TEST_V1() {
  var documentId = "";

  var report = {
    success:false,
    version:AG24_PREMIUM_REALWORLD_QA_V1.VERSION,
    unknownCurrencySafe:false,
    sentinelCompetitorRemoved:false,
    semanticMappingSafe:false,
    strategyCompacted:false,
    operationsDeduplicated:false,
    sequentialNumbering:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var longProblem =
      "Pauvreté, absence d’initiatives pour la création de moyens de subsistance, " +
      "manque d’énergie, gestion dégradée des déchets, déforestation accrue et absence " +
      "d’eau potable dans le territoire ciblé, avec un besoin de structurer une réponse " +
      "locale économiquement viable et mesurable.";

    var data = {
      projectName:"Projet Vert QA",
      promoterName:"Porteur QA",
      country:"Cameroun",
      sector:"Économie circulaire",
      stage:"J’ai seulement une idée",
      problem:longProblem,
      affectedPeople:"Population villageoise",
      urgency:"Réduire la déforestation et profiter d’un contexte agricole favorable.",
      opportunity:"",
      solution:
        "Aménager une zone d’agroforesterie, transformer les productions et valoriser les déchets.",
      valueProposition:
        "Protection de l’environnement, énergie solaire et économie circulaire.",
      revenueModel:
        "Vente progressive de produits agricoles et transformés.",
      targetCustomers:"Population villageoise",
      marketArea:"Rayon de 50 km autour du site",
      competitors:"Personne",
      pricing:"Prix à confirmer",
      mainCosts:"Terrain, plants, matières premières et équipements",
      salesChannels:"Présence des produits sur le marché local",
      salesProcess:"Présence des produits sur le marché local",
      acquisitionStrategy:"",
      conversionStrategy:"",
      retentionStrategy:"",
      team:"Promoteur et emplois locaux prévus",
      governance:"",
      fundingType:"Prêt bancaire",
      fundingNeed:77000,
      useOfFunds:
        "Terrain, plants, matières premières, machines et équipements",
      impact:
        "Réduction du chômage, assainissement et création de richesse.",
      risks:"Perte de production due au vol",
      roadmapNow:"Idée",
      documentAudience:"GENERIC"
    };

    var doc =
      DocumentApp.create(
        "AG24 Real World QA " +
        String(new Date().getTime())
      );

    documentId = doc.getId();

    var result =
      AG24_BP_V2_renderDocument_(
        doc,
        data,
        {
          themeId:"executive_premium",
          audience:"GENERIC"
        }
      );

    doc.saveAndClose();

    var reopened =
      DocumentApp.openById(
        documentId
      );

    var text =
      reopened.getBody().getText();

    report.unknownCurrencySafe =
      text.indexOf(
        "77k — devise à confirmer"
      ) !== -1 &&
      text.indexOf("€77k") === -1;

    report.sentinelCompetitorRemoved =
      text.indexOf(
        "Personne\nAlternative identifiée"
      ) === -1 &&
      text.indexOf(
        "Personne\tAlternative identifiée"
      ) === -1;

    report.semanticMappingSafe =
      text.indexOf(
        "Pourquoi maintenant"
      ) !== -1 &&
      text.indexOf(
        "Conséquence\nRéduire la déforestation"
      ) === -1;

    report.strategyCompacted =
      text.indexOf(
        "Stratégie commerciale à structurer"
      ) !== -1;

    report.operationsDeduplicated =
      text.indexOf(
        "Organisation opérationnelle"
      ) !== -1 &&
      text.indexOf(
        "Équipe et organisation opérationnelle"
      ) === -1;

    var numbering =
      result &&
      result.sectionRenumbering &&
      Array.isArray(
        result.sectionRenumbering.sections
      )
        ? result.sectionRenumbering.sections
        : [];

    report.sequentialNumbering =
      numbering.length > 4 &&
      numbering.every(
        function(item,index) {
          var expected =
            index + 1 < 10
              ? "0" + String(index + 1)
              : String(index + 1);

          return item.number === expected;
        }
      );

    reopened.saveAndClose();

    report.success =
      report.unknownCurrencySafe &&
      report.sentinelCompetitorRemoved &&
      report.semanticMappingSafe &&
      report.strategyCompacted &&
      report.operationsDeduplicated &&
      report.sequentialNumbering;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_REAL_WORLD_QA_CONTRACT_FAILED";
    }

  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);

  } finally {
    if (documentId) {
      try {
        var file =
          DriveApp.getFileById(
            documentId
          );

        file.setTrashed(true);

        report.cleanupSuccess =
          file.isTrashed() === true;
      } catch (cleanupError) {
        report.cleanupSuccess = false;
      }
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    if (
      typeof AG24_AUDIT_event_ ===
        "function"
    ) {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "PREMIUM_REAL_WORLD_QA_PASSED"
            : "PREMIUM_REAL_WORLD_QA_FAILED",
          {
            version:report.version,
            unknownCurrencySafe:
              report.unknownCurrencySafe,
            sentinelCompetitorRemoved:
              report.sentinelCompetitorRemoved,
            semanticMappingSafe:
              report.semanticMappingSafe,
            strategyCompacted:
              report.strategyCompacted,
            operationsDeduplicated:
              report.operationsDeduplicated,
            sequentialNumbering:
              report.sequentialNumbering,
            cleanupSuccess:
              report.cleanupSuccess,
            failureCode:
              report.failureCode
          }
        );
      } catch (auditError) {}
    }

    Logger.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );
  }

  return report;
}
