/**
 * ============================================================
 * AFRIGREEN24 BUSINESS PLAN
 * DASHBOARD DOCUMENT SYNC
 * ============================================================
 */

const BP_DASHBOARD_SYNC_V1 = Object.freeze({
  VERSION: '1.1.0'
});

const BP_DASHBOARD_SYNC_URL_PROPERTY =
  'AFRIGREEN24_DASHBOARD_SYNC_URL';

const BP_DASHBOARD_SYNC_URL_DEFAULT =
  'https://script.google.com/macros/s/AKfycby_l9d-zzyjLP7AZvsyj5Ov7Dsu9YrB9PQi4ZUpRxZ0e05XSkzhQwTyPoTAhtfhLaqaow/exec';

function BP_obtenirDashboardSyncUrl_() {
  const configured = String(
    PropertiesService.getScriptProperties().getProperty(
      BP_DASHBOARD_SYNC_URL_PROPERTY
    ) || ''
  ).trim();

  const url = configured || BP_DASHBOARD_SYNC_URL_DEFAULT;

  if (
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)
  ) {
    throw new Error('URL Dashboard AfriGreen24 invalide.');
  }

  return url;
}

function BP_DASHBOARD_SYNC_resolveCanonicalFinanceur_(
  dossierId,
  generationClient
) {
  const id = BPB_normaliserDossierId_(dossierId);

  if (
    generationClient &&
    generationClient.dossierId &&
    String(generationClient.dossierId) !== id
  ) {
    throw new Error(
      'Le document ne correspond pas au dossier autorisé.'
    );
  }

  const generation =
    BPB_lireJsonChunked_(
      BPB_cle_(id, 'GENERATION_FINANCEUR')
    );

  if (
    !generation ||
    generation.statut !== 'FINANCEUR_GENERE'
  ) {
    throw new Error(
      'Aucune génération Financeur canonique n’est disponible.'
    );
  }

  if (
    !generation.pdfId ||
    !generation.pdfUrl
  ) {
    throw new Error(
      'Le Business Plan Financeur canonique est incomplet.'
    );
  }

  return generation;
}

function BP_DASHBOARD_SYNC_persistState_(
  dossierId,
  generation,
  dashboardSync
) {
  const id = BPB_normaliserDossierId_(dossierId);
  const updated = Object.assign(
    {},
    generation || {},
    {
      dashboardSync:
        dashboardSync &&
        typeof dashboardSync === 'object'
          ? dashboardSync
          : {
              success:false,
              skipped:true
            }
    }
  );

  BPB_avecVerrou_(function () {
    BPB_ecrireJsonChunked_(
      BPB_cle_(id, 'GENERATION_FINANCEUR'),
      updated
    );
  });

  return updated;
}

function BP_DASHBOARD_SYNC_syncStoredFinanceur_(
  dossierId,
  bridge,
  options
) {
  const id = BPB_normaliserDossierId_(dossierId);
  const opts =
    options && typeof options === 'object'
      ? options
      : {};

  const generation =
    BP_DASHBOARD_SYNC_resolveCanonicalFinanceur_(
      id,
      opts.generationClient || null
    );

  if (
    generation.dashboardSync &&
    generation.dashboardSync.success === true
  ) {
    return generation.dashboardSync;
  }

  const normalizedBridge =
    String(bridge || '').trim();

  if (!normalizedBridge) {
    const skipped = {
      success:false,
      skipped:true,
      reason:'Aucun bridge AfriGreen24.',
      at:new Date().toISOString()
    };

    BP_DASHBOARD_SYNC_persistState_(
      id,
      generation,
      skipped
    );

    return skipped;
  }

  try {
    const response =
      synchroniserBusinessPlanVersDashboard_(
        normalizedBridge,
        generation
      );

    const synced = {
      success:true,
      skipped:false,
      at:new Date().toISOString(),
      downstreamAccepted:
        Boolean(
          response &&
          response.success === true
        )
    };

    BP_DASHBOARD_SYNC_persistState_(
      id,
      generation,
      synced
    );

    if (
      typeof AG24_AUDIT_event_ === 'function'
    ) {
      try {
        AG24_AUDIT_event_(
          'BANCABLE_DASHBOARD_SYNC_PASSED',
          {
            version:BP_DASHBOARD_SYNC_V1.VERSION,
            dossierId:id,
            pdfId:String(generation.pdfId || '')
          }
        );
      } catch (auditError) {}
    }

    return synced;

  } catch (error) {
    const failed = {
      success:false,
      skipped:false,
      at:new Date().toISOString(),
      error:
        error && error.message
          ? String(error.message)
          : String(error)
    };

    BP_DASHBOARD_SYNC_persistState_(
      id,
      generation,
      failed
    );

    if (
      typeof AG24_AUDIT_event_ === 'function'
    ) {
      try {
        AG24_AUDIT_event_(
          'BANCABLE_DASHBOARD_SYNC_FAILED',
          {
            version:BP_DASHBOARD_SYNC_V1.VERSION,
            dossierId:id,
            pdfId:String(generation.pdfId || ''),
            error:failed.error.slice(0,240)
          }
        );
      } catch (auditError) {}
    }

    if (opts.throwOnFailure === true) {
      throw error;
    }

    return failed;
  }
}

function synchroniserBusinessPlanVersDashboardDepuisInterface(
  dossierId,
  jetonAcces,
  bridge,
  generation
) {
  const id = AG24_SEC_assertBancableAccess_(
    dossierId,
    jetonAcces,
    'dashboard-sync'
  );

  return BP_DASHBOARD_SYNC_syncStoredFinanceur_(
    id,
    bridge,
    {
      generationClient:generation || null,
      throwOnFailure:true
    }
  );
}


/**
 * ============================================================
 * SEND GENERATED BUSINESS PLAN TO DASHBOARD
 * ============================================================
 */

function synchroniserBusinessPlanVersDashboard_(
  bridge,
  generation
){

  bridge =
    String(
      bridge || ''
    )
    .trim();


  generation =
    generation || {};


  if(!bridge){

    return {

      success:false,

      skipped:true,

      reason:
        'Aucun bridge AfriGreen24.'

    };

  }


  if(
    !generation.pdfId ||
    !generation.pdfUrl
  ){

    throw new Error(
      'Le Business Plan PDF est introuvable.'
    );

  }


  const nomProjet =
    String(
      generation.nomProjet ||
      'Projet'
    )
    .trim();


  const payload = {

    action:
      'registerGeneratedDocument',

    bridge:
      bridge,

    idempotencyKey:
      'BUSINESS_PLAN|' +
      String(generation.pdfId),

    document:{

      type:
        'BUSINESS_PLAN',

      title:
        'Business Plan — ' +
        nomProjet,

      description:
        'Business Plan final généré depuis AfriGreen24.',

      format:
        'PDF',

      driveFileId:
        String(
          generation.pdfId
        ),

      fileUrl:
        String(
          generation.pdfUrl
        ),

      downloadUrl:

        'https://drive.google.com/uc?export=download&id=' +

        encodeURIComponent(
          generation.pdfId
        ),

      projectId:
        String(
          generation.dossierId ||
          ''
        ),

      generatedAt:
        String(
          generation.genereLe ||
          new Date().toISOString()
        )

    }

  };


  const response =
    UrlFetchApp.fetch(

      BP_obtenirDashboardSyncUrl_(),

      {

        method:
          'post',

        contentType:
          'application/json',

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true,

        followRedirects:
          true

      }

    );


  const status =
    response.getResponseCode();


  const text =
    response.getContentText();


  let result;


  try{

    result =
      JSON.parse(
        text
      );

  }
  catch(error){

    throw new Error(
      'Réponse Dashboard invalide : ' +
      text.substring(
        0,
        300
      )
    );

  }


  if(
    status < 200 ||
    status >= 300
  ){

    throw new Error(
      result.error ||
      (
        'Erreur Dashboard HTTP ' +
        status
      )
    );

  }


  if(
    !result.success
  ){

    throw new Error(
      result.error ||
      'Le Dashboard a refusé le document.'
    );

  }


  return result;

}

function BP_DASHBOARD_SYNC_CANONICAL_SYSTEM_TEST_V1() {
  const id =
    'BPB_SYNC_TEST_' +
    String(new Date().getTime());

  const key =
    BPB_cle_(
      id,
      'GENERATION_FINANCEUR'
    );

  const report = {
    success:false,
    version:BP_DASHBOARD_SYNC_V1.VERSION,
    canonicalSelected:false,
    clientOverrideRejected:false,
    persistedState:false,
    cleanupSuccess:false,
    failureCode:''
  };

  try {
    const canonical = {
      statut:'FINANCEUR_GENERE',
      typeDocument:'BUSINESS_PLAN_FINANCEUR',
      dossierId:id,
      nomProjet:'Fixture',
      pdfId:'CANONICAL_PDF',
      pdfUrl:'https://drive.google.com/file/d/CANONICAL_PDF/view',
      documentId:'CANONICAL_DOC'
    };

    BPB_ecrireJsonChunked_(
      key,
      canonical
    );

    const resolved =
      BP_DASHBOARD_SYNC_resolveCanonicalFinanceur_(
        id,
        {
          dossierId:id,
          pdfId:'MALICIOUS_PDF',
          pdfUrl:'https://example.com/fake.pdf'
        }
      );

    report.canonicalSelected =
      resolved.pdfId === 'CANONICAL_PDF' &&
      resolved.pdfUrl.indexOf(
        'CANONICAL_PDF'
      ) !== -1;

    let rejected = false;

    try {
      BP_DASHBOARD_SYNC_resolveCanonicalFinanceur_(
        id,
        {
          dossierId:'OTHER_DOSSIER',
          pdfId:'MALICIOUS_PDF'
        }
      );
    } catch (error) {
      rejected = true;
    }

    report.clientOverrideRejected =
      rejected === true;

    BP_DASHBOARD_SYNC_persistState_(
      id,
      canonical,
      {
        success:false,
        skipped:true,
        reason:'fixture'
      }
    );

    const persisted =
      BPB_lireJsonChunked_(key);

    report.persistedState =
      Boolean(
        persisted &&
        persisted.dashboardSync &&
        persisted.dashboardSync.skipped === true
      );

    report.success =
      report.canonicalSelected === true &&
      report.clientOverrideRejected === true &&
      report.persistedState === true;

    if (!report.success) {
      report.failureCode =
        'DASHBOARD_SYNC_CANONICAL_CONTRACT_FAILED';
    }

  } catch (error) {
    report.failureCode =
      error && error.message
        ? String(error.message)
        : String(error);

  } finally {
    try {
      BPB_supprimerJsonChunked_(key);
      report.cleanupSuccess =
        BPB_lireJsonChunked_(key) === null;
    } catch (cleanupError) {
      report.cleanupSuccess = false;
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    Logger.log(
      JSON.stringify(report,null,2)
    );
  }

  return report;
}
