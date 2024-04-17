const site = require('../models/siteModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const axios = require('axios');
// const adminKey =uNfum2arPXDFpwJrieGMaL6CEEtOinAkf9afGd6w5ebhsFcl;
// const apiKey =PPDnoir69epGxtQlk07ueRzk6cF76Hft;
// const projectId=d0d3aef3-c1ee-40ba-9f88-ac305aa12fa6;

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

exports.createSite = catchAsync(async (req, res, next) => {
  // Create the new site
  const newSite = await site.create(req.body);

  // Extract necessary information for fence creation from the newly created site
  const { name, coordinates,_id } = newSite;

  // Define fence creation payload
  const fencePayload = {
    name: `${name}_fence`, // Assuming you want to name the fence based on the site name
    type: "Feature",
    geometry: {
      radius: 75,
      type: "Point",
      shapeType: "Circle", // Replace with your desired shape type
      coordinates: coordinates
    },
    properties: {
      site_id: _id.toString()
    } // You can add optional properties here
  };

  try {
    // Make POST request to create fence
    const response = await axios.post("https://api.tomtom.com/geofencing/1/projects/d0d3aef3-c1ee-40ba-9f88-ac305aa12fa6/fence?key=PPDnoir69epGxtQlk07ueRzk6cF76Hft&adminKey=uNfum2arPXDFpwJrieGMaL6CEEtOinAkf9afGd6w5ebhsFcl",fencePayload);

    // Log successful fence creation
    console.log('Fence created successfully:', response.data);

    // Send response to client
    res.status(201).json({
      status: 'success',
      data: {
        site: newSite,
        fence: response.data
      }
    });
  } catch (error) {
    // Handle errors
    console.error('Error creating fence:', error);
    next(error);
  }
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
