const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { authenticateOptional } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/authValidators');

router.get('/', authenticateOptional, workerController.searchWorkers);
router.get('/featured', workerController.featuredWorkers);
router.get('/:id', idParam, validate, workerController.getWorker);

module.exports = router;
