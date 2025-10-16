const express = require('express');
const router = express.Router();
const {
  createBinCollectionRequest,
  getAllBinCollectionRequests,
  getBinCollectionRequestsByBinId,
  updateBinCollectionRequest
} = require('../controllers/binCollectionRequestController');

router.post('/', createBinCollectionRequest);
router.get('/', getAllBinCollectionRequests);
router.get('/bin/:binId', getBinCollectionRequestsByBinId);
router.put('/:id', updateBinCollectionRequest);

module.exports = router;