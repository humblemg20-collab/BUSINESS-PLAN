/**
 * AfriGreen24 — OpenAI Smoke Test V1
 *
 * Purpose:
 * Validate the OpenAI transport/configuration path before any Business Plan
 * generation is allowed to depend on it.
 *
 * Contract:
 * - zero Business Plan/customer data sent;
 * - exactly one OpenAI API request per run when configuration is present;
 * - no retry;
 * - store:false;
 * - low-cost deterministic probe;
 * - no API key or raw provider response logged/persisted;
 * - structured failure classification;
 * - last safe report persisted for audit/diagnostics.
 */

const AG24_OPENAI_SMOKE_V1 = Object.freeze({
  VERSION: '1.0.0',
  EXPECTED_TEXT: 'AG24_OPENAI_SMOKE_OK',
  LAST_REPORT_PROPERTY: 'AFRIGREEN24_OPENAI_SMOKE_LAST_REPORT',
  MAX_OUTPUT_TOKENS: 32
});

function AG24_OPENAI_SMOKE_classifyFailureV1_(
  httpStatus,
  providerType,
  providerCode
) {
  const status = Number(httpStatus || 0);
  const type = String(providerType || '').toLowerCase();
  const code = String(providerCode || '').toLowerCase();

  if (status === 401) {
    return 'AUTH';
  }

  if (status === 403) {
    return 'PERMISSION';
  }

  if (status === 404) {
    return 'MODEL_OR_ENDPOINT';
  }

  if (status === 429) {
    return 'QUOTA_OR_RATE_LIMIT';
  }

  if (status >= 500) {
    return 'PROVIDER';
  }

  if (
    code.indexOf('model') !== -1 ||
    type.indexOf('model') !== -1
  ) {
    return 'MODEL';
  }

  if (
    code.indexOf('rate') !== -1 ||
    code.indexOf('quota') !== -1 ||
    type.indexOf('rate') !== -1 ||
    type.indexOf('quota') !== -1
  ) {
    return 'QUOTA_OR_RATE_LIMIT';
  }

  if (status >= 400) {
    return 'HTTP';
  }

  return 'UNKNOWN';
}

function AG24_OPENAI_SMOKE_safeProviderErrorV1_(json) {
  const error =
    json &&
    json.error &&
    typeof json.error === 'object'
      ? json.error
      : {};

  return {
    type: String(error.type || '').slice(0, 120),
    code: String(error.code || '').slice(0, 120),
    param: String(error.param || '').slice(0, 120)
  };
}

function AG24_OPENAI_SMOKE_persistReportV1_(
  report
) {
  const safeReport = {
    success: Boolean(report.success),
    version: String(report.version || ''),
    testedAt: String(report.testedAt || ''),
    provider: String(report.provider || ''),
    configured: Boolean(report.configured),
    model: String(report.model || ''),
    store: false,
    attempts: Number(report.attempts || 0),
    httpStatus: Number(report.httpStatus || 0),
    apiReachable: Boolean(report.apiReachable),
    authValid: Boolean(report.authValid),
    modelValid: Boolean(report.modelValid),
    responseReceived: Boolean(report.responseReceived),
    responseMatched: Boolean(report.responseMatched),
    classification: String(report.classification || ''),
    providerErrorType: String(report.providerErrorType || ''),
    providerErrorCode: String(report.providerErrorCode || ''),
    durationMs: Number(report.durationMs || 0),
    responseId: String(report.responseId || ''),
    inputTokens: Number(report.inputTokens || 0),
    outputTokens: Number(report.outputTokens || 0),
    totalTokens: Number(report.totalTokens || 0)
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_OPENAI_SMOKE_V1.LAST_REPORT_PROPERTY,
      JSON.stringify(safeReport)
    );

  return safeReport;
}

function AG24_OPENAI_SMOKE_logV1_(
  report
) {
  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  if (
    typeof AG24_AUDIT_event_ === 'function'
  ) {
    try {
      AG24_AUDIT_event_(
        report.success
          ? 'OPENAI_SMOKE_TEST_PASSED'
          : 'OPENAI_SMOKE_TEST_FAILED',
        report
      );
    } catch (auditError) {
      // Smoke result must not fail only because optional audit plumbing failed.
    }
  }
}

/**
 * Editor-safe entry point.
 *
 * Sends one tiny probe to the configured OpenAI Responses API.
 * Never logs the key and never sends Business Plan/customer content.
 */
function AG24_OPENAI_SMOKE_TEST_V1() {
  const startedAt =
    Date.now();

  const base = {
    success: false,
    version:
      AG24_OPENAI_SMOKE_V1.VERSION,
    testedAt:
      new Date().toISOString(),
    provider: 'OPENAI',
    configured: false,
    model: '',
    store: false,
    attempts: 0,
    httpStatus: 0,
    apiReachable: false,
    authValid: false,
    modelValid: false,
    responseReceived: false,
    responseMatched: false,
    classification: '',
    providerErrorType: '',
    providerErrorCode: '',
    durationMs: 0,
    responseId: '',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };

  let cfg;

  try {
    cfg =
      AG24_OPENAI_getConfig_();

    base.configured = true;
    base.model =
      String(cfg.model || '');
  } catch (configError) {
    base.classification =
      'CONFIG';
    base.durationMs =
      Date.now() - startedAt;

    const configReport =
      AG24_OPENAI_SMOKE_persistReportV1_(
        base
      );

    AG24_OPENAI_SMOKE_logV1_(
      configReport
    );

    return configReport;
  }

  const payload = {
    model: cfg.model,
    store: false,
    instructions:
      'This is a transport health check. Return exactly the required probe text and nothing else.',
    input:
      'Return exactly: ' +
      AG24_OPENAI_SMOKE_V1.EXPECTED_TEXT,
    reasoning: {
      effort: 'none'
    },
    max_output_tokens:
      AG24_OPENAI_SMOKE_V1.MAX_OUTPUT_TOKENS,
    metadata: {
      product:
        'afrigreen24_business_plan',
      operation:
        'openai_smoke_test_v1'
    }
  };

  let response;

  try {
    base.attempts = 1;

    response =
      UrlFetchApp.fetch(
        AG24_OPENAI_CONFIG.API_URL,
        {
          method: 'post',
          contentType: 'application/json',
          headers: {
            Authorization:
              'Bearer ' +
              cfg.apiKey
          },
          payload:
            JSON.stringify(
              payload
            ),
          muteHttpExceptions: true
        }
      );
  } catch (transportError) {
    base.classification =
      'TRANSPORT';
    base.durationMs =
      Date.now() - startedAt;

    const transportReport =
      AG24_OPENAI_SMOKE_persistReportV1_(
        base
      );

    AG24_OPENAI_SMOKE_logV1_(
      transportReport
    );

    return transportReport;
  }

  base.apiReachable = true;
  base.httpStatus =
    Number(
      response.getResponseCode() ||
      0
    );

  const raw =
    response.getContentText();

  let json;

  try {
    json =
      JSON.parse(
        raw
      );
  } catch (parseError) {
    base.classification =
      'PARSE';
    base.durationMs =
      Date.now() - startedAt;

    const parseReport =
      AG24_OPENAI_SMOKE_persistReportV1_(
        base
      );

    AG24_OPENAI_SMOKE_logV1_(
      parseReport
    );

    return parseReport;
  }

  const safeProviderError =
    AG24_OPENAI_SMOKE_safeProviderErrorV1_(
      json
    );

  base.providerErrorType =
    safeProviderError.type;
  base.providerErrorCode =
    safeProviderError.code;

  if (
    base.httpStatus < 200 ||
    base.httpStatus >= 300
  ) {
    base.classification =
      AG24_OPENAI_SMOKE_classifyFailureV1_(
        base.httpStatus,
        safeProviderError.type,
        safeProviderError.code
      );

    base.authValid =
      base.httpStatus !== 401;

    base.modelValid =
      base.classification !== 'MODEL' &&
      base.classification !== 'MODEL_OR_ENDPOINT';

    base.durationMs =
      Date.now() - startedAt;

    const httpReport =
      AG24_OPENAI_SMOKE_persistReportV1_(
        base
      );

    AG24_OPENAI_SMOKE_logV1_(
      httpReport
    );

    return httpReport;
  }

  base.authValid = true;
  base.modelValid = true;
  base.responseReceived = true;
  base.responseId =
    String(
      json.id || ''
    ).slice(0, 160);

  const outputText =
    AG24_OPENAI_extractOutputText_(
      json
    );

  base.responseMatched =
    String(
      outputText || ''
    ).trim() ===
    AG24_OPENAI_SMOKE_V1.EXPECTED_TEXT;

  const usage =
    json.usage || {};

  base.inputTokens =
    Number(
      usage.input_tokens ||
      0
    );

  base.outputTokens =
    Number(
      usage.output_tokens ||
      0
    );

  base.totalTokens =
    Number(
      usage.total_tokens ||
      0
    );

  base.durationMs =
    Date.now() - startedAt;

  if (!base.responseMatched) {
    base.classification =
      'RESPONSE_MISMATCH';

    const mismatchReport =
      AG24_OPENAI_SMOKE_persistReportV1_(
        base
      );

    AG24_OPENAI_SMOKE_logV1_(
      mismatchReport
    );

    return mismatchReport;
  }

  base.success = true;
  base.classification = 'PASS';

  const report =
    AG24_OPENAI_SMOKE_persistReportV1_(
      base
    );

  AG24_OPENAI_SMOKE_logV1_(
    report
  );

  return report;
}

function AG24_OPENAI_SMOKE_LAST_REPORT_V1() {
  const raw =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_OPENAI_SMOKE_V1.LAST_REPORT_PROPERTY
      );

  if (!raw) {
    return {
      success: false,
      classification: 'NO_REPORT'
    };
  }

  return JSON.parse(raw);
}
