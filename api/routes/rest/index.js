const express = require('express');
const fileRouter = require('./files.js');
const shareRouter = require('./shares.js');

const router = express.Router();

router.use('/files', fileRouter);
router.use('/shares', shareRouter);

module.exports = router;
