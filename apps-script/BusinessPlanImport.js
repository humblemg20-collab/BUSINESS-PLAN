/**
 * ============================================================
 * AFRIGREEN24 — BUSINESS PLAN IMPORT V4 HUMBLEOS — DRIVE API V3
 * ============================================================
 *
 * Dépendances déjà présentes dans le projet :
 * - appelerHumbleOS_(endpoint, method, payload)
 * - Drive API avancée activée en v3
 *
 * Pipeline :
 * PDF / WORD
 * -> conversion Google Docs / OCR
 * -> texte
 * -> HumbleOS /extract-business-plan
 * -> contrôle local de la preuve
 * -> FOUND / TO_CONFIRM / MISSING
 * ============================================================
 */

const BP_IMPORT_HOS_CONFIG = Object.freeze({
  VERSION: "5.0.0",
  SCHEMA_VERSION: "afrigreen24_bp_import_v5",
  MAX_FILE_BYTES: 15 * 1024 * 1024,
  MAX_TEXT_CHARS: 90000,
  MIN_TEXT_CHARS: 80,
  PREVIEW_CHARS: 1800,
  FOUND_CONFIDENCE: 0.82,

  ALLOWED_MIME_TYPES: Object.freeze([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]),

  ALLOWED_EXTENSIONS: Object.freeze([
    "pdf",
    "doc",
    "docx"
  ])
});


const BP_IMPORT_FIELDS = Object.freeze([
  "projectName",
  "promoterName",
  "email",
  "country",
  "stage",

  "problem",
  "affectedPeople",
  "urgency",

  "solution",
  "valueProposition",
  "benefit",

  "targetCustomers",
  "marketArea",
  "salesChannels",
  "competitors",

  "revenueModel",
  "pricing",
  "sector",
  "mainCosts",
  "team",

  "fundingType",
  "fundingNeed",
  "useOfFunds",
  "impact",
  "risks"
]);


const BP_IMPORT_STATUS = Object.freeze({
  FOUND: "FOUND",
  TO_CONFIRM: "TO_CONFIRM",
  MISSING: "MISSING",
  USER_COMPLETED: "USER_COMPLETED"
});


/**
 * Point d'entrée appelé par Index.html.
 */
function recevoirFichierBusinessPlan(payload) {

  AG24_SEC_assertImportRequest_(payload);

  var fichiersTemporaires = [];

  try {

    var fichier =
      validerEtConstruireBlobBusinessPlan_(
        payload
      );

    var extraction =
      extraireTexteBusinessPlan_(
        fichier.blob,
        fichier.fileName,
        fichier.mimeType,
        fichiersTemporaires
      );

    var texte =
      nettoyerTexteBusinessPlan_(
        extraction.text
      );

    if (!texte) {
      throw new Error(
        "Le document a été reçu, mais aucun texte exploitable n’a pu être extrait."
      );
    }

    var originalTextLength =
      texte.length;

    if (
      originalTextLength <
      BP_IMPORT_HOS_CONFIG.MIN_TEXT_CHARS
    ) {
      throw new Error(
        "Le document contient trop peu de texte exploitable. Vérifiez qu’il n’est pas vide, protégé ou illisible."
      );
    }

    var texteTronque =
      originalTextLength >
      BP_IMPORT_HOS_CONFIG.MAX_TEXT_CHARS;

    if (texteTronque) {
      texte =
        texte.substring(
          0,
          BP_IMPORT_HOS_CONFIG.MAX_TEXT_CHARS
        );
    }

    var analysisResult =
      analyserBusinessPlanAvecHumbleOS_(
        texte
      );

    var wordCount =
      compterMotsBusinessPlan_(
        texte
      );

    var importMeta = {
      version:
        BP_IMPORT_HOS_CONFIG.VERSION,

      schemaVersion:
        BP_IMPORT_HOS_CONFIG.SCHEMA_VERSION,

      fingerprint:
        String(
          fichier.sha256 || ""
        ).slice(0, 24),

      extractionMethod:
        extraction.method,

      textLength:
        texte.length,

      originalTextLength:
        originalTextLength,

      truncated:
        texteTronque,

      wordCount:
        wordCount,

      analyzedAt:
        new Date().toISOString()
    };

    AG24_AUDIT_event_(
      "BUSINESS_PLAN_IMPORT_COMPLETED",
      {
        fingerprint:
          importMeta.fingerprint,

        extractionMethod:
          extraction.method,

        wordCount:
          wordCount,

        truncated:
          texteTronque,

        found:
          analysisResult.analysis
            ? analysisResult.analysis.found
            : 0,

        toConfirm:
          analysisResult.analysis
            ? analysisResult.analysis.toConfirm
            : 0,

        missing:
          analysisResult.analysis
            ? analysisResult.analysis.missing
            : 0
      }
    );

    return {
      success: true,

      fileName:
        fichier.fileName,

      mimeType:
        fichier.mimeType,

      size:
        fichier.size,

      extractionMethod:
        extraction.method,

      textLength:
        texte.length,

      preview:
        creerApercuTexteBusinessPlan_(
          texte,
          BP_IMPORT_HOS_CONFIG.PREVIEW_CHARS
        ),

      importMeta:
        importMeta,

      analysisResult:
        analysisResult
    };

  } catch (error) {

    console.error(
      "recevoirFichierBusinessPlan:",
      error
    );

    return {
      success: false,

      message:
        error &&
        error.message
          ? error.message
          : "Erreur pendant l’analyse du dossier."
    };

  } finally {

    nettoyerFichiersTemporairesBusinessPlan_(
      fichiersTemporaires
    );
  }
}


/**
 * Appel HumbleOS.
 *
 * Le bridge appelerHumbleOS_ existe déjà dans votre projet.
 */
function analyserBusinessPlanAvecHumbleOS_(
  texteSource
) {

  if (
    typeof appelerHumbleOS_ !==
    "function"
  ) {
    throw new Error(
      "Le bridge HumbleOS n’est pas disponible dans ce projet Apps Script."
    );
  }

  var result =
    appelerHumbleOS_(
      "/extract-business-plan",
      "post",
      {
        documentType:
          "BUSINESS_PLAN_IMPORT",

        sourceText:
          texteSource,

        requiredFields:
          BP_IMPORT_FIELDS.slice()
      }
    );

  if (
    !result.content ||
    typeof result.content !== "object"
  ) {
    throw new Error(
      "HumbleOS n’a pas retourné une extraction Business Plan exploitable."
    );
  }

  return normaliserResultatHumbleOSBusinessPlan_(
    result.content,
    texteSource
  );
}


/**
 * Contrôle local.
 * HumbleOS analyse, Apps Script décide du statut final.
 */
function normaliserResultatHumbleOSBusinessPlan_(
  content,
  texteSource
) {

  var sourceFields =
    content.fields &&
    typeof content.fields === "object"
      ? content.fields
      : {};

  var fields = {};

  BP_IMPORT_FIELDS.forEach(
    function(field) {

      var item =
        sourceFields[field] &&
        typeof sourceFields[field] === "object"
          ? sourceFields[field]
          : {};

      fields[field] =
        construireChampBusinessPlanVerifie_(
          field,
          item,
          texteSource
        );
    }
  );

  var analysis =
    analyserCompletudeBusinessPlan_(
      fields
    );

  var quality =
    evaluerQualiteImportBusinessPlan_(
      fields,
      analysis
    );

  return {
    schemaVersion:
      BP_IMPORT_HOS_CONFIG.SCHEMA_VERSION,

    model:
      String(
        content.model || ""
      ),

    fields:
      fields,

    analysis:
      analysis,

    quality:
      quality
  };
}


function construireChampBusinessPlanVerifie_(
  field,
  item,
  texteSource
) {

  var value =
    normaliserValeurCanoniqueImportBP_(
      field,
      nettoyerValeurImportBP_(
        item.value
      )
    );

  var evidence =
    nettoyerValeurImportBP_(
      item.evidence
    );

  var confidence =
    Number(
      item.confidence
    );

  if (!isFinite(confidence)) {
    confidence = 0;
  }

  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  if (!value) {
    return {
      value: "",
      status:
        BP_IMPORT_STATUS.MISSING,
      confidence: 0,
      evidence: "",
      evidenceVerified: false
    };
  }

  var evidenceVerified =
    verifierPreuveBusinessPlan_(
      evidence,
      texteSource
    );

  /*
   * FOUND uniquement si :
   * - HumbleOS propose une valeur ;
   * - l'extrait preuve existe réellement dans le document ;
   * - confiance >= 0.82.
   *
   * Sinon l'utilisateur devra confirmer.
   */
  var status =
    evidenceVerified &&
    confidence >=
      BP_IMPORT_HOS_CONFIG.FOUND_CONFIDENCE
      ? BP_IMPORT_STATUS.FOUND
      : BP_IMPORT_STATUS.TO_CONFIRM;

  return {
    value:
      value,

    status:
      status,

    confidence:
      Number(
        confidence.toFixed(2)
      ),

    evidence:
      evidence,

    evidenceVerified:
      evidenceVerified
  };
}


function analyserCompletudeBusinessPlan_(
  fields
) {

  var foundFields = [];
  var toConfirmFields = [];
  var missingFields = [];

  BP_IMPORT_FIELDS.forEach(
    function(field) {

      var info =
        fields[field] || {};

      if (
        info.status ===
        BP_IMPORT_STATUS.FOUND
      ) {
        foundFields.push(field);

      } else if (
        info.status ===
        BP_IMPORT_STATUS.TO_CONFIRM
      ) {
        toConfirmFields.push(field);

      } else {
        missingFields.push(field);
      }
    }
  );

  /*
   * La complétude validée compte uniquement FOUND.
   * TO_CONFIRM n'est pas encore validé.
   */
  var completeness =
    Math.round(
      (
        foundFields.length /
        BP_IMPORT_FIELDS.length
      ) * 100
    );

  return {
    total:
      BP_IMPORT_FIELDS.length,

    found:
      foundFields.length,

    toConfirm:
      toConfirmFields.length,

    missing:
      missingFields.length,

    completeness:
      completeness,

    foundFields:
      foundFields,

    toConfirmFields:
      toConfirmFields,

    missingFields:
      missingFields
  };
}


function evaluerQualiteImportBusinessPlan_(
  fields,
  analysis
) {
  var confidences = [];
  var verifiedEvidence = 0;
  var proposedValues = 0;

  BP_IMPORT_FIELDS.forEach(
    function(field) {
      var info =
        fields[field] || {};

      if (
        String(
          info.value || ""
        ).trim()
      ) {
        proposedValues++;
      }

      if (
        Number.isFinite(
          Number(
            info.confidence
          )
        ) &&
        Number(
          info.confidence
        ) > 0
      ) {
        confidences.push(
          Number(
            info.confidence
          )
        );
      }

      if (
        info.evidenceVerified ===
        true
      ) {
        verifiedEvidence++;
      }
    }
  );

  var averageConfidence =
    confidences.length
      ? confidences.reduce(
          function(total, value) {
            return total + value;
          },
          0
        ) / confidences.length
      : 0;

  var evidenceCoverage =
    proposedValues > 0
      ? verifiedEvidence /
        proposedValues
      : 0;

  var validatedCoverage =
    analysis &&
    analysis.total
      ? Number(
          analysis.found || 0
        ) /
        Number(
          analysis.total
        )
      : 0;

  var reliability =
    (
      averageConfidence * 0.45 +
      evidenceCoverage * 0.35 +
      validatedCoverage * 0.20
    ) * 100;

  return {
    averageConfidence:
      Number(
        averageConfidence.toFixed(2)
      ),

    verifiedEvidence:
      verifiedEvidence,

    proposedValues:
      proposedValues,

    evidenceCoveragePct:
      Math.round(
        evidenceCoverage * 100
      ),

    reliabilityPct:
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            reliability
          )
        )
      )
  };
}


/**
 * Vérifie que l'extrait retourné par HumbleOS
 * existe vraiment dans le texte source.
 */
function verifierPreuveBusinessPlan_(
  evidence,
  source
) {

  var preuve =
    normaliserTexteVerificationBP_(
      evidence
    );

  var texte =
    normaliserTexteVerificationBP_(
      source
    );

  if (
    !preuve ||
    preuve.length < 8 ||
    !texte
  ) {
    return false;
  }

  return (
    texte.indexOf(
      preuve
    ) !== -1
  );
}


function normaliserTexteVerificationBP_(
  valeur
) {

  var texte =
    String(
      valeur || ""
    )
      .toLowerCase();

  try {
    texte =
      texte
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );
  } catch (error) {
    // Le contrôle continue sans suppression d'accents.
  }

  return texte
    .replace(
      /[“”«»"'`´]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}




/**
 * Normalise seulement les valeurs de listes attendues par le formulaire.
 * La preuve HumbleOS reste inchangée.
 */
function normaliserValeurCanoniqueImportBP_(field, value) {
  var texte = nettoyerValeurImportBP_(value);
  if (!texte) return "";

  var normalise = String(texte).toLowerCase();
  try {
    normalise = normalise.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (error) {}

  if (field === "stage") {
    if (normalise.indexOf("prepare") !== -1 && normalise.indexOf("lancement") !== -1) return "Je prépare le lancement";
    if (normalise.indexOf("prototype") !== -1) return "J’ai déjà un prototype";
    if (normalise.indexOf("commence") !== -1 && normalise.indexOf("vend") !== -1) return "J’ai commencé à vendre";
    if (normalise.indexOf("croissance") !== -1) return "Mon activité est déjà en croissance";
    if (normalise.indexOf("idee") !== -1) return "J’ai seulement une idée";
  }

  if (field === "fundingType") {
    if (normalise.indexOf("subvention") !== -1) return "Subvention";
    if (normalise.indexOf("pret") !== -1 || normalise.indexOf("banque") !== -1) return "Prêt bancaire";
    if (normalise.indexOf("invest") !== -1) return "Investissement";
    if (normalise.indexOf("parten") !== -1) return "Partenariat";
    if (normalise.indexOf("sais pas") !== -1) return "Je ne sais pas encore";
  }

  if (field === "sector") {
    if (normalise.indexOf("agri") !== -1) return "Agriculture / Agribusiness";
    if (normalise.indexOf("energie renouvel") !== -1) return "Énergie renouvelable";
    if (normalise.indexOf("dechet") !== -1 || normalise.indexOf("recycl") !== -1) return "Déchets / Recyclage";
    if (normalise.indexOf("circulaire") !== -1) return "Économie circulaire";
    if (normalise.indexOf("eau") !== -1 || normalise.indexOf("assain") !== -1) return "Eau / Assainissement";
    if (normalise.indexOf("biodivers") !== -1 || normalise.indexOf("forester") !== -1) return "Biodiversité / Foresterie";
    if (normalise.indexOf("construction") !== -1) return "Construction durable";
    if (normalise.indexOf("transport") !== -1 || normalise.indexOf("mobilite") !== -1) return "Transport / Mobilité";
    if (normalise.indexOf("technolog") !== -1 || normalise.indexOf("digital") !== -1 || normalise.indexOf("numerique") !== -1) return "Technologie";
    if (normalise.indexOf("service") !== -1) return "Services";
  }

  return texte;
}


/**
 * ============================================================
 * FICHIER -> BLOB
 * ============================================================
 */
function validerEtConstruireBlobBusinessPlan_(
  payload
) {

  if (!payload) {
    throw new Error(
      "Aucun fichier n’a été reçu."
    );
  }

  var fileName =
    String(
      payload.fileName || ""
    ).trim();

  var mimeType =
    String(
      payload.mimeType || ""
    ).trim();

  var base64 =
    String(
      payload.base64 || ""
    ).trim();

  if (!fileName) {
    throw new Error(
      "Le nom du fichier est manquant."
    );
  }

  if (!base64) {
    throw new Error(
      "Le contenu du fichier est manquant."
    );
  }

  var extension =
    obtenirExtensionBusinessPlan_(
      fileName
    );

  if (
    BP_IMPORT_HOS_CONFIG
      .ALLOWED_EXTENSIONS
      .indexOf(extension) === -1
  ) {
    throw new Error(
      "Format non accepté. Utilisez PDF, DOC ou DOCX."
    );
  }

  if (!mimeType) {
    mimeType =
      mimeDepuisExtensionBusinessPlan_(
        extension
      );
  }

  if (
    BP_IMPORT_HOS_CONFIG
      .ALLOWED_MIME_TYPES
      .indexOf(mimeType) === -1
  ) {
    throw new Error(
      "Type de fichier non autorisé."
    );
  }

  var bytes;

  try {
    bytes =
      Utilities.base64Decode(
        base64
      );

  } catch (error) {
    throw new Error(
      "Le fichier transmis est illisible."
    );
  }

  var size =
    bytes.length;

  if (!size) {
    throw new Error(
      "Le fichier reçu est vide."
    );
  }

  if (
    size >
    BP_IMPORT_HOS_CONFIG.MAX_FILE_BYTES
  ) {
    throw new Error(
      "Le fichier dépasse la limite de 15 Mo."
    );
  }

  verifierSignatureFichierBusinessPlan_(
    bytes,
    extension
  );

  var sha256 =
    calculerEmpreinteFichierBusinessPlan_(
      bytes
    );

  return {
    fileName:
      fileName,

    mimeType:
      mimeType,

    size:
      size,

    extension:
      extension,

    sha256:
      sha256,

    blob:
      Utilities.newBlob(
        bytes,
        mimeType,
        fileName
      )
  };
}


function verifierSignatureFichierBusinessPlan_(
  bytes,
  extension
) {
  var ext =
    String(
      extension || ""
    ).toLowerCase();

  var isPdf =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x25, 0x50, 0x44, 0x46, 0x2D]
    );

  var isDoc =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    );

  var isZip =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x03, 0x04]
    ) ||
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x05, 0x06]
    ) ||
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x07, 0x08]
    );

  var valide =
    ext === "pdf"
      ? isPdf
      : ext === "doc"
        ? isDoc
        : ext === "docx"
          ? isZip
          : false;

  if (!valide) {
    throw new Error(
      "Le contenu réel du fichier ne correspond pas au format annoncé. Exportez à nouveau le document en PDF ou Word puis réessayez."
    );
  }
}


function bytesCommencentParBusinessPlan_(
  bytes,
  signature
) {
  if (
    !bytes ||
    bytes.length <
      signature.length
  ) {
    return false;
  }

  for (
    var index = 0;
    index <
      signature.length;
    index++
  ) {
    var actual =
      Number(
        bytes[index]
      );

    if (actual < 0) {
      actual += 256;
    }

    if (
      actual !==
      signature[index]
    ) {
      return false;
    }
  }

  return true;
}


function calculerEmpreinteFichierBusinessPlan_(
  bytes
) {
  var digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      bytes
    );

  return digest.map(
    function(value) {
      var n =
        value < 0
          ? value + 256
          : value;

      return (
        "0" +
        n.toString(16)
      ).slice(-2);
    }
  ).join("");
}


function compterMotsBusinessPlan_(
  texte
) {
  var propre =
    String(
      texte || ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return propre
    ? propre.split(" ").length
    : 0;
}


/**
 * ============================================================
 * PDF / WORD -> TEXTE
 * ============================================================
 */
function extraireTexteBusinessPlan_(
  blob,
  fileName,
  mimeType,
  fichiersTemporaires
) {

  if (
    typeof Drive === "undefined" ||
    !Drive.Files
  ) {
    throw new Error(
      "Drive API n’est pas activé dans Apps Script."
    );
  }

  var metadata = {
    name:
      "[TEMP AFRIGREEN24 BP] " +
      Date.now() +
      " - " +
      fileName,

    mimeType:
      "application/vnd.google-apps.document"
  };

  var options = {
    fields:
      "id,name,mimeType"
  };

  /*
   * Drive API v3 :
   * - pas de paramètre "convert"
   * - pas de paramètre "ocr"
   * - la conversion est demandée via le mimeType Google Docs
   * - ocrLanguage peut être fourni pour les PDF
   */
  if (
    mimeType ===
    "application/pdf"
  ) {
    options.ocrLanguage =
      "fr";
  }

  var fichierGoogle;

  try {

    fichierGoogle =
      Drive.Files.create(
        metadata,
        blob,
        options
      );

  } catch (error) {

    console.error(
      "Conversion Google Drive v3:",
      error
    );

    throw new Error(
      "Impossible de convertir le document avec Drive API v3. Vérifiez que Drive API est activé et que le fichier n’est pas protégé."
    );
  }

  if (
    !fichierGoogle ||
    !fichierGoogle.id
  ) {
    throw new Error(
      "La conversion du document n’a retourné aucun fichier."
    );
  }

  fichiersTemporaires.push(
    fichierGoogle.id
  );

  Utilities.sleep(700);

  var texte = "";

  try {

    texte =
      DocumentApp
        .openById(
          fichierGoogle.id
        )
        .getBody()
        .getText();

  } catch (error) {

    Utilities.sleep(900);

    try {
      texte =
        DocumentApp
          .openById(
            fichierGoogle.id
          )
          .getBody()
          .getText();

    } catch (secondError) {
      throw new Error(
        "Le document a été converti mais son texte n’a pas pu être lu."
      );
    }
  }

  return {
    text:
      texte || "",

    method:
      mimeType === "application/pdf"
        ? "GOOGLE_DRIVE_PDF_OCR"
        : "GOOGLE_DRIVE_WORD_CONVERSION"
  };
}


/**
 * ============================================================
 * OUTILS
 * ============================================================
 */
function nettoyerTexteBusinessPlan_(
  texte
) {
  return String(
    texte || ""
  )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}


function nettoyerValeurImportBP_(
  valeur
) {
  if (
    valeur === undefined ||
    valeur === null
  ) {
    return "";
  }

  return String(valeur)
    .replace(/\s+/g, " ")
    .trim();
}


function creerApercuTexteBusinessPlan_(
  texte,
  max
) {
  texte =
    String(
      texte || ""
    );

  max =
    Number(
      max || 1000
    );

  return texte.length <= max
    ? texte
    : texte.substring(0, max) + "…";
}


function nettoyerFichiersTemporairesBusinessPlan_(
  ids
) {
  (ids || []).forEach(
    function(id) {
      try {
        if (
          typeof Drive !== "undefined" &&
          Drive.Files &&
          typeof Drive.Files.remove === "function"
        ) {
          Drive.Files.remove(id);
          return;
        }

        DriveApp
          .getFileById(id)
          .setTrashed(true);
      } catch (error) {
        console.warn(
          "Nettoyage fichier temporaire impossible :",
          id
        );
      }
    }
  );
}


function obtenirExtensionBusinessPlan_(
  fileName
) {
  var nom =
    String(
      fileName || ""
    )
      .toLowerCase()
      .trim();

  var position =
    nom.lastIndexOf(".");

  return (
    position >= 0 &&
    position < nom.length - 1
  )
    ? nom.substring(position + 1)
    : "";
}


function mimeDepuisExtensionBusinessPlan_(
  extension
) {
  switch (
    String(
      extension || ""
    ).toLowerCase()
  ) {

    case "pdf":
      return "application/pdf";

    case "doc":
      return "application/msword";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    default:
      return "";
  }
}


/**
 * Test direct du nouvel endpoint HumbleOS.
 */
function testerExtractionBusinessPlanHumbleOS_() {

  var texteTest = [
    "BUSINESS PLAN",
    "Nom du projet : GreenStep Shoes",
    "Porteur du projet : Awa Test",
    "Pays : Cameroun",
    "Le projet prépare actuellement son lancement.",
    "Problème : les jeunes ont des difficultés à trouver des chaussures accessibles.",
    "Solution : vente de chaussures via un site web et WhatsApp.",
    "Clients : jeunes actifs et étudiants.",
    "Canaux : site web, Instagram et WhatsApp.",
    "Financement recherché : 10 000 000 FCFA.",
    "Utilisation des fonds : stock, site web et marketing."
  ].join("\n");

  var resultat =
    analyserBusinessPlanAvecHumbleOS_(
      texteTest
    );

  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}
function TEST_BP_STAGE_FUNDING_MAPPING_LOCAL_() {

  var tests = [
    {
      field: "stage",
      input: "Le projet prépare actuellement son lancement.",
      expected: "Je prépare le lancement"
    },
    {
      field: "stage",
      input: "Premiers revenus",
      expected: "J’ai commencé à vendre"
    },
    {
      field: "stage",
      input: "Le projet a commencé à vendre",
      expected: "J’ai commencé à vendre"
    },
    {
      field: "stage",
      input: "Prototype disponible",
      expected: "J’ai déjà un prototype"
    },

    {
      field: "fundingType",
      input: "Prêt bancaire",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Banque commerciale",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Financement bancaire",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Subvention",
      expected: "Subvention"
    }
  ];

  var results = [];

  tests.forEach(function(test) {

    var output =
      normaliserValeurCanoniqueImportBP_(
        test.field,
        test.input
      );

    results.push({
      field: test.field,
      input: test.input,
      output: output,
      expected: test.expected,
      ok: output === test.expected
    });
  });

  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );

  var erreurs =
    results.filter(function(item) {
      return !item.ok;
    });

  Logger.log(
    "================================"
  );

  Logger.log(
    "TESTS : " + results.length
  );

  Logger.log(
    "OK : " +
    (results.length - erreurs.length)
  );

  Logger.log(
    "ERREURS : " + erreurs.length
  );

  return {
    success: erreurs.length === 0,
    total: results.length,
    passed:
      results.length - erreurs.length,
    failed: erreurs.length,
    results: results
  };
}