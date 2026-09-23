/**
 * AfriGreen24 — Business Plan Security & Reliability Gate
 * Internal-only helpers. All functions intentionally end with "_"
 * so they are not callable through google.script.run.
 */

const AG24_SECURITY = Object.freeze({
  STANDARD_MAX_PAYLOAD_BYTES: 350000,
  BANCABLE_MAX_PAYLOAD_BYTES: 650000,
  STANDARD_RATE_LIMIT: 4,
  STANDARD_RATE_WINDOW_SECONDS: 900,
  IMPORT_RATE_LIMIT: 6,
  IMPORT_RATE_WINDOW_SECONDS: 900,
  PAYMENT_RATE_LIMIT: 20,
  PAYMENT_RATE_WINDOW_SECONDS: 900,
  BANCABLE_RATE_LIMIT: 90,
  BANCABLE_RATE_WINDOW_SECONDS: 900
});

function AG24_SEC_assertPayloadSize_(value, maxBytes, label) {
  const texte = JSON.stringify(value === undefined ? null : value);
  const bytes = Utilities.newBlob(texte).getBytes().length;
  if (bytes > Number(maxBytes || 0)) {
    throw new Error(
      (label || 'Charge utile') +
      ' trop volumineuse (' + bytes + ' octets).'
    );
  }
  return bytes;
}

function AG24_SEC_clientKey_(hint) {
  let temporaryKey = '';
  try {
    temporaryKey = String(
      Session.getTemporaryActiveUserKey() || ''
    ).trim();
  } catch (error) {
    temporaryKey = '';
  }

  const source = [
    temporaryKey || 'anonymous',
    String(hint || '').trim().toLowerCase()
  ].join('|');

  return AG24_SEC_sha256_(source).slice(0, 40);
}

function AG24_SEC_assertRateLimit_(scope, hint, maxCalls, windowSeconds) {
  const limite = Math.max(1, Number(maxCalls || 1));
  const fenetre = Math.max(60, Math.min(21600, Number(windowSeconds || 900)));
  const key = [
    'AG24RL',
    String(scope || 'default').replace(/[^A-Za-z0-9:_-]/g, '_'),
    AG24_SEC_clientKey_(hint)
  ].join(':');

  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const maintenant = Date.now();
    let etat = null;

    try {
      etat = JSON.parse(cache.get(key) || 'null');
    } catch (error) {
      etat = null;
    }

    if (
      !etat ||
      !Number.isFinite(Number(etat.resetAt)) ||
      maintenant >= Number(etat.resetAt)
    ) {
      etat = {
        count: 0,
        resetAt: maintenant + fenetre * 1000
      };
    }

    etat.count = Number(etat.count || 0) + 1;

    if (etat.count > limite) {
      AG24_AUDIT_event_('RATE_LIMIT_BLOCKED', {
        scope: scope,
        resetAt: new Date(etat.resetAt).toISOString()
      });
      throw new Error(
        'Trop de requêtes rapprochées. Réessayez dans quelques minutes.'
      );
    }

    const ttl = Math.max(
      60,
      Math.min(
        21600,
        Math.ceil((etat.resetAt - maintenant) / 1000)
      )
    );

    cache.put(key, JSON.stringify(etat), ttl);
    return {
      count: etat.count,
      limit: limite,
      resetAt: new Date(etat.resetAt).toISOString()
    };
  } finally {
    lock.releaseLock();
  }
}

function AG24_SEC_assertStandardRequest_(data) {
  AG24_SEC_assertPayloadSize_(
    data,
    AG24_SECURITY.STANDARD_MAX_PAYLOAD_BYTES,
    'Questionnaire Business Plan'
  );

  const hint = data && typeof data === 'object'
    ? String(data.email || data.userEmail || data.contactEmail || '')
    : '';

  AG24_SEC_assertRateLimit_(
    'standard-generation',
    hint,
    AG24_SECURITY.STANDARD_RATE_LIMIT,
    AG24_SECURITY.STANDARD_RATE_WINDOW_SECONDS
  );
}

function AG24_SEC_assertImportRequest_(payload) {
  AG24_SEC_assertRateLimit_(
    'business-plan-import',
    payload && payload.fileName ? payload.fileName : '',
    AG24_SECURITY.IMPORT_RATE_LIMIT,
    AG24_SECURITY.IMPORT_RATE_WINDOW_SECONDS
  );
}

function AG24_SEC_assertPaymentRequest_(dossierId, email) {
  AG24_SEC_assertRateLimit_(
    'business-plan-payment',
    String(dossierId || '') + '|' + String(email || ''),
    AG24_SECURITY.PAYMENT_RATE_LIMIT,
    AG24_SECURITY.PAYMENT_RATE_WINDOW_SECONDS
  );
}

function AG24_SEC_assertBancableAccess_(dossierId, jetonAcces, action) {
  const id = BPB_normaliserDossierId_(dossierId);
  const jeton = String(jetonAcces || '').trim();

  BPB_ACT_verifierAcces_(id, jeton);

  AG24_SEC_assertRateLimit_(
    'bancable:' + String(action || 'action'),
    id + '|' + AG24_SEC_sha256_(jeton).slice(0, 16),
    AG24_SECURITY.BANCABLE_RATE_LIMIT,
    AG24_SECURITY.BANCABLE_RATE_WINDOW_SECONDS
  );

  return id;
}

function AG24_SEC_sheetSafe_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;

  const texte = String(value).replace(/\u0000/g, '');
  const sansEspaces = texte.replace(/^\s+/, '');

  if (/^[=+\-@]/.test(sansEspaces)) {
    return "'" + texte;
  }

  return texte;
}

function AG24_SEC_sha256_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );

  return digest.map(function (b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function AG24_AUDIT_event_(eventName, metadata) {
  const payload = {
    event: String(eventName || 'UNKNOWN'),
    at: new Date().toISOString(),
    metadata: metadata && typeof metadata === 'object'
      ? metadata
      : {}
  };

  console.log('[AG24_AUDIT] ' + JSON.stringify(payload));
  return payload;
}
