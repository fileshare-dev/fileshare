const express = require('express');
const config = require('../../config/config.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const fileUpload = require('express-fileupload');
const db = require('../../models');

const File = db.File;
const User = db.User;
const authMiddleWare = require('../../middlewares/auth.js');

const router = express.Router({mergeParams: true});
router.use(authMiddleWare);

router.use(fileUpload({
  debug: config['DEBUG'],
  useTempFiles: true,
  tempFileDir: config['TMP_DIRECTORY'],
  createParentPath: true,
  abortOnLimit: true
}));

router.post('/upload', async function (req, res, next) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({
      error: true,
      message: 'No files were provided.'
    });
  }
  if(req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can upload files.'
    });
  }

  let uploadedFile = req.files.file;

  let destinationPath = config['MEDIA_DIRECTORY'] + '/' + crypto.randomBytes(16).toString('hex');
  while (fs.existsSync(destinationPath)) {
    destinationPath = config['MEDIA_DIRECTORY'] + '/' + crypto.randomBytes(16).toString('hex');
  }

  let current_file = File.build({
    name: path.basename(uploadedFile.name),
    path: destinationPath
  });
  let user = await User.findByPk(req.user.id);

  uploadedFile.mv(destinationPath, function (err) {
    current_file.save().then(function (data) {
      current_file.setUser(user);
      res.send({
        uid: data.id
      });
    });
  });
});

router.get('/', async function (req, res) {
  let files = await File.findAll({
    where: {
      UserId: req.user.id
    }
  });
  res.send({
    files: files.map(function (x) {
      return {id: x.id, name: x.name, createdAt: x.createdAt};
    })
  });
});

router.delete('/:uid', function (req, res) {
  if(req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can delete files.'
    });
  }

  let uid = req.params.uid;
  File.findByPk(uid).then(function (data) {
    if (!data) {
      res.status(404).send({
        error: true,
        message: "File does not exist."
      });
      return;
    }
    if (data.UserId !== req.user.id) {
      res.status(403).send({
        error: true,
        message: "You don't own this file."
      });
      return;
    }
    let path = data.path;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    data.destroy().then(function (u) {
      res.send({
        success: true
      });
    });
  });
});

module.exports = router;
