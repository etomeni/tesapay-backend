import mongoose, { Schema } from 'mongoose';
// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import { settingsInterface } from '@/typeInterfaces/settingsInterface.js';


const settingsSchema = new Schema<settingsInterface>({
    savings: { 
        // type: mongoose.Schema.Types.ObjectId, 
        interestRate: {
            type: Number,
            min: 0,
            max: 100, 
            default: 0
        },
        minDuration: {
            type: Number,
            min: 7,
            max: 365,
            default: 7
        },
        maxDuration: {
            type: Number,
            default: 7
        },
        status: {
            type: Boolean,
            default: true
        },
    },

    isAppDisabled: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });
  
export const settingsModel = mongoose.model('AppSettings', settingsSchema);