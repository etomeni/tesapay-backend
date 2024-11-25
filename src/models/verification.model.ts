// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import { verificationInterface } from '@/typeInterfaces/verificationInterface.js';


const verificationSchema = new Schema<verificationInterface>(
    {
        user: {
            email: {
                type: String,
                // required: [true, "Please enter the user email adddress."],
                // unique: true,
                lowercase: true,
                validate: {
                    validator: (v: string) => validator.isEmail(v),
                    message: ({ value }) => `${value} is not a valid email`,
                },
            },
            user_id: { type: String },
            firstName: { type: String },
            lastName: { type: String },
            middleName: { type: String },
            dob: { type: String }, // this will be overwritten by the BVN DOB
            phoneNumber: { type: String },
            userPhoto: { type: String }, // image url
            userVideo: { type: String }, // video url. Accepted video format is mp4. File size limit is 10mb. duraction max 15 sec.
        },

        accountNumber: { type: String },
        bvn_number: { 
            type: String,
            unique: true,
            required: true,
            index: true
        },
        bvnData: {
            type: Object,
            required: true,
        },
        nin_number: { type: String },
        ninData: { type: Object },

        idData: {
            idType: { type: String },
            idNumber: { type: String },
            idIssueDate: { type: String },
            idExpiryDate: { type: String },
            idCardFront: { type: String }, // image url
            idCardBack: { type: String }, // image url
        },
        address: {
            houseNumber: { type: String },
            streetName: { type: String },
            additional: { type: String },
            city: { type: String },
            nearestLandmark: { type: String },
            localGovernment: { type: String },
            state: { type: String },
            country: { type: String },
            proofOfAddressVerification: { type: String }, // image url
        },
        nationality: {
            // countryOfNationality: { type: String },
            placeOfBirth: { type: String },
            countryOfBirth: { type: String },
        },

        pep: { type: String },
        customerSignature: { type: String }, // image url
        utilityBill: { type: String }, // image url
    },
    { timestamps: true }
);

// verificationSchema.index({ bvn_number: 'text', verificationNumber: 'text' });
// verificationSchema.index({ bvn_number: 'text' });

export const verificationModel = mongoose.model("Verification", verificationSchema);