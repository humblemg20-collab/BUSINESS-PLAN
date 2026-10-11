/**
 * AfriGreen24 — Premium Document Specification & Editorial Planner V1
 *
 * Purpose:
 * Convert one canonical project truth into audience-specific, evidence-aware,
 * premium document plans without duplicating data or letting layout rules
 * mutate business truth.
 *
 * Deterministic. No AI call. No persistence side effect.
 */
var AG24_PREMIUM_DOCUMENT_SPEC_V1 = Object.freeze({
  VERSION: "1.1.1",
  PRODUCT: "BUSINESS_PLAN",
  SUPPORTED_AUDIENCES: Object.freeze([
    "GENERIC",
    "BANK",
    "INVESTOR",
    "GRANT",
    "IMPACT_INVESTOR"
  ]),

  LAYOUT_POLICY: Object.freeze({
    pageSize: "A4",
    orientation: "PORTRAIT",
    semanticSectionEqualsPhysicalPage: false,
    bodyFlow: true,
    fixedSemanticPageLabels: false,
    preserveDedicatedHardBreaks: 2,
    dedicatedPages: Object.freeze([
      "cover",
      "executive-snapshot"
    ]),
    maxDominantColors: 3,
    whitespacePriority: "HIGH",
    paragraphAlignment: "JUSTIFIED",
    bodyMinReadableFontPt: 9,
    preferredBodyFontPt: 10.2
  }),

  COMPONENTS: Object.freeze({
    COVER: "cover",
    EXECUTIVE_SNAPSHOT: "executive_snapshot",
    SECTION_HEADER: "section_header",
    NARRATIVE: "narrative",
    METRIC_STRIP: "metric_strip",
    HERO_METRIC: "hero_metric",
    INSIGHT_CARD: "insight_card",
    EVIDENCE_CARD: "evidence_card",
    FACT_GRID: "fact_grid",
    PROCESS_FLOW: "process_flow",
    MARKET_VISUAL: "market_visual",
    COMPARISON_MATRIX: "comparison_matrix",
    FINANCIAL_TABLE: "financial_table",
    LINE_CHART: "line_chart",
    BAR_CHART: "bar_chart",
    ALLOCATION_VISUAL: "allocation_visual",
    RISK_MATRIX: "risk_matrix",
    TIMELINE: "timeline",
    SOURCE_NOTE: "source_note",
    ASSUMPTION_NOTE: "assumption_note",
    APPENDIX_TABLE: "appendix_table"
  }),

  MODULES: Object.freeze({
    "executive-summary": Object.freeze({
      title: "Résumé exécutif",
      preferredComponents: Object.freeze([
        "narrative",
        "metric_strip",
        "insight_card"
      ])
    }),
    "project": Object.freeze({
      title: "Entreprise / projet",
      preferredComponents: Object.freeze([
        "fact_grid",
        "narrative",
        "evidence_card"
      ])
    }),
    "problem": Object.freeze({
      title: "Problème & opportunité",
      preferredComponents: Object.freeze([
        "insight_card",
        "narrative",
        "evidence_card"
      ])
    }),
    "solution": Object.freeze({
      title: "Solution & proposition de valeur",
      preferredComponents: Object.freeze([
        "process_flow",
        "narrative",
        "insight_card"
      ])
    }),
    "market": Object.freeze({
      title: "Marché",
      preferredComponents: Object.freeze([
        "market_visual",
        "bar_chart",
        "narrative",
        "evidence_card"
      ])
    }),
    "competition": Object.freeze({
      title: "Concurrence & positionnement",
      preferredComponents: Object.freeze([
        "comparison_matrix",
        "insight_card",
        "evidence_card"
      ])
    }),
    "business-model": Object.freeze({
      title: "Modèle économique",
      preferredComponents: Object.freeze([
        "process_flow",
        "metric_strip",
        "narrative"
      ])
    }),
    "traction": Object.freeze({
      title: "Traction & preuves",
      preferredComponents: Object.freeze([
        "metric_strip",
        "line_chart",
        "evidence_card"
      ])
    }),
    "go-to-market": Object.freeze({
      title: "Go-to-market",
      preferredComponents: Object.freeze([
        "process_flow",
        "bar_chart",
        "narrative"
      ])
    }),
    "operations": Object.freeze({
      title: "Opérations",
      preferredComponents: Object.freeze([
        "process_flow",
        "fact_grid",
        "narrative"
      ])
    }),
    "team-governance": Object.freeze({
      title: "Équipe & gouvernance",
      preferredComponents: Object.freeze([
        "fact_grid",
        "insight_card",
        "evidence_card"
      ])
    }),
    "financial-story": Object.freeze({
      title: "Financial Story",
      preferredComponents: Object.freeze([
        "metric_strip",
        "line_chart",
        "financial_table",
        "assumption_note"
      ])
    }),
    "funding": Object.freeze({
      title: "Financement & usage des fonds",
      preferredComponents: Object.freeze([
        "hero_metric",
        "allocation_visual",
        "financial_table",
        "assumption_note"
      ])
    }),
    "risks": Object.freeze({
      title: "Risques & mitigation",
      preferredComponents: Object.freeze([
        "risk_matrix",
        "evidence_card"
      ])
    }),
    "impact": Object.freeze({
      title: "Impact & ESG",
      preferredComponents: Object.freeze([
        "metric_strip",
        "bar_chart",
        "evidence_card"
      ])
    }),
    "roadmap": Object.freeze({
      title: "Roadmap",
      preferredComponents: Object.freeze([
        "timeline",
        "metric_strip"
      ])
    }),
    "evidence-appendix": Object.freeze({
      title: "Annexes & preuves",
      preferredComponents: Object.freeze([
        "appendix_table",
        "source_note"
      ])
    }),
    "closing": Object.freeze({
      title: "Closing",
      preferredComponents: Object.freeze([
        "hero_metric",
        "fact_grid"
      ])
    })
  }),

  AUDIENCE_PROFILES: Object.freeze({
    GENERIC: Object.freeze({
      label: "Generic",
      order: Object.freeze([
        "executive-summary","project","problem","solution","market",
        "competition","business-model","traction","go-to-market",
        "operations","team-governance","financial-story","funding",
        "risks","impact","roadmap","evidence-appendix","closing"
      ]),
      required: Object.freeze([
        "executive-summary","project","market","business-model",
        "financial-story","funding","risks","roadmap"
      ])
    }),
    BANK: Object.freeze({
      label: "Bank / lender",
      order: Object.freeze([
        "executive-summary","project","market","business-model",
        "go-to-market","operations","team-governance","traction",
        "financial-story","funding","risks","impact","roadmap",
        "evidence-appendix","closing"
      ]),
      required: Object.freeze([
        "executive-summary","project","traction","financial-story",
        "funding","risks","team-governance","evidence-appendix"
      ])
    }),
    INVESTOR: Object.freeze({
      label: "Equity investor",
      order: Object.freeze([
        "executive-summary","problem","solution","market","competition",
        "traction","business-model","go-to-market","team-governance",
        "financial-story","funding","risks","impact","roadmap",
        "evidence-appendix","closing"
      ]),
      required: Object.freeze([
        "executive-summary","market","competition","traction",
        "business-model","team-governance","financial-story","funding"
      ])
    }),
    GRANT: Object.freeze({
      label: "Grant / public programme",
      order: Object.freeze([
        "executive-summary","problem","solution","impact","project",
        "market","operations","team-governance","roadmap","funding",
        "risks","financial-story","evidence-appendix","closing"
      ]),
      required: Object.freeze([
        "executive-summary","problem","solution","impact","roadmap",
        "funding","evidence-appendix"
      ])
    }),
    IMPACT_INVESTOR: Object.freeze({
      label: "Impact investor",
      order: Object.freeze([
        "executive-summary","problem","solution","market","traction",
        "impact","business-model","competition","go-to-market",
        "team-governance","financial-story","funding","risks",
        "roadmap","evidence-appendix","closing"
      ]),
      required: Object.freeze([
        "executive-summary","market","traction","impact",
        "financial-story","funding","risks","evidence-appendix"
      ])
    })
  }),

  REPRESENTATION_RULES: Object.freeze({
    KPI: "metric_strip",
    SINGLE_CRITICAL_NUMBER: "hero_metric",
    TIME_SERIES: "line_chart",
    CATEGORY_COMPARISON: "bar_chart",
    MARKET_SIZING: "market_visual",
    COMPETITION: "comparison_matrix",
    ALLOCATION: "allocation_visual",
    RISK_REGISTER: "risk_matrix",
    ROADMAP: "timeline",
    FINANCIAL_GRID: "financial_table",
    EVIDENCE: "evidence_card",
    SOURCE: "source_note",
    ASSUMPTION: "assumption_note",
    LONG_FORM: "narrative"
  }),

  QUALITY_GATES: Object.freeze({
    requireCanonicalTruth: true,
    requireEvidenceForMaterialClaims: true,
    forbidPlausibleAiFactsAsTruth: true,
    requireAudienceProfile: true,
    requireFlowPagination: true,
    forbidFixedSemanticPageLabels: true,
    requireWhiteLabel: true,
    requireRiskMitigationForCriticalRisks: true,
    requireFinancialConsistency: true,
    requireSourceNotesForExternalClaims: true
  })
});

function AG24_PREMIUM_DOC_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
}

function AG24_PREMIUM_DOC_normalizeAudience_(value) {
  var raw = AG24_PREMIUM_DOC_text_(value).toUpperCase();

  var token = raw;
  try {
    token = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  } catch (normalizeError) {}

  token = token
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  var compact = token.replace(/\s+/g, "_");

  var aliases = {
    BANK:"BANK",
    BANK_LOAN:"BANK",
    DEBT:"BANK",
    LOAN:"BANK",
    BANKING:"BANK",
    PRET_BANCAIRE:"BANK",
    CREDIT_BANCAIRE:"BANK",
    EMPRUNT_BANCAIRE:"BANK",
    PRET:"BANK",
    CREDIT:"BANK",
    EMPRUNT:"BANK",
    EQUITY:"INVESTOR",
    VC:"INVESTOR",
    VENTURE:"INVESTOR",
    INVESTOR:"INVESTOR",
    INVESTISSEUR:"INVESTOR",
    CAPITAL:"INVESTOR",
    PUBLIC_PROGRAM:"GRANT",
    PROGRAMME_PUBLIC:"GRANT",
    PUBLIC:"GRANT",
    SUBSIDY:"GRANT",
    SUBVENTION:"GRANT",
    GRANT:"GRANT",
    IMPACT:"IMPACT_INVESTOR",
    IMPACT_INVESTOR:"IMPACT_INVESTOR"
  };

  var candidate = aliases[compact] || "";

  if (!candidate) {
    if (
      /(^| )(BANQUE|BANCAIRE|PRET|CREDIT|EMPRUNT|DETTE)( |$)/.test(token)
    ) {
      candidate = "BANK";
    } else if (
      /(^| )(EQUITY|VC|VENTURE|INVESTISSEUR|CAPITAL)( |$)/.test(token)
    ) {
      candidate = "INVESTOR";
    } else if (
      /(^| )(GRANT|SUBVENTION|SUBSIDY|PROGRAMME PUBLIC)( |$)/.test(token)
    ) {
      candidate = "GRANT";
    } else if (
      /(^| )(IMPACT INVESTOR|INVESTISSEUR IMPACT)( |$)/.test(token)
    ) {
      candidate = "IMPACT_INVESTOR";
    } else {
      candidate = raw || "GENERIC";
    }
  }

  if (
    AG24_PREMIUM_DOCUMENT_SPEC_V1.SUPPORTED_AUDIENCES.indexOf(candidate) === -1
  ) {
    candidate = "GENERIC";
  }

  return candidate;
}

function AG24_PREMIUM_DOC_getAudienceProfile_(audience) {
  var normalized = AG24_PREMIUM_DOC_normalizeAudience_(audience);
  return AG24_PREMIUM_DOCUMENT_SPEC_V1.AUDIENCE_PROFILES[normalized];
}

function AG24_PREMIUM_DOC_currentV2Capabilities_() {
  return [
    "executive-summary",
    "project",
    "problem",
    "solution",
    "market",
    "competition",
    "traction",
    "business-model",
    "go-to-market",
    "operations",
    "team-governance",
    "financial-story",
    "funding",
    "impact",
    "risks",
    "roadmap",
    "evidence-appendix",
    "closing"
  ];
}

function AG24_PREMIUM_DOC_unique_(values) {
  var seen = {};
  var output = [];

  (values || []).forEach(function(value) {
    var key = AG24_PREMIUM_DOC_text_(value);
    if (!key || seen[key]) return;
    seen[key] = true;
    output.push(key);
  });

  return output;
}

function AG24_PREMIUM_DOC_referenceAlignment_(audience, orderedModules) {
  orderedModules =
    Array.isArray(orderedModules)
      ? orderedModules.slice()
      : [];

  if (
    typeof AG24_BP_REFERENCE_getBlueprint_ !==
      "function"
  ) {
    return {
      available:false,
      blueprintId:"",
      referenceOrder:[],
      sharedModules:[],
      missingReferenceModules:[],
      extraModules:[],
      exactOrderMatch:false
    };
  }

  var blueprint =
    AG24_BP_REFERENCE_getBlueprint_(
      audience
    );

  var referenceOrder =
    blueprint &&
    Array.isArray(blueprint.order)
      ? blueprint.order.slice()
      : [];

  var moduleMap = {};
  orderedModules.forEach(function(id) {
    moduleMap[id] = true;
  });

  var referenceMap = {};
  referenceOrder.forEach(function(id) {
    referenceMap[id] = true;
  });

  var shared =
    referenceOrder.filter(function(id) {
      return Boolean(moduleMap[id]);
    });

  var missing =
    referenceOrder.filter(function(id) {
      return !moduleMap[id];
    });

  var extra =
    orderedModules.filter(function(id) {
      return !referenceMap[id];
    });

  var currentSharedOrder =
    orderedModules.filter(function(id) {
      return Boolean(referenceMap[id]);
    });

  return {
    available:true,
    blueprintId:
      String(
        blueprint &&
        blueprint.id ||
        ""
      ),
    referenceOrder:referenceOrder,
    sharedModules:shared,
    missingReferenceModules:missing,
    extraModules:extra,
    exactOrderMatch:
      JSON.stringify(currentSharedOrder) ===
      JSON.stringify(shared)
  };
}

function AG24_PREMIUM_DOC_buildPlan_(options) {
  options = options || {};

  var audience = AG24_PREMIUM_DOC_normalizeAudience_(
    options.audience || options.financingType || "GENERIC"
  );

  var profile = AG24_PREMIUM_DOC_getAudienceProfile_(audience);

  var available = AG24_PREMIUM_DOC_unique_(
    Array.isArray(options.availableModules)
      ? options.availableModules
      : AG24_PREMIUM_DOC_currentV2Capabilities_()
  );

  var availableMap = {};
  available.forEach(function(id) {
    availableMap[id] = true;
  });

  var orderedAvailable = profile.order.filter(function(id) {
    return Boolean(availableMap[id]);
  });

  var missingRequired = profile.required.filter(function(id) {
    return !availableMap[id];
  });

  var missingPremiumModules = profile.order.filter(function(id) {
    return !availableMap[id];
  });

  var modulePlans = orderedAvailable.map(function(id) {
    var definition = AG24_PREMIUM_DOCUMENT_SPEC_V1.MODULES[id] || {
      title: id,
      preferredComponents: []
    };

    return {
      id: id,
      title: definition.title,
      preferredComponents: (definition.preferredComponents || []).slice()
    };
  });

  var referenceAlignment =
    AG24_PREMIUM_DOC_referenceAlignment_(
      audience,
      orderedAvailable
    );

  return {
    success: true,
    version: AG24_PREMIUM_DOCUMENT_SPEC_V1.VERSION,
    product: AG24_PREMIUM_DOCUMENT_SPEC_V1.PRODUCT,
    audience: audience,
    audienceLabel: profile.label,
    layout: {
      pageSize: AG24_PREMIUM_DOCUMENT_SPEC_V1.LAYOUT_POLICY.pageSize,
      bodyFlow: true,
      preserveDedicatedHardBreaks: 2,
      dedicatedPages: ["cover", "executive-snapshot"],
      fixedSemanticPageLabels: false
    },
    documentPlan: {
      cover: "cover",
      executiveSnapshot: "executive-snapshot",
      bodyModules: modulePlans
    },
    availableModules: available,
    omittedAvailableModules: available.filter(function(id) {
      return profile.order.indexOf(id) === -1;
    }),
    missingRequiredModules: missingRequired,
    missingPremiumModules: missingPremiumModules,
    productionReady:
      missingRequired.length === 0 &&
      AG24_PREMIUM_DOCUMENT_SPEC_V1.QUALITY_GATES.requireFlowPagination === true,
    referenceBenchmark:
      referenceAlignment
  };
}

function AG24_PREMIUM_DOC_recommendRepresentation_(kind) {
  var normalized = AG24_PREMIUM_DOC_text_(kind).toUpperCase();
  return (
    AG24_PREMIUM_DOCUMENT_SPEC_V1.REPRESENTATION_RULES[normalized] ||
    AG24_PREMIUM_DOCUMENT_SPEC_V1.REPRESENTATION_RULES.LONG_FORM
  );
}

function AG24_PREMIUM_DOC_SYSTEM_TEST_V1() {
  var report = {
    success: false,
    version: AG24_PREMIUM_DOCUMENT_SPEC_V1.VERSION,
    deterministic: false,
    bankAudience: "",
    investorAudience: "",
    bankMissingRequired: [],
    investorMissingRequired: [],
    fixedSemanticPageLabels: null,
    preserveDedicatedHardBreaks: null,
    representationRulesPass: false,
    frenchBankAliasPass: false,
    benchmarkAvailable: false,
    benchmarkBlueprintId: "",
    failureCode: ""
  };

  try {
    var bankA = AG24_PREMIUM_DOC_buildPlan_({audience:"BANK"});
    var bankB = AG24_PREMIUM_DOC_buildPlan_({audience:"BANK"});
    var investor = AG24_PREMIUM_DOC_buildPlan_({audience:"INVESTOR"});

    report.deterministic =
      JSON.stringify(bankA) === JSON.stringify(bankB);

    report.bankAudience = bankA.audience;
    report.investorAudience = investor.audience;
    report.bankMissingRequired = bankA.missingRequiredModules.slice();
    report.investorMissingRequired = investor.missingRequiredModules.slice();
    report.fixedSemanticPageLabels =
      bankA.layout.fixedSemanticPageLabels;
    report.preserveDedicatedHardBreaks =
      bankA.layout.preserveDedicatedHardBreaks;

    report.benchmarkAvailable =
      Boolean(
        bankA.referenceBenchmark &&
        bankA.referenceBenchmark.available
      );

    report.benchmarkBlueprintId =
      bankA.referenceBenchmark
        ? bankA.referenceBenchmark.blueprintId
        : "";

    report.frenchBankAliasPass =
      AG24_PREMIUM_DOC_normalizeAudience_("Prêt bancaire") === "BANK" &&
      AG24_PREMIUM_DOC_normalizeAudience_("Crédit bancaire") === "BANK" &&
      AG24_PREMIUM_DOC_normalizeAudience_("Emprunt") === "BANK";

    report.representationRulesPass =
      AG24_PREMIUM_DOC_recommendRepresentation_("TIME_SERIES") === "line_chart" &&
      AG24_PREMIUM_DOC_recommendRepresentation_("RISK_REGISTER") === "risk_matrix" &&
      AG24_PREMIUM_DOC_recommendRepresentation_("ROADMAP") === "timeline" &&
      AG24_PREMIUM_DOC_recommendRepresentation_("MARKET_SIZING") === "market_visual";

    var bankOrder = bankA.documentPlan.bodyModules.map(function(x){return x.id;});
    var investorOrder = investor.documentPlan.bodyModules.map(function(x){return x.id;});

    var bankFunding = bankOrder.indexOf("funding");
    var bankImpact = bankOrder.indexOf("impact");
    var investorMarket = investorOrder.indexOf("market");
    var investorFunding = investorOrder.indexOf("funding");

    var bankProfileIsolation =
      bankOrder.indexOf("problem") === -1 &&
      bankOrder.indexOf("solution") === -1 &&
      bankOrder.indexOf("competition") === -1 &&
      bankOrder[bankOrder.length - 1] === "closing";

    var investorProfileIsolation =
      investorOrder.indexOf("project") === -1 &&
      investorOrder.indexOf("operations") === -1 &&
      investorOrder[investorOrder.length - 1] === "closing";

    report.success =
      report.deterministic === true &&
      report.bankAudience === "BANK" &&
      report.investorAudience === "INVESTOR" &&
      report.fixedSemanticPageLabels === false &&
      report.preserveDedicatedHardBreaks === 2 &&
      report.representationRulesPass === true &&
      report.frenchBankAliasPass === true &&
      report.benchmarkAvailable === true &&
      report.benchmarkBlueprintId === "BANK_REFERENCE_V1" &&
      bankFunding !== -1 &&
      bankImpact !== -1 &&
      bankFunding < bankImpact &&
      investorMarket !== -1 &&
      investorFunding !== -1 &&
      investorMarket < investorFunding &&
      bankProfileIsolation === true &&
      investorProfileIsolation === true &&
      report.bankMissingRequired.length === 0 &&
      report.investorMissingRequired.length === 0 &&
      report.bankMissingRequired.indexOf("financial-story") === -1 &&
      report.investorMissingRequired.indexOf("traction") === -1;

    if (!report.success) {
      report.failureCode = "PREMIUM_DOCUMENT_SPEC_CONTRACT_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message ? String(error.message) : String(error);
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}
