/**
 * AfriGreen24 — Business Plan Flow Pagination Engine V1
 *
 * Keeps the cover and Executive Snapshot as dedicated pages, then removes
 * forced semantic page breaks so the remaining Business Plan flows naturally.
 * Also removes fixed "n / 15" body labels, which are semantic labels rather
 * than reliable physical PDF page numbers once content can overflow.
 *
 * Deterministic. No AI. Idempotent.
 */
var AG24_BP_FLOW_V1 = Object.freeze({
  VERSION: "1.0.2",
  PRESERVE_HARD_BREAKS: 2,
  SEMANTIC_PAGE_LABEL_RE: /^\s*\d+\s*\/\s*15\s*$/
});

function AG24_BP_FLOW_collect_(element, state) {
  if (!element) return;
  state = state || {breaks:[], labels:[]};

  var type = null;
  try {
    type = element.getType();
  } catch (error) {}

  if (type === DocumentApp.ElementType.PAGE_BREAK) {
    state.breaks.push(element);
  }

  if (type === DocumentApp.ElementType.PARAGRAPH) {
    var paragraph = element.asParagraph();
    var text = String(paragraph.getText() || "");
    if (AG24_BP_FLOW_V1.SEMANTIC_PAGE_LABEL_RE.test(text)) {
      state.labels.push(paragraph);
    }
  }

  if (typeof element.getNumChildren === "function") {
    for (var i = 0; i < element.getNumChildren(); i++) {
      AG24_BP_FLOW_collect_(element.getChild(i), state);
    }
  }

  return state;
}

function AG24_BP_FLOW_removeElement_(element) {
  if (!element) return false;

  try {
    var parent = element.getParent();
    if (
      parent &&
      parent.getType &&
      parent.getType() === DocumentApp.ElementType.PARAGRAPH &&
      parent.getNumChildren &&
      parent.getNumChildren() === 1
    ) {
      parent.removeFromParent();
      return true;
    }
  } catch (parentError) {}

  try {
    element.removeFromParent();
    return true;
  } catch (removeError) {
    return false;
  }
}

/**
 * Google Docs can refuse to remove the terminal paragraph of a document.
 * A semantic "n / 15" label may therefore survive removeFromParent() when
 * it is the final body paragraph. In that case, clearing its text is the
 * deterministic fallback. The visual label is gone while document validity
 * is preserved.
 */
function AG24_BP_FLOW_removeLabel_(paragraph) {
  if (!paragraph) return false;

  try {
    paragraph.removeFromParent();
    return true;
  } catch (removeError) {}

  try {
    paragraph.setText("");
    return true;
  } catch (clearError) {
    return false;
  }
}

function AG24_BP_FLOW_normalizeDocument_(documentId, options) {
  options = options || {};

  var preserve = Number(
    options.preserveHardBreaks !== undefined
      ? options.preserveHardBreaks
      : AG24_BP_FLOW_V1.PRESERVE_HARD_BREAKS
  );

  preserve = Math.max(0, Math.floor(preserve));

  var document = DocumentApp.openById(String(documentId || ""));
  var body = document.getBody();
  var state = AG24_BP_FLOW_collect_(body, {breaks:[], labels:[]});

  var removedBreaks = 0;
  var removedLabels = 0;
  var sentinel = null;

  /*
   * Google Docs protects the terminal body paragraph. When the last semantic
   * "15 / 15" label is the terminal paragraph, removeFromParent() can fail.
   * Append a temporary terminal sentinel first so every semantic label becomes
   * safely removable. The sentinel is then reduced to a zero-height-ish blank.
   */
  if (state.labels.length) {
    sentinel = body.appendParagraph("");
    try {
      sentinel
        .setFontSize(1)
        .setSpacingBefore(0)
        .setSpacingAfter(0)
        .setLineSpacing(1);
    } catch (sentinelStyleError) {}
  }

  /*
   * Remove from the end so document child indices remain stable.
   * The first two hard breaks belong to Cover -> Snapshot -> Body.
   */
  for (var i = state.breaks.length - 1; i >= preserve; i--) {
    if (AG24_BP_FLOW_removeElement_(state.breaks[i])) removedBreaks++;
  }

  for (var j = state.labels.length - 1; j >= 0; j--) {
    if (AG24_BP_FLOW_removeLabel_(state.labels[j])) {
      removedLabels++;
    }
  }

  /*
   * Keep the sentinel as the mandatory terminal paragraph required by Docs.
   * It contains no text and has minimal spacing, so it does not create a
   * visible semantic page or label.
   */
  if (sentinel) {
    try {
      sentinel
        .setText("")
        .setFontSize(1)
        .setSpacingBefore(0)
        .setSpacingAfter(0)
        .setLineSpacing(1);
    } catch (sentinelFinalizeError) {}
  }

  document.saveAndClose();

  var report = {
    success: true,
    version: AG24_BP_FLOW_V1.VERSION,
    preserveHardBreaks: preserve,
    hardBreaksBefore: state.breaks.length,
    hardBreaksRemoved: removedBreaks,
    semanticLabelsDetected: state.labels.length,
    semanticLabelsRemoved: removedLabels,
    terminalSentinelApplied: Boolean(sentinel),
    paginationMode: "FLOW"
  };

  if (typeof AG24_AUDIT_event_ === "function") {
    try {
      AG24_AUDIT_event_("BUSINESS_PLAN_FLOW_PAGINATION_APPLIED", report);
    } catch (auditError) {}
  }

  return report;
}

function AG24_BP_FLOW_PAGINATION_SYSTEM_TEST_V1() {
  var documentId = "";
  var report = {
    success: false,
    explicitPageBreaksAfter: 0,
    fixedLabelsAfter: 0,
    cleanupSuccess: false,
    failureCode: ""
  };

  try {
    var doc = DocumentApp.create(
      "AG24 Flow Pagination Test " + String(new Date().getTime())
    );
    documentId = doc.getId();
    var body = doc.getBody();

    for (var page = 1; page <= 15; page++) {
      body.appendParagraph("SECTION TEST " + page);
      body.appendParagraph(page + " / 15");
      if (page < 15) body.appendPageBreak();
    }

    doc.saveAndClose();

    var normalized = AG24_BP_FLOW_normalizeDocument_(documentId, {
      preserveHardBreaks: 2
    });

    var reopened = DocumentApp.openById(documentId);
    var after = AG24_BP_FLOW_collect_(
      reopened.getBody(),
      {breaks:[], labels:[]}
    );

    report.explicitPageBreaksAfter = after.breaks.length;
    report.fixedLabelsAfter = after.labels.length;
    report.remainingLabelTexts = after.labels.map(function(label) {
      try {
        return String(label.getText() || "");
      } catch (error) {
        return "";
      }
    });
    report.success =
      normalized.success === true &&
      report.explicitPageBreaksAfter === 2 &&
      report.fixedLabelsAfter === 0;

    reopened.saveAndClose();

    if (!report.success) {
      report.failureCode = "FLOW_PAGINATION_CONTRACT_FAILED";
    }
  } catch (error) {
    report.failureCode = error && error.message
      ? String(error.message)
      : String(error);
  } finally {
    if (documentId) {
      try {
        var file = DriveApp.getFileById(documentId);
        file.setTrashed(true);
        report.cleanupSuccess = file.isTrashed() === true;
      } catch (cleanupError) {
        report.cleanupSuccess = false;
      }
    }

    report.success = report.success && report.cleanupSuccess;
    Logger.log(JSON.stringify(report, null, 2));
  }

  return report;
}
