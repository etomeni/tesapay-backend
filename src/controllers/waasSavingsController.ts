import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";

// models
import { userModel } from '../models/users.model.js';
import { accountModel } from '../models/accounts.model.js';
import { getCustomer2holdingAccDetail, getHolding2customerAccDetail, handleDebitTransactions } from "./util_resource/waas.js";
import { savingsInterface } from "@/typeInterfaces/savingsInterface.js";
import { savingsModel } from "@/models/savings.model.js";


// const secretForToken = process.env.JWT_SECRET;


export const getSavingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        
        
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch paginated data from the database
        const savingsDetails = await savingsModel.find({ user_id: _id })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .skip(skip) // Skip the number of documents
        .limit(limit); // Limit the number of results
        if (!savingsDetails) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve savings record."
            });
        };

        // Get the total number of documents
        const totalDocuments = await savingsModel.countDocuments({ user_id: _id });

        // Calculate total pages
        const totalPages = Math.ceil(totalDocuments / limit);

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: savingsDetails,
                page,
                totalPages,
                totalDocuments
            },
            message: 'Successfull'
        });

    } catch (error: any) {
        // console.log(error);
        
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


export const createNewSavingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;

        const name = req.body.name; // string;
        const amount = req.body.amount; // number;
        const duration = req.body.duration; // number;
        const paybackDate = req.body.paybackDate; // string;
        const interestRate = req.body.interestRate; // number;
        const interestGain = req.body.interestGain; // number;
        const totalPayback = req.body.totalPayback; // number;

        const accessToken = req.body.psbWaas.waasAccessToken;


        // Find the creator (user) and ensure they have enough balance
        const userAccount = await accountModel.findOne({userId: _id});
        if (!userAccount) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User not found"
            });
        }

        if (userAccount.ngn.availableBalance < amount) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Insufficient balance"
            });
        }

        const debitDetails = getCustomer2holdingAccDetail(
            amount, `Savings for ${name}`,
            userAccount.accountNumber, userAccount.accountName,
            "Savings"
        );

        // Deduct the total amount from the user's account
        const response = await handleDebitTransactions( accessToken, 
            debitDetails,
            _id, user_email, "TesaPay"
        );

        if (!response.status) {
            if (response.statusCode != 202) {
                return res.status(response.statusCode || 500).json({
                    status: false,
                    statusCode: response.statusCode || 500,
                    message: response.message
                });
            }
        }

        // Save the record to database
        const savingsData: savingsInterface = {
            user_id: _id,
            userEmail: user_email,
            name: name,
            amount: amount,
            duration: duration,
            paybackDate: paybackDate,
            interestRate: interestRate,
            interestGain: interestGain,
            totalPayback: totalPayback,
            transaction_id: response.result.dbTransactionRecord?._id || '',
            transactionReference: response.result.ref,
            status: "Active"
        }

        const newSavings = new savingsModel(savingsData);
        const result = await newSavings.save();
        
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: response.message || 'Unable to save record.',
            });
        };


        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: result,
            message: 'Successful'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const liquidateSavingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;

        const accessToken = req.body.psbWaas.waasAccessToken;

        // Find the creator (user) and ensure they have enough balance
        const userAccount = await accountModel.findOne({userId: _id});
        if (!userAccount) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User not found"
            });
        }

        const savingsDetails = await savingsModel.findById(req.body._id);
        if (!savingsDetails) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Savings record not found."
            });
        }

        // status: string, // "Completed" | "Active" | "Liquidated" | "Processing"
        if (savingsDetails.status != "Active") {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Sorry but you can only close/liquidate an active savings."
            });
        }

        const debitDetails = getHolding2customerAccDetail(
            savingsDetails.amount, "Savings liquidation",
            userAccount.accountNumber, userAccount.accountName,
            "Savings"
        );

        // Deduct the total amount from the user's account
        const response = await handleDebitTransactions( accessToken, 
            debitDetails,
            _id, user_email, "TesaPay"
        );

        if (!response.status) {
            if (response.statusCode != 202) {
                return res.status(response.statusCode || 500).json({
                    status: false,
                    statusCode: response.statusCode || 500,
                    message: response.message
                });
            }
        }

        const updatedRecord = await savingsModel.findByIdAndUpdate(
            savingsDetails._id, 
            { 
                $set: { 
                    status: "Liquidated",
                    closedDate: Date.now()
                } 
            }, 
            { new: true }
        );
        
        if (!updatedRecord) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: response.message || 'Unable to save record.',
            });
        };


        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRecord,
            message: 'Successful'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}
