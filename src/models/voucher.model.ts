// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { VoucherInterface } from '@/typeInterfaces/vouchers.js';


const voucherSchema = new mongoose.Schema<VoucherInterface>(
    {   
        voucherCode: {
            type: String,
            unique: true,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        numberOfUse: {
            type: Number,
            required: true
        },
        remainingUses: {
            type: Number,
            required: true
        },
        redeemedCount: {
            type: Number,
            default: 0
        },
        message: {
            type: String,
            default: ''
        },
        isEnded: {
            type: Boolean,
            default: false,
        },
        ended: {
            type: Object
        },
        createdBy: {
            user: {
                type: Object, 
            },
            transaction_id: {
                type: String, 
            },
            transactionReference: {
                type: String, 
            },
            // required: true,
        },
        redeemedBy: [
            {
                user: {
                    type: Object, 
                },
                transaction_id: {
                    type: String, 
                },
                transactionReference: {
                    type: String, 
                },
                redeemedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    },
    { timestamps: true }
);

export const voucherModel = mongoose.model('Voucher', voucherSchema);
