/**
 * AfriGreen24 — Premium Document Regression Suite V1
 *
 * One-command regression gate for the validated premium document stack.
 * Deterministic orchestration; individual tests keep their own cleanup.
 */
var AG24_PREMIUM_REGRESSION_V1 = Object.freeze({
  VERSION:"1.11.0"
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

function AG24_PREMIUM_DOCUMENT_REGRESSION_SUITE_V1() {
  var tests = [
    [
      "PROJECT_INTELLIGENCE_V1_3",
      typeof runAg24ProjectIntelligenceAllTestsV1_3 === "function"
        ? runAg24ProjectIntelligenceAllTestsV1_3
        : null
    ],
    [
      "PREMIUM_DOCUMENT_SPEC",
      typeof AG24_PREMIUM_DOC_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_DOC_SYSTEM_TEST_V1
        : null
    ],
    [
      "FLOW_PAGINATION",
      typeof AG24_BP_FLOW_PAGINATION_SYSTEM_TEST_V1 === "function"
        ? AG24_BP_FLOW_PAGINATION_SYSTEM_TEST_V1
        : null
    ],
    [
      "FINANCIAL_STORY",
      typeof AG24_PREMIUM_FIN_STORY_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FIN_STORY_SYSTEM_TEST_V1
        : null
    ],
    [
      "METRIC_STRIP",
      typeof AG24_PREMIUM_METRIC_STRIP_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_METRIC_STRIP_SYSTEM_TEST_V1
        : null
    ],
    [
      "EXECUTIVE_SNAPSHOT",
      typeof AG24_PREMIUM_SNAPSHOT_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_SNAPSHOT_SYSTEM_TEST_V1
        : null
    ],
    [
      "EVIDENCE_CARD",
      typeof AG24_PREMIUM_EVIDENCE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_SYSTEM_TEST_V1
        : null
    ],
    [
      "EVIDENCE_BRIDGE",
      typeof AG24_PREMIUM_EVIDENCE_BRIDGE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_BRIDGE_SYSTEM_TEST_V1
        : null
    ],
    [
      "COMPETITION_SECTION",
      typeof AG24_PREMIUM_COMPETITION_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_COMPETITION_SECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "TRACTION_SECTION",
      typeof AG24_PREMIUM_TRACTION_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_TRACTION_SECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "TEAM_GOVERNANCE_SECTION",
      typeof AG24_PREMIUM_TEAM_GOV_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_TEAM_GOV_SECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "FINANCIAL_STORY_SECTION",
      typeof AG24_PREMIUM_FIN_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FIN_SECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "RISK_MATRIX",
      typeof AG24_PREMIUM_RISK_MATRIX_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_RISK_MATRIX_SYSTEM_TEST_V1
        : null
    ],
    [
      "RISK_SECTION",
      typeof AG24_PREMIUM_RISK_SECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_RISK_SECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "EVIDENCE_APPENDIX",
      typeof AG24_PREMIUM_EVIDENCE_APPENDIX_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_EVIDENCE_APPENDIX_SYSTEM_TEST_V1
        : null
    ],
    [
      "PREMIUM_VISUALS",
      typeof AG24_PREMIUM_VISUALS_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_VISUALS_SYSTEM_TEST_V1
        : null
    ],
    [
      "AUDIENCE_COMPOSER",
      typeof AG24_PREMIUM_AUDIENCE_COMPOSER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_AUDIENCE_COMPOSER_SYSTEM_TEST_V1
        : null
    ],
    [
      "AUDIENCE_INTEGRATION",
      typeof AG24_PREMIUM_AUDIENCE_INTEGRATION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_AUDIENCE_INTEGRATION_SYSTEM_TEST_V1
        : null
    ],
    [
      "BANCABLE_ADAPTER",
      typeof AG24_PREMIUM_BANCABLE_ADAPTER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_BANCABLE_ADAPTER_SYSTEM_TEST_V1
        : null
    ],
    [
      "BANCABLE_PREMIUM_RENDERER",
      typeof AG24_PREMIUM_BANCABLE_RENDERER_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_BANCABLE_RENDERER_SYSTEM_TEST_V1
        : null
    ],
    [
      "FINANCEUR_PRODUCTION_ROUTE",
      typeof AG24_FINANCEUR_PRODUCTION_ROUTE_SYSTEM_TEST_V1 === "function"
        ? AG24_FINANCEUR_PRODUCTION_ROUTE_SYSTEM_TEST_V1
        : null
    ],
    [
      "FINANCEUR_CANARY_SELECTION",
      typeof AG24_PREMIUM_FINANCEUR_CANARY_SELECTION_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_FINANCEUR_CANARY_SELECTION_SYSTEM_TEST_V1
        : null
    ],
    [
      "DASHBOARD_SYNC_CANONICAL",
      typeof BP_DASHBOARD_SYNC_CANONICAL_SYSTEM_TEST_V1 === "function"
        ? BP_DASHBOARD_SYNC_CANONICAL_SYSTEM_TEST_V1
        : null
    ],
    [
      "PRODUCTION_ACCEPTANCE",
      typeof AG24_PREMIUM_PRODUCTION_ACCEPTANCE_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_PRODUCTION_ACCEPTANCE_SYSTEM_TEST_V1
        : null
    ],
    [
      "DOCUMENT_HARDENING",
      typeof AG24_PREMIUM_DOCUMENT_HARDENING_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_DOCUMENT_HARDENING_SYSTEM_TEST_V1
        : null
    ],
    [
      "REAL_WORLD_QA",
      typeof AG24_PREMIUM_REALWORLD_QA_SYSTEM_TEST_V1 === "function"
        ? AG24_PREMIUM_REALWORLD_QA_SYSTEM_TEST_V1
        : null
    ]
  ];

  var steps = tests.map(function(test) {
    return AG24_PREMIUM_REGRESSION_RUN_TEST_(
      test[0],
      test[1]
    );
  });

  var failed = steps.filter(function(step) {
    return step.success !== true;
  });

  var report = {
    success:failed.length === 0,
    version:AG24_PREMIUM_REGRESSION_V1.VERSION,
    totalTests:steps.length,
    passedTests:steps.length - failed.length,
    failedTests:failed.length,
    failures:failed.map(function(step) {
      return {
        name:step.name,
        failureCode:
          step.failureCode ||
          (
            step.result &&
            step.result.failureCode
              ? step.result.failureCode
              : "TEST_FAILED"
          )
      };
    }),
    steps:steps.map(function(step) {
      return {
        name:step.name,
        success:step.success,
        failureCode:
          step.failureCode ||
          (
            step.result &&
            step.result.failureCode
              ? step.result.failureCode
              : ""
          )
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
