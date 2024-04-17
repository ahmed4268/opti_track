const cron = require('node-cron');
const Operation = require('./models/operation_Model');
const Technician = require('./models/techModel');
const Vehicle = require('./models/vehModel');
const Congé = require('./models/congeModel');

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
cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all Technician documents
    const technicians = await Technician.find();

    for (const technician of technicians) {
        // If the technician has a Congé document
        if (technician.Congé) {
            const conge = await Congé.findById(technician.Congé);

            let isOnVacation = false;

            // Check each vacation period
            for (const period of conge.vacationPeriods) {
                // If the current date is within the start and end dates of the vacation period
                if (today >= period.startDate && today <= period.endDate) {
                    isOnVacation = true;
                    break;
                }
            }

            // If the technician is on vacation but their disponibility is true, set it to false
            if (isOnVacation && technician.disponibility) {
                technician.disponibility = false;
            }

            // If the technician is not on vacation but their disponibility is false, set it to true
            if (!isOnVacation && !technician.disponibility) {
                technician.disponibility = true;
            }

            await technician.save();
        } else {
            // The technician has no Congé document, so if their disponibility is false, set it to true
            if (!technician.disponibility) {
                technician.disponibility = true;
                await technician.save();
            }
        }
    }
});