const express = require('express');
const siteController = require('../controllers/siteController');
const authController = require('../controllers/authController');

const router = express.Router();


router
  .route('/')
  .get(authController.protect,siteController.getAllSite)
  .post(authController.protect,authController.restrictTo('Planifcateur','admin'),siteController.createSite);

router
  .route('/:id')
  .get(authController.protect,siteController.getSite)
  .patch(authController.protect,authController.restrictTo('Planifcateur','admin'),siteController.updateSite)
  .delete(authController.protect,authController.restrictTo('Planifcateur','admin'),siteController.deleteSite);

module.exports = router;
