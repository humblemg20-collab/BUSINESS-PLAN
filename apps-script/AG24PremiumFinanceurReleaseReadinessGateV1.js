/**
 * AfriGreen24 — Premium Financeur Release Readiness Gate V1
 *
 * One command:
 * regression suite -> latest real-data shadow canary -> compact persisted proof.
 */
var AG24_PREMIUM_FINANCEUR_RELEASE_GATE_V1 = Object.freeze({
  VERSION:"1.0.0",
  LAST_RESULT_PROPERTY:"AFRIGREEN24_PREMIUM_FINANCEUR_RELEASE_GATE_LAST"
});

function AG24_PREMIUM_FINANCEUR_RELEASE_GATE_persist_(report) {
  var compact = {
    version:report.version,
    success:report.success,
    executedAt:report.executedAt,
    regressionSuccess:report.regressionSuccess,
    regressionVersion:report.regressionVersion,
    regressionPassedTests:report.regressionPassedTests,
    regressionTotalTests:report.regressionTotalTests,
    canarySuccess:report.canarySuccess,
    canaryDossierId:report.canaryDossierId,
    renderer:report.renderer,
    physicalPageCount:report.physicalPageCount,
    cleanupSuccess:report.cleanupSuccess,
    failureCode:report.failureCode
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_PREMIUM_FINANCEUR_RELEASE_GATE_V1.LAST_RESULT_PROPERTY,
      JSON.stringify(compact)
    );
}

function runAg24PremiumFinanceurReleaseReadinessGateV1() {
  var report = {
    success:false,
    version:AG24_PREMIUM_FINANCEUR_RELEASE_GATE_V1.VERSION,
    executedAt:new Date().toISOString(),
    regressionSuccess:false,
    regressionVersion:"",
    regressionPassedTests:0,
    regressionTotalTests:0,
    canarySuccess:false,
    canaryDossierId:"",
    renderer:"",
    physicalPageCount:0,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    if (
      typeof AG24_PREMIUM_DOCUMENT_REGRESSION_SUITE_V1 !== "function"
    ) {
      throw new Error("PREMIUM_REGRESSION_SUITE_UNAVAILABLE");
    }

    var regression =
      AG24_PREMIUM_DOCUMENT_REGRESSION_SUITE_V1();

    report.regressionSuccess =
      Boolean(regression && regression.success === true);
    report.regressionVersion =
      regression && regression.version
        ? String(regression.version)
        : "";
    report.regressionPassedTests =
      regression && regression.passedTests
        ? Number(regression.passedTests)
        : 0;
    report.regressionTotalTests =
      regression && regression.totalTests
        ? Number(regression.totalTests)
        : 0;

    if (!report.regressionSuccess) {
      throw new Error("PREMIUM_REGRESSION_GATE_FAILED");
    }

    if (
      typeof runAg24PremiumFinanceurLatestCanaryV1 !== "function"
    ) {
      throw new Error("PREMIUM_FINANCEUR_CANARY_UNAVAILABLE");
    }

    var canary =
      runAg24PremiumFinanceurLatestCanaryV1();

    report.canarySuccess =
      Boolean(canary && canary.success === true);
    report.canaryDossierId =
      canary && canary.dossierId
        ? String(canary.dossierId)
        : "";
    report.renderer =
      canary && canary.renderer
        ? String(canary.renderer)
        : "";
    report.physicalPageCount =
      canary && canary.physicalPageCount
        ? Number(canary.physicalPageCount)
        : 0;
    report.cleanupSuccess =
      Boolean(canary && canary.cleanupSuccess === true);

    if (!report.canarySuccess) {
      report.failureCode =
        canary && canary.failureCode
          ? String(canary.failureCode)
          : "PREMIUM_FINANCEUR_CANARY_FAILED";
      throw new Error(report.failureCode);
    }

    report.success =
      report.regressionSuccess === true &&
      report.canarySuccess === true &&
      report.renderer === "PREMIUM_V2" &&
      report.cleanupSuccess === true;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_FINANCEUR_RELEASE_READINESS_FAILED";
    }

  } catch (error) {
    if (!report.failureCode) {
      report.failureCode =
        error && error.message
          ? String(error.message)
          : String(error);
    }
  } finally {
    AG24_PREMIUM_FINANCEUR_RELEASE_GATE_persist_(report);

    if (typeof AG24_AUDIT_event_ === "function") {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "PREMIUM_FINANCEUR_RELEASE_READINESS_PASSED"
            : "PREMIUM_FINANCEUR_RELEASE_READINESS_FAILED",
          {
            version:report.version,
            regressionSuccess:report.regressionSuccess,
            regressionVersion:report.regressionVersion,
            regressionPassedTests:report.regressionPassedTests,
            regressionTotalTests:report.regressionTotalTests,
            canarySuccess:report.canarySuccess,
            canaryDossierId:report.canaryDossierId,
            renderer:report.renderer,
            physicalPageCount:report.physicalPageCount,
            cleanupSuccess:report.cleanupSuccess,
            failureCode:report.failureCode
          }
        );
      } catch (auditError) {}
    }

    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
