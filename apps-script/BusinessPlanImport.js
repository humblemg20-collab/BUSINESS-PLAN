/**
 * ============================================================
 * AFRIGREEN24 — BUSINESS PLAN IMPORT V5 DETERMINISTIC-FIRST — DRIVE API V3
 * ============================================================
 *
 * Dépendances déjà présentes dans le projet :
 * - appelerOpenAI_(endpoint, method, payload)
 * - Drive API avancée activée en v3
 *
 * Pipeline :
 * PDF / WORD
 * -> conversion Google Docs / OCR
 * -> texte
 * -> replay déterministe si rapport généré par AfriGreen24
 * -> OpenAI /extract-business-plan sinon
 * -> contrôle local de la preuve
 * -> FOUND / TO_CONFIRM / MISSING
 * ============================================================
 */

const BP_IMPORT_AI_CONFIG = Object.freeze({
  VERSION: "5.4.0",
  SCHEMA_VERSION: "afrigreen24_bp_import_v8",
  MAX_FILE_BYTES: 15 * 1024 * 1024,
  MAX_TEXT_CHARS: 90000,
  MIN_TEXT_CHARS: 80,
  PREVIEW_CHARS: 1800,
  FOUND_CONFIDENCE: 0.82,
  MAX_EXTRACTED_LONG_FIELD_CHARS: 8000,
  MAX_EXTRACTED_SHORT_FIELD_CHARS: 600,
  MAX_EXTRACTED_EMAIL_CHARS: 320,
  MAX_EVIDENCE_CHARS: 1500,

  ALLOWED_MIME_TYPES: Object.freeze([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]),

  ALLOWED_EXTENSIONS: Object.freeze([
    "pdf",
    "doc",
    "docx"
  ])
});


const BP_IMPORT_FIELDS = Object.freeze([
  "projectName",
  "promoterName",
  "email",
  "country",
  "stage",

  "problem",
  "affectedPeople",
  "urgency",

  "solution",
  "valueProposition",
  "benefit",

  "targetCustomers",
  "marketArea",
  "salesChannels",
  "competitors",

  "revenueModel",
  "pricing",
  "sector",
  "mainCosts",
  "team",

  "fundingType",
  "fundingNeed",
  "useOfFunds",
  "impact",
  "risks"
]);


const BP_IMPORT_FINANCE_FIELDS = Object.freeze([
  "devise",
  "montantInvestissements",
  "montantStockInitial",
  "besoinFondsRoulementDeclare",
  "tresorerieSecurite",
  "apportPromoteur",
  "autresFinancements",
  "montantDemande",
  "utilisationFondsJson",
  "dureeRemboursementMois",
  "differeMois",
  "tauxInteretAnnuel",
  "dateBesoinFonds",
  "lignesVentesJson",
  "baseHypothesesVentesJson",
  "justificationHypothesesVentes",
  "croissanceAnnuellePct",
  "justificationCroissance",
  "saisonnalite",
  "detailsSaisonnalite",
  "salairesMensuels",
  "loyersMensuels",
  "marketingMensuel",
  "energieTelecomMensuel",
  "transportLogistiqueMensuel",
  "administrationMensuel",
  "impotsTaxesMensuels",
  "autresChargesFixesMensuelles",
  "detailsAutresCharges",
  "delaiPaiementClientsJours",
  "delaiPaiementFournisseursJours",
  "stockMoyenJours",
  "nombreClientsActuels",
  "chiffreAffairesHistorique",
  "chargesHistoriques12Mois",
  "tresorerieDisponibleActuelle",
  "creancesClientsActuelles",
  "dettesFinancieresExistantes",
  "mensualitesDettesExistantes",
  "preuvesDemandeJson",
  "detailsTraction",
  "responsableOperations",
  "responsableFinances",
  "effectifActuel",
  "recrutementsPrevusJson",
  "capaciteMaximaleMensuelle",
  "uniteCapacite",
  "statutAutorisations",
  "detailsAutorisations",
  "sourceRemboursement",
  "mensualiteMaxSupportable",
  "dateDebutRemboursementSouhaitee",
  "garantiesDisponiblesJson",
  "detailsGaranties",
  "risquesDetailJson",
  "scenarioBaisseVentesPct",
  "scenarioHausseCoutsPct"
]);

const BP_IMPORT_EXTRACTION_FIELDS = Object.freeze(
  BP_IMPORT_FIELDS.concat(
    BP_IMPORT_FINANCE_FIELDS
  )
);

const BP_IMPORT_FIELD_GUIDE = Object.freeze({
  devise:"Code devise explicite du dossier : XOF, XAF, EUR, USD, GBP, GNF, CDF, MAD, DZD ou TND.",
  montantInvestissements:"Montant total des investissements prévus.",
  montantStockInitial:"Montant du stock initial.",
  besoinFondsRoulementDeclare:"Besoin en fonds de roulement déclaré.",
  tresorerieSecurite:"Trésorerie de sécurité souhaitée.",
  apportPromoteur:"Apport du promoteur et/ou des associés.",
  autresFinancements:"Autres financements déjà prévus ou acquis.",
  montantDemande:"Montant demandé à la banque ou au financeur.",
  utilisationFondsJson:'Tableau JSON [{"poste":"","montant":0,"justification":""}] uniquement si le document détaille les emplois des fonds.',
  dureeRemboursementMois:"Durée de remboursement en mois.",
  differeMois:"Période de différé en mois.",
  tauxInteretAnnuel:"Taux d’intérêt annuel en pourcentage, uniquement s’il est écrit dans le document.",
  dateBesoinFonds:"Date de besoin des fonds au format YYYY-MM-DD si déterminable explicitement.",
  lignesVentesJson:'Tableau JSON [{"nom":"","prixUnitaire":0,"volumeMensuel":0,"coutVariableUnitaire":0}] uniquement si prix, volume et coût variable sont explicitement présents.',
  baseHypothesesVentesJson:'Tableau JSON de preuves explicites parmi : Ventes déjà réalisées, Commandes ou contrats, Précommandes ou lettres d’intention, Enquête auprès de clients, Tarifs observés chez des concurrents, Capacité réelle de production ou de prestation, Devis de fournisseurs, Estimation personnelle uniquement.',
  justificationHypothesesVentes:"Justification explicitement donnée pour les prix et volumes de ventes.",
  croissanceAnnuellePct:"Croissance annuelle prévue en pourcentage.",
  justificationCroissance:"Justification explicite de la croissance prévue.",
  saisonnalite:"Oui ou Non seulement si le document indique explicitement la saisonnalité.",
  detailsSaisonnalite:"Description des périodes fortes et faibles.",
  salairesMensuels:"Salaires et charges sociales mensuels.",
  loyersMensuels:"Loyers mensuels.",
  marketingMensuel:"Budget marketing/commercial mensuel.",
  energieTelecomMensuel:"Énergie, internet et télécommunications mensuels.",
  transportLogistiqueMensuel:"Transport et logistique mensuels.",
  administrationMensuel:"Administration, assurance et services professionnels mensuels.",
  impotsTaxesMensuels:"Impôts, taxes et cotisations mensuels estimés.",
  autresChargesFixesMensuelles:"Autres charges fixes mensuelles.",
  detailsAutresCharges:"Description des autres charges fixes.",
  delaiPaiementClientsJours:"Délai moyen de paiement clients en jours.",
  delaiPaiementFournisseursJours:"Délai moyen de paiement fournisseurs en jours.",
  stockMoyenJours:"Nombre moyen de jours de stock.",
  nombreClientsActuels:"Nombre de clients actuels.",
  chiffreAffairesHistorique:"Chiffre d’affaires réalisé sur les 12 derniers mois.",
  chargesHistoriques12Mois:"Charges totales des 12 derniers mois.",
  tresorerieDisponibleActuelle:"Trésorerie actuellement disponible.",
  creancesClientsActuelles:"Créances clients actuellement à encaisser.",
  dettesFinancieresExistantes:"Capital restant dû sur les dettes financières existantes.",
  mensualitesDettesExistantes:"Mensualités totales déjà supportées chaque mois.",
  preuvesDemandeJson:'Tableau JSON des preuves de demande explicitement présentes : Premières ventes, Précommandes, Lettres d’intention, Contrats, Partenariats commerciaux, Résultats de tests, Enquête clients.',
  detailsTraction:"Résultats commerciaux ou preuves de traction explicitement décrits.",
  responsableOperations:"Personne explicitement responsable des opérations.",
  responsableFinances:"Personne explicitement responsable des finances.",
  effectifActuel:"Effectif actuel.",
  recrutementsPrevusJson:'Tableau JSON [{"poste":"","nombre":0,"datePrevue":""}] des recrutements explicitement prévus.',
  capaciteMaximaleMensuelle:"Capacité maximale mensuelle de production ou service.",
  uniteCapacite:"Unité utilisée pour la capacité.",
  statutAutorisations:"Une valeur exacte parmi : Non applicable, Déjà obtenues, En cours d’obtention, À obtenir avant le démarrage.",
  detailsAutorisations:"Autorisations, licences ou certifications décrites.",
  sourceRemboursement:"Source de trésorerie explicitement prévue pour rembourser le financement.",
  mensualiteMaxSupportable:"Mensualité maximale déclarée comme supportable.",
  dateDebutRemboursementSouhaitee:"Date souhaitée de début de remboursement au format YYYY-MM-DD si explicite.",
  garantiesDisponiblesJson:'Tableau JSON des garanties explicitement mentionnées : Aucune garantie disponible, Équipement ou matériel, Bien immobilier, Dépôt ou épargne, Caution personnelle ou institutionnelle, Garantie d’un fonds, Autre.',
  detailsGaranties:"Description explicite des garanties ou sûretés.",
  risquesDetailJson:'Tableau JSON [{"risque":"","probabilite":"Faible|Moyenne|Élevée","impact":"Faible|Moyen|Élevé","mesure":""}] seulement lorsque ces quatre éléments sont explicitement documentés pour chaque risque.',
  scenarioBaisseVentesPct:"Pourcentage explicite de baisse des ventes utilisé dans un scénario prudent.",
  scenarioHausseCoutsPct:"Pourcentage explicite de hausse des coûts utilisé dans un scénario prudent."
});

const BP_IMPORT_STATUS = Object.freeze({
  FOUND: "FOUND",
  TO_CONFIRM: "TO_CONFIRM",
  MISSING: "MISSING",
  USER_COMPLETED: "USER_COMPLETED"
});

const BP_IMPORT_DETERMINISTIC_METHOD =
  "AFRIGREEN24_BUSINESS_PLAN_STRUCTURED_REPORT";


const BP_IMPORT_LABELLED_SOURCE_METHOD =
  "AFRIGREEN24_LABELLED_SOURCE_EXTRACTION";

/**
 * Extraction déterministe générique des faits explicitement étiquetés.
 *
 * Ce moteur intervient AVANT OpenAI. Il traite les règles connues
 * (libellé -> valeur) et laisse l'IA uniquement résoudre les champs
 * narratifs / tableaux encore absents.
 */
function extraireChampsEtiquetesBusinessPlan_(sourceText) {
  var source =
    String(sourceText || "")
      .replace(/\r/g,"");

  var lines =
    source.split(/\n/)
      .map(function(line) {
        return String(line || "").trim();
      });

  var result = {
    detected:false,
    fieldCount:0,
    fields:{},
    extractedFields:[]
  };

  function normalize(value) {
    var text =
      String(value || "")
        .toLowerCase();

    try {
      text =
        text.normalize("NFD")
          .replace(/[\u0300-\u036f]/g,"");
    } catch (error) {}

    return text
      .replace(/[“”«»"'\`´]/g,"")
      .replace(/[^a-z0-9%]+/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function clean(value) {
    return nettoyerValeurImportBP_(
      String(value || "")
    )
      .replace(/\s+/g," ")
      .trim();
  }

  function isLikelyValue(value) {
    var text = clean(value);
    if (!text) return false;

    var normalized = normalize(text);

    return !(
      /^\d{1,2}$/.test(normalized) ||
      /^poste$/.test(normalized) ||
      /^montant$/.test(normalized) ||
      /^justification$/.test(normalized) ||
      /^probabilite$/.test(normalized) ||
      /^impact$/.test(normalized) ||
      /^mesure de reduction$/.test(normalized)
    );
  }

  function findLabeled(labels) {
    var wanted =
      (labels || []).map(normalize);

    for (var i=0;i<lines.length;i++) {
      var raw = lines[i];
      if (!raw) continue;

      var colon = raw.indexOf(":");
      if (colon > -1) {
        var left = normalize(
          raw.substring(0,colon)
        );

        if (wanted.indexOf(left) !== -1) {
          var inlineValue =
            clean(raw.substring(colon + 1));

          if (isLikelyValue(inlineValue)) {
            return {
              value:inlineValue,
              evidence:raw
            };
          }
        }
      }

      var tabParts = raw.split(/\t+/);
      if (tabParts.length >= 2) {
        var tabLabel = normalize(tabParts[0]);

        if (wanted.indexOf(tabLabel) !== -1) {
          var tabValue =
            clean(tabParts.slice(1).join(" "));

          if (isLikelyValue(tabValue)) {
            return {
              value:tabValue,
              evidence:raw
            };
          }
        }
      }

      for (var w=0;w<wanted.length;w++) {
        var target = wanted[w];
        var combined = "";

        for (
          var span=0;
          span<4 && i+span<lines.length;
          span++
        ) {
          var piece = lines[i+span];
          if (!piece) continue;

          combined = normalize(
            (combined ? combined + " " : "") +
            piece
          );

          if (combined === target) {
            for (
              var j=i+span+1;
              j<lines.length &&
              j<=i+span+4;
              j++
            ) {
              if (
                !lines[j] ||
                !isLikelyValue(lines[j])
              ) {
                continue;
              }

              return {
                value:clean(lines[j]),
                evidence:
                  lines
                    .slice(i,j+1)
                    .filter(Boolean)
                    .join("\n")
              };
            }
          }

          if (
            target.indexOf(combined) !== 0
          ) {
            break;
          }
        }
      }
    }

    return null;
  }

  function add(field,labels,transform) {
    if (result.fields[field]) return;

    var candidate =
      findLabeled(labels);

    if (
      !candidate ||
      !candidate.value
    ) {
      return;
    }

    var value =
      typeof transform === "function"
        ? transform(candidate.value)
        : candidate.value;

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return;
    }

    result.fields[field] = {
      value:String(value),
      evidence:
        String(candidate.evidence || candidate.value)
          .slice(
            0,
            BP_IMPORT_AI_CONFIG.MAX_EVIDENCE_CHARS
          ),
      confidence:1,
      extractionMethod:
        BP_IMPORT_LABELLED_SOURCE_METHOD,
      deterministic:true,
      provenance:{
        extractionMethod:
          BP_IMPORT_LABELLED_SOURCE_METHOD,
        deterministic:true,
        sourceLabelDetected:true
      }
    };

    result.fieldCount += 1;
    result.extractedFields.push(field);
  }

  var specs = [
    ["projectName",["Nom du projet"]],
    ["promoterName",["Porteur du projet","Promoteur"]],
    ["email",["Email","E-mail"]],
    ["country",["Pays"]],
    ["sector",["Secteur","Secteur d'activité"]],
    ["stage",["Stade actuel","Stade du projet"]],
    ["targetCustomers",["Clientèle cible","Clients cibles"]],
    ["marketArea",["Zone de marché","Zone marche"]],
    ["competitors",["Concurrents / alternatives","Concurrents","Concurrence"]],
    ["valueProposition",["Avantage concurrentiel","Proposition de valeur"]],
    ["revenueModel",["Sources de revenus","Modèle de revenus","Modele de revenus"]],
    ["pricing",["Tarification","Politique tarifaire"]],
    ["team",["Équipe actuelle","Equipe actuelle","Équipe déclarée"]],
    ["impact",["Impact recherché","Impact déclaré"]],
    ["fundingType",["Type de financement recherché","Type de financement"]],
    ["fundingNeed",["Montant demandé","Montant recherché","Montant demandé à la banque"]],

    ["devise",["Devise"]],
    ["montantInvestissements",["Montant total des investissements"]],
    ["montantStockInitial",["Montant du stock initial"]],
    ["besoinFondsRoulementDeclare",["Besoin en fonds de roulement estimé","Besoin en fonds de roulement"]],
    ["tresorerieSecurite",["Trésorerie de sécurité souhaitée","Tresorerie de securite souhaitee"]],
    ["apportPromoteur",["Apport du promoteur et des associés","Apport total du promoteur et des associés","Apport promoteur"]],
    ["autresFinancements",["Autres financements déjà prévus","Autres financements"]],
    ["montantDemande",["Montant demandé à la banque","Montant demandé"]],
    ["dureeRemboursementMois",["Durée de remboursement souhaitée","Durée de remboursement souhaitée en mois","Durée de remboursement"]],
    ["differeMois",["Différé souhaité","Période de différé souhaitée","Période de différé souhaitée en mois"]],
    ["tauxInteretAnnuel",["Taux d'intérêt annuel estimatif","Taux d’intérêt annuel estimatif","Taux d’intérêt annuel estimatif, si connu"]],

    ["croissanceAnnuellePct",["Croissance annuelle prévue","Croissance annuelle prévue en pourcentage"]],
    ["saisonnalite",["Saisonnalité","Les ventes sont-elles saisonnières ?"]],
    ["detailsSaisonnalite",["Périodes fortes et faibles","Décrivez les périodes fortes et faibles"]],

    ["salairesMensuels",["Salaires et charges sociales","Salaires et charges sociales mensuels"]],
    ["loyersMensuels",["Loyers","Loyers mensuels"]],
    ["marketingMensuel",["Marketing et commercial","Budget marketing et commercial mensuel"]],
    ["energieTelecomMensuel",["Énergie, internet et télécommunications","Énergie, internet et télécommunications mensuels"]],
    ["transportLogistiqueMensuel",["Transport et logistique","Transport et logistique mensuels"]],
    ["administrationMensuel",["Administration, assurance et services professionnels"]],
    ["impotsTaxesMensuels",["Impôts, taxes et cotisations","Impôts, taxes et cotisations mensuels estimés"]],
    ["autresChargesFixesMensuelles",["Autres charges fixes","Autres charges fixes mensuelles"]],
    ["detailsAutresCharges",["Détail des autres charges","Précisez les autres charges"]],

    ["delaiPaiementClientsJours",["Délai moyen de paiement clients","Délai moyen de paiement des clients en jours"]],
    ["delaiPaiementFournisseursJours",["Délai moyen de paiement fournisseurs","Délai moyen de paiement des fournisseurs en jours"]],
    ["stockMoyenJours",["Stock moyen","Nombre moyen de jours de stock"]],

    ["nombreClientsActuels",["Nombre de clients actuels","Nombre approximatif de clients actuels"]],
    ["chiffreAffairesHistorique",["Chiffre d'affaires réalisé sur les 12 derniers mois","Chiffre d’affaires réalisé au cours des 12 derniers mois"]],
    ["chargesHistoriques12Mois",["Charges totales des 12 derniers mois","Charges totales supportées au cours des 12 derniers mois"]],
    ["tresorerieDisponibleActuelle",["Trésorerie actuellement disponible"]],
    ["creancesClientsActuelles",["Créances clients à encaisser","Montant total des factures clients restant à encaisser"]],
    ["dettesFinancieresExistantes",["Dettes financières existantes","Capital total restant dû sur les prêts et crédits existants"]],
    ["mensualitesDettesExistantes",["Mensualités de dettes existantes","Total des mensualités déjà payées chaque mois sur les dettes existantes"]],

    ["responsableOperations",["Responsable des opérations","Qui supervisera les opérations ?"]],
    ["responsableFinances",["Responsable des finances","Qui supervisera les finances ?"]],
    ["effectifActuel",["Effectif actuel"]],
    ["capaciteMaximaleMensuelle",["Capacité maximale mensuelle"]],
    ["uniteCapacite",["Unité de capacité","Unité utilisée pour mesurer la capacité"]],
    ["statutAutorisations",["Statut des autorisations","Situation des autorisations"]],
    ["detailsAutorisations",["Détails des autorisations"]],

    ["mensualiteMaxSupportable",["Mensualité maximale supportable","Mensualité maximale que l’entreprise estime pouvoir payer sans bloquer son activité"]],
    ["dateDebutRemboursementSouhaitee",["Début souhaité des remboursements","Date à partir de laquelle les remboursements pourraient commencer"]],
    ["detailsGaranties",["Détail des garanties","Précisez les garanties disponibles"]]
  ];

  specs.forEach(function(spec) {
    add(spec[0],spec[1]);
  });

  /*
   * Montant demandé et devise sont souvent déjà réunis dans la même valeur.
   * On propage le fait Standard vers le champ bancaire canonique.
   */
  if (
    !result.fields.montantDemande &&
    result.fields.fundingNeed
  ) {
    result.fields.montantDemande =
      Object.assign(
        {},
        result.fields.fundingNeed
      );
    result.fieldCount += 1;
    result.extractedFields.push(
      "montantDemande"
    );
  }

  result.detected =
    result.fieldCount > 0;

  return result;
}


/**
 * Extraction déterministe du Business Plan produit par notre propre
 * générateur. Cette voie est volontairement exécutée avant OpenAI : un
 * document dont la structure propriétaire est reconnue est rejoué localement
 * avec les valeurs et les preuves déjà visibles dans le document.
 */
function extraireRapportBusinessPlanDeterministe_(sourceText) {
  var source = String(sourceText || "").replace(/\r/g, "");
  var normalized = normaliserTexteVerificationBP_(source);
  var normalizedStructure = normalized
    .replace(/[\.:]/g, " ")
    .replace(/\s+/g, " ");
  var result = {
    detected: false,
    sourceSectionDetected: false,
    fieldCount: 0,
    fields: {},
    missingFields: []
  };

  var requiredMarkers = [
    "business plan",
    "sommaire",
    "document prepare a partir des informations fournies par le porteur du projet",
    "12 conclusion"
  ];

  if (!requiredMarkers.every(function(marker) {
    return normalizedStructure.indexOf(marker) !== -1;
  })) {
    return result;
  }

  result.detected = true;
  result.sourceSectionDetected = true;

  var lines = source.split(/\n/).map(function(line) {
    return String(line || "").trim();
  });

  function cleanValue(value) {
    return nettoyerValeurImportBP_(String(value || ""))
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizedLabel(value) {
    return normaliserTexteVerificationBP_(value)
      .replace(/\s*:\s*$/, "")
      .replace(/^(\d+)\s*[\.\-:]\s*/, "$1 ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findLabeled(labels) {
    var wanted = (labels || []).map(normalizedLabel);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line) continue;
      var tabParts = line.split(/\t+/);
      if (tabParts.length >= 2 &&
          wanted.indexOf(normalizedLabel(tabParts[0])) !== -1) {
        var tabValue = cleanValue(tabParts.slice(1).join(" "));
        if (tabValue) {
          return { value: tabValue, evidence: line };
        }
      }
      var colon = line.indexOf(":");
      if (colon > -1) {
        var left = normalizedLabel(line.substring(0, colon));
        if (wanted.indexOf(left) !== -1) {
          var inlineValue = cleanValue(line.substring(colon + 1));
          if (inlineValue) {
            return { value: inlineValue, evidence: line };
          }
        }
      }
      if (wanted.indexOf(normalizedLabel(line)) !== -1) {
        for (var j = i + 1; j < lines.length; j++) {
          if (!lines[j]) continue;
          var nextNormalized = normalizedLabel(lines[j]);
          if (/^\d{1,2}\s*(?:[\.\-:])/.test(nextNormalized)) break;
          if (wanted.indexOf(nextNormalized) !== -1) break;
          return {
            value: cleanValue(lines[j]),
            evidence: line + "\n" + lines[j]
          };
        }
      }
    }
    return null;
  }

  function findSection(title) {
    var wanted = normalizedLabel(title);
    var start = -1;
    for (var i = 0; i < lines.length; i++) {
      var normalizedLine = normalizedLabel(lines[i]);
      if (normalizedLine === wanted || normalizedLine.indexOf(wanted) === 0) {
        start = i + 1;
        break;
      }
    }
    if (start < 0) return null;
    var collected = [];
    for (var j = start; j < lines.length; j++) {
      var line = lines[j];
      var normalizedLine2 = normalizedLabel(line);
      if (/^\d{1,2}\s*(?:[\.\-:])/.test(normalizedLine2)) break;
      if (/^sommaire$/.test(normalizedLine2)) break;
      if (line) collected.push(line);
    }
    var value = cleanValue(collected.join(" "));
    return value ? { value: value, evidence: collected.join("\n") } : null;
  }

  function addField(field, candidate) {
    if (!candidate || !candidate.value || result.fields[field]) return;
    result.fields[field] = {
      value: candidate.value,
      confidence: 1,
      evidence: String(candidate.evidence || candidate.value).slice(0, BP_IMPORT_AI_CONFIG.MAX_EVIDENCE_CHARS),
      extractionMethod: BP_IMPORT_DETERMINISTIC_METHOD,
      deterministic: true,
      provenance: {
        extractionMethod: BP_IMPORT_DETERMINISTIC_METHOD,
        deterministic: true,
        sourceSectionDetected: true
      }
    };
    result.fieldCount++;
  }

  var labeled = [
    ["projectName", ["Nom du projet"]],
    ["promoterName", ["Porteur du projet"]],
    ["country", ["Pays ou zone", "Pays"]],
    ["sector", ["Secteur d'activité", "Secteur d’activite", "Secteur"]],
    ["stage", ["Stade du projet"]],
    ["affectedPeople", ["Population concernée", "Population concernee"]],
    ["valueProposition", ["Proposition de valeur"]],
    ["targetCustomers", ["Clientèle cible", "Clientele cible"]],
    ["competitors", ["Concurrence et alternatives"]],
    ["revenueModel", ["Sources de revenus"]],
    ["pricing", ["Politique tarifaire"]],
    ["mainCosts", ["Principaux coûts", "Principaux couts"]],
    ["salesChannels", ["Canaux déclarés", "Canaux declares"]],
    ["team", ["Équipe déclarée", "Equipe declaree"]],
    ["fundingType", ["Type de financement"]],
    ["fundingNeed", ["Montant recherché", "Montant recherche"]],
    ["useOfFunds", ["Utilisation prévue", "Utilisation prevue"]],
    ["impact", ["Impact déclaré", "Impact declare"]],
    ["risks", ["Risque déclaré", "Risque declare"]]
  ];

  labeled.forEach(function(item) {
    addField(item[0], findLabeled(item[1]));
  });

  [
    ["problem", "3. Problème et opportunité"],
    ["solution", "4. Solution proposée"]
  ].forEach(function(item) {
    addField(item[0], findSection(item[1]));
  });

  if (!result.fields.benefit && result.fields.valueProposition) {
    addField("benefit", result.fields.valueProposition);
  }

  BP_IMPORT_FIELDS.forEach(function(field) {
    if (!result.fields[field]) result.missingFields.push(field);
  });

  console.log(JSON.stringify({
    event: "business_plan_structured_report_deterministic_extraction",
    detected: result.detected,
    fieldCount: result.fieldCount,
    missingFields: result.missingFields
  }));

  return result;
}


/**
 * Point d'entrée appelé par Index.html.
 */
function recevoirFichierBusinessPlan(payload) {

  AG24_SEC_assertImportRequest_(payload);

  var fichiersTemporaires = [];

  try {

    var fichier =
      validerEtConstruireBlobBusinessPlan_(
        payload
      );

    var extraction =
      extraireTexteBusinessPlan_(
        fichier.blob,
        fichier.fileName,
        fichier.mimeType,
        fichiersTemporaires
      );

    var texte =
      nettoyerTexteBusinessPlan_(
        extraction.text
      );

    if (!texte) {
      throw new Error(
        "Le document a été reçu, mais aucun texte exploitable n’a pu être extrait."
      );
    }

    var originalTextLength =
      texte.length;

    if (
      originalTextLength <
      BP_IMPORT_AI_CONFIG.MIN_TEXT_CHARS
    ) {
      throw new Error(
        "Le document contient trop peu de texte exploitable. Vérifiez qu’il n’est pas vide, protégé ou illisible."
      );
    }

    var texteTronque =
      originalTextLength >
      BP_IMPORT_AI_CONFIG.MAX_TEXT_CHARS;

    if (texteTronque) {
      texte =
        texte.substring(
          0,
          BP_IMPORT_AI_CONFIG.MAX_TEXT_CHARS
        );
    }

    var analysisResult =
      analyserBusinessPlanAvecOpenAI_(
        texte
      );

    var wordCount =
      compterMotsBusinessPlan_(
        texte
      );

    var importMeta = {
      version:
        BP_IMPORT_AI_CONFIG.VERSION,

      schemaVersion:
        BP_IMPORT_AI_CONFIG.SCHEMA_VERSION,

      fingerprint:
        String(
          fichier.sha256 || ""
        ).slice(0, 24),

      extractionMethod:
        extraction.method,

      analysisMethod:
        analysisResult.extractionMethod ||
        (analysisResult.deterministic
          ? BP_IMPORT_DETERMINISTIC_METHOD
          : "OPENAI_BUSINESS_PLAN_EXTRACTION"),

      deterministic:
        analysisResult.deterministic === true,

      textLength:
        texte.length,

      originalTextLength:
        originalTextLength,

      truncated:
        texteTronque,

      wordCount:
        wordCount,

      analyzedAt:
        new Date().toISOString()
    };

    if (
      typeof AG24_IMPORT_CONTEXT_create_ !==
      "function"
    ) {
      throw new Error(
        "IMPORT_CONTEXT_ENGINE_UNAVAILABLE"
      );
    }

    var importContextId =
      AG24_IMPORT_CONTEXT_create_(
        analysisResult,
        importMeta,
        {
          fileName:fichier.fileName,
          mimeType:fichier.mimeType
        }
      );

    AG24_AUDIT_event_(
      "BUSINESS_PLAN_IMPORT_COMPLETED",
      {
        fingerprint:
          importMeta.fingerprint,

        extractionMethod:
          extraction.method,

        analysisMethod:
          analysisResult.extractionMethod ||
          (analysisResult.deterministic
            ? BP_IMPORT_DETERMINISTIC_METHOD
            : "OPENAI_BUSINESS_PLAN_EXTRACTION"),

        wordCount:
          wordCount,

        truncated:
          texteTronque,

        found:
          analysisResult.analysis
            ? analysisResult.analysis.found
            : 0,

        toConfirm:
          analysisResult.analysis
            ? analysisResult.analysis.toConfirm
            : 0,

        missing:
          analysisResult.analysis
            ? analysisResult.analysis.missing
            : 0
      }
    );

    return {
      success: true,

      fileName:
        fichier.fileName,

      mimeType:
        fichier.mimeType,

      size:
        fichier.size,

      extractionMethod:
        extraction.method,

      analysisMethod:
        analysisResult.extractionMethod ||
        (analysisResult.deterministic
          ? BP_IMPORT_DETERMINISTIC_METHOD
          : "OPENAI_BUSINESS_PLAN_EXTRACTION"),

      textLength:
        texte.length,

      preview:
        creerApercuTexteBusinessPlan_(
          texte,
          BP_IMPORT_AI_CONFIG.PREVIEW_CHARS
        ),

      importMeta:
        importMeta,

      importContextId:
        importContextId,

      analysisResult:
        analysisResult
    };

  } catch (error) {

    console.error(
      "recevoirFichierBusinessPlan:",
      error
    );

    return {
      success: false,

      message:
        error &&
        error.message
          ? error.message
          : "Erreur pendant l’analyse du dossier."
    };

  } finally {

    nettoyerFichiersTemporairesBusinessPlan_(
      fichiersTemporaires
    );
  }
}


/**
 * Extraction structurée : replay déterministe pour nos rapports, puis OpenAI
 * pour les documents externes ou les formats narratifs.
 *
 * L'adapter AG24_OPENAI_extractBusinessPlan_ effectue un seul appel
 * Responses API et renvoie uniquement les champs demandés.
 */
function analyserBusinessPlanAvecOpenAI_(
  texteSource
) {

  var labelled =
    extraireChampsEtiquetesBusinessPlan_(
      texteSource
    );

  var deterministic =
    extraireRapportBusinessPlanDeterministe_(
      texteSource
    );

  /*
   * Les faits structurés explicitement étiquetés sont toujours prioritaires.
   * Le replay AfriGreen24 et le parseur générique peuvent se compléter.
   */
  var deterministicFields =
    Object.assign(
      {},
      labelled && labelled.fields
        ? labelled.fields
        : {},
      deterministic && deterministic.fields
        ? deterministic.fields
        : {}
    );

  if (deterministic.detected) {
    return normaliserResultatOpenAIBusinessPlan_(
      {
        fields: deterministicFields,
        model: "deterministic-business-plan-report",
        deterministic: true,
        extractionMethod:
          BP_IMPORT_DETERMINISTIC_METHOD
      },
      texteSource
    );
  }

  var missingFields =
    BP_IMPORT_EXTRACTION_FIELDS.filter(
      function(field) {
        return !deterministicFields[field];
      }
    );

  /*
   * Si toutes les données attendues sont déjà structurées dans la source,
   * aucun appel IA n'est nécessaire.
   */
  if (!missingFields.length) {
    return normaliserResultatOpenAIBusinessPlan_(
      {
        fields:deterministicFields,
        model:"deterministic-labelled-source",
        deterministic:true,
        extractionMethod:
          BP_IMPORT_LABELLED_SOURCE_METHOD
      },
      texteSource
    );
  }

  if (
    typeof AG24_OPENAI_extractBusinessPlan_ !==
    "function"
  ) {
    throw new Error(
      "Le bridge OpenAI n’est pas disponible dans ce projet Apps Script."
    );
  }

  /*
   * L'IA ne reçoit que les champs encore réellement manquants.
   * Cela réduit la taille du schéma et évite de perdre des faits financiers
   * déjà lus de manière déterministe.
   */
  var result =
    AG24_OPENAI_extractBusinessPlan_(
      texteSource,
      missingFields,
      BP_IMPORT_FIELD_GUIDE
    );

  if (
    !result ||
    !result.content ||
    typeof result.content !== "object"
  ) {
    throw new Error(
      "OpenAI n’a pas retourné une extraction Business Plan exploitable."
    );
  }

  var aiFields =
    result.content.fields &&
    typeof result.content.fields === "object"
      ? result.content.fields
      : {};

  var content =
    Object.assign(
      {},
      result.content,
      {
        fields:
          Object.assign(
            {},
            aiFields,
            deterministicFields
          ),
        model:
          String(
            result.model || ""
          ),
        deterministic:false,
        extractionMethod:
          labelled.detected
            ? "HYBRID_LABELLED_SOURCE_PLUS_OPENAI"
            : "OPENAI_BUSINESS_PLAN_EXTRACTION"
      }
    );

  return normaliserResultatOpenAIBusinessPlan_(
    content,
    texteSource
  );
}


/**
 * Contrôle local.
 * OpenAI analyse, Apps Script décide du statut final.
 */
function normaliserResultatOpenAIBusinessPlan_(
  content,
  texteSource
) {

  var sourceFields =
    content.fields &&
    typeof content.fields === "object"
      ? content.fields
      : {};

  var fields = {};

  BP_IMPORT_EXTRACTION_FIELDS.forEach(
    function(field) {

      var item =
        sourceFields[field] &&
        typeof sourceFields[field] === "object"
          ? sourceFields[field]
          : {};

      fields[field] =
        construireChampBusinessPlanVerifie_(
          field,
          item,
          texteSource
        );
    }
  );

  var analysis =
    analyserCompletudeBusinessPlan_(
      fields
    );

  var quality =
    evaluerQualiteImportBusinessPlan_(
      fields,
      analysis
    );

  return {
    schemaVersion:
      BP_IMPORT_AI_CONFIG.SCHEMA_VERSION,

    model:
      String(
        content.model || ""
      ),

    deterministic:
      content.deterministic === true,

    extractionMethod:
      String(
        content.extractionMethod || ""
      ),

    fields:
      fields,

    analysis:
      analysis,

    quality:
      quality
  };
}


function BP_IMPORT_fieldMaxChars_(
  field
) {
  if (
    field === "email"
  ) {
    return BP_IMPORT_AI_CONFIG
      .MAX_EXTRACTED_EMAIL_CHARS;
  }

  if (
    [
      "projectName",
      "promoterName",
      "country",
      "stage",
      "sector",
      "fundingType",
      "fundingNeed"
    ].indexOf(
      String(field || "")
    ) !== -1
  ) {
    return BP_IMPORT_AI_CONFIG
      .MAX_EXTRACTED_SHORT_FIELD_CHARS;
  }

  return BP_IMPORT_AI_CONFIG
    .MAX_EXTRACTED_LONG_FIELD_CHARS;
}


function BP_IMPORT_boundText_(
  value,
  maximum
) {
  var text =
    nettoyerValeurImportBP_(
      value
    );

  var limit =
    Math.max(
      1,
      Number(maximum || 1)
    );

  if (
    text.length <= limit
  ) {
    return {
      value:
        text,
      bounded:
        false,
      originalChars:
        text.length,
      retainedChars:
        text.length
    };
  }

  var candidate =
    text.slice(
      0,
      limit
    );

  var breakAt =
    Math.max(
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf("; "),
      candidate.lastIndexOf(", "),
      candidate.lastIndexOf(" ")
    );

  if (
    breakAt >
    Math.floor(
      limit * 0.72
    )
  ) {
    candidate =
      candidate.slice(
        0,
        breakAt + 1
      );
  }

  candidate =
    candidate.trim();

  return {
    value:
      candidate,
    bounded:
      true,
    originalChars:
      text.length,
    retainedChars:
      candidate.length
  };
}


function BP_IMPORT_financeScalarDeterministicallyValid_(
  field,
  value,
  evidence
) {
  var id = String(field || "");
  var raw = nettoyerValeurImportBP_(value);
  var proof = nettoyerValeurImportBP_(evidence);

  if (
    !raw ||
    !proof ||
    BP_IMPORT_FINANCE_FIELDS.indexOf(id) === -1 ||
    /Json$/.test(id)
  ) {
    return false;
  }

  if (
    id === "dateBesoinFonds" ||
    id === "dateDebutRemboursementSouhaitee"
  ) {
    return false;
  }

  if (id === "devise") {
    var currency = raw.toUpperCase();
    return (
      [
        "XOF","XAF","EUR","USD","GBP",
        "GNF","CDF","MAD","DZD","TND"
      ].indexOf(currency) !== -1 &&
      proof.toUpperCase().indexOf(currency) !== -1
    );
  }

  if (id === "saisonnalite") {
    return (
      /^(oui|non)$/i.test(raw) &&
      proof.toLowerCase().indexOf(
        raw.toLowerCase()
      ) !== -1
    );
  }

  if (id === "statutAutorisations") {
    return (
      [
        "Non applicable",
        "Déjà obtenues",
        "En cours d’obtention",
        "À obtenir avant le démarrage"
      ].indexOf(raw) !== -1 &&
      proof.toLowerCase().indexOf(
        raw.toLowerCase()
      ) !== -1
    );
  }

  var qualitativeFields = [
    "justificationHypothesesVentes",
    "justificationCroissance",
    "detailsSaisonnalite",
    "detailsAutresCharges",
    "detailsTraction",
    "responsableOperations",
    "responsableFinances",
    "uniteCapacite",
    "detailsAutorisations",
    "sourceRemboursement",
    "detailsGaranties"
  ];

  if (qualitativeFields.indexOf(id) !== -1) {
    return false;
  }

  function numbers(text) {
    var normalized =
      String(text || "")
        .replace(/\u00a0/g," ")
        .replace(/\s+/g,"")
        .replace(/,/g,".");

    var matches =
      normalized.match(
        /-?\d+(?:\.\d+)?/g
      ) || [];

    return matches
      .map(function(item) {
        return Number(item);
      })
      .filter(function(item) {
        return Number.isFinite(item);
      });
  }

  var valueNumbers = numbers(raw);
  var proofNumbers = numbers(proof);

  if (valueNumbers.length !== 1) {
    return false;
  }

  var expected = valueNumbers[0];

  return proofNumbers.some(
    function(item) {
      return Math.abs(
        item - expected
      ) < 0.000001;
    }
  );
}


function construireChampBusinessPlanVerifie_(
  field,
  item,
  texteSource
) {
  var boundedValue =
    BP_IMPORT_boundText_(
      item.value,
      BP_IMPORT_fieldMaxChars_(
        field
      )
    );

  var value =
    normaliserValeurCanoniqueImportBP_(
      field,
      boundedValue.value
    );

  var boundedEvidence =
    BP_IMPORT_boundText_(
      item.evidence,
      BP_IMPORT_AI_CONFIG
        .MAX_EVIDENCE_CHARS
    );

  var evidence =
    boundedEvidence.value;

  var confidence =
    Number(
      item.confidence
    );

  if (!isFinite(confidence)) {
    confidence = 0;
  }

  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  if (
    boundedValue.bounded &&
    typeof AG24_AUDIT_event_ ===
      "function"
  ) {
    AG24_AUDIT_event_(
      "BUSINESS_PLAN_IMPORT_FIELD_BOUNDED",
      {
        field:
          String(
            field || ""
          ),
        originalChars:
          boundedValue
            .originalChars,
        retainedChars:
          boundedValue
            .retainedChars
      }
    );
  }

  if (!value) {
    return {
      value: "",
      status:
        BP_IMPORT_STATUS.MISSING,
      confidence: 0,
      evidence: "",
      evidenceVerified: false,
      valueTruncated:
        boundedValue.bounded
    };
  }

  var deterministicStructuredExtraction =
    item.deterministic === true &&
    [
      BP_IMPORT_DETERMINISTIC_METHOD,
      BP_IMPORT_LABELLED_SOURCE_METHOD
    ].indexOf(
      item.extractionMethod
    ) !== -1;

  var evidenceVerified =
    deterministicStructuredExtraction && evidence
      ? true
      : verifierPreuveBusinessPlan_(
          evidence,
          texteSource
        );

  /*
   * A bounded extraction can never be silently accepted as FOUND: the user
   * must confirm the retained structured value.
   */
  var deterministicFinanceFact =
    BP_IMPORT_financeScalarDeterministicallyValid_(
      field,
      value,
      evidence
    );

  var status =
    !boundedValue.bounded &&
    evidenceVerified &&
    (
      confidence >=
        BP_IMPORT_AI_CONFIG.FOUND_CONFIDENCE ||
      deterministicFinanceFact
    )
      ? BP_IMPORT_STATUS.FOUND
      : BP_IMPORT_STATUS.TO_CONFIRM;

  return {
    value:
      value,

    status:
      status,

    confidence:
      Number(
        confidence.toFixed(2)
      ),

    evidence:
      evidence,

    evidenceVerified:
      evidenceVerified,

    extractionMethod:
      item.extractionMethod || "",

    deterministic:
      deterministicStructuredExtraction,

    provenance:
      deterministicStructuredExtraction
        ? item.provenance || {
            extractionMethod:
              BP_IMPORT_DETERMINISTIC_METHOD,
            deterministic:
              true
          }
        : null,

    valueTruncated:
      boundedValue.bounded,

    originalValueChars:
      boundedValue.originalChars
  };
}


function analyserCompletudeBusinessPlan_(
  fields
) {

  var foundFields = [];
  var toConfirmFields = [];
  var missingFields = [];

  BP_IMPORT_FIELDS.forEach(
    function(field) {

      var info =
        fields[field] || {};

      if (
        info.status ===
        BP_IMPORT_STATUS.FOUND
      ) {
        foundFields.push(field);

      } else if (
        info.status ===
        BP_IMPORT_STATUS.TO_CONFIRM
      ) {
        toConfirmFields.push(field);

      } else {
        missingFields.push(field);
      }
    }
  );

  /*
   * La complétude validée compte uniquement FOUND.
   * TO_CONFIRM n'est pas encore validé.
   */
  var completeness =
    Math.round(
      (
        foundFields.length /
        BP_IMPORT_FIELDS.length
      ) * 100
    );

  return {
    total:
      BP_IMPORT_FIELDS.length,

    found:
      foundFields.length,

    toConfirm:
      toConfirmFields.length,

    missing:
      missingFields.length,

    completeness:
      completeness,

    foundFields:
      foundFields,

    toConfirmFields:
      toConfirmFields,

    missingFields:
      missingFields
  };
}


function evaluerQualiteImportBusinessPlan_(
  fields,
  analysis
) {
  var confidences = [];
  var verifiedEvidence = 0;
  var proposedValues = 0;

  BP_IMPORT_FIELDS.forEach(
    function(field) {
      var info =
        fields[field] || {};

      if (
        String(
          info.value || ""
        ).trim()
      ) {
        proposedValues++;
      }

      if (
        Number.isFinite(
          Number(
            info.confidence
          )
        ) &&
        Number(
          info.confidence
        ) > 0
      ) {
        confidences.push(
          Number(
            info.confidence
          )
        );
      }

      if (
        info.evidenceVerified ===
        true
      ) {
        verifiedEvidence++;
      }
    }
  );

  var averageConfidence =
    confidences.length
      ? confidences.reduce(
          function(total, value) {
            return total + value;
          },
          0
        ) / confidences.length
      : 0;

  var evidenceCoverage =
    proposedValues > 0
      ? verifiedEvidence /
        proposedValues
      : 0;

  var validatedCoverage =
    analysis &&
    analysis.total
      ? Number(
          analysis.found || 0
        ) /
        Number(
          analysis.total
        )
      : 0;

  var reliability =
    (
      averageConfidence * 0.45 +
      evidenceCoverage * 0.35 +
      validatedCoverage * 0.20
    ) * 100;

  return {
    averageConfidence:
      Number(
        averageConfidence.toFixed(2)
      ),

    verifiedEvidence:
      verifiedEvidence,

    proposedValues:
      proposedValues,

    evidenceCoveragePct:
      Math.round(
        evidenceCoverage * 100
      ),

    reliabilityPct:
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            reliability
          )
        )
      )
  };
}


/**
 * Vérifie que l'extrait retourné par OpenAI
 * existe vraiment dans le texte source.
 */
function verifierPreuveBusinessPlan_(
  evidence,
  source
) {

  var preuve =
    normaliserTexteVerificationBP_(
      evidence
    );

  var texte =
    normaliserTexteVerificationBP_(
      source
    );

  if (
    !preuve ||
    preuve.length < 8 ||
    !texte
  ) {
    return false;
  }

  return (
    texte.indexOf(
      preuve
    ) !== -1
  );
}


function normaliserTexteVerificationBP_(
  valeur
) {

  var texte =
    String(
      valeur || ""
    )
      .toLowerCase();

  try {
    texte =
      texte
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );
  } catch (error) {
    // Le contrôle continue sans suppression d'accents.
  }

  return texte
    .replace(
      /[“”«»"'`´]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}




/**
 * Normalise seulement les valeurs de listes attendues par le formulaire.
 * La preuve OpenAI reste inchangée.
 */
function normaliserValeurCanoniqueImportBP_(field, value) {
  var texte = nettoyerValeurImportBP_(value);
  if (!texte) return "";

  var normalise = String(texte).toLowerCase();
  try {
    normalise = normalise.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (error) {}

  if (field === "stage") {
    if (normalise.indexOf("prepare") !== -1 && normalise.indexOf("lancement") !== -1) return "Je prépare le lancement";
    if (normalise.indexOf("prototype") !== -1) return "J’ai déjà un prototype";
    if (
      (
        normalise.indexOf("commence") !== -1 &&
        normalise.indexOf("vend") !== -1
      ) ||
      normalise.indexOf("premier revenu") !== -1 ||
      normalise.indexOf("premiers revenus") !== -1 ||
      normalise.indexOf("revenus") !== -1 ||
      normalise.indexOf("pilote") !== -1
    ) {
      return "J’ai commencé à vendre";
    }
    if (normalise.indexOf("croissance") !== -1) return "Mon activité est déjà en croissance";
    if (normalise.indexOf("idee") !== -1) return "J’ai seulement une idée";
  }

  if (field === "fundingType") {
    if (normalise.indexOf("subvention") !== -1) return "Subvention";
    if (
      normalise.indexOf("pret") !== -1 ||
      normalise.indexOf("banque") !== -1 ||
      normalise.indexOf("bancaire") !== -1 ||
      normalise.indexOf("credit") !== -1 ||
      normalise.indexOf("emprunt") !== -1
    ) {
      return "Prêt bancaire";
    }
    if (normalise.indexOf("invest") !== -1) return "Investissement";
    if (normalise.indexOf("parten") !== -1) return "Partenariat";
    if (normalise.indexOf("sais pas") !== -1) return "Je ne sais pas encore";
  }

  if (field === "sector") {
    if (normalise.indexOf("agri") !== -1) return "Agriculture / Agribusiness";
    if (normalise.indexOf("energie renouvel") !== -1) return "Énergie renouvelable";
    if (normalise.indexOf("dechet") !== -1 || normalise.indexOf("recycl") !== -1) return "Déchets / Recyclage";
    if (normalise.indexOf("circulaire") !== -1) return "Économie circulaire";
    if (normalise.indexOf("eau") !== -1 || normalise.indexOf("assain") !== -1) return "Eau / Assainissement";
    if (normalise.indexOf("biodivers") !== -1 || normalise.indexOf("forester") !== -1) return "Biodiversité / Foresterie";
    if (normalise.indexOf("construction") !== -1) return "Construction durable";
    if (normalise.indexOf("transport") !== -1 || normalise.indexOf("mobilite") !== -1) return "Transport / Mobilité";
    if (normalise.indexOf("technolog") !== -1 || normalise.indexOf("digital") !== -1 || normalise.indexOf("numerique") !== -1) return "Technologie";
    if (normalise.indexOf("service") !== -1) return "Services";
  }

  return texte;
}


/**
 * ============================================================
 * FICHIER -> BLOB
 * ============================================================
 */
function validerEtConstruireBlobBusinessPlan_(
  payload
) {

  if (!payload) {
    throw new Error(
      "Aucun fichier n’a été reçu."
    );
  }

  var fileName =
    String(
      payload.fileName || ""
    ).trim();

  var mimeType =
    String(
      payload.mimeType || ""
    ).trim();

  var base64 =
    String(
      payload.base64 || ""
    ).trim();

  if (!fileName) {
    throw new Error(
      "Le nom du fichier est manquant."
    );
  }

  if (!base64) {
    throw new Error(
      "Le contenu du fichier est manquant."
    );
  }

  var extension =
    obtenirExtensionBusinessPlan_(
      fileName
    );

  if (
    BP_IMPORT_AI_CONFIG
      .ALLOWED_EXTENSIONS
      .indexOf(extension) === -1
  ) {
    throw new Error(
      "Format non accepté. Utilisez PDF, DOC ou DOCX."
    );
  }

  if (!mimeType) {
    mimeType =
      mimeDepuisExtensionBusinessPlan_(
        extension
      );
  }

  if (
    BP_IMPORT_AI_CONFIG
      .ALLOWED_MIME_TYPES
      .indexOf(mimeType) === -1
  ) {
    throw new Error(
      "Type de fichier non autorisé."
    );
  }

  var bytes;

  try {
    bytes =
      Utilities.base64Decode(
        base64
      );

  } catch (error) {
    throw new Error(
      "Le fichier transmis est illisible."
    );
  }

  var size =
    bytes.length;

  if (!size) {
    throw new Error(
      "Le fichier reçu est vide."
    );
  }

  if (
    size >
    BP_IMPORT_AI_CONFIG.MAX_FILE_BYTES
  ) {
    throw new Error(
      "Le fichier dépasse la limite de 15 Mo."
    );
  }

  verifierSignatureFichierBusinessPlan_(
    bytes,
    extension
  );

  var sha256 =
    calculerEmpreinteFichierBusinessPlan_(
      bytes
    );

  return {
    fileName:
      fileName,

    mimeType:
      mimeType,

    size:
      size,

    extension:
      extension,

    sha256:
      sha256,

    blob:
      Utilities.newBlob(
        bytes,
        mimeType,
        fileName
      )
  };
}


function verifierSignatureFichierBusinessPlan_(
  bytes,
  extension
) {
  var ext =
    String(
      extension || ""
    ).toLowerCase();

  var isPdf =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x25, 0x50, 0x44, 0x46, 0x2D]
    );

  var isDoc =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    );

  var isZip =
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x03, 0x04]
    ) ||
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x05, 0x06]
    ) ||
    bytesCommencentParBusinessPlan_(
      bytes,
      [0x50, 0x4B, 0x07, 0x08]
    );

  var valide =
    ext === "pdf"
      ? isPdf
      : ext === "doc"
        ? isDoc
        : ext === "docx"
          ? isZip
          : false;

  if (!valide) {
    throw new Error(
      "Le contenu réel du fichier ne correspond pas au format annoncé. Exportez à nouveau le document en PDF ou Word puis réessayez."
    );
  }
}


function bytesCommencentParBusinessPlan_(
  bytes,
  signature
) {
  if (
    !bytes ||
    bytes.length <
      signature.length
  ) {
    return false;
  }

  for (
    var index = 0;
    index <
      signature.length;
    index++
  ) {
    var actual =
      Number(
        bytes[index]
      );

    if (actual < 0) {
      actual += 256;
    }

    if (
      actual !==
      signature[index]
    ) {
      return false;
    }
  }

  return true;
}


function calculerEmpreinteFichierBusinessPlan_(
  bytes
) {
  var digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      bytes
    );

  return digest.map(
    function(value) {
      var n =
        value < 0
          ? value + 256
          : value;

      return (
        "0" +
        n.toString(16)
      ).slice(-2);
    }
  ).join("");
}


function compterMotsBusinessPlan_(
  texte
) {
  var propre =
    String(
      texte || ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return propre
    ? propre.split(" ").length
    : 0;
}


/**
 * ============================================================
 * PDF / WORD -> TEXTE
 * ============================================================
 */
function extraireTexteBusinessPlan_(
  blob,
  fileName,
  mimeType,
  fichiersTemporaires
) {

  if (
    typeof Drive === "undefined" ||
    !Drive.Files
  ) {
    throw new Error(
      "Drive API n’est pas activé dans Apps Script."
    );
  }

  var metadata = {
    name:
      "[TEMP AFRIGREEN24 BP] " +
      Date.now() +
      " - " +
      fileName,

    mimeType:
      "application/vnd.google-apps.document"
  };

  var options = {
    fields:
      "id,name,mimeType"
  };

  /*
   * Drive API v3 :
   * - pas de paramètre "convert"
   * - pas de paramètre "ocr"
   * - la conversion est demandée via le mimeType Google Docs
   * - ocrLanguage peut être fourni pour les PDF
   */
  if (
    mimeType ===
    "application/pdf"
  ) {
    options.ocrLanguage =
      "fr";
  }

  var fichierGoogle;

  try {

    fichierGoogle =
      Drive.Files.create(
        metadata,
        blob,
        options
      );

  } catch (error) {

    console.error(
      "Conversion Google Drive v3:",
      error
    );

    throw new Error(
      "Impossible de convertir le document avec Drive API v3. Vérifiez que Drive API est activé et que le fichier n’est pas protégé."
    );
  }

  if (
    !fichierGoogle ||
    !fichierGoogle.id
  ) {
    throw new Error(
      "La conversion du document n’a retourné aucun fichier."
    );
  }

  fichiersTemporaires.push(
    fichierGoogle.id
  );

  Utilities.sleep(700);

  var texte = "";

  try {

    texte =
      DocumentApp
        .openById(
          fichierGoogle.id
        )
        .getBody()
        .getText();

  } catch (error) {

    Utilities.sleep(900);

    try {
      texte =
        DocumentApp
          .openById(
            fichierGoogle.id
          )
          .getBody()
          .getText();

    } catch (secondError) {
      throw new Error(
        "Le document a été converti mais son texte n’a pas pu être lu."
      );
    }
  }

  return {
    text:
      texte || "",

    method:
      mimeType === "application/pdf"
        ? "GOOGLE_DRIVE_PDF_OCR"
        : "GOOGLE_DRIVE_WORD_CONVERSION"
  };
}


/**
 * ============================================================
 * OUTILS
 * ============================================================
 */
function nettoyerTexteBusinessPlan_(
  texte
) {
  return String(
    texte || ""
  )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}


function nettoyerValeurImportBP_(
  valeur
) {
  if (
    valeur === undefined ||
    valeur === null
  ) {
    return "";
  }

  return String(valeur)
    .replace(/\s+/g, " ")
    .trim();
}


function creerApercuTexteBusinessPlan_(
  texte,
  max
) {
  texte =
    String(
      texte || ""
    );

  max =
    Number(
      max || 1000
    );

  return texte.length <= max
    ? texte
    : texte.substring(0, max) + "…";
}


function nettoyerFichiersTemporairesBusinessPlan_(
  ids
) {
  (ids || []).forEach(
    function(id) {
      try {
        if (
          typeof Drive !== "undefined" &&
          Drive.Files &&
          typeof Drive.Files.remove === "function"
        ) {
          Drive.Files.remove(id);
          return;
        }

        DriveApp
          .getFileById(id)
          .setTrashed(true);
      } catch (error) {
        console.warn(
          "Nettoyage fichier temporaire impossible :",
          id
        );
      }
    }
  );
}


function obtenirExtensionBusinessPlan_(
  fileName
) {
  var nom =
    String(
      fileName || ""
    )
      .toLowerCase()
      .trim();

  var position =
    nom.lastIndexOf(".");

  return (
    position >= 0 &&
    position < nom.length - 1
  )
    ? nom.substring(position + 1)
    : "";
}


function mimeDepuisExtensionBusinessPlan_(
  extension
) {
  switch (
    String(
      extension || ""
    ).toLowerCase()
  ) {

    case "pdf":
      return "application/pdf";

    case "doc":
      return "application/msword";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    default:
      return "";
  }
}


/**
 * Test direct du nouvel endpoint OpenAI.
 */
function testerExtractionBusinessPlanOpenAI_() {

  var texteTest = [
    "BUSINESS PLAN",
    "Nom du projet : GreenStep Shoes",
    "Porteur du projet : Awa Test",
    "Pays : Cameroun",
    "Le projet prépare actuellement son lancement.",
    "Problème : les jeunes ont des difficultés à trouver des chaussures accessibles.",
    "Solution : vente de chaussures via un site web et WhatsApp.",
    "Clients : jeunes actifs et étudiants.",
    "Canaux : site web, Instagram et WhatsApp.",
    "Financement recherché : 10 000 000 XAF.",
    "Durée de remboursement souhaitée : 48 mois.",
    "Taux d’intérêt annuel : 9%.",
    "Apport du promoteur : 2 000 000 XAF.",
    "Utilisation des fonds : stock, site web et marketing."
  ].join("\n");

  var resultat =
    analyserBusinessPlanAvecOpenAI_(
      texteTest
    );

  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}
function TEST_BP_STAGE_FUNDING_MAPPING_LOCAL_() {

  var tests = [
    {
      field: "stage",
      input: "Le projet prépare actuellement son lancement.",
      expected: "Je prépare le lancement"
    },
    {
      field: "stage",
      input: "Premiers revenus",
      expected: "J’ai commencé à vendre"
    },
    {
      field: "stage",
      input: "Le projet a commencé à vendre",
      expected: "J’ai commencé à vendre"
    },
    {
      field: "stage",
      input: "Prototype disponible",
      expected: "J’ai déjà un prototype"
    },

    {
      field: "fundingType",
      input: "Prêt bancaire",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Banque commerciale",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Financement bancaire",
      expected: "Prêt bancaire"
    },
    {
      field: "fundingType",
      input: "Subvention",
      expected: "Subvention"
    }
  ];

  var results = [];

  tests.forEach(function(test) {

    var output =
      normaliserValeurCanoniqueImportBP_(
        test.field,
        test.input
      );

    results.push({
      field: test.field,
      input: test.input,
      output: output,
      expected: test.expected,
      ok: output === test.expected
    });
  });

  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );

  var erreurs =
    results.filter(function(item) {
      return !item.ok;
    });

  Logger.log(
    "================================"
  );

  Logger.log(
    "TESTS : " + results.length
  );

  Logger.log(
    "OK : " +
    (results.length - erreurs.length)
  );

  Logger.log(
    "ERREURS : " + erreurs.length
  );

  return {
    success: erreurs.length === 0,
    total: results.length,
    passed:
      results.length - erreurs.length,
    failed: erreurs.length,
    results: results
  };
}


/**
 * Régression locale du replay déterministe d'un Business Plan généré.
 * Ce test ne fait aucun appel réseau et vérifie aussi que le fallback IA
 * n'est pas sollicité lorsque la structure propriétaire est reconnue.
 */
function TEST_BP_STRUCTURED_REPORT_DETERMINISTIC_IMPORT_LOCAL_() {
  var source = [
    "BUSINESS PLAN",
    "Nom du projet", "SolarFresh Cameroun",
    "Porteur du projet", "Awa Test",
    "Pays ou zone", "Cameroun",
    "Secteur d’activité", "Énergie renouvelable",
    "Sommaire",
    "03 Problème et opportunité",
    "04 Solution proposée",
    "12 Conclusion",
    "1. Résumé exécutif",
    "Le projet propose une solution solaire utile.",
    "2. Présentation du projet",
    "3. Problème et opportunité",
    "Les clients ruraux ont un accès limité à l’énergie.",
    "Population concernée", "Ménages et PME rurales",
    "4. Solution proposée",
    "Une offre solaire fiable et accessible.",
    "Proposition de valeur", "Énergie propre à coût maîtrisé",
    "5. Analyse du marché",
    "Clientèle cible", "Ménages et PME rurales",
    "Concurrence et alternatives", "Groupes électrogènes",
    "6. Modèle économique",
    "Sources de revenus", "Vente et location de kits solaires",
    "Politique tarifaire", "Tarifs mensuels accessibles",
    "Principaux coûts", "Équipements et installation",
    "7. Stratégie commerciale et marketing",
    "Canaux déclarés", "Partenaires locaux et digital",
    "8. Équipe et organisation opérationnelle",
    "Équipe déclarée", "Équipe fondatrice et techniciens",
    "9. Besoin de financement",
    "Type de financement", "Prêt bancaire",
    "Montant recherché", "45 000 000 XAF",
    "Utilisation prévue", "Stock, équipements et marketing",
    "10. Impact économique, social et environnemental",
    "Impact déclaré", "Réduction du diesel et création d’emplois",
    "11. Risques identifiés",
    "Risque déclaré", "Retards d’approvisionnement",
    "12. Conclusion", "Le projet est structuré.",
    "Document préparé à partir des informations fournies par le porteur du projet."
  ].join("\n");

  var extraction =
    extraireRapportBusinessPlanDeterministe_(source);

  if (!extraction.detected || extraction.fieldCount < 18) {
    throw new Error(
      "Replay déterministe incomplet : " +
      JSON.stringify(extraction)
    );
  }

  var previousBridge =
    typeof AG24_OPENAI_extractBusinessPlan_ === "function"
      ? AG24_OPENAI_extractBusinessPlan_
      : null;

  var previousBridgeWasOwn =
    Object.prototype.hasOwnProperty.call(
      this,
      "AG24_OPENAI_extractBusinessPlan_"
    );

  try {
    AG24_OPENAI_extractBusinessPlan_ = function() {
      throw new Error("OPENAI_SHOULD_NOT_BE_CALLED");
    };

    var result =
      analyserBusinessPlanAvecOpenAI_(source);

    if (
      result.model !==
        "deterministic-business-plan-report" ||
      !result.fields.projectName.deterministic ||
      result.fields.projectName.status !==
        BP_IMPORT_STATUS.FOUND ||
      result.analysis.found < 18
    ) {
      throw new Error(
        "Résultat déterministe invalide : " +
        JSON.stringify(result.analysis)
      );
    }

    return {
      success: true,
      detected: extraction.detected,
      fieldCount: extraction.fieldCount,
      found: result.analysis.found,
      missing: result.analysis.missing,
      model: result.model
    };
  } finally {
    if (previousBridgeWasOwn) {
      AG24_OPENAI_extractBusinessPlan_ = previousBridge;
    } else {
      try {
        delete AG24_OPENAI_extractBusinessPlan_;
      } catch (error) {
        AG24_OPENAI_extractBusinessPlan_ = previousBridge;
      }
    }
  }
}

function AG24_BP_IMPORT_FIELD_LIMIT_SYSTEM_TEST_V1() {
  var huge =
    Array(60001).join(
      "X"
    );

  var source =
    "Problème : " +
    huge;

  var field =
    construireChampBusinessPlanVerifie_(
      "problem",
      {
        value:
          huge,
        evidence:
          "Problème : " +
          huge.slice(
            0,
            100
          ),
        confidence:
          0.99
      },
      source
    );

  var email =
    construireChampBusinessPlanVerifie_(
      "email",
      {
        value:
          huge,
        evidence:
          huge.slice(
            0,
            50
          ),
        confidence:
          0.99
      },
      source
    );

  var report = {
    success: false,
    version:
      BP_IMPORT_AI_CONFIG.VERSION,
    problemChars:
      String(
        field.value || ""
      ).length,
    problemStatus:
      field.status,
    problemTruncated:
      field.valueTruncated ===
      true,
    emailChars:
      String(
        email.value || ""
      ).length,
    emailTruncated:
      email.valueTruncated ===
      true
  };

  report.success =
    report.problemChars <=
      BP_IMPORT_AI_CONFIG
        .MAX_EXTRACTED_LONG_FIELD_CHARS &&
    report.problemStatus ===
      BP_IMPORT_STATUS.TO_CONFIRM &&
    report.problemTruncated ===
      true &&
    report.emailChars <=
      BP_IMPORT_AI_CONFIG
        .MAX_EXTRACTED_EMAIL_CHARS &&
    report.emailTruncated ===
      true;

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}


function AG24_BP_IMPORT_LABELLED_FINANCE_SYSTEM_TEST_V1() {
  var source = [
    "6. Besoin de financement",
    "Devise",
    "XAF",
    "Montant total des",
    "investissements",
    "50 000 000 XAF",
    "Montant du stock initial",
    "2 000 000 XAF",
    "Besoin en fonds de roulement",
    "estimé",
    "5 000 000 XAF",
    "Trésorerie de sécurité",
    "souhaitée",
    "3 000 000 XAF",
    "Apport du promoteur et des",
    "associés",
    "15 000 000 XAF",
    "Autres financements déjà",
    "prévus",
    "0 XAF - aucun autre financement",
    "Montant demandé à la banque",
    "45 000 000 XAF",
    "Durée de remboursement",
    "souhaitée",
    "60 mois",
    "Différé souhaité",
    "6 mois",
    "Taux d'intérêt annuel estimatif",
    "9,5 %"
  ].join("\n");

  var labelled =
    extraireChampsEtiquetesBusinessPlan_(
      source
    );

  var normalized =
    normaliserResultatOpenAIBusinessPlan_(
      {
        fields:labelled.fields,
        model:"system-test",
        deterministic:true,
        extractionMethod:
          BP_IMPORT_LABELLED_SOURCE_METHOD
      },
      source
    );

  var fields = normalized.fields || {};

  var report = {
    success:
      fields.devise.value === "XAF" &&
      fields.devise.status === "FOUND" &&
      fields.montantInvestissements.status === "FOUND" &&
      fields.montantStockInitial.status === "FOUND" &&
      fields.besoinFondsRoulementDeclare.status === "FOUND" &&
      fields.tresorerieSecurite.status === "FOUND" &&
      fields.apportPromoteur.status === "FOUND" &&
      fields.autresFinancements.status === "FOUND" &&
      fields.montantDemande.status === "FOUND" &&
      fields.dureeRemboursementMois.status === "FOUND" &&
      fields.differeMois.status === "FOUND" &&
      fields.tauxInteretAnnuel.status === "FOUND",
    version:
      BP_IMPORT_AI_CONFIG.VERSION,
    detectedCount:
      labelled.fieldCount,
    extractedFields:
      labelled.extractedFields,
    values:{
      devise:fields.devise.value,
      investissements:fields.montantInvestissements.value,
      stock:fields.montantStockInitial.value,
      bfr:fields.besoinFondsRoulementDeclare.value,
      tresorerie:fields.tresorerieSecurite.value,
      apport:fields.apportPromoteur.value,
      autres:fields.autresFinancements.value,
      montant:fields.montantDemande.value,
      duree:fields.dureeRemboursementMois.value,
      differe:fields.differeMois.value,
      taux:fields.tauxInteretAnnuel.value
    }
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


function AG24_BP_IMPORT_FINANCE_EVIDENCE_SYSTEM_TEST_V1() {
  var source =
    "Montant demandé à la banque : 45 000 000 XAF. " +
    "Durée de remboursement souhaitée : 60 mois.";

  var exactAmount =
    construireChampBusinessPlanVerifie_(
      "montantDemande",
      {
        value:"45000000",
        evidence:
          "Montant demandé à la banque : 45 000 000 XAF.",
        confidence:0.35
      },
      source
    );

  var mismatchedAmount =
    construireChampBusinessPlanVerifie_(
      "montantDemande",
      {
        value:"46000000",
        evidence:
          "Montant demandé à la banque : 45 000 000 XAF.",
        confidence:0.35
      },
      source
    );

  var duration =
    construireChampBusinessPlanVerifie_(
      "dureeRemboursementMois",
      {
        value:"60",
        evidence:
          "Durée de remboursement souhaitée : 60 mois.",
        confidence:0.40
      },
      source
    );

  var report = {
    success:
      exactAmount.status ===
        BP_IMPORT_STATUS.FOUND &&
      duration.status ===
        BP_IMPORT_STATUS.FOUND &&
      mismatchedAmount.status ===
        BP_IMPORT_STATUS.TO_CONFIRM,
    version:
      BP_IMPORT_AI_CONFIG.VERSION,
    exactVerifiedFinanceAccepted:
      exactAmount.status ===
        BP_IMPORT_STATUS.FOUND,
    exactDurationAccepted:
      duration.status ===
        BP_IMPORT_STATUS.FOUND,
    mismatchedValueRejected:
      mismatchedAmount.status ===
        BP_IMPORT_STATUS.TO_CONFIRM
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
