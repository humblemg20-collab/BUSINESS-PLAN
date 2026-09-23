/**
 * AfriGreen24 — Paiement manuel Business Plan Bancable
 * Pack 4.1 — Selar + vérification administrative + activation client
 *
 * Budget logiciel obligatoire : 0 €
 *
 * Parcours :
 * 1. AfriGreen24 crée une référence AGP liée au dossier Standard.
 * 2. Le client paie sur Selar.
 * 3. Le client saisit son numéro de commande Selar.
 * 4. L'administrateur vérifie la commande dans Selar.
 * 5. L'administrateur exécute activerPaiementClientBancable().
 * 6. Le lien Bancable est envoyé par email et détecté par la page.
 */

const BPB_PAIEMENT_CONFIG = Object.freeze({
  VERSION: '4.1.0',
  LIEN_PRODUIT_SELAR: 'https://selar.com/l1k743881t',
  PRIX_ATTENDU: 5,
  DEVISE_ATTENDUE: 'EUR',
  DUREE_SESSION_JOURS: 7,
  PREFIXE_PAIEMENT: 'AFRIGREEN24_BPB:PAYMENT:',
  PREFIXE_DOSSIER: 'AFRIGREEN24_BPB:PAYMENT_BY_DOSSIER:',
  PREFIXE_COMMANDE: 'AFRIGREEN24_BPB:ORDER:',
  CLE_SPREADSHEET: 'AFRIGREEN24_BPB_PAYMENT_SPREADSHEET_ID',
  CLE_URL_WEB_APP: 'AFRIGREEN24_BPB_WEB_APP_EXEC_URL',
  NOM_SPREADSHEET: 'AfriGreen24 - Paiements Business Plan Bancable',
  NOM_FEUILLE: 'BPB_PAIEMENTS'
});

/**
 * Installation administrative à lancer une fois depuis l'éditeur Apps Script.
 * Utiliser le lanceur public installerPaiementManuelBancable() du fichier
 * ConfigurationPaiementManuel.gs.
 */
function installerPaiementManuelBancable_(urlWebAppExec) {
  const url = BPB_PAY_normaliserUrlExec_(urlWebAppExec);
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(BPB_PAIEMENT_CONFIG.CLE_URL_WEB_APP, url);

  const spreadsheet = BPB_PAY_obtenirOuCreerSpreadsheet_();
  BPB_PAY_preparerFeuille_(spreadsheet);

  console.log('=== AFRIGREEN24 PACK 4.1 — PAIEMENT MANUEL ===');
  console.log('URL APPLICATION WEB PUBLIQUE : ' + url);
  console.log('SPREADSHEET PAIEMENTS : ' + spreadsheet.getUrl());
  console.log('QUOTA EMAIL RESTANT : ' + MailApp.getRemainingDailyQuota());
  console.log('Aucun webhook ni abonnement Zapier n’est nécessaire.');

  return {
    succes: true,
    version: BPB_PAIEMENT_CONFIG.VERSION,
    urlWebApp: url,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    message: 'Installation du paiement manuel terminée.'
  };
}

/**
 * Crée ou reprend une session de paiement rattachée au dossier Standard.
 * Appelée par la page de résultat via google.script.run.
 */
function creerSessionPaiementBancable(dossierId, emailClient, nomClient, telephoneClient) {
  const id = BPB_normaliserDossierId_(dossierId);
  AG24_SEC_assertPaymentRequest_(id, emailClient);
  const standard = BPB_chargerReponsesStandard_(id);
  const emailFourni = BPB_PAY_normaliserEmail_(emailClient || '');
  const emailStandard = BPB_PAY_normaliserEmail_(standard.email || '');
  const email = emailFourni || emailStandard;
  const nom = String(
    nomClient || standard.nomPromoteur || standard.promoterName || 'Client AfriGreen24'
  ).trim();
  const telephone = String(
    telephoneClient || standard.telephone || standard.phone || ''
  ).trim();

  if (!BPB_PAY_emailValide_(email)) {
    throw new Error('Une adresse email valide est nécessaire avant le paiement.');
  }
  if (emailStandard && email !== emailStandard) {
    throw new Error('L’adresse email ne correspond pas au dossier Standard.');
  }

  const properties = PropertiesService.getScriptProperties();
  const maintenant = new Date();
  let session;

  BPB_avecVerrou_(function () {
    const refExistante = properties.getProperty(BPB_PAIEMENT_CONFIG.PREFIXE_DOSSIER + id);
    const existante = refExistante ? BPB_PAY_lireSession_(refExistante) : null;

    if (existante && BPB_PAY_sessionReutilisable_(existante, maintenant)) {
      session = existante;
      return;
    }

    const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    if (
      meta.statut === 'ACCES_BANCABLE_ACTIF' &&
      meta.accesBancable === 'ACTIF' &&
      meta.lienBancable
    ) {
      const refMeta = meta.paiement && meta.paiement.paymentRef
        ? String(meta.paiement.paymentRef).trim().toUpperCase()
        : '';

      session = {
        version: BPB_PAIEMENT_CONFIG.VERSION,
        paymentRef: /^AGP-[A-F0-9]{20,32}$/.test(refMeta)
          ? refMeta
          : BPB_PAY_genererReference_(),
        dossierId: id,
        emailClient: email,
        nomClient: nom,
        telephoneClient: telephone,
        montantAttendu: BPB_PAIEMENT_CONFIG.PRIX_ATTENDU,
        deviseAttendue: BPB_PAIEMENT_CONFIG.DEVISE_ATTENDUE,
        statut: 'ACCES_BANCABLE_ACTIF',
        creeLe: meta.activeLe || maintenant.toISOString(),
        expireLe: '',
        modifieLe: maintenant.toISOString(),
        orderId: meta.paiement && meta.paiement.orderId ? meta.paiement.orderId : '',
        lienBancable: meta.lienBancable,
        emailEnvoyeLe: meta.emailAccesEnvoyeLe || '',
        erreur: ''
      };

      BPB_PAY_ecrireSession_(session);
      properties.setProperty(BPB_PAIEMENT_CONFIG.PREFIXE_DOSSIER + id, session.paymentRef);
      return;
    }

    const paymentRef = BPB_PAY_genererReference_();
    const expireLe = new Date(
      maintenant.getTime() + BPB_PAIEMENT_CONFIG.DUREE_SESSION_JOURS * 86400000
    );

    session = {
      version: BPB_PAIEMENT_CONFIG.VERSION,
      paymentRef: paymentRef,
      dossierId: id,
      emailClient: email,
      nomClient: nom,
      telephoneClient: telephone,
      montantAttendu: BPB_PAIEMENT_CONFIG.PRIX_ATTENDU,
      deviseAttendue: BPB_PAIEMENT_CONFIG.DEVISE_ATTENDUE,
      statut: 'EN_ATTENTE',
      creeLe: maintenant.toISOString(),
      expireLe: expireLe.toISOString(),
      modifieLe: maintenant.toISOString(),
      orderId: '',
      declareLe: '',
      lienBancable: '',
      emailEnvoyeLe: '',
      erreur: ''
    };

    BPB_PAY_ecrireSession_(session);
    properties.setProperty(BPB_PAIEMENT_CONFIG.PREFIXE_DOSSIER + id, paymentRef);
  });

  const checkoutUrl = BPB_PAY_construireCheckout_(session, nom, email, telephone);
  BPB_PAY_journaliser_('SESSION_CREEE_OU_REPRISE', session, {
    message: 'Session Selar prête. Vérification manuelle après déclaration du client.'
  });

  return BPB_PAY_reponseSessionClient_(session, checkoutUrl);
}

/**
 * Le client déclare qu'il a payé et transmet son numéro de commande Selar.
 * Cette déclaration N'ACTIVE PAS le dossier : l'administrateur doit vérifier Selar.
 */
function declarerPaiementBancable(paymentRef, dossierId, numeroCommandeSelar, emailClient) {
  const ref = BPB_PAY_normaliserReference_(paymentRef);
  const id = BPB_normaliserDossierId_(dossierId);
  AG24_SEC_assertPaymentRequest_(id, emailClient || ref);
  const commande = BPB_PAY_normaliserCommande_(numeroCommandeSelar);
  const email = BPB_PAY_normaliserEmail_(emailClient || '');
  const session = BPB_PAY_lireSession_(ref);

  if (!session || session.dossierId !== id) {
    throw new Error('La session de paiement ne correspond pas au dossier Standard.');
  }
  if (email && session.emailClient && email !== session.emailClient) {
    throw new Error('L’adresse email ne correspond pas à la session de paiement.');
  }
  if (session.statut === 'ACCES_BANCABLE_ACTIF') {
    return BPB_PAY_reponseSessionClient_(session, '');
  }
  if (BPB_PAY_estExpiree_(session)) {
    session.statut = 'EXPIREE';
    session.modifieLe = new Date().toISOString();
    BPB_PAY_ecrireSession_(session);
    throw new Error('La session a expiré. Cliquez de nouveau sur « Payer et continuer ».');
  }

  BPB_avecVerrou_(function () {
    session.orderId = commande;
    session.statut = 'VERIFICATION_MANUELLE_DEMANDEE';
    session.declareLe = new Date().toISOString();
    session.modifieLe = session.declareLe;
    session.erreur = '';
    BPB_PAY_ecrireSession_(session);
  });

  BPB_PAY_journaliser_('VERIFICATION_MANUELLE_DEMANDEE', session, {
    message: 'Le client déclare avoir payé. Vérifier la commande dans Selar avant activation.'
  });

  return {
    succes: true,
    paymentRef: session.paymentRef,
    dossierId: session.dossierId,
    statut: session.statut,
    message: BPB_PAY_messageStatut_(session.statut),
    declareLe: session.declareLe
  };
}

/**
 * Retourne le statut à la page AfriGreen24.
 * La page peut ainsi détecter une activation faite manuellement par l'administrateur.
 */
function obtenirStatutPaiementBancable(paymentRef, dossierId) {
  const ref = BPB_PAY_normaliserReference_(paymentRef);
  const id = BPB_normaliserDossierId_(dossierId);
  AG24_SEC_assertPaymentRequest_(id, ref);
  const session = BPB_PAY_lireSession_(ref);

  if (!session || session.dossierId !== id) {
    return {
      succes: false,
      statut: 'INTROUVABLE',
      message: 'Session de paiement introuvable.'
    };
  }

  if (
    session.statut !== 'ACCES_BANCABLE_ACTIF' &&
    session.statut !== 'VERIFICATION_MANUELLE_DEMANDEE' &&
    BPB_PAY_estExpiree_(session)
  ) {
    session.statut = 'EXPIREE';
    session.modifieLe = new Date().toISOString();
    BPB_PAY_ecrireSession_(session);
  }

  return {
    succes: true,
    paymentRef: session.paymentRef,
    dossierId: session.dossierId,
    statut: session.statut,
    lienBancable: session.statut === 'ACCES_BANCABLE_ACTIF'
      ? session.lienBancable
      : '',
    emailEnvoye: Boolean(session.emailEnvoyeLe),
    message: BPB_PAY_messageStatut_(session.statut),
    modifieLe: session.modifieLe || null
  };
}

/**
 * Validation administrative après contrôle réel de la commande dans Selar.
 * Cette fonction peut être appelée par le lanceur activerPaiementClientBancable().
 */
function validerPaiementBancableManuellement_(paymentRef, numeroCommandeSelar) {
  const ref = BPB_PAY_normaliserReference_(paymentRef);
  const session = BPB_PAY_lireSession_(ref);

  if (!session) {
    throw new Error('Aucune session AfriGreen24 ne correspond à cette référence.');
  }

  const commande = BPB_PAY_normaliserCommande_(numeroCommandeSelar || session.orderId);
  const properties = PropertiesService.getScriptProperties();
  const orderKey = BPB_PAIEMENT_CONFIG.PREFIXE_COMMANDE + BPB_PAY_empreinte_(commande);

  if (session.statut === 'ACCES_BANCABLE_ACTIF' && session.lienBancable) {
    return {
      succes: true,
      dejaActif: true,
      paymentRef: session.paymentRef,
      dossierId: session.dossierId,
      statut: session.statut,
      lienBancable: session.lienBancable,
      emailEnvoye: Boolean(session.emailEnvoyeLe)
    };
  }

  if (session.orderId && session.orderId !== commande) {
    throw new Error('Le numéro de commande saisi ne correspond pas à celui déclaré par le client.');
  }

  BPB_avecVerrou_(function () {
    const commandeExistante = properties.getProperty(orderKey);
    if (commandeExistante && commandeExistante !== ref) {
      throw new Error('Cette commande Selar a déjà été utilisée pour un autre dossier.');
    }
    properties.setProperty(orderKey, ref);

    session.orderId = commande;
    session.statut = 'PAIEMENT_VALIDE_MANUELLEMENT';
    AG24_AUDIT_event_('PAYMENT_VALIDATED_MANUALLY', {
      dossierId: session.dossierId,
      paymentRef: session.paymentRef
    });
    session.valideLe = new Date().toISOString();
    session.validePar = Session.getEffectiveUser().getEmail() || 'ADMIN_AFRIGREEN24';
    session.modifieLe = session.valideLe;
    session.erreur = '';
    BPB_PAY_ecrireSession_(session);
  });

  let activation;
  try {
    activation = activerBusinessPlanBancableManuellement_(
      session.dossierId,
      session.emailClient,
      {
        paymentRef: session.paymentRef,
        orderId: commande,
        montant: session.montantAttendu,
        devise: session.deviseAttendue,
        valideLe: session.valideLe,
        validePar: session.validePar
      }
    );
  } catch (erreurActivation) {
    session.statut = 'ERREUR_ACTIVATION';
    session.erreur = erreurActivation && erreurActivation.message
      ? erreurActivation.message
      : String(erreurActivation);
    session.modifieLe = new Date().toISOString();
    BPB_PAY_ecrireSession_(session);
    BPB_PAY_journaliser_('ERREUR_ACTIVATION', session, { message: session.erreur });
    throw erreurActivation;
  }

  session.statut = 'ACCES_BANCABLE_ACTIF';
  session.lienBancable = activation.lienBancable;
  session.emailEnvoyeLe = activation.emailEnvoyeLe || '';
  session.modifieLe = new Date().toISOString();
  session.erreur = activation.erreurEmail || '';
  BPB_PAY_ecrireSession_(session);

  BPB_PAY_journaliser_('ACCES_ACTIVE_MANUELLEMENT', session, {
    message: activation.emailEnvoye
      ? 'Commande Selar vérifiée, accès activé et email envoyé.'
      : 'Commande Selar vérifiée et accès activé. Email à contrôler.'
  });

  return {
    succes: true,
    dejaActif: Boolean(activation.dejaActif),
    paymentRef: session.paymentRef,
    dossierId: session.dossierId,
    emailClient: session.emailClient,
    statut: session.statut,
    lienBancable: session.lienBancable,
    emailEnvoye: Boolean(activation.emailEnvoye),
    erreurEmail: activation.erreurEmail || '',
    message: 'Paiement vérifié manuellement. Accès Bancable activé.'
  };
}

/** Marque une déclaration comme refusée après contrôle dans Selar. */
function refuserPaiementBancableManuellement_(paymentRef, motif) {
  const ref = BPB_PAY_normaliserReference_(paymentRef);
  const session = BPB_PAY_lireSession_(ref);
  if (!session) throw new Error('Session de paiement introuvable.');
  if (session.statut === 'ACCES_BANCABLE_ACTIF') {
    throw new Error('L’accès est déjà actif. Utilisez la fonction de désactivation si nécessaire.');
  }

  session.statut = 'VERIFICATION_REFUSEE';
  AG24_AUDIT_event_('PAYMENT_REJECTED_MANUALLY', {
    dossierId: session.dossierId,
    paymentRef: session.paymentRef
  });
  session.erreur = String(motif || 'Commande Selar introuvable ou non confirmée.').trim();
  session.modifieLe = new Date().toISOString();
  BPB_PAY_ecrireSession_(session);
  BPB_PAY_journaliser_('VERIFICATION_REFUSEE', session, { message: session.erreur });

  return {
    succes: true,
    paymentRef: session.paymentRef,
    dossierId: session.dossierId,
    statut: session.statut,
    message: session.erreur
  };
}

/* =========================
 * Fonctions internes
 * ========================= */

function BPB_PAY_construireCheckout_(session, nom, email, telephone) {
  const nomAvecReference = (nom || 'Client AfriGreen24') + ' [' + session.paymentRef + ']';
  const parametres = [
    'add_to_cart=1',
    'email=' + encodeURIComponent(email),
    'fullname=' + encodeURIComponent(nomAvecReference)
  ];

  if (telephone) parametres.push('mobile=' + encodeURIComponent(telephone));
  return BPB_PAIEMENT_CONFIG.LIEN_PRODUIT_SELAR + '?' + parametres.join('&');
}

function BPB_PAY_reponseSessionClient_(session, checkoutUrl) {
  return {
    succes: true,
    paymentRef: session.paymentRef,
    dossierId: session.dossierId,
    statut: session.statut,
    checkoutUrl: checkoutUrl || '',
    lienBancable: session.statut === 'ACCES_BANCABLE_ACTIF'
      ? session.lienBancable
      : '',
    montant: session.montantAttendu,
    devise: session.deviseAttendue,
    expireLe: session.expireLe,
    message: BPB_PAY_messageStatut_(session.statut)
  };
}

function BPB_PAY_messageStatut_(statut) {
  const messages = {
    EN_ATTENTE: 'Paiement Selar en attente. Après paiement, saisissez le numéro de commande.',
    VERIFICATION_MANUELLE_DEMANDEE: 'Votre demande a été reçue. La commande Selar sera vérifiée manuellement.',
    PAIEMENT_VALIDE_MANUELLEMENT: 'Paiement vérifié. Activation de votre accès en cours.',
    ACCES_BANCABLE_ACTIF: 'Votre accès Business Plan Bancable est actif.',
    VERIFICATION_REFUSEE: 'La commande n’a pas pu être confirmée. Vérifiez le numéro transmis.',
    ERREUR_ACTIVATION: 'Paiement vérifié. Une vérification technique de l’accès est en cours.',
    EXPIREE: 'Cette session a expiré. Relancez le paiement.'
  };
  return messages[statut] || 'Statut du paiement en cours de vérification.';
}

function BPB_PAY_sessionReutilisable_(session, maintenant) {
  if (!session || !session.paymentRef) return false;
  if (session.statut === 'ACCES_BANCABLE_ACTIF') return true;
  if (
    [
      'EN_ATTENTE',
      'VERIFICATION_MANUELLE_DEMANDEE',
      'PAIEMENT_VALIDE_MANUELLEMENT',
      'VERIFICATION_REFUSEE',
      'ERREUR_ACTIVATION'
    ].indexOf(session.statut) === -1
  ) return false;

  const expiration = new Date(session.expireLe || 0);
  return Number.isFinite(expiration.getTime()) && expiration.getTime() > maintenant.getTime();
}

function BPB_PAY_estExpiree_(session) {
  const expiration = new Date(session.expireLe || 0);
  return Number.isFinite(expiration.getTime()) && expiration.getTime() <= Date.now();
}

function BPB_PAY_ecrireSession_(session) {
  PropertiesService.getScriptProperties().setProperty(
    BPB_PAIEMENT_CONFIG.PREFIXE_PAIEMENT + session.paymentRef,
    JSON.stringify(session)
  );
}

function BPB_PAY_lireSession_(paymentRef) {
  const ref = BPB_PAY_normaliserReference_(paymentRef);
  const texte = PropertiesService.getScriptProperties().getProperty(
    BPB_PAIEMENT_CONFIG.PREFIXE_PAIEMENT + ref
  );
  if (!texte) return null;
  try {
    return JSON.parse(texte);
  } catch (erreur) {
    throw new Error('Données de paiement AfriGreen24 illisibles.');
  }
}

function BPB_PAY_normaliserReference_(paymentRef) {
  const ref = String(paymentRef || '').trim().toUpperCase();
  if (!/^AGP-[A-F0-9]{20,32}$/.test(ref)) {
    throw new Error('Référence de paiement AfriGreen24 invalide.');
  }
  return ref;
}

function BPB_PAY_normaliserCommande_(numeroCommande) {
  const commande = String(numeroCommande || '').trim();
  if (commande.length < 4 || commande.length > 120) {
    throw new Error('Saisissez un numéro de commande Selar valide.');
  }
  return commande;
}

function BPB_PAY_genererReference_() {
  return 'AGP-' + Utilities.getUuid().replace(/-/g, '').slice(0, 24).toUpperCase();
}

function BPB_PAY_normaliserUrlExec_(url) {
  const propre = String(url || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(propre)) {
    throw new Error('Collez l’URL publique de l’application Web terminée par /exec dans ConfigurationPaiementManuel.gs.');
  }
  return propre.split('?')[0];
}

function BPB_PAY_normaliserEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function BPB_PAY_emailValide_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function BPB_PAY_empreinte_(texte) {
  const octets = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(texte || ''),
    Utilities.Charset.UTF_8
  );
  return octets.map(function (b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

/* =========================
 * Journal Google Sheets
 * ========================= */

function BPB_PAY_obtenirOuCreerSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const idExistant = properties.getProperty(BPB_PAIEMENT_CONFIG.CLE_SPREADSHEET);

  if (idExistant) {
    try {
      return SpreadsheetApp.openById(idExistant);
    } catch (erreur) {
      console.warn('Ancien journal de paiements inaccessible. Un nouveau sera créé.');
    }
  }

  const spreadsheet = SpreadsheetApp.create(BPB_PAIEMENT_CONFIG.NOM_SPREADSHEET);
  properties.setProperty(BPB_PAIEMENT_CONFIG.CLE_SPREADSHEET, spreadsheet.getId());
  return spreadsheet;
}

function BPB_PAY_preparerFeuille_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(BPB_PAIEMENT_CONFIG.NOM_FEUILLE);
  if (!sheet) {
    const premiere = spreadsheet.getSheets()[0];
    if (premiere && premiere.getLastRow() === 0) {
      premiere.setName(BPB_PAIEMENT_CONFIG.NOM_FEUILLE);
      sheet = premiere;
    } else {
      sheet = spreadsheet.insertSheet(BPB_PAIEMENT_CONFIG.NOM_FEUILLE);
    }
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Horodatage', 'Événement', 'Référence paiement', 'Dossier', 'Statut',
      'Commande Selar', 'Email client', 'Nom client', 'Produit',
      'Montant', 'Devise', 'Message'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.autoResizeColumns(1, 12);
  }
  return sheet;
}

function BPB_PAY_journaliser_(evenement, session, supplement) {
  try {
    const id = PropertiesService.getScriptProperties().getProperty(
      BPB_PAIEMENT_CONFIG.CLE_SPREADSHEET
    );
    if (!id) return;

    const spreadsheet = SpreadsheetApp.openById(id);
    const sheet = BPB_PAY_preparerFeuille_(spreadsheet);
    const extra = supplement || {};

    sheet.appendRow([
      new Date(),
      String(evenement || ''),
      String(session.paymentRef || ''),
      String(session.dossierId || ''),
      String(session.statut || ''),
      String(session.orderId || ''),
      String(session.emailClient || ''),
      String(session.nomClient || ''),
      'Business Plan Bancable',
      session.montantAttendu === null || session.montantAttendu === undefined
        ? ''
        : session.montantAttendu,
      String(session.deviseAttendue || ''),
      String(extra.message || session.erreur || '')
    ]);
  } catch (erreur) {
    console.warn('Journalisation du paiement impossible :', erreur);
  }
}
