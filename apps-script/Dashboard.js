/**
 * ============================================================
 * AFRIGREEN24 — DASHBOARD COMMERCIAL
 * Fichier : Dashboard.gs
 * ============================================================
 */

var AFRIGREEN24_DASHBOARD_NAME = "Dashboard";


/**
 * Crée ou actualise le tableau de pilotage commercial.
 */
function actualiserDashboardCommercial_() {
  var classeur = SpreadsheetApp.openById(
    AFRIGREEN24_SHEET_ID
  );

  var feuilleSoumissions = classeur.getSheetByName(
    AFRIGREEN24_SHEET_NAME
  );

  if (!feuilleSoumissions) {
    throw new Error(
      "L'onglet Soumissions est introuvable."
    );
  }

  var feuilleDashboard = classeur.getSheetByName(
    AFRIGREEN24_DASHBOARD_NAME
  );

  if (!feuilleDashboard) {
    feuilleDashboard = classeur.insertSheet(
      AFRIGREEN24_DASHBOARD_NAME
    );
  }

  feuilleDashboard.clear();

  var donnees = feuilleSoumissions
    .getDataRange()
    .getValues();

  if (donnees.length < 2) {
    construireDashboardVide(
      feuilleDashboard
    );

    return {
      success: true,
      totalProspects: 0
    };
  }

  var entetes = donnees[0];

  var indexColonnes =
    obtenirIndexColonnesDashboard(
      entetes
    );

  var lignes = donnees.slice(1).filter(
    function(ligne) {
      return ligne[indexColonnes.id] !== "";
    }
  );

  var statistiques =
    calculerStatistiquesDashboard(
      lignes,
      indexColonnes
    );

  construireDashboardCommercial(
    feuilleDashboard,
    statistiques,
    lignes,
    indexColonnes
  );

  return {
    success: true,
    totalProspects: statistiques.total,
    tresHautePriorite:
      statistiques.tresHautePriorite,
    rechercheFinancement:
      statistiques.rechercheFinancement,
    contactSous24h:
      statistiques.contactSous24h
  };
}


/**
 * Repère automatiquement les colonnes importantes.
 */
function obtenirIndexColonnesDashboard(
  entetes
) {
  return {
    id: trouverIndexEntete(
      entetes,
      "ID SOUMISSION"
    ),

    date: trouverIndexEntete(
      entetes,
      "DATE"
    ),

    porteur: trouverIndexEntete(
      entetes,
      "NOM DU PORTEUR"
    ),

    email: trouverIndexEntete(
      entetes,
      "EMAIL"
    ),

    telephone: trouverIndexEntete(
      entetes,
      "TÉLÉPHONE / WHATSAPP"
    ),

    projet: trouverIndexEntete(
      entetes,
      "NOM DU PROJET"
    ),

    pays: trouverIndexEntete(
      entetes,
      "PAYS"
    ),

    secteur: trouverIndexEntete(
      entetes,
      "SECTEUR"
    ),

    statut: trouverIndexEntete(
      entetes,
      "STATUT COMMERCIAL"
    ),

    score: trouverIndexEntete(
      entetes,
      "SCORE COMMERCIAL"
    ),

    maturite: trouverIndexEntete(
      entetes,
      "MATURITÉ"
    ),

    segment: trouverIndexEntete(
      entetes,
      "SEGMENT"
    ),

    besoin: trouverIndexEntete(
      entetes,
      "BESOIN PRINCIPAL"
    ),

    urgence: trouverIndexEntete(
      entetes,
      "URGENCE"
    ),

    priorite: trouverIndexEntete(
      entetes,
      "PRIORITÉ"
    ),

    offre: trouverIndexEntete(
      entetes,
      "OFFRE RECOMMANDÉE"
    ),

    prochaineAction: trouverIndexEntete(
      entetes,
      "PROCHAINE ACTION"
    ),

    pdfUrl: trouverIndexEntete(
      entetes,
      "LIEN PDF"
    )
  };
}


/**
 * Retourne l'index d'une colonne.
 */
function trouverIndexEntete(
  entetes,
  nom
) {
  var index = entetes.indexOf(nom);

  if (index === -1) {
    throw new Error(
      "Colonne introuvable : " + nom
    );
  }

  return index;
}


/**
 * Calcule les indicateurs commerciaux.
 */
function calculerStatistiquesDashboard(
  lignes,
  indexColonnes
) {
  var statistiques = {
    total: lignes.length,
    tresHautePriorite: 0,
    hautePriorite: 0,
    rechercheFinancement: 0,
    besoinStructuration: 0,
    contactSous24h: 0,

    offres: {
      DIAGNOSTIC_STRATEGIQUE: 0,
      STRUCTURATION_PROJET: 0,
      PREPARATION_FINANCEMENT: 0
    }
  };

  lignes.forEach(function(ligne) {
    var priorite = String(
      ligne[indexColonnes.priorite] || ""
    ).trim();

    var segment = String(
      ligne[indexColonnes.segment] || ""
    ).trim();

    var action = String(
      ligne[indexColonnes.prochaineAction] || ""
    ).trim();

    var offre = String(
      ligne[indexColonnes.offre] || ""
    ).trim();

    if (priorite === "TRES_HAUTE") {
      statistiques.tresHautePriorite++;
    }

    if (priorite === "HAUTE") {
      statistiques.hautePriorite++;
    }

    if (
      segment === "RECHERCHE_FINANCEMENT"
    ) {
      statistiques.rechercheFinancement++;
    }

    if (
      segment === "BESOIN_STRUCTURATION"
    ) {
      statistiques.besoinStructuration++;
    }

    if (
      action === "CONTACTER_SOUS_24H"
    ) {
      statistiques.contactSous24h++;
    }

    if (
      statistiques.offres.hasOwnProperty(
        offre
      )
    ) {
      statistiques.offres[offre]++;
    }
  });

  return statistiques;
}


/**
 * Construit l'interface du Dashboard.
 */
function construireDashboardCommercial(
  feuille,
  statistiques,
  lignes,
  indexColonnes
) {
  feuille.setHiddenGridlines(true);

  feuille.setColumnWidth(1, 190);
  feuille.setColumnWidth(2, 150);
  feuille.setColumnWidth(3, 150);
  feuille.setColumnWidth(4, 180);
  feuille.setColumnWidth(5, 180);
  feuille.setColumnWidth(6, 180);
  feuille.setColumnWidth(7, 180);
  feuille.setColumnWidth(8, 180);

  feuille
    .getRange("A1:H2")
    .merge()
    .setValue(
      "AFRIGREEN24 — TABLEAU DE PILOTAGE COMMERCIAL"
    )
    .setBackground("#0B6B3A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(16)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  feuille.setRowHeight(1, 32);
  feuille.setRowHeight(2, 20);

  ajouterCarteDashboard(
    feuille,
    "A4:B6",
    "TOTAL PROSPECTS",
    statistiques.total,
    "#E8F5EC",
    "#0B6B3A"
  );

  ajouterCarteDashboard(
    feuille,
    "C4:D6",
    "PRIORITÉ TRÈS HAUTE",
    statistiques.tresHautePriorite,
    "#FCE8E6",
    "#B3261E"
  );

  ajouterCarteDashboard(
    feuille,
    "E4:F6",
    "RECHERCHE FINANCEMENT",
    statistiques.rechercheFinancement,
    "#F6EEDC",
    "#8A5A00"
  );

  ajouterCarteDashboard(
    feuille,
    "G4:H6",
    "CONTACTER SOUS 24 H",
    statistiques.contactSous24h,
    "#E8F0FE",
    "#174EA6"
  );

  feuille
    .getRange("A8:D8")
    .merge()
    .setValue(
      "RÉPARTITION PAR OFFRE"
    )
    .setBackground("#063C27")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var offres = [
    [
      "OFFRE",
      "NOMBRE"
    ],
    [
      "Diagnostic stratégique",
      statistiques.offres
        .DIAGNOSTIC_STRATEGIQUE
    ],
    [
      "Structuration du projet",
      statistiques.offres
        .STRUCTURATION_PROJET
    ],
    [
      "Préparation au financement",
      statistiques.offres
        .PREPARATION_FINANCEMENT
    ]
  ];

  feuille
    .getRange(
      9,
      1,
      offres.length,
      2
    )
    .setValues(offres);

  feuille
    .getRange("A9:B9")
    .setBackground("#168A50")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold");

  feuille
    .getRange("A9:B12")
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true
    );

  feuille
    .getRange("E8:H8")
    .merge()
    .setValue(
      "INDICATEURS COMPLÉMENTAIRES"
    )
    .setBackground("#063C27")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var indicateurs = [
    [
      "INDICATEUR",
      "VALEUR"
    ],
    [
      "Priorité haute",
      statistiques.hautePriorite
    ],
    [
      "Besoin de structuration",
      statistiques.besoinStructuration
    ],
    [
      "Prospects non urgents",
      statistiques.total -
      statistiques.contactSous24h
    ]
  ];

  feuille
    .getRange(
      9,
      5,
      indicateurs.length,
      2
    )
    .setValues(indicateurs);

  feuille
    .getRange("E9:F9")
    .setBackground("#168A50")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold");

  feuille
    .getRange("E9:F12")
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true
    );

  ajouterTableauProspectsPrioritaires(
    feuille,
    lignes,
    indexColonnes
  );

  feuille.setFrozenRows(2);
}


/**
 * Ajoute une carte d'indicateur.
 */
function ajouterCarteDashboard(
  feuille,
  plage,
  titre,
  valeur,
  couleurFond,
  couleurTexte
) {
  var range = feuille.getRange(plage);

  range
    .merge()
    .setBackground(couleurFond)
    .setFontColor(couleurTexte)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(
      true,
      true,
      true,
      true,
      false,
      false,
      "#DADCE0",
      SpreadsheetApp.BorderStyle.SOLID
    );

  var cellule = range.getCell(1, 1);

  cellule.setValue(
    titre + "\n\n" + valeur
  );

  cellule
    .setFontWeight("bold")
    .setFontSize(12)
    .setWrap(true);
}


/**
 * Liste les prospects à contacter en priorité.
 */
function ajouterTableauProspectsPrioritaires(
  feuille,
  lignes,
  indexColonnes
) {
  var ligneDepart = 15;

  feuille
    .getRange(
      ligneDepart,
      1,
      1,
      8
    )
    .merge()
    .setValue(
      "PROSPECTS PRIORITAIRES"
    )
    .setBackground("#0B6B3A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var entetes = [
    "PORTEUR",
    "PROJET",
    "PAYS",
    "SCORE",
    "PRIORITÉ",
    "OFFRE",
    "ACTION",
    "PDF"
  ];

  feuille
    .getRange(
      ligneDepart + 1,
      1,
      1,
      entetes.length
    )
    .setValues([entetes])
    .setBackground("#168A50")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold");

  var prospects = lignes
    .filter(function(ligne) {
      var priorite = String(
        ligne[indexColonnes.priorite] || ""
      );

      return (
        priorite === "TRES_HAUTE" ||
        priorite === "HAUTE"
      );
    })
    .sort(function(a, b) {
      var scoreA = Number(
        a[indexColonnes.score] || 0
      );

      var scoreB = Number(
        b[indexColonnes.score] || 0
      );

      return scoreB - scoreA;
    })
    .slice(0, 20)
    .map(function(ligne) {
      return [
        ligne[indexColonnes.porteur],
        ligne[indexColonnes.projet],
        ligne[indexColonnes.pays],
        ligne[indexColonnes.score],
        ligne[indexColonnes.priorite],
        ligne[indexColonnes.offre],
        ligne[indexColonnes.prochaineAction],
        ligne[indexColonnes.pdfUrl]
      ];
    });

  if (prospects.length === 0) {
    feuille
      .getRange(
        ligneDepart + 2,
        1,
        1,
        8
      )
      .merge()
      .setValue(
        "Aucun prospect prioritaire pour le moment."
      )
      .setHorizontalAlignment("center");

    return;
  }

  feuille
    .getRange(
      ligneDepart + 2,
      1,
      prospects.length,
      8
    )
    .setValues(prospects)
    .setWrap(true)
    .setVerticalAlignment("middle");

  feuille
    .getRange(
      ligneDepart + 1,
      1,
      prospects.length + 1,
      8
    )
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true
    );

  for (
    var index = 0;
    index < prospects.length;
    index++
  ) {
    var pdfUrl = prospects[index][7];

    if (pdfUrl) {
      feuille
        .getRange(
          ligneDepart + 2 + index,
          8
        )
        .setFormula(
          '=HYPERLINK("' +
          pdfUrl +
          '","Ouvrir")'
        );
    }
  }
}


/**
 * Dashboard affiché lorsqu'il n'y a aucune soumission.
 */
function construireDashboardVide(
  feuille
) {
  feuille.clear();
  feuille.setHiddenGridlines(true);

  feuille
    .getRange("A1:H2")
    .merge()
    .setValue(
      "AFRIGREEN24 — TABLEAU DE PILOTAGE COMMERCIAL"
    )
    .setBackground("#0B6B3A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(16)
    .setHorizontalAlignment("center");

  feuille
    .getRange("A4:H6")
    .merge()
    .setValue(
      "Aucune soumission enregistrée pour le moment."
    )
    .setBackground("#F4FBF6")
    .setFontColor("#0B6B3A")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
}


/**
 * Test direct depuis Apps Script.
 */
function testerDashboardCommercial_() {
  var resultat =
    actualiserDashboardCommercial_();

  console.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}