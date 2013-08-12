
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.sendfile('/live.html', {'root': 'public/javascripts/pocketsphinx.js/webapp/'});
	//res.sendfile(require('path').resolve('public/javascripts/pocketsphinx.js/webapp/live.html'));
};
