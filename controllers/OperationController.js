const operation = require('../models/operation_Model');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const Site = require('../models/siteModel');
const Technician = require('../models/techModel');
const Vehicle = require('../models/vehModel');
const tech = require("../models/techModel");
exports.getAllOperation = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(operation.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const operations = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: operations.length,
        data: {
            operations
        }
    });
    next()
});

exports.getOperation = catchAsync(async (req, res, next) => {
    const Operation = await operation.findById(req.params.id);

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

exports.createOperation = catchAsync(async (req, res, next) => {
    const newOperation = await operation.create(req.body);

    const { technicians, vehicle, site, operationDays } = req.body;
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

    // tcm firebase notification
    // ...



    res.status(201).json({
        status: 'success',
        data: {
            operation: newOperation
        }
    });

    next()
});

exports.updateOperation = catchAsync(async (req, res, next) => {
    let { site, operationDays, technicians, vehicle } = req.body;
    const existingOperation = await operation.findById(req.params.id);
    const operationId = existingOperation._id;
    if (site !== undefined) {
        await Site.findByIdAndUpdate(existingOperation.site, {$pull: {pastOperations: req.params.id}});
        await Site.updateOne({_id: site}, {$push: {pastOperations: req.params.id}});
    }
    if (operationDays !== undefined) {

        if (vehicle !== undefined) {

            try {
                await checkVehicleAvailability(vehicle, operationDays);
                console.log('Vehicle is available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });

            }
            await pullVehicle(existingOperation);

            await updateVehicleUnavailability(vehicle, operationDays, operationId);
            await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });


        } else {
            await pullVehicle(existingOperation);
            try {
                await checkVehicleAvailability(existingOperation.vehicle, operationDays);
                console.log('Vehicle is available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });

            }
            await updateVehicleUnavailability(vehicle, operationDays, operationId);
            await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });

        }

        if (technicians !== undefined) {
            await pullTechnicians(existingOperation);
            try {
                await technicienVerification(technicians, operationDays);
                console.log('All technicians are available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });

            }
            await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);


            const oldTechnicians = existingOperation.technicians;
            const remainedTechnicians = oldTechnicians.filter(oldTech => technicians.some(newTech => newTech._id.equals(oldTech._id)));
            const removedTechnicians = oldTechnicians.filter(oldTech => !technicians.some(newTech => newTech._id.equals(oldTech._id)));
            const addedOrReplacedTechnicians = technicians.filter(newTech => !oldTechnicians.some(oldTech => oldTech._id.equals(newTech._id)));


            const result = await existingOperation.updateOne({_id: req.params.id}, req.body);

            if (remainedTechnicians.length > 0) {
                //send the update information
            }
            if (removedTechnicians.length > 0) {
                //send the bye bye information
            }
            if (addedOrReplacedTechnicians.length > 0) {
                //send the new operation information
            }
        } else {
            await pullTechnicians(existingOperation);

            try {
                await technicienVerification(existingOperation.technicians, operationDays);
                console.log('All technicians are available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            }
            await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);
            const result = await existingOperation.updateOne({_id: req.params.id}, req.body);
            //send the update information tcm

        }

    } else {

        if (vehicle !== undefined) {

            try {
                await checkVehicleAvailability(vehicle, operationDays);
                console.log('Vehicle is available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });

            }
            await pullVehicle(existingOperation);
            await updateVehicleUnavailability(vehicle, operationDays, operationId);
            await Vehicle.updateOne({ _id: vehicle }, { $push: { pastOperations:operationId } });

        }
        if (technicians !== undefined) {
            await pullTechnicians(existingOperation);
            try {
                await technicienVerification(technicians, operationDays);
                console.log('All technicians are available.');
            } catch (error) {
                console.error(error.message);
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });

            }
            await updateTechniciansUnavailabilityAndPastOperations(operationId, technicians, operationDays);
            const oldTechnicians = existingOperation.technicians;
            const remainedTechnicians = oldTechnicians.filter(oldTech => technicians.some(newTech => newTech._id.equals(oldTech._id)));
            const removedTechnicians = oldTechnicians.filter(oldTech => !technicians.some(newTech => newTech._id.equals(oldTech._id)));
            const addedOrReplacedTechnicians = technicians.filter(newTech => !oldTechnicians.some(oldTech => oldTech._id.equals(newTech._id)));


            const result = await existingOperation.updateOne({_id: req.params.id}, req.body);

            if (remainedTechnicians.length > 0) {
                //send the update information
            }
            if (removedTechnicians.length > 0) {
                //send the bye bye information
            }
            if (addedOrReplacedTechnicians.length > 0) {
                //send the new operation information
            }
        } else {

            //send the update information tcm
        }
    }
    if (!existingOperation) {
        return next('No operation found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            result
        }
    });
    next()
});

exports.deleteOperation= catchAsync(async (req, res, next) => {
    const Operation = await operation.findByIdAndDelete(req.params.id);

    if (!Operation) {
        return next('No Operation found with that ID', 404);
    }
    else {
        if (Operation.status === 'Planned') {
            const operationId = Operation._id;

            // Update technicians to remove the operation from their unavailability
            await pullTechnicians(Operation);


            // Update vehicle to remove the operation from its unavailability
            await pullVehicle(Operation);

            // Update site to remove the operation from its pastOperations
            await Site.findByIdAndUpdate(Operation.site, {$pull: {pastOperations: operationId}});
        } else {
            return res.status(400).json({
                status: 'error',
                message: "u can't delete in progress or completed operation",
            });
        }
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
    next()
});
exports.completeOperation = async (req, res, next) => {
    try {
        const operationId = req.params.id;
        const Operation = await operation.findByIdAndUpdate(operationId,req.body);
        if (!Operation) {
            return res.status(404).json({ message: 'Operation not found' });
        }
        console.log(Operation.technicians)
        await Technician.updateMany(
            { _id: { $in: Operation.technicians } },
            {
                $pull: {
                    unavailability: { operationId: operationId },
                },
            }
        );
        await Vehicle.findByIdAndUpdate(
            Operation.vehicle,
            {
                $pull: {
                    unavailability: { operationId: operationId },
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

async function technicienVerification(technicians,operationDays) {

    const unavailableTechnicians = await Promise.all(
        technicians.map(async (technicianId) => {
            const technician = await tech.findById(technicianId);

            if (!technician) {
                return null; // Handle missing technician
            } else if ( technician.disponibility !== "disponible") {
                return technician._id;
            } else {
                // console.log("azrzfc")
                // console.log(technician.unavailability[0].date)
                for (const date of operationDays) {
                    const formattedDate = new Date(date).toISOString();
                    if (technician.unavailability.some(unavailableDate => unavailableDate.date.toISOString() === formattedDate)) {
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
            if (vehicule && vehicule.unavailability.some((unavailableDate =>  unavailableDate.date.toISOString() === formattedDate))) {
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
                    unavailability: { operationId: operationId },
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
                    unavailability: { operationId: operationId },
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
            { $push: { unavailability: { $each: vehicleUnavailability } } },
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
                { $push: { unavailability: { $each: techniciansUnavailability } } },
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



