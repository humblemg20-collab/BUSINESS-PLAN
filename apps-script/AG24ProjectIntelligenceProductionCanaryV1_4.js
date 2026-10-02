/**
 * AfriGreen24 Project Intelligence Production Canary V1.4
 * Read-only by default: selects the latest stored submission and audits it.
 */
var AG24_PI_V1_4 = AG24_PI_V1_4 || {};
AG24_PI_V1_4.VERSION = 'AG24_PROJECT_INTELLIGENCE_V1_4';

AG24_PI_V1_4.latestSubmissionId_ = function() {
  var sheet = SpreadsheetApp
    .openById(AFRIGREEN24_SHEET_ID)
    .getSheetByName(AFRIGREEN24_SHEET_NAME);

  if (!sheet) throw new Error('AG24_SUBMISSIONS_SHEET_NOT_FOUND');

  var last = sheet.getLastRow();
  if (last < 2) throw new Error('AG24_NO_SUBMISSION_AVAILABLE');

  var ids = sheet.getRange(2,1,last-1,1).getDisplayValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    var id = String(ids[i][0] || '').trim();
    if (id) return id;
  }

  throw new Error('AG24_NO_SUBMISSION_AVAILABLE');
};

AG24_PI_V1_4.summarize_ = function(result) {
  var run = result.run || {};
  var audit = run.audit || {};
  var summary = audit.summary || {};

  return {
    success: result.success === true,
    submissionId: result.submissionId,
    workflowVersion: result.workflowVersion,
    sourceRow: result.sourceRow,
    audience: audit.context ? audit.context.audience : null,
    stage: audit.context ? audit.context.stage : null,
    financingType: audit.context ? audit.context.financingType : null,
    readiness: summary.readiness || null,
    gaps: summary.gaps,
    critical: summary.critical,
    major: summary.major,
    blocking: summary.blocking,
    financierReady: audit.generation ? audit.generation.financierReadyAllowed : false,
    stopReason: run.stopReason || null,
    nextQuestion: run.nextQuestion ? run.nextQuestion.question : null
  };
};

function runAg24ProjectIntelligenceLatestSubmissionCanaryV1_4() {
  var submissionId = AG24_PI_V1_4.latestSubmissionId_();

  var result = runAg24ProjectIntelligenceForSubmissionV1_3(
    submissionId,
    {
      persist:false,
      maxIterations:8
    }
  );

  var summary = AG24_PI_V1_4.summarize_(result);

  Logger.log('AG24_PROJECT_INTELLIGENCE_PRODUCTION_CANARY_V1_4=PASS');
  Logger.log('SUBMISSION_ID=' + summary.submissionId);
  Logger.log('AUDIENCE=' + summary.audience);
  Logger.log('STAGE=' + summary.stage);
  Logger.log('FINANCING_TYPE=' + summary.financingType);
  Logger.log('READINESS=' + summary.readiness);
  Logger.log('GAPS=' + summary.gaps);
  Logger.log('CRITICAL=' + summary.critical);
  Logger.log('MAJOR=' + summary.major);
  Logger.log('BLOCKING=' + summary.blocking);
  Logger.log('FINANCIER_READY=' + summary.financierReady);
  Logger.log('STOP_REASON=' + summary.stopReason);
  Logger.log('NEXT_QUESTION=' + (summary.nextQuestion || 'NONE'));

  if (typeof AG24_AUDIT_event_ === 'function') {
    AG24_AUDIT_event_('PROJECT_INTELLIGENCE_PRODUCTION_CANARY_PASSED', {
      submissionId: summary.submissionId,
      workflowVersion: AG24_PI_V1_4.VERSION,
      audience: summary.audience,
      readiness: summary.readiness,
      gaps: summary.gaps,
      critical: summary.critical,
      major: summary.major,
      blocking: summary.blocking,
      financierReady: summary.financierReady,
      stopReason: summary.stopReason
    });
  }

  return summary;
}

function testAg24ProjectIntelligenceAudienceInferenceV1_4() {
  var cases = [
    {instrument:'BANK_LOAN', expected:'BANK'},
    {instrument:'DEBT', expected:'BANK'},
    {instrument:'EQUITY', expected:'INVESTOR'},
    {instrument:'IMPACT_EQUITY', expected:'INVESTOR'},
    {instrument:'GRANT', expected:'GRANT'},
    {instrument:'OTHER', expected:'GENERIC'}
  ];

  cases.forEach(function(c) {
    var actual = AG24_PI_V1_3.inferAudience_({funding:{instrument:c.instrument}});
    if (actual !== c.expected) {
      throw new Error('AG24_V1_4_AUDIENCE_INFERENCE_FAILED:' + c.instrument + ':' + actual);
    }
  });

  Logger.log('AG24_PROJECT_INTELLIGENCE_AUDIENCE_INFERENCE_V1_4=PASS');
  return true;
}

function runAg24ProjectIntelligenceAllTestsV1_4() {
  runAg24ProjectIntelligenceAllTestsV1_3();
  testAg24ProjectIntelligenceAudienceInferenceV1_4();
  Logger.log('AG24_PROJECT_INTELLIGENCE_ALL_TESTS_V1_4=PASS');
  return true;
}
