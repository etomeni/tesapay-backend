// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { savingsInterface } from '@/typeInterfaces/savingsInterface.js';


const savingsSchema = new mongoose.Schema<savingsInterface>(
    {   
        user_id: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },

        name: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true
        },
        duration: {
            type: Number,
            required: true,
        },
        paybackDate: {
            type: String,
            required: true,
        },
        interestRate: {
            type: Number,
            required: true,
        },
        interestGain: {
            type: Number,
            required: true,
        },
        totalPayback: {
            type: Number,
            required: true,
        },
        
        transactionReference: {
            type: String,
            required: true,
        },
        transaction_id: {
            type: String,
            required: true,
        },
        status: {
            type: String, // "Completed" | "Active" | "Liquidated" | "Processing"
            // required: true,
            default: "Processing"
        },
        closedDate: {
            type: String,
            // required: true,
        },
        
    },
    { timestamps: true }
);

export const savingsModel = mongoose.model('Savings', savingsSchema);
