const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: ['./index.js'],
  node: {
    fs: 'empty',
  },
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'xazabcore-lib.min.js',
    library: 'xazabcore',
    libraryTarget: 'umd',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        output: {
          comments: false,
        },
      },
      extractComments: false,
    })],
  },
};
