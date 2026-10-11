/**
 * AfriGreen24 — Bank Reference Components V1
 *
 * Decision-oriented BANK components derived from established public
 * business-plan patterns (Bpifrance / SBA / Futurpreneur) without copying
 * source prose or visual identity.
 *
 * Goal: make the lender path read like a finance dossier, not a questionnaire.
 * Deterministic. No AI call. No external request.
 */
var AG24_BANK_REFERENCE_COMPONENTS_V1 = Object.freeze({
  VERSION:"1.0.0",
  BLUEPRINT_ID:"BANK_REFERENCE_V1"
});

function AG24_BANK_REF_text_(value) {
  return String(
    value === null || value === undefined
      ? ""
      : value
  )
    .replace(/\s+/g," ")
    .trim();
}

function AG24_BANK_REF_get_(object,path) {
  var current = object;
  var parts = String(path || "").split(".");

  for (var index=0; index<parts.length; index++) {
    if (current === null || current === undefined) return null;
    current = current[parts[index]];
  }

  return current;
}

function AG24_BANK_REF_first_(values) {
  for (var i=0; i<(values || []).length; i++) {
    var value = values[i];
    if (AG24_BANK_REF_text_(value)) return value;
  }
  return "";
}

function AG24_BANK_REF_currency_(data,project) {
  var raw = AG24_BANK_REF_first_([
    AG24_BANK_REF_get_(project,"documentContext.currency"),
    AG24_BANK_REF_get_(project,"funding.currency"),
    data && data.currency,
    data && data.fundingCurrency,
    data && data.financialCurrency
  ]);

  if (typeof AG24_PREMIUM_HARDEN_currency_ === "function") {
    return AG24_PREMIUM_HARDEN_currency_(raw);
  }

  return AG24_BANK_REF_text_(raw).toUpperCase();
}

function AG24_BANK_REF_money_(value,currency) {
  if (typeof AG24_PREMIUM_HARDEN_money_ === "function") {
    return AG24_PREMIUM_HARDEN_money_(value,currency);
  }

  var number = Number(value);
  if (!Number.isFinite(number)) return "";

  return currency
    ? String(currency).toUpperCase() + " " + String(number)
    : String(number) + " — devise à confirmer";
}

function AG24_BANK_REF_decisionTable_(body,rows,theme) {
  var usable = (rows || []).filter(function(row) {
    return row &&
      AG24_BANK_REF_text_(row[0]) &&
      AG24_BANK_REF_text_(row[1]);
  });

  if (!usable.length) return null;

  var table = body.appendTable(
    usable.map(function(row) {
      return [
        AG24_BANK_REF_text_(row[0]),
        AG24_BANK_REF_text_(row[1])
      ];
    })
  );

  table
    .setBorderColor(theme.border)
    .setBorderWidth(1);

  for (var r=0; r<table.getNumRows(); r++) {
    var label = table.getCell(r,0);
    var value = table.getCell(r,1);

    label.setBackgroundColor(theme.soft);
    value.setBackgroundColor(
      r % 2 === 0
        ? theme.white
        : theme.softAlt
    );

    AG24_BP_V2_styleCellText_(
      label,
      theme,
      {
        bold:true,
        color:theme.primaryDark,
        size:8
      }
    );

    AG24_BP_V2_styleCellText_(
      value,
      theme,
      {
        color:theme.text,
        size:9
      }
    );
  }

  table.setColumnWidth(0,165);
  table.setColumnWidth(1,315);

  body.appendParagraph("").setSpacingAfter(8);
  return table;
}

function AG24_BANK_REF_renderExecutiveSummary_(
  body,
  section,
  model,
  data,
  projectIntelligence,
  theme
) {
  data = data || {};
  projectIntelligence = projectIntelligence || null;

  AG24_BP_V2_addSectionTitle_(
    body,
    "01",
    "Résumé exécutif",
    theme
  );

  var narrative =
    section && section.narrative
      ? section.narrative
      : "";

  if (narrative) {
    AG24_BP_V2_addParagraphs_(
      body,
      narrative,
      theme
    );
  }

  var currency =
    AG24_BANK_REF_currency_(
      data,
      projectIntelligence
    );

  var fundingAmount =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"funding.amount"),
      data.fundingNeed,
      data.fundingAmount,
      data.montantDemande
    ]);

  var useOfFunds =
    AG24_BANK_REF_first_([
      data.useOfFunds,
      data.fundingUse,
      data.utilisationFonds
    ]);

  var customers =
    AG24_BANK_REF_first_([
      data.targetCustomers,
      model && model.snapshot && model.snapshot.targetCustomers
    ]);

  var revenueModel =
    AG24_BANK_REF_first_([
      data.revenueModel,
      model && model.snapshot && model.snapshot.revenueModel
    ]);

  var dscr =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"debt.dscr"),
      data.dscr,
      data.debtServiceCoverageRatio
    ]);

  var cfads =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"financialModel.cfads"),
      data.cfads
    ]);

  var repayment =
    "";

  if (AG24_BANK_REF_text_(dscr)) {
    repayment =
      "DSCR " +
      String(
        Math.round(Number(dscr) * 100) / 100
      ) +
      "x";
  } else if (AG24_BANK_REF_text_(cfads)) {
    repayment =
      "CFADS " +
      AG24_BANK_REF_money_(
        cfads,
        currency
      );
  } else {
    repayment =
      "Capacité de remboursement à documenter";
  }

  AG24_BANK_REF_decisionTable_(
    body,
    [
      [
        "Projet",
        model && model.project
          ? model.project.name
          : data.projectName
      ],
      [
        "Porteur",
        model && model.project
          ? model.project.promoter
          : data.promoterName
      ],
      [
        "Clientèle",
        customers
      ],
      [
        "Modèle de revenus",
        revenueModel
      ],
      [
        "Financement recherché",
        AG24_BANK_REF_money_(
          fundingAmount,
          currency
        )
      ],
      [
        "Usage principal",
        useOfFunds
      ],
      [
        "Lecture remboursement",
        repayment
      ]
    ],
    theme
  );

  if (
    typeof AG24_AUDIT_event_ ===
      "function"
  ) {
    try {
      AG24_AUDIT_event_(
        "BANK_REFERENCE_EXECUTIVE_SUMMARY_RENDERED",
        {
          version:
            AG24_BANK_REFERENCE_COMPONENTS_V1.VERSION,
          fundingPresent:
            Boolean(
              AG24_BANK_REF_text_(fundingAmount)
            ),
          repaymentSignal:
            repayment
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    component:"BANK_REFERENCE_EXECUTIVE_SUMMARY"
  };
}

function AG24_BANK_REF_renderFundingRequest_(
  body,
  section,
  model,
  data,
  projectIntelligence,
  theme
) {
  data = data || {};

  AG24_BP_V2_addSectionTitle_(
    body,
    "F",
    "Demande de financement",
    theme
  );

  var currency =
    AG24_BANK_REF_currency_(
      data,
      projectIntelligence
    );

  var amount =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"funding.amount"),
      data.fundingNeed,
      data.fundingAmount,
      data.montantDemande
    ]);

  var type =
    AG24_BANK_REF_first_([
      data.fundingType,
      data.financingType
    ]);

  var use =
    AG24_BANK_REF_first_([
      data.useOfFunds,
      data.fundingUse
    ]);

  var rate =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"debt.interestRate"),
      data.interestRate,
      data.tauxInteretAnnuel
    ]);

  var term =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"debt.termMonths"),
      data.termMonths,
      data.dureeRemboursementMois
    ]);

  var dscr =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"debt.dscr"),
      data.dscr
    ]);

  var annualDebtService =
    AG24_BANK_REF_first_([
      AG24_BANK_REF_get_(projectIntelligence,"debt.annualDebtService"),
      data.annualDebtService
    ]);

  AG24_BP_V2_addHeroMetric_(
    body,
    "Montant recherché",
    AG24_BANK_REF_money_(amount,currency),
    theme
  );

  AG24_BANK_REF_decisionTable_(
    body,
    [
      ["Instrument",type],
      ["Utilisation des fonds",use],
      [
        "Taux",
        AG24_BANK_REF_text_(rate)
          ? String(rate) + "%"
          : "À confirmer"
      ],
      [
        "Durée",
        AG24_BANK_REF_text_(term)
          ? String(term) + " mois"
          : "À confirmer"
      ],
      [
        "Service annuel de la dette",
        AG24_BANK_REF_text_(annualDebtService)
          ? AG24_BANK_REF_money_(
              annualDebtService,
              currency
            )
          : "À calculer"
      ],
      [
        "DSCR",
        AG24_BANK_REF_text_(dscr)
          ? String(
              Math.round(Number(dscr) * 100) / 100
            ) + "x"
          : "À calculer"
      ]
    ],
    theme
  );

  if (section && section.narrative) {
    AG24_BP_V2_addParagraphs_(
      body,
      section.narrative,
      theme
    );
  }

  if (
    typeof AG24_PREMIUM_VISUALS_renderAllocation_ ===
      "function"
  ) {
    AG24_PREMIUM_VISUALS_renderAllocation_(
      body,
      data,
      projectIntelligence || null,
      theme
    );
  }

  return {
    success:true,
    rendered:true,
    component:"BANK_REFERENCE_FUNDING_REQUEST"
  };
}

function AG24_BANK_REF_renderRiskRegister_(
  body,
  model,
  theme
) {
  var risks =
    model &&
    model.risks
      ? model.risks
      : {};

  var raw =
    String(risks.raw || "")
      .replace(/[•●▪]/g,";")
      .replace(/\r?\n/g,";");

  var items =
    raw
      .split(";")
      .map(function(item) {
        return AG24_BANK_REF_text_(item);
      })
      .filter(Boolean)
      .slice(0,8);

  if (!items.length) {
    return {
      success:true,
      rendered:false,
      reason:"NO_RISKS"
    };
  }

  AG24_BP_V2_addSectionTitle_(
    body,
    "R",
    "Risques & mesures de maîtrise",
    theme
  );

  var rows = [[
    "RISQUE",
    "NIVEAU",
    "MESURE DE MAÎTRISE"
  ]];

  items.forEach(function(item,index) {
    var level =
      risks.levels &&
      risks.levels[index] !== undefined
        ? AG24_BANK_REF_text_(
            risks.levels[index]
          )
        : "À qualifier";

    var mitigation =
      risks.mitigations &&
      risks.mitigations[index] !== undefined
        ? AG24_BANK_REF_text_(
            risks.mitigations[index]
          )
        : "";

    rows.push([
      item,
      level || "À qualifier",
      mitigation || "À formaliser"
    ]);
  });

  var table = body.appendTable(rows);
  table
    .setBorderColor(theme.border)
    .setBorderWidth(1);

  for (var r=0; r<table.getNumRows(); r++) {
    for (var col=0; col<3; col++) {
      var cell = table.getCell(r,col);
      cell.setBackgroundColor(
        r === 0
          ? theme.primary
          : (
              r % 2 === 0
                ? theme.softAlt
                : theme.white
            )
      );

      AG24_BP_V2_styleCellText_(
        cell,
        theme,
        {
          bold:r === 0,
          color:
            r === 0
              ? theme.white
              : theme.text,
          size:r === 0 ? 7.5 : 8.5
        }
      );
    }
  }

  table.setColumnWidth(0,210);
  table.setColumnWidth(1,85);
  table.setColumnWidth(2,185);

  body.appendParagraph("").setSpacingAfter(8);

  return {
    success:true,
    rendered:true,
    component:"BANK_REFERENCE_RISK_REGISTER",
    riskCount:items.length
  };
}

function AG24_BANK_REFERENCE_COMPONENTS_SYSTEM_TEST_V1() {
  var documentId = "";

  var report = {
    success:false,
    version:
      AG24_BANK_REFERENCE_COMPONENTS_V1.VERSION,
    executiveRendered:false,
    fundingRendered:false,
    riskRendered:false,
    lenderSignalsPresent:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var doc =
      DocumentApp.create(
        "AG24 Bank Reference Components " +
        String(new Date().getTime())
      );

    documentId = doc.getId();

    var body = doc.getBody();
    var theme =
      AG24_BP_V2_resolveTheme_(
        "institutional_banking"
      );

    var model = {
      project:{
        name:"Projet test",
        promoter:"Promoteur test"
      },
      snapshot:{
        targetCustomers:"PME",
        revenueModel:"Abonnement"
      },
      risks:{
        raw:"Vol;Risque de change",
        levels:{
          0:"MEDIUM",
          1:"HIGH"
        },
        mitigations:{
          0:"Sécurisation du site",
          1:"Clause d’ajustement"
        }
      }
    };

    var data = {
      projectName:"Projet test",
      promoterName:"Promoteur test",
      targetCustomers:"PME",
      revenueModel:"Abonnement",
      fundingType:"Prêt bancaire",
      fundingNeed:150000,
      useOfFunds:"Équipements et fonds de roulement",
      currency:"EUR"
    };

    var project = {
      documentContext:{currency:"EUR"},
      funding:{
        amount:150000,
        currency:"EUR"
      },
      financialModel:{
        cfads:72000
      },
      debt:{
        interestRate:8,
        termMonths:36,
        annualDebtService:56400,
        dscr:1.28
      }
    };

    report.executiveRendered =
      AG24_BANK_REF_renderExecutiveSummary_(
        body,
        {narrative:"Résumé de test."},
        model,
        data,
        project,
        theme
      ).rendered === true;

    report.fundingRendered =
      AG24_BANK_REF_renderFundingRequest_(
        body,
        {narrative:"Financement de test."},
        model,
        data,
        project,
        theme
      ).rendered === true;

    report.riskRendered =
      AG24_BANK_REF_renderRiskRegister_(
        body,
        model,
        theme
      ).rendered === true;

    doc.saveAndClose();

    var reopened =
      DocumentApp.openById(
        documentId
      );

    var text =
      reopened.getBody().getText();

    report.lenderSignalsPresent =
      text.indexOf("Lecture remboursement") !== -1 &&
      text.indexOf("DSCR 1.28x") !== -1 &&
      text.indexOf("Demande de financement") !== -1 &&
      text.indexOf("Service annuel de la dette") !== -1 &&
      text.indexOf("Mesure de maîtrise".toUpperCase()) !== -1;

    reopened.saveAndClose();

    report.success =
      report.executiveRendered &&
      report.fundingRendered &&
      report.riskRendered &&
      report.lenderSignalsPresent;

    if (!report.success) {
      report.failureCode =
        "BANK_REFERENCE_COMPONENTS_CONTRACT_FAILED";
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
