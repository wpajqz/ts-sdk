/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  devtool: false,
  output: {
    filename: 'index.umd.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'imSdk',
    libraryTarget: 'umd',
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
