// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
const accountSchema = new Schema({
    currency: String,
    balance: Number,
    accountNumber: String,
    accountName: String,
    bank: String,
    default: Boolean,
});
const addressSchema = new Schema({
    ip: String,
    street: String,
    city: String,
    region: String,
    country: String,
});
const locationSchema = new Schema({
    ip: String,
    lastUsedIps: [String],
    street: String,
    city: String,
    region: String,
    country: String,
    isp: String,
    lat: Number,
    lon: Number,
});
const userSchema = new Schema({
    userId: {
        type: String,
        required: [true, "Please enter user id."],
        unique: true,
    },
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
            validator: (v) => validator.isEmail(v),
            message: ({ value }) => `${value} is not a valid email`,
        },
    },
    phoneNumber: {
        type: String,
        required: [true, "Please enter the user Phone number."],
        // unique: true,
        validate: {
            validator: (v) => validator.isMobilePhone(v),
            message: ({ value }) => `${value} is not a phone number.`,
        },
    },
    country: {
        type: String,
        required: [true, "Please enter the user country."]
    },
    status: {
        type: Boolean,
        required: true,
        // enum: [true, false],
        default: false
    },
    password: {
        type: String,
        required: [true, "User password required."]
    },
    dob: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    location: {
        type: locationSchema,
        required: true
    },
    pin: {
        type: Number,
        required: false
    },
    account: {
        type: [accountSchema],
        required: false
    },
    NIN: {
        type: Number,
        required: false
    },
    BVN: {
        type: Number,
        required: false
    },
    address: {
        type: addressSchema,
        required: false
    },
    idImage: {
        type: String,
        required: false
    },
    isAddressVerified: {
        type: Boolean,
        required: false,
    },
    isBVNverified: {
        type: Boolean,
        required: false
    },
    isEmailVerified: {
        type: Boolean,
        required: false
    },
    isNINverified: {
        type: Boolean,
        required: false
    },
    isPhoneNumberVerified: {
        type: Boolean,
        required: false
    },
    referredBy: {
        type: String,
        required: false
    },
}, { timestamps: true });
export const userModel = mongoose.model("User", userSchema);
