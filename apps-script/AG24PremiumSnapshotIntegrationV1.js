/**
 * AfriGreen24 — Premium Executive Snapshot Integration Test V1
 * Verifies Financial Story -> Metric Strip -> Executive Snapshot integration.
 */
var AG24_PREMIUM_SNAPSHOT_TEST_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_SNAPSHOT_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_SNAPSHOT_TEST_V1.VERSION,
    financialMetricsPresent:false,
    fundingMetricPresent:false,
    snapshotContentPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Premium Snapshot Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var body = doc.getBody();
    var theme = AG24_BP_V2_resolveTheme_("executive_premium");

    var model = {
      project:{
        stage:"Early Revenue",
        sector:"Énergie",
        country:"Cameroun"
      },
      snapshot:{
        marketArea:"Cameroun",
        funding:"€150k",
        problem:"Coût élevé de l'énergie pour les PME.",
        solution:"Solar-as-a-Service.",
        valueProposition:"Réduction des coûts sans CAPEX initial.",
        revenueModel:"Abonnement mensuel.",
        targetCustomers:"PME",
        impact:"Accès à une énergie plus propre."
      }
    };

    var data = {
      currency:"EUR",
      mrr:8100,
      payingCustomers:18,
      grossMargin:42,
      cfads:72000,
      fundingNeed:150000
    };

    AG24_BP_V2_addSnapshot_(
      body,
      model,
      theme,
      data
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.financialMetricsPresent =
      text.indexOf("CLIENTS PAYANTS") !== -1 &&
      text.indexOf("€8.1k") !== -1 &&
      text.indexOf("€97.2k") !== -1;

    report.fundingMetricPresent =
      text.indexOf("FINANCEMENT RECHERCHÉ") !== -1 &&
      text.indexOf("€150k") !== -1;

    report.snapshotContentPresent =
      text.indexOf("Executive Snapshot") !== -1 &&
      text.indexOf("PROBLÈME") !== -1 &&
      text.indexOf("SOLUTION") !== -1;

    reopened.saveAndClose();

    report.success =
      report.financialMetricsPresent === true &&
      report.fundingMetricPresent === true &&
      report.snapshotContentPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_SNAPSHOT_INTEGRATION_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message ? String(error.message) : String(error);
  } finally {
    if (documentId) {
      try {
        var file = DriveApp.getFileById(documentId);
        file.setTrashed(true);
        report.cleanupSuccess = file.isTrashed() === true;
      } catch (cleanupError) {
        report.cleanupSuccess = false;
      }
    }

    report.success = report.success && report.cleanupSuccess;
    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
