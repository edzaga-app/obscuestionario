const express =  require('express');
const router = express.Router();
const questionnaireController = require('../controllers/questionnaireController');

router.get('/:id', questionnaireController.get);

module.exports = router;