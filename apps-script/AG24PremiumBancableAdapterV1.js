/**
 * AfriGreen24 — Premium Bancable Adapter V1
 *
 * Deterministic bridge from the validated Business Plan Bancable dossier
 * (standard + bancable + audit + financial model) to:
 *   1) BusinessPlanDesignSystemV2 flat render data
 *   2) Project Intelligence canonical snapshot
 *
 * No AI call. No persistence side effect. No declared value is promoted to
 * documented/external evidence. Calculated values are explicitly CALCULATED.
 */
var AG24_PREMIUM_BANCABLE_ADAPTER_V1 = Object.freeze({
  VERSION:"1.0.0",
  AUDIENCE:"BANK"
});

function AG24_PREMIUM_BANCABLE_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_BANCABLE_number_(value) {
  if (value === null || value === undefined || value === "") return null;
  var clean = typeof value === "string"
    ? value.replace(/\s/g,"").replace(/[^0-9,.-]/g,"").replace(",",".")
    : value;
  var number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function AG24_PREMIUM_BANCABLE_stage_(value) {
  var raw = AG24_PREMIUM_BANCABLE_text_(value).toUpperCase();

  if (raw.indexOf("EXPANS") !== -1) return "GROWTH";
  if (raw.indexOf("ÉTABL") !== -1 || raw.indexOf("ETABL") !== -1) {
    return "ESTABLISHED_SME";
  }
  if (raw.indexOf("VENT") !== -1) return "EARLY_REVENUE";
  if (raw.indexOf("LANC") !== -1) return "LAUNCH";
  if (raw.indexOf("PROTOT") !== -1 || raw.indexOf("PILOT") !== -1) {
    return "PILOT";
  }
  if (raw.indexOf("IDÉE") !== -1 || raw.indexOf("IDEE") !== -1) {
    return "IDEA";
  }

  return raw || "";
}

function AG24_PREMIUM_BANCABLE_riskSeverity_(probability, impact) {
  function score_(value) {
    var text = AG24_PREMIUM_BANCABLE_text_(value).toUpperCase();
    if (text.indexOf("ÉLEV") !== -1 || text.indexOf("ELEV") !== -1) return 3;
    if (text.indexOf("MOY") !== -1) return 2;
    if (text.indexOf("FAIB") !== -1) return 1;
    return 0;
  }

  var p = score_(probability);
  var i = score_(impact);
  var score = p * i;

  if (score >= 6) return "HIGH";
  if (score >= 3) return "MEDIUM";
  if (score >= 1) return "LOW";
  return "";
}

function AG24_PREMIUM_BANCABLE_useOfFunds_(items) {
  return (Array.isArray(items) ? items : [])
    .map(function(item) {
      return {
        label:AG24_PREMIUM_BANCABLE_text_(item && item.poste),
        value:AG24_PREMIUM_BANCABLE_number_(item && item.montant)
      };
    })
    .filter(function(item) {
      return item.label && item.value !== null && item.value > 0;
    });
}

function AG24_PREMIUM_BANCABLE_risks_(items) {
  var normalized = (Array.isArray(items) ? items : [])
    .map(function(item) {
      return {
        risk:AG24_PREMIUM_BANCABLE_text_(item && item.risque),
        severity:AG24_PREMIUM_BANCABLE_riskSeverity_(
          item && item.probabilite,
          item && item.impact
        ),
        mitigation:AG24_PREMIUM_BANCABLE_text_(item && item.mesure)
      };
    })
    .filter(function(item) {
      return item.risk;
    });

  var levels = {};
  var mitigations = {};

  normalized.forEach(function(item,index) {
    levels[String(index)] = item.severity;
    mitigations[String(index)] = item.mitigation;
  });

  return {
    normalized:normalized,
    raw:normalized.map(function(item){return item.risk;}).join(";"),
    levels:levels,
    mitigations:mitigations
  };
}

function AG24_PREMIUM_BANCABLE_team_(standard, premium) {
  var parts = [];

  var promoter = AG24_PREMIUM_BANCABLE_text_(standard.nomPromoteur);
  if (promoter) {
    parts.push(
      promoter +
      (
        AG24_PREMIUM_BANCABLE_text_(standard.fonctionPromoteur)
          ? " — " + AG24_PREMIUM_BANCABLE_text_(standard.fonctionPromoteur)
          : ""
      )
    );
  }

  var ops = AG24_PREMIUM_BANCABLE_text_(premium.responsableOperations);
  if (ops) parts.push("Opérations : " + ops);

  var finance = AG24_PREMIUM_BANCABLE_text_(premium.responsableFinances);
  if (finance) parts.push("Finances : " + finance);

  var headcount = AG24_PREMIUM_BANCABLE_number_(premium.effectifActuel);
  if (headcount !== null) parts.push("Effectif actuel : " + String(headcount));

  return parts.join(" · ");
}

function AG24_PREMIUM_BANCABLE_renderData_(dossier, modele) {
  dossier = dossier || {};
  var standard = dossier.standard || {};
  var premium = dossier.bancable || {};
  var audit = dossier.audit || {};
  var indicators = audit.indicateurs || {};
  var risks = AG24_PREMIUM_BANCABLE_risks_(premium.risques);

  var allocations =
    AG24_PREMIUM_BANCABLE_useOfFunds_(premium.utilisationFonds);

  var useOfFundsText = allocations
    .map(function(item) {
      return item.label + " : " + String(item.value);
    })
    .join(" · ");

  return {
    projectName:
      standard.nomProjet || "Projet",
    promoterName:
      standard.nomPromoteur || "",
    country:
      standard.pays || "",
    sector:
      standard.secteur || "",
    stage:
      premium.stadeProjet || standard.stade || "",
    problem:
      standard.problemeResolu || "",
    solution:
      standard.solution || standard.descriptionProjet || "",
    valueProposition:
      standard.avantageConcurrentiel || standard.solution || "",
    benefit:
      standard.avantageConcurrentiel || "",
    targetCustomers:
      standard.clientsCibles || "",
    marketArea:
      standard.tailleMarche || standard.pays || "",
    competitors:
      standard.concurrents || "",
    revenueModel:
      standard.sourcesRevenus || "",
    salesChannels:
      standard.strategieCommerciale || "",
    team:
      AG24_PREMIUM_BANCABLE_team_(standard,premium),
    governance:"",
    fundingNeed:
      AG24_PREMIUM_BANCABLE_number_(premium.montantDemande),
    fundingType:"BANK_LOAN",
    currency:
      premium.devise || indicators.devise || "XOF",
    useOfFunds:
      useOfFundsText,
    useOfFundsAllocation:
      allocations,
    payingCustomers:
      AG24_PREMIUM_BANCABLE_number_(premium.nombreClientsActuels),
    revenueToDate:
      AG24_PREMIUM_BANCABLE_number_(premium.chiffreAffairesHistorique),
    grossMargin:
      AG24_PREMIUM_BANCABLE_number_(indicators.tauxMargeBrutePct),
    cfads:
      AG24_PREMIUM_BANCABLE_number_(
        indicators.capaciteDisponibleAvantNouvelleDette
      ) !== null
        ? AG24_PREMIUM_BANCABLE_number_(
            indicators.capaciteDisponibleAvantNouvelleDette
          ) * 12
        : null,
    risks:
      risks.raw,
    riskLevels:
      risks.levels,
    riskMitigations:
      risks.mitigations,
    roadmapNow:
      premium.stadeProjet || standard.stade || "",
    roadmap6Months:"",
    roadmap12Months:"",
    roadmap24Months:"",
    roadmapObjective:
      premium.justificationCroissance || "",
    impact:"",
    documentAudience:"BANK"
  };
}

function AG24_PREMIUM_BANCABLE_provenance_(project,path,status,sourceRef) {
  if (!project.metadata) project.metadata = {};
  if (!project.metadata.provenance) project.metadata.provenance = {};

  project.metadata.provenance[path] = {
    truthStatus:status,
    source:{
      type:
        status === "CALCULATED"
          ? "SYSTEM_CALCULATION"
          : "USER_INPUT",
      ref:sourceRef || "BUSINESS_PLAN_BANCABLE"
    },
    evidenceRefs:[],
    confidence:
      status === "CALCULATED"
        ? "HIGH"
        : "DECLARED"
  };
}

function AG24_PREMIUM_BANCABLE_projectIntelligence_(dossier, modele) {
  dossier = dossier || {};
  var standard = dossier.standard || {};
  var premium = dossier.bancable || {};
  var audit = dossier.audit || {};
  var indicators = audit.indicateurs || {};
  var currency = premium.devise || indicators.devise || "XOF";

  var cfadsMonthly =
    AG24_PREMIUM_BANCABLE_number_(
      indicators.capaciteDisponibleAvantNouvelleDette
    );
  var cfads =
    cfadsMonthly !== null
      ? cfadsMonthly * 12
      : null;

  var annualDebtService =
    AG24_PREMIUM_BANCABLE_number_(
      indicators.serviceNouvelleDetteAn1
    );

  if (
    annualDebtService === null &&
    modele &&
    modele.echeancier &&
    Array.isArray(modele.echeancier.annuel) &&
    modele.echeancier.annuel[0]
  ) {
    annualDebtService =
      AG24_PREMIUM_BANCABLE_number_(
        modele.echeancier.annuel[0].paiements
      );
  }

  var dscr =
    cfads !== null &&
    annualDebtService !== null &&
    annualDebtService > 0
      ? Math.round((cfads / annualDebtService) * 10000) / 10000
      : null;

  var project = {
    schemaVersion:"AG24_CANONICAL_PROJECT_V1",
    documentContext:{
      audience:"BANK",
      language:"fr",
      currency:String(currency),
      country:AG24_PREMIUM_BANCABLE_text_(standard.pays)
    },
    identity:{
      projectName:AG24_PREMIUM_BANCABLE_text_(standard.nomProjet),
      ownerName:AG24_PREMIUM_BANCABLE_text_(standard.nomPromoteur),
      country:AG24_PREMIUM_BANCABLE_text_(standard.pays),
      sector:AG24_PREMIUM_BANCABLE_text_(standard.secteur),
      stage:AG24_PREMIUM_BANCABLE_stage_(premium.stadeProjet || standard.stade)
    },
    problem:{
      statement:AG24_PREMIUM_BANCABLE_text_(standard.problemeResolu)
    },
    solution:{
      description:AG24_PREMIUM_BANCABLE_text_(standard.solution)
    },
    market:{
      tam:{value:null},
      sam:{value:null},
      som:{value:null}
    },
    businessModel:{
      pricingModel:AG24_PREMIUM_BANCABLE_text_(standard.sourcesRevenus),
      averageMonthlyPrice:null,
      contractDurationMonths:null
    },
    traction:{
      payingCustomers:
        AG24_PREMIUM_BANCABLE_number_(premium.nombreClientsActuels),
      revenueToDate:
        AG24_PREMIUM_BANCABLE_number_(premium.chiffreAffairesHistorique)
    },
    funding:{
      amount:AG24_PREMIUM_BANCABLE_number_(premium.montantDemande),
      currency:String(currency),
      instrument:"BANK_LOAN",
      allocation:AG24_PREMIUM_BANCABLE_useOfFunds_(premium.utilisationFonds)
    },
    debt:{
      interestRate:
        AG24_PREMIUM_BANCABLE_number_(premium.tauxInteretAnnuel),
      termMonths:
        AG24_PREMIUM_BANCABLE_number_(premium.dureeRemboursementMois),
      gracePeriodMonths:
        AG24_PREMIUM_BANCABLE_number_(premium.differeMois) || 0,
      annualDebtService:annualDebtService,
      dscr:dscr
    },
    financialModel:{
      cfads:cfads
    },
    unitEconomics:{
      grossMargin:
        AG24_PREMIUM_BANCABLE_number_(indicators.tauxMargeBrutePct)
    },
    risk:{
      items:AG24_PREMIUM_BANCABLE_risks_(premium.risques).normalized
    },
    roadmap:{
      milestones:[]
    },
    evidence:{
      items:[]
    },
    metadata:{
      snapshotId:
        "BPB_" + AG24_PREMIUM_BANCABLE_text_(dossier.dossierId),
      sourceDossierId:
        AG24_PREMIUM_BANCABLE_text_(dossier.dossierId),
      source:"BUSINESS_PLAN_BANCABLE",
      provenance:{}
    }
  };

  [
    "identity.projectName",
    "identity.ownerName",
    "identity.country",
    "identity.sector",
    "identity.stage",
    "problem.statement",
    "solution.description",
    "businessModel.pricingModel",
    "traction.payingCustomers",
    "traction.revenueToDate",
    "funding.amount",
    "funding.currency",
    "funding.instrument",
    "debt.interestRate",
    "debt.termMonths",
    "debt.gracePeriodMonths"
  ].forEach(function(path) {
    var value =
      typeof AG24_PREMIUM_VISUALS_get_ === "function"
        ? AG24_PREMIUM_VISUALS_get_(project,path)
        : path.split(".").reduce(function(current,key) {
            return current === null || current === undefined
              ? undefined
              : current[key];
          },project);

    if (
      value !== null &&
      value !== undefined &&
      AG24_PREMIUM_BANCABLE_text_(value) !== ""
    ) {
      AG24_PREMIUM_BANCABLE_provenance_(
        project,
        path,
        "DECLARED",
        "BUSINESS_PLAN_BANCABLE"
      );
    }
  });

  [
    "financialModel.cfads",
    "unitEconomics.grossMargin",
    "debt.annualDebtService",
    "debt.dscr"
  ].forEach(function(path) {
    var value = path.split(".").reduce(function(current,key) {
      return current === null || current === undefined
        ? undefined
        : current[key];
    },project);

    if (value !== null && value !== undefined) {
      AG24_PREMIUM_BANCABLE_provenance_(
        project,
        path,
        "CALCULATED",
        path === "debt.annualDebtService"
          ? "AG24_FIN_DEBT_SCHEDULE"
          : path === "debt.dscr"
            ? "AG24_DSCR_V1"
            : "BPB_AUDIT_INDICATORS"
      );
    }
  });

  return project;
}

function AG24_PREMIUM_BANCABLE_ADAPTER_build_(dossier, modele) {
  return {
    success:true,
    version:AG24_PREMIUM_BANCABLE_ADAPTER_V1.VERSION,
    audience:"BANK",
    data:
      AG24_PREMIUM_BANCABLE_renderData_(dossier,modele),
    projectIntelligence:
      AG24_PREMIUM_BANCABLE_projectIntelligence_(dossier,modele)
  };
}

function AG24_PREMIUM_BANCABLE_ADAPTER_SYSTEM_TEST_V1() {
  var report = {
    success:false,
    version:AG24_PREMIUM_BANCABLE_ADAPTER_V1.VERSION,
    audience:"",
    allocationMapped:false,
    riskMapped:false,
    declaredNotPromoted:false,
    calculatedFinancials:false,
    dscrValue:null,
    failureCode:""
  };

  try {
    var dossier = {
      dossierId:"BPB_TEST_V1",
      standard:{
        nomProjet:"Mango Value",
        nomPromoteur:"Awa Diallo",
        fonctionPromoteur:"Fondatrice",
        pays:"Sénégal",
        secteur:"Agroalimentaire",
        stade:"Premières ventes",
        problemeResolu:"Pertes post-récolte élevées.",
        solution:"Transformation locale de mangues.",
        clientsCibles:"Distributeurs et hôtels",
        tailleMarche:"Sénégal",
        concurrents:"Artisans locaux;Produits importés",
        avantageConcurrentiel:"Traçabilité et qualité régulière",
        sourcesRevenus:"Vente de produits transformés",
        strategieCommerciale:"Vente B2B directe"
      },
      bancable:{
        devise:"XOF",
        stadeProjet:"Premières ventes",
        montantDemande:20000000,
        utilisationFonds:[
          {poste:"Équipements",montant:14000000},
          {poste:"Fonds de roulement",montant:6000000}
        ],
        nombreClientsActuels:18,
        chiffreAffairesHistorique:8500000,
        responsableOperations:"Awa Diallo",
        responsableFinances:"RAF",
        effectifActuel:4,
        tauxInteretAnnuel:10,
        dureeRemboursementMois:60,
        differeMois:3,
        risques:[
          {
            risque:"Risque d'approvisionnement",
            probabilite:"Moyenne",
            impact:"Élevé",
            mesure:"Diversifier les fournisseurs."
          }
        ]
      },
      audit:{
        indicateurs:{
          devise:"XOF",
          tauxMargeBrutePct:56.4,
          capaciteDisponibleAvantNouvelleDette:2350000,
          serviceNouvelleDetteAn1:5200000
        }
      }
    };

    var adapted =
      AG24_PREMIUM_BANCABLE_ADAPTER_build_(dossier,{});

    var project = adapted.projectIntelligence;

    report.audience = adapted.audience;

    report.allocationMapped =
      adapted.data.useOfFundsAllocation.length === 2 &&
      project.funding.allocation.length === 2 &&
      project.funding.amount === 20000000;

    report.riskMapped =
      adapted.data.risks.indexOf("Risque d'approvisionnement") !== -1 &&
      adapted.data.riskLevels["0"] === "HIGH" &&
      adapted.data.riskMitigations["0"] === "Diversifier les fournisseurs.";

    report.declaredNotPromoted =
      project.metadata.provenance["funding.amount"].truthStatus === "DECLARED" &&
      project.metadata.provenance["traction.payingCustomers"].truthStatus === "DECLARED";

    report.calculatedFinancials =
      project.metadata.provenance["financialModel.cfads"].truthStatus === "CALCULATED" &&
      project.metadata.provenance["debt.annualDebtService"].truthStatus === "CALCULATED" &&
      project.metadata.provenance["debt.dscr"].truthStatus === "CALCULATED";

    report.dscrValue = project.debt.dscr;

    report.success =
      report.audience === "BANK" &&
      report.allocationMapped === true &&
      report.riskMapped === true &&
      report.declaredNotPromoted === true &&
      report.calculatedFinancials === true &&
      report.dscrValue === 5.4231;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_BANCABLE_ADAPTER_CONTRACT_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message ? String(error.message) : String(error);
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
