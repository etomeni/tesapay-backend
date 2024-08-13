import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";
import nodemailer from 'nodemailer';


// models
import { userModel } from '../models/users.model.js';
import { accountModel } from '../models/accounts.model.js';
import { psbWaasEndpoint } from "@/util/resources.js";
import { accountInterface } from "@/models/types.js";


// const secretForToken = process.env.JWT_SECRET;


export const openWalletCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        // const username = req.body.middlewareParam.username;

        const lastName = req.body.lastName;
        const otherNames = req.body.otherNames;
        const phoneNo = req.body.phoneNo;
        const gender = req.body.gender; // need to check the what is sent for the gender
        const dateOfBirth = req.body.dateOfBirth;
        const email = req.body.email || user_email; // or the user email address
        const bvn = req.body.bvn;

        const customerID = _id; // this is the user id on the db
        // const walletType = "INDIVIDUAL";
        const transactionTrackingRef = `tesapay/waas/${_id}`;


        const newWalletInfo2psb = {
            transactionTrackingRef: transactionTrackingRef,
            lastName: lastName,
            otherNames: otherNames,
            accountName: `${ otherNames } ${ lastName }`,
            phoneNo: phoneNo,
            gender: gender || 0,
            dateOfBirth: dateOfBirth,
            email: email ,
            bvn: bvn, 
            customerID: customerID,
            walletType: "INDIVIDUAL"
        }

        const accessToken = req.body.psbWaas.waasAccessToken;

        const response = (await axios.post(
            `${psbWaasEndpoint}/open_wallet`, 
            newWalletInfo2psb,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response); 
        if (response.data && response.data.accountNumber ) {

            const accountDetails: accountInterface = {
                userId: _id,
                userEmail: user_email,
                ...newWalletInfo2psb,

                accountNumber: response.data.accountNumber,
                customerID: response.data.customerID,
                accountName: response.data.fullName,
                accountRef: response.data.orderRef,

                status: "Active", // "InActive" || "SUSPENDED"
                tier: "1",

                ngn: {
                    availableBalance: 0.0,
                    number: "",
                    pndstatus: "InActive",
                    name: response.data.fullName,
                    productCode: "",
                    lienStatus: "InActive",
                    freezeStatus: "InActive",
                    ledgerBalance: 0.0,
                    maximumBalance: 0.0,
                    nuban: response.data.accountNumber,
                    provider: '9PSB'
                }
            };

            const newAccount = new accountModel(accountDetails);
            const result = await newAccount.save();
            if (!result?._id) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'unable to get user account record.',
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result,
                message: response.message || 'Successfull'
            });
        }

        return res.status(500).json({
            status: false,
            statusCode: 500,
            message: response.message || 'unable to create a new wallet.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const getWalletDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;

        // const accountNumber = req.body.accountNumber;

        const accountDetails = await accountModel.findOne({ userId: _id });
        if (!accountDetails?.accountNumber) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve user account record."
            });
        };

        const accessToken = req.body.psbWaas.waasAccessToken;
        const response = (await axios.post(
            `${psbWaasEndpoint}/wallet_enquiry`, 
            { accountNo: accountDetails.accountNumber },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response); 

        if (response.data && response.data.responseCode == "00" ) {
            const updateData = {
                accountNumber: response.data.nuban,
                accountName: response.data.name,

                status: response.data.status,
                tier: response.data.tier,

                ngn: {
                    availableBalance: response.data.availableBalance,
                    number: response.data.number,
                    pndstatus: response.data.pndstatus,
                    name: response.data.name,
                    productCode: response.data.productCode,
                    lienStatus: response.data.lienStatus,
                    freezeStatus: response.data.freezeStatus,
                    ledgerBalance: response.data.ledgerBalance,
                    maximumBalance: response.data.maximumBalance,
                    nuban: response.data.nuban,
                    // provider: '9PSB'
                }
            }

            const updatedRecord = await accountModel.findOneAndUpdate(
                { userId: _id }, updateData,
            );
            if (!updatedRecord?._id) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'unable to get user account record.',
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: updatedRecord,
                message: response.message || 'Successfull'
            });
        }

        return res.status(500).json({
            status: false,
            statusCode: 500,
            message: response.message || 'unable to get user account record.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}
