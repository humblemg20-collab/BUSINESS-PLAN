/**
 * AfriGreen24 — Extension Business Plan Bancable
 * Version 1.2.0
 *
 * Objectifs :
 * 1. Réutiliser les réponses du Business Plan Standard.
 * 2. Poser uniquement les questions Bancables encore manquantes.
 * 3. Construire un dossier de données unifié.
 * 4. Exécuter un premier audit financier et de cohérence.
 *
 * Ce module est autonome et ne modifie pas le moteur Standard.
 */

const BusinessPlanBancable = (() => {
  'use strict';

  const VERSION = '1.2.0';
  const DEVISE_PAR_DEFAUT = 'XOF';
  const TOLERANCE_EQUILIBRE = 1;

  /**
   * Les chemins Standard sont des alias à adapter une seule fois aux IDs
   * exacts déjà utilisés dans le questionnaire Standard.
   */
  const STANDARD_FIELD_ALIASES = {
    nomProjet: ['nomProjet', 'projet.nom', 'projectName'],
    pays: ['pays', 'country', 'projectCountry'],
    secteur: ['secteur', 'sector', 'activitySector'],
    stade: ['stade', 'stage', 'projectStage'],
    nomPromoteur: ['nomPromoteur', 'promoteur.nomComplet', 'fullName'],
    fonctionPromoteur: ['fonctionPromoteur', 'promoteur.fonction', 'rolePromoteur'],
    experiencePromoteur: ['experiencePromoteur', 'promoteur.experience', 'experience'],
    competencesPromoteur: ['competencesPromoteur', 'promoteur.competences', 'skills'],
    descriptionProjet: ['descriptionProjet', 'projet.description', 'projectDescription'],
    problemeResolu: ['problemeResolu', 'projet.probleme', 'problemSolved'],
    solution: ['solution', 'projet.solution', 'offre.description'],
    clientsCibles: ['clientsCibles', 'marche.clientsCibles', 'targetCustomers'],
    tailleMarche: ['tailleMarche', 'marche.taille', 'marketSize'],
    concurrents: ['concurrents', 'marche.concurrents', 'competitors'],
    avantageConcurrentiel: ['avantageConcurrentiel', 'marche.avantageConcurrentiel', 'competitiveAdvantage'],
    sourcesRevenus: ['sourcesRevenus', 'modeleEconomique.sourcesRevenus', 'revenueStreams'],
    strategieCommerciale: ['strategieCommerciale', 'strategie.commerciale', 'salesStrategy'],
    besoinsFinancement: ['besoinsFinancement', 'finances.besoinFinancement', 'fundingNeed'],
    chiffreAffairesPrevisionnel: ['chiffreAffairesPrevisionnel', 'finances.chiffreAffaires', 'forecastRevenue'],
    chargesPrevisionnelles: ['chargesPrevisionnelles', 'finances.charges', 'forecastExpenses']
  };

  const QUESTIONNAIRE = [
    {
      id: 'financement',
      titre: 'Besoin de financement',
      description: 'Détail du montant recherché et de son utilisation.',
      questions: [
        champ('devise', 'Devise utilisée', 'select', true, {
          options: ['XOF', 'XAF', 'EUR', 'USD', 'GBP', 'GNF', 'CDF', 'MAD', 'DZD', 'TND', 'Autre'],
          valeurParDefaut: DEVISE_PAR_DEFAUT
        }),
        champ('montantInvestissements', 'Montant total des investissements', 'number', true, { min: 0 }),
        champ('montantStockInitial', 'Montant du stock initial', 'number', false, { min: 0 }),
        champ('besoinFondsRoulementDeclare', 'Besoin en fonds de roulement estimé', 'number', true, { min: 0 }),
        champ('tresorerieSecurite', 'Trésorerie de sécurité souhaitée', 'number', false, { min: 0 }),
        champ('apportPromoteur', 'Apport total du promoteur et des associés', 'number', true, { min: 0 }),
        champ('autresFinancements', 'Autres financements déjà prévus', 'number', false, { min: 0 }),
        champ('montantDemande', 'Montant demandé à la banque', 'number', true, { min: 0 }),
        champ('utilisationFonds', 'Utilisation détaillée des fonds demandés', 'repeater', true, {
          colonnes: [
            { id: 'poste', label: 'Poste', type: 'text', required: true },
            { id: 'montant', label: 'Montant', type: 'number', required: true, min: 0 },
            { id: 'justification', label: 'Justification', type: 'textarea', required: true }
          ]
        }),
        champ('dureeRemboursementMois', 'Durée de remboursement souhaitée en mois', 'number', true, { min: 1 }),
        champ('differeMois', 'Période de différé souhaitée en mois', 'number', false, { min: 0 }),
        champ('tauxInteretAnnuel', "Taux d’intérêt annuel estimatif, si connu", 'number', false, { min: 0, max: 100 }),
        champ('dateBesoinFonds', 'Date prévue de besoin des fonds', 'date', false)
      ]
    },
    {
      id: 'ventes',
      titre: "Hypothèses de chiffre d’affaires",
      description: 'Construction du chiffre d’affaires à partir des prix et volumes.',
      questions: [
        champ('lignesVentes', 'Produits ou services vendus', 'repeater', true, {
          colonnes: [
            { id: 'nom', label: 'Produit ou service', type: 'text', required: true },
            { id: 'prixUnitaire', label: 'Prix unitaire moyen', type: 'number', required: true, min: 0 },
            { id: 'volumeMensuel', label: 'Volume mensuel prévu', type: 'number', required: true, min: 0 },
            { id: 'coutVariableUnitaire', label: 'Coût variable unitaire', type: 'number', required: true, min: 0 }
          ]
        }),
        champ('baseHypothesesVentes', 'Sur quelles preuves reposent les prix et volumes prévus ?', 'multiselect', true, {
          options: [
            'Ventes déjà réalisées',
            'Commandes ou contrats',
            'Précommandes ou lettres d’intention',
            'Enquête auprès de clients',
            'Tarifs observés chez des concurrents',
            'Capacité réelle de production ou de prestation',
            'Devis de fournisseurs',
            'Estimation personnelle uniquement'
          ]
        }),
        champ('justificationHypothesesVentes', 'Expliquez comment vous avez déterminé les prix et les volumes mensuels prévus', 'textarea', true),
        champ('croissanceAnnuellePct', 'Croissance annuelle prévue en pourcentage', 'number', false, { min: -100, max: 1000 }),
        champ('justificationCroissance', 'Justification de la croissance prévue', 'textarea', false),
        champ('saisonnalite', 'Les ventes sont-elles saisonnières ?', 'select', true, {
          options: ['Non', 'Oui']
        }),
        champ('detailsSaisonnalite', 'Décrivez les périodes fortes et faibles', 'textarea', false, {
          condition: { champ: 'saisonnalite', egal: 'Oui' }
        })
      ]
    },
    {
      id: 'charges',
      titre: 'Charges mensuelles',
      description: 'Charges nécessaires au fonctionnement normal du projet.',
      questions: [
        champ('salairesMensuels', 'Salaires et charges sociales mensuels', 'number', true, { min: 0 }),
        champ('loyersMensuels', 'Loyers mensuels', 'number', false, { min: 0 }),
        champ('marketingMensuel', 'Budget marketing et commercial mensuel', 'number', false, { min: 0 }),
        champ('energieTelecomMensuel', 'Énergie, internet et télécommunications', 'number', false, { min: 0 }),
        champ('transportLogistiqueMensuel', 'Transport et logistique mensuels', 'number', false, { min: 0 }),
        champ('administrationMensuel', 'Administration, assurance et services professionnels', 'number', false, { min: 0 }),
        champ('impotsTaxesMensuels', 'Impôts, taxes et cotisations mensuels estimés', 'number', true, { min: 0 }),
        champ('autresChargesFixesMensuelles', 'Autres charges fixes mensuelles', 'number', false, { min: 0 }),
        champ('detailsAutresCharges', 'Précisez les autres charges', 'textarea', false)
      ]
    },
    {
      id: 'bfr',
      titre: 'Cycle d’exploitation',
      description: 'Évaluation du besoin en fonds de roulement.',
      questions: [
        champ('delaiPaiementClientsJours', 'Délai moyen de paiement des clients en jours', 'number', true, { min: 0 }),
        champ('delaiPaiementFournisseursJours', 'Délai moyen de paiement des fournisseurs en jours', 'number', true, { min: 0 }),
        champ('stockMoyenJours', 'Nombre moyen de jours de stock', 'number', true, { min: 0 })
      ]
    },
    {
      id: 'traction',
      titre: 'Preuves commerciales',
      description: 'Éléments déclaratifs montrant que le marché existe.',
      questions: [
        champ('stadeProjet', 'Stade actuel du projet', 'select', true, {
          options: ['Idée', 'Prototype', 'Lancement', 'Premières ventes', 'Activité établie', 'Expansion']
        }),
        champ('nombreClientsActuels', 'Nombre approximatif de clients actuels', 'number', false, { min: 0 }),
        champ('chiffreAffairesHistorique', "Chiffre d’affaires réalisé au cours des 12 derniers mois", 'number', false, { min: 0 }),
        champ('chargesHistoriques12Mois', 'Charges totales supportées au cours des 12 derniers mois', 'number', false, { min: 0 }),
        champ('tresorerieDisponibleActuelle', 'Trésorerie actuellement disponible', 'number', true, { min: 0 }),
        champ('creancesClientsActuelles', 'Montant total des factures clients restant à encaisser', 'number', true, { min: 0 }),
        champ('dettesFinancieresExistantes', 'Capital total restant dû sur les prêts et crédits existants', 'number', true, { min: 0 }),
        champ('mensualitesDettesExistantes', 'Total des mensualités déjà payées chaque mois sur les dettes existantes', 'number', true, { min: 0 }),
        champ('preuvesDemande', 'Quelles preuves de demande possédez-vous ?', 'multiselect', false, {
          options: ['Premières ventes', 'Précommandes', "Lettres d’intention", 'Contrats', 'Partenariats commerciaux', 'Résultats de tests', 'Enquête clients', 'Aucune pour le moment']
        }),
        champ('detailsTraction', 'Décrivez brièvement les résultats déjà obtenus', 'textarea', false)
      ]
    },
    {
      id: 'execution',
      titre: "Capacité d’exécution",
      description: 'Organisation prévue pour atteindre les objectifs.',
      questions: [
        champ('responsableOperations', 'Qui supervisera les opérations ?', 'text', true),
        champ('responsableFinances', 'Qui supervisera les finances ?', 'text', true),
        champ('effectifActuel', 'Effectif actuel', 'number', false, { min: 0 }),
        champ('recrutementsPrevus', 'Recrutements prévus', 'repeater', false, {
          colonnes: [
            { id: 'poste', label: 'Poste', type: 'text', required: true },
            { id: 'nombre', label: 'Nombre', type: 'number', required: true, min: 1 },
            { id: 'datePrevue', label: 'Période prévue', type: 'text', required: false }
          ]
        }),
        champ('capaciteMaximaleMensuelle', 'Capacité maximale mensuelle de production ou de service', 'number', false, { min: 0 }),
        champ('uniteCapacite', 'Unité utilisée pour mesurer la capacité', 'text', false),
        champ('statutAutorisations', 'Quelle est la situation des autorisations, licences ou certifications nécessaires ?', 'select', true, {
          options: ['Non applicable', 'Déjà obtenues', 'En cours d’obtention', 'À obtenir avant le démarrage']
        }),
        champ('detailsAutorisations', 'Précisez les autorisations concernées et les démarches restantes', 'textarea', false)
      ]
    },
    {
      id: 'remboursement',
      titre: 'Capacité de remboursement déclarée',
      description: 'Vérification de la source de remboursement et des engagements financiers existants.',
      questions: [
        champ('sourceRemboursement', 'Quelle activité ou quelle source de trésorerie servira précisément à rembourser le financement ?', 'textarea', true),
        champ('mensualiteMaxSupportable', 'Mensualité maximale que l’entreprise estime pouvoir payer sans bloquer son activité', 'number', true, { min: 0 }),
        champ('dateDebutRemboursementSouhaitee', 'Date à partir de laquelle les remboursements pourraient commencer', 'date', true),
        champ('garantiesDisponibles', 'Quelles garanties ou sûretés pouvez-vous déclarer ?', 'multiselect', false, {
          options: ['Aucune garantie disponible', 'Équipement ou matériel', 'Bien immobilier', 'Dépôt ou épargne', 'Caution personnelle ou institutionnelle', 'Garantie d’un fonds', 'Autre']
        }),
        champ('detailsGaranties', 'Précisez les garanties disponibles, sans transmettre de document confidentiel', 'textarea', false)
      ]
    },
    {
      id: 'risques',
      titre: 'Risques du projet',
      description: 'Identification des risques et des réponses prévues.',
      questions: [
        champ('risques', 'Principaux risques identifiés', 'repeater', true, {
          colonnes: [
            { id: 'risque', label: 'Risque', type: 'text', required: true },
            { id: 'probabilite', label: 'Probabilité', type: 'select', required: true, options: ['Faible', 'Moyenne', 'Élevée'] },
            { id: 'impact', label: 'Impact', type: 'select', required: true, options: ['Faible', 'Moyen', 'Élevé'] },
            { id: 'mesure', label: 'Mesure de réduction', type: 'textarea', required: true }
          ]
        }),
        champ('scenarioBaisseVentesPct', 'Baisse des ventes à tester dans le scénario prudent (%)', 'number', true, { min: 0, max: 100, valeurParDefaut: 20 }),
        champ('scenarioHausseCoutsPct', 'Hausse des coûts à tester dans le scénario prudent (%)', 'number', true, { min: 0, max: 100, valeurParDefaut: 10 })
      ]
    }
  ];

  function champ(id, label, type, required, options) {
    return Object.assign({ id, label, type, required: Boolean(required) }, options || {});
  }

  function valeurChemin(objet, chemin) {
    return String(chemin || '').split('.').reduce((courant, cle) => {
      if (courant === null || courant === undefined) return undefined;
      return courant[cle];
    }, objet);
  }

  function premiereValeur(objet, chemins) {
    for (let i = 0; i < chemins.length; i += 1) {
      const valeur = valeurChemin(objet, chemins[i]);
      if (estRenseigne(valeur)) return valeur;
    }
    return undefined;
  }

  function estRenseigne(valeur) {
    if (valeur === null || valeur === undefined) return false;
    if (typeof valeur === 'string') return valeur.trim() !== '';
    if (Array.isArray(valeur)) return valeur.length > 0;
    return true;
  }

  function nombre(valeur, valeurParDefaut) {
    const propre = typeof valeur === 'string'
      ? valeur.replace(/\s/g, '').replace(',', '.')
      : valeur;
    const resultat = Number(propre);
    const fallback = arguments.length >= 2 ? valeurParDefaut : 0;
    return Number.isFinite(resultat) ? resultat : fallback;
  }

  function arrondir(valeur, decimales) {
    const facteur = Math.pow(10, decimales || 0);
    return Math.round((nombre(valeur, 0) + Number.EPSILON) * facteur) / facteur;
  }

  function somme(liste, selecteur) {
    return (Array.isArray(liste) ? liste : []).reduce((total, element) => {
      return total + nombre(selecteur ? selecteur(element) : element, 0);
    }, 0);
  }

  function cloner(objet) {
    return JSON.parse(JSON.stringify(objet || {}));
  }

  function normaliserStandard(reponsesStandard) {
    const source = reponsesStandard || {};
    const resultat = {};
    Object.keys(STANDARD_FIELD_ALIASES).forEach(cle => {
      resultat[cle] = premiereValeur(source, STANDARD_FIELD_ALIASES[cle]);
    });
    return resultat;
  }

  function indexerQuestions() {
    const index = {};
    QUESTIONNAIRE.forEach(section => {
      section.questions.forEach(question => {
        index[question.id] = question;
      });
    });
    return index;
  }

  function getQuestionnaire(reponsesStandard, reponsesPremium) {
    const standard = normaliserStandard(reponsesStandard);
    const premium = reponsesPremium || {};
    const questionsManquantes = [];

    QUESTIONNAIRE.forEach(section => {
      // Toutes les questions Premium restent visibles afin que l’utilisateur
      // puisse relire et corriger ses réponses après une sauvegarde ou un audit.
      const questions = section.questions.slice();

      if (questions.length > 0) {
        questionsManquantes.push({
          id: section.id,
          titre: section.titre,
          description: section.description,
          questions: cloner(questions)
        });
      }
    });

    return {
      version: VERSION,
      standardDetecte: standard,
      sections: questionsManquantes
    };
  }

  function validerReponsesPremium(reponsesPremium) {
    const premium = reponsesPremium || {};
    const index = indexerQuestions();
    const erreurs = [];

    Object.keys(index).forEach(id => {
      const question = index[id];
      const valeur = premium[id];

      if (question.required && !estRenseigne(valeur)) {
        erreurs.push({ champ: id, message: `Le champ « ${question.label} » est obligatoire.` });
        return;
      }

      if (!estRenseigne(valeur)) return;

      if (question.type === 'number') {
        const n = nombre(valeur, NaN);
        if (!Number.isFinite(n)) {
          erreurs.push({ champ: id, message: `Le champ « ${question.label} » doit être numérique.` });
        } else {
          if (question.min !== undefined && n < question.min) {
            erreurs.push({ champ: id, message: `Le champ « ${question.label} » doit être supérieur ou égal à ${question.min}.` });
          }
          if (question.max !== undefined && n > question.max) {
            erreurs.push({ champ: id, message: `Le champ « ${question.label} » doit être inférieur ou égal à ${question.max}.` });
          }
        }
      }

      if (question.type === 'repeater') {
        if (!Array.isArray(valeur)) {
          erreurs.push({ champ: id, message: `Le champ « ${question.label} » doit contenir une liste.` });
        } else {
          valeur.forEach((ligne, indexLigne) => {
            (question.colonnes || []).forEach(colonne => {
              const cellule = ligne ? ligne[colonne.id] : undefined;
              if (colonne.required && !estRenseigne(cellule)) {
                erreurs.push({ champ: id, message: `Ligne ${indexLigne + 1} : « ${colonne.label} » est obligatoire.` });
                return;
              }
              if (!estRenseigne(cellule)) return;
              if (colonne.type === 'number') {
                const n = nombre(cellule, NaN);
                if (!Number.isFinite(n)) {
                  erreurs.push({ champ: id, message: `Ligne ${indexLigne + 1} : « ${colonne.label} » doit être numérique.` });
                } else if (colonne.min !== undefined && n < colonne.min) {
                  erreurs.push({ champ: id, message: `Ligne ${indexLigne + 1} : « ${colonne.label} » doit être supérieur ou égal à ${colonne.min}.` });
                } else if (colonne.max !== undefined && n > colonne.max) {
                  erreurs.push({ champ: id, message: `Ligne ${indexLigne + 1} : « ${colonne.label} » doit être inférieur ou égal à ${colonne.max}.` });
                }
              }
            });
          });
        }
      }
    });

    return { valide: erreurs.length === 0, erreurs };
  }

  function construireDossier(reponsesStandard, reponsesPremium) {
    const validation = validerReponsesPremium(reponsesPremium);
    if (!validation.valide) {
      throw new Error(JSON.stringify({
        code: 'REPONSES_PREMIUM_INVALIDES',
        erreurs: validation.erreurs
      }));
    }

    return {
      meta: {
        type: 'BUSINESS_PLAN_BANCABLE',
        version: VERSION,
        creeLe: new Date().toISOString()
      },
      standard: normaliserStandard(reponsesStandard),
      bancable: cloner(reponsesPremium),
      audit: null
    };
  }

  function calculerMensualite(capital, tauxAnnuelPct, dureeMois) {
    return AG24_FIN_calculerEcheancier_({
      montantDemande: capital,
      tauxInteretAnnuel: tauxAnnuelPct,
      dureeRemboursementMois: dureeMois,
      differeMois: 0
    }).mensualiteApresDiffere;
  }

  function calculerIndicateurs(dossier) {
    const p = dossier.bancable || {};
    const lignes = Array.isArray(p.lignesVentes) ? p.lignesVentes : [];

    const chiffreAffairesMensuel = somme(lignes, ligne => {
      return nombre(ligne.prixUnitaire, 0) * nombre(ligne.volumeMensuel, 0);
    });

    const coutsVariablesMensuels = somme(lignes, ligne => {
      return nombre(ligne.coutVariableUnitaire, 0) * nombre(ligne.volumeMensuel, 0);
    });

    const chargesFixesMensuelles = [
      p.salairesMensuels,
      p.loyersMensuels,
      p.marketingMensuel,
      p.energieTelecomMensuel,
      p.transportLogistiqueMensuel,
      p.administrationMensuel,
      p.impotsTaxesMensuels,
      p.autresChargesFixesMensuelles
    ].reduce((total, valeur) => total + nombre(valeur, 0), 0);

    const margeBruteMensuelle = chiffreAffairesMensuel - coutsVariablesMensuels;
    const excedentOperationnelMensuelSimplifie = margeBruteMensuelle - chargesFixesMensuelles;

    const investissements = nombre(p.montantInvestissements, 0);
    const stockInitial = nombre(p.montantStockInitial, 0);
    const bfrDeclare = nombre(p.besoinFondsRoulementDeclare, 0);
    const tresorerieSecurite = nombre(p.tresorerieSecurite, 0);
    const apportPromoteur = nombre(p.apportPromoteur, 0);
    const autresFinancements = nombre(p.autresFinancements, 0);
    const montantDemande = nombre(p.montantDemande, 0);

    const totalBesoins = investissements + stockInitial + bfrDeclare + tresorerieSecurite;
    const totalRessources = apportPromoteur + autresFinancements + montantDemande;
    const ecartFinancement = totalRessources - totalBesoins;

    const creancesClients = chiffreAffairesMensuel * nombre(p.delaiPaiementClientsJours, 0) / 30;
    const stockMoyen = coutsVariablesMensuels * nombre(p.stockMoyenJours, 0) / 30;
    const dettesFournisseurs = coutsVariablesMensuels * nombre(p.delaiPaiementFournisseursJours, 0) / 30;
    const bfrCalcule = Math.max(0, creancesClients + stockMoyen - dettesFournisseurs);

    const echeancierDette =
      AG24_FIN_calculerEcheancier_(
        p
      );

    const mensualiteEstimee =
      echeancierDette.mensualiteApresDiffere;

    const mensualitesDettesExistantes = nombre(p.mensualitesDettesExistantes, 0);
    const capaciteDisponibleAvantNouvelleDette = excedentOperationnelMensuelSimplifie - mensualitesDettesExistantes;
    const couvertureMensuelleSimplifiee = mensualiteEstimee > 0
      ? capaciteDisponibleAvantNouvelleDette / mensualiteEstimee
      : null;

    const tauxApport = totalBesoins > 0 ? apportPromoteur / totalBesoins : 0;
    const tauxMargeBrute = chiffreAffairesMensuel > 0 ? margeBruteMensuelle / chiffreAffairesMensuel : 0;

    const baisseVentes = nombre(p.scenarioBaisseVentesPct, 20) / 100;
    const hausseCouts = nombre(p.scenarioHausseCoutsPct, 10) / 100;
    const caPrudent = chiffreAffairesMensuel * (1 - baisseVentes);
    const coutsVariablesPrudents = coutsVariablesMensuels * (1 - baisseVentes) * (1 + hausseCouts);
    const chargesFixesPrudentes = chargesFixesMensuelles * (1 + hausseCouts);
    const excedentPrudent = caPrudent - coutsVariablesPrudents - chargesFixesPrudentes;
    const capacitePrudenteAvantNouvelleDette = excedentPrudent - mensualitesDettesExistantes;
    const couverturePrudente = mensualiteEstimee > 0 ? capacitePrudenteAvantNouvelleDette / mensualiteEstimee : null;

    return {
      devise: p.devise || DEVISE_PAR_DEFAUT,
      chiffreAffairesMensuel: arrondir(chiffreAffairesMensuel, 0),
      chiffreAffairesAnnuel: arrondir(chiffreAffairesMensuel * 12, 0),
      coutsVariablesMensuels: arrondir(coutsVariablesMensuels, 0),
      chargesFixesMensuelles: arrondir(chargesFixesMensuelles, 0),
      margeBruteMensuelle: arrondir(margeBruteMensuelle, 0),
      tauxMargeBrutePct: arrondir(tauxMargeBrute * 100, 1),
      excedentOperationnelMensuelSimplifie: arrondir(excedentOperationnelMensuelSimplifie, 0),
      mensualitesDettesExistantes: arrondir(mensualitesDettesExistantes, 0),
      capaciteDisponibleAvantNouvelleDette: arrondir(capaciteDisponibleAvantNouvelleDette, 0),
      mensualiteMaxSupportableDeclaree: arrondir(nombre(p.mensualiteMaxSupportable, 0), 0),
      dettesFinancieresExistantes: arrondir(nombre(p.dettesFinancieresExistantes, 0), 0),
      tresorerieDisponibleActuelle: arrondir(nombre(p.tresorerieDisponibleActuelle, 0), 0),
      creancesClientsActuelles: arrondir(nombre(p.creancesClientsActuelles, 0), 0),
      totalBesoins: arrondir(totalBesoins, 0),
      totalRessources: arrondir(totalRessources, 0),
      ecartFinancement: arrondir(ecartFinancement, 0),
      tauxApportPct: arrondir(tauxApport * 100, 1),
      bfrDeclare: arrondir(bfrDeclare, 0),
      bfrCalcule: arrondir(bfrCalcule, 0),
      mensualiteEstimee: arrondir(mensualiteEstimee, 0),
      differeMoisSimule: echeancierDette.differeMois,
      paiementPendantDiffere: arrondir(echeancierDette.paiementPendantDiffere, 0),
      serviceNouvelleDetteAn1:
        echeancierDette.annuel &&
        echeancierDette.annuel[0]
          ? arrondir(echeancierDette.annuel[0].paiements, 0)
          : 0,
      couvertureMensuelleSimplifiee: couvertureMensuelleSimplifiee === null
        ? null
        : arrondir(couvertureMensuelleSimplifiee, 2),
      scenarioPrudent: {
        baisseVentesPct: arrondir(baisseVentes * 100, 1),
        hausseCoutsPct: arrondir(hausseCouts * 100, 1),
        chiffreAffairesMensuel: arrondir(caPrudent, 0),
        excedentOperationnelMensuelSimplifie: arrondir(excedentPrudent, 0),
        capaciteDisponibleAvantNouvelleDette: arrondir(capacitePrudenteAvantNouvelleDette, 0),
        couvertureMensuelleSimplifiee: couverturePrudente === null
          ? null
          : arrondir(couverturePrudente, 2)
      }
    };
  }

  function ajouterAlerte(liste, code, niveau, titre, message, recommandation) {
    liste.push({ code, niveau, titre, message, recommandation });
  }

  function auditer(dossier) {
    const indicateurs = calculerIndicateurs(dossier);
    const p = dossier.bancable || {};
    const s = dossier.standard || {};
    const alertes = [];
    const pointsForts = [];

    const rules =
      AG24_BANK_getRules_({
        pays: s.pays || '',
        secteur: s.secteur || ''
      });

    if (Math.abs(indicateurs.ecartFinancement) > TOLERANCE_EQUILIBRE) {
      ajouterAlerte(
        alertes,
        'PLAN_FINANCEMENT_DESEQUILIBRE',
        'CRITIQUE',
        'Plan de financement déséquilibré',
        `Les ressources et les besoins présentent un écart de ${indicateurs.ecartFinancement} ${indicateurs.devise}.`,
        'Ajuster le montant demandé, l’apport, les autres financements ou les besoins pour obtenir un plan équilibré.'
      );
    } else {
      pointsForts.push('Le plan de financement est équilibré.');
    }

    const totalUtilisationFonds = somme(p.utilisationFonds, ligne => ligne.montant);
    if (Math.abs(totalUtilisationFonds - nombre(p.montantDemande, 0)) > TOLERANCE_EQUILIBRE) {
      ajouterAlerte(
        alertes,
        'UTILISATION_FONDS_INCOHERENTE',
        'CRITIQUE',
        'Utilisation des fonds incomplète',
        `Le détail des utilisations totalise ${arrondir(totalUtilisationFonds, 0)} ${indicateurs.devise}, contre ${arrondir(p.montantDemande, 0)} ${indicateurs.devise} demandés.`,
        'Faire correspondre exactement la somme des postes d’utilisation au montant du financement demandé.'
      );
    } else {
      pointsForts.push('Le montant demandé est entièrement expliqué par les postes d’utilisation.');
    }

    if (indicateurs.chiffreAffairesMensuel <= 0) {
      ajouterAlerte(
        alertes,
        'CA_NON_DEMONTRE',
        'CRITIQUE',
        "Chiffre d’affaires non démontré",
        "Les prix et volumes saisis ne permettent pas de calculer un chiffre d’affaires positif.",
        'Compléter les lignes de produits ou services avec des prix et volumes réalistes.'
      );
    }

    const basesHypotheses = Array.isArray(p.baseHypothesesVentes) ? p.baseHypothesesVentes : [];
    if (!basesHypotheses.length ||
        (basesHypotheses.length === 1 && basesHypotheses[0] === 'Estimation personnelle uniquement')) {
      ajouterAlerte(
        alertes,
        'HYPOTHESES_VENTES_SANS_PREUVE',
        'ATTENTION',
        'Hypothèses de ventes insuffisamment étayées',
        'Les prix et volumes prévus reposent uniquement sur une estimation personnelle ou aucune base vérifiable.',
        'Appuyer les hypothèses sur des ventes, commandes, enquêtes, tarifs observés, devis ou capacités réelles.'
      );
    }

    if (scoreTexteQualite(p.justificationHypothesesVentes, 1, 45, 180) < 0.5) {
      ajouterAlerte(
        alertes,
        'JUSTIFICATION_VENTES_TROP_FAIBLE',
        'ATTENTION',
        'Justification des ventes trop vague',
        'La méthode utilisée pour déterminer les prix et volumes mensuels n’est pas assez précise.',
        'Expliquer le calcul des volumes, le nombre de clients visés, la fréquence d’achat et la source des prix.'
      );
    }

    const stadesAvecActivite = ['Premières ventes', 'Activité établie', 'Expansion'];
    const activiteExistante = stadesAvecActivite.indexOf(p.stadeProjet) !== -1;
    const caHistorique = nombre(p.chiffreAffairesHistorique, 0);
    const chargesHistoriques = nombre(p.chargesHistoriques12Mois, 0);
    if (activiteExistante && caHistorique <= 0) {
      ajouterAlerte(
        alertes,
        'HISTORIQUE_CA_ABSENT',
        'ATTENTION',
        'Historique de chiffre d’affaires absent',
        'Le projet déclare avoir déjà réalisé des ventes, mais aucun chiffre d’affaires des 12 derniers mois n’est indiqué.',
        'Renseigner le chiffre d’affaires réellement réalisé sur les 12 derniers mois.'
      );
    }

    if (caHistorique > 0 && indicateurs.chiffreAffairesAnnuel > caHistorique * 2 &&
        scoreTexteQualite(p.justificationHypothesesVentes, 1, 80, 220) < 0.75) {
      ajouterAlerte(
        alertes,
        'ECART_CA_HISTORIQUE_PREVISIONNEL',
        'ATTENTION',
        'Hausse importante du chiffre d’affaires à justifier',
        `Le chiffre d’affaires annuel prévu dépasse de plus de deux fois les ${caHistorique} ${indicateurs.devise} réalisés sur les 12 derniers mois.`,
        'Justifier précisément la hausse par de nouveaux contrats, capacités, points de vente, recrutements ou investissements.'
      );
    }

    if (activiteExistante && caHistorique > 0 && chargesHistoriques <= 0) {
      ajouterAlerte(
        alertes,
        'HISTORIQUE_CHARGES_ABSENT',
        'ATTENTION',
        'Historique de charges absent',
        'Le chiffre d’affaires historique est renseigné, mais les charges des 12 derniers mois ne le sont pas.',
        'Renseigner les charges réellement supportées afin de comparer la performance actuelle aux prévisions.'
      );
    }

    if (indicateurs.tauxMargeBrutePct <= 0) {
      ajouterAlerte(
        alertes,
        'MARGE_BRUTE_NEGATIVE',
        'CRITIQUE',
        'Marge brute négative ou nulle',
        'Les coûts variables sont supérieurs ou égaux au chiffre d’affaires.',
        'Réviser les prix, les coûts unitaires ou le mix de produits.'
      );
    } else if (indicateurs.tauxMargeBrutePct < rules.lowGrossMarginPct) {
      ajouterAlerte(
        alertes,
        'MARGE_BRUTE_FAIBLE',
        'ATTENTION',
        'Marge brute faible',
        `La marge brute estimée est de ${indicateurs.tauxMargeBrutePct} %.`,
        'Vérifier que cette marge permet de couvrir les charges fixes, les imprévus et le remboursement.'
      );
    } else {
      pointsForts.push(`La marge brute estimée est positive (${indicateurs.tauxMargeBrutePct} %).`);
    }

    if (indicateurs.excedentOperationnelMensuelSimplifie <= 0) {
      ajouterAlerte(
        alertes,
        'EXPLOITATION_DEFICITAIRE',
        'CRITIQUE',
        'Exploitation mensuelle déficitaire',
        "Le chiffre d’affaires ne couvre pas les coûts variables et les charges fixes.",
        'Réviser les hypothèses de ventes, les prix et les charges avant de poursuivre.'
      );
    }

    const detteExistante = nombre(p.dettesFinancieresExistantes, 0);
    const mensualitesExistantes = nombre(p.mensualitesDettesExistantes, 0);
    if (detteExistante > 0 && mensualitesExistantes <= 0) {
      ajouterAlerte(
        alertes,
        'DETTE_EXISTANTE_SANS_MENSUALITE',
        'CRITIQUE',
        'Service des dettes existantes incomplet',
        'Un capital restant dû est déclaré, mais aucune mensualité existante n’est indiquée.',
        'Renseigner le total mensuel réellement payé sur les prêts et crédits en cours.'
      );
    }
    if (detteExistante <= 0 && mensualitesExistantes > 0) {
      ajouterAlerte(
        alertes,
        'MENSUALITE_SANS_DETTE',
        'CRITIQUE',
        'Dettes existantes incohérentes',
        'Des mensualités existantes sont déclarées alors que le capital restant dû est nul.',
        'Vérifier et harmoniser les montants des dettes et des mensualités en cours.'
      );
    }

    const mensualiteMaxDeclaree = nombre(p.mensualiteMaxSupportable, 0);
    if (mensualiteMaxDeclaree <= 0 && nombre(p.montantDemande, 0) > 0) {
      ajouterAlerte(
        alertes,
        'MENSUALITE_MAX_NULLE',
        'CRITIQUE',
        'Mensualité supportable non démontrée',
        'La mensualité maximale déclarée est nulle alors qu’un financement est demandé.',
        'Indiquer le montant mensuel réellement supportable sans bloquer l’exploitation.'
      );
    } else if (indicateurs.mensualiteEstimee > mensualiteMaxDeclaree) {
      ajouterAlerte(
        alertes,
        'MENSUALITE_SUPERIEURE_CAPACITE_DECLAREE',
        'CRITIQUE',
        'Mensualité estimée supérieure à la capacité déclarée',
        `La mensualité estimée est de ${indicateurs.mensualiteEstimee} ${indicateurs.devise}, contre ${mensualiteMaxDeclaree} ${indicateurs.devise} déclarés comme supportables.`,
        'Réduire le montant demandé, allonger la durée ou revoir les hypothèses financières.'
      );
    }

    if (scoreTexteQualite(p.sourceRemboursement, 1, 45, 180) < 0.5) {
      ajouterAlerte(
        alertes,
        'SOURCE_REMBOURSEMENT_IMPRECISE',
        'ATTENTION',
        'Source de remboursement imprécise',
        'La source de trésorerie destinée au remboursement n’est pas décrite avec assez de précision.',
        'Identifier les ventes, contrats, clients ou activités générant la trésorerie de remboursement.'
      );
    }

    const dateBesoin = p.dateBesoinFonds ? new Date(p.dateBesoinFonds) : null;
    const dateDebut = p.dateDebutRemboursementSouhaitee ? new Date(p.dateDebutRemboursementSouhaitee) : null;
    if (dateBesoin && dateDebut && !isNaN(dateBesoin.getTime()) && !isNaN(dateDebut.getTime()) && dateDebut < dateBesoin) {
      ajouterAlerte(
        alertes,
        'DATE_REMBOURSEMENT_INCOHERENTE',
        'CRITIQUE',
        'Date de remboursement incohérente',
        'Le début des remboursements est prévu avant la date de mise à disposition des fonds.',
        'Choisir une date de début de remboursement postérieure à la date de besoin des fonds.'
      );
    }

    if (indicateurs.couvertureMensuelleSimplifiee !== null) {
      if (indicateurs.couvertureMensuelleSimplifiee < rules.minCoverageCritical) {
        ajouterAlerte(
          alertes,
          'REMBOURSEMENT_NON_COUVERT',
          'CRITIQUE',
          'Mensualité non couverte',
          `L’excédent opérationnel simplifié couvre ${indicateurs.couvertureMensuelleSimplifiee} fois la mensualité estimée.`,
          'Réduire le financement, allonger la durée, augmenter la marge ou renforcer les ventes.'
        );
      } else if (indicateurs.couvertureMensuelleSimplifiee < rules.minCoverageWarning) {
        ajouterAlerte(
          alertes,
          'MARGE_REMBOURSEMENT_FAIBLE',
          'ATTENTION',
          'Marge de remboursement limitée',
          `La couverture simplifiée est de ${indicateurs.couvertureMensuelleSimplifiee}.`,
          'Prévoir une marge de sécurité plus importante et vérifier le plan de trésorerie mensuel.'
        );
      } else {
        pointsForts.push(`La couverture mensuelle simplifiée est de ${indicateurs.couvertureMensuelleSimplifiee}.`);
      }
    }

    if (indicateurs.scenarioPrudent.couvertureMensuelleSimplifiee !== null &&
        indicateurs.scenarioPrudent.couvertureMensuelleSimplifiee < rules.minCoverageCritical) {
      ajouterAlerte(
        alertes,
        'SCENARIO_PRUDENT_FRAGILE',
        'CRITIQUE',
        'Scénario prudent insuffisant',
        `Après baisse des ventes et hausse des coûts, la couverture tombe à ${indicateurs.scenarioPrudent.couvertureMensuelleSimplifiee}.`,
        'Renforcer la trésorerie de sécurité, réduire les charges ou ajuster le financement.'
      );
    }

    if (indicateurs.tauxApportPct <= 0) {
      ajouterAlerte(
        alertes,
        'APPORT_ABSENT',
        'ATTENTION',
        'Apport non renseigné ou nul',
        'Le projet ne présente aucun engagement financier déclaré du promoteur ou des associés.',
        'Indiquer l’apport réellement disponible. Les exigences minimales varient selon le financeur.'
      );
    } else if (indicateurs.tauxApportPct < rules.lowEquityContributionPct) {
      ajouterAlerte(
        alertes,
        'APPORT_FAIBLE',
        'ATTENTION',
        'Apport relativement faible',
        `L’apport représente ${indicateurs.tauxApportPct} % des besoins totaux.`,
        'Vérifier les exigences du financeur ciblé et renforcer l’apport si nécessaire.'
      );
    } else {
      pointsForts.push(`L’apport représente ${indicateurs.tauxApportPct} % des besoins totaux.`);
    }

    if (indicateurs.bfrCalcule > 0) {
      const ecartBfrPct = Math.abs(indicateurs.bfrDeclare - indicateurs.bfrCalcule) / indicateurs.bfrCalcule;
      if (ecartBfrPct > rules.bfrVariancePct / 100) {
        ajouterAlerte(
          alertes,
          'BFR_INCOHERENT',
          'ATTENTION',
          'Besoin en fonds de roulement à vérifier',
          `Le BFR déclaré est de ${indicateurs.bfrDeclare} ${indicateurs.devise}, tandis que l’estimation simplifiée est de ${indicateurs.bfrCalcule} ${indicateurs.devise}.`,
          'Revoir les délais clients, fournisseurs et le niveau de stock.'
        );
      }
    }

    const croissance = nombre(p.croissanceAnnuellePct, 0);
    if (croissance > rules.highGrowthPct && !estRenseigne(p.justificationCroissance)) {
      ajouterAlerte(
        alertes,
        'CROISSANCE_NON_JUSTIFIEE',
        'ATTENTION',
        'Croissance élevée non justifiée',
        `Une croissance annuelle de ${croissance} % est prévue sans justification détaillée.`,
        'Expliquer les nouveaux clients, contrats, capacités, canaux ou investissements soutenant cette croissance.'
      );
    }

    const volumeTotal = somme(p.lignesVentes, ligne => ligne.volumeMensuel);
    const capacite = nombre(p.capaciteMaximaleMensuelle, 0);
    if (capacite > 0 && volumeTotal > capacite) {
      ajouterAlerte(
        alertes,
        'CAPACITE_DEPASSEE',
        'CRITIQUE',
        'Prévisions supérieures à la capacité',
        `Le volume mensuel prévu (${arrondir(volumeTotal, 0)}) dépasse la capacité déclarée (${arrondir(capacite, 0)}).`,
        'Réduire les ventes prévues ou expliquer les investissements permettant d’augmenter la capacité.'
      );
    }

    if ((p.statutAutorisations === 'En cours d’obtention' ||
         p.statutAutorisations === 'À obtenir avant le démarrage') &&
        scoreTexteQualite(p.detailsAutorisations, 1, 20, 100) < 0.5) {
      ajouterAlerte(
        alertes,
        'AUTORISATIONS_NON_DETAILLEES',
        'ATTENTION',
        'Autorisations à sécuriser',
        'Des autorisations restent à obtenir, mais les démarches et délais ne sont pas précisés.',
        'Indiquer les licences ou certifications concernées, l’organisme compétent et le calendrier prévu.'
      );
    }

    const garanties = Array.isArray(p.garantiesDisponibles) ? p.garantiesDisponibles : [];
    if (garanties.length && garanties.indexOf('Aucune garantie disponible') === -1) {
      pointsForts.push('Des garanties ou sûretés potentielles ont été déclarées.');
    }

    if (!estRenseigne(s.experiencePromoteur) && !estRenseigne(s.competencesPromoteur)) {
      ajouterAlerte(
        alertes,
        'PROFIL_PROMOTEUR_INCOMPLET',
        'ATTENTION',
        'Profil du promoteur incomplet',
        "L’expérience et les compétences du promoteur ne sont pas suffisamment décrites.",
        'Compléter le profil afin de démontrer la capacité à exécuter le projet.'
      );
    }

    if (!Array.isArray(p.risques) || p.risques.length < 2) {
      ajouterAlerte(
        alertes,
        'RISQUES_INSUFFISANTS',
        'ATTENTION',
        'Analyse des risques trop limitée',
        'Moins de deux risques ont été décrits.',
        'Présenter les principaux risques commerciaux, opérationnels et financiers avec leurs mesures de réduction.'
      );
    } else {
      pointsForts.push('Le projet présente une première matrice de risques.');
    }

    const score = calculerScore(dossier, indicateurs, alertes);
    const audit = {
      version: VERSION,
      genereLe: new Date().toISOString(),
      rulesetId: rules.rulesetId,
      regles: {
        lowGrossMarginPct: rules.lowGrossMarginPct,
        minCoverageCritical: rules.minCoverageCritical,
        minCoverageWarning: rules.minCoverageWarning,
        lowEquityContributionPct: rules.lowEquityContributionPct,
        highGrowthPct: rules.highGrowthPct,
        bfrVariancePct: rules.bfrVariancePct
      },
      score,
      niveau: niveauScore(score.total),
      indicateurs,
      alertes: alertes.sort((a, b) => poidsNiveau(b.niveau) - poidsNiveau(a.niveau)),
      pointsForts,
      pretPourGeneration: !alertes.some(a => a.niveau === 'CRITIQUE')
    };

    dossier.audit = audit;
    return audit;
  }

  function poidsNiveau(niveau) {
    return { INFO: 1, ATTENTION: 2, CRITIQUE: 3 }[niveau] || 0;
  }

  /**
   * Score de qualité du dossier.
   *
   * Contrairement à l'ancienne version, une réponse simplement non vide
   * n'obtient plus automatiquement tous les points. Le moteur vérifie aussi :
   * - la précision minimale des textes ;
   * - la complétude des tableaux ;
   * - la cohérence des hypothèses financières ;
   * - la présence d'alertes critiques ou de recommandations.
   */
  function calculerScore(dossier, indicateurs, alertes) {
    const p = dossier.bancable || {};
    const s = dossier.standard || {};

    const details = {
      promoteur: arrondir(
        scoreTexteQualite(s.nomPromoteur, 1, 3, 12) +
        scoreTexteQualite(s.fonctionPromoteur, 1, 3, 20) +
        scoreTexteQualite(s.experiencePromoteur, 4, 40, 180) +
        scoreTexteQualite(s.competencesPromoteur, 4, 35, 160), 1
      ),
      projet: arrondir(
        scoreTexteQualite(s.nomProjet, 1, 4, 25) +
        scoreTexteQualite(s.descriptionProjet, 3, 70, 300) +
        scoreTexteQualite(s.problemeResolu, 2, 45, 200) +
        scoreTexteQualite(s.solution, 2, 45, 200), 1
      ),
      marche: arrondir(
        scoreTexteQualite(s.clientsCibles, 2.5, 30, 140) +
        scoreTexteQualite(s.tailleMarche, 2.5, 30, 160) +
        scoreTexteQualite(s.concurrents, 2.5, 30, 160) +
        scoreTexteQualite(s.avantageConcurrentiel, 2.5, 35, 180) +
        scoreListeSimpleQualite(p.preuvesDemande, 2), 1
      ),
      modeleEconomique: arrondir(
        scoreTexteQualite(s.sourcesRevenus, 3, 25, 120) +
        scoreLignesVentesQualite(p.lignesVentes, 6) +
        (estRenseigne(p.saisonnalite) ? 1 : 0), 1
      ),
      financement: arrondir(
        (nombre(p.montantDemande, 0) > 0 ? 2 : 0) +
        (nombre(p.apportPromoteur, 0) > 0 ? 2 : 0) +
        scoreUtilisationFondsQualite(p.utilisationFonds, nombre(p.montantDemande, 0), 4) +
        (nombre(p.dureeRemboursementMois, 0) >= 6 ? 1 : 0) +
        (Math.abs(indicateurs.ecartFinancement) <= TOLERANCE_EQUILIBRE ? 1 : 0), 1
      ),
      hypothesesFinancieres: arrondir(
        scoreLignesVentesQualite(p.lignesVentes, 6) +
        scoreChargesQualite(p, 4) +
        scoreCycleExploitationQualite(p, 3) +
        scoreJustificationFinanciereQualite(p, 2), 1
      ),
      remboursement: scoreRemboursementQualite(p, indicateurs, 15),
      risques: arrondir(
        scoreRisquesQualite(p.risques, 5) +
        (nombre(p.scenarioBaisseVentesPct, 0) > 0 ? 1.5 : 0) +
        (nombre(p.scenarioHausseCoutsPct, 0) > 0 ? 1.5 : 0), 1
      ),
      execution: arrondir(
        scoreTexteQualite(p.responsableOperations, 1.5, 5, 40) +
        scoreTexteQualite(p.responsableFinances, 1.5, 5, 40) +
        (nombre(p.effectifActuel, -1) >= 0 ? 1 : 0) +
        scoreRecrutementsQualite(p.recrutementsPrevus, 1) +
        (nombre(p.capaciteMaximaleMensuelle, 0) > 0 ? 1 : 0) +
        (estRenseigne(p.statutAutorisations) ? 1 : 0), 1
      ),
      coherence: scoreCoherenceDossier(p, indicateurs, 5)
    };

    const critiques = alertes.filter(a => a.niveau === 'CRITIQUE').length;
    const attentions = alertes.filter(a => a.niveau === 'ATTENTION').length;

    // Les pénalités s'appliquent désormais au score total, et non uniquement
    // à une petite rubrique de 5 points.
    const scoreBrut = Object.keys(details).reduce((total, cle) => total + nombre(details[cle], 0), 0);
    const penalite = critiques * 12 + attentions * 3;
    let total = Math.max(0, Math.min(100, arrondir(scoreBrut - penalite, 1)));

    // Un dossier contenant une anomalie critique ne peut jamais être présenté
    // comme solide, même si beaucoup de champs sont remplis.
    if (critiques > 0) total = Math.min(total, 39);
    else if (attentions >= 5) total = Math.min(total, 59);
    else if (attentions >= 3) total = Math.min(total, 69);

    return {
      total,
      details,
      methode: 'QUALITE_COHERENCE_V3',
      penalites: {
        critiques,
        attentions,
        pointsRetires: penalite
      }
    };
  }

  function scoreTexteQualite(valeur, maximum, minimumCaracteres, cibleCaracteres) {
    const texte = String(valeur == null ? '' : valeur).trim();
    if (!texte) return 0;
    const min = Math.max(1, nombre(minimumCaracteres, 1));
    const cible = Math.max(min, nombre(cibleCaracteres, min));
    if (texte.length < min) return arrondir(maximum * 0.2, 1);
    const ratio = Math.min(1, (texte.length - min) / Math.max(1, cible - min));
    return arrondir(maximum * (0.5 + 0.5 * ratio), 1);
  }

  function scoreListeSimpleQualite(valeur, maximum) {
    const liste = Array.isArray(valeur) ? valeur.filter(estRenseigne) : [];
    if (!liste.length || liste.indexOf('Aucune pour le moment') !== -1) return 0;
    return arrondir(Math.min(maximum, maximum * liste.length / 3), 1);
  }

  function scoreLignesVentesQualite(lignes, maximum) {
    const liste = Array.isArray(lignes) ? lignes : [];
    if (!liste.length) return 0;
    const valides = liste.filter(ligne => {
      return ligne && scoreTexteQualite(ligne.nom, 1, 3, 25) >= 0.5 &&
        nombre(ligne.prixUnitaire, 0) > 0 &&
        nombre(ligne.volumeMensuel, 0) > 0 &&
        nombre(ligne.coutVariableUnitaire, -1) >= 0 &&
        nombre(ligne.coutVariableUnitaire, 0) < nombre(ligne.prixUnitaire, 0);
    }).length;
    const diversite = Math.min(1, liste.length / 2);
    return arrondir(maximum * (valides / liste.length) * (0.75 + 0.25 * diversite), 1);
  }

  function scoreUtilisationFondsQualite(lignes, montantDemande, maximum) {
    const liste = Array.isArray(lignes) ? lignes : [];
    if (!liste.length || montantDemande <= 0) return 0;
    const valides = liste.filter(ligne => ligne &&
      scoreTexteQualite(ligne.poste, 1, 3, 30) >= 0.5 &&
      nombre(ligne.montant, 0) > 0 &&
      scoreTexteQualite(ligne.justification, 1, 15, 90) >= 0.5
    );
    const total = somme(liste, ligne => ligne.montant);
    const equilibre = Math.abs(total - montantDemande) <= TOLERANCE_EQUILIBRE ? 1 : 0;
    return arrondir(maximum * (0.75 * valides.length / liste.length + 0.25 * equilibre), 1);
  }

  function scoreChargesQualite(p, maximum) {
    const champs = [
      p.salairesMensuels, p.loyersMensuels, p.marketingMensuel,
      p.energieTelecomMensuel, p.transportLogistiqueMensuel,
      p.administrationMensuel, p.impotsTaxesMensuels,
      p.autresChargesFixesMensuelles
    ];
    const renseignes = champs.filter(v => nombre(v, 0) > 0).length;
    return arrondir(maximum * Math.min(1, renseignes / 4), 1);
  }

  function scoreCycleExploitationQualite(p, maximum) {
    const valeurs = [p.delaiPaiementClientsJours, p.delaiPaiementFournisseursJours, p.stockMoyenJours];
    const plausibles = valeurs.filter(v => nombre(v, -1) >= 0 && nombre(v, 0) <= 365).length;
    return arrondir(maximum * plausibles / valeurs.length, 1);
  }

  function scoreJustificationFinanciereQualite(p, maximum) {
    let score = 0;
    const quart = maximum / 4;
    const bases = Array.isArray(p.baseHypothesesVentes) ? p.baseHypothesesVentes : [];
    if (bases.length && !(bases.length === 1 && bases[0] === 'Estimation personnelle uniquement')) score += quart;
    if (scoreTexteQualite(p.justificationHypothesesVentes, 1, 45, 180) >= 0.5) score += quart;
    if (nombre(p.croissanceAnnuellePct, 0) <= 20 || scoreTexteQualite(p.justificationCroissance, 1, 30, 140) >= 0.5) score += quart;
    if (p.saisonnalite !== 'Oui' || scoreTexteQualite(p.detailsSaisonnalite, 1, 25, 120) >= 0.5) score += quart;
    return arrondir(score, 1);
  }

  function scoreRemboursementQualite(p, indicateurs, maximum) {
    let score = 0;
    const couverture = indicateurs.couvertureMensuelleSimplifiee;
    if (couverture !== null) {
      score += Math.max(0, Math.min(8, couverture / 1.5 * 8));
    }

    score += scoreTexteQualite(p.sourceRemboursement, 2, 45, 180);

    const maxDeclare = nombre(p.mensualiteMaxSupportable, 0);
    if (maxDeclare > 0) {
      score += indicateurs.mensualiteEstimee <= maxDeclare ? 2 : 0.5;
    }

    const dette = nombre(p.dettesFinancieresExistantes, 0);
    const mensualiteExistante = nombre(p.mensualitesDettesExistantes, 0);
    if ((dette === 0 && mensualiteExistante === 0) || (dette > 0 && mensualiteExistante > 0)) {
      score += 1.5;
    }

    if (estRenseigne(p.dateDebutRemboursementSouhaitee)) score += 1;
    if (estRenseigne(p.tresorerieDisponibleActuelle) && estRenseigne(p.creancesClientsActuelles)) score += 0.5;
    return arrondir(Math.min(maximum, score), 1);
  }

  function scoreCoherenceDossier(p, indicateurs, maximum) {
    let score = 0;
    if (Math.abs(indicateurs.ecartFinancement) <= TOLERANCE_EQUILIBRE) score += 1;
    const totalUtilisation = somme(p.utilisationFonds, ligne => ligne.montant);
    if (Math.abs(totalUtilisation - nombre(p.montantDemande, 0)) <= TOLERANCE_EQUILIBRE) score += 1;

    const volume = somme(p.lignesVentes, ligne => ligne.volumeMensuel);
    const capacite = nombre(p.capaciteMaximaleMensuelle, 0);
    if (capacite > 0 && volume <= capacite) score += 1;
    else if (capacite <= 0) score += 0.25;

    const dette = nombre(p.dettesFinancieresExistantes, 0);
    const mensualiteExistante = nombre(p.mensualitesDettesExistantes, 0);
    if ((dette === 0 && mensualiteExistante === 0) || (dette > 0 && mensualiteExistante > 0)) score += 1;

    const maxDeclare = nombre(p.mensualiteMaxSupportable, 0);
    if (maxDeclare > 0 && indicateurs.mensualiteEstimee <= maxDeclare) score += 1;
    return arrondir(Math.min(maximum, score), 1);
  }

  function scoreRisquesQualite(risques, maximum) {
    const liste = Array.isArray(risques) ? risques : [];
    if (!liste.length) return 0;
    const valides = liste.filter(risque => risque &&
      scoreTexteQualite(risque.risque, 1, 12, 70) >= 0.5 &&
      estRenseigne(risque.probabilite) && estRenseigne(risque.impact) &&
      scoreTexteQualite(risque.mesure, 1, 20, 120) >= 0.5
    ).length;
    const quantite = Math.min(1, liste.length / 3);
    return arrondir(maximum * (valides / liste.length) * (0.7 + 0.3 * quantite), 1);
  }

  function scoreRecrutementsQualite(recrutements, maximum) {
    const liste = Array.isArray(recrutements) ? recrutements : [];
    if (!liste.length) return 0;
    const valides = liste.filter(item => item && estRenseigne(item.poste) && nombre(item.nombre, 0) > 0).length;
    return arrondir(maximum * valides / liste.length, 1);
  }

  function niveauScore(score) {
    if (score >= 90) return 'TRÈS BIEN PRÉPARÉ';
    if (score >= 75) return 'SOLIDE';
    if (score >= 60) return 'À RENFORCER';
    if (score >= 40) return 'FRAGILE';
    return 'NON PRÊT';
  }

  function analyser(reponsesStandard, reponsesPremium) {
    const dossier = construireDossier(reponsesStandard, reponsesPremium);
    auditer(dossier);
    return dossier;
  }

  function test() {
    const standard = {
      nomProjet: 'Unité de transformation de mangues',
      nomPromoteur: 'Awa Diallo',
      fonctionPromoteur: 'Fondatrice et gérante',
      experiencePromoteur: '5 années dans la transformation agroalimentaire',
      competencesPromoteur: 'Production, contrôle qualité et vente B2B',
      descriptionProjet: 'Production de mangues séchées destinées aux commerces et hôtels.',
      problemeResolu: 'Pertes post-récolte et offre limitée de fruits transformés localement.',
      solution: 'Transformation locale de mangues en produits séchés conditionnés.',
      clientsCibles: 'Supermarchés, hôtels, restaurants et distributeurs.',
      tailleMarche: 'Marché urbain national et sous-régional.',
      concurrents: 'Transformateurs artisanaux et produits importés.',
      avantageConcurrentiel: 'Approvisionnement local, qualité standardisée et traçabilité.',
      sourcesRevenus: 'Vente de sachets et commandes professionnelles.'
    };

    const premium = {
      devise: 'XOF',
      montantInvestissements: 18000000,
      montantStockInitial: 3000000,
      besoinFondsRoulementDeclare: 4500000,
      tresorerieSecurite: 2500000,
      apportPromoteur: 8000000,
      autresFinancements: 0,
      montantDemande: 20000000,
      utilisationFonds: [
        { poste: 'Équipements', montant: 15000000, justification: 'Séchoirs et conditionnement' },
        { poste: 'Stock et BFR', montant: 3000000, justification: 'Matières premières et emballages' },
        { poste: 'Trésorerie', montant: 2000000, justification: 'Sécurité de démarrage' }
      ],
      dureeRemboursementMois: 48,
      differeMois: 6,
      tauxInteretAnnuel: 10,
      lignesVentes: [
        { nom: 'Sachet 100 g', prixUnitaire: 1500, volumeMensuel: 3500, coutVariableUnitaire: 650 },
        { nom: 'Commande professionnelle', prixUnitaire: 50000, volumeMensuel: 25, coutVariableUnitaire: 23000 }
      ],
      baseHypothesesVentes: ['Ventes déjà réalisées', 'Précommandes ou lettres d’intention', 'Capacité réelle de production ou de prestation'],
      justificationHypothesesVentes: 'Les prix correspondent aux ventes pilotes et aux tarifs observés. Les volumes reposent sur les précommandes, le nombre de distributeurs ciblés et la capacité mensuelle disponible.',
      croissanceAnnuellePct: 25,
      justificationCroissance: 'Ajout progressif de distributeurs dans trois villes.',
      saisonnalite: 'Oui',
      detailsSaisonnalite: 'Approvisionnement plus important pendant la saison de mangues.',
      salairesMensuels: 800000,
      loyersMensuels: 300000,
      marketingMensuel: 150000,
      energieTelecomMensuel: 200000,
      transportLogistiqueMensuel: 300000,
      administrationMensuel: 150000,
      impotsTaxesMensuels: 100000,
      autresChargesFixesMensuelles: 100000,
      delaiPaiementClientsJours: 15,
      delaiPaiementFournisseursJours: 10,
      stockMoyenJours: 20,
      stadeProjet: 'Premières ventes',
      nombreClientsActuels: 18,
      chiffreAffairesHistorique: 8500000,
      chargesHistoriques12Mois: 6100000,
      tresorerieDisponibleActuelle: 1200000,
      creancesClientsActuelles: 450000,
      dettesFinancieresExistantes: 0,
      mensualitesDettesExistantes: 0,
      preuvesDemande: ['Premières ventes', 'Précommandes', 'Partenariats commerciaux'],
      detailsTraction: 'Premières ventes réalisées et discussions avec deux distributeurs.',
      responsableOperations: 'La fondatrice',
      responsableFinances: 'Comptable externe',
      effectifActuel: 6,
      recrutementsPrevus: [
        { poste: 'Commercial', nombre: 1, datePrevue: 'Mois 3' }
      ],
      capaciteMaximaleMensuelle: 5000,
      uniteCapacite: 'unités équivalentes',
      statutAutorisations: 'Déjà obtenues',
      detailsAutorisations: 'Autorisation sanitaire et immatriculation disponibles.',
      sourceRemboursement: 'Le remboursement proviendra des encaissements mensuels issus des ventes aux distributeurs, hôtels et commerces, avec priorité donnée aux contrats professionnels récurrents.',
      mensualiteMaxSupportable: 650000,
      dateDebutRemboursementSouhaitee: '2027-02-01',
      garantiesDisponibles: ['Équipement ou matériel', 'Caution personnelle ou institutionnelle'],
      detailsGaranties: 'Les équipements financés et une caution personnelle pourront être proposés selon les exigences du prêteur.',
      risques: [
        { risque: 'Saisonnalité de la matière première', probabilite: 'Élevée', impact: 'Élevé', mesure: 'Contrats fournisseurs et stockage planifié' },
        { risque: 'Retard de paiement de clients professionnels', probabilite: 'Moyenne', impact: 'Moyen', mesure: 'Acomptes et limites de crédit client' }
      ],
      scenarioBaisseVentesPct: 15,
      scenarioHausseCoutsPct: 5
    };

    const resultat = analyser(standard, premium);
    Logger.log(JSON.stringify(resultat, null, 2));
    return resultat;
  }

  return Object.freeze({
    VERSION,
    getQuestionnaire,
    validerReponsesPremium,
    construireDossier,
    calculerIndicateurs,
    auditer,
    analyser,
    test
  });
})();

/**
 * Fonctions publiques pratiques pour les appels depuis HTMLService ou google.script.run.
 */
function obtenirQuestionnaireBusinessPlanBancable(reponsesStandard, reponsesPremium) {
  return BusinessPlanBancable.getQuestionnaire(reponsesStandard, reponsesPremium);
}

function analyserBusinessPlanBancable(reponsesStandard, reponsesPremium) {
  return BusinessPlanBancable.analyser(reponsesStandard, reponsesPremium);
}

function testerBusinessPlanBancable_() {
  return BusinessPlanBancable.test();
}
