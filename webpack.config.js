const Webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const rootAssetPath = path.join(__dirname, 'assets');

// take debug mode from the 
const dev = (process.env.NODE_ENV !== 'production');

const dist = path.resolve(__dirname, 'public');

const plugins = [];

plugins.push(
	new Webpack.ProvidePlugin( { 
		$: 'jquery',
		jQuery: 'jquery',
		'window.jQuery': 'jquery',
		async: 'async'
	} ),
	new ExtractTextPlugin("[name].css"),
	new Webpack.NamedModulesPlugin(),
	new Webpack.HotModuleReplacementPlugin()
);

if ( ! dev ) {

    plugins.push(
		// production webpack plugins go here
		new Webpack.DefinePlugin({
	    'process.env': {
			NODE_ENV: JSON.stringify('production'),
		}
		}),
		new UglifyJSPlugin({
			sourceMap: true
            //mangle: {
            //    except: ['$super', '$', 'exports', 'require']
            //}
		})
	);
    
}

module.exports =  {
    
  entry: {
    app: ['./assets/js/blast.js', './assets/js/align.js', './assets/js/pouchdb.js', './assets/js/extern/goapi.js', './assets/js/extern/service.js' ],
    styles: [
			path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.css'),
			'./assets/styles/blast.less'
	]
  },
  output: {
    path: dist,
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
  plugins: plugins

};
