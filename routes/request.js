var functions = require('../functions/index.js');
var temp = require('temp').track(),
    fs   = require('fs');

require('babel-polyfill');
var hash = require('json-hash');
var moment = require('moment');

exports.prepareRequest  = function (req, res) {
	
	var config;
	config = req.app.set('config');
	
	reqconfig = config.request;
	
	var socketio = config.socketio; // Wheter to use this socketio or not;
	var io = req.app.set('io');
	
	// var digest = hash.digest( object );
	var newObj = {};
	
	functions.returnSocketIO( socketio, io, "request", res, JSON.stringify( newObj ) );
	
	
};


