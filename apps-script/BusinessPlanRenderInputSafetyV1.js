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
  VERSION: "1.0.0",
  MAX_LONG_FIELD_CHARS: 8000,
  MAX_SHORT_FIELD_CHARS: 600,
  MAX_EMAIL_CHARS: 320,
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


function AG24_BP_RENDER_INPUT_prepare_(
  canonicalData
) {
  canonicalData =
    canonicalData &&
    typeof canonicalData ===
      "object"
      ? canonicalData
      : {};

  var copy =
    JSON.parse(
      JSON.stringify(
        canonicalData
      )
    );

  var boundedFields = [];

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
      "Solution normale"
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
        .boundedFieldCount
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
    report.boundedFieldCount === 3;

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}
