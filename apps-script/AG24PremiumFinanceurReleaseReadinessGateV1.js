/**
 * AfriGreen24 — Premium Financeur Release Readiness Gate V1
 *
 * One command:
 * regression suite -> latest real-data shadow canary -> compact persisted proof.
 */
var AG24_PREMIUM_FINANCEUR_RELEASE_GATE_V1 = Object.freeze({
  VERSION:"1.2.0",
  LAST_RESULT_PROPERTY:"AFRIGREEN24_PREMIUM_FINANCEUR_RELEASE_GATE_LAST"
});

function AG24_PREMIUM_FINANCEUR_RELEASE_GATE_persist_(report) {
  var compact = {
    version:report.version,
    success:report.success,
    blocked:report.blocked,
    state:report.state,
    executedAt:report.executedAt,
    regressionSuccess:report.regressionSuccess,
    regressionVersion:report.regressionVersion,
    regressionPassedTests:report.regressionPassedTests,
    regressionTotalTests:report.regressionTotalTests,
    canarySuccess:report.canarySuccess,
    canaryDossierId:report.canaryDossierId,
    canaryShadowOnly:report.canaryShadowOnly,
    canaryFinalValidationReady:report.canaryFinalValidationReady,
    technicalReleaseReady:report.technicalReleaseReady,
    productionDeliveryGatePreserved:report.productionDeliveryGatePreserved,
    nextCandidateId:report.nextCandidateId,
    nextCandidateProjectName:report.nextCandidateProjectName,
    nextAction:report.nextAction,
    renderer:report.renderer,
    physicalPageCount:report.physicalPageCount,
    cleanupSuccess:report.cleanupSuccess,
    blockingCode:report.blockingCode,
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
    blocked:false,
    state:"RUNNING",
    version:AG24_PREMIUM_FINANCEUR_RELEASE_GATE_V1.VERSION,
    executedAt:new Date().toISOString(),
    regressionSuccess:false,
    regressionVersion:"",
    regressionPassedTests:0,
    regressionTotalTests:0,
    canarySuccess:false,
    canaryDossierId:"",
    canaryShadowOnly:false,
    canaryFinalValidationReady:false,
    technicalReleaseReady:false,
    productionDeliveryGatePreserved:true,
    nextCandidateId:"",
    nextCandidateProjectName:"",
    nextAction:"",
    renderer:"",
    physicalPageCount:0,
    cleanupSuccess:false,
    blockingCode:"",
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
    report.canaryShadowOnly =
      Boolean(canary && canary.shadowOnly === true);
    report.canaryFinalValidationReady =
      Boolean(
        canary &&
        canary.finalValidationReady === true
      );
    report.productionDeliveryGatePreserved = true;
    report.nextCandidateId =
      canary && canary.nextCandidateId
        ? String(canary.nextCandidateId)
        : "";
    report.nextCandidateProjectName =
      canary && canary.nextCandidateProjectName
        ? String(canary.nextCandidateProjectName)
        : "";
    report.nextAction =
      canary && canary.nextAction
        ? String(canary.nextAction)
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
      if (canary && canary.blocked === true) {
        report.blocked = true;
        report.state =
          canary.state || "WAITING_FOR_REAL_DOSSIER";
        report.blockingCode =
          canary.blockingCode || "CANARY_PREREQUISITE_BLOCKED";
        report.failureCode = "";
        return report;
      }

      report.failureCode =
        canary && canary.failureCode
          ? String(canary.failureCode)
          : "PREMIUM_FINANCEUR_CANARY_FAILED";
      throw new Error(report.failureCode);
    }

    report.technicalReleaseReady =
      report.regressionSuccess === true &&
      report.canarySuccess === true &&
      report.renderer === "PREMIUM_V2" &&
      report.cleanupSuccess === true;

    report.success =
      report.technicalReleaseReady === true;

    if (!report.success) {
      report.state = "FAILED";
      report.failureCode =
        "PREMIUM_FINANCEUR_RELEASE_READINESS_FAILED";
    } else {
      report.state = "PASSED";
      report.blocked = false;
    }

  } catch (error) {
    if (!report.failureCode) {
      report.failureCode =
        error && error.message
          ? String(error.message)
          : String(error);
    }

    if (!report.blocked) {
      report.state = "FAILED";
    }
  } finally {
    AG24_PREMIUM_FINANCEUR_RELEASE_GATE_persist_(report);

    if (typeof AG24_AUDIT_event_ === "function") {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "PREMIUM_FINANCEUR_RELEASE_READINESS_PASSED"
            : report.blocked
              ? "PREMIUM_FINANCEUR_RELEASE_READINESS_BLOCKED"
              : "PREMIUM_FINANCEUR_RELEASE_READINESS_FAILED",
          {
            version:report.version,
            state:report.state,
            blocked:report.blocked,
            regressionSuccess:report.regressionSuccess,
            regressionVersion:report.regressionVersion,
            regressionPassedTests:report.regressionPassedTests,
            regressionTotalTests:report.regressionTotalTests,
            canarySuccess:report.canarySuccess,
            canaryDossierId:report.canaryDossierId,
            canaryShadowOnly:report.canaryShadowOnly,
            canaryFinalValidationReady:report.canaryFinalValidationReady,
            technicalReleaseReady:report.technicalReleaseReady,
            productionDeliveryGatePreserved:report.productionDeliveryGatePreserved,
            nextCandidateId:report.nextCandidateId,
            nextCandidateProjectName:report.nextCandidateProjectName,
            nextAction:report.nextAction,
            renderer:report.renderer,
            physicalPageCount:report.physicalPageCount,
            cleanupSuccess:report.cleanupSuccess,
            blockingCode:report.blockingCode,
            failureCode:report.failureCode
          }
        );
      } catch (auditError) {}
    }

    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
