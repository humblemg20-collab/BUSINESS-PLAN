/**
 * AfriGreen24 — Premium Financial Story Section V1
 *
 * Builds one decision-oriented financial section from flat Business Plan data
 * or the richer Project Intelligence canonical snapshot when available.
 */
var AG24_PREMIUM_FIN_SECTION_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_FIN_SECTION_flattenCanonical_(project) {
  if (!project) return null;

  var currency =
    AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"documentContext.currency") ||
    AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"funding.currency") ||
    "EUR";

  return {
    currency:currency,
    payingCustomers:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"traction.payingCustomers"),
    revenueToDate:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"traction.revenueToDate"),
    mrr:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"financialModel.mrr"),
    arr:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"financialModel.arr"),
    grossMargin:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"unitEconomics.grossMargin"),
    cfads:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"financialModel.cfads"),
    fundingNeed:
      AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"funding.amount")
  };
}

function AG24_PREMIUM_FIN_SECTION_metricStatus_(project, metricId) {
  if (!project) return null;

  var paths = {
    customers:"traction.payingCustomers",
    revenue:"traction.revenueToDate",
    mrr:"financialModel.mrr",
    arr:"financialModel.arr",
    "gross-margin":"unitEconomics.grossMargin",
    cfads:"financialModel.cfads",
    funding:"funding.amount"
  };

  var path = paths[metricId];
  if (!path) return null;

  var provenance =
    AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project,path);

  return provenance ? provenance.truthStatus : null;
}

function AG24_PREMIUM_FIN_SECTION_build_(data, projectIntelligence) {
  var sourceData =
    projectIntelligence
      ? AG24_PREMIUM_FIN_SECTION_flattenCanonical_(projectIntelligence)
      : (data || {});

  var story = AG24_PREMIUM_FIN_buildStory_(sourceData || {});

  if (projectIntelligence) {
    story.metrics = story.metrics.map(function(metric) {
      var status = AG24_PREMIUM_FIN_SECTION_metricStatus_(
        projectIntelligence,
        metric.id
      );

      if (status) {
        metric.truthStatus = status;
      }

      return metric;
    });
  }

  var dscr =
    projectIntelligence
      ? AG24_PREMIUM_EVIDENCE_BRIDGE_get_(projectIntelligence,"debt.dscr")
      : AG24_PREMIUM_TRACTION_first_(data || {},["dscr","debtServiceCoverageRatio"]);

  var annualDebtService =
    projectIntelligence
      ? AG24_PREMIUM_EVIDENCE_BRIDGE_get_(projectIntelligence,"debt.annualDebtService")
      : AG24_PREMIUM_TRACTION_first_(data || {},["annualDebtService","debtServiceAnnual"]);

  var debtMetrics = [];

  if (AG24_PREMIUM_FIN_num_(annualDebtService) !== null) {
    debtMetrics.push({
      id:"annual-debt-service",
      label:"Service annuel de la dette",
      value:AG24_PREMIUM_FIN_money_(
        annualDebtService,
        story.currency
      ),
      truthStatus:
        projectIntelligence &&
        AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(
          projectIntelligence,
          "debt.annualDebtService"
        )
          ? AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(
              projectIntelligence,
              "debt.annualDebtService"
            ).truthStatus
          : "DECLARED"
    });
  }

  if (AG24_PREMIUM_FIN_num_(dscr) !== null) {
    debtMetrics.push({
      id:"dscr",
      label:"DSCR",
      value:String(
        Math.round(AG24_PREMIUM_FIN_num_(dscr) * 100) / 100
      ) + "x",
      truthStatus:
        projectIntelligence &&
        AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(
          projectIntelligence,
          "debt.dscr"
        )
          ? AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(
              projectIntelligence,
              "debt.dscr"
            ).truthStatus
          : "DECLARED"
    });
  }

  return {
    success:true,
    version:AG24_PREMIUM_FIN_SECTION_V1.VERSION,
    story:story,
    debtMetrics:debtMetrics,
    hasProjectIntelligence:Boolean(projectIntelligence)
  };
}

function AG24_PREMIUM_FIN_SECTION_render_(body, data, projectIntelligence, theme) {
  var section = AG24_PREMIUM_FIN_SECTION_build_(
    data,
    projectIntelligence
  );

  var allMetrics = section.story.metrics.concat(section.debtMetrics);

  if (!allMetrics.length) {
    return {
      success:true,
      rendered:false,
      metricCount:0
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "F",
    "Financial Story",
    theme
  );

  AG24_PREMIUM_METRIC_STRIP_render_(
    body,
    allMetrics.slice(0,6),
    theme
  );

  var assumptions = [];

  if (section.story.calculations.arrFromMrr) {
    assumptions.push("ARR calculé automatiquement à partir du MRR × 12.");
  }

  if (section.debtMetrics.some(function(metric){return metric.id === "dscr";})) {
    assumptions.push("Le DSCR est présenté lorsqu’il est disponible dans le moteur financier canonique.");
  }

  if (assumptions.length) {
    AG24_BP_V2_addCallout_(
      body,
      "Lecture financière",
      assumptions.join(" "),
      theme
    );
  }

  if (
    projectIntelligence &&
    typeof AG24_PREMIUM_EVIDENCE_BRIDGE_render_ === "function"
  ) {
    AG24_PREMIUM_EVIDENCE_BRIDGE_render_(
      body,
      projectIntelligence,
      [
        {
          fieldPath:"financialModel.arr",
          label:"ARR",
          formatter:function(value,canonical) {
            return AG24_PREMIUM_FIN_money_(
              value,
              AG24_PREMIUM_EVIDENCE_BRIDGE_get_(
                canonical,
                "documentContext.currency"
              ) || "EUR"
            );
          }
        },
        {
          fieldPath:"financialModel.cfads",
          label:"CFADS",
          formatter:function(value,canonical) {
            return AG24_PREMIUM_FIN_money_(
              value,
              AG24_PREMIUM_EVIDENCE_BRIDGE_get_(
                canonical,
                "documentContext.currency"
              ) || "EUR"
            );
          }
        },
        {
          fieldPath:"debt.dscr",
          label:"DSCR",
          formatter:function(value) {
            return String(Math.round(Number(value) * 100) / 100) + "x";
          }
        }
      ],
      theme
    );
  }

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_FINANCIAL_STORY_SECTION_RENDERED",
        {
          version:section.version,
          metricIds:allMetrics.map(function(metric){return metric.id;}),
          hasProjectIntelligence:section.hasProjectIntelligence
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    metricCount:allMetrics.length
  };
}

function AG24_PREMIUM_FIN_SECTION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_FIN_SECTION_V1.VERSION,
    rendered:false,
    metricsPresent:false,
    evidencePresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var project = {
      documentContext:{currency:"EUR"},
      traction:{
        payingCustomers:18,
        revenueToDate:44000
      },
      financialModel:{
        mrr:8100,
        arr:97200,
        cfads:72000
      },
      unitEconomics:{
        grossMargin:42
      },
      funding:{
        amount:150000,
        currency:"EUR"
      },
      debt:{
        annualDebtService:56400,
        dscr:1.28
      },
      metadata:{
        provenance:{
          "financialModel.arr":{
            truthStatus:"CALCULATED",
            source:{type:"SYSTEM_CALCULATION",ref:"ARR_V1"},
            evidenceRefs:[]
          },
          "financialModel.cfads":{
            truthStatus:"DOCUMENTED",
            source:{type:"BANK_STATEMENT",ref:"CFADS_SOURCE"},
            evidenceRefs:["EVID_CFADS"]
          },
          "debt.dscr":{
            truthStatus:"CALCULATED",
            source:{type:"SYSTEM_CALCULATION",ref:"DSCR_V1"},
            evidenceRefs:[]
          }
        }
      },
      evidence:{
        items:[
          {
            evidenceId:"EVID_CFADS",
            type:"BANK_STATEMENT",
            title:"Cash-flow source",
            supports:["financialModel.cfads"]
          }
        ]
      }
    };

    var doc = DocumentApp.create(
      "AG24 Premium Financial Section Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var result = AG24_PREMIUM_FIN_SECTION_render_(
      doc.getBody(),
      {},
      project,
      AG24_BP_V2_resolveTheme_("executive_premium")
    );

    report.rendered = Boolean(result && result.rendered);

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.metricsPresent =
      text.indexOf("Financial Story") !== -1 &&
      text.indexOf("€97.2k") !== -1 &&
      text.indexOf("CFADS") !== -1 &&
      text.indexOf("1.28x") !== -1;

    report.evidencePresent =
      text.indexOf("ARR : €97.2k") !== -1 &&
      text.indexOf("Cash-flow source") !== -1 &&
      text.indexOf("DSCR : 1.28x") !== -1;

    reopened.saveAndClose();

    report.success =
      report.rendered === true &&
      report.metricsPresent === true &&
      report.evidencePresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_FINANCIAL_SECTION_CONTRACT_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message ? String(error.message) : String(error);
  } finally {
    if (documentId) {
      try {
        var file = DriveApp.getFileById(documentId);
        file.setTrashed(true);
        report.cleanupSuccess = file.isTrashed() === true;
      } catch (cleanupError) {
        report.cleanupSuccess = false;
      }
    }

    report.success = report.success && report.cleanupSuccess;
    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
