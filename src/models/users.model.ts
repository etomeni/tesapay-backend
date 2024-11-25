import mongoose, { Schema } from 'mongoose';
// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import validator from 'validator';
import { userInterface } from '@/typeInterfaces/userInterface.js';
// import { userInterface } from './types.js';


const userSchema = new Schema<userInterface>(
    {
        // userId: {
        //     type: String,
        //     required: [true, "Please enter user id."],
        //     unique: true,
        // },
        role: { 
            type: String, 
            enum: ['user', 'admin'], 
            default: 'user' 
        }, // Added role field
        firstName: {
            type: String,
            required: [true, "Please enter the user name."]
        },
        middleName: {
            type: String,
            required: false
        },
        lastName: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: [true, "Please enter the user username."],
            
            unique: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, "Please enter the user email adddress."],

            unique: true,
            lowercase: true,
            validate: {
                validator: (v: string) => validator.isEmail(v),
                message: ({ value }) => `${value} is not a valid email`,
            },
        },
        phoneNumber: {
            type: String,
            required: [true, "Please enter a valid phone number."],
            unique: true,

            // validate: {
            //     validator: (v: string) => validator.isMobilePhone(v),
            //     message: ({ value }) => `${value} is not a valid phone number.`,
            // },
        },
        country: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        dob: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true
        },
        // account: {
        //     type: [accountSchema],
        //     required: false
        // },

        bvnNumber: {
            type: String,
            required: true,
        },

        verification_id: {
            type: String,
            // required: true
        },

        isBvnPhoneNoVerified: {
            type: Boolean,
            // required: false,
            default: false
        },
        pin: {
            type: String,
            required: false
        },
        location: {
            type: Object,
            required: true
        },
        referredBy: {
            type: String,
            lowercase: true,
            required: false
        },
        status: {
            type: Boolean,
            required: true,
            // enum: [true, false],
            default: true
        },
        isAccountDeleted: {
            type: Boolean,
            // required: false,
            default: false
        }
    },
    { timestamps: true }
);

export const userModel = mongoose.model("User", userSchema);
