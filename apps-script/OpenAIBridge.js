/**
 * AfriGreen24 — OpenAI Bridge
 *
 * Production AI adapter for the Business Plan engine.
 *
 * Principles:
 * - deterministic code remains the source of truth for facts, rules and calculations;
 * - OpenAI is used only for qualitative extraction / narrative work;
 * - one OpenAI request maximum per operation;
 * - no automatic retry;
 * - API key remains in Apps Script Script Properties;
 * - responses are not stored by OpenAI (store:false);
 * - callers must keep deterministic fallbacks.
 */

const AG24_OPENAI_CONFIG = Object.freeze({
  API_URL: 'https://api.openai.com/v1/responses',
  API_KEY_PROPERTY: 'OPENAI_API_KEY',
  MODEL_PROPERTY: 'OPENAI_MODEL',
  DEFAULT_MODEL: 'gpt-5.6-luna',
  MAX_OUTPUT_TOKENS_NARRATIVE: 5200,
  MAX_OUTPUT_TOKENS_IMPORT: 6500,
  CACHE_TTL_SECONDS: 21600,
  NARRATIVE_SCHEMA_VERSION: 'ag24_bp_narrative_v3',
  IMPORT_SCHEMA_VERSION: 'ag24_bp_import_openai_v2'
});

const AG24_OPENAI_NARRATIVE_KEYS = Object.freeze([
  'resumeExecutif',
  'presentationProjet',
  'problemeOpportunite',
  'solutionProposee',
  'analyseMarche',
  'modeleEconomique',
  'strategieCommerciale',
  'equipeOperations',
  'financement',
  'impact'
]);

function AG24_OPENAI_getConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = String(
    properties.getProperty(AG24_OPENAI_CONFIG.API_KEY_PROPERTY) || ''
  ).trim();

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY absente des Script Properties. Configurez la clé OpenAI côté serveur.'
    );
  }

  const model = String(
    properties.getProperty(AG24_OPENAI_CONFIG.MODEL_PROPERTY) ||
    AG24_OPENAI_CONFIG.DEFAULT_MODEL
  ).trim();

  if (!model) {
    throw new Error('OPENAI_MODEL invalide.');
  }

  return {
    apiKey: apiKey,
    model: model
  };
}

function AG24_OPENAI_getHealthStatus_() {
  const properties =
    PropertiesService.getScriptProperties();

  const configured =
    Boolean(
      String(
        properties.getProperty(
          AG24_OPENAI_CONFIG.API_KEY_PROPERTY
        ) || ''
      ).trim()
    );

  const model =
    String(
      properties.getProperty(
        AG24_OPENAI_CONFIG.MODEL_PROPERTY
      ) ||
      AG24_OPENAI_CONFIG.DEFAULT_MODEL
    ).trim();

  return {
    success: true,
    provider: 'OPENAI',
    configured: configured,
    model: model || AG24_OPENAI_CONFIG.DEFAULT_MODEL,
    store: false
  };
}


function AG24_OPENAI_sha256_(value) {
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

function AG24_OPENAI_extractOutputText_(responseJson) {
  if (
    responseJson &&
    typeof responseJson.output_text === 'string' &&
    responseJson.output_text.trim()
  ) {
    return responseJson.output_text.trim();
  }

  const output =
    responseJson &&
    Array.isArray(responseJson.output)
      ? responseJson.output
      : [];

  for (let i = 0; i < output.length; i += 1) {
    const content =
      output[i] &&
      Array.isArray(output[i].content)
        ? output[i].content
        : [];

    for (let j = 0; j < content.length; j += 1) {
      const part = content[j] || {};
      if (
        part.type === 'output_text' &&
        typeof part.text === 'string' &&
        part.text.trim()
      ) {
        return part.text.trim();
      }
    }
  }

  return '';
}

function AG24_OPENAI_requestStructured_(options) {
  options = options || {};

  const cfg = AG24_OPENAI_getConfig_();
  const startedAt = Date.now();
  const schema = options.schema || {};
  const input = String(options.input || '');
  const instructions = String(options.instructions || '');
  const schemaName = String(options.schemaName || 'ag24_structured_output')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 64);

  const payload = {
    model: cfg.model,
    store: false,
    instructions: instructions,
    input: input,
    reasoning: {
      effort: String(options.reasoningEffort || 'low')
    },
    max_output_tokens: Math.max(
      500,
      Number(options.maxOutputTokens || 4000)
    ),
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema: schema
      }
    },
    metadata: {
      product: 'afrigreen24_business_plan',
      operation: String(options.operation || 'structured_generation').slice(0, 64)
    }
  };

  const response = UrlFetchApp.fetch(
    AG24_OPENAI_CONFIG.API_URL,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + cfg.apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const code = response.getResponseCode();
  const raw = response.getContentText();
  let json;

  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      'OpenAI a retourné une réponse non JSON (' +
      code +
      ') : ' +
      String(raw || '').slice(0, 500)
    );
  }

  if (code < 200 || code >= 300) {
    const apiMessage =
      json &&
      json.error &&
      json.error.message
        ? String(json.error.message)
        : String(raw || '').slice(0, 500);

    throw new Error(
      'OpenAI API (' + code + ') : ' + apiMessage
    );
  }

  if (
    json.status &&
    json.status !== 'completed'
  ) {
    throw new Error(
      'OpenAI response incomplète : statut ' +
      String(json.status)
    );
  }

  const outputText = AG24_OPENAI_extractOutputText_(json);

  if (!outputText) {
    throw new Error('OpenAI n’a retourné aucun contenu structuré exploitable.');
  }

  let content;

  try {
    content = JSON.parse(outputText);
  } catch (error) {
    throw new Error(
      'OpenAI a retourné un JSON structuré illisible : ' +
      outputText.slice(0, 500)
    );
  }

  const usage = json.usage || {};
  const audit = {
    operation: String(options.operation || ''),
    model: String(json.model || cfg.model),
    responseId: String(json.id || ''),
    inputHash: AG24_OPENAI_sha256_(input).slice(0, 24),
    inputTokens: Number(usage.input_tokens || 0),
    outputTokens: Number(usage.output_tokens || 0),
    totalTokens: Number(usage.total_tokens || 0),
    durationMs: Date.now() - startedAt
  };

  if (typeof AG24_AUDIT_event_ === 'function') {
    AG24_AUDIT_event_('OPENAI_REQUEST_SUCCEEDED', audit);
  }

  console.log(JSON.stringify({
    event: 'openai_request_succeeded',
    operation: audit.operation,
    model: audit.model,
    response_id: audit.responseId,
    input_hash: audit.inputHash,
    input_tokens: audit.inputTokens,
    output_tokens: audit.outputTokens,
    total_tokens: audit.totalTokens,
    duration_ms: audit.durationMs
  }));

  return {
    content: content,
    model: audit.model,
    responseId: audit.responseId,
    usage: usage,
    durationSeconds: audit.durationMs / 1000
  };
}

function AG24_OPENAI_compactBusinessPlanFacts_(rawData) {
  rawData = rawData || {};

  const allowed = [
    'projectName',
    'promoterName',
    'country',
    'stage',
    'sector',
    'problem',
    'affectedPeople',
    'urgency',
    'solution',
    'valueProposition',
    'benefit',
    'targetCustomers',
    'marketArea',
    'salesChannels',
    'competitors',
    'revenueModel',
    'pricing',
    'mainCosts',
    'team',
    'fundingType',
    'fundingNeed',
    'useOfFunds',
    'impact',
    'risks'
  ];

  const compact = {};

  allowed.forEach(function(key) {
    if (
      rawData[key] === null ||
      rawData[key] === undefined
    ) {
      return;
    }

    let value =
      typeof rawData[key] === 'string'
        ? rawData[key].trim()
        : rawData[key];

    if (typeof value === 'string') {
      value = value.slice(0, 4000);
    }

    if (
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    compact[key] = value;
  });

  return compact;
}

function AG24_OPENAI_assessNarrativeNeed_(rawData) {
  const facts = AG24_OPENAI_compactBusinessPlanFacts_(rawData);
  const values = Object.keys(facts)
    .map(function(key) {
      return typeof facts[key] === 'string'
        ? facts[key]
        : JSON.stringify(facts[key]);
    })
    .filter(Boolean);

  const totalChars = values.join(' ').length;
  const populatedFields = values.length;

  if (
    populatedFields < 6 ||
    totalChars < 260
  ) {
    return {
      useAI: false,
      reason: 'INSUFFICIENT_FACTS',
      score: 1
    };
  }

  let penalties = 0;
  let evaluated = 0;

  values.forEach(function(text) {
    const clean = String(text || '').trim();
    if (!clean) return;

    evaluated += 1;

    const letters = clean.replace(/[^A-Za-zÀ-ÿ]/g, '');
    const upper = letters.replace(/[^A-ZÀ-Þ]/g, '');
    const upperRatio =
      letters.length > 0
        ? upper.length / letters.length
        : 0;

    if (
      clean.length >= 30 &&
      upperRatio > 0.62
    ) {
      penalties += 0.22;
    }

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      penalties += 0.10;
    }

    if (
      clean.length >= 90 &&
      !/[.!?;:]/.test(clean)
    ) {
      penalties += 0.10;
    }

    if (
      /\b(truc|machin|etc\.?|je sais pas|jsp)\b/i.test(clean)
    ) {
      penalties += 0.12;
    }
  });

  const score =
    evaluated > 0
      ? Math.max(0, 1 - penalties / evaluated)
      : 1;

  return {
    useAI: score < 0.93,
    reason:
      score < 0.93
        ? 'NARRATIVE_QUALITY'
        : 'TEXT_ALREADY_PROFESSIONAL',
    score: Math.round(score * 100) / 100
  };
}

function AG24_OPENAI_assertWhiteLabelNarrative_(content) {
  const serialized =
    JSON.stringify(
      content || {}
    )
      .toLowerCase();

  const forbidden = [
    'afrigreen24',
    'afrigreen24.com',
    'powered by afrigreen',
    'généré par afrigreen',
    'genere par afrigreen'
  ];

  const found =
    forbidden.filter(
      function(marker) {
        return (
          serialized.indexOf(
            marker
          ) !== -1
        );
      }
    );

  if (found.length) {
    throw new Error(
      'OPENAI_WHITE_LABEL_CONTAMINATION: ' +
      found.join(', ')
    );
  }

  return true;
}


function AG24_OPENAI_narrativeSchema_() {
  const properties = {};
  const required = [];

  AG24_OPENAI_NARRATIVE_KEYS.forEach(function(key) {
    properties[key] = {
      type: 'string'
    };
    required.push(key);
  });

  return {
    type: 'object',
    additionalProperties: false,
    properties: properties,
    required: required
  };
}

function AG24_OPENAI_generateStandardNarrative_(rawData, extraInstructions) {
  const facts = AG24_OPENAI_compactBusinessPlanFacts_(rawData);
  const assessment = AG24_OPENAI_assessNarrativeNeed_(facts);

  if (!assessment.useAI) {
    return {
      skipped: true,
      reason: assessment.reason,
      qualityScore: assessment.score,
      narratif: {},
      model: '',
      durationSeconds: 0,
      usage: {}
    };
  }

  const cacheKey =
    'AG24AI:NARR:' +
    AG24_OPENAI_sha256_(
      JSON.stringify({
        schema: AG24_OPENAI_CONFIG.NARRATIVE_SCHEMA_VERSION,
        facts: facts,
        instructions: String(extraInstructions || '')
      })
    ).slice(0, 48);

  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);

      AG24_OPENAI_assertWhiteLabelNarrative_(
        parsed.narratif || {}
      );

      console.log(JSON.stringify({
        event: 'openai_narrative_cache_hit',
        cache_key: cacheKey.slice(-16)
      }));

      return Object.assign(
        {
          skipped: false,
          cacheHit: true,
          qualityScore: assessment.score
        },
        parsed
      );
    } catch (error) {
      // Cache corrompu : un unique appel API reste autorisé.
    }
  }

  const instructions = [
    'Tu es le rédacteur senior d’un Business Plan professionnel en marque blanche.',
    'Le document final appartient exclusivement au projet du client.',
    'N’ajoute aucune marque, plateforme, générateur, signature technique ou attribution qui ne provient pas explicitement des données du client.',
    'Travaille uniquement à partir des faits fournis dans le JSON utilisateur.',
    'N’invente aucun chiffre, client, contrat, partenaire, preuve, part de marché ou résultat.',
    'Ne transforme jamais une hypothèse en fait certain.',
    'Si une information manque, écris un texte prudent qui ne la fabrique pas, ou retourne une chaîne vide pour le bloc concerné.',
    'Rédige en français professionnel, précis, naturel, crédible et orienté financeur.',
    'Évite les superlatifs, le marketing creux, les répétitions et le ton robotique.',
    'Chaque bloc doit être autonome, concis et directement exploitable dans un Business Plan.',
    String(extraInstructions || '')
  ].filter(Boolean).join(' ');

  const result = AG24_OPENAI_requestStructured_({
    operation: 'business_plan_narrative_bundle',
    schemaName: AG24_OPENAI_CONFIG.NARRATIVE_SCHEMA_VERSION,
    schema: AG24_OPENAI_narrativeSchema_(),
    instructions: instructions,
    input: JSON.stringify({
      sourceOfTruth: 'USER_PROVIDED_FACTS',
      facts: facts
    }),
    reasoningEffort: 'low',
    maxOutputTokens: AG24_OPENAI_CONFIG.MAX_OUTPUT_TOKENS_NARRATIVE
  });

  AG24_OPENAI_assertWhiteLabelNarrative_(
    result.content || {}
  );

  const value = {
    skipped: false,
    cacheHit: false,
    reason: assessment.reason,
    qualityScore: assessment.score,
    narratif: result.content || {},
    model: result.model || '',
    durationSeconds: Number(result.durationSeconds || 0),
    usage: result.usage || {},
    responseId: result.responseId || ''
  };

  try {
    cache.put(
      cacheKey,
      JSON.stringify({
        reason: value.reason,
        narratif: value.narratif,
        model: value.model,
        durationSeconds: value.durationSeconds,
        usage: value.usage,
        responseId: value.responseId
      }),
      AG24_OPENAI_CONFIG.CACHE_TTL_SECONDS
    );
  } catch (error) {
    console.warn(
      'OpenAI narrative cache write ignored: ' +
      (error && error.message ? error.message : String(error))
    );
  }

  return value;
}

function AG24_OPENAI_importSchema_(requiredFields) {
  const fieldProperties = {};
  const required = [];

  (requiredFields || []).forEach(function(field) {
    fieldProperties[field] = {
      type: 'object',
      additionalProperties: false,
      properties: {
        value: {
          type: 'string'
        },
        evidence: {
          type: 'string'
        },
        confidence: {
          type: 'number'
        }
      },
      required: [
        'value',
        'evidence',
        'confidence'
      ]
    };
    required.push(field);
  });

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      fields: {
        type: 'object',
        additionalProperties: false,
        properties: fieldProperties,
        required: required
      }
    },
    required: [
      'fields'
    ]
  };
}

function AG24_OPENAI_extractBusinessPlan_(sourceText, requiredFields, fieldGuide) {
  const text = String(sourceText || '').trim();
  const fields = Array.isArray(requiredFields)
    ? requiredFields.slice()
    : [];

  if (!text) {
    throw new Error('Texte source absent pour l’extraction OpenAI.');
  }

  if (!fields.length) {
    throw new Error('Liste des champs attendus absente pour l’extraction OpenAI.');
  }

  const cacheKey =
    'AG24AI:IMPORT:' +
    AG24_OPENAI_sha256_(
      AG24_OPENAI_CONFIG.IMPORT_SCHEMA_VERSION +
      '|' +
      text +
      '|' +
      JSON.stringify(fields) +
      '|' +
      JSON.stringify(fieldGuide || {})
    ).slice(0, 48);

  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      parsed.cacheHit = true;
      return parsed;
    } catch (error) {
      // Ignore corrupt cache.
    }
  }

  const result = AG24_OPENAI_requestStructured_({
    operation: 'business_plan_document_extraction',
    schemaName: AG24_OPENAI_CONFIG.IMPORT_SCHEMA_VERSION,
    schema: AG24_OPENAI_importSchema_(fields),
    instructions: [
      'Extrais uniquement les informations explicitement présentes dans le document Business Plan fourni.',
      'Pour chaque champ, retourne value, evidence et confidence.',
      'Utilise fieldGuide pour comprendre précisément la signification de chaque champ.',
      'Pour les champs dont le nom se termine par Json, value doit être une chaîne JSON compacte valide correspondant exactement à la structure décrite dans fieldGuide.',
      'evidence doit être un court extrait textuel réellement présent dans la source et justifiant value.',
      'Si le champ est absent ou trop ambigu, value et evidence doivent être des chaînes vides et confidence doit être 0.',
      'N’invente rien et ne complète pas avec des connaissances externes.',
      'La confiance est un nombre entre 0 et 1.'
    ].join(' '),
    input: JSON.stringify({
      requiredFields: fields,
      fieldGuide: fieldGuide || {},
      sourceText: text
    }),
    reasoningEffort: 'low',
    maxOutputTokens: AG24_OPENAI_CONFIG.MAX_OUTPUT_TOKENS_IMPORT
  });

  const value = {
    content: result.content || {},
    model: result.model || '',
    responseId: result.responseId || '',
    usage: result.usage || {},
    durationSeconds: Number(result.durationSeconds || 0),
    cacheHit: false
  };

  try {
    cache.put(
      cacheKey,
      JSON.stringify(value),
      AG24_OPENAI_CONFIG.CACHE_TTL_SECONDS
    );
  } catch (error) {
    console.warn(
      'OpenAI import cache write ignored: ' +
      (error && error.message ? error.message : String(error))
    );
  }

  return value;
}

function AG24_OPENAI_bancableNarrativeSchema_() {
  const keys = [
    'resumeExecutif',
    'problemeSolution',
    'marchePositionnement',
    'modeleStrategie',
    'operations',
    'analyseFinanciere',
    'conclusion'
  ];

  const properties = {};
  keys.forEach(function(key) {
    properties[key] = {
      type: 'string'
    };
  });

  return {
    type: 'object',
    additionalProperties: false,
    properties: properties,
    required: keys
  };
}

function AG24_OPENAI_generateBancableNarrative_(
  rawData,
  calculatedData,
  extraInstructions
) {
  rawData = rawData || {};
  calculatedData = calculatedData || {};

  const factualChars =
    JSON.stringify(rawData).length +
    JSON.stringify(calculatedData).length;

  if (factualChars < 320) {
    return {
      skipped: true,
      reason: 'INSUFFICIENT_FACTS',
      narratif: {},
      model: '',
      usage: {},
      durationSeconds: 0
    };
  }

  const result = AG24_OPENAI_requestStructured_({
    operation: 'business_plan_funding_readiness_narrative',
    schemaName: 'ag24_bp_funding_narrative_v1',
    schema: AG24_OPENAI_bancableNarrativeSchema_(),
    instructions: [
      'Tu es un consultant senior en financement d’entreprise rédigeant un document professionnel en marque blanche.',
      'Le document final appartient exclusivement au projet du client.',
      'N’ajoute aucune marque, plateforme, générateur, signature technique ou attribution qui ne provient pas explicitement des données du client.',
      'Les données brutes sont des déclarations utilisateur ; les données calculées proviennent du moteur financier déterministe et ont priorité pour les chiffres dérivés.',
      'N’invente aucun chiffre, contrat, client, garantie, preuve, autorisation ou résultat.',
      'Ne présente jamais une hypothèse comme un fait certain.',
      'Analyse avec prudence la cohérence financière, le marché, l’exécution et la capacité de financement.',
      'Rédige en français professionnel, précis, sobre et utile à un financeur.',
      'Évite les répétitions et les superlatifs.',
      String(extraInstructions || '')
    ].filter(Boolean).join(' '),
    input: JSON.stringify({
      sourceOfTruth: {
        rawData: rawData,
        calculatedData: calculatedData
      }
    }),
    reasoningEffort: 'low',
    maxOutputTokens: AG24_OPENAI_CONFIG.MAX_OUTPUT_TOKENS_NARRATIVE
  });

  AG24_OPENAI_assertWhiteLabelNarrative_(
    result.content || {}
  );

  return {
    skipped: false,
    reason: 'FUNDING_READINESS_ANALYSIS',
    narratif: result.content || {},
    model: result.model || '',
    responseId: result.responseId || '',
    usage: result.usage || {},
    durationSeconds: Number(result.durationSeconds || 0)
  };
}


function TEST_OPENAI_BRIDGE_CONFIG_() {
  const cfg = AG24_OPENAI_getConfig_();

  Logger.log(JSON.stringify({
    success: true,
    model: cfg.model,
    apiKeyPresent: Boolean(cfg.apiKey)
  }));

  return {
    success: true,
    model: cfg.model,
    apiKeyPresent: Boolean(cfg.apiKey)
  };
}
