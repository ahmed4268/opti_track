const express = require('express');
const techController = require('../controllers/techController');
const router = express.Router();

router.get('/mobile', techController.gettechmobile);

router
    .route('/')
    .get(techController.getAlltech)
    .post(techController.createtech);

router
    .route('/:id')
    .get(techController.gettech)
    .patch(techController.updatetech)
    .delete(techController.deletetech);
router.post('/availabletech', techController.getAvailableTech);
router.post('/availabletech_update', techController.getAvailableTech_update);


module.exports = router;