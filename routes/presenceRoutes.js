const express = require('express');
const Controller = require('../controllers/PresenceConroller');
const router = express.Router();
const authController = require('../controllers/authController');

router
    .route('/')
    .get(authController.protect,authController.restrictTo('Planifcateur','admin'),Controller.getAllpres)

// router
//     .route('/:id')
//     .get(techController.gettech)
//     .patch(techController.updatetech)
//     .delete(techController.deletetech);
// router.post('/availabletech', techController.getAvailableTech);
// router.post('/availabletech_update', techController.getAvailableTech_update);


module.exports = router;