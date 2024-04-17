const Conge = require('../models/congeModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllConges = catchAsync(async (req, res, next) => {
    const conges = await Conge.find();
    res.status(200).json({
        status: 'success',
        results: conges.length,
        data: {
            conges
        }
    });
});

exports.getConge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
        return next('No congé found with that ID', 404);
    }
    res.status(200).json({
        status: 'success',
        data: {
            conge
        }
    });
});

exports.createConge = catchAsync(async (req, res, next) => {
    const newConge = await Conge.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            conge: newConge
        }
    });
});


exports.updateConge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!conge) {
        return next('No congé found with that ID', 404);
    }
    res.status(200).json({
        status: 'success',
        data: {
            conge
        }
    });
});

exports.deleteConge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findByIdAndDelete(req.params.id);
    if (!conge) {
        return next('No conge found with that ID', 404);
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});