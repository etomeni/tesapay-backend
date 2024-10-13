import { Request, Response, NextFunction } from "express-serve-static-core";
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// models
import { accountModel } from '../models/accounts.model.js';
import { voucherModel } from "@/models/voucher.model.js";
import { VoucherInterface } from "@/typeInterfaces/vouchers.js";
import { 
    getCustomer2holdingAccDetail, getHolding2customerAccDetail, 
    handleDebitTransactions 
} from "./util_resource/waas.js";


// Helper function to generate unique voucher code
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateUniqueVoucherCode(length = 10) {
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
}

// Create a voucher code
export const createVoucherCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const username = req.body.middlewareParam.username;
        const user_email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        // const username = req.body.middlewareParam.username;

        const amount = req.body.amount;
        const _totalAmount = req.body.totalAmount;
        const numberOfUse = req.body.numberOfUse;
        const message = req.body.message;

        // const transactionReference = `WAASTESAPAY${Date.now()}`;
        const accessToken = req.body.psbWaas.waasAccessToken;


        const totalCost = Number(amount) * Number(numberOfUse);
        if (totalCost != _totalAmount) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Total cost calculation error"
            });
        }


        // Find the creator (user) and ensure they have enough balance
        const userAccount = await accountModel.findOne({userId: _id}).session(session);
        if (!userAccount || userAccount.ngn.availableBalance < totalCost) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Insufficient balance or user not found"
            });
        }

        let voucherCode = '';
        let isUnique = false;
    
        // Ensure that the voucher code is unique
        while (!isUnique) {
            voucherCode = generateUniqueVoucherCode(10); // Generate a 10-character voucher
            const existingVoucher = await voucherModel.findOne({ voucherCode });
            if (!existingVoucher) {
                isUnique = true;
            }
        }

        // Deduct the total amount from the creator's account
        const response = await handleDebitTransactions( accessToken, 
            getCustomer2holdingAccDetail(
                totalCost, `created give away voucher - ${ voucherCode }`, 
                userAccount.accountNumber, userAccount.accountName,
                "give away"
            ),
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


        // Create the voucher
        const newVoucherData: VoucherInterface = {
            voucherCode: voucherCode,
            amount,
            totalAmount: totalCost,
            numberOfUse,
            remainingUses: numberOfUse,
            redeemedCount: 0,
            message,
            isEnded: false,
            // ended: {},
            
            createdBy: {
                user: {
                    _id: _id,
                    userId: userId,
                    email: user_email,
                    username: username,
                    lastName: userAccount.lastName,
                    otherNames: userAccount.otherNames,
                  
                    gender: userAccount.gender ? "Male" : "Female",
                    bvn: userAccount.bvn,
                    accountNumber: userAccount.accountNumber,
                    account_id: `${userAccount._id}`
                },
                transaction_id: response.result.dbTransactionRecord?.id,
                transactionReference: response.result.ref,
            },
            redeemedBy: []
        }
        const newVoucher = new voucherModel(newVoucherData);
        const newVoucherResponds = await newVoucher.save({ session });
    
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();


        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                code: voucherCode,
                transaction: response,
                voucher: newVoucherResponds
            },
            message: "Voucher created successfully"
        });
        
    } catch (error: any) {
        // Abort transaction in case of error
        await session.abortTransaction();
        session.endSession();

        if (!error.statusCode) {
            error.message = 'Failed to create voucher';
            error.statusCode = 500;
        }
        next(error);
    }
}


// Redeem a voucher code
export const redeemVoucherCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
        const code = req.body.code;
        const user_email = req.body.middlewareParam.email;
        const username = req.body.middlewareParam.username;
        const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        const accessToken = req.body.psbWaas.waasAccessToken;

        if (!code) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Voucher code not found"
            });
        }

        const voucher = await voucherModel.findOne({ voucherCode: code }).session(session);
        if (!voucher) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Incorrect voucher code"
            });
        }

        // Check if the voucher has remaining uses
        if (voucher.remainingUses <= 0 || voucher.redeemedCount >= voucher.numberOfUse) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Voucher code has reached maximum redemptions"
            });
        }

        // Check if the voucher was ended by the creator
        if (voucher.isEnded) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Voucher code is no longer valid"
            });
        }
        
        // Check if user has already redeemed the voucher
        const hasRedeemed = voucher.redeemedBy.some((redeemer) => redeemer.user.userId == userId);
        if (hasRedeemed) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "You have already redeemed this voucher"
            });
        }

        // Check if voucher was created by user
        if (voucher.createdBy.user.userId == userId) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "You can not redeem a voucher you created"
            });
        }


        // Find the user and credit their account with the voucher amount
        const userAccount = await accountModel.findOne({userId: _id}).session(session);
        if (!userAccount) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User account details not found"
            });
        }


        // credit the user from the holding account
        const response = await handleDebitTransactions( accessToken, 
            getHolding2customerAccDetail(
                voucher.amount, `redeemed give away voucher - ${ voucher.voucherCode }`, 
                userAccount.accountNumber, userAccount.accountName,
                "give away",
            ),
            _id, user_email, "TesaPay"
        );

        // return if the transaction fails
        if (!response.status) {
            if (response.statusCode != 202) {
                return res.status(response.statusCode || 500).json({
                    status: false,
                    statusCode: response.statusCode || 500,
                    message: response.message
                });
            }
        }


        // Add user to the redeemedBy list and decrement remaining uses
        const redeemer = { 
            user: {
                _id: _id,
                userId: userId,
                email: user_email,
                username: username,
                lastName: userAccount.lastName,
                otherNames: userAccount.otherNames,
                gender: userAccount.gender ? "Female" : "Male",
                bvn: userAccount.bvn,
                accountNumber: userAccount.accountNumber,
                account_id: userAccount.id,
            },
            transaction_id: response.result.dbTransactionRecord?.id,
            transactionReference: response.result.ref,
            redeemedAt: new Date(),
        }
        voucher.redeemedBy.push(redeemer);
        voucher.remainingUses -= 1;
        voucher.redeemedCount += 1;
        const voucherResponse = await voucher.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();


        const statusCode = response.statusCode != 202 ? 201 : response.statusCode;
        return res.status(statusCode).json({
            status: true,
            statusCode: statusCode,
            result: {
                voucher: voucherResponse,
                // voucherCode: voucherResponse.voucherCode,
                // voucherId: voucherResponse.id,
                // message: voucherResponse.message,
                // amount: voucherResponse.amount,
                transaction: response.result.dbTransactionRecord || response.result.transactionResponse,
            },
            message: "Voucher redeemed successfully"
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.message = 'Failed to redeem voucher';
            error.statusCode = 500;
        }
        next(error);
    }

}


// Get all vouchers created by a user
export const getCreatedVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;
        // const _id = req.body.middlewareParam._id;


        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch paginated data from the database
        const vouchers = await voucherModel.find({ 'createdBy.user.userId': userId })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .skip(skip) // Skip the number of documents
        .limit(limit); // Limit the number of results
        if (!vouchers) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "You've not created any voucher yet!"
            });
        }

        // Get the total number of documents
        const totalDocuments = await voucherModel.countDocuments();
        // Calculate total pages
        const totalPages = Math.ceil(totalDocuments / limit);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                vouchers,
                page,
                totalPages,
                totalDocuments
            },
            message: "Voucher redeemed successfully"
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.message = 'Error fetching vouchers';
            error.statusCode = 500;
        }
        next(error);
    }
};


// Get all vouchers redeemed by a user
export const getRedeemedVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;
        // const _id = req.body.middlewareParam._id;


        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch paginated data from the database
        const vouchers = await voucherModel.find({ 'redeemedBy.user.userId': userId })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .skip(skip) // Skip the number of documents
        .limit(limit); // Limit the number of results
        if (!vouchers) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "You've not redeemed any voucher yet!"
            });
        }

        // Get the total number of documents
        const totalDocuments = await voucherModel.countDocuments();
        // Calculate total pages
        const totalPages = Math.ceil(totalDocuments / limit);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                vouchers,
                page,
                totalPages,
                totalDocuments
            },
            message: "Voucher redeemed successfully"
        });

    } catch (error: any) {
        console.log(error);
        
        if (!error.statusCode) {
            error.message = 'Error fetching vouchers';
            error.statusCode = 500;
        }
        next(error);
    }
};



// end voucher give away
export const endGiveAwayCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.body.voucherCode;
        const voucher_id = req.body.voucher_id;
        const user_email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        const accessToken = req.body.psbWaas.waasAccessToken;


        if (!code || !voucher_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Voucher code not found"
            });
        }

        const voucher = await voucherModel.findOne({ voucherCode: code });
        if (!voucher) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Incorrect voucher code"
            });
        }

        // Check if the voucher has remaining uses
        if (voucher.remainingUses <= 0 || voucher.redeemedCount >= voucher.numberOfUse) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Voucher code has reached maximum redemptions"
            });
        }
  
        // Check if voucher was created by user
        if (voucher.createdBy.user.userId != userId) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "You can not end a give away that was not created by you."
            });
        }

        // Find the user and credit their account with the voucher amount
        const userAccount = await accountModel.findOne({userId: _id});
        if (!userAccount) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User account details not found"
            });
        }


        // Calculate 2% fee of the total amount
        const amountPerVoucherUse = (2 / 100) * voucher.amount;
        // Calculate the total fee amount for the remaining vouchers
        const totalFee = amountPerVoucherUse * voucher.remainingUses;
        // calculte total amount for the remaing vouchers yet to be used
        const totalRemainingAmount = voucher.amount * voucher.remainingUses;
        // calcuate the balance from the vouchers to credit the user
        const balAmount = totalRemainingAmount - totalFee;


        // credit the user from the holding account
        const response = await handleDebitTransactions( accessToken, 
            getHolding2customerAccDetail(
                balAmount, `ended give away voucher - ${ voucher.voucherCode }`, 
                userAccount.accountNumber, userAccount.accountName,
                "give away",
            ),
            _id, user_email, "TesaPay"
        );

        // return if the transaction fails
        if (!response.status) {
            if (response.statusCode != 202) {
                return res.status(response.statusCode || 500).json({
                    status: false,
                    statusCode: response.statusCode || 500,
                    message: response.message
                });
            }
        }


        // update the db that the give away has been ended
        const voucherEndData = {
            refundFee: totalFee,
            remainingAmount: totalRemainingAmount,
            refundedAmount: balAmount,

            transaction_id: response.result.dbTransactionRecord?.id,
            transactionReference: response.result.ref,
            endedAt: new Date(),
        };
        voucher.isEnded = true;
        voucher.ended = voucherEndData;
        const voucherResponse = await voucher.save();


        const statusCode = response.statusCode != 202 ? 201 : response.statusCode;
        return res.status(statusCode).json({
            status: true,
            statusCode: statusCode,
            result: {
                voucher: voucherResponse,
                transaction: response.result.dbTransactionRecord || response.result.transactionResponse,
            },
            message: "Voucher give away ended successfully"
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.message = 'Failed to end give away voucher';
            error.statusCode = 500;
        }
        next(error);
    }

}
