/**
 * AfriGreen24 — Full Business Plan System Test V1
 *
 * Real end-to-end test of the transformation chain using synthetic data only:
 * synthetic facts -> production narrative engine -> Google Doc -> PDF ->
 * secured PDF capability -> validation -> cleanup.
 *
 * The test intentionally never calls CRM or dashboard persistence functions.
 */

const AG24_BP_SYSTEM_TEST_V1 = Object.freeze({
  VERSION: '2.0.0',
  LAST_REPORT_PROPERTY:
    'AFRIGREEN24_OPENAI_FULL_SYSTEM_TEST_LAST_REPORT',
  MIN_PDF_BYTES: 5000,
  REQUIRED_DOC_MARKERS: Object.freeze([
    'Executive Snapshot',
    'Résumé exécutif',
    'Présentation du projet',
    'Problème et opportunité',
    'Solution et proposition de valeur',
    'Marché et clientèle',
    'Modèle économique',
    'Stratégie commerciale',
    'Équipe et organisation opérationnelle',
    'Financement',
    'Impact',
    'Risques et points de vigilance'
  ])
});

function AG24_BP_SYSTEM_TEST_safeUsageV1_(usage) {
  usage = usage || {};

  return {
    inputTokens:
      Number(
        usage.input_tokens || 0
      ),
    outputTokens:
      Number(
        usage.output_tokens || 0
      ),
    totalTokens:
      Number(
        usage.total_tokens || 0
      )
  };
}

function AG24_BP_SYSTEM_TEST_cleanupV1_(
  documentId,
  pdfId
) {
  const report = {
    success: true,
    capabilityRemoved: false,
    pdfTrashed: false,
    documentTrashed: false,
    errors: []
  };

  const properties =
    PropertiesService.getScriptProperties();

  const cleanPdfId =
    String(pdfId || '').trim();

  const cleanDocumentId =
    String(documentId || '').trim();

  if (cleanPdfId) {
    try {
      const capabilityKey =
        AG24_DOCUMENT_ACCESS.CAPABILITY_PREFIX +
        AG24_SEC_sha256_(
          cleanPdfId
        ).slice(
          0,
          40
        );

      properties.deleteProperty(
        capabilityKey
      );

      report.capabilityRemoved =
        !properties.getProperty(
          capabilityKey
        );
    } catch (error) {
      report.success = false;
      report.errors.push(
        'CAPABILITY_CLEANUP'
      );
    }

    try {
      const pdfFile =
        DriveApp.getFileById(
          cleanPdfId
        );

      pdfFile.setTrashed(true);

      report.pdfTrashed =
        DriveApp
          .getFileById(
            cleanPdfId
          )
          .isTrashed();

      if (!report.pdfTrashed) {
        report.success = false;
        report.errors.push(
          'PDF_NOT_TRASHED'
        );
      }
    } catch (error) {
      report.success = false;
      report.errors.push(
        'PDF_CLEANUP'
      );
    }
  }

  if (cleanDocumentId) {
    try {
      const documentFile =
        DriveApp.getFileById(
          cleanDocumentId
        );

      documentFile.setTrashed(true);

      report.documentTrashed =
        DriveApp
          .getFileById(
            cleanDocumentId
          )
          .isTrashed();

      if (!report.documentTrashed) {
        report.success = false;
        report.errors.push(
          'DOCUMENT_NOT_TRASHED'
        );
      }
    } catch (error) {
      report.success = false;
      report.errors.push(
        'DOCUMENT_CLEANUP'
      );
    }
  }

  return report;
}

function AG24_BP_SYSTEM_TEST_persistV1_(
  report
) {
  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_BP_SYSTEM_TEST_V1
        .LAST_REPORT_PROPERTY,
      JSON.stringify(report)
    );

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  if (
    typeof AG24_AUDIT_event_ ===
    'function'
  ) {
    try {
      AG24_AUDIT_event_(
        report.success
          ? 'BUSINESS_PLAN_FULL_SYSTEM_TEST_PASSED'
          : 'BUSINESS_PLAN_FULL_SYSTEM_TEST_FAILED',
        report
      );
    } catch (auditError) {
      // Test result remains authoritative if optional audit plumbing fails.
    }
  }

  return report;
}

/**
 * Editor-safe entry point.
 *
 * This test creates real temporary Drive artifacts and may make one real
 * OpenAI request. All temporary artifacts are automatically trashed.
 */
function AG24_BUSINESS_PLAN_FULL_SYSTEM_TEST_V1() {
  const startedAt =
    Date.now();

  const report = {
    success: false,
    version:
      AG24_BP_SYSTEM_TEST_V1.VERSION,
    testedAt:
      new Date().toISOString(),
    syntheticData: true,
    crmWritesAttempted: false,
    dashboardWritesAttempted: false,
    provider: 'OPENAI',
    model: '',
    store: false,
    aiCalled: false,
    aiSkipped: false,
    cacheHit: false,
    fallbackUsed: false,
    narrativeBlockCount: 0,
    designSystemVersion: '',
    themeId: '',
    whiteLabel: false,
    docCreated: false,
    docMimeValid: false,
    docMarkersValid: false,
    missingDocMarkers: [],
    pdfCreated: false,
    pdfMimeValid: false,
    pdfBytes: 0,
    capabilityIssued: false,
    secureDownloadValid: false,
    cleanupSuccess: false,
    documentTrashed: false,
    pdfTrashed: false,
    capabilityRemoved: false,
    classification: '',
    durationMs: 0,
    responseId: '',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };

  let documentId = '';
  let pdfId = '';
  let pdfAccessToken = '';

  try {
    if (
      typeof AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_ !==
      'function'
    ) {
      throw new Error(
        'Synthetic fixture unavailable.'
      );
    }

    let data =
      AG24_OPENAI_NARRATIVE_TEST_buildSyntheticDataV1_();

    data.agBridge = '';

    verifierDonneesGeneration_(
      data
    );

    const brandingClient =
      extraireBrandingBusinessPlan_(
        data
      );

    const donneesPourIA =
      construireDonneesBusinessPlanSansBranding_(
        data
      );

    const preparationIA =
      preparerBusinessPlanStandardIA52(
        donneesPourIA
      );

    data =
      preparationIA.donnees || {};

    data.agBridge = '';

    data.logoUpload =
      brandingClient.logoUpload;

    data.organizationSlogan =
      brandingClient.slogan;

    data.documentTheme =
      'executive_premium';

    const openAI =
      preparationIA.openAI || {};

    report.model =
      String(
        preparationIA.model || ''
      );

    report.aiCalled =
      openAI.called === true;

    report.aiSkipped =
      openAI.skipped === true;

    report.cacheHit =
      openAI.cacheHit === true;

    report.fallbackUsed =
      openAI.fallbackUsed === true;

    report.narrativeBlockCount =
      preparationIA.narratif
        ? Object.keys(
            preparationIA.narratif
          ).length
        : 0;

    report.responseId =
      String(
        openAI.responseId || ''
      );

    const safeUsage =
      AG24_BP_SYSTEM_TEST_safeUsageV1_(
        openAI.usage
      );

    report.inputTokens =
      safeUsage.inputTokens;

    report.outputTokens =
      safeUsage.outputTokens;

    report.totalTokens =
      safeUsage.totalTokens;

    if (
      !report.aiCalled ||
      report.aiSkipped ||
      report.cacheHit ||
      report.fallbackUsed ||
      report.narrativeBlockCount !== 10
    ) {
      throw new Error(
        'Narrative engine contract failed.'
      );
    }

    const projectName =
      nettoyerTexte(
        data.projectName,
        'AG24 Synthetic System Test'
      );

    const document =
      DocumentApp.create(
        'AG24 SYSTEM TEST - ' +
        projectName
      );

    documentId =
      document.getId();

    report.docCreated =
      Boolean(
        documentId
      );

    if (
      typeof AG24_BP_V2_renderDocument_ !==
      'function'
    ) {
      throw new Error(
        'Business Plan Design System V2 unavailable.'
      );
    }

    const designResult =
      AG24_BP_V2_renderDocument_(
        document,
        data,
        {
          themeId:
            data.documentTheme
        }
      );

    report.designSystemVersion =
      String(
        designResult &&
        designResult.version ||
        ''
      );

    report.themeId =
      String(
        designResult &&
        designResult.themeId ||
        ''
      );

    report.whiteLabel =
      Boolean(
        designResult &&
        designResult.whiteLabel === true
      );

    document.saveAndClose();

    Utilities.sleep(
      1200
    );

    const documentFile =
      DriveApp.getFileById(
        documentId
      );

    report.docMimeValid =
      documentFile.getMimeType() ===
      MimeType.GOOGLE_DOCS;

    const documentText =
      DocumentApp
        .openById(
          documentId
        )
        .getBody()
        .getText();

    report.missingDocMarkers =
      AG24_BP_SYSTEM_TEST_V1
        .REQUIRED_DOC_MARKERS
        .filter(function(marker) {
          return (
            documentText.indexOf(
              marker
            ) === -1
          );
        });

    report.docMarkersValid =
      documentText.indexOf(
        projectName
      ) !== -1 &&
      report.missingDocMarkers.length === 0;

    const blobPdf =
      documentFile
        .getBlob()
        .getAs(
          MimeType.PDF
        )
        .setName(
          'AG24 SYSTEM TEST - ' +
          projectName +
          '.pdf'
        );

    const pdfFile =
      creerPdfDansMemeDossier(
        documentFile,
        blobPdf
      );

    pdfId =
      pdfFile.getId();

    report.pdfCreated =
      Boolean(
        pdfId
      );

    report.pdfMimeValid =
      pdfFile.getMimeType() ===
      MimeType.PDF;

    report.pdfBytes =
      Number(
        pdfFile.getSize() || 0
      );

    pdfAccessToken =
      AG24_DOC_issueCapability_(
        pdfId,
        'STANDARD',
        ''
      );

    report.capabilityIssued =
      Boolean(
        pdfAccessToken
      );

    const secureDownload =
      telechargerPdfBusinessPlanStandard(
        pdfId,
        pdfAccessToken
      );

    report.secureDownloadValid =
      Boolean(
        secureDownload &&
        secureDownload.success === true &&
        secureDownload.fileId === pdfId &&
        secureDownload.mimeType ===
          'application/pdf' &&
        String(
          secureDownload.base64 || ''
        ).length > 1000
      );

    if (
      report.designSystemVersion !==
        AG24_BP_DESIGN_V2.VERSION ||
      report.themeId !==
        data.documentTheme ||
      !report.whiteLabel
    ) {
      throw new Error(
        'Design System V2 contract failed.'
      );
    }

    if (!report.docCreated) {
      throw new Error(
        'Google Doc was not created.'
      );
    }

    if (!report.docMimeValid) {
      throw new Error(
        'Google Doc MIME validation failed.'
      );
    }

    if (!report.docMarkersValid) {
      throw new Error(
        'Document structure validation failed.'
      );
    }

    if (!report.pdfCreated) {
      throw new Error(
        'PDF was not created.'
      );
    }

    if (!report.pdfMimeValid) {
      throw new Error(
        'PDF MIME validation failed.'
      );
    }

    if (
      report.pdfBytes <
      AG24_BP_SYSTEM_TEST_V1.MIN_PDF_BYTES
    ) {
      throw new Error(
        'PDF is unexpectedly small.'
      );
    }

    if (!report.capabilityIssued) {
      throw new Error(
        'PDF capability was not issued.'
      );
    }

    if (!report.secureDownloadValid) {
      throw new Error(
        'Secure PDF download validation failed.'
      );
    }

    report.classification =
      'FUNCTIONAL_PASS';

  } catch (error) {
    report.classification =
      report.classification ||
      'FUNCTIONAL_FAILURE';

    report.failureCode =
      error && error.message
        ? String(
            error.message
          ).slice(
            0,
            240
          )
        : 'UNKNOWN';
  } finally {
    try {
      reinitialiserBusinessPlanStandardIA52_();
    } catch (cacheCleanupError) {
      // Artifact cleanup remains mandatory even if cache cleanup fails.
    }

    const cleanup =
      AG24_BP_SYSTEM_TEST_cleanupV1_(
        documentId,
        pdfId
      );

    report.cleanupSuccess =
      cleanup.success === true;

    report.documentTrashed =
      cleanup.documentTrashed === true;

    report.pdfTrashed =
      cleanup.pdfTrashed === true;

    report.capabilityRemoved =
      cleanup.capabilityRemoved === true;

    if (
      documentId &&
      !report.documentTrashed
    ) {
      report.cleanupSuccess = false;
    }

    if (
      pdfId &&
      (
        !report.pdfTrashed ||
        !report.capabilityRemoved
      )
    ) {
      report.cleanupSuccess = false;
    }
  }

  report.durationMs =
    Date.now() - startedAt;

  if (
    report.classification ===
      'FUNCTIONAL_PASS' &&
    report.cleanupSuccess
  ) {
    report.success = true;
    report.classification = 'PASS';
  } else if (
    report.classification ===
      'FUNCTIONAL_PASS'
  ) {
    report.classification =
      'CLEANUP_FAILURE';
  }

  return AG24_BP_SYSTEM_TEST_persistV1_(
    report
  );
}

function AG24_BUSINESS_PLAN_FULL_SYSTEM_LAST_REPORT_V1() {
  const raw =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_BP_SYSTEM_TEST_V1
          .LAST_REPORT_PROPERTY
      );

  if (!raw) {
    return {
      success: false,
      classification: 'NO_REPORT'
    };
  }

  return JSON.parse(raw);
}
