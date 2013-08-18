var jquery = require('jquery');
exports.init = function(args) {

	var name = null;
	var amount = null;
	for(var i = 0; i < args.length; i++) {
		var arg = args[i];
		if(arg.hook === "name") {
			name = arg.hook;
		}
		else if (arg.hook === "amount") {
			amount = arg.hook;
		}
	}

	var defer = jquery.Deferred();

	var response = {};

	// Set object as a promise
	defer.promise( response );

	// Resolve the deferred
	defer.resolve( JSON.stringify(name));

    return defer;
};