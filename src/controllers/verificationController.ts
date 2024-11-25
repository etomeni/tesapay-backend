import { Request, Response, NextFunction } from "express-serve-static-core";
// import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import Jwt from "jsonwebtoken";
// import axios from "axios";

// models
import { userModel } from '../models/users.model.js';
// import { userAccount, userInterface } from "../models/types.js";
import { maskPhoneNumber, premblyIdentityEndpoint, termiSendSmsEndpoint } from "@/util/resources.js";
import axios from "axios";
import { verificationModel } from "@/models/verification.model.js";
import { bvnInterface, verificationInterface } from "@/typeInterfaces/verificationInterface.js";
import { sendEmailVerificationCode } from "@/util/mailFunctions/authMails.js";


const secretForToken = process.env.JWT_SECRET;


export const verifyBvnNumberUsingBlusaltCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bvn = req.body.bvn;
        const email = req.body.email;
        const phoneNumber = req.body.phoneNumber;
        const gender = req.body.gender;
        const dob = req.body.dob;
        const country = req.body.country;


        // Query to find if bvn record exist in the database
        const verificationRecord = await verificationModel.findOne({ bvn_number: bvn });
        if (verificationRecord && verificationRecord._id) {
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

        function failedBvnValidation(status_code: number) {
            if (status_code == 404) {
                return res.status(404).json({
                    status: false,
                    statusCode: 404,
                    result: req.body,
                    message: 'No result Found For this BVN',
                });
            } else {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    result: req.body,
                    message: 'bvn validation failed.',
                });
            }
        }
        try {
            const response = (await axios.post(
                `https://api.blusalt.net/v2/IdentityVerification/BVN`, 
                { bvn_number: bvn, phone_number: phoneNumber },
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
            // console.log(response);
    
            if (response.status_code == 200) {
                // update the user db record.

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
                        message: 'unable to update the transactions record.',
                    });
                }

                return res.status(201).json({
                    status: true,
                    statusCode: 201,
                    result: result,
                    message: 'Successful',
                });
            } else {
                failedBvnValidation(response.status_code)
            }
            
        } catch (error: any) {
            console.log(error);
            failedBvnValidation(error.response.data.status_code || 500)
        }

        return res.status(500).json({
            status: false,
            statusCode: 500,
            result: req.body,
            message: 'bvn validation failed.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const sendEmailVerificationMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Email validation error.', 
                errors
            });
        };

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

        const verifyRes =  verifyEmailToken(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong Verification Code!',
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Email validation error.', 
                errors
            });
        };

        const email = req.query.email;
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

        const mailRes = sendEmailVerificationCode(email)
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
            message: 'unable to verify code!',
        }
    }
}
