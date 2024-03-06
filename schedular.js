const cron = require('node-cron');
const Operation = require('./models/operation_Model');
const Technician = require('./models/techModel');
const Vehicle = require('./models/vehModel');

const updateOperationStatus = async () => {
    const currentDateTime = new Date();
    try {
        // Update operation status
        const result = await Operation.updateMany(
            {
                startTime: { $lte: currentDateTime },
                status: 'Planned',
            },
            { $set: { status: 'In Progress' } }
        );

        console.log(`${result.nModified} operation(s) updated successfully.`);

    } catch (error) {
        console.error('Error updating operation statuses and clearing unavailability arrays:', error);
    }
};
const clearUnavailabilityArrays = async () => {
    const currentDateTime = new Date();

    try {
        await Technician.updateMany(
            {},
            { $pull: { unavailability: { date: { $lt: currentDateTime } } } }
        );

        await Vehicle.updateMany(
            {},
            { $pull: { unavailability: { date: { $lt: currentDateTime } } } }
        );

        console.log('Unavailability arrays cleared successfully.');
    } catch (error) {
        console.error('Error clearing unavailability arrays:', error);
    }
};

cron.schedule('0 0 * * 0', clearUnavailabilityArrays);

cron.schedule('* * * * *', updateOperationStatus);
