const auth = require('../middlewares/auth');
const express = require('express');
const router = express.Router();
const ticInventoryController = require('../controllers/ticInventoryController');
const computerController = require('../controllers/computerController')
const computersAvailabilityController = require('../controllers/computersAvailabilityController');
const suiteController = require('../controllers/suiteController');
const connectivityController = require('../controllers/connectivityController');
const connectivityAccessController = require('../controllers/connectivityAccessController');
const serverController = require('../controllers/serverController');
const cloudController = require('../controllers/cloudController');
const virtualizationController = require('../controllers/virtualizationController');
const managementServicesController = require('../controllers/managementServicesController');
const informationSystemController = require('../controllers/informationSystemController');
const domesticNetworkController = require('../controllers/domesticNetworkController');
const campuslicensingController = require('../controllers/campusLicensingController');
const dataprotectionController = require('../controllers/dataProtectionController');

router.post('/auth', ticInventoryController.auth);
router.get('/information', auth, ticInventoryController.get);
router.post('/information/save', auth, ticInventoryController.save);
router.post('/information/completedinventory', auth, ticInventoryController.completedinventory);

router.get('/computer', auth, computerController.get);
router.post('/computer/save', auth, computerController.save);

router.get('/computersavailability', auth, computersAvailabilityController.get);
router.post('/computersavailability/save', auth, computersAvailabilityController.save);

router.get('/suite', auth, suiteController.get);
router.post('/suite/save', auth, suiteController.save);

router.get('/connectivity', auth, connectivityController.get);
router.post('/connectivity/save', auth, connectivityController.save);

router.get('/connectivityaccess', auth, connectivityAccessController.get);
router.post('/connectivityaccess/save', auth, connectivityAccessController.save);

router.get('/server', auth, serverController.get);
router.post('/server/save', auth, serverController.save);

router.get('/cloud', auth, cloudController.get);
router.post('/cloud/save', auth, cloudController.save);

router.get('/virtualization', auth, virtualizationController.get);
router.post('/virtualization/save', auth, virtualizationController.save);

router.get('/managementservices', auth, managementServicesController.get);
router.post('/managementservices/save', auth, managementServicesController.save);

router.get('/informationsystem', auth, informationSystemController.get);
router.post('/informationsystem/save', auth, informationSystemController.save);

router.get('/domesticnetwork', auth, domesticNetworkController.get);
router.post('/domesticnetwork/save', auth, domesticNetworkController.save);

router.get('/campuslicensing', auth, campuslicensingController.get);
router.post('/campuslicensing/save', auth, campuslicensingController.save);

router.get('/dataprotection', auth, dataprotectionController.get);
router.post('/dataprotection/save', auth, dataprotectionController.save);

module.exports = router;




