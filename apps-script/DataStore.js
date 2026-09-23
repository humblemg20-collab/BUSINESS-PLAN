/**
 * ============================================================
 * AFRIGREEN24 — DATA STORE COMPLET
 * Fichier : DataStore.gs
 * ============================================================
 * Enregistre les soumissions dans le Google Sheets AfriGreen24
 * et conserve exactement les colonnes attendues par Dashboard.gs.
 */

var AFRIGREEN24_SHEET_ID =
  "1VDR6hwhc3dZHLIviNXKkErNma30_ZiypDtB10fp9UpE";

var AFRIGREEN24_SHEET_NAME = "Soumissions";


/**
 * Enregistre une soumission et son profil commercial.
 *
 * @param {Object} data Données du questionnaire.
 * @param {Object} liens Liens du Google Doc et du PDF.
 * @param {Object} profilCommercial Analyse commerciale.
 * @return {Object} Résultat de l'enregistrement.
 */
function enregistrerSoumission_(data, liens, profilCommercial) {
  data = data || {};
  liens = liens || {};
  profilCommercial = profilCommercial || {};

  var classeur = SpreadsheetApp.openById(
    AFRIGREEN24_SHEET_ID
  );

  if (!classeur) {
    throw new Error(
      "Impossible d'ouvrir le Google Sheets AfriGreen24."
    );
  }

  var feuille = classeur.getSheetByName(
    AFRIGREEN24_SHEET_NAME
  );

  if (!feuille) {
    feuille = classeur.insertSheet(
      AFRIGREEN24_SHEET_NAME
    );
  }

  initialiserFeuilleSoumissions(feuille);

  var dateSoumission = new Date();
  var identifiant = creerIdentifiantSoumission();

  var nomPorteur = datastorePremiereValeur_(
    data.promoterName,
    data.nom,
    data.porteurProjet,
    data.nomPorteur,
    data.fullName,
    "Entrepreneur"
  );

  var email = datastorePremiereValeur_(
    data.email,
    data.userEmail,
    data.contactEmail,
    data.adresseEmail,
    ""
  );

  var telephone = datastorePremiereValeur_(
    data.phone,
    data.telephone,
    data.whatsapp,
    data.phoneNumber,
    ""
  );

  var nomProjet = datastorePremiereValeur_(
    data.projectName,
    data.nomProjet,
    data.projet,
    data.titreProjet,
    "Projet sans nom"
  );

  var pays = datastorePremiereValeur_(
    data.country,
    data.pays,
    data.projectCountry,
    ""
  );

  var secteur = datastorePremiereValeur_(
    data.sector,
    data.secteur,
    data.activitySector,
    ""
  );

  var stade = datastorePremiereValeur_(
    data.stage,
    data.stade,
    data.projectStage,
    ""
  );

  var probleme = datastorePremiereValeur_(
    data.problem,
    data.probleme,
    data.projectProblem,
    ""
  );

  var solution = datastorePremiereValeur_(
    data.solution,
    data.projectSolution,
    ""
  );

  var clientsCibles = datastorePremiereValeur_(
    data.targetCustomers,
    data.clientsCibles,
    data.customerSegments,
    data.targetMarket,
    ""
  );

  var modeleRevenus = datastorePremiereValeur_(
    data.revenueModel,
    data.modeleRevenus,
    data.businessModel,
    ""
  );

  var equipe = datastorePremiereValeur_(
    data.team,
    data.equipe,
    data.teamDescription,
    ""
  );

  var montantRecherche = datastorePremiereValeur_(
    data.fundingAmount,
    data.montantFinancement,
    data.montantRecherche,
    data.amountRequested,
    ""
  );

  var typeFinancement = datastorePremiereValeur_(
    data.fundingType,
    data.typeFinancement,
    data.financingType,
    ""
  );

  var utilisationFonds = datastorePremiereValeur_(
    data.useOfFunds,
    data.utilisationFonds,
    data.fundsUsage,
    ""
  );

  var documentUrl = datastorePremiereValeur_(
    liens.docUrl,
    liens.documentUrl,
    liens.url,
    liens.businessPlanLink,
    ""
  );

  var pdfUrl = datastorePremiereValeur_(
    liens.pdfUrl,
    liens.pdfLink,
    liens.businessPlanPdfLink,
    liens.lienPdf,
    liens.pdf,
    ""
  );

  var pdfDownloadUrl = datastorePremiereValeur_(
    liens.pdfDownloadUrl,
    liens.downloadUrl,
    liens.businessPlanPdfDownload,
    pdfUrl,
    ""
  );

  var scoreCommercial = datastoreValeurScore_(
    profilCommercial.scoreCommercial
  );

  var maturite = datastorePremiereValeur_(
    profilCommercial.maturite,
    ""
  );

  var segment = datastorePremiereValeur_(
    profilCommercial.segment,
    ""
  );

  var besoinPrincipal = datastorePremiereValeur_(
    profilCommercial.besoinPrincipal,
    ""
  );

  var urgence = datastorePremiereValeur_(
    profilCommercial.niveauUrgence,
    profilCommercial.urgence,
    ""
  );

  var priorite = datastorePremiereValeur_(
    profilCommercial.priorite,
    ""
  );

  var offreRecommandee = datastorePremiereValeur_(
    profilCommercial.offreRecommandee,
    ""
  );

  var prochaineAction = datastorePremiereValeur_(
    profilCommercial.actionCommerciale,
    profilCommercial.prochaineAction,
    ""
  );

  var ligne = [
    identifiant,
    dateSoumission,
    nomPorteur,
    email,
    telephone,
    nomProjet,
    pays,
    secteur,
    stade,
    probleme,
    solution,
    clientsCibles,
    modeleRevenus,
    equipe,
    montantRecherche,
    typeFinancement,
    utilisationFonds,
    documentUrl,
    pdfUrl,
    pdfDownloadUrl,
    "NOUVEAU",
    scoreCommercial,
    maturite,
    segment,
    besoinPrincipal,
    urgence,
    priorite,
    offreRecommandee,
    "",
    prochaineAction,
    "",
    datastoreJsonSecurise_(data),
    datastoreJsonSecurise_(profilCommercial)
  ];

  ligne = ligne.map(function(cellule) {
    return AG24_SEC_sheetSafe_(cellule);
  });

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);

  var prochaineLigne;

  try {
    prochaineLigne = feuille.getLastRow() + 1;

    feuille
      .getRange(
        prochaineLigne,
        1,
        1,
        ligne.length
      )
      .setValues([ligne]);

    feuille
      .getRange(prochaineLigne, 2)
      .setNumberFormat("dd/MM/yyyy HH:mm:ss");

    feuille
      .getRange(prochaineLigne, 1, 1, ligne.length)
      .setVerticalAlignment("top")
      .setWrap(true);

    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }

  AG24_AUDIT_event_('CRM_SUBMISSION_RECORDED', {
    submissionId: identifiant,
    row: prochaineLigne
  });

  return {
    success: true,
    id: identifiant,
    ligne: prochaineLigne,
    email: email,
    documentUrl: documentUrl,
    pdfUrl: pdfUrl,
    pdfDownloadUrl: pdfDownloadUrl,
    message: "Soumission enregistrée avec succès."
  };
}


/**
 * Crée et prépare l'onglet Soumissions.
 * Les intitulés correspondent exactement à Dashboard.gs.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} feuille
 */
function initialiserFeuilleSoumissions(feuille) {
  var entetes = [
    "ID SOUMISSION",
    "DATE",
    "NOM DU PORTEUR",
    "EMAIL",
    "TÉLÉPHONE / WHATSAPP",
    "NOM DU PROJET",
    "PAYS",
    "SECTEUR",
    "STADE",
    "PROBLÈME",
    "SOLUTION",
    "CLIENTS CIBLES",
    "MODÈLE DE REVENUS",
    "ÉQUIPE",
    "MONTANT RECHERCHÉ",
    "TYPE DE FINANCEMENT",
    "UTILISATION DES FONDS",
    "LIEN GOOGLE DOCS",
    "LIEN PDF",
    "LIEN TÉLÉCHARGEMENT PDF",
    "STATUT COMMERCIAL",
    "SCORE COMMERCIAL",
    "MATURITÉ",
    "SEGMENT",
    "BESOIN PRINCIPAL",
    "URGENCE",
    "PRIORITÉ",
    "OFFRE RECOMMANDÉE",
    "DERNIER CONTACT",
    "PROCHAINE ACTION",
    "COMMENTAIRES",
    "DONNÉES QUESTIONNAIRE JSON",
    "PROFIL COMMERCIAL JSON"
  ];

  if (feuille.getLastRow() === 0) {
    feuille
      .getRange(1, 1, 1, entetes.length)
      .setValues([entetes]);
  } else {
    var entetesActuelles = feuille
      .getRange(1, 1, 1, entetes.length)
      .getValues()[0];

    var correspondanceComplete = entetes.every(
      function(entete, index) {
        return entetesActuelles[index] === entete;
      }
    );

    if (!correspondanceComplete) {
      throw new Error(
        "Les colonnes de l'onglet Soumissions ne correspondent pas au format AfriGreen24 attendu. " +
        "Crée un nouvel onglet Soumissions vide ou rétablis les en-têtes officiels avant de relancer."
      );
    }
  }

  feuille.setFrozenRows(1);
  feuille.setHiddenGridlines(false);

  feuille
    .getRange(1, 1, 1, entetes.length)
    .setFontWeight("bold")
    .setBackground("#126B45")
    .setFontColor("#FFFFFF")
    .setWrap(true)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  feuille.setRowHeight(1, 42);

  var filtre = feuille.getFilter();

  if (!filtre) {
    feuille
      .getRange(
        1,
        1,
        Math.max(feuille.getLastRow(), 1),
        entetes.length
      )
      .createFilter();
  }
}


/**
 * Génère un identifiant unique.
 */
function creerIdentifiantSoumission() {
  var date = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd-HHmmss"
  );

  var suffixe = Utilities
    .getUuid()
    .substring(0, 8)
    .toUpperCase();

  return "AG24-" + date + "-" + suffixe;
}


/**
 * Retourne la première valeur non vide.
 */
function datastorePremiereValeur_() {
  for (
    var index = 0;
    index < arguments.length;
    index++
  ) {
    var valeur = arguments[index];

    if (
      valeur !== null &&
      valeur !== undefined &&
      String(valeur).trim() !== ""
    ) {
      return String(valeur).trim();
    }
  }

  return "";
}


/**
 * Sécurise une valeur de score.
 */
function datastoreValeurScore_(valeur) {
  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {
    return "";
  }

  var nombre = Number(valeur);

  return isNaN(nombre) ? valeur : nombre;
}


/**
 * Convertit un objet en JSON.
 */
function datastoreJsonSecurise_(valeur) {
  try {
    return JSON.stringify(valeur || {});
  } catch (erreur) {
    return "{}";
  }
}


/**
 * Test de la connexion Google Sheets.
 */
function testerConnexionDataStore_() {
  var classeur = SpreadsheetApp.openById(
    AFRIGREEN24_SHEET_ID
  );

  var feuille = classeur.getSheetByName(
    AFRIGREEN24_SHEET_NAME
  );

  Logger.log(
    JSON.stringify(
      {
        success: true,
        spreadsheetName: classeur.getName(),
        spreadsheetId: classeur.getId(),
        sheetFound: !!feuille,
        sheetName: feuille
          ? feuille.getName()
          : ""
      },
      null,
      2
    )
  );
}


/**
 * Test complet d'enregistrement.
 */
function testerDataStore_() {
  var resultat = enregistrerSoumission_(
    {
      promoterName: "Test AfriGreen24",
      email: "test@afrigreen24.com",
      phone: "+000000000",
      projectName: "Projet de test",
      country: "Sénégal",
      sector: "Agriculture",
      stage: "Idée",
      problem: "Problème test",
      solution: "Solution test",
      targetCustomers: "Clients test",
      revenueModel: "Vente directe",
      team: "Une personne",
      fundingAmount: "5 000 000 FCFA",
      fundingType: "Subvention",
      useOfFunds: "Développement du projet"
    },
    {
      docUrl: "https://docs.google.com/test",
      pdfUrl: "https://drive.google.com/test",
      pdfDownloadUrl:
        "https://drive.google.com/download/test"
    },
    {
      scoreCommercial: 75,
      maturite: "MATURE",
      segment: "RECHERCHE_FINANCEMENT",
      besoinPrincipal:
        "Renforcer le dossier avant financement",
      offreRecommandee:
        "PREPARATION_FINANCEMENT",
      niveauUrgence: "ELEVEE",
      priorite: "TRES_HAUTE",
      actionCommerciale:
        "CONTACTER_SOUS_24H",
      dateAnalyse: new Date().toISOString()
    }
  );

  Logger.log(
    JSON.stringify(resultat, null, 2)
  );

  return resultat;
}