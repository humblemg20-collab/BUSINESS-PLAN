/**
 * ============================================================
 * BUSINESS PLAN DESIGN SYSTEM V2
 * ============================================================
 *
 * Architecture:
 * CONTENT ENGINE -> SEMANTIC MODEL -> THEME ENGINE -> DOCUMENT COMPOSER
 *
 * Rules:
 * - white-label output only;
 * - client logo is optional;
 * - same canonical content for every design;
 * - switching a theme never requires another AI call;
 * - deterministic rendering and validation.
 */

var AG24_BP_DESIGN_V2 = Object.freeze({
  VERSION: "2.0.0",
  DEFAULT_THEME: "executive_premium",
  ALLOWED_THEMES: Object.freeze([
    "executive_premium",
    "institutional_banking",
    "modern_minimal",
    "impact_sustainability"
  ])
});


var AG24_BP_THEMES_V2 = Object.freeze({
  executive_premium: Object.freeze({
    id: "executive_premium",
    label: "Executive Premium",
    primary: "#16263D",
    primaryDark: "#0D1726",
    secondary: "#B78B43",
    accent: "#D8B56C",
    soft: "#F4F1EA",
    softAlt: "#F6F8FA",
    text: "#1F2933",
    muted: "#66717D",
    border: "#DDE2E7",
    white: "#FFFFFF",
    headingFont: "Montserrat",
    bodyFont: "Arial"
  }),

  institutional_banking: Object.freeze({
    id: "institutional_banking",
    label: "Institutional Banking",
    primary: "#15324B",
    primaryDark: "#0B2235",
    secondary: "#557A8B",
    accent: "#A9844F",
    soft: "#F1F5F7",
    softAlt: "#F8FAFB",
    text: "#202A33",
    muted: "#66737E",
    border: "#D9E1E6",
    white: "#FFFFFF",
    headingFont: "Montserrat",
    bodyFont: "Arial"
  }),

  modern_minimal: Object.freeze({
    id: "modern_minimal",
    label: "Modern Minimal",
    primary: "#20252B",
    primaryDark: "#111418",
    secondary: "#5B6570",
    accent: "#2F6FED",
    soft: "#F2F4F7",
    softAlt: "#FAFAFB",
    text: "#20252B",
    muted: "#6C737C",
    border: "#E2E5E9",
    white: "#FFFFFF",
    headingFont: "Montserrat",
    bodyFont: "Arial"
  }),

  impact_sustainability: Object.freeze({
    id: "impact_sustainability",
    label: "Impact & Sustainability",
    primary: "#25483C",
    primaryDark: "#173229",
    secondary: "#6D846B",
    accent: "#C28C52",
    soft: "#F0F5F1",
    softAlt: "#FAFBF8",
    text: "#223029",
    muted: "#657169",
    border: "#DCE6DE",
    white: "#FFFFFF",
    headingFont: "Montserrat",
    bodyFont: "Arial"
  })
});


function AG24_BP_V2_resolveTheme_(themeId) {
  var id = String(themeId || "").trim().toLowerCase();

  if (
    AG24_BP_DESIGN_V2.ALLOWED_THEMES.indexOf(id) === -1
  ) {
    id = AG24_BP_DESIGN_V2.DEFAULT_THEME;
  }

  return AG24_BP_THEMES_V2[id];
}


function AG24_BP_V2_text_(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}


function AG24_BP_V2_fact_(data, key) {
  if (
    typeof valeurStandardV5_ === "function"
  ) {
    return AG24_BP_V2_text_(
      valeurStandardV5_(data || {}, key)
    );
  }

  return AG24_BP_V2_text_(
    data && data[key]
  );
}


function AG24_BP_V2_narrative_(
  key,
  fallbackFunction,
  data
) {
  var fallback = "";

  if (
    typeof fallbackFunction === "function"
  ) {
    fallback =
      fallbackFunction(data || {});
  }

  if (
    typeof obtenirNarratifDescriptifStandardV5_ ===
    "function"
  ) {
    return AG24_BP_V2_text_(
      obtenirNarratifDescriptifStandardV5_(
        key,
        fallback
      )
    );
  }

  if (
    typeof obtenirNarratifStandardIA52_ ===
    "function"
  ) {
    return AG24_BP_V2_text_(
      obtenirNarratifStandardIA52_(
        key,
        fallback
      )
    );
  }

  return AG24_BP_V2_text_(fallback);
}


function AG24_BP_V2_buildSemanticModel_(data) {
  data = data || {};

  var projectName =
    AG24_BP_V2_fact_(
      data,
      "projectName"
    ) ||
    "Projet";

  var fundingType =
    AG24_BP_V2_fact_(
      data,
      "fundingType"
    );

  var fundingNeed =
    AG24_BP_V2_fact_(
      data,
      "fundingNeed"
    );

  var fundingLabel = "";

  if (
    fundingType &&
    fundingNeed
  ) {
    fundingLabel =
      fundingType +
      " — " +
      fundingNeed;
  } else {
    fundingLabel =
      fundingNeed ||
      fundingType;
  }

  return {
    version:
      AG24_BP_DESIGN_V2.VERSION,

    project: {
      name:
        projectName,
      promoter:
        AG24_BP_V2_fact_(
          data,
          "promoterName"
        ),
      country:
        AG24_BP_V2_fact_(
          data,
          "country"
        ),
      sector:
        AG24_BP_V2_fact_(
          data,
          "sector"
        ),
      stage:
        AG24_BP_V2_fact_(
          data,
          "stage"
        ),
      slogan:
        AG24_BP_V2_text_(
          data.organizationSlogan ||
          data.projectSlogan
        )
    },

    snapshot: {
      problem:
        AG24_BP_V2_fact_(
          data,
          "problem"
        ),
      solution:
        AG24_BP_V2_fact_(
          data,
          "solution"
        ),
      valueProposition:
        AG24_BP_V2_fact_(
          data,
          "valueProposition"
        ),
      revenueModel:
        AG24_BP_V2_fact_(
          data,
          "revenueModel"
        ),
      targetCustomers:
        AG24_BP_V2_fact_(
          data,
          "targetCustomers"
        ),
      marketArea:
        AG24_BP_V2_fact_(
          data,
          "marketArea"
        ),
      impact:
        AG24_BP_V2_fact_(
          data,
          "impact"
        ),
      funding:
        fundingLabel
    },

    sections: [
      {
        number: "01",
        id: "executive-summary",
        title: "Résumé exécutif",
        narrative:
          AG24_BP_V2_narrative_(
            "resumeExecutif",
            typeof redigerResumeExecutif === "function"
              ? redigerResumeExecutif
              : null,
            data
          ),
        cards: [
          [
            "Solution",
            AG24_BP_V2_fact_(
              data,
              "solution"
            )
          ],
          [
            "Proposition de valeur",
            AG24_BP_V2_fact_(
              data,
              "valueProposition"
            )
          ]
        ]
      },
      {
        number: "02",
        id: "project",
        title: "Présentation du projet",
        narrative:
          AG24_BP_V2_narrative_(
            "presentationProjet",
            typeof redigerPresentationProjet === "function"
              ? redigerPresentationProjet
              : null,
            data
          ),
        facts: [
          [
            "Porteur",
            AG24_BP_V2_fact_(
              data,
              "promoterName"
            )
          ],
          [
            "Pays ou zone",
            AG24_BP_V2_fact_(
              data,
              "country"
            )
          ],
          [
            "Secteur",
            AG24_BP_V2_fact_(
              data,
              "sector"
            )
          ],
          [
            "Stade",
            AG24_BP_V2_fact_(
              data,
              "stage"
            )
          ]
        ]
      },
      {
        number: "03",
        id: "problem",
        title: "Problème et opportunité",
        narrative:
          AG24_BP_V2_narrative_(
            "problemeOpportunite",
            typeof redigerProbleme === "function"
              ? redigerProbleme
              : null,
            data
          ),
        cards: [
          [
            "Population concernée",
            AG24_BP_V2_fact_(
              data,
              "affectedPeople"
            )
          ],
          [
            "Pourquoi maintenant",
            AG24_BP_V2_fact_(
              data,
              "urgency"
            )
          ]
        ]
      },
      {
        number: "04",
        id: "solution",
        title: "Solution et proposition de valeur",
        narrative:
          AG24_BP_V2_narrative_(
            "solutionProposee",
            typeof redigerSolution === "function"
              ? redigerSolution
              : null,
            data
          ),
        cards: [
          [
            "Proposition de valeur",
            AG24_BP_V2_fact_(
              data,
              "valueProposition"
            )
          ],
          [
            "Bénéfice concret",
            AG24_BP_V2_fact_(
              data,
              "benefit"
            )
          ]
        ]
      },
      {
        number: "05",
        id: "market",
        title: "Marché et clientèle",
        narrative:
          AG24_BP_V2_narrative_(
            "analyseMarche",
            typeof redigerMarche === "function"
              ? redigerMarche
              : null,
            data
          ),
        cards: [
          [
            "Clientèle cible",
            AG24_BP_V2_fact_(
              data,
              "targetCustomers"
            )
          ],
          [
            "Zone de marché",
            AG24_BP_V2_fact_(
              data,
              "marketArea"
            )
          ],
          [
            "Concurrence et alternatives",
            AG24_BP_V2_fact_(
              data,
              "competitors"
            )
          ]
        ]
      },
      {
        number: "06",
        id: "business-model",
        title: "Modèle économique",
        narrative:
          AG24_BP_V2_narrative_(
            "modeleEconomique",
            typeof redigerModeleEconomique === "function"
              ? redigerModeleEconomique
              : null,
            data
          ),
        cards: [
          [
            "Sources de revenus",
            AG24_BP_V2_fact_(
              data,
              "revenueModel"
            )
          ],
          [
            "Tarification",
            AG24_BP_V2_fact_(
              data,
              "pricing"
            )
          ],
          [
            "Principaux coûts",
            AG24_BP_V2_fact_(
              data,
              "mainCosts"
            )
          ]
        ]
      },
      {
        number: "07",
        id: "go-to-market",
        title: "Stratégie commerciale",
        narrative:
          AG24_BP_V2_narrative_(
            "strategieCommerciale",
            typeof redigerStrategieCommerciale === "function"
              ? redigerStrategieCommerciale
              : null,
            data
          ),
        cards: [
          [
            "Canaux",
            AG24_BP_V2_fact_(
              data,
              "salesChannels"
            )
          ],
          [
            "Clients prioritaires",
            AG24_BP_V2_fact_(
              data,
              "targetCustomers"
            )
          ]
        ]
      },
      {
        number: "08",
        id: "operations",
        title: "Équipe et organisation opérationnelle",
        narrative:
          AG24_BP_V2_narrative_(
            "equipeOperations",
            typeof redigerEquipe === "function"
              ? redigerEquipe
              : null,
            data
          ),
        cards: [
          [
            "Équipe",
            AG24_BP_V2_fact_(
              data,
              "team"
            )
          ]
        ]
      },
      {
        number: "09",
        id: "funding",
        title: "Financement",
        narrative:
          AG24_BP_V2_narrative_(
            "financement",
            typeof redigerFinancement === "function"
              ? redigerFinancement
              : null,
            data
          ),
        facts: [
          [
            "Type",
            fundingType
          ],
          [
            "Montant recherché",
            fundingNeed
          ],
          [
            "Utilisation prévue",
            AG24_BP_V2_fact_(
              data,
              "useOfFunds"
            )
          ]
        ]
      },
      {
        number: "10",
        id: "impact",
        title: "Impact",
        narrative:
          AG24_BP_V2_narrative_(
            "impact",
            typeof redigerImpact === "function"
              ? redigerImpact
              : null,
            data
          ),
        cards: [
          [
            "Impact déclaré",
            AG24_BP_V2_fact_(
              data,
              "impact"
            )
          ]
        ]
      },
      {
        number: "11",
        id: "risks",
        title: "Risques et points de vigilance",
        narrative: "",
        cards: [
          [
            "Risque déclaré",
            AG24_BP_V2_fact_(
              data,
              "risks"
            )
          ]
        ]
      }
    ],

    closing: {
      valueProposition:
        AG24_BP_V2_fact_(
          data,
          "valueProposition"
        ) ||
        AG24_BP_V2_fact_(
          data,
          "solution"
        ),
      funding:
        fundingLabel,
      promoter:
        AG24_BP_V2_fact_(
          data,
          "promoterName"
        ),
      email:
        AG24_BP_V2_fact_(
          data,
          "email"
        )
    }
  };
}


function AG24_BP_V2_configureDocument_(
  body
) {
  body.setMarginTop(46);
  body.setMarginBottom(48);
  body.setMarginLeft(48);
  body.setMarginRight(48);
}


function AG24_BP_V2_styleCellText_(
  cell,
  theme,
  options
) {
  options = options || {};

  for (
    var index = 0;
    index < cell.getNumChildren();
    index++
  ) {
    var child =
      cell.getChild(index);

    if (
      child.getType() !==
      DocumentApp.ElementType.PARAGRAPH
    ) {
      continue;
    }

    child
      .asParagraph()
      .setFontFamily(
        options.font ||
        theme.bodyFont
      )
      .setFontSize(
        Number(
          options.size || 9
        )
      )
      .setForegroundColor(
        options.color ||
        theme.text
      )
      .setBold(
        Boolean(
          options.bold
        )
      )
      .setLineSpacing(
        Number(
          options.lineSpacing || 1.15
        )
      )
      .setSpacingBefore(
        Number(
          options.before || 3
        )
      )
      .setSpacingAfter(
        Number(
          options.after || 3
        )
      );
  }
}


function AG24_BP_V2_insertClientLogo_(
  paragraph,
  data,
  width
) {
  if (
    typeof obtenirLogoClientBusinessPlan_ !==
    "function"
  ) {
    return null;
  }

  var blob =
    obtenirLogoClientBusinessPlan_(
      data || {}
    );

  if (!blob) {
    return null;
  }

  var image =
    paragraph.appendInlineImage(
      blob
    );

  var originalWidth =
    image.getWidth();

  var originalHeight =
    image.getHeight();

  var targetWidth =
    Math.max(
      32,
      Math.min(
        150,
        Number(width || 96)
      )
    );

  var targetHeight =
    targetWidth;

  if (
    originalWidth > 0 &&
    originalHeight > 0
  ) {
    targetHeight =
      Math.round(
        targetWidth *
        originalHeight /
        originalWidth
      );
  }

  image.setWidth(
    targetWidth
  );

  image.setHeight(
    targetHeight
  );

  return image;
}


function AG24_BP_V2_addHeaderFooter_(
  document,
  model,
  data,
  theme
) {
  var header =
    document.addHeader();

  header.clear();

  var headerTable =
    header.appendTable([
      ["", ""]
    ]);

  headerTable
    .setBorderColor(
      theme.white
    )
    .setBorderWidth(0);

  var logoCell =
    headerTable.getCell(
      0,
      0
    );

  var labelCell =
    headerTable.getCell(
      0,
      1
    );

  var logoParagraph =
    logoCell
      .getChild(0)
      .asParagraph();

  AG24_BP_V2_insertClientLogo_(
    logoParagraph,
    data,
    38
  );

  var labelParagraph =
    labelCell
      .getChild(0)
      .asParagraph();

  labelParagraph.setText(
    "BUSINESS PLAN"
  );

  labelParagraph
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    )
    .setForegroundColor(
      theme.primary
    )
    .setBold(true)
    .setFontFamily(
      theme.headingFont
    )
    .setFontSize(8)
    .setSpacingAfter(1);

  var projectParagraph =
    labelCell.appendParagraph(
      model.project.name
    );

  projectParagraph
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    )
    .setForegroundColor(
      theme.muted
    )
    .setFontFamily(
      theme.bodyFont
    )
    .setFontSize(7)
    .setSpacingAfter(0);

  headerTable.setColumnWidth(
    0,
    90
  );

  headerTable.setColumnWidth(
    1,
    390
  );

  var footer =
    document.addFooter();

  footer.clear();

  var left =
    model.project.slogan ||
    model.project.name;

  var footerTable =
    footer.appendTable([
      [
        left,
        "Confidentiel • " +
        formaterDateLongue(
          new Date()
        )
      ]
    ]);

  footerTable
    .setBorderColor(
      theme.white
    )
    .setBorderWidth(0);

  var footerLeft =
    footerTable.getCell(
      0,
      0
    );

  var footerRight =
    footerTable.getCell(
      0,
      1
    );

  AG24_BP_V2_styleCellText_(
    footerLeft,
    theme,
    {
      size: 7,
      bold: true,
      color: theme.primary
    }
  );

  AG24_BP_V2_styleCellText_(
    footerRight,
    theme,
    {
      size: 7,
      color: theme.muted
    }
  );

  footerRight
    .getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    );

  footerTable.setColumnWidth(
    0,
    280
  );

  footerTable.setColumnWidth(
    1,
    200
  );
}


function AG24_BP_V2_addAccentBar_(
  body,
  theme
) {
  var table =
    body.appendTable([
      ["", ""]
    ]);

  table
    .setBorderColor(
      theme.white
    )
    .setBorderWidth(0);

  table
    .getCell(0, 0)
    .setBackgroundColor(
      theme.primary
    );

  table
    .getCell(0, 1)
    .setBackgroundColor(
      theme.accent
    );

  table.setColumnWidth(
    0,
    410
  );

  table.setColumnWidth(
    1,
    70
  );

  for (
    var index = 0;
    index < 2;
    index++
  ) {
    table
      .getCell(0, index)
      .getChild(0)
      .asParagraph()
      .setFontSize(1)
      .setSpacingBefore(1)
      .setSpacingAfter(1);
  }

  return table;
}


function AG24_BP_V2_addCover_(
  body,
  model,
  data,
  theme
) {
  AG24_BP_V2_addAccentBar_(
    body,
    theme
  );

  body
    .appendParagraph("")
    .setSpacingAfter(28);

  var logoParagraph =
    body.appendParagraph("");

  logoParagraph.setAlignment(
    DocumentApp.HorizontalAlignment.LEFT
  );

  AG24_BP_V2_insertClientLogo_(
    logoParagraph,
    data,
    118
  );

  var type =
    body.appendParagraph(
      "BUSINESS PLAN"
    );

  type
    .setForegroundColor(
      theme.accent
    )
    .setBold(true)
    .setFontFamily(
      theme.headingFont
    )
    .setFontSize(10)
    .setSpacingBefore(28)
    .setSpacingAfter(12);

  var title =
    body.appendParagraph(
      model.project.name
    );

  title
    .setForegroundColor(
      theme.primaryDark
    )
    .setBold(true)
    .setFontFamily(
      theme.headingFont
    )
    .setFontSize(30)
    .setLineSpacing(1.05)
    .setSpacingAfter(12);

  if (
    model.project.slogan
  ) {
    var slogan =
      body.appendParagraph(
        model.project.slogan
      );

    slogan
      .setForegroundColor(
        theme.muted
      )
      .setFontFamily(
        theme.bodyFont
      )
      .setFontSize(12)
      .setLineSpacing(1.2)
      .setSpacingAfter(30);
  } else {
    body
      .appendParagraph("")
      .setSpacingAfter(18);
  }

  var facts = [
    [
      "PORTEUR",
      model.project.promoter
    ],
    [
      "PAYS / ZONE",
      model.project.country
    ],
    [
      "SECTEUR",
      model.project.sector
    ],
    [
      "STADE",
      model.project.stage
    ]
  ].filter(
    function(item) {
      return Boolean(
        AG24_BP_V2_text_(
          item[1]
        )
      );
    }
  );

  if (facts.length) {
    var rows = [];

    facts.forEach(
      function(item) {
        rows.push([
          item[0],
          item[1]
        ]);
      }
    );

    var factsTable =
      body.appendTable(
        rows
      );

    factsTable
      .setBorderColor(
        theme.border
      )
      .setBorderWidth(1);

    for (
      var rowIndex = 0;
      rowIndex <
      factsTable.getNumRows();
      rowIndex++
    ) {
      var labelCell =
        factsTable.getCell(
          rowIndex,
          0
        );

      var valueCell =
        factsTable.getCell(
          rowIndex,
          1
        );

      labelCell.setBackgroundColor(
        theme.primary
      );

      valueCell.setBackgroundColor(
        rowIndex % 2 === 0
          ? theme.soft
          : theme.softAlt
      );

      AG24_BP_V2_styleCellText_(
        labelCell,
        theme,
        {
          color: theme.white,
          bold: true,
          size: 8
        }
      );

      AG24_BP_V2_styleCellText_(
        valueCell,
        theme,
        {
          color: theme.text,
          size: 9.5
        }
      );
    }

    factsTable.setColumnWidth(
      0,
      130
    );

    factsTable.setColumnWidth(
      1,
      350
    );
  }

  body
    .appendParagraph("")
    .setSpacingAfter(34);

  var date =
    body.appendParagraph(
      formaterDateLongue(
        new Date()
      )
    );

  date
    .setForegroundColor(
      theme.muted
    )
    .setFontFamily(
      theme.bodyFont
    )
    .setFontSize(8.5)
    .setSpacingAfter(10);

  AG24_BP_V2_addAccentBar_(
    body,
    theme
  );

  body.appendPageBreak();
}


function AG24_BP_V2_addSectionTitle_(
  body,
  number,
  title,
  theme
) {
  var table =
    body.appendTable([
      [
        number || "",
        title || ""
      ]
    ]);

  table
    .setBorderColor(
      theme.white
    )
    .setBorderWidth(0);

  var numberCell =
    table.getCell(
      0,
      0
    );

  var titleCell =
    table.getCell(
      0,
      1
    );

  numberCell.setBackgroundColor(
    theme.primary
  );

  titleCell.setBackgroundColor(
    theme.soft
  );

  AG24_BP_V2_styleCellText_(
    numberCell,
    theme,
    {
      color: theme.white,
      bold: true,
      size: 9
    }
  );

  AG24_BP_V2_styleCellText_(
    titleCell,
    theme,
    {
      color: theme.primaryDark,
      bold: true,
      size: 16,
      font: theme.headingFont
    }
  );

  numberCell
    .getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setSpacingBefore(8)
    .setSpacingAfter(8);

  titleCell
    .getChild(0)
    .asParagraph()
    .setSpacingBefore(8)
    .setSpacingAfter(8)
    .setHeading(
      DocumentApp.ParagraphHeading.HEADING1
    );

  table.setColumnWidth(
    0,
    52
  );

  table.setColumnWidth(
    1,
    428
  );

  body
    .appendParagraph("")
    .setSpacingAfter(8);
}


function AG24_BP_V2_addParagraphs_(
  body,
  text,
  theme
) {
  var clean =
    AG24_BP_V2_text_(
      String(text || "")
        .replace(/\r/g, "")
        .replace(/\n\s*\n/g, "\n\n")
    );

  if (!clean) {
    return;
  }

  var source =
    String(text || "")
      .replace(/\r/g, "")
      .trim();

  var paragraphs =
    source.split(
      /\n\s*\n/
    );

  if (!paragraphs.length) {
    paragraphs = [
      source
    ];
  }

  paragraphs.forEach(
    function(paragraphText) {
      var value =
        AG24_BP_V2_text_(
          paragraphText
        );

      if (!value) {
        return;
      }

      body
        .appendParagraph(
          value
        )
        .setForegroundColor(
          theme.text
        )
        .setFontFamily(
          theme.bodyFont
        )
        .setFontSize(10.2)
        .setLineSpacing(1.32)
        .setSpacingAfter(10)
        .setAlignment(
          DocumentApp.HorizontalAlignment.JUSTIFY
        );
    }
  );
}


function AG24_BP_V2_addCards_(
  body,
  cards,
  theme
) {
  var usable =
    (cards || [])
      .filter(
        function(card) {
          return (
            card &&
            AG24_BP_V2_text_(
              card[0]
            ) &&
            AG24_BP_V2_text_(
              card[1]
            )
          );
        }
      );

  if (!usable.length) {
    return;
  }

  for (
    var offset = 0;
    offset < usable.length;
    offset += 2
  ) {
    var pair =
      usable.slice(
        offset,
        offset + 2
      );

    var row =
      pair.length === 2
        ? [["", ""]]
        : [[""]];

    var table =
      body.appendTable(
        row
      );

    table
      .setBorderColor(
        theme.border
      )
      .setBorderWidth(1);

    pair.forEach(
      function(card, index) {
        var cell =
          table.getCell(
            0,
            index
          );

        cell.setBackgroundColor(
          index % 2 === 0
            ? theme.soft
            : theme.softAlt
        );

        var title =
          cell
            .getChild(0)
            .asParagraph();

        title.setText(
          card[0]
        );

        title
          .setForegroundColor(
            theme.primary
          )
          .setBold(true)
          .setFontFamily(
            theme.headingFont
          )
          .setFontSize(8)
          .setSpacingBefore(7)
          .setSpacingAfter(5);

        cell
          .appendParagraph(
            card[1]
          )
          .setForegroundColor(
            theme.text
          )
          .setFontFamily(
            theme.bodyFont
          )
          .setFontSize(9)
          .setLineSpacing(1.2)
          .setSpacingAfter(7);
      }
    );

    if (
      pair.length === 2
    ) {
      table.setColumnWidth(
        0,
        238
      );

      table.setColumnWidth(
        1,
        238
      );
    } else {
      table.setColumnWidth(
        0,
        476
      );
    }

    body
      .appendParagraph("")
      .setSpacingAfter(6);
  }
}


function AG24_BP_V2_addFactsGrid_(
  body,
  facts,
  theme
) {
  var usable =
    (facts || [])
      .filter(
        function(item) {
          return (
            item &&
            AG24_BP_V2_text_(
              item[0]
            ) &&
            AG24_BP_V2_text_(
              item[1]
            )
          );
        }
      );

  if (!usable.length) {
    return;
  }

  var rows =
    usable.map(
      function(item) {
        return [
          item[0],
          item[1]
        ];
      }
    );

  var table =
    body.appendTable(
      rows
    );

  table
    .setBorderColor(
      theme.border
    )
    .setBorderWidth(1);

  for (
    var rowIndex = 0;
    rowIndex < table.getNumRows();
    rowIndex++
  ) {
    var label =
      table.getCell(
        rowIndex,
        0
      );

    var value =
      table.getCell(
        rowIndex,
        1
      );

    label.setBackgroundColor(
      theme.soft
    );

    value.setBackgroundColor(
      theme.white
    );

    AG24_BP_V2_styleCellText_(
      label,
      theme,
      {
        bold: true,
        color: theme.primary,
        size: 8.5
      }
    );

    AG24_BP_V2_styleCellText_(
      value,
      theme,
      {
        color: theme.text,
        size: 9
      }
    );
  }

  table.setColumnWidth(
    0,
    140
  );

  table.setColumnWidth(
    1,
    340
  );

  body
    .appendParagraph("")
    .setSpacingAfter(8);
}


function AG24_BP_V2_addSnapshot_(
  body,
  model,
  theme
) {
  AG24_BP_V2_addSectionTitle_(
    body,
    "00",
    "Executive Snapshot",
    theme
  );

  var subtitle =
    body.appendParagraph(
      "Le projet en une page"
    );

  subtitle
    .setForegroundColor(
      theme.muted
    )
    .setFontFamily(
      theme.bodyFont
    )
    .setFontSize(9)
    .setSpacingAfter(12);

  AG24_BP_V2_addFactsGrid_(
    body,
    [
      [
        "Stade",
        model.project.stage
      ],
      [
        "Secteur",
        model.project.sector
      ],
      [
        "Zone",
        model.snapshot.marketArea ||
        model.project.country
      ],
      [
        "Financement",
        model.snapshot.funding
      ]
    ],
    theme
  );

  AG24_BP_V2_addCards_(
    body,
    [
      [
        "PROBLÈME",
        model.snapshot.problem
      ],
      [
        "SOLUTION",
        model.snapshot.solution
      ],
      [
        "PROPOSITION DE VALEUR",
        model.snapshot.valueProposition
      ],
      [
        "MODÈLE ÉCONOMIQUE",
        model.snapshot.revenueModel
      ],
      [
        "CLIENTÈLE CIBLE",
        model.snapshot.targetCustomers
      ],
      [
        "IMPACT",
        model.snapshot.impact
      ]
    ],
    theme
  );

  body.appendPageBreak();
}


function AG24_BP_V2_addSection_(
  body,
  section,
  theme,
  isLast
) {
  AG24_BP_V2_addSectionTitle_(
    body,
    section.number,
    section.title,
    theme
  );

  if (
    section.facts &&
    section.facts.length
  ) {
    AG24_BP_V2_addFactsGrid_(
      body,
      section.facts,
      theme
    );
  }

  if (
    section.narrative
  ) {
    AG24_BP_V2_addParagraphs_(
      body,
      section.narrative,
      theme
    );
  }

  if (
    section.cards &&
    section.cards.length
  ) {
    AG24_BP_V2_addCards_(
      body,
      section.cards,
      theme
    );
  }

  if (!isLast) {
    body.appendPageBreak();
  }
}


function AG24_BP_V2_addClosing_(
  body,
  model,
  data,
  theme
) {
  body.appendPageBreak();

  AG24_BP_V2_addAccentBar_(
    body,
    theme
  );

  body
    .appendParagraph("")
    .setSpacingAfter(28);

  var logo =
    body.appendParagraph("");

  logo.setAlignment(
    DocumentApp.HorizontalAlignment.LEFT
  );

  AG24_BP_V2_insertClientLogo_(
    logo,
    data,
    96
  );

  var name =
    body.appendParagraph(
      model.project.name
    );

  name
    .setForegroundColor(
      theme.primaryDark
    )
    .setBold(true)
    .setFontFamily(
      theme.headingFont
    )
    .setFontSize(26)
    .setSpacingBefore(24)
    .setSpacingAfter(14);

  if (
    model.closing.valueProposition
  ) {
    body
      .appendParagraph(
        model.closing.valueProposition
      )
      .setForegroundColor(
        theme.text
      )
      .setFontFamily(
        theme.bodyFont
      )
      .setFontSize(12)
      .setLineSpacing(1.25)
      .setSpacingAfter(28);
  }

  AG24_BP_V2_addFactsGrid_(
    body,
    [
      [
        "Financement recherché",
        model.closing.funding
      ],
      [
        "Porteur",
        model.closing.promoter
      ],
      [
        "Contact",
        model.closing.email
      ]
    ],
    theme
  );

  body
    .appendParagraph("")
    .setSpacingAfter(28);

  AG24_BP_V2_addAccentBar_(
    body,
    theme
  );
}


function AG24_BP_V2_assertWhiteLabel_(
  document
) {
  var fragments = [];

  var body =
    document.getBody();

  if (body) {
    fragments.push(
      body.getText()
    );
  }

  var header =
    document.getHeader();

  if (header) {
    fragments.push(
      header.getText()
    );
  }

  var footer =
    document.getFooter();

  if (footer) {
    fragments.push(
      footer.getText()
    );
  }

  var text =
    fragments.join("\n")
      .toLowerCase();

  var forbidden = [
    "afrigreen24",
    "afrigreen24.com",
    "powered by afrigreen",
    "généré par afrigreen",
    "genere par afrigreen"
  ];

  var found =
    forbidden.filter(
      function(marker) {
        return (
          text.indexOf(marker) !== -1
        );
      }
    );

  if (found.length) {
    throw new Error(
      "WHITE_LABEL_GATE_FAILED: " +
      found.join(", ")
    );
  }

  return {
    success: true,
    forbiddenFound: []
  };
}


function AG24_BP_V2_renderDocument_(
  document,
  data,
  options
) {
  data = data || {};
  options = options || {};

  var theme =
    AG24_BP_V2_resolveTheme_(
      options.themeId ||
      data.documentTheme
    );

  var model =
    AG24_BP_V2_buildSemanticModel_(
      data
    );

  var body =
    document.getBody();

  AG24_BP_V2_configureDocument_(
    body
  );

  AG24_BP_V2_addHeaderFooter_(
    document,
    model,
    data,
    theme
  );

  AG24_BP_V2_addCover_(
    body,
    model,
    data,
    theme
  );

  AG24_BP_V2_addSnapshot_(
    body,
    model,
    theme
  );

  model.sections.forEach(
    function(section, index) {
      AG24_BP_V2_addSection_(
        body,
        section,
        theme,
        index ===
        model.sections.length - 1
      );
    }
  );

  AG24_BP_V2_addClosing_(
    body,
    model,
    data,
    theme
  );

  AG24_BP_V2_assertWhiteLabel_(
    document
  );

  return {
    success: true,
    version:
      AG24_BP_DESIGN_V2.VERSION,
    themeId:
      theme.id,
    themeLabel:
      theme.label,
    pageModelCount:
      2 +
      model.sections.length +
      1,
    whiteLabel:
      true
  };
}


function AG24_BP_V2_getThemeCatalog_() {
  return AG24_BP_DESIGN_V2.ALLOWED_THEMES
    .map(
      function(id) {
        var theme =
          AG24_BP_THEMES_V2[id];

        return {
          id: theme.id,
          label: theme.label,
          primary: theme.primary,
          secondary: theme.secondary,
          accent: theme.accent
        };
      }
    );
}
