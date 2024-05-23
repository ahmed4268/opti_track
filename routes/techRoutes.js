const express = require('express');
const techController = require('../controllers/techController');
const router = express.Router();
const authController = require('../controllers/authController');
const Technician=require('../models/techModel');
router.get('/mobile', techController.gettechmobile);
router.patch('/technicians/:email/token', async (req, res) => {
    const technicianEmail = req.params.email;
    const token = req.body.token;
    console.log("aazaz",token,technicianEmail)
    try {
        const technician = await Technician.findOneAndUpdate(
            { Email: technicianEmail },
            { firebaseMessagingToken: token },
            { new: true, useFindAndModify: false }
        );

        if (!technician) {
            return res.status(404).send({ message: 'Technician not found' });
        } else {
            return res.status(200).send({ message: 'Token updated successfully', technician });
        }
    } catch (error) {
        console.log("err",error)
        return res.status(500).send({ message: 'Error updating token', error });
    }
});

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
