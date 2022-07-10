const Sequelize = require('sequelize');
const config = require('../config/config.js');

const sequelize = new Sequelize(config['DATABASE_NAME'], config['DATABASE_USER'], config['DATABASE_PASSWORD'], {
  host: config['DATABASE_HOST'],
  dialect: 'mysql'
});


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./user.js")(sequelize, Sequelize);

module.exports = db;
