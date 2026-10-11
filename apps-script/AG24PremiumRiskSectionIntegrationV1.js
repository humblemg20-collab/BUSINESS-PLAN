/**
 * AfriGreen24 — Premium Risk Section Integration Test V1
 * Verifies Design System V2 -> Premium Risk Matrix integration.
 */
var AG24_PREMIUM_RISK_SECTION_TEST_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_RISK_SECTION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_RISK_SECTION_TEST_V1.VERSION,
    sectionTitlePresent:false,
    premiumRiskPresent:false,
    mitigationPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Premium Risk Section Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var model = {
      risks:{
        raw:"Concentration fournisseurs;Risque de change",
        levels:{
          "0":"HIGH",
          "1":"MEDIUM"
        },
        mitigations:{
          "0":"Double sourcing et stock de sécurité.",
          "1":"Révision trimestrielle des prix."
        },
        control:""
      }
    };

    AG24_BP_V2_addRiskPage_(
      doc.getBody(),
      model,
      AG24_BP_V2_resolveTheme_("executive_premium")
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.sectionTitlePresent =
      text.indexOf("Risques & points de vigilance") !== -1;

    report.premiumRiskPresent =
      text.indexOf("Concentration fournisseurs") !== -1 &&
      text.indexOf("ÉLEVÉ") !== -1 &&
      text.indexOf("Risque de change") !== -1 &&
      text.indexOf("MOYEN") !== -1;

    report.mitigationPresent =
      text.indexOf("Double sourcing") !== -1 &&
      text.indexOf("Révision trimestrielle") !== -1;

    reopened.saveAndClose();

    report.success =
      report.sectionTitlePresent === true &&
      report.premiumRiskPresent === true &&
      report.mitigationPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_RISK_SECTION_INTEGRATION_FAILED";
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
