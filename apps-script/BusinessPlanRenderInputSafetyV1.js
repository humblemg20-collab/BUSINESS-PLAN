/**
 * ============================================================
 * BUSINESS PLAN RENDER INPUT SAFETY V1
 * ============================================================
 *
 * Canonical source data remains untouched for AI/commercial persistence.
 * This module creates a deterministic render-only copy that prevents one
 * pathological field from exceeding Google Docs/Sheets single-cell limits.
 *
 * No AI call. No mutation of the canonical input object.
 */

var AG24_BP_RENDER_INPUT_V1 = Object.freeze({
  VERSION: "1.1.0",
  MAX_LONG_FIELD_CHARS: 8000,
  MAX_SHORT_FIELD_CHARS: 600,
  MAX_EMAIL_CHARS: 320,
  MAX_NESTED_STRING_CHARS: 8000,
  MAX_DEPTH: 12,
  LONG_FIELDS: Object.freeze([
    "problem",
    "affectedPeople",
    "urgency",
    "solution",
    "valueProposition",
    "benefit",
    "targetCustomers",
    "marketArea",
    "salesChannels",
    "competitors",
    "revenueModel",
    "pricing",
    "mainCosts",
    "team",
    "useOfFunds",
    "impact",
    "risks"
  ]),
  SHORT_FIELDS: Object.freeze([
    "projectName",
    "promoterName",
    "country",
    "stage",
    "sector",
    "fundingType",
    "fundingNeed",
    "organizationSlogan",
    "projectSlogan"
  ])
});


function AG24_BP_RENDER_INPUT_boundText_(
  value,
  maximum
) {
  var text =
    String(
      value === null ||
      value === undefined
        ? ""
        : value
    )
      .replace(/\u0000/g, "")
      .trim();

  var limit =
    Math.max(
      1,
      Number(maximum || 1)
    );

  if (
    text.length <= limit
  ) {
    return {
      value: text,
      bounded: false,
      originalChars:
        text.length,
      storedChars:
        text.length
    };
  }

  var candidate =
    text.slice(
      0,
      limit
    );

  var breakAt =
    Math.max(
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf("; "),
      candidate.lastIndexOf(", "),
      candidate.lastIndexOf(" ")
    );

  if (
    breakAt >
    Math.floor(
      limit * 0.72
    )
  ) {
    candidate =
      candidate.slice(
        0,
        breakAt + 1
      );
  }

  candidate =
    candidate.trim();

  return {
    value:
      candidate,
    bounded: true,
    originalChars:
      text.length,
    storedChars:
      candidate.length
  };
}


function AG24_BP_RENDER_INPUT_deepBound_(
  value,
  path,
  depth,
  boundedFields
) {
  path =
    String(path || "root");

  depth =
    Number(depth || 0);

  boundedFields =
    boundedFields || [];

  if (
    depth >
    AG24_BP_RENDER_INPUT_V1.MAX_DEPTH
  ) {
    return null;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    Object.prototype.toString.call(
      value
    ) === "[object Date]"
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "string"
  ) {
    var result =
      AG24_BP_RENDER_INPUT_boundText_(
        value,
        AG24_BP_RENDER_INPUT_V1
          .MAX_NESTED_STRING_CHARS
      );

    if (
      result.bounded
    ) {
      boundedFields.push({
        field:
          path,
        originalChars:
          result.originalChars,
        renderChars:
          result.storedChars
      });
    }

    return result.value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      function(item, index) {
        return AG24_BP_RENDER_INPUT_deepBound_(
          item,
          path +
          "[" +
          String(index) +
          "]",
          depth + 1,
          boundedFields
        );
      }
    );
  }

  if (
    typeof value === "object"
  ) {
    var output = {};

    Object.keys(value).forEach(
      function(key) {
        /*
         * Binary/data-url payloads and browser-only transport fields never
         * belong in the render model. Branding is resolved separately.
         */
        if (
          key === "logoUpload" ||
          key === "projectBrandingToken" ||
          key === "agBridge" ||
          key === "base64" ||
          key === "dataUrl"
        ) {
          return;
        }

        output[key] =
          AG24_BP_RENDER_INPUT_deepBound_(
            value[key],
            path +
            "." +
            key,
            depth + 1,
            boundedFields
          );
      }
    );

    return output;
  }

  return String(value);
}


function AG24_BP_RENDER_INPUT_prepare_(
  canonicalData
) {
  canonicalData =
    canonicalData &&
    typeof canonicalData ===
      "object"
      ? canonicalData
      : {};

  var boundedFields = [];

  /*
   * Universal render-only boundary:
   * every string at every nesting level is bounded before any Google Docs
   * table/cell API can see it. Canonical source data remains untouched.
   */
  var copy =
    AG24_BP_RENDER_INPUT_deepBound_(
      canonicalData,
      "root",
      0,
      boundedFields
    );

  function apply_(
    field,
    maximum
  ) {
    if (
      !Object.prototype
        .hasOwnProperty.call(
          copy,
          field
        )
    ) {
      return;
    }

    var result =
      AG24_BP_RENDER_INPUT_boundText_(
        copy[field],
        maximum
      );

    copy[field] =
      result.value;

    if (
      result.bounded
    ) {
      boundedFields.push({
        field:
          field,
        originalChars:
          result.originalChars,
        renderChars:
          result.storedChars
      });
    }
  }

  AG24_BP_RENDER_INPUT_V1
    .LONG_FIELDS
    .forEach(
      function(field) {
        apply_(
          field,
          AG24_BP_RENDER_INPUT_V1
            .MAX_LONG_FIELD_CHARS
        );
      }
    );

  AG24_BP_RENDER_INPUT_V1
    .SHORT_FIELDS
    .forEach(
      function(field) {
        apply_(
          field,
          AG24_BP_RENDER_INPUT_V1
            .MAX_SHORT_FIELD_CHARS
        );
      }
    );

  apply_(
    "email",
    AG24_BP_RENDER_INPUT_V1
      .MAX_EMAIL_CHARS
  );

  var report = {
    version:
      AG24_BP_RENDER_INPUT_V1.VERSION,
    bounded:
      boundedFields.length > 0,
    boundedFieldCount:
      boundedFields.length,
    deepBoundaryApplied: true,
    maxNestedStringChars:
      AG24_BP_RENDER_INPUT_V1
        .MAX_NESTED_STRING_CHARS,
    fields:
      boundedFields
  };

  if (
    boundedFields.length &&
    typeof AG24_AUDIT_event_ ===
      "function"
  ) {
    AG24_AUDIT_event_(
      "BUSINESS_PLAN_RENDER_INPUT_BOUNDED",
      {
        boundedFieldCount:
          boundedFields.length,
        fields:
          boundedFields.map(
            function(item) {
              return {
                field:
                  item.field,
                originalChars:
                  item.originalChars,
                renderChars:
                  item.renderChars
              };
            }
          )
      }
    );
  }

  return {
    data:
      copy,
    report:
      report
  };
}


function AG24_BP_RENDER_INPUT_SYSTEM_TEST_V1() {
  var huge =
    Array(60001).join(
      "X"
    );

  var source = {
    projectName:
      huge,
    problem:
      huge,
    email:
      huge,
    solution:
      "Solution normale",
    nested: {
      mitigation:
        huge,
      deep: {
        evidence:
          huge
      }
    },
    collection: [
      {
        note:
          huge
      }
    ],
    transport: {
      base64:
        huge,
      dataUrl:
        "data:image/png;base64," +
        huge
    }
  };

  var result =
    AG24_BP_RENDER_INPUT_prepare_(
      source
    );

  var report = {
    success: false,
    version:
      AG24_BP_RENDER_INPUT_V1.VERSION,
    canonicalPreserved:
      source.problem.length ===
      huge.length,
    projectNameChars:
      String(
        result.data.projectName || ""
      ).length,
    problemChars:
      String(
        result.data.problem || ""
      ).length,
    emailChars:
      String(
        result.data.email || ""
      ).length,
    boundedFieldCount:
      result.report
        .boundedFieldCount,
    nestedMitigationChars:
      String(
        result.data.nested &&
        result.data.nested.mitigation ||
        ""
      ).length,
    deepEvidenceChars:
      String(
        result.data.nested &&
        result.data.nested.deep &&
        result.data.nested.deep.evidence ||
        ""
      ).length,
    collectionNoteChars:
      String(
        result.data.collection &&
        result.data.collection[0] &&
        result.data.collection[0].note ||
        ""
      ).length,
    transportPayloadRemoved:
      Boolean(
        result.data.transport &&
        !Object.prototype
          .hasOwnProperty.call(
            result.data.transport,
            "base64"
          ) &&
        !Object.prototype
          .hasOwnProperty.call(
            result.data.transport,
            "dataUrl"
          )
      )
  };

  report.success =
    report.canonicalPreserved === true &&
    report.projectNameChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_SHORT_FIELD_CHARS &&
    report.problemChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_LONG_FIELD_CHARS &&
    report.emailChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_EMAIL_CHARS &&
    report.nestedMitigationChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_NESTED_STRING_CHARS &&
    report.deepEvidenceChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_NESTED_STRING_CHARS &&
    report.collectionNoteChars <=
      AG24_BP_RENDER_INPUT_V1
        .MAX_NESTED_STRING_CHARS &&
    report.transportPayloadRemoved === true &&
    report.boundedFieldCount >= 6;

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}
