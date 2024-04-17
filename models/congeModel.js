const mongoose = require('mongoose');

const vacationPeriodSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
        required: true
    },
}, { _id: false });
vacationPeriodSchema.virtual('vacationDates').get(function() {
    const dates = [];
    let currentDate = new Date(this.startDate);

    while (currentDate <= this.returnDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
});

const congeSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
        required: true
    },
    vacationPeriods: {
        type: [vacationPeriodSchema], // Array of vacation periods
        required: true
    },

});

// Custom validator to check for overlapping vacations
congeSchema.path('vacationPeriods').validate(async function(value) {
    for (const vacationPeriod of value) {
        const overlappingVacations = await mongoose.models.Conge.find({
            technician: this.technician,
            vacationPeriods: {
                $elemMatch: {
                    $or: [
                        { $and: [{ startDate: { $lte: vacationPeriod.endDate } }, { endDate: { $gte: vacationPeriod.startDate } }] },
                        { $and: [{ startDate: { $lte: vacationPeriod.returnDate } }, { returnDate: { $gte: vacationPeriod.startDate } }] },
                        { $and: [{ endDate: { $lte: vacationPeriod.returnDate } }, { returnDate: { $gte: vacationPeriod.endDate } }] }
                    ]
                }
            }
        });

        if (overlappingVacations.length > 0) {
            return false;
        }
    }

    return true;
}, 'Vacation overlaps with existing vacations');

const Conge = mongoose.model('Conge', congeSchema);

module.exports = Conge;