import fs from "fs";
import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from 'uuid';
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';

// import path from "path";

// models
import { userModel } from '../models/users.model.js';
import { getSampleNetworkNumber, psbVasEndpoint } from "@/util/resources.js";
import axios from "axios";
import { transactionsInterface, vasBillsTransactionInterface } from "@/models/types.js";
import { transactionModel } from "@/models/transactions.model.js";


// const secretForToken = process.env.JWT_SECRET;


export const getDataPlansCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const network = req.query.network;

        if (!network) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'Network name is required.',
            });
        }

        const phoneNumber = getSampleNetworkNumber(network.toString().toUpperCase());

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.get(
            `${psbVasEndpoint}/topup/dataPlans?phone=${phoneNumber}`, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response); 

        if (response.data.length && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error getting data plans.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const dataPlanTopupCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const network = req.query.network;
        const phoneNumber = req.body.phoneNumber;
        const amount = req.body.amount;
        const debitAccount = req.body.debitAccount;
        const network = req.body.network;
        const productId = req.body.productId;
        const transactionReference = `VAS9PSB${Date.now()}`;
        // const transactionReference = req.body.transactionReference;

        const _id = req.body.middlewareParam._id;
        const email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        // const username = req.body.middlewareParam.username;

        if (!phoneNumber || !amount || !debitAccount || !network || !productId) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'All params are required.',
            });
        }

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.post(
            `${psbVasEndpoint}/topup/data`, 
            {
                phoneNumber, amount, debitAccount,
                network, productId, transactionReference,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response);

        const statusResponse = await getTopupTransactionStatus(transactionReference, accessToken);

        const transactionDetails: transactionsInterface = {
            user_id: _id,
            userEmail: email,
            category: "VAS",
            type: "data",
            data: {
                topup: {
                    phoneNumber: phoneNumber,
                    network: network,
                    productId: productId,
                    dataPlan: response.data && response.responseCode == "200" ? response.data.dataPlan : productId,
                    reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
                }
            },
            accountNo: debitAccount,
            amount: amount,
            transactionReference: transactionReference,
            status: statusResponse.state ? statusResponse.status : response.status || "pending",
        };
        const newTransaction = new transactionModel(transactionDetails);
        const result = await newTransaction.save();
        
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update the transactions record.',
            });
        }

        if (response.data && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: result || transactionDetails,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error purchasing data plans.',
        });
        
    } catch (error: any) {
        console.log(error);
        
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const airtimeTopupCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const network = req.body.network;
        const amount = req.body.amount;
        const debitAccount = req.body.debitAccount;

        const transactionReference = `VAS9PSB${Date.now()}`; //VASTESAPAY

        const _id = req.body.middlewareParam._id;
        const email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;

        if (!phoneNumber || !amount || !debitAccount || !network) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'All params are required.',
            });
        }

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.post(
            `${psbVasEndpoint}/topup/airtime`, 
            {
                phoneNumber, amount, debitAccount,
                network, transactionReference,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        const statusResponse = await getTopupTransactionStatus(transactionReference, accessToken);

        const transactionDetails: transactionsInterface = {
            user_id: _id,
            userEmail: email,
            category: "VAS",
            type: "airtime",
            data: {
                topup: {
                    phoneNumber: phoneNumber,
                    network: network,
                    reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
                }
            },
            accountNo: debitAccount,
            amount: amount,
            transactionReference: transactionReference,
            status: statusResponse.state ? statusResponse.status : response.status || "pending",
        };
        const newTransaction = new transactionModel(transactionDetails);
        const result = await newTransaction.save();
        
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update the transactions record.',
            });
        }
        
        if (response.data && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: result || transactionDetails,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error purchasing airtime.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

// export const getElectricBillersCtrl = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const accessToken = req.body.psbVas.vasAccessToken;

//         let billerId = "1";

//         const categoriesResponse = (await axios.get(
//             `${psbVasEndpoint}/billspayment/categories`, 
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`
//                 }
//             }
//         )).data;

//         if (categoriesResponse.data.length && categoriesResponse.responseCode == "200" ) {
//             // Search through the array for an item that includes 'electric' in its name
//             const foundItem = categoriesResponse.data.find((item: { id: string; name: string; }) => item.name.toLowerCase().includes('electric'));
//             if (foundItem) billerId = foundItem.id;
//         }

//         const response = (await axios.get(
//             `${psbVasEndpoint}/billspayment/billers/${billerId}`, 
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`
//                 }
//             }
//         )).data;

//         // console.log(response); 

//         if (response.data.length && response.responseCode == "200" ) {
//             return res.status(201).json({
//                 status: true,
//                 statusCode: 201,
//                 result: response.data,
//                 message: response.message || 'Successfull'
//             });
//         }

//         return res.status(400).json({
//             status: false,
//             statusCode: 400,
//             message: response.message || 'Error getting electricity billers.',
//         });
        
//     } catch (error: any) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

export const getBillersCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.body.psbVas.vasAccessToken;
        const biller = req.query.biller;

        let searchName = '';
        let billerId = "1";

        if (biller == "electricity") {
            billerId = "1";
            searchName = 'electric'
        } else if (biller == "Betting") {
            billerId = "2";
            searchName = 'bett'
        } else if (biller == "TV") {
            billerId = "4";
            searchName = 'TV'
        } else if (biller == "Exams") {
            billerId = "3";
            searchName = 'Exams'
        } else if (biller == "Internet") {
            billerId = "7";
            searchName = 'Internet'
        }

        const categoriesResponse = (await axios.get(
            `${psbVasEndpoint}/billspayment/categories`, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        if (categoriesResponse.data.length && categoriesResponse.responseCode == "200" ) {
            // Search through the array for an item that includes 'electric' in its name
            const foundItem = categoriesResponse.data.find((item: { id: string; name: string; }) => item.name.toLowerCase().includes(searchName));
            if (foundItem) billerId = foundItem.id;
        }

        const response = (await axios.get(
            `${psbVasEndpoint}/billspayment/billers/${billerId}`, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response); 

        if (response.data.length && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error getting biller data.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const getBillerFieldsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.body.psbVas.vasAccessToken;
        const billerId = req.params.billerId;

        const response = (await axios.get(
            `${psbVasEndpoint}/billspayment/fields/${billerId}`, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        // console.log(response);
        

        if (response.data.length && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error getting billers inputs fields.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const validateBillPaymentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {        
        const accessToken = req.body.psbVas.vasAccessToken;
        
        const customerId = req.body.customerId;
        const billerId = req.body.billerId;
        const itemId = req.body.itemId;
        const amount = req.body.amount || "";
        const customerPhone = req.body.customerPhone || "";
        const email = req.body.email || "";

        const response = (await axios.post(
            `${psbVasEndpoint}/billspayment/validate`, 
            { customerId, billerId, itemId, amount, customerPhone, email },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;


        if (response.data && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }


        // return res.status(400).json({
        //     status: false,
        //     statusCode: 400,
        //     message: response.message || 'unable to validate bill payment.',
        // });
        
    } catch (error: any) {
        // console.log(error);
        const apiError = error.response.data || "";
        console.log(error.response.data);

        if (apiError) {
            if (apiError.message == 'Invalid Account number') {
                error.message = 'Invalid meter number';
            } else {
                error.message = apiError.message || '';
            }
        }
        
        if (!error.statusCode) {
            if (apiError.responseCode) {
                error.statusCode = Number(apiError.responseCode);
            } else {
                error.statusCode = 500;
            }
        }
        next(error);
    }
}

export const initiateBillsPaymentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.body.psbVas.vasAccessToken;
        const _id = req.body.middlewareParam._id;
        const email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;

        const transactionType = req.body.transactionType;
        // const transactionData = req.body.data;

        const customerId = req.body.customerId;
        const billerId = req.body.billerId;
        const billerName = req.body.billerName;
        const itemId = req.body.itemId || '';
        const itemName = req.body.itemName || '';
        const amount = req.body.amount;
        const customerPhone = req.body.customerPhone;
        const customerName = req.body.customerName;
        const otherField = req.body.otherField;
        const debitAccount = req.body.debitAccount;

        const transactionReference = `VASTESAPAY${Date.now()}`; //VASTESAPAY

        // const billsPaymentData = {
        //     customerId: transactionData.customerId,
        //     billerId: transactionData.billerId,
        //     itemId: transactionData.itemId,
        //     amount: transactionData.amount,
        //     customerPhone: transactionData.customerPhone || '',
        //     customerName: transactionData.customerName,
        //     otherField: transactionData.otherField,
        //     debitAccount: transactionData.debitAccount,
        //     transactionReference: transactionReference,
        // };

        const response = (await axios.post(
            `${psbVasEndpoint}/billspayment/pay`, {
                customerId, billerId, itemId, customerPhone, customerName,
                otherField, debitAccount, amount, transactionReference
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;
        console.log(response);

        if (response.status == 'failed' || response.responseCode == '400') {
            let message = '';
            if (response.message.toLowerCase().includes("invalid")) {
                message = 'Invalid sent data';
            }

            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: message || response.message || 'Error, unable to make payment.',
            });
        }

        const statusResponse = await getBillspaymentTransactionStatus(transactionReference, accessToken);
        
        let dbTransactionData: vasBillsTransactionInterface;
        if (transactionType == "electricity") {
            dbTransactionData = {
                customerId, customerPhone, customerName,
                billerName, billerId, itemId, itemName,
                otherField,
                // address: otherField,

                units: response.data.otherField || '',
                token: response.data.token || '',
                isToken: response.data.isToken || '',

                // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            }
        } else if (transactionType == "Betting") {
            dbTransactionData = {
                customerId, billerId, customerPhone, customerName,
                billerName, otherField,

                isToken: response.data.isToken || '',
            }
        } else if (transactionType == "TV") {

            dbTransactionData = {
                customerId, customerPhone, customerName,
                billerName, billerId, itemId, itemName,
                otherField,

                // units: response.data.otherField || '',
                // token: response.data.token || '',
                isToken: response.data.isToken || '',

                // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            }
        } else if (transactionType == "Exams") {

            dbTransactionData = {
                customerId, customerPhone, customerName,
                billerName, billerId, itemId, itemName,
                otherField, // 'Serial No: 005046300 1725966473'

                // units: response.data.otherField || '',
                token: response.data.token || '', // 'Pin: 54369682317259321'
                isToken: response.data.isToken || '',

                // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            }
        } else if (transactionType == "Internet") {
            
            dbTransactionData = {
                customerId, customerPhone, customerName,
                billerName, billerId, itemId, itemName,
                otherField,

                // units: response.data.otherField || '',
                token: response.data.token || '',
                isToken: response.data.isToken || '',
                // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            }
        } else {
            const anydata: any = {}
            dbTransactionData = anydata;
        }

        const transactionDetails: transactionsInterface = {
            user_id: _id,
            userEmail: email,
            category: "VAS",
            type: transactionType,
            data: {
                bills: dbTransactionData
            },
            accountNo: debitAccount,
            amount: Number(amount),
            transactionReference: transactionReference,
            // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            status: statusResponse.state ? statusResponse.status : response.status || "pending",
        };
        const newTransaction = new transactionModel(transactionDetails);
        const result = await newTransaction.save();
        
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update the transactions record.',
            });
        }

        if (response.data && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: {
                    ...response.data,
                    transactions: result,
                },
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error, unable to make payment.',
        });
        
    } catch (error: any) {
        const apiError = error.response.data || "";
        // console.log(apiError);

        if (apiError) {
            if (apiError.message.toLowerCase().includes("invalid")) {
                error.message = 'Invalid sent data';
            } else {
                error.message = apiError.message || '';
            }
        }
        
        if (!error.statusCode) {
            if (apiError.responseCode) {
                error.statusCode = Number(apiError.responseCode);
            } else {
                error.statusCode = 500;
            }
        }

        // if (!error.statusCode) {
        //     error.statusCode = 500;
        // }
        next(error);
    }
}


async function getTopupTransactionStatus(transactionReference: string, accessToken: string) {
    try {
        const statusResponse = (await axios.get(
            `${psbVasEndpoint}/topup/status?transReference=${transactionReference}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        if (statusResponse.data && statusResponse.responseCode == "200" ) {
            return {
                state: true,
                status: statusResponse.data.transactionStatus,
                description: statusResponse.data.description,
            }
        }

        return {
            state: false,
            status: '',
            description: '',
        }
    } catch (error) {
        return {
            state: false,
            status: '',
            description: '',
        }
    }



    
}

async function getBillspaymentTransactionStatus(transactionReference: string, accessToken: string) {
    try {
        const statusResponse = (await axios.get(
            `${psbVasEndpoint}/billspayment/status?transReference=${transactionReference}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        if (statusResponse.data && statusResponse.responseCode == "200" ) {
            return {
                state: true,
                status: statusResponse.data.transactionStatus,
                description: statusResponse.data.description,
            }
        }

        return {
            state: false,
            status: '',
            description: '',
        }
    } catch (error) {
        return {
            state: false,
            status: '',
            description: '',
        }
    }



    
}
