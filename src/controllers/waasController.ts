import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";

// models
import { userModel } from '../models/users.model.js';
import { accountModel } from '../models/accounts.model.js';
import { psbWaasEndpoint } from "@/util/resources.js";
import { accountInterface } from "@/models/types.js";
import { transactionModel } from "@/models/transactions.model.js";
import { wallet2otherBanksInterface } from "@/typeInterfaces/transactions.js";
import { handleDebitTransactions } from "./util_resource/waas.js";


// const secretForToken = process.env.JWT_SECRET;


export const openWalletCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        const username = req.body.middlewareParam.username;

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
                username: username,
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

export const getTranactionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;
        
        
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch paginated data from the database
        const transactionDetails = await transactionModel.find({ user_id: _id })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .skip(skip) // Skip the number of documents
        .limit(limit); // Limit the number of results
        if (!transactionDetails) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve user transaction record."
            });
        };

        // Get the total number of documents
        const totalDocuments = await transactionModel.countDocuments();

        // Calculate total pages
        const totalPages = Math.ceil(totalDocuments / limit);

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                transactionDetails,
                page,
                totalPages,
                totalDocuments
            },
            message: 'Successfull'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const getBanksCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        // const _id = req.body.middlewareParam._id;

        const accessToken = req.body.psbWaas.waasAccessToken;
        const response = (await axios.post(
            `${psbWaasEndpoint}/get_banks`, 
            { merchantID: '' },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

 
        if (!response.status.toLowerCase().includes("success") || !response.data.bankList.length ) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                // result: ,
                message: response.message
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: response.data.bankList,
            message: 'Successful'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const banksEnquiryCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        // const _id = req.body.middlewareParam._id;
        const number = req.body.number;
        const bank = req.body.bank;
        const senderaccountnumber = req.body.senderaccountnumber;

        // console.log(req.body);
        

        if ( !number || !bank || !senderaccountnumber ) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                // result: ,
                message: "All fileds are required."
            });
        }

        const data2send = {
            customer: {
                account: { number, bank, senderaccountnumber }
            }
        }

        const accessToken = req.body.psbWaas.waasAccessToken;
        const response = (await axios.post(
            `${psbWaasEndpoint}/other_banks_enquiry`, data2send,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;
        // console.log(response);

 
        if (!response.message.toLowerCase().includes("success") || !response.customer.account.name ) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                // result: ,
                message: response.message
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: response.customer.account,
            message: 'Successful'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const ngnTransfer2OtherBanksCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        const _id = req.body.middlewareParam._id;

        const number = req.body.number;
        const bank = req.body.bank;
        const bankName = req.body.bankName;
        const name = req.body.name;
        const senderaccountnumber = req.body.senderaccountnumber;
        const sendername = req.body.sendername;
        const amount = req.body.amount;
        // const fee = req.body.fee || '';
        // const currency = req.body.currency || '';
        const description = req.body.description;
        const transactionReference = `WAASTESAPAY${Date.now()}`; //WAASTESAPAY

        // checks if all needed fields are complete
        if ( !number || !bank || !bankName || !name || !amount || !senderaccountnumber ) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                // result: ,
                message: "All fileds are required."
            });
        }

        const data2send: wallet2otherBanksInterface = {
            transaction: {
                reference: transactionReference
            },
            order: {
                amount: amount,
                currency: "NGN",
                description: `${description}/WAAS/OTHER_BANKS`,
                country: "NG"
            },
            customer: {
                account: {
                    number: number,
                    bank: bank,
                    name: name,
                    senderaccountnumber: senderaccountnumber,
                    sendername: sendername
                }
            },
            merchant: {
                isFee: false,
                merchantFeeAccount: "",
                merchantFeeAmount: ""
            },
            transactionType: "OTHER_BANKS",
            narration: `${description}/OTHER_BANKS/${transactionReference}`
        };
        console.log(data2send);


        const accessToken = req.body.psbWaas.waasAccessToken;
        const response = await handleDebitTransactions(accessToken, data2send, _id, user_email, bankName);

        if (!response.status) {
            return res.status(response.statusCode || 500).json({
                status: false,
                statusCode: response.statusCode || 500,
                message: response.message
            });
        }


        return res.status(response.statusCode || 201).json({
            status: true,
            statusCode: response.statusCode || 201,
            result: response.result,
            message: response.message || 'Successful'
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const searchUserAccountCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const user_email = req.body.middlewareParam.email;
        // const userId = req.body.middlewareParam.userId;
        // const _id = req.body.middlewareParam._id;

        const searchWord = req.query.usernameAccountNo || '';
        if (searchWord.toString().length < 3) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: [],
                message: 'should be greater than 3 characters.'
            });
        };
        
        // const searchQuery = { $text: { $search: `${searchWord}` } };
        // const result = await accountModel.find(searchQuery).limit(100).exec();

        const result = await accountModel.find({ 
            $or: [
                { username: { $regex: `^${searchWord}`, $options: 'i' } },
                { accountNumber: { $regex: `^${searchWord}`, $options: 'i' } }
            ]
        }).limit(100).exec();

        // console.log(result);
        
        if (!result) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Error reading user account"
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: result,
            message: 'Successful'
        });

    } catch (error: any) {
        // console.log(error);
        
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}
