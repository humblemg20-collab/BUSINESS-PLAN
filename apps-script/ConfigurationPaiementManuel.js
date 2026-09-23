/**
 * AfriGreen24 — Administration du paiement manuel
 *
 * IMPORTANT :
 * - toutes les fonctions de ce fichier sont privées (suffixe "_") ;
 * - elles ne sont pas appelables via google.script.run ;
 * - l'URL du Web App provient du déploiement actif, pas d'une copie codée en dur.
 */

const AFRIGREEN24_PAIEMENT_MANUEL_ADMIN = Object.freeze({
  REFERENCE_PAIEMENT_A_ACTIVER: 'AGP-COLLER_LA_REFERENCE_ICI',
  NUMERO_COMMANDE_SELAR: 'COLLER_LE_NUMERO_DE_COMMANDE_SELAR',
  MOTIF_REFUS: 'Commande Selar introuvable ou paiement non confirmé.'
});

function installerPaiementManuelBancable_DepuisEditeur_() {
  const url = String(
    ScriptApp.getService().getUrl() || ''
  ).trim();

  if (!/\/exec$/.test(url)) {
    throw new Error(
      'Aucun déploiement /exec actif n’a été détecté pour ce projet.'
    );
  }

  return installerPaiementManuelBancable_(url);
}

function activerPaiementClientBancable_() {
  const resultat = validerPaiementBancableManuellement_(
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.REFERENCE_PAIEMENT_A_ACTIVER,
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.NUMERO_COMMANDE_SELAR
  );

  console.log('=== ACTIVATION CLIENT BANCABLE ===');
  console.log(JSON.stringify(resultat, null, 2));
  return resultat;
}

function refuserPaiementClientBancable_() {
  const resultat = refuserPaiementBancableManuellement_(
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.REFERENCE_PAIEMENT_A_ACTIVER,
    AFRIGREEN24_PAIEMENT_MANUEL_ADMIN.MOTIF_REFUS
  );

  console.log('=== REFUS DE LA DEMANDE DE PAIEMENT ===');
  console.log(JSON.stringify(resultat, null, 2));
  return resultat;
}
