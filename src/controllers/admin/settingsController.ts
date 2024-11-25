import { Request, Response, NextFunction } from "express-serve-static-core";
import { settingsModel } from "@/models/settings.model.js";

const settings_id = "674077107ddee2d266f2110e";

export const appSettingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newSettings = new settingsModel({
            // _id: "AppSettings",
            savings: {
                interestRate: 1,
                maxDuration: 365,
                minDuration: 7,
                status: true
            }
        });

        const result = await newSettings.save();
        if (!result) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to save settings.',
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: result,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const getAllSettingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await settingsModel.find();
        if (!settings) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'settings counld not be found.'
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: settings,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const getSettingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const settings = await settingsModel.findById(settings_id);
        if (!settings) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'settings counld not be found.'
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: settings,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const updateSavingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedRecord = await settingsModel.findByIdAndUpdate(
            settings_id, 
            { 
                $set: { 
                    savings: {
                        interestRate: req.body.interestRate,
                        minDuration: req.body.minDuration,
                        maxDuration: req.body.maxDuration,
                        status: req.body.status
                    }
                } 
            }, 
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update settings.',
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRecord,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const disabledAppSettingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const updatedRecord = await settingsModel.findByIdAndUpdate(
            settings_id, 
            { 
                $set: { 
                    isAppDisabled: req.body.isAppDisabled || true 
                } 
            }, 
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update settings.',
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRecord,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}