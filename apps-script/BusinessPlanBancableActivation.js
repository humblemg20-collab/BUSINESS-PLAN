/**
 * ============================================================
 * AFRIGREEN24
 * ACTIVATION BP STANDARD -> BP BANCABLE
 * ============================================================
 *
 * Pack 4.1
 * Validation manuelle du paiement Selar.
 *
 * AJOUT DOCUMENTS :
 * - conservation de agBridge ;
 * - stockage dans META ;
 * - propagation dans le lien Bancable ;
 * - compatibilité avec les anciens dossiers déjà actifs.
 * ============================================================
 */


const BPB_ACTIVATION_CONFIG =
  Object.freeze({

    PAGE:
      'bancable',

    STATUT_ATTENTE:
      'ATTENTE_ACTIVATION',

    STATUT_ACTIF:
      'ACCES_BANCABLE_ACTIF',

    PRIX_EUR:
      0,

    NOM_EXPEDITEUR:
      'AfriGreen24',

    CLE_URL_WEB_APP:
      'AFRIGREEN24_BPB_WEB_APP_EXEC_URL',

    URL_WEB_APP_CANONIQUE:
      'https://script.google.com/macros/s/AKfycbylpvmb6Cao-Sog2VYdwH9G8PrINOgBCdWFW--49dmT5L_M8efZnd-UQOe9oCXq_J2R/exec'

  });


/**
 * ============================================================
 * STANDARD -> TRANSITION BANCABLE
 * ============================================================
 *
 * Appelée automatiquement depuis la page de résultat
 * du Business Plan Standard.
 *
 * agBridge permet de conserver la connexion avec
 * la bibliothèque Documents du Dashboard AfriGreen24.
 * ============================================================
 */

function preparerTransitionBusinessPlanBancable(
  dossierStandardId,
  reponsesStandard,
  agBridge,
  importContextId
){

  AG24_SEC_assertPayloadSize_(
    reponsesStandard || {},
    AG24_SECURITY.STANDARD_MAX_PAYLOAD_BYTES,
    'Transition Business Plan complet'
  );

  AG24_SEC_assertRateLimit_(
    'business-plan-unified-transition',
    reponsesStandard && reponsesStandard.email
      ? reponsesStandard.email
      : dossierStandardId,
    12,
    900
  );

  const source =
    reponsesStandard &&
    typeof reponsesStandard === 'object'
      ? reponsesStandard
      : {};

  const bridge =
    String(
      agBridge || ''
    ).trim();

  const id =
    BPB_ACT_normaliserOuCreerId_(
      dossierStandardId
    );

  /*
   * Le socle initial reste la source canonique.
   * L'ancien moteur Bancable devient la couche d'approfondissement
   * du Business Plan unique : aucun paiement n'est requis.
   */
  enregistrerReponsesStandardPourBancable(
    id,
    source
  );

  var importAttachment = {
    succes:true,
    contexteImport:false,
    champsPrefilles:0,
    champs:[]
  };

  // Si l'utilisateur a quitté la page d'import, le navigateur peut avoir
  // perdu l'identifiant temporaire. On récupère alors le dernier contexte
  // valide associé à l'adresse e-mail du dossier standard.
  if (!String(importContextId || '').trim() &&
      typeof AG24_IMPORT_CONTEXT_findForEmail_ === 'function') {
    importContextId = AG24_IMPORT_CONTEXT_findForEmail_(source.email || '');
  }

  if (
    String(
      importContextId || ''
    ).trim()
  ) {
    importAttachment =
      BPB_enregistrerContexteImportPourBancable(
        id,
        String(
          importContextId || ''
        ).trim()
      );
  }

  const email =
    BPB_ACT_normaliserEmail_(
      source.email || ''
    );

  BPB_avecVerrou_(
    function(){

      const meta =
        BPB_lireJsonChunked_(
          BPB_cle_(
            id,
            'META'
          )
        ) || {};

      const bridgeFinal =
        bridge ||
        String(
          meta.agBridge || ''
        ).trim();

      BPB_ecrireJsonChunked_(
        BPB_cle_(
          id,
          'META'
        ),
        Object.assign(
          {},
          meta,
          {
            dossierId: id,
            dossierStandardId: id,
            source: 'BUSINESS_PLAN_UNIFIED',
            offre: 'UNIQUE_INCLUSE',
            prixAfficheEUR: 0,
            emailClient:
              email ||
              String(
                meta.emailClient || ''
              ).trim().toLowerCase(),
            nomProjet:
              String(
                source.nomProjet ||
                source.projectName ||
                meta.nomProjet ||
                ''
              ).trim(),
            agBridge: bridgeFinal,
            modifieLe:
              new Date().toISOString()
          }
        )
      );
    }
  );

  const activation =
    BPB_ACT_activerDossier_(
      id,
      email,
      {
        mode:
          'BUSINESS_PLAN_UNIQUE_INCLUS',
        paiementRequis:
          false,
        valideLe:
          new Date().toISOString()
      }
    );

  AG24_AUDIT_event_(
    'BUSINESS_PLAN_UNIFIED_ACCESS_ISSUED',
    {
      dossierId:
        id,
      existingAccess:
        activation.dejaActif === true,
      importedDocumentContext:
        importAttachment.contexteImport === true,
      importedPrefillCount:
        Number(
          importAttachment.champsPrefilles || 0
        )
    }
  );

  return {
    succes:
      true,
    dossierId:
      id,
    statut:
      BPB_ACTIVATION_CONFIG
        .STATUT_ACTIF,
    accesBancable:
      'ACTIF',
    agBridge:
      bridge,
    lienBancable:
      activation.lienBancable,
    paiementRequis:
      false,
    contexteImport:
      importAttachment.contexteImport === true,
    champsImportes:
      importAttachment.champs || [],
    message:
      importAttachment.contexteImport === true
        ? 'Le document importé a été repris comme source canonique. Seules les informations réellement manquantes seront demandées.'
        : 'L’analyse approfondie et la préparation au financement sont incluses dans votre Business Plan AfriGreen24.'
  };

}


/**
 * ============================================================
 * ACTIVATION MANUELLE
 * ============================================================
 *
 * Active un dossier après vérification manuelle dans Selar.
 *
 * Les détails du paiement sont optionnels pour conserver
 * la compatibilité avec les anciens appels.
 * ============================================================
 */

function activerBusinessPlanBancableManuellement_(
  dossierStandardId,
  emailClient,
  detailsPaiement
){

  const id =
    BPB_normaliserDossierId_(
      dossierStandardId
    );


  const standard =
    BPB_chargerReponsesStandard_(
      id
    );


  const email =
    BPB_ACT_normaliserEmail_(

      emailClient

      ||

      standard.email

      ||

      ''

    );


  const details =

    detailsPaiement &&
    typeof detailsPaiement ===
    'object'

      ?

      detailsPaiement

      :

      {};


  const maintenant =
    new Date()
      .toISOString();


  if(
    !BPB_ACT_emailValide_(
      email
    )
  ){

    throw new Error(
      'Une adresse email client valide est obligatoire pour activer le dossier.'
    );

  }


  const resultat =
    BPB_ACT_activerDossier_(

      id,

      email,

      {

        statut:
          'VALIDE_MANUELLEMENT',

        montant:
          Number(
            details.montant
          )

          ||

          BPB_ACTIVATION_CONFIG
            .PRIX_EUR,

        devise:
          String(
            details.devise ||
            'EUR'
          )
          .trim()
          .toUpperCase(),

        paymentRef:
          String(
            details.paymentRef ||
            ''
          )
          .trim(),

        orderId:
          String(
            details.orderId ||
            ''
          )
          .trim(),

        valideLe:
          String(
            details.valideLe ||
            maintenant
          ),

        validePar:
          String(

            details.validePar

            ||

            Session
              .getEffectiveUser()
              .getEmail()

            ||

            'ADMIN_AFRIGREEN24'

          )

      }

    );


  let emailEnvoye =
    false;


  let emailEnvoyeLe =
    '';


  let erreurEmail =
    '';


  const metaActuelle =
    BPB_lireJsonChunked_(
      BPB_cle_(
        id,
        'META'
      )
    )
    ||
    {};


  if(
    metaActuelle
      .emailAccesEnvoyeLe
  ){

    emailEnvoye =
      true;


    emailEnvoyeLe =
      metaActuelle
        .emailAccesEnvoyeLe;

  }
  else{

    try{

      BPB_ACT_envoyerEmailAcces_(

        standard,

        email,

        resultat.lienBancable

      );


      emailEnvoye =
        true;


      emailEnvoyeLe =
        new Date()
          .toISOString();


      BPB_avecVerrou_(
        function(){

          const meta =
            BPB_lireJsonChunked_(
              BPB_cle_(
                id,
                'META'
              )
            )
            ||
            {};


          BPB_ecrireJsonChunked_(

            BPB_cle_(
              id,
              'META'
            ),

            Object.assign(
              {},
              meta,
              {

                emailAccesEnvoyeLe:
                  emailEnvoyeLe,

                erreurDernierEmail:
                  '',

                modifieLe:
                  new Date()
                    .toISOString()

              }
            )

          );

        }
      );

    }
    catch(erreur){

      erreurEmail =

        erreur &&
        erreur.message

          ?

          erreur.message

          :

          String(
            erreur
          );


      BPB_avecVerrou_(
        function(){

          const meta =
            BPB_lireJsonChunked_(
              BPB_cle_(
                id,
                'META'
              )
            )
            ||
            {};


          BPB_ecrireJsonChunked_(

            BPB_cle_(
              id,
              'META'
            ),

            Object.assign(
              {},
              meta,
              {

                erreurDernierEmail:
                  erreurEmail,

                modifieLe:
                  new Date()
                    .toISOString()

              }
            )

          );

        }
      );


      console.error(
        'Accès activé, mais email non envoyé :',
        erreur
      );

    }

  }


  return {

    succes:
      true,

    dossierId:
      id,

    emailClient:
      email,

    statut:
      BPB_ACTIVATION_CONFIG
        .STATUT_ACTIF,

    lienBancable:
      resultat.lienBancable,

    dejaActif:
      resultat.dejaActif,

    emailEnvoye:
      emailEnvoye,

    emailEnvoyeLe:
      emailEnvoyeLe,

    erreurEmail:
      erreurEmail,

    messageEmail:
      BPB_ACT_construireMessageClient_(

        standard,

        resultat.lienBancable

      )

  };

}


/**
 * ============================================================
 * DESACTIVATION
 * ============================================================
 */

function desactiverBusinessPlanBancableManuellement_(
  dossierId,
  motif
){

  const id =
    BPB_normaliserDossierId_(
      dossierId
    );


  BPB_avecVerrou_(
    function(){

      const meta =
        BPB_lireJsonChunked_(
          BPB_cle_(
            id,
            'META'
          )
        )
        ||
        {};


      BPB_ecrireJsonChunked_(

        BPB_cle_(
          id,
          'META'
        ),

        Object.assign(
          {},
          meta,
          {

            statut:
              'ACCES_BANCABLE_DESACTIVE',

            accesBancable:
              'INACTIF',

            motifDesactivation:
              String(
                motif || ''
              )
              .trim(),

            jetonEmpreinte:
              '',

            lienBancable:
              '',

            modifieLe:
              new Date()
                .toISOString()

          }
        )

      );

    }
  );


  return {

    succes:
      true,

    dossierId:
      id,

    statut:
      'ACCES_BANCABLE_DESACTIVE'

  };

}


/**
 * ============================================================
 * STATUT TRANSITION
 * ============================================================
 */

function obtenirStatutTransitionBusinessPlanBancable(
  dossierId
){

  const id =
    BPB_normaliserDossierId_(
      dossierId
    );

  AG24_SEC_assertRateLimit_(
    'bancable-transition-status',
    id,
    30,
    900
  );

  const meta =
    BPB_lireJsonChunked_(
      BPB_cle_(
        id,
        'META'
      )
    )
    ||
    {};

  return {
    succes: true,
    dossierId: id,
    statut: meta.statut || 'INCONNU',
    accesBancable: meta.accesBancable || 'INACTIF',
    activeLe: meta.activeLe || null
  };

}


/**
 * ============================================================
 * ROUTER
 * ============================================================
 *
 * À appeler tout en haut du doGet(e) :
 *
 * const pageBancable =
 *   routerBusinessPlanBancable(e);
 *
 * if(pageBancable){
 *   return pageBancable;
 * }
 * ============================================================
 */

function routerBusinessPlanBancable(
  e
){

  const p =
    e &&
    e.parameter

      ?

      e.parameter

      :

      {};


  if(
    String(
      p.page || ''
    )
    .toLowerCase()

    !==

    BPB_ACTIVATION_CONFIG
      .PAGE
  ){

    return null;

  }


  /*
   * agBridge reste dans l'URL.
   *
   * BusinessPlanBancableUI.html pourra
   * donc le récupérer avec :
   *
   * google.script.url.getLocation(...)
   */

  return ouvrirInterfaceBusinessPlanBancable(

    p.dossierId,

    p.access

  );

}


/**
 * ============================================================
 * VERIFICATION ACCES
 * ============================================================
 */

function BPB_ACT_estAccesAutoriseMeta_(
  meta,
  jeton
){

  const source =
    meta &&
    typeof meta ===
      'object'
      ? meta
      : {};


  const token =
    String(
      jeton || ''
    )
    .trim();


  const empreinte =
    String(
      source.jetonEmpreinte || ''
    )
    .trim();


  /*
   * Séparation stricte des responsabilités :
   * - accesBancable = état d'autorisation ;
   * - statut = état du workflow (questionnaire, audit, génération...).
   *
   * Le workflow ne doit jamais invalider un lien d'accès encore actif.
   */
  return (
    source.accesBancable ===
      'ACTIF'
    &&
    Boolean(token)
    &&
    Boolean(empreinte)
    &&
    empreinte ===
      BPB_ACT_empreinte_(
        token
      )
  );

}


function BPB_ACT_verifierAcces_(
  dossierId,
  jeton
){

  const id =
    BPB_normaliserDossierId_(
      dossierId
    );


  const meta =
    BPB_lireJsonChunked_(
      BPB_cle_(
        id,
        'META'
      )
    )
    ||
    {};


  if(
    !BPB_ACT_estAccesAutoriseMeta_(
      meta,
      jeton
    )
  ){

    throw new Error(
      "Accès non autorisé. Le lien personnel du Business Plan est invalide ou n’est plus actif."
    );

  }


  return meta;

}


/**
 * ============================================================
 * ACTIVATION INTERNE
 * ============================================================
 */

function BPB_ACT_activerDossier_(
  id,
  email,
  paiement
){

  const maintenant =
    new Date()
      .toISOString();


  let lienExistant =
    '';


  let dejaActif =
    false;


  BPB_avecVerrou_(
    function(){

      const meta =
        BPB_lireJsonChunked_(
          BPB_cle_(
            id,
            'META'
          )
        )
        ||
        {};


      const bridge =
        String(
          meta.agBridge ||
          ''
        )
        .trim();


      /*
       * ========================================================
       * DOSSIER DEJA ACTIF
       * ========================================================
       */

      if(

        meta.accesBancable ===
        'ACTIF'

        &&

        meta.jetonEmpreinte

        &&

        meta.lienBancable

      ){

        lienExistant =
          String(
            meta.lienBancable
          )
          .trim();

        let lienDoitEtreMisAJour =
          false;

        /*
         * Un ancien dossier peut contenir un lien émis par un ancien
         * déploiement Apps Script. On conserve son jeton d'accès mais on
         * rebascule systématiquement sa base vers le déploiement canonique.
         */
        const lienCanonique =
          BPB_ACT_rebaseLienBancable_(
            lienExistant,
            BPB_ACT_obtenirUrlWebAppPublique_()
          );

        if(
          lienCanonique &&
          lienCanonique !==
            lienExistant
        ){
          lienExistant =
            lienCanonique;

          lienDoitEtreMisAJour =
            true;

          if(
            typeof AG24_AUDIT_event_ ===
            'function'
          ){
            try{
              AG24_AUDIT_event_(
                'BANCABLE_EXISTING_LINK_CANONICALIZED',
                {
                  dossierId:id
                }
              );
            }catch(auditError){}
          }
        }


        /*
         * Ancien dossier actif :
         * si un bridge vient maintenant d'être enregistré
         * mais que l'ancien lien ne contient pas encore
         * agBridge, on l'ajoute au lien existant.
         */

        if(
          bridge &&
          lienExistant.indexOf(
            'agBridge='
          ) === -1
        ){

          lienExistant +=

            (
              lienExistant.indexOf('?') ===
              -1

                ?

                '?'

                :

                '&'
            )

            +

            'agBridge='

            +

            encodeURIComponent(
              bridge
            );

          lienDoitEtreMisAJour =
            true;

        }


        if(
          lienDoitEtreMisAJour
        ){

          BPB_ecrireJsonChunked_(

            BPB_cle_(
              id,
              'META'
            ),

            Object.assign(
              {},
              meta,
              {

                lienBancable:
                  lienExistant,

                modifieLe:
                  maintenant

              }
            )

          );

        }


        dejaActif =
          true;


        return;

      }


      /*
       * ========================================================
       * NOUVELLE ACTIVATION
       * ========================================================
       */

      const jeton =

        Utilities
          .getUuid()
          .replace(
            /-/g,
            ''
          )

        +

        Utilities
          .getUuid()
          .replace(
            /-/g,
            ''
          );


      const empreinte =
        BPB_ACT_empreinte_(
          jeton
        );


      const urlBase =
        BPB_ACT_obtenirUrlWebAppPublique_();


      /*
       * Création du lien Bancable.
       */

      let lien =

        urlBase

        +

        '?page='

        +

        encodeURIComponent(
          BPB_ACTIVATION_CONFIG
            .PAGE
        )

        +

        '&dossierId='

        +

        encodeURIComponent(
          id
        )

        +

        '&access='

        +

        encodeURIComponent(
          jeton
        );


      /*
       * Ajout du bridge Documents.
       */

      if(
        bridge
      ){

        lien +=

          '&agBridge='

          +

          encodeURIComponent(
            bridge
          );

      }


      BPB_ecrireJsonChunked_(

        BPB_cle_(
          id,
          'META'
        ),

        Object.assign(
          {},
          meta,
          {

            dossierId:
              id,

            dossierStandardId:
              id,

            source:
              'BUSINESS_PLAN_STANDARD',

            statut:
              BPB_ACTIVATION_CONFIG
                .STATUT_ACTIF,

            accesBancable:
              'ACTIF',

            paiement:
              Object.assign(
                {},
                paiement ||
                {},
                {

                  valideLe:

                    paiement &&
                    paiement.valideLe

                      ?

                      paiement.valideLe

                      :

                      maintenant

                }
              ),

            emailClient:
              email,

            jetonEmpreinte:
              empreinte,

            lienBancable:
              lien,

            /*
             * On conserve explicitement
             * le bridge.
             */

            agBridge:
              bridge,

            activeLe:
              meta.activeLe ||
              maintenant,

            modifieLe:
              maintenant

          }
        )

      );


      lienExistant =
        lien;

    }
  );


  return {

    succes:
      true,

    lienBancable:
      lienExistant,

    dejaActif:
      dejaActif

  };

}


/**
 * Rebase un ancien lien Bancable vers le déploiement canonique
 * sans modifier le dossierId, le jeton d'accès ni les autres paramètres.
 * Fonction pure et déterministe : aucune lecture/écriture de stockage.
 */
function BPB_ACT_rebaseLienBancable_(
  lienExistant,
  urlCanonique
){

  const lien =
    String(
      lienExistant ||
      ''
    )
    .trim();

  const canonical =
    String(
      urlCanonique ||
      ''
    )
    .trim();

  if(
    !lien ||
    !canonical
  ){
    return lien;
  }

  const indexQuery =
    lien.indexOf('?');

  if(
    indexQuery === -1
  ){
    return lien;
  }

  const query =
    lien.slice(
      indexQuery + 1
    );

  if(
    !/(^|&)page=bancable(&|$)/
      .test(query) ||
    !/(^|&)dossierId=[^&]+/
      .test(query) ||
    !/(^|&)access=[^&]+/
      .test(query)
  ){
    return lien;
  }

  return canonical + '?' + query;

}


function AG24_BANCABLE_ACCESS_LIFECYCLE_SYSTEM_TEST_V1(){

  const sampleAccess =
    'AG24_ACCESS_TEST_' + 'TOKEN';

  const empreinte =
    BPB_ACT_empreinte_(
      sampleAccess
    );

  const workflowStatuses = [
    BPB_ACTIVATION_CONFIG.STATUT_ACTIF,
    'QUESTIONNAIRE_EN_COURS',
    'CORRECTIONS_REQUISES',
    'AUDIT_VALIDE_EN_ATTENTE_CONFIRMATION',
    'PRET_POUR_GENERATION',
    'VALIDATION_FINALE_ENREGISTREE',
    'FINANCEUR_GENERE'
  ];

  const workflowStatusIndependent =
    workflowStatuses.every(
      function(statut){
        return BPB_ACT_estAccesAutoriseMeta_(
          {
            statut:statut,
            accesBancable:'ACTIF',
            jetonEmpreinte:empreinte
          },
          sampleAccess
        ) === true;
      }
    );

  const inactiveRejected =
    BPB_ACT_estAccesAutoriseMeta_(
      {
        statut:'QUESTIONNAIRE_EN_COURS',
        accesBancable:'INACTIF',
        jetonEmpreinte:empreinte
      },
      sampleAccess
    ) === false;

  const wrongTokenRejected =
    BPB_ACT_estAccesAutoriseMeta_(
      {
        statut:'QUESTIONNAIRE_EN_COURS',
        accesBancable:'ACTIF',
        jetonEmpreinte:empreinte
      },
      'WRONG_TOKEN'
    ) === false;

  const success =
    workflowStatusIndependent &&
    inactiveRejected &&
    wrongTokenRejected;

  const report = {
    success:success,
    workflowStatusIndependent:
      workflowStatusIndependent,
    inactiveRejected:
      inactiveRejected,
    wrongTokenRejected:
      wrongTokenRejected
  };

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;

}


function AG24_BANCABLE_CANONICAL_LINK_SYSTEM_TEST_V1(){

  const canonical =
    BPB_ACTIVATION_CONFIG
      .URL_WEB_APP_CANONIQUE;

  const legacy =
    'https://script.google.com/macros/s/LEGACY_DEPLOYMENT/exec' +
    '?page=bancable' +
    '&dossierId=BP_TEST' +
    '&access=TOKEN_TEST' +
    '&agBridge=BRIDGE_TEST';

  const repaired =
    BPB_ACT_rebaseLienBancable_(
      legacy,
      canonical
    );

  const success =
    repaired.indexOf(
      canonical + '?page=bancable'
    ) === 0 &&
    repaired.indexOf(
      'dossierId=BP_TEST'
    ) !== -1 &&
    repaired.indexOf(
      'access=TOKEN_TEST'
    ) !== -1 &&
    repaired.indexOf(
      'agBridge=BRIDGE_TEST'
    ) !== -1;

  const report = {
    success:success,
    canonicalBasePreserved:
      repaired.indexOf(canonical) === 0,
    dossierPreserved:
      repaired.indexOf('dossierId=BP_TEST') !== -1,
    accessPreserved:
      repaired.indexOf('access=TOKEN_TEST') !== -1,
    bridgePreserved:
      repaired.indexOf('agBridge=BRIDGE_TEST') !== -1
  };

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;

}


/**
 * ============================================================
 * URL WEB APP
 * ============================================================
 */

function BPB_ACT_obtenirUrlWebAppPublique_(){

  const properties =
    PropertiesService
      .getScriptProperties();

  const canonical =
    String(
      BPB_ACTIVATION_CONFIG
        .URL_WEB_APP_CANONIQUE ||
      ''
    )
    .trim();

  if(
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/
      .test(
        canonical
      )
  ){
    throw new Error(
      'URL canonique Business Plan invalide.'
    );
  }

  const configuree =
    String(
      properties.getProperty(
        BPB_ACTIVATION_CONFIG
          .CLE_URL_WEB_APP
      ) || ''
    )
    .trim();

  /*
   * Une seule source canonique pour toutes les routes Bancable.
   * Toute ancienne Script Property est réparée avant émission du lien.
   */
  if(
    configuree !==
    canonical
  ){
    properties.setProperty(
      BPB_ACTIVATION_CONFIG
        .CLE_URL_WEB_APP,
      canonical
    );

    if(
      typeof AG24_AUDIT_event_ ===
      'function'
    ){
      try{
        AG24_AUDIT_event_(
          'BANCABLE_WEB_APP_URL_REPAIRED',
          {
            previousUrl:
              configuree || null,
            canonicalUrl:
              canonical
          }
        );
      }catch(auditError){}
    }
  }

  return canonical;

}


/**
 * ============================================================
 * EMAIL ACCES
 * ============================================================
 */

function BPB_ACT_envoyerEmailAcces_(
  standard,
  email,
  lien
){

  const nom =
    String(

      standard.nomPromoteur

      ||

      standard.promoterName

      ||

      ''

    )
    .trim();


  const projet =
    String(

      standard.nomProjet

      ||

      standard.projectName

      ||

      'votre projet'

    )
    .trim();


  const sujet =
    'Votre accès Business Plan Bancable AfriGreen24 est actif';


  const texte =
    BPB_ACT_construireMessageClient_(

      standard,

      lien

    );


  const html = [

    '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#173f30;line-height:1.65">',

    '<div style="padding:24px;border:1px solid #dcebe1;border-radius:18px;background:#f8fcf9">',

    '<p style="margin-top:0">Bonjour'

      +

      (
        nom

          ?

          ' ' +
          BPB_ACT_echapperHtml_(
            nom
          )

          :

          ''
      )

      +

      ',</p>',

    '<h2 style="color:#0b6b3a;margin:0 0 14px">Votre accès Bancable est actif</h2>',

    '<p>Votre paiement a été confirmé et le dossier <strong>'

      +

      BPB_ACT_echapperHtml_(
        projet
      )

      +

      '</strong> est prêt à être renforcé pour les financeurs.</p>',

    '<p>Vous ne recommencez pas le Business Plan Standard. Vous complétez uniquement les informations nécessaires à l’analyse bancaire.</p>',

    '<p style="margin:26px 0">',

    '<a href="'

      +

      BPB_ACT_echapperHtml_(
        lien
      )

      +

      '" style="display:inline-block;padding:14px 22px;background:#0b6b3a;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Continuer mon Business Plan Bancable</a>',

    '</p>',

    '<p style="font-size:13px;color:#667085">Ce lien est personnel. Ne le partagez pas.</p>',

    '<p style="margin-bottom:0">Cordialement,<br>L’équipe AfriGreen24</p>',

    '</div></div>'

  ]
  .join(
    ''
  );


  MailApp.sendEmail(

    email,

    sujet,

    texte,

    {

      name:
        BPB_ACTIVATION_CONFIG
          .NOM_EXPEDITEUR,

      htmlBody:
        html

    }

  );

}


/**
 * ============================================================
 * HASH TOKEN
 * ============================================================
 */

function BPB_ACT_empreinte_(
  texte
){

  const octets =
    Utilities.computeDigest(

      Utilities
        .DigestAlgorithm
        .SHA_256,

      String(
        texte || ''
      ),

      Utilities
        .Charset
        .UTF_8

    );


  return octets.map(
    function(b){

      const n =
        b < 0

          ?

          b + 256

          :

          b;


      return (
        '0' +
        n.toString(
          16
        )
      )
      .slice(
        -2
      );

    }
  )
  .join(
    ''
  );

}


/**
 * ============================================================
 * DOSSIER ID
 * ============================================================
 */

function BPB_ACT_normaliserOuCreerId_(
  idPropose
){

  let id =
    String(
      idPropose || ''
    )
    .trim();


  if(
    !id
  ){

    id =

      'BP_STD_'

      +

      Utilities
        .getUuid()
        .replace(
          /-/g,
          ''
        )
        .slice(
          0,
          20
        )
        .toUpperCase();

  }


  return BPB_normaliserDossierId_(
    id
  );

}


/**
 * ============================================================
 * EMAIL HELPERS
 * ============================================================
 */

function BPB_ACT_normaliserEmail_(
  email
){

  return String(
    email || ''
  )
  .trim()
  .toLowerCase();

}


function BPB_ACT_emailValide_(
  email
){

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      String(
        email || ''
      )
    );

}


/**
 * ============================================================
 * MESSAGE CLIENT
 * ============================================================
 */

function BPB_ACT_construireMessageClient_(
  standard,
  lien
){

  const nom =
    String(

      standard.nomPromoteur

      ||

      standard.promoterName

      ||

      ''

    )
    .trim();


  const projet =
    String(

      standard.nomProjet

      ||

      standard.projectName

      ||

      'votre projet'

    )
    .trim();


  return [

    'Bonjour' +
    (
      nom
        ?
        ' ' + nom
        :
        ''
    )
    +
    ',',

    '',

    'Votre paiement a bien été confirmé.',

    'Votre Business Plan Standard pour « '
      +
      projet
      +
      ' » a été repris et votre accès au Business Plan Bancable est maintenant actif.',

    '',

    'Continuer mon Business Plan Bancable :',

    lien,

    '',

    'Vous devrez uniquement compléter les informations nécessaires à l’analyse bancaire.',

    '',

    'Cordialement,',

    'L’équipe AfriGreen24'

  ]
  .join(
    '\n'
  );

}


/**
 * ============================================================
 * HTML ESCAPE
 * ============================================================
 */

function BPB_ACT_echapperHtml_(
  texte
){

  return String(
    texte || ''
  )

  .replace(
    /&/g,
    '&amp;'
  )

  .replace(
    /</g,
    '&lt;'
  )

  .replace(
    />/g,
    '&gt;'
  )

  .replace(
    /"/g,
    '&quot;'
  )

  .replace(
    /'/g,
    '&#039;'
  );

}
