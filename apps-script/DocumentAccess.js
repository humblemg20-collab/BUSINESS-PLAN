/**
 * AfriGreen24 — Controlled document delivery.
 *
 * Standard PDFs use short-lived capability tokens.
 * Bancable PDFs require the dossier access token on every request.
 * Generated Drive files remain private.
 */

const AG24_DOCUMENT_ACCESS = Object.freeze({
  CAPABILITY_PREFIX: 'AG24_DOC_CAP:',
  STANDARD_TTL_SECONDS: 24 * 60 * 60,
  MAX_PDF_BYTES: 8 * 1024 * 1024
});

function AG24_DOC_issueCapability_(fileId, scope, dossierId) {
  const id = String(fileId || '').trim();
  if (!id) throw new Error('Identifiant PDF absent.');

  const token = [
    Utilities.getUuid().replace(/-/g, ''),
    Utilities.getUuid().replace(/-/g, '')
  ].join('');

  const tokenHash = AG24_SEC_sha256_(token);
  const key =
    AG24_DOCUMENT_ACCESS.CAPABILITY_PREFIX +
    AG24_SEC_sha256_(id).slice(0, 40);

  PropertiesService.getScriptProperties().setProperty(
    key,
    JSON.stringify({
      fileId: id,
      tokenHash: tokenHash,
      scope: String(scope || 'STANDARD'),
      dossierId: String(dossierId || ''),
      expiresAt:
        Date.now() +
        AG24_DOCUMENT_ACCESS.STANDARD_TTL_SECONDS * 1000
    })
  );

  return token;
}

function AG24_DOC_verifyCapability_(fileId, token, expectedScope) {
  const id = String(fileId || '').trim();
  const supplied = String(token || '').trim();

  if (!id || !supplied) {
    throw new Error('Accès au document incomplet.');
  }

  const key =
    AG24_DOCUMENT_ACCESS.CAPABILITY_PREFIX +
    AG24_SEC_sha256_(id).slice(0, 40);

  const raw =
    PropertiesService.getScriptProperties().getProperty(key);

  if (!raw) {
    throw new Error('Lien de téléchargement introuvable ou expiré.');
  }

  let meta;
  try {
    meta = JSON.parse(raw);
  } catch (error) {
    throw new Error('Métadonnées de téléchargement invalides.');
  }

  if (
    String(meta.fileId || '') !== id ||
    String(meta.scope || '') !== String(expectedScope || 'STANDARD') ||
    Number(meta.expiresAt || 0) <= Date.now() ||
    String(meta.tokenHash || '') !== AG24_SEC_sha256_(supplied)
  ) {
    throw new Error('Lien de téléchargement invalide ou expiré.');
  }

  return meta;
}

function AG24_DOC_readPdfBase64_(fileId) {
  const file = DriveApp.getFileById(String(fileId || '').trim());
  const blob = file.getBlob();
  const bytes = blob.getBytes();

  if (bytes.length > AG24_DOCUMENT_ACCESS.MAX_PDF_BYTES) {
    throw new Error(
      'Le PDF dépasse la taille maximale de téléchargement sécurisé.'
    );
  }

  const mimeType = String(blob.getContentType() || 'application/pdf');
  if (mimeType !== 'application/pdf') {
    throw new Error('Le fichier demandé n’est pas un PDF.');
  }

  return {
    success: true,
    fileId: file.getId(),
    fileName: file.getName(),
    mimeType: mimeType,
    base64: Utilities.base64Encode(bytes)
  };
}

function telechargerPdfBusinessPlanStandard(fileId, accessToken) {
  AG24_SEC_assertRateLimit_(
    'standard-pdf-download',
    String(fileId || ''),
    20,
    900
  );

  AG24_DOC_verifyCapability_(
    fileId,
    accessToken,
    'STANDARD'
  );

  AG24_AUDIT_event_('STANDARD_PDF_DOWNLOADED', {
    fileId: String(fileId || '')
  });

  return AG24_DOC_readPdfBase64_(fileId);
}

function telechargerPdfBusinessPlanBancable(
  dossierId,
  jetonAcces,
  fileId
) {
  const id = AG24_SEC_assertBancableAccess_(
    dossierId,
    jetonAcces,
    'pdf-download'
  );

  const requestedFile = String(fileId || '').trim();
  const rapport = BPB_lireJsonChunked_(
    BPB_cle_(id, 'GENERATION_RAPPORT')
  );
  const financeur = BPB_lireJsonChunked_(
    BPB_cle_(id, 'GENERATION_FINANCEUR')
  );

  const allowed = [
    rapport && rapport.pdfId ? String(rapport.pdfId) : '',
    financeur && financeur.pdfId ? String(financeur.pdfId) : ''
  ].filter(Boolean);

  if (allowed.indexOf(requestedFile) === -1) {
    throw new Error(
      'Ce PDF n’appartient pas au dossier autorisé.'
    );
  }

  AG24_AUDIT_event_('BANCABLE_PDF_DOWNLOADED', {
    dossierId: id,
    fileId: requestedFile
  });

  return AG24_DOC_readPdfBase64_(requestedFile);
}
