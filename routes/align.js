var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var $p = require('procstreams');

// Main function for handling alignments
exports.performAlign = function (req, res) {

	var config;
	config = req.app.set('config');

	var alnparams = {};
	// Here alignment params
	// Application programs to use
	// e.g. muscle, others
	// Sequences
	// if tree processing

	// TODO process

};