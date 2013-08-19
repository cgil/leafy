var jquery = require('jquery');
var Parse = require('parse').Parse;	//	Parse Database
exports.init = function(args) {

	var isset = function (check) {
        var test = (typeof check !== 'undefined' && check !== null && check !== "");
        if (check instanceof Array) {
            test = test && (check.length > 0);
        }
        return test;
    };

	var defer = jquery.Deferred();
	var response = {};

	// Set object as a promise
	defer.promise( response );

	// Parse DB keys
	Parse.initialize("mj0bTWlyN1iVqEIZPHsrDbzvKlUfT5plvx7ONTPO", "YsNKudV9ynKU1gRlVwL2s6iLO4ePha0aUW1vGIFS");

	var name = null;
	var amount = null;
	for(var i = 0; i < args.length; i++) {
		var arg = args[i];
		if(arg.hook === "name") {
			name = arg.data.join(" ");
		}
		else if (arg.hook === "amount") {
			amount = arg.data.join();
			amount = parseInt(amount, 10);
		}
	}
    var PointsTable = Parse.Object.extend("Points");
    var query = new Parse.Query(PointsTable);

    query.equalTo("name", name);

    query.first().then(function (Row) {
        if(!isset(Row)) {		//	No row matches name
			var newPoints = new PointsTable();
			newPoints.set("name", name);
			newPoints.set("points", amount);
			newPoints.save();					//	Store new row with name and points
        }
        else {
			var points = Row.toJSON().points;		//  Found a match
			if(!isset(points)) {
				points = 0;
			}
			points = parseInt(points, 10);
			points += amount;						//	Update points
			Row.set("points", points);
			Row.save();
		}
    });

	// Resolve the deferred
	defer.resolve( JSON.stringify({"name": name}));

    return defer;
};


