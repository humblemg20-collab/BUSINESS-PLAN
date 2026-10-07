/**
 * AfriGreen24 — Imported Document Context V1
 *
 * Canonical bridge between a document import and the funding-readiness flow.
 * The browser only receives an opaque context id. Verified extraction data is
 * reloaded server-side, mapped deterministically, persisted on the dossier and
 * used to prefill only facts actually found in the uploaded source.
 */
var AG24_IMPORTED_DOCUMENT_CONTEXT_V1 = Object.freeze({
  VERSION:"1.0.0",
  PREFIX:"AFRIGREEN24_BP_IMPORT_CONTEXT",
  CHUNK_SIZE:7000,
  MAX_AGE_MS:24 * 60 * 60 * 1000
});

function AG24_IMPORT_CONTEXT_text_(value) {
  return String(
    value === null || value === undefined
      ? ""
      : value
  ).trim();
}

function AG24_IMPORT_CONTEXT_present_(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function AG24_IMPORT_CONTEXT_key_(id,suffix) {
  return [
    AG24_IMPORTED_DOCUMENT_CONTEXT_V1.PREFIX,
    String(id || ""),
    String(suffix || "")
  ].join(":");
}

function AG24_IMPORT_CONTEXT_write_(id,value) {
  var props = PropertiesService.getScriptProperties();
  var json = JSON.stringify(value || {});
  var size = AG24_IMPORTED_DOCUMENT_CONTEXT_V1.CHUNK_SIZE;
  var count = Math.max(1, Math.ceil(json.length / size));
  var prefix = AG24_IMPORT_CONTEXT_key_(id,"");

  var oldCount = Number(
    props.getProperty(
      AG24_IMPORT_CONTEXT_key_(id,"COUNT")
    ) || 0
  );

  props.setProperty(
    AG24_IMPORT_CONTEXT_key_(id,"COUNT"),
    String(count)
  );

  for (var i=0;i<count;i++) {
    props.setProperty(
      AG24_IMPORT_CONTEXT_key_(id,"CHUNK_"+i),
      json.slice(i*size,(i+1)*size)
    );
  }

  for (var j=count;j<oldCount;j++) {
    props.deleteProperty(
      AG24_IMPORT_CONTEXT_key_(id,"CHUNK_"+j)
    );
  }

  return {
    id:String(id),
    chunks:count,
    chars:json.length,
    prefix:prefix
  };
}

function AG24_IMPORT_CONTEXT_read_(id) {
  var clean = AG24_IMPORT_CONTEXT_text_(id);
  if (!/^IMP_[A-Za-z0-9]{32,80}$/.test(clean)) {
    return null;
  }

  var props = PropertiesService.getScriptProperties();
  var count = Number(
    props.getProperty(
      AG24_IMPORT_CONTEXT_key_(clean,"COUNT")
    ) || 0
  );

  if (!count || count > 100) return null;

  var json = "";
  for (var i=0;i<count;i++) {
    var chunk = props.getProperty(
      AG24_IMPORT_CONTEXT_key_(clean,"CHUNK_"+i)
    );
    if (chunk === null) return null;
    json += chunk;
  }

  try {
    var parsed = JSON.parse(json);
    var createdAt = Date.parse(
      parsed && parsed.createdAt
        ? parsed.createdAt
        : ""
    );

    if (
      Number.isFinite(createdAt) &&
      Date.now() - createdAt >
        AG24_IMPORTED_DOCUMENT_CONTEXT_V1.MAX_AGE_MS
    ) {
      AG24_IMPORT_CONTEXT_delete_(clean);
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function AG24_IMPORT_CONTEXT_delete_(id) {
  var clean = AG24_IMPORT_CONTEXT_text_(id);
  if (!clean) return;

  var props = PropertiesService.getScriptProperties();
  var count = Number(
    props.getProperty(
      AG24_IMPORT_CONTEXT_key_(clean,"COUNT")
    ) || 0
  );

  for (var i=0;i<count;i++) {
    props.deleteProperty(
      AG24_IMPORT_CONTEXT_key_(clean,"CHUNK_"+i)
    );
  }

  props.deleteProperty(
    AG24_IMPORT_CONTEXT_key_(clean,"COUNT")
  );
}

function AG24_IMPORT_CONTEXT_create_(analysisResult,importMeta,fileInfo) {
  var id =
    "IMP_" +
    Utilities.getUuid().replace(/-/g,"") +
    Utilities.getUuid().replace(/-/g,"");

  var source =
    analysisResult &&
    typeof analysisResult === "object"
      ? analysisResult
      : {};

  var context = {
    version:AG24_IMPORTED_DOCUMENT_CONTEXT_V1.VERSION,
    contextId:id,
    createdAt:new Date().toISOString(),
    file:{
      name:AG24_IMPORT_CONTEXT_text_(
        fileInfo && fileInfo.fileName
      ),
      mimeType:AG24_IMPORT_CONTEXT_text_(
        fileInfo && fileInfo.mimeType
      ),
      fingerprint:AG24_IMPORT_CONTEXT_text_(
        importMeta && importMeta.fingerprint
      ),
      extractionMethod:AG24_IMPORT_CONTEXT_text_(
        importMeta && importMeta.extractionMethod
      )
    },
    importMeta:importMeta || {},
    schemaVersion:AG24_IMPORT_CONTEXT_text_(
      source.schemaVersion
    ),
    model:AG24_IMPORT_CONTEXT_text_(source.model),
    fields:source.fields || {},
    analysis:source.analysis || {},
    quality:source.quality || {}
  };

  AG24_IMPORT_CONTEXT_write_(id,context);

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "BUSINESS_PLAN_IMPORT_CONTEXT_CREATED",
        {
          contextId:id,
          fingerprint:context.file.fingerprint,
          fieldCount:Object.keys(context.fields || {}).length
        }
      );
    } catch (auditError) {}
  }

  return id;
}

function AG24_IMPORT_CONTEXT_verifiedField_(context,fieldId) {
  var item =
    context &&
    context.fields &&
    context.fields[fieldId] &&
    typeof context.fields[fieldId] === "object"
      ? context.fields[fieldId]
      : null;

  if (!item) return null;

  if (
    String(item.status || "") !== "FOUND" ||
    item.evidenceVerified !== true ||
    !AG24_IMPORT_CONTEXT_present_(item.value)
  ) {
    return null;
  }

  return item;
}

function AG24_IMPORT_CONTEXT_number_(value) {
  var text = AG24_IMPORT_CONTEXT_text_(value)
    .replace(/\u00a0/g," ")
    .replace(/\s+/g,"")
    .replace(/,/g,".");

  var match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  var n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function AG24_IMPORT_CONTEXT_jsonArray_(value) {
  var raw = AG24_IMPORT_CONTEXT_text_(value);
  if (!raw) return [];

  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    return [];
  }
}

function AG24_IMPORT_CONTEXT_date_(value) {
  var raw = AG24_IMPORT_CONTEXT_text_(value);
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  var match = raw.match(
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/
  );

  if (!match) return "";

  return [
    match[3],
    String(match[2]).padStart(2,"0"),
    String(match[1]).padStart(2,"0")
  ].join("-");
}

function AG24_IMPORT_CONTEXT_stage_(value) {
  var text = AG24_IMPORT_CONTEXT_text_(value)
    .toLowerCase();

  try {
    text = text.normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"");
  } catch (error) {}

  if (text.indexOf("croissance") !== -1 ||
      text.indexOf("expansion") !== -1) return "Expansion";
  if (text.indexOf("activite") !== -1 ||
      text.indexOf("etabli") !== -1) return "Activité établie";
  if (text.indexOf("vente") !== -1 ||
      text.indexOf("revenu") !== -1) return "Premières ventes";
  if (text.indexOf("lancement") !== -1) return "Lancement";
  if (text.indexOf("prototype") !== -1) return "Prototype";
  if (text.indexOf("idee") !== -1) return "Idée";
  return "";
}

function AG24_IMPORT_CONTEXT_select_(field,value) {
  var raw = AG24_IMPORT_CONTEXT_text_(value);
  if (!raw) return "";

  if (field === "devise") {
    var upper = raw.toUpperCase();
    var currencies = [
      "XOF","XAF","EUR","USD","GBP","GNF",
      "CDF","MAD","DZD","TND"
    ];
    for (var i=0;i<currencies.length;i++) {
      if (upper.indexOf(currencies[i]) !== -1) {
        return currencies[i];
      }
    }
    if (/EURO/i.test(raw)) return "EUR";
    if (/DOLLAR/i.test(raw)) return "USD";
    return "";
  }

  if (field === "saisonnalite") {
    if (/^oui$/i.test(raw)) return "Oui";
    if (/^non$/i.test(raw)) return "Non";
    return "";
  }

  if (field === "statutAutorisations") {
    var allowed = [
      "Non applicable",
      "Déjà obtenues",
      "En cours d’obtention",
      "À obtenir avant le démarrage"
    ];
    for (var j=0;j<allowed.length;j++) {
      if (
        allowed[j].toLowerCase() ===
        raw.toLowerCase()
      ) {
        return allowed[j];
      }
    }
    return "";
  }

  return raw;
}

var AG24_IMPORT_CONTEXT_SCALAR_NUMBER_FIELDS = Object.freeze([
  "montantInvestissements",
  "montantStockInitial",
  "besoinFondsRoulementDeclare",
  "tresorerieSecurite",
  "apportPromoteur",
  "autresFinancements",
  "montantDemande",
  "dureeRemboursementMois",
  "differeMois",
  "tauxInteretAnnuel",
  "croissanceAnnuellePct",
  "salairesMensuels",
  "loyersMensuels",
  "marketingMensuel",
  "energieTelecomMensuel",
  "transportLogistiqueMensuel",
  "administrationMensuel",
  "impotsTaxesMensuels",
  "autresChargesFixesMensuelles",
  "delaiPaiementClientsJours",
  "delaiPaiementFournisseursJours",
  "stockMoyenJours",
  "nombreClientsActuels",
  "chiffreAffairesHistorique",
  "chargesHistoriques12Mois",
  "tresorerieDisponibleActuelle",
  "creancesClientsActuelles",
  "dettesFinancieresExistantes",
  "mensualitesDettesExistantes",
  "effectifActuel",
  "capaciteMaximaleMensuelle",
  "mensualiteMaxSupportable",
  "scenarioBaisseVentesPct",
  "scenarioHausseCoutsPct"
]);

var AG24_IMPORT_CONTEXT_SCALAR_TEXT_FIELDS = Object.freeze([
  "devise",
  "justificationHypothesesVentes",
  "justificationCroissance",
  "saisonnalite",
  "detailsSaisonnalite",
  "detailsAutresCharges",
  "detailsTraction",
  "responsableOperations",
  "responsableFinances",
  "uniteCapacite",
  "statutAutorisations",
  "detailsAutorisations",
  "sourceRemboursement",
  "detailsGaranties"
]);

var AG24_IMPORT_CONTEXT_DATE_FIELDS = Object.freeze([
  "dateBesoinFonds",
  "dateDebutRemboursementSouhaitee"
]);

var AG24_IMPORT_CONTEXT_JSON_MAP = Object.freeze({
  utilisationFondsJson:"utilisationFonds",
  lignesVentesJson:"lignesVentes",
  baseHypothesesVentesJson:"baseHypothesesVentes",
  preuvesDemandeJson:"preuvesDemande",
  recrutementsPrevusJson:"recrutementsPrevus",
  garantiesDisponiblesJson:"garantiesDisponibles",
  risquesDetailJson:"risques"
});

function AG24_IMPORT_CONTEXT_toPremiumPrefill_(context,standard) {
  var out = {};
  var provenance = {};

  function set(field,value,sourceField) {
    if (!AG24_IMPORT_CONTEXT_present_(value)) return;
    out[field] = value;
    provenance[field] = {
      truthStatus:"DOCUMENTED",
      sourceType:"UPLOADED_DOCUMENT",
      sourceField:sourceField || field,
      contextId:context && context.contextId || "",
      fingerprint:
        context && context.file
          ? context.file.fingerprint || ""
          : ""
    };
  }

  AG24_IMPORT_CONTEXT_SCALAR_NUMBER_FIELDS.forEach(
    function(field) {
      var item =
        AG24_IMPORT_CONTEXT_verifiedField_(
          context,
          field
        );

      if (!item) return;

      var number =
        AG24_IMPORT_CONTEXT_number_(
          item.value
        );

      if (number !== null) {
        set(field,number,field);
      }
    }
  );

  AG24_IMPORT_CONTEXT_SCALAR_TEXT_FIELDS.forEach(
    function(field) {
      var item =
        AG24_IMPORT_CONTEXT_verifiedField_(
          context,
          field
        );

      if (!item) return;

      var value =
        AG24_IMPORT_CONTEXT_select_(
          field,
          item.value
        );

      set(field,value,field);
    }
  );

  AG24_IMPORT_CONTEXT_DATE_FIELDS.forEach(
    function(field) {
      var item =
        AG24_IMPORT_CONTEXT_verifiedField_(
          context,
          field
        );

      if (!item) return;

      set(
        field,
        AG24_IMPORT_CONTEXT_date_(item.value),
        field
      );
    }
  );

  Object.keys(
    AG24_IMPORT_CONTEXT_JSON_MAP
  ).forEach(function(sourceField) {
    var item =
      AG24_IMPORT_CONTEXT_verifiedField_(
        context,
        sourceField
      );

    if (!item) return;

    var array =
      AG24_IMPORT_CONTEXT_jsonArray_(
        item.value
      );

    if (array.length) {
      set(
        AG24_IMPORT_CONTEXT_JSON_MAP[sourceField],
        array,
        sourceField
      );
    }
  });

  var standardFunding =
    AG24_IMPORT_CONTEXT_verifiedField_(
      context,
      "fundingNeed"
    );

  if (
    !AG24_IMPORT_CONTEXT_present_(
      out.montantDemande
    ) &&
    standardFunding
  ) {
    var parsedFunding =
      AG24_IMPORT_CONTEXT_number_(
        standardFunding.value
      );

    if (parsedFunding !== null) {
      set(
        "montantDemande",
        parsedFunding,
        "fundingNeed"
      );
    }
  }

  if (
    !AG24_IMPORT_CONTEXT_present_(
      out.stadeProjet
    )
  ) {
    var stage =
      AG24_IMPORT_CONTEXT_verifiedField_(
        context,
        "stage"
      );

    var stageValue =
      AG24_IMPORT_CONTEXT_stage_(
        stage
          ? stage.value
          : (
              standard &&
              standard.stade
                ? standard.stade
                : ""
            )
      );

    if (stageValue) {
      if (stage) {
        set(
          "stadeProjet",
          stageValue,
          "stage"
        );
      } else {
        out.stadeProjet = stageValue;
      }
    }
  }

  return {
    values:out,
    provenance:provenance
  };
}

function AG24_IMPORT_CONTEXT_mergePremium_(existing,prefill) {
  var out = Object.assign({},existing || {});
  var incoming =
    prefill && prefill.values
      ? prefill.values
      : {};

  Object.keys(incoming).forEach(function(key) {
    if (!AG24_IMPORT_CONTEXT_present_(out[key])) {
      out[key] = incoming[key];
    }
  });

  return out;
}

function AG24_IMPORTED_DOCUMENT_CONTEXT_SYSTEM_TEST_V1() {
  var context = {
    contextId:"IMP_TEST",
    file:{fingerprint:"abc"},
    fields:{
      fundingNeed:{
        value:"77000 EUR",
        status:"FOUND",
        evidenceVerified:true
      },
      devise:{
        value:"EUR",
        status:"FOUND",
        evidenceVerified:true
      },
      dureeRemboursementMois:{
        value:"60",
        status:"FOUND",
        evidenceVerified:true
      },
      tauxInteretAnnuel:{
        value:"8",
        status:"FOUND",
        evidenceVerified:true
      },
      apportPromoteur:{
        value:"15000",
        status:"TO_CONFIRM",
        evidenceVerified:true
      },
      risquesDetailJson:{
        value:'[{"risque":"Vol","probabilite":"Moyenne","impact":"Élevé","mesure":"Gardiennage"}]',
        status:"FOUND",
        evidenceVerified:true
      }
    }
  };

  var result =
    AG24_IMPORT_CONTEXT_toPremiumPrefill_(
      context,
      {stade:"J’ai seulement une idée"}
    );

  var success =
    result.values.montantDemande === 77000 &&
    result.values.devise === "EUR" &&
    result.values.dureeRemboursementMois === 60 &&
    result.values.tauxInteretAnnuel === 8 &&
    !AG24_IMPORT_CONTEXT_present_(
      result.values.apportPromoteur
    ) &&
    Array.isArray(result.values.risques) &&
    result.values.risques.length === 1;

  var report = {
    success:success,
    version:AG24_IMPORTED_DOCUMENT_CONTEXT_V1.VERSION,
    fundingMapped:
      result.values.montantDemande === 77000,
    currencyMapped:
      result.values.devise === "EUR",
    debtTermsMapped:
      result.values.dureeRemboursementMois === 60 &&
      result.values.tauxInteretAnnuel === 8,
    unconfirmedRejected:
      !AG24_IMPORT_CONTEXT_present_(
        result.values.apportPromoteur
      ),
    structuredRiskMapped:
      Array.isArray(result.values.risques) &&
      result.values.risques.length === 1
  };

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
