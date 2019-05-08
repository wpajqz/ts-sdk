const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/example/main.ts',
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './dist',
      compress: true,
      hot: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
          title: 'index'
      })
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [
            '.ts',
            '.js',
            '.tsx'
        ]
    }
};
