/**
 * AfriGreen24 — Premium Metric Strip V1
 * Reusable deterministic renderer for 1-6 decision metrics.
 */
var AG24_PREMIUM_METRIC_STRIP_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_METRICS:6
});

function AG24_PREMIUM_METRIC_STRIP_render_(body, metrics, theme) {
  metrics = (metrics || []).filter(function(m) {
    return m && String(m.label || "").trim() && String(m.value || "").trim();
  }).slice(0,AG24_PREMIUM_METRIC_STRIP_V1.MAX_METRICS);

  if (!metrics.length) return null;

  if (!theme && typeof AG24_BP_V2_resolveTheme_ === "function") {
    theme = AG24_BP_V2_resolveTheme_("executive_premium");
  }

  theme = theme || {
    primary:"#16263D",
    accent:"#D8B56C",
    white:"#FFFFFF",
    soft:"#F4F1EA",
    headingFont:"Montserrat",
    bodyFont:"Arial"
  };

  for (var start = 0; start < metrics.length; start += 3) {
    var rowMetrics = metrics.slice(start,start + 3);
    var table = body.appendTable([["","",""]]);
    table.setBorderWidth(0);

    for (var col = 0; col < 3; col++) {
      var cell = table.getCell(0,col);
      var metric = rowMetrics[col];

      if (!metric) {
        cell.setBackgroundColor(theme.white);
        cell.setText("");
        continue;
      }

      cell.setBackgroundColor(theme.primary);

      cell.getChild(0).asParagraph()
        .setText(String(metric.label).toUpperCase())
        .setForegroundColor(theme.accent)
        .setBold(true)
        .setFontFamily(theme.headingFont)
        .setFontSize(7.5)
        .setSpacingBefore(7)
        .setSpacingAfter(4);

      cell.appendParagraph(String(metric.value))
        .setForegroundColor(theme.white)
        .setBold(true)
        .setFontFamily(theme.headingFont)
        .setFontSize(17)
        .setSpacingAfter(5);

      if (metric.truthStatus) {
        cell.appendParagraph(String(metric.truthStatus))
          .setForegroundColor(theme.soft)
          .setFontFamily(theme.bodyFont)
          .setFontSize(6.5)
          .setSpacingAfter(6);
      }
    }

    table.setColumnWidth(0,158);
    table.setColumnWidth(1,158);
    table.setColumnWidth(2,158);
    body.appendParagraph("").setSpacingAfter(7);
  }

  return true;
}

function AG24_PREMIUM_METRIC_STRIP_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_METRIC_STRIP_V1.VERSION,
    rendered:false,
    markersPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Premium Metric Strip Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    report.rendered = Boolean(
      AG24_PREMIUM_METRIC_STRIP_render_(
        doc.getBody(),
        [
          {label:"Clients payants",value:"18",truthStatus:"DECLARED"},
          {label:"MRR",value:"€8.1k",truthStatus:"DECLARED"},
          {label:"ARR",value:"€97.2k",truthStatus:"CALCULATED"}
        ],
        null
      )
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.markersPresent =
      text.indexOf("CLIENTS PAYANTS") !== -1 &&
      text.indexOf("€8.1k") !== -1 &&
      text.indexOf("€97.2k") !== -1 &&
      text.indexOf("CALCULATED") !== -1;

    reopened.saveAndClose();

    report.success =
      report.rendered === true &&
      report.markersPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_METRIC_STRIP_CONTRACT_FAILED";
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
