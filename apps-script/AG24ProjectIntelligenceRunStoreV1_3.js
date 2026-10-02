/**
 * AfriGreen24 Project Intelligence Run Store V1.3
 */
var AG24_PI_V1_3 = AG24_PI_V1_3 || {};

AG24_PI_V1_3.inferAudience_ = function(canonical) {
  var instrument = canonical && canonical.funding ? String(canonical.funding.instrument || '') : '';
  if (instrument === 'BANK_LOAN' || instrument === 'DEBT' || instrument === 'CONVERTIBLE_DEBT') return 'BANK';
  if (instrument === 'EQUITY' || instrument === 'IMPACT_EQUITY') return 'INVESTOR';
  if (instrument === 'GRANT') return 'GRANT';
  return 'GENERIC';
};

AG24_PI_V1_3.persistRun_ = function(submissionId, runResult) {
  if (typeof AG24_DATASTORE_storeJson_ !== 'function') {
    throw new Error('AG24_DATASTORE_STORE_UNAVAILABLE');
  }

  var stored = AG24_DATASTORE_storeJson_(
    submissionId,
    'project-intelligence-v1-3',
    {
      workflowVersion: runResult.workflowVersion,
      snapshotId: runResult.audit && runResult.audit.snapshotId || null,
      stopReason: runResult.stopReason,
      iterations: runResult.iterations,
      summary: runResult.audit && runResult.audit.summary || null,
      nextQuestion: runResult.nextQuestion || null,
      project: runResult.project,
      audit: runResult.audit,
      persistedAt: new Date().toISOString()
    }
  );

  if (typeof AG24_AUDIT_event_ === 'function') {
    AG24_AUDIT_event_('PROJECT_INTELLIGENCE_RUN_PERSISTED', {
      submissionId: String(submissionId || ''),
      workflowVersion: AG24_PI_V1_3.VERSION,
      stopReason: runResult.stopReason,
      readiness: runResult.audit && runResult.audit.summary
        ? runResult.audit.summary.readiness
        : null,
      gaps: runResult.audit && runResult.audit.summary
        ? runResult.audit.summary.gaps
        : null,
      fileId: stored.fileId,
      sha256: String(stored.sha256 || '').slice(0,16)
    });
  }

  return stored;
};

function runAg24ProjectIntelligenceForSubmissionV1_3(submissionId, options) {
  options = options || {};

  if (typeof AG24_PI_V1_2 === 'undefined' || !AG24_PI_V1_2.Orchestrator) {
    throw new Error('AG24_PROJECT_INTELLIGENCE_ORCHESTRATOR_V1_2_REQUIRED');
  }

  var source = AG24_PI_V1_3.loadSubmission_(submissionId);
  var canonical = AG24_PI_V1_3.buildCanonical_(source);

  canonical.documentContext.audience = options.audience
    ? String(options.audience)
    : AG24_PI_V1_3.inferAudience_(canonical);
  if (options.currency) {
    canonical.documentContext.currency = String(options.currency);
  }

  var run = AG24_PI_V1_2.Orchestrator.run(canonical, {
    canonicalValues: options.canonicalValues || {},
    userAnswers: options.userAnswers || {},
    externalValues: options.externalValues || {},
    maxIterations: options.maxIterations || 8
  });

  var persistence = null;
  if (options.persist !== false) {
    persistence = AG24_PI_V1_3.persistRun_(submissionId, run);
  }

  return {
    success: true,
    submissionId: String(submissionId),
    workflowVersion: AG24_PI_V1_3.VERSION,
    sourceRow: source.row,
    run: run,
    persistence: persistence
  };
}
