
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('sphinx', { title: 'Leafy' });
};
