import PouchDB from 'pouchdb';

var pouchdbInterface = {};

pouchdbInterface.report = function( dbname, obj, cb ) {

	let err = null;
	let db = new PouchDB(dbname);


	pouchdbInterface.add_indexes( db, function() {} );

	
	db.get(obj._id).then(function (doc) {
		
		// Already existing entry
		if ( doc ) {
			// TODO: Maybe modifying for poiting new access
			cb( db, obj, err );
		}
		
	}).catch(function (errget) {
		
		if ( errget.status === 404 ) {
			
			db.put(obj);
		}
		
		cb( db, obj, err );

	}); 
	
};

pouchdbInterface.retrieve = function( dbname, id, cb ) {

	let db = new PouchDB(dbname);

	db.get(id).then(function (doc) {
		
		// Already existing entry
		if ( doc ) {
			cb( null, doc );
		}
		
	}).catch(function (errget) {
		cb( errget, null );
	}); 

};

pouchdbInterface.rm = function( dbname, id, cb ) {

	let db = new PouchDB(dbname);


	db.get( id ).then(function(doc) {
		
	  cb( null, db.remove(doc._id, doc._rev) );
	}).then(function (result) {
	  // handle result
	}).catch(function (errrm) {
		cb( errrm, null );
	});

};


pouchdbInterface.listdocs = function( dbname, index, keyval, cb ) {

	let db = new PouchDB(dbname);

	pouchdbInterface.add_indexes( db, ( db.query( index, {
			key: keyval
		}).then(function (result) {
		  cb ( result )
		}).catch(function (err) {
			console.log(err);
			cb( null );
		})
	) );

};

pouchdbInterface.add_indexes = function( db, cb ) {

	// TODO: Refactor for more check if there
	db.get("_design/typeindex").then(function (doc) {
		cb();
	}).catch(function (errget) {
		
		if ( errget.status === 404 ) {
			var type_doc = {
				_id: '_design/typeindex',
				views: {
				  typeindex: {
					map: function mapType(doc) {
					  if (doc.type) {
						emit(doc.type, [ doc._id, doc.timestamp ]);
					  }
					}.toString()
				  }
				}
			}
		
			// Saving type document
			db.put(type_doc);
			cb();
		}
	});
};

pouchdbInterface.destroy = function( db, cb ) {
		
		new PouchDB('reports').destroy().then(function () {
			cb();
		}).catch(function (err) {
			// error occurred
			cb();
		});
	
};

export {pouchdbInterface};

