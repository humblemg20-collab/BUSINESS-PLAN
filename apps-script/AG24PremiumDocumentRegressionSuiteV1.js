/**
 * AfriGreen24 — Premium Document Regression Suite V1
 *
 * One-command regression gate for the validated premium document stack.
 * Deterministic orchestration; individual tests keep their own cleanup.
 */
var AG24_PREMIUM_REGRESSION_V1 = Object.freeze({
  VERSION:"1.13.0"
});

function AG24_PREMIUM_REGRESSION_RUN_TEST_(name, fn) {
  var startedAt = new Date().toISOString();

  try {
    if (typeof fn !== "function") {
      return {
        name:name,
        success:false,
        startedAt:startedAt,
        failureCode:"TEST_FUNCTION_UNAVAILABLE"
      };
    }

    var result = fn();

    return {
      name:name,
      success:
        result === true ||
        Boolean(result && result.success === true),
      startedAt:startedAt,
      result:result
    };
  } catch (error) {
    return {
      name:name,
      success:false,
      startedAt:startedAt,
      failureCode:
        error && error.message
          ? String(error.message)
          : String(error)
    };
  }
}

function AG24_PREMIUM_REGRESSION_failureCode_(step) {
  return (
    step &&
    (
      step.failureCode ||
      (
        step.result &&
        step.result.failureCode
          ? step.result.failureCode
          : ""
      )
    )
  ) || "";
}

function AG24_PREMIUM_REGRESSION_isDocsQuota_(value) {
  var text = String(value || "").toLowerCase();

  return (
    text.indexOf("service invoked too many times for one day: docs create") !== -1 ||
    (
      text.indexOf("docs create") !== -1 &&
      text.indexOf("too many times") !== -1
    )
  );
}

function AG24_PREMIUM_REGRESSION_testCatalog_() {
  return [
    ["PROJECT_INTELLIGENCE_V1_3","PURE",
      typeof runAg24ProjectIntelligenceAllTestsV1_3 === "function"
        ? runAg24ProjectIntelligenceAllTestsV1_3 : null],
    ["PREMIUM_DOCUMENT_SPEC","PURE",
      typeof AG24_PREMIUM_DOC_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_DOC_SYSTEM_TEST_V1 : null],
    ["FINANCIAL_STORY","PURE",
      typeof AG24_PREMIUM_FIN_STORY_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FIN_STORY_SYSTEM_TEST_V1 : null],
    ["AUDIENCE_COMPOSER","PURE",
      typeof AG24_PREMIUM_AUDIENCE_COMPOSER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_AUDIENCE_COMPOSER_SYSTEM_TEST_V1 : null],
    ["BANCABLE_ADAPTER","PURE",
      typeof AG24_PREMIUM_BANCABLE_ADAPTER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_BANCABLE_ADAPTER_SYSTEM_TEST_V1 : null],
    ["FINANCEUR_CANARY_SELECTION","PURE",
      typeof AG24_PREMIUM_FINANCEUR_CANARY_SELECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FINANCEUR_CANARY_SELECTION_SYSTEM_TEST_V1 : null],
    ["DASHBOARD_SYNC_CANONICAL","PURE",
      typeof BP_DASHBOARD_SYNC_CANONICAL_SYSTEM_TEST_V1 === "function"
        ? BP_DASHBOARD_SYNC_CANONICAL_SYSTEM_TEST_V1 : null],
    ["PRODUCTION_ACCEPTANCE","PURE",
      typeof AG24_PREMIUM_PRODUCTION_ACCEPTANCE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_PRODUCTION_ACCEPTANCE_SYSTEM_TEST_V1 : null],
    ["REFERENCE_BENCHMARK","PURE",
      typeof AG24_BP_REFERENCE_SYSTEM_TEST_V1 === "function"
        ? AG24_BP_REFERENCE_SYSTEM_TEST_V1 : null],
    ["IMPORTED_DOCUMENT_CONTEXT","PURE",
      typeof AG24_IMPORTED_DOCUMENT_CONTEXT_SYSTEM_TEST_V1 === "function"
        ? AG24_IMPORTED_DOCUMENT_CONTEXT_SYSTEM_TEST_V1 : null],
    ["BANCABLE_GAP_ONLY","PURE",
      typeof AG24_BANCABLE_GAP_ONLY_SYSTEM_TEST_V1 === "function"
        ? AG24_BANCABLE_GAP_ONLY_SYSTEM_TEST_V1 : null],

    ["FLOW_PAGINATION","DOCS",
      typeof AG24_BP_FLOW_PAGINATION_SYSTEM_TEST_V1 === "function"
        ? AG24_BP_FLOW_PAGINATION_SYSTEM_TEST_V1 : null],
    ["METRIC_STRIP","DOCS",
      typeof AG24_PREMIUM_METRIC_STRIP_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_METRIC_STRIP_SYSTEM_TEST_V1 : null],
    ["EXECUTIVE_SNAPSHOT","DOCS",
      typeof AG24_PREMIUM_SNAPSHOT_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_SNAPSHOT_SYSTEM_TEST_V1 : null],
    ["EVIDENCE_CARD","DOCS",
      typeof AG24_PREMIUM_EVIDENCE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_SYSTEM_TEST_V1 : null],
    ["EVIDENCE_BRIDGE","DOCS",
      typeof AG24_PREMIUM_EVIDENCE_BRIDGE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_BRIDGE_SYSTEM_TEST_V1 : null],
    ["COMPETITION_SECTION","DOCS",
      typeof AG24_PREMIUM_COMPETITION_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_COMPETITION_SECTION_SYSTEM_TEST_V1 : null],
    ["TRACTION_SECTION","DOCS",
      typeof AG24_PREMIUM_TRACTION_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_TRACTION_SECTION_SYSTEM_TEST_V1 : null],
    ["TEAM_GOVERNANCE_SECTION","DOCS",
      typeof AG24_PREMIUM_TEAM_GOV_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_TEAM_GOV_SECTION_SYSTEM_TEST_V1 : null],
    ["FINANCIAL_STORY_SECTION","DOCS",
      typeof AG24_PREMIUM_FIN_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FIN_SECTION_SYSTEM_TEST_V1 : null],
    ["RISK_MATRIX","DOCS",
      typeof AG24_PREMIUM_RISK_MATRIX_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_RISK_MATRIX_SYSTEM_TEST_V1 : null],
    ["RISK_SECTION","DOCS",
      typeof AG24_PREMIUM_RISK_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_RISK_SECTION_SYSTEM_TEST_V1 : null],
    ["EVIDENCE_APPENDIX","DOCS",
      typeof AG24_PREMIUM_EVIDENCE_APPENDIX_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_APPENDIX_SYSTEM_TEST_V1 : null],
    ["PREMIUM_VISUALS","DOCS",
      typeof AG24_PREMIUM_VISUALS_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_VISUALS_SYSTEM_TEST_V1 : null],
    ["AUDIENCE_INTEGRATION","DOCS",
      typeof AG24_PREMIUM_AUDIENCE_INTEGRATION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_AUDIENCE_INTEGRATION_SYSTEM_TEST_V1 : null],
    ["BANCABLE_PREMIUM_RENDERER","DOCS",
      typeof AG24_PREMIUM_BANCABLE_RENDERER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_BANCABLE_RENDERER_SYSTEM_TEST_V1 : null],
    ["FINANCEUR_PRODUCTION_ROUTE","DOCS",
      typeof AG24_FINANCEUR_PRODUCTION_ROUTE_SYSTEM_TEST_V1 === "function"
        ? AG24_FINANCEUR_PRODUCTION_ROUTE_SYSTEM_TEST_V1 : null],
    ["DOCUMENT_HARDENING","DOCS",
      typeof AG24_PREMIUM_DOCUMENT_HARDENING_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_DOCUMENT_HARDENING_SYSTEM_TEST_V1 : null],
    ["REAL_WORLD_QA","DOCS",
      typeof AG24_PREMIUM_REALWORLD_QA_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_REALWORLD_QA_SYSTEM_TEST_V1 : null],
    ["BANK_REFERENCE_COMPONENTS","DOCS",
      typeof AG24_BANK_REFERENCE_COMPONENTS_SYSTEM_TEST_V1 === "function"
        ? AG24_BANK_REFERENCE_COMPONENTS_SYSTEM_TEST_V1 : null]
  ];
}

function AG24_PREMIUM_DOCUMENT_REGRESSION_CORE_V1() {
  var tests =
    AG24_PREMIUM_REGRESSION_testCatalog_()
      .filter(function(test) {
        return test[1] === "PURE";
      });

  var steps = tests.map(function(test) {
    return AG24_PREMIUM_REGRESSION_RUN_TEST_(
      test[0],
      test[2]
    );
  });

  var failed = steps.filter(function(step) {
    return step.success !== true;
  });

  var report = {
    success:failed.length === 0,
    blocked:false,
    state:
      failed.length === 0
        ? "PASS"
        : "FAIL",
    version:
      AG24_PREMIUM_REGRESSION_V1.VERSION,
    mode:"CORE_NO_DOCS",
    totalTests:steps.length,
    passedTests:steps.length - failed.length,
    failedTests:failed.length,
    failures:failed.map(function(step) {
      return {
        name:step.name,
        failureCode:
          AG24_PREMIUM_REGRESSION_failureCode_(step) ||
          "TEST_FAILED"
      };
    })
  };

  Logger.log(JSON.stringify(report,null,2));
  return report;
}

function AG24_PREMIUM_DOCUMENT_REGRESSION_SUITE_V1() {
  var tests =
    AG24_PREMIUM_REGRESSION_testCatalog_();

  var steps = [];
  var blockedByQuota = false;
  var blockedAt = "";
  var skipped = [];

  for (var index=0; index<tests.length; index++) {
    var test = tests[index];
    var name = test[0];
    var kind = test[1];
    var fn = test[2];

    if (
      blockedByQuota &&
      kind === "DOCS"
    ) {
      skipped.push({
        name:name,
        reason:"GOOGLE_DOCS_DAILY_CREATE_QUOTA"
      });
      continue;
    }

    var step =
      AG24_PREMIUM_REGRESSION_RUN_TEST_(
        name,
        fn
      );

    var failureCode =
      AG24_PREMIUM_REGRESSION_failureCode_(
        step
      );

    if (
      step.success !== true &&
      AG24_PREMIUM_REGRESSION_isDocsQuota_(
        failureCode
      )
    ) {
      blockedByQuota = true;
      blockedAt = name;

      step.infrastructureBlocked = true;
      step.success = null;
      step.failureCode =
        "GOOGLE_DOCS_DAILY_CREATE_QUOTA";

      skipped.push({
        name:name,
        reason:"GOOGLE_DOCS_DAILY_CREATE_QUOTA"
      });

      continue;
    }

    steps.push(step);
  }

  var failed = steps.filter(function(step) {
    return step.success !== true;
  });

  var passed = steps.filter(function(step) {
    return step.success === true;
  });

  var report = {
    success:
      failed.length === 0 &&
      blockedByQuota !== true,
    blocked:
      blockedByQuota === true,
    state:
      blockedByQuota
        ? "BLOCKED_GOOGLE_DOCS_DAILY_QUOTA"
        : (
            failed.length === 0
              ? "PASS"
              : "FAIL"
          ),
    version:
      AG24_PREMIUM_REGRESSION_V1.VERSION,
    totalTests:tests.length,
    completedTests:steps.length,
    passedTests:passed.length,
    failedTests:failed.length,
    skippedTests:skipped.length,
    blockedAt:blockedAt,
    nextAction:
      blockedByQuota
        ? "Ne pas relancer les tests DOCS aujourd’hui. Relancer après rétablissement du quota Google Docs."
        : "",
    failures:failed.map(function(step) {
      return {
        name:step.name,
        failureCode:
          AG24_PREMIUM_REGRESSION_failureCode_(step) ||
          "TEST_FAILED"
      };
    }),
    skipped:skipped,
    steps:steps.map(function(step) {
      return {
        name:step.name,
        success:step.success,
        failureCode:
          AG24_PREMIUM_REGRESSION_failureCode_(step)
      };
    })
  };

  if (
    typeof AG24_AUDIT_event_ ===
    "function"
  ) {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_DOCUMENT_REGRESSION_SUITE_COMPLETED",
        {
          version:report.version,
          success:report.success,
          totalTests:report.totalTests,
          passedTests:report.passedTests,
          failedTests:report.failedTests,
          failures:report.failures
        }
      );
    } catch (auditError) {}
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
