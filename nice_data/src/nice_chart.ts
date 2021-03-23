import * as d3 from "d3";
let verzamel_hash = {};
let mindate = new Date("2020-03-01");
let maxdate = new Date("2021-03-01");

let vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);
let vh = Math.max(
  document.documentElement.clientHeight || 0,
  window.innerHeight || 0
);
let margin = Math.round(vh * 0.01 + vw * 0.01);

vw -= margin * 2;
vh -= margin * 2;

let svg = d3.select("svg#combined_chart");
// svg.style("height", `${vh}px`);

let g = svg.append("g");

let g_x_axis = g.append("g");
let x = d3.scaleTime().domain([mindate, maxdate]).range([0, 100]);
let x_axis = d3.axisBottom(x);
g_x_axis.call(x_axis);
let x_axis_height = g_x_axis.node().getBBox().height;

let g_y_axis = g.append("g");
let y = d3.scaleLinear().domain([0, 1500]).range([100, 0]);
let y_axis = d3.axisLeft(y);
g_y_axis.call(y_axis);
let y_axis_width = g_y_axis.node().getBBox().width;

g_x_axis.attr(
  "transform",
  `translate(${y_axis_width + margin},${vh - x_axis_height + margin})`
);
x.range([0, vw - y_axis_width]);
g_x_axis.call(x_axis);

g_y_axis.attr("transform", `translate(${y_axis_width + margin},${margin})`);
y.range([vh - x_axis_height, 0]);
g_y_axis.call(y_axis);

let g_chart = g
  .append("g")
  .attr("transform", `translate(${y_axis_width + margin},${margin})`);

const g_aanwezig = g_chart.append("g").classed('aanwezig_ic_dag',true);

const add_to_hash = (
  verzamel_hash: { [key: string]: { [key: string]: number } },
  varname: string,
  a: Array<any>,
  uncum?: boolean
) => {
  let yesterday = 0;

  let r = a.reduce((a, e) => {
    if (!a[e.date]) {
      let curdate = new Date(e.date);

      a[e.date] = {
        data: e.date,
        jsdate: curdate,
      };

      if (curdate > maxdate) {
        maxdate = curdate;
      }

      if (curdate < mindate) {
        mindate = curdate;
      }
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

interface DataPunt {
  date: string;
  [key: string]: any;
}

const datalijst = (): Array<DataPunt> => Object.values(verzamel_hash);

const update_x_axis = () => {
  x.domain([mindate, maxdate]);
  g_x_axis.call(x_axis);
};

Promise.all([
  // Het totaal aantal nieuwe IC-patiënten met verdachte[1] of bewezen[0] COVID-19 per dag
  d3
    .json("https://www.stichting-nice.nl/covid-19/public/new-intake/")
    .then((data: Array<Array<{}>>) => {
      add_to_hash(verzamel_hash, "nieuw_bewezen_dag", data[0]);
      add_to_hash(verzamel_hash, "nieuw_verdacht_dag", data[1]);
    }),

  // Het cumulatief aantal patiënten met verdachte of bewezen COVID-19 op de IC dat is ontslagen
  // van de IC[2] of uit het ziekenhuis[1] of is overleden[0]
  d3
    .json(
      "https://www.stichting-nice.nl/covid-19/public/died-and-survivors-cumulative/"
    )
    .then((data: Array<Array<{}>>) => {
      add_to_hash(verzamel_hash, "overleden_ic_cum", data[0]);
      add_to_hash(verzamel_hash, "overleden_ic_dag", data[0], true);
      add_to_hash(verzamel_hash, "ontslagen_zh_cum", data[1]);
      add_to_hash(verzamel_hash, "ontslagen_zh_dag", data[1], true);
      add_to_hash(verzamel_hash, "ontslagen_ic_cum", data[2]);

      // deze kan negatief zijn. Op eerste gezicht raar, maar omdat het van cumulatief
      // komt, en deze bij ontslagen_zh(? of overleden?) komt, toch logisch
      add_to_hash(verzamel_hash, "ontslagen_ic_dag", data[2], true);
    }),

  // Het totaal aantal aanwezige patiënten met verdachte of bewezen COVID-19 op de IC per dag
  d3
    .json("https://www.stichting-nice.nl/covid-19/public/intake-count/")
    .then((data: Array<{}>) => {
      add_to_hash(verzamel_hash, "aanwezig_ic_dag", data);
      update_x_axis();

      let dots_aanwezig = g_aanwezig
        .selectAll("circle.dot")
        .data(datalijst(), (d: DataPunt) => d.date);

      dots_aanwezig
        .enter()
        .append("circle")
        .classed("dot", true)
        .attr("r", 2)
        .attr("cx", (d) => x(d.jsdate))
        .attr("cy", (d) => y(d.aanwezig_ic_dag));

      g_aanwezig
        .append("path")
        .datum(datalijst)
        .attr("fill", "none")
        .attr(
          "d",
          //@ts-expect-error //@
          d3
            .line()
            .x(function (d:any) {
              return x(d.jsdate);
            })
            .y(function (d:any) {
              return y(d.aanwezig_ic_dag);
            })
        );
    }),
])
  .then(() => {
    // voor sommige visualisaties zijn meer databronnen nodig, dus die kunnen pas als alles binnen is
  })
  .catch((e) => {
    console.log(e);
  });
