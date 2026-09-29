/**
 * AfriGreen24 — OpenAI Secret Bootstrap V1
 *
 * One-time secret injection flow for Apps Script projects whose Script
 * Properties UI is read-only because the project has more than 50 properties.
 *
 * Security model:
 * - API key is entered only in an editor-only /dev web app session.
 * - The setup page requires a short-lived one-time token.
 * - Only the SHA-256 hash of that token is stored.
 * - The OpenAI API key is never logged or returned.
 * - The setup token is invalidated immediately after a successful save.
 * - No production deployment is required for the setup flow.
 */

const AG24_OPENAI_BOOTSTRAP = Object.freeze({
  VERSION: '1.0.0',
  TOKEN_HASH_PROPERTY: 'AFRIGREEN24_OPENAI_BOOTSTRAP_TOKEN_HASH',
  EXPIRES_AT_PROPERTY: 'AFRIGREEN24_OPENAI_BOOTSTRAP_EXPIRES_AT',
  CONFIGURED_AT_PROPERTY: 'AFRIGREEN24_OPENAI_CONFIGURED_AT',
  TTL_MS: 10 * 60 * 1000,
  MIN_KEY_LENGTH: 20,
  MAX_KEY_LENGTH: 512
});

function AG24_OPENAI_BOOTSTRAP_sha256_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );

  return digest.map(function(byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}

function AG24_OPENAI_BOOTSTRAP_makeToken_() {
  return (
    Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '')
  );
}

function AG24_OPENAI_BOOTSTRAP_getDevUrl_() {
  const serviceUrl = String(
    ScriptApp.getService().getUrl() || ''
  ).trim();

  if (!serviceUrl) {
    return '';
  }

  if (/\/exec$/.test(serviceUrl)) {
    return serviceUrl.replace(/\/exec$/, '/dev');
  }

  if (/\/dev$/.test(serviceUrl)) {
    return serviceUrl;
  }

  return '';
}

function AG24_OPENAI_BOOTSTRAP_START_V1() {
  const properties =
    PropertiesService.getScriptProperties();

  const token =
    AG24_OPENAI_BOOTSTRAP_makeToken_();

  const expiresAt =
    Date.now() +
    AG24_OPENAI_BOOTSTRAP.TTL_MS;

  properties.setProperties(
    {
      [AG24_OPENAI_BOOTSTRAP.TOKEN_HASH_PROPERTY]:
        AG24_OPENAI_BOOTSTRAP_sha256_(token),
      [AG24_OPENAI_BOOTSTRAP.EXPIRES_AT_PROPERTY]:
        String(expiresAt)
    },
    false
  );

  const devUrl =
    AG24_OPENAI_BOOTSTRAP_getDevUrl_();

  const setupPath =
    '?admin=openai-setup&token=' +
    encodeURIComponent(token);

  const result = {
    success: true,
    version:
      AG24_OPENAI_BOOTSTRAP.VERSION,
    expiresAt:
      new Date(expiresAt).toISOString(),
    setupToken: token,
    setupPath: setupPath,
    suggestedDevUrl:
      devUrl
        ? devUrl + setupPath
        : ''
  };

  /*
   * The short-lived setup token is intentionally logged so the script
   * owner can open the editor-only /dev form. The OpenAI API key itself
   * is never logged anywhere in this module.
   */
  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function AG24_OPENAI_BOOTSTRAP_validateToken_(token) {
  const properties =
    PropertiesService.getScriptProperties();

  const provided =
    String(token || '').trim();

  const storedHash =
    String(
      properties.getProperty(
        AG24_OPENAI_BOOTSTRAP.TOKEN_HASH_PROPERTY
      ) || ''
    ).trim();

  const expiresAt =
    Number(
      properties.getProperty(
        AG24_OPENAI_BOOTSTRAP.EXPIRES_AT_PROPERTY
      ) || 0
    );

  if (
    !provided ||
    !storedHash ||
    !expiresAt
  ) {
    return {
      valid: false,
      reason: 'MISSING'
    };
  }

  if (Date.now() > expiresAt) {
    properties.deleteProperty(
      AG24_OPENAI_BOOTSTRAP.TOKEN_HASH_PROPERTY
    );
    properties.deleteProperty(
      AG24_OPENAI_BOOTSTRAP.EXPIRES_AT_PROPERTY
    );

    return {
      valid: false,
      reason: 'EXPIRED'
    };
  }

  const providedHash =
    AG24_OPENAI_BOOTSTRAP_sha256_(provided);

  if (providedHash !== storedHash) {
    return {
      valid: false,
      reason: 'INVALID'
    };
  }

  return {
    valid: true,
    reason: 'OK'
  };
}

function AG24_OPENAI_BOOTSTRAP_escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function AG24_OPENAI_BOOTSTRAP_renderDenied_(reason) {
  const safeReason =
    AG24_OPENAI_BOOTSTRAP_escapeHtml_(
      reason || 'ACCESS_DENIED'
    );

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html><head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="referrer" content="no-referrer">' +
      '<title>AfriGreen24 — Configuration OpenAI</title>' +
      '</head><body style="font-family:Arial,sans-serif;padding:32px;max-width:720px;margin:auto">' +
      '<h2>Configuration refusée</h2>' +
      '<p>Le jeton de configuration est absent, invalide ou expiré.</p>' +
      '<p><strong>Code :</strong> ' + safeReason + '</p>' +
      '<p>Relancez <code>AG24_OPENAI_BOOTSTRAP_START_V1()</code> depuis l’éditeur Apps Script.</p>' +
      '</body></html>'
    )
    .setTitle(
      'AfriGreen24 — Configuration OpenAI'
    );
}

function AG24_OPENAI_BOOTSTRAP_renderForm_(token) {
  const safeToken =
    AG24_OPENAI_BOOTSTRAP_escapeHtml_(
      token
    );

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html><head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="referrer" content="no-referrer">' +
      '<title>AfriGreen24 — Configuration OpenAI</title>' +
      '<style>' +
      'body{font-family:Arial,sans-serif;background:#f6f8f7;margin:0;padding:32px;color:#17211c}' +
      '.card{max-width:680px;margin:40px auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 12px 40px rgba(0,0,0,.08)}' +
      'label{display:block;font-weight:700;margin:18px 0 8px}' +
      'input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #cad3ce;border-radius:10px;font-size:16px}' +
      'button{margin-top:22px;border:0;border-radius:10px;padding:13px 18px;background:#0b6b3a;color:#fff;font-weight:700;cursor:pointer}' +
      '.note{font-size:14px;color:#56635c;line-height:1.5}' +
      '</style>' +
      '</head><body>' +
      '<div class="card">' +
      '<h2>Configurer OpenAI pour AfriGreen24</h2>' +
      '<p class="note">Cette page est réservée au déploiement de test /dev. La clé est envoyée directement au serveur Apps Script et n’est jamais affichée dans les logs.</p>' +
      '<form method="post" autocomplete="off">' +
      '<input type="hidden" name="action" value="openai-bootstrap-save">' +
      '<input type="hidden" name="token" value="' + safeToken + '">' +
      '<label for="apiKey">OPENAI_API_KEY</label>' +
      '<input id="apiKey" name="apiKey" type="password" required autocomplete="new-password" spellcheck="false">' +
      '<button type="submit">Enregistrer la clé</button>' +
      '</form>' +
      '</div>' +
      '</body></html>'
    )
    .setTitle(
      'AfriGreen24 — Configuration OpenAI'
    );
}

function AG24_OPENAI_BOOTSTRAP_renderSuccess_() {
  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html><head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="referrer" content="no-referrer">' +
      '<title>AfriGreen24 — Configuration OpenAI</title>' +
      '</head><body style="font-family:Arial,sans-serif;padding:32px;max-width:720px;margin:auto">' +
      '<h2>Configuration enregistrée</h2>' +
      '<p><strong>OPENAI_API_KEY</strong> est maintenant présente dans les Script Properties.</p>' +
      '<p>Le jeton de configuration a été invalidé.</p>' +
      '<p>Vous pouvez fermer cette page et lancer le health check OpenAI.</p>' +
      '</body></html>'
    )
    .setTitle(
      'AfriGreen24 — Configuration OpenAI'
    );
}

function AG24_OPENAI_BOOTSTRAP_handleGet_(e) {
  const params =
    e && e.parameter
      ? e.parameter
      : {};

  const admin =
    String(
      params.admin || ''
    ).trim();

  if (admin !== 'openai-setup') {
    return null;
  }

  const token =
    String(
      params.token || ''
    ).trim();

  const validation =
    AG24_OPENAI_BOOTSTRAP_validateToken_(
      token
    );

  if (!validation.valid) {
    return AG24_OPENAI_BOOTSTRAP_renderDenied_(
      validation.reason
    );
  }

  return AG24_OPENAI_BOOTSTRAP_renderForm_(
    token
  );
}

function AG24_OPENAI_BOOTSTRAP_handlePost_(e) {
  const params =
    e && e.parameter
      ? e.parameter
      : {};

  const action =
    String(
      params.action || ''
    ).trim();

  if (action !== 'openai-bootstrap-save') {
    return AG24_OPENAI_BOOTSTRAP_renderDenied_(
      'UNKNOWN_ACTION'
    );
  }

  const token =
    String(
      params.token || ''
    ).trim();

  const validation =
    AG24_OPENAI_BOOTSTRAP_validateToken_(
      token
    );

  if (!validation.valid) {
    return AG24_OPENAI_BOOTSTRAP_renderDenied_(
      validation.reason
    );
  }

  const apiKey =
    String(
      params.apiKey || ''
    ).trim();

  if (
    apiKey.length <
      AG24_OPENAI_BOOTSTRAP.MIN_KEY_LENGTH ||
    apiKey.length >
      AG24_OPENAI_BOOTSTRAP.MAX_KEY_LENGTH ||
    /\s/.test(apiKey)
  ) {
    return AG24_OPENAI_BOOTSTRAP_renderDenied_(
      'INVALID_KEY_FORMAT'
    );
  }

  const properties =
    PropertiesService.getScriptProperties();

  properties.setProperty(
    AG24_OPENAI_CONFIG.API_KEY_PROPERTY,
    apiKey
  );

  properties.setProperty(
    AG24_OPENAI_BOOTSTRAP.CONFIGURED_AT_PROPERTY,
    new Date().toISOString()
  );

  properties.deleteProperty(
    AG24_OPENAI_BOOTSTRAP.TOKEN_HASH_PROPERTY
  );

  properties.deleteProperty(
    AG24_OPENAI_BOOTSTRAP.EXPIRES_AT_PROPERTY
  );

  const health =
    AG24_OPENAI_getHealthStatus_();

  if (!health.configured) {
    throw new Error(
      'La configuration OpenAI n’a pas été persistée.'
    );
  }

  return AG24_OPENAI_BOOTSTRAP_renderSuccess_();
}

function AG24_OPENAI_BOOTSTRAP_STATUS_V1() {
  const properties =
    PropertiesService.getScriptProperties();

  const expiresAt =
    Number(
      properties.getProperty(
        AG24_OPENAI_BOOTSTRAP.EXPIRES_AT_PROPERTY
      ) || 0
    );

  return {
    success: true,
    version:
      AG24_OPENAI_BOOTSTRAP.VERSION,
    configured:
      AG24_OPENAI_getHealthStatus_()
        .configured,
    pendingToken:
      Boolean(
        properties.getProperty(
          AG24_OPENAI_BOOTSTRAP.TOKEN_HASH_PROPERTY
        )
      ),
    tokenExpiresAt:
      expiresAt
        ? new Date(expiresAt).toISOString()
        : null
  };
}
