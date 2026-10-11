/**
 * AfriGreen24 — Premium Team & Governance Section V1
 *
 * Reuses available project data and explicitly marks missing governance rather
 * than inventing a board, legal structure or decision process.
 */
var AG24_PREMIUM_TEAM_GOV_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_TEAM_GOV_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_TEAM_GOV_first_(data, keys) {
  data = data || {};
  for (var i=0; i<keys.length; i++) {
    var value = data[keys[i]];
    if (AG24_PREMIUM_TEAM_GOV_text_(value)) return value;
  }
  return "";
}

function AG24_PREMIUM_TEAM_GOV_build_(data) {
  data = data || {};

  return {
    success:true,
    version:AG24_PREMIUM_TEAM_GOV_V1.VERSION,
    promoter:AG24_PREMIUM_TEAM_GOV_text_(
      AG24_PREMIUM_TEAM_GOV_first_(data,[
        "promoterName","ownerName","founderName"
      ])
    ),
    team:AG24_PREMIUM_TEAM_GOV_text_(
      AG24_PREMIUM_TEAM_GOV_first_(data,[
        "team","managementTeam","founders"
      ])
    ),
    governance:AG24_PREMIUM_TEAM_GOV_text_(
      AG24_PREMIUM_TEAM_GOV_first_(data,[
        "governance","governanceModel","decisionGovernance","board"
      ])
    ),
    legalForm:AG24_PREMIUM_TEAM_GOV_text_(
      AG24_PREMIUM_TEAM_GOV_first_(data,[
        "legalForm","legalStructure","companyType"
      ])
    )
  };
}

function AG24_PREMIUM_TEAM_GOV_render_(body, data, theme) {
  var section = AG24_PREMIUM_TEAM_GOV_build_(data);

  if (
    !section.promoter &&
    !section.team &&
    !section.governance &&
    !section.legalForm
  ) {
    return {
      success:true,
      rendered:false,
      governancePresent:false
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "G",
    "Équipe & gouvernance",
    theme
  );

  AG24_BP_V2_addFactsGrid_(
    body,
    [
      ["Porteur",section.promoter],
      ["Forme juridique",section.legalForm]
    ],
    theme
  );

  AG24_BP_V2_addCards_(
    body,
    [
      ["Équipe",section.team],
      [
        "Gouvernance",
        section.governance ||
        "À formaliser : rôles de décision, responsabilités, contrôle et gouvernance."
      ]
    ],
    theme
  );

  if (!section.governance) {
    AG24_BP_V2_addCallout_(
      body,
      "Point de readiness",
      "La gouvernance n’est pas documentée dans la source actuelle. Le système la signale explicitement au lieu d’en inventer une.",
      theme
    );
  }

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_TEAM_GOVERNANCE_SECTION_RENDERED",
        {
          version:section.version,
          teamPresent:Boolean(section.team),
          governancePresent:Boolean(section.governance),
          legalFormPresent:Boolean(section.legalForm)
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    governancePresent:Boolean(section.governance)
  };
}

function AG24_PREMIUM_TEAM_GOV_SECTION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_TEAM_GOV_V1.VERSION,
    rendered:false,
    teamPresent:false,
    missingGovernanceExplicit:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Team Governance Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var result = AG24_PREMIUM_TEAM_GOV_render_(
      doc.getBody(),
      {
        promoterName:"Francis Michel",
        team:"Fondateur, responsable opérations, responsable commercial"
      },
      AG24_BP_V2_resolveTheme_("executive_premium")
    );

    report.rendered = Boolean(result && result.rendered);

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.teamPresent =
      text.indexOf("Francis Michel") !== -1 &&
      text.indexOf("responsable opérations") !== -1;

    report.missingGovernanceExplicit =
      text.indexOf("À formaliser") !== -1 &&
      text.indexOf("n’est pas documentée") !== -1;

    reopened.saveAndClose();

    report.success =
      report.rendered &&
      report.teamPresent &&
      report.missingGovernanceExplicit;

    if (!report.success) {
      report.failureCode = "PREMIUM_TEAM_GOVERNANCE_CONTRACT_FAILED";
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
