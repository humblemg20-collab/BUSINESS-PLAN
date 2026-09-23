/**
 * ============================================================
 * BUSINESS_PLAN_THEME — BUSINESS PLAN GENERATOR
 * Fichier : Code.gs
 * ============================================================
 *
 * Responsabilités de ce fichier :
 *
 * 1. Afficher l'application web.
 * 2. Recevoir les réponses du questionnaire.
 * 3. Créer le Business Plan dans Google Docs.
 * 4. Utiliser BusinessWriter.gs pour rédiger les chapitres.
 * 5. Convertir automatiquement le document en PDF.
 * 6. Retourner les liens du Google Docs et du PDF.
 *
 * IMPORTANT :
 * Les fonctions redigerResumeExecutif(), redigerProbleme(),
 * redigerSolution(), etc. doivent exister dans BusinessWriter.gs.
 */


/**
 * Couleurs officielles Business Plan.
 */
var BUSINESS_PLAN_THEME = {
  vertPrincipal: "#0B6B3A",
  vertSecondaire: "#168A50",
  vertFonce: "#063C27",
  vertClair: "#E8F5EC",
  vertTresClair: "#F4FBF6",
  or: "#D2AA60",
  orClair: "#F6EEDC",
  textePrincipal: "#1F2937",
  texteSecondaire: "#4B5563",
  grisClair: "#E5E7EB",
  grisTresClair: "#F7F9F8",
  blanc: "#FFFFFF"
};


/**
 * Affiche l'interface web de l'application.
 */
function doGet(e) {

  const pageBancable =
    routerBusinessPlanBancable(e);

  if (pageBancable) {

    return pageBancable
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  }


  const page =
    e && e.parameter
      ? String(
          e.parameter.page || ''
        )
          .trim()
          .toLowerCase()
      : '';


  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(
      'Business Plan Generator'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    )
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );

}


/**
 * Permet d'inclure Style.html et Javascript.html
 * dans Index.html.
 */
function include(nomFichier) {
  return HtmlService
    .createHtmlOutputFromFile(nomFichier)
    .getContent();
}


/**
 * Fonction principale appelée depuis Javascript.html.
 *
 * @param {Object} data Réponses du questionnaire.
 * @return {Object} Résultat de la génération.
 */
function genererBusinessPlan_(data) {
  try {
    verifierDonneesGeneration_(data);

    /*
     * Pack 5.2 — HumbleOS :
     * normalisation des réponses puis génération du narratif professionnel.
     */
    var brandingClient =
      extraireBrandingBusinessPlan_(data);

    var donneesPourIA =
      construireDonneesBusinessPlanSansBranding_(data);

    var agBridge = String(data.agBridge || '').trim();

    var preparationIA =
      preparerBusinessPlanStandardIA52(donneesPourIA);

    data = preparationIA.donnees;
    data.agBridge = agBridge;

    data.logoUpload =
      brandingClient.logoUpload;

    data.organizationSlogan =
      brandingClient.slogan;
    var nomProjet = nettoyerTexte(
      data.projectName,
      "Projet entrepreneurial"
    );

    var nomDocument =
      "Business Plan - " +
      nomProjet +
      " - " +
      formaterDateFichier(new Date());

    /*
     * Création du Google Docs.
     */
    var document = DocumentApp.create(nomDocument);
    var documentId = document.getId();
    var body = document.getBody();

    /*
     * Paramètres généraux du document.
     */
    configurerDocument(body);
    configurerIdentiteDocument(
      document,
      data
    );

    /*
     * Construction du Business Plan.
     */
    ajouterPageDeCouverture(body, data);
    ajouterSommaire(body);
    ajouterSyntheseStrategique(body, data);
    ajouterResumeExecutif(body, data);
    ajouterPresentationProjet(body, data);
    ajouterAnalyseProbleme(body, data);
    ajouterSolution(body, data);
    ajouterMarche(body, data);
    ajouterModeleEconomique(body, data);
    ajouterStrategieCommerciale(body, data);
    ajouterEquipeEtOperations(body, data);
    ajouterFinancement(body, data);
    ajouterImpact(body, data);
    ajouterRisques(body, data);
    ajouterConclusion(body, data);

    ajouterPageFinale(body, data);

    /*
     * Sauvegarde complète du Google Docs.
     */
    document.saveAndClose();

    /*
     * Petite pause pour laisser Google finaliser le document
     * avant sa conversion en PDF.
     */
    Utilities.sleep(1200);

    /*
     * Récupération du fichier Google Docs.
     */
    var fichierDocument = DriveApp.getFileById(documentId);

    /*
     * Conversion en PDF.
     */
    var blobPdf = fichierDocument
      .getBlob()
      .getAs(MimeType.PDF)
      .setName(nomDocument + ".pdf");

    /*
     * Le PDF est créé dans le même dossier que le document,
     * lorsque cela est possible.
     */
    var fichierPdf = creerPdfDansMemeDossier(
      fichierDocument,
      blobPdf
    );

    var pdfId = fichierPdf.getId();

    /*
     * Liens retournés au navigateur.
     */
    var docUrl =
      "https://docs.google.com/document/d/" +
      documentId +
      "/edit";

    var pdfUrl =
      "https://drive.google.com/file/d/" +
      pdfId +
      "/view";

    var pdfDownloadUrl =
      "https://drive.google.com/uc?export=download&id=" +
      pdfId;

    /*
     * Analyse commerciale du porteur de projet.
     * Une valeur par défaut est utilisée si le module commercial
     * n'est pas encore chargé.
     */
    var profilCommercial = {
      besoinPrincipal:
        "Structurer le projet et consolider son dossier"
    };

    if (
      typeof analyserProfilCommercial ===
      "function"
    ) {
      try {
        profilCommercial =
          analyserProfilCommercial(data) ||
          profilCommercial;
      } catch (erreurProfil) {
        console.warn(
          "Analyse commerciale indisponible :",
          erreurProfil
        );
      }
    }

    /*
     * Enregistrement commercial non bloquant.
     * Une panne du CRM ou du dashboard ne doit jamais empêcher
     * le téléchargement du Business Plan déjà généré.
     */
    var liens = {
      docId: documentId,
      docUrl: docUrl,
      pdfId: pdfId,
      pdfUrl: pdfUrl,
      pdfDownloadUrl: pdfDownloadUrl
    };

    var dashboardSync = {
      success: false,
      skipped: true
    };

    var agBridge = String(data.agBridge || "").trim();

    if (agBridge) {
      try {
        synchroniserBusinessPlanVersDashboard_(agBridge, {
          documentId: documentId,
          documentUrl: docUrl,
          pdfId: pdfId,
          pdfUrl: pdfUrl,
          dossierId: String(data.dossierId || data.projectId || "").trim(),
          nomProjet: nomProjet,
          genereLe: new Date().toISOString()
        });

        dashboardSync = {
          success: true
        };
      } catch (erreurSynchronisation) {
        var messageSynchronisation =
          erreurSynchronisation && erreurSynchronisation.message
            ? erreurSynchronisation.message
            : String(erreurSynchronisation);

        console.error(
          "Synchronisation Dashboard AfriGreen24 impossible :",
          messageSynchronisation
        );

        dashboardSync = {
          success: false,
          error: messageSynchronisation
        };
      }
    }

    if (
  typeof enregistrerSoumission !==
  "function"
) {
  throw new Error(
    "La fonction enregistrerSoumission est absente. Vérifie DataStore.gs."
  );
}

enregistrerSoumission(
  data,
  liens,
  profilCommercial
);

if (
  typeof actualiserDashboardCommercial !==
  "function"
) {
  throw new Error(
    "La fonction actualiserDashboardCommercial est absente. Vérifie Dashboard.gs ou DataStore.gs."
  );
}

actualiserDashboardCommercial();

    /*
     * Nettoyage du cache narratif IA après la génération réussie.
     */
    reinitialiserBusinessPlanStandardIA52_();

    /*
     * Réponse normalisée attendue par Javascript.html.
     */
    return {
      success: true,
      message:
        "Business Plan généré avec succès.",
      documentId: documentId,
      docId: documentId,
      pdfId: pdfId,
      url: docUrl,
      documentUrl: docUrl,
      docUrl: docUrl,
      businessPlanLink: docUrl,
      pdfUrl: pdfUrl,
      pdfLink: pdfUrl,
      businessPlanPdfLink: pdfUrl,
      pdfDownloadUrl: pdfDownloadUrl,
      downloadUrl: pdfDownloadUrl,
      businessPlanPdfDownload: pdfDownloadUrl,
      dashboardSync: dashboardSync,
      projectName: nomProjet,
      promoterName: nettoyerTexte(
        data.promoterName,
        "Porteur du projet"
      ),
      profilCommercial:
        profilCommercial
    };

  } catch (erreur) {
    console.error(
      "Erreur genererBusinessPlan :",
      erreur
    );

    return {
      success: false,
      message:
        "Une erreur est survenue pendant la génération du Business Plan.",
      error:
        erreur && erreur.message
          ? erreur.message
          : String(erreur)
    };
  }
}


/**
 * Point d’entrée web sérialisé.
 * Retourne toujours une chaîne JSON afin de garantir la transmission
 * entre Apps Script et le navigateur.
 */
function genererBusinessPlanWeb(data) {
  try {
    AG24_SEC_assertStandardRequest_(data);
    AG24_AUDIT_event_('STANDARD_GENERATION_REQUESTED', {
      projectName: data && data.projectName ? String(data.projectName).slice(0, 120) : ''
    });

    var resultat = genererBusinessPlan_(data);

    AG24_AUDIT_event_(
      resultat && resultat.success
        ? 'STANDARD_GENERATION_SUCCEEDED'
        : 'STANDARD_GENERATION_FAILED',
      {
        projectName: data && data.projectName ? String(data.projectName).slice(0, 120) : '',
        pdfId: resultat && resultat.pdfId ? String(resultat.pdfId) : ''
      }
    );

    return JSON.stringify(resultat);
  } catch (erreur) {
    return JSON.stringify({
      success: false,
      message: erreur && erreur.message
        ? erreur.message
        : String(erreur)
    });
  }
}


/**
 * Vérifie que les données reçues sont exploitables.
 */
function verifierDonneesGeneration_(data) {
  if (!data || typeof data !== "object") {
    throw new Error(
      "Aucune donnée valide n'a été reçue depuis le questionnaire."
    );
  }
}




/**
 * ============================================================
 * PACK V5.1 — FINITIONS PDF
 * ============================================================
 * - ponctuation unique ;
 * - synthèse compacte sur une page.
 */

function phrasePropreStandardV51_(texte) {
  var propre = String(texte || "")
    .trim()
    .replace(/[.!?;:,]+$/g, "");

  return propre
    ? propre + "."
    : "";
}


function ajouterCarteCompacteSyntheseV51_(
  cellule,
  titre,
  contenu
) {
  contenu = String(contenu || "").trim();

  var pTitre =
    cellule
      .getChild(0)
      .asParagraph();

  pTitre.setText(titre);

  pTitre
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertPrincipal
    )
    .setBold(true)
    .setFontFamily("Arial")
    .setFontSize(7.8)
    .setSpacingBefore(4)
    .setSpacingAfter(3);

  var pContenu =
    cellule.appendParagraph(
      contenu || "—"
    );

  pContenu
    .setForegroundColor(
      BUSINESS_PLAN_THEME.textePrincipal
    )
    .setFontFamily("Arial")
    .setFontSize(8.6)
    .setLineSpacing(1.05)
    .setSpacingBefore(0)
    .setSpacingAfter(4);

  return cellule;
}


function ajouterDeuxCartesCompactesSyntheseV51_(
  body,
  titreGauche,
  contenuGauche,
  titreDroit,
  contenuDroit
) {
  var table = body.appendTable([
    ["", ""]
  ]);

  table
    .setBorderColor(
      BUSINESS_PLAN_THEME.vertClair
    )
    .setBorderWidth(1);

  var gauche =
    table.getCell(0, 0);

  var droite =
    table.getCell(0, 1);

  gauche.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  droite.setBackgroundColor(
    BUSINESS_PLAN_THEME.grisTresClair
  );

  ajouterCarteCompacteSyntheseV51_(
    gauche,
    titreGauche,
    contenuGauche
  );

  ajouterCarteCompacteSyntheseV51_(
    droite,
    titreDroit,
    contenuDroit
  );

  table.setColumnWidth(0, 244);
  table.setColumnWidth(1, 244);

  return table;
}


function ajouterEncadreCompactSyntheseV51_(
  body,
  titre,
  contenu
) {
  contenu = String(contenu || "").trim();

  if (!contenu) {
    return null;
  }

  var table =
    body.appendTable([
      [titre],
      [contenu]
    ]);

  table
    .setBorderColor(
      BUSINESS_PLAN_THEME.vertClair
    )
    .setBorderWidth(1);

  var celluleTitre =
    table.getCell(0, 0);

  var celluleContenu =
    table.getCell(1, 0);

  celluleTitre.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertPrincipal
  );

  celluleContenu.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    celluleTitre,
    BUSINESS_PLAN_THEME.blanc,
    true,
    7.8
  );

  styliserCellule(
    celluleContenu,
    BUSINESS_PLAN_THEME.textePrincipal,
    false,
    8.6
  );

  celluleTitre
    .getChild(0)
    .asParagraph()
    .setSpacingBefore(3)
    .setSpacingAfter(3);

  celluleContenu
    .getChild(0)
    .asParagraph()
    .setLineSpacing(1.05)
    .setSpacingBefore(3)
    .setSpacingAfter(3);

  return table;
}


/**
 * ============================================================
 * PACK V5 CLEAN — BUSINESS PLAN DESCRIPTIF + FINITIONS V5.2
 * ============================================================
 *
 * Règles :
 * - aucune recommandation générique ;
 * - aucune priorité immédiate ;
 * - aucune hypothèse critique ;
 * - aucun "Information à compléter" ;
 * - aucune donnée métier inventée ;
 * - une donnée absente reste simplement absente.
 */

function nettoyerNarratifDescriptifStandardV5_(texte) {
  var source = String(texte || "").trim();

  if (!source) {
    return "";
  }

  var phrases = source
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/);

  var patternsPrescriptifs = [
    /^\s*il faut\b/i,
    /^\s*il faudra\b/i,
    /^\s*le projet devra\b/i,
    /^\s*l['’]entreprise devra\b/i,
    /^\s*l['’]organisation devra\b/i,
    /^\s*la solution devra\b/i,
    /^\s*l['’]offre devra\b/i,
    /^\s*le dossier devra\b/i,
    /^\s*l['’]étude .* devra\b/i,
    /^\s*une phase .* permettra de vérifier\b/i,
    /^\s*pour sécuriser\b/i,
    /^\s*pour limiter\b/i,
    /^\s*pour transformer cette intention\b/i,
    /^\s*la validation .* constituera\b/i,
    /^\s*la cartographie .* devra\b/i,
    /^\s*tester\b/i,
    /^\s*valider\b/i,
    /^\s*interroger\b/i,
    /^\s*calculer\b/i,
    /^\s*mettre en place\b/i,
    /^\s*définir\b/i,
    /^\s*renforcer\b/i,
    /^\s*préciser\b/i,
    /^\s*ajouter\b/i,
    /^\s*suivre\b/i
  ];

  var propres = phrases.filter(function(phrase) {
    var p = String(phrase || "").trim();

    if (!p) {
      return false;
    }

    if (
      /information[s]?\s+à\s+compléter/i.test(p) ||
      /non précisé/i.test(p) ||
      /à\s+préciser/i.test(p) ||
      /à\s+déterminer/i.test(p) ||
      /à\s+détailler/i.test(p) ||
      /à\s+valider/i.test(p) ||
      /à\s+évaluer/i.test(p) ||
      /prochaine priorité/i.test(p) ||
      /priorités immédiates/i.test(p) ||
      /hypothèses critiques/i.test(p)
    ) {
      return false;
    }

    return !patternsPrescriptifs.some(function(regex) {
      return regex.test(p);
    });
  });

  return propres.join(" ").trim();
}


function obtenirNarratifDescriptifStandardV5_(cle, fallback) {
  var narratif = "";

  try {
    narratif = obtenirNarratifStandardIA52_(
      cle,
      fallback || ""
    );
  } catch (erreur) {
    narratif = fallback || "";
  }

  narratif =
    nettoyerNarratifDescriptifStandardV5_(
      narratif
    );

  if (narratif) {
    return narratif;
  }

  return nettoyerNarratifDescriptifStandardV5_(
    fallback || ""
  );
}


function valeurStandardV5_(data, cle) {
  var valeur = "";

  try {
    valeur =
      obtenirDonneeStandardIA55_(
        data || {},
        cle,
        ""
      );
  } catch (erreur) {
    valeur =
      data && data[cle] !== undefined
        ? data[cle]
        : "";
  }

  valeur = String(valeur || "").trim();

  if (
    !valeur ||
    /information[s]?\s+à\s+compléter/i.test(valeur) ||
    /non précisé/i.test(valeur) ||
    /^à\s+/i.test(valeur)
  ) {
    return "";
  }

  return valeur;
}


function ajouterEncadreSiValeurV5_(body, titre, contenu) {
  contenu = String(contenu || "").trim();

  if (!contenu) {
    return;
  }

  ajouterEncadre(
    body,
    titre,
    contenu
  );
}


function ajouterDeuxBlocsSyntheseV5_(
  body,
  titre1,
  contenu1,
  titre2,
  contenu2
) {
  contenu1 = String(contenu1 || "").trim();
  contenu2 = String(contenu2 || "").trim();

  if (contenu1 && contenu2) {
    ajouterDeuxCartes(
      body,
      titre1,
      contenu1,
      titre2,
      contenu2
    );
    return;
  }

  if (contenu1) {
    ajouterEncadre(
      body,
      titre1,
      contenu1
    );
  }

  if (contenu2) {
    ajouterEncadre(
      body,
      titre2,
      contenu2
    );
  }
}


/**
 * Configuration générale du document.
 */
function configurerDocument(body) {
  body.setMarginTop(58);
  body.setMarginBottom(55);
  body.setMarginLeft(50);
  body.setMarginRight(50);
}


/**
 * ============================================================
 * PAGE DE COUVERTURE
 * ============================================================
 */
function ajouterPageDeCouverture(body, data) {
  var nomProjet = nettoyerTexte(
    data.projectName,
    "Projet entrepreneurial"
  );

  var promoteur = nettoyerTexte(
    data.promoterName,
    "Porteur du projet"
  );

  var pays = nettoyerTexte(
    data.country,
    "Afrique"
  );

  var secteur = nettoyerTexte(
    data.sector,
    "Secteur"
  );

  ajouterBandeDecorative(body);

  body.appendParagraph("")
    .setSpacingAfter(8);

  ajouterLogoClientCentre_(
    body,
    data,
    145
  );

  var typeDocument = body.appendParagraph(
    "BUSINESS PLAN"
  );

  typeDocument
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.or
    )
    .setBold(true)
    .setFontFamily("Montserrat")
    .setFontSize(13)
    .setSpacingBefore(12)
    .setSpacingAfter(16);

  var titreProjet = body.appendParagraph(
    nomProjet
  );

  titreProjet
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertFonce
    )
    .setBold(true)
    .setFontFamily("Montserrat")
    .setFontSize(28)
    .setSpacingAfter(12);

  var sousTitre = body.appendParagraph(
    "Stratégie • Viabilité • Impact"
  );

  sousTitre
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontFamily("Arial")
    .setFontSize(11)
    .setSpacingAfter(28);

  var carte = body.appendTable([
    ["PORTEUR DU PROJET", promoteur],
    ["PAYS OU ZONE", pays],
    ["SECTEUR", secteur],
    ["DATE DE GÉNÉRATION", formaterDateLongue(new Date())]
  ]);

  styliserTableauCouverture(carte);

  body.appendParagraph("")
    .setSpacingAfter(18);

  var ambition = body.appendTable([
    [
      "UNE VISION STRUCTURÉE POUR TRANSFORMER UNE IDÉE EN ENTREPRISE DURABLE"
    ]
  ]);

  ambition
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(1);

  var celluleAmbition = ambition.getCell(0, 0);

  celluleAmbition.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    celluleAmbition,
    BUSINESS_PLAN_THEME.vertPrincipal,
    true,
    10
  );

  celluleAmbition.getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setSpacingBefore(8)
    .setSpacingAfter(8);

  body.appendParagraph("")
    .setSpacingAfter(18);

  var mention = body.appendParagraph(
    "Document préparé à partir des informations fournies par le porteur du projet."
  );

  mention
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontSize(8.5)
    .setItalic(true)
    .setSpacingAfter(10);

  ajouterBandeDecorative(body);

  body.appendPageBreak();
}


/**
 * Ligne d'information de la couverture.
 */
function ajouterLigneCouverture(
  body,
  libelle,
  valeur
) {
  var paragraphe = body.appendParagraph(
    libelle + " : " + valeur
  );

  paragraphe
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.textePrincipal
    )
    .setFontSize(11)
    .setSpacingAfter(8);

  paragraphe.editAsText()
    .setBold(
      0,
      libelle.length,
      true
    );
}


/**
 * ============================================================
 * SOMMAIRE
 * ============================================================
 */
function ajouterSommaire(body) {
  ajouterTitrePrincipal(
    body,
    "Sommaire"
  );

  ajouterParagrapheIntroductif(
    body,
    "Le document présente les éléments structurants du projet, son marché, son modèle économique, son organisation, son besoin de financement, son impact et les risques déclarés."
  );

  var chapitres = [
    ["00", "Synthèse du projet"],
    ["01", "Résumé exécutif"],
    ["02", "Présentation du projet"],
    ["03", "Problème et opportunité"],
    ["04", "Solution proposée"],
    ["05", "Analyse du marché"],
    ["06", "Modèle économique"],
    ["07", "Stratégie commerciale et marketing"],
    ["08", "Équipe et organisation opérationnelle"],
    ["09", "Besoin de financement"],
    ["10", "Impact économique, social et environnemental"],
    ["11", "Risques identifiés"],
    ["12", "Conclusion"]
  ];

  var table = body.appendTable(chapitres);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.grisClair)
    .setBorderWidth(1);

  for (
    var index = 0;
    index < table.getNumRows();
    index++
  ) {
    var ligne = table.getRow(index);
    var numero = ligne.getCell(0);
    var titre = ligne.getCell(1);

    numero.setBackgroundColor(
      index % 2 === 0
        ? BUSINESS_PLAN_THEME.vertPrincipal
        : BUSINESS_PLAN_THEME.vertFonce
    );

    titre.setBackgroundColor(
      index % 2 === 0
        ? BUSINESS_PLAN_THEME.vertTresClair
        : BUSINESS_PLAN_THEME.blanc
    );

    styliserCellule(
      numero,
      BUSINESS_PLAN_THEME.blanc,
      true,
      9
    );

    styliserCellule(
      titre,
      BUSINESS_PLAN_THEME.textePrincipal,
      index === 0,
      10
    );

    numero.getChild(0)
      .asParagraph()
      .setAlignment(
        DocumentApp.HorizontalAlignment.CENTER
      );
  }

  table.setColumnWidth(0, 48);
  table.setColumnWidth(1, 440);

  body.appendPageBreak();
}


/**
 * ============================================================
 * 1. RÉSUMÉ EXÉCUTIF
 * ============================================================
 */
function ajouterResumeExecutif(body, data) {
  ajouterTitrePrincipal(
    body,
    "1. Résumé exécutif"
  );

  var texte = obtenirNarratifDescriptifStandardV5_(
    "resumeExecutif",
    redigerResumeExecutif(data)
  );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Solution",
    valeurStandardV5_(
      data,
      "solution"
    )
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 2. PRÉSENTATION DU PROJET
 * ============================================================
 */
function ajouterPresentationProjet(body, data) {
  ajouterTitrePrincipal(
    body,
    "2. Présentation du projet"
  );

  var lignes = [];

  [
    ["Nom du projet", "projectName"],
    ["Porteur du projet", "promoterName"],
    ["Pays ou zone", "country"],
    ["Secteur d'activité", "sector"],
    ["Stade du projet", "stage"]
  ].forEach(function(item) {
    var valeur =
      valeurStandardV5_(
        data,
        item[1]
      );

    if (valeur) {
      lignes.push([
        item[0],
        valeur
      ]);
    }
  });

  if (lignes.length) {
    ajouterTableauInformations(
      body,
      lignes
    );
  }

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "presentationProjet",
      redigerPresentationProjet(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 3. PROBLÈME ET OPPORTUNITÉ
 * ============================================================
 */
function ajouterAnalyseProbleme(body, data) {
  ajouterTitrePrincipal(
    body,
    "3. Problème et opportunité"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "problemeOpportunite",
      redigerProbleme(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Population concernée",
    valeurStandardV5_(
      data,
      "affectedPeople"
    )
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 4. SOLUTION PROPOSÉE
 * ============================================================
 */
function ajouterSolution(body, data) {
  ajouterTitrePrincipal(
    body,
    "4. Solution proposée"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "solutionProposee",
      redigerSolution(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  var proposition =
    valeurStandardV5_(
      data,
      "valueProposition"
    );

  if (!proposition) {
    proposition =
      valeurStandardV5_(
        data,
        "benefit"
      );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Proposition de valeur",
    proposition
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 5. ANALYSE DU MARCHÉ
 * ============================================================
 */
function ajouterMarche(body, data) {
  ajouterTitrePrincipal(
    body,
    "5. Analyse du marché"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "analyseMarche",
      redigerMarche(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  var clients =
    valeurStandardV5_(
      data,
      "targetCustomers"
    );

  if (clients) {
    ajouterSousTitre(
      body,
      "Clientèle cible"
    );

    ajouterParagraphe(
      body,
      clients
    );
  }

  var concurrents =
    valeurStandardV5_(
      data,
      "competitors"
    );

  if (concurrents) {
    ajouterSousTitre(
      body,
      "Concurrence et alternatives"
    );

    ajouterParagraphe(
      body,
      concurrents
    );
  }

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 6. MODÈLE ÉCONOMIQUE
 * ============================================================
 */
function ajouterModeleEconomique(body, data) {
  ajouterTitrePrincipal(
    body,
    "6. Modèle économique"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "modeleEconomique",
      redigerModeleEconomique(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  var lignes = [];

  [
    ["Sources de revenus", "revenueModel"],
    ["Politique tarifaire", "pricing"],
    ["Principaux coûts", "mainCosts"]
  ].forEach(function(item) {
    var valeur =
      valeurStandardV5_(
        data,
        item[1]
      );

    if (valeur) {
      lignes.push([
        item[0],
        valeur
      ]);
    }
  });

  if (lignes.length) {
    ajouterTableauInformations(
      body,
      lignes
    );
  }

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 7. STRATÉGIE COMMERCIALE
 * ============================================================
 */
function ajouterStrategieCommerciale(body, data) {
  ajouterTitrePrincipal(
    body,
    "7. Stratégie commerciale et marketing"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "strategieCommerciale",
      redigerStrategieCommerciale(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Canaux déclarés",
    valeurStandardV5_(
      data,
      "salesChannels"
    )
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 8. ÉQUIPE ET OPÉRATIONS
 * ============================================================
 */
function ajouterEquipeEtOperations(body, data) {
  ajouterTitrePrincipal(
    body,
    "8. Équipe et organisation opérationnelle"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "equipeOperations",
      redigerEquipe(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Équipe déclarée",
    valeurStandardV5_(
      data,
      "team"
    )
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 9. FINANCEMENT
 * ============================================================
 */
function ajouterFinancement(body, data) {
  ajouterTitrePrincipal(
    body,
    "9. Besoin de financement"
  );

  var lignes = [];

  [
    ["Type de financement", "fundingType"],
    ["Montant recherché", "fundingNeed"],
    ["Utilisation prévue", "useOfFunds"],
    ["Stade du projet", "stage"]
  ].forEach(function(item) {
    var valeur =
      valeurStandardV5_(
        data,
        item[1]
      );

    if (valeur) {
      lignes.push([
        item[0],
        valeur
      ]);
    }
  });

  if (lignes.length) {
    ajouterTableauInformations(
      body,
      lignes
    );
  }

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "financement",
      redigerFinancement(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 10. IMPACT
 * ============================================================
 */
function ajouterImpact(body, data) {
  ajouterTitrePrincipal(
    body,
    "10. Impact économique, social et environnemental"
  );

  var texte =
    obtenirNarratifDescriptifStandardV5_(
      "impact",
      redigerImpact(data)
    );

  if (texte) {
    ajouterParagraphe(
      body,
      texte
    );
  }

  ajouterEncadreSiValeurV5_(
    body,
    "Impact déclaré",
    valeurStandardV5_(
      data,
      "impact"
    )
  );

  ajouterSeparateur(body);
}


/**
 * ============================================================
 * 11. RISQUES
 * ============================================================
 */
function ajouterRisques(body, data) {
  ajouterTitrePrincipal(
    body,
    "11. Risques identifiés"
  );

  var risque =
    valeurStandardV5_(
      data,
      "risks"
    );

  if (risque) {
    ajouterParagraphe(
      body,
      "Le principal risque déclaré pour le projet est le suivant : " +
      phrasePropreStandardV51_(
        risque
      )
    );

    ajouterEncadre(
      body,
      "Risque déclaré",
      risque
    );
  }

  ajouterSeparateur(body);
}


/**
 * Tableau synthétique des risques.
 */
function ajouterTableauRisques(body, data) {
  var risque =
    valeurStandardV5_(
      data,
      "risks"
    );

  if (!risque) {
    return;
  }

  var table = body.appendTable([
    ["Risque déclaré"],
    [risque]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.grisClair)
    .setBorderWidth(1);

  var entete =
    table.getCell(0, 0);

  entete.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertPrincipal
  );

  styliserCellule(
    entete,
    BUSINESS_PLAN_THEME.blanc,
    true,
    9.5
  );

  var contenu =
    table.getCell(1, 0);

  contenu.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    contenu,
    BUSINESS_PLAN_THEME.textePrincipal,
    false,
    9.5
  );
}


/**
 * ============================================================
 * 12. CONCLUSION
 * ============================================================
 */
function ajouterConclusion(body, data) {
  ajouterTitrePrincipal(
    body,
    "12. Conclusion"
  );

  var projet =
    valeurStandardV5_(
      data,
      "projectName"
    ) ||
    "Le projet";

  var solution =
    valeurStandardV5_(
      data,
      "solution"
    );

  var clients =
    valeurStandardV5_(
      data,
      "targetCustomers"
    );

  var revenus =
    valeurStandardV5_(
      data,
      "revenueModel"
    );

  var financement =
    valeurStandardV5_(
      data,
      "fundingNeed"
    );

  var impact =
    valeurStandardV5_(
      data,
      "impact"
    );

  var paragraphes = [];

  /*
   * V5.2 :
   * conclusion strictement descriptive, mais grammaticalement naturelle.
   * Aucune donnée nouvelle, recommandation ou prochaine étape.
   */

  if (solution) {
    paragraphes.push(
      phrasePropreStandardV51_(
        projet +
        " a pour activité principale la proposition suivante : " +
        String(solution)
          .replace(/[.!?;:,]+$/g, "")
      )
    );
  } else {
    paragraphes.push(
      phrasePropreStandardV51_(
        projet +
        " présente les principales caractéristiques déclarées de son activité"
      )
    );
  }

  if (clients) {
    paragraphes.push(
      phrasePropreStandardV51_(
        "La clientèle cible déclarée comprend " +
        String(clients)
          .replace(/[.!?;:,]+$/g, "")
      )
    );
  }

  if (revenus) {
    paragraphes.push(
      phrasePropreStandardV51_(
        "Le modèle économique déclaré repose sur " +
        String(revenus)
          .replace(/[.!?;:,]+$/g, "")
      )
    );
  }

  if (financement) {
    paragraphes.push(
      phrasePropreStandardV51_(
        "Le besoin de financement déclaré s’élève à " +
        String(financement)
          .replace(/[.!?;:,]+$/g, "")
      )
    );
  }

  if (impact) {
    paragraphes.push(
      phrasePropreStandardV51_(
        "L’impact déclaré concerne " +
        String(impact)
          .replace(/[.!?;:,]+$/g, "")
      )
    );
  }

  ajouterParagraphe(
    body,
    paragraphes.join(
      "\n\n"
    )
  );
}



/**
 * ============================================================
 * PACK 5.5 — COUCHE DOCUMENT PROFESSIONNELLE
 * ============================================================
 *
 * Les zones éditoriales utilisent exclusivement le narratif HumbleOS.
 * Les données factuelles restent utilisées dans les tableaux.
 */
function obtenirNarratifCourtStandardIA55_(
  cle,
  fallback,
  longueurMax
) {
  var texte = obtenirNarratifStandardIA52_(
    cle,
    fallback || ""
  );

  texte = nettoyerTexte(
    texte,
    fallback || ""
  );

  var limite = Number(longueurMax || 420);

  if (texte.length <= limite) {
    return texte;
  }

  var coupe = texte.substring(0, limite);
  var finPhrase = Math.max(
    coupe.lastIndexOf("."),
    coupe.lastIndexOf("!"),
    coupe.lastIndexOf("?")
  );

  if (finPhrase > 120) {
    return coupe.substring(0, finPhrase + 1);
  }

  return coupe.trim() + "…";
}


/**
 * Valeur factuelle nettoyée par HumbleOS.
 * À utiliser pour tableaux/encadrés, jamais pour les grands paragraphes.
 */
function obtenirDonneeStandardIA55_(
  data,
  cle,
  fallback
) {
  var propres = obtenirDonneesStandardIA52_(
    data || {}
  );

  return nettoyerTexte(
    propres && propres[cle],
    fallback || ""
  );
}


/**
 * PACK 5.6 — Encadrés complémentaires sans duplication du narratif principal.
 */
function construirePropositionValeurStandard56_(data) {
  var proposition = obtenirDonneeStandardIA55_(
    data,
    "valueProposition",
    ""
  );

  var benefice = obtenirDonneeStandardIA55_(
    data,
    "benefit",
    ""
  );

  var prix = obtenirDonneeStandardIA55_(
    data,
    "pricing",
    ""
  );

  function nettoyerFinPhrase_(texte) {
    return String(texte || "")
      .trim()
      .replace(/[.!?;:,]+$/g, "");
  }

  proposition = nettoyerFinPhrase_(proposition);
  benefice = nettoyerFinPhrase_(benefice);
  prix = nettoyerFinPhrase_(prix);

  if (proposition) {
    var texte = proposition + ".";

    if (
      benefice &&
      proposition.toLowerCase().indexOf(
        benefice.toLowerCase()
      ) === -1
    ) {
      texte += " Le bénéfice recherché est " +
        benefice.charAt(0).toLowerCase() +
        benefice.slice(1) +
        ".";
    }

    if (prix) {
      texte += " Le positionnement tarifaire déclaré est de " +
        prix +
        ".";
    }

    return texte;
  }

  if (benefice) {
    return "La valeur recherchée repose sur " +
      benefice.charAt(0).toLowerCase() +
      benefice.slice(1) +
      (prix
        ? ". Le positionnement tarifaire déclaré est de " +
          prix +
          "."
        : ".");
  }

  return "La proposition de valeur devra être précisée et validée auprès des clients cibles.";
}

function construireProchainePrioriteStandard56_(data) {
  var utilisation = obtenirDonneeStandardIA55_(
    data,
    "useOfFunds",
    ""
  );

  utilisation = String(utilisation || "")
    .trim()
    .replace(/[.!?;:,]+$/g, "");

  if (utilisation) {
    return "La prochaine priorité consiste à structurer et chiffrer le plan d’exécution lié à l’utilisation prévue des fonds : " +
      utilisation +
      ".";
  }

  return "La prochaine priorité consiste à transformer les hypothèses du Business Plan en plan d’action chiffré, daté et mesurable.";
}

/**
 * Les scores du Standard sont des indicateurs de préparation, pas une preuve de bancabilité.
 * On évite donc un 100/100 automatique lorsque des hypothèses critiques restent à valider.
 */
function ajusterScoresCredibiliteStandard56_(synthese) {
  synthese = synthese || {};
  synthese.indicateurs = synthese.indicateurs || {};

  var hypotheses = synthese.hypothesesCritiques || [];
  var nonValidees = hypotheses.length;

  var fit = Number(
    synthese.indicateurs.customerFitScore || 0
  );

  var prep = Number(
    synthese.indicateurs.scorePreparation || 0
  );

  /*
   * Ces scores restent des indicateurs internes de cohérence,
   * jamais une note de bancabilité ou une preuve de marché.
   */
  if (nonValidees > 0) {
    fit = Math.min(fit, 75);
    prep = Math.min(prep, 70);
  } else {
    fit = Math.min(fit, 90);
    prep = Math.min(prep, 85);
  }

  synthese.indicateurs.customerFitScore = fit;
  synthese.indicateurs.scorePreparation = prep;

  if (fit >= 70) {
    synthese.indicateurs.customerFitNiveau =
      "Indicateur favorable — preuves terrain requises";
  } else if (fit >= 50) {
    synthese.indicateurs.customerFitNiveau =
      "Cohérence à confirmer";
  } else {
    synthese.indicateurs.customerFitNiveau =
      "Cohérence à renforcer";
  }

  return synthese;
}

/**
 * ============================================================
 * PAGE FINALE
 * ============================================================
 */
function ajouterPageFinale(body, data) {
  body.appendPageBreak();

  ajouterBandeDecorative(body);

  body.appendParagraph("")
    .setSpacingAfter(18);

  ajouterLogoClientCentre_(
    body,
    data,
    105
  );

  var titre = body.appendParagraph(
    "Votre projet dispose désormais d’une base stratégique structurée."
  );

  titre
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertFonce
    )
    .setBold(true)
    .setFontFamily("Montserrat")
    .setFontSize(21)
    .setSpacingBefore(18)
    .setSpacingAfter(18);

  var texte = body.appendParagraph(
    "Ce Business Plan présente les informations structurantes déclarées pour le projet : positionnement, marché, modèle économique, organisation, financement, impact et risques."
  );

  texte
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontSize(11)
    .setLineSpacing(1.4)
    .setSpacingAfter(24);

  var nomProjet =
    valeurStandardV5_(
      data,
      "projectName"
    ) ||
    "Projet AfriGreen24";

  var projet = body.appendTable([
    [nomProjet]
  ]);

  projet
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(1);

  var cellule = projet.getCell(0, 0);

  cellule.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    cellule,
    BUSINESS_PLAN_THEME.vertPrincipal,
    true,
    13
  );

  cellule.getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setSpacingBefore(10)
    .setSpacingAfter(10);

  var slogan =
    obtenirSloganBusinessPlan_(data);

  if (slogan) {
    body.appendParagraph("")
      .setSpacingAfter(14);

    var signature =
      body.appendParagraph(
        slogan
      );

    signature
      .setAlignment(
        DocumentApp.HorizontalAlignment.CENTER
      )
      .setForegroundColor(
        BUSINESS_PLAN_THEME.vertPrincipal
      )
      .setBold(true)
      .setFontSize(10)
      .setSpacingAfter(16);
  }

  ajouterBandeDecorative(body);
}


/**
 * ============================================================
 * OUTILS DE MISE EN PAGE
 * ============================================================
 */


/**
 * Ajoute un titre principal de chapitre.
 */
function ajouterTitrePrincipal(body, texte) {
  var correspondance = String(
    texte || ""
  ).match(/^(\d+)\.\s*(.+)$/);

  var numero = correspondance
    ? correspondance[1]
    : "BP";

  var titreTexte = correspondance
    ? correspondance[2]
    : texte;

  var table = body.appendTable([
    [numero, titreTexte]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(1);

  var celluleNumero = table.getCell(0, 0);
  var celluleTitre = table.getCell(0, 1);

  celluleNumero.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertPrincipal
  );

  celluleTitre.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    celluleNumero,
    BUSINESS_PLAN_THEME.blanc,
    true,
    11
  );

  styliserCellule(
    celluleTitre,
    BUSINESS_PLAN_THEME.vertFonce,
    true,
    16
  );

  celluleNumero.getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setSpacingBefore(8)
    .setSpacingAfter(8);

  var paragrapheTitre = celluleTitre
    .getChild(0)
    .asParagraph();

  paragrapheTitre
    .setHeading(
      DocumentApp.ParagraphHeading.HEADING1
    )
    .setFontFamily("Montserrat")
    .setSpacingBefore(8)
    .setSpacingAfter(8);

  table.setColumnWidth(0, 58);
  table.setColumnWidth(1, 430);

  body.appendParagraph("")
    .setSpacingAfter(4);

  return paragrapheTitre;
}


/**
 * Ajoute un sous-titre.
 */
function ajouterSousTitre(body, texte) {
  var table = body.appendTable([
    ["", texte]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.blanc)
    .setBorderWidth(0);

  var accent = table.getCell(0, 0);
  var contenu = table.getCell(0, 1);

  accent.setBackgroundColor(
    BUSINESS_PLAN_THEME.or
  );

  contenu.setBackgroundColor(
    BUSINESS_PLAN_THEME.blanc
  );

  styliserCellule(
    contenu,
    BUSINESS_PLAN_THEME.vertSecondaire,
    true,
    12
  );

  var titre = contenu.getChild(0)
    .asParagraph();

  titre
    .setHeading(
      DocumentApp.ParagraphHeading.HEADING2
    )
    .setFontFamily("Montserrat")
    .setSpacingBefore(5)
    .setSpacingAfter(5);

  table.setColumnWidth(0, 7);
  table.setColumnWidth(1, 480);

  body.appendParagraph("")
    .setSpacingAfter(1);

  return titre;
}


/**
 * Ajoute un texte professionnel.
 *
 * Les doubles sauts de ligne provenant de BusinessWriter.gs
 * sont transformés en paragraphes séparés.
 */
function ajouterParagraphe(body, texte) {
  var contenu =
    nettoyerNarratifDescriptifStandardV5_(
      texte
    );

  if (!contenu) {
    return null;
  }

  var parties = contenu.split(/\n\s*\n/);
  var dernier = null;

  parties.forEach(function(partie) {
    var textePartie = String(partie || "").trim();

    if (!textePartie) {
      return;
    }

    var paragraphe = body.appendParagraph(
      textePartie
    );

    paragraphe
      .setForegroundColor(
        BUSINESS_PLAN_THEME.textePrincipal
      )
      .setFontFamily("Arial")
      .setFontSize(10.5)
      .setLineSpacing(1.35)
      .setSpacingAfter(10)
      .setAlignment(
        DocumentApp.HorizontalAlignment.JUSTIFY
      );

    dernier = paragraphe;
  });

  return dernier;
}


/**
 * Ajoute un encadré de mise en valeur.
 */
function ajouterEncadre(
  body,
  titre,
  contenu
) {
  contenu = String(contenu || "").trim();

  if (
    !contenu ||
    /information[s]?\s+à\s+compléter/i.test(contenu) ||
    /non précisé/i.test(contenu) ||
    /^à\s+/i.test(contenu)
  ) {
    return null;
  }

  var table = body.appendTable([
    [titre],
    [contenu]
  ]);

  table.setBorderColor(
    BUSINESS_PLAN_THEME.vertClair
  );

  table.setBorderWidth(1);

  var celluleTitre = table.getCell(0, 0);
  var celluleContenu = table.getCell(1, 0);

  celluleTitre.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertPrincipal
  );

  celluleContenu.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  styliserCellule(
    celluleTitre,
    BUSINESS_PLAN_THEME.blanc,
    true,
    9.5
  );

  styliserCellule(
    celluleContenu,
    BUSINESS_PLAN_THEME.textePrincipal,
    false,
    10
  );

  celluleTitre.getChild(0)
    .asParagraph()
    .setSpacingBefore(5)
    .setSpacingAfter(5);

  celluleContenu.getChild(0)
    .asParagraph()
    .setLineSpacing(1.25)
    .setSpacingBefore(7)
    .setSpacingAfter(7);

  body.appendParagraph("")
    .setSpacingAfter(3);

  return table;
}


/**
 * Ajoute un tableau d'informations.
 */
function ajouterTableauInformations(
  body,
  lignes
) {
  if (!lignes || !lignes.length) {
    return;
  }

  var tableau = [];

  lignes.forEach(function(ligne) {
    var libelle =
      nettoyerTexte(
        ligne[0],
        ""
      );

    var valeur =
      String(
        ligne[1] === undefined ||
        ligne[1] === null
          ? ""
          : ligne[1]
      ).trim();

    if (
      !libelle ||
      !valeur ||
      /information[s]?\s+à\s+compléter/i.test(valeur) ||
      /non précisé/i.test(valeur) ||
      /^à\s+/i.test(valeur)
    ) {
      return;
    }

    tableau.push([
      libelle,
      valeur
    ]);
  });

  if (!tableau.length) {
    return;
  }

  var table = body.appendTable(
    tableau
  );

  styliserTableau(
    table,
    false
  );

  body.appendParagraph("")
    .setSpacingAfter(3);
}


/**
 * Style général d'un tableau.
 */
function styliserTableau(
  table,
  premiereLigneEntete
) {
  table.setBorderColor(
    BUSINESS_PLAN_THEME.grisClair
  );

  table.setBorderWidth(1);

  for (
    var ligneIndex = 0;
    ligneIndex < table.getNumRows();
    ligneIndex++
  ) {
    var ligne = table.getRow(
      ligneIndex
    );

    for (
      var celluleIndex = 0;
      celluleIndex < ligne.getNumCells();
      celluleIndex++
    ) {
      var cellule = ligne.getCell(
        celluleIndex
      );

      var estEntete =
        premiereLigneEntete &&
        ligneIndex === 0;

      var estLibelle =
        !premiereLigneEntete &&
        celluleIndex === 0;

      if (estEntete) {
        cellule.setBackgroundColor(
          BUSINESS_PLAN_THEME.vertPrincipal
        );

        styliserCellule(
          cellule,
          BUSINESS_PLAN_THEME.blanc,
          true,
          9.5
        );
      } else if (estLibelle) {
        cellule.setBackgroundColor(
          ligneIndex % 2 === 0
            ? BUSINESS_PLAN_THEME.vertClair
            : BUSINESS_PLAN_THEME.orClair
        );

        styliserCellule(
          cellule,
          BUSINESS_PLAN_THEME.vertFonce,
          true,
          9.5
        );
      } else {
        cellule.setBackgroundColor(
          ligneIndex % 2 === 0
            ? BUSINESS_PLAN_THEME.blanc
            : BUSINESS_PLAN_THEME.grisTresClair
        );

        styliserCellule(
          cellule,
          BUSINESS_PLAN_THEME.textePrincipal,
          false,
          9.5
        );
      }
    }
  }

  if (
    table.getRow(0).getNumCells() >= 2
  ) {
    table.setColumnWidth(
      0,
      165
    );

    table.setColumnWidth(
      1,
      325
    );
  }
}


/**
 * Applique un style à tous les paragraphes
 * présents dans une cellule.
 */
function styliserCellule(
  cellule,
  couleur,
  gras,
  taille
) {
  for (
    var index = 0;
    index < cellule.getNumChildren();
    index++
  ) {
    var enfant = cellule.getChild(
      index
    );

    if (
      enfant.getType() ===
      DocumentApp.ElementType.PARAGRAPH
    ) {
      var paragraphe = enfant.asParagraph();

      paragraphe
        .setForegroundColor(couleur)
        .setBold(gras)
        .setFontFamily("Arial")
        .setFontSize(taille)
        .setLineSpacing(1.15)
        .setSpacingAfter(2);
    }
  }
}


/**
 * Séparateur discret entre les sections.
 */
function ajouterSeparateur(body) {
  body.appendParagraph("")
    .setSpacingBefore(6)
    .setSpacingAfter(12);
}



/**
 * ============================================================
 * IDENTITÉ VISUELLE DU DOCUMENT
 * ============================================================
 */


/**
 * Ajoute le logo et l'identité Business Plan dans
 * l'en-tête et le pied de page du document.
 */
function configurerIdentiteDocument(
  document,
  data
) {
  data = data || {};

  var projet = nettoyerTexte(
    data.projectName,
    "Projet entrepreneurial"
  );

  var slogan =
    obtenirSloganBusinessPlan_(data);

  var header = document.addHeader();
  header.clear();

  var tableHeader = header.appendTable([
    ["", ""]
  ]);

  tableHeader
    .setBorderColor(BUSINESS_PLAN_THEME.blanc)
    .setBorderWidth(0);

  var celluleLogo = tableHeader.getCell(0, 0);
  var celluleTexte = tableHeader.getCell(0, 1);

  var paragrapheLogo = celluleLogo
    .getChild(0)
    .asParagraph();

  insererLogoClientDansParagraphe_(
    paragrapheLogo,
    data,
    42
  );

  paragrapheLogo.setAlignment(
    DocumentApp.HorizontalAlignment.LEFT
  );

  var paragrapheType = celluleTexte
    .getChild(0)
    .asParagraph();

  paragrapheType.setText("BUSINESS PLAN");

  paragrapheType
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertPrincipal
    )
    .setBold(true)
    .setFontFamily("Montserrat")
    .setFontSize(9)
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    )
    .setSpacingAfter(1);

  var paragrapheProjet = celluleTexte
    .appendParagraph(projet);

  paragrapheProjet
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontSize(7.5)
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    )
    .setSpacingAfter(1);

  tableHeader.setColumnWidth(0, 70);
  tableHeader.setColumnWidth(1, 420);

  var footer = document.addFooter();
  footer.clear();

  var tableFooter = footer.appendTable([
    [
      slogan || projet,
      "Document confidentiel • " +
      formaterDateLongue(new Date())
    ]
  ]);

  tableFooter
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(0);

  var footerGauche = tableFooter.getCell(0, 0);
  var footerDroit = tableFooter.getCell(0, 1);

  styliserCellule(
    footerGauche,
    BUSINESS_PLAN_THEME.vertPrincipal,
    true,
    7.5
  );

  styliserCellule(
    footerDroit,
    BUSINESS_PLAN_THEME.texteSecondaire,
    false,
    7.5
  );

  footerDroit.getChild(0)
    .asParagraph()
    .setAlignment(
      DocumentApp.HorizontalAlignment.RIGHT
    );

  tableFooter.setColumnWidth(0, 270);
  tableFooter.setColumnWidth(1, 220);
}


/**
 * Récupère le logo depuis Google Drive.
 * La génération continue même si le fichier est indisponible.
 */



/**
 * Insère le logo dans un paragraphe en conservant
 * ses proportions.
 */



/**
 * Ajoute le logo officiel centré dans le corps du document.
 */



/**
 * Ajoute un bandeau décoratif vert et or.
 */

function extraireBrandingBusinessPlan_(data) {
  data = data || {};

  var logoUpload =
    data.logoUpload &&
    typeof data.logoUpload === "object"
      ? data.logoUpload
      : null;

  var slogan = nettoyerTexte(
    data.organizationSlogan ||
    data.projectSlogan ||
    "",
    ""
  );

  return {
    logoUpload: logoUpload,
    slogan: slogan
  };
}


function construireDonneesBusinessPlanSansBranding_(data) {
  data = data || {};
  var propre = {};

  Object.keys(data).forEach(function(cle) {
    if (
      cle === "logoUpload" ||
      cle === "organizationSlogan" ||
      cle === "projectSlogan"
    ) {
      return;
    }

    propre[cle] = data[cle];
  });

  return propre;
}


function obtenirSloganBusinessPlan_(data) {
  data = data || {};

  return nettoyerTexte(
    data.organizationSlogan ||
    data.projectSlogan ||
    "",
    ""
  );
}


function obtenirLogoClientBusinessPlan_(data) {
  data = data || {};

  var upload =
    data.logoUpload &&
    typeof data.logoUpload === "object"
      ? data.logoUpload
      : null;

  if (!upload) {
    return null;
  }

  var dataUrl =
    String(upload.dataUrl || "").trim();

  if (!dataUrl) {
    return null;
  }

  var correspondance = dataUrl.match(
    /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/i
  );

  if (!correspondance) {
    console.warn(
      "Logo client ignoré : format non reconnu."
    );
    return null;
  }

  try {
    var bytes =
      Utilities.base64Decode(
        correspondance[2].replace(/\s+/g, "")
      );

    if (bytes.length > 2 * 1024 * 1024) {
      console.warn(
        "Logo client ignoré : taille supérieure à 2 Mo."
      );
      return null;
    }

    return Utilities.newBlob(
      bytes,
      correspondance[1].toLowerCase(),
      nettoyerTexte(
        upload.name,
        "logo-client"
      )
    );

  } catch (erreur) {
    console.warn(
      "Logo client illisible :",
      erreur
    );
    return null;
  }
}


function insererLogoClientDansParagraphe_(
  paragraphe,
  data,
  largeur
) {
  var logo =
    obtenirLogoClientBusinessPlan_(data);

  if (!logo) {
    return null;
  }

  var image =
    paragraphe.appendInlineImage(logo);

  var largeurOriginale = image.getWidth();
  var hauteurOriginale = image.getHeight();
  var largeurCible = Number(largeur || 100);
  var hauteurCible = largeurCible;

  if (
    largeurOriginale > 0 &&
    hauteurOriginale > 0
  ) {
    hauteurCible = Math.round(
      largeurCible *
      hauteurOriginale /
      largeurOriginale
    );
  }

  image.setWidth(largeurCible);
  image.setHeight(hauteurCible);

  return image;
}


function ajouterLogoClientCentre_(
  body,
  data,
  largeur
) {
  var logo =
    obtenirLogoClientBusinessPlan_(data);

  if (!logo) {
    return null;
  }

  var paragraphe =
    body.appendParagraph("");

  paragraphe.setAlignment(
    DocumentApp.HorizontalAlignment.CENTER
  );

  var image =
    paragraphe.appendInlineImage(logo);

  var largeurOriginale = image.getWidth();
  var hauteurOriginale = image.getHeight();
  var largeurCible = Number(largeur || 100);
  var hauteurCible = largeurCible;

  if (
    largeurOriginale > 0 &&
    hauteurOriginale > 0
  ) {
    hauteurCible = Math.round(
      largeurCible *
      hauteurOriginale /
      largeurOriginale
    );
  }

  image.setWidth(largeurCible);
  image.setHeight(hauteurCible);

  return paragraphe;
}


function ajouterBandeDecorative(body) {
  var table = body.appendTable([
    ["", "", ""]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.blanc)
    .setBorderWidth(0);

  table.getCell(0, 0)
    .setBackgroundColor(
      BUSINESS_PLAN_THEME.vertFonce
    );

  table.getCell(0, 1)
    .setBackgroundColor(
      BUSINESS_PLAN_THEME.vertPrincipal
    );

  table.getCell(0, 2)
    .setBackgroundColor(
      BUSINESS_PLAN_THEME.or
    );

  table.setColumnWidth(0, 165);
  table.setColumnWidth(1, 245);
  table.setColumnWidth(2, 80);

  for (
    var index = 0;
    index < 3;
    index++
  ) {
    table.getCell(0, index)
      .getChild(0)
      .asParagraph()
      .setFontSize(2)
      .setSpacingBefore(1)
      .setSpacingAfter(1);
  }
}


/**
 * Style du tableau d'identité placé sur la couverture.
 */
function styliserTableauCouverture(table) {
  table
    .setBorderColor(BUSINESS_PLAN_THEME.grisClair)
    .setBorderWidth(1);

  for (
    var ligneIndex = 0;
    ligneIndex < table.getNumRows();
    ligneIndex++
  ) {
    var libelle = table.getCell(
      ligneIndex,
      0
    );

    var valeur = table.getCell(
      ligneIndex,
      1
    );

    libelle.setBackgroundColor(
      ligneIndex % 2 === 0
        ? BUSINESS_PLAN_THEME.vertPrincipal
        : BUSINESS_PLAN_THEME.vertFonce
    );

    valeur.setBackgroundColor(
      ligneIndex % 2 === 0
        ? BUSINESS_PLAN_THEME.vertTresClair
        : BUSINESS_PLAN_THEME.blanc
    );

    styliserCellule(
      libelle,
      BUSINESS_PLAN_THEME.blanc,
      true,
      8.5
    );

    styliserCellule(
      valeur,
      BUSINESS_PLAN_THEME.textePrincipal,
      false,
      10
    );
  }

  table.setColumnWidth(0, 155);
  table.setColumnWidth(1, 335);
}


/**
 * Ajoute un court texte d'introduction à une page.
 */
function ajouterParagrapheIntroductif(
  body,
  texte
) {
  var paragraphe = body.appendParagraph(
    nettoyerTexte(
      texte,
      ""
    )
  );

  paragraphe
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontSize(10.5)
    .setLineSpacing(1.3)
    .setSpacingAfter(14);

  return paragraphe;
}


/**
 * Présente deux contenus stratégiques côte à côte.
 */
function ajouterDeuxCartes(
  body,
  titreGauche,
  contenuGauche,
  titreDroit,
  contenuDroit
) {
  var table = body.appendTable([
    ["", ""]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(1);

  var gauche = table.getCell(0, 0);
  var droite = table.getCell(0, 1);

  gauche.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  droite.setBackgroundColor(
    BUSINESS_PLAN_THEME.grisTresClair
  );

  remplirCarteStrategique(
    gauche,
    titreGauche,
    contenuGauche
  );

  remplirCarteStrategique(
    droite,
    titreDroit,
    contenuDroit
  );

  table.setColumnWidth(0, 244);
  table.setColumnWidth(1, 244);

  body.appendParagraph("")
    .setSpacingAfter(5);
}


/**
 * Remplit une cellule utilisée comme carte stratégique.
 */
function remplirCarteStrategique(
  cellule,
  titre,
  contenu
) {
  var paragrapheTitre = cellule
    .getChild(0)
    .asParagraph();

  paragrapheTitre.setText(titre);

  paragrapheTitre
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertPrincipal
    )
    .setBold(true)
    .setFontSize(8.5)
    .setSpacingBefore(7)
    .setSpacingAfter(6);

  var propre =
    String(
      contenu || ""
    ).trim();

  if (
    !propre ||
    /information[s]?\s+à\s+compléter/i.test(propre) ||
    /non précisé/i.test(propre) ||
    /^à\s+/i.test(propre)
  ) {
    propre = "—";
  }

  var paragrapheContenu = cellule
    .appendParagraph(
      propre
    );

  paragrapheContenu
    .setForegroundColor(
      BUSINESS_PLAN_THEME.textePrincipal
    )
    .setFontSize(9)
    .setLineSpacing(1.2)
    .setSpacingAfter(7);
}


/**
 * Affiche les scores Customer Fit et préparation.
 */
function ajouterCarteScores(
  body,
  customerFitScore,
  customerFitNiveau,
  scorePreparation
) {
  var table = body.appendTable([
    ["", ""]
  ]);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.vertClair)
    .setBorderWidth(1);

  var customerFit = table.getCell(0, 0);
  var preparation = table.getCell(0, 1);

  customerFit.setBackgroundColor(
    BUSINESS_PLAN_THEME.vertTresClair
  );

  preparation.setBackgroundColor(
    BUSINESS_PLAN_THEME.orClair
  );

  remplirCarteScore(
    customerFit,
    "CUSTOMER FIT",
    customerFitScore,
    customerFitNiveau,
    BUSINESS_PLAN_THEME.vertPrincipal
  );

  remplirCarteScore(
    preparation,
    "PRÉPARATION DU PROJET",
    scorePreparation,
    "Niveau de preuves disponibles",
    BUSINESS_PLAN_THEME.or
  );

  table.setColumnWidth(0, 244);
  table.setColumnWidth(1, 244);

  body.appendParagraph("")
    .setSpacingAfter(5);
}


/**
 * Remplit une carte de score avec une barre visuelle.
 */
function remplirCarteScore(
  cellule,
  titre,
  score,
  niveau,
  couleur
) {
  var valeurScore = Math.max(
    0,
    Math.min(
      100,
      Number(score || 0)
    )
  );

  var titreParagraphe = cellule
    .getChild(0)
    .asParagraph();

  titreParagraphe.setText(titre);

titreParagraphe
  .setForegroundColor(couleur)
  .setBold(true)
  .setFontSize(8.5)
  .setSpacingBefore(7)
  .setSpacingAfter(4);
  var scoreParagraphe = cellule
    .appendParagraph(
      Math.round(valeurScore) +
      " / 100"
    );

  scoreParagraphe
    .setForegroundColor(
      BUSINESS_PLAN_THEME.vertFonce
    )
    .setBold(true)
    .setFontFamily("Montserrat")
    .setFontSize(19)
    .setSpacingAfter(3);

  var niveauParagraphe = cellule
    .appendParagraph(
      nettoyerTexte(
        niveau,
        "À valider"
      )
    );

  niveauParagraphe
    .setForegroundColor(
      BUSINESS_PLAN_THEME.texteSecondaire
    )
    .setFontSize(8.5)
    .setSpacingAfter(6);

  var barre = cellule.appendTable([
    ["", "", "", "", "", "", "", "", "", ""]
  ]);

  barre
    .setBorderColor(BUSINESS_PLAN_THEME.blanc)
    .setBorderWidth(0);

  var nombreRempli = Math.round(
    valeurScore / 10
  );

  for (
    var index = 0;
    index < 10;
    index++
  ) {
    var segment = barre.getCell(0, index);

    segment.setBackgroundColor(
      index < nombreRempli
        ? couleur
        : BUSINESS_PLAN_THEME.grisClair
    );

    segment.getChild(0)
      .asParagraph()
      .setFontSize(2)
      .setSpacingBefore(1)
      .setSpacingAfter(1);

    barre.setColumnWidth(
      index,
      20
    );
  }
}


/**
 * Affiche les hypothèses critiques dans un tableau compact.
 */
function ajouterTableauHypothesesStrategiques(
  body,
  hypotheses
) {
  var lignes = [
    [
      "CATÉGORIE",
      "HYPOTHÈSE À VALIDER",
      "RISQUE"
    ]
  ];

  (hypotheses || []).forEach(
    function(element) {
      lignes.push([
        nettoyerTexte(
          element.categorie,
          "Hypothèse"
        ),
        nettoyerTexte(
          element.hypothese,
          "À préciser"
        ),
        nettoyerTexte(
          element.risque,
          "À évaluer"
        )
      ]);
    }
  );

  if (lignes.length === 1) {
    lignes.push([
      "Validation",
      "Les hypothèses prioritaires seront précisées après les premiers tests de marché.",
      "À évaluer"
    ]);
  }

  var table = body.appendTable(lignes);

  table
    .setBorderColor(BUSINESS_PLAN_THEME.grisClair)
    .setBorderWidth(1);

  for (
    var ligneIndex = 0;
    ligneIndex < table.getNumRows();
    ligneIndex++
  ) {
    var ligne = table.getRow(ligneIndex);

    for (
      var celluleIndex = 0;
      celluleIndex < ligne.getNumCells();
      celluleIndex++
    ) {
      var cellule = ligne.getCell(celluleIndex);

      if (ligneIndex === 0) {
        cellule.setBackgroundColor(
          BUSINESS_PLAN_THEME.vertPrincipal
        );

        styliserCellule(
          cellule,
          BUSINESS_PLAN_THEME.blanc,
          true,
          8
        );
      } else {
        cellule.setBackgroundColor(
          ligneIndex % 2 === 0
            ? BUSINESS_PLAN_THEME.grisTresClair
            : BUSINESS_PLAN_THEME.blanc
        );

        styliserCellule(
          cellule,
          celluleIndex === 2
            ? BUSINESS_PLAN_THEME.vertPrincipal
            : BUSINESS_PLAN_THEME.textePrincipal,
          celluleIndex === 0 ||
          celluleIndex === 2,
          8.5
        );
      }
    }
  }

  table.setColumnWidth(0, 95);
  table.setColumnWidth(1, 300);
  table.setColumnWidth(2, 90);

  body.appendParagraph("")
    .setSpacingAfter(4);
}


/**
 * Ajoute une liste de priorités sans emoji.
 */
function ajouterListeProfessionnelle(
  body,
  elements
) {
  (elements || []).forEach(
    function(element) {
      var ligne = body.appendListItem(
        nettoyerTexte(
          element,
          "Action à préciser"
        )
      );

      ligne
        .setGlyphType(
          DocumentApp.GlyphType.SQUARE_BULLET
        )
        .setForegroundColor(
          BUSINESS_PLAN_THEME.textePrincipal
        )
        .setFontSize(9.5)
        .setLineSpacing(1.25)
        .setSpacingAfter(6)
        .setIndentStart(24)
        .setIndentFirstLine(10);
    }
  );

  body.appendParagraph("")
    .setSpacingAfter(2);
}


/**
 * ============================================================
 * OUTILS FICHIERS ET PDF
 * ============================================================
 */


/**
 * Crée le PDF dans le même dossier que le Google Docs.
 *
 * Si aucun dossier parent n'est disponible,
 * le PDF est créé à la racine de Google Drive.
 */
function creerPdfDansMemeDossier(
  fichierDocument,
  blobPdf
) {
  var fichierPdf;
  var parents = fichierDocument.getParents();

  if (parents.hasNext()) {
    var dossier = parents.next();

    fichierPdf = dossier.createFile(
      blobPdf
    );
  } else {
    fichierPdf = DriveApp.createFile(
      blobPdf
    );
  }

  /*
   * Le partage public peut être interdit par certaines
   * configurations Google Workspace. Dans ce cas, le PDF reste
   * créé et accessible au propriétaire du script.
   */
  try {
    fichierPdf.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
  } catch (erreurPartage) {
    console.warn(
      "Partage public du PDF non autorisé :",
      erreurPartage
    );
  }

  return fichierPdf;
}


/**
 * ============================================================
 * OUTILS DE NETTOYAGE
 * ============================================================
 */


/**
 * Nettoie une valeur reçue du questionnaire.
 */
function nettoyerTexte(
  valeur,
  valeurParDefaut
) {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return valeurParDefaut || "";
  }

  var texte = String(valeur)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!texte) {
    return valeurParDefaut || "";
  }

  return texte;
}


/**
 * Date destinée au nom du fichier.
 *
 * Exemple :
 * 2026-07-28
 */
function formaterDateFichier(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}


/**
 * Date longue destinée au document.
 */
function formaterDateLongue(date) {
  var mois = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
  ];

  return (
    date.getDate() +
    " " +
    mois[date.getMonth()] +
    " " +
    date.getFullYear()
  );
}


/**
 * ============================================================
 * TEST SERVEUR FACULTATIF
 * ============================================================
 *
 * Cette fonction permet de tester la génération directement
 * depuis l'éditeur Apps Script.
 *
 * Elle n'est pas appelée par le questionnaire.
 */
function testerGenerationBusinessPlan() {
  var donneesTest = {
    projectName: "EcoCycle Africa",
    promoterName: "Entrepreneur test",
    email: "humblemg2.0@gmail.com",
    country: "Côte d'Ivoire",
    sector: "Économie circulaire",
    stage: "Phase pilote",

    problem:
      "Les déchets plastiques s'accumulent dans les villes et sont insuffisamment valorisés.",

    affectedPeople:
      "Les ménages, les collectivités, les commerçants et les populations urbaines.",

    urgency:
      "La pollution augmente et les infrastructures de collecte restent insuffisantes.",

    solution:
      "Un service de collecte, de tri et de transformation des déchets plastiques.",

    valueProposition:
      "Une solution locale combinant assainissement, création d'emplois et valorisation des déchets.",

    benefit:
      "La réduction de la pollution et la création d'une nouvelle source de revenus.",

    targetCustomers:
      "Les entreprises, les collectivités, les ménages et les acteurs du recyclage.",

    marketArea:
      "Abidjan et les principales zones urbaines de Côte d'Ivoire.",

    competitors:
      "Les entreprises de collecte, les recycleurs existants et les systèmes informels.",

    revenueModel:
      "La vente de matières recyclées, les contrats de collecte et les services aux entreprises.",

    pricing:
      "Une tarification adaptée au volume collecté et aux services demandés.",

    mainCosts:
      "Les équipements, le transport, la main-d'œuvre, le stockage et la communication.",

    salesChannels:
      "La prospection directe, les partenariats, les réseaux sociaux et les collectivités.",

    team:
      "Un promoteur, une équipe de collecte, un responsable commercial et des partenaires techniques.",

    fundingType:
      "Une subvention ou un investissement d'amorçage.",

    fundingNeed:
      "25 000 000 FCFA",

    useOfFunds:
      "L'achat d'équipements, le recrutement, la logistique et le lancement commercial.",

    impact:
      "La réduction des déchets plastiques, la création d'emplois verts et l'amélioration de l'environnement urbain.",

    risks:
      "La variation du prix des matières recyclées et la difficulté à sécuriser un volume régulier de déchets."
  };

  var resultat = genererBusinessPlan_(
    donneesTest
  );

  console.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}
/**
 * ============================================================
 * ÉTAPE 3 — TEST DU STORY ENGINE
 * ============================================================
 *
 * Cette fonction génère deux Business Plans à partir de données
 * similaires, mais avec deux noms de projets différents.
 *
 * Résultat attendu :
 * - les informations restent cohérentes ;
 * - les introductions et transitions varient ;
 * - les deux PDF sont correctement créés.
 */
function testerStoryEngine() {
  var projetA = creerDonneesTestStoryEngine(
    "EcoCycle Africa"
  );

  var projetB = creerDonneesTestStoryEngine(
    "GreenLoop Solutions"
  );

  console.log(
    "=== GÉNÉRATION DU PROJET A ==="
  );

  var resultatA = genererBusinessPlan_(
    projetA
  );

  console.log(
    JSON.stringify(
      resultatA,
      null,
      2
    )
  );

  console.log(
    "=== GÉNÉRATION DU PROJET B ==="
  );

  var resultatB = genererBusinessPlan_(
    projetB
  );

  console.log(
    JSON.stringify(
      resultatB,
      null,
      2
    )
  );

  return {
    success:
      resultatA.success === true &&
      resultatB.success === true,

    projetA: resultatA,
    projetB: resultatB
  };
}


/**
 * Données professionnelles utilisées pour tester
 * le moteur de rédaction.
 *
 * Le nom du projet est volontairement variable afin
 * de déclencher d’autres formulations dans WriterLibrary.gs.
 */
function creerDonneesTestStoryEngine(
  nomProjet
) {
  return {
    projectName: nomProjet,

    promoterName:
      "Aminata Koné",

    country:
      "Côte d’Ivoire",

    sector:
      "Économie circulaire et gestion des déchets",

    stage:
      "Je prépare le lancement",

    problem:
      "les déchets plastiques s’accumulent dans les quartiers urbains, tandis qu’une grande partie de ces matières n’est ni collectée ni valorisée",

    affectedPeople:
      "les ménages, les commerces, les collectivités locales et les populations vivant dans les zones fortement exposées à la pollution",

    urgency:
      "l’augmentation rapide des déchets accentue les risques sanitaires, la pollution des espaces publics et l’obstruction des systèmes d’évacuation des eaux",

    solution:
      "un service structuré de collecte, de tri et de transformation des déchets plastiques en matières premières recyclées",

    valueProposition:
      "une solution locale associant collecte de proximité, traçabilité des déchets, création d’emplois verts et valorisation économique des matières récupérées",

    benefit:
      "une réduction visible de la pollution, une amélioration de la propreté urbaine et la création de nouvelles opportunités économiques",

    targetCustomers:
      "les entreprises, les commerces, les collectivités locales, les ménages et les acteurs industriels utilisant des matières recyclées",

    marketArea:
      "Abidjan, avec un lancement prioritaire dans les communes de Cocody, Yopougon et Marcory",

    competitors:
      "les entreprises privées de collecte, les récupérateurs informels, les associations environnementales et les recycleurs déjà présents sur le marché",

    revenueModel:
      "la vente de matières plastiques triées, les abonnements de collecte, les contrats conclus avec les entreprises et les prestations destinées aux collectivités",

    pricing:
      "des abonnements mensuels adaptés au volume de déchets collecté, complétés par une tarification spécifique pour les prestations professionnelles",

    mainCosts:
      "l’achat des équipements de collecte, le transport, la rémunération de l’équipe, la location d’un espace de tri, la maintenance et les actions commerciales",

    salesChannels:
      "la prospection directe des entreprises, les partenariats avec les collectivités, les réseaux sociaux, les campagnes de sensibilisation et les recommandations clients",

    team:
      "une fondatrice responsable de la stratégie, un responsable des opérations, des agents de collecte, un commercial et plusieurs partenaires techniques",

    fundingType:
      "un financement d’amorçage associant subvention et prêt à conditions préférentielles",

    fundingNeed:
      "25 000 000 FCFA",

    useOfFunds:
      "l’acquisition de tricycles de collecte, l’achat d’équipements de tri, le recrutement de la première équipe et le financement du lancement commercial",

    impact:
      "la réduction des déchets plastiques abandonnés, la création d’emplois verts, l’amélioration de la propreté urbaine et le développement d’une économie circulaire locale",

    risks:
      "la difficulté à obtenir un volume régulier de déchets, la variation du prix des matières recyclées et l’adoption progressive du service par les clients"
  };
}

function ajouterSyntheseStrategique(body, data) {
  ajouterTitrePrincipal(
    body,
    "Synthèse du projet"
  );

  var projet =
    valeurStandardV5_(
      data,
      "projectName"
    );

  var secteur =
    valeurStandardV5_(
      data,
      "sector"
    );

  var zone =
    valeurStandardV5_(
      data,
      "marketArea"
    ) ||
    valeurStandardV5_(
      data,
      "country"
    );

  var stade =
    valeurStandardV5_(
      data,
      "stage"
    );

  var identite = [];

  if (projet) {
    identite.push([
      "Projet",
      projet
    ]);
  }

  if (secteur) {
    identite.push([
      "Secteur",
      secteur
    ]);
  }

  if (zone) {
    identite.push([
      "Zone de lancement",
      zone
    ]);
  }

  if (stade) {
    identite.push([
      "Stade",
      stade
    ]);
  }

  if (identite.length) {
    ajouterTableauInformations(
      body,
      identite
    );
  }

  var probleme =
    valeurStandardV5_(
      data,
      "problem"
    );

  var solution =
    valeurStandardV5_(
      data,
      "solution"
    );

  var proposition =
    valeurStandardV5_(
      data,
      "valueProposition"
    );

  var modele =
    valeurStandardV5_(
      data,
      "revenueModel"
    );

  var clients =
    valeurStandardV5_(
      data,
      "targetCustomers"
    );

  var impact =
    valeurStandardV5_(
      data,
      "impact"
    );

  var fundingType =
    valeurStandardV5_(
      data,
      "fundingType"
    );

  var fundingNeed =
    valeurStandardV5_(
      data,
      "fundingNeed"
    );

  var financement = "";

  if (
    fundingType &&
    fundingNeed
  ) {
    financement =
      fundingType +
      " — " +
      fundingNeed;
  } else {
    financement =
      fundingNeed ||
      fundingType;
  }

  /*
   * V5.1 :
   * synthèse volontairement compacte afin de rester
   * sur une seule page dans le PDF final.
   */
  ajouterDeuxCartesCompactesSyntheseV51_(
    body,
    "PROBLÈME",
    probleme,
    "SOLUTION",
    solution
  );

  ajouterEncadreCompactSyntheseV51_(
    body,
    "PROPOSITION DE VALEUR",
    proposition
  );

  ajouterDeuxCartesCompactesSyntheseV51_(
    body,
    "MODÈLE ÉCONOMIQUE",
    modele,
    "CLIENTÈLE CIBLE",
    clients
  );

  ajouterDeuxCartesCompactesSyntheseV51_(
    body,
    "IMPACT DÉCLARÉ",
    impact,
    "FINANCEMENT RECHERCHÉ",
    financement
  );

  /*
   * Force le chapitre suivant à commencer sur une nouvelle page.
   * La synthèse reste ainsi un bloc visuel autonome.
   */
  body.appendPageBreak();
}
function testerGenerationStandardRapidePDF() {
  var data = {
    projectName: "GreenStep Shoes",
    promoterName: "Client Test",
    email: "test@example.com",
    country: "CAMEROUN",
    sector: "Commerce",
    stage: "Prototype",

    problem:
      "Une partie de la population a difficilement accès à des chaussures abordables.",

    affectedPeople:
      "Les ménages à revenus modestes et la classe moyenne.",

    urgency:
      "Le coût élevé des chaussures limite l'accès à des produits adaptés.",

    solution:
      "Commercialiser des chaussures de qualité à prix accessible.",

    valueProposition:
      "Des chaussures accessibles adaptées au pouvoir d'achat local.",

    benefit:
      "Améliorer l'accès à des chaussures de qualité.",

    targetCustomers:
      "Classe moyenne, jeunes actifs et ménages à revenus modestes.",

    marketArea:
      "Cameroun avec extension progressive dans d'autres marchés africains.",

    competitors:
      "Boutiques de chaussures existantes et vendeurs en ligne.",

    revenueModel:
      "Vente directe de chaussures aux particuliers.",

    pricing:
      "10 000 FCFA en moyenne par paire.",

    mainCosts:
      "Achat du stock, logistique, communication et maintenance du site web.",

    salesChannels:
      "Site web, réseaux sociaux et vente directe.",

    team:
      "Un promoteur, un responsable technique et des partenaires commerciaux.",

    fundingType:
      "Prêt bancaire",

    fundingNeed:
      "10 000 000 FCFA",

    useOfFunds:
      "Augmentation du stock, finalisation du site web et lancement commercial.",

    impact:
      "Améliorer l'accès à des chaussures abordables et créer des emplois.",

    risks:
      "Concurrence, disponibilité du stock et pression sur la trésorerie."
  };

  Logger.log("=== TEST BUSINESS PLAN STANDARD 5.8 ===");
  Logger.log("Projet : " + data.projectName);

  try {

    var resultat = genererBusinessPlan_(data);

    Logger.log("=== RESULTAT GENERATION ===");
    Logger.log(
      JSON.stringify(
        resultat,
        null,
        2
      )
    );

    if (resultat && resultat.success) {

      Logger.log("=== TEST REUSSI ===");

      if (resultat.docUrl) {
        Logger.log(
          "GOOGLE DOCS : " +
          resultat.docUrl
        );
      }

      if (resultat.pdfUrl) {
        Logger.log(
          "PDF : " +
          resultat.pdfUrl
        );
      }

      if (resultat.pdfDownloadUrl) {
        Logger.log(
          "TELECHARGEMENT PDF : " +
          resultat.pdfDownloadUrl
        );
      }

    } else {

      Logger.log("=== TEST ECHEC ===");

      Logger.log(
        resultat &&
        resultat.error
          ? resultat.error
          : "Erreur inconnue"
      );
    }

    return resultat;

  } catch (erreur) {

    Logger.log(
      "=== ERREUR TEST 5.8 ==="
    );

    Logger.log(
      erreur &&
      erreur.stack
        ? erreur.stack
        : erreur
    );

    throw erreur;
  }
}
