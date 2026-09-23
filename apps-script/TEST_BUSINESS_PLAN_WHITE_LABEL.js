/**
 * ============================================================
 * TEST COMPLET — BUSINESS PLAN WHITE LABEL
 * ============================================================
 *
 * Objectifs :
 * 1. Générer un Business Plan réel.
 * 2. Vérifier l'insertion du logo client.
 * 3. Vérifier le slogan client dans le pied de page.
 * 4. Vérifier l'absence de toute mention AfriGreen24
 *    dans le Google Docs généré.
 * 5. Vérifier la création du PDF.
 *
 * Le test utilise un petit logo de démonstration embarqué.
 *
 * À lancer :
 *   TEST_BUSINESS_PLAN_WHITE_LABEL_COMPLET_()
 */

function TEST_BUSINESS_PLAN_WHITE_LABEL_COMPLET_() {
  Logger.log("==========================================");
  Logger.log("TEST COMPLET — BUSINESS PLAN WHITE LABEL");
  Logger.log("==========================================");

  var sloganTest =
    "Construire aujourd’hui, transformer demain.";

  var data = {
    projectName: "GreenStep Shoes",
    promoterName: "Client Test",
    email: "test@example.com",
    country: "Cameroun",
    sector: "Commerce",
    stage: "Je prépare le lancement",

    problem:
      "Une partie de la population accède difficilement à des chaussures de qualité adaptées au pouvoir d’achat local.",

    affectedPeople:
      "Les jeunes actifs, les ménages à revenus modestes et la classe moyenne.",

    urgency:
      "La hausse des prix limite l’accès à des produits de qualité pour une partie importante des consommateurs.",

    solution:
      "Commercialiser des chaussures de qualité à prix accessible à travers des canaux physiques et numériques.",

    valueProposition:
      "Une offre accessible, adaptée au marché local et distribuée par des canaux simples.",

    benefit:
      "Améliorer l’accès à des chaussures de qualité tout en développant une activité commerciale viable.",

    targetCustomers:
      "Les jeunes actifs, la classe moyenne et les ménages à revenus modestes.",

    marketArea:
      "Cameroun, avec un déploiement progressif dans les principales zones urbaines.",

    competitors:
      "Les boutiques de chaussures, les vendeurs en ligne et les distributeurs informels.",

    revenueModel:
      "Vente directe de chaussures aux particuliers.",

    pricing:
      "10 000 FCFA en moyenne par paire.",

    mainCosts:
      "Achat du stock, logistique, communication, distribution et maintenance du site web.",

    salesChannels:
      "Site web, réseaux sociaux, vente directe et partenariats commerciaux.",

    team:
      "Un promoteur, un responsable commercial, un responsable logistique et des partenaires techniques.",

    fundingType:
      "Prêt bancaire",

    fundingNeed:
      "10 000 000 FCFA",

    useOfFunds:
      "Augmentation du stock, finalisation du site web, logistique et lancement commercial.",

    impact:
      "Améliorer l’accès à des chaussures abordables et contribuer à la création d’emplois.",

    risks:
      "Concurrence, disponibilité du stock et pression sur la trésorerie.",

    organizationSlogan:
      sloganTest,

    logoUpload: {
      name: "greenstep-test-logo.png",
      mimeType: "image/png",
      dataUrl:
        "data:image/png;base64," +
        "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"
    }
  };

  Logger.log("Projet : " + data.projectName);
  Logger.log("Slogan test : " + sloganTest);
  Logger.log("------------------------------------------");
  Logger.log("Lancement genererBusinessPlan()...");

  var resultat =
    genererBusinessPlan(data);

  if (
    !resultat ||
    resultat.success !== true
  ) {
    throw new Error(
      "La génération a échoué : " +
      (
        resultat &&
        (resultat.error || resultat.message)
          ? (resultat.error || resultat.message)
          : "erreur inconnue"
      )
    );
  }

  Logger.log("✅ Génération terminée");

  var docId =
    resultat.documentId ||
    resultat.docId;

  var pdfId =
    resultat.pdfId;

  if (!docId) {
    throw new Error(
      "Aucun identifiant Google Docs retourné."
    );
  }

  if (!pdfId) {
    throw new Error(
      "Aucun identifiant PDF retourné."
    );
  }

  var document =
    DocumentApp.openById(docId);

  var body =
    document.getBody();

  var header =
    document.getHeader();

  var footer =
    document.getFooter();

  var bodyText =
    body ? body.getText() : "";

  var headerText =
    header ? header.getText() : "";

  var footerText =
    footer ? footer.getText() : "";

  var texteComplet =
    [
      bodyText,
      headerText,
      footerText
    ].join("\n");

  /*
   * TEST 1 — aucune marque AfriGreen24 dans le document.
   */
  if (
    /afrigreen24/i.test(
      texteComplet
    )
  ) {
    throw new Error(
      "ÉCHEC WHITE LABEL : une mention AfriGreen24 reste dans le document."
    );
  }

  Logger.log(
    "✅ 0 mention AfriGreen24 dans Google Docs"
  );

  /*
   * TEST 2 — slogan exact dans le pied de page.
   */
  if (
    footerText.indexOf(
      sloganTest
    ) === -1
  ) {
    throw new Error(
      "ÉCHEC SLOGAN : le slogan client est absent du pied de page."
    );
  }

  Logger.log(
    "✅ Slogan client détecté dans le pied de page"
  );

  /*
   * TEST 3 — logo présent dans le corps ET l'en-tête.
   */
  var imagesBody =
    compterImagesBusinessPlanTest_(body);

  var imagesHeader =
    compterImagesBusinessPlanTest_(header);

  if (imagesBody < 1) {
    throw new Error(
      "ÉCHEC LOGO : aucun logo détecté dans le corps du document."
    );
  }

  if (imagesHeader < 1) {
    throw new Error(
      "ÉCHEC LOGO : aucun logo détecté dans l'en-tête."
    );
  }

  Logger.log(
    "✅ Logo client détecté dans le corps : " +
    imagesBody
  );

  Logger.log(
    "✅ Logo client détecté dans l'en-tête : " +
    imagesHeader
  );

  /*
   * TEST 4 — PDF réellement créé.
   */
  var fichierPdf =
    DriveApp.getFileById(pdfId);

  if (
    fichierPdf.getMimeType() !==
    MimeType.PDF
  ) {
    throw new Error(
      "Le fichier final n'est pas un PDF."
    );
  }

  if (
    fichierPdf.getSize() <= 0
  ) {
    throw new Error(
      "Le PDF final est vide."
    );
  }

  Logger.log(
    "✅ PDF final valide"
  );

  Logger.log("------------------------------------------");
  Logger.log("RÉSULTAT FINAL");
  Logger.log("------------------------------------------");

  Logger.log(
    "Google Docs : " +
    (
      resultat.docUrl ||
      resultat.documentUrl ||
      resultat.url ||
      ""
    )
  );

  Logger.log(
    "PDF : " +
    (
      resultat.pdfUrl ||
      resultat.pdfLink ||
      ""
    )
  );

  Logger.log(
    "PDF Download : " +
    (
      resultat.pdfDownloadUrl ||
      resultat.downloadUrl ||
      ""
    )
  );

  Logger.log(
    "Images corps : " +
    imagesBody
  );

  Logger.log(
    "Images en-tête : " +
    imagesHeader
  );

  Logger.log(
    "Slogan footer : OUI"
  );

  Logger.log(
    "AfriGreen24 dans document : 0"
  );

  Logger.log("==========================================");
  Logger.log(
    "✅ TEST BUSINESS PLAN WHITE LABEL RÉUSSI"
  );
  Logger.log("==========================================");

  return {
    success: true,
    documentId: docId,
    pdfId: pdfId,
    docUrl:
      resultat.docUrl ||
      resultat.documentUrl ||
      resultat.url ||
      "",
    pdfUrl:
      resultat.pdfUrl ||
      resultat.pdfLink ||
      "",
    pdfDownloadUrl:
      resultat.pdfDownloadUrl ||
      resultat.downloadUrl ||
      "",
    sloganDetected: true,
    afriGreen24Mentions: 0,
    imagesBody: imagesBody,
    imagesHeader: imagesHeader
  };
}


/**
 * Compte récursivement les images intégrées dans un conteneur Docs.
 */
function compterImagesBusinessPlanTest_(element) {
  if (!element) {
    return 0;
  }

  var total = 0;

  try {
    if (
      element.getType &&
      element.getType() ===
      DocumentApp.ElementType.INLINE_IMAGE
    ) {
      return 1;
    }
  } catch (erreurType) {
    // Certains conteneurs racine n'exposent pas getType().
  }

  if (
    typeof element.getNumChildren !==
    "function"
  ) {
    return total;
  }

  var nombreEnfants =
    element.getNumChildren();

  for (
    var index = 0;
    index < nombreEnfants;
    index++
  ) {
    var enfant =
      element.getChild(index);

    total +=
      compterImagesBusinessPlanTest_(
        enfant
      );
  }

  return total;
}
