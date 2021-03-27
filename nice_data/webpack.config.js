const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    nice_chart: "./src/nice_chart.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../docs/nice_data/"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: [/node_modules/],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      // {
      //     test: /\.(woff|woff2|eot|ttf|otf)$/i,
      //     type: "asset/resource",
      // },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.ejs",
      filename: "./index.html",
      chunks: ["nice_chart"],
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 8080,
  },
};
