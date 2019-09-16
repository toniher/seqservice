var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var hash = require('json-hash');
var moment = require('moment');

var spawn = require('child_process').spawn;

// var $p = require('procstreams');

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
																
								fs.write( info.fd, input, function( err ) { if ( err ) { console.error( err ) } } );
								
								if ( progconf.input_param ) {
									execparams[  progconf.input_param ] = info.path;
								}	
								
								fs.close( info.fd, function(err) {

									// Process all execparams
									strParams = joinParams( execparams );
									var output = "";
									// Run node with the child.js file as an argument
									var child = spawn( 'node', [ './pipe.js', null, JSON.stringify( [{ "app": progconf.path, "params": strParams }] ) ] );

									// TODO: Handle error stuff
									child.stderr.on('data', function (data) {
										console.error("DATA "+data.toString());
									});
																		
									// TODO: Handle in general with close, etc.
									
									// Listen for stdout data
									child.stdout.on('data', function (data) {
										
											if (typeof data !== 'string') {
												output = output + data.toString();
											}

									});
									
									child.on('exit', function (code) {

											var obj = JSON.parse( output );
											var digest = hash.digest( obj );
											var newObj = {};
											newObj._id = digest;
											newObj.ref = ref;
											newObj.type = type;
											newObj.data = obj;
											newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
											
											functions.returnSocketIO( socketio, io, 'service', res, JSON.stringify( newObj ) ); 
									});
								});
							}
						});
						
					} else {
						
						strParams = joinParams( execparams );
						
						var child = spawn( 'node', [ './pipe.js', input, JSON.stringify( [{ "app": progconf.path, "params": strParams }] ) ] );


						//  TODO: Handle error stuff
						child.stderr.on('data', function (data) {
							console.error("DATA "+data.toString());
						});
		
						// TODO: Handle in general with close, etc.
		
						// Listen for stdout data
						child.stdout.on('data', function (data) {
							
								var obj = JSON.parse( data );
								var digest = hash.digest( obj );
								var newObj = {};
								newObj._id = digest;
								newObj.ref = ref;
								newObj.type = type;
								newObj.data = obj;
								newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
								
								functions.returnSocketIO( socketio, io, 'service', res, JSON.stringify( newObj ) ); 
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
