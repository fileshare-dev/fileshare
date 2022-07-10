const process = require('process');
const crypto = require('crypto');

var config = {
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  JWT_EXPIRY: process.env.JWT_EXPIRY || "12h",
  DATABASE_NAME: process.env.DB_NAME || 'fileshare',
  DATABASE_USER: process.env.DB_USER || 'root',
  DATABASE_PASSWORD: process.env.DB_PASS || 'root',
  DATABASE_HOST: process.env.DB_HOST || 'localhost',
  ROOT_DIRECTORY: process.cwd(),
  MEDIA_DIRECTORY: process.cwd() + '/media',
  TMP_DIRECTORY: process.cwd() + '/tmp',
  BACKEND_HOST: process.env.BACKEND_HOST || 'backend',
  BACKEND_PORT: process.env.BACKEND_PORT || 3000,
  DEBUG: false
}


module.exports = config;
