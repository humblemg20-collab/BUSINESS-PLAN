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
      5,

    NOM_EXPEDITEUR:
      'AfriGreen24',

    CLE_URL_WEB_APP:
      'AFRIGREEN24_BPB_WEB_APP_EXEC_URL'

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
  agBridge
){

  AG24_SEC_assertPayloadSize_(
    reponsesStandard || {},
    AG24_SECURITY.STANDARD_MAX_PAYLOAD_BYTES,
    'Transition Business Plan Bancable'
  );

  AG24_SEC_assertRateLimit_(
    'bancable-transition',
    reponsesStandard && reponsesStandard.email
      ? reponsesStandard.email
      : dossierStandardId,
    12,
    900
  );

  const source =

    reponsesStandard &&
    typeof reponsesStandard ===
    'object'

      ?

      reponsesStandard

      :

      {};


  const bridge =
    String(
      agBridge || ''
    )
    .trim();


  const id =
    BPB_ACT_normaliserOuCreerId_(
      dossierStandardId
    );


  /*
   * Sauvegarde des réponses Standard
   * qui seront réutilisées dans le Bancable.
   */

  enregistrerReponsesStandardPourBancable(
    id,
    source
  );


  let statutFinal =
    BPB_ACTIVATION_CONFIG
      .STATUT_ATTENTE;


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


      const accesDejaActif =

        meta.statut ===
        BPB_ACTIVATION_CONFIG
          .STATUT_ACTIF

        &&

        meta.accesBancable ===
        'ACTIF';


      statutFinal =

        accesDejaActif

          ?

          BPB_ACTIVATION_CONFIG
            .STATUT_ACTIF

          :

          BPB_ACTIVATION_CONFIG
            .STATUT_ATTENTE;


      /*
       * IMPORTANT :
       *
       * Si le nouveau parcours apporte un bridge,
       * on le conserve.
       *
       * Sinon on garde celui éventuellement déjà
       * enregistré sur le dossier.
       */

      const bridgeFinal =
        bridge

        ||

        String(
          meta.agBridge || ''
        )
        .trim();


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
              statutFinal,

            prixAfficheEUR:
              BPB_ACTIVATION_CONFIG
                .PRIX_EUR,

            emailClient:
              String(

                source.email

                ||

                meta.emailClient

                ||

                ''

              )
              .trim()
              .toLowerCase(),

            nomProjet:
              String(

                source.nomProjet

                ||

                source.projectName

                ||

                meta.nomProjet

                ||

                ''

              )
              .trim(),

            /*
             * Bridge Documents AfriGreen24.
             */

            agBridge:
              bridgeFinal,

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
      statutFinal,

    agBridge:
      bridge,

    message:

      statutFinal ===
      BPB_ACTIVATION_CONFIG
        .STATUT_ACTIF

        ?

        'L’accès Business Plan Bancable est déjà actif.'

        :

        'Dossier Standard enregistré en attente de vérification du paiement.'

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


  const actif =

    meta.statut ===
    BPB_ACTIVATION_CONFIG
      .STATUT_ACTIF

    &&

    meta.accesBancable ===
    'ACTIF';


  const jetonValide =

    Boolean(
      jeton
    )

    &&

    meta.jetonEmpreinte ===
    BPB_ACT_empreinte_(
      String(
        jeton
      )
    );


  if(
    !actif ||
    !jetonValide
  ){

    throw new Error(
      "Accès non autorisé. Le paiement doit être confirmé avant l'ouverture du Business Plan Bancable."
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

        meta.statut ===
        BPB_ACTIVATION_CONFIG
          .STATUT_ACTIF

        &&

        meta.accesBancable ===
        'ACTIF'

        &&

        meta.lienBancable

      ){

        lienExistant =
          String(
            meta.lienBancable
          )
          .trim();


        /*
         * Ancien dossier actif :
         *
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
 * ============================================================
 * URL WEB APP
 * ============================================================
 */

function BPB_ACT_obtenirUrlWebAppPublique_(){

  const properties =
    PropertiesService
      .getScriptProperties();


  const configuree =
    String(

      properties.getProperty(
        BPB_ACTIVATION_CONFIG
          .CLE_URL_WEB_APP
      )

      ||

      ''

    )
    .trim();


  if(
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/
      .test(
        configuree
      )
  ){

    return configuree;

  }


  const urlService =
    String(
      ScriptApp
        .getService()
        .getUrl()

      ||

      ''
    )
    .trim();


  if(
    /\/exec$/
      .test(
        urlService
      )
  ){

    return urlService;

  }


  throw new Error(
    'URL publique /exec absente. Collez-la dans ConfigurationPaiementManuel.gs puis exécutez installerPaiementManuelBancable().'
  );

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