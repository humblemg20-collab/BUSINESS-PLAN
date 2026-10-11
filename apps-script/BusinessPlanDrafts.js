/**
 * AFRIGREEN24 — BUSINESS PLAN DRAFTS / REPRISE PAR EMAIL
 *
 * Contrat : un email unique à la création du code, puis reprise par
 * EMAIL + CODE sans renvoi automatique. Les brouillons expirent après 30 jours.
 */
var BP_DRAFT_CONFIG = Object.freeze({
  validityDays: 30,
  codePrefix: "BP",
  maxStateChars: 45000,
  chunkSize: 8000,
  propertyPrefix: "AG24_BP_DRAFT_",
  sheetIdProperty: "AG24_BP_DRAFT_SHEET_ID",
  sheetName: "Brouillons"
});

function creerCodeRepriseBusinessPlan(payload) {
  payload = payload || {};
  var email = normaliserEmailBrouillonBP_(payload.email);
  if (!email) throw new Error("Une adresse email valide est nécessaire pour créer un code de reprise.");

  var state = payload.state && typeof payload.state === "object" ? payload.state : {};
  var json = JSON.stringify(state);
  if (json.length > BP_DRAFT_CONFIG.maxStateChars) {
    throw new Error("Le dossier est trop volumineux pour être sauvegardé.");
  }

  var code = creerCodeLisibleBP_();
  var draftId = "BP-" + Utilities.getUuid().replace(/-/g, "").slice(0, 20).toUpperCase();
  var now = new Date();
  var expiresAt = new Date(now.getTime() + BP_DRAFT_CONFIG.validityDays * 86400000);
  var record = {
    draftId: draftId,
    email: email,
    codeHash: creerHashRepriseBP_(email, code),
    createdAt: now.toISOString(),
    lastSavedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    currentStep: normaliserEntierBP_(payload.currentStep, 0, 1000),
    progress: normaliserEntierBP_(payload.progress, 0, 100),
    resumeCount: 0,
    state: json
  };
  ecrireBrouillonBPSheet_(record);

  var emailSent = envoyerCodeRepriseBusinessPlan_(email, code, expiresAt);
  return {
    success: true,
    draftId: draftId,
    code: code,
    emailSent: emailSent,
    expiresAt: expiresAt.toISOString()
  };
}

function sauvegarderBrouillonBusinessPlan(payload) {
  payload = payload || {};
  var email = normaliserEmailBrouillonBP_(payload.email);
  var code = normaliserCodeRepriseBP_(payload.code);
  if (!email || !code) throw new Error("Informations de reprise incomplètes.");

  var record = lireBrouillonBPSheet_(email, code);
  verifierBrouillonBP_(record, email, payload.draftId);

  var state = payload.state && typeof payload.state === "object" ? payload.state : {};
  var json = JSON.stringify(state);
  if (json.length > BP_DRAFT_CONFIG.maxStateChars) throw new Error("Le dossier est trop volumineux pour être sauvegardé.");

  record.lastSavedAt = new Date().toISOString();
  record.currentStep = normaliserEntierBP_(payload.currentStep, 0, 1000);
  record.progress = normaliserEntierBP_(payload.progress, 0, 100);
  record.state = json;
  mettreAJourBrouillonBPSheet_(record);
  return { success: true, draftId: record.draftId, savedAt: record.lastSavedAt, expiresAt: record.expiresAt };
}

function reprendreBrouillonBusinessPlan(payload) {
  payload = payload || {};
  var email = normaliserEmailBrouillonBP_(payload.email);
  var code = normaliserCodeRepriseBP_(payload.code);
  if (!email || !code) throw new Error("Veuillez renseigner votre email et votre code de reprise.");

  var record = lireBrouillonBPSheet_(email, code);
  verifierBrouillonBP_(record, email);
  record.resumeCount = Number(record.resumeCount || 0) + 1;
  mettreAJourBrouillonBPSheet_(record);

  var state = {};
  try { state = JSON.parse(record.state || "{}"); } catch (error) { throw new Error("Les données sauvegardées sont illisibles."); }
  return {
    success: true,
    draftId: record.draftId,
    email: email,
    state: state,
    currentStep: Number(record.currentStep || 0),
    progress: Number(record.progress || 0),
    createdAt: record.createdAt,
    lastSavedAt: record.lastSavedAt,
    expiresAt: record.expiresAt,
    resumeCount: record.resumeCount
  };
}

function marquerBrouillonBusinessPlanTermine(payload) {
  payload = payload || {};
  var email = normaliserEmailBrouillonBP_(payload.email);
  var code = normaliserCodeRepriseBP_(payload.code);
  if (!email || !code) return { success: false };
  var record = lireBrouillonBPSheet_(email, code);
  verifierBrouillonBP_(record, email, payload.draftId);
  supprimerBrouillonBPSheet_(record.rowNumber);
  return { success: true };
}

function obtenirFeuilleBrouillonsBP_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(BP_DRAFT_CONFIG.sheetIdProperty);
  var spreadsheet;
  if (id) {
    try { spreadsheet = SpreadsheetApp.openById(id); } catch (error) { spreadsheet = null; }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create("AfriGreen24 — Brouillons Business Plan");
    props.setProperty(BP_DRAFT_CONFIG.sheetIdProperty, spreadsheet.getId());
  }
  var sheet = spreadsheet.getSheetByName(BP_DRAFT_CONFIG.sheetName) || spreadsheet.insertSheet(BP_DRAFT_CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["draftId", "email", "codeHash", "createdAt", "lastSavedAt", "expiresAt", "currentStep", "progress", "resumeCount", "state"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ecrireBrouillonBPSheet_(record) {
  var sheet = obtenirFeuilleBrouillonsBP_();
  sheet.appendRow([record.draftId, record.email, record.codeHash, record.createdAt, record.lastSavedAt, record.expiresAt, record.currentStep, record.progress, record.resumeCount, record.state]);
}

function lireBrouillonBPSheet_(email, code) {
  var sheet = obtenirFeuilleBrouillonsBP_();
  var values = sheet.getDataRange().getValues();
  var hash = creerHashRepriseBP_(email, code);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][2]) === hash) {
      var row = values[i];
      return { rowNumber: i + 1, draftId: String(row[0]), email: String(row[1]), codeHash: String(row[2]), createdAt: String(row[3]), lastSavedAt: String(row[4]), expiresAt: String(row[5]), currentStep: Number(row[6] || 0), progress: Number(row[7] || 0), resumeCount: Number(row[8] || 0), state: String(row[9] || "") };
    }
  }
  throw new Error("Email ou code de reprise incorrect.");
}

function mettreAJourBrouillonBPSheet_(record) {
  obtenirFeuilleBrouillonsBP_().getRange(record.rowNumber, 1, 1, 10).setValues([[record.draftId, record.email, record.codeHash, record.createdAt, record.lastSavedAt, record.expiresAt, record.currentStep, record.progress, record.resumeCount, record.state]]);
}

function supprimerBrouillonBPSheet_(rowNumber) {
  var sheet = obtenirFeuilleBrouillonsBP_();
  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) sheet.deleteRow(rowNumber);
}

function verifierBrouillonBP_(record, email, draftId) {
  if (!record || record.email !== email || (draftId && record.draftId !== String(draftId))) {
    throw new Error("Email ou code de reprise incorrect.");
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new Error("Ce code de reprise a expiré.");
  }
}

function normaliserEmailBrouillonBP_(value) {
  var email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normaliserCodeRepriseBP_(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normaliserEntierBP_(value, min, max) {
  var number = Number(value);
  if (!isFinite(number)) number = 0;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function creerCodeLisibleBP_() {
  var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "";
  for (var i = 0; i < 8; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return BP_DRAFT_CONFIG.codePrefix + "-" + code.slice(0, 4) + "-" + code.slice(4);
}

function creerHashRepriseBP_(email, code) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email + "|" + code);
  return bytes.map(function(byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ("0" + value.toString(16)).slice(-2);
  }).join("");
}

function envoyerCodeRepriseBusinessPlan_(email, code, expiresAt) {
  var date = Utilities.formatDate(expiresAt, Session.getScriptTimeZone(), "dd/MM/yyyy");
  try {
    MailApp.sendEmail({
      to: email,
      subject: "Votre code de reprise — Business Plan AfriGreen24",
      body: [
        "Bonjour,",
        "",
        "Votre Business Plan a été sauvegardé.",
        "",
        "Code de reprise : " + code,
        "",
        "Ce code est valable jusqu’au " + date + ".",
        "Pour reprendre votre dossier, utilisez votre email et ce code.",
        "",
        "Conservez ce code de manière confidentielle.",
        "",
        "AfriGreen24"
      ].join("\n"),
      name: "AfriGreen24"
    });
    return true;
  } catch (error) {
    console.error("Code créé mais email non envoyé : " + error.message);
    return false;
  }
}

function TEST_BP_DRAFT_CONTRACT_LOCAL_() {
  var code = normaliserCodeRepriseBP_("bp-abcd-2345");
  return {
    success: code === "BP-ABCD-2345" &&
      normaliserEmailBrouillonBP_(" Test@Example.com ") === "test@example.com" &&
      BP_DRAFT_CONFIG.validityDays === 30
  };
}
