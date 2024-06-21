const express = require('express');
const mysql = require('mysql2/promise');
const Client = require('ssh2').Client;

const routerEvents = require('./events');
const routerRegister = require('./register');
const routerLogin = require('./login');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
  
}
);

router.use(routerLogin);
router.use(routerEvents);
router.use(routerRegister);

module.exports = router;