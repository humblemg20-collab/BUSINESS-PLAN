/**
 * AfriGreen24 — Premium Audience Composer V1
 *
 * Deterministic document composition from the Premium Document Planner.
 * Same canonical truth, different editorial order per audience.
 *
 * COVER and EXECUTIVE SNAPSHOT remain dedicated and are rendered by V2 before
 * this composer. This engine owns the ordered body modules only.
 */
var AG24_PREMIUM_AUDIENCE_COMPOSER_V1 = Object.freeze({
  VERSION:"1.1.0"
});

function AG24_PREMIUM_AUDIENCE_COMPOSER_sectionMap_(model) {
  var map = {};
  var sections = model && Array.isArray(model.sections)
    ? model.sections
    : [];

  sections.forEach(function(section) {
    if (section && section.id) {
      map[String(section.id)] = section;
    }
  });

  return map;
}

function AG24_PREMIUM_AUDIENCE_COMPOSER_order_(plan) {
  return plan &&
    plan.documentPlan &&
    Array.isArray(plan.documentPlan.bodyModules)
      ? plan.documentPlan.bodyModules.map(function(module) {
          return module.id;
        })
      : [];
}

function AG24_PREMIUM_AUDIENCE_COMPOSER_renderModule_(
  moduleId,
  body,
  model,
  data,
  theme,
  options,
  sectionMap,
  pageNumber
) {
  options = options || {};
  sectionMap = sectionMap || {};

  var section = sectionMap[moduleId];

  switch (moduleId) {
    case "executive-summary":
    case "project":
    case "problem":
    case "solution":
    case "market":
    case "business-model":
    case "go-to-market":
    case "operations":
    case "funding":
    case "impact":
      if (!section) {
        return {success:true,rendered:false,reason:"SECTION_UNAVAILABLE"};
      }

      AG24_BP_V2_addMasterSectionPage_(
        body,
        section,
        model,
        theme,
        pageNumber
      );

      if (
        moduleId === "market" &&
        typeof AG24_PREMIUM_VISUALS_renderMarket_ === "function"
      ) {
        AG24_PREMIUM_VISUALS_renderMarket_(
          body,
          data,
          options.projectIntelligence || null,
          theme
        );
      }

      if (
        moduleId === "funding" &&
        typeof AG24_PREMIUM_VISUALS_renderAllocation_ === "function"
      ) {
        AG24_PREMIUM_VISUALS_renderAllocation_(
          body,
          data,
          options.projectIntelligence || null,
          theme
        );
      }

      return {success:true,rendered:true};

    case "competition":
      if (typeof AG24_PREMIUM_COMPETITION_render_ !== "function") {
        return {success:true,rendered:false,reason:"COMPONENT_UNAVAILABLE"};
      }
      return AG24_PREMIUM_COMPETITION_render_(body,data,theme);

    case "traction":
      if (typeof AG24_PREMIUM_TRACTION_render_ !== "function") {
        return {success:true,rendered:false,reason:"COMPONENT_UNAVAILABLE"};
      }
      return AG24_PREMIUM_TRACTION_render_(
        body,
        data,
        options.projectIntelligence || null,
        theme
      );

    case "team-governance":
      if (typeof AG24_PREMIUM_TEAM_GOV_render_ !== "function") {
        return {success:true,rendered:false,reason:"COMPONENT_UNAVAILABLE"};
      }
      return AG24_PREMIUM_TEAM_GOV_render_(body,data,theme);

    case "financial-story":
      if (typeof AG24_PREMIUM_FIN_SECTION_render_ !== "function") {
        return {success:true,rendered:false,reason:"COMPONENT_UNAVAILABLE"};
      }
      return AG24_PREMIUM_FIN_SECTION_render_(
        body,
        data,
        options.projectIntelligence || null,
        theme
      );

    case "risks":
      AG24_BP_V2_addRiskPage_(body,model,theme);
      return {success:true,rendered:true};

    case "roadmap":
      AG24_BP_V2_addRoadmapPage_(body,model,theme);
      return {success:true,rendered:true};

    case "evidence-appendix":
      if (
        !options.projectIntelligence ||
        typeof AG24_PREMIUM_EVIDENCE_APPENDIX_render_ !== "function"
      ) {
        return {
          success:true,
          rendered:false,
          reason:"PROJECT_INTELLIGENCE_OR_COMPONENT_UNAVAILABLE"
        };
      }

      return AG24_PREMIUM_EVIDENCE_APPENDIX_render_(
        body,
        options.projectIntelligence,
        theme
      );

    case "closing":
      var beforeClosingResult = null;

      if (
        typeof options.beforeClosingRenderer === "function"
      ) {
        beforeClosingResult =
          options.beforeClosingRenderer(
            body,
            model,
            data,
            theme,
            options
          ) || {};

        if (beforeClosingResult.success === false) {
          throw new Error(
            beforeClosingResult.failureCode ||
            "BEFORE_CLOSING_EXTENSION_FAILED"
          );
        }
      }

      AG24_BP_V2_addClosing_(body,model,data,theme);

      return {
        success:true,
        rendered:true,
        beforeClosingResult:beforeClosingResult
      };

    default:
      return {
        success:true,
        rendered:false,
        reason:"MODULE_UNSUPPORTED"
      };
  }
}

function AG24_PREMIUM_AUDIENCE_COMPOSER_render_(
  body,
  model,
  data,
  theme,
  premiumDocumentPlan,
  options
) {
  options = options || {};

  if (
    !premiumDocumentPlan ||
    !premiumDocumentPlan.success ||
    !premiumDocumentPlan.productionReady
  ) {
    return {
      success:false,
      rendered:false,
      failureCode:"AUDIENCE_PLAN_NOT_PRODUCTION_READY",
      audience:
        premiumDocumentPlan && premiumDocumentPlan.audience
          ? premiumDocumentPlan.audience
          : ""
    };
  }

  var moduleOrder =
    AG24_PREMIUM_AUDIENCE_COMPOSER_order_(premiumDocumentPlan);

  var sectionMap =
    AG24_PREMIUM_AUDIENCE_COMPOSER_sectionMap_(model);

  var renderedModuleIds = [];
  var skippedModuleIds = [];
  var moduleResults = [];

  moduleOrder.forEach(function(moduleId,index) {
    var result =
      AG24_PREMIUM_AUDIENCE_COMPOSER_renderModule_(
        moduleId,
        body,
        model,
        data,
        theme,
        options,
        sectionMap,
        index + 3
      ) || {};

    moduleResults.push({
      id:moduleId,
      rendered:Boolean(result.rendered),
      reason:result.reason || ""
    });

    if (result.rendered) {
      renderedModuleIds.push(moduleId);
    } else {
      skippedModuleIds.push(moduleId);
    }
  });

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_AUDIENCE_COMPOSER_RENDERED",
        {
          version:AG24_PREMIUM_AUDIENCE_COMPOSER_V1.VERSION,
          audience:premiumDocumentPlan.audience,
          requestedModuleOrder:moduleOrder,
          renderedModuleIds:renderedModuleIds,
          skippedModuleIds:skippedModuleIds
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    version:AG24_PREMIUM_AUDIENCE_COMPOSER_V1.VERSION,
    audience:premiumDocumentPlan.audience,
    requestedModuleOrder:moduleOrder,
    renderedModuleIds:renderedModuleIds,
    skippedModuleIds:skippedModuleIds,
    moduleResults:moduleResults
  };
}

function AG24_PREMIUM_AUDIENCE_COMPOSER_SYSTEM_TEST_V1() {
  var report = {
    success:false,
    version:AG24_PREMIUM_AUDIENCE_COMPOSER_V1.VERSION,
    bankDeterministic:false,
    investorDeterministic:false,
    grantDeterministic:false,
    bankOrderPass:false,
    investorOrderPass:false,
    grantOrderPass:false,
    ordersDifferent:false,
    failureCode:""
  };

  try {
    var bankA = AG24_PREMIUM_DOC_buildPlan_({audience:"BANK"});
    var bankB = AG24_PREMIUM_DOC_buildPlan_({audience:"BANK"});
    var investorA = AG24_PREMIUM_DOC_buildPlan_({audience:"INVESTOR"});
    var investorB = AG24_PREMIUM_DOC_buildPlan_({audience:"INVESTOR"});
    var grantA = AG24_PREMIUM_DOC_buildPlan_({audience:"GRANT"});
    var grantB = AG24_PREMIUM_DOC_buildPlan_({audience:"GRANT"});

    var bankOrder =
      AG24_PREMIUM_AUDIENCE_COMPOSER_order_(bankA);
    var investorOrder =
      AG24_PREMIUM_AUDIENCE_COMPOSER_order_(investorA);
    var grantOrder =
      AG24_PREMIUM_AUDIENCE_COMPOSER_order_(grantA);

    report.bankDeterministic =
      JSON.stringify(bankA) === JSON.stringify(bankB);
    report.investorDeterministic =
      JSON.stringify(investorA) === JSON.stringify(investorB);
    report.grantDeterministic =
      JSON.stringify(grantA) === JSON.stringify(grantB);

    report.bankOrderPass =
      bankOrder.indexOf("traction") <
        bankOrder.indexOf("market") &&
      bankOrder.indexOf("financial-story") <
        bankOrder.indexOf("funding") &&
      bankOrder.indexOf("funding") <
        bankOrder.indexOf("impact") &&
      bankOrder.indexOf("problem") === -1 &&
      bankOrder.indexOf("solution") === -1 &&
      bankOrder.indexOf("competition") === -1 &&
      bankOrder[bankOrder.length - 1] === "closing";

    report.investorOrderPass =
      investorOrder.indexOf("problem") <
        investorOrder.indexOf("market") &&
      investorOrder.indexOf("competition") <
        investorOrder.indexOf("traction") &&
      investorOrder.indexOf("traction") <
        investorOrder.indexOf("financial-story") &&
      investorOrder.indexOf("project") === -1 &&
      investorOrder.indexOf("operations") === -1 &&
      investorOrder[investorOrder.length - 1] === "closing";

    report.grantOrderPass =
      grantOrder.indexOf("impact") <
        grantOrder.indexOf("market") &&
      grantOrder.indexOf("roadmap") <
        grantOrder.indexOf("funding") &&
      grantOrder[grantOrder.length - 1] === "closing";

    report.ordersDifferent =
      JSON.stringify(bankOrder) !== JSON.stringify(investorOrder) &&
      JSON.stringify(bankOrder) !== JSON.stringify(grantOrder) &&
      JSON.stringify(investorOrder) !== JSON.stringify(grantOrder);

    report.success =
      report.bankDeterministic &&
      report.investorDeterministic &&
      report.grantDeterministic &&
      report.bankOrderPass &&
      report.investorOrderPass &&
      report.grantOrderPass &&
      report.ordersDifferent;

    if (!report.success) {
      report.failureCode = "PREMIUM_AUDIENCE_COMPOSER_CONTRACT_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message ? String(error.message) : String(error);
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
