const tech = require('../models/techModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

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
    console.log("ya3tik 3asba ya ahmed" +
        "" +
        "")
    return next('Please provide operation days in the request body.', 400);
}
        // Query the database for technicians who are available
        const availableTechnicians = await tech.find({
            disponibility: "disponible", // Technician is available
            unavailability: { $not: { $elemMatch: { date: { $in: operationDays } } } }
        });

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

    res.status(201).json({
        status: 'success',
        data: {
            tech: newTech
        }
    });
    next()
});

exports.updatetech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findByIdAndUpdate(req.params.id, req.body, {

        runValidators: true
    });

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

exports.deletetech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findByIdAndDelete(req.params.id);

    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    if (Tech.unavailability.length > 0) {
        return next('u cant delete an active technicien', 404);
    }


    res.status(204).json({
        status: 'success',
        data: null
    });
});
