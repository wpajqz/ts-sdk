/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const rootPath = process.cwd();
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './example/main.ts',
  devtool: 'inline-source-map',
  devServer: {
    compress: true,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'index',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(rootPath, 'dist'),
  },
  resolve: { extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'] },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(ts|js)x?$/,
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter'),
        },
      },
    ],
  },
};
