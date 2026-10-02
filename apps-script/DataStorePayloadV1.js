/**
 * ============================================================
 * BUSINESS PLAN DATASTORE LARGE PAYLOAD STORE V1
 * ============================================================
 *
 * Google Sheets cells are not canonical storage for large Business Plan
 * payloads. Full questionnaire/commercial JSON is stored privately in Drive;
 * the CRM sheet stores only a compact immutable reference.
 *
 * Deterministic, no AI, no public sharing.
 */

var AG24_DATASTORE_PAYLOAD_V1 = Object.freeze({
  VERSION: "1.0.0",
  ROOT_FOLDER_NAME: "AG24 Business Plan DataStore",
  OUTPUT_FOLDER_PROPERTY: "AFRIGREEN24_BPB_OUTPUT_FOLDER_ID",
  REFERENCE_VERSION: "DRIVE_JSON_V1",
  SHEET_HARD_LIMIT: 50000,
  SHEET_SAFE_LIMIT: 12000,
  STORE_RETRIES: 2
});


function AG24_DATASTORE_safeName_(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "payload";
}


function AG24_DATASTORE_json_(value) {
  return JSON.stringify(
    value === undefined
      ? null
      : value
  );
}


function AG24_DATASTORE_sanitizePayload_(
  value
) {
  var forbidden = {
    projectBrandingToken: true,
    agBridge: true,
    logoUpload: true,
    apiKey: true,
    openAIKey: true,
    authorization: true,
    password: true,
    secret: true
  };

  function clone_(item) {
    if (
      item === null ||
      item === undefined
    ) {
      return item;
    }

    if (Array.isArray(item)) {
      return item.map(clone_);
    }

    if (
      Object.prototype.toString.call(
        item
      ) === "[object Date]"
    ) {
      return item.toISOString();
    }

    if (
      typeof item !== "object"
    ) {
      return item;
    }

    var output = {};

    Object.keys(item).forEach(
      function(key) {
        if (forbidden[key]) {
          return;
        }

        output[key] =
          clone_(
            item[key]
          );
      }
    );

    return output;
  }

  return clone_(value || {});
}


function AG24_DATASTORE_getParentFolder_() {
  var configured = String(
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_DATASTORE_PAYLOAD_V1
          .OUTPUT_FOLDER_PROPERTY
      ) || ""
  ).trim();

  if (configured) {
    try {
      return DriveApp.getFolderById(
        configured
      );
    } catch (error) {
      if (
        typeof AG24_AUDIT_event_ ===
        "function"
      ) {
        AG24_AUDIT_event_(
          "DATASTORE_OUTPUT_ROOT_FALLBACK",
          {
            reason:
              String(
                error &&
                error.message ||
                error
              ).slice(0, 180)
          }
        );
      }
    }
  }

  return DriveApp.getRootFolder();
}


function AG24_DATASTORE_getRootFolder_() {
  var parent =
    AG24_DATASTORE_getParentFolder_();

  var folders =
    parent.getFoldersByName(
      AG24_DATASTORE_PAYLOAD_V1
        .ROOT_FOLDER_NAME
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  return parent.createFolder(
    AG24_DATASTORE_PAYLOAD_V1
      .ROOT_FOLDER_NAME
  );
}


function AG24_DATASTORE_getSubmissionFolder_(
  submissionId
) {
  var root =
    AG24_DATASTORE_getRootFolder_();

  var name =
    "submission-" +
    AG24_DATASTORE_safeName_(
      submissionId
    );

  var folders =
    root.getFoldersByName(
      name
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  return root.createFolder(
    name
  );
}


function AG24_DATASTORE_buildReference_(
  file,
  json
) {
  var bytes =
    Utilities
      .newBlob(
        json,
        "application/json"
      )
      .getBytes()
      .length;

  var reference = {
    v:
      AG24_DATASTORE_PAYLOAD_V1
        .REFERENCE_VERSION,
    fileId:
      file.getId(),
    sha256:
      AG24_SEC_sha256_(
        json
      ),
    bytes:
      bytes
  };

  var text =
    JSON.stringify(
      reference
    );

  if (
    text.length >=
    AG24_DATASTORE_PAYLOAD_V1
      .SHEET_HARD_LIMIT
  ) {
    throw new Error(
      "DATASTORE_REFERENCE_TOO_LARGE"
    );
  }

  return {
    reference:
      text,
    fileId:
      reference.fileId,
    sha256:
      reference.sha256,
    bytes:
      reference.bytes
  };
}


function AG24_DATASTORE_storeJson_(
  submissionId,
  kind,
  value
) {
  var clean =
    AG24_DATASTORE_sanitizePayload_(
      value
    );

  var json =
    AG24_DATASTORE_json_(
      clean
    );

  var hash =
    AG24_SEC_sha256_(
      json
    );

  var folder =
    AG24_DATASTORE_getSubmissionFolder_(
      submissionId
    );

  var fileName =
    AG24_DATASTORE_safeName_(
      kind
    ) +
    "-" +
    hash.slice(0, 16) +
    ".json";

  var existing =
    folder.getFilesByName(
      fileName
    );

  var file = existing.hasNext()
    ? existing.next()
    : null;

  if (!file) {
    var lastError = null;

    for (
      var attempt = 1;
      attempt <=
        AG24_DATASTORE_PAYLOAD_V1
          .STORE_RETRIES;
      attempt++
    ) {
      try {
        file =
          folder.createFile(
            fileName,
            json,
            "application/json"
          );

        break;
      } catch (error) {
        lastError = error;

        if (
          attempt <
          AG24_DATASTORE_PAYLOAD_V1
            .STORE_RETRIES
        ) {
          Utilities.sleep(
            250 * attempt
          );
        }
      }
    }

    if (!file) {
      throw (
        lastError ||
        new Error(
          "DATASTORE_PAYLOAD_CREATE_FAILED"
        )
      );
    }
  }

  var stored =
    AG24_DATASTORE_buildReference_(
      file,
      json
    );

  if (
    typeof AG24_AUDIT_event_ ===
    "function"
  ) {
    AG24_AUDIT_event_(
      "DATASTORE_PAYLOAD_EXTERNALIZED",
      {
        submissionId:
          String(
            submissionId || ""
          ).slice(0, 80),
        kind:
          String(
            kind || ""
          ).slice(0, 40),
        bytes:
          stored.bytes,
        sha256:
          stored.sha256.slice(
            0,
            16
          )
      }
    );
  }

  return {
    reference:
      stored.reference,
    fileId:
      stored.fileId,
    sha256:
      stored.sha256,
    bytes:
      stored.bytes,
    folderId:
      folder.getId()
  };
}


function AG24_DATASTORE_storeSubmissionPayloads_(
  submissionId,
  questionnaire,
  commercialProfile
) {
  var created = [];

  try {
    var questionnaireStored =
      AG24_DATASTORE_storeJson_(
        submissionId,
        "questionnaire",
        questionnaire
      );

    created.push(
      questionnaireStored.fileId
    );

    var profileStored =
      AG24_DATASTORE_storeJson_(
        submissionId,
        "commercial-profile",
        commercialProfile
      );

    created.push(
      profileStored.fileId
    );

    return {
      questionnaire:
        questionnaireStored,
      commercialProfile:
        profileStored
    };

  } catch (error) {
    created.forEach(
      function(fileId) {
        try {
          DriveApp
            .getFileById(
              fileId
            )
            .setTrashed(
              true
            );
        } catch (
          cleanupError
        ) {}
      }
    );

    throw error;
  }
}


function AG24_DATASTORE_resolveReference_(
  referenceText
) {
  var reference;

  try {
    reference =
      JSON.parse(
        String(
          referenceText || ""
        )
      );
  } catch (error) {
    throw new Error(
      "DATASTORE_REFERENCE_INVALID"
    );
  }

  if (
    !reference ||
    reference.v !==
      AG24_DATASTORE_PAYLOAD_V1
        .REFERENCE_VERSION ||
    !reference.fileId ||
    !reference.sha256
  ) {
    throw new Error(
      "DATASTORE_REFERENCE_INVALID"
    );
  }

  var file =
    DriveApp.getFileById(
      String(
        reference.fileId
      )
    );

  var json =
    file
      .getBlob()
      .getDataAsString(
        "UTF-8"
      );

  var actualHash =
    AG24_SEC_sha256_(
      json
    );

  if (
    actualHash !==
    String(
      reference.sha256
    )
  ) {
    throw new Error(
      "DATASTORE_PAYLOAD_HASH_MISMATCH"
    );
  }

  return JSON.parse(
    json
  );
}


function AG24_DATASTORE_sheetCell_(
  value,
  label
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value !==
      "string"
  ) {
    return AG24_SEC_sheetSafe_(
      value
    );
  }

  var text =
    String(value)
      .replace(
        /\u0000/g,
        ""
      );

  if (
    text.length >
    AG24_DATASTORE_PAYLOAD_V1
      .SHEET_SAFE_LIMIT
  ) {
    var originalLength =
      text.length;

    var suffix =
      "\n[… valeur CRM tronquée ; payload complet conservé dans Drive …]";

    text =
      text.slice(
        0,
        Math.max(
          0,
          AG24_DATASTORE_PAYLOAD_V1
            .SHEET_SAFE_LIMIT -
          suffix.length
        )
      ) +
      suffix;

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      AG24_AUDIT_event_(
        "DATASTORE_CELL_TRUNCATED",
        {
          field:
            String(
              label || ""
            ).slice(0, 80),
          originalChars:
            originalLength,
          storedChars:
            text.length
        }
      );
    }
  }

  text =
    AG24_SEC_sheetSafe_(
      text
    );

  if (
    String(text).length >=
    AG24_DATASTORE_PAYLOAD_V1
      .SHEET_HARD_LIMIT
  ) {
    throw new Error(
      "DATASTORE_CELL_LIMIT_GUARD_FAILED"
    );
  }

  return text;
}


/**
 * Runtime regression:
 * - persists a >50k questionnaire privately in Drive;
 * - stores only a compact reference in the sheet-shaped cell;
 * - verifies exact payload round-trip by hash;
 * - verifies any long ordinary CRM field is bounded;
 * - cleans temporary artifacts.
 */
function AG24_DATASTORE_LARGE_PAYLOAD_SYSTEM_TEST_V1() {
  var submissionId =
    "TEST-" +
    Utilities
      .getUuid();

  var report = {
    success: false,
    version:
      AG24_DATASTORE_PAYLOAD_V1
        .VERSION,
    sourceChars: 0,
    referenceChars: 0,
    referenceUnderCellLimit: false,
    roundTripExact: false,
    longCellChars: 0,
    longCellBounded: false,
    cleanupSuccess: false,
    failureCode: ""
  };

  var fileIds = [];
  var folderId = "";

  try {
    var huge =
      Array(70001).join(
        "X"
      );

    var source = {
      projectName:
        "DataStore Large Payload Test",
      longText:
        huge,
      projectBrandingToken:
        "SHOULD_NOT_BE_STORED",
      agBridge:
        "SHOULD_NOT_BE_STORED",
      logoUpload:
        "data:image/png;base64," +
        huge
    };

    var stored =
      AG24_DATASTORE_storeSubmissionPayloads_(
        submissionId,
        source,
        {
          scoreCommercial: 88,
          analysis:
            Array(55001).join(
              "Y"
            )
        }
      );

    fileIds = [
      stored.questionnaire.fileId,
      stored.commercialProfile.fileId
    ];

    folderId =
      stored.questionnaire.folderId;

    report.sourceChars =
      huge.length;

    report.referenceChars =
      stored.questionnaire
        .reference
        .length;

    report.referenceUnderCellLimit =
      report.referenceChars <
      AG24_DATASTORE_PAYLOAD_V1
        .SHEET_HARD_LIMIT;

    var resolved =
      AG24_DATASTORE_resolveReference_(
        stored.questionnaire
          .reference
      );

    report.roundTripExact =
      resolved &&
      resolved.longText ===
        huge &&
      !Object.prototype
        .hasOwnProperty.call(
          resolved,
          "projectBrandingToken"
        ) &&
      !Object.prototype
        .hasOwnProperty.call(
          resolved,
          "agBridge"
        ) &&
      !Object.prototype
        .hasOwnProperty.call(
          resolved,
          "logoUpload"
        );

    var cell =
      AG24_DATASTORE_sheetCell_(
        Array(60001).join(
          "Z"
        ),
        "synthetic"
      );

    report.longCellChars =
      String(cell).length;

    report.longCellBounded =
      report.longCellChars <=
      AG24_DATASTORE_PAYLOAD_V1
        .SHEET_SAFE_LIMIT &&
      report.longCellChars <
      AG24_DATASTORE_PAYLOAD_V1
        .SHEET_HARD_LIMIT;

    report.success =
      report.sourceChars > 50000 &&
      report.referenceUnderCellLimit &&
      report.roundTripExact &&
      report.longCellBounded;

  } catch (error) {
    report.failureCode =
      error &&
      error.message
        ? String(
            error.message
          )
        : String(
            error
          );

  } finally {
    fileIds.forEach(
      function(fileId) {
        try {
          DriveApp
            .getFileById(
              fileId
            )
            .setTrashed(
              true
            );
        } catch (
          cleanupFileError
        ) {}
      }
    );

    if (folderId) {
      try {
        DriveApp
          .getFolderById(
            folderId
          )
          .setTrashed(
            true
          );
      } catch (
        cleanupFolderError
      ) {}
    }

    var filesClean =
      fileIds.every(
        function(fileId) {
          try {
            return DriveApp
              .getFileById(
                fileId
              )
              .isTrashed() ===
              true;
          } catch (error) {
            return true;
          }
        }
      );

    report.cleanupSuccess =
      filesClean;

    report.success =
      report.success &&
      report.cleanupSuccess;

    Logger.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );

    if (
      typeof AG24_AUDIT_event_ ===
        "function"
    ) {
      AG24_AUDIT_event_(
        report.success
          ? "DATASTORE_LARGE_PAYLOAD_SYSTEM_TEST_PASSED"
          : "DATASTORE_LARGE_PAYLOAD_SYSTEM_TEST_FAILED",
        {
          sourceChars:
            report.sourceChars,
          referenceChars:
            report.referenceChars,
          longCellChars:
            report.longCellChars,
          cleanupSuccess:
            report.cleanupSuccess,
          failureCode:
            report.failureCode
        }
      );
    }
  }

  return report;
}
