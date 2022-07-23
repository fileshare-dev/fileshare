const express = require('express');
const fs = require('fs');
const authMiddleWare = require('../middlewares/auth.js');
const fileUpload = require('express-fileupload');
const config = require('../config/config.js');
const FormData = require('form-data');
const router = express.Router({mergeParams: true});

const utils = require('../utils.js');
const axios = require('axios').default;
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
      message: 'No files were uploaded.'
    });
  }

  let url = utils.createBackendUrl(`/files/upload`);
  let response = {status: 500, data: "Internal error."};

  try {
    let form = new FormData();
    let token = req.headers['authorization'];
    form.append('file', fs.createReadStream(req.files.file.tempFilePath), req.files.file.name);
    let requestConfig = {
      headers: {
        'Authorization': token,
        ...form.getHeaders()
      }
    }
    response = await axios.post(url, form, requestConfig);
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.get('/', async function (req, res, next) {
  let response = {status: 500, data: "Internal error."};

  try {
    let token = req.headers['authorization'];
    let url = utils.createBackendUrl(`/files/`);
    let requestConfig = {
      headers: {
        'Authorization': token
      }
    }
    response = await axios.get(url, requestConfig);
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.delete('/:uid', async function(req, res){
  let response = {status: 500, data: "Internal error."};
  try {
    let uid = req.params.uid;
    if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
      return res.status(400).send({
        error: true,
        message: "File uid is not valid."
      });
    }
    let url = utils.createBackendUrl(`/files/${uid}`);
    let token = req.headers['authorization'];

    response = await axios.delete(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

module.exports = router;
