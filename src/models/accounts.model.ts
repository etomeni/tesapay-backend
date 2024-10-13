// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import { accountInterface } from './types.js';


const accountSchema = new Schema<accountInterface>(
    {
        userId: {
            type: String,
            required: [true, "Please enter user id."],
            unique: true,
            index: true
        },
        username: {
            type: String,
            required: [true, "Please enter the user username."],
            
            unique: true,
            lowercase: true,
            index: true
        },
        userEmail: {
            type: String,
            required: [true, "Please enter the user email adddress."],

            unique: true,
            lowercase: true,
            validate: {
              validator: (v: string) => validator.isEmail(v),
              message: ({ value }) => `${value} is not a valid email`,
            },
        },

        lastName: {
            type: String,
            required: [true, "lastName is required."]
        },
        otherNames: {
            type: String,
            required: [true, "lastName is required."]
        },
        phoneNo: {
            type: String,
            required: [true, "phoneNo is required."],
            // index: true
        },
        gender: {
            type: Number,
            required: [true, "gender is required."]
        },
        dateOfBirth: {
            type: String,
            required: [true, "date of birth is required."]
        },

        email: {
            type: String,
            required: [true, "Please enter the user email adddress."],

            // unique: true,
            lowercase: true,
            validate: {
              validator: (v: string) => validator.isEmail(v),
              message: ({ value }) => `${value} is not a valid email`,
            },
        },

        bvn: {
            type: String,
            required: [true, "bvn is required."],
            // index: true
        },
        walletType: {
            type: String,
            required: [true, "wallet type is required."]
        },
        customerID: {
            type: String,
            required: true
        },
        accountNumber: {
            type: String,
            required: [true, "account number is required."],
            index: true
        },
        accountName: {
            type: String,
            required: true
        },
        accountRef: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        tier: {
            type: String,
            required: true
        },
        
        ngn: {
            availableBalance: {
                type: Number,
                required: true
            },
            number: {
                type: String,
                required: true
            },
            pndstatus: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            productCode: {
                type: String,
                required: true
            },
            lienStatus: {
                type: String,
                required: true
            },
            freezeStatus: {
                type: String,
                required: true
            },
            ledgerBalance: {
                type: Number,
                required: true
            },
            maximumBalance: {
                type: Number,
                required: true
            },
            nuban: {
                type: String,
                required: true
            }
        },

        otherCurrencies: {
            type: Object,
            required: false
        }

    },
    { timestamps: true }
);

accountSchema.index({ username: 'text', accountNumber: 'text' });

export const accountModel = mongoose.model("Account", accountSchema);