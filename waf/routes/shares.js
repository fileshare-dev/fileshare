const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const express = require('express');
const router = express.Router({mergeParams: true});
const path = require('path');

const utils = require('../utils.js');
const axios = require('axios').default;

const authMiddleWare = require('../middlewares/auth.js');

router.use(authMiddleWare);

const shareFileRouteTpl = '/shares/:uuid:/files/:filename:/';

function makeShareFileRoute(shareUuid, name) {
  let sanitizedFilename = path.basename(name);
  return shareFileRouteTpl.replace(':uuid:', shareUuid)
    .replace(':filename:', sanitizedFilename);
}

router.post('/', async function (req, res, next) {
  let response = {status: 500, data: "Internal error."};
  try {
    if (req.body.name) {
      if (!new RegExp('^[a-zA-z]{4,80}$').test(req.body.name)) {
        return res.status(400).send({
          error: true,
          message: "Forbidden characters in filename."
        });
      }
    }

    if (req.body.files) {
      if (!Array.isArray(req.body.files)) {
        return res.status(400).send({
          error: true,
          message: "Files' list is not an array."
        });
      }

      let nonValidFileUid = []
      req.body.files.forEach(function (uid) {
        if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
          nonValidFileUid.push(uid);
        }
      });
      if (nonValidFileUid.length !== 0) {
        return res.status(400).send({
          error: true,
          message: "A file uid is not valid."
        });
      }
    }

    let url = utils.createBackendUrl('/shares/')
    let token = req.headers['authorization'];
    response = await axios.post(
      url, req.body, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.get('/', async function (req, res, next) {
  let url = utils.createBackendUrl(`/shares/`);
  let token = req.headers['authorization'];
  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.get(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.post('/:uid/give-access', async function (req, res, next) {
  let uid = req.params.uid;
  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
    return res.status(400).send({
      error: true,
      message: "Share uid is not valid."
    });
  }

  let url = utils.createBackendUrl(`/shares/${uid}/give-access`);
  let token = req.headers['authorization'];

  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.post(url, req.body, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.get('/:uid/files/:filename', async function (req, res, next) {
  let uid = req.params.uid;
  let filename = req.params.filename;
  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
    return res.status(400).send({
      error: true,
      message: "Share uid is not valid."
    });
  }
  let url = utils.createBackendUrl(
    makeShareFileRoute(uid, filename));
  let token = req.headers['authorization'];

  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.get(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.get('/:uid/toggle-publish', async function (req, res, next) {
  let response = {status: 400, data: { error: true, message: "Share uid is not valid."} };
  let uid = req.params.uid;
  if (uid) {
    if (new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
      let url = utils.createBackendUrl(`/shares/${uid}/toggle-publish`);
      let token = req.headers['authorization'];
      try {
        response = await axios.get(url, {headers: {"Authorization": token}});
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

router.get('/:uid*', async function (req, res, next) {
  let response = {status: 400, data: { error: true, message: "Share uid is not valid."} };
  let uid = req.params.uid;
  if (uid) {
    if (new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
      let url = utils.createBackendUrl(`/shares/${uid}`);
      let token = req.headers['authorization'];
      try {
        response = await axios.get(url, {headers: {"Authorization": token}});
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

router.delete('/:uid/files/:filename', async function (req, res, next) {
  let uid = req.params.uid;
  let filename = req.params.filename;
  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
    return res.send({
      error: true,
      message: "Share uid is not valid."
    });
  }
  let url = utils.createBackendUrl(
    makeShareFileRoute(uid, filename));
  let token = req.headers['authorization'];

  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.delete(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.delete('/:uid', async function (req, res, next) {
  let uid = req.params.uid;
  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
    return res.status(400).send({
      error: true,
      message: "Share uid is not valid."
    });
  }
  let url = utils.createBackendUrl(`/shares/${uid}`);
  let token = req.headers['authorization'];

  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.delete(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

router.post('/:uid/files', async function (req, res, next) {
  let uid = req.params.uid;
  if (!new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(uid)) {
    return res.status(400).send({
      error: true,
      message: "Share uid is not valid."
    });
  }
  let url = utils.createBackendUrl(`/shares/${uid}`);

  let response = {status: 500, data: "Internal error."};
  try {
    response = await axios.post(url, {headers: {"Authorization": token}});
  } catch (err) {
    if(typeof err.response !== "undefined")
      response = err.response
  }
  res.status(response.status).send(response.data);
});

module.exports = router;
