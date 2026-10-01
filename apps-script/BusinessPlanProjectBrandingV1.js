/**
 * ============================================================
 * BUSINESS PLAN PROJECT BRANDING STORE V1
 * ============================================================
 *
 * Transformation:
 * - a project uploads its visual identity once;
 * - subsequent Business Plan generations reuse it automatically;
 * - the final document remains fully white-label.
 *
 * Security model:
 * - browser holds an opaque high-entropy capability token;
 * - server stores only a SHA-256-derived folder key;
 * - token is never written to Drive metadata or logs;
 * - logo files remain private in Drive;
 * - no AfriGreen24 branding is ever injected into customer documents.
 *
 * Canonical store:
 * OUTPUT ROOT
 *   / AG24 Project Branding
 *       / project-<sha256(token)>
 *           branding.json
 *           client-logo.<ext>
 */

var AG24_BP_PROJECT_BRANDING_V1 = Object.freeze({
  VERSION: "1.0.0",
  ROOT_FOLDER_NAME:
    "AG24 Project Branding",
  PROJECT_FOLDER_PREFIX:
    "project-",
  METADATA_FILE_NAME:
    "branding.json",
  OUTPUT_FOLDER_PROPERTY:
    "AFRIGREEN24_BPB_OUTPUT_FOLDER_ID",
  MAX_LOGO_BYTES:
    2 * 1024 * 1024,
  ALLOWED_MIME_TYPES:
    Object.freeze([
      "image/png",
      "image/jpeg"
    ])
});


function AG24_BP_BRANDING_text_(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(
      /[\u0000-\u001F\u007F]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function AG24_BP_BRANDING_capability_() {
  var material =
    [
      Utilities.getUuid(),
      Utilities.getUuid(),
      String(
        new Date().getTime()
      ),
      String(
        Math.random()
      )
    ].join("|");

  if (
    typeof AG24_SEC_sha256_ !==
    "function"
  ) {
    throw new Error(
      "PROJECT_BRANDING_SECURITY_UNAVAILABLE"
    );
  }

  return AG24_SEC_sha256_(
    material
  );
}


function AG24_BP_BRANDING_normalizeToken_(
  token
) {
  var clean =
    String(
      token || ""
    )
      .trim()
      .toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(
      clean
    )
  ) {
    throw new Error(
      "PROJECT_BRANDING_CAPABILITY_INVALID"
    );
  }

  return clean;
}


function AG24_BP_BRANDING_tokenHash_(
  token
) {
  return AG24_SEC_sha256_(
    AG24_BP_BRANDING_normalizeToken_(
      token
    )
  );
}


function AG24_BP_BRANDING_outputRoot_() {
  var configuredId =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AG24_BP_PROJECT_BRANDING_V1
          .OUTPUT_FOLDER_PROPERTY
      );

  if (configuredId) {
    try {
      return DriveApp
        .getFolderById(
          String(
            configuredId
          ).trim()
        );
    } catch (error) {
      if (
        typeof AG24_AUDIT_event_ ===
        "function"
      ) {
        AG24_AUDIT_event_(
          "PROJECT_BRANDING_OUTPUT_ROOT_FALLBACK",
          {
            reason:
              "CONFIGURED_FOLDER_UNAVAILABLE"
          }
        );
      }
    }
  }

  return DriveApp.getRootFolder();
}


function AG24_BP_BRANDING_rootFolder_() {
  var parent =
    AG24_BP_BRANDING_outputRoot_();

  var folders =
    parent.getFoldersByName(
      AG24_BP_PROJECT_BRANDING_V1
        .ROOT_FOLDER_NAME
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  var lock =
    LockService.getScriptLock();

  lock.waitLock(
    5000
  );

  try {
    folders =
      parent.getFoldersByName(
        AG24_BP_PROJECT_BRANDING_V1
          .ROOT_FOLDER_NAME
      );

    if (folders.hasNext()) {
      return folders.next();
    }

    return parent.createFolder(
      AG24_BP_PROJECT_BRANDING_V1
        .ROOT_FOLDER_NAME
    );
  } finally {
    lock.releaseLock();
  }
}


function AG24_BP_BRANDING_projectFolderName_(
  token
) {
  return (
    AG24_BP_PROJECT_BRANDING_V1
      .PROJECT_FOLDER_PREFIX +
    AG24_BP_BRANDING_tokenHash_(
      token
    )
  );
}


function AG24_BP_BRANDING_projectFolder_(
  token,
  createIfMissing
) {
  var root =
    AG24_BP_BRANDING_rootFolder_();

  var name =
    AG24_BP_BRANDING_projectFolderName_(
      token
    );

  var folders =
    root.getFoldersByName(
      name
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  if (!createIfMissing) {
    return null;
  }

  var lock =
    LockService.getScriptLock();

  lock.waitLock(
    5000
  );

  try {
    folders =
      root.getFoldersByName(
        name
      );

    if (folders.hasNext()) {
      return folders.next();
    }

    return root.createFolder(
      name
    );
  } finally {
    lock.releaseLock();
  }
}


function AG24_BP_BRANDING_readMetadata_(
  folder
) {
  if (!folder) {
    return null;
  }

  var files =
    folder.getFilesByName(
      AG24_BP_PROJECT_BRANDING_V1
        .METADATA_FILE_NAME
    );

  if (!files.hasNext()) {
    return null;
  }

  var file =
    files.next();

  try {
    var parsed =
      JSON.parse(
        file
          .getBlob()
          .getDataAsString(
            "UTF-8"
          )
      );

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    throw new Error(
      "PROJECT_BRANDING_METADATA_INVALID"
    );
  }
}


function AG24_BP_BRANDING_writeMetadata_(
  folder,
  metadata
) {
  var serialized =
    JSON.stringify(
      metadata,
      null,
      2
    );

  var files =
    folder.getFilesByName(
      AG24_BP_PROJECT_BRANDING_V1
        .METADATA_FILE_NAME
    );

  if (files.hasNext()) {
    var file =
      files.next();

    file.setContent(
      serialized
    );

    while (
      files.hasNext()
    ) {
      files.next()
        .setTrashed(
          true
        );
    }

    return file;
  }

  return folder.createFile(
    AG24_BP_PROJECT_BRANDING_V1
      .METADATA_FILE_NAME,
    serialized,
    MimeType.PLAIN_TEXT
  );
}


function AG24_BP_BRANDING_extension_(
  mimeType
) {
  return (
    mimeType === "image/png"
      ? "png"
      : "jpg"
  );
}


function AG24_BP_BRANDING_assertImageSignature_(
  bytes,
  mimeType
) {
  bytes = bytes || [];

  function unsigned(
    value
  ) {
    return (
      value < 0
        ? value + 256
        : value
    );
  }

  if (
    mimeType ===
      "image/png"
  ) {
    var png = [
      0x89,
      0x50,
      0x4E,
      0x47,
      0x0D,
      0x0A,
      0x1A,
      0x0A
    ];

    if (
      bytes.length <
      png.length
    ) {
      throw new Error(
        "PROJECT_BRANDING_LOGO_SIGNATURE_INVALID"
      );
    }

    for (
      var index = 0;
      index < png.length;
      index++
    ) {
      if (
        unsigned(
          bytes[index]
        ) !==
        png[index]
      ) {
        throw new Error(
          "PROJECT_BRANDING_LOGO_SIGNATURE_INVALID"
        );
      }
    }

    return true;
  }

  if (
    mimeType ===
      "image/jpeg"
  ) {
    if (
      bytes.length < 3 ||
      unsigned(
        bytes[0]
      ) !== 0xFF ||
      unsigned(
        bytes[1]
      ) !== 0xD8 ||
      unsigned(
        bytes[2]
      ) !== 0xFF
    ) {
      throw new Error(
        "PROJECT_BRANDING_LOGO_SIGNATURE_INVALID"
      );
    }

    return true;
  }

  throw new Error(
    "PROJECT_BRANDING_LOGO_MIME_INVALID"
  );
}


function AG24_BP_BRANDING_logoBlob_(
  logoUpload
) {
  if (
    !logoUpload ||
    typeof logoUpload !==
      "object"
  ) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_REQUIRED"
    );
  }

  var dataUrl =
    String(
      logoUpload.dataUrl || ""
    ).trim();

  var match =
    dataUrl.match(
      /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/i
    );

  if (!match) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_FORMAT_INVALID"
    );
  }

  var mimeType =
    String(
      match[1]
    ).toLowerCase();

  if (
    AG24_BP_PROJECT_BRANDING_V1
      .ALLOWED_MIME_TYPES
      .indexOf(
        mimeType
      ) === -1
  ) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_MIME_INVALID"
    );
  }

  var bytes;

  try {
    bytes =
      Utilities.base64Decode(
        String(
          match[2]
        ).replace(
          /\s+/g,
          ""
        )
      );
  } catch (error) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_BASE64_INVALID"
    );
  }

  if (
    !bytes.length ||
    bytes.length >
      AG24_BP_PROJECT_BRANDING_V1
        .MAX_LOGO_BYTES
  ) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_SIZE_INVALID"
    );
  }

  AG24_BP_BRANDING_assertImageSignature_(
    bytes,
    mimeType
  );

  var safeName =
    AG24_BP_BRANDING_text_(
      logoUpload.name
    )
      .replace(
        /[^A-Za-z0-9._-]+/g,
        "-"
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        ""
      )
      .slice(
        0,
        80
      ) ||
    (
      "client-logo." +
      AG24_BP_BRANDING_extension_(
        mimeType
      )
    );

  return {
    blob:
      Utilities.newBlob(
        bytes,
        mimeType,
        safeName
      ),
    mimeType:
      mimeType,
    name:
      safeName,
    bytes:
      bytes.length
  };
}


function AG24_BP_BRANDING_logoUploadFromFile_(
  fileId
) {
  var id =
    String(
      fileId || ""
    ).trim();

  if (!id) {
    return null;
  }

  var file;

  try {
    file =
      DriveApp.getFileById(
        id
      );
  } catch (error) {
    return null;
  }

  if (
    file.isTrashed()
  ) {
    return null;
  }

  var mimeType =
    String(
      file.getMimeType() || ""
    ).toLowerCase();

  if (
    AG24_BP_PROJECT_BRANDING_V1
      .ALLOWED_MIME_TYPES
      .indexOf(
        mimeType
      ) === -1
  ) {
    return null;
  }

  var blob =
    file.getBlob();

  var bytes =
    blob.getBytes();

  if (
    !bytes.length ||
    bytes.length >
      AG24_BP_PROJECT_BRANDING_V1
        .MAX_LOGO_BYTES
  ) {
    return null;
  }

  try {
    AG24_BP_BRANDING_assertImageSignature_(
      bytes,
      mimeType
    );
  } catch (error) {
    return null;
  }

  return {
    dataUrl:
      "data:" +
      mimeType +
      ";base64," +
      Utilities.base64Encode(
        bytes
      ),
    mimeType:
      mimeType,
    name:
      AG24_BP_BRANDING_text_(
        file.getName()
      ) ||
      "client-logo"
  };
}


function AG24_BP_BRANDING_publicRecord_(
  metadata,
  includeLogo
) {
  metadata =
    metadata || {};

  var logoUpload = null;

  if (
    includeLogo &&
    metadata.logoFileId
  ) {
    logoUpload =
      AG24_BP_BRANDING_logoUploadFromFile_(
        metadata.logoFileId
      );
  }

  return {
    found:
      true,
    version:
      AG24_BP_PROJECT_BRANDING_V1
        .VERSION,
    hasLogo:
      includeLogo
        ? Boolean(
            logoUpload
          )
        : Boolean(
            metadata.logoFileId
          ),
    logoUpload:
      logoUpload,
    slogan:
      AG24_BP_BRANDING_text_(
        metadata.slogan
      ),
    updatedAt:
      String(
        metadata.updatedAt || ""
      )
  };
}


function AG24_BP_BRANDING_identityHash_(
  identity
) {
  identity =
    identity &&
    typeof identity === "object"
      ? identity
      : {};

  var parts = [
    AG24_BP_BRANDING_text_(
      identity.projectName
    ).toLowerCase(),
    AG24_BP_BRANDING_text_(
      identity.promoterName
    ).toLowerCase(),
    AG24_BP_BRANDING_text_(
      identity.country
    ).toLowerCase()
  ];

  var hasIdentity =
    parts.some(
      function(value) {
        return Boolean(
          value
        );
      }
    );

  if (!hasIdentity) {
    return "";
  }

  return AG24_SEC_sha256_(
    parts.join("|")
  );
}


function AG24_BP_BRANDING_replaceLogo_(
  folder,
  metadata,
  logoUpload
) {
  var parsed =
    AG24_BP_BRANDING_logoBlob_(
      logoUpload
    );

  var extension =
    AG24_BP_BRANDING_extension_(
      parsed.mimeType
    );

  var newFile =
    folder.createFile(
      parsed.blob
        .setName(
          "client-logo-" +
          String(
            new Date().getTime()
          ) +
          "." +
          extension
        )
    );

  var oldFileId =
    String(
      metadata.logoFileId || ""
    ).trim();

  metadata.logoFileId =
    newFile.getId();

  metadata.logoMimeType =
    parsed.mimeType;

  metadata.logoName =
    parsed.name;

  metadata.logoBytes =
    parsed.bytes;

  if (oldFileId) {
    try {
      var oldFile =
        DriveApp.getFileById(
          oldFileId
        );

      if (
        !oldFile.isTrashed()
      ) {
        oldFile.setTrashed(
          true
        );
      }
    } catch (error) {
      // New canonical logo is already safely stored.
    }
  }

  return metadata;
}


function AG24_BP_BRANDING_removeLogo_(
  metadata
) {
  var oldFileId =
    String(
      metadata.logoFileId || ""
    ).trim();

  if (oldFileId) {
    try {
      var oldFile =
        DriveApp.getFileById(
          oldFileId
        );

      if (
        !oldFile.isTrashed()
      ) {
        oldFile.setTrashed(
          true
        );
      }
    } catch (error) {
      // Metadata is still cleared deterministically.
    }
  }

  metadata.logoFileId = "";
  metadata.logoMimeType = "";
  metadata.logoName = "";
  metadata.logoBytes = 0;

  return metadata;
}


function AG24_BP_BRANDING_loadInternal_(
  token,
  includeLogo
) {
  var cleanToken =
    AG24_BP_BRANDING_normalizeToken_(
      token
    );

  var folder =
    AG24_BP_BRANDING_projectFolder_(
      cleanToken,
      false
    );

  if (!folder) {
    return null;
  }

  var metadata =
    AG24_BP_BRANDING_readMetadata_(
      folder
    );

  if (!metadata) {
    return null;
  }

  return AG24_BP_BRANDING_publicRecord_(
    metadata,
    includeLogo === true
  );
}


/**
 * Canonical resolver used by the production renderer.
 * This avoids resending a 2 MB logo in every generation request.
 */
function AG24_BP_PROJECT_BRANDING_resolveForGeneration_(
  token
) {
  var record =
    AG24_BP_BRANDING_loadInternal_(
      token,
      true
    );

  if (!record) {
    return {
      found: false,
      logoUpload: null,
      slogan: ""
    };
  }

  return {
    found: true,
    logoUpload:
      record.logoUpload || null,
    slogan:
      record.slogan || ""
  };
}


/**
 * Browser RPC: load an existing branding record by capability.
 */
function AG24_BP_PROJECT_BRANDING_GET_V1(
  token
) {
  var cleanToken =
    AG24_BP_BRANDING_normalizeToken_(
      token
    );

  if (
    typeof AG24_SEC_assertRateLimit_ ===
    "function"
  ) {
    AG24_SEC_assertRateLimit_(
      "project-branding-get",
      AG24_BP_BRANDING_tokenHash_(
        cleanToken
      ).slice(
        0,
        16
      ),
      60,
      900
    );
  }

  var record =
    AG24_BP_BRANDING_loadInternal_(
      cleanToken,
      true
    );

  if (!record) {
    return {
      success: true,
      found: false,
      version:
        AG24_BP_PROJECT_BRANDING_V1
          .VERSION
    };
  }

  record.success = true;

  return record;
}


/**
 * Browser RPC: create/update one canonical project branding record.
 *
 * request.logoAction:
 * - keep
 * - replace
 * - remove
 */
function AG24_BP_PROJECT_BRANDING_SAVE_V1(
  request
) {
  request =
    request &&
    typeof request === "object"
      ? request
      : {};

  var token =
    String(
      request.token || ""
    ).trim();

  var isNew =
    !token;

  if (isNew) {
    token =
      AG24_BP_BRANDING_capability_();
  } else {
    token =
      AG24_BP_BRANDING_normalizeToken_(
        token
      );
  }

  if (
    typeof AG24_SEC_assertRateLimit_ ===
    "function"
  ) {
    AG24_SEC_assertRateLimit_(
      "project-branding-save",
      AG24_BP_BRANDING_tokenHash_(
        token
      ).slice(
        0,
        16
      ),
      20,
      900
    );
  }

  var action =
    String(
      request.logoAction ||
      "keep"
    )
      .trim()
      .toLowerCase();

  if (
    [
      "keep",
      "replace",
      "remove"
    ].indexOf(
      action
    ) === -1
  ) {
    throw new Error(
      "PROJECT_BRANDING_LOGO_ACTION_INVALID"
    );
  }

  var folder =
    AG24_BP_BRANDING_projectFolder_(
      token,
      true
    );

  var lock =
    LockService.getScriptLock();

  lock.waitLock(
    10000
  );

  try {
    var existing =
      AG24_BP_BRANDING_readMetadata_(
        folder
      );

    var now =
      new Date().toISOString();

    var metadata =
      existing || {
        version:
          AG24_BP_PROJECT_BRANDING_V1
            .VERSION,
        createdAt:
          now,
        logoFileId:
          "",
        logoMimeType:
          "",
        logoName:
          "",
        logoBytes:
          0,
        slogan:
          "",
        projectIdentityHash:
          ""
      };

    metadata.version =
      AG24_BP_PROJECT_BRANDING_V1
        .VERSION;

    metadata.updatedAt =
      now;

    metadata.slogan =
      AG24_BP_BRANDING_text_(
        request.slogan
      ).slice(
        0,
        140
      );

    var identityHash =
      AG24_BP_BRANDING_identityHash_(
        request.projectIdentity
      );

    if (identityHash) {
      metadata.projectIdentityHash =
        identityHash;
    }

    if (
      action ===
        "replace"
    ) {
      AG24_BP_BRANDING_replaceLogo_(
        folder,
        metadata,
        request.logoUpload
      );
    } else if (
      action ===
        "remove"
    ) {
      AG24_BP_BRANDING_removeLogo_(
        metadata
      );
    }

    AG24_BP_BRANDING_writeMetadata_(
      folder,
      metadata
    );

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      AG24_AUDIT_event_(
        isNew
          ? "PROJECT_BRANDING_CREATED"
          : "PROJECT_BRANDING_UPDATED",
        {
          hasLogo:
            Boolean(
              metadata.logoFileId
            ),
          logoAction:
            action,
          hasSlogan:
            Boolean(
              metadata.slogan
            ),
          projectIdentityHash:
            String(
              metadata.projectIdentityHash ||
              ""
            ).slice(
              0,
              16
            )
        }
      );
    }

    return {
      success: true,
      version:
        AG24_BP_PROJECT_BRANDING_V1
          .VERSION,
      token:
        token,
      hasLogo:
        Boolean(
          metadata.logoFileId
        ),
      slogan:
        metadata.slogan,
      updatedAt:
        metadata.updatedAt
    };
  } finally {
    lock.releaseLock();
  }
}


function AG24_BP_BRANDING_deleteInternal_(
  token
) {
  var cleanToken =
    AG24_BP_BRANDING_normalizeToken_(
      token
    );

  var folder =
    AG24_BP_BRANDING_projectFolder_(
      cleanToken,
      false
    );

  if (!folder) {
    return {
      success: true,
      skipped: true
    };
  }

  folder.setTrashed(
    true
  );

  return {
    success:
      folder.isTrashed() ===
      true,
    skipped: false
  };
}


/**
 * Isolated Drive round-trip test.
 * Creates one synthetic project-branding record, verifies it, removes the
 * logo, verifies again, then trashes the entire synthetic project folder.
 */
function AG24_BP_PROJECT_BRANDING_SYSTEM_TEST_V1() {
  var token = "";
  var report = {
    success: false,
    version:
      AG24_BP_PROJECT_BRANDING_V1
        .VERSION,
    created: false,
    loaded: false,
    logoRoundTrip: false,
    sloganRoundTrip: false,
    productionResolverValid: false,
    identityHashPreserved: false,
    logoRemoved: false,
    cleanupSuccess: false,
    failureCode: ""
  };

  try {
    var onePixelPng =
      "data:image/png;base64," +
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC" +
      "AAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    var created =
      AG24_BP_PROJECT_BRANDING_SAVE_V1({
        slogan:
          "Synthetic project slogan",
        logoAction:
          "replace",
        logoUpload: {
          dataUrl:
            onePixelPng,
          mimeType:
            "image/png",
          name:
            "synthetic-logo.png"
        },
        projectIdentity: {
          projectName:
            "Synthetic Branding Test",
          promoterName:
            "Internal Test",
          country:
            "Test"
        }
      });

    token =
      String(
        created &&
        created.token ||
        ""
      );

    report.created =
      Boolean(
        created &&
        created.success === true &&
        token
      );

    var loaded =
      AG24_BP_PROJECT_BRANDING_GET_V1(
        token
      );

    report.loaded =
      Boolean(
        loaded &&
        loaded.success === true &&
        loaded.found === true
      );

    report.logoRoundTrip =
      Boolean(
        loaded &&
        loaded.logoUpload &&
        String(
          loaded.logoUpload.dataUrl ||
          ""
        ).indexOf(
          "data:image/png;base64,"
        ) === 0
      );

    report.sloganRoundTrip =
      Boolean(
        loaded &&
        loaded.slogan ===
          "Synthetic project slogan"
      );

    if (
      typeof extraireBrandingBusinessPlan_ !==
      "function"
    ) {
      throw new Error(
        "PROJECT_BRANDING_PRODUCTION_RESOLVER_UNAVAILABLE"
      );
    }

    var resolved =
      extraireBrandingBusinessPlan_({
        projectBrandingToken:
          token,
        documentTheme:
          "executive_premium"
      });

    report.productionResolverValid =
      Boolean(
        resolved &&
        resolved.logoUpload &&
        String(
          resolved.logoUpload.dataUrl ||
          ""
        ).indexOf(
          "data:image/png;base64,"
        ) === 0 &&
        resolved.slogan ===
          "Synthetic project slogan" &&
        resolved.projectBrandingToken ===
          token
      );

    var projectFolderBeforeRemove =
      AG24_BP_BRANDING_projectFolder_(
        token,
        false
      );

    var metadataBeforeRemove =
      AG24_BP_BRANDING_readMetadata_(
        projectFolderBeforeRemove
      );

    var identityHashBeforeRemove =
      String(
        metadataBeforeRemove &&
        metadataBeforeRemove.projectIdentityHash ||
        ""
      );

    AG24_BP_PROJECT_BRANDING_SAVE_V1({
      token:
        token,
      slogan:
        "Synthetic project slogan",
      logoAction:
        "remove"
    });

    var metadataAfterRemove =
      AG24_BP_BRANDING_readMetadata_(
        projectFolderBeforeRemove
      );

    report.identityHashPreserved =
      Boolean(
        identityHashBeforeRemove &&
        metadataAfterRemove &&
        String(
          metadataAfterRemove.projectIdentityHash ||
          ""
        ) ===
          identityHashBeforeRemove
      );

    var afterRemove =
      AG24_BP_PROJECT_BRANDING_GET_V1(
        token
      );

    report.logoRemoved =
      Boolean(
        afterRemove &&
        afterRemove.found === true &&
        afterRemove.hasLogo ===
          false &&
        !afterRemove.logoUpload
      );

    report.success =
      report.created &&
      report.loaded &&
      report.logoRoundTrip &&
      report.sloganRoundTrip &&
      report.productionResolverValid &&
      report.identityHashPreserved &&
      report.logoRemoved;

    if (!report.success) {
      throw new Error(
        "PROJECT_BRANDING_TEST_CONTRACT_FAILED"
      );
    }

    return report;

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

    return report;

  } finally {
    if (token) {
      try {
        var cleanup =
          AG24_BP_BRANDING_deleteInternal_(
            token
          );

        report.cleanupSuccess =
          Boolean(
            cleanup &&
            cleanup.success === true
          );
      } catch (
        cleanupError
      ) {
        report.cleanupSuccess =
          false;
      }
    }

    if (
      typeof AG24_AUDIT_event_ ===
      "function"
    ) {
      try {
        AG24_AUDIT_event_(
          report.success &&
          report.cleanupSuccess
            ? "PROJECT_BRANDING_SYSTEM_TEST_PASSED"
            : "PROJECT_BRANDING_SYSTEM_TEST_FAILED",
          {
            success:
              report.success,
            cleanupSuccess:
              report.cleanupSuccess,
            failureCode:
              report.failureCode
          }
        );
      } catch (
        auditError
      ) {
        // Test report remains authoritative.
      }
    }

    Logger.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );
  }
}
