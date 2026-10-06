/**
 * AfriGreen24 — Premium Evidence Bridge V1
 *
 * Read-only bridge between Project Intelligence provenance/evidence sidecars
 * and Premium Evidence Cards.
 *
 * Important:
 * - DECLARED values are not promoted to "evidence".
 * - Only DOCUMENTED, EXTERNAL_VERIFIED and CALCULATED values are eligible.
 * - No AI call. No canonical mutation.
 */
var AG24_PREMIUM_EVIDENCE_BRIDGE_V1 = Object.freeze({
  VERSION:"1.0.0",
  ELIGIBLE_STATUSES:Object.freeze([
    "DOCUMENTED",
    "EXTERNAL_VERIFIED",
    "CALCULATED"
  ]),
  MAX_CARDS:8
});

function AG24_PREMIUM_EVIDENCE_BRIDGE_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_get_(obj, path) {
  var parts = String(path || "").split(".");
  var current = obj;

  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    current = current[parts[i]];
  }

  return current;
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(project, fieldPath) {
  if (
    !project ||
    !project.metadata ||
    !project.metadata.provenance
  ) return null;

  return project.metadata.provenance[fieldPath] || null;
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_evidenceMap_(project) {
  var items =
    project &&
    project.evidence &&
    Array.isArray(project.evidence.items)
      ? project.evidence.items
      : [];

  var map = {};
  items.forEach(function(item) {
    if (item && item.evidenceId) {
      map[String(item.evidenceId)] = item;
    }
  });

  return map;
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_sourceLabel_(record, evidenceMap) {
  record = record || {};
  evidenceMap = evidenceMap || {};

  var refs = Array.isArray(record.evidenceRefs)
    ? record.evidenceRefs
    : [];

  var labels = refs.map(function(ref) {
    var item = evidenceMap[String(ref)];
    if (!item) return "";

    return AG24_PREMIUM_EVIDENCE_BRIDGE_text_(
      item.title ||
      item.issuer ||
      item.type ||
      item.documentId ||
      item.evidenceId
    );
  }).filter(Boolean);

  if (labels.length) {
    return labels.join(" · ");
  }

  if (record.source && typeof record.source === "object") {
    var sourceType = AG24_PREMIUM_EVIDENCE_BRIDGE_text_(record.source.type);
    var sourceRef = AG24_PREMIUM_EVIDENCE_BRIDGE_text_(record.source.ref);

    return [sourceType,sourceRef].filter(Boolean).join(" · ");
  }

  return "";
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_buildCards_(project, descriptors) {
  descriptors = Array.isArray(descriptors) ? descriptors : [];
  var evidenceMap = AG24_PREMIUM_EVIDENCE_BRIDGE_evidenceMap_(project);
  var cards = [];

  descriptors.forEach(function(descriptor) {
    if (!descriptor || !descriptor.fieldPath) return;

    var fieldPath = String(descriptor.fieldPath);
    var value = AG24_PREMIUM_EVIDENCE_BRIDGE_get_(project,fieldPath);
    var provenance = AG24_PREMIUM_EVIDENCE_BRIDGE_provenance_(
      project,
      fieldPath
    );

    if (!provenance) return;

    var status = AG24_PREMIUM_EVIDENCE_BRIDGE_text_(
      provenance.truthStatus
    ).toUpperCase();

    if (
      AG24_PREMIUM_EVIDENCE_BRIDGE_V1
        .ELIGIBLE_STATUSES
        .indexOf(status) === -1
    ) {
      return;
    }

    if (
      value === null ||
      value === undefined ||
      AG24_PREMIUM_EVIDENCE_BRIDGE_text_(value) === ""
    ) {
      return;
    }

    var formatted = typeof descriptor.formatter === "function"
      ? descriptor.formatter(value,project,provenance)
      : AG24_PREMIUM_EVIDENCE_BRIDGE_text_(value);

    if (!formatted) return;

    var label = AG24_PREMIUM_EVIDENCE_BRIDGE_text_(
      descriptor.label || fieldPath
    );

    cards.push({
      fieldPath:fieldPath,
      claim:label + " : " + formatted,
      truthStatus:status,
      source:AG24_PREMIUM_EVIDENCE_BRIDGE_sourceLabel_(
        provenance,
        evidenceMap
      ),
      note:
        status === "CALCULATED"
          ? "Valeur calculée par un moteur déterministe."
          : ""
    });
  });

  return cards.slice(
    0,
    AG24_PREMIUM_EVIDENCE_BRIDGE_V1.MAX_CARDS
  );
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_render_(body, project, descriptors, theme) {
  if (typeof AG24_PREMIUM_EVIDENCE_render_ !== "function") {
    throw new Error("PREMIUM_EVIDENCE_RENDERER_UNAVAILABLE");
  }

  var cards = AG24_PREMIUM_EVIDENCE_BRIDGE_buildCards_(
    project,
    descriptors
  );

  cards.forEach(function(card) {
    AG24_PREMIUM_EVIDENCE_render_(body,card,theme);
  });

  return {
    success:true,
    version:AG24_PREMIUM_EVIDENCE_BRIDGE_V1.VERSION,
    cardCount:cards.length,
    fields:cards.map(function(card){return card.fieldPath;})
  };
}

function AG24_PREMIUM_EVIDENCE_BRIDGE_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_EVIDENCE_BRIDGE_V1.VERSION,
    cardCount:0,
    documentedIncluded:false,
    calculatedIncluded:false,
    declaredExcluded:false,
    markersPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var project = {
      traction:{
        payingCustomers:18
      },
      financialModel:{
        arr:97200
      },
      market:{
        tam:{
          value:5000000
        }
      },
      metadata:{
        provenance:{
          "traction.payingCustomers":{
            truthStatus:"DOCUMENTED",
            source:{type:"CRM",ref:"crm-main"},
            evidenceRefs:["EVID_CRM"]
          },
          "financialModel.arr":{
            truthStatus:"CALCULATED",
            source:{type:"SYSTEM_CALCULATION",ref:"ARR_V1"},
            evidenceRefs:[]
          },
          "market.tam.value":{
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

    var descriptors = [
      {
        fieldPath:"traction.payingCustomers",
        label:"Clients payants"
      },
      {
        fieldPath:"financialModel.arr",
        label:"ARR",
        formatter:function(value){
          return "€" + String(value);
        }
      },
      {
        fieldPath:"market.tam.value",
        label:"TAM"
      }
    ];

    var cards = AG24_PREMIUM_EVIDENCE_BRIDGE_buildCards_(
      project,
      descriptors
    );

    report.cardCount = cards.length;
    report.documentedIncluded = cards.some(function(card) {
      return card.fieldPath === "traction.payingCustomers" &&
        card.truthStatus === "DOCUMENTED";
    });
    report.calculatedIncluded = cards.some(function(card) {
      return card.fieldPath === "financialModel.arr" &&
        card.truthStatus === "CALCULATED";
    });
    report.declaredExcluded = !cards.some(function(card) {
      return card.fieldPath === "market.tam.value";
    });

    var doc = DocumentApp.create(
      "AG24 Premium Evidence Bridge Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    AG24_PREMIUM_EVIDENCE_BRIDGE_render_(
      doc.getBody(),
      project,
      descriptors,
      null
    );

    doc.saveAndClose();

    var reopened = DocumentApp.openById(documentId);
    var text = reopened.getBody().getText();

    report.markersPresent =
      text.indexOf("Clients payants : 18") !== -1 &&
      text.indexOf("CRM commercial") !== -1 &&
      text.indexOf("ARR : €97200") !== -1 &&
      text.indexOf("SYSTEM_CALCULATION") !== -1 &&
      text.indexOf("TAM : 5000000") === -1;

    reopened.saveAndClose();

    report.success =
      report.cardCount === 2 &&
      report.documentedIncluded === true &&
      report.calculatedIncluded === true &&
      report.declaredExcluded === true &&
      report.markersPresent === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_EVIDENCE_BRIDGE_CONTRACT_FAILED";
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
