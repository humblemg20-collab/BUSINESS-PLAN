/**
 * ============================================================
 * BUSINESS PLAN VISUAL REGRESSION PREVIEW SYSTEM V1
 * ============================================================
 *
 * Purpose:
 * - prepare canonical content ONCE;
 * - make at most ONE OpenAI narrative request;
 * - render the same content through all supported document themes;
 * - keep private Google Doc + PDF artifacts temporarily for human visual review;
 * - validate every PDF through the visual quality gate;
 * - persist one canonical preview batch report;
 * - automatically clean the previous preview batch before creating a new one.
 *
 * No CRM write.
 * No dashboard write.
 * No public sharing.
 */

var AG24_BP_VISUAL_PREVIEW_V1 = Object.freeze({
  VERSION: "1.1.0",
  LAST_REPORT_PROPERTY:
    "AFRIGREEN24_BP_VISUAL_PREVIEW_LAST_REPORT",
  THEMES: Object.freeze([
    "executive_premium",
    "institutional_banking",
    "modern_minimal",
    "impact_sustainability"
  ])
});


function AG24_BP_VISUAL_PREVIEW_themeLabel_(
  themeId
) {
  if (
    typeof AG24_BP_V2_resolveTheme_ ===
    "function"
  ) {
    var theme =
      AG24_BP_V2_resolveTheme_(
        themeId
      );

    if (
      theme &&
      theme.label
    ) {
      return String(
        theme.label
      );
    }
  }

  return String(
    themeId || ""
  );
}


function AG24_BP_VISUAL_PREVIEW_safeReport_(
  report
) {
  report = report || {};

  return {
    success:
      report.success === true,
    version:
      String(
        report.version || ""
      ),
    batchId:
      String(
        report.batchId || ""
      ),
    createdAt:
      String(
        report.createdAt || ""
      ),
    projectName:
      String(
        report.projectName || ""
      ),
    model:
      String(
        report.model || ""
      ),
    aiCalled:
      report.aiCalled === true,
    aiRequestCount:
      Number(
        report.aiRequestCount || 0
      ),
    inputTokens:
      Number(
        report.inputTokens || 0
      ),
    outputTokens:
      Number(
        report.outputTokens || 0
      ),
    totalTokens:
      Number(
        report.totalTokens || 0
      ),
    themeCount:
      Array.isArray(
        report.themes
      )
        ? report.themes.length
        : 0,
    themes:
      Array.isArray(
        report.themes
      )
        ? report.themes.map(
            function(item) {
              return {
                themeId:
                  String(
                    item.themeId || ""
                  ),
                themeLabel:
                  String(
                    item.themeLabel || ""
                  ),
                layoutGrammar:
                  String(
                    item.layoutGrammar || ""
                  ),
                visualGateVersion:
                  String(
                    item.visualGateVersion || ""
                  ),
                success:
                  item.success === true,
                documentId:
                  String(
                    item.documentId || ""
                  ),
                documentUrl:
                  String(
                    item.documentUrl || ""
                  ),
                pdfId:
                  String(
                    item.pdfId || ""
                  ),
                pdfUrl:
                  String(
                    item.pdfUrl || ""
                  ),
                physicalPdfPages:
                  Number(
                    item.physicalPdfPages || 0
                  ),
                pdfBytes:
                  Number(
                    item.pdfBytes || 0
                  ),
                maxDensityRatio:
                  Number(
                    item.maxDensityRatio || 0
                  ),
                sparsePageCount:
                  Number(
                    item.sparsePageCount || 0
                  ),
                classification:
                  String(
                    item.classification || ""
                  ),
                error:
                  String(
                    item.error || ""
                  )
              };
            }
          )
        : []
  };
}


function AG24_BP_VISUAL_PREVIEW_storeReport_(
  report
) {
  var safe =
    AG24_BP_VISUAL_PREVIEW_safeReport_(
      report
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_BP_VISUAL_PREVIEW_V1
        .LAST_REPORT_PROPERTY,
      JSON.stringify(
        safe
      )
    );

  return safe;
}


function AG24_BP_VISUAL_PREVIEW_readLast_() {
  var raw =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_BP_VISUAL_PREVIEW_V1
          .LAST_REPORT_PROPERTY
      );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    );
  } catch (error) {
    return null;
  }
}


function AG24_BP_VISUAL_PREVIEW_trashFile_(
  fileId
) {
  var id =
    String(
      fileId || ""
    ).trim();

  if (!id) {
    return true;
  }

  try {
    var file =
      DriveApp.getFileById(
        id
      );

    if (
      !file.isTrashed()
    ) {
      file.setTrashed(
        true
      );
    }

    return (
      DriveApp
        .getFileById(
          id
        )
        .isTrashed() === true
    );
  } catch (error) {
    return false;
  }
}


function AG24_BP_VISUAL_PREVIEW_cleanupReport_(
  report
) {
  report = report || {};

  var themes =
    Array.isArray(
      report.themes
    )
      ? report.themes
      : [];

  var artifacts = 0;
  var trashed = 0;
  var failures = [];

  themes.forEach(
    function(item) {
      [
        [
          "document",
          item.documentId
        ],
        [
          "pdf",
          item.pdfId
        ]
      ].forEach(
        function(entry) {
          var fileId =
            String(
              entry[1] || ""
            ).trim();

          if (!fileId) {
            return;
          }

          artifacts++;

          if (
            AG24_BP_VISUAL_PREVIEW_trashFile_(
              fileId
            )
          ) {
            trashed++;
          } else {
            failures.push(
              entry[0] +
              ":" +
              fileId
            );
          }
        }
      );
    }
  );

  return {
    success:
      failures.length === 0,
    artifacts:
      artifacts,
    trashed:
      trashed,
    failures:
      failures
  };
}


function AG24_BP_VISUAL_PREVIEW_cleanupPrevious_() {
  var previous =
    AG24_BP_VISUAL_PREVIEW_readLast_();

  if (!previous) {
    return {
      success: true,
      skipped: true,
      artifacts: 0,
      trashed: 0,
      failures: []
    };
  }

  var result =
    AG24_BP_VISUAL_PREVIEW_cleanupReport_(
      previous
    );

  if (result.success) {
    PropertiesService
      .getScriptProperties()
      .deleteProperty(
        AG24_BP_VISUAL_PREVIEW_V1
          .LAST_REPORT_PROPERTY
      );
  }

  return result;
}


function AG24_BP_VISUAL_PREVIEW_renderTheme_(
  data,
  projectName,
  batchId,
  themeId
) {
  var themeLabel =
    AG24_BP_VISUAL_PREVIEW_themeLabel_(
      themeId
    );

  var documentId = "";
  var pdfId = "";

  var report = {
    themeId:
      themeId,
    themeLabel:
      themeLabel,
    layoutGrammar: "",
    visualGateVersion: "",
    success: false,
    documentId: "",
    documentUrl: "",
    pdfId: "",
    pdfUrl: "",
    physicalPdfPages: 0,
    pdfBytes: 0,
    maxDensityRatio: 0,
    sparsePageCount: 0,
    classification: "",
    error: ""
  };

  try {
    var documentName =
      [
        "AG24 VISUAL PREVIEW",
        themeLabel,
        projectName,
        batchId
      ].join(
        " - "
      );

    var document =
      DocumentApp.create(
        documentName
      );

    documentId =
      document.getId();

    data.documentTheme =
      themeId;

    var designResult =
      AG24_BP_V2_renderDocument_(
        document,
        data,
        {
          themeId:
            themeId
        }
      );

    report.layoutGrammar =
      String(
        designResult &&
        designResult.layoutGrammar ||
        ""
      );

    report.visualGateVersion =
      String(
        designResult &&
        designResult.visualQualityPreflight &&
        designResult.visualQualityPreflight.version ||
        ""
      );

    document.saveAndClose();

    Utilities.sleep(
      800
    );

    var documentFile =
      DriveApp.getFileById(
        documentId
      );

    var blobPdf =
      documentFile
        .getBlob()
        .getAs(
          MimeType.PDF
        )
        .setName(
          documentName +
          ".pdf"
        );

    var visualPdf =
      AG24_BP_VISUAL_assertPdf_(
        blobPdf,
        {
          expectedPageCount:
            designResult.pageModelCount
        }
      );

    var pdfFile =
      creerPdfDansMemeDossier(
        documentFile,
        blobPdf
      );

    pdfId =
      pdfFile.getId();

    report.documentId =
      documentId;

    report.documentUrl =
      "https://docs.google.com/document/d/" +
      documentId +
      "/edit";

    report.pdfId =
      pdfId;

    report.pdfUrl =
      "https://drive.google.com/file/d/" +
      pdfId +
      "/view";

    report.physicalPdfPages =
      Number(
        visualPdf.physicalPageCount || 0
      );

    report.pdfBytes =
      Number(
        pdfFile.getSize() || 0
      );

    report.maxDensityRatio =
      Number(
        designResult &&
        designResult.visualQualityPreflight &&
        designResult
          .visualQualityPreflight
          .maxDensityRatio ||
        0
      );

    report.sparsePageCount =
      Number(
        designResult &&
        designResult.visualQualityPreflight &&
        designResult
          .visualQualityPreflight
          .sparsePageCount ||
        0
      );

    report.classification =
      "PASS";

    report.success =
      true;

    return report;

  } catch (error) {
    report.error =
      error && error.message
        ? String(
            error.message
          ).slice(
            0,
            320
          )
        : String(
            error
          ).slice(
            0,
            320
          );

    report.classification =
      "FAIL";

    if (
      pdfId
    ) {
      AG24_BP_VISUAL_PREVIEW_trashFile_(
        pdfId
      );
    }

    if (
      documentId
    ) {
      AG24_BP_VISUAL_PREVIEW_trashFile_(
        documentId
      );
    }

    return report;
  }
}


/**
 * Editor-safe visual regression entry point.
 *
 * Creates 4 private Google Docs + 4 private PDFs using one canonical
 * synthetic content preparation and one OpenAI request.
 *
 * Artifacts remain available for human visual review until:
 * - this function is run again, or
 * - AG24_BUSINESS_PLAN_VISUAL_PREVIEW_CLEANUP_V1() is run.
 */
function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_V1() {
  var startedAt =
    Date.now();

  var cleanupPrevious =
    AG24_BP_VISUAL_PREVIEW_cleanupPrevious_();

  if (
    !cleanupPrevious.success
  ) {
    throw new Error(
      "VISUAL_PREVIEW_PREVIOUS_CLEANUP_FAILED: " +
      cleanupPrevious
        .failures
        .join(",")
    );
  }

  if (
    typeof AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_ !==
    "function"
  ) {
    throw new Error(
      "Synthetic fixture unavailable."
    );
  }

  reinitialiserBusinessPlanStandardIA52_();

  var sourceData =
    AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_();

  sourceData.agBridge = "";

  verifierDonneesGeneration_(
    sourceData
  );

  var brandingClient =
    extraireBrandingBusinessPlan_(
      sourceData
    );

  var donneesPourIA =
    construireDonneesBusinessPlanSansBranding_(
      sourceData
    );

  var preparationIA =
    preparerBusinessPlanStandardIA52(
      donneesPourIA
    );

  var data =
    preparationIA.donnees || {};

  data.agBridge = "";

  data.logoUpload =
    brandingClient.logoUpload;

  data.organizationSlogan =
    brandingClient.slogan;

  var openAI =
    preparationIA.openAI || {};

  var aiRequestCount =
    openAI.called === true &&
    openAI.skipped !== true
      ? 1
      : 0;

  if (
    aiRequestCount !== 1 ||
    openAI.cacheHit === true ||
    openAI.fallbackUsed === true
  ) {
    reinitialiserBusinessPlanStandardIA52_();

    throw new Error(
      "VISUAL_PREVIEW_AI_CONTRACT_FAILED"
    );
  }

  var projectName =
    nettoyerTexte(
      data.projectName,
      "Synthetic Visual Preview"
    );

  var batchId =
    Utilities
      .getUuid()
      .replace(
        /-/g,
        ""
      )
      .slice(
        0,
        12
      );

  var report = {
    success: false,
    version:
      AG24_BP_VISUAL_PREVIEW_V1.VERSION,
    batchId:
      batchId,
    createdAt:
      new Date().toISOString(),
    projectName:
      projectName,
    model:
      String(
        preparationIA.model || ""
      ),
    aiCalled:
      openAI.called === true,
    aiRequestCount:
      aiRequestCount,
    inputTokens:
      Number(
        openAI.usage &&
        openAI.usage.input_tokens ||
        0
      ),
    outputTokens:
      Number(
        openAI.usage &&
        openAI.usage.output_tokens ||
        0
      ),
    totalTokens:
      Number(
        openAI.usage &&
        openAI.usage.total_tokens ||
        0
      ),
    durationMs: 0,
    themes: []
  };

  try {
    AG24_BP_VISUAL_PREVIEW_V1
      .THEMES
      .forEach(
        function(themeId) {
          report.themes.push(
            AG24_BP_VISUAL_PREVIEW_renderTheme_(
              data,
              projectName,
              batchId,
              themeId
            )
          );
        }
      );

    var grammarSet = {};

    report.themes.forEach(
      function(item) {
        if (
          item &&
          item.layoutGrammar
        ) {
          grammarSet[
            String(
              item.layoutGrammar
            )
          ] = true;
        }
      }
    );

    report.success =
      report.themes.length ===
        AG24_BP_VISUAL_PREVIEW_V1
          .THEMES
          .length &&
      Object.keys(
        grammarSet
      ).length ===
        AG24_BP_VISUAL_PREVIEW_V1
          .THEMES
          .length &&
      report.themes.every(
        function(item) {
          return (
            item.success === true &&
            item.layoutGrammar ===
              AG24_BP_V2_resolveTheme_(
                item.themeId
              ).grammar &&
            item.visualGateVersion ===
              AG24_BP_VISUAL_GATE_V1.VERSION &&
            item.physicalPdfPages ===
              AG24_BP_VISUAL_GATE_V1
                .EXPECTED_PAGE_COUNT
          );
        }
      );

    if (
      !report.success
    ) {
      throw new Error(
        "VISUAL_PREVIEW_THEME_RENDER_FAILED"
      );
    }

    return report;

  } finally {
    report.durationMs =
      Date.now() -
      startedAt;

    var safe =
      AG24_BP_VISUAL_PREVIEW_storeReport_(
        report
      );

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "BUSINESS_PLAN_VISUAL_PREVIEW_CREATED"
            : "BUSINESS_PLAN_VISUAL_PREVIEW_FAILED",
          {
            batchId:
              safe.batchId,
            success:
              safe.success,
            aiRequestCount:
              safe.aiRequestCount,
            themeCount:
              safe.themeCount,
            themes:
              safe.themes.map(
                function(item) {
                  return {
                    themeId:
                      item.themeId,
                    success:
                      item.success,
                    physicalPdfPages:
                      item.physicalPdfPages,
                    pdfBytes:
                      item.pdfBytes
                  };
                }
              )
          }
        );
      } catch (
        auditError
      ) {
        // Preview report remains authoritative.
      }
    }

    reinitialiserBusinessPlanStandardIA52_();
  }
}


/**
 * Returns the current preview batch report without generating anything.
 */
function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_LAST_REPORT_V1() {
  var report =
    AG24_BP_VISUAL_PREVIEW_readLast_();

  var result =
    report || {
      success: false,
      classification:
        "NO_PREVIEW_BATCH"
    };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


/**
 * Explicit cleanup after human visual review.
 */
function AG24_BUSINESS_PLAN_VISUAL_PREVIEW_CLEANUP_V1() {
  var report =
    AG24_BP_VISUAL_PREVIEW_readLast_();

  if (!report) {
    return {
      success: true,
      skipped: true,
      artifacts: 0,
      trashed: 0,
      failures: []
    };
  }

  var result =
    AG24_BP_VISUAL_PREVIEW_cleanupReport_(
      report
    );

  if (
    result.success
  ) {
    PropertiesService
      .getScriptProperties()
      .deleteProperty(
        AG24_BP_VISUAL_PREVIEW_V1
          .LAST_REPORT_PROPERTY
      );
  }

  if (
    typeof AG24_AUDIT_event_ ===
    "function"
  ) {
    try {
      AG24_AUDIT_event_(
        "BUSINESS_PLAN_VISUAL_PREVIEW_CLEANUP",
        {
          success:
            result.success,
          artifacts:
            result.artifacts,
          trashed:
            result.trashed,
          failures:
            result.failures
        }
      );
    } catch (
      auditError
    ) {
      // Cleanup result remains authoritative.
    }
  }

  return result;
}
