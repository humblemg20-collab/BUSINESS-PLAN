/**
 * AfriGreen24 — Canonical Financial Model Engine
 * Deterministic debt schedule shared by audit and document generation.
 */

function AG24_FIN_nombre_(value) {
  const propre =
    typeof value === 'string'
      ? value.replace(/\s/g, '').replace(',', '.')
      : value;

  const n = Number(propre);
  return Number.isFinite(n) ? n : 0;
}

function AG24_FIN_arrondir_(value, decimals) {
  const facteur = Math.pow(10, Number(decimals || 0));
  return Math.round(
    (AG24_FIN_nombre_(value) + Number.EPSILON) * facteur
  ) / facteur;
}

function AG24_FIN_calculerEcheancier_(premium) {
  premium = premium || {};

  const capitalInitial =
    Math.max(
      0,
      AG24_FIN_nombre_(
        premium.montantDemande
      )
    );

  const maxMois =
    typeof BPB3_CONFIG !== 'undefined' &&
    BPB3_CONFIG &&
    BPB3_CONFIG.MAX_MOIS_ECHEANCIER
      ? Number(BPB3_CONFIG.MAX_MOIS_ECHEANCIER)
      : 120;

  const duree =
    Math.max(
      1,
      Math.min(
        maxMois,
        AG24_FIN_nombre_(
          premium.dureeRemboursementMois
        ) || 1
      )
    );

  const differe =
    Math.max(
      0,
      Math.min(
        duree - 1,
        AG24_FIN_nombre_(
          premium.differeMois
        )
      )
    );

  const tauxMensuel =
    Math.max(
      0,
      AG24_FIN_nombre_(
        premium.tauxInteretAnnuel
      )
    ) / 100 / 12;

  const moisAmortissement =
    Math.max(
      1,
      duree - differe
    );

  const mensualiteApresDiffere =
    capitalInitial <= 0
      ? 0
      : tauxMensuel > 0
        ? capitalInitial * tauxMensuel /
          (
            1 -
            Math.pow(
              1 + tauxMensuel,
              -moisAmortissement
            )
          )
        : capitalInitial /
          moisAmortissement;

  let solde =
    capitalInitial;

  const mensuel =
    [];

  for(
    let mois = 1;
    mois <= duree;
    mois += 1
  ){
    const soldeInitial =
      solde;

    const interets =
      soldeInitial *
      tauxMensuel;

    let paiement;
    let capital;

    if(
      mois <=
      differe
    ){
      paiement =
        interets;

      capital =
        0;
    }
    else{
      paiement =
        Math.min(
          soldeInitial +
          interets,
          mensualiteApresDiffere
        );

      capital =
        Math.max(
          0,
          paiement -
          interets
        );
    }

    solde =
      Math.max(
        0,
        soldeInitial -
        capital
      );

    mensuel.push({
      mois: mois,
      soldeInitial:
        AG24_FIN_arrondir_(
          soldeInitial,
          0
        ),
      paiement:
        AG24_FIN_arrondir_(
          paiement,
          0
        ),
      interets:
        AG24_FIN_arrondir_(
          interets,
          0
        ),
      capital:
        AG24_FIN_arrondir_(
          capital,
          0
        ),
      soldeFinal:
        AG24_FIN_arrondir_(
          solde,
          0
        )
    });
  }

  const annuel =
    [];

  const nbAnnees =
    Math.ceil(
      duree / 12
    );

  for(
    let annee = 1;
    annee <= nbAnnees;
    annee += 1
  ){
    const lignes =
      mensuel.slice(
        (annee - 1) * 12,
        annee * 12
      );

    const somme =
      function(cle){
        return lignes.reduce(
          function(total, ligne){
            return total +
              AG24_FIN_nombre_(
                ligne[cle]
              );
          },
          0
        );
      };

    annuel.push({
      annee: annee,
      paiements:
        AG24_FIN_arrondir_(
          somme('paiement'),
          0
        ),
      interets:
        AG24_FIN_arrondir_(
          somme('interets'),
          0
        ),
      capitalRembourse:
        AG24_FIN_arrondir_(
          somme('capital'),
          0
        ),
      soldeFin:
        lignes.length
          ? lignes[
              lignes.length - 1
            ].soldeFinal
          : 0
    });
  }

  return {
    capitalInitial:
      AG24_FIN_arrondir_(
        capitalInitial,
        0
      ),
    dureeMois:
      duree,
    differeMois:
      differe,
    tauxAnnuelPct:
      AG24_FIN_arrondir_(
        AG24_FIN_nombre_(
          premium.tauxInteretAnnuel
        ),
        4
      ),
    mensualiteApresDiffere:
      AG24_FIN_arrondir_(
        mensualiteApresDiffere,
        0
      ),
    paiementPendantDiffere:
      mensuel.length &&
      differe > 0
        ? mensuel[0].paiement
        : 0,
    mensuel:
      mensuel,
    annuel:
      annuel
  };
}
