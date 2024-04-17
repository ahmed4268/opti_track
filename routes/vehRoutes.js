const express = require('express');
const vehController = require('../controllers/vehController');
const router = express.Router();


router
    .route('/')
    .get(vehController.getAllvehicules)
    .post(vehController.createvehicule);

router
    .route('/:id')
    .get(vehController.getvehicule)
    .patch(vehController.updatevehicule)
    .delete(vehController.deletevehicule);
router.post('/availableveh',vehController.getAvailableveh);
router.post('/availableveh_update',vehController.getAvailableveh_update);

module.exports = router;