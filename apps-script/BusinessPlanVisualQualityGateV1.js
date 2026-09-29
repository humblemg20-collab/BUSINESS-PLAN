/**
 * ============================================================
 * BUSINESS PLAN PDF VISUAL QUALITY GATE V1
 * ============================================================
 *
 * Deterministic quality controls around the 15-page document master.
 *
 * PRE-RENDER:
 * - semantic page density;
 * - oversized text blocks;
 * - sparse-page warnings;
 * - deterministic text layout profile.
 *
 * POST-PDF:
 * - PDF signature;
 * - physical page count;
 * - expected 15-page contract;
 * - minimum artifact size.
 *
 * No external API, no AI call, no OCR.
 */

var AG24_BP_VISUAL_GATE_V1 = Object.freeze({
  VERSION: "1.0.0",
  EXPECTED_PAGE_COUNT: 15,
  MIN_PDF_BYTES: 5000,
  MAX_SINGLE_BLOCK_CHARS: 2200,
  PAGE_RULES: Object.freeze({
    cover: Object.freeze({
      maxChars: 900,
      sparseChars: 20
    }),
    snapshot: Object.freeze({
      maxChars: 2400,
      sparseChars: 80
    }),
    section: Object.freeze({
      maxChars: 3600,
      sparseChars: 90
    }),
    funding: Object.freeze({
      maxChars: 3000,
      sparseChars: 80
    }),
    impact: Object.freeze({
      maxChars: 3200,
      sparseChars: 70
    }),
    risks: Object.freeze({
      maxChars: 2200,
      sparseChars: 40
    }),
    roadmap: Object.freeze({
      maxChars: 1800,
      sparseChars: 35
    }),
    closing: Object.freeze({
      maxChars: 1200,
      sparseChars: 20
    })
  })
});


function AG24_BP_VISUAL_text_(value) {
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


function AG24_BP_VISUAL_collectStrings_(
  value,
  output
) {
  output = output || [];

  if (
    value === null ||
    value === undefined
  ) {
    return output;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    var clean =
      AG24_BP_VISUAL_text_(
        value
      );

    if (clean) {
      output.push(clean);
    }

    return output;
  }

  if (Array.isArray(value)) {
    value.forEach(
      function(item) {
        AG24_BP_VISUAL_collectStrings_(
          item,
          output
        );
      }
    );

    return output;
  }

  if (
    typeof value === "object"
  ) {
    Object.keys(value)
      .sort()
      .forEach(
        function(key) {
          AG24_BP_VISUAL_collectStrings_(
            value[key],
            output
          );
        }
      );
  }

  return output;
}


function AG24_BP_VISUAL_measurePayload_(
  payload
) {
  var blocks =
    AG24_BP_VISUAL_collectStrings_(
      payload,
      []
    );

  var totalChars =
    blocks.reduce(
      function(sum, block) {
        return (
          sum +
          block.length
        );
      },
      0
    );

  var maxBlockChars =
    blocks.reduce(
      function(maximum, block) {
        return Math.max(
          maximum,
          block.length
        );
      },
      0
    );

  return {
    blockCount:
      blocks.length,
    totalChars:
      totalChars,
    maxBlockChars:
      maxBlockChars
  };
}


function AG24_BP_VISUAL_pageRule_(
  pageType
) {
  var rules =
    AG24_BP_VISUAL_GATE_V1
      .PAGE_RULES;

  return (
    rules[pageType] ||
    rules.section
  );
}


function AG24_BP_VISUAL_buildPagePayloads_(
  model
) {
  model = model || {};

  var pages = [
    {
      pageNumber: 1,
      pageId: "cover",
      pageType: "cover",
      payload: {
        project:
          model.project || {}
      }
    },
    {
      pageNumber: 2,
      pageId: "executive-snapshot",
      pageType: "snapshot",
      payload: {
        project:
          model.project || {},
        snapshot:
          model.snapshot || {}
      }
    }
  ];

  var sections =
    Array.isArray(
      model.sections
    )
      ? model.sections
      : [];

  sections.forEach(
    function(section, index) {
      var type =
        section &&
        section.id === "funding"
          ? "funding"
          : (
              section &&
              section.id === "impact"
                ? "impact"
                : "section"
            );

      pages.push({
        pageNumber:
          index + 3,
        pageId:
          section &&
          section.id
            ? section.id
            : (
                "section-" +
                String(
                  index + 1
                )
              ),
        pageType:
          type,
        payload:
          section || {}
      });
    }
  );

  pages.push({
    pageNumber: 13,
    pageId: "risks",
    pageType: "risks",
    payload:
      model.risks || {}
  });

  pages.push({
    pageNumber: 14,
    pageId: "roadmap",
    pageType: "roadmap",
    payload:
      model.roadmap || {}
  });

  pages.push({
    pageNumber: 15,
    pageId: "closing",
    pageType: "closing",
    payload: {
      project:
        model.project || {},
      closing:
        model.closing || {}
    }
  });

  return pages;
}


function AG24_BP_VISUAL_densityClass_(
  ratio
) {
  ratio =
    Number(
      ratio || 0
    );

  if (ratio >= 0.9) {
    return "dense";
  }

  if (ratio >= 0.68) {
    return "compact";
  }

  if (ratio >= 0.42) {
    return "balanced";
  }

  return "light";
}


function AG24_BP_VISUAL_preflight_(
  model
) {
  var pagePayloads =
    AG24_BP_VISUAL_buildPagePayloads_(
      model
    );

  var errors = [];
  var warnings = [];
  var pages = [];

  pagePayloads.forEach(
    function(page) {
      var rule =
        AG24_BP_VISUAL_pageRule_(
          page.pageType
        );

      var metrics =
        AG24_BP_VISUAL_measurePayload_(
          page.payload
        );

      var ratio =
        rule.maxChars > 0
          ? (
              metrics.totalChars /
              rule.maxChars
            )
          : 0;

      var pageReport = {
        pageNumber:
          page.pageNumber,
        pageId:
          page.pageId,
        pageType:
          page.pageType,
        totalChars:
          metrics.totalChars,
        maxChars:
          rule.maxChars,
        densityRatio:
          Number(
            ratio.toFixed(3)
          ),
        densityClass:
          AG24_BP_VISUAL_densityClass_(
            ratio
          ),
        maxBlockChars:
          metrics.maxBlockChars,
        blockCount:
          metrics.blockCount,
        sparse:
          metrics.totalChars <
          rule.sparseChars,
        overCapacity:
          metrics.totalChars >
          rule.maxChars,
        oversizedBlock:
          metrics.maxBlockChars >
          AG24_BP_VISUAL_GATE_V1
            .MAX_SINGLE_BLOCK_CHARS
      };

      pages.push(
        pageReport
      );

      if (
        pageReport.overCapacity
      ) {
        errors.push(
          "PAGE_" +
          String(
            page.pageNumber
          ) +
          "_OVER_CAPACITY"
        );
      }

      if (
        pageReport.oversizedBlock
      ) {
        errors.push(
          "PAGE_" +
          String(
            page.pageNumber
          ) +
          "_OVERSIZED_BLOCK"
        );
      }

      if (
        pageReport.sparse
      ) {
        warnings.push(
          "PAGE_" +
          String(
            page.pageNumber
          ) +
          "_SPARSE"
        );
      }
    }
  );

  if (
    pagePayloads.length !==
    AG24_BP_VISUAL_GATE_V1
      .EXPECTED_PAGE_COUNT
  ) {
    errors.push(
      "SEMANTIC_PAGE_COUNT_" +
      String(
        pagePayloads.length
      )
    );
  }

  var maxDensityRatio =
    pages.reduce(
      function(maximum, page) {
        return Math.max(
          maximum,
          page.densityRatio
        );
      },
      0
    );

  var sparsePageCount =
    pages.filter(
      function(page) {
        return page.sparse;
      }
    ).length;

  return {
    success:
      errors.length === 0,
    version:
      AG24_BP_VISUAL_GATE_V1
        .VERSION,
    classification:
      errors.length
        ? "PRE_RENDER_FAIL"
        : (
            warnings.length
              ? "PRE_RENDER_PASS_WITH_WARNINGS"
              : "PRE_RENDER_PASS"
          ),
    expectedPageCount:
      AG24_BP_VISUAL_GATE_V1
        .EXPECTED_PAGE_COUNT,
    semanticPageCount:
      pagePayloads.length,
    maxDensityRatio:
      Number(
        maxDensityRatio
          .toFixed(3)
      ),
    sparsePageCount:
      sparsePageCount,
    errors:
      errors,
    warnings:
      warnings,
    pages:
      pages
  };
}


function AG24_BP_VISUAL_assertPreflight_(
  model
) {
  var report =
    AG24_BP_VISUAL_preflight_(
      model
    );

  if (!report.success) {
    throw new Error(
      "VISUAL_PREFLIGHT_FAILED: " +
      report.errors.join(",")
    );
  }

  return report;
}


function AG24_BP_VISUAL_getTextLayout_(
  text
) {
  var length =
    AG24_BP_VISUAL_text_(
      text
    ).length;

  if (length > 1800) {
    return {
      profile: "dense",
      fontSize: 9.2,
      lineSpacing: 1.16,
      spacingAfter: 7
    };
  }

  if (length > 1200) {
    return {
      profile: "compact",
      fontSize: 9.5,
      lineSpacing: 1.2,
      spacingAfter: 8
    };
  }

  if (length > 700) {
    return {
      profile: "balanced",
      fontSize: 9.8,
      lineSpacing: 1.25,
      spacingAfter: 9
    };
  }

  return {
    profile: "comfortable",
    fontSize: 10.2,
    lineSpacing: 1.32,
    spacingAfter: 10
  };
}


function AG24_BP_VISUAL_pdfText_(
  blob
) {
  if (
    !blob ||
    typeof blob.getBytes !==
      "function"
  ) {
    return "";
  }

  try {
    return blob.getDataAsString(
      "ISO-8859-1"
    );
  } catch (error) {
    try {
      var bytes =
        blob.getBytes();

      var chunks = [];

      for (
        var index = 0;
        index < bytes.length;
        index += 8192
      ) {
        var end =
          Math.min(
            bytes.length,
            index + 8192
          );

        var part = "";

        for (
          var cursor = index;
          cursor < end;
          cursor++
        ) {
          var value =
            bytes[cursor];

          if (value < 0) {
            value += 256;
          }

          part +=
            String.fromCharCode(
              value
            );
        }

        chunks.push(
          part
        );
      }

      return chunks.join("");
    } catch (
      fallbackError
    ) {
      return "";
    }
  }
}


function AG24_BP_VISUAL_countPdfPages_(
  blob
) {
  var pdfText =
    AG24_BP_VISUAL_pdfText_(
      blob
    );

  if (!pdfText) {
    return {
      pageCount: 0,
      method: "unreadable",
      confidence: "none"
    };
  }

  var directMatches =
    pdfText.match(
      /\/Type\s*\/Page(?!s)\b/g
    ) || [];

  if (
    directMatches.length > 0
  ) {
    return {
      pageCount:
        directMatches.length,
      method:
        "page_objects",
      confidence:
        "high"
    };
  }

  var counts = [];
  var expression =
    /\/Type\s*\/Pages\b[\s\S]{0,800}?\/Count\s+(\d+)/g;

  var match;

  while (
    (
      match =
        expression.exec(
          pdfText
        )
    )
  ) {
    counts.push(
      Number(
        match[1] || 0
      )
    );
  }

  var reverseExpression =
    /\/Count\s+(\d+)[\s\S]{0,800}?\/Type\s*\/Pages\b/g;

  while (
    (
      match =
        reverseExpression.exec(
          pdfText
        )
    )
  ) {
    counts.push(
      Number(
        match[1] || 0
      )
    );
  }

  counts =
    counts.filter(
      function(value) {
        return (
          Number.isFinite(
            value
          ) &&
          value > 0 &&
          value < 1000
        );
      }
    );

  if (counts.length) {
    return {
      pageCount:
        Math.max.apply(
          Math,
          counts
        ),
      method:
        "page_tree_count",
      confidence:
        "medium"
    };
  }

  return {
    pageCount: 0,
    method: "unreadable",
    confidence: "none"
  };
}


function AG24_BP_VISUAL_postflightPdf_(
  blob,
  options
) {
  options =
    options || {};

  var expected =
    Number(
      options.expectedPageCount ||
      AG24_BP_VISUAL_GATE_V1
        .EXPECTED_PAGE_COUNT
    );

  var bytes =
    blob &&
    typeof blob.getBytes ===
      "function"
      ? blob.getBytes()
      : [];

  var byteCount =
    bytes.length;

  var pdfText =
    AG24_BP_VISUAL_pdfText_(
      blob
    );

  var signatureValid =
    pdfText.indexOf(
      "%PDF-"
    ) === 0;

  var pageInfo =
    AG24_BP_VISUAL_countPdfPages_(
      blob
    );

  var errors = [];

  if (!signatureValid) {
    errors.push(
      "PDF_SIGNATURE_INVALID"
    );
  }

  if (
    byteCount <
    AG24_BP_VISUAL_GATE_V1
      .MIN_PDF_BYTES
  ) {
    errors.push(
      "PDF_TOO_SMALL"
    );
  }

  if (
    pageInfo.pageCount <= 0
  ) {
    errors.push(
      "PDF_PAGE_COUNT_UNREADABLE"
    );
  } else if (
    pageInfo.pageCount !==
    expected
  ) {
    errors.push(
      "PHYSICAL_PAGE_COUNT_" +
      String(
        pageInfo.pageCount
      ) +
      "_EXPECTED_" +
      String(expected)
    );
  }

  return {
    success:
      errors.length === 0,
    version:
      AG24_BP_VISUAL_GATE_V1
        .VERSION,
    classification:
      errors.length
        ? "POST_PDF_FAIL"
        : "POST_PDF_PASS",
    expectedPageCount:
      expected,
    physicalPageCount:
      pageInfo.pageCount,
    pageCountMethod:
      pageInfo.method,
    pageCountConfidence:
      pageInfo.confidence,
    pdfBytes:
      byteCount,
    pdfSignatureValid:
      signatureValid,
    errors:
      errors
  };
}


function AG24_BP_VISUAL_assertPdf_(
  blob,
  options
) {
  var report =
    AG24_BP_VISUAL_postflightPdf_(
      blob,
      options
    );

  if (!report.success) {
    throw new Error(
      "VISUAL_PDF_GATE_FAILED: " +
      report.errors.join(",")
    );
  }

  return report;
}
