const Webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const plugins = [];

plugins.push( new Webpack.ProvidePlugin( { 
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        async: 'async'
} ) );

plugins.push( new ExtractTextPlugin("public/main.css") );

const config = {
  entry: {
    app: ['./assets/js/blast.js', './assets/js/align.js', './assets/js/pouchdb.js', './assets/js/extern/goapi.js', './assets/js/extern/service.js' ],
    styles: ['./assets/styles/blast.less' ]
  },
  output: {
    path: path.resolve(__dirname ),
    filename: 'public/js/[name].js'
  },
  devtool: 'source-map',
  module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          use: 'babel-loader',
		  exclude: /(node_modules|bower_components)/
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: "css-loader"
          })
        },
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{
                loader: "css-loader"
            }, {
                loader: "less-loader"
            }],
          })
        }
      ],
  },
  plugins: plugins,
  node : {
	fs: "empty"
  }
};

module.exports = function(env) {
  
    let prod = false;
    
    if ( env && env.production ) {
        prod = true;
    }
    
    if (prod) {
      plugins.push( new UglifyJSPlugin()) ;
    }
    plugins.push(new Webpack.DefinePlugin({
      __PRODUCTION__: prod,
      __DEV__: !prod
    }));
  
    return config;
  
};
                          

