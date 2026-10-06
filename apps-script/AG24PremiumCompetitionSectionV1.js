/**
 * AfriGreen24 — Premium Competition Section V1
 *
 * Deterministic competitive landscape. It never invents competitor
 * attributes: it only renders named alternatives and the project's declared
 * positioning/value proposition.
 */
var AG24_PREMIUM_COMPETITION_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_ALTERNATIVES:8
});

function AG24_PREMIUM_COMPETITION_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_COMPETITION_split_(value) {
  var text = String(value || "")
    .replace(/[•●▪]/g,";")
    .replace(/\r?\n/g,";")
    .trim();

  if (!text) return [];

  var parts = text
    .split(";")
    .map(function(item){return AG24_PREMIUM_COMPETITION_text_(item);})
    .filter(Boolean);

  if (parts.length === 1 && parts[0].indexOf(",") !== -1) {
    parts = parts[0]
      .split(",")
      .map(function(item){return AG24_PREMIUM_COMPETITION_text_(item);})
      .filter(Boolean);
  }

  var seen = {};
  return parts.filter(function(item) {
    var key = item.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0,AG24_PREMIUM_COMPETITION_V1.MAX_ALTERNATIVES);
}

function AG24_PREMIUM_COMPETITION_build_(data) {
  data = data || {};

  var alternatives = AG24_PREMIUM_COMPETITION_split_(
    data.competitors || data.competition || data.alternatives
  );

  var positioning =
    AG24_PREMIUM_COMPETITION_text_(
      data.valueProposition ||
      data.benefit ||
      data.solution ||
      ""
    );

  return {
    success:true,
    version:AG24_PREMIUM_COMPETITION_V1.VERSION,
    alternatives:alternatives,
    positioning:positioning
  };
}

function AG24_PREMIUM_COMPETITION_render_(body, data, theme) {
  var section = AG24_PREMIUM_COMPETITION_build_(data);

  if (!section.alternatives.length && !section.positioning) {
    return {
      success:true,
      rendered:false,
      alternativeCount:0
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "C",
    "Concurrence & positionnement",
    theme
  );

  if (section.positioning) {
    AG24_BP_V2_addCallout_(
      body,
      "Positionnement déclaré",
      section.positioning,
      theme
    );
  }

  if (section.alternatives.length) {
    var rows = [["ACTEUR / ALTERNATIVE","STATUT"]];

    section.alternatives.forEach(function(item) {
      rows.push([
        item,
        "Alternative identifiée"
      ]);
    });

    var table = body.appendTable(rows);
    table.setBorderColor(theme.border).setBorderWidth(1);

    for (var row=0; row<table.getNumRows(); row++) {
      for (var col=0; col<2; col++) {
        var cell = table.getCell(row,col);
        cell.setBackgroundColor(
          row === 0
            ? theme.primary
            : (row % 2 === 0 ? theme.softAlt : theme.white)
        );

        cell.getChild(0).asParagraph()
          .setForegroundColor(row === 0 ? theme.white : theme.text)
          .setFontFamily(row === 0 ? theme.headingFont : theme.bodyFont)
          .setFontSize(row === 0 ? 7.5 : 8.5)
          .setBold(row === 0)
          .setSpacingBefore(5)
          .setSpacingAfter(5);
      }
    }

    table.setColumnWidth(0,310);
    table.setColumnWidth(1,166);
    body.appendParagraph("").setSpacingAfter(7);
  }

  AG24_BP_V2_addCallout_(
    body,
    "Règle de lecture",
    "Le système ne déduit aucun avantage concurrentiel non documenté. Les attributs comparatifs détaillés seront ajoutés uniquement lorsqu’ils existent dans la source canonique.",
    theme
  );

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_COMPETITION_SECTION_RENDERED",
        {
          version:section.version,
          alternativeCount:section.alternatives.length,
          positioningPresent:Boolean(section.positioning)
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    alternativeCount:section.alternatives.length
  };
}

function AG24_PREMIUM_COMPETITION_SECTION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_COMPETITION_V1.VERSION,
    rendered:false,
    alternativesPresent:false,
    positioningPresent:false,
    noInventedAttributes:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Competition Section Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var result = AG24_PREMIUM_COMPETITION_render_(
      doc.getBody(),
      {
        competitors:"Diesel generators;Grid electricity;Local solar installers",
        valueProposition:"Solar-as-a-Service sans CAPEX initial."
      },
      AG24_BP_V2_resolveTheme_("executive_premium")
    );

    report.rendered = Boolean(result && result.rendered);

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.alternativesPresent =
      text.indexOf("Diesel generators") !== -1 &&
      text.indexOf("Grid electricity") !== -1 &&
      text.indexOf("Local solar installers") !== -1;

    report.positioningPresent =
      text.indexOf("Solar-as-a-Service sans CAPEX initial.") !== -1;

    report.noInventedAttributes =
      text.indexOf("moins cher") === -1 &&
      text.indexOf("leader") === -1 &&
      text.indexOf("meilleur") === -1;

    reopened.saveAndClose();

    report.success =
      report.rendered &&
      report.alternativesPresent &&
      report.positioningPresent &&
      report.noInventedAttributes;

    if (!report.success) {
      report.failureCode = "PREMIUM_COMPETITION_SECTION_CONTRACT_FAILED";
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
      } catch (cleanupError) {}
    }

    report.success = report.success && report.cleanupSuccess;
    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
