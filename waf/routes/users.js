const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const otplib = require('otplib');

const config = require('../config/config.js');
const authMiddleWare = require('../middlewares/auth.js');
const db = require('../models/index.js');
const User = db.User;

const {Op} = require("sequelize");
const router = express.Router({mergeParams: true});

router.use(authMiddleWare.unless({path: [/.*\/login/, /.*\/register/]}));


router.post('/login', function (req, res, next) {
  const generic_error_message = {
    error: true,
    message: "Please check again your username or password"
  }

  if (!req.body.username
    || typeof req.body.username !== "string") {
    return res.status(400).send({
      "error": true,
      "message": "Username missing or empty"
    });
  }
  if (!req.body.password
    || typeof req.body.password !== "string") {
    return res.status(400).send({
      "error": true,
      "message": "Password missing or empty"
    });
  }
  if(req.body.username.length > 100) {
    return res.status(400).send({
      "error": true,
      "message": "Username too long. Max characters: 100."
    });
  }
  if(req.body.password.length > 250) {
    return res.status(400).send({
      "error": true,
      "message": "Password too long. Max characters: 250."
    });
  }

  User.findOne({where: {username: req.body.username.trim()}}).then(function (data) {
    if (!data) {
      res.send(generic_error_message);
      return;
    }
    let salt = data.salt;
    let hash = crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, 'sha512').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(data.password)) !== true) {
      return res.send(generic_error_message);
    }
    let session_body = {
      username: data.username,
      role: data.role,
      id: data.id,
      verified: data.verified
    }
    res.send({
      access_token: jwt.sign(session_body, config['JWT_SECRET'], {
        algorithm: "HS256",
        expiresIn: config['JWT_EXPIRY'],
      })
    });
  }).catch(e => {
      console.error(e);
      res.status(500).send({
        error: true,
        message: "Internal error."
      });
  });
});

router.post('/register', function (req, res, next) {
  if (!req.body.username
    || typeof req.body.username !== "string") {
    return res.status(400).send({
      error: true,
      message: "Username missing or empty."
    });
  }
  if (!req.body.password
    || typeof req.body.password !== "string") {
    return res.status(400).send({
      error: true,
      message: "Password missing or empty."
    });
  }
  let reqUsername = req.body.username.trim();
  if(reqUsername.length < 5) {
    return res.status(400).send({
      error: true,
      message: "Please provide a username of at least 5 characters."
    });
  }
  if(req.body.password.length < 8) {
    return res.status(400).send({
      error: true,
      message: "Please provide a password of at least 8 characters."
    });
  }
  if(req.body.username.length > 100) {
    return res.status(400).send({
      "error": true,
      "message": "Username too long. Max characters: 100."
    });
  }
  if(req.body.password.length > 250) {
    return res.status(400).send({
      "error": true,
      "message": "Password too long. Max characters: 250."
    });
  }

  User.findAll({
    where: {
      username: reqUsername
    }
  }).then(function (data) {
    if (data.length === 0) {
      let salt = crypto.randomBytes(16).toString('hex');
      let mfa = otplib.authenticator.generateSecret()
      let current_user = User.build({
        username: reqUsername,
        password: crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, 'sha512').toString('hex'),
        salt: salt,
        role: 'user',
        verified: false,
        mfa_secret: mfa
      });
      current_user.save().then(function (data) {
        res.send({id: data.id});
      }).catch(e => {
        console.error(e);
        res.status(500).send({
          error: true,
          message: "Internal error."
        });
      });
    } else {
      let current_user = data[0];
      let message = '';

      if (current_user.username === reqUsername) {
        message = "Username is already used.";
      }

      res.send({
        error: true,
        message: message
      });
    }
  }).catch(e => {
      console.error(e);
      res.status(500).send({
        error: true,
        message: "Internal error."
      });
  });
});

router.post('/change-password', function (req, res, next) {
  const generic_error_message = {
    error: true,
    message: "Please check again your username or password."
  }

  if (!req.body.password
    || typeof req.body.password !== "string") {
    return res.status(400).send({
      error: true,
      message: "Password missing or empty."
    });
  }
  if (!req.body.new_password
    || typeof req.body.new_password !== "string") {
    return res.status(400).send({
      error: true,
      message: "New password missing or empty."
    });
  }
  if (!req.body.new_password_confirmation
    || typeof req.body.new_password_confirmation !== "string") {
    return res.status(400).send({
      error: true,
      message: "New password confirmation missing or empty."
    });
  }
  if(req.body.new_password.length < 8) {
    return res.status(400).send({
      error: true,
      message: "Please provide a password of at least 8 characters."
    });
  }
  if(req.body.new_password.length > 250) {
    return res.status(400).send({
      "error": true,
      "message": "Password too long. Max characters: 250."
    });
  }
  if(req.body.new_password_confirmation.length < 8) {
    return res.status(400).send({
      error: true,
      message: "Please provide a password of at least 8 characters."
    });
  }
  if(req.body.new_password_confirmation.length > 250) {
    return res.status(400).send({
      "error": true,
      "message": "Password too long. Max characters: 250."
    });
  }

  User.findByPk(req.user.id).then(function (data) {
    if (!data) {
      res.send(generic_error_message);
    }
    if (req.body.new_password !== req.body.new_password_confirmation) {
      return res.send({
        error: true,
        message: "Password does not match."
      });
    }
    let salt = data.salt;
    let hash = crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, 'sha512').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(data.password)) !== true) {
      return res.send(generic_error_message);
    }
    let new_hash = crypto.pbkdf2Sync(req.body.new_password, salt, 1000, 64, 'sha512').toString('hex');
    data.update({password: new_hash}).then(function () {
      res.send({
        status: "Password changed successfully."
      });
    });
  }).catch(e => {
      console.error(e);
      res.status(500).send({
        error: true,
        message: "Internal error."
      });
  });
});

router.get('/profile', async function(req, res, next){
  let user = await User.findByPk(req.user.id);
  res.send({
    id: user.id,
    username: user.username,
    mfa_secret: otplib.authenticator.keyuri(user.username, 'FileShare', user.mfa_secret),
    role: user.role,
    verified: user.verified
  });
});

router.get('/logout', function (req, res, next) {
  res.send(req.user);
});

module.exports = router;
