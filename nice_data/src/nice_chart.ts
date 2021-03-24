import * as d3 from "d3";
const verzamel_hash = {};
let mindate = new Date("2020-03-01");
let maxdate = new Date("2021-03-01");

const svg = d3.select("svg#combined_chart");
const vh = parseInt(svg.style("height"));
const vw = parseInt(svg.style("width"));

const dot_r = 2;

const g = svg.append("g");

const g_x_axis = g.append("g");
const x = d3.scaleTime().domain([mindate, maxdate]).range([0, 100]);
const x_axis = d3.axisBottom(x);
g_x_axis.call(x_axis);
let x_axis_height = g_x_axis.node().getBBox().height;

const g_y_axis = g.append("g");
let y: d3.ScaleLogarithmic<any, any, any> | d3.ScaleLinear<any, any, any>;
let y_axis: d3.Axis<any>;

let set_y_scale = (type: string = "log") => {
  if (type == "log") {
    y = d3
      .scaleLog()
      .domain([1, 1500])
      .range([vh - x_axis_height, 0]);
  } else {
    y = d3
      .scaleLinear()
      .domain([0, 1500])
      .range([vh - x_axis_height, 0]);
  }
  y_axis = d3.axisLeft(y).tickFormat((e) => `${e}`);
  g_y_axis.call(y_axis);
};

set_y_scale();
let y_axis_width = g_y_axis.node().getBBox().width;

g_x_axis.attr("transform", `translate(${y_axis_width},${vh - x_axis_height})`);
x.range([0, vw - y_axis_width - dot_r]);
g_x_axis.call(x_axis);

g_y_axis.attr("transform", `translate(${y_axis_width},0)`);

// chart + curves
const g_chart = g.append("g").attr("transform", `translate(${y_axis_width},0)`);

const g_aanwezig = g_chart.append("g").classed("aanwezig_ic_dag", true);
g_aanwezig.append("path");

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

const datalijst = (attr?: string, avg_day: number = 1): Array<DataPunt> => {
  if (attr) {
    let a = Object.values(verzamel_hash).map((e: DataPunt) => {
      let x: DataPunt = {
        date: e.date,
      };
      x[attr] = e[attr];

      return x;
    });

    return a;
  } else {
    return Object.values(verzamel_hash);
  }
};

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
      draw_aanwezig();
    }),
])
  .then(() => {
    // voor sommige visualisaties zijn meer databronnen nodig, dus die kunnen pas als alles binnen is
  })
  .catch((e) => {
    console.log(e);
  });

d3.select("select#yaxis").on("change", (e) => {
  set_y_scale(e.target.value);
  redraw_curves();
});

let redraw_curves = () => {
  draw_aanwezig();
};

// draw functions
let draw_aanwezig = () => {
  let dots_aanwezig = g_aanwezig
    .selectAll("circle.dot")
    .data(datalijst(), (d: DataPunt) => d.jsdate);

  dots_aanwezig.exit().remove();

  let newdots = dots_aanwezig
    .enter()
    .append("circle")
    .classed("dot", true)
    .attr("r", dot_r)
    .attr("cx", (d) => x(d.jsdate))
    .attr("cy", (d) => y(d.aanwezig_ic_dag));

  dots_aanwezig
    .transition()
    .attr("cx", (d) => x(d.jsdate))
    .attr("cy", (d) => y(d.aanwezig_ic_dag));

  g_aanwezig
    .select("path")
    .datum(datalijst())
    .transition()
    .attr(
      "d",
      //@ts-expect-error //@
      d3
        .line()
        .x(function (d: any) {
          return x(d.jsdate);
        })
        .y(function (d: any) {
          return y(d.aanwezig_ic_dag);
        })
    );
};
