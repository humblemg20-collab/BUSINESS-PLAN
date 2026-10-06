/**
 * AfriGreen24 — Business Plan Reference Benchmark V1
 *
 * Purpose
 * -------
 * Do not invent a proprietary Business Plan structure from scratch.
 * Encode high-level patterns derived from established public business-plan
 * guidance and examples, then let AfriGreen24 adapt those patterns to the
 * canonical project truth and target audience.
 *
 * Sources benchmarked (structure/patterns only, no copied prose):
 * - Bpifrance Création — "Construire son projet - Modèle de dossier"
 *   and "Construire son projet - Mode d'emploi"
 * - U.S. Small Business Administration — Traditional business plan guidance
 * - Futurpreneur Canada — Business Plan Writer + sector examples
 *
 * Deterministic. No AI call. No network call. No persistence side effect.
 */
var AG24_BP_REFERENCE_BENCHMARK_V1 = Object.freeze({
  VERSION:"1.0.0",

  PRINCIPLES:Object.freeze({
    copySourceIdentity:false,
    copySourceText:false,
    deriveSharedPatterns:true,
    preserveCanonicalTruth:true,
    audienceFirst:true,
    financeRequestMustTieToFinancials:true,
    projectionsMustTieToFundingRequest:true,
    sectorExamplesMayAdaptStructure:true
  }),

  SOURCES:Object.freeze({
    BPIFRANCE:Object.freeze({
      id:"BPIFRANCE",
      role:"PRIMARY_LENDER_STRUCTURE",
      authorityType:"PUBLIC_ENTREPRENEURSHIP_AGENCY",
      intendedReaders:Object.freeze([
        "BANK","FINANCIER","SUPPLIER","PARTNER"
      ]),
      patterns:Object.freeze([
        "project_overview",
        "market",
        "business_model",
        "opportunities_and_risks",
        "commercial_strategy",
        "development_outlook",
        "promoter_and_support",
        "financing_plan"
      ])
    }),

    SBA:Object.freeze({
      id:"SBA",
      role:"TRADITIONAL_BUSINESS_PLAN_STANDARD",
      authorityType:"PUBLIC_SMALL_BUSINESS_AGENCY",
      intendedReaders:Object.freeze([
        "LENDER","INVESTOR"
      ]),
      patterns:Object.freeze([
        "executive_summary",
        "company_description",
        "market_analysis",
        "organization_and_management",
        "product_or_service",
        "marketing_and_sales",
        "funding_request",
        "financial_projections",
        "appendix"
      ]),
      financingSpecific:Object.freeze([
        "funding_amount",
        "debt_or_equity",
        "requested_terms",
        "use_of_funds",
        "future_financial_plan",
        "forecast_income_statement",
        "forecast_balance_sheet",
        "forecast_cash_flow",
        "capex_budget",
        "assumptions"
      ])
    }),

    FUTURPRENEUR:Object.freeze({
      id:"FUTURPRENEUR",
      role:"SECTOR_ADAPTATION_AND_EXECUTION",
      authorityType:"ENTREPRENEUR_SUPPORT_ORGANIZATION",
      intendedReaders:Object.freeze([
        "ENTREPRENEUR","LENDER","PROGRAM"
      ]),
      patterns:Object.freeze([
        "customize_to_business",
        "industry_specific_examples",
        "cost_structure",
        "risk_outline",
        "cash_flow_management",
        "operating_model"
      ]),
      sectorProfiles:Object.freeze([
        "AGRICULTURE",
        "FOOD_PRODUCTION",
        "SERVICE",
        "RETAIL",
        "SOCIAL_PURPOSE"
      ])
    })
  }),

  SHARED_CORE:Object.freeze([
    "executive-summary",
    "project",
    "market",
    "business-model",
    "go-to-market",
    "team-governance",
    "financial-story",
    "funding",
    "risks",
    "roadmap",
    "evidence-appendix"
  ]),

  BANK_BLUEPRINT:Object.freeze({
    id:"BANK_REFERENCE_V1",
    basis:Object.freeze([
      "BPIFRANCE",
      "SBA",
      "FUTURPRENEUR"
    ]),
    order:Object.freeze([
      "executive-summary",
      "project",
      "market",
      "business-model",
      "go-to-market",
      "operations",
      "team-governance",
      "traction",
      "financial-story",
      "funding",
      "risks",
      "roadmap",
      "evidence-appendix",
      "closing"
    ]),
    executiveSummaryMustAnswer:Object.freeze([
      "what_is_the_project",
      "who_is_the_promoter",
      "who_is_the_customer",
      "how_does_it_make_money",
      "how_much_funding",
      "what_is_funding_for",
      "why_is_repayment_or_financial_success_plausible"
    ]),
    lenderCore:Object.freeze([
      "funding_amount",
      "use_of_funds",
      "debt_terms_if_known",
      "cash_flow",
      "repayment_capacity",
      "financial_projections",
      "assumptions",
      "risks_and_mitigation",
      "management",
      "market"
    ]),
    preferredRepresentations:Object.freeze({
      executive_summary:"narrative_plus_decision_metrics",
      project:"fact_grid_plus_short_narrative",
      market:"short_narrative_plus_market_facts",
      business_model:"revenue_cost_margin_logic",
      go_to_market:"customer_acquisition_sales_retention",
      operations:"operating_model",
      team_governance:"roles_responsibilities_governance",
      financial_story:"financial_tables_plus_key_ratios",
      funding:"funding_request_plus_use_of_funds",
      risks:"risk_register",
      roadmap:"milestones",
      evidence_appendix:"supporting_documents"
    })
  }),

  INVESTOR_BLUEPRINT:Object.freeze({
    id:"INVESTOR_REFERENCE_V1",
    basis:Object.freeze([
      "SBA",
      "FUTURPRENEUR"
    ]),
    order:Object.freeze([
      "executive-summary",
      "problem",
      "solution",
      "market",
      "competition",
      "traction",
      "business-model",
      "go-to-market",
      "team-governance",
      "financial-story",
      "funding",
      "risks",
      "roadmap",
      "evidence-appendix",
      "closing"
    ])
  }),

  SECTOR_ADAPTATION:Object.freeze({
    AGRICULTURE:Object.freeze({
      addFocus:Object.freeze([
        "production_cycle",
        "yield_or_capacity_assumptions",
        "seasonality",
        "input_costs",
        "storage_processing",
        "market_access",
        "operational_risks"
      ])
    }),
    FOOD_PRODUCTION:Object.freeze({
      addFocus:Object.freeze([
        "raw_materials",
        "processing_capacity",
        "quality_and_safety",
        "shelf_life_or_storage",
        "distribution",
        "unit_cost"
      ])
    }),
    SOCIAL_PURPOSE:Object.freeze({
      addFocus:Object.freeze([
        "beneficiary",
        "impact_logic",
        "impact_metrics",
        "economic_sustainability"
      ])
    })
  })
});

function AG24_BP_REFERENCE_normalizeAudience_(value) {
  var raw = String(value || "")
    .trim()
    .toUpperCase();

  if (
    raw === "BANK_LOAN" ||
    raw === "LOAN" ||
    raw === "DEBT" ||
    raw === "BANKING"
  ) {
    return "BANK";
  }

  if (
    raw === "EQUITY" ||
    raw === "VC" ||
    raw === "VENTURE"
  ) {
    return "INVESTOR";
  }

  return raw || "GENERIC";
}

function AG24_BP_REFERENCE_getBlueprint_(audience) {
  var normalized =
    AG24_BP_REFERENCE_normalizeAudience_(audience);

  if (normalized === "BANK") {
    return AG24_BP_REFERENCE_BENCHMARK_V1.BANK_BLUEPRINT;
  }

  if (normalized === "INVESTOR") {
    return AG24_BP_REFERENCE_BENCHMARK_V1.INVESTOR_BLUEPRINT;
  }

  return {
    id:"GENERIC_REFERENCE_V1",
    basis:["BPIFRANCE","SBA","FUTURPRENEUR"],
    order:
      AG24_BP_REFERENCE_BENCHMARK_V1
        .SHARED_CORE
        .slice()
  };
}

function AG24_BP_REFERENCE_getSectorFocus_(sector) {
  var token =
    String(sector || "")
      .trim()
      .toUpperCase();

  if (
    token.indexOf("AGRIC") !== -1 ||
    token.indexOf("AGRO") !== -1 ||
    token.indexOf("FARM") !== -1
  ) {
    return (
      AG24_BP_REFERENCE_BENCHMARK_V1
        .SECTOR_ADAPTATION
        .AGRICULTURE
    );
  }

  if (
    token.indexOf("ALIMENT") !== -1 ||
    token.indexOf("FOOD") !== -1 ||
    token.indexOf("TRANSFORMATION") !== -1
  ) {
    return (
      AG24_BP_REFERENCE_BENCHMARK_V1
        .SECTOR_ADAPTATION
        .FOOD_PRODUCTION
    );
  }

  if (
    token.indexOf("SOCIAL") !== -1 ||
    token.indexOf("IMPACT") !== -1
  ) {
    return (
      AG24_BP_REFERENCE_BENCHMARK_V1
        .SECTOR_ADAPTATION
        .SOCIAL_PURPOSE
    );
  }

  return {addFocus:[]};
}

function AG24_BP_REFERENCE_SYSTEM_TEST_V1() {
  var bank =
    AG24_BP_REFERENCE_getBlueprint_("BANK");

  var investor =
    AG24_BP_REFERENCE_getBlueprint_("INVESTOR");

  var agriculture =
    AG24_BP_REFERENCE_getSectorFocus_(
      "Agriculture et agroforesterie"
    );

  var report = {
    success:false,
    version:
      AG24_BP_REFERENCE_BENCHMARK_V1.VERSION,
    bankBasisPass:false,
    bankFundingBeforeRisks:false,
    bankFinancialsBeforeFunding:false,
    investorProblemSolutionPass:false,
    agricultureAdaptationPass:false,
    noCopiedSourceIdentity:false,
    failureCode:""
  };

  try {
    report.bankBasisPass =
      bank.basis.indexOf("BPIFRANCE") !== -1 &&
      bank.basis.indexOf("SBA") !== -1 &&
      bank.basis.indexOf("FUTURPRENEUR") !== -1;

    report.bankFundingBeforeRisks =
      bank.order.indexOf("funding") !== -1 &&
      bank.order.indexOf("risks") !== -1 &&
      bank.order.indexOf("funding") <
        bank.order.indexOf("risks");

    report.bankFinancialsBeforeFunding =
      bank.order.indexOf("financial-story") !== -1 &&
      bank.order.indexOf("funding") !== -1 &&
      bank.order.indexOf("financial-story") <
        bank.order.indexOf("funding");

    report.investorProblemSolutionPass =
      investor.order.indexOf("problem") !== -1 &&
      investor.order.indexOf("solution") !== -1 &&
      investor.order.indexOf("problem") <
        investor.order.indexOf("solution");

    report.agricultureAdaptationPass =
      agriculture.addFocus.indexOf(
        "production_cycle"
      ) !== -1 &&
      agriculture.addFocus.indexOf(
        "operational_risks"
      ) !== -1;

    report.noCopiedSourceIdentity =
      AG24_BP_REFERENCE_BENCHMARK_V1
        .PRINCIPLES
        .copySourceIdentity === false &&
      AG24_BP_REFERENCE_BENCHMARK_V1
        .PRINCIPLES
        .copySourceText === false;

    report.success =
      report.bankBasisPass &&
      report.bankFundingBeforeRisks &&
      report.bankFinancialsBeforeFunding &&
      report.investorProblemSolutionPass &&
      report.agricultureAdaptationPass &&
      report.noCopiedSourceIdentity;

    if (!report.success) {
      report.failureCode =
        "REFERENCE_BENCHMARK_CONTRACT_FAILED";
    }

  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);
  }

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}
