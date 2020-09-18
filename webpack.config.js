const path = require('path')

module.exports = {
  entry: {
    app: ['@babel/polyfill', './src/main.js']
  },
  output: {
    path: path.resolve(__dirname, 'js'),
    filename: 'script.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults, not ie 11, not ie_mob 11' }]
            ]
          }
        }
      }
    ]
  },
  devServer: {
    overlay: {
      warnings: true,
      errors: true
    }
  }
}
