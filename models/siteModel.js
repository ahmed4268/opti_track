const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A site must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A site name must have less or equal then 40 characters'],
            minlength: [10, 'A site name must have more or equal then 10 characters']

        },

        address: {
            type: String,
            required: [true, 'A site must have a address'],
            maxlength: [40, 'A site address must have less or equal then 40 characters'],
            minlength: [10, 'A site address must have more or equal then 10 characters']
        },
        coordinates: {
            type: String
           ,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        pastOperations: [
            {

                type: mongoose.Schema.Types.ObjectId,
                ref: 'Operation',
            },


        ]
    });

const site = mongoose.model('site',siteSchema );

module.exports = site;
