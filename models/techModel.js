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
        Status: [
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
        Congé:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Congé',
            }
        ,
         disponibility : {
            type: Boolean,
            default: true,

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
        device:{
        type:Number,
        },
//tetna7a
        pastOperations: [
            {

                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Operation',
                },


        ],


    },
        { timestamps: true,
            toJSON: { virtuals: true },
           }



);
technicianSchema.virtual('Fullname').get(function () {

    return `${this.firstName} ${this.lastName}`;
});// Add timestamps for createdAt and updatedAt

// Create the Technician model
    const Technician = mongoose.model('Technician', technicianSchema);

    module.exports = Technician;

