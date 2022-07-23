const path = require('path');
const express = require('express');
const router = express.Router({mergeParams: true});
const config = require('../config/config.js');
const axios = require('axios').default;
const utils = require('../utils.js');


router.get('/download/:publiclink', async function (req, res, next) {
  let response = {
    status: 400,
    data: {
      error: true,
      message: "Public link is not valid."
    }
  };
  let publiclink = req.params.publiclink;
  if (publiclink != null) {
    let regexp = new RegExp('^[a-zA-Z0-9_-]{40,100}$');
    if (regexp.test(publiclink)) {
      let url = utils.createBackendUrl(`/shares/download/${publiclink}`);
      try {
        response = await axios.get(url);
      } catch (err) {
        if(typeof err.response !== "undefined")
          response = err.response
        else
          response = {status: 500, data: "Internal error."};
      }
    }
  }
  res.status(response.status).send(response.data);
});

router.get('/download/:publiclink/:fileUid/raw', async function (req, res, next) {
  let publiclink = req.params.publiclink;
  let fileUid = req.params.fileUid;
  if (publiclink === null) {
    return res.send({
      error: true,
      message: "No share."
    });
  }
  let regexp = new RegExp('^[a-zA-Z0-9_-]{40,100}$');
  if (!regexp.test(publiclink)) {
    return res.send({
      error: true,
      message:"Public link is not valid."
    });
  }

  if (fileUid === null){
    return res.send({
      error: true,
      message: "File UID is missing."
    });
  }

  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(fileUid)) {
    return res.send({
      error: true,
      message: "UID is not valid"
    });
  }
  let response = {status: 500, data: "Internal error."};
  let url = utils.createBackendUrl(`/shares/download/${publiclink}/${fileUid}/raw`);
  try {
    response = await axios.get(url);
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});
module.exports = router;
