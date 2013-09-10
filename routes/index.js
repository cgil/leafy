(function() {
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.sendfile('/index.html', {'root': 'public/'});
};

exports.speech = function(req, res){
	res.header('Content-type','application/json');
	res.header('Charset', 'utf-8');
	// var speech = require('../public/javascripts/web-speech/speech-recognizer.js');
	// var words = req.query.args || [];
	// try {
	// 	speech.handleWords(JSON.parse(words)).then(function(data) {
			// var response = '{"app": "'+ appRequest +'", "args": "'+ args +'", "success": "true", "response":"'+ data +'"}';
			var response = '{}';
			response = JSON.stringify(response);
			res.send(response);
	// 	});
	// }
	// catch(e) {
	// 	var response = '{"app": "'+ appRequest +'", "args": "'+ args +'", "success": "false", "response": "'+ (e.message) +'"}';
	// 	response = JSON.stringify(response);
	// 	res.send(response);
	// }
};

exports.apps = function(req, res){
	var appRequest = req.params.appName;

	var callback = req.query.callback;
	var args = req.query.args || [];
	
	res.header('Content-type','application/json');
	res.header('Charset', 'utf-8');

	var appFound = false;
	try {
		var apps = ["points"];
		for (var i = 0; i < apps.length; i++) {
			if(apps[i] === appRequest) {
				var app = require('./apps/'+ apps[i] +'.js');
				app.init(JSON.parse(args)).then(function(data) {
					// res.send(req.query.callback + '('+ JSON.stringify(data) + ');');
					var response = '{"app": "'+ appRequest +'", "args": "'+ args +'", "success": "true", "response":"'+ data +'"}';
					if(typeof callback !== 'undefined') {
						response = callback + '(' + JSON.stringify(response) + ');'; 
					}  
					else {
						response = JSON.stringify(response);
					}
					res.send(response);
				});
				appFound = true;
				break;
			}
		}
	}
	catch(e) {
		var response = '{"app": "'+ appRequest +'", "args": "'+ args +'", "success": "false", "response": "'+ (e.message) +'"}';
		if(typeof callback !== 'undefined') {
			response = callback + '(' + response + ');'; 
		}  
		res.send(response);
	}

	if(!appFound) {
		var response = '{"app": "'+ appRequest +'", "args": "'+ args +'", "success": "false", "reponse": "no app found"}';
		if(typeof callback !== 'undefined') {
			response = callback + '(' + response + ');'; 
		}  
		res.send(response);
	}
};

})();