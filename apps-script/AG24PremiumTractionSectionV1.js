/**
 * AfriGreen24 — Premium Traction & Evidence Section V1
 *
 * Deterministic, reusable section renderer. It accepts the current flat
 * Business Plan payload and, when available, the Project Intelligence
 * canonical snapshot for stronger provenance/evidence rendering.
 */
var AG24_PREMIUM_TRACTION_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_TRACTION_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_TRACTION_number_(value) {
  if (value === null || value === undefined || value === "") return null;
  var clean = typeof value === "string"
    ? value.replace(/\s/g,"").replace(/[^0-9,.-]/g,"").replace(",",".")
    : value;
  var number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function AG24_PREMIUM_TRACTION_first_(data, keys) {
  data = data || {};
  for (var i=0; i<keys.length; i++) {
    var value = data[keys[i]];
    if (
      value !== null &&
      value !== undefined &&
      AG24_PREMIUM_TRACTION_text_(value)
    ) {
      return value;
    }
  }
  return null;
}

function AG24_PREMIUM_TRACTION_build_(data, projectIntelligence) {
  data = data || {};
  var project = projectIntelligence || null;

  var customers = project
    ? AG24_PREMIUM_TRACTION_number_(
        AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"traction.payingCustomers")
      )
    : AG24_PREMIUM_TRACTION_number_(
        AG24_PREMIUM_TRACTION_first_(data,[
          "payingCustomers","customers","activeCustomers"
        ])
      );

  var revenue = project
    ? AG24_PREMIUM_TRACTION_number_(
        AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"traction.revenueToDate")
      )
    : AG24_PREMIUM_TRACTION_number_(
        AG24_PREMIUM_TRACTION_first_(data,[
          "revenueToDate","historicalRevenue","revenueYtd"
        ])
      );

  var currency = project
    ? AG24_PREMIUM_TRACTION_text_(
        AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,"documentContext.currency")
      ) || "EUR"
    : AG24_PREMIUM_TRACTION_text_(
        AG24_PREMIUM_TRACTION_first_(data,[
          "currency","financialCurrency","fundingCurrency"
        ])
      ) || "EUR";

  var metrics = [];

  if (customers !== null) {
    metrics.push({
      id:"customers",
      label:"Clients payants",
      value:AG24_PREMIUM_FIN_compact_(customers),
      truthStatus:
        project &&
        AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project,"traction.payingCustomers")
          ? AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project,"traction.payingCustomers").truthStatus
          : "DECLARED"
    });
  }

  if (revenue !== null) {
    metrics.push({
      id:"revenue-to-date",
      label:"Revenus réalisés",
      value:AG24_PREMIUM_FIN_money_(revenue,currency),
      truthStatus:
        project &&
        AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project,"traction.revenueToDate")
          ? AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project,"traction.revenueToDate").truthStatus
          : "DECLARED"
    });
  }

  var evidenceDescriptors = [
    {
      fieldPath:"traction.payingCustomers",
      label:"Clients payants"
    },
    {
      fieldPath:"traction.revenueToDate",
      label:"Revenus réalisés",
      formatter:function(value,canonical) {
        var code =
          AG24_PREMIUM_EVIDENCE_BRIDGE_get_(canonical,"documentContext.currency") ||
          "EUR";
        return AG24_PREMIUM_FIN_money_(value,code);
      }
    }
  ];

  return {
    success:true,
    version:AG24_PREMIUM_TRACTION_V1.VERSION,
    metrics:metrics,
    evidenceDescriptors:evidenceDescriptors,
    hasProjectIntelligence:Boolean(project)
  };
}

function AG24_PREMIUM_TRACTION_render_(body, data, projectIntelligence, theme) {
  var section = AG24_PREMIUM_TRACTION_build_(data,projectIntelligence);

  if (!section.metrics.length && !projectIntelligence) {
    return {
      success:true,
      rendered:false,
      metricCount:0,
      evidenceCardCount:0
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "T",
    "Traction & preuves",
    theme
  );

  if (section.metrics.length) {
    AG24_PREMIUM_METRIC_STRIP_render_(
      body,
      section.metrics,
      theme
    );
  }

  var evidenceResult = {
    cardCount:0,
    fields:[]
  };

  if (
    projectIntelligence &&
    typeof AG24_PREMIUM_EVIDENCE_BRIDGE_render_ === "function"
  ) {
    evidenceResult =
      AG24_PREMIUM_EVIDENCE_BRIDGE_render_(
        body,
        projectIntelligence,
        section.evidenceDescriptors,
        theme
      );
  }

  if (!evidenceResult.cardCount) {
    AG24_BP_V2_addCallout_(
      body,
      "Lecture de la traction",
      section.metrics.length
        ? "Les indicateurs ci-dessus sont présentés selon leur statut de vérité disponible. Les preuves documentaires apparaîtront automatiquement lorsqu’elles seront reliées à Project Intelligence."
        : "Aucune traction chiffrée exploitable n’est disponible à ce stade.",
      theme
    );
  }

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_TRACTION_SECTION_RENDERED",
        {
          version:section.version,
          metricCount:section.metrics.length,
          evidenceCardCount:evidenceResult.cardCount,
          hasProjectIntelligence:section.hasProjectIntelligence
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    metricCount:section.metrics.length,
    evidenceCardCount:evidenceResult.cardCount
  };
}

function AG24_PREMIUM_TRACTION_SECTION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_TRACTION_V1.VERSION,
    rendered:false,
    metricsPresent:false,
    evidencePresent:false,
    declaredEvidenceExcluded:false,
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
      metadata:{
        provenance:{
          "traction.payingCustomers":{
            truthStatus:"DOCUMENTED",
            source:{type:"CRM",ref:"crm-main"},
            evidenceRefs:["EVID_CRM"]
          },
          "traction.revenueToDate":{
            truthStatus:"DECLARED",
            source:{type:"USER_INPUT",ref:"questionnaire"},
            evidenceRefs:[]
          }
        }
      },
      evidence:{
        items:[
          {
            evidenceId:"EVID_CRM",
            type:"CRM",
            title:"CRM commercial",
            supports:["traction.payingCustomers"]
          }
        ]
      }
    };

    var doc = DocumentApp.create(
      "AG24 Premium Traction Section Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var result = AG24_PREMIUM_TRACTION_render_(
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
      text.indexOf("CLIENTS PAYANTS") !== -1 &&
      text.indexOf("18") !== -1 &&
      text.indexOf("REVENUS RÉALISÉS") !== -1 &&
      text.indexOf("€44k") !== -1;

    report.evidencePresent =
      text.indexOf("Clients payants : 18") !== -1 &&
      text.indexOf("CRM commercial") !== -1;

    report.declaredEvidenceExcluded =
      text.indexOf("Revenus réalisés : €44k") === -1;

    reopened.saveAndClose();

    report.success =
      report.rendered === true &&
      report.metricsPresent === true &&
      report.evidencePresent === true &&
      report.declaredEvidenceExcluded === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_TRACTION_SECTION_CONTRACT_FAILED";
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
