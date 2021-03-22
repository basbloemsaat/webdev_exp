import * as d3 from "d3";

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

Promise.all([
  // Het totaal aantal nieuwe IC-patiënten met verdachte[1] of bewezen[0] COVID-19 per dag
  d3.json("https://www.stichting-nice.nl/covid-19/public/new-intake/"),

  // Het totaal aantal aanwezige patiënten met verdachte of bewezen COVID-19 op de IC per dag
  d3.json("https://www.stichting-nice.nl/covid-19/public/intake-count/"),

  // Het cumulatief aantal patiënten met verdachte of bewezen COVID-19 op de IC dat is ontslagen
  // van de IC[2] of uit het ziekenhuis[1] of is overleden[0]
  d3.json(
    "https://www.stichting-nice.nl/covid-19/public/died-and-survivors-cumulative/"
  ),
]).then((data: any) => {
  console.log(data);

  let overleden_ic_y = 0;
  let ontslagen_ic_y = 0;
  let ontslagen_zh_y = 0;

  let verzamel_hash = {};
  add_to_hash(verzamel_hash, "nieuw_bewezen_dag", data[0][0]);
  add_to_hash(verzamel_hash, "nieuw_verdacht_dag", data[0][1]);
  add_to_hash(verzamel_hash, "aanwezig_ic_dag", data[1]);
  add_to_hash(verzamel_hash, "overleden_ic_cum", data[2][0]);
  add_to_hash(verzamel_hash, "overleden_ic_dag", data[2][0], true);
  add_to_hash(verzamel_hash, "ontslagen_zh_cum", data[2][1]);
  add_to_hash(verzamel_hash, "ontslagen_ic_cum", data[2][2]);
  console.log(verzamel_hash);
}).catch((error) => {
    console.log(error);

});

console.log('boe')

