/**
 * ============================================================
 * AFRIGREEN24 — COMMERCIAL FOLLOW-UP
 * Fichier : CommercialFollowUp.gs
 * ============================================================
 *
 * Crée automatiquement un brouillon Gmail personnalisé
 * pour un prospect enregistré dans l'onglet Soumissions.
 */


/**
 * Crée un brouillon Gmail à partir d'une ligne Sheets.
 *
 * @param {number} numeroLigne Numéro de ligne dans Soumissions.
 * @return {Object}
 */
function creerBrouillonCommercial_(numeroLigne) {
  var classeur = SpreadsheetApp.openById(
    AFRIGREEN24_SHEET_ID
  );

  var feuille = classeur.getSheetByName(
    AFRIGREEN24_SHEET_NAME
  );

  if (!feuille) {
    throw new Error(
      "L'onglet Soumissions est introuvable."
    );
  }

  numeroLigne = Number(numeroLigne);

  if (
    !numeroLigne ||
    numeroLigne < 2 ||
    numeroLigne > feuille.getLastRow()
  ) {
    throw new Error(
      "Numéro de ligne invalide : " + numeroLigne
    );
  }

  var donnees = feuille
    .getDataRange()
    .getValues();

  var entetes = donnees[0];
  var ligne = donnees[numeroLigne - 1];

  var prospect = construireProspectCommercial(
    entetes,
    ligne
  );

  if (!prospect.email) {
    throw new Error(
      "Aucune adresse email disponible pour ce prospect."
    );
  }

  var message = construireMessageCommercial(
    prospect
  );

 GmailApp.createDraft(
  prospect.email,
  message.objet,
  message.texte,
  {
    htmlBody: message.html,
    name: "AfriGreen24",
    replyTo: "afrigreen24@gmail.com"
  }
);
  mettreAJourSuiviCommercial(
    feuille,
    numeroLigne,
    entetes,
    "BROUILLON CRÉÉ",
    "Vérifier puis envoyer le brouillon Gmail"
  );

  return {
    success: true,
    email: prospect.email,
    projet: prospect.projet,
    offre: prospect.offre,
    message:
      "Le brouillon Gmail a été créé avec succès."
  };
}


/**
 * Construit le profil commercial depuis une ligne Sheets.
 */
function construireProspectCommercial(
  entetes,
  ligne
) {
  return {
    nom: lireValeurColonne(
      entetes,
      ligne,
      "NOM DU PORTEUR"
    ),

    email: lireValeurColonne(
      entetes,
      ligne,
      "EMAIL"
    ),

    projet: lireValeurColonne(
      entetes,
      ligne,
      "NOM DU PROJET"
    ),

    pays: lireValeurColonne(
      entetes,
      ligne,
      "PAYS"
    ),

    secteur: lireValeurColonne(
      entetes,
      ligne,
      "SECTEUR"
    ),

    score: lireValeurColonne(
      entetes,
      ligne,
      "SCORE COMMERCIAL"
    ),

    maturite: lireValeurColonne(
      entetes,
      ligne,
      "MATURITÉ"
    ),

    segment: lireValeurColonne(
      entetes,
      ligne,
      "SEGMENT"
    ),

    besoin: lireValeurColonne(
      entetes,
      ligne,
      "BESOIN PRINCIPAL"
    ),

    priorite: lireValeurColonne(
      entetes,
      ligne,
      "PRIORITÉ"
    ),

    offre: lireValeurColonne(
      entetes,
      ligne,
      "OFFRE RECOMMANDÉE"
    ),

    pdfUrl: lireValeurColonne(
      entetes,
      ligne,
      "LIEN PDF"
    )
  };
}


/**
 * Retourne une valeur à partir du nom de sa colonne.
 */
function lireValeurColonne(
  entetes,
  ligne,
  nomColonne
) {
  var index = entetes.indexOf(
    nomColonne
  );

  if (index === -1) {
    return "";
  }

  return ligne[index] || "";
}


/**
 * Produit le message correspondant à l'offre recommandée.
 */
/**
 * Construit l’email premium AfriGreen24.
 *
 * Parcours :
 * 1. Réciprocité : livraison du Business Plan.
 * 2. Offre principale : accompagnement personnalisé.
 * 3. Retrait-rejet : guide de financement accessible.
 */
/**
 * Construit l'email marketing premium AfriGreen24.
 *
 * Parcours commercial :
 * 1. Réciprocité : livraison gratuite du Business Plan.
 * 2. Prochaine étape : accompagnement personnalisé AfriGreen24.
 * 3. Retrait-rejet : guide de financement plus accessible.
 *
 * @param {Object} prospect Données commerciales du prospect.
 * @return {Object} Objet, texte brut et contenu HTML du mail.
 */
function construireMessageCommercial(prospect) {
  prospect = prospect || {};

  // ---------------------------------------------------------
  // 1. INFORMATIONS DU PROSPECT
  // ---------------------------------------------------------

  var nomComplet = valeurMarketing_(
    prospect.nom,
    prospect.promoterName,
    prospect.porteurProjet,
    prospect.nomPorteur,
    "Entrepreneur"
  );

  var prenom = premierPrenomMarketing_(nomComplet);

  var nomProjet = valeurMarketing_(
    prospect.projet,
    prospect.nomProjet,
    prospect.projectName,
    prospect.titreProjet,
    "votre projet"
  );

  var lienPdf = valeurMarketing_(
    prospect.lienPdf,
    prospect.pdfUrl,
    prospect.urlPdf,
    prospect.businessPlanUrl,
    ""
  );

  var besoinPrincipal = valeurMarketing_(
    prospect.besoinPrincipal,
    prospect.besoin,
    prospect.diagnostic,
    "Structurer les prochaines étapes de votre projet"
  );

  if (!lienPdf) {
    throw new Error(
      "Impossible de créer le brouillon : le lien du Business Plan est manquant."
    );
  }

  // ---------------------------------------------------------
  // 2. CONFIGURATION AFRIGREEN24
  // ---------------------------------------------------------

  var nomExpediteur = "AfriGreen24";

  var emailContact = "afrigreen24@gmail.com";

  var lienLogo =
    "https://img-thumb.mailinblue.com/10710656/images/content_library/original/6a681091b6fce5ac97246779.jpeg";

  var lienAccompagnement =
    "https://www.afrigreen24.com/formation?utm_source=chatgpt.com";

  var lienGuideEuropeAmeriques =
    "https://afrigreen24.systeme.io/ae219c62";

  var lienGuideAfrique =
    "https://selar.com/14057u6998?currency=XOF";

  // ---------------------------------------------------------
  // 3. LIEN DE CONTACT PERSONNALISÉ
  // ---------------------------------------------------------

  var sujetContact = encodeURIComponent(
    "Demande d'accompagnement AfriGreen24 - " + nomProjet
  );

  var corpsContact = encodeURIComponent(
    "Bonjour AfriGreen24,\n\n" +
    "Je souhaite échanger avec votre équipe au sujet de mon projet : " +
    nomProjet +
    ".\n\n" +
    "Mon besoin principal identifié est : " +
    besoinPrincipal +
    ".\n\n" +
    "Cordialement,\n" +
    nomComplet
  );

  var lienContact =
    "mailto:" +
    emailContact +
    "?subject=" +
    sujetContact +
    "&body=" +
    corpsContact;

  // ---------------------------------------------------------
  // 4. OBJET DU MAIL
  // ---------------------------------------------------------

  var sujet =
    prenom +
    ", votre Business Plan AfriGreen24 est prêt";

  // ---------------------------------------------------------
  // 5. PROTECTION DES VALEURS HTML
  // ---------------------------------------------------------

  var prenomHtml = echapperHtmlMarketing_(prenom);
  var projetHtml = echapperHtmlMarketing_(nomProjet);
  var besoinHtml = echapperHtmlMarketing_(besoinPrincipal);
  var lienPdfHtml = echapperHtmlMarketing_(lienPdf);
  var lienLogoHtml = echapperHtmlMarketing_(lienLogo);
  var lienContactHtml = echapperHtmlMarketing_(lienContact);

  var lienAccompagnementHtml =
    echapperHtmlMarketing_(lienAccompagnement);

  var lienGuideEuropeAmeriquesHtml =
    echapperHtmlMarketing_(lienGuideEuropeAmeriques);

  var lienGuideAfriqueHtml =
    echapperHtmlMarketing_(lienGuideAfrique);

  // ---------------------------------------------------------
  // 6. VERSION HTML PREMIUM
  // ---------------------------------------------------------

  var htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>${echapperHtmlMarketing_(sujet)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f3f6f4;
  font-family:Arial,Helvetica,sans-serif;
  color:#17352b;
">

  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
  ">
    Téléchargez votre Business Plan et choisissez la prochaine
    étape pour développer votre projet.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      margin:0;
      padding:0;
      background-color:#f3f6f4;
    "
  >
    <tr>
      <td align="center" style="padding:24px 10px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:620px;
            background-color:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 6px 24px rgba(23,53,43,0.09);
          "
        >

          <!-- EN-TÊTE -->
          <tr>
            <td
              align="center"
              style="
                padding:26px 24px 28px;
                background-color:#126b45;
              "
            >

              <img
                src="cid:logoAfriGreen24"
                width="150"
                alt="AfriGreen24"
                style="
                  display:block;
                  width:150px;
                  max-width:100%;
                  height:auto;
                  margin:0 auto 20px;
                  border:0;
                  outline:none;
                  text-decoration:none;
                "
              >

              <div style="
                margin:0 0 9px;
                color:#d9b44a;
                font-size:12px;
                font-weight:700;
                line-height:1.4;
                letter-spacing:1.5px;
                text-transform:uppercase;
              ">
                Business Plan AfriGreen24
              </div>

              <h1 style="
                margin:0 0 10px;
                color:#ffffff;
                font-size:27px;
                line-height:1.25;
                font-weight:700;
              ">
                Votre Business Plan est prêt
              </h1>

              <p style="
                margin:0;
                color:#e7f4ed;
                font-size:15px;
                line-height:1.55;
              ">
                Une première étape concrète pour faire avancer
                <strong>${projetHtml}</strong>.
              </p>

            </td>
          </tr>

          <!-- LIVRAISON DU BUSINESS PLAN -->
          <tr>
            <td style="padding:28px 28px 22px;">

              <p style="
                margin:0 0 12px;
                color:#17352b;
                font-size:16px;
                line-height:1.6;
              ">
                Bonjour <strong>${prenomHtml}</strong>,
              </p>

              <p style="
                margin:0 0 16px;
                color:#435a51;
                font-size:15px;
                line-height:1.65;
              ">
                Félicitations. À partir des informations que vous
                nous avez transmises, AfriGreen24 a préparé le
                Business Plan personnalisé de votre projet.
              </p>

              <p style="
                margin:0 0 20px;
                color:#17352b;
                font-size:15px;
                line-height:1.6;
                font-weight:700;
                text-align:center;
              ">
                Cliquez ci-dessous pour télécharger votre document.
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                align="center"
                style="margin:0 auto;"
              >
                <tr>
                  <td
                    bgcolor="#126b45"
                    style="
                      background-color:#126b45;
                      border-radius:8px;
                    "
                  >
                    <a
                      href="${lienPdfHtml}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:16px 25px;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:15px;
                        line-height:1.2;
                        font-weight:700;
                        text-align:center;
                      "
                    >
                      TÉLÉCHARGER MON BUSINESS PLAN
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- PROGRESSION -->
          <tr>
            <td style="padding:0 28px 22px;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  background-color:#edf7f1;
                  border-radius:10px;
                "
              >
                <tr>
                  <td style="padding:17px 18px;">

                    <div style="
                      margin:0 0 7px;
                      color:#126b45;
                      font-size:12px;
                      line-height:1.4;
                      font-weight:700;
                      letter-spacing:0.8px;
                      text-transform:uppercase;
                    ">
                      Première étape terminée
                    </div>

                    <div style="
                      margin:0 0 5px;
                      color:#17352b;
                      font-size:16px;
                      line-height:1.45;
                      font-weight:700;
                    ">
                      Votre Business Plan a été généré
                    </div>

                    <div style="
                      margin:0;
                      color:#435a51;
                      font-size:14px;
                      line-height:1.55;
                    ">
                      Prochaine étape : transformer ce document en
                      actions concrètes et préparer votre recherche
                      de financement.
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- DIAGNOSTIC PERSONNALISÉ -->
          <tr>
            <td style="padding:0 28px 22px;">

              <div style="
                padding:17px 18px;
                background-color:#ffffff;
                border:1px solid #d8e5df;
                border-left:4px solid #126b45;
                border-radius:8px;
              ">

                <div style="
                  margin:0 0 6px;
                  color:#126b45;
                  font-size:12px;
                  line-height:1.4;
                  font-weight:700;
                  letter-spacing:0.8px;
                  text-transform:uppercase;
                ">
                  Priorité identifiée pour votre projet
                </div>

                <div style="
                  margin:0;
                  color:#17352b;
                  font-size:16px;
                  line-height:1.5;
                  font-weight:700;
                ">
                  ${besoinHtml}
                </div>

              </div>

            </td>
          </tr>

          <!-- INTRODUCTION AUX DEUX PARCOURS -->
          <tr>
            <td style="padding:2px 28px 20px;">

              <h2 style="
                margin:0 0 9px;
                color:#17352b;
                font-size:21px;
                line-height:1.35;
                text-align:center;
              ">
                Choisissez votre prochaine étape
              </h2>

              <p style="
                margin:0;
                color:#435a51;
                font-size:14px;
                line-height:1.65;
                text-align:center;
              ">
                Vous pouvez bénéficier d’un accompagnement
                personnalisé ou commencer de manière autonome avec
                notre guide pratique de recherche de financement.
              </p>

            </td>
          </tr>

          <!-- OFFRE PREMIUM -->
          <tr>
            <td style="padding:0 28px 22px;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  border:1px solid #d7e4de;
                  border-radius:12px;
                  background-color:#ffffff;
                "
              >
                <tr>
                  <td style="padding:23px;">

                    <div style="
                      margin:0 0 7px;
                      color:#126b45;
                      font-size:12px;
                      line-height:1.4;
                      font-weight:700;
                      letter-spacing:0.8px;
                      text-transform:uppercase;
                    ">
                      Accompagnement personnalisé
                    </div>

                    <h2 style="
                      margin:0 0 11px;
                      color:#126b45;
                      font-size:21px;
                      line-height:1.35;
                    ">
                      Passez à la mise en œuvre
                    </h2>

                    <p style="
                      margin:0 0 12px;
                      color:#435a51;
                      font-size:14px;
                      line-height:1.65;
                    ">
                      Votre Business Plan constitue une étape
                      importante. Sa mise en œuvre, la recherche de
                      partenaires et la préparation au financement
                      nécessitent toutefois un suivi structuré.
                    </p>

                    <p style="
                      margin:0 0 19px;
                      color:#17352b;
                      font-size:15px;
                      line-height:1.65;
                    ">
                      AfriGreen24 peut vous accompagner
                      personnellement pour transformer votre
                      Business Plan en véritable plan d’action.
                    </p>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      align="center"
                      style="margin:0 auto 12px;"
                    >
                      <tr>
                        <td
                          style="
                            border:2px solid #126b45;
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${lienAccompagnementHtml}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:13px 21px;
                              color:#126b45;
                              text-decoration:none;
                              font-size:14px;
                              line-height:1.25;
                              font-weight:700;
                              text-align:center;
                            "
                          >
                            DÉCOUVRIR L’ACCOMPAGNEMENT
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      align="center"
                      style="margin:0 auto;"
                    >
                      <tr>
                        <td
                          bgcolor="#126b45"
                          style="
                            background-color:#126b45;
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${lienContactHtml}"
                            style="
                              display:inline-block;
                              padding:14px 24px;
                              color:#ffffff;
                              text-decoration:none;
                              font-size:14px;
                              line-height:1.25;
                              font-weight:700;
                              text-align:center;
                            "
                          >
                            ÉCHANGER AVEC AFRIGREEN24
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="
                      margin:13px 0 0;
                      color:#687a72;
                      font-size:12px;
                      line-height:1.55;
                      text-align:center;
                    ">
                      Notre équipe vous orientera vers la formule la
                      plus adaptée à votre projet.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- OFFRE DE REPLI / GUIDE -->
          <tr>
            <td style="padding:0 28px 28px;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  background-color:#fff8e5;
                  border:2px solid #d9b44a;
                  border-radius:12px;
                "
              >
                <tr>
                  <td style="padding:24px 22px;">

                    <div style="
                      margin:0 0 7px;
                      color:#896b18;
                      font-size:12px;
                      line-height:1.4;
                      font-weight:700;
                      letter-spacing:0.8px;
                      text-transform:uppercase;
                    ">
                      Solution accessible
                    </div>

                    <h2 style="
                      margin:0 0 11px;
                      color:#17352b;
                      font-size:21px;
                      line-height:1.4;
                    ">
                      Pas encore le budget pour un accompagnement
                      complet ?
                    </h2>

                    <p style="
                      margin:0 0 13px;
                      color:#435a51;
                      font-size:14px;
                      line-height:1.65;
                    ">
                      Commencez dès maintenant de manière autonome
                      avec notre
                      <strong>
                        Guide pratique de recherche de financement.
                      </strong>
                    </p>

                    <p style="
                      margin:0 0 16px;
                      color:#435a51;
                      font-size:14px;
                      line-height:1.65;
                    ">
                      Une méthode structurée pour identifier les
                      opportunités, préparer vos candidatures et
                      organiser vos démarches étape par étape.
                    </p>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        width:100%;
                        margin:0 0 18px;
                        background-color:#ffffff;
                        border-radius:8px;
                      "
                    >
                      <tr>
                        <td style="padding:14px 16px;">

                          <div style="
                            margin:0 0 7px;
                            color:#17352b;
                            font-size:13px;
                            line-height:1.5;
                            font-weight:700;
                          ">
                            Le guide vous aide à :
                          </div>

                          <div style="
                            margin:0;
                            color:#435a51;
                            font-size:13px;
                            line-height:1.7;
                          ">
                            Identifier les financements adaptés<br>
                            Préparer des candidatures solides<br>
                            Structurer votre stratégie de financement<br>
                            Avancer de manière autonome
                          </div>

                        </td>
                      </tr>
                    </table>

                    <!-- EUROPE ET AMÉRIQUES -->
                    <div style="
                      margin:0 0 8px;
                      color:#17352b;
                      font-size:13px;
                      line-height:1.5;
                      font-weight:700;
                      text-align:center;
                    ">
                      Europe et Amériques
                    </div>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="width:100%;margin:0 0 17px;"
                    >
                      <tr>
                        <td
                          bgcolor="#d9b44a"
                          align="center"
                          style="
                            background-color:#d9b44a;
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${lienGuideEuropeAmeriquesHtml}"
                            target="_blank"
                            style="
                              display:block;
                              padding:15px 20px;
                              color:#17352b;
                              text-decoration:none;
                              font-size:14px;
                              line-height:1.25;
                              font-weight:700;
                              text-align:center;
                            "
                          >
                            OBTENIR LE GUIDE
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- AFRIQUE -->
                    <div style="
                      margin:0 0 8px;
                      color:#17352b;
                      font-size:13px;
                      line-height:1.5;
                      font-weight:700;
                      text-align:center;
                    ">
                      Afrique
                    </div>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="width:100%;margin:0;"
                    >
                      <tr>
                        <td
                          bgcolor="#d9b44a"
                          align="center"
                          style="
                            background-color:#d9b44a;
                            border-radius:8px;
                          "
                        >
                          <a
                            href="${lienGuideAfriqueHtml}"
                            target="_blank"
                            style="
                              display:block;
                              padding:15px 20px;
                              color:#17352b;
                              text-decoration:none;
                              font-size:14px;
                              line-height:1.25;
                              font-weight:700;
                              text-align:center;
                            "
                          >
                            OBTENIR LE GUIDE
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CONCLUSION -->
          <tr>
            <td
              align="center"
              style="
                padding:24px 28px;
                background-color:#17352b;
              "
            >

              <p style="
                margin:0 0 8px;
                color:#ffffff;
                font-size:14px;
                line-height:1.6;
              ">
                Ne laissez pas votre Business Plan rester un simple
                document.
              </p>

              <p style="
                margin:0 0 16px;
                color:#d9b44a;
                font-size:15px;
                line-height:1.5;
                font-weight:700;
              ">
                Choisissez votre prochaine étape et passez à
                l’action.
              </p>

              <p style="
                margin:0;
                color:#dce8e2;
                font-size:12px;
                line-height:1.65;
              ">
                ${nomExpediteur}<br>
                <a
                  href="mailto:${emailContact}"
                  style="
                    color:#dce8e2;
                    text-decoration:underline;
                  "
                >
                  ${emailContact}
                </a>
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  // ---------------------------------------------------------
  // 7. VERSION TEXTE BRUT
  // ---------------------------------------------------------

  var texteBrut =
    "Bonjour " + prenom + ",\n\n" +

    "Votre Business Plan personnalisé pour le projet " +
    nomProjet +
    " est prêt.\n\n" +

    "TÉLÉCHARGER MON BUSINESS PLAN\n" +
    lienPdf + "\n\n" +

    "PREMIÈRE ÉTAPE TERMINÉE\n" +
    "Votre Business Plan a été généré.\n\n" +

    "Prochaine étape : transformer ce document en actions " +
    "concrètes et préparer votre recherche de financement.\n\n" +

    "PRIORITÉ IDENTIFIÉE\n" +
    besoinPrincipal + "\n\n" +

    "ACCOMPAGNEMENT PERSONNALISÉ\n" +
    "AfriGreen24 peut vous accompagner pour transformer votre " +
    "Business Plan en véritable plan d'action.\n\n" +

    "Découvrir l'accompagnement :\n" +
    lienAccompagnement + "\n\n" +

    "Échanger avec AfriGreen24 :\n" +
    emailContact + "\n\n" +

    "PAS ENCORE LE BUDGET POUR UN ACCOMPAGNEMENT COMPLET ?\n\n" +

    "Commencez de manière autonome avec notre Guide pratique de " +
    "recherche de financement.\n\n" +

    "Le guide vous aide à identifier les opportunités, préparer " +
    "vos candidatures et structurer vos démarches étape par étape.\n\n" +

    "Europe et Amériques - Obtenir le guide :\n" +
    lienGuideEuropeAmeriques + "\n\n" +

    "Afrique - Obtenir le guide :\n" +
    lienGuideAfrique + "\n\n" +

    "Ne laissez pas votre Business Plan rester un simple document.\n" +
    "Choisissez votre prochaine étape et passez à l'action.\n\n" +

    "L'équipe AfriGreen24\n" +
    emailContact;

  // ---------------------------------------------------------
  // 8. RÉSULTAT
  // ---------------------------------------------------------

  return {
    objet: sujet,
    sujet: sujet,

    texte: texteBrut,
    body: texteBrut,

    html: htmlBody,
    htmlBody: htmlBody
  };
}


/**
 * Retourne la première valeur non vide.
 */
function valeurMarketing_() {
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
 * Extrait le prénom depuis un nom complet.
 */
function premierPrenomMarketing_(nomComplet) {
  var nom = String(
    nomComplet || "Entrepreneur"
  ).trim();

  if (!nom) {
    return "Entrepreneur";
  }

  return nom.split(/\s+/)[0];
}


/**
 * Protège les données injectées dans le HTML.
 */
function echapperHtmlMarketing_(valeur) {
  return String(valeur || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Message pour la préparation au financement.
 */
function construireMessageFinancement(
  prospect,
  prenom
) {
  var objet =
    "Prochaine étape pour le financement de " +
    prospect.projet;

  var texte =
    "Bonjour " + prenom + ",\n\n" +
    "Merci d'avoir utilisé le Business Plan Generator AfriGreen24 pour votre projet " +
    prospect.projet + ".\n\n" +
    "L'analyse de votre dossier montre que votre priorité actuelle est la préparation au financement.\n\n" +
    "Le principal besoin identifié est le suivant : " +
    prospect.besoin + ".\n\n" +
    "Nous pouvons vous accompagner pour structurer votre dossier, renforcer vos arguments et préparer les éléments attendus par les financeurs.\n\n" +
    "Votre Business Plan : " +
    prospect.pdfUrl + "\n\n" +
    "Répondez simplement à cet email pour organiser un premier échange.\n\n" +
    "Bien cordialement,\n" +
    "L'équipe AfriGreen24";

  return {
    objet: objet,
    texte: texte,
    html: construireHtmlCommercial(
      prospect,
      prenom,
      "Votre projet présente un besoin clair de préparation au financement.",
      "Nous pouvons vous aider à renforcer votre dossier, votre stratégie financière et votre présentation aux financeurs."
    )
  };
}


/**
 * Message pour la structuration du projet.
 */
function construireMessageStructuration(
  prospect,
  prenom
) {
  var objet =
    "Structuration de votre projet " +
    prospect.projet;

  var texte =
    "Bonjour " + prenom + ",\n\n" +
    "Merci d'avoir généré le Business Plan de votre projet " +
    prospect.projet + " avec AfriGreen24.\n\n" +
    "L'analyse montre que votre prochaine priorité est de structurer davantage le projet.\n\n" +
    "Le besoin principal identifié est : " +
    prospect.besoin + ".\n\n" +
    "Nous pouvons vous accompagner pour clarifier le modèle économique, le marché, le plan d'action et les prochaines étapes.\n\n" +
    "Votre Business Plan : " +
    prospect.pdfUrl + "\n\n" +
    "Répondez à cet email pour organiser un premier échange.\n\n" +
    "Bien cordialement,\n" +
    "L'équipe AfriGreen24";

  return {
    objet: objet,
    texte: texte,
    html: construireHtmlCommercial(
      prospect,
      prenom,
      "Votre projet dispose d'une base intéressante qui mérite maintenant d'être structurée.",
      "Nous pouvons vous aider à transformer cette base en plan stratégique, commercial et opérationnel concret."
    )
  };
}


/**
 * Message pour le diagnostic stratégique.
 */
function construireMessageDiagnostic(
  prospect,
  prenom
) {
  var objet =
    "Diagnostic stratégique de " +
    prospect.projet;

  var texte =
    "Bonjour " + prenom + ",\n\n" +
    "Merci d'avoir utilisé le Business Plan Generator AfriGreen24 pour votre projet " +
    prospect.projet + ".\n\n" +
    "Votre projet présente plusieurs éléments intéressants. Un diagnostic stratégique permettrait maintenant d'identifier les forces, les risques et les décisions prioritaires.\n\n" +
    "Besoin identifié : " +
    prospect.besoin + ".\n\n" +
    "Votre Business Plan : " +
    prospect.pdfUrl + "\n\n" +
    "Répondez simplement à cet email pour organiser un premier échange.\n\n" +
    "Bien cordialement,\n" +
    "L'équipe AfriGreen24";

  return {
    objet: objet,
    texte: texte,
    html: construireHtmlCommercial(
      prospect,
      prenom,
      "Votre projet mérite un diagnostic stratégique approfondi.",
      "Nous pouvons vous aider à identifier les priorités, les risques et les leviers de croissance."
    )
  };
}


/**
 * Produit le message HTML AfriGreen24.
 */
function construireHtmlCommercial(
  prospect,
  prenom,
  introduction,
  accompagnement
) {
  var lienPdf = prospect.pdfUrl
    ? '<p style="margin:24px 0;">' +
      '<a href="' +
      prospect.pdfUrl +
      '" style="' +
      'background:#0B6B3A;' +
      'color:#ffffff;' +
      'padding:12px 18px;' +
      'text-decoration:none;' +
      'border-radius:6px;' +
      'font-weight:bold;' +
      '">' +
      'Consulter votre Business Plan' +
      '</a></p>'
    : "";

  return (
    '<div style="' +
      'font-family:Arial,sans-serif;' +
      'max-width:640px;' +
      'color:#1F2937;' +
      'line-height:1.6;' +
    '">' +

      '<div style="' +
        'background:#0B6B3A;' +
        'color:#ffffff;' +
        'padding:20px;' +
        'font-size:20px;' +
        'font-weight:bold;' +
      '">' +
        'AfriGreen24' +
      '</div>' +

      '<div style="padding:24px;">' +

        '<p>Bonjour ' +
          echapperHtmlCommercial(prenom) +
        ',</p>' +

        '<p>Merci d’avoir utilisé le Business Plan Generator AfriGreen24 pour votre projet <strong>' +
          echapperHtmlCommercial(prospect.projet) +
        '</strong>.</p>' +

        '<p>' +
          echapperHtmlCommercial(introduction) +
        '</p>' +

        '<div style="' +
          'background:#F4FBF6;' +
          'border-left:4px solid #0B6B3A;' +
          'padding:14px;' +
          'margin:20px 0;' +
        '">' +
          '<strong>Besoin principal identifié</strong><br>' +
          echapperHtmlCommercial(prospect.besoin) +
        '</div>' +

        '<p>' +
          echapperHtmlCommercial(accompagnement) +
        '</p>' +

        lienPdf +

        '<p>Répondez simplement à cet email pour organiser un premier échange.</p>' +

        '<p>Bien cordialement,<br>' +
          '<strong>L’équipe AfriGreen24</strong><br>' +
          'L’Afrique verte en action' +
        '</p>' +

      '</div>' +
    '</div>'
  );
}


/**
 * Met à jour le suivi dans Google Sheets.
 */
function mettreAJourSuiviCommercial(
  feuille,
  numeroLigne,
  entetes,
  statut,
  prochaineAction
) {
  var indexStatut = entetes.indexOf(
    "STATUT COMMERCIAL"
  );

  var indexDernierContact = entetes.indexOf(
    "DERNIER CONTACT"
  );

  var indexProchaineAction = entetes.indexOf(
    "PROCHAINE ACTION"
  );

  if (indexStatut !== -1) {
    feuille
      .getRange(
        numeroLigne,
        indexStatut + 1
      )
      .setValue(statut);
  }

  if (indexDernierContact !== -1) {
    feuille
      .getRange(
        numeroLigne,
        indexDernierContact + 1
      )
      .setValue(new Date())
      .setNumberFormat(
        "dd/MM/yyyy HH:mm"
      );
  }

  if (indexProchaineAction !== -1) {
    feuille
      .getRange(
        numeroLigne,
        indexProchaineAction + 1
      )
      .setValue(prochaineAction);
  }
}


/**
 * Retourne le premier prénom disponible.
 */
function extrairePrenomCommercial(nomComplet) {
  var nom = String(
    nomComplet || ""
  ).trim();

  if (!nom) {
    return "Entrepreneur";
  }

  return nom.split(/\s+/)[0];
}


/**
 * Protège les contenus insérés dans le HTML.
 */
function echapperHtmlCommercial(valeur) {
  return String(valeur || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/**
 * Test avec la dernière soumission enregistrée.
 */
function testerBrouillonCommercial_() {
  var classeur = SpreadsheetApp.openById(
    AFRIGREEN24_SHEET_ID
  );

  var feuille = classeur.getSheetByName(
    AFRIGREEN24_SHEET_NAME
  );

  if (!feuille || feuille.getLastRow() < 2) {
    throw new Error(
      "Aucun prospect disponible pour le test."
    );
  }

  var derniereLigne = feuille.getLastRow();

  var resultat =
    creerBrouillonCommercial_(
      derniereLigne
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
 * Envoie automatiquement l’email premium après la génération
 * du Business Plan.
 *
 * @param {Object} data Données du formulaire.
 * @param {Object} liens Liens générés, notamment le PDF.
 * @param {Object} profilCommercial Analyse commerciale.
 * @return {Object} Résultat de l’envoi.
 */
function envoyerEmailCommercialAutomatique_(
  data,
  liens,
  profilCommercial
) {
  data = data || {};
  liens = liens || {};
  profilCommercial = profilCommercial || {};

  var prospect = {
    email: valeurMarketing_(
      data.email,
      data.userEmail,
      data.contactEmail,
      data.adresseEmail
    ),

    nom: valeurMarketing_(
      data.promoterName,
      data.nom,
      data.porteurProjet,
      data.nomPorteur,
      "Entrepreneur"
    ),

    projet: valeurMarketing_(
      data.projectName,
      data.nomProjet,
      data.projet,
      data.titreProjet,
      "votre projet"
    ),

    lienPdf: valeurMarketing_(
      liens.pdf,
      liens.lienPdf,
      liens.pdfUrl,
      liens.urlPdf,
      data.lienPdf
    ),

    besoinPrincipal: valeurMarketing_(
      profilCommercial.besoinPrincipal,
      data.besoinPrincipal,
      "Structurer les prochaines étapes de votre projet"
    )
  };

  if (!prospect.email) {
    throw new Error(
      "Envoi automatique impossible : adresse email manquante."
    );
  }

  if (!prospect.lienPdf) {
    throw new Error(
      "Envoi automatique impossible : lien PDF manquant."
    );
  }

  var message = construireMessageCommercial(prospect);

  var logoAfriGreen24 = obtenirLogoAfriGreen24();

var optionsEmail = {
  htmlBody: message.html,
  name: "AfriGreen24",
  replyTo: "afrigreen24@gmail.com"
};

if (logoAfriGreen24) {
  optionsEmail.inlineImages = {
    logoAfriGreen24: logoAfriGreen24
  };
}

GmailApp.sendEmail(
  prospect.email,
  message.objet,
  message.texte,
  optionsEmail
);

  Logger.log(
    "Email AfriGreen24 envoyé automatiquement à : " +
    prospect.email
  );

  return {
    success: true,
    email: prospect.email,
    dateEnvoi: new Date(),
    statut: "EMAIL_ENVOYE"
  };
}