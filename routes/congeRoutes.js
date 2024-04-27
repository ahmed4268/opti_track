const express = require('express');
const congeController = require('../controllers/congeController');
const router = express.Router();


router
    .route('/')
    .get(congeController.getAllConges)
    .post(congeController.createConge)


router
    .route('/:id')
    .get(congeController.getConge)
    .patch(congeController.updateConge)
    .delete(congeController.deleteconge);

module.exports = router;