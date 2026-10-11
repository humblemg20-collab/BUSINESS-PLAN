/**
 * AfriGreen24 — Premium Bancable Renderer Smoke Test V1
 */
var AG24_PREMIUM_BANCABLE_RENDERER_TEST_V1 = Object.freeze({
  VERSION:"1.0.0"
});

function AG24_PREMIUM_BANCABLE_RENDERER_TEST_fixture_() {
  var monthly = [];
  for (var m=1; m<=12; m++) {
    monthly.push({
      mois:m,
      soldeInitial:20000000 - ((m - 1) * 300000),
      paiement:450000,
      interets:150000,
      capital:300000,
      soldeFinal:20000000 - (m * 300000)
    });
  }

  return {
    dossier:{
      dossierId:"BPB_PREMIUM_RENDER_TEST",
      standard:{
        nomProjet:"Mango Value Premium",
        nomPromoteur:"Awa Diallo",
        fonctionPromoteur:"Fondatrice",
        pays:"Sénégal",
        secteur:"Agroalimentaire",
        stade:"Premières ventes",
        problemeResolu:"Réduire les pertes post-récolte.",
        solution:"Transformer localement les mangues.",
        clientsCibles:"Distributeurs et hôtels",
        tailleMarche:"Marché national",
        concurrents:"Transformateurs locaux;Produits importés",
        avantageConcurrentiel:"Traçabilité et qualité régulière",
        sourcesRevenus:"Vente de produits transformés",
        strategieCommerciale:"Vente B2B directe"
      },
      bancable:{
        devise:"XOF",
        stadeProjet:"Premières ventes",
        montantDemande:20000000,
        utilisationFonds:[
          {poste:"Équipements",montant:14000000},
          {poste:"Fonds de roulement",montant:6000000}
        ],
        lignesVentes:[
          {
            nom:"Mangues séchées",
            prixUnitaire:1500,
            volumeMensuel:3000,
            coutVariableUnitaire:650
          }
        ],
        baseHypothesesVentes:["Ventes déjà réalisées"],
        justificationHypothesesVentes:
          "Prix issus des ventes pilotes et volumes alignés sur la capacité.",
        croissanceAnnuellePct:10,
        salairesMensuels:850000,
        loyersMensuels:250000,
        marketingMensuel:150000,
        energieTelecomMensuel:200000,
        transportLogistiqueMensuel:250000,
        administrationMensuel:120000,
        impotsTaxesMensuels:100000,
        autresChargesFixesMensuelles:80000,
        nombreClientsActuels:18,
        chiffreAffairesHistorique:8500000,
        responsableOperations:"Awa Diallo",
        responsableFinances:"RAF",
        effectifActuel:4,
        tauxInteretAnnuel:10,
        dureeRemboursementMois:60,
        differeMois:3,
        dettesFinancieresExistantes:0,
        mensualitesDettesExistantes:0,
        mensualiteMaxSupportable:600000,
        dateDebutRemboursementSouhaitee:"2027-01-01",
        sourceRemboursement:
          "Flux opérationnels issus des ventes.",
        scenarioBaisseVentesPct:20,
        scenarioHausseCoutsPct:10,
        risques:[
          {
            risque:"Approvisionnement saisonnier",
            probabilite:"Moyenne",
            impact:"Élevé",
            mesure:"Diversifier les fournisseurs."
          },
          {
            risque:"Pression sur les coûts",
            probabilite:"Moyenne",
            impact:"Moyen",
            mesure:"Réviser les prix."
          }
        ]
      },
      audit:{
        indicateurs:{
          devise:"XOF",
          chiffreAffairesMensuel:4500000,
          chiffreAffairesAnnuel:54000000,
          coutsVariablesMensuels:1950000,
          chargesFixesMensuelles:2000000,
          margeBruteMensuelle:2550000,
          tauxMargeBrutePct:56.7,
          capaciteDisponibleAvantNouvelleDette:550000,
          mensualiteEstimee:450000,
          serviceNouvelleDetteAn1:5400000,
          couvertureMensuelleSimplifiee:1.22,
          scenarioPrudent:{
            chiffreAffairesMensuel:3600000,
            capaciteDisponibleAvantNouvelleDette:300000,
            couvertureMensuelleSimplifiee:0.67
          }
        },
        score:{total:78},
        niveau:"PRÉPARÉ",
        alertes:[],
        pointsForts:[]
      }
    },
    financialModel:{
      annees:[
        {
          chiffreAffaires:54000000,
          coutsVariables:23400000,
          margeBrute:30600000,
          chargesFixes:24000000,
          excedentOperationnel:6600000,
          serviceDetteExistante:0,
          serviceNouvelleDette:5400000,
          serviceDette:5400000,
          soldeApresDette:1200000
        },
        {
          chiffreAffaires:59400000,
          coutsVariables:25740000,
          margeBrute:33660000,
          chargesFixes:24000000,
          excedentOperationnel:9660000,
          serviceDetteExistante:0,
          serviceNouvelleDette:5400000,
          serviceDette:5400000,
          soldeApresDette:4260000
        },
        {
          chiffreAffaires:65340000,
          coutsVariables:28314000,
          margeBrute:37026000,
          chargesFixes:24000000,
          excedentOperationnel:13026000,
          serviceDetteExistante:0,
          serviceNouvelleDette:5400000,
          serviceDette:5400000,
          soldeApresDette:7626000
        }
      ],
      echeancier:{
        mensualiteApresDiffere:450000,
        annuel:[
          {annee:1,paiements:5400000},
          {annee:2,paiements:5400000},
          {annee:3,paiements:5400000}
        ],
        mensuel:monthly
      },
      scenarios:[
        {
          nom:"Prudent",
          chiffreAffairesMensuel:3600000,
          excedentOperationnelMensuel:300000,
          couverture:0.67
        },
        {
          nom:"Central",
          chiffreAffairesMensuel:4500000,
          excedentOperationnelMensuel:550000,
          couverture:1.22
        },
        {
          nom:"Favorable",
          chiffreAffairesMensuel:4950000,
          excedentOperationnelMensuel:850000,
          couverture:1.89
        }
      ]
    }
  };
}

function AG24_PREMIUM_BANCABLE_RENDERER_SYSTEM_TEST_V1() {
  var folderId = "";
  var documentId = "";
  var pdfId = "";

  var report = {
    success:false,
    version:AG24_PREMIUM_BANCABLE_RENDERER_TEST_V1.VERSION,
    renderer:"",
    premiumComposerActive:false,
    bankAppendixPresent:false,
    pdfCreated:false,
    physicalPageCount:0,
    cleanupSuccess:false,
    failureCode:""
  };

  try {
    var fixture =
      AG24_PREMIUM_BANCABLE_RENDERER_TEST_fixture_();

    var folder =
      DriveApp.createFolder(
        "AG24 Premium Bancable Renderer Test " +
        String(new Date().getTime())
      );

    folderId = folder.getId();

    var result =
      AG24_PREMIUM_BANCABLE_RENDERER_createPremium_(
        fixture.dossier,
        fixture.financialModel,
        folder
      );

    documentId = result.documentId;
    pdfId = result.pdfId;
    report.renderer = result.renderer;

    report.premiumComposerActive =
      Boolean(
        result.designResult &&
        result.designResult.audienceComposer &&
        result.designResult.audienceComposer.success === true &&
        result.designResult.audienceComposer.audience === "BANK"
      );

    var reopened =
      DocumentApp.openById(documentId);

    var text = reopened.getBody().getText();

    report.bankAppendixPresent =
      text.indexOf("Annexes financières bancaires") !== -1 &&
      text.indexOf("Hypothèses de chiffre d’affaires") !== -1 &&
      text.indexOf("Prévisions financières simplifiées sur trois ans") !== -1 &&
      text.indexOf("Capacité de remboursement") !== -1 &&
      text.indexOf("Analyse de sensibilité") !== -1 &&
      text.indexOf("Échéancier mensuel indicatif") !== -1;

    reopened.saveAndClose();

    report.pdfCreated =
      Boolean(
        pdfId &&
        DriveApp.getFileById(pdfId)
          .getBlob()
          .getBytes()
          .length > 1000
      );

    report.physicalPageCount =
      result.visualQualityPdf &&
      result.visualQualityPdf.physicalPageCount
        ? Number(result.visualQualityPdf.physicalPageCount)
        : 0;

    report.success =
      report.renderer === "PREMIUM_V2" &&
      report.premiumComposerActive === true &&
      report.bankAppendixPresent === true &&
      report.pdfCreated === true &&
      report.physicalPageCount > 0;

    if (!report.success) {
      report.failureCode =
        "PREMIUM_BANCABLE_RENDERER_CONTRACT_FAILED";
    }

  } catch (error) {
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
        var folder = DriveApp.getFolderById(folderId);
        var files = folder.getFiles();
        while (files.hasNext()) {
          files.next().setTrashed(true);
        }
        folder.setTrashed(true);
        report.cleanupSuccess = folder.isTrashed() === true;
      } catch (e3) {
        report.cleanupSuccess = false;
      }
    }

    report.success =
      report.success &&
      report.cleanupSuccess;

    Logger.log(JSON.stringify(report,null,2));
  }

  return report;
}
