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
    APP / "ImportBusinessPlanV5.html",
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

bridge = (APP / "HumbleOSBridge.js")
if bridge.exists():
    text = bridge.read_text(encoding="utf-8", errors="replace")
    if "HUMBLEOS_GATEWAY_SECRET" not in text:
        warn("HumbleOS secret property name not found")
    if re.search(r"(?m)^\s*const\s+secret\s*=", text):
        fail("HumbleOS secret must never be assigned from source code")

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


# Import Engine V5 contract
index_path = APP / "Index.html"
if index_path.exists():
    index_text = index_path.read_text(encoding="utf-8", errors="replace")
    if "include('ImportBusinessPlanV5')" not in index_text:
        fail("Index.html must include ImportBusinessPlanV5")

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
