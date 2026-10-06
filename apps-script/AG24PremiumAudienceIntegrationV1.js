/**
 * AfriGreen24 — Premium Audience Composer Integration Test V1
 *
 * Verifies that BusinessPlanDesignSystemV2 delegates real body composition to
 * the audience composer and that rendered section order changes by audience.
 */
var AG24_PREMIUM_AUDIENCE_INTEGRATION_V1 = Object.freeze({
  VERSION:"1.1.0"
});

function AG24_PREMIUM_AUDIENCE_INTEGRATION_fixture_(audience) {
  return {
    documentAudience:audience,
    projectName:"Solar Service Test",
    promoterName:"Test Founder",
    country:"Cameroun",
    sector:"Énergie solaire",
    stage:"Premiers revenus",
    problem:"Les PME subissent des coûts énergétiques élevés.",
    affectedPeople:"PME urbaines",
    urgency:"Les coupures et le coût du diesel pèsent sur les opérations.",
    solution:"Service solaire par abonnement avec maintenance incluse.",
    valueProposition:"Réduction des coûts sans CAPEX initial.",
    benefit:"Énergie plus prévisible et plus propre.",
    targetCustomers:"PME",
    marketArea:"Cameroun",
    competitors:"Groupes diesel;Réseau électrique;Installateurs solaires",
    revenueModel:"Abonnement mensuel",
    pricing:"Contrat mensuel récurrent",
    mainCosts:"Équipements, installation, maintenance",
    salesChannels:"Vente directe et partenariats",
    team:"Fondateur, opérations, commercial",
    governance:"Décisions stratégiques documentées par la direction.",
    legalForm:"SARL",
    fundingNeed:150000,
    fundingType:
      audience === "INVESTOR"
        ? "EQUITY"
        : audience === "GRANT"
          ? "GRANT"
          : "BANK_LOAN",
    currency:"EUR",
    useOfFunds:"Équipements, commercial et fonds de roulement",
    useOfFundsAllocation:[
      {label:"Équipements",value:80000},
      {label:"Commercial",value:30000},
      {label:"Fonds de roulement",value:40000}
    ],
    impact:"Réduction du recours au diesel.",
    economicImpact:"Baisse des dépenses énergétiques.",
    socialImpact:"Amélioration de la continuité d’activité.",
    environmentalImpact:"Réduction des émissions liées au diesel.",
    risks:"Adoption commerciale;Risque de change",
    riskLevels:{"0":"MEDIUM","1":"HIGH"},
    riskMitigations:{
      "0":"Pilotes commerciaux et suivi du pipeline.",
      "1":"Révision des prix et couverture contractuelle."
    },
    roadmapNow:"Pilote actif",
    roadmap6Months:"30 clients",
    roadmap12Months:"Expansion nationale",
    roadmap24Months:"Deuxième marché",
    roadmapObjective:"Atteindre une base récurrente de clients PME.",
    payingCustomers:18,
    revenueToDate:44000,
    mrr:8100,
    grossMargin:42,
    cfads:72000,
    tam:10000000,
    sam:3000000,
    som:600000,
    email:"test@example.com",
    phone:"+000000000"
  };
}

function AG24_PREMIUM_AUDIENCE_INTEGRATION_render_(audience) {
  var documentId = "";
  var result = {
    audience:audience,
    success:false,
    composerActive:false,
    orderPass:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Audience Integration " +
      audience +
      " " +
      String(new Date().getTime())
    );
    documentId = doc.getId();

    var renderResult =
      AG24_BP_V2_renderDocument_(
        doc,
        AG24_PREMIUM_AUDIENCE_INTEGRATION_fixture_(audience),
        {
          audience:audience
        }
      );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    result.composerActive =
      Boolean(
        renderResult &&
        renderResult.audienceComposer &&
        renderResult.audienceComposer.success === true &&
        renderResult.audienceComposer.audience === audience
      );

    if (audience === "BANK") {
      var bankMarket = text.indexOf("Marché et clientèle");
      var bankBusinessModel = text.indexOf("Modèle économique");
      var bankGoToMarket = text.indexOf("Stratégie commerciale");
      var bankOperations = text.indexOf("Organisation opérationnelle");
      var bankTeam = text.indexOf("Équipe & gouvernance");
      var bankTraction = text.indexOf("Traction & preuves");
      var bankFinancialStory = text.indexOf("Financial Story");
      var bankReadiness = text.indexOf("Readiness financière");
      var bankFinancial =
        bankReadiness !== -1
          ? bankReadiness
          : bankFinancialStory;
      var bankFunding = text.indexOf("Objectif financé");
      var bankProblem = text.indexOf("Problème et opportunité");
      var bankSolution = text.indexOf("Solution et proposition de valeur");
      var bankCompetition = text.indexOf("Concurrence & positionnement");

      result.orderPass =
        bankMarket !== -1 &&
        bankBusinessModel !== -1 &&
        bankGoToMarket !== -1 &&
        bankOperations !== -1 &&
        bankTeam !== -1 &&
        bankTraction !== -1 &&
        bankFinancial !== -1 &&
        bankFunding !== -1 &&
        bankMarket < bankBusinessModel &&
        bankBusinessModel < bankGoToMarket &&
        bankGoToMarket < bankOperations &&
        bankOperations < bankTeam &&
        bankTeam < bankTraction &&
        bankTraction < bankFinancial &&
        bankFinancial < bankFunding &&
        bankProblem === -1 &&
        bankSolution === -1 &&
        bankCompetition === -1;
    } else if (audience === "INVESTOR") {
      var investorProblem = text.indexOf("Problème et opportunité");
      var investorMarket = text.indexOf("Marché et clientèle");
      var investorCompetition = text.indexOf("Concurrence & positionnement");
      var investorTraction = text.indexOf("Traction & preuves");

      var investorProject =
        text.indexOf("Présentation du projet");
      var investorOperations =
        text.indexOf("Organisation opérationnelle");

      result.orderPass =
        investorProblem !== -1 &&
        investorMarket !== -1 &&
        investorCompetition !== -1 &&
        investorTraction !== -1 &&
        investorProblem < investorMarket &&
        investorMarket < investorCompetition &&
        investorCompetition < investorTraction &&
        investorProject === -1 &&
        investorOperations === -1;
    }

    reopened.saveAndClose();

    result.success =
      result.composerActive === true &&
      result.orderPass === true;

    if (!result.success) {
      result.failureCode =
        "PREMIUM_AUDIENCE_INTEGRATION_ORDER_FAILED";
    }
  } catch (error) {
    result.failureCode =
      error && error.message ? String(error.message) : String(error);
  } finally {
    if (documentId) {
      try {
        var file = DriveApp.getFileById(documentId);
        file.setTrashed(true);
        result.cleanupSuccess = file.isTrashed() === true;
      } catch (cleanupError) {
        result.cleanupSuccess = false;
      }
    }

    result.success =
      result.success &&
      result.cleanupSuccess;
  }

  return result;
}

function AG24_PREMIUM_AUDIENCE_INTEGRATION_SYSTEM_TEST_V1() {
  var bank =
    AG24_PREMIUM_AUDIENCE_INTEGRATION_render_("BANK");
  var investor =
    AG24_PREMIUM_AUDIENCE_INTEGRATION_render_("INVESTOR");

  var report = {
    success:
      bank.success === true &&
      investor.success === true,
    version:
      AG24_PREMIUM_AUDIENCE_INTEGRATION_V1.VERSION,
    bankComposerActive:
      bank.composerActive,
    bankOrderPass:
      bank.orderPass,
    investorComposerActive:
      investor.composerActive,
    investorOrderPass:
      investor.orderPass,
    cleanupSuccess:
      bank.cleanupSuccess &&
      investor.cleanupSuccess,
    failureCode:""
  };

  if (!report.success) {
    report.failureCode =
      bank.failureCode ||
      investor.failureCode ||
      "PREMIUM_AUDIENCE_INTEGRATION_FAILED";
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
