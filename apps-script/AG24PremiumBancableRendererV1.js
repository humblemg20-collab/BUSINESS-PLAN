/**
 * AfriGreen24 — Premium Bancable Renderer V1
 * Shadow renderer for the paid financeur workflow.
 */
var AG24_PREMIUM_BANCABLE_RENDERER_V1 = Object.freeze({
  VERSION:"1.0.0",
  THEME_ID:"institutional_banking"
});

function AG24_PREMIUM_BANCABLE_RENDERER_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_BANCABLE_RENDERER_appendFinanceAppendix_(
  body,
  model,
  data,
  theme,
  composerOptions
) {
  var context =
    composerOptions && composerOptions.extensionContext
      ? composerOptions.extensionContext
      : {};

  var dossier = context.dossier || null;
  var financialModel = context.financialModel || null;

  if (!dossier || !financialModel) {
    return {
      success:false,
      rendered:false,
      failureCode:"BANCABLE_FINANCE_EXTENSION_CONTEXT_MISSING"
    };
  }

  if (
    typeof BPB3_ajouterHypothesesVentes_ !== "function" ||
    typeof BPB3_ajouterPrevisionsFinancieres_ !== "function" ||
    typeof BPB3_ajouterRemboursement_ !== "function" ||
    typeof BPB3_ajouterScenarios_ !== "function" ||
    typeof BPB3_ajouterAnnexeEcheancier_ !== "function"
  ) {
    return {
      success:false,
      rendered:false,
      failureCode:"BANCABLE_FINANCE_APPENDIX_COMPONENT_UNAVAILABLE"
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "B",
    "Annexes financières bancaires",
    theme
  );

  BPB3_ajouterHypothesesVentes_(body,dossier);
  BPB3_ajouterPrevisionsFinancieres_(body,dossier,financialModel);
  BPB3_ajouterRemboursement_(body,dossier,financialModel);
  BPB3_ajouterScenarios_(body,dossier,financialModel);
  BPB3_ajouterAnnexeEcheancier_(body,dossier,financialModel);

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_BANCABLE_FINANCE_APPENDIX_RENDERED",
        {
          version:AG24_PREMIUM_BANCABLE_RENDERER_V1.VERSION,
          dossierId:AG24_PREMIUM_BANCABLE_RENDERER_text_(
            dossier.dossierId
          )
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    moduleId:"bank-financial-appendix"
  };
}

function AG24_PREMIUM_BANCABLE_RENDERER_createPremium_(
  dossier,
  financialModel,
  folder
) {
  if (typeof AG24_PREMIUM_BANCABLE_ADAPTER_build_ !== "function") {
    throw new Error("PREMIUM_BANCABLE_ADAPTER_UNAVAILABLE");
  }
  if (typeof AG24_BP_V2_renderDocument_ !== "function") {
    throw new Error("PREMIUM_V2_RENDERER_UNAVAILABLE");
  }
  if (typeof AG24_BP_VISUAL_FIT_pdf_ !== "function") {
    throw new Error("PREMIUM_PDF_QUALITY_GATE_UNAVAILABLE");
  }
  if (!folder || typeof folder.createFile !== "function") {
    throw new Error("BANCABLE_OUTPUT_FOLDER_REQUIRED");
  }

  var documentId = "";
  var pdfId = "";

  try {
    var adapted =
      AG24_PREMIUM_BANCABLE_ADAPTER_build_(
        dossier,
        financialModel
      );

    var projectName =
      AG24_PREMIUM_BANCABLE_RENDERER_text_(
        dossier && dossier.standard && dossier.standard.nomProjet
      ) || "Projet";

    var dateCode =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || "GMT",
        "yyyy-MM-dd"
      );

    var baseName =
      "Business Plan Financeur Premium - " +
      projectName +
      " - " +
      dateCode;

    if (typeof BPB3_nettoyerNomFichier_ === "function") {
      baseName = BPB3_nettoyerNomFichier_(baseName);
    }

    var doc = DocumentApp.create(baseName);
    documentId = doc.getId();

    var designResult =
      AG24_BP_V2_renderDocument_(
        doc,
        adapted.data,
        {
          themeId:AG24_PREMIUM_BANCABLE_RENDERER_V1.THEME_ID,
          audience:"BANK",
          projectIntelligence:adapted.projectIntelligence,
          beforeClosingRenderer:
            AG24_PREMIUM_BANCABLE_RENDERER_appendFinanceAppendix_,
          extensionContext:{
            dossier:dossier,
            financialModel:financialModel
          }
        }
      );

    doc.saveAndClose();
    Utilities.sleep(900);

    var docFile = DriveApp.getFileById(documentId);
    docFile.moveTo(folder);

    var fitted =
      AG24_BP_VISUAL_FIT_pdf_(
        documentId,
        baseName + ".pdf",
        {
          expectedSemanticPageCount:
            designResult && designResult.pageModelCount
              ? designResult.pageModelCount
              : 15
        }
      );

    var pdfFile =
      folder.createFile(
        fitted.blob.setName(baseName + ".pdf")
      );

    pdfId = pdfFile.getId();

    if (typeof AG24_AUDIT_event_ === "function") {
      try {
        AG24_AUDIT_event_(
          "PREMIUM_BANCABLE_FINANCEUR_RENDERED",
          {
            version:AG24_PREMIUM_BANCABLE_RENDERER_V1.VERSION,
            dossierId:AG24_PREMIUM_BANCABLE_RENDERER_text_(
              dossier && dossier.dossierId
            ),
            documentId:documentId,
            pdfId:pdfId,
            physicalPageCount:
              fitted && fitted.report
                ? fitted.report.physicalPageCount
                : null
          }
        );
      } catch (auditError) {}
    }

    return {
      success:true,
      renderer:"PREMIUM_V2",
      version:AG24_PREMIUM_BANCABLE_RENDERER_V1.VERSION,
      documentId:documentId,
      documentUrl:docFile.getUrl(),
      pdfId:pdfId,
      pdfUrl:pdfFile.getUrl(),
      designResult:designResult,
      visualQualityPdf:fitted ? fitted.report : null
    };

  } catch (error) {
    if (pdfId) {
      try { DriveApp.getFileById(pdfId).setTrashed(true); } catch (e1) {}
    }
    if (documentId) {
      try { DriveApp.getFileById(documentId).setTrashed(true); } catch (e2) {}
    }
    throw error;
  }
}

function AG24_PREMIUM_BANCABLE_RENDERER_createWithFallback_(
  dossier,
  financialModel,
  folder
) {
  try {
    return AG24_PREMIUM_BANCABLE_RENDERER_createPremium_(
      dossier,
      financialModel,
      folder
    );
  } catch (premiumError) {
    if (typeof AG24_AUDIT_event_ === "function") {
      try {
        AG24_AUDIT_event_(
          "PREMIUM_BANCABLE_FINANCEUR_FALLBACK",
          {
            version:AG24_PREMIUM_BANCABLE_RENDERER_V1.VERSION,
            dossierId:AG24_PREMIUM_BANCABLE_RENDERER_text_(
              dossier && dossier.dossierId
            ),
            error:String(
              premiumError && premiumError.message
                ? premiumError.message
                : premiumError
            ).slice(0,240)
          }
        );
      } catch (auditError) {}
    }

    if (typeof BPB3_creerDocumentFinanceur_ !== "function") {
      throw premiumError;
    }

    var legacy =
      BPB3_creerDocumentFinanceur_(
        dossier,
        financialModel,
        folder
      );

    legacy.renderer = "LEGACY_FALLBACK";
    return legacy;
  }
}
