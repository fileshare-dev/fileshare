var jwt = require('express-jwt');
var config = require('../config/config.js');

var middleware = jwt({
  secret: config['JWT_SECRET'],
  algorithms: ['HS256']
});

module.exports = middleware;
