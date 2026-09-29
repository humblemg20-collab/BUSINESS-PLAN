/**
 * AfriGreen24 — Script Properties Migration V1
 *
 * Safe maintenance engine for Apps Script Script Properties.
 *
 * SAFETY CONTRACT
 * - DRY_RUN is the default and never deletes Script Properties.
 * - APPLY deletes only exact keys or exact legacy prefixes listed below.
 * - Unknown properties are NEVER deleted.
 * - AFRIGREEN24_BPB:* dossier/business data are always protected.
 * - OPENAI_* configuration is always protected.
 * - Migration metadata is excluded from confirmation fingerprints.
 * - Backup is selective: only properties scheduled for deletion are copied.
 * - APPLY requires an explicit confirmation token from a fresh DRY_RUN.
 * - Rollback restores only deleted legacy properties; it never clears the store.
 */

const AG24_PROPERTIES_MIGRATION_V1 = Object.freeze({
  VERSION: '1.0.5',
  INTERNAL_PREFIX: 'AFRIGREEN24_MIGRATION_',
  BACKUP_PREFIX: 'AFRIGREEN24_MIGRATION_BACKUP:',
  LAST_REPORT_KEY: 'AFRIGREEN24_MIGRATION_LAST_REPORT',
  PLAN_KEY: 'AFRIGREEN24_MIGRATION_PENDING_PLAN',

  APPROVED_DELETE_SET: Object.freeze([
    'AFRIGREEN24_BPB_PAYMENT_SPREADSHEET_ID',
    'AFRIGREEN24_BPB_WEBHOOK_SECRET',
    'HUMBLEOS_GATEWAY_SECRET',
    'HUMBLEOS_GATEWAY_URL'
  ]),

  PROTECTED_EXACT: Object.freeze([
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'AFRIGREEN24_BPB_LOGO_ID',
    'AFRIGREEN24_BPB_OUTPUT_FOLDER_ID',
    'AFRIGREEN24_BPB_WEB_APP_EXEC_URL'
  ]),

  PROTECTED_PREFIXES: Object.freeze([
    'OPENAI_',
    'AFRIGREEN24_OPENAI_',
    'AFRIGREEN24_BPB:',
    'AFRIGREEN24_MIGRATION_'
  ]),

  /*
   * Only confirmed obsolete configuration namespaces belong here.
   * Business dossier/history keys must never be added to this list.
   */
  DELETE_EXACT: Object.freeze([
    'HUMBLEOS_GATEWAY_SECRET',
    'HUMBLEOS_GATEWAY_URL',
    'HUMBLEOS_API_KEY',
    'HUMBLEOS_MODEL',
    'AFRIGREEN24_BPB_PAYMENT_URL',
    'AFRIGREEN24_BPB_PAYMENT_MODE',
    'AFRIGREEN24_BPB_PAYMENT_PROVIDER',
    'AFRIGREEN24_BPB_PAYMENT_SPREADSHEET_ID',
    'AFRIGREEN24_BPB_WEBHOOK_SECRET',
    'AFRIGREEN24_BPB_SELAR_URL'
  ]),

  DELETE_PREFIXES: Object.freeze([
    'HUMBLEOS_'
  ])
});

function AG24_PROPERTIES_isInternalKeyV1_(key) {
  return String(key || '').indexOf(
    AG24_PROPERTIES_MIGRATION_V1.INTERNAL_PREFIX
  ) === 0;
}

function AG24_PROPERTIES_classifyKeyV1_(key) {
  const value = String(key || '').trim();

  if (!value) {
    return {
      action: 'KEEP',
      reason: 'EMPTY_OR_INVALID_KEY'
    };
  }

  if (
    AG24_PROPERTIES_MIGRATION_V1.PROTECTED_EXACT.indexOf(value) !== -1
  ) {
    return {
      action: 'KEEP',
      reason: 'PROTECTED_EXACT'
    };
  }

  for (
    let i = 0;
    i < AG24_PROPERTIES_MIGRATION_V1.PROTECTED_PREFIXES.length;
    i += 1
  ) {
    const prefix =
      AG24_PROPERTIES_MIGRATION_V1.PROTECTED_PREFIXES[i];

    if (value.indexOf(prefix) === 0) {
      return {
        action: 'KEEP',
        reason: 'PROTECTED_PREFIX:' + prefix
      };
    }
  }

  if (
    AG24_PROPERTIES_MIGRATION_V1.DELETE_EXACT.indexOf(value) !== -1
  ) {
    return {
      action: 'DELETE',
      reason: 'LEGACY_EXACT'
    };
  }

  for (
    let i = 0;
    i < AG24_PROPERTIES_MIGRATION_V1.DELETE_PREFIXES.length;
    i += 1
  ) {
    const prefix =
      AG24_PROPERTIES_MIGRATION_V1.DELETE_PREFIXES[i];

    if (value.indexOf(prefix) === 0) {
      return {
        action: 'DELETE',
        reason: 'LEGACY_PREFIX:' + prefix
      };
    }
  }

  return {
    action: 'REVIEW',
    reason: 'UNKNOWN_NOT_DELETED'
  };
}

function AG24_PROPERTIES_hashV1_(text) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );

  return digest.map(function(byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}

function AG24_PROPERTIES_buildPlanV1_() {
  const properties =
    PropertiesService.getScriptProperties();

  const all =
    properties.getProperties();

  const keys =
    Object.keys(all).sort();

  const canonicalKeys =
    keys.filter(function(key) {
      return !AG24_PROPERTIES_isInternalKeyV1_(key);
    });

  const result = {
    version:
      AG24_PROPERTIES_MIGRATION_V1.VERSION,
    generatedAt:
      new Date().toISOString(),
    total:
      canonicalKeys.length,
    delete: [],
    keep: [],
    review: []
  };

  canonicalKeys.forEach(function(key) {
    const classification =
      AG24_PROPERTIES_classifyKeyV1_(key);

    const item = {
      key: key,
      reason: classification.reason
    };

    if (classification.action === 'DELETE') {
      result.delete.push(item);
    } else if (classification.action === 'KEEP') {
      result.keep.push(item);
    } else {
      result.review.push(item);
    }
  });

  /*
   * Fingerprint only canonical/non-migration keys.
   * DRY_RUN may safely persist PLAN/LAST_REPORT without invalidating its token.
   */
  const fingerprintPayload =
    JSON.stringify({
      version: result.version,
      deleteKeys: result.delete.map(function(item) {
        return item.key;
      }),
      canonicalKeys: canonicalKeys
    });

  result.confirmationToken =
    AG24_PROPERTIES_hashV1_(
      fingerprintPayload
    ).slice(0, 24);

  return result;
}

function AG24_PROPERTIES_compactReportV1_(
  plan,
  mode
) {
  return {
    success: true,
    mode: mode,
    version: plan.version,
    generatedAt: plan.generatedAt,
    total: plan.total,
    deleteCount: plan.delete.length,
    keepCount: plan.keep.length,
    reviewCount: plan.review.length,
    delete: plan.delete,
    review: plan.review,
    confirmationToken: plan.confirmationToken
  };
}

function AG24_PROPERTIES_writeCompactLogV1_(
  report
) {
  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );
}

/**
 * SAFE ENTRY POINT.
 *
 * Run this first from the Apps Script editor.
 * It NEVER deletes a property and NEVER prints property values.
 * Output is compact by design: DELETE + REVIEW + confirmation token.
 */
function AG24_PROPERTIES_DRY_RUN_V1() {
  const properties =
    PropertiesService.getScriptProperties();

  const plan =
    AG24_PROPERTIES_buildPlanV1_();

  properties.setProperty(
    AG24_PROPERTIES_MIGRATION_V1.PLAN_KEY,
    JSON.stringify({
      version: plan.version,
      generatedAt: plan.generatedAt,
      confirmationToken: plan.confirmationToken,
      deleteKeys: plan.delete.map(function(item) {
        return item.key;
      })
    })
  );

  const report =
    AG24_PROPERTIES_compactReportV1_(
      plan,
      'DRY_RUN'
    );

  properties.setProperty(
    AG24_PROPERTIES_MIGRATION_V1.LAST_REPORT_KEY,
    JSON.stringify(report)
  );

  AG24_PROPERTIES_writeCompactLogV1_(
    report
  );

  return report;
}

/**
 * APPLY is intentionally impossible without a confirmation token
 * generated by a prior DRY_RUN.
 *
 * Example:
 * AG24_PROPERTIES_APPLY_V1('token-from-dry-run')
 */
function AG24_PROPERTIES_APPLY_V1(
  confirmationToken
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const properties =
      PropertiesService.getScriptProperties();

    const pendingRaw =
      properties.getProperty(
        AG24_PROPERTIES_MIGRATION_V1.PLAN_KEY
      );

    if (!pendingRaw) {
      throw new Error(
        'Aucun plan DRY_RUN disponible. Exécutez AG24_PROPERTIES_DRY_RUN_V1() avant APPLY.'
      );
    }

    let pending;

    try {
      pending =
        JSON.parse(
          pendingRaw
        );
    } catch (error) {
      throw new Error(
        'Le plan DRY_RUN stocké est illisible. Relancez DRY_RUN.'
      );
    }

    const token =
      String(
        confirmationToken || ''
      ).trim();

    if (
      !token ||
      token !==
        String(
          pending.confirmationToken || ''
        )
    ) {
      throw new Error(
        'Confirmation refusée : token DRY_RUN absent ou invalide.'
      );
    }

    /*
     * Rebuild immediately before mutation.
     * Migration metadata does not affect the fingerprint.
     * Any canonical property change invalidates the token.
     */
    const currentPlan =
      AG24_PROPERTIES_buildPlanV1_();

    if (
      currentPlan.confirmationToken !==
      token
    ) {
      throw new Error(
        'Les Script Properties ont changé depuis DRY_RUN. Aucun élément supprimé. Relancez DRY_RUN.'
      );
    }

    const expectedDeleteKeys =
      (pending.deleteKeys || []).slice().sort();

    const currentDeleteKeys =
      currentPlan.delete.map(function(item) {
        return item.key;
      }).sort();

    if (
      JSON.stringify(expectedDeleteKeys) !==
      JSON.stringify(currentDeleteKeys)
    ) {
      throw new Error(
        'Le plan de suppression a changé depuis DRY_RUN. Aucun élément supprimé.'
      );
    }

    const allBefore =
      properties.getProperties();

    const selectiveBackup = {};

    currentDeleteKeys.forEach(function(key) {
      if (
        Object.prototype.hasOwnProperty.call(
          allBefore,
          key
        )
      ) {
        selectiveBackup[key] =
          allBefore[key];
      }
    });

    const backupKey =
      AG24_PROPERTIES_MIGRATION_V1.BACKUP_PREFIX +
      new Date()
        .toISOString()
        .replace(/[:.]/g, '-');

    /*
     * Only deletion candidates are persisted in the rollback backup.
     * Values are never written to Logger.
     */
    properties.setProperty(
      backupKey,
      JSON.stringify({
        version:
          AG24_PROPERTIES_MIGRATION_V1.VERSION,
        createdAt:
          new Date().toISOString(),
        deletedProperties:
          selectiveBackup
      })
    );

    const deleted = [];

    currentDeleteKeys.forEach(function(key) {
      /*
       * Defense in depth: reclassify each key at deletion time.
       */
      const classification =
        AG24_PROPERTIES_classifyKeyV1_(
          key
        );

      if (
        classification.action !==
        'DELETE'
      ) {
        throw new Error(
          'Suppression refusée pour la clé protégée/non whitelistée : ' +
          key
        );
      }

      properties.deleteProperty(
        key
      );

      deleted.push(
        key
      );
    });

    const after =
      properties.getProperties();

    const stillPresent =
      deleted.filter(function(key) {
        return Object.prototype.hasOwnProperty.call(
          after,
          key
        );
      });

    if (stillPresent.length) {
      /*
       * Targeted rollback: restore only deleted candidates.
       * Never clear unrelated Script Properties.
       */
      properties.setProperties(
        selectiveBackup,
        false
      );

      throw new Error(
        'Vérification de suppression échouée. Rollback automatique effectué : ' +
        stillPresent.join(', ')
      );
    }

    const report = {
      success: true,
      mode: 'APPLY',
      version:
        AG24_PROPERTIES_MIGRATION_V1.VERSION,
      appliedAt:
        new Date().toISOString(),
      backupKey: backupKey,
      deletedCount: deleted.length,
      deleted: deleted,
      reviewCount:
        currentPlan.review.length,
      remainingCanonicalCount:
        currentPlan.total - deleted.length
    };

    properties.setProperty(
      AG24_PROPERTIES_MIGRATION_V1.LAST_REPORT_KEY,
      JSON.stringify(report)
    );

    properties.deleteProperty(
      AG24_PROPERTIES_MIGRATION_V1.PLAN_KEY
    );

    AG24_PROPERTIES_writeCompactLogV1_(
      report
    );

    return report;

  } finally {
    lock.releaseLock();
  }
}

/**
 * Apps Script editor entry point with no arguments.
 *
 * Running this function is the explicit approval action.
 * It still refuses to mutate unless:
 * - a fresh DRY_RUN plan exists;
 * - reviewCount is zero;
 * - the pending/current delete set is exactly the approved four-key set;
 * - the pending token matches the rebuilt current plan.
 */
function AG24_PROPERTIES_APPLY_APPROVED_V1() {
  const properties =
    PropertiesService.getScriptProperties();

  const pendingRaw =
    properties.getProperty(
      AG24_PROPERTIES_MIGRATION_V1.PLAN_KEY
    );

  if (!pendingRaw) {
    throw new Error(
      'Aucun plan DRY_RUN disponible. Relancez AG24_PROPERTIES_DRY_RUN_V1().'
    );
  }

  let pending;

  try {
    pending = JSON.parse(pendingRaw);
  } catch (error) {
    throw new Error(
      'Plan DRY_RUN illisible. Relancez AG24_PROPERTIES_DRY_RUN_V1().'
    );
  }

  const currentPlan =
    AG24_PROPERTIES_buildPlanV1_();

  if (currentPlan.review.length !== 0) {
    throw new Error(
      'APPLY refusé : des propriétés restent en REVIEW.'
    );
  }

  const approved =
    AG24_PROPERTIES_MIGRATION_V1
      .APPROVED_DELETE_SET
      .slice()
      .sort();

  const pendingDelete =
    (pending.deleteKeys || [])
      .slice()
      .sort();

  const currentDelete =
    currentPlan.delete
      .map(function(item) {
        return item.key;
      })
      .sort();

  if (
    JSON.stringify(pendingDelete) !==
      JSON.stringify(approved) ||
    JSON.stringify(currentDelete) !==
      JSON.stringify(approved)
  ) {
    throw new Error(
      'APPLY refusé : le plan de suppression ne correspond pas exactement au jeu approuvé.'
    );
  }

  const token =
    String(
      pending.confirmationToken || ''
    ).trim();

  if (
    !token ||
    currentPlan.confirmationToken !== token
  ) {
    throw new Error(
      'APPLY refusé : le DRY_RUN n’est plus frais. Relancez AG24_PROPERTIES_DRY_RUN_V1().'
    );
  }

  return AG24_PROPERTIES_APPLY_V1(
    token
  );
}

/**
 * Roll back the most recent or an explicitly named migration backup.
 * Only deleted legacy properties are restored.
 * Existing/unrelated properties are never cleared.
 */
/**
 * Permanently purge validated migration backups after the canonical store
 * has been re-verified clean.
 *
 * Safety:
 * - refuses to run if any canonical DELETE or REVIEW remains;
 * - validates every backup before deleting any backup;
 * - each backed-up key must belong to the approved legacy delete set;
 * - deletes only AFRIGREEN24_MIGRATION_BACKUP:* entries;
 * - never logs backed-up values.
 */
function AG24_PROPERTIES_FINALIZE_LEGACY_BACKUPS_V1() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const properties =
      PropertiesService.getScriptProperties();

    const currentPlan =
      AG24_PROPERTIES_buildPlanV1_();

    if (
      currentPlan.delete.length !== 0 ||
      currentPlan.review.length !== 0
    ) {
      throw new Error(
        'FINALIZE refusé : le store canonique doit avoir DELETE=0 et REVIEW=0.'
      );
    }

    const all =
      properties.getProperties();

    const backupKeys =
      Object.keys(all)
        .filter(function(key) {
          return key.indexOf(
            AG24_PROPERTIES_MIGRATION_V1.BACKUP_PREFIX
          ) === 0;
        })
        .sort();

    if (!backupKeys.length) {
      const emptyReport = {
        success: true,
        mode: 'FINALIZE',
        version:
          AG24_PROPERTIES_MIGRATION_V1.VERSION,
        finalizedAt:
          new Date().toISOString(),
        backupsPurged: 0,
        backupKeys: [],
        remainingBackups: 0
      };

      properties.setProperty(
        AG24_PROPERTIES_MIGRATION_V1.LAST_REPORT_KEY,
        JSON.stringify(emptyReport)
      );

      AG24_PROPERTIES_writeCompactLogV1_(
        emptyReport
      );

      return emptyReport;
    }

    const approved =
      AG24_PROPERTIES_MIGRATION_V1
        .APPROVED_DELETE_SET
        .slice();

    backupKeys.forEach(function(backupKey) {
      let payload;

      try {
        payload =
          JSON.parse(
            properties.getProperty(
              backupKey
            )
          );
      } catch (error) {
        throw new Error(
          'FINALIZE refusé : backup illisible ' +
          backupKey
        );
      }

      if (
        !payload ||
        !payload.deletedProperties ||
        typeof payload.deletedProperties !== 'object'
      ) {
        throw new Error(
          'FINALIZE refusé : backup invalide ' +
          backupKey
        );
      }

      const backedUpKeys =
        Object.keys(
          payload.deletedProperties
        );

      backedUpKeys.forEach(function(key) {
        if (
          approved.indexOf(
            key
          ) === -1
        ) {
          throw new Error(
            'FINALIZE refusé : clé non approuvée dans backup ' +
            key
          );
        }

        const classification =
          AG24_PROPERTIES_classifyKeyV1_(
            key
          );

        if (
          classification.action !==
          'DELETE'
        ) {
          throw new Error(
            'FINALIZE refusé : classification legacy modifiée pour ' +
            key
          );
        }

        if (
          Object.prototype.hasOwnProperty.call(
            all,
            key
          )
        ) {
          throw new Error(
            'FINALIZE refusé : une clé legacy existe encore dans le store canonique : ' +
            key
          );
        }
      });
    });

    backupKeys.forEach(function(backupKey) {
      properties.deleteProperty(
        backupKey
      );
    });

    const remainingBackups =
      Object.keys(
        properties.getProperties()
      )
        .filter(function(key) {
          return key.indexOf(
            AG24_PROPERTIES_MIGRATION_V1.BACKUP_PREFIX
          ) === 0;
        });

    if (remainingBackups.length) {
      throw new Error(
        'FINALIZE incomplet : des backups de migration subsistent.'
      );
    }

    const report = {
      success: true,
      mode: 'FINALIZE',
      version:
        AG24_PROPERTIES_MIGRATION_V1.VERSION,
      finalizedAt:
        new Date().toISOString(),
      backupsPurged:
        backupKeys.length,
      backupKeys:
        backupKeys,
      remainingBackups: 0
    };

    properties.setProperty(
      AG24_PROPERTIES_MIGRATION_V1.LAST_REPORT_KEY,
      JSON.stringify(report)
    );

    AG24_PROPERTIES_writeCompactLogV1_(
      report
    );

    return report;

  } finally {
    lock.releaseLock();
  }
}


function AG24_PROPERTIES_ROLLBACK_V1(
  backupKey
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const properties =
      PropertiesService.getScriptProperties();

    const all =
      properties.getProperties();

    const requested =
      String(
        backupKey || ''
      ).trim();

    const candidates =
      Object.keys(all)
        .filter(function(key) {
          return key.indexOf(
            AG24_PROPERTIES_MIGRATION_V1.BACKUP_PREFIX
          ) === 0;
        })
        .sort()
        .reverse();

    const selected =
      requested ||
      (
        candidates.length
          ? candidates[0]
          : ''
      );

    if (
      !selected ||
      candidates.indexOf(selected) === -1
    ) {
      throw new Error(
        'Backup de migration introuvable.'
      );
    }

    const payload =
      JSON.parse(
        properties.getProperty(
          selected
        )
      );

    if (
      !payload ||
      !payload.deletedProperties ||
      typeof payload.deletedProperties !== 'object'
    ) {
      throw new Error(
        'Backup de migration invalide.'
      );
    }

    const restoreKeys =
      Object.keys(
        payload.deletedProperties
      );

    restoreKeys.forEach(function(key) {
      const classification =
        AG24_PROPERTIES_classifyKeyV1_(
          key
        );

      if (
        classification.action !==
        'DELETE'
      ) {
        throw new Error(
          'Rollback refusé pour une clé non legacy : ' +
          key
        );
      }
    });

    properties.setProperties(
      payload.deletedProperties,
      false
    );

    const restoredState =
      properties.getProperties();

    const missing =
      restoreKeys.filter(function(key) {
        return !Object.prototype.hasOwnProperty.call(
          restoredState,
          key
        );
      });

    if (missing.length) {
      throw new Error(
        'Rollback incomplet : ' +
        missing.join(', ')
      );
    }

    const report = {
      success: true,
      mode: 'ROLLBACK',
      restoredFrom: selected,
      restoredCount:
        restoreKeys.length,
      restored:
        restoreKeys,
      restoredAt:
        new Date().toISOString()
    };

    properties.setProperty(
      AG24_PROPERTIES_MIGRATION_V1.LAST_REPORT_KEY,
      JSON.stringify(report)
    );

    AG24_PROPERTIES_writeCompactLogV1_(
      report
    );

    return report;

  } finally {
    lock.releaseLock();
  }
}
