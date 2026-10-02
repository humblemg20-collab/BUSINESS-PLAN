/**
 * AfriGreen24 Project Intelligence Orchestrator V1.2
 * resolve -> recalculate -> re-evaluate -> next action
 */
var AG24_PI_V1_2 = AG24_PI_V1_2 || {};
AG24_PI_V1_2.VERSION = 'AG24_PROJECT_INTELLIGENCE_V1_2';

AG24_PI_V1_2.QUESTIONS = {
  BANK_INTEREST_RATE_V1:'Quel taux annuel doit être utilisé pour le financement ?',
  BANK_TERM_MONTHS_V1:'Sur combien de mois le financement doit-il être remboursé ?',
  SUBSCRIPTION_CONTRACT_DURATION_V1:'Quelle est la durée moyenne du contrat client en mois ?',
  RISK_ASSESSMENT_V1:'Pour chaque risque, quelles sont la probabilité, l’impact et la mitigation ?',
  ROADMAP_6_12_24_V1:'Quels objectifs mesurables et KPI doivent être atteints à 6, 12 et 24 mois ?'
};

AG24_PI_V1_2_applyInput_ = function(project, fieldId, candidate, meta) {
  if (candidate === null || typeof candidate === 'undefined') return {project:project,changed:false};
  var value = candidate && typeof candidate === 'object' &&
    Object.prototype.hasOwnProperty.call(candidate,'value') ? candidate.value : candidate;
  if (!AG24_PI_V1_1.Util.present(value)) return {project:project,changed:false};

  var out = AG24_PI_V1_1.Util.clone(project);
  if (JSON.stringify(AG24_PI_V1_1.Util.get(out,fieldId)) === JSON.stringify(value)) {
    return {project:out,changed:false};
  }
  AG24_PI_V1_1.Util.set(out,fieldId,value);

  var m = {
    truthStatus:meta.truthStatus,
    source:meta.source,
    evidenceRefs:[],
    confidence:meta.confidence
  };
  if (candidate && typeof candidate === 'object') {
    if (candidate.truthStatus) m.truthStatus=candidate.truthStatus;
    if (candidate.source) m.source=candidate.source;
    if (candidate.evidenceRefs) m.evidenceRefs=candidate.evidenceRefs;
  }
  out = AG24_PI_V1_1.Provenance.annotate(out,fieldId,m);
  return {project:out,changed:true};
};

AG24_PI_V1_2_resolveAction_ = function(project, action, options) {
  if (!action.fieldId) return {project:project,changed:false};

  var bucket=null, meta=null;
  if (action.action === 'FETCH_CANONICAL') {
    bucket=options.canonicalValues||{};
    meta={truthStatus:'DOCUMENTED',source:{type:'PROJECT_PROFILE',ref:'V1_2'},confidence:'HIGH'};
  } else if (action.action === 'REQUEST_USER') {
    bucket=options.userAnswers||{};
    meta={truthStatus:'DECLARED',source:{type:'USER_INPUT',ref:'V1_2'},confidence:'MEDIUM'};
  } else if (action.action === 'SEARCH_EXTERNAL') {
    bucket=options.externalValues||{};
    meta={truthStatus:'EXTERNAL_VERIFIED',source:{type:'EXTERNAL_OFFICIAL',ref:'V1_2'},confidence:'HIGH'};
  } else {
    return {project:project,changed:false};
  }

  if (!Object.prototype.hasOwnProperty.call(bucket,action.fieldId)) {
    return {project:project,changed:false};
  }
  return AG24_PI_V1_2_applyInput_(project,action.fieldId,bucket[action.fieldId],meta);
};

AG24_PI_V1_2_nextQuestion_ = function(audit) {
  var a=audit.nextActions||[];
  for (var i=0;i<a.length;i++) {
    if (a[i].action==='REQUEST_USER' && AG24_PI_V1_2.QUESTIONS[a[i].ruleId]) {
      return {ruleId:a[i].ruleId,fieldId:a[i].fieldId,question:AG24_PI_V1_2.QUESTIONS[a[i].ruleId]};
    }
  }
  return null;
};

AG24_PI_V1_2.Orchestrator = {
  run:function(project,options) {
    options=options||{};
    var current=AG24_PI_V1_1.Util.clone(project||{});
    AG24_PI_V1_1.Provenance.ensure(current);
    var audit=AG24_PI_V1.Engine.evaluate(current);
    var history=[];
    var stop='WAITING_FOR_INPUT_OR_ADAPTER';
    var max=Math.max(1,Math.min(20,Number(options.maxIterations||8)));

    for (var n=1;n<=max;n++) {
      var changed=[];
      (audit.nextActions||[]).forEach(function(action) {
        var r=AG24_PI_V1_2_resolveAction_(current,action,options);
        current=r.project;
        if (r.changed && action.fieldId) changed.push(action.fieldId);
      });
      changed=changed.filter(function(v,i,a){return a.indexOf(v)===i;});
      if (!changed.length) break;

      var recalc=AG24_PI_V1_1.Recalculator.recalculate(current,changed);
      current=recalc.project;
      audit=AG24_PI_V1.Engine.evaluate(current);
      history.push({iteration:n,changedPaths:changed,impactedOutputs:recalc.impactedOutputs});

      if (audit.generation.financierReadyAllowed) { stop='FINANCIER_READY'; break; }
      if (n===max) stop='MAX_ITERATIONS';
    }

    return {
      workflowVersion:AG24_PI_V1_2.VERSION,
      project:current,
      audit:audit,
      nextQuestion:AG24_PI_V1_2_nextQuestion_(audit),
      stopReason:stop,
      iterations:history.length,
      history:history
    };
  }
};

function testAg24ProjectIntelligenceOrchestratorV1_2() {
  var source=AG24_PI_V1.EcoLoopGoldenFixtureV1();
  var before=JSON.stringify(source);

  var waiting=AG24_PI_V1_2.Orchestrator.run(source,{});
  ag24AssertV12_(waiting.audit.summary.gaps===13,'baseline gaps');
  ag24AssertV12_(JSON.stringify(source)===before,'input mutation');

  var r=AG24_PI_V1_2.Orchestrator.run(source,{
    canonicalValues:{
      'financialModel.cfads':30000,
      'traction.revenueToDate':31680,
      'traction.payingCustomers':12
    },
    userAnswers:{
      'debt.interestRate':8,
      'debt.termMonths':36,
      'businessModel.contractDurationMonths':24
    },
    externalValues:{
      'market.tam.value':10000000,
      'market.sam.value':2000000
    }
  });

  ag24AssertV12_(r.project.financialModel.mrr===2640,'MRR');
  ag24AssertV12_(r.project.financialModel.arr===31680,'ARR');
  ag24AssertV12_(r.project.debt.annualDebtService>0,'debt service');
  ag24AssertV12_(isFinite(r.project.debt.dscr),'DSCR');
  ag24AssertV12_(ag24FindEvalV12_(r.audit,'BANK_DSCR_V1').pass===true,'DSCR rule');
  ag24AssertV12_(r.audit.summary.gaps<13,'gap reduction');

  Logger.log('AG24_PROJECT_INTELLIGENCE_ORCHESTRATOR_V1_2=PASS');
  Logger.log('STOP_REASON='+r.stopReason);
  Logger.log('GAPS_AFTER='+r.audit.summary.gaps);
  Logger.log('READINESS_AFTER='+r.audit.summary.readiness);
  Logger.log('MRR='+r.project.financialModel.mrr);
  Logger.log('ARR='+r.project.financialModel.arr);
  Logger.log('ANNUAL_DEBT_SERVICE='+r.project.debt.annualDebtService);
  Logger.log('DSCR='+r.project.debt.dscr);
  Logger.log('NEXT_QUESTION='+(r.nextQuestion?r.nextQuestion.question:'NONE'));
  return true;
}

function runAg24ProjectIntelligenceAllTestsV1_2() {
  runAg24ProjectIntelligenceAllTestsV1_1();
  testAg24ProjectIntelligenceOrchestratorV1_2();
  Logger.log('AG24_PROJECT_INTELLIGENCE_ALL_TESTS_V1_2=PASS');
  return true;
}

function ag24FindEvalV12_(r,id) {
  for (var i=0;i<r.evaluations.length;i++) if (r.evaluations[i].ruleId===id) return r.evaluations[i];
  throw new Error('AG24_V1_2_RULE_NOT_FOUND:'+id);
}
function ag24AssertV12_(ok,msg) {
  if (!ok) throw new Error('AG24_V1_2_ASSERTION_FAILED:'+msg);
}
