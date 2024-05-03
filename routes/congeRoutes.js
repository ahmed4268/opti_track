const express = require('express');
const congeController = require('../controllers/congeController');
const router = express.Router();
const authController = require('../controllers/authController');



router
    .route('/')
    .get(authController.protect,authController.restrictTo('Planifcateur','admin'),congeController.getAllConges)
    .post(authController.protect,authController.restrictTo('Planifcateur','admin'),congeController.createConge)


router
    .route('/:id')
    .get(authController.protect,authController.restrictTo('Planifcateur','admin'),congeController.getConge)
    .patch(authController.protect,authController.restrictTo('Planifcateur','admin'),congeController.updateConge)
    .delete(authController.protect,authController.restrictTo('Planifcateur','admin'),congeController.deleteconge);

module.exports = router;