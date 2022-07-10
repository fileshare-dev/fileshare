const express = require('express');
const userRouter = require('./users.js');
const shareRouter = require('./shares.js');
const downloadRouter = require('./download.js');
const fileRouter = require('./files.js');
const path = require("path");
const utils = require("../utils");
const {default: axios} = require("axios");

const router = express.Router();

router.use('/', downloadRouter);
router.use('/auth', userRouter);
router.use('/shares', shareRouter);
router.use('/files', fileRouter);

module.exports = router;
