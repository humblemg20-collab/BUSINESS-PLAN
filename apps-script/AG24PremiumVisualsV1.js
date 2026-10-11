/**
 * AfriGreen24 — Premium Visuals V1
 *
 * Deterministic visual components for market sizing, use-of-funds allocation
 * and roadmap. No AI call. No value invention.
 */
var AG24_PREMIUM_VISUALS_V1 = Object.freeze({
  VERSION:"1.0.0",
  MAX_ALLOCATION_ITEMS:8
});

function AG24_PREMIUM_VISUALS_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_VISUALS_number_(value) {
  if (value === null || value === undefined || value === "") return null;
  var clean = typeof value === "string"
    ? value.replace(/\s/g,"").replace(/[^0-9,.-]/g,"").replace(",",".")
    : value;
  var number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function AG24_PREMIUM_VISUALS_get_(obj,path) {
  var parts = String(path || "").split(".");
  var current = obj;
  for (var i=0; i<parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    current = current[parts[i]];
  }
  return current;
}

function AG24_PREMIUM_VISUALS_marketModel_(data, projectIntelligence) {
  data = data || {};

  var tam = projectIntelligence
    ? AG24_PREMIUM_VISUALS_get_(projectIntelligence,"market.tam.value")
    : (data.tam !== undefined ? data.tam : data.tamValue);

  var sam = projectIntelligence
    ? AG24_PREMIUM_VISUALS_get_(projectIntelligence,"market.sam.value")
    : (data.sam !== undefined ? data.sam : data.samValue);

  var som = projectIntelligence
    ? AG24_PREMIUM_VISUALS_get_(projectIntelligence,"market.som.value")
    : (data.som !== undefined ? data.som : data.somValue);

  tam = AG24_PREMIUM_VISUALS_number_(tam);
  sam = AG24_PREMIUM_VISUALS_number_(sam);
  som = AG24_PREMIUM_VISUALS_number_(som);

  var values = [
    {id:"TAM",label:"TAM",value:tam},
    {id:"SAM",label:"SAM",value:sam},
    {id:"SOM",label:"SOM",value:som}
  ].filter(function(item){return item.value !== null;});

  var consistent = true;
  var inconsistency = "";

  if (tam !== null && sam !== null && sam > tam) {
    consistent = false;
    inconsistency = "SAM_GT_TAM";
  }

  if (
    consistent &&
    sam !== null &&
    som !== null &&
    som > sam
  ) {
    consistent = false;
    inconsistency = "SOM_GT_SAM";
  }

  return {
    success:true,
    version:AG24_PREMIUM_VISUALS_V1.VERSION,
    values:values,
    consistent:consistent,
    inconsistency:inconsistency
  };
}

function AG24_PREMIUM_VISUALS_renderMarket_(body, data, projectIntelligence, theme) {
  var market = AG24_PREMIUM_VISUALS_marketModel_(
    data,
    projectIntelligence
  );

  if (market.values.length < 2) {
    return {
      success:true,
      rendered:false,
      reason:"INSUFFICIENT_MARKET_VALUES"
    };
  }

  if (!market.consistent) {
    AG24_BP_V2_addCallout_(
      body,
      "Marché à vérifier",
      "Les valeurs TAM / SAM / SOM sont incohérentes et ne sont pas représentées graphiquement tant que la hiérarchie SOM ≤ SAM ≤ TAM n’est pas respectée.",
      theme
    );

    return {
      success:true,
      rendered:false,
      reason:market.inconsistency
    };
  }

  var table = Charts.newDataTable()
    .addColumn(Charts.ColumnType.STRING,"Segment")
    .addColumn(Charts.ColumnType.NUMBER,"Valeur");

  market.values.forEach(function(item){
    table.addRow([item.label,item.value]);
  });

  var chart = Charts.newBarChart()
    .setDataTable(table.build())
    .setDimensions(620,260)
    .setTitle("TAM / SAM / SOM")
    .setLegendPosition(Charts.Position.NONE)
    .build();

  var paragraph = body.appendParagraph("");
  paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  paragraph.appendInlineImage(
    chart.getAs("image/png")
  ).setWidth(430);

  body.appendParagraph("").setSpacingAfter(8);

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_MARKET_VISUAL_RENDERED",
        {
          version:market.version,
          valueIds:market.values.map(function(item){return item.id;})
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    valueCount:market.values.length
  };
}

function AG24_PREMIUM_VISUALS_allocationModel_(data, projectIntelligence) {
  data = data || {};

  var raw =
    data.useOfFundsAllocation ||
    data.fundingAllocation ||
    (
      projectIntelligence &&
      AG24_PREMIUM_VISUALS_get_(projectIntelligence,"funding.allocation")
    ) ||
    [];

  var items = [];

  if (Array.isArray(raw)) {
    raw.forEach(function(item) {
      if (!item || typeof item !== "object") return;

      var label = AG24_PREMIUM_VISUALS_text_(
        item.label || item.category || item.name
      );
      var value = AG24_PREMIUM_VISUALS_number_(
        item.value !== undefined ? item.value :
        item.amount !== undefined ? item.amount :
        item.percentage
      );

      if (label && value !== null && value >= 0) {
        items.push({
          label:label,
          value:value
        });
      }
    });
  } else if (raw && typeof raw === "object") {
    Object.keys(raw).forEach(function(key) {
      var value = AG24_PREMIUM_VISUALS_number_(raw[key]);
      if (value !== null && value >= 0) {
        items.push({
          label:AG24_PREMIUM_VISUALS_text_(key),
          value:value
        });
      }
    });
  }

  items = items
    .filter(function(item){return item.value > 0;})
    .slice(0,AG24_PREMIUM_VISUALS_V1.MAX_ALLOCATION_ITEMS);

  return {
    success:true,
    version:AG24_PREMIUM_VISUALS_V1.VERSION,
    items:items,
    total:items.reduce(function(sum,item){return sum + item.value;},0)
  };
}

function AG24_PREMIUM_VISUALS_renderAllocation_(body, data, projectIntelligence, theme) {
  var allocation = AG24_PREMIUM_VISUALS_allocationModel_(
    data,
    projectIntelligence
  );

  if (allocation.items.length < 2 || allocation.total <= 0) {
    return {
      success:true,
      rendered:false,
      reason:"STRUCTURED_ALLOCATION_UNAVAILABLE"
    };
  }

  var table = Charts.newDataTable()
    .addColumn(Charts.ColumnType.STRING,"Usage")
    .addColumn(Charts.ColumnType.NUMBER,"Allocation");

  allocation.items.forEach(function(item) {
    table.addRow([item.label,item.value]);
  });

  var chart = Charts.newPieChart()
    .setDataTable(table.build())
    .setDimensions(620,300)
    .setTitle("Utilisation des fonds")
    .setLegendPosition(Charts.Position.RIGHT)
    .build();

  var paragraph = body.appendParagraph("");
  paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  paragraph.appendInlineImage(
    chart.getAs("image/png")
  ).setWidth(430);

  body.appendParagraph("").setSpacingAfter(8);

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_(
        "PREMIUM_FUNDING_ALLOCATION_VISUAL_RENDERED",
        {
          version:allocation.version,
          itemCount:allocation.items.length,
          total:allocation.total
        }
      );
    } catch (auditError) {}
  }

  return {
    success:true,
    rendered:true,
    itemCount:allocation.items.length,
    total:allocation.total
  };
}

function AG24_PREMIUM_VISUALS_renderTimeline_(body, roadmap, theme) {
  roadmap = roadmap || {};

  var items = [
    ["AUJOURD’HUI",roadmap.now],
    ["6 MOIS",roadmap.sixMonths],
    ["12 MOIS",roadmap.twelveMonths],
    ["24 MOIS",roadmap.twentyFourMonths]
  ].filter(function(item){
    return AG24_PREMIUM_VISUALS_text_(item[1]);
  });

  if (items.length < 2) {
    return {
      success:true,
      rendered:false,
      reason:"INSUFFICIENT_TIMELINE_MILESTONES"
    };
  }

  var row = [];
  items.forEach(function(item){
    row.push(
      item[0] + "\n" +
      AG24_PREMIUM_VISUALS_text_(item[1])
    );
  });

  var table = body.appendTable([row]);
  table.setBorderWidth(0);

  for (var col=0; col<row.length; col++) {
    var cell = table.getCell(0,col);
    cell.setBackgroundColor(
      col % 2 === 0 ? theme.soft : theme.softAlt
    );

    cell.getChild(0).asParagraph()
      .setForegroundColor(theme.text)
      .setFontFamily(theme.bodyFont)
      .setFontSize(8)
      .setBold(false)
      .setSpacingBefore(7)
      .setSpacingAfter(7);
  }

  var width = Math.floor(476 / row.length);
  for (var index=0; index<row.length; index++) {
    table.setColumnWidth(index,width);
  }

  body.appendParagraph("").setSpacingAfter(8);

  return {
    success:true,
    rendered:true,
    milestoneCount:items.length
  };
}

function AG24_PREMIUM_VISUALS_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success:false,
    version:AG24_PREMIUM_VISUALS_V1.VERSION,
    marketRendered:false,
    inconsistentMarketBlocked:false,
    allocationRendered:false,
    timelineRendered:false,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var consistentMarket =
      AG24_PREMIUM_VISUALS_marketModel_(
        {tam:10000000,sam:3000000,som:600000},
        null
      );

    var inconsistentMarket =
      AG24_PREMIUM_VISUALS_marketModel_(
        {tam:1000000,sam:3000000,som:600000},
        null
      );

    report.inconsistentMarketBlocked =
      inconsistentMarket.consistent === false &&
      inconsistentMarket.inconsistency === "SAM_GT_TAM";

    var doc = DocumentApp.create(
      "AG24 Premium Visuals Test " + String(new Date().getTime())
    );
    documentId = doc.getId();

    var body = doc.getBody();
    var theme = AG24_BP_V2_resolveTheme_("executive_premium");

    var marketResult =
      AG24_PREMIUM_VISUALS_renderMarket_(
        body,
        {tam:10000000,sam:3000000,som:600000},
        null,
        theme
      );

    report.marketRendered =
      Boolean(marketResult && marketResult.rendered) &&
      consistentMarket.consistent === true;

    var allocationResult =
      AG24_PREMIUM_VISUALS_renderAllocation_(
        body,
        {
          useOfFundsAllocation:[
            {label:"Équipements",value:80000},
            {label:"Commercial",value:30000},
            {label:"Fonds de roulement",value:40000}
          ]
        },
        null,
        theme
      );

    report.allocationRendered =
      Boolean(allocationResult && allocationResult.rendered);

    var timelineResult =
      AG24_PREMIUM_VISUALS_renderTimeline_(
        body,
        {
          now:"Pilote actif",
          sixMonths:"30 clients",
          twelveMonths:"Expansion nationale",
          twentyFourMonths:"Deuxième marché"
        },
        theme
      );

    report.timelineRendered =
      Boolean(timelineResult && timelineResult.rendered);

    doc.saveAndClose();

    report.success =
      report.marketRendered === true &&
      report.inconsistentMarketBlocked === true &&
      report.allocationRendered === true &&
      report.timelineRendered === true;

    if (!report.success) {
      report.failureCode = "PREMIUM_VISUALS_CONTRACT_FAILED";
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
      } catch (cleanupError) {}
    }

    report.success = report.success && report.cleanupSuccess;
    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
