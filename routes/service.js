var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

require('babel-polyfill');
var hash = require('json-hash');
var moment = require('moment');

var $p = require('procstreams');

// Main function for handling alignments
exports.performExec = function (req, res) {

	var config;
	config = req.app.set('config');

	var io = req.app.set('io');

	var socketio = config.socketio; // Wheter to use this socketio or not;

	// Input data
	if ( req.body.params ) {
		
		if ( req.body.params.input && req.body.params.ref && req.body.params.type ) {

			var input = req.body.params.input;
			var ref =  req.body.params.ref;  
			var type = req.body.params.type;
		
			if ( config["services"] && config.services[type] ) {

				var progconf = config.services[type];

				if ( progconf.type == "exec" && progconf.path ) {

					var execparams = {};
										
					if ( req.body.params.params ) {
						execparams = JSON.parse( req.body.params.params );
					}
					
					if ( progconf.input_param ) {
						execparams[  progconf.input_param ] = "-";
					}	
				
					if ( progconf.input == "file" ) {
						
						temp.track();
						
						// TODO: Generate input file in tmp
						temp.open('tmp', function(err, info) {
							if (!err) {
																
								fs.write( info.fd, input );
								
								if ( progconf.input_param ) {
									execparams[  progconf.input_param ] = info.path;
								}	
								
								fs.close( info.fd, function(err) {

									// Process all execparams
									strParams = joinParams( execparams );
																		
									runPipe( null, [{ "app": progconf.path, "params": strParams }], function( stderr, data ) {
										
										if ( !stderr || stderr == "" ) {

											var obj = JSON.parse( data );
											var digest = hash.digest( obj );
											var newObj = {};
											newObj._id = digest;
											newObj.ref = ref;
											newObj.type = type;
											newObj.data = obj;
											newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
											
											functions.returnSocketIO( socketio, io, 'service', res, JSON.stringify( newObj ) ); 
											
										}
										
									});
									
								});
							}
						});
						
					} else {
						
						strParams = joinParams( execparams );
					
						runPipe( input, [{ "app": progconf.path, "params": strParams }], function( stderr, data ) {

							if ( !stderr || stderr == "" ) {
								var obj = JSON.parse( data );
								var digest = hash.digest( obj );
								var newObj = {};
								newObj._id = digest;
								newObj.ref = ref;
								newObj.type = type;
								newObj.data = obj;
								newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
								
								functions.returnSocketIO( socketio, io, 'service', res, JSON.stringify( newObj ) ); 
							}
						});
						
					}
				}
			
			}
			
		}
		
	}
	
};


function joinParams( params ) {

	var arr = [];
	
	for ( var param in params ) {

		if ( params.hasOwnProperty( param ) ) {
			arr.push( "--" + param + " " + params[ param ] );
		}
	}
	
	return arr.join( " " );
	
}

function runPipe( baseText, apps, callBack ) {

	var resp = "";

	// Default
	var commandline = $p("true");
	
	if ( baseText && ( baseText != "" ) ) {
		commandline = $p("echo \"" + baseText + "\"" );
	}
	
	for ( var a = 0; a < apps.length; a = a + 1 ) {
		var command = apps[a].app + " " + apps[a].params;
		console.log( command );

		commandline = commandline.pipe( command );
	}

	commandline.data( function(err, stdout, stderr) {
		
		resp += stdout.toString();
		callBack( stderr, resp);
		
	});

}