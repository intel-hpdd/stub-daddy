const path = require('path');
const webpack = require('webpack');
const Externals = require('webpack-node-externals');

module.exports = {
  entry: './server.js',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  externals: [
    Externals({
      whitelist: [/^@iml/]
    })
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                'env',
                {
                  targets: {
                    node: 'current'
                  }
                }
              ]
            ],
            plugins: [
              'transform-flow-strip-types',
              'transform-object-rest-spread'
            ],
            babelrc: false
          }
        }
      }
    ]
  }
};
