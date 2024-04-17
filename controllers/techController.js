const tech = require('../models/techModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const axios = require("axios");

exports.getAlltech = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(tech.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const techs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: techs.length,
        data: {
            techs
        }
    });
    next()
});
exports.getAvailableTech = catchAsync(async (req, res, next) => {

    try {
        const operationDays = req.body.operationDays; // Get operation days array from request body
if (!operationDays) {

    return next('Please provide operation days in the request body.', 400);
}
        // Query the database for technicians who are available
        const availableTechnicians = await tech.find({
            disponibility: true, // Technician is available
            Status: { $not: { $elemMatch: { date: { $in: operationDays } } } }
        });

        res.json(availableTechnicians); // Return array of technician objects as JSON response
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});
exports.getAvailableTech_update = catchAsync(async (req, res, next) => {

    try {
        const {operationDays,techs_id} = req.body; // Get operation days array from request body
if (!operationDays) {

    return next('Please provide operation days in the request body.', 400);
}
        // Query the database for technicians who are available
        let availableTechnicians = await tech.find({
            _id: { $nin: techs_id }, // Ignore the IDs in the techs_id array
            disponibility: true, // Technician is available
            Status: { $not: { $elemMatch: { date: { $in: operationDays } } } }
        });
        let oldTechnicians = await tech.find({
            _id: { $in: techs_id }});
        availableTechnicians = availableTechnicians.concat(oldTechnicians);
        res.json(availableTechnicians); // Return array of technician objects as JSON response
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});


exports.gettech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findById(req.params.id);

    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            Tech
        }
    });
});

exports.createtech= catchAsync(async (req, res, next) => {
    const newTech = await tech.create(req.body);
    const { Fullname,_id } = newTech;

    // Define fence creation payload
    const techPayload = {
        name: Fullname,
        uniqueId:_id,
        category: "technician",
    };
    const credentials = Buffer.from('ahmedhorizon2021@gmail.com:dHaB5uAZ9tC!M4K').toString('base64');

    try {

        const response = await axios.post("https://demo4.traccar.org/api/devices",techPayload,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

        newTech.device = response.data.id;
        await newTech.save();
        console.log('tech created successfully:', response.data);


        res.status(201).json({
            status: 'success',
            data: {
                tech: newTech,
                device: response.data
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Error creating device:', error);
        next(error);
    }

    next()
});

exports.updatetech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findByIdAndUpdate(req.params.id, req.body, {

        runValidators: true
    });

    if (!Tech) {
        return next('No technician found with that ID', 404);
    }
    const devicePayload = {
        name: Tech.Fullname,
        uniqueId: Tech._id,
        category: "technician",
    };
    const credentials = Buffer.from('ahmedhorizon2021@gmail.com:dHaB5uAZ9tC!M4K').toString('base64');

    try {
        const response = await axios.put(`https://demo4.traccar.org/api/devices/${Tech.device}`, devicePayload,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                tech: Tech,
                device: response.data
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Error updating device:', error);
        next(error);
    }
    res.status(200).json({
        status: 'success',
        data: {
            Tech
        }
    });
});

exports.deletetech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findByIdAndDelete(req.params.id);

    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    if (Tech.Status.length > 0) {
        return next('u cant delete an active technicien', 404);
    }
    const credentials = Buffer.from('ahmedhorizon2021@gmail.com:dHaB5uAZ9tC!M4K').toString('base64');

    try {
        const response = await axios.delete(`https://demo4.traccar.org/api/devices/${Tech.device}`,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

            console.log('Device deleted successfully:', response.data);
    } catch (error) {
        // Handle errors
        console.error('Error deleting device:', error);
        next(error);
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});
