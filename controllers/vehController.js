const vehi = require('../models/vehModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.getAllvehicules = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(vehi.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const veh = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: veh.length,
        data: {
            veh
        }
    });
    next()
});

exports.getvehicule = catchAsync(async (req, res, next) => {
    const veh = await vehi.findById(req.params.id);

    if (!veh) {
        return next('No car found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            veh
        }
    });
});

exports.createvehicule= catchAsync(async (req, res, next) => {
    const newvehicule = await vehi.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            site: newvehicule
        }
    });
    next()
});

exports.updatevehicule = catchAsync(async (req, res, next) => {
    const veh = await vehi.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!veh) {
        return next('No car found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            veh
        }
    });
});

exports.deletevehicule = catchAsync(async (req, res, next) => {
    const veh = await vehi.findByIdAndDelete(req.params.id);

    if (!veh) {
        return next('No car found with that ID', 404);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
