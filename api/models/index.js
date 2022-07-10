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
db.File = require("./file.js")(sequelize, Sequelize);
db.Share = require('./share.js')(sequelize, Sequelize);

/* Defining association */
/* n to 1 */
db.Share.belongsTo(db.User, { onDelete: 'CASCADE' });
db.File.belongsTo(db.User, { onDelete: 'CASCADE' });

/* n to n */
db.File.belongsToMany(db.Share, {through: 'FileShare', onDelete: 'CASCADE' });
db.Share.belongsToMany(db.File, {through: 'FileShare', onDelete: 'CASCADE' });

db.Share.belongsToMany(db.User, {through: 'ShareACL', as: 'Acl', onDelete: 'CASCADE' });
db.User.belongsToMany(db.Share, {through: 'ShareACL', as: 'AccessibleShare', onDelete: 'CASCADE' });


module.exports = db;
