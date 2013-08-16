var jquery = require('jquery');
exports.init = function() {
	var defer = jquery.Deferred();

	var response = {};

	// Set object as a promise
	defer.promise( response );

	// Resolve the deferred
	defer.resolve( "inside" );

    return defer;
};