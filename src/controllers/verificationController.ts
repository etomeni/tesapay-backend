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
// import { userAccount, userInterface } from "../models/types.js";
import { maskPhoneNumber, premblyIdentityEndpoint, termiSendSmsEndpoint } from "@/util/resources.js";
import axios from "axios";


const secretForToken = process.env.JWT_SECRET;


export const verifyBvnNumberCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bvn = req.body.bvn;
        const email = req.body.email;
        // const userId = req.body.userId;
        const identityPassAppId = process.env.IDENTITY_PASS_PREMBLY_API_APP_ID;
        const identityPassApiKey = process.env.IDENTITY_PASS_PREMBLY_API_TEST_KEY;

        const response = (await axios.post(
            `${premblyIdentityEndpoint}/identitypass/verification/bvn_validation`, 
            {number: bvn},
            {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-api-key': identityPassApiKey, // Your Secret Key
                    'app-id': identityPassAppId, // Your App ID
                }
            }
        )).data;

        // console.log(response);

        if (response.status && response.response_code == "00" ) {
            // update the user db record.

            const bvnDetails = {
                ...response.data,
                number: bvn,
                isBvnPhoneVerified: false
            };

            const uzer = await userModel.findOneAndUpdate(
                { email }, // Query to find the user
                { $set: { BVN: bvnDetails } }, // Update the field
            );
            
            if (!uzer) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'server error, db error',
                });
            }

            // send confirmation code to the phone number.
            const phoneResult = await sendPhoneVerificationCode(`234${Number(bvnDetails.phoneNumber)}`);
            
            if (!phoneResult.status || !phoneResult.response.message_id) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    error: phoneResult.response,
                    message: "unabl to send otp code"
                });
            }
    

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                verificationToken: phoneResult.token,
                messageId: response.message_id,
                // message: 'Verification Successfull'
                message: `Verification code sent to ${maskPhoneNumber(bvnDetails.phoneNumber)}. Enter the code to verify.`,
            });
        }


        return res.status(500).json({
            status: false,
            statusCode: 500,
            result: response,
            message: 'bvn validation failed.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

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
            verificationToken: mailRes.token,
            message: 'User registered successfully!'
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const sendPhoneVerificationTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phoneNumber = req.body.phoneNumber;

        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
        const jwt_token = Jwt.sign(
            { code, phoneNumber },
            `${code}`,
            { expiresIn: '30m' }
        );

        // Remove any non-digit characters from the input
        const cleanedNumber = phoneNumber.replace(/\D/g, '');

        const msg = `Your TesaPay verification code is: ${code}. \nPlease do not this code with anyone, no staff of TesaPay will ask for this code. `;
        
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
                message: "unabl to send otp code"
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            messageId: response.message_id,
            verificationToken: jwt_token,
            message: `Verification code sent to ${maskPhoneNumber(phoneNumber)}. Enter the code to verify.`,
        });
    } catch (err: any) {
        const error = err.response.data ?? err;

        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const verifyPhoneTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        const verifyRes =  verifyEmailToken(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong Verification Code!',
            });
        }

        const uzer = await userModel.findOneAndUpdate(
            { phoneNumber: verifyRes.decodedToken.phoneNumber }, // Query to find the user
            { $set: { isPhoneNumberVerified: true } }, // Update the field
            // { new: true, upsert: true } // Options: return the updated doc and create if not found
        );
        
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error. unable to update verification status.',
            });
        }

        return res.status(201).json({
            statusCode: 201,
            status: true,
            decodedToken: verifyRes.decodedToken,
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

        const verifyRes =  verifyEmailToken(code, token);
        
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




export const sendPhoneVerificationCode = async (phoneNumber: string) => {
    try {
        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');

        const jwt_token = Jwt.sign(
            { code, phoneNumber },
            `${code}`,
            { expiresIn: '30m' }
        );

        // Remove any non-digit characters from the input
        const cleanedNumber = phoneNumber.replace(/\D/g, '');

        const msg = `Your TesaPay verification code is: ${code}. \nPlease do not this code with anyone, no staff of TesaPay will ask for this code. `;
        
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
        
        return {
            status: true,
            token: jwt_token,
            response,
            message: 'Message sent successfully.',
        }
    } catch (error: any) {
        const err = error.response.data;

        return {
            status: false,
            response: err || error,
            message: 'an error occured while sending verification message.',
        }
    }
}


export const sendEmailVerificationCode = (email: string, name = "", subject = "Email Verification Code") => {
    try {
        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
        const jwt_token = Jwt.sign(
            { code, email },
            `${code}`,
            { expiresIn: '30m' }
        );
        
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host:  process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/emailVerification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name).replace(/{{code}}/g, code);
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Email Verification


            Hi ${name},
            Please use this code below to verify your email address.
            
            ${code}
            
            
            Thanks for choosing TesaPay.
            
            Best wishes,
            TesaPay
        `;

        const details = {
            from: `TesaPay <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject,
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    err,
                    message: 'an error occured while sending verification mail.',
                }
            }
        });
        
        return {
            status: true,
            token: jwt_token,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        }
    }
}


export const verifyEmailToken = (code: string, token: string) => {
    try {
        let decodedToken: any = Jwt.verify(token, `${code}`);
        // console.log(decodedToken);
        
        if (!decodedToken || decodedToken.code != code) {
            return {
                status: false,
                // decodedToken,
                message: 'wrong Verification Code!',
            }
        } 

        return {
            status: true,
            decodedToken,
            message: 'Email verified!',
        }
    } catch (error) {
        return {
            status: false,
            message: 'unable to verify Verification Code!',
        }
    }
}