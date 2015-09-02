var functions = require('./index.js');

// We assume already JSON work
exports.getRequest = function( urlinput ) {

	var reqopts = {
			url: urlinput,
			headers: {
					'User-Agent': 'request',
					'Accept' : 'application/json'
			}
	};
	return reqopts;
};

// Here we control the output, either in JSON or JSONP
exports.returnJSON = function( res, object ) {

	// If configured JSONP
	if ( res.app.set('config').jsonp ) {
		res.jsonp( object );
	} else {
		res.set( 'Content-Type', 'application/json' );
		res.send( object );
	}

};

exports.returnSocketIO = function( socketio, io, msg, res, output ) {

	if ( socketio ) {
		io.emit( msg, output );
		res.send({});
	} else {
		//// If configured JSONP
		if ( res.app.set('config').jsonp ) {
			res.jsonp( output );
		} else {
			res.set( 'Content-Type', 'application/json' );
			res.send( output );
		}
	}

};

// Here we provoke download the file
exports.downloadFasta = function( res, stdout, entry ) {

	var filename = "fasta";
	if ( entry ) {
		filename = entry;
	}

	res.set( 'Content-Type', 'text/x-fasta' );
	res.set( 'Content-Disposition', 'attachment; filename=' + filename + ".fasta" );

	res.send( stdout );

};

exports.getPath = function( term, object ) {

	for ( var dbtype in object ) {
		if ( object.hasOwnProperty(dbtype) ) {
			for ( var item in object[dbtype] ) {
				if ( object[dbtype].hasOwnProperty(item) ) {
					if ( item === term ) {
						return object[dbtype][item];
					}
				}
			}
		}
	}
	
	return '';
};

exports.matchInArray = function( groups, tomatch ) {
	
	for ( var i = 0; i < groups.length; i = i +1 ) {

		if ( tomatch.indexOf( groups[i] ) > -1 ) {
			return i;
		}
	}
	
	return -1;
}


