const express = require('express');
const operationController = require('../controllers/OperationController');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/archive',authController.protect,authController.restrictTo('ChefProjet','admin'), operationController.archivedOperation);
router.get('/dashboard', authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.Dashboard);
router.get('/map', authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.Map);

router
    .route('/')
    .get(authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.getAllOperation)
    .post(authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.createOperation);

router
    .route('/:id')
    .get(authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.getOperation)
    .patch(authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.updateOperation)
    .delete(authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.deleteOperation)
router.patch('/:id/complete', authController.protect,authController.restrictTo('ChefProjet','admin'),operationController.completeOperation);



module.exports = router;
