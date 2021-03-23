import * as d3 from "d3";
let verzamel_hash = {};
let add_to_hash = (
  verzamel_hash: { [key: string]: { [key: string]: number } },
  varname: string,
  a: Array<any>,
  uncum?: boolean
) => {
  let yesterday = 0;

  let r = a.reduce((a, e) => {
    if (!a[e.date]) {
      a[e.date] = {};
    }

    let tval = e.value;
    if (uncum) {
      tval -= yesterday;
      yesterday = e.value;
    }

    a[e.date][varname] = tval;
    return a;
  }, verzamel_hash);

  return r;
};

// Het totaal aantal nieuwe IC-patiënten met verdachte[1] of bewezen[0] COVID-19 per dag
d3.json("https://www.stichting-nice.nl/covid-19/public/new-intake/").then(
  (data: Array<Array<{}>>) => {
    add_to_hash(verzamel_hash, "nieuw_bewezen_dag", data[0]);
    add_to_hash(verzamel_hash, "nieuw_verdacht_dag", data[1]);
  }
);

// Het cumulatief aantal patiënten met verdachte of bewezen COVID-19 op de IC dat is ontslagen
// van de IC[2] of uit het ziekenhuis[1] of is overleden[0]
d3.json(
  "https://www.stichting-nice.nl/covid-19/public/died-and-survivors-cumulative/"
).then((data: Array<Array<{}>>) => {
  add_to_hash(verzamel_hash, "overleden_ic_cum", data[0]);
  add_to_hash(verzamel_hash, "overleden_ic_dag", data[0], true);
  add_to_hash(verzamel_hash, "ontslagen_zh_cum", data[1]);
  add_to_hash(verzamel_hash, "ontslagen_zh_dag", data[1], true);
  add_to_hash(verzamel_hash, "ontslagen_ic_cum", data[2]);

  // deze kan negatief zijn. Op eerste gezicht raar, maar omdat het van cumulatief
  // komt, en deze bij ontslagen_zh(? of overleden?) komt, toch logisch
  add_to_hash(verzamel_hash, "ontslagen_ic_dag", data[2], true);
});

// Het totaal aantal aanwezige patiënten met verdachte of bewezen COVID-19 op de IC per dag
d3.json("https://www.stichting-nice.nl/covid-19/public/intake-count/").then(
  (data: Array<{}>) => {
    add_to_hash(verzamel_hash, "aanwezig_ic_dag", data);
  }
);

console.log(verzamel_hash);
