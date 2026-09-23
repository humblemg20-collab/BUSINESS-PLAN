/**
 * ============================================================
 * AFRIGREEN24 × HUMBLEOS — IMPORT BUSINESS PLAN
 * ============================================================
 *
 * À ajouter à votre fichier Bridge HumbleOS existant si vous
 * souhaitez disposer d'une fonction dédiée.
 *
 * BusinessPlanImport.gs peut aussi appeler directement
 * appelerHumbleOS_(), donc ce fichier est OPTIONNEL.
 */

function extraireBusinessPlanDepuisDocumentAvecHumbleOS(
  sourceText,
  requiredFields
) {

  var result =
    appelerHumbleOS_(
      "/extract-business-plan",
      "post",
      {
        documentType:
          "BUSINESS_PLAN_IMPORT",

        sourceText:
          String(
            sourceText || ""
          ),

        requiredFields:
          Array.isArray(
            requiredFields
          )
            ? requiredFields
            : []
      }
    );

  if (
    !result.content ||
    typeof result.content !== "object"
  ) {
    throw new Error(
      "HumbleOS n’a pas retourné l’extraction Business Plan attendue."
    );
  }

  return result.content;
}
