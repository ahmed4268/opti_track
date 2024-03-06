const mongoose=require('mongoose');

const Enum =require('enum');
const {ObjectId} = require("mongodb");

    const technicianSchema = new mongoose.Schema({


    firstName: {
            type: String,
            required: true,
        },

        lastName: {
            type: String,
            required: true,
        },
        Email: {
            type: String,
            required: true,
            unique:true,

        },
        phoneNumber: {
            type: String,
            required: true,
            unique:true,
            validate: {
                validator: function (value) {
                    // Check if the phone number has exactly 8 digits
                    return /^[0-9]{8}$/.test(value);
                },
                message: 'Phone number must be 8 digits long.',
            },
        },
        unavailability: [
            {
                operationId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Operation',
                    required: true,
                },
                date: {
                    type: Date,
                    required: true,
                },
            },
        ],
        disponibility: {
            type: String,
            enum: ['disponible', 'indisponible'],
            default: 'disponible',
        },

        specialization: {
            type: String,
            required: true,
        },
        Permis:{
        type:String,
            enum: ['car', 'truck', 'plane XD'],
        required:true,

        }
        ,

        pastOperations: [
            {

                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Operation',
                },


        ],


    }, { timestamps: true }); // Add timestamps for createdAt and updatedAt

// Create the Technician model
    const Technician = mongoose.model('Technician', technicianSchema);

    module.exports = Technician;

