/**
 * AfriGreen24 — Premium Document Hardening V1
 *
 * Reusable truth/layout safeguards discovered through real-document QA.
 * Deterministic only: no AI, no external calls, no canonical truth mutation.
 */
var AG24_PREMIUM_HARDEN_V1 = Object.freeze({
  VERSION:"1.0.0",
  SNAPSHOT_MAX_CHARS:260,
  UNKNOWN_CURRENCY_LABEL:"devise à confirmer"
});

function AG24_PREMIUM_HARDEN_text_(value) {
  return String(
    value === null || value === undefined
      ? ""
      : value
  )
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_HARDEN_token_(value) {
  var text =
    AG24_PREMIUM_HARDEN_text_(value)
      .toLowerCase();

  try {
    text =
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"");
  } catch (error) {}

  return text
    .replace(/[.!?]+$/g,"")
    .trim();
}

function AG24_PREMIUM_HARDEN_isSentinel_(value) {
  var token =
    AG24_PREMIUM_HARDEN_token_(value);

  if (!token) return true;

  var exact = {
    "-":true,
    "—":true,
    "n/a":true,
    "na":true,
    "none":true,
    "null":true,
    "neant":true,
    "rien":true,
    "aucun":true,
    "aucune":true,
    "personne":true,
    "aucun concurrent":true,
    "aucun concurrent identifie":true,
    "aucune concurrence":true,
    "pas de concurrent":true,
    "pas de concurrence":true,
    "non renseigne":true,
    "non renseignee":true,
    "indisponible":true
  };

  return exact[token] === true;
}

function AG24_PREMIUM_HARDEN_optional_(value) {
  return AG24_PREMIUM_HARDEN_isSentinel_(value)
    ? ""
    : AG24_PREMIUM_HARDEN_text_(value);
}

function AG24_PREMIUM_HARDEN_currency_(value) {
  var raw =
    AG24_PREMIUM_HARDEN_text_(value)
      .toUpperCase();

  if (!raw) return "";

  if (
    raw === "€" ||
    raw === "EURO" ||
    raw === "EUROS"
  ) {
    return "EUR";
  }

  if (
    raw === "$" ||
    raw === "DOLLAR" ||
    raw === "DOLLARS"
  ) {
    return "USD";
  }

  if (
    raw === "FCFA" ||
    raw === "F CFA" ||
    raw === "F.CFA"
  ) {
    /*
     * FCFA alone does not tell us whether XAF or XOF.
     * Keep the declared label rather than guessing the monetary zone.
     */
    return "FCFA";
  }

  return /^[A-Z]{3}$/.test(raw)
    ? raw
    : "";
}

function AG24_PREMIUM_HARDEN_number_(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  var clean =
    typeof value === "string"
      ? value
          .replace(/\s/g,"")
          .replace(/[^0-9,.-]/g,"")
          .replace(",",".")
      : value;

  var number = Number(clean);

  return Number.isFinite(number)
    ? number
    : null;
}

function AG24_PREMIUM_HARDEN_compactNumber_(value) {
  var number =
    AG24_PREMIUM_HARDEN_number_(value);

  if (number === null) return "";

  var absolute = Math.abs(number);

  if (absolute >= 1000000) {
    return (
      (number / 1000000)
        .toFixed(1)
        .replace(".0","") +
      "M"
    );
  }

  if (absolute >= 1000) {
    return (
      (number / 1000)
        .toFixed(1)
        .replace(".0","") +
      "k"
    );
  }

  return String(
    Math.round(number * 100) / 100
  );
}

function AG24_PREMIUM_HARDEN_money_(value, currency) {
  var number =
    AG24_PREMIUM_HARDEN_number_(value);

  if (number === null) return "";

  var compact =
    AG24_PREMIUM_HARDEN_compactNumber_(number);

  var code =
    AG24_PREMIUM_HARDEN_currency_(currency);

  if (!code) {
    return (
      compact +
      " — " +
      AG24_PREMIUM_HARDEN_V1.UNKNOWN_CURRENCY_LABEL
    );
  }

  if (code === "EUR") return "€" + compact;
  if (code === "USD") return "$" + compact;
  if (
    code === "XAF" ||
    code === "XOF" ||
    code === "FCFA"
  ) {
    return "FCFA " + compact;
  }

  return code + " " + compact;
}

function AG24_PREMIUM_HARDEN_snapshotText_(value) {
  var text =
    AG24_PREMIUM_HARDEN_text_(value);

  var max =
    AG24_PREMIUM_HARDEN_V1
      .SNAPSHOT_MAX_CHARS;

  if (text.length <= max) {
    return text;
  }

  var candidate =
    text.slice(0,max);

  var breakAt =
    Math.max(
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf("; "),
      candidate.lastIndexOf(", "),
      candidate.lastIndexOf(" ")
    );

  if (breakAt > Math.floor(max * 0.65)) {
    candidate =
      candidate.slice(0,breakAt);
  }

  return candidate.trim() + "…";
}

function AG24_PREMIUM_HARDEN_prepareData_(data) {
  data = data || {};

  var output = {};

  Object.keys(data).forEach(function(key) {
    output[key] = data[key];
  });

  [
    "competitors",
    "competition",
    "alternatives",
    "acquisitionStrategy",
    "conversionStrategy",
    "retentionStrategy"
  ].forEach(function(key) {
    if (
      Object.prototype.hasOwnProperty.call(
        output,
        key
      )
    ) {
      output[key] =
        AG24_PREMIUM_HARDEN_optional_(
          output[key]
        );
    }
  });

  if (
    Object.prototype.hasOwnProperty.call(
      output,
      "currency"
    )
  ) {
    output.currency =
      AG24_PREMIUM_HARDEN_currency_(
        output.currency
      );
  }

  return output;
}

function AG24_PREMIUM_HARDEN_financialReadiness_(
  data,
  projectIntelligence
) {
  data = data || {};

  function get_(object,path) {
    var current = object;
    var parts = String(path || "").split(".");

    for (
      var index = 0;
      index < parts.length;
      index++
    ) {
      if (
        current === null ||
        current === undefined
      ) {
        return null;
      }

      current = current[parts[index]];
    }

    return current;
  }

  var canonical =
    projectIntelligence || null;

  var currency =
    AG24_PREMIUM_HARDEN_currency_(
      canonical
        ? (
            get_(
              canonical,
              "documentContext.currency"
            ) ||
            get_(
              canonical,
              "funding.currency"
            )
          )
        : (
            data.currency ||
            data.fundingCurrency ||
            data.financialCurrency
          )
    );

  var amount =
    canonical
      ? get_(
          canonical,
          "funding.amount"
        )
      : (
          data.fundingNeed ||
          data.fundingAmount ||
          data.montantDemande
        );

  var rate =
    canonical
      ? get_(
          canonical,
          "debt.interestRate"
        )
      : (
          data.interestRate ||
          data.tauxInteretAnnuel
        );

  var term =
    canonical
      ? get_(
          canonical,
          "debt.termMonths"
        )
      : (
          data.termMonths ||
          data.dureeRemboursementMois
        );

  var annualDebtService =
    canonical
      ? get_(
          canonical,
          "debt.annualDebtService"
        )
      : (
          data.annualDebtService ||
          data.debtServiceAnnual
        );

  var dscr =
    canonical
      ? get_(
          canonical,
          "debt.dscr"
        )
      : (
          data.dscr ||
          data.debtServiceCoverageRatio
        );

  var missing = [];

  if (!currency) {
    missing.push("currency");
  }

  if (
    AG24_PREMIUM_HARDEN_number_(
      amount
    ) === null
  ) {
    missing.push("funding.amount");
  }

  if (
    AG24_PREMIUM_HARDEN_number_(
      rate
    ) === null
  ) {
    missing.push("debt.interestRate");
  }

  if (
    AG24_PREMIUM_HARDEN_number_(
      term
    ) === null
  ) {
    missing.push("debt.termMonths");
  }

  if (
    AG24_PREMIUM_HARDEN_number_(
      annualDebtService
    ) === null
  ) {
    missing.push("debt.annualDebtService");
  }

  if (
    AG24_PREMIUM_HARDEN_number_(
      dscr
    ) === null
  ) {
    missing.push("debt.dscr");
  }

  return {
    success:true,
    version:
      AG24_PREMIUM_HARDEN_V1.VERSION,
    ready:
      missing.length === 0,
    status:
      missing.length === 0
        ? "BANK_FINANCIAL_READY"
        : "BANK_FINANCIAL_STRUCTURE_REQUIRED",
    currency:currency,
    missing:missing
  };
}

function AG24_PREMIUM_HARDEN_sectionTitles_() {
  return {
    "Résumé exécutif":true,
    "Présentation du projet":true,
    "Problème et opportunité":true,
    "Solution et proposition de valeur":true,
    "Marché et clientèle":true,
    "Concurrence & positionnement":true,
    "Modèle économique":true,
    "Stratégie commerciale":true,
    "Organisation opérationnelle":true,
    "Équipe et organisation opérationnelle":true,
    "Équipe & gouvernance":true,
    "Financial Story":true,
    "Readiness financière":true,
    "Financement":true,
    "Risques & points de vigilance":true,
    "Impact":true,
    "Roadmap":true,
    "Annexes financières bancaires":true,
    "Traction & preuves":true
  };
}

function AG24_PREMIUM_HARDEN_renumberSections_(body) {
  if (!body) {
    return {
      success:false,
      count:0
    };
  }

  var titles =
    AG24_PREMIUM_HARDEN_sectionTitles_();

  var ordinal = 0;
  var changed = [];

  for (
    var index = 0;
    index < body.getNumChildren();
    index++
  ) {
    var child =
      body.getChild(index);

    if (
      child.getType() !==
      DocumentApp.ElementType.TABLE
    ) {
      continue;
    }

    var table =
      child.asTable();

    if (
      table.getNumRows() !== 1 ||
      table.getRow(0).getNumCells() !== 2
    ) {
      continue;
    }

    var title =
      AG24_PREMIUM_HARDEN_text_(
        table.getCell(0,1).getText()
      );

    if (!titles[title]) {
      continue;
    }

    ordinal += 1;

    var number =
      ordinal < 10
        ? "0" + String(ordinal)
        : String(ordinal);

    table
      .getCell(0,0)
      .getChild(0)
      .asParagraph()
      .setText(number);

    changed.push({
      title:title,
      number:number
    });
  }

  if (
    typeof AG24_AUDIT_event_ ===
      "function"
  ) {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_SECTION_RENUMBERING_APPLIED",
        {
          version:
            AG24_PREMIUM_HARDEN_V1.VERSION,
          count:changed.length,
          sections:changed
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    count:changed.length,
    sections:changed
  };
}

function AG24_PREMIUM_DOCUMENT_HARDENING_SYSTEM_TEST_V1() {
  var documentId = "";

  var report = {
    success:false,
    version:
      AG24_PREMIUM_HARDEN_V1.VERSION,
    sentinelRemoved:false,
    humanNamePreserved:false,
    unknownCurrencySafe:false,
    snapshotBounded:false,
    readinessDetected:false,
    numberingPass:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    report.sentinelRemoved =
      AG24_PREMIUM_HARDEN_optional_(
        "Personne"
      ) === "" &&
      AG24_PREMIUM_HARDEN_optional_(
        "Aucun concurrent"
      ) === "";

    report.humanNamePreserved =
      AG24_PREMIUM_HARDEN_optional_(
        "Jean Personne"
      ) === "Jean Personne";

    report.unknownCurrencySafe =
      AG24_PREMIUM_HARDEN_money_(
        77000,
        ""
      ) ===
        "77k — devise à confirmer";

    var bounded =
      AG24_PREMIUM_HARDEN_snapshotText_(
        Array(400).join("A")
      );

    report.snapshotBounded =
      bounded.length <=
        (
          AG24_PREMIUM_HARDEN_V1
            .SNAPSHOT_MAX_CHARS +
          1
        );

    var readiness =
      AG24_PREMIUM_HARDEN_financialReadiness_(
        {
          fundingNeed:77000
        },
        null
      );

    report.readinessDetected =
      readiness.ready === false &&
      readiness.missing.indexOf(
        "currency"
      ) !== -1 &&
      readiness.missing.indexOf(
        "debt.dscr"
      ) !== -1;

    var doc =
      DocumentApp.create(
        "AG24 Premium Hardening Test " +
        String(new Date().getTime())
      );

    documentId = doc.getId();

    var body = doc.getBody();
    var theme =
      AG24_BP_V2_resolveTheme_(
        "executive_premium"
      );

    AG24_BP_V2_addSectionTitle_(
      body,
      "11",
      "Risques & points de vigilance",
      theme
    );

    AG24_BP_V2_addSectionTitle_(
      body,
      "10",
      "Impact",
      theme
    );

    AG24_BP_V2_addSectionTitle_(
      body,
      "F",
      "Financial Story",
      theme
    );

    var numbering =
      AG24_PREMIUM_HARDEN_renumberSections_(
        body
      );

    report.numberingPass =
      numbering.count === 3 &&
      numbering.sections[0].number === "01" &&
      numbering.sections[1].number === "02" &&
      numbering.sections[2].number === "03";

    doc.saveAndClose();

    report.success =
      report.sentinelRemoved &&
      report.humanNamePreserved &&
      report.unknownCurrencySafe &&
      report.snapshotBounded &&
      report.readinessDetected &&
      report.numberingPass;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_DOCUMENT_HARDENING_CONTRACT_FAILED";
    }

  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);

  } finally {
    if (documentId) {
      try {
        var file =
          DriveApp.getFileById(
            documentId
          );

        file.setTrashed(true);

        report.cleanupSuccess =
          file.isTrashed() === true;
      } catch (cleanupError) {
        report.cleanupSuccess = false;
      }
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    Logger.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );
  }

  return report;
}
