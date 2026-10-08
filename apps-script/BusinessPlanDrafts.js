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
  propertyPrefix: "AG24_BP_DRAFT_"
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
  var key = BP_DRAFT_CONFIG.propertyPrefix + creerHashRepriseBP_(email, code);
  var props = PropertiesService.getScriptProperties();

  props.setProperty(key, JSON.stringify({
    draftId: draftId,
    email: email,
    createdAt: now.toISOString(),
    lastSavedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    currentStep: normaliserEntierBP_(payload.currentStep, 0, 1000),
    progress: normaliserEntierBP_(payload.progress, 0, 100),
    resumeCount: 0,
    state: json
  }));

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

  var key = BP_DRAFT_CONFIG.propertyPrefix + creerHashRepriseBP_(email, code);
  var props = PropertiesService.getScriptProperties();
  var record = lireBrouillonBP_(props, key);
  verifierBrouillonBP_(record, email, payload.draftId);

  var state = payload.state && typeof payload.state === "object" ? payload.state : {};
  var json = JSON.stringify(state);
  if (json.length > BP_DRAFT_CONFIG.maxStateChars) throw new Error("Le dossier est trop volumineux pour être sauvegardé.");

  record.lastSavedAt = new Date().toISOString();
  record.currentStep = normaliserEntierBP_(payload.currentStep, 0, 1000);
  record.progress = normaliserEntierBP_(payload.progress, 0, 100);
  record.state = json;
  props.setProperty(key, JSON.stringify(record));
  return { success: true, draftId: record.draftId, savedAt: record.lastSavedAt, expiresAt: record.expiresAt };
}

function reprendreBrouillonBusinessPlan(payload) {
  payload = payload || {};
  var email = normaliserEmailBrouillonBP_(payload.email);
  var code = normaliserCodeRepriseBP_(payload.code);
  if (!email || !code) throw new Error("Veuillez renseigner votre email et votre code de reprise.");

  var key = BP_DRAFT_CONFIG.propertyPrefix + creerHashRepriseBP_(email, code);
  var record = lireBrouillonBP_(PropertiesService.getScriptProperties(), key);
  verifierBrouillonBP_(record, email);
  record.resumeCount = Number(record.resumeCount || 0) + 1;
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(record));

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
  var key = BP_DRAFT_CONFIG.propertyPrefix + creerHashRepriseBP_(email, code);
  var record = lireBrouillonBP_(PropertiesService.getScriptProperties(), key);
  verifierBrouillonBP_(record, email, payload.draftId);
  PropertiesService.getScriptProperties().deleteProperty(key);
  return { success: true };
}

function lireBrouillonBP_(props, key) {
  var raw = props.getProperty(key);
  if (!raw) throw new Error("Email ou code de reprise incorrect.");
  try { return JSON.parse(raw); } catch (error) { throw new Error("Le brouillon sauvegardé est illisible."); }
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
