/**
 * AfriGreen24 — Premium Evidence Card V1
 * Deterministic renderer for claims with provenance/truth status.
 */
var AG24_PREMIUM_EVIDENCE_V1 = Object.freeze({
  VERSION:"1.0.0",
  ALLOWED_STATUSES:Object.freeze([
    "DECLARED",
    "DOCUMENTED",
    "EXTERNAL_VERIFIED",
    "CALCULATED",
    "ESTIMATED",
    "ASSUMPTION",
    "CONFLICT",
    "MISSING"
  ])
});

function AG24_PREMIUM_EVIDENCE_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_EVIDENCE_status_(value) {
  var status = AG24_PREMIUM_EVIDENCE_text_(value).toUpperCase();
  return AG24_PREMIUM_EVIDENCE_V1.ALLOWED_STATUSES.indexOf(status) !== -1
    ? status
    : "DECLARED";
}

function AG24_PREMIUM_EVIDENCE_render_(body, evidence, theme) {
  evidence = evidence || {};

  var claim = AG24_PREMIUM_EVIDENCE_text_(evidence.claim);
  if (!claim) return null;

  if (!theme && typeof AG24_BP_V2_resolveTheme_ === "function") {
    theme = AG24_BP_V2_resolveTheme_("executive_premium");
  }

  theme = theme || {
    primary:"#16263D",
    accent:"#D8B56C",
    soft:"#F4F1EA",
    white:"#FFFFFF",
    text:"#1F2933",
    muted:"#66717D",
    border:"#DDE2E7",
    headingFont:"Montserrat",
    bodyFont:"Arial"
  };

  var status = AG24_PREMIUM_EVIDENCE_status_(
    evidence.truthStatus || evidence.status
  );
  var source = AG24_PREMIUM_EVIDENCE_text_(evidence.source);
  var note = AG24_PREMIUM_EVIDENCE_text_(evidence.note);

  var table = body.appendTable([["",""]]);
  table.setBorderColor(theme.border).setBorderWidth(1);

  var badge = table.getCell(0,0);
  var content = table.getCell(0,1);

  badge.setBackgroundColor(theme.soft);
  content.setBackgroundColor(theme.white);

  var badgeP = badge.getChild(0).asParagraph();
  badgeP.setText(status);
  badgeP
    .setForegroundColor(theme.primary)
    .setBold(true)
    .setFontFamily(theme.headingFont)
    .setFontSize(7.5)
    .setSpacingBefore(8)
    .setSpacingAfter(8);

  var claimP = content.getChild(0).asParagraph();
  claimP.setText(claim);
  claimP
    .setForegroundColor(theme.text)
    .setFontFamily(theme.bodyFont)
    .setFontSize(9)
    .setLineSpacing(1.18)
    .setSpacingBefore(7)
    .setSpacingAfter((source || note) ? 4 : 7);

  if (source) {
    content.appendParagraph("Source : " + source)
      .setForegroundColor(theme.muted)
      .setFontFamily(theme.bodyFont)
      .setFontSize(7)
      .setSpacingAfter(note ? 3 : 7);
  }

  if (note) {
    content.appendParagraph(note)
      .setForegroundColor(theme.muted)
      .setFontFamily(theme.bodyFont)
      .setFontSize(7)
      .setSpacingAfter(7);
  }

  table.setColumnWidth(0,110);
  table.setColumnWidth(1,366);
  body.appendParagraph("").setSpacingAfter(6);

  return true;
}

function AG24_PREMIUM_EVIDENCE_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_EVIDENCE_V1.VERSION,
    rendered:false,
    markersPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Premium Evidence Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    report.rendered = Boolean(
      AG24_PREMIUM_EVIDENCE_render_(
        doc.getBody(),
        {
          claim:"18 clients payants.",
          truthStatus:"DOCUMENTED",
          source:"CRM commercial",
          note:"Valeur vérifiée dans la source canonique."
        },
        null
      )
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.markersPresent =
      text.indexOf("DOCUMENTED") !== -1 &&
      text.indexOf("18 clients payants.") !== -1 &&
      text.indexOf("CRM commercial") !== -1;

    reopened.saveAndClose();

    report.success =
      report.rendered === true &&
      report.markersPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_EVIDENCE_CONTRACT_FAILED";
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
