const Webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const rootAssetPath = path.join(__dirname, 'assets');

// take debug mode from the environment
const debug = (process.env.NODE_ENV !== 'production');
console.log( debug );

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
    new ExtractTextPlugin("[name].css"),
    new Webpack.HotModuleReplacementPlugin()
);

if ( ! debug ) {
    
    plugins.push(
    // production webpack plugins go here
    new Webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      }
    }),
    new Webpack.optimize.UglifyJsPlugin({
				sourceMap: true,
                mangle: {
                  except: ['$super', '$', 'exports', 'require']
                }
    })
  );
    
}

module.exports =  {
    
  entry: {
    app: ['./assets/js/blast.js', './assets/js/align.js', './assets/js/pouchdb.js', './assets/js/extern/goapi.js', './assets/js/extern/service.js' ],
    styles: [
			'./assets/styles/blast.less',
			path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.css'),			 
	]
  },
  output: {
    path: path.join(__dirname, dist),
    filename: '[name].js',
    chunkFilename: '[id].js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.html$/, loader: 'raw-loader' },
      { test: /\.less$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!less-loader' }) },
      { test: /\.css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }) },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.(ttf|eot|svg|png|jpe?g|gif|ico)(\?.*)?$/i,
        loader: `file-loader?context=${rootAssetPath}&name=[path][name].[ext]` },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader', query: { presets: ['env'], cacheDirectory: true } },
    ],
  },
  plugins: plugins,
  node : {
	fs: "empty"
  }

};
