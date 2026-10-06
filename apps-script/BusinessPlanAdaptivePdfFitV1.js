/**
 * ============================================================
 * BUSINESS PLAN ADAPTIVE PDF FIT ENGINE V1
 * ============================================================
 *
 * Purpose:
 * Keep the validated 15-section semantic master while allowing real customer
 * content to vary naturally across physical PDF pages.
 *
 * Strategy:
 * 1. export the rendered Google Doc as-is;
 * 2. count physical PDF pages;
 * 3. if the document exceeds the hard physical-page safety ceiling, apply
 *    deterministic incremental compaction to the existing document;
 * 4. re-export and verify after each step;
 * 5. stop immediately on PASS; otherwise fail cleanly after bounded retries.
 *
 * No AI call. No content deletion. No semantic rewrite.
 */

var AG24_BP_VISUAL_FIT_V1 = Object.freeze({
  VERSION: "1.3.0",
  MAX_ATTEMPTS: 3,
  SETTLE_MS: 900,
  PROFILES: Object.freeze([
    Object.freeze({
      id: "compact",
      fontScale: 0.94,
      minFontSize: 7.5,
      lineScale: 0.92,
      minLineSpacing: 1.0,
      spacingScale: 0.72,
      paddingScale: 0.82,
      imageScale: 0.92,
      marginTop: 42,
      marginBottom: 42
    }),
    Object.freeze({
      id: "dense",
      fontScale: 0.91,
      minFontSize: 7.2,
      lineScale: 0.90,
      minLineSpacing: 1.0,
      spacingScale: 0.62,
      paddingScale: 0.78,
      imageScale: 0.90,
      marginTop: 36,
      marginBottom: 38
    }),
    Object.freeze({
      id: "tight",
      fontScale: 0.89,
      minFontSize: 7.0,
      lineScale: 0.88,
      minLineSpacing: 1.0,
      spacingScale: 0.52,
      paddingScale: 0.74,
      imageScale: 0.88,
      marginTop: 30,
      marginBottom: 34
    })
  ])
});


function AG24_BP_VISUAL_FIT_number_(
  value,
  fallback
) {
  var number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function AG24_BP_VISUAL_FIT_round_(
  value
) {
  return (
    Math.round(
      Number(value || 0) * 10
    ) / 10
  );
}


function AG24_BP_VISUAL_FIT_scaleValue_(
  value,
  scale,
  minimum
) {
  var numeric =
    AG24_BP_VISUAL_FIT_number_(
      value,
      null
    );

  if (numeric === null) {
    return null;
  }

  return AG24_BP_VISUAL_FIT_round_(
    Math.max(
      Number(minimum || 0),
      numeric *
      Number(scale || 1)
    )
  );
}


function AG24_BP_VISUAL_FIT_scaleTextRuns_(
  paragraph,
  profile
) {
  if (
    !paragraph ||
    typeof paragraph.editAsText !==
      "function"
  ) {
    return;
  }

  var text =
    paragraph.editAsText();

  var value =
    String(
      text.getText() || ""
    );

  if (!value) {
    return;
  }

  var indices =
    typeof text.getTextAttributeIndices ===
      "function"
      ? text.getTextAttributeIndices()
      : [0];

  if (
    !indices ||
    !indices.length
  ) {
    indices = [0];
  }

  for (
    var index = 0;
    index < indices.length;
    index++
  ) {
    var start =
      Number(
        indices[index] || 0
      );

    var end =
      index + 1 < indices.length
        ? Number(
            indices[index + 1]
          ) - 1
        : value.length - 1;

    if (
      end < start ||
      start < 0 ||
      start >= value.length
    ) {
      continue;
    }

    var size = null;

    try {
      size =
        text.getFontSize(
          start
        );
    } catch (error) {
      size = null;
    }

    size =
      AG24_BP_VISUAL_FIT_number_(
        size,
        null
      );

    if (size === null) {
      continue;
    }

    var target =
      AG24_BP_VISUAL_FIT_scaleValue_(
        size,
        profile.fontScale,
        profile.minFontSize
      );

    if (
      target !== null &&
      target < size
    ) {
      text.setFontSize(
        start,
        end,
        target
      );
    }
  }
}


function AG24_BP_VISUAL_FIT_compactParagraph_(
  paragraph,
  profile
) {
  AG24_BP_VISUAL_FIT_scaleTextRuns_(
    paragraph,
    profile
  );

  var before = null;
  var after = null;
  var line = null;

  try {
    before =
      paragraph.getSpacingBefore();
  } catch (errorBefore) {}

  try {
    after =
      paragraph.getSpacingAfter();
  } catch (errorAfter) {}

  try {
    line =
      paragraph.getLineSpacing();
  } catch (errorLine) {}

  var targetBefore =
    AG24_BP_VISUAL_FIT_scaleValue_(
      before,
      profile.spacingScale,
      0
    );

  var targetAfter =
    AG24_BP_VISUAL_FIT_scaleValue_(
      after,
      profile.spacingScale,
      0
    );

  var targetLine =
    AG24_BP_VISUAL_FIT_scaleValue_(
      line,
      profile.lineScale,
      profile.minLineSpacing
    );

  if (
    targetBefore !== null
  ) {
    paragraph.setSpacingBefore(
      targetBefore
    );
  }

  if (
    targetAfter !== null
  ) {
    paragraph.setSpacingAfter(
      targetAfter
    );
  }

  if (
    targetLine !== null
  ) {
    paragraph.setLineSpacing(
      targetLine
    );
  }
}


function AG24_BP_VISUAL_FIT_compactCell_(
  cell,
  profile
) {
  [
    [
      "getPaddingTop",
      "setPaddingTop"
    ],
    [
      "getPaddingBottom",
      "setPaddingBottom"
    ],
    [
      "getPaddingLeft",
      "setPaddingLeft"
    ],
    [
      "getPaddingRight",
      "setPaddingRight"
    ]
  ].forEach(
    function(methods) {
      var getter =
        methods[0];

      var setter =
        methods[1];

      if (
        typeof cell[getter] !==
          "function" ||
        typeof cell[setter] !==
          "function"
      ) {
        return;
      }

      var current = null;

      try {
        current =
          cell[getter]();
      } catch (error) {
        current = null;
      }

      var target =
        AG24_BP_VISUAL_FIT_scaleValue_(
          current,
          profile.paddingScale,
          1
        );

      if (
        target !== null &&
        (
          current === null ||
          target < current
        )
      ) {
        cell[setter](
          target
        );
      }
    }
  );
}


function AG24_BP_VISUAL_FIT_compactImage_(
  image,
  profile
) {
  if (
    !image ||
    typeof image.getWidth !==
      "function" ||
    typeof image.setWidth !==
      "function" ||
    typeof image.getHeight !==
      "function" ||
    typeof image.setHeight !==
      "function"
  ) {
    return;
  }

  var width =
    Number(
      image.getWidth() || 0
    );

  var height =
    Number(
      image.getHeight() || 0
    );

  if (
    width <= 0 ||
    height <= 0
  ) {
    return;
  }

  var targetWidth =
    Math.max(
      24,
      Math.round(
        width *
        profile.imageScale
      )
    );

  var targetHeight =
    Math.max(
      12,
      Math.round(
        height *
        (
          targetWidth /
          width
        )
      )
    );

  if (
    targetWidth < width
  ) {
    image.setWidth(
      targetWidth
    );

    image.setHeight(
      targetHeight
    );
  }
}


function AG24_BP_VISUAL_FIT_walk_(
  element,
  profile,
  options
) {
  if (!element) {
    return;
  }

  options =
    options || {};

  var type = null;

  try {
    type =
      element.getType();
  } catch (typeError) {}

  if (
    type ===
      DocumentApp.ElementType.PARAGRAPH
  ) {
    AG24_BP_VISUAL_FIT_compactParagraph_(
      element.asParagraph(),
      profile
    );
  } else if (
    type ===
      DocumentApp.ElementType.LIST_ITEM
  ) {
    AG24_BP_VISUAL_FIT_compactParagraph_(
      element.asListItem(),
      profile
    );
  } else if (
    type ===
      DocumentApp.ElementType.TABLE_CELL
  ) {
    AG24_BP_VISUAL_FIT_compactCell_(
      element.asTableCell(),
      profile
    );
  } else if (
    options.scaleImages === true &&
    type ===
      DocumentApp.ElementType.INLINE_IMAGE
  ) {
    AG24_BP_VISUAL_FIT_compactImage_(
      element.asInlineImage(),
      profile
    );
  }

  if (
    typeof element.getNumChildren !==
      "function" ||
    typeof element.getChild !==
      "function"
  ) {
    return;
  }

  var childCount =
    element.getNumChildren();

  for (
    var index = 0;
    index < childCount;
    index++
  ) {
    AG24_BP_VISUAL_FIT_walk_(
      element.getChild(
        index
      ),
      profile,
      options
    );
  }
}


function AG24_BP_VISUAL_FIT_applyProfile_(
  document,
  profile
) {
  var body =
    document.getBody();

  body.setMarginTop(
    profile.marginTop
  );

  body.setMarginBottom(
    profile.marginBottom
  );

  AG24_BP_VISUAL_FIT_walk_(
    body,
    profile,
    {
      scaleImages: false
    }
  );

  var header =
    document.getHeader();

  if (header) {
    AG24_BP_VISUAL_FIT_walk_(
      header,
      profile,
      {
        scaleImages: true
      }
    );
  }

  var footer =
    document.getFooter();

  if (footer) {
    AG24_BP_VISUAL_FIT_walk_(
      footer,
      profile,
      {
        scaleImages: false
      }
    );
  }

  return {
    profileId:
      profile.id,
    marginTop:
      profile.marginTop,
    marginBottom:
      profile.marginBottom
  };
}


function AG24_BP_VISUAL_FIT_exportPdf_(
  documentId,
  pdfName
) {
  var file =
    DriveApp.getFileById(
      documentId
    );

  return file
    .getBlob()
    .getAs(
      MimeType.PDF
    )
    .setName(
      pdfName ||
      (
        file.getName() +
        ".pdf"
      )
    );
}


function AG24_BP_VISUAL_FIT_onlyOverflowError_(
  report
) {
  if (
    !report ||
    !Array.isArray(
      report.errors
    ) ||
    !report.errors.length
  ) {
    return false;
  }

  return report.errors.every(
    function(error) {
      return (
        /^PHYSICAL_PAGE_COUNT_\d+_ABOVE_MAX_\d+$/.test(
          String(error || "")
        )
      );
    }
  );
}


function AG24_BP_VISUAL_FIT_try_(
  documentId,
  pdfName,
  options
) {
  options =
    options || {};

  if (
    typeof AG24_BP_VISUAL_postflightPdf_ !==
      "function"
  ) {
    throw new Error(
      "VISUAL_QUALITY_GATE_UNAVAILABLE"
    );
  }

  var semanticCount =
    Number(
      options.expectedSemanticPageCount ||
      options.expectedPageCount ||
      (
        typeof AG24_BP_VISUAL_GATE_V1 !==
          "undefined"
          ? AG24_BP_VISUAL_GATE_V1
              .EXPECTED_SEMANTIC_PAGE_COUNT
          : 15
      )
    );

  var flowEnabled =
    options.flowPagination !== false &&
    typeof AG24_BP_FLOW_normalizeDocument_ ===
      "function";

  var minPhysical =
    Number(
      options.minPhysicalPageCount ||
      (
        flowEnabled
          ? 8
          : (
              typeof AG24_BP_VISUAL_GATE_V1 !==
                "undefined"
                ? AG24_BP_VISUAL_GATE_V1
                    .MIN_PHYSICAL_PAGE_COUNT
                : 15
            )
      )
    );

  var hardPhysicalMax =
    Number(
      options.hardPhysicalPageMax ||
      (
        typeof AG24_BP_VISUAL_GATE_V1 !==
          "undefined"
          ? AG24_BP_VISUAL_GATE_V1
              .HARD_PHYSICAL_PAGE_MAX
          : 26
      )
    );

  var flowReport = null;

  if (flowEnabled) {
    flowReport =
      AG24_BP_FLOW_normalizeDocument_(
        documentId,
        {
          preserveHardBreaks: 2
        }
      );
  }

  var blob =
    AG24_BP_VISUAL_FIT_exportPdf_(
      documentId,
      pdfName
    );

  var report =
    AG24_BP_VISUAL_postflightPdf_(
      blob,
      {
        expectedSemanticPageCount:
          semanticCount,
        minPhysicalPageCount:
          minPhysical,
        hardPhysicalPageMax:
          hardPhysicalMax
      }
    );

  var recovery = {
    version:
      AG24_BP_VISUAL_FIT_V1.VERSION,
    applied: false,
    expectedSemanticPageCount:
      semanticCount,
    minPhysicalPageCount:
      minPhysical,
    hardPhysicalPageMax:
      hardPhysicalMax,
    flowPagination:
      flowReport,
    initialPageCount:
      report.physicalPageCount,
    finalPageCount:
      report.physicalPageCount,
    attempts: []
  };

  function result_(
    success,
    errorCode
  ) {
    report.fitRecovery =
      recovery;

    return {
      success:
        Boolean(success),
      blob:
        blob,
      report:
        report,
      recovery:
        recovery,
      errorCode:
        String(
          errorCode || ""
        )
    };
  }

  /*
   * In FLOW mode, physical pages are allowed to be fewer than the
   * 15 semantic blocks because sections can continue on the same page.
   * Long-document thresholds remain unchanged; only extreme overflow
   * is eligible for deterministic compaction.
   */
  if (
    report.success
  ) {
    return result_(
      true,
      ""
    );
  }

  if (
    !AG24_BP_VISUAL_FIT_onlyOverflowError_(
      report
    ) ||
    Number(
      report.physicalPageCount || 0
    ) <= hardPhysicalMax
  ) {
    return result_(
      false,
      (
        report.errors || []
      ).join(",")
    );
  }

  recovery.applied =
    true;

  if (
    typeof AG24_AUDIT_event_ ===
    "function"
  ) {
    AG24_AUDIT_event_(
      "PDF_FIT_RECOVERY_STARTED",
      {
        initialPageCount:
          report.physicalPageCount,
        expectedSemanticPageCount:
          semanticCount,
        hardPhysicalPageMax:
          hardPhysicalMax
      }
    );
  }

  var profiles =
    AG24_BP_VISUAL_FIT_V1
      .PROFILES
      .slice(
        0,
        AG24_BP_VISUAL_FIT_V1
          .MAX_ATTEMPTS
      );

  for (
    var attemptIndex = 0;
    attemptIndex < profiles.length;
    attemptIndex++
  ) {
    var profile =
      profiles[
        attemptIndex
      ];

    var document =
      DocumentApp.openById(
        documentId
      );

    AG24_BP_VISUAL_FIT_applyProfile_(
      document,
      profile
    );

    document.saveAndClose();

    Utilities.sleep(
      AG24_BP_VISUAL_FIT_V1
        .SETTLE_MS
    );

    blob =
      AG24_BP_VISUAL_FIT_exportPdf_(
        documentId,
        pdfName
      );

    report =
      AG24_BP_VISUAL_postflightPdf_(
        blob,
        {
          expectedSemanticPageCount:
            semanticCount,
          minPhysicalPageCount:
            minPhysical,
          hardPhysicalPageMax:
            hardPhysicalMax
        }
      );

    recovery.attempts.push({
      attempt:
        attemptIndex + 1,
      profileId:
        profile.id,
      physicalPageCount:
        report.physicalPageCount,
      success:
        report.success
    });

    recovery.finalPageCount =
      report.physicalPageCount;

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      AG24_AUDIT_event_(
        "PDF_FIT_RECOVERY_ATTEMPT",
        {
          attempt:
            attemptIndex + 1,
          profileId:
            profile.id,
          physicalPageCount:
            report.physicalPageCount,
          hardPhysicalPageMax:
            hardPhysicalMax,
          success:
            report.success
        }
      );
    }

    if (
      report.success
    ) {
      report.fitRecovery =
        recovery;

      if (
        typeof AG24_AUDIT_event_ ===
          "function"
      ) {
        AG24_AUDIT_event_(
          "PDF_FIT_RECOVERY_PASSED",
          {
            attempts:
              recovery.attempts.length,
            initialPageCount:
              recovery.initialPageCount,
            finalPageCount:
              recovery.finalPageCount,
            hardPhysicalPageMax:
              hardPhysicalMax
          }
        );
      }

      return result_(
        true,
        ""
      );
    }

    if (
      !AG24_BP_VISUAL_FIT_onlyOverflowError_(
        report
      )
    ) {
      break;
    }
  }

  if (
    typeof AG24_AUDIT_event_ ===
      "function"
  ) {
    AG24_AUDIT_event_(
      "PDF_FIT_RECOVERY_FAILED",
      {
        attempts:
          recovery.attempts.length,
        initialPageCount:
          recovery.initialPageCount,
        finalPageCount:
          recovery.finalPageCount,
        hardPhysicalPageMax:
          hardPhysicalMax
      }
    );
  }

  return result_(
    false,
    (
      report.errors || []
    ).join(",")
  );
}


function AG24_BP_VISUAL_FIT_pdf_(
  documentId,
  pdfName,
  options
) {
  options =
    options || {};

  if (
    typeof AG24_BP_VISUAL_assertPdf_ !==
      "function"
  ) {
    throw new Error(
      "VISUAL_QUALITY_GATE_UNAVAILABLE"
    );
  }

  var result =
    AG24_BP_VISUAL_FIT_try_(
      documentId,
      pdfName,
      options
    );

  if (
    result.success
  ) {
    return result;
  }

  AG24_BP_VISUAL_assertPdf_(
    result.blob,
    {
      expectedSemanticPageCount:
        result.recovery &&
        result.recovery.expectedSemanticPageCount
          ? result.recovery
              .expectedSemanticPageCount
          : (
              options.expectedSemanticPageCount ||
              options.expectedPageCount ||
              15
            ),
      minPhysicalPageCount:
        result.recovery &&
        result.recovery.minPhysicalPageCount
          ? result.recovery
              .minPhysicalPageCount
          : (
              options.minPhysicalPageCount ||
              (
                typeof AG24_BP_FLOW_normalizeDocument_ === "function"
                  ? 8
                  : 15
              )
            ),
      hardPhysicalPageMax:
        result.recovery &&
        result.recovery.hardPhysicalPageMax
          ? result.recovery
              .hardPhysicalPageMax
          : (
              options.hardPhysicalPageMax ||
              26
            )
    }
  );

  throw new Error(
    "VISUAL_PDF_FIT_FAILED"
  );
}


/**
 * Runtime regression test for the recovery contract.
 *
 * The production renderer is not called and no AI is used.
 * We intentionally create four semantic pages that overflow, then verify
 * that the bounded compaction engine restores the physical 15-page master.
 */
function AG24_BP_VISUAL_FIT_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success: false,
    version:
      AG24_BP_VISUAL_FIT_V1.VERSION,
    physicalPageCount: 0,
    normalDocumentAccepted: false,
    fitApplied: false,
    extremeOverflowRecognized: false,
    cleanupSuccess: false,
    failureCode: ""
  };

  try {
    var document =
      DocumentApp.create(
        "AG24 Visual Fit Policy Test " +
        String(
          new Date().getTime()
        )
      );

    documentId =
      document.getId();

    var body =
      document.getBody();

    body.setMarginTop(46);
    body.setMarginBottom(48);
    body.setMarginLeft(48);
    body.setMarginRight(48);

    for (
      var page = 1;
      page <= 15;
      page++
    ) {
      body
        .appendParagraph(
          "PAGE SÉMANTIQUE " +
          String(page)
        )
        .setFontSize(18)
        .setBold(true)
        .setSpacingAfter(12);

      body
        .appendParagraph(
          "Contenu synthétique de contrôle. " +
          "La pagination physique peut varier sans casser le contrat sémantique."
        )
        .setFontSize(10.2)
        .setLineSpacing(1.22)
        .setSpacingAfter(4);

      if (
        page < 15
      ) {
        body.appendPageBreak();
      }
    }

    document.saveAndClose();

    Utilities.sleep(
      AG24_BP_VISUAL_FIT_V1
        .SETTLE_MS
    );

    var fitted =
      AG24_BP_VISUAL_FIT_try_(
        documentId,
        "visual-fit-policy.pdf",
        {
          expectedSemanticPageCount: 15
        }
      );

    report.physicalPageCount =
      fitted.report
        ? fitted.report
            .physicalPageCount
        : 0;

    report.normalDocumentAccepted =
      fitted.success === true;

    report.fitApplied =
      Boolean(
        fitted.recovery &&
        fitted.recovery.applied
      );

    report.extremeOverflowRecognized =
      AG24_BP_VISUAL_FIT_onlyOverflowError_({
        errors: [
          "PHYSICAL_PAGE_COUNT_27_ABOVE_MAX_26"
        ]
      }) === true;

    report.success =
      report.normalDocumentAccepted === true &&
      report.fitApplied === false &&
      report.extremeOverflowRecognized === true &&
      report.physicalPageCount >= 15 &&
      report.physicalPageCount <= 26;

    if (!report.success) {
      report.failureCode =
        fitted.errorCode ||
        "VISUAL_FIT_POLICY_TEST_CONTRACT_FAILED";
    }

  } catch (error) {
    report.failureCode =
      error &&
      error.message
        ? String(
            error.message
          )
        : String(
            error
          );

  } finally {
    if (documentId) {
      try {
        var file =
          DriveApp.getFileById(
            documentId
          );

        file.setTrashed(
          true
        );

        report.cleanupSuccess =
          file.isTrashed() ===
          true;
      } catch (
        cleanupError
      ) {
        report.cleanupSuccess =
          false;
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

    if (
      typeof AG24_AUDIT_event_ ===
        "function"
    ) {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "VISUAL_FIT_SYSTEM_TEST_PASSED"
            : "VISUAL_FIT_SYSTEM_TEST_FAILED",
          {
            physicalPageCount:
              report.physicalPageCount,
            normalDocumentAccepted:
              report.normalDocumentAccepted,
            fitApplied:
              report.fitApplied,
            extremeOverflowRecognized:
              report.extremeOverflowRecognized,
            cleanupSuccess:
              report.cleanupSuccess,
            failureCode:
              report.failureCode
          }
        );
      } catch (
        auditError
      ) {}
    }
  }

  return report;
}
