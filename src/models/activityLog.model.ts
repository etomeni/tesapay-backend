import mongoose, { Schema } from 'mongoose';
// import mongoose, { model, Schema, SchemaTypes,  } from 'mongoose';
import { activityLogInterface } from '@/typeInterfaces/activityLogInterface.js';


const activityLogSchema = new Schema<activityLogInterface>({
    userId: { 
        // type: mongoose.Schema.Types.ObjectId, 
        type: String, 
        ref: 'User', 
        required: true 
    },

    action: { type: String, required: true },
    // timestamp: { type: Date, default: Date.now },

    location: { type: Object, required: true },

    metadata: { type: Object },
}, { timestamps: true });
  
export const activityLogModel = mongoose.model('ActivityLog', activityLogSchema);