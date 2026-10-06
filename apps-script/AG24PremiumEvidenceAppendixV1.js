/**
 * AfriGreen24 — Premium Evidence Appendix V1
 *
 * Renders the Project Intelligence evidence registry as an auditable appendix.
 * No evidence registry => no fabricated appendix.
 */
var AG24_PREMIUM_EVIDENCE_APPENDIX_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_ITEMS:30
});

function AG24_PREMIUM_EVIDENCE_APPENDIX_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_EVIDENCE_APPENDIX_build_(project) {
  var items =
    project &&
    project.evidence &&
    Array.isArray(project.evidence.items)
      ? project.evidence.items
      : [];

  var rows = items.slice(
    0,
    AG24_PREMIUM_EVIDENCE_APPENDIX_V1.MAX_ITEMS
  ).map(function(item) {
    return {
      evidenceId:AG24_PREMIUM_EVIDENCE_APPENDIX_text_(item.evidenceId),
      title:AG24_PREMIUM_EVIDENCE_APPENDIX_text_(
        item.title || item.issuer || item.type
      ),
      type:AG24_PREMIUM_EVIDENCE_APPENDIX_text_(item.type),
      reliability:AG24_PREMIUM_EVIDENCE_APPENDIX_text_(
        item.reliability || "UNRATED"
      ),
      supports:Array.isArray(item.supports)
        ? item.supports.slice()
        : [],
      verifiedAt:AG24_PREMIUM_EVIDENCE_APPENDIX_text_(item.verifiedAt)
    };
  });

  return {
    success:true,
    version:AG24_PREMIUM_EVIDENCE_APPENDIX_V1.VERSION,
    rows:rows
  };
}

function AG24_PREMIUM_EVIDENCE_APPENDIX_render_(body, project, theme) {
  var appendix = AG24_PREMIUM_EVIDENCE_APPENDIX_build_(project);

  if (!appendix.rows.length) {
    return {
      success:true,
      rendered:false,
      itemCount:0
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "A",
    "Annexes & preuves",
    theme
  );

  var rows = [[
    "PREUVE",
    "TYPE",
    "FIABILITÉ",
    "CHAMPS SUPPORTÉS"
  ]];

  appendix.rows.forEach(function(item) {
    rows.push([
      item.title || item.evidenceId,
      item.type || "—",
      item.reliability || "UNRATED",
      String(item.supports.length)
    ]);
  });

  var table = body.appendTable(rows);
  table.setBorderColor(theme.border).setBorderWidth(1);

  for (var row=0; row<table.getNumRows(); row++) {
    for (var col=0; col<4; col++) {
      var cell = table.getCell(row,col);
      cell.setBackgroundColor(
        row === 0
          ? theme.primary
          : (row % 2 === 0 ? theme.softAlt : theme.white)
      );

      cell.getChild(0).asParagraph()
        .setForegroundColor(row === 0 ? theme.white : theme.text)
        .setFontFamily(row === 0 ? theme.headingFont : theme.bodyFont)
        .setFontSize(row === 0 ? 7.2 : 8)
        .setBold(row === 0)
        .setSpacingBefore(4)
        .setSpacingAfter(4);
    }
  }

  table.setColumnWidth(0,210);
  table.setColumnWidth(1,100);
  table.setColumnWidth(2,90);
  table.setColumnWidth(3,76);

  body.appendParagraph("").setSpacingAfter(8);

  AG24_BP_V2_addCallout_(
    body,
    "Traçabilité",
    "Cette annexe provient du registre de preuves Project Intelligence. Elle ne crée ni document, ni source, ni niveau de fiabilité absent du registre canonique.",
    theme
  );

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_EVIDENCE_APPENDIX_RENDERED",
        {
          version:appendix.version,
          itemCount:appendix.rows.length
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    itemCount:appendix.rows.length
  };
}

function AG24_PREMIUM_EVIDENCE_APPENDIX_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_EVIDENCE_APPENDIX_V1.VERSION,
    rendered:false,
    evidencePresent:false,
    supportCountPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var project = {
      evidence:{
        items:[
          {
            evidenceId:"EVID_CRM",
            type:"CRM",
            title:"CRM commercial",
            reliability:"HIGH",
            supports:[
              "traction.payingCustomers",
              "traction.revenueToDate"
            ],
            verifiedAt:"2026-10-06T00:00:00Z"
          },
          {
            evidenceId:"EVID_BANK",
            type:"BANK_STATEMENT",
            title:"Relevé bancaire",
            reliability:"HIGH",
            supports:["financialModel.cfads"]
          }
        ]
      }
    };

    var doc = DocumentApp.create(
      "AG24 Evidence Appendix Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var result = AG24_PREMIUM_EVIDENCE_APPENDIX_render_(
      doc.getBody(),
      project,
      AG24_BP_V2_resolveTheme_("executive_premium")
    );

    report.rendered = Boolean(result && result.rendered);

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.evidencePresent =
      text.indexOf("CRM commercial") !== -1 &&
      text.indexOf("Relevé bancaire") !== -1 &&
      text.indexOf("BANK_STATEMENT") !== -1;

    report.supportCountPresent =
      text.indexOf("2") !== -1 &&
      text.indexOf("1") !== -1;

    reopened.saveAndClose();

    report.success =
      report.rendered &&
      report.evidencePresent &&
      report.supportCountPresent;

    if (!report.success) {
      report.failureCode = "PREMIUM_EVIDENCE_APPENDIX_CONTRACT_FAILED";
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
