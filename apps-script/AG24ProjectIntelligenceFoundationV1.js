/**
 * AfriGreen24 Project Intelligence Foundation V1
 * Deterministic foundation for Business Plan Premium.
 * Business Plan is the first client; the engine is intentionally reusable.
 */
var AG24_PI_V1 = AG24_PI_V1 || {};

AG24_PI_V1.VERSION = 'AG24_PROJECT_INTELLIGENCE_V1';
AG24_PI_V1.STATUS = {
  VALID:'VALID', MISSING:'MISSING', INVALID:'INVALID', NOT_APPLICABLE:'NOT_APPLICABLE',
  NOT_COMPUTABLE:'NOT_COMPUTABLE', READY_TO_CALCULATE:'READY_TO_CALCULATE'
};
AG24_PI_V1.SEVERITY = { INFO:'INFO', WARNING:'WARNING', MAJOR:'MAJOR', CRITICAL:'CRITICAL', BLOCKING:'BLOCKING' };
AG24_PI_V1.ACTION = {
  NONE:'NONE', FETCH_CANONICAL:'FETCH_CANONICAL', DERIVE:'DERIVE', CALCULATE:'CALCULATE',
  SEARCH_EXTERNAL:'SEARCH_EXTERNAL', REQUEST_USER:'REQUEST_USER', HUMAN_REVIEW:'HUMAN_REVIEW', BLOCK:'BLOCK'
};
AG24_PI_V1.STAGE = {
  IDEA:'IDEA', STRUCTURED_IDEA:'STRUCTURED_IDEA', PROTOTYPE:'PROTOTYPE', PILOT:'PILOT',
  LAUNCH:'LAUNCH', EARLY_REVENUE:'EARLY_REVENUE', GROWTH:'GROWTH', ESTABLISHED_SME:'ESTABLISHED_SME'
};
AG24_PI_V1.READINESS = {
  DISCOVERY:'DISCOVERY', STRUCTURED:'STRUCTURED', ANALYSABLE:'ANALYSABLE',
  DOCUMENT_READY:'DOCUMENT_READY', FINANCIER_READY:'FINANCIER_READY'
};

AG24_PI_V1.U = (function(){
  function present(v){ if(v===null||typeof v==='undefined') return false; if(typeof v==='string'&&v.trim()==='') return false; if(Array.isArray(v)) return v.length>0; return true; }
  function get(o,p){ var a=String(p).split('.'),c=o; for(var i=0;i<a.length;i++){ if(c===null||typeof c==='undefined') return undefined; c=c[a[i]]; } return c; }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function when(project,cond){ if(!cond) return true; var ks=Object.keys(cond); for(var i=0;i<ks.length;i++){ var k=ks[i], actual=get(project,k), expected=Array.isArray(cond[k])?cond[k]:[cond[k]]; if(expected.indexOf(actual)===-1) return false; } return true; }
  function sw(s){ return ({INFO:1,WARNING:2,MAJOR:4,CRITICAL:8,BLOCKING:16})[s]||0; }
  return {present:present,get:get,clone:clone,when:when,severityWeight:sw};
})();

AG24_PI_V1.Formulas = {
  MRR_V1: { inputs:['traction.payingCustomers','businessModel.averageMonthlyPrice'], calc:function(x){ return Number(x[0])*Number(x[1]); } },
  ARR_V1: { inputs:['financialModel.mrr'], calc:function(x){ return Number(x[0])*12; } },
  DSCR_V1:{ inputs:['financialModel.cfads','debt.annualDebtService'], calc:function(x){ var d=Number(x[1]); if(!isFinite(d)||d<=0) throw new Error('DSCR_V1 requires annualDebtService > 0'); return Number(x[0])/d; } }
};

AG24_PI_V1.BusinessPlanRulesV1 = [
  {id:'CORE_PROJECT_NAME_V1',kind:'REQ',field:'identity.projectName',severity:'BLOCKING',action:'REQUEST_USER'},
  {id:'CORE_COUNTRY_V1',kind:'REQ',field:'identity.country',severity:'BLOCKING',action:'REQUEST_USER'},
  {id:'CORE_SECTOR_V1',kind:'REQ',field:'identity.sector',severity:'MAJOR',action:'REQUEST_USER'},
  {id:'CORE_STAGE_V1',kind:'REQ',field:'identity.stage',severity:'BLOCKING',action:'REQUEST_USER'},
  {id:'EARLY_REVENUE_PAYING_CUSTOMERS_V1',kind:'REQ',field:'traction.payingCustomers',when:{'identity.stage':['EARLY_REVENUE','GROWTH','ESTABLISHED_SME']},severity:'MAJOR',action:'FETCH_CANONICAL'},
  {id:'EARLY_REVENUE_REVENUE_TO_DATE_V1',kind:'REQ',field:'traction.revenueToDate',when:{'identity.stage':['EARLY_REVENUE','GROWTH','ESTABLISHED_SME']},severity:'CRITICAL',action:'FETCH_CANONICAL'},
  {id:'MARKET_TAM_V1',kind:'REQ',field:'market.tam.value',severity:'MAJOR',action:'SEARCH_EXTERNAL'},
  {id:'MARKET_SAM_V1',kind:'REQ',field:'market.sam.value',severity:'MAJOR',action:'SEARCH_EXTERNAL'},
  {id:'MARKET_SOM_V1',kind:'REQ',field:'market.som.value',severity:'MAJOR',action:'DERIVE'},
  {id:'SUBSCRIPTION_CONTRACT_DURATION_V1',kind:'REQ',field:'businessModel.contractDurationMonths',when:{'businessModel.pricingModel':['SUBSCRIPTION']},severity:'MAJOR',action:'REQUEST_USER'},
  {id:'UNIT_ECONOMICS_GROSS_MARGIN_V1',kind:'REQ',field:'unitEconomics.grossMargin',when:{'identity.stage':['EARLY_REVENUE','GROWTH','ESTABLISHED_SME']},severity:'MAJOR',action:'DERIVE'},
  {id:'BANK_FUNDING_AMOUNT_V1',kind:'REQ',field:'funding.amount',when:{'documentContext.audience':['BANK'],'funding.instrument':['BANK_LOAN','DEBT']},severity:'BLOCKING',action:'REQUEST_USER'},
  {id:'BANK_INTEREST_RATE_V1',kind:'REQ',field:'debt.interestRate',when:{'documentContext.audience':['BANK'],'funding.instrument':['BANK_LOAN','DEBT']},severity:'CRITICAL',action:'REQUEST_USER'},
  {id:'BANK_TERM_MONTHS_V1',kind:'REQ',field:'debt.termMonths',when:{'documentContext.audience':['BANK'],'funding.instrument':['BANK_LOAN','DEBT']},severity:'CRITICAL',action:'REQUEST_USER'},
  {id:'BANK_CFADS_V1',kind:'REQ',field:'financialModel.cfads',when:{'documentContext.audience':['BANK'],'identity.stage':['EARLY_REVENUE','GROWTH','ESTABLISHED_SME']},severity:'CRITICAL',action:'CALCULATE'},
  {id:'BANK_DSCR_V1',kind:'CALC_READY',field:'debt.dscr',formula:'DSCR_V1',when:{'documentContext.audience':['BANK'],'funding.instrument':['BANK_LOAN','DEBT'],'identity.stage':['EARLY_REVENUE','GROWTH','ESTABLISHED_SME']},severity:'CRITICAL',action:'CALCULATE'},
  {id:'MARKET_ORDER_TAM_SAM_V1',kind:'COMPARE',left:'market.sam.value',op:'<=',right:'market.tam.value',severity:'BLOCKING',code:'SAM_GT_TAM'},
  {id:'MARKET_ORDER_SAM_SOM_V1',kind:'COMPARE',left:'market.som.value',op:'<=',right:'market.sam.value',severity:'BLOCKING',code:'SOM_GT_SAM'},
  {id:'RISK_ASSESSMENT_V1',kind:'CUSTOM',severity:'MAJOR',action:'REQUEST_USER',check:function(p){ var a=AG24_PI_V1.U.get(p,'risk.items'); if(!Array.isArray(a)||!a.length) return {ok:false,code:'RISK_ITEMS_MISSING'}; var bad=a.filter(function(r){return !AG24_PI_V1.U.present(r.probability)||!AG24_PI_V1.U.present(r.impact)||!AG24_PI_V1.U.present(r.mitigation);}); return bad.length?{ok:false,code:'RISK_ASSESSMENT_INCOMPLETE',reason:bad.length+' incomplete risk(s)'}:{ok:true}; }},
  {id:'ROADMAP_6_12_24_V1',kind:'CUSTOM',severity:'MAJOR',action:'REQUEST_USER',check:function(p){ var m=AG24_PI_V1.U.get(p,'roadmap.milestones')||[], miss=[]; [6,12,24].forEach(function(h){ var ok=m.some(function(x){return Number(x.horizonMonths)===h&&AG24_PI_V1.U.present(x.objective)&&Array.isArray(x.kpis)&&x.kpis.length;}); if(!ok) miss.push(h); }); return miss.length?{ok:false,code:'ROADMAP_HORIZONS_INCOMPLETE',reason:'Missing '+miss.join('/')+' month milestone(s)'}:{ok:true}; }}
];

AG24_PI_V1.Engine = (function(){
  var U=AG24_PI_V1.U,S=AG24_PI_V1.STATUS;
  function evalRule(p,r){
    var e={ruleId:r.id,fieldId:r.field||null,severity:r.severity||'WARNING',action:r.action||'NONE',pass:false,status:S.INVALID,code:null,reason:null};
    if(r.when&&!U.when(p,r.when)){e.pass=true;e.status=S.NOT_APPLICABLE;return e;}
    if(r.kind==='REQ'){
      var v=U.get(p,r.field); if(!U.present(v)){e.status=S.MISSING;e.code='MISSING_REQUIRED_FIELD';e.reason=r.field+' is required';return e;}
      e.pass=true;e.status=S.VALID;return e;
    }
    if(r.kind==='CALC_READY'){
      if(U.present(U.get(p,r.field))){e.pass=true;e.status=S.VALID;return e;}
      var f=AG24_PI_V1.Formulas[r.formula]; if(!f){e.code='FORMULA_NOT_FOUND';return e;}
      var missing=f.inputs.filter(function(x){return !U.present(U.get(p,x));});
      if(missing.length){e.status=S.NOT_COMPUTABLE;e.code='MISSING_DEPENDENCIES';e.reason='Missing dependencies: '+missing.join(', ');return e;}
      e.status=S.READY_TO_CALCULATE;e.code='READY_TO_CALCULATE';e.action='CALCULATE';return e;
    }
    if(r.kind==='COMPARE'){
      var l=U.get(p,r.left),q=U.get(p,r.right); if(!U.present(l)||!U.present(q)){e.pass=true;e.status=S.NOT_APPLICABLE;return e;}
      l=Number(l);q=Number(q); var ok=r.op==='<='?l<=q:r.op==='>='?l>=q:l===q; e.pass=ok;e.status=ok?S.VALID:S.INVALID;e.code=ok?null:r.code;e.action=ok?'NONE':'HUMAN_REVIEW';return e;
    }
    if(r.kind==='CUSTOM'){
      var c=r.check(p); e.pass=!!c.ok;e.status=c.ok?S.VALID:S.INVALID;e.code=c.code||null;e.reason=c.reason||null;return e;
    }
    e.code='UNKNOWN_RULE_KIND';return e;
  }
  function readiness(g){
    var c={info:0,warning:0,major:0,critical:0,blocking:0};
    g.forEach(function(x){var k=String(x.severity||'').toLowerCase();if(typeof c[k]==='number')c[k]++;});
    var r='DISCOVERY'; if(!c.blocking)r='STRUCTURED'; if(!c.blocking&&c.critical<=3)r='ANALYSABLE'; if(!c.blocking&&!c.critical&&c.major<=3)r='DOCUMENT_READY'; if(!c.blocking&&!c.critical&&!c.major)r='FINANCIER_READY';
    c.readiness=r; return c;
  }
  function evaluate(project){
    var p=U.clone(project||{}), ev=[], gaps=[];
    AG24_PI_V1.BusinessPlanRulesV1.forEach(function(r){var x=evalRule(p,r);ev.push(x);if(!x.pass&&x.status!==S.NOT_APPLICABLE)gaps.push({gapId:'GAP_'+r.id,ruleId:r.id,fieldId:x.fieldId,code:x.code,status:x.status,severity:x.severity,reason:x.reason,action:x.action});});
    var counts=readiness(gaps); var next=gaps.map(function(g){return {ruleId:g.ruleId,fieldId:g.fieldId,action:g.action,severity:g.severity,priority:U.severityWeight(g.severity)*10+(g.fieldId==='debt.dscr'?10:g.fieldId==='financialModel.cfads'?9:0)};}).sort(function(a,b){return b.priority-a.priority;}).slice(0,10);
    return {engineVersion:AG24_PI_V1.VERSION,snapshotId:U.get(p,'metadata.snapshotId')||null,context:{audience:U.get(p,'documentContext.audience')||'GENERIC',stage:U.get(p,'identity.stage')||null,financingType:U.get(p,'funding.instrument')||'NONE',sector:U.get(p,'identity.sector')||null,country:U.get(p,'identity.country')||null},evaluations:ev,gaps:gaps,nextActions:next,summary:{totalRules:ev.length,gaps:gaps.length,major:counts.major,critical:counts.critical,blocking:counts.blocking,readiness:counts.readiness},generation:{auditAllowed:true,workingDraftAllowed:counts.blocking===0,financierReadyAllowed:counts.blocking===0&&counts.critical===0&&counts.major===0}};
  }
  return {evaluate:evaluate};
})();

AG24_PI_V1.EcoLoopGoldenFixtureV1 = function(){
  return {
    schemaVersion:'AG24_CANONICAL_PROJECT_V1',
    documentContext:{audience:'BANK',language:'fr',currency:'EUR',country:'CM',asOfDate:'2026-10-02'},
    identity:{projectName:'EcoLoop Solar Services',ownerName:'Francis Michel',country:'CM',sector:'SOLAR_ENERGY',stage:'EARLY_REVENUE'},
    problem:{statement:'Les PME supportent des coûts énergétiques imprévisibles, subissent des coupures d’électricité et dépendent de groupes électrogènes coûteux.'},
    solution:{description:'Installations solaires en location avec maintenance incluse, financées sous forme de service.'},
    businessModel:{pricingModel:'SUBSCRIPTION',averageMonthlyPrice:220,contractDurationMonths:null},
    market:{tam:{value:null},sam:{value:null},som:{value:null}},
    traction:{payingCustomers:null,revenueToDate:null},
    funding:{amount:150000,currency:'EUR',instrument:'BANK_LOAN',useOfFunds:['Premier portefeuille d’équipements','Installation','Équipe commerciale','Fonds de roulement','Opérations']},
    debt:{interestRate:null,termMonths:null,annualDebtService:null,dscr:null},
    financialModel:{cfads:null},unitEconomics:{grossMargin:null},
    risk:{items:[
      {category:'COMMERCIAL',description:'Adoption plus lente',probability:null,impact:null,mitigation:null},
      {category:'FINANCIAL',description:'Décalage entre investissement et encaissement des abonnements',probability:null,impact:null,mitigation:null},
      {category:'OPERATIONAL',description:'Panne ou sous-performance',probability:null,impact:null,mitigation:null}
    ]},
    roadmap:{milestones:[{horizonMonths:6,objective:null,kpis:[]},{horizonMonths:12,objective:null,kpis:[]},{horizonMonths:24,objective:null,kpis:[]}]},
    metadata:{snapshotId:'ECOLOOP_STANDARD_2026_10_02_V1',source:'STANDARD_BUSINESS_PLAN'}
  };
};

function testAg24ProjectIntelligenceEcoLoopV1(){
  var r=AG24_PI_V1.Engine.evaluate(AG24_PI_V1.EcoLoopGoldenFixtureV1());
  ag24AssertV1_(r.context.audience==='BANK','audience');
  ag24AssertV1_(r.context.stage==='EARLY_REVENUE','stage');
  ag24AssertV1_(r.context.financingType==='BANK_LOAN','financing');
  ag24AssertRuleV1_(r,'CORE_PROJECT_NAME_V1',true);
  ag24AssertRuleV1_(r,'BANK_FUNDING_AMOUNT_V1',true);
  ag24AssertCodeV1_(r,'EARLY_REVENUE_PAYING_CUSTOMERS_V1','MISSING_REQUIRED_FIELD');
  ag24AssertCodeV1_(r,'EARLY_REVENUE_REVENUE_TO_DATE_V1','MISSING_REQUIRED_FIELD');
  ag24AssertCodeV1_(r,'MARKET_TAM_V1','MISSING_REQUIRED_FIELD');
  ag24AssertCodeV1_(r,'BANK_INTEREST_RATE_V1','MISSING_REQUIRED_FIELD');
  ag24AssertCodeV1_(r,'BANK_TERM_MONTHS_V1','MISSING_REQUIRED_FIELD');
  ag24AssertCodeV1_(r,'BANK_DSCR_V1','MISSING_DEPENDENCIES');
  ag24AssertCodeV1_(r,'RISK_ASSESSMENT_V1','RISK_ASSESSMENT_INCOMPLETE');
  ag24AssertCodeV1_(r,'ROADMAP_6_12_24_V1','ROADMAP_HORIZONS_INCOMPLETE');
  ag24AssertV1_(r.generation.financierReadyAllowed===false,'EcoLoop must not be financier-ready');
  Logger.log('AG24_PROJECT_INTELLIGENCE_FOUNDATION_V1=PASS');
  Logger.log(JSON.stringify(r));
  return r;
}
function testAg24ProjectIntelligenceDeterminismV1(){ var a=AG24_PI_V1.Engine.evaluate(AG24_PI_V1.EcoLoopGoldenFixtureV1()),b=AG24_PI_V1.Engine.evaluate(AG24_PI_V1.EcoLoopGoldenFixtureV1()); ag24AssertV1_(JSON.stringify(a)===JSON.stringify(b),'determinism'); Logger.log('AG24_PROJECT_INTELLIGENCE_DETERMINISM_V1=PASS'); return true; }
function runAg24ProjectIntelligenceFoundationTestsV1(){ testAg24ProjectIntelligenceEcoLoopV1(); testAg24ProjectIntelligenceDeterminismV1(); Logger.log('AG24_PROJECT_INTELLIGENCE_FOUNDATION_TEST_SUITE_V1=PASS'); return true; }
function ag24FindEvalV1_(r,id){ for(var i=0;i<r.evaluations.length;i++)if(r.evaluations[i].ruleId===id)return r.evaluations[i]; throw new Error('AG24_RULE_NOT_FOUND:'+id); }
function ag24AssertRuleV1_(r,id,pass){ var e=ag24FindEvalV1_(r,id); ag24AssertV1_(e.pass===pass,id+' pass mismatch'); }
function ag24AssertCodeV1_(r,id,code){ var e=ag24FindEvalV1_(r,id); ag24AssertV1_(e.pass===false,id+' expected fail'); ag24AssertV1_(e.code===code,id+' expected '+code+' got '+e.code); }
function ag24AssertV1_(ok,msg){ if(!ok) throw new Error('AG24_ASSERTION_FAILED:'+msg); }
