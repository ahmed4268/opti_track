const site = require('../models/siteModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.getAllSite = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(site.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const sites = await features.query;

  // SEND RESPONSE
  res.status(200).json(

      sites

  );
  next()
});

exports.getSite = catchAsync(async (req, res, next) => {
  const Site = await site.findById(req.params.id);

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      Site
    }
  });
});

exports.createSite= catchAsync(async (req, res, next) => {
  const newSite = await site.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      site: newSite
    }
  });
  next()
});

exports.updateSite = catchAsync(async (req, res, next) => {
  const Site = await site.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      Site
    }
  });
});

exports.deleteSite = catchAsync(async (req, res, next) => {
  const Site = await site.findByIdAndDelete(req.params.id);

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
