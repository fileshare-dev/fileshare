const express = require('express');
const fs = require('fs');
const otplib = require('otplib');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const {Op} = require("sequelize");
const base60 = require('base-x')('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz-_');

const db = require('../../models');
const config = require('../../config/config.js');

const File = db.File;
const User = db.User;

const Share = db.Share;
const authMiddleWare = require('../../middlewares/auth.js');

const router = express.Router({mergeParams: true});


router.post('/', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can create shares.'
    });
  }

  if (!req.body.name) {
    res.status(400).send({
      error: true,
      message: "Missing share name."
    });
    return;
  }
  if (!req.body.files) {
    res.status(400).send({
      error: true,
      message: "List of files missing."
    });
    return;
  }
  if (!Array.isArray(req.body.files)) {
    res.status(400).send({
      error: true,
      message: "List of file is not array."
    });
    return;
  }
  if (!new RegExp('^[a-zA-Z]{4,80}$').test(req.body.name)) {
    res.status(400).send({
      error: true,
      message: "Forbidden char in filename."
    });
    return;
  }

  /* Check if another share owned by
     this user has the same name */
  let presentShare = await Share.findAll({
    where: {
      [Op.and]: [
        {UserId: req.user.id},
        {name: req.body.name}
      ]
    }
  });

  if (presentShare.length !== 0) {
    res.status(400).send({
      error: true,
      message: "Share already exists."
    });
    return;
  }

  let listOfFiles = req.body.files;

  if (listOfFiles.length <= 0) {
    res.status(400).send({
      error: true,
      message: "Empty files' list."
    });
    return;
  }

  /* Confirm each file is owned by the requesting user */
  let data = await File.findAll({
    where: {
      id: listOfFiles
    }
  });
  if (data && data.length !== 0) {
    let notOwned = data.filter(function (file) {
      return file.UserId !== req.user.id;
    });
    if (notOwned.length !== 0) {
      res.status(403).send({
        error: true,
        message: "The file does not belong to you.",
        files: notOwned.map(file => file.id)
      });
      return;
    }
    let current_share = Share.build({
      name: req.body.name,
      link: base60.encode(crypto.randomBytes(48)),
    });

    let user = await User.findByPk(req.user.id);
    current_share.save().then(function (share) {
      for (index in data) {
        current_share.addFile(data[index]);
      }
      current_share.setUser(user);
      res.send({
        uid: share.id
      });
    }).catch(e => {
      console.error(e);
      res.status(500).send({
        error: true,
        message: 'Internal error.'
      })
    });
  } else {
    res.status(404).send({
      error: true,
      message: "No file found."
    });
  }
});

router.get('/', authMiddleWare, async function (req, res) {
  // List shares
  let user = await User.findByPk(req.user.id);
  let shares = await user.getAccessibleShare();
  shares = shares.concat(await Share.findAll({
    where: {
      UserId: req.user.id
    }
  }));
  if (shares) {
    let promises = shares.map(function (x) {
      return x.getFiles().then((share_files) => {
        return x.getAcl().then((acl) => {
          return {
            id: x.id,
            mine: x.UserId === req.user.id,
            owner: x.UserId,
            name: x.name,
            isPublic: x.isPublic,
            link: x.link,
            validUntil: x.validUntil,
            files: share_files.map((f) => {
              return {id: f.id, name: f.name};
            })
          };
        }).catch(e => {
          console.error(e);
          res.status(500).send({
            error: true,
            message: 'Internal error.'
          })
        });
      }).catch(e => {
        console.error(e);
        res.status(500).send({
          error: true,
          message: 'Internal error.'
        });
      });
    });
    let data = await Promise.all(promises);
    res.send({shares: data});
  } else {
    res.status(404).send({
      error: true,
      message: 'Share not found.'
    });
  }
});

router.post('/:uid/give-access', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can give access to shares.'
    });
  }
  let shareUid = req.params.uid;
  let user = await User.findOne({
    where: {
      username: req.body.username
    }
  });
  if (!user) {
    res.status(404).send({
      error: true,
      message: "User not found."
    });
    return;
  }

  let code = req.body.code;
  if (!code) {
    res.status(400).send({
      error: true,
      message: "Missing code."
    });
    return;
  }
  let share = await Share.findByPk(shareUid);
  if (!share) {
    return res.status(404).send({
      error: true,
      message: "Share not found."
    });
  }
  if (share.UserId !== req.user.id) {
    return res.status(403).send({
      error: true,
      message: "You're not the share's owner."
    });
  }
  let owner = await share.getUser();

  let isOtpValid = otplib.authenticator.check(code,
    owner.mfa_secret);
  if (!isOtpValid) {
    return res.status(403).send({
      error: true,
      message: "Invalid OTP"
    });
  }

  share.addAcl(user);
  share.save().then(function () {
    res.send({
      success: true
    });
  }).catch(e => {
    console.error(e);
    res.status(500).send({
      error: true,
      message: 'Internal error.'
    })
  });
});

router.get('/:uid/toggle-publish', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can publish shares.'
    });
  }

  let shareUid = req.params.uid;
  let share = await Share.findByPk(shareUid);
  if (!share) {
    return res.status(404).send({
      error: true,
      message: "Share not found."
    });
  }
  if (share.UserId !== req.user.id) {
    return res.status(403).send({
      error: true,
      message: "You don't have the permission to edit this share."
    });
  }
  let validUntil = null;
  if (!share.isPublic) {
    let date = new Date();
    validUntil = date.setDate(date.getDate() + 7);
  }
  share.update({isPublic: !share.isPublic, validUntil: validUntil}).then(function () {
    res.send({
      success: true,
      validUntil: validUntil,
      isPublic: !share.isPublic
    });
  }).catch(e => {
    console.error(e);
    res.status(500).send({
      error: true,
      message: 'Internal error.'
    })
  });
});

router.get('/:uid', authMiddleWare, async function (req, res) {
  let shareUid = req.params.uid;
  let share = await Share.findByPk(shareUid);
  if (!share) {
    return res.status(404).send({
      error: true,
      message: "Share not found."
    });
  }
  let files = await share.getFiles();
  let ACLs = await share.getAcl();
  res.send({
    share: {
      id: share.id,
      owner: share.UserId,
      name: share.name,
      link: share.link,
      isPublic: share.isPublic,
      validUntil: share.validUntil,
      files: files.map(function (x) {
        return {id: x.id, name: x.name};
      }),

      availableFor: ACLs.map(function (x) {
        return {id: x.id};
      })
    }
  });
});

router.post('/:uid/files', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can add files.'
    });
  }
  let fileId = req.body.fileId;
  let shareUid = req.params.uid;
  let share = await Share.findByPk(shareUid);
  if (!share) {
    res.status(404).send({
      error: true,
      message: "Share not found."
    });
    return;
  }
  if (share.UserId !== req.user.id) {
    return res.status(403).send({
      error: true,
      message: "You don't have the permission to edit this share."
    });
  }
  let file = await File.findByPk(fileId);
  if (!file) {
    return res.status(404).send({
      error: true,
      message: "File not found."
    });
  }
  if (file.UserId !== req.user.id) {
    return res.status(403).send({
      error: true,
      message: "File does not belong to you."
    });
  }
  if (!share.hasFile(file)) {
    share.addFile(file);
  }
  share.save().then(function () {
    res.send({
      success: true,
    });
  }).catch(e => {
    console.error(e);
    res.status(500).send({
      error: true,
      message: 'Internal error.'
    })
  });
});

router.delete('/:uid/files/:filename', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can delete files.'
    });
  }
  let shareUid = req.params.uid;
  let filename = req.params.filename;
  let share = await Share.findByPk(shareUid);
  if (!share) {
    res.status(404).send({
      error: true,
      message: "Share not found."
    });
  }
  if (share.UserId !== req.user.id) {
    return res.status(403).send({
      error: true,
      message: "You don't have the permission to delete this share's file."
    });
  }

  let files = await share.getFiles();

  let wantedFile = null;
  wantedFile = files.find(function (file) {
    return file.name === filename;
  });
  if (!wantedFile) {
    res.status(404).send({
      error: true,
      message: "File not present in share."
    });
    return;
  }
  share.removeFile(wantedFile).then(function () {
    res.send({
      success: true
    });
  }).catch(e => {
    console.error(e);
    res.status(500).send({
      error: true,
      message: 'Internal error.'
    })
  });
});

router.get('/:uid/files/:filename', authMiddleWare, async function (req, res) {
  let shareUid = req.params.uid;
  let filename = req.params.filename;
  let share = await Share.findByPk(shareUid);
  if (!share) {
    res.status(404).send({
      error: true,
      message: "Share not found."
    });
    return;
  }
  let files = await share.getFiles();

  let wantedFile = null;
  wantedFile = files.find(function (file) {
    return file.name === filename;
  });
  if (!wantedFile) {
    return res.status(404).send({
      error: true,
      message: "File not present in share."
    });
  }

  let allowedUsers = await share.getAcl();
  allowedUsers = allowedUsers.concat(await User.findByPk(share.UserId));
  let accessGranted = allowedUsers
    .find(user => user.id === req.user.id) !== undefined;
  if (accessGranted !== true) {
    return res.status(403).send({
      error: true,
      message: "You're not allowed to access this share."
    });
  }

  if (!fs.existsSync(wantedFile.path)){
    res.status(404).send({
      error: true,
      message: "The file has been deleted on the file system but not on the database"
    });
    return;
  }
  let fileContent = fs.readFileSync(wantedFile.path);
  res.send({
    share: {
      id: share.id,
      owner: share.UserId,
      file: {
        id: wantedFile.id,
        name: wantedFile.name,
        createdAt: wantedFile.createdAt,
        owner: wantedFile.UserId,
        data: fileContent.toString('base64')
      }
    }
  });
});

router.get('/download/:link([a-zA-Z0-9_-]{40,100})/:fileUid/raw', async function (req, res) {
  let shareLink = req.params.link;
  let fileUid = req.params.fileUid;
  let share = await Share.findOne({
    where: {
      link: shareLink
    }
  });
  if (!share) {
    res.status(404).send({
      error: true,
      message: "Share not found."
    });
    return;
  }
  if (!share.isPublic) {
    res.status(403).send({
      error: true,
      message: "Share not public."
    });
    return;
  }

  let now = new Date();
  if (!share.validUntil) {
    return res.status(500).send({
      error: true,
      message: "An error has occurred."
    });
  }
  
  let expired_message = "The public link has expired";

  if (share.validUntil < now) {
    return res.status(498).send({
      error: true,
      message: expired_message,
    });
  }
  let files = await share.getFiles();
  // Check file
  let valid_file = files.find(file => file.id === fileUid);
  res.send(fs.readFileSync(valid_file.path));
});


router.get('/download/:link([a-zA-Z0-9_-]{40,100})', async function (req, res) {
  let shareLink = req.params.link;
  let share = await Share.findOne({
    where: {
      link: shareLink
    }
  });
  if (!share) {
    return res.status(404).send({
      error: true,
      message: "Share not found."
    });
  }

  if (!share.isPublic) {
    return res.status(403).send({
      error: true,
      message: "Share not public."
    });
  }

  let now = new Date();
  if (!share.validUntil) {
    return res.status(500).send({
      error: true,
      message: "An error has occurred."
    });
  }
  if (share.validUntil < now) {
    return res.status(498).send({
      error: true,
      message: "The public link has expired.",
    });
  }
  let files = await share.getFiles();
  let archive = new AdmZip();
  files.forEach((x) => {
    archive.addFile(x.name, fs.readFileSync(x.path));
  });
  res.send({
    share: {
      id: share.id,
      owner: share.UserId,
      data: archive.toBuffer().toString('base64')
    }
  });
});


router.delete('/:uid', authMiddleWare, async function (req, res) {
  if (req.user.verified !== true) {
    return res.status(403).send({
      error: true,
      message: 'Only verified users can delete shares.'
    });
  }

  let shareUid = req.params.uid;
  Share.findByPk(shareUid).then(function (share) {
    if (!share) {
      return res.status(404).send({
        error: true,
        message: "Share not found."
      });
    }
    if (share.UserId !== req.user.id) {
      return res.status(403).send({
        error: true,
        message: "You don't have the permission to delete this share."
      });
    }
    share.destroy().then(function () {
      res.send({
        success: true
      });
    }).catch(e => {
      console.error(e);
      res.status(500).send({
        error: true,
        message: 'Internal error.'
      })
    });
  }).catch(e => {
    console.error(e);
    res.status(500).send({
      error: true,
      message: 'Internal error.'
    })
  });
});

module.exports = router;
