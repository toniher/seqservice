var express = require("express");
var nconfig = require('./config.js');
var config = nconfig.get("express");
var errorhandler = require("errorhandler");
var bodyParser = require('body-parser');
var compression = require('compression')

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
var io = require('socket.io').listen(server);
// we pass io
app.set("io", io);

var blastdbcmd = require('./routes/blastdbcmd.js');
var blast = require('./routes/blast.js');
var queries = require('./routes/queries.js');
var wiki = require('./routes/wiki.js');

// Landing
app.get( basepath + '/', function(req, res){
	res.render('index.html');
});

// List of databases
app.get(basepath + '/db', blastdbcmd.getDBlist);
// List of species
app.get(basepath + '/species', queries.getListSpecies);

// TODO: Also get a list of entries
app.get(basepath + '/db/:db/taxon/:taxon/fasta', blastdbcmd.getBlastDBcmdTaxon);

// TODO: Multiple sequences at one
// All possibilities (range is xx-yy)
app.get(basepath + '/fasta/:fmt/:entry/:db/:range/:line', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/fasta/:fmt/:entry/:db/:range', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/fasta/:fmt/:entry/:db', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/fasta/:fmt/:entry', blastdbcmd.getBlastDBcmd);

app.post(basepath + '/fasta', blastdbcmd.getBlastDBcmd);

// Alternate
app.get(basepath + '/db/:db/entry/:entry/fasta', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/entry/:entry/fasta/:fmt', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/entry/:entry/fasta/:fmt/:range', blastdbcmd.getBlastDBcmd);
app.get(basepath + '/db/:db/entry/:entry/fasta/:fmt/:range/:line', blastdbcmd.getBlastDBcmd);

// Retrieval by POST
app.post(basepath + '/db', blastdbcmd.getBlastDBcmd);
// Retrieval by POST with SMW filtering
app.post(basepath + '/smwdb', wiki.getSMWBlastDBcmd);

// Get png file of gene models
app.get(basepath + '/genemodels/:taxonid/:chromosome/:start/:gene', function (req, res) {
    var st0 = req.params.start;
    var stf = st0.substring(0, 1);
    res.sendfile('/home/andreu/genemodels/' + req.params.taxonid + '/' + req.params.chromosome + '/' + stf + '/' + req.params.gene);
});

// Blast
app.post(basepath + '/blast', blast.performBlast);

// Transcript
app.get(basepath + '/transcript/:transcript', queries.getWholeTranscriptInfo);
// Transcript - short (used in BLAST)
app.get(basepath + '/transcript/:transcript/short', queries.getTranscriptInfo);


// Now views
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


app.use(lessMiddleware(__dirname + '/public')); // TODO: Minor, allow other paths
app.use(basepath, express.static(__dirname + '/public')); 

// TODO: This is not fully working. Redundant for now
app.get(basepath + '/blast', function (req, res) {
	res.render('blast.html', { exec: basepath + '/blast', protlist: getKeys( config.db.list.prot ), nucllist: getKeys( config.db.list.nucl ) } );
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
