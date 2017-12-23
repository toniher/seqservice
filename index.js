const express = require("express");

var args = process.argv.slice(2);

// Assuming first arg is a conf.js file
var nconfig = require('./config.js')(args[0]);
var config = nconfig.get("express");
var errorhandler = require("errorhandler");
var bodyParser = require('body-parser');
var compression = require('compression');

var functions = require('./functions/index.js');

// Webpack
const webpack = require('webpack');
const webpackconfig = require('./webpack.config.js');
const webpackMiddleware = require("webpack-dev-middleware");

var lessMiddleware = require('less-middleware');

var multer  = require('multer');

var app = express();

var basepath = "";

if (config.basepath) {
	basepath = config.basepath;
}

if (config.jsonp) {
	app.set("jsonp callback", true);
}

// Limit 50 mb
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Config
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// Compression
app.use(compression({
  threshold: 512
}));

// TODO: Define custom upload directory and limits
var upload = multer({ dest: 'uploads/',
	limits: {fileSize: 100000000, files:1}
});

app.set("config", config);

// Launch server
var server = app.listen(config.port);
var io = require('socket.io').listen(server, { path: basepath + "/socket.io" } );

// we pass io
app.set("io", io);

var blastdbcmd = require('./routes/blastdbcmd.js');
var request = require('./routes/request.js');
var blast = require('./routes/blast.js');
var hmmer = require('./routes/hmmer.js');
var align = require('./routes/align.js');
var loadfile = require('./routes/load.js');
var service = require('./routes/service.js');
var down = require('./routes/down.js');
// var linkurl = require('./routes/link.js');


// Landing
app.get( basepath + '/', function(req, res){
	res.render('index.html');
});


// List of databases
app.get(basepath + '/db', blastdbcmd.getDBlist);

// TODO: Multiple sequences at one
// All possibilities (range is xx-yy)

app.get(basepath + '/db/:db/:method/:entry/fasta', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/:method/:entry/fasta/:fmt', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/:method/:entry/fasta/:fmt/:range', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/:method/:entry/fasta/:fmt/:range/:line', blastdbcmd.getBlastDBcmd);

// Retrieval by POST
app.post(basepath + '/db', blastdbcmd.getBlastDBcmd);

// Request
app.post(basepath + '/request', request.prepareRequest);

// Blast
app.post(basepath + '/blast', blast.performBlast);

// HMMER
app.post(basepath + '/hmmer', hmmer.performHmmer);

// Align
app.post(basepath + '/align', align.performAlign);

// Load File
app.post(basepath + '/load', upload.single('report'), loadfile.getFile);

// Send to service. Bypass
app.post(basepath + '/service', service.performExec);

// Temp down
app.post(basepath + '/tmp', down.downTemp);

// Link redirect
// TODO: NOT useful
// app.get(basepath + '/links/:dbtype/:db', linkurl.getLinks);


// Now views
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


app.use(basepath, lessMiddleware(__dirname + '/public')); // TODO: Minor, allow other paths
app.use(basepath, express.static(__dirname + '/public')); 

const webpackCompiler = webpack(webpackconfig);
const wpmw = webpackMiddleware(webpackCompiler,{});
app.use(wpmw);


// TODO: This is not fully working. Redundant for now
app.get(basepath + '/blast', function (req, res) {

	render_config = {};
	render_config = { basepath: basepath, exec: basepath + '/blast', protlist: getKeys( config.db.list.prot ), nucllist: getKeys( config.db.list.nucl ), socketio: config.socketio, taxonid: config.external.taxonid };
	
	if ( config.exec && config.exec.psiblast ) {
		render_config.psiblast = true;
	}

	if ( config.exec && config.exec.blastupload ) {
		render_config.blastupload = true;
	}
	
	if ( config.exec && config.exec.remote ) {
		render_config.remote = true;
	}

	if ( config.exec && config.exec.evalue ) {
		render_config.evalue = true;
	}

	if ( config.exec && config.exec.maxhits ) {
		render_config.maxhits = true;
	}

	if ( config.exec && config.exec.go ) {
		render_config.go = true;
	}

	if ( config.exec && config.exec.hmmer ) {
		render_config.hmmer = true;
		render_config.exechmmer = basepath + '/hmmer';
	}
	
	if ( config.services ) {
		if ( config.services.bypass ) {
			render_config.bypass = functions.printForm( "bypass", config.services.bypass );
		}
	}

	if ( config.session && config.session.active ) {
		render_config.session = true;
	}

	if ( config.db && config.db.list ) {
		render_config.dblist = JSON.stringify( config.db.list );
	}

	res.render('blast.html', render_config  );
});

// Landing Upload
app.get( basepath + '/upload', function(req, res){
	res.render('upload.html', { basepath: basepath } );
});

function getKeys ( list ) {

	var listkeys = [];

	for ( var key in list ) {
		if ( list.hasOwnProperty(key) ) {
			listkeys.push( key );
		}
	}

	return listkeys;
}

console.log("Seqserver listening on port " + config.port);
