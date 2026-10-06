/**
 * AfriGreen24 — Premium Production Acceptance V1
 *
 * Deterministic post-generation acceptance evaluator.
 * It does not generate, mutate business truth, call AI, or call external APIs.
 */
var AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_PHYSICAL_PAGES:26,
  LAST_RESULT_PROPERTY:"AFRIGREEN24_PREMIUM_PRODUCTION_ACCEPTANCE_LAST"
});

function AG24_PREMIUM_ACCEPTANCE_evaluate_(generation, context) {
  generation = generation || {};
  context = context || {};

  var checks = [];
  var failures = [];

  function check_(id, pass, details) {
    var item = {
      id:String(id || ""),
      pass:Boolean(pass),
      details:details || {}
    };
    checks.push(item);
    if (!item.pass) failures.push(item.id);
  }

  check_(
    "STATUS",
    generation.statut === "FINANCEUR_GENERE",
    {value:String(generation.statut || "")}
  );

  check_(
    "TYPE",
    generation.typeDocument === "BUSINESS_PLAN_FINANCEUR",
    {value:String(generation.typeDocument || "")}
  );

  check_(
    "RENDERER",
    generation.documentRenderer === "PREMIUM_V2",
    {value:String(generation.documentRenderer || "")}
  );

  check_(
    "NO_FALLBACK",
    generation.premiumFallbackUsed !== true,
    {value:Boolean(generation.premiumFallbackUsed)}
  );

  check_(
    "PDF_ID",
    Boolean(String(generation.pdfId || "").trim()),
    {}
  );

  check_(
    "DOCUMENT_ID",
    Boolean(String(generation.documentId || "").trim()),
    {}
  );

  var pages = Number(generation.physicalPageCount || 0);

  check_(
    "PHYSICAL_PAGES",
    Number.isFinite(pages) &&
      pages > 0 &&
      pages <= AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1.MAX_PHYSICAL_PAGES,
    {
      value:pages,
      max:AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1.MAX_PHYSICAL_PAGES
    }
  );

  check_(
    "NARRATIVE_ENGINE",
    generation.moteurRedaction === "OPENAI" ||
      generation.moteurRedaction === "SECOURS_DETERMINISTE",
    {value:String(generation.moteurRedaction || "")}
  );

  var dashboardExpected =
    Boolean(context.dashboardExpected === true);

  var dashboardSync =
    generation.dashboardSync &&
    typeof generation.dashboardSync === "object"
      ? generation.dashboardSync
      : {};

  check_(
    "DASHBOARD_SYNC",
    dashboardExpected
      ? dashboardSync.success === true
      : (
          dashboardSync.success === true ||
          dashboardSync.skipped === true
        ),
    {
      expected:dashboardExpected,
      success:Boolean(dashboardSync.success),
      skipped:Boolean(dashboardSync.skipped),
      error:String(dashboardSync.error || "")
    }
  );

  var driveVerified = true;

  if (context.verifyDriveFiles === true) {
    try {
      var pdfFile =
        DriveApp.getFileById(
          String(generation.pdfId || "")
        );

      var docFile =
        DriveApp.getFileById(
          String(generation.documentId || "")
        );

      driveVerified =
        pdfFile.getBlob().getBytes().length > 1000 &&
        Boolean(docFile.getName());
    } catch (error) {
      driveVerified = false;
    }

    check_(
      "DRIVE_FILES",
      driveVerified,
      {}
    );
  }

  var report = {
    success:failures.length === 0,
    version:AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1.VERSION,
    evaluatedAt:new Date().toISOString(),
    dossierId:String(generation.dossierId || ""),
    projectName:String(generation.nomProjet || ""),
    renderer:String(generation.documentRenderer || ""),
    physicalPageCount:pages,
    dashboardExpected:dashboardExpected,
    dashboardSuccess:Boolean(dashboardSync.success),
    driveVerified:driveVerified,
    checks:checks,
    failures:failures,
    failureCode:
      failures.length
        ? "PREMIUM_PRODUCTION_ACCEPTANCE_FAILED"
        : ""
  };

  return report;
}

function AG24_PREMIUM_ACCEPTANCE_record_(report) {
  report = report || {};

  var compact = {
    success:Boolean(report.success),
    version:String(report.version || ""),
    evaluatedAt:String(report.evaluatedAt || ""),
    dossierId:String(report.dossierId || ""),
    projectName:String(report.projectName || ""),
    renderer:String(report.renderer || ""),
    physicalPageCount:Number(report.physicalPageCount || 0),
    dashboardExpected:Boolean(report.dashboardExpected),
    dashboardSuccess:Boolean(report.dashboardSuccess),
    driveVerified:Boolean(report.driveVerified),
    failures:Array.isArray(report.failures)
      ? report.failures.slice()
      : [],
    failureCode:String(report.failureCode || "")
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1.LAST_RESULT_PROPERTY,
      JSON.stringify(compact)
    );

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        compact.success
          ? "PREMIUM_PRODUCTION_ACCEPTANCE_PASSED"
          : "PREMIUM_PRODUCTION_ACCEPTANCE_FAILED",
        compact
      );
    } catch (auditError) {}
  }

  return compact;
}

function AG24_PREMIUM_PRODUCTION_ACCEPTANCE_SYSTEM_TEST_V1() {
  var base = {
    statut:"FINANCEUR_GENERE",
    typeDocument:"BUSINESS_PLAN_FINANCEUR",
    dossierId:"BPB_ACCEPTANCE_TEST",
    nomProjet:"Acceptance Fixture",
    moteurRedaction:"OPENAI",
    documentId:"DOC_TEST",
    pdfId:"PDF_TEST",
    documentRenderer:"PREMIUM_V2",
    premiumFallbackUsed:false,
    premiumRendererVersion:"1.0.0",
    physicalPageCount:20,
    dashboardSync:{
      success:true
    }
  };

  var pass =
    AG24_PREMIUM_ACCEPTANCE_evaluate_(
      base,
      {
        dashboardExpected:true,
        verifyDriveFiles:false
      }
    );

  var fallback =
    AG24_PREMIUM_ACCEPTANCE_evaluate_(
      Object.assign({},base,{
        documentRenderer:"LEGACY_FALLBACK",
        premiumFallbackUsed:true
      }),
      {
        dashboardExpected:true,
        verifyDriveFiles:false
      }
    );

  var dashboardFailure =
    AG24_PREMIUM_ACCEPTANCE_evaluate_(
      Object.assign({},base,{
        dashboardSync:{
          success:false,
          error:"fixture"
        }
      }),
      {
        dashboardExpected:true,
        verifyDriveFiles:false
      }
    );

  var report = {
    success:
      pass.success === true &&
      fallback.success === false &&
      fallback.failures.indexOf("RENDERER") !== -1 &&
      fallback.failures.indexOf("NO_FALLBACK") !== -1 &&
      dashboardFailure.success === false &&
      dashboardFailure.failures.indexOf("DASHBOARD_SYNC") !== -1,
    version:AG24_PREMIUM_PRODUCTION_ACCEPTANCE_V1.VERSION,
    passingFixtureAccepted:pass.success === true,
    fallbackRejected:fallback.success === false,
    dashboardFailureRejected:dashboardFailure.success === false,
    failureCode:""
  };

  if (!report.success) {
    report.failureCode =
      "PREMIUM_PRODUCTION_ACCEPTANCE_CONTRACT_FAILED";
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
