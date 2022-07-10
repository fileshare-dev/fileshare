const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const fs = require('fs');

const cors = require('cors');
const schedule = require("node-schedule");

const config = require('./config/config.js');

const apiRouter = require('./routes/index.js');
const app = express();
const db = require('./models/index.js');

//db.sequelize.sync({force: config['DEBUG']}).then(function(){
db.sequelize.sync().then(function () {
  console.log('Recreating database');
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(logger('common'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/', apiRouter);


const User = db.User;

// Clean unverified user each day at 05:00 am
schedule.scheduleJob("0 5 * * *", async () => {
  await User.destroy({
    where: {
      verified: false
    }
  });
});
app.use(function(err, req, res, next) {
  if(err.name === 'UnauthorizedError') {
    res.status(err.status).send({error: true, message:err.message});
    return;
  }
  next();
});

module.exports = app;
