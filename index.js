var express = require("express");
var nconfig = require('./config.js');
var config = nconfig.get("express");
var errorhandler = require("errorhandler");
var bodyParser = require('body-parser');
var compression = require('compression');

var lessMiddleware = require('less-middleware');

var app = express();

var basepath = "";

if (config.basepath) {
	basepath = config.basepath;
}

if (config.jsonp) {
	app.set("jsonp callback", true);
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Config
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// Compression
app.use(compression({
  threshold: 512
}))

app.set("config", config);

// Launch server
var server = app.listen(config.port);
var io = require('socket.io').listen(server, { path: basepath + "/socket.io" } );

// we pass io
app.set("io", io);

var blastdbcmd = require('./routes/blastdbcmd.js');
var blast = require('./routes/blast.js');
var align = require('./routes/align.js');

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

// Blast
app.post(basepath + '/blast', blast.performBlast);
// Align
app.post(basepath + '/align', align.performAlign);


// Now views
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


app.use(basepath, lessMiddleware(__dirname + '/public')); // TODO: Minor, allow other paths
app.use(basepath, express.static(__dirname + '/public')); 

// TODO: This is not fully working. Redundant for now
app.get(basepath + '/blast', function (req, res) {
	res.render('blast.html', { basepath: basepath, exec: basepath + '/blast', protlist: getKeys( config.db.list.prot ), nucllist: getKeys( config.db.list.nucl ), socketio: config.socketio, taxonid: config.external.taxonid } );
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
