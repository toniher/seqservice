const Webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

// take debug mode from the environment
const debug = (process.env.NODE_ENV !== 'production');

// Development asset host (webpack dev server)
const publicHost = debug ? 'http://localhost:2992' : '';

const dist = path.resolve(__dirname, 'public');

const plugins = [];

plugins.push(
    new Webpack.ProvidePlugin( { 
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        async: 'async'
    } ),
    new CleanWebpackPlugin([dist]),
    new ExtractTextPlugin("public/main.css"),
    new Webpack.HotModuleReplacementPlugin()
);

if ( ! debug ) {
    
    plugins.concat( [
    // production webpack plugins go here
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      }
    }),
    new UglifyJSPlugin({
                ie8: false,
                mangle: {
                  except: ['$super', '$', 'exports', 'require']
                }
    })
  ]);
    
}

module.exports =  {
    
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
          use: { 
		loader: 'babel-loader',
		query: {
                presets: ['es2015']
          	}
	  },
          exclude: /(node_modules|bower_components)/,
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract( {
                fallback: "style-loader",
                use: [ {
                  loader: 'css-loader',
                  options: {
                    minimize: true || {/* CSSNano Options */}
                  }
                }]
          })
        },
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
                use: [
                {
                  loader: 'css-loader',
                  options: {
                    minimize: true || {/* CSSNano Options */}
                  }
                },
                { loader: "less-loader" }

                ]
          })
        }
      ],
  },
  plugins: plugins,
  node : {
	fs: "empty"
  }

};
