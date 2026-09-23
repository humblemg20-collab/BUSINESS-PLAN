/**
 * AfriGreen24 — Contrôleur du parcours Business Plan Bancable
 * Module 2 — Interface, sauvegarde et validation progressive
 *
 * Dépendance : BusinessPlanBancable.gs (Module 1)
 *
 * Ce fichier ne remplace pas le parcours Standard. Il expose un pont simple :
 *   enregistrerReponsesStandardPourBancable(dossierId, reponsesStandard)
 * puis ouvre l'interface Bancable avec :
 *   ouvrirInterfaceBusinessPlanBancable(dossierId)
 */

const BPB_CONFIG = Object.freeze({
  VERSION: '1.2.0',
  PREFIXE_STOCKAGE: 'AFRIGREEN24_BPB',
  TAILLE_CHUNK: 7500,
  TITRE_INTERFACE: 'Business Plan Bancable AfriGreen24'
});

/**
 * Génère un identifiant de dossier lorsque le parcours Standard n'en possède pas.
 */
function creerIdentifiantDossierBancable() {
  return `BPB_${Utilities.getUuid().replace(/-/g, '').slice(0, 20).toUpperCase()}`;
}

/**
 * Enregistre le socle Standard afin que l'extension Bancable le réutilise.
 * À appeler depuis le parcours Standard au moment où l'utilisateur passe au Premium.
 */
function enregistrerReponsesStandardPourBancable(dossierId, reponsesStandard) {
  const id = BPB_normaliserDossierId_(dossierId);
  BPB_exigerObjet_(reponsesStandard, 'reponsesStandard');

  BPB_avecVerrou_(function () {
    const maintenant = new Date().toISOString();
    const metaExistante = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    const accesDejaActif = metaExistante.statut === 'ACCES_BANCABLE_ACTIF'
      && metaExistante.accesBancable === 'ACTIF';

    BPB_ecrireJsonChunked_(BPB_cle_(id, 'STANDARD'), reponsesStandard);
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'META'), Object.assign({}, metaExistante, {
      dossierId: id,
      statut: accesDejaActif ? metaExistante.statut : 'STANDARD_IMPORTE',
      creeLe: metaExistante.creeLe || maintenant,
      modifieLe: maintenant,
      version: BPB_CONFIG.VERSION
    }));
  });

  return { succes: true, dossierId: id };
}

/**
 * Ouvre l'interface autonome Bancable.
 * Peut être appelée depuis un routeur doGet existant :
 *   return ouvrirInterfaceBusinessPlanBancable(e.parameter.dossierId);
 */
function ouvrirInterfaceBusinessPlanBancable(dossierId, jetonAcces) {
  const id = BPB_normaliserDossierId_(dossierId);
  BPB_ACT_verifierAcces_(id, jetonAcces);
  const template = HtmlService.createTemplateFromFile('BusinessPlanBancableUI');
  template.dossierId = id;
  template.jetonAcces = String(jetonAcces || '');
  template.titre = BPB_CONFIG.TITRE_INTERFACE;

  return template.evaluate()
    .setTitle(BPB_CONFIG.TITRE_INTERFACE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Retourne toutes les données nécessaires au premier affichage.
 */
function initialiserParcoursBusinessPlanBancable(dossierId, jetonAcces) {
  const id = BPB_normaliserDossierId_(dossierId);
  BPB_ACT_verifierAcces_(id, jetonAcces);
  const standard = BPB_chargerReponsesStandard_(id);
  const brouillon = BPB_lireJsonChunked_(BPB_cle_(id, 'PREMIUM')) || {};
  const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
  const questionnaire = obtenirQuestionnaireBusinessPlanBancable(standard, brouillon);

  return {
    succes: true,
    dossierId: id,
    standard: standard,
    brouillon: brouillon,
    meta: meta,
    questionnaire: questionnaire,
    progression: meta.progression || {
      sectionIndex: 0,
      sectionsValidees: []
    },
    statut: meta.statut || 'QUESTIONNAIRE_EN_COURS',
    audit: BPB_lireJsonChunked_(BPB_cle_(id, 'AUDIT')) || null,
    validationFinale: BPB_lireJsonChunked_(BPB_cle_(id, 'VALIDATION_FINALE')) || null,
    generationRapport: BPB_lireJsonChunked_(BPB_cle_(id, 'GENERATION_RAPPORT')) || null,
    generationFinanceur: BPB_lireJsonChunked_(BPB_cle_(id, 'GENERATION_FINANCEUR')) || null
  };
}

/**
 * Sauvegarde silencieuse appelée après chaque modification importante.
 */
function enregistrerBrouillonBusinessPlanBancable(dossierId, reponsesPremium, progression) {
  const id = BPB_normaliserDossierId_(dossierId);
  BPB_exigerObjet_(reponsesPremium, 'reponsesPremium');

  const progressionSaine = BPB_normaliserProgression_(progression);

  BPB_avecVerrou_(function () {
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'PREMIUM'), reponsesPremium);
    const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'META'), Object.assign({}, meta, {
      dossierId: id,
      statut: 'QUESTIONNAIRE_EN_COURS',
      progression: progressionSaine,
      modifieLe: new Date().toISOString(),
      version: BPB_CONFIG.VERSION
    }));
  });

  return {
    succes: true,
    enregistreLe: new Date().toISOString(),
    progression: progressionSaine
  };
}

/**
 * Valide une section avant de permettre le passage à la suivante.
 */
function validerSectionBusinessPlanBancable(dossierId, sectionId, reponsesPremium, progression) {
  const id = BPB_normaliserDossierId_(dossierId);
  const idSection = String(sectionId || '').trim();
  BPB_exigerObjet_(reponsesPremium, 'reponsesPremium');

  const questionnaireComplet = BusinessPlanBancable.getQuestionnaire({}, {}).sections;
  const section = questionnaireComplet.find(function (element) {
    return element.id === idSection;
  });

  if (!section) {
    throw new Error(`Section Bancable inconnue : ${idSection}`);
  }

  const erreurs = BPB_validerQuestionsSection_(section, reponsesPremium);
  if (erreurs.length > 0) {
    return { succes: false, erreurs: erreurs };
  }

  const progressionSaine = BPB_normaliserProgression_(progression);
  if (progressionSaine.sectionsValidees.indexOf(idSection) === -1) {
    progressionSaine.sectionsValidees.push(idSection);
  }

  enregistrerBrouillonBusinessPlanBancable(id, reponsesPremium, progressionSaine);
  return { succes: true, progression: progressionSaine };
}

/**
 * Lance l'audit complet après validation de toutes les sections.
 */
function auditerParcoursBusinessPlanBancable(dossierId, reponsesPremium) {
  const id = BPB_normaliserDossierId_(dossierId);
  const standard = BPB_chargerReponsesStandard_(id);
  BPB_exigerObjet_(reponsesPremium, 'reponsesPremium');

  const validation = BusinessPlanBancable.validerReponsesPremium(reponsesPremium);
  if (!validation.valide) {
    return {
      succes: false,
      code: 'REPONSES_INCOMPLETES',
      erreurs: validation.erreurs
    };
  }

  const dossier = analyserBusinessPlanBancable(standard, reponsesPremium);

  BPB_avecVerrou_(function () {
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'PREMIUM'), reponsesPremium);
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'AUDIT'), dossier.audit);
    const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'META'), Object.assign({}, meta, {
      dossierId: id,
      statut: dossier.audit.pretPourGeneration
        ? 'AUDIT_VALIDE_EN_ATTENTE_CONFIRMATION'
        : 'CORRECTIONS_REQUISES',
      modifieLe: new Date().toISOString(),
      version: BPB_CONFIG.VERSION
    }));
  });

  return {
    succes: true,
    dossierId: id,
    audit: dossier.audit
  };
}

/**
 * Verrouille les réponses après confirmation de l'utilisateur.
 * La génération Docs/PDF sera raccordée au Module 3.
 */
function confirmerDossierBusinessPlanBancable(dossierId) {
  const id = BPB_normaliserDossierId_(dossierId);
  const audit = BPB_lireJsonChunked_(BPB_cle_(id, 'AUDIT'));

  if (!audit) {
    throw new Error("Aucun audit n'a encore été généré pour ce dossier.");
  }
  if (!audit.pretPourGeneration) {
    throw new Error('Le dossier contient encore au moins une anomalie critique.');
  }

  BPB_avecVerrou_(function () {
    const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'META'), Object.assign({}, meta, {
      dossierId: id,
      statut: 'PRET_POUR_GENERATION',
      confirmeLe: new Date().toISOString(),
      modifieLe: new Date().toISOString(),
      version: BPB_CONFIG.VERSION
    }));
  });

  return {
    succes: true,
    dossierId: id,
    statut: 'PRET_POUR_GENERATION',
    message: (audit.alertes || []).some(function (a) { return a.niveau === 'ATTENTION'; })
      ? 'Dossier validé avec recommandations. La génération du Business Plan est autorisée.'
      : 'Dossier validé et prêt pour la génération du Business Plan Bancable.'
  };
}


/**
 * Enregistre la déclaration finale du porteur avant la génération financeur.
 * Cette validation est distincte de l'audit technique du dossier.
 */
function enregistrerValidationFinaleBusinessPlanBancable(dossierId, declarations) {
  const id = BPB_normaliserDossierId_(dossierId);
  BPB_exigerObjet_(declarations, 'declarations');

  if (declarations.informationsExactes !== true) {
    throw new Error('Vous devez confirmer que les informations fournies sont exactes et complètes.');
  }
  if (declarations.decisionFinanceur !== true) {
    throw new Error('Vous devez confirmer que la décision de financement appartient exclusivement au financeur.');
  }

  const standard = BPB_chargerReponsesStandard_(id);
  const audit = BPB_lireJsonChunked_(BPB_cle_(id, 'AUDIT'));
  if (!audit || !audit.pretPourGeneration) {
    throw new Error('Le dossier doit être audité sans anomalie critique avant la validation finale.');
  }

  const maintenant = new Date().toISOString();
  const validation = {
    dossierId: id,
    nomPorteur: String(standard.nomPromoteur || '').trim(),
    informationsExactes: true,
    decisionFinanceur: true,
    valideLe: maintenant,
    versionApplication: BPB_CONFIG.VERSION,
    versionDocument: 'BUSINESS_PLAN_FINANCEUR_V1'
  };

  BPB_avecVerrou_(function () {
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'VALIDATION_FINALE'), validation);
    const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};
    BPB_ecrireJsonChunked_(BPB_cle_(id, 'META'), Object.assign({}, meta, {
      dossierId: id,
      statut: 'VALIDATION_FINALE_ENREGISTREE',
      validationFinaleLe: maintenant,
      modifieLe: maintenant,
      version: BPB_CONFIG.VERSION
    }));
  });

  return { succes: true, validationFinale: validation };
}

/** Retourne la validation finale enregistrée, sans la recréer. */
function obtenirValidationFinaleBusinessPlanBancable(dossierId) {
  const id = BPB_normaliserDossierId_(dossierId);
  const validation = BPB_lireJsonChunked_(BPB_cle_(id, 'VALIDATION_FINALE'));
  return validation
    ? { succes: true, validationFinale: validation }
    : { succes: false, dossierId: id, statut: 'NON_VALIDEE' };
}

/**
 * Retourne le dossier unifié pour le futur moteur documentaire.
 */
function obtenirDossierUnifieBusinessPlanBancable(dossierId) {
  const id = BPB_normaliserDossierId_(dossierId);
  const standard = BPB_chargerReponsesStandard_(id);
  const premium = BPB_lireJsonChunked_(BPB_cle_(id, 'PREMIUM')) || {};
  const audit = BPB_lireJsonChunked_(BPB_cle_(id, 'AUDIT')) || null;
  const meta = BPB_lireJsonChunked_(BPB_cle_(id, 'META')) || {};

  return {
    dossierId: id,
    meta: meta,
    standard: standard,
    bancable: premium,
    audit: audit
  };
}

/**
 * Test autonome du contrôleur.
 */
function testerControleurBusinessPlanBancable() {
  const id = creerIdentifiantDossierBancable();
  const standard = {
    nomProjet: 'Projet test Bancable',
    nomPromoteur: 'Utilisateur test',
    fonctionPromoteur: 'Promoteur',
    experiencePromoteur: 'Trois années dans le secteur',
    competencesPromoteur: 'Gestion et développement commercial',
    descriptionProjet: 'Projet utilisé pour tester le raccordement du parcours Bancable.',
    problemeResolu: 'Accès insuffisant à une offre locale structurée.',
    solution: 'Mise en place d’une offre professionnelle accessible.',
    clientsCibles: 'PME et particuliers',
    tailleMarche: 'Marché national',
    concurrents: 'Acteurs locaux',
    avantageConcurrentiel: 'Qualité, proximité et suivi',
    sourcesRevenus: 'Ventes directes'
  };

  enregistrerReponsesStandardPourBancable(id, standard);
  const initialisation = initialiserParcoursBusinessPlanBancable(id);
  Logger.log(JSON.stringify(initialisation, null, 2));
  return initialisation;
}

/* =========================
 * Fonctions internes
 * ========================= */

function BPB_chargerReponsesStandard_(dossierId) {
  const standard = BPB_lireJsonChunked_(BPB_cle_(dossierId, 'STANDARD'));
  if (!standard) {
    throw new Error(
      `Aucune réponse Standard n’est associée au dossier ${dossierId}. ` +
      'Appelez d’abord enregistrerReponsesStandardPourBancable(dossierId, reponsesStandard).'
    );
  }
  return standard;
}

function BPB_validerQuestionsSection_(section, reponses) {
  const erreurs = [];
  (section.questions || []).forEach(function (question) {
    const valeur = reponses[question.id];
    if (question.required && !BPB_estRenseigne_(valeur)) {
      erreurs.push({
        champ: question.id,
        message: `Le champ « ${question.label} » est obligatoire.`
      });
      return;
    }

    if (!BPB_estRenseigne_(valeur)) return;

    if (question.type === 'number') {
      const n = BPB_nombre_(valeur);
      if (!Number.isFinite(n)) {
        erreurs.push({ champ: question.id, message: `Le champ « ${question.label} » doit être numérique.` });
      } else if (question.min !== undefined && n < question.min) {
        erreurs.push({ champ: question.id, message: `La valeur minimale est ${question.min}.` });
      } else if (question.max !== undefined && n > question.max) {
        erreurs.push({ champ: question.id, message: `La valeur maximale est ${question.max}.` });
      }
    }

    if (question.type === 'repeater') {
      if (!Array.isArray(valeur) || (question.required && valeur.length === 0)) {
        erreurs.push({ champ: question.id, message: `Ajoutez au moins une ligne dans « ${question.label} ».` });
        return;
      }

      valeur.forEach(function (ligne, index) {
        (question.colonnes || []).forEach(function (colonne) {
          const cellule = ligne ? ligne[colonne.id] : undefined;
          if (colonne.required && !BPB_estRenseigne_(cellule)) {
            erreurs.push({
              champ: question.id,
              message: `Ligne ${index + 1} : « ${colonne.label} » est obligatoire.`
            });
            return;
          }

          if (!BPB_estRenseigne_(cellule)) return;
          if (colonne.type === 'number') {
            const n = BPB_nombre_(cellule);
            if (!Number.isFinite(n)) {
              erreurs.push({ champ: question.id, message: `Ligne ${index + 1} : « ${colonne.label} » doit être numérique.` });
            } else if (colonne.min !== undefined && n < colonne.min) {
              erreurs.push({ champ: question.id, message: `Ligne ${index + 1} : la valeur minimale de « ${colonne.label} » est ${colonne.min}.` });
            } else if (colonne.max !== undefined && n > colonne.max) {
              erreurs.push({ champ: question.id, message: `Ligne ${index + 1} : la valeur maximale de « ${colonne.label} » est ${colonne.max}.` });
            }
          }
        });
      });
    }
  });
  return erreurs;
}

function BPB_normaliserProgression_(progression) {
  const source = progression && typeof progression === 'object' ? progression : {};
  return {
    sectionIndex: Math.max(0, Number(source.sectionIndex) || 0),
    sectionsValidees: Array.isArray(source.sectionsValidees)
      ? source.sectionsValidees.map(String).filter(Boolean)
      : []
  };
}

function BPB_normaliserDossierId_(dossierId) {
  const id = String(dossierId || '').trim();
  if (!id) throw new Error('Identifiant de dossier obligatoire.');
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) {
    throw new Error('Identifiant de dossier invalide.');
  }
  return id;
}

function BPB_exigerObjet_(valeur, nom) {
  if (!valeur || typeof valeur !== 'object' || Array.isArray(valeur)) {
    throw new Error(`${nom} doit être un objet.`);
  }
}

function BPB_estRenseigne_(valeur) {
  if (valeur === null || valeur === undefined) return false;
  if (typeof valeur === 'string') return valeur.trim() !== '';
  if (Array.isArray(valeur)) return valeur.length > 0;
  return true;
}

function BPB_nombre_(valeur) {
  const propre = typeof valeur === 'string'
    ? valeur.replace(/\s/g, '').replace(',', '.')
    : valeur;
  return Number(propre);
}

function BPB_cle_(dossierId, suffixe) {
  return `${BPB_CONFIG.PREFIXE_STOCKAGE}:${dossierId}:${suffixe}`;
}

function BPB_avecVerrou_(callback) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    return callback();
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Stockage JSON découpé pour éviter la limite de taille d'une propriété Apps Script.
 */
function BPB_ecrireJsonChunked_(cleBase, valeur) {
  const properties = PropertiesService.getScriptProperties();
  BPB_supprimerJsonChunked_(cleBase);

  const texte = JSON.stringify(valeur);
  const chunks = [];
  for (let i = 0; i < texte.length; i += BPB_CONFIG.TAILLE_CHUNK) {
    chunks.push(texte.slice(i, i + BPB_CONFIG.TAILLE_CHUNK));
  }

  const lot = {};
  lot[`${cleBase}:COUNT`] = String(chunks.length);
  chunks.forEach(function (chunk, index) {
    lot[`${cleBase}:${index}`] = chunk;
  });
  properties.setProperties(lot, false);
}

function BPB_lireJsonChunked_(cleBase) {
  const properties = PropertiesService.getScriptProperties();
  const count = Number(properties.getProperty(`${cleBase}:COUNT`) || 0);
  if (!count) return null;

  let texte = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = properties.getProperty(`${cleBase}:${i}`);
    if (chunk === null) {
      throw new Error(`Données incomplètes pour ${cleBase}.`);
    }
    texte += chunk;
  }
  return JSON.parse(texte);
}

function BPB_supprimerJsonChunked_(cleBase) {
  const properties = PropertiesService.getScriptProperties();
  const count = Number(properties.getProperty(`${cleBase}:COUNT`) || 0);
  const cles = [`${cleBase}:COUNT`];
  for (let i = 0; i < count; i += 1) {
    cles.push(`${cleBase}:${i}`);
  }
  cles.forEach(function (cle) { properties.deleteProperty(cle); });
}
