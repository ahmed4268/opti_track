const express = require('express');
const vehController = require('../controllers/vehController');
const router = express.Router();
const authController = require('../controllers/authController');


router
    .route('/')
    .get(authController.protect,vehController.getAllvehicules)
    .post(authController.protect,authController.restrictTo('Planifcateur','admin'),vehController.createvehicule);

router
    .route('/:id')
    .get(authController.protect,vehController.getvehicule)
    .patch(authController.protect,authController.restrictTo('Planifcateur','admin'),vehController.updatevehicule)
    .delete(authController.protect,authController.restrictTo('Planifcateur','admin'),vehController.deletevehicule);
router.post('/availableveh',authController.protect,vehController.getAvailableveh);
router.post('/availableveh_update',authController.protect,vehController.getAvailableveh_update);

module.exports = router;