var jquery = require('jquery');
exports.init = function(args) {
	var defer = jquery.Deferred();

	var response = {};

	// Set object as a promise
	defer.promise( response );

	// Resolve the deferred
	defer.resolve( JSON.stringify(args[0]));

    return defer;
};