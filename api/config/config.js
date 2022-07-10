const process = require('process');
const crypto = require('crypto');

var config = {
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  DATABASE_NAME: process.env.DB_NAME || 'fileshare',
  DATABASE_USER: process.env.DB_USER || 'root',
  DATABASE_PASSWORD: process.env.DB_PASS || 'root',
  DATABASE_HOST: process.env.DB_HOST || 'localhost',
  ROOT_DIRECTORY: process.cwd(),
  MEDIA_DIRECTORY: process.cwd() + '/media',
  TMP_DIRECTORY: process.cwd() + '/tmp',
  DEBUG: false
}


module.exports = config;
