// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import { transactionsInterface } from '@/typeInterfaces/transactions.js';
import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';

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

        data: {
            type: Object,
            required: true,
        },
        
        accountNo: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        transactionReference: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            required: true,
        },

    },
    { timestamps: true }
);

export const transactionModel = mongoose.model("Transaction", transactionSchema);