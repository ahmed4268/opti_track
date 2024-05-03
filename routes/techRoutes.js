const express = require('express');
const techController = require('../controllers/techController');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/mobile', techController.gettechmobile);

router
    .route('/')
    .get(authController.protect,techController.getAlltech)
    .post(authController.protect,authController.restrictTo('Planifcateur','admin'),techController.createtech);

router
    .route('/:id')
    .get(authController.protect,techController.gettech)
    .patch(authController.protect,authController.restrictTo('Planifcateur','admin'),techController.updatetech)
    .delete(authController.protect,authController.restrictTo('Planifcateur','admin'),techController.deletetech);
router.post('/availabletech',authController.protect, techController.getAvailableTech);
router.post('/availabletech_update',authController.protect, techController.getAvailableTech_update);


module.exports = router;