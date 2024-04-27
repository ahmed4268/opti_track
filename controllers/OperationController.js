const operation = require('../models/operation_Model');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const Site = require('../models/siteModel');
const Technician = require('../models/techModel');
const Vehicle = require('../models/vehModel');
const axios = require("axios"); // Import the Congé model

exports.getAllOperation = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(operation.find().populate({
        path: 'technicians',
        select: 'Fullname lastName firstName phoneNumber',
        options: { virtuals: true }
    })
        .populate({
            path: 'responsable',
            options: { virtuals: true },
            select: 'Fullname lastName firstName phoneNumber'
        })

        .populate({
            path: 'driver',
            select: 'Fullname lastName firstName ',
            options: { virtuals: true }
        })
        .populate({
            path: 'vehicle',
            select: 'licensePlate brand model seats'
        })
        .populate({
            path: 'site',
            select: 'name address state city'
        }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const operations = await features.query;
    // SEND RESPONSE
    res.status(200).json(

            operations

    );
    next()
});

exports.getOperation = catchAsync(async (req, res, next) => {
    const Operation = await operation.findById(req.params.id).populate({
    path: 'technicians',
        select: 'Fullname lastName firstName phoneNumber'
})
        .populate({
            path: 'responsable',
            select: 'Fullname lastName firstName '
        })
        .populate({
            path: 'driver',
            select: 'Fullname lastName firstName '
        })
        .populate({
            path: 'vehicle',
            select: 'licensePlate brand seats'
        })
        .populate({
            path: 'site',
            select: 'name address state city'
        });


    if (!Operation) {
        return next('No operation found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            Operation
        }
    });
});
const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');

async function sendRequest(method, url, payload) {
    try {
        const response = await axios({
            method,
            url,
            data: payload,
            headers: {
                Authorization: `Basic ${credentials}`
            }
        });
        console.log('Request successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending request:', error);
    }
}
exports.createOperation = catchAsync(async (req, res, next) => {
    const newOperation = await operation.create(req.body);

    const { technicians, vehicle, site, operationDays,name } = req.body;
    try {
        await checkVehicleAvailability(vehicle,operationDays);
        console.log('Vehicle is available.');
        await technicienVerification(technicians,operationDays);
        console.log('All technicians are available.');
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });

    }
    await updateTechniciansUnavailabilityAndPastOperations(newOperation._id, technicians, operationDays);
    await updateVehicleUnavailability(vehicle, operationDays,newOperation._id);
    await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations: newOperation._id } });

    await Site.updateOne({ _id: site }, { $push: { pastOperations: newOperation._id } });
    const sitee = await Site.findById(site);
    if (!sitee) {
        return res.status(404).json({
            status: 'error',
            message: 'Site not found',
        });
    }

    const groupPayload = { name: name };
    const groupResponse = await sendRequest('post',"https://demo4.traccar.org/api/groups", groupPayload);
    const group = groupResponse.id;

    const permissionPayload = {
        groupId: group,
        geofenceId: sitee.geofence,
    };
    await sendRequest('post',"https://demo4.traccar.org/api/permissions", permissionPayload);

    const requests = technicians.map(async (technicianId) => {
        const tech = await Technician.findById(technicianId);
        if (!tech) {
            console.error(`Technician with ID ${technicianId} not found`);
            return;
        }

        const payload = {
            id: tech.device,
            groupId: group,
            name: tech.Fullname,
            uniqueId: tech._id
        };

        return sendRequest('put',`https://demo4.traccar.org/api/devices/${tech.device}`, payload);
    });

    await Promise.allSettled(requests);

    const veh = await Vehicle.findById(vehicle);
    if (!veh) {
        console.error(`Vehicle with ID ${vehicle} not found`);
        return;
    }

    const vehiclePayload = {
        id: veh.device,
        groupId: group,
        name: veh.licensePlate,
        uniqueId: veh._id
    };

    await sendRequest('put',`https://demo4.traccar.org/api/devices/${veh.device}`, vehiclePayload);

    newOperation.group = group;
    await newOperation.save();

    console.log('Operation created successfully:', newOperation);

    res.status(201).json({
        status: 'success',
        data: {
            operation: newOperation
        }
    });

    next();
});


exports.updateOperation = catchAsync(async (req, res, next) => {

        const { site, operationDays, technicians, vehicle ,endTime,startTime} = req.body;
        const operationId = req.params.id;

        const existingOperation = await operation.findById(operationId);
        if (!existingOperation) {
            return next('No operation found with that ID', 404);
        }

        try {
            await pullTechnicians(existingOperation);
            await pullVehicle(existingOperation);
            await checkVehicleAvailability(vehicle, operationDays);
            await technicienVerification(technicians, operationDays);
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                message: error.message,
            });
        }
    async function updateSite(oldSiteId, newSiteId, operationId) {
        // Remove the operation from the old site's past operations

        await Site.findByIdAndUpdate(oldSiteId, { $pull: { pastOperations: operationId } });

        // Add the operation to the new site's past operations
        await Site.findByIdAndUpdate(newSiteId, { $push: { pastOperations: operationId } });
    }
    async function updateVehicle(existingOperation, vehicle, operationDays) {
        // Remove the operation from the old vehicle's past operations
        await Vehicle.findByIdAndUpdate(existingOperation.vehicle, {
            $pull: {
                Status: { operationId: operationId },
                pastOperations: operationId,
            },
        });

        // Add the operation to the new vehicle's past operations
        await Vehicle.findByIdAndUpdate(vehicle, { $push: { pastOperations: existingOperation._id } });

        // Update the vehicle's unavailability
        const vehicleUnavailability = operationDays.map(date => ({ date, operationId: existingOperation._id }));
        await Vehicle.findByIdAndUpdate(vehicle, { $push: { Status: { $each: vehicleUnavailability } } });
    }

    async function updateTechnicians(existingOperation, technicians, operationDays) {
        // Remove the operation from the old technicians' past operations and Status
        await Technician.updateMany({ _id: { $in: existingOperation.technicians } }, { $pull: { pastOperations: existingOperation._id, Status: { operationId: existingOperation._id } } });

        // Add the operation to the new technicians' past operations
        await Technician.updateMany({ _id: { $in: technicians } }, { $push: { pastOperations: existingOperation._id } });

        // Update the technicians' unavailability
        const techniciansUnavailability = operationDays.map(date => ({ date, operationId: existingOperation._id }));
        const techniciansUpdatePromises = technicians.map(async (technicianId) => {
            await Technician.findByIdAndUpdate(technicianId, { $push: { Status: { $each: techniciansUnavailability } } });
        });
        await Promise.all(techniciansUpdatePromises);
    }

    async function updateOperationDays(existingOperation, operationDays, technicians, vehicle) {
        // Update the operation days in the existing operation
        existingOperation.operationDays = operationDays;

        // Update the technicians' and vehicle's unavailability
        await updateTechnicians(existingOperation, technicians, operationDays);
        await updateVehicle(existingOperation, vehicle, operationDays);
    }

        if (site && site !== existingOperation.site) {
            const oldSite = await Site.findById(existingOperation.site);
            const oldSiteGeofence = oldSite.geofence;

            // Send a request to delete the old site's permission
            const oldSitePermissionPayload = {
                groupId: existingOperation.group,
                geofenceId: oldSiteGeofence,
            };
            await sendRequest('delete', `https://demo4.traccar.org/api/permissions`, oldSitePermissionPayload);

            // Get the new site's geofence
            const newSite = await Site.findById(site);
            const newSiteGeofence = newSite.geofence;

            // Send a request to add the new site's permission
            const newSitePermissionPayload = {
                groupId: existingOperation.group,
                geofenceId: newSiteGeofence,
            };
            await sendRequest('post', `https://demo4.traccar.org/api/permissions`, newSitePermissionPayload);
            await updateSite(existingOperation.site, site, operationId);
        }

        // Update the operation days if they have changed
        if (operationDays && operationDays !== existingOperation.operationDays) {
            await updateOperationDays(existingOperation, operationDays, technicians, vehicle);
        }

        // Update the technicians if they have changed
        if (technicians && technicians !== existingOperation.technicians) {
            const oldTechnicians = existingOperation.technicians;
            const remainedTechnicians = oldTechnicians.filter(oldTech => technicians.some(newTech => newTech.toString() === oldTech.toString()));
            const removedTechnicians = oldTechnicians.filter(oldTech => !technicians.some(newTech => newTech.toString() === oldTech.toString()));
            const addedOrReplacedTechnicians = technicians.filter(newTech => !oldTechnicians.some(oldTech => newTech.toString() === oldTech.toString()));
            console.log("oldTechnicians",removedTechnicians);
            console.log("newTechnicians",addedOrReplacedTechnicians);
            console.log("remainedTechnicians",remainedTechnicians);
            // Send a request to update each old technician's group to 0
            for (const oldTechId of removedTechnicians) {
                const oldTech = await Technician.findById(oldTechId);
                if (!oldTech) {
                    console.error(`Technician with ID ${oldTechId} not found`);
                    continue;
                }
                const oldTechPayload = {
                    id: oldTech.device,
                    groupId: 0,
                    name: oldTech.Fullname,
                    uniqueId: oldTech._id
                };
                await sendRequest('put', `https://demo4.traccar.org/api/devices/${oldTech.device}`, oldTechPayload);
            }

            // Send a request to update each new technician's group to the operation's group
            for (const newTechId of addedOrReplacedTechnicians) {
                const newTech = await Technician.findById(newTechId);
                if (!newTech) {
                    console.error(`Technician with ID ${newTechId} not found`);
                    continue;
                }
                const newTechPayload = {
                    id: newTech.device,
                    groupId: existingOperation.group,
                    name: newTech.Fullname,
                    uniqueId: newTech._id
                };
                await sendRequest('put', `https://demo4.traccar.org/api/devices/${newTech.device}`, newTechPayload);
            }
            await updateTechnicians(existingOperation, technicians, operationDays);
        }

        // Update the vehicle if it has changed
        if (vehicle && vehicle !== existingOperation.vehicle) {
            const oldveh = await Vehicle.findById(existingOperation.vehicle);
            const oldVehiclePayload = {
                id: oldveh.device,
                groupId: 0,
                name: oldveh.licensePlate,
                uniqueId: oldveh._id
            };
            await sendRequest('put', `https://demo4.traccar.org/api/devices/${oldveh.device}`, oldVehiclePayload);
            const newveh = await Vehicle.findById(vehicle);
            // Send a request to update the new vehicle's group to the operation's group
            const newVehiclePayload = {
                id: newveh.device,
                groupId: existingOperation.group,
                name: newveh.licensePlate,
                uniqueId: newveh._id
            };
            await sendRequest('put', `https://demo4.traccar.org/api/devices/${newveh.device}`, newVehiclePayload);
            await updateVehicle(existingOperation, vehicle, operationDays);
        }
    const operationStartTime = new Date(startTime);
    const operationEndTime = new Date(endTime);
   console.log('Operation start time:', operationStartTime);
    console.log('Operation end time:', operationEndTime);
    // Get the current time
    const currentTime = new Date();

    // Compare the current time with the operation's start and end times
    if (currentTime < operationStartTime) {
        // If the current time is before the operation's start time, set the operation's status to 'Planned'
        existingOperation.status = 'Planned';
    } else if (currentTime >= operationStartTime && currentTime <= operationEndTime) {
        // If the current time is after the operation's start time but before its end time, set the operation's status to 'In Progress'
        existingOperation.status = 'In Progress';
        const techniciens=req.body.technicians;
        for (const technician of techniciens) {
            const  technicien= await Technician.findById(technician);
            technicien.currentOperation =operationId;
            await technicien.save();
        }
    }
        Object.assign(existingOperation, req.body);
        // Save the updated operation
        const updatedOperation = await existingOperation.save();

        res.status(200).json({
            status: 'success',
            data: {
                operation: updatedOperation
            }
        });

});
//     let { site, operationDays, technicians, vehicle } = req.body;
//     const existingOperation = await operation.findByIdAndUpdate(req.params.id, req.body, {
//         runValidators: false
//     });
//     const operationId = existingOperation._id;
//     if (site !== undefined) {
//         await Site.findByIdAndUpdate(existingOperation.site, {$pull: {pastOperations: req.params.id}});
//         await Site.updateOne({_id: site}, {$push: {pastOperations: req.params.id}});
//     }
//     if (operationDays !== undefined) {
//
//         if (vehicle !== undefined) {
//
//             try {
//                 await checkVehicleAvailability(vehicle, operationDays);
//                 console.log('Vehicle is available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//
//             }
//             await pullVehicle(existingOperation);
//
//             await updateVehicleUnavailability(vehicle, operationDays, operationId);
//             await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });
//
//
//         } else {
//             await pullVehicle(existingOperation);
//             try {
//                 await checkVehicleAvailability(existingOperation.vehicle, operationDays);
//                 console.log('Vehicle is available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//
//             }
//             await updateVehicleUnavailability(vehicle, operationDays, operationId);
//             await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });
//
//         }
//
//         if (technicians !== undefined) {
//             await pullTechnicians(existingOperation);
//             try {
//                 await technicienVerification(technicians, operationDays);
//                 console.log('All technicians are available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//
//             }
//             await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);
//
//
//             const oldTechnicians = existingOperation.technicians;
//             const remainedTechnicians = oldTechnicians.filter(oldTech => technicians.some(newTech => newTech === oldTech));
//             const removedTechnicians = oldTechnicians.filter(oldTech => !technicians.some(newTech => newTech === oldTech));
//             const addedOrReplacedTechnicians = technicians.filter(newTech => !oldTechnicians.some(oldTech => newTech === oldTech));
//
//
// //const result = await operation.updateOne({_id: req.params.id}, req.body);
//
//             if (remainedTechnicians.length > 0) {
//                 //send the update information
//             }
//             if (removedTechnicians.length > 0) {
//                 //send the bye bye information
//             }
//             if (addedOrReplacedTechnicians.length > 0) {
//                 //send the new operation information
//             }
//         } else {
//             await pullTechnicians(existingOperation);
//
//             try {
//                 await technicienVerification(existingOperation.technicians, operationDays);
//                 console.log('All technicians are available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//             }
//             await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);
//         //    const result = await operation.updateOne({_id: req.params.id}, req.body);
//             //send the update information tcm
//
//         }
//
//     } else {
//
//         if (vehicle !== undefined) {
//
//             try {
//                 await checkVehicleAvailability(vehicle, operationDays);
//                 console.log('Vehicle is available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//
//             }
//             await pullVehicle(existingOperation);
//             await updateVehicleUnavailability(vehicle, operationDays, operationId);
//             await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });
//
//         }
//         if (technicians !== undefined) {
//             await pullTechnicians(existingOperation);
//             try {
//                 await technicienVerification(technicians, operationDays);
//                 console.log('All technicians are available.');
//             } catch (error) {
//                 console.error(error.message);
//                 return res.status(400).json({
//                     status: 'error',
//                     message: error.message,
//                 });
//
//             }
//             await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);
//             const oldTechnicians = existingOperation.technicians;
//             const remainedTechnicians = oldTechnicians.filter(oldTech => technicians.some(newTech => newTech === oldTech));
//             const removedTechnicians = oldTechnicians.filter(oldTech => !technicians.some(newTech => newTech === oldTech));
//             const addedOrReplacedTechnicians = technicians.filter(newTech => !oldTechnicians.some(oldTech => newTech === oldTech));
//
//
// //const result = await operation.updateOne({_id: req.params.id}, req.body);
//
//             if (remainedTechnicians.length > 0) {
//                 //send the update information
//             }
//             if (removedTechnicians.length > 0) {
//                 //send the bye bye information
//             }
//             if (addedOrReplacedTechnicians.length > 0) {
//                 //send the new operation information
//             }
//         } else {
//
//             //send the update information tcm
//         }
//     }
//     if (!existingOperation) {
//         return next('No operation found with that ID', 404);
//     }
//
//     res.status(200);
//
//
//     next()
// });

exports.deleteOperation = catchAsync(async (req, res, next) => {
    const Operation = await operation.findById(req.params.id);
    const operationId = req.params.id;

    if (!Operation) {
        return next('No Operation found with that ID', 404);
    } else {
        if (Operation.status === 'Completed') {
            return res.status(400).json({
                status: 'error',
                message: "You can't delete a completed operation",
            });
        } else if (Operation.status === 'In Progress' || Operation.status === 'Planned') {
            const groupId = Operation.group; // replace this with the actual group id
            await sendRequest('delete', `https://demo4.traccar.org/api/groups/${groupId}`);
            // Update technicians to remove the operation from their unavailability
            await pullTechnicians(Operation);

            // Update vehicle to remove the operation from its unavailability
            await pullVehicle(Operation);

            // Update site to remove the operation from its pastOperations
            await Site.findByIdAndUpdate(Operation.site, { $pull: { pastOperations: operationId } });

            if (Operation.status === 'Planned') {
                // If status is "Planned", delete the operation
                await Operation.remove();
            } else {
                // If status is "In Progress", change status to "Canceled"
                Operation.status = 'Canceled';
                await Operation.save();
            }
        }
    }


    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.completeOperation = async (req, res, next) => {
    try {
        const operationId = req.params.id;
        const Operation = await operation.findByIdAndUpdate(operationId,{ status: 'Completed' });
        if (!Operation) {
            return res.status(404).json({ message: 'Operation not found' });
        }
        const groupId = Operation.group; // replace this with the actual group id
        await sendRequest('delete', `https://demo4.traccar.org/api/groups/${groupId}`);
        await Technician.updateMany(
            { _id: { $in: Operation.technicians } },
            {
                $pull: {
                    Status: { operationId: operationId },
                },
            }
        );
        await Vehicle.findByIdAndUpdate(
            Operation.vehicle,
            {
                $pull: {
                    Status: { operationId: operationId },
                },
            }
        );

        res.status(200).json({
            status: 'success',
            data: Operation
        });

        // Continue to the next middleware
        next();
    } catch (error) {
        console.error('Error completing operation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.archivedOperation = async (req, res, next) => {
    const operations = await operation.find({ status: { $in: ['Completed', 'Canceled'] } }).populate({
        path: 'technicians',
        select: 'Fullname lastName firstName phoneNumber',
        options: { virtuals: true }
    })
        .populate({
            path: 'responsable',
            options: { virtuals: true },
            select: 'Fullname lastName firstName phoneNumber'
        })

        .populate({
            path: 'driver',
            select: 'Fullname lastName firstName ',
            options: { virtuals: true }
        })
        .populate({
            path: 'vehicle',
            select: 'licensePlate brand model seats'
        })
        .populate({
            path: 'site',
            select: 'name address state city'
        });


    res.status(200).json(

        operations

    );
    next()
};
exports.Dashboard = async (req, res, next) => {
    const operations = await operation.find({ status: { $in: ['Planned', 'In Progress'] } }).populate({
        path: 'technicians',
        select: 'Fullname lastName firstName phoneNumber',
        options: { virtuals: true }
    })
        .populate({
            path: 'responsable',
            options: { virtuals: true },
            select: 'Fullname lastName firstName phoneNumber'
        })

        .populate({
            path: 'driver',
            select: 'Fullname lastName firstName ',
            options: { virtuals: true }
        })
        .populate({
            path: 'vehicle',
            select: 'licensePlate brand model seats'
        })
        .populate({
            path: 'site',
            select: 'name address state city'
        });


    res.status(200).json(

        operations

    );
    next()
};
exports.Map = async (req, res, next) => {
    const operations = await operation.find({ status:'In Progress'}).populate({
        path: 'technicians',
        select: 'Fullname lastName firstName device phoneNumber',
        options: { virtuals: true }
    })
        .populate({
            path: 'responsable',
            options: { virtuals: true },
            select: 'Fullname lastName firstName device phoneNumber'
        })

        .populate({
            path: 'driver',
            select: 'Fullname lastName device firstName ',
            options: { virtuals: true }
        })
        .populate({
            path: 'vehicle',
            select: 'licensePlate brand model  device seats'
        })
        .populate({
            path: 'site',
            select: 'name address state city'
        });


    res.status(200).json(

        operations

    );
    next()
};
async function technicienVerification(technicians,operationDays) {

    const unavailableTechnicians = await Promise.all(
        technicians.map(async (technicianId) => {
            const technician = await Technician.findById(technicianId).populate('Conge');

            if (!technician) {
                return null; // Handle missing technician
            } else if (!technician.disponibility) {
                return technician._id;
            } else {
                for (const date of operationDays) {
                    const formattedDate = new Date(date).toISOString();
                    if (technician.Conge && technician.Conge.length > 0) {
                        const activeConges = technician.Conge.filter(conge => !conge.archived);
                        for (const conge of activeConges) {
                            if (formattedDate >= conge.startDate && formattedDate <= conge.returnDate) {
                                return technician._id;
                            }
                        }
                    }
                    if (technician.Status.some(unavailableDate => unavailableDate.date.toISOString() === formattedDate)) {
                        return technician._id;
                    }
                }
            }

            return null;
        })
    );

    const validTechnicians = unavailableTechnicians.filter((techId) => techId !== null);
console.log(validTechnicians)
    if (validTechnicians.length > 0) {
        const errorMessage = `Technician(s) with ID(s) ${validTechnicians.join(',')} is/are unavailable.`;
        throw new Error(errorMessage);
    }

    return true;
}
async function checkVehicleAvailability(vehicle,operationDays) {
    const vehicleId = vehicle._id;
    const vehicule = await Vehicle.findById(vehicleId);


    if (vehicule && vehicule.disponibility !== "disponible") {
        const errorMessage = "The vehicle is unavailable.";
        throw new Error(errorMessage);
    } else {
        for (const date of operationDays) {
            const formattedDate = new Date(date).toISOString();
            if (vehicule && vehicule.Status.some((unavailableDate =>  unavailableDate.date.toISOString() === formattedDate))) {
                const errorMessage = `The vehicle is unavailable for the specified operation period.`;
                throw new Error(errorMessage);
            }
        }
    }

    return true;
}
async function pullTechnicians(operation) {
    const { technicians,_id: operationId } = operation;

    try {
        const result = await Technician.updateMany(
            { _id: { $in: technicians } },
            {
                $pull: {
                    Status: { operationId: operationId },
                    pastOperations: operationId,
                },
            }
        );

        console.log(`Update successful. Modified ${result.nModified} documents.`);
    } catch (error) {
        console.error('Error updating technicians:', error);
    }
}
async function pullVehicle(operation) {
    const { vehicle, _id: operationId } = operation;

    try {
        const result = await Vehicle.findByIdAndUpdate(
            vehicle,
            {
                $pull: {
                    Status: { operationId: operationId },
                    pastOperations: operationId,
                },
            }
        );

        console.log(`Update successful. Modified ${result ? 1 : 0} document.`);
    } catch (error) {
        console.error('Error updating vehicle:', error);
    }
}
// Define the function
async function updateVehicleUnavailability(vehicleId, operationDays, newOperationId) {
    try {
        const vehicleUnavailability = operationDays.map(date => ({ date, operationId: newOperationId }));

        const result = await Vehicle.findByIdAndUpdate(
            vehicleId,
            { $push: { Status: { $each: vehicleUnavailability } } },
            { new: true }
        );

        console.log(`Update successful. Modified document:`, result);
    } catch (error) {
        console.error('Error updating vehicle unavailability:', error);
    }
}
// Define the function
async function updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays) {
    try {
        // Update technicians' unavailability
        const techniciansUnavailability = operationDays.map(date => ({ date, operationId: operationId }));
        const techniciansUpdatePromises = technicians.map(async (technicianId) => {
            await Technician.findByIdAndUpdate(
                technicianId,
                { $push: { Status: { $each: techniciansUnavailability } } },
                { new: true }
            );
        });

        // Update technicians' past operations
        await Technician.updateMany({ _id: { $in: technicians } }, { $push: { pastOperations: operationId } });

        // Wait for all technician updates to complete
        await Promise.all(techniciansUpdatePromises);

        console.log(`Technicians update successful.`);
    } catch (error) {
        console.error('Error updating technicians:', error);
    }
}



