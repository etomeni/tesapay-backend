import fs from "fs";
import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from 'uuid';
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';
import axios from "axios";

// import path from "path";

// models
// import { userInterface } from "../models/types.js";
import { userModel } from '../models/users.model.js';
import { maskPhoneNumber, normalizePhoneNumber, psbWaasEndpoint, termiSendSmsEndpoint } from "@/util/resources.js";
import { sendEmailVerificationCode } from "@/util/mailFunctions/authMails.js";
import { bvnInterface, verificationInterface } from "@/typeInterfaces/verificationInterface.js";
import { verificationModel } from "@/models/verification.model.js";
import { accountInterface, userInterface } from "@/typeInterfaces/userInterface.js";
import { getUserLocation } from "@/util/userLocation.js";
import { format9PsbDateOfBirth } from "@/util/dateTime.js";
import { accountModel } from "@/models/accounts.model.js";
import mongoose from "mongoose";
import { logActivity } from "@/util/activityLogFn.js";


const secretForToken = process.env.JWT_SECRET;


export const sendEmailVerificationMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(401).json({
        //         status: false,
        //         statusCode: 401,
        //         message: 'Email validation error.', 
        //         errors
        //     });
        // };

        const email = req.query.email;
        const userExist = await userModel.findOne({ email });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Email address already exist'
            });
        } else {
            const mailRes = sendEmailVerificationCode(`${email}`)
            if (!mailRes.status) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: mailRes.message,
                    error: mailRes.error
                });
            }
            
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: {
                    jwt_token: mailRes.jwt_token,
                    code: mailRes.code
                },
                message: 'successfully'
            });
        }
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const verifyEmailCodeTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'code validation error.', 
                errors
            });
        };

        const code = req.body.code;

        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            const error = new Error("Not authenticated!");
    
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        };
        const token = authHeader.split(' ')[1];

        const verifyRes =  verifyJwtTokenCode(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'Wrong verification code!',
            });
        }

        return res.status(201).json({
            statusCode: 201,
            status: true,
            result: verifyRes.decodedToken,
            // decodedToken: verifyRes.decodedToken,
            message: 'Email verified!',
        });

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}


export const sendPhoneVerificationTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Phone number validation error.', 
                errors
            });
        };

        const phoneNumber = `+${req.query.phoneNumber}`;

        const userExist = await userModel.findOne({ phoneNumber });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'User with this phone number already exist'
            });
        }
        
        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
        const jwt_token = Jwt.sign(
            { code, phoneNumber },
            `${code}`,
            { expiresIn: '30m' }
        );

        console.log(code);
        // // TO BE DELETED: This is temporary for testing only
        // return res.status(201).json({
        //     status: true,
        //     statusCode: 201,
        //     result: {
        //         jwt_token: jwt_token,
        //         messageId: "response.message_id",
        //         code: code
        //     },
        //     message: `Verification code sent to ${maskPhoneNumber(phoneNumber)}. Enter the code to verify.`,
        // });


        // Remove any non-digit characters from the input
        const cleanedNumber = phoneNumber.replace(/\D/g, '');

        const msg = `Your TesaPay verification code is: ${code}. \nPlease do not share this code with anyone, no staff of TesaPay will ask for this code. `;
        
        const msg2send = {
            to: cleanedNumber,
            // to: '2347019055569',
            from: "N-Alert",
            sms: msg,
            type: "plain",
            channel: "dnd",
            api_key: process.env.TERMII_API_KEY,
        }
        const response = (await axios.post(`${termiSendSmsEndpoint}`, msg2send)).data;

        // console.log(response);

        if (!response.message_id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                error: response,
                message: "Unable to send otp code!"
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                messageId: response.message_id,
                jwt_token: jwt_token,
                code: code
            },
            message: `Verification code sent to ${maskPhoneNumber(phoneNumber)}. Enter the code to verify.`,
        });

    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;

        if (!error.statusCode) error.statusCode = 500;
        next(err);
    }
}

export const verifyPhoneCodeTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'code validation error.', 
                errors
            });
        };


        const code = req.body.code;
        // const token = req.body.token;
        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            const error = new Error("Not authenticated!");
    
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        };
        const token = authHeader.split(' ')[1];

        const verifyRes =  verifyJwtTokenCode(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'Wrong verification code!',
            });
        }


        return res.status(201).json({
            statusCode: 201,
            status: true,
            result: {
                decodedToken: verifyRes.decodedToken,
            },
            message: 'Phone number verified!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}


export const verifyBvnNumberUsingBlusaltCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logActivity(req, "Verify bvn number", "");

        const bvn = req.body.bvn;
        const email = req.body.email;
        const phoneNumber = req.body.phoneNumber;
        const gender = req.body.gender;
        const dob = req.body.dob;
        const country = req.body.country;

        const verificationDataCorretness = (bvnDetails: bvnInterface) => {
            // Ensure the inputs are valid Date objects
            const bvnDob = new Date(bvnDetails.personal_info.date_of_birth);
            // const userDob = new Date(dob);
            // Parse the second date (dd/mm/yyyy)
            const [day, month, year] = dob.split('/');
            const userDob = new Date(`${year}-${month}-${day}`);

            // Check if both inputs are valid dates
            // if (isNaN(bvnDob) || isNaN(userDob)) dobStatus = false;

            // Compare year, month, and day
            const dobStatus = (
                bvnDob.getFullYear() === userDob.getFullYear() &&
                bvnDob.getMonth() === userDob.getMonth() &&
                bvnDob.getDate() === userDob.getDate()
            );

            if ( !dobStatus ||
                bvnDetails.personal_info.gender.toLowerCase() != gender.toLowerCase()
                // bvnDetails.bvnData.personal_info.date_of_birth != dob ||
            ) return false;

            return true;
        };

        // Query to find if bvn record exist in the database
        const verificationRecord = await verificationModel.findOne({ bvn_number: bvn });
        
        if (verificationRecord && verificationRecord._id) {
            const vState = verificationDataCorretness(verificationRecord.bvnData);

            if (!vState) {
                return res.status(401).json({
                    status: false,
                    statusCode: 401,
                    message: 'Incorrect credentials, bvn data does not match details.',
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: verificationRecord,
                message: 'Successful',
            });
        }

        const clientid = process.env.BLUSALT_CLIENT_ID;
        const apikey = process.env.BLUSALT_API_KEY;
        const appname = process.env.BLUSALT_APP_NAME;

        try {
            const response = (await axios.post(
                `https://api.blusalt.net/v2/IdentityVerification/BVN`, 
                { bvn_number: bvn, phone_number: normalizePhoneNumber(phoneNumber) },
                {
                    headers: {
                        accept: 'application/json',
                        // 'content-type': 'application/x-www-form-urlencoded',
                        'clientid': clientid,
                        'apikey': apikey,
                        'appname': appname,
                    }
                }
            )).data;
            console.log(response);
    
            if (response.status_code == 200) {
                const bvnDetails: bvnInterface = response.results;
                const data2db: verificationInterface = {
                    // _id: "",
                    user: {
                        user_id: "",
                        firstName: bvnDetails.personal_info.first_name,
                        lastName: bvnDetails.personal_info.last_name,
                        middleName: bvnDetails.personal_info.middle_name,
                        dob: dob || bvnDetails.personal_info.date_of_birth,
                        country: country || bvnDetails.personal_info.nationality,
                        gender: gender || bvnDetails.personal_info.gender,
                        phoneNumber: phoneNumber || bvnDetails.personal_info.phone_number, // which phone number should go here?
                        email: email || bvnDetails.personal_info.email, // which email should go here?
                        userPhoto: "", 
                        userVideo: ""
                    },
                    accountNumber: "",
                    bvn_number: bvnDetails.bvn_number,
                    bvnData: bvnDetails,
                    nin_number: "",
                    ninData: null,
                    idData: {
                        idType: "",
                        idNumber: "",
                        idIssueDate: "",
                        idExpiryDate: "",
                        idCardFront: "",
                        idCardBack: ""
                    },
                    address: {
                        houseNumber: "",
                        streetName: "",
                        additional: '',
                        city: "",
                        nearestLandmark: "",
                        localGovernment: "",
                        state: "",
                        country: "",
                        proofOfAddressVerification: ""
                    },
                    nationality: {
                        placeOfBirth: "",
                        countryOfBirth: ""
                    },
                    pep: "",
                    customerSignature: "",
                    utilityBill: ""
                };

                const newUser = new verificationModel(data2db);
                const result = await newUser.save();
                if (!result._id) {
                    return res.status(500).json({
                        status: false,
                        statusCode: 500,
                        message: 'Unable to validate bvn data.',
                    });
                }

                // check if the dob and gender is same on bvn
                const vState = verificationDataCorretness(bvnDetails);
                if (!vState) {
                    return res.status(401).json({
                        status: false,
                        statusCode: 401,
                        message: 'Incorrect credentials, bvn data does not match details.',
                    });
                }
    
                return res.status(201).json({
                    status: true,
                    statusCode: 201,
                    result: result,
                    message: 'Successful',
                });
            } else {
                return res.status(response.status_code || 500).json({
                    status: false,
                    statusCode: response.status_code || 500,
                    result: req.body,
                    message: response.message || 'No result Found For this BVN',
                });
            }
            
        } catch (error: any) {
            console.log(error.response.data);
            
            return res.status(error.response.data.status_code || 500).json({
                status: false,
                statusCode: error.response.data.status_code || 500,
                result: req.body,
                message: error.response.data.message || 'bvn validation failed.',
            });
        }
        
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        // if (error.response && error.response.data.message) error.message = error.response.data.message;

        next(error);
    }
}


export const verifyUsernameExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.query.username;
        const userExist = await userModel.findOne({username});

        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Username already exist.'
            });
        } else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }

    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const createAccountCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const location = await getUserLocation(req);
        if (req.body.tnc != true) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Must accept terms and conditions before proceeding.'
            });
        }
        
        // Query to find if bvn record exist in the database
        const verificationRecord = await verificationModel.findOne({ bvn_number: req.body.bvn }).session(session);;
        if (!verificationRecord) {
            await session.abortTransaction();
            session.endSession();

            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Incorrect credentials, bvn data does not match details.',
            });
        }

        // check that the username is free to use 
        const userExist = await userModel.findOne({username: req.body.username});
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Username already exist.'
            });
        }

        const hashedPassword = await bcryptjs.hash(req.body.password, 12);
        const userDetails: userInterface = {
            firstName: verificationRecord.bvnData.personal_info.first_name,
            middleName: verificationRecord.bvnData.personal_info.middle_name,
            lastName: verificationRecord.bvnData.personal_info.last_name,
            gender: verificationRecord.bvnData.personal_info.gender,
            dob: verificationRecord.bvnData.personal_info.date_of_birth,
            username: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            country: req.body.country,
            password: hashedPassword,
            // account: [getAccountDetails],

            // pin: "0",
            
            status: true,
            location: location,
            referredBy: req.body.referredBy || "",
            role: "user",
            isBvnPhoneNoVerified: false,
            bvnNumber: req.body.bvn,
            verification_id: verificationRecord._id,
            isAccountDeleted: false
        };

        // const userDetails: userInterface = {
        //     firstName: req.body.firstName,
        //     middleName: req.body.middleName,
        //     lastName: req.body.lastName,
        //     gender: req.body.gender,
        //     dob: req.body.dob,
        //     username: req.body.username,
        //     email: req.body.email,
        //     phoneNumber: req.body.phoneNumber,
        //     country: req.body.country,
        //     password: hashedPassword,
        //     // account: [getAccountDetails],

        //     // pin: "0",
            
        //     status: true,
        //     location: location,
        //     referredBy: req.body.referredBy,
        //     role: "user",
        //     isBvnPhoneNoVerified: false,
        //     bvnNumber: req.body.bvn,
        //     verification_id: req.body.verification_id,
        //     isAccountDeleted: false
        // };
        
        const newUser = new userModel(userDetails);
        const userRecord = await newUser.save({ session });
        if (!userRecord) {
            await session.abortTransaction();
            session.endSession();

            return res.status(500).json({
                status: false,
                statusCode: 500, 
                message: 'Unable to register new user.'
            });
        }

        // now create an account with 9psb
        console.log("hello 5");

        // const customerID = userRecord._id; // this is the user id on the db
        const transactionTrackingRef = `tesapay/waas/${userRecord._id}/acct_opening`;

        const getGenderCode = (gender: string) => gender.toLowerCase() == 'female' ? 1 : 0;

        const newWalletInfo2psb = {
            transactionTrackingRef: transactionTrackingRef,
            lastName: userDetails.lastName,
            otherNames: userDetails.firstName + " " + userDetails.middleName,
            accountName: `${ userDetails.lastName } ${ userDetails.firstName } ${ userDetails.middleName }`,
            phoneNo: userDetails.phoneNumber,
            gender: getGenderCode(userDetails.gender),
            dateOfBirth: format9PsbDateOfBirth(userDetails.dob),
            email: userDetails.email ,
            bvn: userDetails.bvnNumber, 
            customerID: userRecord._id, // this is the user id on the db,
            walletType: "INDIVIDUAL",
            address: verificationRecord.bvnData.residential_info.residential_address
        };

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
        console.log(response); 

        console.log("hello 6");

        if (!response.data || !response.data.accountNumber ) {
            await session.abortTransaction();
            session.endSession();

            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: response.message || 'Unable to create user account.',
            });
        }

        console.log("hello 7");

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        const accountDetails: accountInterface = {
            userId: userRecord._id,
            userEmail: newWalletInfo2psb.email,
            username: userRecord.username,

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
                provider: '9 Payment Service Bank'
            }
        };

        console.log("hello 8");

        const newAccount = new accountModel(accountDetails);
        const accountResult = await newAccount.save();
        // const accountResult = await newAccount.save({ session });
        if (!accountResult) {
            // await session.abortTransaction();
            // session.endSession();

            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to save user account record.',
            });
        }
        
        const token = Jwt.sign(
            {
                username: userDetails.username,
                email: userDetails.email,
                _id: userRecord._id,
                bvn: userDetails.bvnNumber,
                accountNumber: accountResult.accountNumber,
                account_id: accountResult._id,
            },
            `${secretForToken}`,
            { expiresIn: '7d' }
        );

        console.log("hello 9");


        logActivity(req, "create account", userRecord.id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                token,
                user: userRecord,
                account: accountResult
            },
            message: 'Account created successfully!'
        });
           
    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;
        console.log(err);
        
        // Abort transaction in case of error
        await session.abortTransaction();
        session.endSession();

        if (!error.statusCode) error.statusCode = 500;
        if (error.response && error.response.data.message) error.message = error.response.data.message;
        next(error);
    }
}


export const setPinCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pin = req.body.pin;
        const email = req.body.email;

        // console.log(verifyRes);

        const uzer = await userModel.findOneAndUpdate(
            { email }, // Query to find the user
            { $set: { pin: pin } }, // Update the field
        );
        
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'user with this email does not exist',
            });
        }

        // TODO:: send an email to the user notifying them that the their transactional pin has been set
        
        return res.status(201).json({
            statusCode: 201,
            status: true,
            message: 'Email verified!',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}



// export const signupController = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (req.body.tnc != true) {
//             return res.status(401).json({
//                 status: false,
//                 statusCode: 401, 
//                 message: 'Must accept terms and conditions before proceeding.'
//             });
//         }

//         const getLast10Chars = (str: string) => {
//             // Handle short strings
//             if (str.length <= 10) return str;
//             // Extract the last 10 characters
//             return str.slice(-10);
//         }
          
        
//         const hashedPassword = await bcryptjs.hash(req.body.password, 12);

//         const userDetails: userInterface = {
//             userId: await uuidv4(),
//             firstName: req.body.firstName,
//             middleName: req.body.middleName,
//             lastName: req.body.lastName,
//             gender: req.body.gender,
//             dob: req.body.dob,
//             // pin: req.body.pin,

//             username: req.body.username,
//             email: req.body.email,
//             phoneNumber: req.body.phoneNumber,
//             country: req.body.country,
//             password: hashedPassword,
//             // account: [getAccountDetails],
//             status: true,
//             location: req.body.location,
//             referredBy: req.body.referredBy,

//             // pin: 0,
//             // NIN: 0,
//             // BVN: {},
//             idImage: '',
//             isAddressVerified: false,
//             isBVNverified: false,
//             isEmailVerified: false,
//             isNINverified: false,
//             isPhoneNumberVerified: false,
//             address: {
//                 ip: '',
//                 street: '',
//                 city: '',
//                 region: '',
//                 country: '',
//             }

//         };
        
//         const newUser = new userModel(userDetails);
//         const result = await newUser.save();

//         if (result._id) {
//             // Send a mail verification code.
//             const mailRes = sendEmailVerificationCode(userDetails.email, `${userDetails.firstName} ${userDetails.middleName || ''} ${userDetails.lastName}`)
//             if (!mailRes.status) {
//                 return res.status(500).json({
//                     status: false,
//                     statusCode: 500,
//                     message: mailRes.message,
//                     error: mailRes.error
//                 });
//             }
            
//             const token = Jwt.sign(
//                 {
//                     username: userDetails.username,
//                     email: userDetails.email,
//                     userId: userDetails.userId,
//                     _id: result._id
//                 },
//                 `${secretForToken}`,
//                 { expiresIn: '7d' }
//             );
    
//             return res.status(201).json({
//                 status: true,
//                 statusCode: 201,
//                 token,
//                 verificationToken: mailRes.jwt_token,
//                 userId: userDetails.userId,
//                 resultData: result, 
//                 message: 'User registered successfully!'
//             });
//         }
        
//         return res.status(500).json({
//             status: 500,
//             message: 'unable to register new user.'
//         });
           
//     } catch (error: any) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

export const verifyUserExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const phoneNumber = req.body.phoneNumber;

        const userExist = await userModel.findOne({
            $or: [
                { username: username },
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        });

        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'User already exist'
            });
        } else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const verifyEmailExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.query.email;
        // const userDele = await userModel.deleteOne({ email });
        const userExist = await userModel.findOne({ email });

        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Email address already exist'
            });
        } else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const verifyPhoneNumberExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phoneNumber = req.query.phoneNumber;
        const userExist = await userModel.findOne({ phoneNumber });

        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Phone number already exist'
            });
        } else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }

    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.body.email;
        const sentPassword = req.body.password;

        const user = await userModel.findOne({email});

        if (!user) {
            // const error = new Error('A user with this username or email could not be found!');

            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        };

        if (user.isAccountDeleted) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        };

        const isPassEqual = await bcryptjs.compare(sentPassword, user.password);

        if (!isPassEqual) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        }
        
        if (user.status == false) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "This account has been disabled, if you believe this is a mistake please contact support to resolve."
            });
        };
        

        const token = Jwt.sign(
            {
                username: user.username,
                email: user.email,
                // userId: user.userId,
                _id: user._id,

                bvn: user.bvnNumber,
                // accountNumber: user.accountNumber,
                // account_id: user.account_id,
            },
            `${secretForToken}`,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Login successful',
            token: token,
            resultData: user, 
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// export const updateUserProfileCtr = async (req, res, next) => {
//     try {
//         const userId = req.body.userId;
//         const password = req.body.password;
//         const formData = req.body.formData;

//         // const formKeys = req.body.formKeys;
//         // const formValues = req.body.formValues;

//         const user = await auth.findByID(userId);
//         if (user && user.status == false) {
//             const error = new Error('A user with this ID could not be found!');
//             error.statusCode = 401;
//             error.message = "unable to verify user's ID, please refreash and try again!!!";

//             return res.status(401).json({
//                 error,
//                 statusCode: error.statusCode,
//                 msg: error.message
//             });
//         };
//         const isPassEqual = await bcryptjs.compare(password, user.password);

//         if (!isPassEqual) {
//             const error = new Error('Wrong password!');
//             error.statusCode = 401;
//             error.message = 'Wrong password!';

//             // throw error;

//             return res.status(401).json({
//                 error,
//                 statusCode: error.statusCode,
//                 msg: error.message
//             });
//         };
       
        
//         // const updatedUser = await userModel.findOneAndUpdate(
//         //     { email: user.email }, 
//         //     { password: hashedPassword },
//         //     {
//         //         runValidators: true,
//         //         returnOriginal: false,
//         //     }
//         // );

//         // if (updatedUser) {
//         //     return res.status(201).json({
//         //         status: 201,
//         //         message: 'Password Changed successfully!',
//         //     });
//         // }

//         // return res.status(500).json({
//         //     status: 500,
//         //     message: 'Ooopps unable to update password.',
//         // });


//         const updatedUser = await auth.updateUser( userId, formData);
//         if (updatedUser && updatedUser.status == false) {
//             return res.status(500).json({
//                 status: 500,
//                 message: updatedUser.message,
//             });
//         }

//         // const newUserData = await auth.findByID(userId);

//         return res.status(201).json({
//             status: 201,
//             message: 'Profile details updated successfully!',
//             // user: newUserData[0][0],
//             user: updatedUser,
//         });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

export const changePasswordCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const userId = req.body.userId;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmNewPassword;
        const userDataParam = req.body.middlewareParam;

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "passwords doesn't match."
            });
        }

        const user = await userModel.findOne({email: userDataParam.email});
        if (!user?._id) {
            return res.status(401).json({
                message: "A user with this ID could not be found!",
                status: false,
                statusCode: 401,
            });
        };

        const isPassEqual = await bcryptjs.compare(currentPassword, user.password);
        if (!isPassEqual) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Wrong password!"
            });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 12);

        const updatedUser = await userModel.findOneAndUpdate(
            { userId: user._id }, 
            { password: hashedPassword },
            // {
            //     runValidators: true,
            //     returnOriginal: false,
            // }
        );
        
        if (!updatedUser?._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Ooopps unable to update password.',
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Password Changed successfully!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const sendPasswordResetEmailCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'User with this Email Address does not exist!', 
                errors
            });
        };
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "sent data validation error";
        next(error);
    }

    try {
        const email = req.body.email;
        const uzer = await userModel.findOne({email});

        console.log(uzer);
        

        if (!uzer?.email) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'User with this Email Address does not exist!',
            });
        }

        const mailResponse = sendEmailVerificationCode(
            email,
            // `${uzer.firstName} ${uzer.middleName || ''} ${uzer.lastName}`,
            "Password Reset - Email Verification Code."
        );

        if (!mailResponse.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailResponse.message,
                error: mailResponse.error
            });
        }

        return res.status(201).json({
            statusCode: 201,
            status: true,
            token: mailResponse.jwt_token,
            message: 'Password reset Email sent, kindly check your mail for verification code.',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const resendEmailVerificationTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.body.email || "";
        const firstName = req.body.firstName || "";
        const middleName = req.body.middleName || "";
        const lastName = req.body.lastName || "";

        const mailRes = sendEmailVerificationCode(email, `${firstName} ${middleName || ''} ${lastName}`)
        if (!mailRes.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailRes.message,
                error: mailRes.error
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            verificationToken: mailRes.jwt_token,
            message: 'User registered successfully!'
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

// export const sendPhoneVerificationTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const phoneNumber = req.body.phoneNumber;

//         const codeLength = 6;
//         const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
//         const jwt_token = Jwt.sign(
//             { code, phoneNumber },
//             `${code}`,
//             { expiresIn: '30m' }
//         );

//         // Remove any non-digit characters from the input
//         const cleanedNumber = phoneNumber.replace(/\D/g, '');

//         const msg = `Your TesaPay verification code is: ${code}. \nPlease do not share this code with anyone, no staff of TesaPay will ask for this code. `;
        
//         const msg2send = {
//             to: cleanedNumber,
//             // to: '2347019055569',
//             from: "N-Alert",
//             sms: msg,
//             type: "plain",
//             channel: "dnd",
//             api_key: process.env.TERMII_API_KEY,
//         }
//         const response = (await axios.post(`${termiSendSmsEndpoint}`, msg2send)).data;

//         // console.log(response);

//         if (!response.message_id) {
//             return res.status(500).json({
//                 status: false,
//                 statusCode: 500,
//                 error: response,
//                 message: "unabl to send otp code"
//             });
//         }

//         return res.status(201).json({
//             status: true,
//             statusCode: 201,
//             messageId: response.message_id,
//             verificationToken: jwt_token,
//             message: `Verification code sent to ${maskPhoneNumber(phoneNumber)}. Enter the code to verify.`,
//         });
//     } catch (err: any) {
//         const error = err.response.data ?? err;

//         if (!error.statusCode) error.statusCode = 500;
//         next(error);
//     }
// }

// export const verifyPhoneTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const code = req.body.code;
//         // const token = req.body.token;
//         const authHeader = req.get('Authorization');
    
//         if (!authHeader) {
//             const error = new Error("Not authenticated!");
    
//             return res.status(401).json({
//                 message: "No authentication token, Please try again.",
//                 status: false,
//                 statusCode: 401,
//                 error
//             });
//         };
//         const token = authHeader.split(' ')[1];

//         const verifyRes =  verifyEmailToken(code, token);
        
//         if (!verifyRes.status) {
//             return res.status(401).json({
//                 statusCode: 401,
//                 status: false,
//                 message: 'wrong Verification Code!',
//             });
//         }

//         const uzer = await userModel.findOneAndUpdate(
//             { phoneNumber: verifyRes.decodedToken.phoneNumber }, // Query to find the user
//             { $set: { isPhoneNumberVerified: true } }, // Update the field
//             // { new: true, upsert: true } // Options: return the updated doc and create if not found
//         );
        
//         if (!uzer) {
//             return res.status(500).json({
//                 status: false,
//                 statusCode: 500,
//                 message: 'server error. unable to update verification status.',
//             });
//         }

//         return res.status(201).json({
//             statusCode: 201,
//             status: true,
//             decodedToken: verifyRes.decodedToken,
//             message: 'Phone number verified!',
//         });
//     } catch (error: any) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//             error.message = 'server error!';
//         }
//         next(error);
//     }
// }

export const verifyEmailTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.body.code;
        
        // const email = req.body.email;
        // const token = req.body.token;
        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            const error = new Error("Not authenticated!");
    
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        };
        const token = authHeader.split(' ')[1];

        const verifyRes =  verifyJwtTokenCode(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong Verification Code!',
            });
        }

        // console.log(verifyRes);

        const uzer = await userModel.findOneAndUpdate(
            { email: verifyRes.decodedToken.email }, // Query to find the user
            { $set: { isEmailVerified: true } }, // Update the field
            // { new: true, upsert: true } // Options: return the updated doc and create if not found
        );
        
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error. unable to update verification status.',
            });
        }

        // TODO:: send an email to the user notifying them that the mail has been verified
        
        return res.status(201).json({
            statusCode: 201,
            status: true,
            decodedToken: verifyRes.decodedToken,
            message: 'Email verified!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}


export const resetPasswordCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
                statusCode: 400,
                status: false,
                message: 'password Error!',
                error
            });
        };
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.status = false;
        error.message = "sent data validation error";
        next(error);
    }
    
    try {
        const email = req.body.email;
        const newPassword = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'password does not match.',
            });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 12);

        const updatedUser = await userModel.findOneAndUpdate(
            { email: email }, 
            { password: hashedPassword },
            {
                runValidators: true,
                returnOriginal: false,
            }
        );

        // TODO:: send email to user about the changed password.

        if (updatedUser) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'Password Changed successfully!',
            });
        }

        return res.status(500).json({
            status: false,
            statusCode: 500,
            message: 'Ooopps unable to update password.',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const reValidateUserAuthCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            return res.status(401).json({
                message: "Not authenticated! Please login and try again.",
                statusCode: 401,
                status: false,
            });
        }
    
        const token = authHeader.split(' ')[1];
        let  decodedToken: any;
        try {
            const secretForToken = process.env.JWT_SECRET;

            decodedToken = Jwt.verify(token, `${secretForToken}`)
        } catch (error: any) {
            return res.status(500).json({
                message: "wrong authentication token",
                statusCode: 500,
                status: false,
                error
            });
        }
    
        if (!decodedToken) {
            return res.status(401).json({
                message: "Not authenticated! unable to verify user authtentication token.",
                status: false,
                statusCode: 401,
            });
        }
    
        const result = {
            isLoggedin: true,
            userId: decodedToken.userId,
            email: decodedToken.email,
            username: decodedToken.username
        };
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            resultData: result,
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}



export const verifyJwtTokenCode = (code: string, token: string) => {
    try {
        let decodedToken: any = Jwt.verify(token, `${code}`);
        // console.log(decodedToken);
        
        if (!decodedToken || decodedToken.code != code) {
            return {
                status: false,
                // decodedToken,
                message: 'Wrong verification code!',
            }
        } 

        return {
            status: true,
            decodedToken,
            message: 'Verified!',
        }
    } catch (error) {
        return {
            status: false,
            message: 'Unable to verify verification code!',
        }
    }
}
