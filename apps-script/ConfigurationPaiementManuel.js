/**
 * AfriGreen24 — Configuration administrateur du paiement manuel
 * Pack 4.1
 *
 * Ce fichier est le seul endroit à modifier pour l'installation et les activations.
 */

const AFRIGREEN24_PAIEMENT_MANUEL_ADMIN = Object.freeze({
  // Collez ici l'URL « Application Web » terminée par /exec.
  URL_WEB_APP_EXEC: 'https://script.google.com/macros/s/AKfycbxQsd8HczZwdT4Ymb3WdJtZNna5dfneFVSLtR-M14AjF1NIyryS2Hv0AW4pXNGlEb-K/exec',

  // Pour chaque paiement à activer, remplacez ces deux valeurs.
  REFERENCE_PAIEMENT_A_ACTIVER: 'AGP-COLLER_LA_REFERENCE_ICI',
  NUMERO_COMMANDE_SELAR: 'COLLER_LE_NUMERO_DE_COMMANDE_SELAR',

  // Utilisé seulement avec refuserPaiementClientBancable().
  MOTIF_REFUS: 'Commande Selar introuvable ou paiement non confirmé.'
});

/** À exécuter une seule fois après avoir collé l'URL /exec ci-dessus. */
function installerPaiementManuelBancable() {
  return installerPaiementManuelBancable_(
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.URL_WEB_APP_EXEC
  );
}

/**
 * Après vérification de la commande dans Selar :
 * 1. remplacer REFERENCE_PAIEMENT_A_ACTIVER ;
 * 2. remplacer NUMERO_COMMANDE_SELAR ;
 * 3. enregistrer ;
 * 4. exécuter cette fonction.
 */
function activerPaiementClientBancable() {
  const resultat = validerPaiementBancableManuellement(
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.REFERENCE_PAIEMENT_A_ACTIVER,
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.NUMERO_COMMANDE_SELAR
  );

  console.log('=== ACTIVATION CLIENT BANCABLE ===');
  console.log(JSON.stringify(resultat, null, 2));
  return resultat;
}

/** Refuse une déclaration lorsque la commande n'est pas confirmée dans Selar. */
function refuserPaiementClientBancable() {
  const resultat = refuserPaiementBancableManuellement(
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.REFERENCE_PAIEMENT_A_ACTIVER,
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.MOTIF_REFUS
  );

  console.log('=== REFUS DE LA DEMANDE DE PAIEMENT ===');
  console.log(JSON.stringify(resultat, null, 2));
  return resultat;
}
