const express = require('express');
const router = express.Router();
const { createBinCollectionRequest } = require('../controllers/binCollectionRequestController');

router.post('/', createBinCollectionRequest);

module.exports = router;