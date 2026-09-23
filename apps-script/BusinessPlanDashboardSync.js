/**
 * ============================================================
 * AFRIGREEN24 BUSINESS PLAN
 * DASHBOARD DOCUMENT SYNC
 * ============================================================
 */

const BP_DASHBOARD_SYNC_URL =
  'https://script.google.com/macros/s/AKfycby_l9d-zzyjLP7AZvsyj5Ov7Dsu9YrB9PQi4ZUpRxZ0e05XSkzhQwTyPoTAhtfhLaqaow/exec';


/**
 * ============================================================
 * SEND GENERATED BUSINESS PLAN TO DASHBOARD
 * ============================================================
 */

function synchroniserBusinessPlanVersDashboard(
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

      BP_DASHBOARD_SYNC_URL,

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