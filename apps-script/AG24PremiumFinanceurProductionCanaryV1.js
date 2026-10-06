/**
 * AfriGreen24 — Premium Financeur Production Canary V1
 *
 * Real-data shadow canary for the Bancable Financeur production route.
 *
 * Source:
 *   existing Business Plan Bancable dossier in Script Properties.
 *
 * Execution:
 *   select latest eligible dossier -> rebuild deterministic audit/model
 *   -> call the real production renderer route in an isolated Drive folder
 *   -> verify Premium V2, PDF, quality report, and no source generation mutation
 *   -> cleanup all canary artifacts -> persist compact canary evidence.
 *
 * The canary does NOT call genererBusinessPlanFinanceur_ and therefore does
 * not persist a production generation record or sync the dashboard.
 */
var AG24_PREMIUM_FINANCEUR_CANARY_V1 = Object.freeze({
  VERSION:"1.1.0",
  MAX_SCAN:25,
  LAST_RESULT_PROPERTY:"AFRIGREEN24_PREMIUM_FINANCEUR_CANARY_LAST"
});

function AG24_PREMIUM_FINANCEUR_CANARY_text_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\s+/g," ")
    .trim();
}

function AG24_PREMIUM_FINANCEUR_CANARY_time_(meta) {
  meta = meta || {};
  var raw =
    meta.modifieLe ||
    meta.updatedAt ||
    meta.creeLe ||
    meta.createdAt ||
    "";

  var time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function AG24_PREMIUM_FINANCEUR_CANARY_isSyntheticId_(id) {
  return /(?:TEST|CANARY|FIXTURE)/i.test(String(id || ""));
}

function AG24_PREMIUM_FINANCEUR_CANARY_discoverIds_() {
  var properties =
    PropertiesService.getScriptProperties().getProperties();

  var prefix =
    String(BPB_CONFIG.PREFIXE_STOCKAGE) + ":";

  var suffix =
    ":META:COUNT";

  var ids = [];

  Object.keys(properties).forEach(function(key) {
    if (
      key.indexOf(prefix) !== 0 ||
      key.slice(-suffix.length) !== suffix
    ) {
      return;
    }

    var id =
      key.slice(
        prefix.length,
        key.length - suffix.length
      );

    if (
      id &&
      !AG24_PREMIUM_FINANCEUR_CANARY_isSyntheticId_(id)
    ) {
      ids.push(id);
    }
  });

  return ids.filter(function(id,index,self) {
    return self.indexOf(id) === index;
  });
}

function AG24_PREMIUM_FINANCEUR_CANARY_candidateMeta_(id) {
  var meta =
    BPB_lireJsonChunked_(
      BPB_cle_(id,"META")
    ) || {};

  return {
    dossierId:id,
    meta:meta,
    time:
      AG24_PREMIUM_FINANCEUR_CANARY_time_(meta)
  };
}

function AG24_PREMIUM_FINANCEUR_CANARY_waitState_(diagnostics) {
  diagnostics = Array.isArray(diagnostics) ? diagnostics : [];

  var validationReady = diagnostics.filter(function(item) {
    return item && item.reason === "FINAL_VALIDATION_REQUIRED";
  });

  if (validationReady.length) {
    return {
      state:"WAITING_FOR_FINAL_VALIDATION",
      nextCandidateId:String(validationReady[0].dossierId || ""),
      nextCandidateProjectName:String(validationReady[0].projectName || ""),
      nextAction:
        "Le dossier est audité et prêt techniquement. Le porteur doit effectuer la validation finale avant le canary réel."
    };
  }

  var auditPending = diagnostics.filter(function(item) {
    return item && item.reason === "AUDIT_NOT_READY";
  });

  if (auditPending.length) {
    return {
      state:"WAITING_FOR_AUDIT_READY_DOSSIER",
      nextCandidateId:String(auditPending[0].dossierId || ""),
      nextCandidateProjectName:String(auditPending[0].projectName || ""),
      nextAction:
        "Aucun dossier n'est encore prêt techniquement pour la génération Financeur. Finaliser les corrections de l'audit."
    };
  }

  return {
    state:"WAITING_FOR_REAL_DOSSIER",
    nextCandidateId:"",
    nextCandidateProjectName:"",
    nextAction:
      "Créer ou compléter un dossier Bancable réel jusqu'à l'audit puis à la validation finale."
  };
}

function AG24_PREMIUM_FINANCEUR_CANARY_selectLatestEligible_() {
  var candidates =
    AG24_PREMIUM_FINANCEUR_CANARY_discoverIds_()
      .map(AG24_PREMIUM_FINANCEUR_CANARY_candidateMeta_)
      .sort(function(a,b) {
        return b.time - a.time;
      })
      .slice(
        0,
        AG24_PREMIUM_FINANCEUR_CANARY_V1.MAX_SCAN
      );

  var diagnostics = [];

  for (var index=0; index<candidates.length; index++) {
    var candidate = candidates[index];
    var id = candidate.dossierId;

    try {
      var source =
        BPB_obtenirDossierUnifie_(id);

      var projectName =
        AG24_PREMIUM_FINANCEUR_CANARY_text_(
          source &&
          source.standard &&
          source.standard.nomProjet
        );

      if (/(?:\btest\b|fixture|canary)/i.test(projectName)) {
        diagnostics.push({
          dossierId:id,
          projectName:projectName,
          eligible:false,
          reason:"SYNTHETIC_PROJECT_NAME"
        });
        continue;
      }

      var analysis =
        analyserBusinessPlanBancable(
          source.standard,
          source.bancable
        );

      if (
        !analysis.audit ||
        analysis.audit.pretPourGeneration !== true
      ) {
        diagnostics.push({
          dossierId:id,
          projectName:projectName,
          eligible:false,
          auditReady:false,
          finalValidationReady:false,
          reason:"AUDIT_NOT_READY"
        });
        continue;
      }

      var validation =
        BPB_lireJsonChunked_(
          BPB_cle_(id,"VALIDATION_FINALE")
        );

      if (
        !validation ||
        validation.informationsExactes !== true ||
        validation.decisionFinanceur !== true
      ) {
        diagnostics.push({
          dossierId:id,
          projectName:projectName,
          eligible:false,
          auditReady:true,
          finalValidationReady:false,
          reason:"FINAL_VALIDATION_REQUIRED"
        });
        continue;
      }

      return {
        success:true,
        state:"ELIGIBLE",
        blocked:false,
        dossierId:id,
        projectName:projectName,
        source:source,
        analysis:analysis,
        diagnostics:diagnostics,
        nextCandidateId:"",
        nextCandidateProjectName:"",
        nextAction:""
      };

    } catch (error) {
      diagnostics.push({
        dossierId:id,
        eligible:false,
        reason:"CANDIDATE_READ_FAILED",
        error:
          error && error.message
            ? String(error.message).slice(0,160)
            : String(error).slice(0,160)
      });
    }
  }

  var wait =
    AG24_PREMIUM_FINANCEUR_CANARY_waitState_(diagnostics);

  return {
    success:false,
    blocked:true,
    state:wait.state,
    dossierId:"",
    diagnostics:diagnostics,
    nextCandidateId:wait.nextCandidateId,
    nextCandidateProjectName:wait.nextCandidateProjectName,
    nextAction:wait.nextAction,
    blockingCode:"NO_ELIGIBLE_BANCABLE_DOSSIER",
    failureCode:""
  };
}

function AG24_PREMIUM_FINANCEUR_CANARY_resolveDossier_(dossierId) {
  if (!dossierId) {
    return AG24_PREMIUM_FINANCEUR_CANARY_selectLatestEligible_();
  }

  var id = BPB_normaliserDossierId_(dossierId);

  if (AG24_PREMIUM_FINANCEUR_CANARY_isSyntheticId_(id)) {
    return {
      success:false,
      blocked:false,
      state:"FAILED",
      dossierId:id,
      diagnostics:[],
      failureCode:"SYNTHETIC_DOSSIER_REJECTED"
    };
  }

  var source =
    BPB_obtenirDossierUnifie_(id);

  var projectName =
    AG24_PREMIUM_FINANCEUR_CANARY_text_(
      source &&
      source.standard &&
      source.standard.nomProjet
    );

  var analysis =
    analyserBusinessPlanBancable(
      source.standard,
      source.bancable
    );

  if (
    !analysis.audit ||
    analysis.audit.pretPourGeneration !== true
  ) {
    return {
      success:false,
      blocked:true,
      state:"WAITING_FOR_AUDIT_READY_DOSSIER",
      dossierId:id,
      projectName:projectName,
      diagnostics:[],
      nextCandidateId:id,
      nextCandidateProjectName:projectName,
      nextAction:
        "Finaliser les corrections de l'audit avant le canary réel.",
      blockingCode:"AUDIT_NOT_READY",
      failureCode:""
    };
  }

  var validation =
    BPB_lireJsonChunked_(
      BPB_cle_(id,"VALIDATION_FINALE")
    );

  if (
    !validation ||
    validation.informationsExactes !== true ||
    validation.decisionFinanceur !== true
  ) {
    return {
      success:false,
      blocked:true,
      state:"WAITING_FOR_FINAL_VALIDATION",
      dossierId:id,
      projectName:projectName,
      diagnostics:[],
      nextCandidateId:id,
      nextCandidateProjectName:projectName,
      nextAction:
        "Le porteur doit effectuer la validation finale avant le canary réel.",
      blockingCode:"FINAL_VALIDATION_REQUIRED",
      failureCode:""
    };
  }

  return {
    success:true,
    blocked:false,
    state:"ELIGIBLE",
    dossierId:id,
    projectName:projectName,
    source:source,
    analysis:analysis,
    diagnostics:[],
    nextCandidateId:"",
    nextCandidateProjectName:"",
    nextAction:""
  };
}

function AG24_PREMIUM_FINANCEUR_CANARY_persist_(report) {
  var compact = {
    version:report.version,
    success:report.success,
    blocked:report.blocked,
    state:report.state,
    executedAt:report.executedAt,
    dossierId:report.dossierId,
    nextCandidateId:report.nextCandidateId,
    nextCandidateProjectName:report.nextCandidateProjectName,
    nextAction:report.nextAction,
    renderer:report.renderer,
    premiumFallbackUsed:report.premiumFallbackUsed,
    pdfCreated:report.pdfCreated,
    physicalPageCount:report.physicalPageCount,
    sourceGenerationUnchanged:report.sourceGenerationUnchanged,
    cleanupSuccess:report.cleanupSuccess,
    blockingCode:report.blockingCode,
    failureCode:report.failureCode
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AG24_PREMIUM_FINANCEUR_CANARY_V1.LAST_RESULT_PROPERTY,
      JSON.stringify(compact)
    );
}

function runAg24PremiumFinanceurCanaryV1(dossierId) {
  var folderId = "";
  var documentId = "";
  var pdfId = "";

  var report = {
    success:false,
    blocked:false,
    state:"RUNNING",
    version:AG24_PREMIUM_FINANCEUR_CANARY_V1.VERSION,
    executedAt:new Date().toISOString(),
    dossierId:"",
    nextCandidateId:"",
    nextCandidateProjectName:"",
    nextAction:"",
    renderer:"",
    premiumFallbackUsed:false,
    premiumComposerActive:false,
    pdfCreated:false,
    physicalPageCount:0,
    sourceGenerationUnchanged:false,
    cleanupSuccess:false,
    diagnostics:[],
    blockingCode:"",
    failureCode:""
  };

  try {
    var resolved =
      AG24_PREMIUM_FINANCEUR_CANARY_resolveDossier_(
        dossierId
      );

    report.diagnostics =
      resolved.diagnostics || [];

    if (!resolved.success) {
      report.blocked =
        Boolean(resolved.blocked === true);
      report.state =
        resolved.state || "FAILED";
      report.dossierId =
        resolved.dossierId || "";
      report.nextCandidateId =
        resolved.nextCandidateId || "";
      report.nextCandidateProjectName =
        resolved.nextCandidateProjectName || "";
      report.nextAction =
        resolved.nextAction || "";
      report.blockingCode =
        resolved.blockingCode || "";

      if (report.blocked) {
        return report;
      }

      throw new Error(
        resolved.failureCode ||
        "CANARY_DOSSIER_RESOLUTION_FAILED"
      );
    }

    var id = resolved.dossierId;
    report.dossierId = id;
    report.state = "RUNNING";
    report.blocked = false;

    var generationBefore =
      BPB_lireJsonChunked_(
        BPB_cle_(id,"GENERATION_FINANCEUR")
      );

    var dossier = {
      dossierId:id,
      meta:resolved.source.meta || {},
      standard:resolved.analysis.standard || {},
      bancable:resolved.analysis.bancable || {},
      audit:resolved.analysis.audit
    };

    var financialModel =
      BPB3_construireModeleFinancier_(dossier);

    var folder =
      DriveApp.createFolder(
        "AG24 Premium Financeur Canary " +
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone() || "GMT",
          "yyyyMMdd-HHmmss"
        )
      );

    folderId = folder.getId();

    var result =
      BPB3_creerDocumentFinanceurRoute_(
        dossier,
        financialModel,
        folder
      );

    documentId =
      result.documentId || "";
    pdfId =
      result.pdfId || "";

    report.renderer =
      String(result.renderer || "");

    report.premiumFallbackUsed =
      report.renderer === "LEGACY_FALLBACK";

    report.premiumComposerActive =
      Boolean(
        result.designResult &&
        result.designResult.audienceComposer &&
        result.designResult.audienceComposer.success === true &&
        result.designResult.audienceComposer.audience === "BANK"
      );

    report.pdfCreated =
      Boolean(
        pdfId &&
        DriveApp
          .getFileById(pdfId)
          .getBlob()
          .getBytes()
          .length > 1000
      );

    report.physicalPageCount =
      result.visualQualityPdf &&
      result.visualQualityPdf.physicalPageCount
        ? Number(
            result.visualQualityPdf.physicalPageCount
          )
        : 0;

    var generationAfter =
      BPB_lireJsonChunked_(
        BPB_cle_(id,"GENERATION_FINANCEUR")
      );

    report.sourceGenerationUnchanged =
      JSON.stringify(generationBefore) ===
      JSON.stringify(generationAfter);

    report.success =
      report.renderer === "PREMIUM_V2" &&
      report.premiumFallbackUsed === false &&
      report.premiumComposerActive === true &&
      report.pdfCreated === true &&
      report.physicalPageCount > 0 &&
      report.sourceGenerationUnchanged === true;

    if (!report.success) {
      report.state = "FAILED";
      report.failureCode =
        "PREMIUM_FINANCEUR_REAL_CANARY_CONTRACT_FAILED";
    } else {
      report.state = "PASSED";
    }

  } catch (error) {
    report.blocked = false;
    report.state = "FAILED";
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);

  } finally {
    if (pdfId) {
      try {
        DriveApp.getFileById(pdfId).setTrashed(true);
      } catch (e1) {}
    }

    if (documentId) {
      try {
        DriveApp.getFileById(documentId).setTrashed(true);
      } catch (e2) {}
    }

    if (folderId) {
      try {
        var folder =
          DriveApp.getFolderById(folderId);

        var files = folder.getFiles();

        while (files.hasNext()) {
          files.next().setTrashed(true);
        }

        folder.setTrashed(true);

        report.cleanupSuccess =
          folder.isTrashed() === true;
      } catch (e3) {
        report.cleanupSuccess = false;
      }
    } else {
      report.cleanupSuccess = true;
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    AG24_PREMIUM_FINANCEUR_CANARY_persist_(report);

    if (typeof AG24_AUDIT_event_ === "function") {
      try {
        AG24_AUDIT_event_(
          report.success
            ? "PREMIUM_FINANCEUR_REAL_CANARY_PASSED"
            : report.blocked
              ? "PREMIUM_FINANCEUR_REAL_CANARY_BLOCKED"
              : "PREMIUM_FINANCEUR_REAL_CANARY_FAILED",
          {
            version:report.version,
            state:report.state,
            blocked:report.blocked,
            dossierId:report.dossierId,
            nextCandidateId:report.nextCandidateId,
            renderer:report.renderer,
            premiumFallbackUsed:
              report.premiumFallbackUsed,
            physicalPageCount:
              report.physicalPageCount,
            sourceGenerationUnchanged:
              report.sourceGenerationUnchanged,
            cleanupSuccess:
              report.cleanupSuccess,
            blockingCode:
              report.blockingCode,
            failureCode:
              report.failureCode
          }
        );
      } catch (auditError) {}
    }

    Logger.log(
      JSON.stringify(report,null,2)
    );
  }

  return report;
}

function runAg24PremiumFinanceurLatestCanaryV1() {
  return runAg24PremiumFinanceurCanaryV1("");
}

function AG24_PREMIUM_FINANCEUR_CANARY_SELECTION_SYSTEM_TEST_V1() {
  var report = {
    success:false,
    version:AG24_PREMIUM_FINANCEUR_CANARY_V1.VERSION,
    syntheticRejected:false,
    orderingDeterministic:false,
    waitStateClassification:false,
    failureCode:""
  };

  try {
    report.syntheticRejected =
      AG24_PREMIUM_FINANCEUR_CANARY_isSyntheticId_(
        "BPB_PREMIUM_RENDER_TEST"
      ) === true &&
      AG24_PREMIUM_FINANCEUR_CANARY_isSyntheticId_(
        "BPB_ABC123"
      ) === false;

    var candidates = [
      {dossierId:"B",time:20},
      {dossierId:"A",time:30},
      {dossierId:"C",time:10}
    ];

    var once =
      candidates.slice().sort(function(a,b) {
        return b.time - a.time;
      });

    var twice =
      candidates.slice().sort(function(a,b) {
        return b.time - a.time;
      });

    report.orderingDeterministic =
      JSON.stringify(once) === JSON.stringify(twice) &&
      once[0].dossierId === "A";

    var waitState =
      AG24_PREMIUM_FINANCEUR_CANARY_waitState_([
        {
          dossierId:"BPB_REAL_1",
          projectName:"Projet réel",
          reason:"FINAL_VALIDATION_REQUIRED"
        },
        {
          dossierId:"BPB_REAL_2",
          projectName:"Projet audit",
          reason:"AUDIT_NOT_READY"
        }
      ]);

    report.waitStateClassification =
      waitState.state === "WAITING_FOR_FINAL_VALIDATION" &&
      waitState.nextCandidateId === "BPB_REAL_1";

    report.success =
      report.syntheticRejected === true &&
      report.orderingDeterministic === true &&
      report.waitStateClassification === true;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_FINANCEUR_CANARY_SELECTION_FAILED";
    }
  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
