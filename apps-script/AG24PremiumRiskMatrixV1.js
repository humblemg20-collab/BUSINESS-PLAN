/**
 * AfriGreen24 — Premium Risk Matrix V1
 * Deterministic renderer for risk, severity and mitigation.
 */
var AG24_PREMIUM_RISK_MATRIX_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_RISKS:8
});

function AG24_PREMIUM_RISK_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_RISK_level_(value) {
  var text = AG24_PREMIUM_RISK_text_(value).toUpperCase();

  if (
    text === "CRITICAL" ||
    text === "CRITIQUE" ||
    text === "HIGH" ||
    text === "ÉLEVÉ" ||
    text === "ELEVE"
  ) return "ÉLEVÉ";

  if (
    text === "MEDIUM" ||
    text === "MODERATE" ||
    text === "MOYEN"
  ) return "MOYEN";

  if (
    text === "LOW" ||
    text === "FAIBLE"
  ) return "FAIBLE";

  return "À QUALIFIER";
}

function AG24_PREMIUM_RISK_fromModel_(risks) {
  risks = risks || {};

  var raw = AG24_PREMIUM_RISK_text_(risks.raw);
  if (!raw) return [];

  var items = raw
    .replace(/[•●▪]/g,";")
    .replace(/\r?\n/g,";")
    .split(";")
    .map(function(item){return AG24_PREMIUM_RISK_text_(item);})
    .filter(Boolean)
    .slice(0,AG24_PREMIUM_RISK_MATRIX_V1.MAX_RISKS);

  return items.map(function(item,index) {
    var key = String(index);
    return {
      risk:item,
      level:
        (risks.levels && (risks.levels[key] || risks.levels[index])) || "",
      mitigation:
        (risks.mitigations && (risks.mitigations[key] || risks.mitigations[index])) || ""
    };
  });
}

function AG24_PREMIUM_RISK_render_(body, risks, theme) {
  var usable = (risks || [])
    .filter(function(risk) {
      return risk && AG24_PREMIUM_RISK_text_(risk.risk || risk.label);
    })
    .slice(0,AG24_PREMIUM_RISK_MATRIX_V1.MAX_RISKS);

  if (!usable.length) return null;

  if (!theme && typeof AG24_BP_V2_resolveTheme_ === "function") {
    theme = AG24_BP_V2_resolveTheme_("executive_premium");
  }

  theme = theme || {
    primary:"#16263D",
    white:"#FFFFFF",
    softAlt:"#F6F8FA",
    text:"#1F2933",
    border:"#DDE2E7",
    headingFont:"Montserrat",
    bodyFont:"Arial"
  };

  var rows = [["RISQUE","NIVEAU","MITIGATION"]];

  usable.forEach(function(risk) {
    rows.push([
      AG24_PREMIUM_RISK_text_(risk.risk || risk.label),
      AG24_PREMIUM_RISK_level_(risk.level || risk.severity),
      AG24_PREMIUM_RISK_text_(risk.mitigation) || "À formaliser"
    ]);
  });

  var table = body.appendTable(rows);
  table.setBorderColor(theme.border).setBorderWidth(1);

  for (var row = 0; row < table.getNumRows(); row++) {
    for (var col = 0; col < 3; col++) {
      var cell = table.getCell(row,col);
      cell.setBackgroundColor(
        row === 0 ? theme.primary :
        (row % 2 === 0 ? theme.softAlt : theme.white)
      );

      var paragraph = cell.getChild(0).asParagraph();
      paragraph
        .setForegroundColor(row === 0 ? theme.white : theme.text)
        .setFontFamily(row === 0 ? theme.headingFont : theme.bodyFont)
        .setFontSize(row === 0 ? 7.5 : 8.5)
        .setBold(row === 0 || col === 1)
        .setSpacingBefore(5)
        .setSpacingAfter(5);
    }
  }

  table.setColumnWidth(0,190);
  table.setColumnWidth(1,86);
  table.setColumnWidth(2,200);
  body.appendParagraph("").setSpacingAfter(7);

  return true;
}

function AG24_PREMIUM_RISK_MATRIX_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_RISK_MATRIX_V1.VERSION,
    normalized:false,
    rendered:false,
    markersPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var normalized = AG24_PREMIUM_RISK_fromModel_({
      raw:"Concentration fournisseurs;Risque de change",
      levels:{"0":"HIGH","1":"MEDIUM"},
      mitigations:{
        "0":"Double sourcing et stock de sécurité.",
        "1":"Révision trimestrielle des prix."
      }
    });

    report.normalized =
      normalized.length === 2 &&
      normalized[0].risk === "Concentration fournisseurs";

    var doc = DocumentApp.create(
      "AG24 Premium Risk Matrix Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    report.rendered = Boolean(
      AG24_PREMIUM_RISK_render_(
        doc.getBody(),
        normalized,
        null
      )
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.markersPresent =
      text.indexOf("Concentration fournisseurs") !== -1 &&
      text.indexOf("ÉLEVÉ") !== -1 &&
      text.indexOf("Double sourcing") !== -1;

    reopened.saveAndClose();

    report.success =
      report.normalized === true &&
      report.rendered === true &&
      report.markersPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_RISK_MATRIX_CONTRACT_FAILED";
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
