#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps-script"
EXPECTED_SCRIPT_ID = "1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz"

errors = []
warnings = []

def fail(message):
    errors.append(message)

def warn(message):
    warnings.append(message)

required = [
    APP / ".clasp.json",
    APP / "appsscript.json",
    APP / "Code.js",
    APP / "SecurityGate.js",
    APP / "DocumentAccess.js",
    APP / "FinancialModelEngine.js",
    APP / "BankingRules.js",
    APP / "OpenAIBridge.js",
    APP / "ImportBusinessPlanV5.html",
    APP / "BusinessPlanDesignSystemV2.js",
    APP / "BusinessPlanDesignV2.html",
    APP / "BusinessPlanVisualQualityGateV1.js",
    APP / "BusinessPlanVisualRegressionPreviewV1.js",
    APP / "BusinessPlanProjectBrandingV1.js",
    APP / "BusinessPlanAdaptivePdfFitV1.js",
    APP / "BusinessPlanRenderInputSafetyV1.js",
]

for path in required:
    if not path.exists():
        fail(f"Missing required file: {path.relative_to(ROOT)}")

if (APP / ".clasp.json").exists():
    clasp = json.loads((APP / ".clasp.json").read_text(encoding="utf-8"))
    if clasp.get("scriptId") != EXPECTED_SCRIPT_ID:
        fail(f"Unexpected Script ID: {clasp.get('scriptId')}")

if (APP / "appsscript.json").exists():
    manifest = json.loads((APP / "appsscript.json").read_text(encoding="utf-8"))
    if manifest.get("runtimeVersion") != "V8":
        fail("Apps Script runtimeVersion must be V8")
    webapp = manifest.get("webapp") or {}
    if webapp.get("access") == "ANYONE_ANONYMOUS":
        warn("Web app is intentionally public/anonymous: server-side gates are mandatory")

js_files = sorted(APP.glob("*.js"))
html_files = sorted(APP.glob("*.html"))

if not js_files:
    fail("No Apps Script .js files found")
if not html_files:
    fail("No Apps Script .html files found")

function_re = re.compile(r"(?m)^\s*function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)")
functions = {}

hardcoded_secret_re = re.compile(
    r"(?im)\b(?:const|let|var)\s+[A-Za-z0-9_$]*(?:secret|password|api_?key|token)[A-Za-z0-9_$]*\s*=\s*['\"][^'\"\r\n]{8,}['\"]"
)

for path in js_files:
    text = path.read_text(encoding="utf-8", errors="replace")

    if hardcoded_secret_re.search(text):
        fail(f"Possible hard-coded credential in {path.name}")

    if "DriveApp.Access.ANYONE_WITH_LINK" in text:
        fail(f"Public Drive sharing forbidden in {path.name}")

    for match in function_re.finditer(text):
        name = match.group(1)
        params = [x.strip() for x in match.group(2).split(",") if x.strip()]
        functions.setdefault(name, []).append((path.name, params))

risky_exact = {
    "configurerHumbleOSAfriGreen24",
    "autoriserUrlFetchApp",
    "verifierConnexionHumbleOS",
    "activerBusinessPlanBancableManuellement",
    "validerPaiementBancableManuellement",
    "refuserPaiementBancableManuellement",
    "configurerDossierSortieBusinessPlanBancable",
    "configurerLogoBusinessPlanBancable",
    "regenererBusinessPlanBancable",
    "creerBrouillonCommercial",
    "envoyerEmailCommercialAutomatique",
    "actualiserDashboardCommercial",
    "enregistrerSoumission",
    "installerPaiementManuelBancable",
    "genererBusinessPlan",
    "genererRapportPreparationBancaire",
    "genererBusinessPlanFinanceur",
    "obtenirDossierUnifieBusinessPlanBancable",
}

for name, declarations in sorted(functions.items()):
    if name in risky_exact:
        fail(f"Risky function remains public: {name} -> {declarations}")

    if (
        (name.startswith("tester") or name.startswith("TEST_") or name.startswith("CONFIGURER_"))
        and not name.endswith("_")
    ):
        fail(f"Test/maintenance function remains public: {name}")

sensitive_rpc = {
    "initialiserParcoursBusinessPlanBancable",
    "enregistrerBrouillonBusinessPlanBancable",
    "validerSectionBusinessPlanBancable",
    "auditerParcoursBusinessPlanBancable",
    "confirmerDossierBusinessPlanBancable",
    "enregistrerValidationFinaleBusinessPlanBancable",
    "obtenirValidationFinaleBusinessPlanBancable",
    "genererBusinessPlanBancableDepuisInterface",
    "genererRapportPreparationBancaireDepuisInterface",
    "genererBusinessPlanFinanceurDepuisInterface",
    "obtenirResultatGenerationBusinessPlanBancable",
    "obtenirResultatRapportPreparationBancaire",
    "obtenirResultatBusinessPlanFinanceur",
    "telechargerPdfBusinessPlanBancable",
}

for name in sorted(sensitive_rpc):
    decls = functions.get(name)
    if not decls:
        fail(f"Expected secured RPC missing: {name}")
        continue

    for filename, params in decls:
        if "jetonAcces" not in params:
            fail(f"RPC {name} in {filename} must require jetonAcces")

openai_bridge = APP / "OpenAIBridge.js"
if openai_bridge.exists():
    text = openai_bridge.read_text(encoding="utf-8", errors="replace")

    required_white_label_ai = [
        "ag24_bp_narrative_v3",
        "AG24_OPENAI_assertWhiteLabelNarrative_",
        "OPENAI_WHITE_LABEL_CONTAMINATION",
        "Business Plan professionnel en marque blanche",
        "document final appartient exclusivement au projet du client",
    ]
    for marker in required_white_label_ai:
        if marker not in text:
            fail(f"OpenAI white-label contract marker missing: {marker}")

    legacy_brand_prompts = [
        "rédacteur senior du Business Plan AfriGreen24",
        "consultant senior en financement d’entreprise pour AfriGreen24",
    ]
    for marker in legacy_brand_prompts:
        if marker in text:
            fail(f"Legacy branded AI prompt remains: {marker}")

    if "OPENAI_API_KEY" not in text:
        fail("OpenAI bridge must read OPENAI_API_KEY from Script Properties")

    if "OPENAI_MODEL" not in text:
        fail("OpenAI bridge must expose OPENAI_MODEL as a configurable Script Property")

    if "store: false" not in text:
        fail("OpenAI Responses calls must set store:false")

    if "https://api.openai.com/v1/responses" not in text:
        fail("OpenAI bridge must use the Responses API")

    if re.search(r"(?i)sk-[A-Za-z0-9_-]{16,}", text):
        fail("Possible hard-coded OpenAI API key in OpenAIBridge.js")

production_ai_files = [
    APP / "BusinessPlanStandardAI.js",
    APP / "BusinessPlanImport.js",
    APP / "BusinessPlanBancableGenerator.js",
    APP / "Code.js",
]

for path in production_ai_files:
    if not path.exists():
        continue

    text = path.read_text(encoding="utf-8", errors="replace")

    if "HumbleOS" in text or "HUMBLEOS" in text:
        fail(f"Legacy HumbleOS reference remains in production AI path: {path.name}")

if (APP / "BusinessPlanStandardAI.js").exists():
    text = (APP / "BusinessPlanStandardAI.js").read_text(
        encoding="utf-8",
        errors="replace",
    )
    if "AG24_OPENAI_generateStandardNarrative_" not in text:
        fail("Standard Business Plan narrative is not routed through OpenAI")

if (APP / "BusinessPlanImport.js").exists():
    text = (APP / "BusinessPlanImport.js").read_text(
        encoding="utf-8",
        errors="replace",
    )
    if "AG24_OPENAI_extractBusinessPlan_" not in text:
        fail("Business Plan import extraction is not routed through OpenAI")

    for marker in [
        'VERSION: "5.1.0"',
        "MAX_EXTRACTED_LONG_FIELD_CHARS: 8000",
        "MAX_EXTRACTED_SHORT_FIELD_CHARS: 600",
        "MAX_EXTRACTED_EMAIL_CHARS: 320",
        "function BP_IMPORT_fieldMaxChars_(",
        "function BP_IMPORT_boundText_(",
        "valueTruncated:",
        "BUSINESS_PLAN_IMPORT_FIELD_BOUNDED",
        "function AG24_BP_IMPORT_FIELD_LIMIT_SYSTEM_TEST_V1()",
    ]:
        if marker not in text:
            fail(f"Business Plan import field-limit marker missing: {marker}")

if (APP / "BusinessPlanBancableGenerator.js").exists():
    text = (APP / "BusinessPlanBancableGenerator.js").read_text(
        encoding="utf-8",
        errors="replace",
    )
    if "AG24_OPENAI_generateBancableNarrative_" not in text:
        fail("Funding-readiness narrative is not routed through OpenAI")

config_payment = APP / "ConfigurationPaiementManuel.js"
if config_payment.exists():
    text = config_payment.read_text(encoding="utf-8", errors="replace")
    if "https://script.google.com/macros/s/" in text:
        fail("Payment configuration must not hard-code a Web App deployment URL")

code = (APP / "Code.js")
if code.exists():
    text = code.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"function\s+doGet\s*\(", text):
        fail("doGet function not found")
    if "AG24_SEC_assertStandardRequest_" not in text:
        fail("Standard generation request gate is missing")
    if "AG24_DOC_issueCapability_" not in text:
        fail("Standard PDF capability issuance is missing")


# Legacy modules must stay out of deployable source.
for legacy_path in [
    APP / "HumbleOSBridge.js",
    APP / "HumbleOS_Bridge_Import_OPTIONNEL.js",
    APP / "BusinessPlanBancablePaiement.js",
    APP / "ConfigurationPaiementManuel.js",
    APP / "PaiementManuel41.html",
    APP / "PaiementAutomatique40.html",
]:
    if legacy_path.exists():
        fail(
            "Legacy AI/payment module must not return to deployable source: "
            + legacy_path.name
        )

# Unified Business Plan product contract
index_path = APP / "Index.html"
if index_path.exists():
    index_text = index_path.read_text(encoding="utf-8", errors="replace")

    for forbidden in [
        "Payer et continuer",
        "paiement unique",
        "include('PaiementManuel41')",
        "obtenirModulePaiementBancable_",
    ]:
        if forbidden in index_text:
            fail(f"Legacy paid Business Plan UI remains active: {forbidden}")

    if "aucun paiement supplémentaire" not in index_text:
        fail("Unified Business Plan UI must state that advanced analysis is included")

activation_path = APP / "BusinessPlanBancableActivation.js"
if activation_path.exists():
    activation_text = activation_path.read_text(encoding="utf-8", errors="replace")

    if "BUSINESS_PLAN_UNIQUE_INCLUS" not in activation_text:
        fail("Advanced Business Plan access is not configured as included")

    if "paiementRequis:" not in activation_text or "false" not in activation_text:
        fail("Unified Business Plan transition must explicitly disable payment requirement")


# OpenAI production release gate contract
openai_bridge = APP / "OpenAIBridge.js"
code_path = APP / "Code.js"
deploy_workflow = ROOT / ".github" / "workflows" / "deploy-apps-script.yml"

if openai_bridge.exists():
    bridge_text = openai_bridge.read_text(encoding="utf-8", errors="replace")
    if "function AG24_OPENAI_getHealthStatus_" not in bridge_text:
        fail("OpenAI safe configuration health helper is missing")

if code_path.exists():
    code_text = code_path.read_text(encoding="utf-8", errors="replace")
    if "openai-config" not in code_text:
        fail("OpenAI configuration health route is missing from doGet")

if deploy_workflow.exists():
    deploy_text = deploy_workflow.read_text(encoding="utf-8", errors="replace")
    for marker in [
        "?health=openai-config",
        '"configured":true',
        "OPENAI_CONFIG_HEALTH=PASS",
        "Automatic rollback on failed production health",
    ]:
        if marker not in deploy_text:
            fail(f"OpenAI production release gate marker missing: {marker}")


# Script Properties Migration V1 safety contract
migration_path = APP / "ScriptPropertiesMigrationV1.js"
if not migration_path.exists():
    fail("ScriptPropertiesMigrationV1.js is required")
else:
    migration_text = migration_path.read_text(encoding="utf-8", errors="replace")

    for marker in [
        "function AG24_PROPERTIES_DRY_RUN_V1()",
        "function AG24_PROPERTIES_APPLY_V1(",
        "function AG24_PROPERTIES_ROLLBACK_V1(",
        "UNKNOWN_NOT_DELETED",
        "AFRIGREEN24_BPB:",
        "OPENAI_",
        "confirmationToken",
        "BACKUP_PREFIX",
        "Rollback automatique effectué",
    ]:
        if marker not in migration_text:
            fail(f"Script Properties migration safety marker missing: {marker}")

    for safety_marker in [
        "INTERNAL_PREFIX",
        "canonicalKeys",
        "AG24_PROPERTIES_compactReportV1_",
        "deletedProperties",
        "properties.setProperties(",
        "Targeted rollback",
    ]:
        if safety_marker not in migration_text:
            fail(
                "Script Properties migration V1.0.1 safety marker missing: "
                + safety_marker
            )

    destructive_clear = "deleteAll" + "Properties"
    if destructive_clear in migration_text:
        fail(
            "Script Properties migration must never clear the whole property store"
        )

    if re.search(
        r"DELETE_PREFIXES[\s\S]{0,500}AFRIGREEN24_BPB:",
        migration_text,
    ):
        fail("Business dossier prefix must never be a migration delete prefix")

    if re.search(
        r"DELETE_PREFIXES[\s\S]{0,500}OPENAI_",
        migration_text,
    ):
        fail("OpenAI prefix must never be a migration delete prefix")

    protected_prefix_section = migration_text.split("PROTECTED_PREFIXES", 1)[1].split("DELETE_EXACT", 1)[0]
    if "AFRIGREEN24_OPENAI_" not in protected_prefix_section:
        fail("OpenAI operational Script Properties namespace must remain protected")

    for required_protected_key in [
        "AFRIGREEN24_BPB_LOGO_ID",
        "AFRIGREEN24_BPB_OUTPUT_FOLDER_ID",
        "AFRIGREEN24_BPB_WEB_APP_EXEC_URL",
    ]:
        protected_section = migration_text.split("PROTECTED_EXACT", 1)[1].split("PROTECTED_PREFIXES", 1)[0]
        if required_protected_key not in protected_section:
            fail(
                "Live Business Plan Script Property must remain protected: "
                + required_protected_key
            )

    for required_legacy_key in [
        "AFRIGREEN24_BPB_PAYMENT_SPREADSHEET_ID",
        "AFRIGREEN24_BPB_WEBHOOK_SECRET",
    ]:
        delete_section = migration_text.split("DELETE_EXACT", 1)[1].split("DELETE_PREFIXES", 1)[0]
        if required_legacy_key not in delete_section:
            fail(
                "Confirmed legacy payment Script Property must remain explicitly deletable: "
                + required_legacy_key
            )

    for finalizer_marker in [
        "function AG24_PROPERTIES_FINALIZE_LEGACY_BACKUPS_V1()",
        "currentPlan.delete.length !== 0",
        "currentPlan.review.length !== 0",
        "APPROVED_DELETE_SET",
        "backupsPurged",
        "remainingBackups: 0",
        "properties.deleteProperty(",
    ]:
        if finalizer_marker not in migration_text:
            fail(
                "Script Properties legacy-backup finalizer marker missing: "
                + finalizer_marker
            )

    for entrypoint_marker in [
        "APPROVED_DELETE_SET",
        "function AG24_PROPERTIES_APPLY_APPROVED_V1()",
        "currentPlan.review.length !== 0",
        "le plan de suppression ne correspond pas exactement au jeu approuvé",
        "return AG24_PROPERTIES_APPLY_V1(",
    ]:
        if entrypoint_marker not in migration_text:
            fail(
                "Zero-argument approved migration entrypoint marker missing: "
                + entrypoint_marker
            )

    approved_section = migration_text.split("APPROVED_DELETE_SET", 1)[1].split("PROTECTED_EXACT", 1)[0]
    for approved_key in [
        "AFRIGREEN24_BPB_PAYMENT_SPREADSHEET_ID",
        "AFRIGREEN24_BPB_WEBHOOK_SECRET",
        "HUMBLEOS_GATEWAY_SECRET",
        "HUMBLEOS_GATEWAY_URL",
    ]:
        if approved_key not in approved_section:
            fail(
                "Approved deletion set missing current reviewed key: "
                + approved_key
            )


# OpenAI secure secret bootstrap contract
bootstrap_path = APP / "OpenAISecretBootstrap.js"
if not bootstrap_path.exists():
    fail("OpenAISecretBootstrap.js is required")
else:
    bootstrap_text = bootstrap_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "function AG24_OPENAI_BOOTSTRAP_START_V1()",
        "function AG24_OPENAI_BOOTSTRAP_handleGet_(e)",
        "function AG24_OPENAI_BOOTSTRAP_handlePost_(e)",
        "function AG24_OPENAI_BOOTSTRAP_SAVE_V1(",
        "google.script.run",
        ".AG24_OPENAI_BOOTSTRAP_SAVE_V1(SETUP_TOKEN,key)",
        "TOKEN_HASH_PROPERTY",
        "EXPIRES_AT_PROPERTY",
        "TTL_MS: 10 * 60 * 1000",
        "type=\"password\"",
        "AG24_OPENAI_CONFIG.API_KEY_PROPERTY",
        "deleteProperty(",
        "AG24_OPENAI_getHealthStatus_()",
    ]:
        if marker not in bootstrap_text:
            fail(f"OpenAI secret bootstrap marker missing: {marker}")

    if re.search(r"(?i)sk-[A-Za-z0-9_-]{16,}", bootstrap_text):
        fail("Possible hard-coded OpenAI API key in OpenAISecretBootstrap.js")

    if re.search(
        r"Logger\.log\s*\([^)]*apiKey",
        bootstrap_text,
        flags=re.S,
    ):
        fail("OpenAI bootstrap must never log the API key")

    if "OPENAI_API_KEY" in bootstrap_text and "API_KEY_PROPERTY" not in bootstrap_text:
        fail("OpenAI bootstrap must use the canonical API key property contract")

if code_path.exists():
    code_text = code_path.read_text(
        encoding="utf-8",
        errors="replace",
    )
    for marker in [
        "AG24_OPENAI_BOOTSTRAP_handleGet_",
        "function doPost(e)",
        "AG24_OPENAI_BOOTSTRAP_handlePost_",
    ]:
        if marker not in code_text:
            fail(f"OpenAI bootstrap routing marker missing from Code.js: {marker}")


# OpenAI smoke-test contract
smoke_path = APP / "OpenAISmokeTest.js"
if not smoke_path.exists():
    fail("OpenAISmokeTest.js is required")
else:
    smoke_text = smoke_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "function AG24_OPENAI_SMOKE_TEST_V1()",
        "EXPECTED_TEXT: 'AG24_OPENAI_SMOKE_OK'",
        "store: false",
        "reasoning: {",
        "effort: 'none'",
        "max_output_tokens:",
        "muteHttpExceptions: true",
        "classification =",
        "'AUTH'",
        "'MODEL_OR_ENDPOINT'",
        "'QUOTA_OR_RATE_LIMIT'",
        "'TRANSPORT'",
        "'PARSE'",
        "'RESPONSE_MISMATCH'",
        "AG24_OPENAI_SMOKE_LAST_REPORT_V1",
        "AFRIGREEN24_OPENAI_SMOKE_LAST_REPORT",
    ]:
        if marker not in smoke_text:
            fail(f"OpenAI smoke-test marker missing: {marker}")

    if smoke_text.count("UrlFetchApp.fetch(") != 1:
        fail("OpenAI smoke test must contain exactly one provider request path")

    if "Utilities.sleep" in smoke_text:
        fail("OpenAI smoke test must not implement sleeps")

    # The exactly-one-fetch assertion above is the structural no-retry gate.

    if re.search(r"(?i)sk-[A-Za-z0-9_-]{16,}", smoke_text):
        fail("Possible hard-coded OpenAI API key in OpenAISmokeTest.js")

    for forbidden in [
        "projectName",
        "promoterName",
        "fundingNeed",
        "targetCustomers",
        "BusinessPlanImport",
    ]:
        if forbidden in smoke_text:
            fail(
                "OpenAI smoke test must not include Business Plan/customer fields: "
                + forbidden
            )

    if "Logger.log(\n      raw" in smoke_text or "console.log(raw" in smoke_text:
        fail("OpenAI smoke test must not log raw provider responses")


# OpenAI narrative contract test
narrative_test_path = APP / "OpenAINarrativeContractTest.js"
if not narrative_test_path.exists():
    fail("OpenAINarrativeContractTest.js is required")
else:
    narrative_test_text = narrative_test_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "function AG24_OPENAI_NARRATIVE_CONTRACT_TEST_V1()",
        "syntheticData: true",
        "AG24_OPENAI_assessNarrativeNeed_",
        "preparerBusinessPlanStandardIA52(",
        "AG24_OPENAI_NARRATIVE_KEYS.slice()",
        "factsPreserved",
        "UNEXPECTED_CACHE_HIT",
        "FACT_SOURCE_MUTATED",
        "MISSING_NARRATIVE_BLOCKS",
        "EMPTY_NARRATIVE_BLOCKS",
        "OPENAI_NARRATIVE_CONTRACT_TEST_PASSED",
        "AFRIGREEN24_OPENAI_NARRATIVE_TEST_LAST_REPORT",
    ]:
        if marker not in narrative_test_text:
            fail(f"OpenAI narrative contract marker missing: {marker}")

    if "UrlFetchApp.fetch(" in narrative_test_text:
        fail(
            "Narrative contract test must use the canonical OpenAI bridge, "
            "not call the provider directly"
        )

    if narrative_test_text.count("preparerBusinessPlanStandardIA52(") != 1:
        fail(
            "Narrative contract test must invoke the production Standard AI "
            "wrapper exactly once"
        )

    if re.search(r"(?i)sk-[A-Za-z0-9_-]{16,}", narrative_test_text):
        fail("Possible hard-coded OpenAI API key in narrative contract test")

    if "narrative[key]" in narrative_test_text and "Logger.log" in narrative_test_text:
        # Narrative content is validated in memory; only the compact report may be logged.
        if "JSON.stringify(\n      narrative" in narrative_test_text:
            fail("Narrative contract test must not log generated narrative content")



# Business Plan Render Input Safety V1 contract
render_input_path = APP / "BusinessPlanRenderInputSafetyV1.js"
if not render_input_path.exists():
    fail("BusinessPlanRenderInputSafetyV1.js is required")
else:
    render_input_text = render_input_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.1.0"',
        "MAX_LONG_FIELD_CHARS: 8000",
        "MAX_NESTED_STRING_CHARS: 8000",
        "MAX_DEPTH: 12",
        "MAX_SHORT_FIELD_CHARS: 600",
        "MAX_EMAIL_CHARS: 320",
        "function AG24_BP_RENDER_INPUT_deepBound_(",
        "function AG24_BP_RENDER_INPUT_prepare_(",
        "function AG24_BP_RENDER_INPUT_SYSTEM_TEST_V1()",
        "transportPayloadRemoved",
        "BUSINESS_PLAN_RENDER_INPUT_BOUNDED",
        "canonicalPreserved",
    ]:
        if marker not in render_input_text:
            fail(f"Render Input Safety V1 marker missing: {marker}")

    if "UrlFetchApp.fetch(" in render_input_text:
        fail("Render Input Safety must remain deterministic and offline")

    if "preparerBusinessPlanStandardIA52(" in render_input_text:
        fail("Render Input Safety must never trigger an AI call")


# Business Plan DataStore Large Payload V1 contract
datastore_payload_path = APP / "DataStorePayloadV1.js"
if not datastore_payload_path.exists():
    fail("DataStorePayloadV1.js is required")
else:
    datastore_payload_text = datastore_payload_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.1.0"',
        'REFERENCE_VERSION: "DRIVE_JSON_V1"',
        "SHEET_HARD_LIMIT: 50000",
        "SHEET_SAFE_LIMIT: 12000",
        "function AG24_DATASTORE_storeSubmissionPayloads_(",
        "function AG24_DATASTORE_cleanupSubmissionPayloads_(",
        "function AG24_DATASTORE_resolveReference_(",
        "function AG24_DATASTORE_sheetCell_(",
        "DATASTORE_PAYLOAD_EXTERNALIZED",
        "DATASTORE_CELL_TRUNCATED",
        "function AG24_DATASTORE_LARGE_PAYLOAD_SYSTEM_TEST_V1()",
        "SpreadsheetApp.create(",
        "sheetWriteSuccess",
        "objectCellBounded",
        "DATASTORE_LARGE_PAYLOAD_SYSTEM_TEST_PASSED",
        "projectBrandingToken",
        "logoUpload",
        "agBridge",
    ]:
        if marker not in datastore_payload_text:
            fail(f"DataStore Large Payload V1 marker missing: {marker}")

    if "DriveApp.Access.ANYONE_WITH_LINK" in datastore_payload_text:
        fail("DataStore payload files must remain private")

    if "UrlFetchApp.fetch(" in datastore_payload_text:
        fail("DataStore payload storage must remain deterministic and offline")

datastore_path = APP / "DataStore.js"
if not datastore_path.exists():
    fail("DataStore.js is required")
else:
    datastore_text = datastore_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "AG24_DATASTORE_storeSubmissionPayloads_(",
        "payloads.questionnaire.reference",
        "payloads.commercialProfile.reference",
        "AG24_DATASTORE_sheetCell_(",
        "AG24_DATASTORE_cleanupSubmissionPayloads_(",
        "payloadStorage:",
    ]:
        if marker not in datastore_text:
            fail(f"DataStore payload integration marker missing: {marker}")

    if "datastoreJsonSecurise_(data)," in datastore_text:
        fail("Full questionnaire JSON must not be written directly to one Sheets cell")

    if "datastoreJsonSecurise_(profilCommercial)" in datastore_text:
        fail("Full commercial profile JSON must not be written directly to one Sheets cell")

if code.exists():
    datastore_generation_region = code_text[
        code_text.find("var crmPersistence ="):
        code_text.find("reinitialiserBusinessPlanStandardIA52_();")
        if code_text.find("reinitialiserBusinessPlanStandardIA52_();") > 0
        else len(code_text)
    ]

    for marker in [
        "CRM_SUBMISSION_PERSISTENCE_FAILED",
        "COMMERCIAL_DASHBOARD_REFRESH_FAILED",
        "crmPersistence:",
        "commercialDashboard:",
    ]:
        if marker not in code_text:
            fail(f"Non-blocking CRM generation marker missing: {marker}")

    if "enregistrerSoumission_(" not in datastore_generation_region:
        fail("Generation must still attempt CRM persistence")

# Canonical PowerShell release engine contract
release_engine_path = ROOT / "scripts" / "release-business-plan.ps1"
if not release_engine_path.exists():
    fail("Canonical PowerShell release engine is required")
else:
    release_engine_text = release_engine_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "BUSINESS PLAN POWERSHELL RELEASE ENGINE V1",
        "WORKTREE_DIRTY",
        "CANONICAL_MAIN_MISMATCH",
        "APPS_SCRIPT_HEAD_PUSH=PASS",
        "APPS_SCRIPT_HEAD_PUSH=SKIPPED_BY_CALLER",
        "[switch]$SkipPush",
        "Wait-DeploymentVersion",
        "DEPLOYMENT_PROPAGATION_TIMEOUT",
        "Wait-ProductionHealth",
        "AUTOMATIC_ROLLBACK=START",
        "ROLLBACK_PROPAGATION_TIMEOUT",
        "OPENAI_CONFIG_HEALTH=PASS",
        "release-evidence",
        "state.json",
        "BUSINESS PLAN POWERSHELL RELEASE = PASS",
    ]:
        if marker not in release_engine_text:
            fail(f"PowerShell release engine marker missing: {marker}")

    if '$WebAppUrl + "?health=openai-config"' not in release_engine_text:
        fail("PowerShell release engine must build health URL explicitly")

# Business Plan Adaptive PDF Fit V1 contract
pdf_fit_path = APP / "BusinessPlanAdaptivePdfFitV1.js"
if not pdf_fit_path.exists():
    fail("BusinessPlanAdaptivePdfFitV1.js is required")
else:
    pdf_fit_text = pdf_fit_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.2.0"',
        "MAX_ATTEMPTS: 3",
        'id: "compact"',
        'id: "dense"',
        'id: "tight"',
        "function AG24_BP_VISUAL_FIT_try_(",
        "function AG24_BP_VISUAL_FIT_pdf_(",
        "function AG24_BP_VISUAL_FIT_applyProfile_(",
        "function AG24_BP_VISUAL_FIT_SYSTEM_TEST_V1()",
        "extremeOverflowRecognized",
        "PHYSICAL_PAGE_COUNT_27_ABOVE_MAX_26",
        "PDF_FIT_RECOVERY_STARTED",
        "PDF_FIT_RECOVERY_ATTEMPT",
        "PDF_FIT_RECOVERY_PASSED",
        "PDF_FIT_RECOVERY_FAILED",
        "VISUAL_FIT_SYSTEM_TEST_PASSED",
        "fitRecovery",
    ]:
        if marker not in pdf_fit_text:
            fail(f"Adaptive PDF Fit V1 marker missing: {marker}")

    if "UrlFetchApp.fetch(" in pdf_fit_text:
        fail("Adaptive PDF Fit must remain deterministic and offline")

    if "preparerBusinessPlanStandardIA52(" in pdf_fit_text:
        fail("Adaptive PDF Fit must never trigger an AI preparation call")


# Business Plan Project Branding Store V1 contract
project_branding_path = APP / "BusinessPlanProjectBrandingV1.js"
if not project_branding_path.exists():
    fail("BusinessPlanProjectBrandingV1.js is required")
else:
    project_branding_text = project_branding_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.0.0"',
        'ROOT_FOLDER_NAME:',
        'MAX_LOGO_BYTES:',
        "function AG24_BP_PROJECT_BRANDING_GET_V1(",
        "function AG24_BP_PROJECT_BRANDING_SAVE_V1(",
        "function AG24_BP_PROJECT_BRANDING_resolveForGeneration_(",
        "function AG24_BP_PROJECT_BRANDING_SYSTEM_TEST_V1()",
        "PROJECT_BRANDING_CAPABILITY_INVALID",
        "PROJECT_BRANDING_LOGO_SIGNATURE_INVALID",
        "AG24_SEC_sha256_(",
        "projectIdentityHash",
        "logoAction",
        "PROJECT_BRANDING_SYSTEM_TEST_PASSED",
        "productionResolverValid",
        "identityHashPreserved",
        "parts.some(",
        "extraireBrandingBusinessPlan_(",
        "Logger.log(",
        "JSON.stringify(",
    ]:
        if marker not in project_branding_text:
            fail(f"Project Branding V1 marker missing: {marker}")

    if "DriveApp.Access.ANYONE_WITH_LINK" in project_branding_text:
        fail("Project Branding logo assets must remain private")

    if "UrlFetchApp.fetch(" in project_branding_text:
        fail("Project Branding store must remain deterministic and offline")

    if "token:" in project_branding_text and "AG24_AUDIT_event_(" in project_branding_text:
        audit_region = project_branding_text[
            project_branding_text.find("AG24_AUDIT_event_("):
        ]
        if "token:" in audit_region[:2500]:
            fail("Project Branding capability token must never be written to audit logs")


# Business Plan Design System V2 contract
design_system_path = APP / "BusinessPlanDesignSystemV2.js"
if not design_system_path.exists():
    fail("BusinessPlanDesignSystemV2.js is required")
else:
    design_system_text = design_system_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "2.3.1"',
        'MASTER_PAGE_COUNT: 15',
        'MAX_RENDER_TEXT_CHARS: 12000',
        'EXECUTIVE_MASTER_ID: "DAHWnRKnNjY"',
        'DEFAULT_THEME: "executive_premium"',
        'grammar: "executive"',
        'grammar: "banking"',
        'grammar: "minimal"',
        'grammar: "impact"',
        '"institutional_banking"',
        '"modern_minimal"',
        '"impact_sustainability"',
        "function AG24_BP_V2_buildSemanticModel_",
        "function AG24_BP_V2_renderDocument_",
        "function AG24_BP_V2_RENDER_CELL_LIMIT_SYSTEM_TEST_V1()",
        "factsGridWritten",
        "cardsWritten",
        "actualMaxCellChars",
        "BUSINESS_PLAN_RENDER_TEXT_BOUNDED",
        "function AG24_BP_V2_assertWhiteLabel_",
        '"afrigreen24"',
        "AG24_BP_V2_addCover_",
        "AG24_BP_V2_addSnapshot_",
        "AG24_BP_V2_addRiskPage_",
        "AG24_BP_V2_addRoadmapPage_",
        "AG24_BP_V2_addClosing_",
        "AG24_BP_V2_addMasterSectionPage_",
        "layoutGrammar:",
        "AG24_BP_VISUAL_assertPreflight_(",
        "visualQualityPreflight",
        "Risques & points de vigilance",
        "Trajectoire d’exécution",
        "pageModelCount:",
    ]:
        if marker not in design_system_text:
            fail(f"Business Plan Design System V2 marker missing: {marker}")

    if "UrlFetchApp.fetch(" in design_system_text:
        fail("Document Design System must remain deterministic and must not call external AI/APIs")

visual_gate_path = APP / "BusinessPlanVisualQualityGateV1.js"
if not visual_gate_path.exists():
    fail("BusinessPlanVisualQualityGateV1.js is required")
else:
    visual_gate_text = visual_gate_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.3.0"',
        "EXPECTED_SEMANTIC_PAGE_COUNT: 15",
        "MIN_PHYSICAL_PAGE_COUNT: 15",
        "NORMAL_PHYSICAL_PAGE_MAX: 22",
        "WARNING_PHYSICAL_PAGE_MAX: 26",
        "HARD_PHYSICAL_PAGE_MAX: 26",
        "MAX_SINGLE_BLOCK_CHARS",
        "function AG24_BP_VISUAL_preflight_",
        "function AG24_BP_VISUAL_signalCount_",
        "function AG24_BP_VISUAL_minSignals_",
        "contentSignals:",
        "function AG24_BP_VISUAL_assertPreflight_",
        "Content density is advisory",
        "function AG24_BP_VISUAL_getTextLayout_",
        "function AG24_BP_VISUAL_countPdfPages_",
        "function AG24_BP_VISUAL_postflightPdf_",
        "function AG24_BP_VISUAL_assertPdf_",
        "PDF_PAGE_COUNT_UNREADABLE",
        "PHYSICAL_PAGE_COUNT_",
        "POST_PDF_PASS_WITH_WARNINGS",
        "function AG24_BP_VISUAL_PAGE_POLICY_SYSTEM_TEST_V1()",
    ]:
        if marker not in visual_gate_text:
            fail(f"PDF Visual Quality Gate V1 marker missing: {marker}")

    if "UrlFetchApp.fetch(" in visual_gate_text:
        fail("PDF Visual Quality Gate must remain deterministic and offline")

design_ui_path = APP / "BusinessPlanDesignV2.html"
if not design_ui_path.exists():
    fail("BusinessPlanDesignV2.html is required")
else:
    design_ui_text = design_ui_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'id="businessPlanDesignPage"',
        'value="executive_premium"',
        'value="institutional_banking"',
        'value="modern_minimal"',
        'value="impact_sustainability"',
        'id="bpDocumentLogo"',
        'id="bpDocumentLogoRemove"',
        'id="bpProjectBrandingStatus"',
        'id="bpDesignGenerateButton"',
    ]:
        if marker not in design_ui_text:
            fail(f"Business Plan design-selection UI marker missing: {marker}")

if code.exists():
    code_text = code.read_text(
        encoding="utf-8",
        errors="replace",
    )

    if "AG24_BP_V2_renderDocument_(" not in code_text:
        fail("Standard Business Plan production path must use Design System V2")
    if "AG24_BP_RENDER_INPUT_prepare_(" not in code_text:
        fail("Standard generation must create a bounded render-only copy")
    if "var canonicalData =" not in code_text:
        fail("Standard generation must preserve canonical data separately from render data")
    if "renderInputSafety:" not in code_text:
        fail("Render input safety observability is missing from generation response")
    if "STANDARD_GENERATION_STAGE_FAILED" not in code_text:
        fail("Generation stage failure observability is missing")
    if "AG24_BP_VISUAL_FIT_pdf_(" not in code_text:
        fail("Standard Business Plan production path must use Adaptive PDF Fit V1")
    if "fitApplied:" not in code_text or "initialPhysicalPageCount:" not in code_text:
        fail("Adaptive PDF Fit observability is missing from the production path")
    if "AG24_BP_PROJECT_BRANDING_resolveForGeneration_(" not in code_text:
        fail("Standard Business Plan production path must resolve canonical project branding")
    if 'cle === "projectBrandingToken"' not in code_text:
        fail("Project Branding capability must be excluded from the OpenAI payload")
    if "AG24_BP_VISUAL_FIT_pdf_(" not in code_text:
        fail("Standard generation must enforce Adaptive PDF Fit before final visual-quality acceptance")
    if "STANDARD_PDF_VISUAL_GATE_PASSED" not in code_text:
        fail("Visual quality success audit is missing")
    if "STANDARD_PDF_VISUAL_GATE_FAILED" not in code_text:
        fail("Visual quality failure audit is missing")

    for legacy_call in [
        "ajouterPageDeCouverture(body, data);",
        "ajouterSommaire(body);",
        "ajouterSyntheseStrategique(body, data);",
    ]:
        # Legacy helpers may remain for compatibility/tests, but the exact old
        # production orchestration block must no longer be present.
        if legacy_call in code_text[
            code_text.find("function genererBusinessPlan_(data)"):
            code_text.find("function genererBusinessPlanWeb")
            if code_text.find("function genererBusinessPlanWeb") > 0
            else len(code_text)
        ]:
            fail(f"Legacy Business Plan renderer remains active in production: {legacy_call}")

# Full Business Plan isolated system test
full_system_test_path = APP / "BusinessPlanFullSystemTest.js"
if not full_system_test_path.exists():
    fail("BusinessPlanFullSystemTest.js is required")
else:
    full_system_test_text = full_system_test_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "function AG24_BUSINESS_PLAN_FULL_SYSTEM_TEST_V1()",
        "syntheticData: true",
        "crmWritesAttempted: false",
        "dashboardWritesAttempted: false",
        "preparerBusinessPlanStandardIA52(",
        "DocumentApp.create(",
        "AG24_BP_V2_renderDocument_(",
        "designSystemVersion",
        "layoutGrammar",
        "whiteLabel",
        "pageModelCount",
        "executiveMasterId",
        "visualGateVersion",
        "visualPreflightValid",
        "physicalPdfPages",
        "AG24_BP_VISUAL_assertPdf_(",
        "AG24_BP_VISUAL_GATE_V1.MIN_PHYSICAL_PAGE_COUNT",
        "AG24_BP_VISUAL_GATE_V1.HARD_PHYSICAL_PAGE_MAX",
        "AG24_BP_DESIGN_V2.MASTER_PAGE_COUNT",
        "AG24_BP_DESIGN_V2.EXECUTIVE_MASTER_ID",
        "creerPdfDansMemeDossier(",
        "AG24_DOC_issueCapability_(",
        "telechargerPdfBusinessPlanStandard(",
        "setTrashed(true)",
        "cleanupSuccess",
        "BUSINESS_PLAN_FULL_SYSTEM_TEST_PASSED",
        "AFRIGREEN24_OPENAI_FULL_SYSTEM_TEST_LAST_REPORT",
    ]:
        if marker not in full_system_test_text:
            fail(f"Full Business Plan system-test marker missing: {marker}")

    if "UrlFetchApp.fetch(" in full_system_test_text:
        fail("Full Business Plan system test must use the canonical OpenAI bridge")

    if full_system_test_text.count("preparerBusinessPlanStandardIA52(") != 1:
        fail("Full Business Plan system test must invoke the Standard AI wrapper once")

    if re.search(r"(?i)sk-[A-Za-z0-9_-]{16,}", full_system_test_text):
        fail("Possible hard-coded OpenAI API key in full system test")


# Business Plan Visual Regression Preview V1 contract
visual_preview_path = APP / "BusinessPlanVisualRegressionPreviewV1.js"
if not visual_preview_path.exists():
    fail("BusinessPlanVisualRegressionPreviewV1.js is required")
else:
    visual_preview_text = visual_preview_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        'VERSION: "1.1.0"',
        '"executive_premium"',
        '"institutional_banking"',
        '"modern_minimal"',
        '"impact_sustainability"',
        "function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_V1()",
        "function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_LAST_REPORT_V1()",
        "Logger.log(",
        "JSON.stringify(",
        "function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_CLEANUP_V1()",
        "AG24_BP_VISUAL_PREVIEW_cleanupPrevious_",
        "AG24_BP_VISUAL_PREVIEW_renderTheme_",
        "AG24_BP_V2_renderDocument_(",
        "AG24_BP_VISUAL_assertPdf_(",
        "aiRequestCount",
        "layoutGrammar",
        "grammarSet",
        "Object.keys(",
        "visualGateVersion",
        "physicalPdfPages",
        "BUSINESS_PLAN_VISUAL_PREVIEW_CREATED",
        "BUSINESS_PLAN_VISUAL_PREVIEW_CLEANUP",
    ]:
        if marker not in visual_preview_text:
            fail(f"Visual regression preview marker missing: {marker}")

    if visual_preview_text.count("preparerBusinessPlanStandardIA52(") != 1:
        fail("Visual regression preview must prepare canonical AI content exactly once")

    if "UrlFetchApp.fetch(" in visual_preview_text:
        fail("Visual regression preview must not call external APIs directly")

    if "DriveApp.Access.ANYONE_WITH_LINK" in visual_preview_text:
        fail("Visual regression preview artifacts must remain private")

    if "AG24_DOC_issueCapability_(" in visual_preview_text:
        fail("Visual regression preview must not issue production download capabilities")

    if "genererBusinessPlan_(" in visual_preview_text:
        fail("Visual regression preview must bypass production persistence and CRM/dashboard writes")


# Project Branding browser integration contract
javascript_path = APP / "Javascript.html"
if not javascript_path.exists():
    fail("Javascript.html is required")
else:
    javascript_text = javascript_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    for marker in [
        "projectBrandingToken",
        "AG24_BP_BRANDING_localKey_",
        "AG24_BP_BRANDING_readLocalToken_",
        "AG24_BP_BRANDING_writeLocalToken_",
        "chargerBrandingProjetBusinessPlan_",
        "enregistrerBrandingProjetAvantGeneration_",
        ".AG24_BP_PROJECT_BRANDING_GET_V1(",
        ".AG24_BP_PROJECT_BRANDING_SAVE_V1(",
        "logoAction:",
        '"replace"',
        '"remove"',
    ]:
        if marker not in javascript_text:
            fail(f"Project Branding browser marker missing: {marker}")

    if "localStorage.setItem" in javascript_text and "projectName" in javascript_text:
        # The storage value is an opaque token; project identity is hashed into the key.
        if 'ag24:bp:branding:v1:' not in javascript_text:
            fail("Project Branding local storage must use the opaque hashed-key namespace")


# Import Engine V5 contract
index_path = APP / "Index.html"
if index_path.exists():
    index_text = index_path.read_text(encoding="utf-8", errors="replace")
    if "include('ImportBusinessPlanV5')" not in index_text:
        fail("Index.html must include ImportBusinessPlanV5")
    if "include('BusinessPlanDesignV2')" not in index_text:
        fail("Index.html must include BusinessPlanDesignV2")
    if 'ouvrirChoixDesignBusinessPlan(' not in index_text:
        fail("Import completion must route through the shared design selector")

import_backend = APP / "BusinessPlanImport.js"
if import_backend.exists():
    import_text = import_backend.read_text(encoding="utf-8", errors="replace")
    for marker in [
        "verifierSignatureFichierBusinessPlan_",
        "evaluerQualiteImportBusinessPlan_",
        "BUSINESS_PLAN_IMPORT_COMPLETED",
        "afrigreen24_bp_import_v5",
    ]:
        if marker not in import_text:
            fail(f"Import V5 backend marker missing: {marker}")

# Index runtime scripts must not contain escaped newline tokens between JS statements.
# This exact parser defect previously prevented the import completion controller from
# being declared, leaving the review CTA without its canonical transition.
if index_path.exists():
    if "BP_IMPORT_FIELD_META = BP_IMPORT_FIELD_META;\\\\n" in index_text:
        fail("Index.html contains escaped newline tokens in the import runtime script")


import_frontend = APP / "ImportBusinessPlanV5.html"
if not import_frontend.exists():
    fail("ImportBusinessPlanV5.html is required")
else:
    import_frontend_text = import_frontend.read_text(
        encoding="utf-8",
        errors="replace",
    )
    for marker in [
        "function bindReviewTransition()",
        "button.removeAttribute('onclick')",
        "button.addEventListener('click'",
        "var openReview = window.ouvrirComplementsBusinessPlan",
        "AG24_IMPORT_REVIEW_TRANSITION_FAILED",
        "window.setTimeout(enhanceCompletionPage, 0)",
    ]:
        if marker not in import_frontend_text:
            fail(f"Import review transition safety marker missing: {marker}")


for message in warnings:
    print(f"WARNING: {message}")

if errors:
    for message in errors:
        print(f"ERROR: {message}", file=sys.stderr)
    print(f"VALIDATION=FAIL errors={len(errors)} warnings={len(warnings)}", file=sys.stderr)
    raise SystemExit(1)

print(f"JS_FILES={len(js_files)}")
print(f"HTML_FILES={len(html_files)}")
print(f"PUBLIC_FUNCTIONS={sum(1 for name in functions if not name.endswith('_'))}")
print(f"VALIDATION=PASS warnings={len(warnings)}")
