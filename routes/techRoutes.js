const express = require('express');
const techController = require('../controllers/techController');
const router = express.Router();


router
    .route('/')
    .get(techController.getAlltech)
    .post(techController.createtech);

router
    .route('/:id')
    .get(techController.gettech)
    .patch(techController.updatetech)
    .delete(techController.deletetech);
module.exports = router;