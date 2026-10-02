/**
 * AfriGreen24 Project Intelligence V1.1
 * Provenance + evidence + deterministic dependency recalculation.
 *
 * Compatibility principle:
 * - Existing Business Plan fields remain raw values.
 * - Truth/source/evidence live in metadata.provenance as a sidecar.
 * This avoids breaking the current Apps Script generators while establishing
 * one canonical provenance model.
 */
var AG24_PI_V1_1 = AG24_PI_V1_1 || {};

AG24_PI_V1_1.VERSION = 'AG24_PROJECT_INTELLIGENCE_V1_1';

AG24_PI_V1_1.TRUTH_STATUS = Object.freeze({
  DECLARED:'DECLARED',
  DOCUMENTED:'DOCUMENTED',
  EXTERNAL_VERIFIED:'EXTERNAL_VERIFIED',
  CALCULATED:'CALCULATED',
  ESTIMATED:'ESTIMATED',
  ASSUMPTION:'ASSUMPTION',
  CONFLICT:'CONFLICT',
  MISSING:'MISSING'
});

AG24_PI_V1_1.SOURCE_TYPE = Object.freeze({
  USER_INPUT:'USER_INPUT',
  PROJECT_PROFILE:'PROJECT_PROFILE',
  ORGANIZATION_PROFILE:'ORGANIZATION_PROFILE',
  STANDARD_BUSINESS_PLAN:'STANDARD_BUSINESS_PLAN',
  UPLOADED_DOCUMENT:'UPLOADED_DOCUMENT',
  ACCOUNTING_SYSTEM:'ACCOUNTING_SYSTEM',
  CRM:'CRM',
  CONTRACT:'CONTRACT',
  INVOICE:'INVOICE',
  BANK_STATEMENT:'BANK_STATEMENT',
  DATA_ROOM:'DATA_ROOM',
  EXTERNAL_OFFICIAL:'EXTERNAL_OFFICIAL',
  EXTERNAL_RESEARCH:'EXTERNAL_RESEARCH',
  SYSTEM_CALCULATION:'SYSTEM_CALCULATION',
  AI_EXTRACTION:'AI_EXTRACTION'
});

AG24_PI_V1_1.EVIDENCE_POLICY = Object.freeze({
  NONE:'NONE',
  DECLARATION_OK:'DECLARATION_OK',
  DOCUMENT_REQUIRED:'DOCUMENT_REQUIRED',
  EXTERNAL_REQUIRED:'EXTERNAL_REQUIRED',
  STRICT:'STRICT'
});

AG24_PI_V1_1.Util = (function(){
  function present_(v){
    if (typeof AG24_PI_V1 !== 'undefined' && AG24_PI_V1.U) {
      return AG24_PI_V1.U.present(v);
    }
    return !(v === null || typeof v === 'undefined' || (typeof v === 'string' && v.trim() === ''));
  }

  function get_(obj, path){
    if (typeof AG24_PI_V1 !== 'undefined' && AG24_PI_V1.U) {
      return AG24_PI_V1.U.get(obj, path);
    }
    var parts=String(path).split('.'), cur=obj;
    for(var i=0;i<parts.length;i++){
      if(cur===null||typeof cur==='undefined') return undefined;
      cur=cur[parts[i]];
    }
    return cur;
  }

  function set_(obj, path, value){
    var parts=String(path).split('.'), cur=obj;
    for(var i=0;i<parts.length-1;i++){
      if(!cur[parts[i]] || typeof cur[parts[i]]!=='object' || Array.isArray(cur[parts[i]])) cur[parts[i]]={};
      cur=cur[parts[i]];
    }
    cur[parts[parts.length-1]]=value;
    return obj;
  }

  function clone_(v){ return JSON.parse(JSON.stringify(v)); }

  function now_(){ return new Date().toISOString(); }

  function unique_(arr){
    var seen={},out=[];
    (arr||[]).forEach(function(x){ if(!seen[x]){seen[x]=true;out.push(x);} });
    return out;
  }

  return {present:present_,get:get_,set:set_,clone:clone_,now:now_,unique:unique_};
})();

AG24_PI_V1_1.Provenance = (function(){
  var U=AG24_PI_V1_1.Util;
  var T=AG24_PI_V1_1.TRUTH_STATUS;

  function ensure_(project){
    project.metadata=project.metadata||{};
    project.metadata.provenance=project.metadata.provenance||{};
    project.metadata.calculations=project.metadata.calculations||{};
    project.evidence=project.evidence||{};
    project.evidence.items=Array.isArray(project.evidence.items)?project.evidence.items:[];
    return project;
  }

  function annotate(project, fieldPath, meta){
    var out=U.clone(project||{});
    ensure_(out);
    meta=meta||{};
    out.metadata.provenance[fieldPath]={
      fieldPath:fieldPath,
      truthStatus:meta.truthStatus||T.DECLARED,
      source:meta.source||null,
      evidenceRefs:U.unique(meta.evidenceRefs||[]),
      confidence:meta.confidence||null,
      updatedAt:meta.updatedAt||U.now()
    };
    return out;
  }

  function addEvidence(project, evidence){
    var out=U.clone(project||{});
    ensure_(out);
    evidence=evidence||{};
    if(!evidence.evidenceId) throw new Error('AG24_EVIDENCE_ID_REQUIRED');

    var duplicate=out.evidence.items.some(function(x){return x.evidenceId===evidence.evidenceId;});
    if(duplicate) throw new Error('AG24_EVIDENCE_DUPLICATE:'+evidence.evidenceId);

    out.evidence.items.push({
      evidenceId:evidence.evidenceId,
      type:evidence.type||'DOCUMENT',
      title:evidence.title||'',
      issuer:evidence.issuer||null,
      date:evidence.date||null,
      url:evidence.url||null,
      documentId:evidence.documentId||null,
      supports:U.unique(evidence.supports||[]),
      reliability:evidence.reliability||'UNRATED',
      verifiedAt:evidence.verifiedAt||null
    });
    return out;
  }

  function get(project, fieldPath){
    if(!project || !project.metadata || !project.metadata.provenance) return null;
    return project.metadata.provenance[fieldPath] || null;
  }

  function evidenceExists_(project, evidenceId){
    var items=U.get(project,'evidence.items')||[];
    return items.some(function(x){return x.evidenceId===evidenceId;});
  }

  function validate(project, fieldPath, policy){
    policy=policy||AG24_PI_V1_1.EVIDENCE_POLICY.NONE;
    var P=AG24_PI_V1_1.EVIDENCE_POLICY;
    var record=get(project,fieldPath);
    var value=U.get(project,fieldPath);

    if(!U.present(value)){
      return {ok:false,status:'MISSING',fieldPath:fieldPath,policy:policy,reason:'VALUE_MISSING'};
    }
    if(policy===P.NONE){
      return {ok:true,status:'PASS',fieldPath:fieldPath,policy:policy};
    }
    if(!record){
      return {ok:false,status:'FAIL',fieldPath:fieldPath,policy:policy,reason:'PROVENANCE_MISSING'};
    }

    var truth=record.truthStatus;
    var refs=record.evidenceRefs||[];
    var validRefs=refs.filter(function(id){return evidenceExists_(project,id);});

    if(policy===P.DECLARATION_OK){
      var declarationOk=[T.DECLARED,T.DOCUMENTED,T.EXTERNAL_VERIFIED,T.CALCULATED,T.ESTIMATED,T.ASSUMPTION].indexOf(truth)!==-1;
      return {ok:declarationOk,status:declarationOk?'PASS':'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:declarationOk?null:'TRUTH_STATUS_NOT_ACCEPTED'};
    }

    if(policy===P.EXTERNAL_REQUIRED){
      var externalOk=truth===T.EXTERNAL_VERIFIED && validRefs.length>0;
      return {ok:externalOk,status:externalOk?'PASS':'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:externalOk?null:'EXTERNAL_EVIDENCE_REQUIRED'};
    }

    if(policy===P.DOCUMENT_REQUIRED){
      var docOk=(truth===T.DOCUMENTED||truth===T.EXTERNAL_VERIFIED) && validRefs.length>0;
      return {ok:docOk,status:docOk?'PASS':'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:docOk?null:'DOCUMENTARY_EVIDENCE_REQUIRED'};
    }

    if(policy===P.STRICT){
      if(truth===T.DOCUMENTED||truth===T.EXTERNAL_VERIFIED){
        var strictEvidenceOk=validRefs.length>0;
        return {ok:strictEvidenceOk,status:strictEvidenceOk?'PASS':'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:strictEvidenceOk?null:'STRICT_EVIDENCE_REQUIRED'};
      }
      if(truth===T.CALCULATED){
        var calc=project && project.metadata && project.metadata.calculations
          ? project.metadata.calculations[fieldPath]
          : null;
        var calcOk=!!(calc&&calc.formulaId&&calc.inputs&&Object.keys(calc.inputs).length);
        return {ok:calcOk,status:calcOk?'PASS':'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:calcOk?null:'CALCULATION_PROVENANCE_REQUIRED'};
      }
      return {ok:false,status:'FAIL',fieldPath:fieldPath,policy:policy,truthStatus:truth,reason:'STRICT_TRUTH_STATUS_NOT_ACCEPTED'};
    }

    return {ok:false,status:'FAIL',fieldPath:fieldPath,policy:policy,reason:'UNKNOWN_POLICY'};
  }

  return {ensure:ensure_,annotate:annotate,addEvidence:addEvidence,get:get,validate:validate};
})();

AG24_PI_V1_1.CalculationRegistry = (function(){
  var U=AG24_PI_V1_1.Util;

  var formulas=[
    {
      formulaId:'MRR_V1_1',
      output:'financialModel.mrr',
      inputs:['traction.payingCustomers','businessModel.averageMonthlyPrice'],
      calculate:function(project){
        return Number(U.get(project,'traction.payingCustomers')) * Number(U.get(project,'businessModel.averageMonthlyPrice'));
      }
    },
    {
      formulaId:'ARR_V1_1',
      output:'financialModel.arr',
      inputs:['financialModel.mrr'],
      calculate:function(project){
        return Number(U.get(project,'financialModel.mrr')) * 12;
      }
    },
    {
      formulaId:'ANNUAL_DEBT_SERVICE_V1_1',
      output:'debt.annualDebtService',
      inputs:['funding.amount','debt.interestRate','debt.termMonths'],
      optionalInputs:['debt.gracePeriodMonths'],
      calculate:function(project){
        if(typeof AG24_FIN_calculerEcheancier_!=='function'){
          throw new Error('AG24_FINANCIAL_MODEL_ENGINE_REQUIRED');
        }
        var schedule=AG24_FIN_calculerEcheancier_({
          montantDemande:Number(U.get(project,'funding.amount')),
          tauxInteretAnnuel:Number(U.get(project,'debt.interestRate')),
          dureeRemboursementMois:Number(U.get(project,'debt.termMonths')),
          differeMois:Number(U.get(project,'debt.gracePeriodMonths')||0)
        });
        if(!schedule||!Array.isArray(schedule.annuel)||!schedule.annuel.length){
          throw new Error('AG24_DEBT_SCHEDULE_EMPTY');
        }
        return Number(schedule.annuel[0].paiements);
      }
    },
    {
      formulaId:'DSCR_V1_1',
      output:'debt.dscr',
      inputs:['financialModel.cfads','debt.annualDebtService'],
      calculate:function(project){
        var cfads=Number(U.get(project,'financialModel.cfads'));
        var debtService=Number(U.get(project,'debt.annualDebtService'));
        if(!isFinite(debtService)||debtService<=0) throw new Error('AG24_DSCR_DEBT_SERVICE_INVALID');
        return Math.round((cfads/debtService)*10000)/10000;
      }
    }
  ];

  function all(){return formulas.slice();}
  function byOutput(path){for(var i=0;i<formulas.length;i++)if(formulas[i].output===path)return formulas[i];return null;}
  return {all:all,byOutput:byOutput};
})();

AG24_PI_V1_1.DependencyGraph = (function(){
  var registry=AG24_PI_V1_1.CalculationRegistry.all();
  var reverse={};

  registry.forEach(function(f){
    f.inputs.forEach(function(input){
      reverse[input]=reverse[input]||[];
      reverse[input].push(f.output);
    });
    (f.optionalInputs||[]).forEach(function(input){
      reverse[input]=reverse[input]||[];
      reverse[input].push(f.output);
    });
  });

  function impacted(changedPaths){
    if(!changedPaths||!changedPaths.length){
      return registry.map(function(f){return f.output;});
    }
    var queue=changedPaths.slice(), seen={}, outputs=[];
    while(queue.length){
      var p=queue.shift();
      (reverse[p]||[]).forEach(function(out){
        if(!seen[out]){
          seen[out]=true;
          outputs.push(out);
          queue.push(out);
        }
      });
    }
    return outputs;
  }

  function dependents(path){return (reverse[path]||[]).slice();}

  return {impacted:impacted,dependents:dependents};
})();

AG24_PI_V1_1.Recalculator = (function(){
  var U=AG24_PI_V1_1.Util;
  var T=AG24_PI_V1_1.TRUTH_STATUS;

  function setCalculatedProvenance_(project, formula, inputSnapshot){
    AG24_PI_V1_1.Provenance.ensure(project);
    project.metadata.calculations[formula.output]={
      formulaId:formula.formulaId,
      engineVersion:AG24_PI_V1_1.VERSION,
      inputs:inputSnapshot,
      computedAt:U.now()
    };
    project.metadata.provenance[formula.output]={
      fieldPath:formula.output,
      truthStatus:T.CALCULATED,
      source:{type:AG24_PI_V1_1.SOURCE_TYPE.SYSTEM_CALCULATION,ref:formula.formulaId},
      evidenceRefs:[],
      confidence:'DETERMINISTIC',
      updatedAt:U.now()
    };
  }

  function clearCalculated_(project, output){
    U.set(project,output,null);
    if(project.metadata&&project.metadata.calculations) delete project.metadata.calculations[output];
    if(project.metadata&&project.metadata.provenance) delete project.metadata.provenance[output];
  }

  function recalculate(project, changedPaths){
    var out=U.clone(project||{});
    AG24_PI_V1_1.Provenance.ensure(out);

    var impacted=AG24_PI_V1_1.DependencyGraph.impacted(changedPaths||[]);
    var impactedSet={};
    impacted.forEach(function(x){impactedSet[x]=true;});

    var events=[];
    AG24_PI_V1_1.CalculationRegistry.all().forEach(function(formula){
      if(!impactedSet[formula.output]) return;

      var missing=formula.inputs.filter(function(path){return !U.present(U.get(out,path));});
      if(missing.length){
        var had=U.present(U.get(out,formula.output));
        clearCalculated_(out,formula.output);
        events.push({
          eventType:had?'CALCULATION_INVALIDATED':'CALCULATION_SKIPPED_MISSING_INPUTS',
          formulaId:formula.formulaId,
          output:formula.output,
          missingInputs:missing
        });
        return;
      }

      var inputSnapshot={};
      formula.inputs.forEach(function(path){inputSnapshot[path]=U.get(out,path);});
      (formula.optionalInputs||[]).forEach(function(path){inputSnapshot[path]=U.get(out,path);});

      var value=formula.calculate(out);
      if(typeof value==='number'&&!isFinite(value)) throw new Error('AG24_NON_FINITE_CALCULATION:'+formula.formulaId);

      U.set(out,formula.output,value);
      setCalculatedProvenance_(out,formula,inputSnapshot);
      events.push({
        eventType:'CALCULATION_COMPUTED',
        formulaId:formula.formulaId,
        output:formula.output,
        value:value
      });
    });

    return {
      project:out,
      changedPaths:(changedPaths||[]).slice(),
      impactedOutputs:impacted,
      events:events,
      engineVersion:AG24_PI_V1_1.VERSION
    };
  }

  return {recalculate:recalculate};
})();

function testAg24ProjectIntelligenceProvenanceV1_1(){
  var p=AG24_PI_V1.EcoLoopGoldenFixtureV1();

  p=AG24_PI_V1_1.Provenance.addEvidence(p,{
    evidenceId:'EVID_STANDARD_BP_001',
    type:'DOCUMENT',
    title:'EcoLoop Business Plan Standard',
    documentId:'ECOLOOP_STANDARD_2026_10_02_V1',
    supports:['businessModel.averageMonthlyPrice'],
    reliability:'MEDIUM',
    verifiedAt:'2026-10-02'
  });

  p=AG24_PI_V1_1.Provenance.annotate(p,'businessModel.averageMonthlyPrice',{
    truthStatus:'DOCUMENTED',
    source:{type:'STANDARD_BUSINESS_PLAN',ref:'ECOLOOP_STANDARD_2026_10_02_V1'},
    evidenceRefs:['EVID_STANDARD_BP_001'],
    confidence:'HIGH'
  });

  var stored=AG24_PI_V1_1.Provenance.get(p,'businessModel.averageMonthlyPrice');
  ag24AssertV11_(stored && stored.truthStatus==='DOCUMENTED','dotted field provenance must be retrievable');

  var v=AG24_PI_V1_1.Provenance.validate(
    p,
    'businessModel.averageMonthlyPrice',
    'DOCUMENT_REQUIRED'
  );

  ag24AssertV11_(v.ok===true,'documented price evidence must pass');
  Logger.log('AG24_PROJECT_INTELLIGENCE_PROVENANCE_V1_1=PASS');
  return true;
}

function testAg24ProjectIntelligenceRecalculationV1_1(){
  var p=AG24_PI_V1.EcoLoopGoldenFixtureV1();
  p.traction.payingCustomers=12;
  p.debt.interestRate=8;
  p.debt.termMonths=36;
  p.debt.gracePeriodMonths=0;
  p.financialModel.cfads=30000;

  var r=AG24_PI_V1_1.Recalculator.recalculate(p,[]);
  var q=r.project;

  ag24AssertV11_(q.financialModel.mrr===2640,'MRR expected 2640');
  ag24AssertV11_(q.financialModel.arr===31680,'ARR expected 31680');
  ag24AssertV11_(typeof q.debt.annualDebtService==='number'&&q.debt.annualDebtService>0,'annual debt service must compute');
  ag24AssertV11_(typeof q.debt.dscr==='number'&&isFinite(q.debt.dscr),'DSCR must compute');

  var strict=AG24_PI_V1_1.Provenance.validate(q,'debt.dscr','STRICT');
  ag24AssertV11_(strict.ok===true,'calculated DSCR must carry calculation provenance');

  q.businessModel.averageMonthlyPrice=240;
  var r2=AG24_PI_V1_1.Recalculator.recalculate(q,['businessModel.averageMonthlyPrice']);
  ag24AssertV11_(r2.project.financialModel.mrr===2880,'MRR must recalculate to 2880');
  ag24AssertV11_(r2.project.financialModel.arr===34560,'ARR must recalculate to 34560');
  ag24AssertV11_(r2.impactedOutputs.indexOf('debt.dscr')===-1,'price change must not recalculate unrelated DSCR');

  Logger.log('AG24_PROJECT_INTELLIGENCE_RECALCULATION_V1_1=PASS');
  Logger.log('MRR='+r2.project.financialModel.mrr);
  Logger.log('ARR='+r2.project.financialModel.arr);
  Logger.log('ANNUAL_DEBT_SERVICE='+q.debt.annualDebtService);
  Logger.log('DSCR='+q.debt.dscr);
  return true;
}

function testAg24ProjectIntelligenceInvalidationV1_1(){
  var p=AG24_PI_V1.EcoLoopGoldenFixtureV1();
  p.traction.payingCustomers=10;
  p.financialModel.mrr=2200;
  p.financialModel.arr=26400;
  p.metadata=p.metadata||{};
  p.metadata.provenance={
    'financialModel.mrr':{truthStatus:'CALCULATED'},
    'financialModel.arr':{truthStatus:'CALCULATED'}
  };
  p.metadata.calculations={
    'financialModel.mrr':{formulaId:'MRR_V1_1',inputs:{}},
    'financialModel.arr':{formulaId:'ARR_V1_1',inputs:{}}
  };

  p.traction.payingCustomers=null;
  var r=AG24_PI_V1_1.Recalculator.recalculate(p,['traction.payingCustomers']);

  ag24AssertV11_(r.project.financialModel.mrr===null,'stale MRR must be invalidated');
  ag24AssertV11_(r.project.financialModel.arr===null,'stale ARR must be invalidated transitively');
  Logger.log('AG24_PROJECT_INTELLIGENCE_INVALIDATION_V1_1=PASS');
  return true;
}

function runAg24ProjectIntelligenceV1_1Tests(){
  testAg24ProjectIntelligenceProvenanceV1_1();
  testAg24ProjectIntelligenceRecalculationV1_1();
  testAg24ProjectIntelligenceInvalidationV1_1();
  Logger.log('AG24_PROJECT_INTELLIGENCE_V1_1_TEST_SUITE=PASS');
  return true;
}

function runAg24ProjectIntelligenceAllTestsV1_1(){
  runAg24ProjectIntelligenceFoundationTestsV1();
  runAg24ProjectIntelligenceV1_1Tests();
  Logger.log('AG24_PROJECT_INTELLIGENCE_ALL_TESTS_V1_1=PASS');
  return true;
}

function ag24AssertV11_(ok,msg){
  if(!ok) throw new Error('AG24_V1_1_ASSERTION_FAILED:'+msg);
}
