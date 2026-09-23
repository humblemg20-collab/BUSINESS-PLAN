/**
 * AfriGreen24 — Module 3 — Mise à jour Questions impactantes V3
 * Génération du Business Plan Bancable en Google Docs et export PDF
 *
 * Dépendances :
 * - BusinessPlanBancable.gs (Module 1)
 * - BusinessPlanBancableController.gs (Module 2)
 *
 * Le module ne modifie pas le Business Plan Standard.
 */

const BPB3_CONFIG = Object.freeze({
  VERSION: '5.1.0',
  NOM_DOSSIER_PAR_DEFAUT: 'Business Plans Bancables',
  CLE_DOSSIER_SORTIE: 'AFRIGREEN24_BPB_OUTPUT_FOLDER_ID',
  CLE_LOGO: 'AFRIGREEN24_BPB_LOGO_ID',
  LOGO_URL_PAR_DEFAUT: '',
  COULEUR_PRIMAIRE: '#176B45',
  COULEUR_PRIMAIRE_FONCEE: '#0F4D32',
  COULEUR_CLAIRE: '#EAF5EF',
  COULEUR_TEXTE: '#17211C',
  COULEUR_MUETTE: '#64716A',
  COULEUR_ALERTE: '#A62929',
  POLICE: 'Arial',
  DELAI_GENERATION_MINUTES: 20,
  MAX_MOIS_ECHEANCIER: 120
});

/**
 * Configure le dossier Drive dans lequel les Google Docs et PDF seront créés.
 */
function configurerDossierSortieBusinessPlanBancable_(folderId) {
  const id = String(folderId || '').trim();
  if (!id) throw new Error('Identifiant du dossier Drive obligatoire.');
  const folder = DriveApp.getFolderById(id);
  PropertiesService.getScriptProperties().setProperty(BPB3_CONFIG.CLE_DOSSIER_SORTIE, folder.getId());
  return { succes: true, folderId: folder.getId(), nom: folder.getName(), url: folder.getUrl() };
}

/**
 * Configure un logo facultatif stocké dans Google Drive.
 */
function configurerLogoBusinessPlanBancable_(fileId) {
  const id = String(fileId || '').trim();
  if (!id) throw new Error('Identifiant du fichier logo obligatoire.');
  const file = DriveApp.getFileById(id);
  PropertiesService.getScriptProperties().setProperty(BPB3_CONFIG.CLE_LOGO, file.getId());
  return { succes: true, fileId: file.getId(), nom: file.getName() };
}

/**
 * Point d’entrée appelé par l’interface HTML.
 */
function genererBusinessPlanBancableDepuisInterface(dossierId, jetonAcces) {
  return genererRapportPreparationBancaireDepuisInterface(dossierId, jetonAcces);
}

function genererRapportPreparationBancaireDepuisInterface(dossierId, jetonAcces) {
  const id = AG24_SEC_assertBancableAccess_(dossierId, jetonAcces, 'generate-preparation-report');
  return BPB3_reponseClientGeneration_(
    genererRapportPreparationBancaire_(id, { forcer: false })
  );
}

function genererBusinessPlanFinanceurDepuisInterface(dossierId, jetonAcces) {
  const id = AG24_SEC_assertBancableAccess_(dossierId, jetonAcces, 'generate-financier-plan');
  return BPB3_reponseClientGeneration_(
    genererBusinessPlanFinanceur_(id, { forcer: false })
  );
}

/**
 * Génère le Google Docs et son PDF.
 */
function genererRapportPreparationBancaire_(dossierId, options) {
  const id = BPB3_normaliserDossierId_(dossierId);
  const opts = options && typeof options === 'object' ? options : {};

  const preparation = BPB3_preparerGeneration_(id, Boolean(opts.forcer), 'RAPPORT');
  if (preparation.reutiliser) {
    return Object.assign({ succes: true, reutilise: true }, preparation.generation);
  }

  try {
    const source = BPB_obtenirDossierUnifie_(id);
    const analyse = analyserBusinessPlanBancable(source.standard, source.bancable);

    if (!analyse.audit || !analyse.audit.pretPourGeneration) {
      throw new Error('Le dossier contient encore une anomalie critique et ne peut pas être généré.');
    }

    const dossier = {
      dossierId: id,
      meta: source.meta || {},
      standard: analyse.standard || {},
      bancable: analyse.bancable || {},
      audit: analyse.audit
    };

    const modeleFinancier = BPB3_construireModeleFinancier_(dossier);
    dossier.narratifIA = BPB5_obtenirNarratifIA_(dossier, modeleFinancier);
    const folder = BPB3_obtenirDossierSortie_();
    const resultatDocument = BPB3_creerRapportPreparation_(dossier, modeleFinancier, folder);

    const generation = {
      statut: 'RAPPORT_GENERE',
      dossierId: id,
      nomProjet: BPB3_texte_(dossier.standard.nomProjet, 'Projet'),
      genereLe: new Date().toISOString(),
      version: BPB3_CONFIG.VERSION,
      documentId: resultatDocument.documentId,
      documentUrl: resultatDocument.documentUrl,
      pdfId: resultatDocument.pdfId,
      pdfUrl: resultatDocument.pdfUrl,
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      score: Number(dossier.audit.score && dossier.audit.score.total) || 0,
      niveau: dossier.audit.niveau || '',
      typeDocument: 'RAPPORT_PREPARATION',
      moteurRedaction: dossier.narratifIA && !dossier.narratifIA._fallback ? 'HUMBLEOS_LOCAL' : 'SECOURS_DETERMINISTE',
      avertissement: 'Ce rapport est destiné au porteur de projet. Il sert à préparer le dossier avant la génération de la version financeur.'
    };

    BPB3_enregistrerSucces_(id, generation, 'RAPPORT');
    return Object.assign({ succes: true, reutilise: false }, generation);
  } catch (error) {
    BPB3_enregistrerEchec_(id, error, 'RAPPORT');
    throw error;
  }
}

/**
 * Retourne le dernier résultat de génération du dossier.
 */
function obtenirResultatGenerationBusinessPlanBancable(dossierId, jetonAcces) {
  return obtenirResultatRapportPreparationBancaire(dossierId, jetonAcces);
}

function obtenirResultatRapportPreparationBancaire(dossierId, jetonAcces) {
  const id = AG24_SEC_assertBancableAccess_(dossierId, jetonAcces, 'read-preparation-result');
  const generation = BPB_lireJsonChunked_(BPB_cle_(id, 'GENERATION_RAPPORT'));
  if (!generation || generation.statut !== 'RAPPORT_GENERE') {
    return { succes: false, dossierId: id, statut: generation ? generation.statut : 'NON_GENERE' };
  }
  return BPB3_reponseClientGeneration_(
    Object.assign({ succes: true }, generation)
  );
}

function obtenirResultatBusinessPlanFinanceur(dossierId, jetonAcces) {
  const id = AG24_SEC_assertBancableAccess_(dossierId, jetonAcces, 'read-financier-result');
  const generation = BPB_lireJsonChunked_(BPB_cle_(id, 'GENERATION_FINANCEUR'));
  if (!generation || generation.statut !== 'FINANCEUR_GENERE') {
    return { succes: false, dossierId: id, statut: generation ? generation.statut : 'NON_GENERE' };
  }
  return BPB3_reponseClientGeneration_(
    Object.assign({ succes: true }, generation)
  );
}

function BPB3_reponseClientGeneration_(generation) {
  generation = generation || {};

  return {
    succes: generation.succes !== false,
    reutilise: Boolean(generation.reutilise),
    statut: String(generation.statut || ''),
    typeDocument: String(generation.typeDocument || ''),
    dossierId: String(generation.dossierId || ''),
    nomProjet: String(generation.nomProjet || ''),
    genereLe: String(generation.genereLe || ''),
    version: String(generation.version || ''),
    pdfId: String(generation.pdfId || ''),
    score:
      generation.score === undefined
        ? undefined
        : Number(generation.score),
    niveau: String(generation.niveau || ''),
    moteurRedaction: String(generation.moteurRedaction || ''),
    dashboardSync:
      generation.dashboardSync &&
      typeof generation.dashboardSync === 'object'
        ? generation.dashboardSync
        : undefined
  };
}

/**
 * Génère à nouveau les fichiers en ignorant un résultat antérieur.
 */
function regenererBusinessPlanBancable_(dossierId) {
  return genererRapportPreparationBancaire_(dossierId, { forcer: true });
}

/**
 * Test complet autonome du Module 3.
 * Crée un dossier d’exemple, l’audite, le confirme et génère Docs + PDF.
 */
function testerGenerationBusinessPlanBancable_() {
  const id = creerIdentifiantDossierBancable();
  const standard = {
    nomProjet: 'Unité de transformation de mangues',
    nomPromoteur: 'Awa Diallo',
    fonctionPromoteur: 'Fondatrice et directrice générale',
    experiencePromoteur: 'Cinq années d’expérience dans l’agroalimentaire et la commercialisation.',
    competencesPromoteur: 'Gestion de production, contrôle qualité, achats et développement commercial.',
    descriptionProjet: 'Création d’une unité locale de transformation de mangues fraîches en mangues séchées et produits dérivés.',
    problemeResolu: 'Réduction des pertes post-récolte et amélioration de la valeur ajoutée locale.',
    solution: 'Transformer les mangues locales selon un processus contrôlé et commercialiser des produits à plus longue durée de conservation.',
    clientsCibles: 'Supermarchés, hôtels, restaurants, distributeurs et consommateurs urbains.',
    tailleMarche: 'Marché national avec potentiel de distribution sous-régionale.',
    concurrents: 'Transformateurs artisanaux locaux et produits importés.',
    avantageConcurrentiel: 'Approvisionnement local, traçabilité, qualité régulière et partenariats avec les producteurs.',
    sourcesRevenus: 'Vente de mangues séchées et de produits dérivés.',
    strategieCommerciale: 'Vente directe aux distributeurs, prospection B2B et présence numérique.'
  };

  const premium = {
    devise: 'XOF',
    montantInvestissements: 18000000,
    montantStockInitial: 2000000,
    besoinFondsRoulementDeclare: 5000000,
    tresorerieSecurite: 3000000,
    apportPromoteur: 8000000,
    autresFinancements: 0,
    montantDemande: 20000000,
    utilisationFonds: [
      { poste: 'Équipements de transformation', montant: 14000000, justification: 'Acquisition du séchoir, des équipements de préparation et du matériel de conditionnement.' },
      { poste: 'Aménagement du site', montant: 4000000, justification: 'Mise aux normes du local et installation des équipements.' },
      { poste: 'Fonds de roulement', montant: 2000000, justification: 'Financement du démarrage opérationnel.' }
    ],
    dureeRemboursementMois: 60,
    differeMois: 3,
    tauxInteretAnnuel: 10,
    dateBesoinFonds: '',
    lignesVentes: [
      { nom: 'Mangues séchées 100 g', prixUnitaire: 1500, volumeMensuel: 3000, coutVariableUnitaire: 650 },
      { nom: 'Mangues séchées 250 g', prixUnitaire: 3200, volumeMensuel: 700, coutVariableUnitaire: 1450 }
    ],
    baseHypothesesVentes: ['Ventes déjà réalisées', 'Partenariats commerciaux', 'Capacité réelle de production ou de prestation'],
    justificationHypothesesVentes: 'Les prix reposent sur les ventes pilotes et les tarifs observés dans les commerces ciblés. Les volumes correspondent aux discussions avec les distributeurs, à la fréquence de réapprovisionnement prévue et à la capacité mensuelle de l’unité.',
    croissanceAnnuellePct: 12,
    justificationCroissance: 'Montée en charge progressive de la production et extension du réseau de distribution.',
    saisonnalite: 'Oui',
    detailsSaisonnalite: 'Approvisionnement renforcé pendant la saison de production et constitution de stocks transformés.',
    salairesMensuels: 850000,
    loyersMensuels: 250000,
    marketingMensuel: 200000,
    energieTelecomMensuel: 250000,
    transportLogistiqueMensuel: 350000,
    administrationMensuel: 150000,
    impotsTaxesMensuels: 100000,
    autresChargesFixesMensuelles: 100000,
    detailsAutresCharges: 'Entretien courant et petites fournitures.',
    delaiPaiementClientsJours: 15,
    delaiPaiementFournisseursJours: 15,
    stockMoyenJours: 20,
    stadeProjet: 'Premières ventes',
    nombreClientsActuels: 18,
    chiffreAffairesHistorique: 8500000,
    chargesHistoriques12Mois: 6100000,
    tresorerieDisponibleActuelle: 1200000,
    creancesClientsActuelles: 450000,
    dettesFinancieresExistantes: 0,
    mensualitesDettesExistantes: 0,
    preuvesDemande: ['Premières ventes', 'Partenariats commerciaux', 'Enquête clients'],
    detailsTraction: 'Premières ventes pilotes réalisées et discussions engagées avec deux distributeurs.',
    responsableOperations: 'Awa Diallo',
    responsableFinances: 'Responsable administratif et financier',
    effectifActuel: 4,
    recrutementsPrevus: [
      { poste: 'Opérateur de production', nombre: 2, datePrevue: 'Au démarrage' },
      { poste: 'Commercial B2B', nombre: 1, datePrevue: 'Deuxième trimestre' }
    ],
    capaciteMaximaleMensuelle: 4500,
    uniteCapacite: 'sachets équivalents',
    statutAutorisations: 'Déjà obtenues',
    detailsAutorisations: 'Immatriculation de l’entreprise et autorisation sanitaire disponibles.',
    sourceRemboursement: 'Le remboursement sera assuré par les encaissements récurrents issus des ventes aux distributeurs et aux commerces, complétés par les ventes directes aux consommateurs.',
    mensualiteMaxSupportable: 700000,
    dateDebutRemboursementSouhaitee: '2027-02-01',
    garantiesDisponibles: ['Équipement ou matériel', 'Caution personnelle ou institutionnelle'],
    detailsGaranties: 'Les équipements financés et une caution personnelle pourront être proposés selon les exigences de la banque.',
    risques: [
      { risque: 'Variabilité de l’approvisionnement', probabilite: 'Moyenne', impact: 'Élevé', mesure: 'Diversifier les producteurs partenaires et planifier les achats saisonniers.' },
      { risque: 'Hausse du coût des emballages', probabilite: 'Moyenne', impact: 'Moyen', mesure: 'Négocier des contrats annuels et identifier des fournisseurs alternatifs.' }
    ],
    scenarioBaisseVentesPct: 15,
    scenarioHausseCoutsPct: 5
  };

  enregistrerReponsesStandardPourBancable(id, standard);
  const auditResult = auditerParcoursBusinessPlanBancable(id, premium);
  if (!auditResult.succes || !auditResult.audit.pretPourGeneration) {
    throw new Error('Le dossier de test n’est pas prêt : ' + JSON.stringify(auditResult));
  }
  confirmerDossierBusinessPlanBancable(id);
  const resultat = genererRapportPreparationBancaire_(id, { forcer: true });
  Logger.log(JSON.stringify(resultat, null, 2));
  return resultat;
}

/* =====================================================
 * HumbleOS AI — couche de rédaction professionnelle 5.1
 * ===================================================== */

const BPB5_IA_CONFIG = Object.freeze({
  CLE_NARRATIF: 'IA_NARRATIF_V51',
  CLE_SIGNATURE: 'IA_SIGNATURE_V51'
});

function BPB5_signatureDonnees_(dossier, modele) {
  const source = JSON.stringify({
    standard: dossier.standard || {},
    bancable: dossier.bancable || {},
    indicateurs: dossier.audit && dossier.audit.indicateurs ? dossier.audit.indicateurs : {},
    annees: modele && modele.annees ? modele.annees : [],
    scenarios: modele && modele.scenarios ? modele.scenarios : []
  });
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, source, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function BPB5_donneesBrutesIA_(dossier) {
  const s = dossier.standard || {};
  const p = dossier.bancable || {};
  return {
    projet: {
      nomProjet: s.nomProjet || '',
      descriptionProjet: s.descriptionProjet || '',
      problemeResolu: s.problemeResolu || '',
      solution: s.solution || '',
      stadeProjet: p.stadeProjet || ''
    },
    promoteur: {
      nomPromoteur: s.nomPromoteur || '',
      fonctionPromoteur: s.fonctionPromoteur || '',
      experiencePromoteur: s.experiencePromoteur || '',
      competencesPromoteur: s.competencesPromoteur || '',
      responsableOperations: p.responsableOperations || '',
      responsableFinances: p.responsableFinances || ''
    },
    marche: {
      clientsCibles: s.clientsCibles || '',
      tailleMarche: s.tailleMarche || '',
      concurrents: s.concurrents || '',
      avantageConcurrentiel: s.avantageConcurrentiel || '',
      preuvesDemande: p.preuvesDemande || [],
      detailsTraction: p.detailsTraction || '',
      nombreClientsActuels: p.nombreClientsActuels || 0
    },
    modeleEconomique: {
      sourcesRevenus: s.sourcesRevenus || '',
      strategieCommerciale: s.strategieCommerciale || '',
      justificationHypothesesVentes: p.justificationHypothesesVentes || '',
      justificationCroissance: p.justificationCroissance || '',
      saisonnalite: p.saisonnalite || '',
      detailsSaisonnalite: p.detailsSaisonnalite || '',
      lignesVentes: p.lignesVentes || []
    },
    operations: {
      effectifActuel: p.effectifActuel || 0,
      recrutementsPrevus: p.recrutementsPrevus || [],
      capaciteMaximaleMensuelle: p.capaciteMaximaleMensuelle || 0,
      uniteCapacite: p.uniteCapacite || '',
      statutAutorisations: p.statutAutorisations || '',
      detailsAutorisations: p.detailsAutorisations || ''
    },
    financement: {
      montantDemande: p.montantDemande || 0,
      apportPromoteur: p.apportPromoteur || 0,
      autresFinancements: p.autresFinancements || 0,
      utilisationFonds: p.utilisationFonds || [],
      dureeRemboursementMois: p.dureeRemboursementMois || 0,
      differeMois: p.differeMois || 0,
      tauxInteretAnnuel: p.tauxInteretAnnuel || 0,
      sourceRemboursement: p.sourceRemboursement || '',
      mensualiteMaxSupportable: p.mensualiteMaxSupportable || 0,
      garantiesDisponibles: p.garantiesDisponibles || [],
      detailsGaranties: p.detailsGaranties || ''
    },
    historique: {
      chiffreAffaires12Mois: p.chiffreAffairesHistorique || 0,
      charges12Mois: p.chargesHistoriques12Mois || 0,
      tresorerieDisponible: p.tresorerieDisponibleActuelle || 0,
      creancesClients: p.creancesClientsActuelles || 0,
      dettesExistantes: p.dettesFinancieresExistantes || 0,
      mensualitesDettesExistantes: p.mensualitesDettesExistantes || 0
    },
    risques: p.risques || []
  };
}

function BPB5_donneesCalculeesIA_(dossier, modele) {
  const i = dossier.audit.indicateurs || {};
  return {
    devise: i.devise || dossier.bancable.devise || '',
    besoinTotal: i.totalBesoins || 0,
    financementRecherche: dossier.bancable.montantDemande || 0,
    apportPromoteur: dossier.bancable.apportPromoteur || 0,
    tauxApportPct: i.tauxApportPct || 0,
    chiffreAffairesMensuel: i.chiffreAffairesMensuel || 0,
    chiffreAffairesAnnuel: i.chiffreAffairesAnnuel || 0,
    margeBruteMensuelle: i.margeBruteMensuelle || 0,
    chargesFixesMensuelles: i.chargesFixesMensuelles || 0,
    excedentOperationnelMensuel: i.excedentOperationnelMensuelSimplifie || 0,
    mensualiteEstimee: i.mensualiteEstimee || 0,
    couvertureMensuelle: i.couvertureMensuelleSimplifiee,
    couvertureScenarioPrudent: i.scenarioPrudent ? i.scenarioPrudent.couvertureMensuelleSimplifiee : null,
    projectionsTroisAns: (modele.annees || []).map(function (a) {
      return {
        annee: a.annee,
        chiffreAffaires: a.chiffreAffaires,
        margeBrute: a.margeBrute,
        excedentOperationnel: a.excedentOperationnel,
        serviceDette: a.serviceDette,
        soldeApresDette: a.soldeApresDette
      };
    }),
    scenarios: (modele.scenarios || []).map(function (sc) {
      return {
        nom: sc.nom,
        chiffreAffairesMensuel: sc.chiffreAffairesMensuel,
        excedentOperationnelMensuel: sc.excedentOperationnelMensuel,
        couverture: sc.couverture
      };
    })
  };
}

function BPB5_obtenirNarratifIA_(dossier, modele) {
  const id = dossier.dossierId;
  const signature = BPB5_signatureDonnees_(dossier, modele);
  const cache = BPB_lireJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_NARRATIF));
  const cacheSignature = BPB_lireJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_SIGNATURE));

  if (cache && cacheSignature && cacheSignature.signature === signature) {
    return cache;
  }

  try {
    if (typeof genererNarratifBusinessPlanAvecHumbleOS_ !== 'function') {
      throw new Error('HumbleOSBridge.gs n’est pas installé.');
    }

    const narratif = genererNarratifBusinessPlanAvecHumbleOS_(
      BPB5_donneesBrutesIA_(dossier),
      BPB5_donneesCalculeesIA_(dossier, modele),
      'Rédige comme un consultant en financement d’entreprise. Préserve une tonalité humaine, précise et sobre. N’invente rien. Les sections doivent se compléter sans répétitions.'
    );

    BPB_ecrireJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_NARRATIF), narratif);
    BPB_ecrireJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_SIGNATURE), { signature: signature, genereLe: new Date().toISOString() });
    return narratif;
  } catch (error) {
    Logger.log('HumbleOS indisponible — utilisation des formulations de secours : ' + error.message);
    return { _fallback: true, _erreur: error.message };
  }
}

function BPB5_texteIA_(dossier, cle) {
  const n = dossier && dossier.narratifIA ? dossier.narratifIA : {};
  return n && typeof n[cle] === 'string' ? n[cle].trim() : '';
}

function viderCacheRedactionHumbleOS_(dossierId) {
  const id = BPB3_normaliserDossierId_(dossierId);
  BPB_supprimerJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_NARRATIF));
  BPB_supprimerJsonChunked_(BPB_cle_(id, BPB5_IA_CONFIG.CLE_SIGNATURE));
  return { succes: true, dossierId: id };
}

/* =====================================================
 * Construction documentaire
 * ===================================================== */

function BPB3_creerRapportPreparation_(dossier, modele, folder) {
  const projet = BPB3_texte_(dossier.standard.nomProjet, 'Projet');
  const dateCode = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
  const nomBase = BPB3_nettoyerNomFichier_(`Rapport de préparation bancaire - ${projet} - ${dateCode}`);

  const doc = DocumentApp.create(nomBase);
  const documentId = doc.getId();
  const body = doc.getBody();
  body.clear();
  body.setMarginTop(54).setMarginBottom(54).setMarginLeft(54).setMarginRight(54);

  BPB3_ajouterCouvertureRapport_(body, dossier);
  BPB3_ajouterSynthese_(body, dossier, modele);
  BPB3_ajouterProfilPromoteur_(body, dossier);
  BPB3_ajouterProjetEtMarche_(body, dossier);
  BPB3_ajouterModeleEconomique_(body, dossier);
  BPB3_ajouterPlanOperationnel_(body, dossier);
  BPB3_ajouterFinancement_(body, dossier);
  BPB3_ajouterHypothesesVentes_(body, dossier);
  BPB3_ajouterPrevisionsFinancieres_(body, dossier, modele);
  BPB3_ajouterRemboursement_(body, dossier, modele);
  BPB3_ajouterScenarios_(body, dossier, modele);
  BPB3_ajouterRisques_(body, dossier);
  BPB3_ajouterConclusion_(body, dossier);
  BPB3_ajouterAnnexeEcheancier_(body, dossier, modele);
  BPB3_ajouterPiedDePageRapport_(doc, dossier);

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(documentId);
  docFile.moveTo(folder);

  const pdfBlob = docFile.getAs(MimeType.PDF).setName(`${nomBase}.pdf`);
  const pdfFile = folder.createFile(pdfBlob);

  return {
    documentId: documentId,
    documentUrl: docFile.getUrl(),
    pdfId: pdfFile.getId(),
    pdfUrl: pdfFile.getUrl()
  };
}

function BPB3_ajouterCouvertureRapport_(body, dossier) {
  const logo = BPB3_obtenirLogoBlob_();
  if (logo) {
    try {
      const image = body.appendImage(logo);
      const largeur = image.getWidth();
      if (largeur > 170) {
        const ratio = 170 / largeur;
        image.setWidth(170).setHeight(Math.round(image.getHeight() * ratio));
      }
      image.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    } catch (error) {
      // Le document reste générable même si le logo est illisible.
    }
  } else {
    // Aucun branding plateforme : la couverture reste neutre si aucun logo client n'est configuré.
  }

  BPB3_paragraphe_(body, 'RAPPORT DE PRÉPARATION BANCAIRE', {
    align: 'CENTER', size: 27, bold: true, color: BPB3_CONFIG.COULEUR_PRIMAIRE_FONCEE, spacingAfter: 14
  });
  BPB3_paragraphe_(body, BPB3_texte_(dossier.standard.nomProjet, 'Projet'), {
    align: 'CENTER', size: 21, bold: true, color: BPB3_CONFIG.COULEUR_TEXTE, spacingAfter: 22
  });

  const p = dossier.bancable;
  const a = dossier.audit.indicateurs;
  const informations = [
    ['Promoteur', BPB3_texte_(dossier.standard.nomPromoteur, 'Non renseigné')],
    ['Montant demandé', BPB3_monnaie_(p.montantDemande, p.devise)],
    ['Durée envisagée', `${BPB3_nombre_(p.dureeRemboursementMois)} mois`],
    ['Score de préparation', `${Number(dossier.audit.score && dossier.audit.score.total) || 0}/100 — ${dossier.audit.niveau || ''}`],
    ['Date de génération', BPB3_dateLongue_(new Date())]
  ];
  const table = BPB3_tableau_(body, informations, { entete: false, premiereColonneForte: true });

  body.appendParagraph('');
  BPB3_paragraphe_(body,
    'Document confidentiel préparé à partir des informations déclarées par le porteur du projet.',
    { align: 'CENTER', size: 10, italic: true, color: BPB3_CONFIG.COULEUR_MUETTE, spacingBefore: 30 }
  );
  body.appendPageBreak();
}

function BPB3_ajouterAvertissement_(body) {
  BPB3_titre_(body, 'Note de lecture', 1);
  BPB3_encadre_(body,
    'Ce Business Plan Bancable structure le projet, ses hypothèses financières et sa capacité de remboursement selon les informations déclarées. Il ne constitue ni une offre de crédit, ni une garantie d’obtention d’un financement. Les prévisions doivent être confrontées aux pièces justificatives et aux conditions réelles de l’établissement financier sollicité.',
    BPB3_CONFIG.COULEUR_CLAIRE
  );
}

function BPB3_ajouterSynthese_(body, dossier, modele) {
  const s = dossier.standard;
  const p = dossier.bancable;
  const i = dossier.audit.indicateurs;
  const couverture = i.couvertureMensuelleSimplifiee === null ? 'non calculée' : i.couvertureMensuelleSimplifiee;
  const apport = Number(i.tauxApportPct || 0);

  BPB3_titre_(body, '1. Résumé exécutif bancaire', 1);
  const resumeIA = BPB5_texteIA_(dossier, 'resumeExecutif');
  if (resumeIA) {
    BPB3_paragraphe_(body, resumeIA, { spacingAfter: 12 });
  } else {
    BPB3_paragraphe_(body,
      `${BPB3_texte_(s.nomProjet, 'Le projet')} est développé sous la responsabilité de ${BPB3_texte_(s.nomPromoteur, 'son promoteur')}. ` +
      `${BPB3_phrase_(s.descriptionProjet)} L’initiative répond à un enjeu clairement identifié : ${BPB3_minuscule_(BPB3_texte_(s.problemeResolu, 'un besoin de marché à préciser'))}. ` +
      `La réponse proposée consiste à ${BPB3_minuscule_(BPB3_texte_(s.solution, 'mettre en œuvre la solution décrite par le promoteur'))}.`,
      { spacingAfter: 10 }
    );
  }
  BPB3_paragraphe_(body,
    `Le plan de financement porte sur un besoin total de ${BPB3_monnaie_(i.totalBesoins, i.devise)}. ` +
    `La demande de financement s’élève à ${BPB3_monnaie_(p.montantDemande, i.devise)}, avec un apport de ${BPB3_monnaie_(p.apportPromoteur, i.devise)}, soit ${apport} % des besoins. ` +
    `Sur la base des hypothèses déclarées, le chiffre d’affaires annuel de référence atteint ${BPB3_monnaie_(i.chiffreAffairesAnnuel, i.devise)}.`,
    { spacingAfter: 10 }
  );
  BPB3_paragraphe_(body,
    `L’activité dégagerait un excédent opérationnel mensuel simplifié de ${BPB3_monnaie_(i.excedentOperationnelMensuelSimplifie, i.devise)}. ` +
    `La couverture mensuelle du nouveau financement ressort à ${couverture}, ce qui ${Number(couverture) >= 1.5 ? 'traduit une marge de sécurité satisfaisante dans le scénario central' : 'appelle une vigilance particulière sur la capacité de remboursement'}. ` +
    `Le dossier obtient un niveau de préparation de ${Number(dossier.audit.score && dossier.audit.score.total) || 0}/100.`,
    { spacingAfter: 16 }
  );

  BPB3_tableau_(body, [
    ['Indicateur clé', 'Valeur'],
    ['Besoin total', BPB3_monnaie_(i.totalBesoins, i.devise)],
    ['Financement demandé', BPB3_monnaie_(p.montantDemande, i.devise)],
    ['Taux d’apport', `${i.tauxApportPct}%`],
    ['Chiffre d’affaires mensuel', BPB3_monnaie_(i.chiffreAffairesMensuel, i.devise)],
    ['Marge brute mensuelle', BPB3_monnaie_(i.margeBruteMensuelle, i.devise)],
    ['Mensualité audit estimée', BPB3_monnaie_(i.mensualiteEstimee, i.devise)],
    ['Couverture mensuelle simplifiée', couverture],
    ['Solde opérationnel après dette — année 1', BPB3_monnaie_(modele.annees[0].soldeApresDette, i.devise)]
  ], { entete: true, premiereColonneForte: true });

}

function BPB3_ajouterProfilPromoteur_(body, dossier) {
  const s = dossier.standard;
  BPB3_titre_(body, '2. Profil du promoteur et gouvernance', 1);
  BPB3_tableau_(body, [
    ['Élément', 'Information déclarée'],
    ['Nom', BPB3_texte_(s.nomPromoteur, 'Non renseigné')],
    ['Fonction', BPB3_texte_(s.fonctionPromoteur, 'Non renseignée')],
    ['Expérience', BPB3_texte_(s.experiencePromoteur, 'Non renseignée')],
    ['Compétences principales', BPB3_texte_(s.competencesPromoteur, 'Non renseignées')],
    ['Responsable des opérations', BPB3_texte_(dossier.bancable.responsableOperations, 'Non renseigné')],
    ['Responsable des finances', BPB3_texte_(dossier.bancable.responsableFinances, 'Non renseigné')]
  ], { entete: true, premiereColonneForte: true });

  BPB3_paragraphe_(body,
    'Les informations ci-dessus présentent la répartition déclarée des responsabilités et des compétences disponibles au sein du projet.',
    { italic: true, color: BPB3_CONFIG.COULEUR_MUETTE, spacingBefore: 10 }
  );
}

function BPB3_ajouterProjetEtMarche_(body, dossier) {
  const s = dossier.standard;
  const p = dossier.bancable;
  BPB3_titre_(body, '3. Présentation du projet et analyse du marché', 1);
  BPB3_titre_(body, '3.1 Problème, solution et proposition de valeur', 2);
  const problemeSolutionIA = BPB5_texteIA_(dossier, 'problemeSolution');
  if (problemeSolutionIA) {
    BPB3_paragraphe_(body, problemeSolutionIA);
  } else {
    BPB3_paragraphe_(body, BPB3_texte_(s.problemeResolu, 'Le problème traité n’a pas été détaillé.'));
    BPB3_paragraphe_(body, BPB3_texte_(s.solution, 'La solution n’a pas été détaillée.'));
  }

  BPB3_titre_(body, '3.2 Marché cible et concurrence', 2);
  BPB3_tableau_(body, [
    ['Élément', 'Analyse déclarée'],
    ['Clients cibles', BPB3_texte_(s.clientsCibles, 'Non renseignés')],
    ['Taille ou portée du marché', BPB3_texte_(s.tailleMarche, 'Non renseignée')],
    ['Concurrents', BPB3_texte_(s.concurrents, 'Non renseignés')],
    ['Avantage concurrentiel', BPB3_texte_(s.avantageConcurrentiel, 'Non renseigné')],
    ['Stade du projet', BPB3_texte_(p.stadeProjet, 'Non renseigné')],
    ['Clients actuels', String(BPB3_nombre_(p.nombreClientsActuels))],
    ['Chiffre d’affaires des 12 derniers mois', BPB3_monnaie_(p.chiffreAffairesHistorique, p.devise)],
    ['Charges des 12 derniers mois', BPB3_monnaie_(p.chargesHistoriques12Mois, p.devise)],
    ['Trésorerie disponible', BPB3_monnaie_(p.tresorerieDisponibleActuelle, p.devise)],
    ['Créances clients à encaisser', BPB3_monnaie_(p.creancesClientsActuelles, p.devise)]
  ], { entete: true, premiereColonneForte: true });

  const preuves = Array.isArray(p.preuvesDemande) && p.preuvesDemande.length
    ? p.preuvesDemande.join(', ')
    : 'Aucune preuve précisée';
  BPB3_paragraphe_(body, `Preuves commerciales déclarées : ${preuves}.`);
  if (BPB3_texte_(p.detailsTraction, '')) BPB3_paragraphe_(body, p.detailsTraction);
  const marcheIA = BPB5_texteIA_(dossier, 'marchePositionnement');
  if (marcheIA) {
    BPB3_titre_(body, 'Lecture du marché et du positionnement', 2);
    BPB3_paragraphe_(body, marcheIA);
  }
}

function BPB3_ajouterModeleEconomique_(body, dossier) {
  const s = dossier.standard;
  const p = dossier.bancable;
  BPB3_titre_(body, '4. Modèle économique et stratégie commerciale', 1);
  const modeleIA = BPB5_texteIA_(dossier, 'modeleStrategie');
  if (modeleIA) {
    BPB3_paragraphe_(body, modeleIA, { spacingAfter: 10 });
  } else {
    BPB3_paragraphe_(body,
      `Les revenus du projet proviennent de ${BPB3_minuscule_(BPB3_texte_(s.sourcesRevenus, 'sources de revenus à préciser'))}.`,
      { spacingAfter: 10 }
    );
    BPB3_paragraphe_(body,
      BPB3_texte_(s.strategieCommerciale, ''),
      { spacingAfter: 10 }
    );
  }
  BPB3_paragraphe_(body,
    p.saisonnalite === 'Oui'
      ? `Saisonnalité déclarée : ${BPB3_texte_(p.detailsSaisonnalite, '')}.`
      : 'Aucune saisonnalité particulière n’a été déclarée.',
    { italic: true, color: BPB3_CONFIG.COULEUR_MUETTE }
  );
}

function BPB3_ajouterPlanOperationnel_(body, dossier) {
  const p = dossier.bancable;
  BPB3_titre_(body, '5. Plan opérationnel', 1);
  BPB3_tableau_(body, [
    ['Indicateur opérationnel', 'Valeur'],
    ['Effectif actuel', String(BPB3_nombre_(p.effectifActuel))],
    ['Capacité maximale mensuelle', p.capaciteMaximaleMensuelle ? `${BPB3_nombre_(p.capaciteMaximaleMensuelle)} ${BPB3_texte_(p.uniteCapacite, 'unités')}` : 'Non renseignée'],
    ['Responsable des opérations', BPB3_texte_(p.responsableOperations, 'Non renseigné')],
    ['Responsable des finances', BPB3_texte_(p.responsableFinances, 'Non renseigné')],
    ['Autorisations, licences ou certifications', BPB3_texte_(p.statutAutorisations, 'Non renseigné')]
  ], { entete: true, premiereColonneForte: true });

  const recrutements = Array.isArray(p.recrutementsPrevus) ? p.recrutementsPrevus : [];
  if (recrutements.length) {
    BPB3_titre_(body, 'Recrutements prévus', 2);
    const rows = [['Poste', 'Nombre', 'Période prévue']].concat(recrutements.map(function (r) {
      return [BPB3_texte_(r.poste, ''), String(BPB3_nombre_(r.nombre)), BPB3_texte_(r.datePrevue, '')];
    }));
    BPB3_tableau_(body, rows, { entete: true });
  }

  if (BPB3_texte_(p.detailsAutorisations, '')) {
    BPB3_paragraphe_(body, `Détails réglementaires : ${p.detailsAutorisations}`, { spacingBefore: 10 });
  }

  const operationsIA = BPB5_texteIA_(dossier, 'operations');
  if (operationsIA) {
    BPB3_titre_(body, 'Lecture opérationnelle', 2);
    BPB3_paragraphe_(body, operationsIA);
  }
}

function BPB3_ajouterFinancement_(body, dossier) {
  const p = dossier.bancable;
  const i = dossier.audit.indicateurs;
  BPB3_titre_(body, '6. Besoin de financement et plan de ressources', 1);

  BPB3_titre_(body, '6.1 Plan de financement initial', 2);
  BPB3_tableau_(body, [
    ['Besoins', 'Montant'],
    ['Investissements', BPB3_monnaie_(p.montantInvestissements, i.devise)],
    ['Stock initial', BPB3_monnaie_(p.montantStockInitial, i.devise)],
    ['Besoin en fonds de roulement déclaré', BPB3_monnaie_(p.besoinFondsRoulementDeclare, i.devise)],
    ['Trésorerie de sécurité', BPB3_monnaie_(p.tresorerieSecurite, i.devise)],
    ['TOTAL DES BESOINS', BPB3_monnaie_(i.totalBesoins, i.devise)]
  ], { entete: true, premiereColonneForte: true, derniereLigneForte: true });

  BPB3_tableau_(body, [
    ['Ressources', 'Montant'],
    ['Apport du promoteur et des associés', BPB3_monnaie_(p.apportPromoteur, i.devise)],
    ['Autres financements', BPB3_monnaie_(p.autresFinancements, i.devise)],
    ['Financement bancaire demandé', BPB3_monnaie_(p.montantDemande, i.devise)],
    ['TOTAL DES RESSOURCES', BPB3_monnaie_(i.totalRessources, i.devise)]
  ], { entete: true, premiereColonneForte: true, derniereLigneForte: true });

  BPB3_paragraphe_(body,
    `Écart entre ressources et besoins : ${BPB3_monnaie_(i.ecartFinancement, i.devise)}. Taux d’apport : ${i.tauxApportPct} %.`,
    { bold: true, spacingBefore: 8 }
  );

  BPB3_titre_(body, '6.2 Utilisation du financement demandé', 2);
  const usages = Array.isArray(p.utilisationFonds) ? p.utilisationFonds : [];
  const rows = [['Poste', 'Montant', 'Justification']].concat(usages.map(function (u) {
    return [BPB3_texte_(u.poste, ''), BPB3_monnaie_(u.montant, i.devise), BPB3_texte_(u.justification, '')];
  }));
  BPB3_tableau_(body, rows, { entete: true });

  BPB3_titre_(body, '6.3 Garanties ou sûretés déclarées', 2);
  const garanties = Array.isArray(p.garantiesDisponibles) && p.garantiesDisponibles.length
    ? p.garantiesDisponibles.join(', ')
    : 'Aucune garantie précisée';
  BPB3_paragraphe_(body, garanties + '.');
  if (BPB3_texte_(p.detailsGaranties, '')) BPB3_paragraphe_(body, p.detailsGaranties);
}

function BPB3_ajouterHypothesesVentes_(body, dossier) {
  const p = dossier.bancable;
  const devise = dossier.audit.indicateurs.devise;
  BPB3_titre_(body, '7. Hypothèses de chiffre d’affaires et structure de coûts', 1);

  const bases = Array.isArray(p.baseHypothesesVentes) && p.baseHypothesesVentes.length
    ? p.baseHypothesesVentes.join(', ')
    : 'Aucune base précisée';
  BPB3_paragraphe_(body, `Bases déclarées des hypothèses : ${bases}.`, { bold: true, spacingAfter: 6 });
  BPB3_paragraphe_(body, BPB3_texte_(p.justificationHypothesesVentes, 'La justification des prix et volumes n’a pas été renseignée.'), { spacingAfter: 12 });

  const ventes = Array.isArray(p.lignesVentes) ? p.lignesVentes : [];
  const rows = [['Produit ou service', 'Prix unitaire', 'Volume mensuel', 'CA mensuel', 'Coût variable mensuel']]
    .concat(ventes.map(function (v) {
      const ca = BPB3_nombre_(v.prixUnitaire) * BPB3_nombre_(v.volumeMensuel);
      const cv = BPB3_nombre_(v.coutVariableUnitaire) * BPB3_nombre_(v.volumeMensuel);
      return [
        BPB3_texte_(v.nom, ''),
        BPB3_monnaie_(v.prixUnitaire, devise),
        BPB3_nombre_(v.volumeMensuel).toLocaleString('fr-FR'),
        BPB3_monnaie_(ca, devise),
        BPB3_monnaie_(cv, devise)
      ];
    }));
  BPB3_tableau_(body, rows, { entete: true });

  BPB3_titre_(body, 'Charges fixes mensuelles', 2);
  BPB3_tableau_(body, [
    ['Poste', 'Montant mensuel'],
    ['Salaires et charges sociales', BPB3_monnaie_(p.salairesMensuels, devise)],
    ['Loyers', BPB3_monnaie_(p.loyersMensuels, devise)],
    ['Marketing et commercial', BPB3_monnaie_(p.marketingMensuel, devise)],
    ['Énergie et télécommunications', BPB3_monnaie_(p.energieTelecomMensuel, devise)],
    ['Transport et logistique', BPB3_monnaie_(p.transportLogistiqueMensuel, devise)],
    ['Administration et services professionnels', BPB3_monnaie_(p.administrationMensuel, devise)],
    ['Impôts, taxes et cotisations estimés', BPB3_monnaie_(p.impotsTaxesMensuels, devise)],
    ['Autres charges fixes', BPB3_monnaie_(p.autresChargesFixesMensuelles, devise)],
    ['TOTAL', BPB3_monnaie_(dossier.audit.indicateurs.chargesFixesMensuelles, devise)]
  ], { entete: true, premiereColonneForte: true, derniereLigneForte: true });

  BPB3_paragraphe_(body,
    `Croissance annuelle déclarée : ${BPB3_nombre_(p.croissanceAnnuellePct)} %. ${BPB3_texte_(p.justificationCroissance, '')}`,
    { spacingBefore: 8 }
  );
}

function BPB3_ajouterPrevisionsFinancieres_(body, dossier, modele) {
  const devise = dossier.audit.indicateurs.devise;
  BPB3_titre_(body, '8. Prévisions financières simplifiées sur trois ans', 1);
  BPB3_encadre_(body,
    'Méthode : le chiffre d’affaires évolue selon le taux de croissance déclaré. Les coûts variables suivent le niveau d’activité. À défaut d’une hypothèse distincte, les charges fixes sont maintenues constantes. Les impôts, taxes et cotisations mensuels déclarés sont intégrés aux charges fixes. L’impôt sur le résultat, les amortissements et les variations futures du BFR ne sont pas modélisés dans cette première simulation.',
    '#F5F6F5'
  );

  const rows = [['Indicateur', 'Année 1', 'Année 2', 'Année 3']];
  const labels = [
    ['chiffreAffaires', "Chiffre d’affaires"],
    ['coutsVariables', 'Coûts variables'],
    ['margeBrute', 'Marge brute'],
    ['chargesFixes', 'Charges fixes'],
    ['excedentOperationnel', 'Excédent opérationnel simplifié'],
    ['serviceDetteExistante', 'Service des dettes existantes'],
    ['serviceNouvelleDette', 'Service du nouveau financement'],
    ['serviceDette', 'Service total de la dette'],
    ['soldeApresDette', 'Solde opérationnel après toutes les dettes']
  ];
  labels.forEach(function (item) {
    rows.push([item[1]].concat(modele.annees.map(function (annee) {
      return BPB3_monnaie_(annee[item[0]], devise);
    })));
  });
  BPB3_tableau_(body, rows, { entete: true, premiereColonneForte: true });
  BPB3_ajouterGraphiquePrevisions_(body, modele, devise);
}

function BPB3_ajouterRemboursement_(body, dossier, modele) {
  const p = dossier.bancable;
  const i = dossier.audit.indicateurs;
  BPB3_titre_(body, '9. Capacité de remboursement', 1);
  BPB3_tableau_(body, [
    ['Indicateur', 'Valeur'],
    ['Montant simulé', BPB3_monnaie_(p.montantDemande, i.devise)],
    ['Taux annuel estimatif', `${BPB3_nombre_(p.tauxInteretAnnuel)} %`],
    ['Durée totale', `${BPB3_nombre_(p.dureeRemboursementMois)} mois`],
    ['Différé demandé', `${BPB3_nombre_(p.differeMois)} mois`],
    ['Capital restant dû sur les dettes existantes', BPB3_monnaie_(p.dettesFinancieresExistantes, i.devise)],
    ['Mensualités existantes', BPB3_monnaie_(p.mensualitesDettesExistantes, i.devise)],
    ['Capacité disponible avant le nouveau prêt', BPB3_monnaie_(i.capaciteDisponibleAvantNouvelleDette, i.devise)],
    ['Mensualité maximale déclarée', BPB3_monnaie_(p.mensualiteMaxSupportable, i.devise)],
    ['Début de remboursement souhaité', BPB3_texte_(p.dateDebutRemboursementSouhaitee, 'Non renseigné')],
    ['Mensualité estimée par l’audit', BPB3_monnaie_(i.mensualiteEstimee, i.devise)],
    ['Mensualité après différé dans la simulation', BPB3_monnaie_(modele.echeancier.mensualiteApresDiffere, i.devise)],
    ['Couverture mensuelle simplifiée', i.couvertureMensuelleSimplifiee === null ? 'Non calculée' : String(i.couvertureMensuelleSimplifiee)],
    ['Couverture en scénario prudent', i.scenarioPrudent.couvertureMensuelleSimplifiee === null ? 'Non calculée' : String(i.scenarioPrudent.couvertureMensuelleSimplifiee)]
  ], { entete: true, premiereColonneForte: true });

  BPB3_titre_(body, 'Source de remboursement déclarée', 2);
  BPB3_paragraphe_(body, BPB3_texte_(p.sourceRemboursement, 'Non renseignée.'));

  BPB3_paragraphe_(body,
    'Hypothèse de simulation du différé : pendant la période de différé, seuls les intérêts sont payés lorsque le taux est supérieur à zéro ; l’amortissement du capital commence ensuite. Les conditions contractuelles effectives dépendent de l’établissement financier.',
    { italic: true, color: BPB3_CONFIG.COULEUR_MUETTE, spacingBefore: 10 }
  );

  BPB3_titre_(body, 'Résumé annuel de l’échéancier simulé', 2);
  const rows = [['Année', 'Paiements', 'Intérêts', 'Capital remboursé', 'Capital restant']]
    .concat(modele.echeancier.annuel.map(function (a) {
      return [
        `Année ${a.annee}`,
        BPB3_monnaie_(a.paiements, i.devise),
        BPB3_monnaie_(a.interets, i.devise),
        BPB3_monnaie_(a.capitalRembourse, i.devise),
        BPB3_monnaie_(a.soldeFin, i.devise)
      ];
    }));
  BPB3_tableau_(body, rows, { entete: true });
}

function BPB3_ajouterScenarios_(body, dossier, modele) {
  const devise = dossier.audit.indicateurs.devise;
  BPB3_titre_(body, '10. Analyse de sensibilité', 1);
  BPB3_paragraphe_(body,
    'Le scénario prudent reprend les pourcentages saisis par le porteur du projet. Le scénario favorable est une simulation technique fondée sur une hausse de 10 % du chiffre d’affaires, avec des coûts variables proportionnels et des charges fixes inchangées.',
    { italic: true, color: BPB3_CONFIG.COULEUR_MUETTE }
  );
  const rows = [['Scénario', 'CA mensuel', 'Capacité après dettes existantes', 'Couverture du nouveau prêt']]
    .concat(modele.scenarios.map(function (scenario) {
      return [
        scenario.nom,
        BPB3_monnaie_(scenario.chiffreAffairesMensuel, devise),
        BPB3_monnaie_(scenario.excedentOperationnelMensuel, devise),
        scenario.couverture === null ? 'Non calculée' : String(scenario.couverture)
      ];
    }));
  BPB3_tableau_(body, rows, { entete: true });
}

function BPB3_ajouterRisques_(body, dossier) {
  const p = dossier.bancable;
  BPB3_titre_(body, '11. Matrice des risques', 1);
  const risques = Array.isArray(p.risques) ? p.risques : [];
  const rows = [['Risque', 'Probabilité', 'Impact', 'Mesure de réduction']]
    .concat(risques.map(function (r) {
      return [
        BPB3_texte_(r.risque, ''),
        BPB3_texte_(r.probabilite, ''),
        BPB3_texte_(r.impact, ''),
        BPB3_texte_(r.mesure, '')
      ];
    }));
  BPB3_tableau_(body, rows, { entete: true });
}

function BPB3_ajouterAudit_(body, dossier) {
  const audit = dossier.audit;
  BPB3_titre_(body, '12. Synthèse de préparation bancaire', 1);
  BPB3_paragraphe_(body,
    `Score global : ${Number(audit.score && audit.score.total) || 0}/100 — ${BPB3_texte_(audit.niveau, '')}.`,
    { size: 16, bold: true, color: BPB3_CONFIG.COULEUR_PRIMAIRE_FONCEE }
  );

  const forts = Array.isArray(audit.pointsForts) ? audit.pointsForts : [];
  if (forts.length) {
    BPB3_titre_(body, 'Points forts détectés', 2);
    forts.forEach(function (point) { BPB3_puce_(body, point); });
  }

  const alertes = Array.isArray(audit.alertes) ? audit.alertes : [];
  if (alertes.length) {
    BPB3_titre_(body, 'Points de vigilance', 2);
    const rows = [['Niveau', 'Point de vigilance', 'Constat']]
      .concat(alertes.map(function (a) {
        return [a.niveau || '', a.titre || '', a.message || ''];
      }));
    BPB3_tableau_(body, rows, { entete: true });
  } else {
    BPB3_encadre_(body, 'Aucune anomalie critique n’a été détectée par les contrôles automatisés du moteur.', BPB3_CONFIG.COULEUR_CLAIRE);
  }
}

function BPB3_ajouterConclusion_(body, dossier) {
  const i = dossier.audit.indicateurs;
  BPB3_titre_(body, '13. Conclusion de préparation', 1);
  BPB3_paragraphe_(body,
    `Au regard des informations déclarées et des contrôles automatisés, le dossier présente un score de préparation de ${Number(dossier.audit.score && dossier.audit.score.total) || 0}/100. ` +
    `Le plan de financement porte sur un besoin total de ${BPB3_monnaie_(i.totalBesoins, i.devise)} et une demande bancaire de ${BPB3_monnaie_(dossier.bancable.montantDemande, i.devise)}. ` +
    `Les montants, hypothèses et informations présentés correspondent aux données enregistrées dans le dossier au moment de la génération.`
  );
}

function BPB3_ajouterAnnexeEcheancier_(body, dossier, modele) {
  body.appendPageBreak();
  BPB3_titre_(body, 'Annexe — Échéancier mensuel indicatif', 1);
  const devise = dossier.audit.indicateurs.devise;
  const rows = [['Mois', 'Solde initial', 'Paiement', 'Intérêts', 'Capital', 'Solde final']]
    .concat(modele.echeancier.mensuel.map(function (m) {
      return [
        String(m.mois),
        BPB3_monnaie_(m.soldeInitial, devise),
        BPB3_monnaie_(m.paiement, devise),
        BPB3_monnaie_(m.interets, devise),
        BPB3_monnaie_(m.capital, devise),
        BPB3_monnaie_(m.soldeFinal, devise)
      ];
    }));
  BPB3_tableau_(body, rows, { entete: true, petitePolice: true });
}

function BPB3_ajouterPiedDePageRapport_(doc, dossier) {
  const footer = doc.getFooter() || doc.addFooter();
  const p = footer.appendParagraph(
    `Rapport de préparation bancaire — ${BPB3_texte_(dossier.standard.nomProjet, 'Projet')}`
  );
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText().setFontFamily(BPB3_CONFIG.POLICE).setFontSize(8).setForegroundColor(BPB3_CONFIG.COULEUR_MUETTE);
}


function BPB3_ajouterAnalyseSynthese_(body, dossier, modele) {
  const i = dossier.audit.indicateurs;
  const an1 = modele.annees[0];
  const marge = i.chiffreAffairesMensuel > 0 ? (i.margeBruteMensuelle / i.chiffreAffairesMensuel) * 100 : 0;
  BPB3_titre_(body, 'Lecture du dossier', 2);
  BPB3_paragraphe_(body,
    `La structure financière présente un apport de ${i.tauxApportPct} %, tandis que la marge brute mensuelle représente environ ${BPB3_arrondir_(marge)} % du chiffre d’affaires. ` +
    `Après prise en compte du service de la dette, le solde opérationnel de la première année resterait positif à ${BPB3_monnaie_(an1.soldeApresDette, i.devise)}. ` +
    `Cette lecture demeure conditionnée à la réalisation effective des volumes de vente, à la maîtrise des coûts variables et à la disponibilité des justificatifs annoncés.`
  );
}

function BPB3_ajouterAnalyseFinanciere_(body, dossier, modele) {
  BPB3_titre_(body, 'Analyse financière', 2);
  const analyseIA = BPB5_texteIA_(dossier, 'analyseFinanciere');
  if (analyseIA) {
    BPB3_paragraphe_(body, analyseIA);
    return;
  }
  const devise = dossier.audit.indicateurs.devise;
  const a1 = modele.annees[0];
  const a3 = modele.annees[2];
  const croissanceCa = a1.chiffreAffaires > 0 ? ((a3.chiffreAffaires / a1.chiffreAffaires) - 1) * 100 : 0;
  BPB3_paragraphe_(body,
    `Sur l’horizon de trois ans, le chiffre d’affaires progresserait de ${BPB3_arrondir_(croissanceCa)} %, passant de ${BPB3_monnaie_(a1.chiffreAffaires, devise)} à ${BPB3_monnaie_(a3.chiffreAffaires, devise)}. ` +
    `Dans le même temps, l’excédent opérationnel simplifié évoluerait de ${BPB3_monnaie_(a1.excedentOperationnel, devise)} à ${BPB3_monnaie_(a3.excedentOperationnel, devise)}. ` +
    `Le solde après service de la dette demeure positif sur les trois exercices simulés, ce qui soutient la capacité de remboursement dans le scénario central. ` +
    `La principale réserve tient au maintien constant des charges fixes et à l’absence d’amortissements, d’impôt sur le résultat et de variation future du besoin en fonds de roulement dans cette simulation simplifiée.`
  );
}

function BPB3_ajouterAnalyseScenarios_(body, dossier, modele) {
  const prudent = modele.scenarios[0];
  const central = modele.scenarios[1];
  BPB3_titre_(body, 'Interprétation', 2);
  BPB3_paragraphe_(body,
    `Le scénario prudent constitue le principal test de résistance du dossier. Sa couverture du nouveau financement ressort à ${prudent.couverture === null ? 'un niveau non calculable' : prudent.couverture}. ` +
    `${prudent.couverture !== null && prudent.couverture >= 1.2 ? 'Le projet conserve ainsi une capacité de paiement positive malgré la baisse de ventes et la hausse de coûts retenues.' : 'Ce niveau indique qu’une dégradation commerciale pourrait fragiliser le remboursement et nécessiter des mesures correctives.'} ` +
    `À l’inverse, le scénario central présente une couverture de ${central.couverture === null ? 'niveau non calculable' : central.couverture}.`
  );
}

function BPB3_ajouterGraphiquePrevisions_(body, modele, devise) {
  try {
    const data = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Année')
      .addColumn(Charts.ColumnType.NUMBER, "Chiffre d’affaires")
      .addColumn(Charts.ColumnType.NUMBER, 'Solde après dette');
    modele.annees.forEach(function (a) {
      data.addRow([`Année ${a.annee}`, a.chiffreAffaires, a.soldeApresDette]);
    });
    const chart = Charts.newColumnChart()
      .setDataTable(data.build())
      .setTitle(`Évolution financière (${devise})`)
      .setDimensions(620, 320)
      .setLegendPosition(Charts.Position.BOTTOM)
      .build();
    const image = body.appendImage(chart.getAs('image/png'));
    image.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  } catch (error) {
    // Le document reste générable si le service Charts n’est pas disponible.
  }
}

function BPB3_ajouterCouvertureFinanceur_(body, dossier) {
  const logo = BPB3_obtenirLogoBlob_();
  if (logo) {
    try {
      const image = body.appendImage(logo);
      if (image.getWidth() > 130) {
        const ratio = 130 / image.getWidth();
        image.setWidth(130).setHeight(Math.round(image.getHeight() * ratio));
      }
      image.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    } catch (ignored) {}
  }
  BPB3_paragraphe_(body, 'BUSINESS PLAN', {
    align: 'CENTER', size: 28, bold: true, color: BPB3_CONFIG.COULEUR_PRIMAIRE_FONCEE, spacingAfter: 16
  });
  BPB3_paragraphe_(body, BPB3_texte_(dossier.standard.nomProjet, 'Projet'), {
    align: 'CENTER', size: 22, bold: true, color: BPB3_CONFIG.COULEUR_TEXTE, spacingAfter: 24
  });
  BPB3_tableau_(body, [
    ['Présenté par', BPB3_texte_(dossier.standard.nomPromoteur, 'Non renseigné')],
    ['Financement recherché', BPB3_monnaie_(dossier.bancable.montantDemande, dossier.bancable.devise)],
    ['Durée envisagée', `${BPB3_nombre_(dossier.bancable.dureeRemboursementMois)} mois`],
    ['Date', BPB3_dateLongue_(new Date())]
  ], { entete: false, premiereColonneForte: true });
  BPB3_paragraphe_(body, 'Document confidentiel', {
    align: 'CENTER', size: 10, italic: true, color: BPB3_CONFIG.COULEUR_MUETTE, spacingBefore: 4
  });
  body.appendPageBreak();
}

function BPB3_ajouterSyntheseFinanceur_(body, dossier, modele) {
  const s = dossier.standard;
  const p = dossier.bancable;
  const i = dossier.audit.indicateurs;
  const couverture = i.couvertureMensuelleSimplifiee === null ? 'non calculée' : i.couvertureMensuelleSimplifiee;

  BPB3_titre_(body, '1. Résumé exécutif', 1);
  const resumeIA = BPB5_texteIA_(dossier, 'resumeExecutif');
  if (resumeIA) {
    BPB3_paragraphe_(body, resumeIA, { spacingAfter: 12 });
  } else {
    BPB3_paragraphe_(body,
      `${BPB3_texte_(s.nomProjet, 'Le projet')} est porté par ${BPB3_texte_(s.nomPromoteur, 'le promoteur')}. ` +
      `${BPB3_phrase_(s.descriptionProjet)} L’initiative répond à ${BPB3_minuscule_(BPB3_texte_(s.problemeResolu, 'un besoin identifié sur le marché'))} ` +
      `en proposant ${BPB3_minuscule_(BPB3_texte_(s.solution, 'la solution décrite dans ce dossier'))}.`,
      { spacingAfter: 10 }
    );
  }
  BPB3_paragraphe_(body,
    `Le besoin de financement global s’établit à ${BPB3_monnaie_(i.totalBesoins, i.devise)}. ` +
    `Le financement recherché est de ${BPB3_monnaie_(p.montantDemande, i.devise)}, complété par un apport de ${BPB3_monnaie_(p.apportPromoteur, i.devise)}, représentant ${i.tauxApportPct} % des besoins. ` +
    `Le chiffre d’affaires annuel de référence est estimé à ${BPB3_monnaie_(i.chiffreAffairesAnnuel, i.devise)}.`,
    { spacingAfter: 10 }
  );
  BPB3_paragraphe_(body,
    `Selon les hypothèses retenues, l’activité dégagerait un excédent opérationnel mensuel simplifié de ${BPB3_monnaie_(i.excedentOperationnelMensuelSimplifie, i.devise)}. ` +
    `La mensualité simulée du financement est de ${BPB3_monnaie_(i.mensualiteEstimee, i.devise)}, pour une couverture mensuelle de ${couverture}. ` +
    `Le solde opérationnel après dette demeure positif sur les trois années de projection dans le scénario central.`,
    { spacingAfter: 16 }
  );

  BPB3_tableau_(body, [
    ['Indicateur clé', 'Valeur'],
    ['Besoin total', BPB3_monnaie_(i.totalBesoins, i.devise)],
    ['Financement recherché', BPB3_monnaie_(p.montantDemande, i.devise)],
    ['Apport', `${i.tauxApportPct}%`],
    ['Chiffre d’affaires mensuel', BPB3_monnaie_(i.chiffreAffairesMensuel, i.devise)],
    ['Marge brute mensuelle', BPB3_monnaie_(i.margeBruteMensuelle, i.devise)],
    ['Mensualité simulée', BPB3_monnaie_(i.mensualiteEstimee, i.devise)],
    ['Couverture mensuelle', couverture],
    ['Solde après dette — année 1', BPB3_monnaie_(modele.annees[0].soldeApresDette, i.devise)]
  ], { entete: true, premiereColonneForte: true });
}

function BPB3_ajouterConclusionFinanceur_(body, dossier, modele) {
  const i = dossier.audit.indicateurs;
  const prudent = modele.scenarios[0];
  BPB3_titre_(body, '12. Conclusion', 1);
  const conclusionIA = BPB5_texteIA_(dossier, 'conclusion');
  if (conclusionIA) {
    BPB3_paragraphe_(body, conclusionIA);
  } else {
    BPB3_paragraphe_(body,
      `Le projet sollicite un financement de ${BPB3_monnaie_(dossier.bancable.montantDemande, i.devise)} pour un besoin global de ${BPB3_monnaie_(i.totalBesoins, i.devise)}. ` +
      `L’apport déclaré représente ${i.tauxApportPct} % du plan de financement. Sur la base des hypothèses présentées, l’activité génère un solde opérationnel positif après dette au cours des trois exercices simulés. ` +
      `La couverture du financement demeure ${prudent.couverture !== null && prudent.couverture >= 1.2 ? 'positive' : 'sensible'} dans le scénario prudent.`
    );
  }
  BPB3_encadre_(body,
    'Ce Business Plan a été structuré à partir des informations communiquées par le porteur de projet. Les données, hypothèses et pièces justificatives restent sous la responsabilité du promoteur. La décision de financement appartient exclusivement à l’établissement sollicité.',
    '#F5F6F5'
  );
}

function BPB3_ajouterPiedDePageFinanceur_(doc, dossier) {
  const footer = doc.getFooter() || doc.addFooter();
  const p = footer.appendParagraph(`${BPB3_texte_(dossier.standard.nomProjet, 'Projet')} — Business Plan`);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText().setFontFamily(BPB3_CONFIG.POLICE).setFontSize(8).setForegroundColor(BPB3_CONFIG.COULEUR_MUETTE);
}

function BPB3_creerDocumentFinanceur_(dossier, modele, folder) {
  const projet = BPB3_texte_(dossier.standard.nomProjet, 'Projet');
  const dateCode = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
  const nomBase = BPB3_nettoyerNomFichier_(`Business Plan final - ${projet} - ${dateCode}`);
  const doc = DocumentApp.create(nomBase);
  const documentId = doc.getId();
  const body = doc.getBody();
  body.clear();
  body.setMarginTop(54).setMarginBottom(54).setMarginLeft(54).setMarginRight(54);

  BPB3_ajouterCouvertureFinanceur_(body, dossier);
  BPB3_ajouterSyntheseFinanceur_(body, dossier, modele);
  BPB3_ajouterProfilPromoteur_(body, dossier);
  BPB3_ajouterProjetEtMarche_(body, dossier);
  BPB3_ajouterModeleEconomique_(body, dossier);
  BPB3_ajouterPlanOperationnel_(body, dossier);
  BPB3_ajouterFinancement_(body, dossier);
  BPB3_ajouterHypothesesVentes_(body, dossier);
  BPB3_ajouterPrevisionsFinancieres_(body, dossier, modele);
  BPB3_ajouterRemboursement_(body, dossier, modele);
  BPB3_ajouterScenarios_(body, dossier, modele);
  BPB3_ajouterRisques_(body, dossier);
  BPB3_ajouterConclusionFinanceur_(body, dossier, modele);
  BPB3_ajouterAnnexeEcheancier_(body, dossier, modele);
  BPB3_ajouterPiedDePageFinanceur_(doc, dossier);

  doc.saveAndClose();
  const docFile = DriveApp.getFileById(documentId);
  docFile.moveTo(folder);
  const pdfFile = folder.createFile(docFile.getAs(MimeType.PDF).setName(`${nomBase}.pdf`));
  return {
    documentId: documentId,
    documentUrl: docFile.getUrl(),
    pdfId: pdfFile.getId(),
    pdfUrl: pdfFile.getUrl()
  };
}

function genererBusinessPlanFinanceur_(dossierId, options) {
  const id = BPB3_normaliserDossierId_(dossierId);
  const opts = options && typeof options === 'object' ? options : {};
  const preparation = BPB3_preparerGeneration_(id, Boolean(opts.forcer), 'FINANCEUR');
  if (preparation.reutiliser) {
    return Object.assign({ succes: true, reutilise: true }, preparation.generation);
  }

  try {
    const source = BPB_obtenirDossierUnifie_(id);
    const validationFinale = BPB_lireJsonChunked_(BPB_cle_(id, 'VALIDATION_FINALE'));
    if (!validationFinale || validationFinale.informationsExactes !== true || validationFinale.decisionFinanceur !== true) {
      throw new Error('La validation finale du porteur doit être enregistrée avant la génération de la version financeur.');
    }
    const analyse = analyserBusinessPlanBancable(source.standard, source.bancable);
    if (!analyse.audit || !analyse.audit.pretPourGeneration) {
      throw new Error('La version financeur reste bloquée tant qu’une anomalie critique subsiste.');
    }
    const dossier = {
      dossierId: id,
      meta: source.meta || {},
      standard: analyse.standard || {},
      bancable: analyse.bancable || {},
      audit: analyse.audit
    };
    const modeleFinancier = BPB3_construireModeleFinancier_(dossier);
    dossier.narratifIA = BPB5_obtenirNarratifIA_(dossier, modeleFinancier);
    const folder = BPB3_obtenirDossierSortie_();
    const resultatDocument = BPB3_creerDocumentFinanceur_(dossier, modeleFinancier, folder);
    const generation = {
      statut: 'FINANCEUR_GENERE',
      typeDocument: 'BUSINESS_PLAN_FINANCEUR',
      moteurRedaction: dossier.narratifIA && !dossier.narratifIA._fallback ? 'HUMBLEOS_LOCAL' : 'SECOURS_DETERMINISTE',
      dossierId: id,
      nomProjet: BPB3_texte_(dossier.standard.nomProjet, 'Projet'),
      genereLe: new Date().toISOString(),
      version: BPB3_CONFIG.VERSION,
      documentId: resultatDocument.documentId,
      documentUrl: resultatDocument.documentUrl,
      pdfId: resultatDocument.pdfId,
      pdfUrl: resultatDocument.pdfUrl,
      folderId: folder.getId(),
      folderUrl: folder.getUrl()
    };
    BPB3_enregistrerSucces_(id, generation, 'FINANCEUR');

    const bridge = String(dossier.meta.agBridge || '').trim();
    if (bridge) {
      try {
        synchroniserBusinessPlanVersDashboard_(bridge, generation);
        generation.dashboardSync = { success: true };
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        console.error('Synchronisation Dashboard AfriGreen24 impossible :', message);
        generation.dashboardSync = { success: false, error: message };
      }
    } else {
      generation.dashboardSync = { success: false, skipped: true };
    }

    return Object.assign({ succes: true, reutilise: false }, generation);
  } catch (error) {
    BPB3_enregistrerEchec_(id, error, 'FINANCEUR');
    throw error;
  }
}

/* =====================================================
 * Modèle financier
 * ===================================================== */

function BPB3_construireModeleFinancier_(dossier) {
  const p = dossier.bancable;
  const i = dossier.audit.indicateurs;
  const croissance = BPB3_nombre_(p.croissanceAnnuellePct) / 100;
  const ratioVariable = i.chiffreAffairesMensuel > 0
    ? i.coutsVariablesMensuels / i.chiffreAffairesMensuel
    : 0;
  const chargesFixesAnnuelles = i.chargesFixesMensuelles * 12;
  const serviceDetteExistanteAnnuel = BPB3_nombre_(p.mensualitesDettesExistantes) * 12;
  const echeancier = BPB3_construireEcheancier_(p);

  const annees = [];
  for (let index = 0; index < 3; index += 1) {
    const chiffreAffaires = i.chiffreAffairesAnnuel * Math.pow(1 + croissance, index);
    const coutsVariables = chiffreAffaires * ratioVariable;
    const margeBrute = chiffreAffaires - coutsVariables;
    const chargesFixes = chargesFixesAnnuelles;
    const excedentOperationnel = margeBrute - chargesFixes;
    const serviceNouvelleDette = echeancier.annuel[index] ? echeancier.annuel[index].paiements : 0;
    const serviceDette = serviceDetteExistanteAnnuel + serviceNouvelleDette;
    annees.push({
      annee: index + 1,
      chiffreAffaires: BPB3_arrondir_(chiffreAffaires),
      coutsVariables: BPB3_arrondir_(coutsVariables),
      margeBrute: BPB3_arrondir_(margeBrute),
      chargesFixes: BPB3_arrondir_(chargesFixes),
      excedentOperationnel: BPB3_arrondir_(excedentOperationnel),
      serviceDetteExistante: BPB3_arrondir_(serviceDetteExistanteAnnuel),
      serviceNouvelleDette: BPB3_arrondir_(serviceNouvelleDette),
      serviceDette: BPB3_arrondir_(serviceDette),
      soldeApresDette: BPB3_arrondir_(excedentOperationnel - serviceDette)
    });
  }

  const mensualiteReference = echeancier.mensualiteApresDiffere || i.mensualiteEstimee || 0;
  const central = {
    nom: 'Central',
    chiffreAffairesMensuel: i.chiffreAffairesMensuel,
    excedentOperationnelMensuel: i.capaciteDisponibleAvantNouvelleDette,
    couverture: mensualiteReference > 0
      ? BPB3_arrondirDec_(i.capaciteDisponibleAvantNouvelleDette / mensualiteReference, 2)
      : null
  };
  const prudent = {
    nom: `Prudent (-${BPB3_nombre_(p.scenarioBaisseVentesPct)} % ventes / +${BPB3_nombre_(p.scenarioHausseCoutsPct)} % coûts)`,
    chiffreAffairesMensuel: i.scenarioPrudent.chiffreAffairesMensuel,
    excedentOperationnelMensuel: i.scenarioPrudent.capaciteDisponibleAvantNouvelleDette,
    couverture: mensualiteReference > 0
      ? BPB3_arrondirDec_(i.scenarioPrudent.capaciteDisponibleAvantNouvelleDette / mensualiteReference, 2)
      : null
  };
  const caFavorable = i.chiffreAffairesMensuel * 1.10;
  const cvFavorable = i.coutsVariablesMensuels * 1.10;
  const excedentFavorable = caFavorable - cvFavorable - i.chargesFixesMensuelles;
  const capaciteFavorable = excedentFavorable - BPB3_nombre_(p.mensualitesDettesExistantes);
  const favorable = {
    nom: 'Favorable (+10 % de chiffre d’affaires)',
    chiffreAffairesMensuel: BPB3_arrondir_(caFavorable),
    excedentOperationnelMensuel: BPB3_arrondir_(capaciteFavorable),
    couverture: mensualiteReference > 0
      ? BPB3_arrondirDec_(capaciteFavorable / mensualiteReference, 2)
      : null
  };

  return { annees: annees, echeancier: echeancier, scenarios: [prudent, central, favorable] };
}

function BPB3_construireEcheancier_(premium) {
  const capitalInitial = Math.max(0, BPB3_nombre_(premium.montantDemande));
  const duree = Math.max(1, Math.min(BPB3_CONFIG.MAX_MOIS_ECHEANCIER, BPB3_nombre_(premium.dureeRemboursementMois) || 1));
  const differe = Math.max(0, Math.min(duree - 1, BPB3_nombre_(premium.differeMois)));
  const tauxMensuel = Math.max(0, BPB3_nombre_(premium.tauxInteretAnnuel)) / 100 / 12;
  const moisAmortissement = Math.max(1, duree - differe);
  const mensualiteApresDiffere = capitalInitial <= 0
    ? 0
    : tauxMensuel > 0
      ? capitalInitial * tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -moisAmortissement))
      : capitalInitial / moisAmortissement;

  let solde = capitalInitial;
  const mensuel = [];
  for (let mois = 1; mois <= duree; mois += 1) {
    const soldeInitial = solde;
    const interets = soldeInitial * tauxMensuel;
    let paiement;
    let capital;

    if (mois <= differe) {
      paiement = interets;
      capital = 0;
    } else {
      paiement = Math.min(soldeInitial + interets, mensualiteApresDiffere);
      capital = Math.max(0, paiement - interets);
    }

    solde = Math.max(0, soldeInitial - capital);
    mensuel.push({
      mois: mois,
      soldeInitial: BPB3_arrondir_(soldeInitial),
      paiement: BPB3_arrondir_(paiement),
      interets: BPB3_arrondir_(interets),
      capital: BPB3_arrondir_(capital),
      soldeFinal: BPB3_arrondir_(solde)
    });
  }

  const annuel = [];
  const nbAnnees = Math.ceil(duree / 12);
  for (let annee = 1; annee <= nbAnnees; annee += 1) {
    const lignes = mensuel.slice((annee - 1) * 12, annee * 12);
    annuel.push({
      annee: annee,
      paiements: BPB3_arrondir_(BPB3_somme_(lignes, 'paiement')),
      interets: BPB3_arrondir_(BPB3_somme_(lignes, 'interets')),
      capitalRembourse: BPB3_arrondir_(BPB3_somme_(lignes, 'capital')),
      soldeFin: lignes.length ? lignes[lignes.length - 1].soldeFinal : 0
    });
  }

  return {
    capitalInitial: BPB3_arrondir_(capitalInitial),
    dureeMois: duree,
    differeMois: differe,
    mensualiteApresDiffere: BPB3_arrondir_(mensualiteApresDiffere),
    mensuel: mensuel,
    annuel: annuel
  };
}

/* =====================================================
 * Styles Google Docs
 * ===================================================== */

function BPB3_titre_(body, texte, niveau) {
  const p = body.appendParagraph(String(texte || ''));
  p.setHeading(niveau === 1 ? DocumentApp.ParagraphHeading.HEADING1 : DocumentApp.ParagraphHeading.HEADING2);
  p.setSpacingBefore(niveau === 1 ? 18 : 12).setSpacingAfter(7);
  const t = p.editAsText();
  t.setFontFamily(BPB3_CONFIG.POLICE)
    .setFontSize(niveau === 1 ? 17 : 13)
    .setBold(true)
    .setForegroundColor(niveau === 1 ? BPB3_CONFIG.COULEUR_PRIMAIRE_FONCEE : BPB3_CONFIG.COULEUR_PRIMAIRE);
  return p;
}

function BPB3_paragraphe_(body, texte, options) {
  const o = options || {};
  const p = body.appendParagraph(String(texte || ''));
  p.setSpacingAfter(o.spacingAfter === undefined ? 7 : o.spacingAfter);
  if (o.spacingBefore !== undefined) p.setSpacingBefore(o.spacingBefore);
  if (o.align) p.setAlignment(DocumentApp.HorizontalAlignment[o.align]);
  const t = p.editAsText();
  t.setFontFamily(BPB3_CONFIG.POLICE)
    .setFontSize(o.size || 10)
    .setForegroundColor(o.color || BPB3_CONFIG.COULEUR_TEXTE)
    .setBold(Boolean(o.bold))
    .setItalic(Boolean(o.italic));
  return p;
}

function BPB3_puce_(body, texte) {
  const item = body.appendListItem(String(texte || ''));
  item.setGlyphType(DocumentApp.GlyphType.BULLET).setSpacingAfter(4);
  item.editAsText().setFontFamily(BPB3_CONFIG.POLICE).setFontSize(10).setForegroundColor(BPB3_CONFIG.COULEUR_TEXTE);
  return item;
}

function BPB3_encadre_(body, texte, couleur) {
  const table = body.appendTable([[String(texte || '')]]);
  const cell = table.getCell(0, 0);
  cell.setBackgroundColor(couleur || BPB3_CONFIG.COULEUR_CLAIRE);
  cell.setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(12).setPaddingRight(12);
  cell.editAsText().setFontFamily(BPB3_CONFIG.POLICE).setFontSize(10).setForegroundColor(BPB3_CONFIG.COULEUR_TEXTE);
  body.appendParagraph('').setSpacingAfter(4);
  return table;
}

function BPB3_tableau_(body, lignes, options) {
  const o = options || {};
  const safeRows = (Array.isArray(lignes) && lignes.length ? lignes : [['', '']]).map(function (row) {
    return (Array.isArray(row) ? row : [row]).map(function (cell) { return String(cell === null || cell === undefined ? '' : cell); });
  });
  const table = body.appendTable(safeRows);

  for (let r = 0; r < table.getNumRows(); r += 1) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells(); c += 1) {
      const cell = row.getCell(c);
      cell.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(7).setPaddingRight(7);
      const text = cell.editAsText();
      text.setFontFamily(BPB3_CONFIG.POLICE)
        .setFontSize(o.petitePolice ? 8 : 9)
        .setForegroundColor(BPB3_CONFIG.COULEUR_TEXTE);

      if (o.entete && r === 0) {
        cell.setBackgroundColor(BPB3_CONFIG.COULEUR_PRIMAIRE);
        text.setBold(true).setForegroundColor('#FFFFFF');
      } else if (o.premiereColonneForte && c === 0) {
        cell.setBackgroundColor('#F3F6F4');
        text.setBold(true);
      }

      if (o.derniereLigneForte && r === table.getNumRows() - 1) {
        cell.setBackgroundColor(BPB3_CONFIG.COULEUR_CLAIRE);
        text.setBold(true);
      }
    }
  }
  body.appendParagraph('').setSpacingAfter(2);
  return table;
}

/* =====================================================
 * État, stockage et utilitaires
 * ===================================================== */

function BPB3_preparerGeneration_(dossierId, forcer, typeDocument) {
  const type = typeDocument === 'FINANCEUR' ? 'FINANCEUR' : 'RAPPORT';
  const cleGeneration = type === 'FINANCEUR' ? 'GENERATION_FINANCEUR' : 'GENERATION_RAPPORT';
  const statutAttendu = type === 'FINANCEUR' ? 'FINANCEUR_GENERE' : 'RAPPORT_GENERE';
  return BPB_avecVerrou_(function () {
    const meta = BPB_lireJsonChunked_(BPB_cle_(dossierId, 'META')) || {};
    const existante = BPB_lireJsonChunked_(BPB_cle_(dossierId, cleGeneration));

    if (!forcer && existante && existante.statut === statutAttendu && BPB3_fichiersExistent_(existante)) {
      return { reutiliser: true, generation: existante };
    }

    const statutsAutorises = ['PRET_POUR_GENERATION', 'DOCUMENT_GENERE', 'RAPPORT_GENERE', 'VALIDATION_FINALE_ENREGISTREE', 'FINANCEUR_GENERE', 'ERREUR_GENERATION'];
    if (statutsAutorises.indexOf(meta.statut) === -1) {
      throw new Error('Le dossier doit être audité et validé avant la génération.');
    }
    return { reutiliser: false };
  });
}

function BPB3_enregistrerSucces_(dossierId, generation, typeDocument) {
  BPB_avecVerrou_(function () {
    const type = typeDocument === 'FINANCEUR' ? 'FINANCEUR' : 'RAPPORT';
    const cleGeneration = type === 'FINANCEUR' ? 'GENERATION_FINANCEUR' : 'GENERATION_RAPPORT';
    BPB_ecrireJsonChunked_(BPB_cle_(dossierId, cleGeneration), generation);
    const meta = BPB_lireJsonChunked_(BPB_cle_(dossierId, 'META')) || {};
    BPB_ecrireJsonChunked_(BPB_cle_(dossierId, 'META'), Object.assign({}, meta, {
      statut: type === 'FINANCEUR' ? 'FINANCEUR_GENERE' : 'RAPPORT_GENERE',
      genereLe: generation.genereLe,
      modifieLe: new Date().toISOString()
    }));
  });
}

function BPB3_enregistrerEchec_(dossierId, error, typeDocument) {
  try {
    BPB_avecVerrou_(function () {
      const type = typeDocument === 'FINANCEUR' ? 'FINANCEUR' : 'RAPPORT';
      const cleGeneration = type === 'FINANCEUR' ? 'GENERATION_FINANCEUR' : 'GENERATION_RAPPORT';
      const echec = {
        statut: 'ERREUR_GENERATION',
        typeDocument: type,
        dossierId: dossierId,
        erreur: error && error.message ? error.message : String(error),
        date: new Date().toISOString()
      };
      BPB_ecrireJsonChunked_(BPB_cle_(dossierId, cleGeneration), echec);
    });
  } catch (ignored) {}
}

function BPB3_obtenirDossierSortie_() {
  const properties = PropertiesService.getScriptProperties();
  const configuredId = String(properties.getProperty(BPB3_CONFIG.CLE_DOSSIER_SORTIE) || '').trim();
  if (configuredId) {
    try { return DriveApp.getFolderById(configuredId); } catch (error) { /* recréation ci-dessous */ }
  }

  const root = DriveApp.getRootFolder();
  const folders = root.getFoldersByName(BPB3_CONFIG.NOM_DOSSIER_PAR_DEFAUT);
  const folder = folders.hasNext() ? folders.next() : root.createFolder(BPB3_CONFIG.NOM_DOSSIER_PAR_DEFAUT);
  properties.setProperty(BPB3_CONFIG.CLE_DOSSIER_SORTIE, folder.getId());
  return folder;
}

function BPB3_obtenirLogoBlob_() {
  const properties = PropertiesService.getScriptProperties();
  let logoId = String(
    properties.getProperty(BPB3_CONFIG.CLE_LOGO) || ''
  ).trim();

  if (!logoId) {
    try {
      if (
        typeof CONFIG !== 'undefined' &&
        CONFIG &&
        CONFIG.logoDriveId
      ) {
        logoId = String(CONFIG.logoDriveId).trim();
      }
    } catch (error) {
      logoId = '';
    }
  }

  if (!logoId) {
    return null;
  }

  try {
    return DriveApp
      .getFileById(logoId)
      .getBlob();
  } catch (error) {
    Logger.log(
      'Logo client indisponible : ' +
      (error && error.message ? error.message : String(error))
    );
    return null;
  }
}

function BPB3_fichiersExistent_(generation) {
  try {
    if (!generation.documentId || !generation.pdfId) return false;
    DriveApp.getFileById(generation.documentId).getName();
    DriveApp.getFileById(generation.pdfId).getName();
    return true;
  } catch (error) {
    return false;
  }
}

function BPB3_normaliserDossierId_(dossierId) {
  const id = String(dossierId || '').trim();
  if (!id) throw new Error('Identifiant de dossier obligatoire.');
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) throw new Error('Identifiant de dossier invalide.');
  return id;
}

function BPB3_texte_(valeur, fallback) {
  const texte = valeur === null || valeur === undefined ? '' : String(valeur).trim();
  return texte || (fallback === undefined ? '' : String(fallback));
}

function BPB3_phrase_(valeur) {
  const texte = BPB3_texte_(valeur, '');
  if (!texte) return '';
  return /[.!?]$/.test(texte) ? texte : texte + '.';
}

function BPB3_minuscule_(valeur) {
  const texte = BPB3_texte_(valeur, '');
  return texte ? texte.charAt(0).toLowerCase() + texte.slice(1) : '';
}

function BPB3_nombre_(valeur) {
  const propre = typeof valeur === 'string' ? valeur.replace(/\s/g, '').replace(',', '.') : valeur;
  const n = Number(propre);
  return Number.isFinite(n) ? n : 0;
}

function BPB3_arrondir_(valeur) {
  return Math.round((BPB3_nombre_(valeur) + Number.EPSILON));
}

function BPB3_arrondirDec_(valeur, decimales) {
  const facteur = Math.pow(10, decimales || 0);
  return Math.round((BPB3_nombre_(valeur) + Number.EPSILON) * facteur) / facteur;
}

function BPB3_somme_(liste, cle) {
  return (Array.isArray(liste) ? liste : []).reduce(function (total, element) {
    return total + BPB3_nombre_(cle ? element[cle] : element);
  }, 0);
}

function BPB3_monnaie_(valeur, devise) {
  const montant = BPB3_nombre_(valeur);
  const code = BPB3_texte_(devise, 'XOF');
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(montant);
  } catch (error) {
    return `${Math.round(montant).toLocaleString('fr-FR')} ${code}`;
  }
}

function BPB3_dateLongue_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'GMT', 'dd/MM/yyyy');
}

function BPB3_nettoyerNomFichier_(nom) {
  return String(nom || 'Business Plan Bancable').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 180);
}

/**
 * Test de livraison V4 : génère le rapport de préparation puis la version financeur
 * à partir du même dossier de démonstration.
 */
function testerWorkflowCompletBusinessPlanBancableV4_() {
  const rapport = testerGenerationBusinessPlanBancable_();
  const financeur = genererBusinessPlanFinanceur_(rapport.dossierId, { forcer: true });
  const resultat = { succes: true, dossierId: rapport.dossierId, rapport: rapport, financeur: financeur };
  Logger.log(JSON.stringify(resultat, null, 2));
  return resultat;
}
function TEST_BPB_LOGO_CLIENT_() {
  const properties = PropertiesService.getScriptProperties();

  const propertyKey = BPB3_CONFIG.CLE_LOGO;

  const propertyValue = String(
    properties.getProperty(propertyKey) || ''
  ).trim();

  Logger.log('================================');
  Logger.log('TEST LOGO CLIENT BUSINESS PLAN');
  Logger.log('================================');

  Logger.log('Clé utilisée : ' + propertyKey);
  Logger.log('FileId trouvé : ' + propertyValue);

  if (!propertyValue) {
    Logger.log('RESULTAT : AUCUN LOGO CONFIGURÉ');
    return {
      success: false,
      reason: 'NO_LOGO_ID',
      propertyKey: propertyKey,
      fileId: ''
    };
  }

  try {
    const file = DriveApp.getFileById(propertyValue);
    const blob = file.getBlob();

    Logger.log('Nom fichier : ' + file.getName());
    Logger.log('MimeType : ' + blob.getContentType());
    Logger.log('Taille : ' + blob.getBytes().length + ' octets');
    Logger.log('RESULTAT : LOGO ACCESSIBLE');

    return {
      success: true,
      propertyKey: propertyKey,
      fileId: propertyValue,
      fileName: file.getName(),
      mimeType: blob.getContentType(),
      sizeBytes: blob.getBytes().length
    };

  } catch (error) {
    Logger.log(
      'RESULTAT : ERREUR ACCÈS LOGO -> ' +
      (error && error.message ? error.message : String(error))
    );

    return {
      success: false,
      reason: 'LOGO_ACCESS_ERROR',
      propertyKey: propertyKey,
      fileId: propertyValue,
      error: error && error.message ? error.message : String(error)
    };
  }
}
function CONFIGURER_LOGO_TEST_BPB_() {
  return configurerLogoBusinessPlanBancable_(
    "1UX-WStJvJ_cVbBfAQAcOG9vwqud8WRIE"
  );
}
