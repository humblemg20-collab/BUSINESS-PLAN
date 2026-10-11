/**
 * AfriGreen24 — Premium Financial Story V1
 * Deterministic metric model for premium documents.
 */
var AG24_PREMIUM_FIN_V1 = Object.freeze({
  VERSION: "1.1.0",
  MAX_METRICS: 6
});

function AG24_PREMIUM_FIN_num_(v) {
  if (v === null || v === undefined || v === "") return null;
  var x = typeof v === "string"
    ? v.replace(/\s/g, "").replace(/[^0-9,.-]/g, "").replace(",", ".")
    : v;
  var n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function AG24_PREMIUM_FIN_first_(data, keys) {
  data = data || {};
  for (var i = 0; i < keys.length; i++) {
    var v = data[keys[i]];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return null;
}

function AG24_PREMIUM_FIN_compact_(n) {
  n = AG24_PREMIUM_FIN_num_(n);
  if (n === null) return "";
  var a = Math.abs(n);
  if (a >= 1000000) return (n / 1000000).toFixed(1).replace(".0","") + "M";
  if (a >= 1000) return (n / 1000).toFixed(1).replace(".0","") + "k";
  return String(Math.round(n * 100) / 100);
}

function AG24_PREMIUM_FIN_money_(n, currency) {
  n = AG24_PREMIUM_FIN_num_(n);
  if (n === null) return "";

  var c = String(currency || "")
    .replace(/\s+/g," ")
    .trim()
    .toUpperCase();

  if (
    typeof AG24_PREMIUM_HARDEN_currency_ ===
      "function"
  ) {
    c = AG24_PREMIUM_HARDEN_currency_(c);
  }

  if (!c) {
    return (
      AG24_PREMIUM_FIN_compact_(n) +
      " — devise à confirmer"
    );
  }

  var s =
    c === "EUR"
      ? "€"
      : c === "USD"
        ? "$"
        : (
            c === "XAF" ||
            c === "XOF" ||
            c === "FCFA"
          )
          ? "FCFA "
          : c + " ";

  return s + AG24_PREMIUM_FIN_compact_(n);
}

function AG24_PREMIUM_FIN_buildStory_(data) {
  data = data || {};
  var currency = AG24_PREMIUM_FIN_first_(data, [
    "currency","financialCurrency","fundingCurrency"
  ]) || "";

  if (
    typeof AG24_PREMIUM_HARDEN_currency_ ===
      "function"
  ) {
    currency =
      AG24_PREMIUM_HARDEN_currency_(
        currency
      );
  }

  var mrr = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, [
      "mrr","monthlyRecurringRevenue","monthlyRevenue"
    ])
  );

  var arr = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, [
      "arr","annualRecurringRevenue","annualRevenue"
    ])
  );

  var arrStatus = arr !== null ? "DECLARED" : "MISSING";
  if (arr === null && mrr !== null) {
    arr = Math.round(mrr * 12 * 100) / 100;
    arrStatus = "CALCULATED";
  }

  var metrics = [];
  function add(id, label, value, status) {
    if (!value) return;
    metrics.push({
      id:id,
      label:label,
      value:value,
      truthStatus:status || "DECLARED"
    });
  }

  var customers = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, [
      "payingCustomers","customers","activeCustomers"
    ])
  );
  if (customers !== null) add(
    "customers","Clients payants",AG24_PREMIUM_FIN_compact_(customers),"DECLARED"
  );

  if (mrr !== null) add("mrr","MRR",AG24_PREMIUM_FIN_money_(mrr,currency),"DECLARED");
  if (arr !== null) add("arr","ARR",AG24_PREMIUM_FIN_money_(arr,currency),arrStatus);

  var revenue = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, [
      "revenueToDate","historicalRevenue","revenueYtd"
    ])
  );
  if (revenue !== null) add(
    "revenue","Revenus réalisés",AG24_PREMIUM_FIN_money_(revenue,currency),"DECLARED"
  );

  var margin = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, ["grossMargin","grossMarginPct"])
  );
  if (margin !== null) add(
    "gross-margin","Marge brute",String(Math.round(margin * 10) / 10) + "%","DECLARED"
  );

  var cfads = AG24_PREMIUM_FIN_num_(
    AG24_PREMIUM_FIN_first_(data, [
      "cfads","cashFlowAvailableForDebtService"
    ])
  );
  if (cfads !== null) add(
    "cfads","CFADS",AG24_PREMIUM_FIN_money_(cfads,currency),"DECLARED"
  );

  var funding = AG24_PREMIUM_FIN_first_(data, [
    "fundingNeed","fundingAmount","montantDemande"
  ]);
  var fundingNumber = AG24_PREMIUM_FIN_num_(funding);
  if (funding !== null) add(
    "funding",
    "Financement recherché",
    fundingNumber !== null
      ? AG24_PREMIUM_FIN_money_(fundingNumber,currency)
      : String(funding),
    "DECLARED"
  );

  return {
    success:true,
    version:AG24_PREMIUM_FIN_V1.VERSION,
    currency:String(currency).toUpperCase(),
    currencyConfirmed:Boolean(currency),
    metrics:metrics.slice(0,AG24_PREMIUM_FIN_V1.MAX_METRICS),
    calculations:{arrFromMrr:arrStatus === "CALCULATED"}
  };
}

function AG24_PREMIUM_FIN_STORY_SYSTEM_TEST_V1() {
  var input = {
    currency:"EUR",
    mrr:8100,
    payingCustomers:18,
    grossMargin:42,
    cfads:72000,
    fundingNeed:150000
  };
  var a = AG24_PREMIUM_FIN_buildStory_(input);
  var b = AG24_PREMIUM_FIN_buildStory_(input);
  var arr = a.metrics.filter(function(x){return x.id === "arr";})[0];

  var unknown =
    AG24_PREMIUM_FIN_buildStory_({
      fundingNeed:77000
    });

  var unknownFunding =
    unknown.metrics.filter(function(x){
      return x.id === "funding";
    })[0];

  var report = {
    success:
      JSON.stringify(a) === JSON.stringify(b) &&
      a.calculations.arrFromMrr === true &&
      arr && arr.value === "€97.2k" &&
      arr.truthStatus === "CALCULATED" &&
      a.metrics.some(function(x){
        return x.id === "funding" && x.value === "€150k";
      }) &&
      unknown.currencyConfirmed === false &&
      unknownFunding &&
      unknownFunding.value === "77k — devise à confirmer",
    version:AG24_PREMIUM_FIN_V1.VERSION,
    deterministic:JSON.stringify(a) === JSON.stringify(b),
    arrFromMrr:a.calculations.arrFromMrr,
    arrValue:arr ? arr.value : "",
    fundingPresent:a.metrics.some(function(x){return x.id === "funding";}),
    unknownCurrencySafe:
      Boolean(
        unknownFunding &&
        unknownFunding.value ===
          "77k — devise à confirmer"
      ),
    metricIds:a.metrics.map(function(x){return x.id;}),
    failureCode:""
  };

  if (!report.success) {
    report.failureCode = "PREMIUM_FINANCIAL_STORY_CONTRACT_FAILED";
  }

  Logger.log(JSON.stringify(report,null,2));
  return report;
}
