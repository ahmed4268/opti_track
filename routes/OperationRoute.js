const express = require('express');
const operationController = require('../controllers/OperationController');

const router = express.Router();

router.get('/archive', operationController.archivedOperation);
router.get('/dashboard', operationController.Dashboard);
router.get('/map', operationController.Map);

router
    .route('/')
    .get(operationController.getAllOperation)
    .post(operationController.createOperation);

router
    .route('/:id')
    .get(operationController.getOperation)
    .patch(operationController.updateOperation)
    .delete(operationController.deleteOperation)
router.patch('/:id/complete', operationController.completeOperation);



module.exports = router;
