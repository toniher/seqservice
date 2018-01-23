var functions = require('../functions/index.js');
var temp = require('temp').track(),
    fs   = require('fs');

var hash = require('json-hash');
var moment = require('moment');

exports.prepareRequest  = function (req, res) {
	
	var config;
	config = req.app.set('config');
	reqbody = req.body;
	
	reqconfig = config.request;
	
	var approach = "content";
	
	if ( reqconfig && reqconfig.approach ) {
		approach = reqconfig.approach;
	}

	var newObj = {};
	// Default entry, simply timestamp
	let timestamp = moment().format('YYYYMMDDHHmmSS');
	newObj._id = "fd"+ timestamp;
	
	// TODO: We assume content for now as approach
	if ( approach === 'content' && reqconfig.hasOwnProperty('content') ) {
		
		let contentKeys = reqconfig.content;

		if ( contentKeys.length > 0 ) {
			
			for ( let k = 0; k < contentKeys.length; k++) {
				let key = contentKeys[k];

				// TODO assuming only one, otherwise a concatenation of criteria
				if ( reqbody.hasOwnProperty( key ) ) {
					newObj._id = hash.digest( reqbody[key] );
				}
			}
		}
	}
	
	newObj.timestamp = timestamp;
	
	functions.returnSocketIO( false, false, "request", res, JSON.stringify( newObj ) );
	
};


