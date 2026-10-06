/**
 * AfriGreen24 — Financeur Production Route Test V1
 *
 * Verifies the real production routing helper selects the Premium renderer
 * while preserving cleanup and PDF generation.
 */
var AG24_FINANCEUR_PRODUCTION_ROUTE_TEST_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_FINANCEUR_PRODUCTION_ROUTE_SYSTEM_TEST_V1() {
  var folderId = "";
  var documentId = "";
  var pdfId = "";

  var report = {
    success:false,
    version:AG24_FINANCEUR_PRODUCTION_ROUTE_TEST_V1.VERSION,
    routerAvailable:false,
    renderer:"",
    premiumSelected:false,
    pdfCreated:false,
    physicalPageCount:0,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    report.routerAvailable =
      typeof BPB3_creerDocumentFinanceurRoute_ === "function";

    if (!report.routerAvailable) {
      throw new Error(
        "FINANCEUR_PRODUCTION_ROUTER_UNAVAILABLE"
      );
    }

    if (
      typeof AG24_PREMIUM_BANCABLE_RENDERER_TEST_fixture_ !==
        "function"
    ) {
      throw new Error(
        "BANCABLE_RENDERER_FIXTURE_UNAVAILABLE"
      );
    }

    var fixture =
      AG24_PREMIUM_BANCABLE_RENDERER_TEST_fixture_();

    var folder =
      DriveApp.createFolder(
        "AG24 Financeur Route Test " +
        String(new Date().getTime())
      );

    folderId = folder.getId();

    var result =
      BPB3_creerDocumentFinanceurRoute_(
        fixture.dossier,
        fixture.financialModel,
        folder
      );

    documentId = result.documentId || "";
    pdfId = result.pdfId || "";
    report.renderer = String(result.renderer || "");

    report.premiumSelected =
      report.renderer === "PREMIUM_V2";

    report.pdfCreated =
      Boolean(
        pdfId &&
        DriveApp.getFileById(pdfId)
          .getBlob()
          .getBytes()
          .length > 1000
      );

    report.physicalPageCount =
      result.visualQualityPdf &&
      result.visualQualityPdf.physicalPageCount
        ? Number(
            result.visualQualityPdf.physicalPageCount
          )
        : 0;

    report.success =
      report.routerAvailable === true &&
      report.premiumSelected === true &&
      report.pdfCreated === true &&
      report.physicalPageCount > 0;

    if (!report.success) {
      report.failureCode =
        "FINANCEUR_PRODUCTION_ROUTE_CONTRACT_FAILED";
    }

  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);

  } finally {
    if (pdfId) {
      try {
        DriveApp.getFileById(pdfId).setTrashed(true);
      } catch (e1) {}
    }

    if (documentId) {
      try {
        DriveApp.getFileById(documentId).setTrashed(true);
      } catch (e2) {}
    }

    if (folderId) {
      try {
        var folder = DriveApp.getFolderById(folderId);
        var files = folder.getFiles();

        while (files.hasNext()) {
          files.next().setTrashed(true);
        }

        folder.setTrashed(true);

        report.cleanupSuccess =
          folder.isTrashed() === true;
      } catch (e3) {
        report.cleanupSuccess = false;
      }
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    Logger.log(
      JSON.stringify(report,null,2)
    );
  }

  return report;
}
