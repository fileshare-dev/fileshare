const express = require('express');
const graphql = require('./gql')
const override = require('method-override');

const router = express.Router({mergeParams: true});

const authMiddleWare = require('../../middlewares/auth.js');
router.use(authMiddleWare);

router.use(override('_method',
  {methods: ['PATCH', 'DELETE', 'PUT', 'GET', 'POST']}));

router.post('/ping', function (req, res, next) {
  res.send({
    success: true,
    message: 'pong'
  });
});

router.use('/gql', graphql);

module.exports = router;
