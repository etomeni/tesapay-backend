// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { transactionsInterface } from './types.js';


const transactionSchema = new Schema<transactionsInterface>(
    {
        user_id: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },

        waas: {
            type: Object,
            required: false,
        },

        vas: {
            type: Object,
            required: false,
        },

        status: {
            type: String,
            required: true,
        },

    },
    { timestamps: true }
);

export const transactionModel = mongoose.model("Transaction", transactionSchema);