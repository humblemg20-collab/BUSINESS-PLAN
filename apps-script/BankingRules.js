/**
 * AfriGreen24 — Banking Audit Rules Engine
 *
 * Rules are deterministic. Overrides can be supplied through
 * Script Property AFRIGREEN24_BANKING_RULES_JSON.
 *
 * Supported JSON shape:
 * {
 *   "default": {"minCoverageWarning": 1.2},
 *   "countries": {"CAMEROUN": {...}},
 *   "sectors": {"Agriculture": {...}}
 * }
 */

const AG24_BANKING_RULES_DEFAULTS =
  Object.freeze({
    lowGrossMarginPct: 20,
    minCoverageCritical: 1,
    minCoverageWarning: 1.2,
    lowEquityContributionPct: 10,
    highGrowthPct: 50,
    bfrVariancePct: 25
  });

function AG24_BANK_getRules_(context) {
  context =
    context &&
    typeof context === 'object'
      ? context
      : {};

  const properties =
    PropertiesService
      .getScriptProperties();

  let configuration =
    {};

  try {
    configuration =
      JSON.parse(
        properties.getProperty(
          'AFRIGREEN24_BANKING_RULES_JSON'
        ) ||
        '{}'
      ) ||
      {};
  }
  catch(error){
    configuration =
      {};
  }

  const pays =
    String(
      context.country ||
      context.pays ||
      ''
    )
    .trim()
    .toUpperCase();

  const secteur =
    String(
      context.sector ||
      context.secteur ||
      ''
    )
    .trim();

  const mergeNumeric =
    function(target, source){
      source =
        source &&
        typeof source === 'object'
          ? source
          : {};

      Object.keys(
        AG24_BANKING_RULES_DEFAULTS
      )
      .forEach(
        function(key){
          if(
            source[key] !== undefined &&
            Number.isFinite(
              Number(
                source[key]
              )
            )
          ){
            target[key] =
              Number(
                source[key]
              );
          }
        }
      );

      return target;
    };

  const rules =
    mergeNumeric(
      Object.assign(
        {},
        AG24_BANKING_RULES_DEFAULTS
      ),
      configuration.default
    );

  const countries =
    configuration.countries &&
    typeof configuration.countries === 'object'
      ? configuration.countries
      : {};

  const sectors =
    configuration.sectors &&
    typeof configuration.sectors === 'object'
      ? configuration.sectors
      : {};

  if(
    pays &&
    countries[pays]
  ){
    mergeNumeric(
      rules,
      countries[pays]
    );
  }

  if(
    secteur &&
    sectors[secteur]
  ){
    mergeNumeric(
      rules,
      sectors[secteur]
    );
  }

  rules.rulesetId =
    [
      'DEFAULT',
      pays || 'GLOBAL',
      secteur || 'ALL'
    ]
    .join(':');

  return rules;
}
