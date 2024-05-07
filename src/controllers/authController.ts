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
import { userAccount, userInterface } from "../models/types.js";


const secretForToken = process.env.JWT_SECRET;

export const signupController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(209).json({
                status: 209,
                message: 'Form Validation Error!', 
                ...errors
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
        if (req.body.tnc != true) {
            return res.status(401).json({
                status: false,
                statusCode: 401, 
                message: 'Must accept terms and conditions before proceeding.'
            });
        }
        
        const hashedPassword = await bcryptjs.hash(req.body.password, 12);

        const getAccountDetails: userAccount = {
            currency: "NGN",
            balance: 0,
            accountNumber: 8108786933,
            accountName: "Sunday Etom Eni",
            bank: "TesaPay",
            default: true
        };

        const userDetails: userInterface = {
            userId: await uuidv4(),
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            dob: req.body.dob,
            // pin: req.body.pin,

            username: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            country: req.body.country,
            password: hashedPassword,
            account: [getAccountDetails],
            status: true,
            location: req.body.location,
            referredBy: req.body.referredBy,

            pin: 0,
            NIN: 0,
            BVN: 0,
            idImage: '',
            isAddressVerified: false,
            isBVNverified: false,
            isEmailVerified: false,
            isNINverified: false,
            isPhoneNumberVerified: false,
            address: {
                ip: '',
                street: '',
                city: '',
                region: '',
                country: '',
            }

        };
        const newUser = new userModel(userDetails);
        const result = await newUser.save();

        if (result._id) {
            // Send a mail verification code.
            const mailRes = sendEmailVerificationCode(userDetails.email, `${userDetails.firstName} ${userDetails.middleName || ''} ${userDetails.lastName}`)
            if (!mailRes.status) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: mailRes.message,
                    error: mailRes.error
                });
            }
            

            // 

            const token = Jwt.sign(
                {
                    username: userDetails.username,
                    email: userDetails.email,
                    userId: userDetails.userId
                },
                `${secretForToken}`,
                { expiresIn: '7d' }
            );
    
            return res.status(201).json({
                status: true,
                statusCode: 201,
                token,
                verificationToken: mailRes.token,
                userId: userDetails.userId,
                resultData: result, 
                message: 'User registered successfully!'
            });
        }
        
        return res.status(500).json({
            status: 500,
            message: 'unable to register new user.'
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
        const username = req.body.username;
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
        const email = req.body.email;
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
        const phoneNumber = req.body.phoneNumber;
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
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Incorrect email or password!', 
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
        const sentPassword = req.body.password;

        const user = await userModel.findOne({email});

        if (!user?._id) {
            const error = new Error('A user with this username or email could not be found!');

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
        
        if (user?.status == false) {
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
                userId: user.userId
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
        if (!error.statusCode) {
            error.statusCode = 500;
        }
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

// export const changePasswordCtr = async (req, res, next) => {
//     try {
//         const userId = req.body.userId;
//         const password = req.body.currentPassword;
//         const newPassword = req.body.newPassword;

//         const user = await auth.findByID(userId);
//         if (user && user.status == false) {
//             const error = new Error('A user with this ID could not be found!');
//             error.statusCode = 401;
//             error.message = "Incorrect user's ID";

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
//         }

//         const hashedPassword = await bcryptjs.hash(newPassword, 12);

//         const updatedUser = await userModel.findOneAndUpdate(
//             { userId: user.userId }, 
//             { password: hashedPassword },
//             {
//                 runValidators: true,
//                 returnOriginal: false,
//             }
//         );
        
//         if (updatedUser && updatedUser.status) {
//             return res.status(500).json({
//                 status: 500,
//                 message: 'Ooopps unable to update password.',
//             });
//         }

//         return res.status(201).json({
//             status: 201,
//             message: 'Password Changed successfully!',
//         });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

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

        if (!uzer?.email) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'User with this Email Address does not exist!',
            });
        }

        const mailResponse = sendEmailVerificationCode(
            email,
            `${uzer.firstName} ${uzer.middleName || ''} ${uzer.lastName}`,
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
            token: mailResponse.token,
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

export const setPinCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pin = req.body.pin;
        const email = req.body.email;
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

        // console.log(verifyRes);

        const uzer = await userModel.findOneAndUpdate(
            { email }, // Query to find the user
            { $set: { pin: pin } }, // Update the field
        );
        
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error. unable to set pin.',
            });
        }

        // TODO:: send an email to the user notifying them that the their transactional pin has been set
        
        return res.status(201).json({
            statusCode: 201,
            status: true,
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
                status: 400,
                message: 'password Error!',
                error
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