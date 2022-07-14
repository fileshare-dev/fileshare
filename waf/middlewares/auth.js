var jwt = require('express-jwt');
var config = require('../config/config.js');
const db = require('../models/index.js');

const isTokenValid = async (req, token, done) => {
  const user = await db.User.findByPk(token.id);
  done(false, user === null);
};

var middleware = jwt({
  secret: config['JWT_SECRET'],
  algorithms: ['HS256'],
  isRevoked: isTokenValid
});

module.exports = middleware;
