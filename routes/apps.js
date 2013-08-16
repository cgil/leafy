exports.apps = function(req, res){
	var appName = req.params.appName;

	var callback = req.query.callback;
	var args = req.query.args;

	res.header('Content-Type', 'text/html');
	res.header('Charset', 'utf-8');
	var response = '{"app": "'+ appName +'", "args": "'+ args +'"}';
	if(typeof callback !== 'undefined') {
		response = callback + '(' + response + ');'; 
	}  
	res.send(response);
};