/**
 * AfriGreen24 Project Intelligence DataStore Adapter V1.3
 * Reads the existing Business Plan CRM/DataStore as canonical source.
 */
var AG24_PI_V1_3 = AG24_PI_V1_3 || {};
AG24_PI_V1_3.VERSION = 'AG24_PROJECT_INTELLIGENCE_V1_3';

AG24_PI_V1_3.first_ = function(o, keys, fallback) {
  o=o||{};
  for(var i=0;i<keys.length;i++){
    if(AG24_PI_V1_1.Util.present(o[keys[i]])) return o[keys[i]];
  }
  return fallback;
};

AG24_PI_V1_3.number_ = function(v) {
  if(typeof v==='number') return isFinite(v)?v:null;
  if(v===null||typeof v==='undefined') return null;
  var s=String(v).replace(/\u00a0/g,' ').replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(',','.');
  if(!s) return null;
  var n=Number(s);
  return isFinite(n)?n:null;
};

AG24_PI_V1_3.text_ = function(v) {
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
};

AG24_PI_V1_3.stage_ = function(v) {
  var x=AG24_PI_V1_3.text_(v);
  if(!x) return null;
  if(x.indexOf('PME ETABLIE')>=0||x.indexOf('ESTABLISHED')>=0) return 'ESTABLISHED_SME';
  if(x.indexOf('CROISSANCE')>=0||x.indexOf('GROWTH')>=0) return 'GROWTH';
  if(x.indexOf('PREMIERS REVENUS')>=0||x.indexOf('COMMENCE A VENDRE')>=0||x.indexOf('EARLY REVENUE')>=0) return 'EARLY_REVENUE';
  if(x.indexOf('LANCEMENT')>=0||x.indexOf('LAUNCH')>=0) return 'LAUNCH';
  if(x.indexOf('PILOTE')>=0||x.indexOf('PILOT')>=0) return 'PILOT';
  if(x.indexOf('PROTOTYPE')>=0) return 'PROTOTYPE';
  if(x.indexOf('IDEE STRUCTUREE')>=0||x.indexOf('STRUCTURED IDEA')>=0) return 'STRUCTURED_IDEA';
  if(x==='IDEE'||x==='IDEA') return 'IDEA';
  return String(v||'').trim();
};

AG24_PI_V1_3.financing_ = function(v) {
  var x=AG24_PI_V1_3.text_(v);
  if(!x) return null;
  if(x.indexOf('PRET')>=0||x.indexOf('BANK')>=0||x.indexOf('BANCAIRE')>=0) return 'BANK_LOAN';
  if(x.indexOf('DETTE')>=0||x.indexOf('DEBT')>=0) return 'DEBT';
  if(x.indexOf('SUBVENTION')>=0||x.indexOf('GRANT')>=0) return 'GRANT';
  if(x.indexOf('EQUITY')>=0||x.indexOf('CAPITAL')>=0||x.indexOf('INVEST')>=0) return 'EQUITY';
  return 'OTHER';
};

AG24_PI_V1_3.loadSubmission_ = function(submissionId) {
  if(typeof AG24_DATASTORE_resolveReference_!=='function') throw new Error('AG24_DATASTORE_REFERENCE_RESOLVER_UNAVAILABLE');
  var id=String(submissionId||'').trim();
  if(!id) throw new Error('AG24_SUBMISSION_ID_REQUIRED');

  var sheet=SpreadsheetApp.openById(AFRIGREEN24_SHEET_ID).getSheetByName(AFRIGREEN24_SHEET_NAME);
  if(!sheet) throw new Error('AG24_SUBMISSIONS_SHEET_NOT_FOUND');

  var cell=sheet.getRange(1,1,Math.max(1,sheet.getLastRow()),1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  if(!cell) throw new Error('AG24_SUBMISSION_NOT_FOUND:'+id);

  var row=cell.getRow();
  var values=sheet.getRange(row,1,1,33).getValues()[0];
  var qRefText=String(values[31]||'').trim();
  var cRefText=String(values[32]||'').trim();
  if(!qRefText) throw new Error('AG24_QUESTIONNAIRE_REFERENCE_MISSING');

  return {
    submissionId:id,
    row:row,
    questionnaire:AG24_DATASTORE_resolveReference_(qRefText)||{},
    commercialProfile:cRefText?AG24_DATASTORE_resolveReference_(cRefText):{},
    questionnaireReference:JSON.parse(qRefText)
  };
};

AG24_PI_V1_3.buildCanonical_ = function(source) {
  source=source||{};
  var q=source.questionnaire||{};
  var F=AG24_PI_V1_3.first_, N=AG24_PI_V1_3.number_;
  var p={
    schemaVersion:'AG24_CANONICAL_PROJECT_V1',
    documentContext:{
      audience:'GENERIC',
      language:String(F(q,['language','langue'],'fr')),
      currency:String(F(q,['currency','devise'],'XAF')),
      country:String(F(q,['country','pays','projectCountry'],''))
    },
    identity:{
      projectName:String(F(q,['projectName','nomProjet','projet','titreProjet'],'')),
      ownerName:String(F(q,['promoterName','nom','porteurProjet','nomPorteur','fullName'],'')),
      country:String(F(q,['country','pays','projectCountry'],'')),
      sector:String(F(q,['sector','secteur','activitySector'],'')),
      stage:AG24_PI_V1_3.stage_(F(q,['stage','stade','projectStage'],''))
    },
    problem:{statement:String(F(q,['problem','probleme','projectProblem'],''))},
    solution:{description:String(F(q,['solution','projectSolution'],''))},
    market:{
      tam:{value:N(F(q,['tam','tamValue','marketTam'],null))},
      sam:{value:N(F(q,['sam','samValue','marketSam'],null))},
      som:{value:N(F(q,['som','somValue','marketSom'],null))}
    },
    businessModel:{
      pricingModel:F(q,['pricingModel','modeleTarification','billingModel'],null),
      averageMonthlyPrice:N(F(q,['averageMonthlyPrice','prixMensuelMoyen','monthlyPrice'],null)),
      contractDurationMonths:N(F(q,['contractDurationMonths','dureeContratMois','subscriptionDurationMonths'],null))
    },
    traction:{
      payingCustomers:N(F(q,['payingCustomers','clientsPayants','nombreClientsPayants'],null)),
      revenueToDate:N(F(q,['revenueToDate','chiffreAffairesCumule','revenueHistorical'],null))
    },
    funding:{
      amount:N(F(q,['fundingAmount','montantFinancement','montantRecherche','amountRequested'],null)),
      currency:String(F(q,['fundingCurrency','currency','devise'],'XAF')),
      instrument:AG24_PI_V1_3.financing_(F(q,['fundingType','typeFinancement','financingType'],''))
    },
    debt:{
      interestRate:N(F(q,['interestRate','tauxInteretAnnuel','annualInterestRate'],null)),
      termMonths:N(F(q,['termMonths','dureeRemboursementMois','loanTermMonths'],null)),
      gracePeriodMonths:N(F(q,['gracePeriodMonths','differeMois'],0)),
      annualDebtService:null,
      dscr:null
    },
    financialModel:{cfads:N(F(q,['cfads','cashFlowAvailableForDebtService'],null))},
    unitEconomics:{grossMargin:N(F(q,['grossMargin','margeBrute','grossMarginPct'],null))},
    risk:{items:Array.isArray(q.risks)?q.risks:(Array.isArray(q.risques)?q.risques:[])},
    roadmap:{milestones:Array.isArray(q.roadmapMilestones)?q.roadmapMilestones:(Array.isArray(q.roadmap)?q.roadmap:[])},
    metadata:{
      snapshotId:'SUBMISSION_'+String(source.submissionId||''),
      sourceSubmissionId:String(source.submissionId||''),
      sourceRow:Number(source.row||0),
      source:'AFRIGREEN24_DATASTORE'
    }
  };

  AG24_PI_V1_1.Provenance.ensure(p);
  var evidenceId='EVID_SUBMISSION_'+String(source.submissionId||'');
  p=AG24_PI_V1_1.Provenance.addEvidence(p,{
    evidenceId:evidenceId,
    type:'DATASTORE_SNAPSHOT',
    title:'AfriGreen24 Business Plan submission '+String(source.submissionId||''),
    documentId:source.questionnaireReference&&source.questionnaireReference.fileId||null,
    supports:[],
    reliability:'HIGH',
    verifiedAt:new Date().toISOString()
  });

  var paths=[
    'identity.projectName','identity.ownerName','identity.country','identity.sector','identity.stage',
    'problem.statement','solution.description','businessModel.pricingModel','businessModel.averageMonthlyPrice',
    'businessModel.contractDurationMonths','traction.payingCustomers','traction.revenueToDate',
    'funding.amount','funding.currency','funding.instrument','debt.interestRate','debt.termMonths',
    'debt.gracePeriodMonths','financialModel.cfads','unitEconomics.grossMargin',
    'market.tam.value','market.sam.value','market.som.value'
  ];

  paths.forEach(function(path){
    if(AG24_PI_V1_1.Util.present(AG24_PI_V1_1.Util.get(p,path))){
      p=AG24_PI_V1_1.Provenance.annotate(p,path,{
        truthStatus:'DOCUMENTED',
        source:{type:'STANDARD_BUSINESS_PLAN',ref:String(source.submissionId||'')},
        evidenceRefs:[evidenceId],
        confidence:'HIGH'
      });
    }
  });
  p.evidence.items[0].supports=paths.filter(function(path){
    return AG24_PI_V1_1.Util.present(AG24_PI_V1_1.Util.get(p,path));
  });

  return p;
};
